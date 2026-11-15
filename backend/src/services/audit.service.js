import { AuditLog, User } from '../models/index.js';
import logger from '../utils/logger.js';

export const logAdminAction = async ({ userId, action, entity, entityId, details, req }) => {
  try {
    await AuditLog.create({
      userId,
      action,
      entity,
      entityId: entityId ? String(entityId) : null,
      details,
      ipAddress: req?.ip || req?.headers['x-forwarded-for'] || null,
      userAgent: req?.headers['user-agent'] || null,
    });
  } catch (err) {
    logger.error({ err }, 'Failed to record audit log entry');
  }
};

export const getAuditLogs = async ({ page = 1, limit = 25, action, entity }) => {
  const where = {};
  if (action) where.action = action;
  if (entity) where.entity = entity;

  const offset = (page - 1) * limit;

  const { count, rows } = await AuditLog.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'fullName', 'email', 'role'],
      },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return {
    total: count,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(count / limit),
    logs: rows,
  };
};
