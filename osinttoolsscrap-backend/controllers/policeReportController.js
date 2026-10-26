const policeReportService = require('../services/policeReportService');
const auditLogService = require('../services/auditLogService');

/**
 * GET /api/reports
 */
async function getReports(req, res, next) {
  try {
    const limit = req.query.limit || 100;
    const reports = await policeReportService.getPoliceReports(limit);
    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/reports
 */
async function createReport(req, res, next) {
  try {
    const report = await policeReportService.createPoliceReport(req.body);

    // Audit Log
    const actor = req.user ? `${req.user.nip} (${req.user.fullName})` : 'LEGAL-MODULE';
    await auditLogService.createAuditLog({
      module: 'POLICE-REPORT',
      actor,
      action: 'Generasi Berkas Resmi LP/BAP SPKT Siber',
      target: report.reportNumber,
      result: `PDF Siap Cetak (${report.filename})`,
      badge: 'bg-primary-fixed text-primary',
      adminUserId: req.user?.id,
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Laporan BAP Kepolisian resmi berhasil digenerate.',
      data: report,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/reports/:id
 */
async function getReportDetail(req, res, next) {
  try {
    const report = await policeReportService.getPoliceReportDetail(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Data laporan polisi tidak ditemukan.' });
    }
    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/reports/:id
 */
async function deleteReport(req, res, next) {
  try {
    await policeReportService.deletePoliceReport(req.params.id);
    res.json({
      success: true,
      message: 'Laporan berhasil dihapus.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getReports,
  createReport,
  getReportDetail,
  deleteReport,
};
