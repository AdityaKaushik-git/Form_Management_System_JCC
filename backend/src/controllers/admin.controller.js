import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import * as academicService from '../services/academic.service.js';
import * as formService from '../services/form.service.js';
import * as applicationService from '../services/application.service.js';
import * as sheetsService from '../services/sheets.service.js';
import * as dashboardService from '../services/dashboard.service.js';
import * as reportService from '../services/report.service.js';
import * as auditService from '../services/audit.service.js';
import { User, StudentProfile, Course, Batch, Semester, SystemSetting } from '../models/index.js';

// ===========================================================================
// Dashboard
// ===========================================================================

export const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getAdminDashboardStats();
  return ApiResponse.success(res, stats, 'Dashboard statistics retrieved');
});

export const getDashboardCharts = asyncHandler(async (req, res) => {
  const charts = await dashboardService.getDashboardChartsData();
  return ApiResponse.success(res, charts, 'Dashboard charts data retrieved');
});

export const getRecentActivity = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit || '15', 10);
  const activity = await dashboardService.getRecentActivityFeed(limit);
  return ApiResponse.success(res, activity, 'Recent activity feed retrieved');
});

// ===========================================================================
// Student Management
// ===========================================================================

export const getAllStudents = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, courseId, batchId, isActive } = req.query;

  const where = { role: 'student' };
  if (isActive !== undefined && isActive !== '') {
    where.isActive = isActive === 'true';
  }

  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const { count, rows } = await User.findAndCountAll({
    where,
    attributes: { exclude: ['password', 'failedLoginAttempts', 'lockedUntil'] },
    include: [
      {
        model: StudentProfile,
        as: 'studentProfile',
        where: {
          ...(courseId ? { courseId } : {}),
          ...(batchId ? { batchId } : {}),
        },
        include: [
          { model: Course, as: 'course', attributes: ['name', 'shortName'] },
          { model: Batch, as: 'batch', attributes: ['name'] },
        ],
      },
    ],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit, 10),
    offset,
  });

  let students = rows;
  if (search) {
    const q = search.toLowerCase();
    students = rows.filter((u) => {
      const name = u.fullName?.toLowerCase() || '';
      const email = u.email?.toLowerCase() || '';
      const enr = u.studentProfile?.enrollmentNumber?.toLowerCase() || '';
      return name.includes(q) || email.includes(q) || enr.includes(q);
    });
  }

  return ApiResponse.success(
    res,
    {
      total: count,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(count / parseInt(limit, 10)),
      students,
    },
    'Students retrieved'
  );
});

export const getStudentById = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    where: { id: req.params.id, role: 'student' },
    attributes: { exclude: ['password'] },
    include: [
      {
        model: StudentProfile,
        as: 'studentProfile',
        include: ['course', 'batch'],
      },
    ],
  });

  if (!user) throw new ApiError(404, 'Student not found');

  const applications = await applicationService.getStudentApplications(user.id);

  return ApiResponse.success(res, { user, applications }, 'Student profile retrieved');
});

export const updateStudentStatus = asyncHandler(async (req, res) => {
  const user = await User.findOne({ where: { id: req.params.id, role: 'student' } });
  if (!user) throw new ApiError(404, 'Student not found');

  await user.update({ isActive: req.body.isActive });

  await auditService.logAdminAction({
    userId: req.user.id,
    action: req.body.isActive ? 'ACTIVATE_STUDENT' : 'DEACTIVATE_STUDENT',
    entity: 'User',
    entityId: user.id,
    details: { email: user.email, isActive: req.body.isActive },
    req,
  });

  return ApiResponse.success(
    res,
    { id: user.id, isActive: user.isActive },
    `Student account ${user.isActive ? 'activated' : 'deactivated'} successfully`
  );
});

// ===========================================================================
// Academic Management
// ===========================================================================

export const getCourses = asyncHandler(async (req, res) => {
  const courses = await academicService.getAllCourses(true);
  return ApiResponse.success(res, courses, 'Courses retrieved');
});

export const getCourseById = asyncHandler(async (req, res) => {
  const course = await academicService.getCourseById(req.params.id);
  return ApiResponse.success(res, course, 'Course details retrieved');
});

export const createCourse = asyncHandler(async (req, res) => {
  const course = await academicService.createCourse(req.body);
  await auditService.logAdminAction({
    userId: req.user.id,
    action: 'CREATE_COURSE',
    entity: 'Course',
    entityId: course.id,
    details: req.body,
    req,
  });
  return ApiResponse.success(res, course, 'Course created successfully', 201);
});

export const updateCourse = asyncHandler(async (req, res) => {
  const course = await academicService.updateCourse(req.params.id, req.body);
  return ApiResponse.success(res, course, 'Course updated successfully');
});

export const deleteCourse = asyncHandler(async (req, res) => {
  const result = await academicService.deleteCourse(req.params.id);
  return ApiResponse.success(res, result, 'Course deactivated successfully');
});

export const getBatches = asyncHandler(async (req, res) => {
  const batches = await academicService.getAllBatches(req.query.courseId, true);
  return ApiResponse.success(res, batches, 'Batches retrieved');
});

export const createBatch = asyncHandler(async (req, res) => {
  const batch = await academicService.createBatch(req.body);
  return ApiResponse.success(res, batch, 'Batch created successfully', 201);
});

export const updateBatch = asyncHandler(async (req, res) => {
  const batch = await academicService.updateBatch(req.params.id, req.body);
  return ApiResponse.success(res, batch, 'Batch updated successfully');
});

export const deleteBatch = asyncHandler(async (req, res) => {
  const result = await academicService.deleteBatch(req.params.id);
  return ApiResponse.success(res, result, 'Batch deactivated successfully');
});

export const getSemesters = asyncHandler(async (req, res) => {
  const semesters = await academicService.getAllSemesters(req.query.courseId, req.query.batchId);
  return ApiResponse.success(res, semesters, 'Semesters retrieved');
});

export const createSemester = asyncHandler(async (req, res) => {
  const semester = await academicService.createSemester(req.body);
  return ApiResponse.success(res, semester, 'Semester created successfully', 201);
});

export const updateSemester = asyncHandler(async (req, res) => {
  const semester = await academicService.updateSemester(req.params.id, req.body);
  return ApiResponse.success(res, semester, 'Semester updated successfully');
});

export const deleteSemester = asyncHandler(async (req, res) => {
  const result = await academicService.deleteSemester(req.params.id);
  return ApiResponse.success(res, result, 'Semester deactivated successfully');
});

export const getSubjects = asyncHandler(async (req, res) => {
  const subjects = await academicService.getAllSubjects({
    courseId: req.query.courseId,
    batchId: req.query.batchId,
    semesterId: req.query.semesterId,
    includeInactive: true,
  });
  return ApiResponse.success(res, subjects, 'Subjects retrieved');
});

export const createSubject = asyncHandler(async (req, res) => {
  const subject = await academicService.createSubject(req.body);
  return ApiResponse.success(res, subject, 'Subject created successfully', 201);
});

export const updateSubject = asyncHandler(async (req, res) => {
  const subject = await academicService.updateSubject(req.params.id, req.body);
  return ApiResponse.success(res, subject, 'Subject updated successfully');
});

export const deleteSubject = asyncHandler(async (req, res) => {
  const result = await academicService.deleteSubject(req.params.id);
  return ApiResponse.success(res, result, 'Subject deactivated successfully');
});

// ===========================================================================
// Examination Forms
// ===========================================================================

export const getForms = asyncHandler(async (req, res) => {
  const forms = await formService.getAllForms(req.query);
  return ApiResponse.success(res, forms, 'Examination forms retrieved');
});

export const getFormById = asyncHandler(async (req, res) => {
  const form = await formService.getFormById(req.params.id);
  return ApiResponse.success(res, form, 'Form details retrieved');
});

export const createForm = asyncHandler(async (req, res) => {
  const form = await formService.createForm(req.body, req.user.id);
  await auditService.logAdminAction({
    userId: req.user.id,
    action: 'CREATE_EXAM_FORM',
    entity: 'ExaminationForm',
    entityId: form.id,
    details: { title: form.title },
    req,
  });
  return ApiResponse.success(res, form, 'Examination form created successfully', 201);
});

export const updateForm = asyncHandler(async (req, res) => {
  const form = await formService.updateForm(req.params.id, req.body);
  return ApiResponse.success(res, form, 'Examination form updated successfully');
});

export const publishForm = asyncHandler(async (req, res) => {
  const form = await formService.publishForm(req.params.id);
  await auditService.logAdminAction({
    userId: req.user.id,
    action: 'PUBLISH_EXAM_FORM',
    entity: 'ExaminationForm',
    entityId: form.id,
    details: { title: form.title },
    req,
  });
  return ApiResponse.success(res, form, 'Examination form published successfully');
});

export const closeForm = asyncHandler(async (req, res) => {
  const form = await formService.closeForm(req.params.id);
  await auditService.logAdminAction({
    userId: req.user.id,
    action: 'CLOSE_EXAM_FORM',
    entity: 'ExaminationForm',
    entityId: form.id,
    details: { title: form.title },
    req,
  });
  return ApiResponse.success(res, form, 'Examination form closed successfully');
});

export const reopenForm = asyncHandler(async (req, res) => {
  const form = await formService.reopenForm(req.params.id);
  await auditService.logAdminAction({
    userId: req.user.id,
    action: 'REOPEN_EXAM_FORM',
    entity: 'ExaminationForm',
    entityId: form.id,
    details: { title: form.title },
    req,
  });
  return ApiResponse.success(res, form, 'Examination form reopened successfully');
});

export const deleteForm = asyncHandler(async (req, res) => {
  const result = await formService.deleteForm(req.params.id);
  return ApiResponse.success(res, result, 'Examination form deleted');
});

// ===========================================================================
// Applications / Submissions
// ===========================================================================

export const getAllSubmissions = asyncHandler(async (req, res) => {
  const submissions = await applicationService.getAllApplications(req.query);
  return ApiResponse.success(res, submissions, 'Submissions retrieved');
});

export const getSubmissionById = asyncHandler(async (req, res) => {
  const submission = await applicationService.getApplicationById(req.params.id);
  return ApiResponse.success(res, submission, 'Application details retrieved');
});

export const updateSubmissionStatus = asyncHandler(async (req, res) => {
  const { status, remarks } = req.body;
  const updated = await applicationService.updateApplicationStatus(
    req.params.id,
    status,
    remarks,
    req.user.id
  );

  await auditService.logAdminAction({
    userId: req.user.id,
    action: 'UPDATE_APPLICATION_STATUS',
    entity: 'Application',
    entityId: updated.id,
    details: { referenceNumber: updated.referenceNumber, newStatus: status, remarks },
    req,
  });

  return ApiResponse.success(res, updated, `Application status updated to ${status}`);
});

// ===========================================================================
// Google Sheets Integration
// ===========================================================================

export const addSheet = asyncHandler(async (req, res) => {
  const config = await sheetsService.addSheetConfig(req.params.id, req.body);
  return ApiResponse.success(res, config, 'Google Sheet connected successfully', 201);
});

export const getSheets = asyncHandler(async (req, res) => {
  const sheets = await sheetsService.getSheetsForForm(req.params.id);
  return ApiResponse.success(res, sheets, 'Connected sheets retrieved');
});

export const updateSheet = asyncHandler(async (req, res) => {
  const updated = await sheetsService.updateSheetConfig(req.params.id, req.body);
  return ApiResponse.success(res, updated, 'Sheet configuration updated');
});

export const deleteSheet = asyncHandler(async (req, res) => {
  const result = await sheetsService.deleteSheetConfig(req.params.id);
  return ApiResponse.success(res, result, 'Sheet configuration removed');
});

export const testSheet = asyncHandler(async (req, res) => {
  const result = await sheetsService.testSheetConnection(req.params.id);
  return ApiResponse.success(res, result, result.message);
});

export const updateMappings = asyncHandler(async (req, res) => {
  const updated = await sheetsService.updateColumnMappings(req.params.id, req.body.mappings);
  return ApiResponse.success(res, updated, 'Column mappings saved successfully');
});

export const getMappings = asyncHandler(async (req, res) => {
  const mappings = await sheetsService.getColumnMappings(req.params.id);
  return ApiResponse.success(res, mappings, 'Column mappings retrieved');
});

export const syncAll = asyncHandler(async (req, res) => {
  const result = await sheetsService.syncAllApplicationsForSheet(req.params.id);
  return ApiResponse.success(res, result, `Synchronized ${result.successCount} of ${result.total} applications`);
});

export const retryFailed = asyncHandler(async (req, res) => {
  const result = await sheetsService.retryFailedSync(req.params.id);
  return ApiResponse.success(res, result, `Retried ${result.retriedCount} failed synchronizations`);
});

export const getSyncLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const logs = await sheetsService.getSyncLogs(req.params.id, page, limit);
  return ApiResponse.success(res, logs, 'Sync logs retrieved');
});

// ===========================================================================
// Reports & Exports
// ===========================================================================

export const getReports = asyncHandler(async (req, res) => {
  const data = await reportService.getFilteredApplications(req.query);
  return ApiResponse.success(res, data, 'Report data retrieved');
});

export const exportReport = asyncHandler(async (req, res) => {
  const format = req.query.format || 'excel';
  if (format === 'csv') {
    return await reportService.exportReportCsv(req.query, res);
  } else {
    return await reportService.exportReportExcel(req.query, res);
  }
});

// ===========================================================================
// Audit Logs & System Settings
// ===========================================================================

export const getAuditLogs = asyncHandler(async (req, res) => {
  const logs = await auditService.getAuditLogs(req.query);
  return ApiResponse.success(res, logs, 'Audit logs retrieved');
});

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await SystemSetting.findAll();
  return ApiResponse.success(res, settings, 'System settings retrieved');
});

export const updateSetting = asyncHandler(async (req, res) => {
  const { key, value } = req.body;
  const [setting] = await SystemSetting.upsert({
    key,
    value,
    updatedBy: req.user.id,
  });
  return ApiResponse.success(res, setting, 'System setting updated');
});

// ===========================================================================
// Curriculum Excel Import & Template
// ===========================================================================
import { importCurriculumFromExcel, generateCurriculumTemplate } from '../services/curriculum-import.service.js';
import { autoGenerateExaminationForms } from '../services/form-autogen.service.js';
import { provisionTestStudentAndCurriculum } from '../services/student-test.service.js';

export const importCurriculum = asyncHandler(async (req, res) => {
  if (!req.file || !req.file.buffer) {
    throw new ApiError(400, 'Please upload a valid Excel file (.xlsx or .xls)');
  }
  const result = await importCurriculumFromExcel(req.file.buffer);
  return ApiResponse.success(res, result, 'Curriculum imported successfully from Excel');
});

export const downloadCurriculumTemplate = asyncHandler(async (_req, res) => {
  const workbook = await generateCurriculumTemplate();
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="JCC_Curriculum_Syllabus_Template.xlsx"'
  );
  await workbook.xlsx.write(res);
  res.end();
});

// ===========================================================================
// Automated Examination Form Generation (Odd / Even Semester Rules)
// ===========================================================================
export const autoGenerateForms = asyncHandler(async (req, res) => {
  const { sessionType, academicYear, examSession, courseId, batchId, isPermanentActive, startDate, endDate, googleSpreadsheetUrl } = req.body;
  const result = await autoGenerateExaminationForms({
    sessionType,
    academicYear,
    examSession,
    courseId,
    batchId,
    isPermanentActive,
    startDate,
    endDate,
    googleSpreadsheetUrl,
    adminId: req.user.id,
  });
  return ApiResponse.success(res, result, 'Examination forms automatically generated successfully');
});

// ===========================================================================
// Test Student Provisioning
// ===========================================================================
export const provisionTestStudent = asyncHandler(async (_req, res) => {
  const result = await provisionTestStudentAndCurriculum();
  return ApiResponse.success(res, result, 'Test student and sample curriculum provisioned successfully');
});
