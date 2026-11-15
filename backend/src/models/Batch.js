import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Batch = sequelize.define('Batch', {
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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    startYear: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    endYear: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'batches',
    timestamps: true,
    underscored: true,
  });

  Batch.associate = (models) => {
    Batch.belongsTo(models.Course, { foreignKey: 'courseId', as: 'course' });
    Batch.hasMany(models.Semester, { foreignKey: 'batchId', as: 'semesters' });
    Batch.hasMany(models.Subject, { foreignKey: 'batchId', as: 'subjects' });
    Batch.hasMany(models.StudentProfile, { foreignKey: 'batchId', as: 'students' });
    Batch.hasMany(models.ExaminationForm, { foreignKey: 'batchId', as: 'examinationForms' });
  };

  return Batch;
};
