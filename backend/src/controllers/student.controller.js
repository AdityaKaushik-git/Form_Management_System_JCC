import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import * as formService from '../services/form.service.js';
import * as applicationService from '../services/application.service.js';
import * as dashboardService from '../services/dashboard.service.js';
import { User, StudentProfile } from '../models/index.js';

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password', 'failedLoginAttempts', 'lockedUntil'] },
    include: [
      {
        model: StudentProfile,
        as: 'studentProfile',
        include: ['course', 'batch'],
      },
    ],
  });

  if (!user) throw new ApiError(404, 'Student account not found');
  return ApiResponse.success(res, user, 'Student profile retrieved');
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, ...profileData } = req.body;

  const user = await User.findByPk(req.user.id);
  if (!user) throw new ApiError(404, 'User not found');

  if (fullName) {
    await user.update({ fullName: fullName.trim() });
  }

  const profile = await StudentProfile.findOne({ where: { userId: req.user.id } });
  if (profile) {
    await profile.update(profileData);
  }

  const updated = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password'] },
    include: [
      {
        model: StudentProfile,
        as: 'studentProfile',
        include: ['course', 'batch'],
      },
    ],
  });

  return ApiResponse.success(res, updated, 'Profile updated successfully');
});

export const getDashboard = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getStudentDashboardStats(req.user.id);
  return ApiResponse.success(res, stats, 'Student dashboard retrieved');
});

export const getAvailableForms = asyncHandler(async (req, res) => {
  const forms = await formService.getAvailableFormsForStudent(req.user.id);
  return ApiResponse.success(res, forms, 'Available examination forms retrieved');
});

export const getFormDetails = asyncHandler(async (req, res) => {
  const form = await formService.getFormById(req.params.id);
  if (!form.isPublished) {
    throw new ApiError(403, 'This examination form is not available');
  }
  return ApiResponse.success(res, form, 'Form details retrieved');
});

export const submitApplication = asyncHandler(async (req, res) => {
  const application = await applicationService.submitApplication(req.user.id, req.body);
  return ApiResponse.success(res, application, 'Application submitted successfully', 201);
});

export const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await applicationService.getStudentApplications(req.user.id);
  return ApiResponse.success(res, applications, 'My applications retrieved');
});

export const getApplicationById = asyncHandler(async (req, res) => {
  const application = await applicationService.getApplicationById(req.params.id);

  // Strict backend RBAC: Student can only view their own application
  if (application.studentId !== req.user.id) {
    throw new ApiError(403, 'You are not authorized to view this application');
  }

  return ApiResponse.success(res, application, 'Application details retrieved');
});

export const downloadReceipt = asyncHandler(async (req, res) => {
  const application = await applicationService.getApplicationById(req.params.id);

  // Strict backend RBAC
  if (application.studentId !== req.user.id) {
    throw new ApiError(403, 'You are not authorized to download this receipt');
  }

  await applicationService.generateReceiptPdf(req.params.id, res);
});
