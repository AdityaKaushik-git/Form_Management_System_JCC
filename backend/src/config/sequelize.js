import { Sequelize } from 'sequelize';
import config from './index.js';
import logger from '../utils/logger.js';

const dbConfig = config.db || {};
const dbUrl = process.env.DATABASE_URL || process.env.MARIADB_URL || dbConfig.url;
const isSsl = process.env.DATABASE_SSL === 'true' || process.env.DATABASE_SSL === '1';

const commonOptions = {
  dialect: 'mariadb',
  dialectOptions: {
    timezone: 'Asia/Kolkata',
    ...(isSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    ...(dbConfig.dialectOptions || {}),
  },
  logging: dbConfig.logging === false
    ? false
    : (msg) => logger.debug(msg),
  pool: dbConfig.pool || {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
  },
};

const sequelize = dbUrl
  ? new Sequelize(dbUrl, commonOptions)
  : new Sequelize(
      dbConfig.database || 'jcc_reappear_exam',
      dbConfig.username || 'root',
      dbConfig.password || '',
      {
        host: dbConfig.host || 'localhost',
        port: dbConfig.port || 3306,
        ...commonOptions,
      }
    );

export { sequelize };
export default sequelize;
