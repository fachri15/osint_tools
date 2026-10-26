const dcInvestigationService = require('../services/dcInvestigationService');
const auditLogService = require('../services/auditLogService');

/**
 * POST /api/dc/analyze
 */
async function analyzeDc(req, res, next) {
  try {
    const { phone, clientId } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Nomor telepon DC wajib diisi.' });
    }

    const record = await dcInvestigationService.analyzeDcPhone(phone, clientId);

    // Catat ke audit log
    await auditLogService.createAuditLog({
      module: 'INVESTIGASI-DC',
      actor: req.user ? `${req.user.nip} (${req.user.fullName})` : 'ANL-7709-ID (Aditya Wardhana)',
      action: 'Analisis HLR & VoIP Indosat/Telkomsel',
      target: record.dcPhone,
      result: `VoIP Proxy Terdeteksi (Skor Fraud: ${record.phoneScore}%)`,
      badge: 'bg-secondary-fixed text-on-secondary-fixed-variant',
      adminUserId: req.user?.id,
    }).catch(() => {});

    res.json({
      success: true,
      message: 'Investigasi nomor penagih berhasil dilakukan.',
      data: record,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/dc
 */
async function getDcHistory(req, res, next) {
  try {
    const limit = req.query.limit || 100;
    const history = await dcInvestigationService.getDcHistory(limit);
    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/dc/:id
 */
async function getDcDetail(req, res, next) {
  try {
    const detail = await dcInvestigationService.getDcDetail(req.params.id);
    if (!detail) {
      return res.status(404).json({ success: false, message: 'Data investigasi DC tidak ditemukan.' });
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
 * POST /api/dc/truecaller/lookup
 * Dedicated Scan & Lookup Truecaller untuk nomor DC
 */
async function truecallerLookup(req, res, next) {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Nomor telepon wajib diisi untuk lookup Truecaller.' });
    }

    const data = await dcInvestigationService.lookupTruecaller(phone);

    // Audit log
    await auditLogService.createAuditLog({
      module: 'INVESTIGASI-DC',
      actor: req.user ? `${req.user.nip} (${req.user.fullName})` : 'ANL-7709-ID (Aditya Wardhana)',
      action: 'Truecaller API Scan & Lookup',
      target: phone,
      result: `Identitas: ${data.name || 'Tidak Ditemukan'} (Spam Score: ${data.spamScore || 0}%)`,
      badge: data.isSpam ? 'bg-error-container text-on-error-container' : 'bg-primary-container text-on-primary-container',
      adminUserId: req.user?.id,
    }).catch(() => {});

    res.json({
      success: true,
      message: 'Scan Truecaller berhasil diproses.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/dc/truecaller/callback
 * GET /api/dc/truecaller/callback
 * Endpoint Webhook Callback URL untuk integrasi Truecaller SDK / Webhooks
 */
async function handleTruecallerCallback(req, res, next) {
  try {
    const payload = req.body || {};
    const queryParams = req.query || {};
    const headers = req.headers || {};
    const reqIp = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '127.0.0.1';

    // Jika Truecaller mengirimkan challenge verification (misal saat register webhook)
    if (queryParams.challenge || queryParams.hub_challenge) {
      return res.send(queryParams.challenge || queryParams.hub_challenge);
    }

    const result = await dcInvestigationService.handleTruecallerCallback(payload, queryParams, headers, reqIp);

    // Audit log
    await auditLogService.createAuditLog({
      module: 'INVESTIGASI-DC',
      actor: `Truecaller Webhook (${reqIp})`,
      action: 'Receive Webhook Callback Event',
      target: result.phone || 'Unknown Phone',
      result: `Event: ${result.name} | Status: ${result.status}`,
      badge: 'bg-primary-container text-on-primary-container',
      adminUserId: req.user?.id,
    }).catch(() => {});

    res.json({
      success: true,
      message: 'Callback Truecaller berhasil diterima dan diproses.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/dc/truecaller/info
 * Info Callback URL, status webhook, dan logs terbaru
 */
async function getTruecallerInfo(req, res, next) {
  try {
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:5000';
    const baseUrl = `${protocol}://${host}`;

    const info = await dcInvestigationService.getTruecallerCallbackInfo(baseUrl);
    res.json({
      success: true,
      data: info,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/dc/truecaller/token
 * Simpan atau perbarui API Token Truecaller
 */
async function saveTruecallerToken(req, res, next) {
  try {
    const { token } = req.body;
    await dcInvestigationService.setTruecallerToken(token || '');

    // Audit log
    await auditLogService.createAuditLog({
      module: 'INVESTIGASI-DC',
      actor: req.user ? `${req.user.nip} (${req.user.fullName})` : 'System Admin',
      action: 'Update Truecaller API Credentials',
      target: 'TRUECALLER_TOKEN',
      result: token ? 'Token diperbarui (Active)' : 'Token dikosongkan (Fallback Mode)',
      badge: 'bg-surface-variant text-on-surface-variant',
      adminUserId: req.user?.id,
    }).catch(() => {});

    res.json({
      success: true,
      message: token ? 'API Token Truecaller berhasil disimpan.' : 'API Token Truecaller dikosongkan (menggunakan mode fallback OSINT probe).',
      tokenConfigured: !!(token && token.trim()),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  analyzeDc,
  getDcHistory,
  getDcDetail,
  truecallerLookup,
  handleTruecallerCallback,
  getTruecallerInfo,
  saveTruecallerToken,
};

