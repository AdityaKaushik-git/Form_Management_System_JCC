import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import * as adminCtrl from '../controllers/admin.controller.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

import {
  createCourseSchema,
  updateCourseSchema,
  createBatchSchema,
  updateBatchSchema,
  createSemesterSchema,
  updateSemesterSchema,
  createSubjectSchema,
  updateSubjectSchema,
  createFormSchema,
  updateFormSchema,
  sheetConfigSchema,
  updateSheetConfigSchema,
  columnMappingSchema,
  updateApplicationStatusSchema,
  updateStudentStatusSchema,
} from '../validators/admin.validators.js';

const router = Router();

// Protect all admin routes with authentication and admin role authorization
router.use(authenticate, authorize('admin'));

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
router.get('/dashboard', adminCtrl.getDashboardStats);
router.get('/charts', adminCtrl.getDashboardCharts);
router.get('/activity', adminCtrl.getRecentActivity);

// ---------------------------------------------------------------------------
// Student Management
// ---------------------------------------------------------------------------
router.get('/students', adminCtrl.getAllStudents);
router.get('/students/:id', adminCtrl.getStudentById);
router.patch('/students/:id/status', validate(updateStudentStatusSchema), adminCtrl.updateStudentStatus);
router.post('/students/provision-test', adminCtrl.provisionTestStudent);

// ---------------------------------------------------------------------------
// Academic Management: Courses
// ---------------------------------------------------------------------------
router.get('/courses', adminCtrl.getCourses);
router.get('/courses/:id', adminCtrl.getCourseById);
router.post('/courses', validate(createCourseSchema), adminCtrl.createCourse);
router.put('/courses/:id', validate(updateCourseSchema), adminCtrl.updateCourse);
router.delete('/courses/:id', adminCtrl.deleteCourse);

// ---------------------------------------------------------------------------
// Academic Management: Batches
// ---------------------------------------------------------------------------
router.get('/batches', adminCtrl.getBatches);
router.post('/batches', validate(createBatchSchema), adminCtrl.createBatch);
router.put('/batches/:id', validate(updateBatchSchema), adminCtrl.updateBatch);
router.delete('/batches/:id', adminCtrl.deleteBatch);

// ---------------------------------------------------------------------------
// Academic Management: Semesters
// ---------------------------------------------------------------------------
router.get('/semesters', adminCtrl.getSemesters);
router.post('/semesters', validate(createSemesterSchema), adminCtrl.createSemester);
router.put('/semesters/:id', validate(updateSemesterSchema), adminCtrl.updateSemester);
router.delete('/semesters/:id', adminCtrl.deleteSemester);

// ---------------------------------------------------------------------------
// Academic Management: Subjects & Curriculum Import
// ---------------------------------------------------------------------------
router.get('/subjects', adminCtrl.getSubjects);
router.post('/subjects', validate(createSubjectSchema), adminCtrl.createSubject);
router.put('/subjects/:id', validate(updateSubjectSchema), adminCtrl.updateSubject);
router.delete('/subjects/:id', adminCtrl.deleteSubject);
router.post('/curriculum/import', upload.single('file'), adminCtrl.importCurriculum);
router.get('/curriculum/template', adminCtrl.downloadCurriculumTemplate);

// ---------------------------------------------------------------------------
// Examination Forms & Auto-Generation
// ---------------------------------------------------------------------------
router.get('/forms', adminCtrl.getForms);
router.get('/forms/:id', adminCtrl.getFormById);
router.post('/forms', validate(createFormSchema), adminCtrl.createForm);
router.post('/forms/auto-generate', adminCtrl.autoGenerateForms);
router.put('/forms/:id', validate(updateFormSchema), adminCtrl.updateForm);
router.post('/forms/:id/publish', adminCtrl.publishForm);
router.post('/forms/:id/close', adminCtrl.closeForm);
router.post('/forms/:id/reopen', adminCtrl.reopenForm);
router.delete('/forms/:id', adminCtrl.deleteForm);

// ---------------------------------------------------------------------------
// Submissions
// ---------------------------------------------------------------------------
router.get('/submissions', adminCtrl.getAllSubmissions);
router.get('/submissions/:id', adminCtrl.getSubmissionById);
router.patch('/submissions/:id/status', validate(updateApplicationStatusSchema), adminCtrl.updateSubmissionStatus);

// ---------------------------------------------------------------------------
// Google Sheets Integration
// ---------------------------------------------------------------------------
router.post('/forms/:id/sheets', validate(sheetConfigSchema), adminCtrl.addSheet);
router.get('/forms/:id/sheets', adminCtrl.getSheets);
router.put('/sheets/:id', validate(updateSheetConfigSchema), adminCtrl.updateSheet);
router.delete('/sheets/:id', adminCtrl.deleteSheet);
router.post('/sheets/:id/test', adminCtrl.testSheet);
router.put('/sheets/:id/mappings', validate(columnMappingSchema), adminCtrl.updateMappings);
router.get('/sheets/:id/mappings', adminCtrl.getMappings);
router.post('/sheets/:id/sync-all', adminCtrl.syncAll);
router.post('/sheets/:id/retry-failed', adminCtrl.retryFailed);
router.get('/sheets/:id/logs', adminCtrl.getSyncLogs);

// ---------------------------------------------------------------------------
// Reports & Exports
// ---------------------------------------------------------------------------
router.get('/reports', adminCtrl.getReports);
router.get('/reports/export', adminCtrl.exportReport);

// ---------------------------------------------------------------------------
// Audit Logs & Settings
// ---------------------------------------------------------------------------
router.get('/audit-logs', adminCtrl.getAuditLogs);
router.get('/settings', adminCtrl.getSettings);
router.put('/settings', adminCtrl.updateSetting);

export default router;
