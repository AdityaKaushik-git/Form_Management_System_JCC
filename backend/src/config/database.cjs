require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'jcc_reappear_exam',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '3306'),
    dialect: 'mariadb',
    dialectOptions: {
      timezone: 'Asia/Kolkata',
    },
    logging: console.log,
  },
  test: {
    username: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'jcc_reappear_exam_test',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '3306'),
    dialect: 'mariadb',
    logging: false,
  },
  production: {
    use_env_variable: process.env.DATABASE_URL ? 'DATABASE_URL' : (process.env.MARIADB_URL ? 'MARIADB_URL' : undefined),
    url: process.env.DATABASE_URL || process.env.MARIADB_URL,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '3306'),
    dialect: 'mariadb',
    dialectOptions: {
      timezone: 'Asia/Kolkata',
      ssl: (process.env.DATABASE_SSL === 'true' || process.env.DATABASE_SSL === '1') ? { rejectUnauthorized: false } : false,
    },
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
};
