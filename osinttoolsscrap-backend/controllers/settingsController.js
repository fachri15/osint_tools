const settingsService = require('../services/settingsService');
const auditLogService = require('../services/auditLogService');

/**
 * GET /api/settings
 */
async function getSettings(req, res, next) {
  try {
    const settings = await settingsService.getSettings();
    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/settings
 */
async function saveSettings(req, res, next) {
  try {
    const result = await settingsService.saveSettings(req.body);

    // Audit log
    const actor = req.user ? `${req.user.nip} (${req.user.fullName})` : 'SUPERADMIN-01 (Aditya Wardhana)';
    await auditLogService.createAuditLog({
      module: 'PENGATURAN-API',
      actor,
      action: 'Pembaruan Kunci Rahasia API & Vault MySQL',
      target: 'SystemSetting (Vault)',
      result: 'Kunci Rahasia API Berhasil Diperbarui di Database MySQL',
      badge: 'bg-primary text-white',
      adminUserId: req.user?.id,
    }).catch(() => {});

    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/settings/test-connection
 */
async function testConnection(req, res, next) {
  try {
    const { apiName } = req.body;
    const result = await settingsService.testGateway(apiName || 'Gateway Third-Party');
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSettings,
  saveSettings,
  testConnection,
};
