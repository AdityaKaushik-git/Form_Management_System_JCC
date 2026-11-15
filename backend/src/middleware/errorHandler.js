import { ValidationError as SequelizeValidationError, UniqueConstraintError } from 'sequelize';
import { ZodError } from 'zod';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import logger from '../utils/logger.js';
import config from '../config/index.js';

/**
 * Global error handler middleware
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || [];
  let isOperational = err.isOperational ?? false;

  // ─── ApiError ──────────────────────────────────────────────
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
    isOperational = err.isOperational;
  }

  // ─── Sequelize Validation Error ────────────────────────────
  else if (err instanceof SequelizeValidationError) {
    statusCode = 400;
    message = 'Validation error';
    errors = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
      type: e.type,
    }));
    isOperational = true;
  }

  // ─── Sequelize Unique Constraint ───────────────────────────
  else if (err instanceof UniqueConstraintError) {
    statusCode = 409;
    message = 'Duplicate entry';
    errors = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
      value: e.value,
    }));
    isOperational = true;
  }

  // ─── Zod Validation Error ─────────────────────────────────
  else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation error';
    errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
      code: e.code,
    }));
    isOperational = true;
  }

  // ─── JWT Errors ────────────────────────────────────────────
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    isOperational = true;
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    isOperational = true;
  }

  // ─── Multer Errors ─────────────────────────────────────────
  else if (err.name === 'MulterError') {
    statusCode = 400;
    isOperational = true;
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size exceeds the allowed limit';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = `Unexpected file field: ${err.field}`;
        break;
      default:
        message = `Upload error: ${err.message}`;
    }
  }

  // ─── Syntax Error (bad JSON body) ──────────────────────────
  else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON in request body';
    isOperational = true;
  }

  // ─── Log non-operational (unexpected) errors ───────────────
  if (!isOperational) {
    logger.error({
      err,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    }, 'Unexpected error');
  } else {
    logger.warn({
      statusCode,
      message,
      method: req.method,
      url: req.originalUrl,
    }, 'Operational error');
  }

  // In production, hide internals for unexpected errors
  if (config.env === 'production' && !isOperational) {
    message = 'Internal server error';
    errors = [];
  }

  return ApiResponse.error(res, message, statusCode, errors);
};

export { errorHandler };
export default errorHandler;
