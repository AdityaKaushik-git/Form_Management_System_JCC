import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const SheetSyncLog = sequelize.define('SheetSyncLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    sheetConfigId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'sheet_configurations',
        key: 'id',
      },
    },
    applicationId: {
      type: DataTypes.UUID,
      references: {
        model: 'applications',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'success', 'failed'),
      defaultValue: 'pending',
    },
    rowNumber: {
      type: DataTypes.INTEGER,
    },
    errorMessage: {
      type: DataTypes.TEXT,
    },
    attemptCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    processedAt: {
      type: DataTypes.DATE,
    },
  }, {
    tableName: 'sheet_sync_logs',
    timestamps: true,
    updatedAt: false,
    underscored: true,
  });

  SheetSyncLog.associate = (models) => {
    SheetSyncLog.belongsTo(models.SheetConfiguration, { foreignKey: 'sheetConfigId', as: 'sheetConfig', onDelete: 'CASCADE' });
    SheetSyncLog.belongsTo(models.SheetConfiguration, { foreignKey: 'sheetConfigId', as: 'sheetConfiguration', onDelete: 'CASCADE' });
    SheetSyncLog.belongsTo(models.Application, { foreignKey: 'applicationId', as: 'application', onDelete: 'SET NULL' });
  };

  return SheetSyncLog;
};
