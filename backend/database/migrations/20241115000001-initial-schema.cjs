'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. users
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      role: {
        type: Sequelize.ENUM('student', 'admin'),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      full_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      is_email_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      last_login_at: {
        type: Sequelize.DATE,
      },
      failed_login_attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      locked_until: {
        type: Sequelize.DATE,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 2. courses
    await queryInterface.createTable('courses', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      short_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      duration: {
        type: Sequelize.INTEGER,
      },
      total_semesters: {
        type: Sequelize.INTEGER,
      },
      description: {
        type: Sequelize.TEXT,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 3. batches
    await queryInterface.createTable('batches', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      course_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'courses', key: 'id' },
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      start_year: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      end_year: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 4. semesters
    await queryInterface.createTable('semesters', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      course_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'courses', key: 'id' },
        onDelete: 'CASCADE',
      },
      batch_id: {
        type: Sequelize.UUID,
        references: { model: 'batches', key: 'id' },
        onDelete: 'SET NULL',
      },
      number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 5. subjects
    await queryInterface.createTable('subjects', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      course_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'courses', key: 'id' },
        onDelete: 'CASCADE',
      },
      batch_id: {
        type: Sequelize.UUID,
        references: { model: 'batches', key: 'id' },
        onDelete: 'SET NULL',
      },
      semester_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'semesters', key: 'id' },
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      credits: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 6. student_profiles
    await queryInterface.createTable('student_profiles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      enrollment_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      mobile: {
        type: Sequelize.STRING,
      },
      course_id: {
        type: Sequelize.UUID,
        references: { model: 'courses', key: 'id' },
        onDelete: 'SET NULL',
      },
      batch_id: {
        type: Sequelize.UUID,
        references: { model: 'batches', key: 'id' },
        onDelete: 'SET NULL',
      },
      current_semester: {
        type: Sequelize.INTEGER,
      },
      father_name: {
        type: Sequelize.STRING,
      },
      mother_name: {
        type: Sequelize.STRING,
      },
      date_of_birth: {
        type: Sequelize.DATEONLY,
      },
      address: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 7. admin_profiles
    await queryInterface.createTable('admin_profiles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      designation: {
        type: Sequelize.STRING,
      },
      department: {
        type: Sequelize.STRING,
      },
      two_factor_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      two_factor_secret: {
        type: Sequelize.STRING,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 8. refresh_tokens
    await queryInterface.createTable('refresh_tokens', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      token: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      is_revoked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      user_agent: {
        type: Sequelize.STRING,
      },
      ip_address: {
        type: Sequelize.STRING,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 9. email_verification_tokens
    await queryInterface.createTable('email_verification_tokens', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      token: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      is_used: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 10. password_reset_tokens
    await queryInterface.createTable('password_reset_tokens', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      token: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      is_used: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 11. examination_forms
    await queryInterface.createTable('examination_forms', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      exam_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      exam_session: {
        type: Sequelize.STRING,
      },
      description: {
        type: Sequelize.TEXT,
      },
      instructions: {
        type: Sequelize.TEXT,
      },
      course_id: {
        type: Sequelize.UUID,
        references: { model: 'courses', key: 'id' },
        onDelete: 'SET NULL',
      },
      batch_id: {
        type: Sequelize.UUID,
        references: { model: 'batches', key: 'id' },
        onDelete: 'SET NULL',
      },
      semester_id: {
        type: Sequelize.UUID,
        references: { model: 'semesters', key: 'id' },
        onDelete: 'SET NULL',
      },
      exam_type: {
        type: Sequelize.STRING,
        defaultValue: 'reappear',
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATE,
      },
      is_permanent_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      is_published: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      is_manually_closed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      status: {
        type: Sequelize.ENUM('draft', 'upcoming', 'active', 'closed'),
        defaultValue: 'draft',
      },
      version: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      total_submissions: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      created_by: {
        type: Sequelize.UUID,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 12. examination_form_fields
    await queryInterface.createTable('examination_form_fields', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      form_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'examination_forms', key: 'id' },
        onDelete: 'CASCADE',
      },
      field_label: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      field_key: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      field_type: {
        type: Sequelize.ENUM(
          'text',
          'number',
          'email',
          'mobile',
          'textarea',
          'dropdown',
          'radio',
          'checkbox',
          'date',
          'file',
          'subject_selection',
          'info'
        ),
        allowNull: false,
      },
      placeholder: {
        type: Sequelize.STRING,
      },
      description: {
        type: Sequelize.TEXT,
      },
      is_required: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      default_value: {
        type: Sequelize.STRING,
      },
      min_length: {
        type: Sequelize.INTEGER,
      },
      max_length: {
        type: Sequelize.INTEGER,
      },
      min_value: {
        type: Sequelize.FLOAT,
      },
      max_value: {
        type: Sequelize.FLOAT,
      },
      options: {
        type: Sequelize.JSON,
      },
      display_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      is_visible: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      is_sync_eligible: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 13. examination_form_subjects
    await queryInterface.createTable('examination_form_subjects', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      form_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'examination_forms', key: 'id' },
        onDelete: 'CASCADE',
      },
      subject_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'subjects', key: 'id' },
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 14. applications
    await queryInterface.createTable('applications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      reference_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      form_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'examination_forms', key: 'id' },
        onDelete: 'CASCADE',
      },
      student_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('submitted', 'under_review', 'approved', 'rejected', 'correction_required'),
        defaultValue: 'submitted',
      },
      submitted_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      reviewed_by: {
        type: Sequelize.UUID,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      reviewed_at: {
        type: Sequelize.DATE,
      },
      remarks: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Prevent duplicate application per student per form
    await queryInterface.addIndex('applications', ['form_id', 'student_id'], {
      unique: true,
      name: 'unique_student_form_application',
    });

    // 15. application_field_values
    await queryInterface.createTable('application_field_values', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      application_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'applications', key: 'id' },
        onDelete: 'CASCADE',
      },
      field_id: {
        type: Sequelize.UUID,
        references: { model: 'examination_form_fields', key: 'id' },
        onDelete: 'SET NULL',
      },
      field_key: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      value: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 16. application_subjects
    await queryInterface.createTable('application_subjects', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      application_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'applications', key: 'id' },
        onDelete: 'CASCADE',
      },
      subject_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'subjects', key: 'id' },
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 17. application_status_history
    await queryInterface.createTable('application_status_history', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      application_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'applications', key: 'id' },
        onDelete: 'CASCADE',
      },
      previous_status: {
        type: Sequelize.STRING,
      },
      new_status: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      changed_by: {
        type: Sequelize.UUID,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      remarks: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 18. sheet_configurations
    await queryInterface.createTable('sheet_configurations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      form_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'examination_forms', key: 'id' },
        onDelete: 'CASCADE',
      },
      display_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      spreadsheet_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      spreadsheet_url: {
        type: Sequelize.STRING,
      },
      worksheet_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      worksheet_id: {
        type: Sequelize.INTEGER,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      last_sync_at: {
        type: Sequelize.DATE,
      },
      last_error: {
        type: Sequelize.TEXT,
      },
      total_synced: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 19. sheet_column_mappings
    await queryInterface.createTable('sheet_column_mappings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      sheet_config_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'sheet_configurations', key: 'id' },
        onDelete: 'CASCADE',
      },
      sheet_header: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      field_source: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      display_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 20. sheet_sync_logs
    await queryInterface.createTable('sheet_sync_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      sheet_config_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'sheet_configurations', key: 'id' },
        onDelete: 'CASCADE',
      },
      application_id: {
        type: Sequelize.UUID,
        references: { model: 'applications', key: 'id' },
        onDelete: 'SET NULL',
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'success', 'failed'),
        defaultValue: 'pending',
      },
      row_number: {
        type: Sequelize.INTEGER,
      },
      error_message: {
        type: Sequelize.TEXT,
      },
      attempt_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      processed_at: {
        type: Sequelize.DATE,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 21. audit_logs
    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      action: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      entity: {
        type: Sequelize.STRING,
      },
      entity_id: {
        type: Sequelize.STRING,
      },
      details: {
        type: Sequelize.JSON,
      },
      ip_address: {
        type: Sequelize.STRING,
      },
      user_agent: {
        type: Sequelize.STRING,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 22. notifications
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      data: {
        type: Sequelize.JSON,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 23. system_settings
    await queryInterface.createTable('system_settings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      key: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      value: {
        type: Sequelize.TEXT,
      },
      description: {
        type: Sequelize.STRING,
      },
      updated_by: {
        type: Sequelize.UUID,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('system_settings');
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('audit_logs');
    await queryInterface.dropTable('sheet_sync_logs');
    await queryInterface.dropTable('sheet_column_mappings');
    await queryInterface.dropTable('sheet_configurations');
    await queryInterface.dropTable('application_status_history');
    await queryInterface.dropTable('application_subjects');
    await queryInterface.dropTable('application_field_values');
    await queryInterface.dropTable('applications');
    await queryInterface.dropTable('examination_form_subjects');
    await queryInterface.dropTable('examination_form_fields');
    await queryInterface.dropTable('examination_forms');
    await queryInterface.dropTable('password_reset_tokens');
    await queryInterface.dropTable('email_verification_tokens');
    await queryInterface.dropTable('refresh_tokens');
    await queryInterface.dropTable('admin_profiles');
    await queryInterface.dropTable('student_profiles');
    await queryInterface.dropTable('subjects');
    await queryInterface.dropTable('semesters');
    await queryInterface.dropTable('batches');
    await queryInterface.dropTable('courses');
    await queryInterface.dropTable('users');
  },
};
