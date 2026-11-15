import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Semester = sequelize.define('Semester', {
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
    number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 12,
      },
    },
    name: {
      type: DataTypes.STRING,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'semesters',
    timestamps: true,
    underscored: true,
  });

  Semester.associate = (models) => {
    Semester.belongsTo(models.Course, { foreignKey: 'courseId', as: 'course' });
    Semester.belongsTo(models.Batch, { foreignKey: 'batchId', as: 'batch' });
    Semester.hasMany(models.Subject, { foreignKey: 'semesterId', as: 'subjects' });
    Semester.hasMany(models.ExaminationForm, { foreignKey: 'semesterId', as: 'examinationForms' });
  };

  return Semester;
};
