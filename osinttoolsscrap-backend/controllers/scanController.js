const osintScanService = require('../services/osintScanService');
const auditLogService = require('../services/auditLogService');

/**
 * POST /api/scans/run
 * Jalankan Diagnosa Jejak Digital Real / Single Target
 */
async function runScan(req, res, next) {
  try {
    const { clientId, ...scanParams } = req.body;
    const result = await osintScanService.runOsintScan(scanParams, clientId);

    // Catat ke audit log
    await auditLogService.createAuditLog({
      module: 'DIAGNOSA-OSINT',
      actor: req.user ? `${req.user.nip} (${req.user.fullName})` : 'MULTI-CRAWLER-BOT',
      action: 'Eksekusi Diagnosa Jejak Digital & Dorking Real-Time',
      target: scanParams.fullName || scanParams.targetName || 'Subjek Target',
      result: `Skor Risiko Terdeteksi: ${result.result.risk.finalScore}/100 (${result.result.risk.category})`,
      adminUserId: req.user?.id,
    }).catch(() => {});

    res.json({
      success: true,
      message: 'Diagnosa jejak digital berhasil diselesaikan.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Helper: Worker pool untuk concurrency terkontrol tanpa saturasi CPU / rate-limit API
 */
async function mapConcurrent(items, limit, fn) {
  const results = new Array(items.length);
  let currentIndex = 0;
  const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (currentIndex < items.length) {
      const idx = currentIndex++;
      try {
        results[idx] = await fn(items[idx], idx);
      } catch (err) {
        results[idx] = {
          id: `err-${idx + 1}-${Date.now()}`,
          name: items[idx].name || items[idx].fullName || `Target #${idx + 1}`,
          nik: items[idx].nik || '-',
          phone: items[idx].phone || '-',
          email: items[idx].email || '-',
          status: 'Gagal',
          score: 0,
          riskCategory: 'TIDAK DIKETAHUI',
          riskColor: '#9e9e9e',
          dorkFound: 0,
          breachCount: 0,
          error: err.message || 'Gagal memproses target ini',
        };
      }
    }
  });
  await Promise.all(workers);
  return results;
}

/**
 * POST /api/scans/bulk
 * Jalankan Bulk Scan CSV dengan High-Performance Concurrent Worker Pool (Concurrency: 3)
 */
async function runBulkScan(req, res, next) {
  try {
    const { targets = [] } = req.body;

    if (!Array.isArray(targets) || targets.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Daftar target bulk scan tidak valid atau kosong.',
        data: [],
      });
    }

    // Batasi maksimum 50 target per batch untuk keamanan rate limit & kestabilan memori
    const safeTargets = targets.slice(0, 50);

    // Eksekusi paralel terkontrol (3 target sekaligus)
    const results = await mapConcurrent(safeTargets, 3, async (target, index) => {
      const fullName = (target.name || target.fullName || '').trim() || `Target #${index + 1}`;
      const nik = String(target.nik || '').trim();
      const phone = String(target.phone || target.hp || '').trim();
      const email = String(target.email || '').trim();
      const spouseFamily = String(target.spouseFamily || target.spouse || target.pasangan || target.family || '').trim();
      const keywords = String(target.keywords || target.kataKunci || '').trim();
      
      const socialMedia = {
        instagram: target.instagram || target.socialMedia?.instagram || '',
        facebook: target.facebook || target.socialMedia?.facebook || '',
        tiktok: target.tiktok || target.socialMedia?.tiktok || '',
        twitter: target.twitter || target.socialMedia?.twitter || '',
        linkedin: target.linkedin || target.socialMedia?.linkedin || '',
        threads: target.threads || target.socialMedia?.threads || '',
        youtube: target.youtube || target.socialMedia?.youtube || '',
      };

      const scan = await osintScanService.runOsintScan({
        fullName,
        nik,
        phone,
        email,
        spouseFamily,
        keywords,
        socialMedia,
      });

      const risk = scan.result?.risk || { finalScore: 0, category: 'RENDAH', color: '#388E3C' };
      const stats = scan.result?.stats || {};

      return {
        id: scan.scanId,
        scanId: scan.scanId,
        name: fullName,
        nik: nik,
        nikMasked: nik.length >= 10 ? `${nik.slice(0, 6)}******${nik.slice(-4)}` : (nik || '-'),
        phone: phone || '-',
        email: email || '-',
        status: 'Selesai',
        score: risk.finalScore ?? 0,
        riskCategory: risk.category || 'SEDANG',
        riskColor: risk.color || '#F57C00',
        dorkFound: scan.record?.dorkFound ?? stats.totalFoundUrls ?? 0,
        breachCount: scan.record?.breachCount ?? stats.breachCount ?? 0,
        scannedAt: scan.record?.createdAt || new Date().toISOString(),
        result: scan.result,
      };
    });

    const successCount = results.filter(r => r.status === 'Selesai').length;
    const failCount = results.filter(r => r.status === 'Gagal').length;

    // Catat ke Audit Log Forensik
    await auditLogService.createAuditLog({
      module: 'DIAGNOSA-OSINT-BULK',
      actor: req.user ? `${req.user.nip} (${req.user.fullName})` : 'BULK-CRAWLER-BOT',
      action: `Eksekusi Bulk Scan CSV (${results.length} Target)`,
      target: `Batch ${results.length} subjek target`,
      result: `Selesai: ${successCount}, Gagal: ${failCount}. Rata-rata skor: ${
        successCount > 0 ? Math.round(results.filter(r => r.status === 'Selesai').reduce((a, b) => a + b.score, 0) / successCount) : 0
      }/100`,
      adminUserId: req.user?.id,
    }).catch(() => {});

    res.json({
      success: true,
      message: `${successCount} dari ${results.length} target berhasil diproses dalam bulk scan.${failCount > 0 ? ` (${failCount} gagal)` : ''}`,
      data: results,
      meta: {
        total: results.length,
        successCount,
        failCount,
        averageScore: successCount > 0 ? Math.round(results.filter(r => r.status === 'Selesai').reduce((a, b) => a + b.score, 0) / successCount) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/scans
 */
async function getScanHistory(req, res, next) {
  try {
    const limit = req.query.limit || 100;
    const history = await osintScanService.getScanHistory(limit);
    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/scans/:id
 */
async function getScanDetail(req, res, next) {
  try {
    const scan = await osintScanService.getScanDetail(req.params.id);
    if (!scan) {
      return res.status(404).json({ success: false, message: 'Data scan tidak ditemukan.' });
    }
    res.json({
      success: true,
      data: scan,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/scans/export-pdf
 * Konfigurasi & Export Laporan Diagnosa Jejak Digital ke PDF Metadata & Parameters
 */
async function exportPdfReport(req, res, next) {
  try {
    const {
      scanId,
      dorkDisplayOption = '2. Tampilkan semua berdasarkan yang sudah di-filter',
      includeAi = true,
      includeRemediation = true,
      targetName,
    } = req.body;

    let scan = null;
    if (scanId) {
      scan = await osintScanService.getScanDetail(scanId);
    }

    const reportMeta = {
      documentNumber: `DIAG-${Date.now()}`,
      scanDate: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB',
      targetName: targetName || scan?.targetName || 'Subjek Target',
      dorkDisplayOption,
      includeAi,
      includeRemediation,
      status: 'READY',
    };

    res.json({
      success: true,
      message: 'Parameter laporan PDF berhasil dikonfigurasi.',
      data: reportMeta,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET/POST /api/scans/hibp
 * Periksa kebocoran email via Have I Been Pwned API v3 (BreachesForAccount)
 * Dokumentasi Resmi: https://haveibeenpwned.com/API/v3#BreachesForAccount
 */
async function checkHibpBreaches(req, res, next) {
  try {
    const email = req.query.email || req.body?.email;
    const apiKey = req.query.apiKey || req.body?.apiKey;
    const truncateResponse = req.query.truncateResponse === 'true' || req.body?.truncateResponse === true;
    const includeUnverified = req.query.includeUnverified !== 'false' && req.body?.includeUnverified !== false;
    const domain = req.query.domain || req.body?.domain;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Parameter email wajib disertakan.',
      });
    }

    const hibpService = require('../services/hibpService');
    const result = await hibpService.getBreachesForAccount(email, {
      apiKey,
      truncateResponse,
      includeUnverified,
      domain,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/scans/hibp/breaches
 * Ambil dan telusuri seluruh katalog basis data kebocoran resmi HIBP API v3
 * Dokumentasi Resmi: https://haveibeenpwned.com/API/v3#AllBreaches
 */
async function getAllBreachesHandler(req, res, next) {
  try {
    const domain = req.query.domain || '';
    const q = req.query.q || req.query.search || '';
    const dataClass = req.query.dataClass || req.query.dataclass || '';
    const limit = parseInt(req.query.limit, 10) || 100;
    const forceRefresh = req.query.refresh === 'true';

    const hibpService = require('../services/hibpService');

    let breaches = [];
    if (q || dataClass) {
      breaches = await hibpService.searchBreachesCatalog(q, {
        domain,
        dataClass,
        limit,
      });
    } else {
      breaches = await hibpService.getAllBreaches({
        domain,
        includeUnverified: req.query.includeUnverified !== 'false',
        forceRefresh,
      });
      if (limit && breaches.length > limit) {
        breaches = breaches.slice(0, limit);
      }
    }

    res.json({
      success: true,
      count: breaches.length,
      domain: domain || null,
      query: q || null,
      source: 'Have I Been Pwned API v3 (#AllBreaches)',
      data: breaches,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/scans/hibp/breaches/:name
 * Ambil detail spesifik satu insiden kebocoran resmi HIBP
 * Dokumentasi Resmi: https://haveibeenpwned.com/API/v3#SingleBreach
 */
async function getSingleBreachHandler(req, res, next) {
  try {
    const breachName = req.params.name;
    const hibpService = require('../services/hibpService');
    const breach = await hibpService.getBreachByName(breachName);

    if (!breach) {
      return res.status(404).json({
        success: false,
        message: `Insiden kebocoran '${breachName}' tidak ditemukan dalam katalog HIBP.`,
      });
    }

    res.json({
      success: true,
      data: breach,
      source: 'Have I Been Pwned API v3 (#SingleBreach)',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/scans/hibp/dataclasses
 * Ambil seluruh kelas tipe data pribadi yang bocor dari HIBP
 * Dokumentasi Resmi: https://haveibeenpwned.com/API/v3#AllDataClasses
 */
async function getAllDataClassesHandler(req, res, next) {
  try {
    const hibpService = require('../services/hibpService');
    const dataClasses = await hibpService.getAllDataClasses();

    res.json({
      success: true,
      count: dataClasses.length,
      data: dataClasses,
      source: 'Have I Been Pwned API v3 (#AllDataClasses)',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/scans/national-leaks
 * Ambil daftar resmi basis data kebocoran nasional Republik Indonesia (NIK & Kartu Keluarga)
 */
async function getNationalLeaksHandler(req, res, next) {
  try {
    const { KNOWN_NATIONAL_NIK_LEAKS } = require('../services/modules/breachAudit');
    res.json({
      success: true,
      count: KNOWN_NATIONAL_NIK_LEAKS.length,
      data: KNOWN_NATIONAL_NIK_LEAKS,
      description: 'Daftar resmi basis data kebocoran nasional terindeks yang mengompromikan NIK & Kartu Keluarga (KK).',
      legalReference: 'UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP)',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  runScan,
  runBulkScan,
  getScanHistory,
  getScanDetail,
  exportPdfReport,
  checkHibpBreaches,
  getAllBreachesHandler,
  getSingleBreachHandler,
  getAllDataClassesHandler,
  getNationalLeaksHandler,
};

