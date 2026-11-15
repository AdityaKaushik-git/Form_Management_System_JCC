import dayjs from 'dayjs';
import { Op, fn, col, literal } from 'sequelize';
import {
  User,
  StudentProfile,
  ExaminationForm,
  Application,
  SheetConfiguration,
  SheetSyncLog,
  Course,
  Semester,
  AuditLog,
  sequelize,
} from '../models/index.js';
import { computeFormStatus } from './form.service.js';

export const getAdminDashboardStats = async () => {
  const todayStart = dayjs().startOf('day').toDate();

  // 1. Total students
  const totalStudents = await User.count({ where: { role: 'student' } });

  // 2. All examination forms & statuses
  const allForms = await ExaminationForm.findAll();
  let totalForms = allForms.length;
  let activeForms = 0;
  let upcomingForms = 0;
  let closedForms = 0;

  allForms.forEach((form) => {
    const status = computeFormStatus(form);
    if (status === 'active') activeForms++;
    else if (status === 'upcoming') upcomingForms++;
    else if (status === 'closed') closedForms++;
  });

  // 3. Applications counts
  const totalApplications = await Application.count();
  const pendingApplications = await Application.count({
    where: {
      status: {
        [Op.in]: ['submitted', 'under_review', 'correction_required'],
      },
    },
  });
  const todaySubmissions = await Application.count({
    where: {
      submittedAt: {
        [Op.gte]: todayStart,
      },
    },
  });

  // 4. Google Sheets synchronization status
  const sheetConfigs = await SheetConfiguration.findAll();
  const totalSheetsConnected = sheetConfigs.length;
  const totalRecordsSynced = sheetConfigs.reduce((acc, s) => acc + (s.totalSynced || 0), 0);
  const failedSyncCount = await SheetSyncLog.count({ where: { status: 'failed' } });

  return {
    students: {
      total: totalStudents,
    },
    forms: {
      total: totalForms,
      active: activeForms,
      upcoming: upcomingForms,
      closed: closedForms,
    },
    applications: {
      total: totalApplications,
      pending: pendingApplications,
      today: todaySubmissions,
    },
    sheets: {
      totalConnected: totalSheetsConnected,
      totalSynced: totalRecordsSynced,
      failedSyncs: failedSyncCount,
    },
  };
};

export const getDashboardChartsData = async () => {
  // 1. Daily submissions (last 14 days)
  const fourteenDaysAgo = dayjs().subtract(13, 'day').startOf('day').toDate();
  const dailyApps = await Application.findAll({
    where: {
      submittedAt: {
        [Op.gte]: fourteenDaysAgo,
      },
    },
    attributes: ['submittedAt'],
    order: [['submittedAt', 'ASC']],
  });

  const dayMap = {};
  for (let i = 13; i >= 0; i--) {
    const d = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
    dayMap[d] = 0;
  }
  dailyApps.forEach((a) => {
    const d = dayjs(a.submittedAt).format('YYYY-MM-DD');
    if (dayMap[d] !== undefined) dayMap[d]++;
  });

  const dailyTrends = Object.entries(dayMap).map(([date, count]) => ({
    date: dayjs(date).format('DD MMM'),
    submissions: count,
  }));

  // 2. Course-wise submissions
  const courseWise = await Application.findAll({
    include: [
      {
        model: ExaminationForm,
        as: 'form',
        include: [{ model: Course, as: 'course', attributes: ['shortName', 'name'] }],
      },
    ],
  });

  const courseCountMap = {};
  courseWise.forEach((app) => {
    const courseName = app.form?.course?.shortName || 'Other';
    courseCountMap[courseName] = (courseCountMap[courseName] || 0) + 1;
  });

  const courseSubmissions = Object.entries(courseCountMap).map(([name, value]) => ({
    name,
    submissions: value,
  }));

  // 3. Status-wise distribution
  const statusCounts = await Application.findAll({
    attributes: ['status', [fn('COUNT', col('id')), 'count']],
    group: ['status'],
    raw: true,
  });

  const statusDistribution = statusCounts.map((s) => ({
    status: s.status,
    count: parseInt(s.count, 10),
  }));

  return {
    dailyTrends,
    courseSubmissions,
    statusDistribution,
  };
};

export const getRecentActivityFeed = async (limit = 15) => {
  // Recent student registrations
  const recentStudents = await User.findAll({
    where: { role: 'student' },
    attributes: ['id', 'fullName', 'email', 'createdAt'],
    include: [{ model: StudentProfile, as: 'studentProfile', attributes: ['enrollmentNumber'] }],
    order: [['createdAt', 'DESC']],
    limit: 5,
  });

  // Recent applications
  const recentApps = await Application.findAll({
    attributes: ['id', 'referenceNumber', 'status', 'submittedAt'],
    include: [
      { model: User, as: 'student', attributes: ['fullName'] },
      { model: ExaminationForm, as: 'form', attributes: ['title'] },
    ],
    order: [['submittedAt', 'DESC']],
    limit: 5,
  });

  // Recent sync events
  const recentSyncs = await SheetSyncLog.findAll({
    attributes: ['id', 'status', 'errorMessage', 'createdAt'],
    include: [
      { model: SheetConfiguration, as: 'sheetConfiguration', attributes: ['displayName'] },
      { model: Application, as: 'application', attributes: ['referenceNumber'] },
    ],
    order: [['createdAt', 'DESC']],
    limit: 5,
  });

  const activities = [];

  recentStudents.forEach((s) => {
    activities.push({
      id: `reg-${s.id}`,
      type: 'registration',
      title: 'New Student Registered',
      description: `${s.fullName} (${s.studentProfile?.enrollmentNumber || s.email}) registered`,
      timestamp: s.createdAt,
    });
  });

  recentApps.forEach((a) => {
    activities.push({
      id: `app-${a.id}`,
      type: 'submission',
      title: 'Application Submitted',
      description: `${a.student?.fullName || 'Student'} applied for "${a.form?.title}" [${a.referenceNumber}]`,
      timestamp: a.submittedAt,
    });
  });

  recentSyncs.forEach((sc) => {
    activities.push({
      id: `sync-${sc.id}`,
      type: sc.status === 'success' ? 'sync_success' : 'sync_failed',
      title: sc.status === 'success' ? 'Google Sheet Synced' : 'Google Sheet Sync Failed',
      description: sc.status === 'success'
        ? `Synced ${sc.application?.referenceNumber || ''} to ${sc.sheetConfiguration?.displayName || 'Sheet'}`
        : `Failed syncing to ${sc.sheetConfiguration?.displayName}: ${sc.errorMessage || 'Unknown error'}`,
      timestamp: sc.createdAt,
    });
  });

  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return activities.slice(0, limit);
};

export const getStudentDashboardStats = async (studentUserId) => {
  const profile = await StudentProfile.findOne({
    where: { userId: studentUserId },
    include: ['course', 'batch'],
  });

  const myApplications = await Application.findAll({
    where: { studentId: studentUserId },
    include: [
      { model: ExaminationForm, as: 'form', attributes: ['title', 'examName', 'examSession'] },
    ],
    order: [['submittedAt', 'DESC']],
  });

  const forms = await ExaminationForm.findAll({
    where: { isPublished: true },
  });

  let activeFormsCount = 0;
  forms.forEach((f) => {
    if (computeFormStatus(f) === 'active') activeFormsCount++;
  });

  return {
    studentProfile: profile,
    totalApplications: myApplications.length,
    activeFormsCount,
    recentApplications: myApplications.slice(0, 5),
  };
};
