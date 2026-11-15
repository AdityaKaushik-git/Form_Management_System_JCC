import crypto from 'node:crypto';
import argon2 from 'argon2';
import { Op } from 'sequelize';

import config from '../config/index.js';
import { sequelize } from '../config/sequelize.js';
import {
  User,
  StudentProfile,
  AdminProfile,
  RefreshToken,
  EmailVerificationToken,
  PasswordResetToken,
} from '../models/index.js';
import logger from '../utils/logger.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/tokenUtils.js';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from '../utils/emailService.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;
const ACCESS_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 min
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const EMAIL_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

// ---------------------------------------------------------------------------
// Cookie helper
// ---------------------------------------------------------------------------

const isProduction = config.env === 'production';
const cookieDefaults = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? (config.cookie?.sameSite || 'lax') : 'lax',
  domain: config.cookie?.domain || undefined,
  path: '/',
};

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie('accessToken', accessToken, {
    ...cookieDefaults,
    maxAge: ACCESS_TOKEN_EXPIRY_MS,
  });
  res.cookie('refreshToken', refreshToken, {
    ...cookieDefaults,
    maxAge: REFRESH_TOKEN_EXPIRY_MS,
  });
}

function clearAuthCookies(res) {
  res.clearCookie('accessToken', cookieDefaults);
  res.clearCookie('refreshToken', cookieDefaults);
}

// ---------------------------------------------------------------------------
// Lockout helper
// ---------------------------------------------------------------------------

function isAccountLocked(user) {
  return user.lockedUntil && new Date(user.lockedUntil) > new Date();
}

async function handleFailedLogin(user) {
  const attempts = (user.failedLoginAttempts || 0) + 1;
  const updates = { failedLoginAttempts: attempts };

  if (attempts >= MAX_FAILED_ATTEMPTS) {
    updates.lockedUntil = new Date(
      Date.now() + LOCK_DURATION_MINUTES * 60 * 1000,
    );
    logger.warn(
      { userId: user.id },
      `Account locked after ${MAX_FAILED_ATTEMPTS} failed attempts`,
    );
  }

  await user.update(updates);
}

async function resetFailedAttempts(user) {
  if (user.failedLoginAttempts > 0 || user.lockedUntil) {
    await user.update({ failedLoginAttempts: 0, lockedUntil: null });
  }
}

// ---------------------------------------------------------------------------
// Sanitize user for response
// ---------------------------------------------------------------------------

function sanitizeUser(user) {
  const plain = user.toJSON ? user.toJSON() : { ...user };
  delete plain.password;
  delete plain.failedLoginAttempts;
  delete plain.lockedUntil;
  return plain;
}

// ===========================================================================
// Controllers
// ===========================================================================

// ---------------------------------------------------------------------------
// POST /register – Student Registration
// ---------------------------------------------------------------------------
export const studentRegister = asyncHandler(async (req, res) => {
  const { fullName, enrollmentNumber, email, mobile, password } = req.body;

  // Check enrollment number uniqueness in StudentProfile
  const existingEnrollment = await StudentProfile.findOne({
    where: { enrollmentNumber: enrollmentNumber.trim().toUpperCase() },
  });
  if (existingEnrollment) {
    throw new ApiError(409, 'An account with this enrollment number already exists');
  }

  // Check email uniqueness in User
  const existingEmail = await User.findOne({ where: { email: email.toLowerCase() } });
  if (existingEmail) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  // Hash password
  const hashedPassword = await argon2.hash(password, { type: argon2.argon2id });

  // Create user + profile in a transaction
  const result = await sequelize.transaction(async (t) => {
    const user = await User.create(
      {
        fullName: fullName.trim(),
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'student',
        isActive: true,
        isEmailVerified: false,
      },
      { transaction: t },
    );

    const profile = await StudentProfile.create(
      {
        userId: user.id,
        enrollmentNumber: enrollmentNumber.trim().toUpperCase(),
        mobile,
      },
      { transaction: t },
    );

    // Generate email verification token
    const rawToken = crypto.randomBytes(32).toString('hex'); // 64 hex chars
    await EmailVerificationToken.create(
      {
        userId: user.id,
        token: rawToken,
        expiresAt: new Date(Date.now() + EMAIL_TOKEN_EXPIRY_MS),
        isUsed: false,
      },
      { transaction: t },
    );

    return { user, profile, emailToken: rawToken };
  });

  // Send verification email
  try {
    await sendVerificationEmail(
      result.user.email,
      result.emailToken,
      result.user.fullName,
    );
  } catch (err) {
    logger.error({ err }, 'Failed to send verification email (background)');
  }

  logger.info({ userId: result.user.id }, 'Student registered successfully');

  return ApiResponse.success(
    res,
    {
      userId: result.user.id,
      email: result.user.email,
      enrollmentNumber: result.profile.enrollmentNumber,
    },
    'Registration successful. Please check your email to verify your account.',
    201,
  );
});

// ---------------------------------------------------------------------------
// POST /login – Student Login
// ---------------------------------------------------------------------------
export const studentLogin = asyncHandler(async (req, res) => {
  const { enrollmentNumber, password } = req.body;

  const profile = await StudentProfile.findOne({
    where: {
      enrollmentNumber: enrollmentNumber.trim().toUpperCase(),
    },
    include: [{
      model: User,
      as: 'user',
      where: { role: 'student' },
      include: [{ model: StudentProfile, as: 'studentProfile' }],
    }],
  });

  if (!profile || !profile.user) {
    throw new ApiError(401, 'Invalid enrollment number or password');
  }

  const user = profile.user;

  // Check lockout
  if (isAccountLocked(user)) {
    const minutesLeft = Math.ceil(
      (new Date(user.lockedUntil) - Date.now()) / 60000,
    );
    throw new ApiError(
      423,
      `Account is locked due to multiple failed login attempts. Try again in ${minutesLeft} minute(s).`,
    );
  }

  // Verify password
  const valid = await argon2.verify(user.password, password);
  if (!valid) {
    await handleFailedLogin(user);
    const remaining = MAX_FAILED_ATTEMPTS - (user.failedLoginAttempts + 1);
    throw new ApiError(
      401,
      remaining > 0
        ? `Invalid credentials. ${remaining} attempt(s) remaining before account lock.`
        : 'Invalid credentials. Your account has been locked for 15 minutes.',
    );
  }

  // Reset failed attempts
  await resetFailedAttempts(user);

  // Active check
  if (!user.isActive) {
    throw new ApiError(403, 'Your account has been deactivated. Please contact the administrator.');
  }

  // Generate tokens
  const payload = { id: user.id, role: user.role, email: user.email };
  const accessToken = generateAccessToken(payload);
  const refreshTokenStr = generateRefreshToken(payload);

  // Persist refresh token
  await RefreshToken.create({
    userId: user.id,
    token: refreshTokenStr,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
    isRevoked: false,
    userAgent: req.headers['user-agent'] || '',
    ipAddress: req.ip || '',
  });

  // Set cookies
  setAuthCookies(res, accessToken, refreshTokenStr);

  // Update last login
  await user.update({ lastLoginAt: new Date() });

  logger.info({ userId: user.id }, 'Student logged in');

  return ApiResponse.success(res, {
    user: sanitizeUser(user),
    accessToken,
  }, 'Login successful');
});

// ---------------------------------------------------------------------------
// POST /admin/login – Admin Login
// ---------------------------------------------------------------------------
export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({
    where: { email: email.toLowerCase(), role: 'admin' },
    include: [{ model: AdminProfile, as: 'adminProfile' }],
  });

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Check lockout
  if (isAccountLocked(user)) {
    const minutesLeft = Math.ceil(
      (new Date(user.lockedUntil) - Date.now()) / 60000,
    );
    throw new ApiError(
      423,
      `Account is locked. Try again in ${minutesLeft} minute(s).`,
    );
  }

  // Verify password
  const valid = await argon2.verify(user.password, password);
  if (!valid) {
    await handleFailedLogin(user);
    const remaining = MAX_FAILED_ATTEMPTS - (user.failedLoginAttempts + 1);
    throw new ApiError(
      401,
      remaining > 0
        ? `Invalid credentials. ${remaining} attempt(s) remaining.`
        : 'Invalid credentials. Account locked for 15 minutes.',
    );
  }

  await resetFailedAttempts(user);

  if (!user.isActive) {
    throw new ApiError(403, 'Your admin account has been deactivated.');
  }

  // Generate tokens
  const payload = { id: user.id, role: user.role, email: user.email };
  const accessToken = generateAccessToken(payload);
  const refreshTokenStr = generateRefreshToken(payload);

  await RefreshToken.create({
    userId: user.id,
    token: refreshTokenStr,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
    isRevoked: false,
    userAgent: req.headers['user-agent'] || '',
    ipAddress: req.ip || '',
  });

  setAuthCookies(res, accessToken, refreshTokenStr);
  await user.update({ lastLoginAt: new Date() });

  logger.info({ userId: user.id }, 'Admin logged in');

  return ApiResponse.success(res, {
    user: sanitizeUser(user),
    accessToken,
  }, 'Admin login successful');
});

// ---------------------------------------------------------------------------
// POST /logout
// ---------------------------------------------------------------------------
export const logout = asyncHandler(async (req, res) => {
  const refreshTokenStr = req.cookies?.refreshToken;

  if (refreshTokenStr) {
    await RefreshToken.update(
      { isRevoked: true },
      { where: { token: refreshTokenStr } },
    );
  }

  clearAuthCookies(res);

  if (req.user?.id) {
    logger.info({ userId: req.user.id }, 'User logged out');
  }

  return ApiResponse.success(res, null, 'Logged out successfully');
});

// ---------------------------------------------------------------------------
// POST /refresh – Refresh Access Token (token rotation)
// ---------------------------------------------------------------------------
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const oldRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken || req.headers['x-refresh-token'];
  if (!oldRefreshToken) {
    throw new ApiError(401, 'Refresh token not found');
  }

  // Verify JWT
  let decoded;
  try {
    decoded = verifyRefreshToken(oldRefreshToken);
  } catch {
    clearAuthCookies(res);
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  // Find in DB
  const storedToken = await RefreshToken.findOne({
    where: { token: oldRefreshToken, userId: decoded.id },
  });

  if (!storedToken || storedToken.isRevoked) {
    // Possible token reuse attack – revoke all tokens for this user
    await RefreshToken.update(
      { isRevoked: true },
      { where: { userId: decoded.id, isRevoked: false } },
    );
    clearAuthCookies(res);
    logger.warn(
      { userId: decoded.id },
      'Refresh token reuse detected – all sessions revoked',
    );
    throw new ApiError(401, 'Token has been revoked. Please log in again.');
  }

  if (new Date(storedToken.expiresAt) < new Date()) {
    await storedToken.update({ isRevoked: true });
    clearAuthCookies(res);
    throw new ApiError(401, 'Refresh token has expired. Please log in again.');
  }

  // Revoke old token
  await storedToken.update({ isRevoked: true });

  // Issue new pair
  const user = await User.findByPk(decoded.id);
  if (!user || !user.isActive) {
    clearAuthCookies(res);
    throw new ApiError(401, 'User account not found or deactivated');
  }

  const payload = { id: user.id, role: user.role, email: user.email };
  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);

  await RefreshToken.create({
    userId: user.id,
    token: newRefreshToken,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
    isRevoked: false,
    userAgent: req.headers['user-agent'] || '',
    ipAddress: req.ip || '',
  });

  setAuthCookies(res, newAccessToken, newRefreshToken);

  return ApiResponse.success(res, { accessToken: newAccessToken }, 'Token refreshed');
});

// ---------------------------------------------------------------------------
// POST /forgot-password
// ---------------------------------------------------------------------------
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const successMessage =
    'If an account with that email exists, a password reset link has been sent.';

  const user = await User.findOne({ where: { email: email.toLowerCase() } });
  if (!user) {
    return ApiResponse.success(res, null, successMessage);
  }

  // Invalidate any existing reset tokens for this user
  await PasswordResetToken.update(
    { isUsed: true },
    {
      where: {
        userId: user.id,
        isUsed: false,
        expiresAt: { [Op.gt]: new Date() },
      },
    },
  );

  // Create new reset token
  const rawToken = crypto.randomBytes(32).toString('hex');
  await PasswordResetToken.create({
    userId: user.id,
    token: rawToken,
    expiresAt: new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS),
    isUsed: false,
  });

  // Send email
  try {
    await sendPasswordResetEmail(user.email, rawToken, user.fullName);
  } catch (err) {
    logger.error({ err }, 'Failed to send password reset email (background)');
  }

  return ApiResponse.success(res, null, successMessage);
});

// ---------------------------------------------------------------------------
// POST /reset-password
// ---------------------------------------------------------------------------
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  const record = await PasswordResetToken.findOne({
    where: {
      token,
      isUsed: false,
      expiresAt: { [Op.gt]: new Date() },
    },
  });

  if (!record) {
    throw new ApiError(400, 'Invalid or expired password reset token');
  }

  const user = await User.findByPk(record.userId);
  if (!user) {
    throw new ApiError(400, 'User not found');
  }

  const hashedPassword = await argon2.hash(password, { type: argon2.argon2id });

  await sequelize.transaction(async (t) => {
    await user.update({ password: hashedPassword }, { transaction: t });
    await record.update({ isUsed: true }, { transaction: t });
    // Revoke all refresh tokens for this user (force re-login everywhere)
    await RefreshToken.update(
      { isRevoked: true },
      { where: { userId: user.id, isRevoked: false }, transaction: t },
    );
  });

  logger.info({ userId: user.id }, 'Password reset successfully');

  return ApiResponse.success(
    res,
    null,
    'Password has been reset successfully. Please log in with your new password.',
  );
});

// ---------------------------------------------------------------------------
// POST /verify-email
// ---------------------------------------------------------------------------
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  const record = await EmailVerificationToken.findOne({
    where: {
      token,
      isUsed: false,
      expiresAt: { [Op.gt]: new Date() },
    },
  });

  if (!record) {
    throw new ApiError(400, 'Invalid or expired verification token');
  }

  const user = await User.findByPk(record.userId);
  if (!user) {
    throw new ApiError(400, 'User not found');
  }

  if (user.isEmailVerified) {
    return ApiResponse.success(res, null, 'Email is already verified');
  }

  await sequelize.transaction(async (t) => {
    await user.update({ isEmailVerified: true }, { transaction: t });
    await record.update({ isUsed: true }, { transaction: t });
  });

  logger.info({ userId: user.id }, 'Email verified');

  return ApiResponse.success(res, null, 'Email verified successfully. You can now log in.');
});

// ---------------------------------------------------------------------------
// GET /me – Current User Profile
// ---------------------------------------------------------------------------
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password', 'failedLoginAttempts', 'lockedUntil'] },
    include: [
      {
        model: StudentProfile,
        as: 'studentProfile',
        include: ['course', 'batch'],
      },
      { model: AdminProfile, as: 'adminProfile' },
    ],
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return ApiResponse.success(res, { user }, 'User profile retrieved');
});
