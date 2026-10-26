const clientService = require('../services/clientService');
const auditLogService = require('../services/auditLogService');

/**
 * GET /api/clients
 */
async function getClients(req, res, next) {
  try {
    const { search, threatFilter, limit, offset } = req.query;
    const result = await clientService.getClients({ search, threatFilter, limit, offset });
    res.json({
      success: true,
      data: result.clients,
      total: result.total,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/clients/:id
 */
async function getClientById(req, res, next) {
  try {
    const client = await clientService.getClientById(req.params.id);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Data klien tidak ditemukan.',
      });
    }
    res.json({
      success: true,
      data: client,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/clients
 */
async function createClient(req, res, next) {
  try {
    const client = await clientService.createClient(req.body, req.user?.id);
    
    // Catat ke immutable audit log
    await auditLogService.createAuditLog({
      module: 'DATA-KLIEN',
      actor: req.user ? `${req.user.nip} (${req.user.fullName})` : 'ANL-7709-ID (Aditya Wardhana)',
      action: 'Registrasi Subjek Baru & Validasi Data',
      target: `${client.fullName} (${client.nik || client.clientCode})`,
      result: 'Klien Berhasil Didaftarkan ke Database',
      adminUserId: req.user?.id,
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: `Klien baru ${client.clientCode} berhasil didaftarkan.`,
      data: client,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/clients/:id
 */
async function updateClient(req, res, next) {
  try {
    const client = await clientService.updateClient(req.params.id, req.body);
    res.json({
      success: true,
      message: 'Data klien berhasil diperbarui.',
      data: client,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/clients/:id
 */
async function deleteClient(req, res, next) {
  try {
    await clientService.deleteClient(req.params.id);
    res.json({
      success: true,
      message: 'Data klien berhasil dihapus.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/clients/:id/timeline
 */
async function getClientTimeline(req, res, next) {
  try {
    const timeline = await clientService.getClientTimeline360(req.params.id);
    res.json({
      success: true,
      data: timeline,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/clients/verify-dukcapil
 */
async function verifyDukcapil(req, res, next) {
  try {
    const { nik, name } = req.body;
    if (!nik) {
      return res.status(400).json({ success: false, message: 'Nomor NIK wajib diisi.' });
    }
    const result = await clientService.verifyDukcapilNik(nik, name);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  getClientTimeline,
  verifyDukcapil,
};
