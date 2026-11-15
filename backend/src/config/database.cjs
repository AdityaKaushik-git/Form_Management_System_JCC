require('dotenv').config();

const dbUrl = process.env.DATABASE_URL || process.env.MARIADB_URL || process.env.MYSQL_URL;
const isSsl = process.env.DATABASE_SSL === 'true' ||
              process.env.DATABASE_SSL === '1' ||
              (dbUrl && (dbUrl.includes('ssl-mode=REQUIRED') || dbUrl.includes('sslmode=require')));

const prodDialect = process.env.DATABASE_DIALECT || (
  (dbUrl && dbUrl.startsWith('mysql:')) ||
  (process.env.DATABASE_HOST && process.env.DATABASE_HOST.toLowerCase().includes('mysql'))
    ? 'mysql'
    : 'mariadb'
);

module.exports = {
  development: {
    username: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'jcc_reappear_exam',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '3306'),
    dialect: process.env.DATABASE_DIALECT || 'mariadb',
    dialectOptions: {
      timezone: '+05:30',
    },
    logging: console.log,
  },
  test: {
    username: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'jcc_reappear_exam_test',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '3306'),
    dialect: process.env.DATABASE_DIALECT || 'mariadb',
    logging: false,
  },
  production: {
    use_env_variable: process.env.DATABASE_URL ? 'DATABASE_URL' : (process.env.MARIADB_URL ? 'MARIADB_URL' : undefined),
    url: dbUrl,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '3306'),
    dialect: prodDialect,
    dialectOptions: {
      ssl: isSsl ? { rejectUnauthorized: false } : false,
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
