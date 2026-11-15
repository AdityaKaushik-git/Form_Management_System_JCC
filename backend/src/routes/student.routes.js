import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import * as studentCtrl from '../controllers/student.controller.js';
import {
  updateStudentProfileSchema,
  submitApplicationSchema,
} from '../validators/student.validators.js';

const router = Router();

// Protect all student routes with authentication and student role authorization
router.use(authenticate, authorize('student'));

// Profile
router.get('/profile', studentCtrl.getProfile);
router.put('/profile', validate(updateStudentProfileSchema), studentCtrl.updateProfile);

// Dashboard
router.get('/dashboard', studentCtrl.getDashboard);

// Examination Forms
router.get('/forms', studentCtrl.getAvailableForms);
router.get('/forms/:id', studentCtrl.getFormDetails);

// Applications
router.post('/applications', validate(submitApplicationSchema), studentCtrl.submitApplication);
router.get('/applications', studentCtrl.getMyApplications);
router.get('/applications/:id', studentCtrl.getApplicationById);
router.get('/applications/:id/receipt', studentCtrl.downloadReceipt);

export default router;
