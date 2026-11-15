import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const ExaminationFormSubject = sequelize.define('ExaminationFormSubject', {
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
    subjectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'subjects',
        key: 'id',
      },
    },
  }, {
    tableName: 'examination_form_subjects',
    timestamps: true,
    updatedAt: false,
    underscored: true,
  });

  ExaminationFormSubject.associate = (models) => {
    ExaminationFormSubject.belongsTo(models.ExaminationForm, { foreignKey: 'formId', as: 'form', onDelete: 'CASCADE' });
    ExaminationFormSubject.belongsTo(models.Subject, { foreignKey: 'subjectId', as: 'subject', onDelete: 'CASCADE' });
  };

  return ExaminationFormSubject;
};
