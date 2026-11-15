import { verifyAccessToken } from '../utils/tokenUtils.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Authenticate middleware
 * Extracts JWT from cookies (accessToken) or Authorization header (Bearer).
 * Attaches decoded user info to req.user.
 */
export const authenticate = asyncHandler(async (req, _res, next) => {
  let token = null;

  // 1. Try cookie
  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  // 2. Try Authorization header
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    throw ApiError.unauthorized('Authentication required. Please log in.');
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Session expired. Please log in again.');
    }
    throw ApiError.unauthorized('Invalid authentication token.');
  }
});

/**
 * Authorization middleware factory
 * Checks that req.user.role is one of the allowed roles.
 * @param  {...string} roles - Allowed roles (e.g. 'admin', 'student')
 */
export const authorize = (...roles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required.'));
    }
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action.'));
    }
    next();
  };
};

/**
 * Optional authentication middleware
 * Like authenticate but does not fail if no token is present.
 * If a valid token exists, attaches user to req.user.
 */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  let token = null;

  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (token) {
    try {
      const decoded = verifyAccessToken(token);
      req.user = {
        id: decoded.id,
        role: decoded.role,
        email: decoded.email,
      };
    } catch {
      // Token invalid or expired — continue without user
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
});
