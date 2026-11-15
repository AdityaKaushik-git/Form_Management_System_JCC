import crypto from 'node:crypto';
import dayjs from 'dayjs';
import PDFDocument from 'pdfkit';
import {
  Application,
  ApplicationFieldValue,
  ApplicationSubject,
  ApplicationStatusHistory,
  ExaminationForm,
  ExaminationFormField,
  ExaminationFormSubject,
  Subject,
  User,
  StudentProfile,
  Course,
  Batch,
  Semester,
  SheetConfiguration,
  sequelize,
} from '../models/index.js';
import { computeFormStatus } from './form.service.js';
import { syncApplicationToSheet } from './sheets.service.js';
import { sheetsQueue } from '../jobs/queues.js';
import { ApiError } from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import { emitToAdmin, emitToStudent } from '../sockets/index.js';

/**
 * Generates unique reference number format: JCC-RE-YYYYMMDD-XXXXX
 */
export const generateReferenceNumber = () => {
  const dateStr = dayjs().format('YYYYMMDD');
  const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 5);
  return `JCC-RE-${dateStr}-${randomStr}`;
};

/**
 * Submits an examination application with comprehensive validations.
 */
export const submitApplication = async (studentUserId, { formId, fieldValues = {}, subjectIds = [] }) => {
  // 1. Fetch form with dynamic fields and subjects
  const form = await ExaminationForm.findByPk(formId, {
    include: [
      { model: ExaminationFormField, as: 'fields' },
      { model: Course, as: 'course' },
    ],
  });

  if (!form) {
    throw new ApiError(404, 'Examination form not found');
  }

  // 2. Validate availability using the centralized scheduling rules
  const effectiveStatus = computeFormStatus(form);
  if (effectiveStatus !== 'active') {
    throw new ApiError(400, `This examination form is currently ${effectiveStatus} and not accepting submissions`);
  }

  // 3. Prevent duplicate submission by the same student for this form
  const existingApp = await Application.findOne({
    where: { formId, studentId: studentUserId },
  });
  if (existingApp) {
    throw new ApiError(409, `You have already submitted an application for this examination (Ref: ${existingApp.referenceNumber})`);
  }

  // 4. Validate subjects selection
  if (!subjectIds || subjectIds.length === 0) {
    throw new ApiError(400, 'Please select at least one reappear subject');
  }

  // Verify subjects exist and are eligible for this specific examination form
  const validFormSubjects = await ExaminationFormSubject.findAll({
    where: { formId, subjectId: subjectIds },
  });
  if (validFormSubjects.length !== subjectIds.length) {
    throw new ApiError(
      400,
      'One or more selected subjects are not eligible for this examination cycle'
    );
  }

  // 5. Validate dynamic fields against form definition
  const formFields = form.fields || [];
  for (const field of formFields) {
    const val = fieldValues[field.fieldKey];

    // Check required
    if (field.isRequired && (val === undefined || val === null || val === '')) {
      throw new ApiError(400, `Field "${field.fieldLabel}" is required`);
    }

    if (val !== undefined && val !== null && val !== '') {
      // String length check
      if (typeof val === 'string') {
        if (field.minLength && val.length < field.minLength) {
          throw new ApiError(400, `"${field.fieldLabel}" must be at least ${field.minLength} characters`);
        }
        if (field.maxLength && val.length > field.maxLength) {
          throw new ApiError(400, `"${field.fieldLabel}" cannot exceed ${field.maxLength} characters`);
        }
      }

      // Numeric range check
      if (field.fieldType === 'number') {
        const num = Number(val);
        if (isNaN(num)) {
          throw new ApiError(400, `"${field.fieldLabel}" must be a valid number`);
        }
        if (field.minValue !== null && field.minValue !== undefined && num < field.minValue) {
          throw new ApiError(400, `"${field.fieldLabel}" must be at least ${field.minValue}`);
        }
        if (field.maxValue !== null && field.maxValue !== undefined && num > field.maxValue) {
          throw new ApiError(400, `"${field.fieldLabel}" cannot exceed ${field.maxValue}`);
        }
      }
    }
  }

  // 6. Generate unique reference number
  let referenceNumber = generateReferenceNumber();
  let duplicateRef = await Application.findOne({ where: { referenceNumber } });
  while (duplicateRef) {
    referenceNumber = generateReferenceNumber();
    duplicateRef = await Application.findOne({ where: { referenceNumber } });
  }

  // 7. Save application in MariaDB transaction
  const application = await sequelize.transaction(async (t) => {
    const app = await Application.create(
      {
        referenceNumber,
        formId,
        studentId: studentUserId,
        status: 'submitted',
        submittedAt: new Date(),
      },
      { transaction: t }
    );

    // Save dynamic field values
    const fieldRecords = [];
    for (const [key, value] of Object.entries(fieldValues)) {
      const fieldDef = formFields.find((f) => f.fieldKey === key);
      fieldRecords.push({
        applicationId: app.id,
        fieldId: fieldDef ? fieldDef.id : null,
        fieldKey: key,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value ?? ''),
      });
    }

    if (fieldRecords.length > 0) {
      await ApplicationFieldValue.bulkCreate(fieldRecords, { transaction: t });
    }

    // Save selected subjects
    const subjectRecords = subjectIds.map((subjectId) => ({
      applicationId: app.id,
      subjectId,
    }));
    await ApplicationSubject.bulkCreate(subjectRecords, { transaction: t });

    // Initial status history
    await ApplicationStatusHistory.create(
      {
        applicationId: app.id,
        previousStatus: null,
        newStatus: 'submitted',
        changedBy: studentUserId,
        remarks: 'Application submitted by student',
      },
      { transaction: t }
    );

    // Increment form submission count
    await form.increment('totalSubmissions', { transaction: t });

    return app;
  });

  // 8. Queue Google Sheets synchronization jobs for all attached sheets
  try {
    const configuredSheets = await SheetConfiguration.findAll({
      where: { formId, isActive: true },
    });

    for (const sheet of configuredSheets) {
      if (sheetsQueue) {
        await sheetsQueue.add('sync-application', {
          applicationId: application.id,
          sheetConfigId: sheet.id,
        });
      } else {
        // Fallback: synchronous/in-process background execution if Redis is not connected
        setImmediate(() => {
          syncApplicationToSheet(application.id, sheet.id).catch((err) =>
            logger.error({ err }, 'Background sheet sync failed')
          );
        });
      }
    }
  } catch (err) {
    logger.warn({ err }, 'Failed to queue sheet sync jobs, application is saved');
  }

  // 9. Emit real-time updates
  emitToAdmin('submission:new', {
    applicationId: application.id,
    referenceNumber: application.referenceNumber,
    formTitle: form.title,
  });

  return await getApplicationById(application.id);
};

export const getApplicationById = async (id) => {
  const application = await Application.findByPk(id, {
    include: [
      {
        model: User,
        as: 'student',
        attributes: ['id', 'fullName', 'email'],
        include: [
          {
            model: StudentProfile,
            as: 'studentProfile',
            include: ['course', 'batch'],
          },
        ],
      },
      {
        model: ExaminationForm,
        as: 'form',
        include: ['course', 'semester', 'fields'],
      },
      {
        model: ApplicationFieldValue,
        as: 'fieldValues',
      },
      {
        model: ApplicationSubject,
        as: 'applicationSubjects',
        include: [{ model: Subject, as: 'subject' }],
      },
      {
        model: ApplicationStatusHistory,
        as: 'statusHistory',
        include: [{ model: User, as: 'changer', attributes: ['id', 'fullName', 'role'] }],
        order: [['createdAt', 'ASC']],
      },
    ],
  });

  if (!application) throw new ApiError(404, 'Application not found');
  return application;
};

export const getStudentApplications = async (studentUserId) => {
  return await Application.findAll({
    where: { studentId: studentUserId },
    include: [
      {
        model: ExaminationForm,
        as: 'form',
        attributes: ['id', 'title', 'examName', 'examSession'],
        include: ['course', 'semester'],
      },
      {
        model: ApplicationSubject,
        as: 'applicationSubjects',
        include: [{ model: Subject, as: 'subject' }],
      },
    ],
    order: [['submittedAt', 'DESC']],
  });
};

export const getAllApplications = async ({ formId, status, courseId, search, page = 1, limit = 20 }) => {
  const where = {};
  if (formId) where.formId = formId;
  if (status) where.status = status;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 20);
  const offset = (pageNum - 1) * limitNum;

  const { count, rows } = await Application.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'student',
        attributes: ['id', 'fullName', 'email'],
        include: [
          {
            model: StudentProfile,
            as: 'studentProfile',
            include: ['course', 'batch'],
          },
        ],
      },
      {
        model: ExaminationForm,
        as: 'form',
        attributes: ['id', 'title', 'examName', 'examSession'],
        include: ['course', 'semester'],
      },
      {
        model: ApplicationSubject,
        as: 'applicationSubjects',
        include: [{ model: Subject, as: 'subject' }],
      },
    ],
    order: [['submittedAt', 'DESC']],
    limit: limitNum,
    offset,
  });

  // Client-side filtering for search query (name/enrollment) if specified
  let results = rows;
  if (search) {
    const q = search.toLowerCase();
    results = rows.filter((app) => {
      const name = app.student?.fullName?.toLowerCase() || '';
      const enr = app.student?.studentProfile?.enrollmentNumber?.toLowerCase() || '';
      const ref = app.referenceNumber?.toLowerCase() || '';
      return name.includes(q) || enr.includes(q) || ref.includes(q);
    });
  }

  return {
    total: count,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(count / limitNum),
    applications: results,
  };
};

export const updateApplicationStatus = async (id, newStatus, remarks, adminUserId) => {
  const application = await Application.findByPk(id, {
    include: [
      { model: User, as: 'student' },
      { model: ExaminationForm, as: 'form' },
    ],
  });

  if (!application) throw new ApiError(404, 'Application not found');

  const previousStatus = application.status;

  await sequelize.transaction(async (t) => {
    await application.update(
      {
        status: newStatus,
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
        remarks: remarks || application.remarks,
      },
      { transaction: t }
    );

    await ApplicationStatusHistory.create(
      {
        applicationId: application.id,
        previousStatus,
        newStatus,
        changedBy: adminUserId,
        remarks,
      },
      { transaction: t }
    );
  });

  // Emit event to student
  emitToStudent(application.studentId, 'application:status_updated', {
    applicationId: application.id,
    newStatus,
    referenceNumber: application.referenceNumber,
    remarks,
  });

  return await getApplicationById(id);
};

/**
 * Generates official JCC PDF examination application receipt.
 */
export const generateReceiptPdf = async (applicationId, res) => {
  const app = await getApplicationById(applicationId);

  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  // Stream directly to response
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="JCC-Receipt-${app.referenceNumber}.pdf"`
  );

  doc.pipe(res);

  // Institution Header
  doc
    .fillColor('#F47B20')
    .fontSize(18)
    .font('Helvetica-Bold')
    .text('JCC, ROHINI SECTOR 3, DELHI', { align: 'center' });

  doc
    .fillColor('#555555')
    .fontSize(11)
    .font('Helvetica')
    .text('Reappear Examination Form Management System', { align: 'center' })
    .moveDown(0.5);

  doc
    .strokeColor('#EEEEEE')
    .lineWidth(1)
    .moveTo(40, doc.y)
    .lineTo(555, doc.y)
    .stroke()
    .moveDown(1);

  // Title Box
  doc
    .fillColor('#252525')
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('APPLICATION RECEIPT / ACKNOWLEDGEMENT', { align: 'center' })
    .moveDown(0.8);

  // Application Meta
  const profile = app.student?.studentProfile;
  const course = app.form?.course || profile?.course;
  const semester = app.form?.semester;

  const startY = doc.y;

  // Box border
  doc.rect(40, startY, 515, 230).strokeColor('#E0E0E0').stroke();

  doc.fontSize(10).font('Helvetica-Bold').fillColor('#F47B20');
  doc.text('Application Reference Number:', 55, startY + 15);
  doc.font('Helvetica').fillColor('#252525').text(app.referenceNumber, 230, startY + 15);

  doc.font('Helvetica-Bold').fillColor('#555555').text('Examination Title:', 55, startY + 35);
  doc.font('Helvetica').fillColor('#252525').text(app.form?.title || 'N/A', 230, startY + 35);

  doc.font('Helvetica-Bold').fillColor('#555555').text('Student Full Name:', 55, startY + 55);
  doc.font('Helvetica').fillColor('#252525').text(app.student?.fullName || 'N/A', 230, startY + 55);

  doc.font('Helvetica-Bold').fillColor('#555555').text('Enrollment Number:', 55, startY + 75);
  doc.font('Helvetica').fillColor('#252525').text(profile?.enrollmentNumber || 'N/A', 230, startY + 75);

  doc.font('Helvetica-Bold').fillColor('#555555').text('Course & Batch:', 55, startY + 95);
  doc.font('Helvetica').fillColor('#252525').text(`${course?.name || ''} ${profile?.batch?.name ? `(${profile.batch.name})` : ''}`, 230, startY + 95);

  doc.font('Helvetica-Bold').fillColor('#555555').text('Semester:', 55, startY + 115);
  doc.font('Helvetica').fillColor('#252525').text(semester?.name || `Semester ${profile?.currentSemester || 'N/A'}`, 230, startY + 115);

  doc.font('Helvetica-Bold').fillColor('#555555').text('Submission Date & Time:', 55, startY + 135);
  doc.font('Helvetica').fillColor('#252525').text(dayjs(app.submittedAt).format('DD MMMM YYYY, hh:mm A'), 230, startY + 135);

  doc.font('Helvetica-Bold').fillColor('#555555').text('Application Status:', 55, startY + 155);
  doc.font('Helvetica-Bold').fillColor('#F47B20').text((app.status || 'SUBMITTED').toUpperCase(), 230, startY + 155);

  doc.font('Helvetica-Bold').fillColor('#555555').text('Contact Mobile & Email:', 55, startY + 175);
  doc.font('Helvetica').fillColor('#252525').text(`${profile?.mobile || 'N/A'} | ${app.student?.email || 'N/A'}`, 230, startY + 175);

  doc.moveDown(13);

  // Selected Reappear Subjects Table
  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .fillColor('#252525')
    .text('Selected Reappear Subjects')
    .moveDown(0.5);

  const tableTop = doc.y;
  doc.rect(40, tableTop, 515, 20).fillColor('#F8F9FA').fill();
  doc.strokeColor('#EEEEEE').stroke();

  doc.fontSize(9).font('Helvetica-Bold').fillColor('#555555');
  doc.text('S.No', 50, tableTop + 5);
  doc.text('Subject Code', 90, tableTop + 5);
  doc.text('Subject Name', 200, tableTop + 5);
  doc.text('Credits', 480, tableTop + 5);

  let currentY = tableTop + 25;
  const subjects = app.applicationSubjects || [];

  subjects.forEach((item, index) => {
    doc.rect(40, currentY - 5, 515, 20).strokeColor('#F0F0F0').stroke();
    doc.fontSize(9).font('Helvetica').fillColor('#252525');
    doc.text(String(index + 1), 50, currentY);
    doc.text(item.subject?.code || 'N/A', 90, currentY);
    doc.text(item.subject?.name || 'N/A', 200, currentY, { width: 260 });
    doc.text(String(item.subject?.credits || '-'), 480, currentY);
    currentY += 20;
  });

  // Footer Note
  doc
    .moveDown(2)
    .fontSize(8)
    .font('Helvetica')
    .fillColor('#777777')
    .text(
      'Note: This is a computer-generated receipt for JCC Reappear Examination. Retain this acknowledgement for all future correspondence.',
      { align: 'center' }
    )
    .moveDown(0.5)
    .text(
      `© ${dayjs().year()} JCC Rohini, Sector 3. All Rights Reserved. Designed by Aditya Kaushik`,
      { align: 'center' }
    );

  doc.end();
};
