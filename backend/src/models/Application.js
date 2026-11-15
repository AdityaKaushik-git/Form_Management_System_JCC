import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Application = sequelize.define('Application', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    referenceNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Format: JCC-RE-YYYYMMDD-XXXXX',
    },
    formId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'examination_forms',
        key: 'id',
      },
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('submitted', 'under_review', 'approved', 'rejected', 'correction_required'),
      defaultValue: 'submitted',
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    reviewedBy: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    reviewedAt: {
      type: DataTypes.DATE,
    },
    remarks: {
      type: DataTypes.TEXT,
    },
  }, {
    tableName: 'applications',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['form_id', 'student_id'],
        name: 'applications_form_student_unique',
      },
    ],
  });

  Application.associate = (models) => {
    Application.belongsTo(models.ExaminationForm, { foreignKey: 'formId', as: 'form' });
    Application.belongsTo(models.User, { foreignKey: 'studentId', as: 'student' });
    Application.belongsTo(models.User, { foreignKey: 'reviewedBy', as: 'reviewer' });
    Application.hasMany(models.ApplicationFieldValue, { foreignKey: 'applicationId', as: 'fieldValues', onDelete: 'CASCADE' });
    Application.hasMany(models.ApplicationSubject, { foreignKey: 'applicationId', as: 'subjects', onDelete: 'CASCADE' });
    Application.hasMany(models.ApplicationSubject, { foreignKey: 'applicationId', as: 'applicationSubjects', onDelete: 'CASCADE' });
    Application.hasMany(models.ApplicationStatusHistory, { foreignKey: 'applicationId', as: 'statusHistory', onDelete: 'CASCADE' });
    Application.hasMany(models.SheetSyncLog, { foreignKey: 'applicationId', as: 'syncLogs' });
  };

  return Application;
};
