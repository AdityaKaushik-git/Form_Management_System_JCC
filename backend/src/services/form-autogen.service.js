import dayjs from 'dayjs';
import { Op } from 'sequelize';
import {
  Course,
  Batch,
  Semester,
  Subject,
  ExaminationForm,
  ExaminationFormField,
  ExaminationFormSubject,
  sequelize,
} from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import { emitToAll } from '../sockets/index.js';
import { addSheetConfig } from './sheets.service.js';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Auto-Generate Reappear Examination Forms
 * ─────────────────────────────────────────────────────────────────────────────
 * College Academic Rule:
 * - Odd Semester Sessions (Nov-Dec): Students can ONLY apply for Odd Semesters (Sem 1, 3, 5, 7).
 * - Even Semester Sessions (May-June): Students can ONLY apply for Even Semesters (Sem 2, 4, 6, 8).
 *
 * This service automatically iterates through eligible batches, determines their
 * valid semester progression, filters eligible subjects strictly according to the
 * session type (odd vs even), creates the examination forms with subjects and fields,
 * and publishes them.
 */
export const autoGenerateExaminationForms = async ({
  sessionType = 'odd', // 'odd' | 'even'
  academicYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
  examSession,
  courseId,
  batchId,
  adminId,
  isPermanentActive = true,
  startDate = new Date(),
  endDate,
  googleSpreadsheetUrl,
}) => {
  if (!['odd', 'even'].includes(sessionType.toLowerCase())) {
    throw new ApiError(400, 'sessionType must be either "odd" or "even"');
  }

  const isOdd = sessionType.toLowerCase() === 'odd';
  const sessionLabel = isOdd ? 'Odd Semesters (1st, 3rd, 5th)' : 'Even Semesters (2nd, 4th, 6th)';
  const computedExamSession =
    examSession || `${isOdd ? 'Odd' : 'Even'} Semester Reappear Session ${academicYear}`;

  // 1. Fetch target batches
  const batchWhere = { isActive: true };
  if (batchId) batchWhere.id = batchId;
  if (courseId) batchWhere.courseId = courseId;

  const targetBatches = await Batch.findAll({
    where: batchWhere,
    include: [{ model: Course, as: 'course', where: { isActive: true } }],
    order: [['startYear', 'DESC']],
  });

  if (targetBatches.length === 0) {
    throw new ApiError(
      404,
      'No active batches found matching the selection. Please ensure courses and batches are created first.'
    );
  }

  const generatedForms = [];

  for (const batch of targetBatches) {
    const course = batch.course;
    if (!course) continue;

    // 2. Fetch all semesters for this batch & course
    const semesters = await Semester.findAll({
      where: {
        courseId: course.id,
        [Op.or]: [{ batchId: batch.id }, { batchId: null }],
        isActive: true,
      },
      order: [['number', 'ASC']],
    });

    // 3. Filter semesters strictly by session type:
    // Odd: 1, 3, 5, 7 | Even: 2, 4, 6, 8
    const eligibleSemesters = semesters.filter((sem) => {
      const num = parseInt(sem.number, 10);
      return isOdd ? num % 2 !== 0 : num % 2 === 0;
    });

    if (eligibleSemesters.length === 0) {
      logger.info({ batch: batch.name, course: course.code }, 'No matching semesters for session type, skipping');
      continue;
    }

    const eligibleSemIds = eligibleSemesters.map((s) => s.id);
    const eligibleSemNumbers = eligibleSemesters.map((s) => s.number).sort((a, b) => a - b);

    // 4. Fetch all subjects belonging strictly to the eligible semesters
    const subjects = await Subject.findAll({
      where: {
        courseId: course.id,
        semesterId: { [Op.in]: eligibleSemIds },
        [Op.or]: [{ batchId: batch.id }, { batchId: null }],
        isActive: true,
      },
      order: [['code', 'ASC']],
    });

    if (subjects.length === 0) {
      logger.info(
        { batch: batch.name, eligibleSemesters: eligibleSemNumbers },
        'No subjects found for eligible semesters, skipping form creation'
      );
      continue;
    }

    // 5. Build form title & descriptive text
    const formTitle = `${course.shortName} (${batch.name}) - ${isOdd ? 'Odd' : 'Even'} Sem Reappear Exam (${academicYear})`;
    const semListStr = eligibleSemNumbers.join(', ');

    await sequelize.transaction(async (t) => {
      // Create examination form
      const form = await ExaminationForm.create(
        {
          title: formTitle,
          examName: `${course.shortName} Reappear Examination (${isOdd ? 'Odd' : 'Even'} Semesters: ${semListStr})`,
          examSession: computedExamSession,
          description: `Automated Reappear Examination Application Form for ${course.name} (${batch.name}). Strictly eligible for ${isOdd ? 'Odd' : 'Even'} Semesters (${semListStr}).`,
          instructions:
            `1. You are eligible to apply for backlogs/reappears in ${isOdd ? 'ODD' : 'EVEN'} Semesters (${semListStr}) only.\n` +
            `2. Select the specific subjects you need to reappear for.\n` +
            `3. Verify your personal and academic details before final submission.\n` +
            `4. Save and download your official examination receipt upon submission.`,
          courseId: course.id,
          batchId: batch.id,
          startDate: startDate || new Date(),
          endDate: endDate || null,
          isPermanentActive: isPermanentActive !== false,
          isPublished: true,
          status: 'active',
          version: 1,
          createdBy: adminId,
        },
        { transaction: t }
      );

      // Link eligible subjects to the form
      const formSubjectRecords = subjects.map((subj) => ({
        formId: form.id,
        subjectId: subj.id,
      }));
      await ExaminationFormSubject.bulkCreate(formSubjectRecords, { transaction: t });

      // Add default dynamic fields
      const defaultFields = [
        {
          formId: form.id,
          fieldKey: 'fullName',
          fieldLabel: 'Student Full Name',
          fieldType: 'text',
          isRequired: true,
          displayOrder: 0,
        },
        {
          formId: form.id,
          fieldKey: 'enrollmentNumber',
          fieldLabel: 'Enrollment Number',
          fieldType: 'text',
          isRequired: true,
          displayOrder: 1,
        },
        {
          formId: form.id,
          fieldKey: 'mobile',
          fieldLabel: 'Registered Mobile Number',
          fieldType: 'mobile',
          isRequired: true,
          displayOrder: 2,
        },
        {
          formId: form.id,
          fieldKey: 'email',
          fieldLabel: 'Email Address',
          fieldType: 'email',
          isRequired: true,
          displayOrder: 3,
        },
        {
          formId: form.id,
          fieldKey: 'remarks',
          fieldLabel: 'Reason for Reappear / Remarks',
          fieldType: 'textarea',
          isRequired: false,
          placeholder: 'Mention any previous internal/external examination details or remarks (optional)',
          displayOrder: 4,
        },
        {
          formId: form.id,
          fieldKey: 'declaration',
          fieldLabel:
            'I hereby declare that all particulars given in this application are correct, and I am eligible to appear in the selected subjects under JCC examination rules.',
          fieldType: 'checkbox',
          isRequired: true,
          displayOrder: 5,
        },
      ];
      await ExaminationFormField.bulkCreate(defaultFields, { transaction: t });

      generatedForms.push({
        id: form.id,
        title: form.title,
        courseCode: course.code,
        batchName: batch.name,
        semesters: eligibleSemNumbers,
        subjectCount: subjects.length,
      });

      emitToAll('form:published', { formId: form.id, title: form.title });
    });

    if (googleSpreadsheetUrl && googleSpreadsheetUrl.trim()) {
      try {
        await addSheetConfig(form.id, {
          displayName: `${batch.name} Reappear Sheet`,
          spreadsheetUrl: googleSpreadsheetUrl.trim(),
          worksheetName: 'Sheet1',
        });
      } catch (sheetErr) {
        logger.warn({ err: sheetErr.message, formId: form.id }, 'Could not automatically link Google Sheet during auto-gen');
      }
    }
  }

  logger.info(
    { totalGenerated: generatedForms.length, sessionType, academicYear },
    'Auto-generation of examination forms complete'
  );

  return {
    sessionType,
    sessionLabel,
    academicYear,
    totalFormsGenerated: generatedForms.length,
    forms: generatedForms,
  };
};
