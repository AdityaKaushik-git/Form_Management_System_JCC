import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const ExaminationForm = sequelize.define('ExaminationForm', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    examName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    examSession: {
      type: DataTypes.STRING,
    },
    description: {
      type: DataTypes.TEXT,
    },
    instructions: {
      type: DataTypes.TEXT,
    },
    courseId: {
      type: DataTypes.UUID,
      references: {
        model: 'courses',
        key: 'id',
      },
    },
    batchId: {
      type: DataTypes.UUID,
      references: {
        model: 'batches',
        key: 'id',
      },
    },
    semesterId: {
      type: DataTypes.UUID,
      references: {
        model: 'semesters',
        key: 'id',
      },
    },
    examType: {
      type: DataTypes.STRING,
      defaultValue: 'reappear',
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
    },
    isPermanentActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isManuallyClosed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM('draft', 'upcoming', 'active', 'closed'),
      defaultValue: 'draft',
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    totalSubmissions: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    createdBy: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  }, {
    tableName: 'examination_forms',
    timestamps: true,
    underscored: true,
  });

  ExaminationForm.associate = (models) => {
    ExaminationForm.belongsTo(models.Course, { foreignKey: 'courseId', as: 'course' });
    ExaminationForm.belongsTo(models.Batch, { foreignKey: 'batchId', as: 'batch' });
    ExaminationForm.belongsTo(models.Semester, { foreignKey: 'semesterId', as: 'semester' });
    ExaminationForm.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    ExaminationForm.hasMany(models.ExaminationFormField, { foreignKey: 'formId', as: 'fields', onDelete: 'CASCADE' });
    ExaminationForm.hasMany(models.ExaminationFormSubject, { foreignKey: 'formId', as: 'formSubjects', onDelete: 'CASCADE' });
    ExaminationForm.hasMany(models.Application, { foreignKey: 'formId', as: 'applications' });
    ExaminationForm.hasMany(models.SheetConfiguration, { foreignKey: 'formId', as: 'sheetConfigurations', onDelete: 'CASCADE' });
  };

  return ExaminationForm;
};
