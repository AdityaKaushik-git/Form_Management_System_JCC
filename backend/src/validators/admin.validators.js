import { z } from 'zod';

// ===========================================================================
// Academic Management Validators
// ===========================================================================

export const createCourseSchema = z.object({
  name: z.string().trim().min(2, 'Course name must be at least 2 characters'),
  shortName: z.string().trim().min(2, 'Short name must be at least 2 characters'),
  code: z.string().trim().min(1, 'Course code is required').toUpperCase(),
  duration: z.coerce.number().int().positive('Duration must be positive in years'),
  totalSemesters: z.coerce.number().int().positive('Total semesters must be positive'),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateCourseSchema = createCourseSchema.partial();

export const createBatchSchema = z.object({
  courseId: z.string().uuid('Valid course ID is required'),
  name: z.string().trim().min(2, 'Batch name is required'),
  startYear: z.coerce.number().int().min(2000).max(2100),
  endYear: z.coerce.number().int().min(2000).max(2100),
  isActive: z.boolean().optional().default(true),
}).refine(data => data.endYear >= data.startYear, {
  message: 'End year must be greater than or equal to start year',
  path: ['endYear'],
});

export const updateBatchSchema = z.object({
  courseId: z.string().uuid().optional(),
  name: z.string().trim().min(2).optional(),
  startYear: z.coerce.number().int().min(2000).max(2100).optional(),
  endYear: z.coerce.number().int().min(2000).max(2100).optional(),
  isActive: z.boolean().optional(),
});

export const createSemesterSchema = z.object({
  courseId: z.string().uuid('Valid course ID is required'),
  batchId: z.string().uuid().optional().nullable(),
  number: z.coerce.number().int().min(1).max(12, 'Semester number must be 1-12'),
  name: z.string().trim().min(1, 'Semester name is required'),
  isActive: z.boolean().optional().default(true),
});

export const updateSemesterSchema = createSemesterSchema.partial();

export const createSubjectSchema = z.object({
  courseId: z.string().uuid('Valid course ID is required'),
  batchId: z.string().uuid().optional().nullable(),
  semesterId: z.string().uuid('Valid semester ID is required'),
  name: z.string().trim().min(2, 'Subject name is required'),
  code: z.string().trim().min(1, 'Subject code is required').toUpperCase(),
  credits: z.coerce.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const updateSubjectSchema = createSubjectSchema.partial();

// ===========================================================================
// Examination Form Validators
// ===========================================================================

export const formFieldDefinitionSchema = z.object({
  id: z.string().uuid().optional(),
  fieldLabel: z.string().trim().min(1, 'Field label is required'),
  fieldKey: z.string().trim().min(1, 'Field key is required').regex(/^[a-zA-Z0-9_]+$/, 'Field key must be alphanumeric/underscore'),
  fieldType: z.enum([
    'text',
    'number',
    'email',
    'mobile',
    'textarea',
    'dropdown',
    'radio',
    'checkbox',
    'date',
    'file',
    'subject_selection',
    'info',
  ]),
  placeholder: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  isRequired: z.boolean().optional().default(false),
  defaultValue: z.string().optional().nullable(),
  minLength: z.coerce.number().int().optional().nullable(),
  maxLength: z.coerce.number().int().optional().nullable(),
  minValue: z.coerce.number().optional().nullable(),
  maxValue: z.coerce.number().optional().nullable(),
  options: z.any().optional().nullable(), // Array of { label, value } or strings
  displayOrder: z.coerce.number().int().optional().default(0),
  isVisible: z.boolean().optional().default(true),
  isSyncEligible: z.boolean().optional().default(true),
});

export const createFormSchema = z.object({
  title: z.string().trim().min(2, 'Form title is required'),
  examName: z.string().trim().min(2, 'Examination name is required'),
  examSession: z.string().trim().optional(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  courseId: z.string().uuid().optional().nullable(),
  batchId: z.string().uuid().optional().nullable(),
  semesterId: z.string().uuid().optional().nullable(),
  examType: z.string().optional().default('reappear'),
  startDate: z.string().or(z.date()).refine(val => !isNaN(Date.parse(val)), 'Valid start date is required'),
  endDate: z.string().or(z.date()).optional().nullable(),
  isPermanentActive: z.boolean().optional().default(false),
  fields: z.array(formFieldDefinitionSchema).optional().default([]),
  subjectIds: z.array(z.string().uuid()).optional().default([]),
}).refine(data => {
  if (!data.isPermanentActive && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, {
  message: 'End date must be after or equal to start date',
  path: ['endDate'],
});

export const updateFormSchema = z.object({
  title: z.string().trim().min(2).optional(),
  examName: z.string().trim().min(2).optional(),
  examSession: z.string().trim().optional(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  courseId: z.string().uuid().optional().nullable(),
  batchId: z.string().uuid().optional().nullable(),
  semesterId: z.string().uuid().optional().nullable(),
  examType: z.string().optional(),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional().nullable(),
  isPermanentActive: z.boolean().optional(),
  fields: z.array(formFieldDefinitionSchema).optional(),
  subjectIds: z.array(z.string().uuid()).optional(),
});

// ===========================================================================
// Google Sheets Integration Validators
// ===========================================================================

export const sheetConfigSchema = z.object({
  displayName: z.string().trim().min(1, 'Display name is required'),
  spreadsheetUrl: z.string().url('A valid Google Sheets URL is required'),
  worksheetName: z.string().trim().min(1, 'Worksheet / Tab name is required'),
});

export const updateSheetConfigSchema = z.object({
  displayName: z.string().trim().min(1).optional(),
  spreadsheetUrl: z.string().url().optional(),
  worksheetName: z.string().trim().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const columnMappingSchema = z.object({
  mappings: z.array(
    z.object({
      sheetHeader: z.string().trim().min(1, 'Sheet header column title is required'),
      fieldSource: z.string().trim().min(1, 'Field source key is required'),
      displayOrder: z.coerce.number().int().optional().default(0),
    })
  ).min(1, 'At least one column mapping is required'),
});

// ===========================================================================
// Application & Student Management Validators
// ===========================================================================

export const updateApplicationStatusSchema = z.object({
  status: z.enum([
    'submitted',
    'under_review',
    'approved',
    'rejected',
    'correction_required',
  ]),
  remarks: z.string().optional().nullable(),
});

export const updateStudentStatusSchema = z.object({
  isActive: z.boolean(),
});
