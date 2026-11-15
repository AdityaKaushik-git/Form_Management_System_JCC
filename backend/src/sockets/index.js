import { verifyAccessToken } from '../utils/tokenUtils.js';
import logger from '../utils/logger.js';

/** @type {import('socket.io').Server} */
let ioInstance = null;

/**
 * Initialize Socket.IO with authentication and room management
 * @param {import('socket.io').Server} io
 */
export function initializeSocket(io) {
  ioInstance = io;

  // ─── Authentication middleware ─────────────────────────────
  io.use((socket, next) => {
    try {
      let token = null;

      // Try handshake auth
      if (socket.handshake.auth && socket.handshake.auth.token) {
        token = socket.handshake.auth.token;
      }

      // Try cookies
      if (!token && socket.handshake.headers.cookie) {
        const cookies = socket.handshake.headers.cookie.split(';').reduce((acc, c) => {
          const [key, val] = c.trim().split('=');
          if (key && val) acc[key] = val;
          return acc;
        }, {});
        token = cookies.accessToken || null;
      }

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verifyAccessToken(token);
      socket.user = {
        id: decoded.id,
        role: decoded.role,
        email: decoded.email,
      };
      next();
    } catch (err) {
      logger.warn({ err: err.message }, 'Socket authentication failed');
      next(new Error('Authentication failed'));
    }
  });

  // ─── Connection handler ────────────────────────────────────
  io.on('connection', (socket) => {
    const { user } = socket;
    logger.info({ userId: user.id, role: user.role, socketId: socket.id }, 'Socket connected');

    // Join role-based and user-specific rooms
    if (user.role === 'admin') {
      socket.join('admin');
    }
    socket.join(`student:${user.id}`);

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      logger.info({ userId: user.id, socketId: socket.id, reason }, 'Socket disconnected');
    });

    // Handle errors
    socket.on('error', (err) => {
      logger.error({ err, userId: user.id, socketId: socket.id }, 'Socket error');
    });
  });

  logger.info('Socket.IO initialized');
}

/**
 * Emit an event to all connected admin users
 * @param {string} event
 * @param {*} data
 */
export function emitToAdmin(event, data) {
  if (!ioInstance) {
    logger.warn('Socket.IO not initialized, cannot emit to admin');
    return;
  }
  ioInstance.to('admin').emit(event, data);
}

/**
 * Emit an event to a specific student
 * @param {string|number} userId
 * @param {string} event
 * @param {*} data
 */
export function emitToStudent(userId, event, data) {
  if (!ioInstance) {
    logger.warn('Socket.IO not initialized, cannot emit to student');
    return;
  }
  ioInstance.to(`student:${userId}`).emit(event, data);
}

/**
 * Emit an event to all connected users
 * @param {string} event
 * @param {*} data
 */
export function emitToAll(event, data) {
  if (!ioInstance) {
    logger.warn('Socket.IO not initialized, cannot emit to all');
    return;
  }
  ioInstance.emit(event, data);
}
