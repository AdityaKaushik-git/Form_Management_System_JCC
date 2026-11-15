import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const StudentProfile = sequelize.define('StudentProfile', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    enrollmentNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    mobile: {
      type: DataTypes.STRING,
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
    currentSemester: {
      type: DataTypes.INTEGER,
    },
    fatherName: {
      type: DataTypes.STRING,
    },
    motherName: {
      type: DataTypes.STRING,
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
    },
    address: {
      type: DataTypes.TEXT,
    },
  }, {
    tableName: 'student_profiles',
    timestamps: true,
    underscored: true,
  });

  StudentProfile.associate = (models) => {
    StudentProfile.belongsTo(models.User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
    StudentProfile.belongsTo(models.Course, { foreignKey: 'courseId', as: 'course' });
    StudentProfile.belongsTo(models.Batch, { foreignKey: 'batchId', as: 'batch' });
  };

  return StudentProfile;
};
