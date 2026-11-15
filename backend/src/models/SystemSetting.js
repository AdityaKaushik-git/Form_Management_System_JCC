import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const SystemSetting = sequelize.define('SystemSetting', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  }, {
    tableName: 'system_settings',
    timestamps: true,
    underscored: true,
  });

  SystemSetting.associate = (models) => {
    SystemSetting.belongsTo(models.User, { foreignKey: 'updatedBy', as: 'updater' });
  };

  return SystemSetting;
};
