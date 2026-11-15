'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('system_settings', [
      {
        id: uuidv4(),
        key: 'INSTITUTION_NAME',
        value: 'JCC, Rohini Sector 3, Delhi',
        description: 'College / Institute Name',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        key: 'SYSTEM_NAME',
        value: 'Reappear Examination Form Management System',
        description: 'Web Application Title',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        key: 'FOOTER_CREDIT',
        value: 'Designed by Aditya Kaushik',
        description: 'Official Designer Credit',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        key: 'SUPPORT_EMAIL',
        value: 'support@jcc.edu.in',
        description: 'Student support contact email',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('system_settings', null, {});
  },
};
