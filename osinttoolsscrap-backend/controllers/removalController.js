const removalService = require('../services/removalService');
const auditLogService = require('../services/auditLogService');

/**
 * GET /api/removals
 */
async function getCases(req, res, next) {
  try {
    const { status, search, limit } = req.query;
    const cases = await removalService.getRemovalCases({ status, search, limit });
    res.json({
      success: true,
      data: cases,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/removals/:id
 */
async function getCaseDetail(req, res, next) {
  try {
    const detail = await removalService.getRemovalCaseDetail(req.params.id);
    if (!detail) {
      return res.status(404).json({ success: false, message: 'Tiket removal case tidak ditemukan.' });
    }
    res.json({
      success: true,
      data: detail,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/removals
 */
async function createCase(req, res, next) {
  try {
    const actor = req.user ? `${req.user.nip} (${req.user.fullName})` : 'System/Operator';
    const newCase = await removalService.createRemovalCase(req.body, actor);

    // Audit Log
    await auditLogService.createAuditLog({
      module: 'ASISTEN-REMOVAL',
      actor,
      action: 'Registrasi Case Takedown Konten Ilegal Baru',
      target: `${newCase.caseCode} (${newCase.platform})`,
      result: `Tiket Terbit #${newCase.ticketId || newCase.caseCode}`,
      badge: 'bg-tertiary-fixed text-on-tertiary-fixed',
      adminUserId: req.user?.id,
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: `Case pembersihan ${newCase.caseCode} berhasil dibuat.`,
      data: newCase,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/removals/:id/status
 */
async function updateStatus(req, res, next) {
  try {
    const { newStatus, progressPercent, notes } = req.body;
    const actor = req.user ? `${req.user.fullName}` : 'Operator';
    const updated = await removalService.updateRemovalCaseStatus(req.params.id, {
      newStatus,
      progressPercent,
      notes,
      actor,
    });

    res.json({
      success: true,
      message: 'Status progress penanganan berhasil diperbarui.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/removals/live-check
 */
async function runLiveCheck(req, res, next) {
  try {
    const { url, caseId } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL target wajib diisi.' });
    }
    const actor = req.user ? `${req.user.fullName}` : 'AI Live Checker';
    const result = await removalService.checkUrlLiveStatus(url, caseId, actor);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/removals/generate-legal
 */
async function generateLegal(req, res, next) {
  try {
    const draft = removalService.generateLegalDraft(req.body);
    res.json({
      success: true,
      data: {
        legalText: draft,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCases,
  getCaseDetail,
  createCase,
  updateStatus,
  runLiveCheck,
  generateLegal,
};
