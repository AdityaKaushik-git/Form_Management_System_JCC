import ExcelJS from 'exceljs';
import { Course, Batch, Semester, Subject, sequelize } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import logger from '../utils/logger.js';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Generate Curriculum Excel Template
 * ─────────────────────────────────────────────────────────────────────────────
 * Produces a pre-formatted Excel workbook containing standard columns and
 * sample rows for BCA and BBA courses, batches, odd/even semesters, and subjects.
 */
export const generateCurriculumTemplate = async () => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'JCC Examination Branch - Aditya Kaushik';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Curriculum_Syllabus', {
    properties: { tabColor: { argb: 'FF1E40AF' } },
  });

  // Define Columns
  sheet.columns = [
    { header: 'Course Code *', key: 'courseCode', width: 16 },
    { header: 'Course Name *', key: 'courseName', width: 36 },
    { header: 'Course Duration (Years)', key: 'duration', width: 22 },
    { header: 'Batch (e.g. 2024-2027) *', key: 'batchName', width: 26 },
    { header: 'Start Year *', key: 'startYear', width: 14 },
    { header: 'End Year *', key: 'endYear', width: 14 },
    { header: 'Semester Number (1-8) *', key: 'semesterNumber', width: 24 },
    { header: 'Subject Code *', key: 'subjectCode', width: 18 },
    { header: 'Subject Name *', key: 'subjectName', width: 36 },
    { header: 'Credits', key: 'credits', width: 12 },
    { header: 'Subject Type (Theory/Practical)', key: 'type', width: 28 },
    { header: 'Max Marks', key: 'maxMarks', width: 14 },
  ];

  // Header Styling
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E3A8A' }, // Deep Blue
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 30;

  // Sample data: BCA 2024-2027 (Odd Semesters 1, 3, 5 & Even Semesters 2, 4, 6)
  const sampleRows = [
    // Semester 1 (Odd)
    { courseCode: 'BCA', courseName: 'Bachelor of Computer Applications', duration: 3, batchName: '2024-2027', startYear: 2024, endYear: 2027, semesterNumber: 1, subjectCode: 'BCA-101', subjectName: 'Discrete Mathematics', credits: 4, type: 'Theory', maxMarks: 100 },
    { courseCode: 'BCA', courseName: 'Bachelor of Computer Applications', duration: 3, batchName: '2024-2027', startYear: 2024, endYear: 2027, semesterNumber: 1, subjectCode: 'BCA-103', subjectName: 'Introduction to Programming in C', credits: 4, type: 'Theory', maxMarks: 100 },
    { courseCode: 'BCA', courseName: 'Bachelor of Computer Applications', duration: 3, batchName: '2024-2027', startYear: 2024, endYear: 2027, semesterNumber: 1, subjectCode: 'BCA-105', subjectName: 'Principles of Management', credits: 3, type: 'Theory', maxMarks: 100 },
    { courseCode: 'BCA', courseName: 'Bachelor of Computer Applications', duration: 3, batchName: '2024-2027', startYear: 2024, endYear: 2027, semesterNumber: 1, subjectCode: 'BCA-151', subjectName: 'Practical - C Programming Lab', credits: 2, type: 'Practical', maxMarks: 100 },
    
    // Semester 2 (Even)
    { courseCode: 'BCA', courseName: 'Bachelor of Computer Applications', duration: 3, batchName: '2024-2027', startYear: 2024, endYear: 2027, semesterNumber: 2, subjectCode: 'BCA-102', subjectName: 'Data Structures using C', credits: 4, type: 'Theory', maxMarks: 100 },
    { courseCode: 'BCA', courseName: 'Bachelor of Computer Applications', duration: 3, batchName: '2024-2027', startYear: 2024, endYear: 2027, semesterNumber: 2, subjectCode: 'BCA-104', subjectName: 'Database Management Systems', credits: 4, type: 'Theory', maxMarks: 100 },
    { courseCode: 'BCA', courseName: 'Bachelor of Computer Applications', duration: 3, batchName: '2024-2027', startYear: 2024, endYear: 2027, semesterNumber: 2, subjectCode: 'BCA-152', subjectName: 'Practical - Data Structures Lab', credits: 2, type: 'Practical', maxMarks: 100 },

    // Semester 3 (Odd)
    { courseCode: 'BCA', courseName: 'Bachelor of Computer Applications', duration: 3, batchName: '2024-2027', startYear: 2024, endYear: 2027, semesterNumber: 3, subjectCode: 'BCA-201', subjectName: 'Object Oriented Programming in Java', credits: 4, type: 'Theory', maxMarks: 100 },
    { courseCode: 'BCA', courseName: 'Bachelor of Computer Applications', duration: 3, batchName: '2024-2027', startYear: 2024, endYear: 2027, semesterNumber: 3, subjectCode: 'BCA-203', subjectName: 'Computer Networks', credits: 4, type: 'Theory', maxMarks: 100 },
    { courseCode: 'BCA', courseName: 'Bachelor of Computer Applications', duration: 3, batchName: '2024-2027', startYear: 2024, endYear: 2027, semesterNumber: 3, subjectCode: 'BCA-205', subjectName: 'Web Technologies (HTML, CSS, JS)', credits: 4, type: 'Theory', maxMarks: 100 },
    { courseCode: 'BCA', courseName: 'Bachelor of Computer Applications', duration: 3, batchName: '2024-2027', startYear: 2024, endYear: 2027, semesterNumber: 3, subjectCode: 'BCA-251', subjectName: 'Practical - Java Programming Lab', credits: 2, type: 'Practical', maxMarks: 100 },

    // Semester 4 (Even)
    { courseCode: 'BCA', courseName: 'Bachelor of Computer Applications', duration: 3, batchName: '2024-2027', startYear: 2024, endYear: 2027, semesterNumber: 4, subjectCode: 'BCA-202', subjectName: 'Operating Systems', credits: 4, type: 'Theory', maxMarks: 100 },
    { courseCode: 'BCA', courseName: 'Bachelor of Computer Applications', duration: 3, batchName: '2024-2027', startYear: 2024, endYear: 2027, semesterNumber: 4, subjectCode: 'BCA-204', subjectName: 'Software Engineering', credits: 4, type: 'Theory', maxMarks: 100 },
    { courseCode: 'BCA', courseName: 'Bachelor of Computer Applications', duration: 3, batchName: '2024-2027', startYear: 2024, endYear: 2027, semesterNumber: 4, subjectCode: 'BCA-252', subjectName: 'Practical - Web Development Lab', credits: 2, type: 'Practical', maxMarks: 100 },

    // Semester 5 (Odd)
    { courseCode: 'BCA', courseName: 'Bachelor of Computer Applications', duration: 3, batchName: '2024-2027', startYear: 2024, endYear: 2027, semesterNumber: 5, subjectCode: 'BCA-301', subjectName: 'Python Programming & Data Science', credits: 4, type: 'Theory', maxMarks: 100 },
    { courseCode: 'BCA', courseName: 'Bachelor of Computer Applications', duration: 3, batchName: '2024-2027', startYear: 2024, endYear: 2027, semesterNumber: 5, subjectCode: 'BCA-303', subjectName: 'Information Security & Cyber Law', credits: 4, type: 'Theory', maxMarks: 100 },
    { courseCode: 'BCA', courseName: 'Bachelor of Computer Applications', duration: 3, batchName: '2024-2027', startYear: 2024, endYear: 2027, semesterNumber: 5, subjectCode: 'BCA-305', subjectName: 'Cloud Computing & DevOps', credits: 3, type: 'Theory', maxMarks: 100 },
    { courseCode: 'BCA', courseName: 'Bachelor of Computer Applications', duration: 3, batchName: '2024-2027', startYear: 2024, endYear: 2027, semesterNumber: 5, subjectCode: 'BCA-351', subjectName: 'Minor Project Lab', credits: 3, type: 'Practical', maxMarks: 100 },

    // Semester 6 (Even)
    { courseCode: 'BCA', courseName: 'Bachelor of Computer Applications', duration: 3, batchName: '2024-2027', startYear: 2024, endYear: 2027, semesterNumber: 6, subjectCode: 'BCA-302', subjectName: 'Artificial Intelligence & Machine Learning', credits: 4, type: 'Theory', maxMarks: 100 },
    { courseCode: 'BCA', courseName: 'Bachelor of Computer Applications', duration: 3, batchName: '2024-2027', startYear: 2024, endYear: 2027, semesterNumber: 6, subjectCode: 'BCA-352', subjectName: 'Major Project / Dissertation', credits: 8, type: 'Practical', maxMarks: 200 },

    // BBA 2024-2027 (Odd Semesters 1, 3, 5 & Even Semesters 2, 4, 6)
    { courseCode: 'BBA', courseName: 'Bachelor of Business Administration', duration: 3, batchName: '2024-2027', startYear: 2024, endYear: 2027, semesterNumber: 1, subjectCode: 'BBA-101', subjectName: 'Management Principles & Practice', credits: 4, type: 'Theory', maxMarks: 100 },
    { courseCode: 'BBA', courseName: 'Bachelor of Business Administration', duration: 3, batchName: '2024-2027', startYear: 2024, endYear: 2027, semesterNumber: 1, subjectCode: 'BBA-103', subjectName: 'Financial Accounting', credits: 4, type: 'Theory', maxMarks: 100 },
    { courseCode: 'BBA', courseName: 'Bachelor of Business Administration', duration: 3, batchName: '2024-2027', startYear: 2024, endYear: 2027, semesterNumber: 2, subjectCode: 'BBA-102', subjectName: 'Organizational Behavior', credits: 4, type: 'Theory', maxMarks: 100 },
    { courseCode: 'BBA', courseName: 'Bachelor of Business Administration', duration: 3, batchName: '2024-2027', startYear: 2024, endYear: 2027, semesterNumber: 3, subjectCode: 'BBA-201', subjectName: 'Marketing Management', credits: 4, type: 'Theory', maxMarks: 100 },
    { courseCode: 'BBA', courseName: 'Bachelor of Business Administration', duration: 3, batchName: '2024-2027', startYear: 2024, endYear: 2027, semesterNumber: 3, subjectCode: 'BBA-203', subjectName: 'Business Environment', credits: 4, type: 'Theory', maxMarks: 100 },
    { courseCode: 'BBA', courseName: 'Bachelor of Business Administration', duration: 3, batchName: '2024-2027', startYear: 2024, endYear: 2027, semesterNumber: 4, subjectCode: 'BBA-202', subjectName: 'Human Resource Management', credits: 4, type: 'Theory', maxMarks: 100 },
    { courseCode: 'BBA', courseName: 'Bachelor of Business Administration', duration: 3, batchName: '2024-2027', startYear: 2024, endYear: 2027, semesterNumber: 5, subjectCode: 'BBA-301', subjectName: 'Strategic Management', credits: 4, type: 'Theory', maxMarks: 100 },
    { courseCode: 'BBA', courseName: 'Bachelor of Business Administration', duration: 3, batchName: '2024-2027', startYear: 2024, endYear: 2027, semesterNumber: 6, subjectCode: 'BBA-302', subjectName: 'Project Management & Viva', credits: 6, type: 'Practical', maxMarks: 100 },
  ];

  sampleRows.forEach((row) => sheet.addRow(row));

  // Add borders and light zebra striping
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.alignment = { vertical: 'middle' };
      if (rowNumber % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' }, // Very light slate
        };
      }
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });
    }
  });

  return workbook;
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Import Curriculum from Excel Buffer / File
 * ─────────────────────────────────────────────────────────────────────────────
 * Parses Excel worksheet and dynamically creates / links:
 * - Course (e.g. BCA, BBA)
 * - Batch (e.g. 2024-2027)
 * - Semester (e.g. Sem 1, Sem 2, etc.)
 * - Subject (e.g. BCA-101 Discrete Mathematics)
 */
export const importCurriculumFromExcel = async (buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new ApiError(400, 'Excel workbook is empty or contains no worksheets');
  }

  // Header detection
  const headerMap = {};
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    const text = String(cell.value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    if (text.includes('coursecode') || text === 'code') headerMap.courseCode = colNumber;
    else if (text.includes('coursename') || text === 'course') headerMap.courseName = colNumber;
    else if (text.includes('duration')) headerMap.duration = colNumber;
    else if (text.includes('batch')) headerMap.batchName = colNumber;
    else if (text.includes('startyear') || text === 'start') headerMap.startYear = colNumber;
    else if (text.includes('endyear') || text === 'end') headerMap.endYear = colNumber;
    else if (text.includes('semesternumber') || text.includes('semester') || text === 'sem') headerMap.semester = colNumber;
    else if (text.includes('subjectcode') || text === 'subcode') headerMap.subjectCode = colNumber;
    else if (text.includes('subjectname') || text === 'subname' || text === 'subject') headerMap.subjectName = colNumber;
    else if (text.includes('credit')) headerMap.credits = colNumber;
    else if (text.includes('type')) headerMap.type = colNumber;
    else if (text.includes('marks')) headerMap.maxMarks = colNumber;
  });

  // Fallback positional mappings if headers differed slightly
  if (!headerMap.courseCode) headerMap.courseCode = 1;
  if (!headerMap.courseName) headerMap.courseName = 2;
  if (!headerMap.batchName) headerMap.batchName = 4;
  if (!headerMap.semester) headerMap.semester = 7;
  if (!headerMap.subjectCode) headerMap.subjectCode = 8;
  if (!headerMap.subjectName) headerMap.subjectName = 9;

  let coursesCreated = 0;
  let batchesCreated = 0;
  let semestersCreated = 0;
  let subjectsCreated = 0;
  let subjectsUpdated = 0;
  let totalRows = 0;

  // Cache to reduce repeated DB queries
  const courseCache = {};
  const batchCache = {};
  const semesterCache = {};

  await sequelize.transaction(async (t) => {
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      const getVal = (col) => (col ? String(row.getCell(col).value || '').trim() : '');

      const courseCode = getVal(headerMap.courseCode).toUpperCase();
      const courseName = getVal(headerMap.courseName) || courseCode;
      const duration = parseInt(getVal(headerMap.duration) || '3', 10);
      let batchName = getVal(headerMap.batchName);
      let startYear = parseInt(getVal(headerMap.startYear), 10);
      let endYear = parseInt(getVal(headerMap.endYear), 10);
      let semNumStr = getVal(headerMap.semester);
      const subjectCode = getVal(headerMap.subjectCode).toUpperCase();
      const subjectName = getVal(headerMap.subjectName);
      const credits = parseInt(getVal(headerMap.credits) || '4', 10);
      const subjectType = getVal(headerMap.type) || 'Theory';

      if (!courseCode || !subjectCode || !subjectName) {
        continue; // Skip empty rows
      }

      totalRows++;

      // Parse batch if start/end years weren't individual columns
      if ((!startYear || !endYear) && batchName) {
        const parts = batchName.match(/\d{4}/g);
        if (parts && parts.length >= 2) {
          startYear = parseInt(parts[0], 10);
          endYear = parseInt(parts[1], 10);
        } else if (parts && parts.length === 1) {
          startYear = parseInt(parts[0], 10);
          endYear = startYear + duration;
        }
      }

      if (!startYear) startYear = new Date().getFullYear();
      if (!endYear) endYear = startYear + duration;
      if (!batchName) batchName = `${startYear}-${endYear}`;

      // Extract semester number (handles "1", "Sem 1", "Semester 1", etc.)
      const semMatch = semNumStr.match(/\d+/);
      const semesterNumber = semMatch ? parseInt(semMatch[0], 10) : 1;

      // 1. Get or Create Course
      let course = courseCache[courseCode];
      if (!course) {
        course = await Course.findOne({ where: { code: courseCode }, transaction: t });
        if (!course) {
          course = await Course.create(
            {
              code: courseCode,
              name: courseName,
              shortName: courseCode,
              duration,
              totalSemesters: duration * 2,
              isActive: true,
            },
            { transaction: t }
          );
          coursesCreated++;
        }
        courseCache[courseCode] = course;
      }

      // 2. Get or Create Batch
      const batchKey = `${course.id}_${batchName}`;
      let batch = batchCache[batchKey];
      if (!batch) {
        batch = await Batch.findOne({
          where: { courseId: course.id, name: batchName },
          transaction: t,
        });
        if (!batch) {
          batch = await Batch.create(
            {
              courseId: course.id,
              name: batchName,
              startYear,
              endYear,
              isActive: true,
            },
            { transaction: t }
          );
          batchesCreated++;
        }
        batchCache[batchKey] = batch;
      }

      // 3. Get or Create Semester
      const semKey = `${course.id}_${batch.id}_${semesterNumber}`;
      let semester = semesterCache[semKey];
      if (!semester) {
        semester = await Semester.findOne({
          where: {
            courseId: course.id,
            batchId: batch.id,
            number: semesterNumber,
          },
          transaction: t,
        });
        if (!semester) {
          semester = await Semester.create(
            {
              courseId: course.id,
              batchId: batch.id,
              number: semesterNumber,
              name: `Semester ${semesterNumber}`,
              isActive: true,
            },
            { transaction: t }
          );
          semestersCreated++;
        }
        semesterCache[semKey] = semester;
      }

      // 4. Create or Update Subject
      const existingSubject = await Subject.findOne({
        where: {
          code: subjectCode,
          courseId: course.id,
          semesterId: semester.id,
        },
        transaction: t,
      });

      if (existingSubject) {
        await existingSubject.update(
          {
            name: subjectName,
            credits,
            batchId: batch.id,
            isActive: true,
          },
          { transaction: t }
        );
        subjectsUpdated++;
      } else {
        await Subject.create(
          {
            courseId: course.id,
            batchId: batch.id,
            semesterId: semester.id,
            code: subjectCode,
            name: subjectName,
            credits,
            isActive: true,
          },
          { transaction: t }
        );
        subjectsCreated++;
      }
    }
  });

  logger.info(
    { totalRows, coursesCreated, batchesCreated, semestersCreated, subjectsCreated, subjectsUpdated },
    'Curriculum Excel import complete'
  );

  return {
    totalRows,
    coursesCreated,
    batchesCreated,
    semestersCreated,
    subjectsCreated,
    subjectsUpdated,
  };
};
