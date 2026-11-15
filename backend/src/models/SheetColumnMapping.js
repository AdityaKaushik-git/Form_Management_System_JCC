import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const SheetColumnMapping = sequelize.define('SheetColumnMapping', {
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
    sheetHeader: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fieldSource: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Field key or special field like enrollmentNumber, fullName, etc.',
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  }, {
    tableName: 'sheet_column_mappings',
    timestamps: true,
    underscored: true,
  });

  SheetColumnMapping.associate = (models) => {
    SheetColumnMapping.belongsTo(models.SheetConfiguration, { foreignKey: 'sheetConfigId', as: 'sheetConfig', onDelete: 'CASCADE' });
  };

  return SheetColumnMapping;
};
