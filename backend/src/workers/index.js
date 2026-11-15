import 'dotenv/config';
import { Worker } from 'bullmq';
import redis from '../config/redis.js';
import sequelize from '../config/sequelize.js';
import '../models/index.js';
import logger from '../utils/logger.js';
import { syncApplicationToSheet, syncAllApplicationsForSheet } from '../services/sheets.service.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/emailService.js';

/**
 * ─── Sheets Sync Worker ──────────────────────────────────────
 * Processes Google Sheets background jobs asynchronously.
 */
async function processSheetsJob(job) {
  logger.info({ jobId: job.id, name: job.name, data: job.data }, 'Processing sheets job');

  switch (job.name) {
    case 'sync-application':
    case 'syncApplication':
      await syncApplicationToSheet(job.data.applicationId, job.data.sheetConfigId);
      break;

    case 'sync-all':
    case 'syncAllApplications':
      await syncAllApplicationsForSheet(job.data.sheetConfigId);
      break;

    default:
      logger.warn({ jobName: job.name }, 'Unknown sheets job name');
  }
}

/**
 * ─── Email Worker ────────────────────────────────────────────
 * Processes email sending jobs asynchronously.
 */
async function processEmailJob(job) {
  logger.info({ jobId: job.id, name: job.name }, 'Processing email job');

  switch (job.name) {
    case 'sendVerification':
      await sendVerificationEmail(job.data.email, job.data.token, job.data.name);
      break;
    case 'sendPasswordReset':
      await sendPasswordResetEmail(job.data.email, job.data.token, job.data.name);
      break;
    default:
      logger.warn({ jobName: job.name }, 'Unknown email job name');
  }
}

/**
 * ─── Bootstrap ───────────────────────────────────────────────
 */
async function start() {
  console.log('[Worker] Starting background worker process...');

  let dbReady = false;
  while (!dbReady) {
    try {
      await sequelize.authenticate();
      logger.info('Worker: database connection established');
      dbReady = true;
    } catch (err) {
      console.error('[WARN] Worker: Database connection failed:', err.message);
      console.error('Worker waiting 10 seconds before retrying database connection...');
      await new Promise(r => setTimeout(r, 10000));
    }
  }

  if (!redis) {
    console.warn('[WARN] Worker: Redis client not initialized or REDIS_URL not configured.');
    console.warn('Worker will idle until Redis is available.');
    // Idle loop to keep container alive and prevent restart storms
    setInterval(() => {
      if (redis) {
        logger.info('Worker: Redis became available, re-initializing...');
      }
    }, 30000);
    return;
  }

  const workerOpts = { connection: redis, concurrency: 5 };

  const sheetsWorker = new Worker('sheets-sync', processSheetsJob, workerOpts);
  const emailWorker = new Worker('email', processEmailJob, {
    ...workerOpts,
    concurrency: 3,
  });

  // Worker event listeners
  for (const [name, worker] of [['sheets-sync', sheetsWorker], ['email', emailWorker]]) {
    worker.on('completed', (job) => {
      logger.info({ queue: name, jobId: job.id, jobName: job.name }, 'Job completed');
    });

    worker.on('failed', (job, err) => {
      logger.error({ queue: name, jobId: job?.id, jobName: job?.name, err }, 'Job failed');
    });

    worker.on('error', (err) => {
      logger.error({ queue: name, err }, 'Worker error');
    });
  }

  logger.info('BullMQ workers running: sheets-sync, email');

  // ─── Graceful shutdown ──────────────────────────────────────
  const shutdown = async (signal) => {
    logger.info({ signal }, 'Worker: shutting down gracefully');
    try {
      await Promise.all([
        sheetsWorker.close(),
        emailWorker.close(),
      ]);
      await sequelize.close();
      logger.info('Worker: shutdown complete');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Worker: error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start();
