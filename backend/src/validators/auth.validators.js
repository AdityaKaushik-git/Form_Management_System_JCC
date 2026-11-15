import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared field helpers
// ---------------------------------------------------------------------------

const passwordField = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character',
  );

const confirmPasswordRefinement = (data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    });
  }
};

// ---------------------------------------------------------------------------
// Student Registration
// ---------------------------------------------------------------------------

export const studentRegisterSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters'),
    enrollmentNumber: z
      .string()
      .trim()
      .min(3, 'Enrollment number must be at least 3 characters')
      .regex(
        /^[A-Za-z0-9]+$/,
        'Enrollment number must be alphanumeric',
      ),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Please provide a valid email address'),
    mobile: z
      .string()
      .trim()
      .regex(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits'),
    password: passwordField,
    confirmPassword: z.string(),
  })
  .superRefine(confirmPasswordRefinement);

// ---------------------------------------------------------------------------
// Student Login
// ---------------------------------------------------------------------------

export const studentLoginSchema = z.object({
  enrollmentNumber: z
    .string()
    .trim()
    .min(1, 'Enrollment number is required'),
  password: z.string().min(1, 'Password is required'),
});

// ---------------------------------------------------------------------------
// Admin Login
// ---------------------------------------------------------------------------

export const adminLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ---------------------------------------------------------------------------
// Forgot Password
// ---------------------------------------------------------------------------

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),
});

// ---------------------------------------------------------------------------
// Reset Password
// ---------------------------------------------------------------------------

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordField,
    confirmPassword: z.string(),
  })
  .superRefine(confirmPasswordRefinement);

// ---------------------------------------------------------------------------
// Verify Email
// ---------------------------------------------------------------------------

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

// ---------------------------------------------------------------------------
// Refresh Token  (body is empty – token comes from cookie)
// ---------------------------------------------------------------------------

export const refreshTokenSchema = z.object({});
