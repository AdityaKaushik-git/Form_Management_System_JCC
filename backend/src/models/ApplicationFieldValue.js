import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const ApplicationFieldValue = sequelize.define('ApplicationFieldValue', {
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
    fieldId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'examination_form_fields',
        key: 'id',
      },
    },
    fieldKey: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    value: {
      type: DataTypes.TEXT,
    },
  }, {
    tableName: 'application_field_values',
    timestamps: true,
    updatedAt: false,
    underscored: true,
  });

  ApplicationFieldValue.associate = (models) => {
    ApplicationFieldValue.belongsTo(models.Application, { foreignKey: 'applicationId', as: 'application', onDelete: 'CASCADE' });
    ApplicationFieldValue.belongsTo(models.ExaminationFormField, { foreignKey: 'fieldId', as: 'field' });
  };

  return ApplicationFieldValue;
};
