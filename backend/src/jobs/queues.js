import { Queue } from 'bullmq';
import redis from '../config/redis.js';
import { getRedisStatus } from '../config/redis.js';
import logger from '../utils/logger.js';

const defaultOpts = {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};

let sheetsQueue = null;
let emailQueue = null;

if (redis && getRedisStatus !== false) {
  try {
    sheetsQueue = new Queue('sheets-sync', defaultOpts);
    emailQueue = new Queue('email', defaultOpts);
    logger.info('BullMQ queues initialized: sheets-sync, email');
  } catch (err) {
    logger.warn({ err: err.message }, 'BullMQ: failed to create queues, job processing disabled');
  }
} else {
  logger.warn('BullMQ: Redis not available, queues not created');
}

/**
 * Safely add a job to the sheets queue
 */
export async function addSheetsJob(name, data, opts = {}) {
  if (!sheetsQueue) {
    logger.warn({ name, data }, 'Sheets queue not available, job not added');
    return null;
  }
  return sheetsQueue.add(name, data, opts);
}

/**
 * Safely add a job to the email queue
 */
export async function addEmailJob(name, data, opts = {}) {
  if (!emailQueue) {
    logger.warn({ name, data }, 'Email queue not available, job not added');
    return null;
  }
  return emailQueue.add(name, data, opts);
}

export { sheetsQueue, emailQueue };
