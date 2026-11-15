import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import { Op } from 'sequelize';
import {
  ExaminationForm,
  ExaminationFormField,
  ExaminationFormSubject,
  Subject,
  Course,
  Batch,
  Semester,
  SheetConfiguration,
  StudentProfile,
  Application,
  sequelize,
} from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { emitToAll, emitToAdmin } from '../sockets/index.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = 'Asia/Kolkata';

/**
 * Computes the effective dynamic status of an examination form.
 *
 * Rules:
 * 1. Unpublished forms -> 'draft'
 * 2. Manually closed forms -> 'closed' (Manual closure overrides everything)
 * 3. Before start date -> 'upcoming'
 * 4. After start date and Permanent Active -> 'active'
 * 5. Between start date and end date -> 'active'
 * 6. Past end date (without Permanent Active) -> 'closed'
 */
export const computeFormStatus = (form) => {
  if (!form.isPublished) {
    return 'draft';
  }

  if (form.isManuallyClosed) {
    return 'closed';
  }

  const now = dayjs().tz(TIMEZONE);
  const start = dayjs(form.startDate).tz(TIMEZONE);

  if (now.isBefore(start)) {
    return 'upcoming';
  }

  if (form.isPermanentActive) {
    return 'active';
  }

  if (form.endDate) {
    const end = dayjs(form.endDate).tz(TIMEZONE);
    if (now.isAfter(end)) {
      return 'closed';
    }
    return 'active';
  }

  return 'active';
};

export const createForm = async (formData, adminId) => {
  const { fields = [], subjectIds = [], ...rest } = formData;

  const result = await sequelize.transaction(async (t) => {
    const form = await ExaminationForm.create(
      {
        ...rest,
        createdBy: adminId,
        status: rest.isPublished ? 'upcoming' : 'draft',
      },
      { transaction: t }
    );

    // Create dynamic fields
    if (fields.length > 0) {
      const fieldRecords = fields.map((field, idx) => ({
        ...field,
        formId: form.id,
        displayOrder: field.displayOrder ?? idx,
      }));
      await ExaminationFormField.bulkCreate(fieldRecords, { transaction: t });
    }

    // Attach applicable subjects
    if (subjectIds.length > 0) {
      const subjectRecords = subjectIds.map((subjectId) => ({
        formId: form.id,
        subjectId,
      }));
      await ExaminationFormSubject.bulkCreate(subjectRecords, { transaction: t });
    }

    return form;
  });

  const fullForm = await getFormById(result.id);
  emitToAdmin('form:created', { formId: fullForm.id, title: fullForm.title });
  return fullForm;
};

export const updateForm = async (id, formData) => {
  const form = await ExaminationForm.findByPk(id);
  if (!form) throw new ApiError(404, 'Examination form not found');

  const { fields, subjectIds, ...rest } = formData;

  await sequelize.transaction(async (t) => {
    await form.update(rest, { transaction: t });

    // Update dynamic fields if provided
    if (fields && Array.isArray(fields)) {
      await ExaminationFormField.destroy({ where: { formId: form.id }, transaction: t });
      if (fields.length > 0) {
        const fieldRecords = fields.map((field, idx) => ({
          ...field,
          formId: form.id,
          displayOrder: field.displayOrder ?? idx,
        }));
        await ExaminationFormField.bulkCreate(fieldRecords, { transaction: t });
      }
    }

    // Update subjects if provided
    if (subjectIds && Array.isArray(subjectIds)) {
      await ExaminationFormSubject.destroy({ where: { formId: form.id }, transaction: t });
      if (subjectIds.length > 0) {
        const subjectRecords = subjectIds.map((subjectId) => ({
          formId: form.id,
          subjectId,
        }));
        await ExaminationFormSubject.bulkCreate(subjectRecords, { transaction: t });
      }
    }
  });

  const updated = await getFormById(id);
  emitToAdmin('form:updated', { formId: updated.id, status: updated.status });
  return updated;
};

export const getFormById = async (id) => {
  const form = await ExaminationForm.findByPk(id, {
    include: [
      { model: Course, as: 'course' },
      { model: Batch, as: 'batch' },
      { model: Semester, as: 'semester' },
      {
        model: ExaminationFormField,
        as: 'fields',
        order: [['displayOrder', 'ASC']],
      },
      {
        model: ExaminationFormSubject,
        as: 'formSubjects',
        include: [{ model: Subject, as: 'subject' }],
      },
      {
        model: SheetConfiguration,
        as: 'sheetConfigurations',
      },
    ],
  });

  if (!form) throw new ApiError(404, 'Examination form not found');

  const plain = form.toJSON();
  plain.effectiveStatus = computeFormStatus(form);
  return plain;
};

export const getAllForms = async (filters = {}) => {
  const where = {};
  if (filters.courseId) where.courseId = filters.courseId;
  if (filters.batchId) where.batchId = filters.batchId;
  if (filters.semesterId) where.semesterId = filters.semesterId;
  if (filters.isPublished !== undefined) where.isPublished = filters.isPublished === 'true' || filters.isPublished === true;

  const forms = await ExaminationForm.findAll({
    where,
    include: [
      { model: Course, as: 'course', attributes: ['id', 'name', 'shortName'] },
      { model: Batch, as: 'batch', attributes: ['id', 'name'] },
      { model: Semester, as: 'semester', attributes: ['id', 'number', 'name'] },
    ],
    order: [['createdAt', 'DESC']],
  });

  return forms.map((form) => {
    const plain = form.toJSON();
    plain.effectiveStatus = computeFormStatus(form);
    return plain;
  });
};

export const publishForm = async (id) => {
  const form = await ExaminationForm.findByPk(id);
  if (!form) throw new ApiError(404, 'Form not found');

  await form.update({
    isPublished: true,
    isManuallyClosed: false,
  });

  const updated = await getFormById(id);
  emitToAll('form:published', { formId: updated.id, title: updated.title });
  return updated;
};

export const closeForm = async (id) => {
  const form = await ExaminationForm.findByPk(id);
  if (!form) throw new ApiError(404, 'Form not found');

  await form.update({
    isManuallyClosed: true,
  });

  const updated = await getFormById(id);
  emitToAll('form:closed', { formId: updated.id, title: updated.title });
  return updated;
};

export const reopenForm = async (id) => {
  const form = await ExaminationForm.findByPk(id);
  if (!form) throw new ApiError(404, 'Form not found');

  await form.update({
    isManuallyClosed: false,
    isPublished: true,
  });

  const updated = await getFormById(id);
  emitToAll('form:reopened', { formId: updated.id, title: updated.title });
  return updated;
};

export const deleteForm = async (id) => {
  const form = await ExaminationForm.findByPk(id);
  if (!form) throw new ApiError(404, 'Form not found');

  // Check if applications exist
  const appCount = await Application.count({ where: { formId: id } });
  if (appCount > 0) {
    throw new ApiError(400, 'Cannot delete an examination form that has received student submissions. Close the form instead.');
  }

  await form.destroy();
  return { message: 'Form deleted successfully' };
};

/**
 * Returns active and upcoming forms eligible for a student.
 */
export const getAvailableFormsForStudent = async (studentUserId) => {
  const profile = await StudentProfile.findOne({ where: { userId: studentUserId } });
  if (!profile) throw new ApiError(404, 'Student profile not found');

  // Query published forms
  const forms = await ExaminationForm.findAll({
    where: {
      isPublished: true,
      [Op.or]: [
        { courseId: null },
        { courseId: profile.courseId },
      ],
    },
    include: [
      { model: Course, as: 'course' },
      { model: Batch, as: 'batch' },
      { model: Semester, as: 'semester' },
      {
        model: ExaminationFormField,
        as: 'fields',
        order: [['displayOrder', 'ASC']],
      },
      {
        model: ExaminationFormSubject,
        as: 'formSubjects',
        include: [{ model: Subject, as: 'subject' }],
      },
    ],
    order: [['startDate', 'DESC']],
  });

  // Check submissions already made by this student
  const studentApplications = await Application.findAll({
    where: { studentId: studentUserId },
    attributes: ['formId', 'id', 'status', 'referenceNumber', 'submittedAt'],
  });

  const submissionMap = new Map();
  studentApplications.forEach((app) => {
    submissionMap.set(app.formId, app);
  });

  return forms
    .map((form) => {
      const plain = form.toJSON();
      plain.effectiveStatus = computeFormStatus(form);
      plain.alreadySubmitted = submissionMap.has(form.id);
      plain.submission = submissionMap.get(form.id) || null;
      return plain;
    })
    .filter((f) => f.effectiveStatus === 'active' || f.effectiveStatus === 'upcoming' || f.alreadySubmitted);
};
