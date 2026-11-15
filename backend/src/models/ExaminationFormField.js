import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const ExaminationFormField = sequelize.define('ExaminationFormField', {
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
    fieldLabel: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fieldKey: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fieldType: {
      type: DataTypes.ENUM(
        'text', 'number', 'email', 'mobile', 'textarea',
        'dropdown', 'radio', 'checkbox', 'date', 'file',
        'subject_selection', 'info'
      ),
    },
    placeholder: {
      type: DataTypes.STRING,
    },
    description: {
      type: DataTypes.TEXT,
    },
    isRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    defaultValue: {
      type: DataTypes.STRING,
    },
    minLength: {
      type: DataTypes.INTEGER,
    },
    maxLength: {
      type: DataTypes.INTEGER,
    },
    minValue: {
      type: DataTypes.FLOAT,
    },
    maxValue: {
      type: DataTypes.FLOAT,
    },
    options: {
      type: DataTypes.JSON,
      comment: 'Options for dropdown/radio/checkbox fields',
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isVisible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isSyncEligible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'examination_form_fields',
    timestamps: true,
    underscored: true,
  });

  ExaminationFormField.associate = (models) => {
    ExaminationFormField.belongsTo(models.ExaminationForm, { foreignKey: 'formId', as: 'form', onDelete: 'CASCADE' });
    ExaminationFormField.hasMany(models.ApplicationFieldValue, { foreignKey: 'fieldId', as: 'fieldValues' });
  };

  return ExaminationFormField;
};
