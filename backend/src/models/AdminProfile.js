import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const AdminProfile = sequelize.define('AdminProfile', {
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
    designation: {
      type: DataTypes.STRING,
    },
    department: {
      type: DataTypes.STRING,
    },
    twoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    twoFactorSecret: {
      type: DataTypes.STRING,
    },
  }, {
    tableName: 'admin_profiles',
    timestamps: true,
    underscored: true,
  });

  AdminProfile.associate = (models) => {
    AdminProfile.belongsTo(models.User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
  };

  return AdminProfile;
};
