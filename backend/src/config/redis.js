import Redis from 'ioredis';
import config from './index.js';
import logger from '../utils/logger.js';

let redis = null;
let isRedisAvailable = false;

if (config.env === 'production' && !process.env.REDIS_URL) {
  logger.info('Redis: REDIS_URL not provided. Async jobs will run in-process without BullMQ queue.');
} else {
  try {
    redis = new Redis(config.redis.url, {
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: true,
      retryStrategy(times) {
        if (times > 3) {
          logger.warn('Redis: max reconnection attempts reached, stopping retries');
          return null; // Stop retrying
        }
        const delay = Math.min(times * 500, 2000);
        logger.info(`Redis: reconnecting in ${delay}ms (attempt ${times})`);
        return delay;
      },
    });

    redis.on('connect', () => {
      logger.info('Redis: connected successfully');
      isRedisAvailable = true;
    });

    redis.on('ready', () => {
      logger.info('Redis: ready to accept commands');
      isRedisAvailable = true;
    });

    redis.on('error', (err) => {
      isRedisAvailable = false;
      logger.warn({ err: err.message }, 'Redis: connection error');
    });

    redis.on('close', () => {
      isRedisAvailable = false;
      logger.warn('Redis: connection closed');
    });
  } catch (err) {
    logger.warn({ err: err.message }, 'Redis: failed to initialize client');
    redis = null;
  }
}

export function getRedisStatus() {
  return isRedisAvailable;
}

export default redis;
