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

// ─── Health check ────────────────────────────────────────────
app.get('/health', (_req, res) => {
  return ApiResponse.success(res, {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: config.env,
  }, 'Server is healthy');
});

// ─── API routes ──────────────────────────────────────────────
app.use('/api', routes);

// ─── 404 handler ─────────────────────────────────────────────
app.use((_req, res) => {
  return ApiResponse.error(res, 'Route not found', 404);
});

// ─── Global error handler ────────────────────────────────────
app.use(errorHandler);

// ─── Database & server startup ───────────────────────────────
async function startServer() {
  try {
    // Authenticate database connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully');

    // Sync models in development only
    if (config.env === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('Database models synced (alter mode)');
    }
    // In production, rely on migrations only — do not sync

    // Start listening
    server.listen(config.port, config.host, () => {
      logger.info(
        { port: config.port, host: config.host, env: config.env },
        `Server is running on http://${config.host}:${config.port}`
      );
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
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
