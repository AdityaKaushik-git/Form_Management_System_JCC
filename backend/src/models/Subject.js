import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Subject = sequelize.define('Subject', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    courseId: {
      type: DataTypes.UUID,
      allowNull: false,
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
      allowNull: false,
      references: {
        model: 'semesters',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    credits: {
      type: DataTypes.INTEGER,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'subjects',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['code', 'batch_id'],
        name: 'subjects_code_batch_unique',
      },
    ],
  });

  Subject.associate = (models) => {
    Subject.belongsTo(models.Course, { foreignKey: 'courseId', as: 'course' });
    Subject.belongsTo(models.Batch, { foreignKey: 'batchId', as: 'batch' });
    Subject.belongsTo(models.Semester, { foreignKey: 'semesterId', as: 'semester' });
    Subject.hasMany(models.ExaminationFormSubject, { foreignKey: 'subjectId', as: 'formSubjects' });
    Subject.hasMany(models.ApplicationSubject, { foreignKey: 'subjectId', as: 'applicationSubjects' });
  };

  return Subject;
};
