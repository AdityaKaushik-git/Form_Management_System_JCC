import dayjs from 'dayjs';
import {
  SheetConfiguration,
  SheetColumnMapping,
  SheetSyncLog,
  Application,
  ApplicationFieldValue,
  ApplicationSubject,
  Subject,
  User,
  StudentProfile,
  Course,
  Batch,
  Semester,
  ExaminationForm,
  sequelize,
} from '../models/index.js';
import {
  extractSpreadsheetId,
  getSpreadsheetInfo,
  ensureWorksheetHeaders,
  findRowByReference,
  appendRow,
  updateRow,
} from './google-sheets.service.js';
import { ApiError } from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import { emitToAdmin } from '../sockets/index.js';

export const addSheetConfig = async (formId, data) => {
  const form = await ExaminationForm.findByPk(formId);
  if (!form) throw new ApiError(404, 'Examination form not found');

  const spreadsheetId = extractSpreadsheetId(data.spreadsheetUrl);
  if (!spreadsheetId) throw new ApiError(400, 'Invalid Google Spreadsheet URL');

  // Verify access with Google API
  const info = await getSpreadsheetInfo(spreadsheetId);

  // Check worksheet exists
  const worksheetExists = info.worksheets.some(
    (w) => w.title.toLowerCase() === data.worksheetName.trim().toLowerCase()
  );
  if (!worksheetExists) {
    const available = info.worksheets.map((w) => w.title).join(', ');
    throw new ApiError(400, `Worksheet "${data.worksheetName}" not found in spreadsheet. Available tabs: ${available}`);
  }

  const config = await SheetConfiguration.create({
    formId,
    displayName: data.displayName,
    spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl,
    worksheetName: data.worksheetName.trim(),
    isActive: true,
  });

  // Create default column mappings if none provided
  const defaultMappings = [
    { sheetHeader: 'Reference Number', fieldSource: 'referenceNumber', displayOrder: 0 },
    { sheetHeader: 'Enrollment No', fieldSource: 'enrollmentNumber', displayOrder: 1 },
    { sheetHeader: 'Student Name', fieldSource: 'fullName', displayOrder: 2 },
    { sheetHeader: 'Course', fieldSource: 'courseName', displayOrder: 3 },
    { sheetHeader: 'Semester', fieldSource: 'semesterName', displayOrder: 4 },
    { sheetHeader: 'Reappear Subjects', fieldSource: 'selectedSubjects', displayOrder: 5 },
    { sheetHeader: 'Submission Date', fieldSource: 'submittedAt', displayOrder: 6 },
    { sheetHeader: 'Status', fieldSource: 'status', displayOrder: 7 },
  ];

  await SheetColumnMapping.bulkCreate(
    defaultMappings.map((m) => ({ ...m, sheetConfigId: config.id }))
  );

  return await getSheetConfigById(config.id);
};

export const getSheetConfigById = async (id) => {
  const config = await SheetConfiguration.findByPk(id, {
    include: [
      {
        model: SheetColumnMapping,
        as: 'columnMappings',
        order: [['displayOrder', 'ASC']],
      },
    ],
  });
  if (!config) throw new ApiError(404, 'Sheet configuration not found');
  return config;
};

export const getSheetsForForm = async (formId) => {
  return await SheetConfiguration.findAll({
    where: { formId },
    include: [
      {
        model: SheetColumnMapping,
        as: 'columnMappings',
        order: [['displayOrder', 'ASC']],
      },
    ],
    order: [['createdAt', 'ASC']],
  });
};

export const updateSheetConfig = async (id, data) => {
  const config = await SheetConfiguration.findByPk(id);
  if (!config) throw new ApiError(404, 'Sheet configuration not found');

  if (data.spreadsheetUrl) {
    const spreadsheetId = extractSpreadsheetId(data.spreadsheetUrl);
    data.spreadsheetId = spreadsheetId;
  }

  return await config.update(data);
};

export const deleteSheetConfig = async (id) => {
  const config = await SheetConfiguration.findByPk(id);
  if (!config) throw new ApiError(404, 'Sheet configuration not found');
  await config.destroy();
  return { message: 'Sheet configuration deleted successfully' };
};

export const testSheetConnection = async (id) => {
  const config = await SheetConfiguration.findByPk(id);
  if (!config) throw new ApiError(404, 'Sheet configuration not found');

  const info = await getSpreadsheetInfo(config.spreadsheetId);
  return {
    success: true,
    title: info.title,
    worksheets: info.worksheets,
    message: `Connected successfully to Google Sheet "${info.title}"`,
  };
};

export const updateColumnMappings = async (sheetConfigId, mappings) => {
  const config = await SheetConfiguration.findByPk(sheetConfigId);
  if (!config) throw new ApiError(404, 'Sheet configuration not found');

  await sequelize.transaction(async (t) => {
    await SheetColumnMapping.destroy({ where: { sheetConfigId }, transaction: t });
    const records = mappings.map((m, idx) => ({
      sheetConfigId,
      sheetHeader: m.sheetHeader,
      fieldSource: m.fieldSource,
      displayOrder: m.displayOrder ?? idx,
    }));
    await SheetColumnMapping.bulkCreate(records, { transaction: t });
  });

  return await getSheetConfigById(sheetConfigId);
};

export const getColumnMappings = async (sheetConfigId) => {
  return await SheetColumnMapping.findAll({
    where: { sheetConfigId },
    order: [['displayOrder', 'ASC']],
  });
};

/**
 * Extracts and maps row values for an application using configured column mappings.
 */
export const buildRowValuesForApplication = async (applicationId, mappings) => {
  const app = await Application.findByPk(applicationId, {
    include: [
      {
        model: User,
        as: 'student',
        include: [
          {
            model: StudentProfile,
            as: 'studentProfile',
            include: ['course', 'batch'],
          },
        ],
      },
      {
        model: ExaminationForm,
        as: 'form',
        include: ['course', 'semester'],
      },
      {
        model: ApplicationFieldValue,
        as: 'fieldValues',
      },
      {
        model: ApplicationSubject,
        as: 'applicationSubjects',
        include: [{ model: Subject, as: 'subject' }],
      },
    ],
  });

  if (!app) return null;

  const profile = app.student?.studentProfile;
  const subjectsStr = (app.applicationSubjects || [])
    .map((s) => `${s.subject?.name || ''} (${s.subject?.code || ''})`)
    .filter(Boolean)
    .join(', ');

  // Create dictionary of dynamic field values
  const dynamicFieldMap = new Map();
  (app.fieldValues || []).forEach((fv) => {
    dynamicFieldMap.set(fv.fieldKey, fv.value);
  });

  const row = mappings.map((m) => {
    const src = m.fieldSource;

    // Standard fields
    if (src === 'referenceNumber') return app.referenceNumber;
    if (src === 'enrollmentNumber') return profile?.enrollmentNumber || '';
    if (src === 'fullName') return app.student?.fullName || '';
    if (src === 'email') return app.student?.email || '';
    if (src === 'mobile') return profile?.mobile || '';
    if (src === 'courseName') return app.form?.course?.name || profile?.course?.name || '';
    if (src === 'courseCode') return app.form?.course?.code || profile?.course?.code || '';
    if (src === 'semesterName') return app.form?.semester?.name || `Sem ${profile?.currentSemester || ''}`;
    if (src === 'selectedSubjects') return subjectsStr;
    if (src === 'status') return app.status?.toUpperCase() || '';
    if (src === 'submittedAt') return dayjs(app.submittedAt).format('YYYY-MM-DD HH:mm:ss');
    if (src === 'remarks') return app.remarks || '';
    if (src === 'fatherName') return profile?.fatherName || '';
    if (src === 'motherName') return profile?.motherName || '';

    // Dynamic custom field values
    if (dynamicFieldMap.has(src)) {
      return dynamicFieldMap.get(src) || '';
    }

    return '';
  });

  return { row, referenceNumber: app.referenceNumber };
};

/**
 * Synchronizes an individual application to a specific Google Sheet.
 * Idempotent: Updates row if reference number already exists in sheet, appends otherwise.
 */
export const syncApplicationToSheet = async (applicationId, sheetConfigId) => {
  const config = await SheetConfiguration.findByPk(sheetConfigId, {
    include: [{ model: SheetColumnMapping, as: 'columnMappings', order: [['displayOrder', 'ASC']] }],
  });
  if (!config || !config.isActive) return { success: false, reason: 'Sheet config inactive or not found' };

  // Create or find sync log
  let syncLog = await SheetSyncLog.findOne({
    where: { sheetConfigId, applicationId },
  });

  if (!syncLog) {
    syncLog = await SheetSyncLog.create({
      sheetConfigId,
      applicationId,
      status: 'processing',
      attemptCount: 1,
    });
  } else {
    await syncLog.update({
      status: 'processing',
      attemptCount: (syncLog.attemptCount || 0) + 1,
    });
  }

  try {
    const mappings = config.columnMappings || [];
    if (mappings.length === 0) {
      throw new Error('No column mappings defined for sheet');
    }

    // 1. Ensure header row exists
    const headers = mappings.map((m) => m.sheetHeader);
    await ensureWorksheetHeaders(config.spreadsheetId, config.worksheetName, headers);

    // 2. Build row values
    const data = await buildRowValuesForApplication(applicationId, mappings);
    if (!data) throw new Error('Application data could not be retrieved');

    // 3. Check for existing row to prevent duplicates (Idempotency)
    const existingRow = await findRowByReference(
      config.spreadsheetId,
      config.worksheetName,
      data.referenceNumber
    );

    if (existingRow) {
      await updateRow(config.spreadsheetId, config.worksheetName, existingRow, data.row);
      await syncLog.update({
        status: 'success',
        rowNumber: existingRow,
        processedAt: new Date(),
        errorMessage: null,
      });
    } else {
      await appendRow(config.spreadsheetId, config.worksheetName, data.row);
      await syncLog.update({
        status: 'success',
        processedAt: new Date(),
        errorMessage: null,
      });
    }

    // Update config metadata
    await config.increment('totalSynced');
    await config.update({ lastSyncAt: new Date(), lastError: null });

    emitToAdmin('sheet:synced', {
      sheetConfigId: config.id,
      applicationId,
      status: 'success',
    });

    return { success: true };
  } catch (err) {
    logger.error({ err, sheetConfigId, applicationId }, 'Google Sheet sync error');

    await syncLog.update({
      status: 'failed',
      errorMessage: err.message,
      processedAt: new Date(),
    });

    await config.update({ lastError: err.message });

    emitToAdmin('sheet:sync_failed', {
      sheetConfigId: config.id,
      applicationId,
      error: err.message,
    });

    return { success: false, error: err.message };
  }
};

/**
 * Synchronizes all applications for a form into a configured sheet.
 */
export const syncAllApplicationsForSheet = async (sheetConfigId) => {
  const config = await SheetConfiguration.findByPk(sheetConfigId);
  if (!config) throw new ApiError(404, 'Sheet configuration not found');

  const applications = await Application.findAll({
    where: { formId: config.formId },
    attributes: ['id'],
    order: [['submittedAt', 'ASC']],
  });

  let successCount = 0;
  let failCount = 0;

  for (const app of applications) {
    const res = await syncApplicationToSheet(app.id, sheetConfigId);
    if (res.success) successCount++;
    else failCount++;
  }

  return {
    total: applications.length,
    successCount,
    failCount,
  };
};

/**
 * Retries failed synchronization jobs for a sheet.
 */
export const retryFailedSync = async (sheetConfigId) => {
  const failedLogs = await SheetSyncLog.findAll({
    where: {
      sheetConfigId,
      status: 'failed',
    },
  });

  let retriedCount = 0;
  for (const log of failedLogs) {
    if (log.applicationId) {
      await syncApplicationToSheet(log.applicationId, sheetConfigId);
      retriedCount++;
    }
  }

  return { retriedCount };
};

export const getSyncLogs = async (sheetConfigId, page = 1, limit = 20) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 20);
  const offset = (pageNum - 1) * limitNum;
  const { count, rows } = await SheetSyncLog.findAndCountAll({
    where: { sheetConfigId },
    include: [
      {
        model: Application,
        as: 'application',
        attributes: ['id', 'referenceNumber', 'status'],
      },
    ],
    order: [['createdAt', 'DESC']],
    limit: limitNum,
    offset,
  });

  return {
    total: count,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(count / limitNum),
    logs: rows,
  };
};
