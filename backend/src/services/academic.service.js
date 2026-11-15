import { Op } from 'sequelize';
import { Course, Batch, Semester, Subject, sequelize } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';

// ===========================================================================
// Courses
// ===========================================================================

export const getAllCourses = async (includeInactive = false) => {
  const where = includeInactive ? {} : { isActive: true };
  return await Course.findAll({
    where,
    order: [['name', 'ASC']],
  });
};

export const getCourseById = async (id) => {
  const course = await Course.findByPk(id, {
    include: [
      { model: Batch, as: 'batches' },
      { model: Semester, as: 'semesters' },
    ],
  });
  if (!course) throw new ApiError(404, 'Course not found');
  return course;
};

export const createCourse = async (data) => {
  const existing = await Course.findOne({ where: { code: data.code.toUpperCase() } });
  if (existing) throw new ApiError(409, `Course with code ${data.code} already exists`);

  return await Course.create({
    ...data,
    code: data.code.toUpperCase(),
  });
};

export const updateCourse = async (id, data) => {
  const course = await Course.findByPk(id);
  if (!course) throw new ApiError(404, 'Course not found');

  if (data.code && data.code.toUpperCase() !== course.code) {
    const existing = await Course.findOne({ where: { code: data.code.toUpperCase() } });
    if (existing) throw new ApiError(409, `Course with code ${data.code} already exists`);
    data.code = data.code.toUpperCase();
  }

  return await course.update(data);
};

export const deleteCourse = async (id) => {
  const course = await Course.findByPk(id);
  if (!course) throw new ApiError(404, 'Course not found');
  // Soft delete by deactivating
  await course.update({ isActive: false });
  return { message: 'Course deactivated successfully' };
};

// ===========================================================================
// Batches
// ===========================================================================

export const getAllBatches = async (courseId = null, includeInactive = false) => {
  const where = {};
  if (!includeInactive) where.isActive = true;
  if (courseId) where.courseId = courseId;

  return await Batch.findAll({
    where,
    include: [{ model: Course, as: 'course', attributes: ['id', 'name', 'shortName', 'code'] }],
    order: [['startYear', 'DESC']],
  });
};

export const createBatch = async (data) => {
  const course = await Course.findByPk(data.courseId);
  if (!course) throw new ApiError(404, 'Selected course does not exist');

  return await Batch.create(data);
};

export const updateBatch = async (id, data) => {
  const batch = await Batch.findByPk(id);
  if (!batch) throw new ApiError(404, 'Batch not found');
  return await batch.update(data);
};

export const deleteBatch = async (id) => {
  const batch = await Batch.findByPk(id);
  if (!batch) throw new ApiError(404, 'Batch not found');
  await batch.update({ isActive: false });
  return { message: 'Batch deactivated successfully' };
};

// ===========================================================================
// Semesters
// ===========================================================================

export const getAllSemesters = async (courseId = null, batchId = null) => {
  const where = {};
  if (courseId) where.courseId = courseId;
  if (batchId) where.batchId = batchId;

  return await Semester.findAll({
    where,
    include: [
      { model: Course, as: 'course', attributes: ['id', 'name', 'shortName'] },
      { model: Batch, as: 'batch', attributes: ['id', 'name'] },
    ],
    order: [['number', 'ASC']],
  });
};

export const createSemester = async (data) => {
  return await Semester.create(data);
};

export const updateSemester = async (id, data) => {
  const semester = await Semester.findByPk(id);
  if (!semester) throw new ApiError(404, 'Semester not found');
  return await semester.update(data);
};

export const deleteSemester = async (id) => {
  const semester = await Semester.findByPk(id);
  if (!semester) throw new ApiError(404, 'Semester not found');
  await semester.update({ isActive: false });
  return { message: 'Semester deactivated successfully' };
};

// ===========================================================================
// Subjects
// ===========================================================================

export const getAllSubjects = async ({ courseId, batchId, semesterId, includeInactive = false }) => {
  const where = {};
  if (!includeInactive) where.isActive = true;
  if (courseId) where.courseId = courseId;
  if (batchId) where.batchId = batchId;
  if (semesterId) where.semesterId = semesterId;

  return await Subject.findAll({
    where,
    include: [
      { model: Course, as: 'course', attributes: ['id', 'name', 'shortName'] },
      { model: Batch, as: 'batch', attributes: ['id', 'name'] },
      { model: Semester, as: 'semester', attributes: ['id', 'number', 'name'] },
    ],
    order: [['code', 'ASC']],
  });
};

export const createSubject = async (data) => {
  const code = data.code.toUpperCase();
  const existing = await Subject.findOne({
    where: {
      code,
      courseId: data.courseId,
      semesterId: data.semesterId,
    },
  });
  if (existing) {
    throw new ApiError(409, `Subject code ${code} already exists for this semester`);
  }

  return await Subject.create({
    ...data,
    code,
  });
};

export const updateSubject = async (id, data) => {
  const subject = await Subject.findByPk(id);
  if (!subject) throw new ApiError(404, 'Subject not found');

  if (data.code) {
    data.code = data.code.toUpperCase();
  }

  return await subject.update(data);
};

export const deleteSubject = async (id) => {
  const subject = await Subject.findByPk(id);
  if (!subject) throw new ApiError(404, 'Subject not found');
  await subject.update({ isActive: false });
  return { message: 'Subject deactivated successfully' };
};
