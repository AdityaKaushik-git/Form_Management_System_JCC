import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const ApplicationStatusHistory = sequelize.define('ApplicationStatusHistory', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    applicationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'applications',
        key: 'id',
      },
    },
    previousStatus: {
      type: DataTypes.STRING,
    },
    newStatus: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    changedBy: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    remarks: {
      type: DataTypes.TEXT,
    },
  }, {
    tableName: 'application_status_history',
    timestamps: true,
    updatedAt: false,
    underscored: true,
  });

  ApplicationStatusHistory.associate = (models) => {
    ApplicationStatusHistory.belongsTo(models.Application, { foreignKey: 'applicationId', as: 'application', onDelete: 'CASCADE' });
    ApplicationStatusHistory.belongsTo(models.User, { foreignKey: 'changedBy', as: 'changedByUser' });
    ApplicationStatusHistory.belongsTo(models.User, { foreignKey: 'changedBy', as: 'changer' });
  };

  return ApplicationStatusHistory;
};
