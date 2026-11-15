import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const ApplicationSubject = sequelize.define('ApplicationSubject', {
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
    subjectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'subjects',
        key: 'id',
      },
    },
  }, {
    tableName: 'application_subjects',
    timestamps: true,
    updatedAt: false,
    underscored: true,
  });

  ApplicationSubject.associate = (models) => {
    ApplicationSubject.belongsTo(models.Application, { foreignKey: 'applicationId', as: 'application', onDelete: 'CASCADE' });
    ApplicationSubject.belongsTo(models.Subject, { foreignKey: 'subjectId', as: 'subject' });
  };

  return ApplicationSubject;
};
