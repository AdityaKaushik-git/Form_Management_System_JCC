import { z } from 'zod';

export const updateStudentProfileSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').optional(),
  mobile: z.string().trim().regex(/^[0-9]{10}$/, 'Mobile number must be 10 digits').optional().nullable(),
  courseId: z.string().uuid().optional().nullable(),
  batchId: z.string().uuid().optional().nullable(),
  currentSemester: z.coerce.number().int().min(1).max(12).optional().nullable(),
  fatherName: z.string().trim().optional().nullable(),
  motherName: z.string().trim().optional().nullable(),
  dateOfBirth: z.string().or(z.date()).optional().nullable(),
  address: z.string().trim().optional().nullable(),
});

export const submitApplicationSchema = z.object({
  formId: z.string().uuid('Valid Form ID is required'),
  fieldValues: z.record(z.any()).default({}), // Dynamic field key-value pairs
  subjectIds: z.array(z.string().uuid()).min(1, 'Please select at least one reappear subject'),
});
