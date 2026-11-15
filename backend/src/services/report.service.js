import ExcelJS from 'exceljs';
import dayjs from 'dayjs';
import { Op } from 'sequelize';
import {
  Application,
  User,
  StudentProfile,
  ExaminationForm,
  Course,
  Batch,
  Semester,
  ApplicationSubject,
  Subject,
} from '../models/index.js';

export const getFilteredApplications = async (filters = {}) => {
  const where = {};
  if (filters.formId) where.formId = filters.formId;
  if (filters.status) where.status = filters.status;

  if (filters.startDate && filters.endDate) {
    where.submittedAt = {
      [Op.between]: [
        dayjs(filters.startDate).startOf('day').toDate(),
        dayjs(filters.endDate).endOf('day').toDate(),
      ],
    };
  }

  const apps = await Application.findAll({
    where,
    include: [
      {
        model: User,
        as: 'student',
        attributes: ['fullName', 'email'],
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
        include: ['course', 'semester', 'batch'],
      },
      {
        model: ApplicationSubject,
        as: 'applicationSubjects',
        include: [{ model: Subject, as: 'subject' }],
      },
    ],
    order: [['submittedAt', 'DESC']],
  });

  return apps.map((app) => {
    const profile = app.student?.studentProfile;
    const subjects = (app.applicationSubjects || [])
      .map((s) => `${s.subject?.name} (${s.subject?.code})`)
      .join('; ');

    return {
      referenceNumber: app.referenceNumber,
      enrollmentNumber: profile?.enrollmentNumber || 'N/A',
      studentName: app.student?.fullName || 'N/A',
      email: app.student?.email || 'N/A',
      mobile: profile?.mobile || 'N/A',
      course: app.form?.course?.name || profile?.course?.name || 'N/A',
      batch: app.form?.batch?.name || profile?.batch?.name || 'N/A',
      semester: app.form?.semester?.name || `Sem ${profile?.currentSemester || 'N/A'}`,
      examTitle: app.form?.title || 'N/A',
      subjects,
      status: app.status?.toUpperCase(),
      submittedAt: dayjs(app.submittedAt).format('YYYY-MM-DD HH:mm:ss'),
      remarks: app.remarks || '',
    };
  });
};

/**
 * Generates Excel (.xlsx) file and writes to response stream.
 */
export const exportReportExcel = async (filters, res) => {
  const data = await getFilteredApplications(filters);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'JCC Examination System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Reappear Submissions');

  // Columns definition
  worksheet.columns = [
    { header: 'Reference No', key: 'referenceNumber', width: 22 },
    { header: 'Enrollment No', key: 'enrollmentNumber', width: 18 },
    { header: 'Student Name', key: 'studentName', width: 24 },
    { header: 'Course', key: 'course', width: 25 },
    { header: 'Batch', key: 'batch', width: 16 },
    { header: 'Semester', key: 'semester', width: 14 },
    { header: 'Reappear Subjects', key: 'subjects', width: 35 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Mobile', key: 'mobile', width: 15 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Submission Date', key: 'submittedAt', width: 20 },
    { header: 'Remarks', key: 'remarks', width: 20 },
  ];

  // Header row styling
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF47B20' }, // JCC primary orange
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Add rows
  data.forEach((item) => {
    worksheet.addRow(item);
  });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="JCC-Reappear-Submissions-${dayjs().format('YYYYMMDD')}.xlsx"`
  );

  await workbook.xlsx.write(res);
  res.end();
};

/**
 * Generates CSV string and writes to response stream.
 */
export const exportReportCsv = async (filters, res) => {
  const data = await getFilteredApplications(filters);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="JCC-Reappear-Submissions-${dayjs().format('YYYYMMDD')}.csv"`
  );

  const headers = [
    'Reference No',
    'Enrollment No',
    'Student Name',
    'Course',
    'Batch',
    'Semester',
    'Reappear Subjects',
    'Status',
    'Mobile',
    'Email',
    'Submission Date',
    'Remarks',
  ];

  let csv = headers.join(',') + '\n';

  data.forEach((row) => {
    const line = [
      `"${row.referenceNumber}"`,
      `"${row.enrollmentNumber}"`,
      `"${row.studentName}"`,
      `"${row.course}"`,
      `"${row.batch}"`,
      `"${row.semester}"`,
      `"${row.subjects.replace(/"/g, '""')}"`,
      `"${row.status}"`,
      `"${row.mobile}"`,
      `"${row.email}"`,
      `"${row.submittedAt}"`,
      `"${row.remarks.replace(/"/g, '""')}"`,
    ].join(',');
    csv += line + '\n';
  });

  res.send(csv);
};
