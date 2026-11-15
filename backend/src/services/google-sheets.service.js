import { google } from 'googleapis';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { ApiError } from '../utils/ApiError.js';

let sheetsClient = null;

/**
 * Initializes and returns the authenticated Google Sheets API client.
 */
export const getSheetsClient = () => {
  if (sheetsClient) return sheetsClient;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || config.google.clientEmail;
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || config.google.privateKey || '').replace(/\\n/g, '\n');

  if (!email || !privateKey) {
    logger.warn('Google Sheets service account credentials are not configured in environment');
    return null;
  }

  try {
    const auth = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    sheetsClient = google.sheets({ version: 'v4', auth });
    return sheetsClient;
  } catch (err) {
    logger.error({ err }, 'Failed to initialize Google Sheets JWT client');
    return null;
  }
};

/**
 * Extracts spreadsheet ID from full URL or returns the string if already an ID.
 */
export const extractSpreadsheetId = (urlOrId) => {
  if (!urlOrId) return '';
  const match = urlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : urlOrId.trim();
};

/**
 * Fetches spreadsheet metadata, including title and available worksheet tabs.
 */
export const getSpreadsheetInfo = async (spreadsheetId) => {
  const sheets = getSheetsClient();
  if (!sheets) {
    throw new ApiError(500, 'Google Sheets integration is not configured. Please supply service account credentials in environment.');
  }

  try {
    const res = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'properties.title,sheets.properties(sheetId,title,gridProperties)',
    });

    return {
      title: res.data.properties?.title,
      worksheets: (res.data.sheets || []).map((s) => ({
        sheetId: s.properties?.sheetId,
        title: s.properties?.title,
        rowCount: s.properties?.gridProperties?.rowCount,
        columnCount: s.properties?.gridProperties?.columnCount,
      })),
    };
  } catch (err) {
    logger.error({ err, spreadsheetId }, 'Failed to get spreadsheet info');
    throw new ApiError(400, `Cannot access Google Spreadsheet: ${err.message}. Please verify the spreadsheet ID and ensure it is shared with the service account as Editor.`);
  }
};

/**
 * Gets the current header row (row 1) of a worksheet.
 */
export const getWorksheetHeaders = async (spreadsheetId, worksheetName) => {
  const sheets = getSheetsClient();
  if (!sheets) return [];

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${worksheetName}!1:1`,
    });
    return res.data.values?.[0] || [];
  } catch {
    return [];
  }
};

/**
 * Ensures headers exist on row 1 of the worksheet.
 */
export const ensureWorksheetHeaders = async (spreadsheetId, worksheetName, headers) => {
  const sheets = getSheetsClient();
  if (!sheets || !headers || headers.length === 0) return;

  const currentHeaders = await getWorksheetHeaders(spreadsheetId, worksheetName);

  if (currentHeaders.length === 0) {
    // Set headers on row 1
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${worksheetName}!1:1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [headers],
      },
    });
    logger.info({ spreadsheetId, worksheetName }, 'Initialized Google Sheet headers');
  }
};

/**
 * Finds if a row with the given reference number already exists in column A (or across the sheet).
 */
export const findRowByReference = async (spreadsheetId, worksheetName, referenceNumber) => {
  const sheets = getSheetsClient();
  if (!sheets) return null;

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${worksheetName}!A:Z`,
    });

    const rows = res.data.values || [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.includes(referenceNumber)) {
        return i + 1; // 1-indexed row number
      }
    }
    return null;
  } catch (err) {
    logger.warn({ err }, 'Error checking existing rows in sheet');
    return null;
  }
};

/**
 * Appends a single row to the worksheet.
 */
export const appendRow = async (spreadsheetId, worksheetName, rowValues) => {
  const sheets = getSheetsClient();
  if (!sheets) throw new ApiError(500, 'Google Sheets client not initialized');

  const res = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${worksheetName}!A1`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [rowValues],
    },
  });

  return res.data;
};

/**
 * Updates an existing row in the worksheet (1-indexed rowNumber).
 */
export const updateRow = async (spreadsheetId, worksheetName, rowNumber, rowValues) => {
  const sheets = getSheetsClient();
  if (!sheets) throw new ApiError(500, 'Google Sheets client not initialized');

  const res = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${worksheetName}!A${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [rowValues],
    },
  });

  return res.data;
};
