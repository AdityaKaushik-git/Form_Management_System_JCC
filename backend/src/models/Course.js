import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Course = sequelize.define('Course', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shortName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    duration: {
      type: DataTypes.INTEGER,
      comment: 'Duration in years',
    },
    totalSemesters: {
      type: DataTypes.INTEGER,
    },
    description: {
      type: DataTypes.TEXT,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'courses',
    timestamps: true,
    underscored: true,
  });

  Course.associate = (models) => {
    Course.hasMany(models.Batch, { foreignKey: 'courseId', as: 'batches' });
    Course.hasMany(models.Semester, { foreignKey: 'courseId', as: 'semesters' });
    Course.hasMany(models.Subject, { foreignKey: 'courseId', as: 'subjects' });
    Course.hasMany(models.StudentProfile, { foreignKey: 'courseId', as: 'students' });
    Course.hasMany(models.ExaminationForm, { foreignKey: 'courseId', as: 'examinationForms' });
  };

  return Course;
};
