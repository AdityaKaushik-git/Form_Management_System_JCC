import { Router } from 'express';
import {
  studentRegister,
  studentLogin,
  adminLogin,
  logout,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getMe,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import {
  studentRegisterSchema,
  studentLoginSchema,
  adminLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../validators/auth.validators.js';

const router = Router();

// Student
router.post('/register', authLimiter, validate(studentRegisterSchema), studentRegister);
router.post('/login', authLimiter, validate(studentLoginSchema), studentLogin);

// Admin
router.post('/admin/login', authLimiter, validate(adminLoginSchema), adminLogin);

// Token management
router.post('/refresh', refreshAccessToken);
router.post('/logout', authenticate, logout);

// Password & Email verification
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail);

// Current session
router.get('/me', authenticate, getMe);

export default router;
