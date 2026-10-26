const auditLogService = require('../services/auditLogService');

/**
 * GET /api/audit-logs
 */
async function getLogs(req, res, next) {
  try {
    const { module, limit } = req.query;
    const logs = await auditLogService.getAuditLogs({ module, limit });
    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/audit-logs
 */
async function createLog(req, res, next) {
  try {
    const log = await auditLogService.createAuditLog({
      ...req.body,
      adminUserId: req.user?.id,
    });
    res.status(201).json({
      success: true,
      data: log,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getLogs,
  createLog,
};
