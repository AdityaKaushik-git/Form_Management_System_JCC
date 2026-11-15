import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    role: {
      type: DataTypes.ENUM('student', 'admin'),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
    },
    failedLoginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    lockedUntil: {
      type: DataTypes.DATE,
    },
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
  });

  User.associate = (models) => {
    User.hasOne(models.StudentProfile, { foreignKey: 'userId', as: 'studentProfile', onDelete: 'CASCADE' });
    User.hasOne(models.AdminProfile, { foreignKey: 'userId', as: 'adminProfile', onDelete: 'CASCADE' });
    User.hasMany(models.RefreshToken, { foreignKey: 'userId', as: 'refreshTokens', onDelete: 'CASCADE' });
    User.hasMany(models.EmailVerificationToken, { foreignKey: 'userId', as: 'emailVerificationTokens', onDelete: 'CASCADE' });
    User.hasMany(models.PasswordResetToken, { foreignKey: 'userId', as: 'passwordResetTokens', onDelete: 'CASCADE' });
    User.hasMany(models.Application, { foreignKey: 'studentId', as: 'applications' });
    User.hasMany(models.AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
    User.hasMany(models.Notification, { foreignKey: 'userId', as: 'notifications', onDelete: 'CASCADE' });
  };

  return User;
};
