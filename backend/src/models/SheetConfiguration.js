import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const SheetConfiguration = sequelize.define('SheetConfiguration', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    formId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'examination_forms',
        key: 'id',
      },
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    spreadsheetId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    spreadsheetUrl: {
      type: DataTypes.STRING,
    },
    worksheetName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    worksheetId: {
      type: DataTypes.INTEGER,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    lastSyncAt: {
      type: DataTypes.DATE,
    },
    lastError: {
      type: DataTypes.TEXT,
    },
    totalSynced: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  }, {
    tableName: 'sheet_configurations',
    timestamps: true,
    underscored: true,
  });

  SheetConfiguration.associate = (models) => {
    SheetConfiguration.belongsTo(models.ExaminationForm, { foreignKey: 'formId', as: 'form', onDelete: 'CASCADE' });
    SheetConfiguration.hasMany(models.SheetColumnMapping, { foreignKey: 'sheetConfigId', as: 'columnMappings', onDelete: 'CASCADE' });
    SheetConfiguration.hasMany(models.SheetSyncLog, { foreignKey: 'sheetConfigId', as: 'syncLogs', onDelete: 'CASCADE' });
  };

  return SheetConfiguration;
};
