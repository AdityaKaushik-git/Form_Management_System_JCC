import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import helmet from 'helmet';
import hpp from 'hpp';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import config from './config/index.js';
import logger from './utils/logger.js';
import sequelize from './config/sequelize.js';
import './models/index.js'; // Ensure all models and associations are registered
import routes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { initializeSocket } from './sockets/index.js';
import ApiResponse from './utils/ApiResponse.js';

// ─── Express app ─────────────────────────────────────────────
const app = express();

// ─── HTTP server ─────────────────────────────────────────────
const server = createServer(app);

// ─── Socket.IO ───────────────────────────────────────────────
const io = new SocketIOServer(server, {
  cors: {
    origin: config.frontendUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

initializeSocket(io);

// ─── Security middleware ─────────────────────────────────────
app.use(helmet());
app.use(hpp());
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Parsers ─────────────────────────────────────────────────
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Rate limiting ───────────────────────────────────────────
app.use(generalLimiter);

// ─── Trust proxy (for rate limiting behind reverse proxy) ────
app.set('trust proxy', 1);

// ─── Health check & DB status ────────────────────────────────
let isDbConnected = false;
let dbConnectionError = null;

app.get('/health', (_req, res) => {
  return ApiResponse.success(res, {
    status: isDbConnected ? 'ok' : 'degraded',
    database: isDbConnected ? 'connected' : 'disconnected',
    databaseError: isDbConnected ? null : (dbConnectionError?.message || 'Database not connected'),
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: config.env,
  }, isDbConnected ? 'Server is healthy' : 'Server is running in degraded mode (database not connected)');
});

// Guard API routes if database is disconnected (allow /api/health)
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  if (!isDbConnected) {
    return res.status(503).json({
      success: false,
      message: 'Database is not connected. Please configure MariaDB environment variables (DATABASE_HOST, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME or DATABASE_URL) in Render.',
      error: 'DATABASE_DISCONNECTED',
      details: dbConnectionError?.message || null,
    });
  }
  next();
});

// ─── API routes ──────────────────────────────────────────────
app.use('/api', routes);

// ─── 404 handler ─────────────────────────────────────────────
app.use((_req, res) => {
  return ApiResponse.error(res, 'Route not found', 404);
});

// ─── Global error handler ────────────────────────────────────
app.use(errorHandler);

// ─── Database connection & synchronization ───────────────────
import models from './models/index.js';

async function connectAndSyncDatabase() {
  try {
    await sequelize.authenticate();
    isDbConnected = true;
    dbConnectionError = null;
    logger.info('Database connection established successfully');

    try {
      if (config.env === 'development') {
        await sequelize.sync({ alter: true });
        logger.info('Database models synced (alter mode)');
      } else {
        await sequelize.sync();
        logger.info('Database models initialized');
      }

      // Seed default institutional settings if not already present
      if (models.SystemSetting) {
        const count = await models.SystemSetting.count();
        if (count === 0) {
          await models.SystemSetting.bulkCreate([
            { key: 'INSTITUTION_NAME', value: 'JCC, Rohini Sector 3, Delhi', description: 'College / Institute Name' },
            { key: 'SYSTEM_NAME', value: 'Reappear Examination Form Management System', description: 'Web Application Title' },
            { key: 'FOOTER_CREDIT', value: 'Designed by Aditya Kaushik', description: 'Official Designer Credit' },
            { key: 'SUPPORT_EMAIL', value: 'support@jcc.edu.in', description: 'Student support contact email' },
          ]);
          logger.info('Default institutional settings seeded');
        }
      }

      // Auto-provision initial admin if ADMIN_EMAIL & ADMIN_PASSWORD env vars are set
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (adminEmail && adminPassword && models.User && models.AdminProfile) {
        const existingAdmin = await models.User.findOne({ where: { email: adminEmail.toLowerCase() } });
        if (!existingAdmin) {
          const argon2 = await import('argon2');
          const passwordHash = await argon2.default.hash(adminPassword);
          const user = await models.User.create({
            email: adminEmail.toLowerCase(),
            passwordHash,
            role: 'admin',
            isEmailVerified: true,
            status: 'active',
          });
          await models.AdminProfile.create({
            userId: user.id,
            fullName: process.env.ADMIN_NAME || 'System Administrator',
          });
          logger.info({ email: adminEmail }, 'Initial admin account automatically provisioned');
        }
      }
    } catch (syncErr) {
      logger.warn({ err: syncErr.message }, 'Database model sync warning');
    }

    return true;
  } catch (err) {
    isDbConnected = false;
    dbConnectionError = err;

    console.error('\n' + '='.repeat(64));
    console.error('⚠️  DATABASE CONNECTION WARNING:');
    console.error('Could not connect to MariaDB:', err.message);
    if (err.original) {
      console.error('Original DB error:', err.original.message || err.original);
    }
    console.error('-'.repeat(64));
    console.error('Current DB Configuration in use:');
    console.error(`- Host: ${config.db?.host || '(not set)'}`);
    console.error(`- Port: ${config.db?.port || '(not set)'}`);
    console.error(`- Database: ${config.db?.database || '(not set)'}`);
    console.error(`- Username: ${config.db?.username || '(not set)'}`);
    console.error(`- SSL enabled: ${process.env.DATABASE_SSL === 'true' || process.env.DATABASE_SSL === '1'}`);
    console.error(`- DATABASE_URL present: ${Boolean(process.env.DATABASE_URL || process.env.MARIADB_URL)}`);
    console.error('-'.repeat(64));
    console.error('👉 ACTION REQUIRED: Configure MariaDB in Render Dashboard (Environment):');
    console.error('  DATABASE_HOST     = <your-mariadb-host>');
    console.error('  DATABASE_NAME     = <your-database-name>');
    console.error('  DATABASE_USER     = <your-database-user>');
    console.error('  DATABASE_PASSWORD = <your-database-password>');
    console.error('  DATABASE_PORT     = 3306 (or provider port)');
    console.error('  DATABASE_SSL      = true (if required by cloud host like Aiven)');
    console.error('Or provide a single connection string:');
    console.error('  DATABASE_URL      = mariadb://user:password@host:port/dbname');
    console.error('='.repeat(64) + '\n');
    logger.warn({ err: err.message }, 'Database connection failed, server running in degraded mode');
    return false;
  }
}

// ─── Database & server startup ───────────────────────────────
async function startServer() {
  // Start HTTP & WebSocket server immediately so Render health checks pass
  server.listen(config.port, config.host, () => {
    logger.info(
      { port: config.port, host: config.host, env: config.env },
      `Server is running on http://${config.host}:${config.port}`
    );
  });

  // Attempt database connection
  const connected = await connectAndSyncDatabase();
  if (!connected) {
    // Retry database connection periodically in the background
    const retryInterval = setInterval(async () => {
      const ok = await connectAndSyncDatabase();
      if (ok) {
        logger.info('Database connected successfully during retry');
        clearInterval(retryInterval);
      }
    }, 15000);
    retryInterval.unref();
  }
}

// ─── Graceful shutdown ───────────────────────────────────────
function gracefulShutdown(signal) {
  logger.info({ signal }, 'Received shutdown signal, closing gracefully');

  server.close(async () => {
    try {
      io.close();
      await sequelize.close();
      logger.info('All connections closed, exiting');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during graceful shutdown');
      process.exit(1);
    }
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled rejections
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});

// Start the server
startServer();

export { app, server, io };
