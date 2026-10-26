const crypto = require('crypto');
const prisma = require('../config/prisma');

/**
 * Buat Catatan Audit Log Baru dengan SHA-256 Hash
 */
async function createAuditLog({
  module,
  actor,
  action,
  target,
  result,
  badge = 'bg-primary-fixed text-on-primary-fixed',
  adminUserId = null,
}) {
  const count = await prisma.auditLog.count();
  const logCode = `LOG-${String(count + 9916)}`;

  // Generate SHA-256 hash dari data audit
  const payload = `${logCode}:${module}:${actor}:${action}:${target}:${result}:${Date.now()}`;
  const hash = 'sha256:' + crypto.createHash('sha256').update(payload).digest('hex').slice(0, 16);

  return prisma.auditLog.create({
    data: {
      logCode,
      module,
      actor,
      action,
      target,
      result,
      hash,
      badge,
      adminUserId,
    },
  });
}

/**
 * Ambil semua Audit Logs dengan Filter Modul
 */
async function getAuditLogs({ module = 'ALL', limit = 100 } = {}) {
  const where = {};
  if (module && module !== 'ALL') {
    where.module = module;
  }

  return prisma.auditLog.findMany({
    where,
    orderBy: { id: 'desc' },
    take: Number(limit),
  });
}

module.exports = {
  createAuditLog,
  getAuditLogs,
};
