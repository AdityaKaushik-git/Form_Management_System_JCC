import { Sequelize } from 'sequelize';
import sequelize from '../config/sequelize.js';

// Import model definition functions
import defineUser from './User.js';
import defineStudentProfile from './StudentProfile.js';
import defineAdminProfile from './AdminProfile.js';
import defineRefreshToken from './RefreshToken.js';
import defineEmailVerificationToken from './EmailVerificationToken.js';
import definePasswordResetToken from './PasswordResetToken.js';
import defineCourse from './Course.js';
import defineBatch from './Batch.js';
import defineSemester from './Semester.js';
import defineSubject from './Subject.js';
import defineExaminationForm from './ExaminationForm.js';
import defineExaminationFormField from './ExaminationFormField.js';
import defineExaminationFormSubject from './ExaminationFormSubject.js';
import defineApplication from './Application.js';
import defineApplicationFieldValue from './ApplicationFieldValue.js';
import defineApplicationSubject from './ApplicationSubject.js';
import defineApplicationStatusHistory from './ApplicationStatusHistory.js';
import defineSheetConfiguration from './SheetConfiguration.js';
import defineSheetColumnMapping from './SheetColumnMapping.js';
import defineSheetSyncLog from './SheetSyncLog.js';
import defineAuditLog from './AuditLog.js';
import defineNotification from './Notification.js';
import defineSystemSetting from './SystemSetting.js';

// Initialize models
const models = {
  User: defineUser(sequelize),
  StudentProfile: defineStudentProfile(sequelize),
  AdminProfile: defineAdminProfile(sequelize),
  RefreshToken: defineRefreshToken(sequelize),
  EmailVerificationToken: defineEmailVerificationToken(sequelize),
  PasswordResetToken: definePasswordResetToken(sequelize),
  Course: defineCourse(sequelize),
  Batch: defineBatch(sequelize),
  Semester: defineSemester(sequelize),
  Subject: defineSubject(sequelize),
  ExaminationForm: defineExaminationForm(sequelize),
  ExaminationFormField: defineExaminationFormField(sequelize),
  ExaminationFormSubject: defineExaminationFormSubject(sequelize),
  Application: defineApplication(sequelize),
  ApplicationFieldValue: defineApplicationFieldValue(sequelize),
  ApplicationSubject: defineApplicationSubject(sequelize),
  ApplicationStatusHistory: defineApplicationStatusHistory(sequelize),
  SheetConfiguration: defineSheetConfiguration(sequelize),
  SheetColumnMapping: defineSheetColumnMapping(sequelize),
  SheetSyncLog: defineSheetSyncLog(sequelize),
  AuditLog: defineAuditLog(sequelize),
  Notification: defineNotification(sequelize),
  SystemSetting: defineSystemSetting(sequelize),
};

// Run associations
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

export const {
  User,
  StudentProfile,
  AdminProfile,
  RefreshToken,
  EmailVerificationToken,
  PasswordResetToken,
  Course,
  Batch,
  Semester,
  Subject,
  ExaminationForm,
  ExaminationFormField,
  ExaminationFormSubject,
  Application,
  ApplicationFieldValue,
  ApplicationSubject,
  ApplicationStatusHistory,
  SheetConfiguration,
  SheetColumnMapping,
  SheetSyncLog,
  AuditLog,
  Notification,
  SystemSetting,
} = models;

export { sequelize, Sequelize };
export default models;
