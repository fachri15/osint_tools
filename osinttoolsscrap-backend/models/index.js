const prisma = require('../config/prisma');

module.exports = {
  prisma,
  AdminUser: prisma.adminUser,
  Client: prisma.client,
  ScanHistory: prisma.scanHistory,
  DcInvestigation: prisma.dcInvestigation,
  RemovalCase: prisma.removalCase,
  RemovalLog: prisma.removalLog,
  PoliceReport: prisma.policeReport,
  AuditLog: prisma.auditLog,
  SystemSetting: prisma.systemSetting,
  RemovalRequest: prisma.removalRequest,
};
