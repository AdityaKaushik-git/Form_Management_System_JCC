import { Sequelize } from 'sequelize';
import config from './index.js';
import logger from '../utils/logger.js';

const dbConfig = config.db;

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: 'mariadb',
    dialectOptions: dbConfig.dialectOptions || {},
    logging: dbConfig.logging === false
      ? false
      : (msg) => logger.debug(msg),
    pool: dbConfig.pool || {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
    },
  }
);

export { sequelize };
export default sequelize;
