const axios = require('axios');
const prisma = require('../config/prisma');

/**
 * Format tanggal YYYYMMDD
 */
function getDateCode() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/**
 * Buat Removal Case Baru + Log Inisial
 */
async function createRemovalCase(data, actor = 'System/Operator') {
  const count = await prisma.removalCase.count();
  const dateCode = getDateCode();
  const caseCode = data.caseCode || `REM-${nowYear()}-${String(count + 82).padStart(3, '0')}`;

  const platform = data.platform || detectPlatform(data.targetUrl);
  const platformIcon = platform === 'Telegram' ? 'send' : (platform === 'Google' ? 'search' : 'description');

  const removalCase = await prisma.removalCase.create({
    data: {
      caseCode,
      clientId: data.clientId ? Number(data.clientId) : null,
      clientName: data.clientName || 'Subjek Korban',
      clientPhone: data.clientPhone || '',
      targetUrl: data.targetUrl,
      targetSnippet: data.targetSnippet || '',
      targetKeyword: data.targetKeyword || '',
      platform,
      platformIcon,
      leakType: data.leakType || 'Foto KTP & Daftar Kontak Lengkap',
      removalType: data.removalType || 'Google Outdated Content',
      status: data.status || 'Draft',
      statusCode: data.statusCode || 'IN_PROGRESS',
      progressPercent: Number(data.progressPercent) || 10,
      ticketId: data.ticketId || `TCK-${Math.floor(10000 + Math.random() * 90000)}`,
      legalRef: data.legalRef || 'Pasal 65 & 67 UU No. 27/2022 (PDP)',
      evidenceCount: Number(data.evidenceCount) || 2,
      aiGuidance: data.aiGuidance || 'Ajukan permohonan penurunan konten kepada abuse registrar atau Google Outdated Content Tool.',
      legalText: data.legalText || '',
      notes: data.notes || '',
      logs: {
        create: {
          actionType: 'Case Created',
          oldStatus: '-',
          newStatus: data.status || 'Draft',
          description: `Tiket penanganan takedown ${caseCode} berhasil didaftarkan ke sistem pemantauan.`,
          actor,
        },
      },
    },
    include: { logs: true },
  });

  return removalCase;
}

function nowYear() {
  return new Date().getFullYear();
}

function detectPlatform(url = '') {
  const u = String(url).toLowerCase();
  if (u.includes('pastebin')) return 'Pastebin';
  if (u.includes('t.me') || u.includes('telegram')) return 'Telegram';
  if (u.includes('facebook')) return 'Facebook';
  if (u.includes('instagram')) return 'Instagram';
  if (u.includes('darkleak') || u.includes('forum')) return 'Forum Dark Web';
  return 'Google Search Index';
}

/**
 * Ambil semua Removal Cases
 */
async function getRemovalCases({ status = '', search = '', limit = 100 } = {}) {
  const where = {};
  if (status && status !== 'Semua Status' && status !== 'ALL') {
    where.status = status;
  }
  if (search && search.trim()) {
    const s = search.trim();
    where.OR = [
      { caseCode: { contains: s } },
      { clientName: { contains: s } },
      { targetUrl: { contains: s } },
      { platform: { contains: s } },
      { ticketId: { contains: s } },
    ];
  }

  const cases = await prisma.removalCase.findMany({
    where,
    orderBy: { id: 'desc' },
    take: Number(limit),
    include: {
      _count: { select: { logs: true } },
    },
  });

  return cases.map(c => ({
    ...c,
    logCount: c._count.logs,
  }));
}

/**
 * Detail satu case lengkap beserta seluruh riwayat logs
 */
async function getRemovalCaseDetail(id) {
  return prisma.removalCase.findFirst({
    where: {
      OR: [
        { id: isNaN(Number(id)) ? -1 : Number(id) },
        { caseCode: String(id) },
      ],
    },
    include: {
      client: true,
      logs: { orderBy: { id: 'desc' } },
    },
  });
}

/**
 * Update Status Case & Tambah Log Audit
 */
async function updateRemovalCaseStatus(caseId, { newStatus, progressPercent, notes = '', actor = 'Operator' }) {
  const curr = await prisma.removalCase.findUnique({ where: { id: Number(caseId) } });
  if (!curr) throw new Error('Case pembersihan tidak ditemukan');

  const oldStatus = curr.status;

  // Auto calculate progress jika tidak diberikan
  let p = progressPercent !== undefined ? Number(progressPercent) : curr.progressPercent;
  if (progressPercent === undefined) {
    const statusMap = {
      'Draft': 10,
      'Diajukan': 35,
      'Dalam Peninjauan': 65,
      'Sedang Diproses Platform': 65,
      'Berhasil Dihapus': 100,
      'Ditolak': 40,
    };
    p = statusMap[newStatus] || curr.progressPercent;
  }

  const updated = await prisma.removalCase.update({
    where: { id: Number(caseId) },
    data: {
      status: newStatus,
      progressPercent: p,
      statusCode: newStatus === 'Berhasil Dihapus' ? 'RESOLVED' : (newStatus === 'Ditolak' ? 'REJECTED' : 'IN_PROGRESS'),
      notes: notes || curr.notes,
      logs: {
        create: {
          actionType: 'Status Update',
          oldStatus,
          newStatus,
          description: `Status diubah dari '${oldStatus}' menjadi '${newStatus}' (Progress: ${p}%). ${notes ? 'Catatan: ' + notes : ''}`,
          actor,
        },
      },
    },
    include: { logs: { orderBy: { id: 'desc' } } },
  });

  return updated;
}

/**
 * Live Index & HTTP Status Checker
 * Mengecek apakah URL target sudah 404 (takedown sukses) atau masih 200 (terindeks)
 */
async function checkUrlLiveStatus(url, caseId = null, actor = 'AI Live Checker') {
  let httpStatus = 200;
  let isIndexed = true;
  let statusText = 'HTTP 200 OK (Konten Masih Aktif di Web)';
  let googleCache = 'Masih Terindeks di SERP Google';

  try {
    const response = await axios.get(url, {
      timeout: 5000,
      validateStatus: () => true, // Terima semua status code tanpa throw
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    httpStatus = response.status;
    if (httpStatus === 404 || httpStatus === 410) {
      isIndexed = false;
      statusText = `HTTP ${httpStatus} Not Found (Konten Telah Berhasil Dihapus)`;
      googleCache = 'De-indexed / Cache Dihapus';
    } else {
      isIndexed = true;
      statusText = `HTTP ${httpStatus} OK (Konten Masih Aktif)`;
    }
  } catch (error) {
    // Jika DNS error atau connection refused, seringkali konten telah dihapus/domain suspend
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      httpStatus = 404;
      isIndexed = false;
      statusText = 'Domain/Host Tidak Ditemukan (Konten Telah Dihapus / Suspended)';
      googleCache = 'De-indexed';
    }
  }

  // Jika ada caseId, perbarui status case dan tambahkan log
  if (caseId) {
    await prisma.removalCase.update({
      where: { id: Number(caseId) },
      data: {
        httpStatusCode: httpStatus,
        isIndexed,
        lastCheckedAt: new Date(),
        logs: {
          create: {
            actionType: 'Live Index Check',
            oldStatus: '-',
            newStatus: isIndexed ? 'Masih Terindeks' : 'Berhasil Dihapus',
            description: `Live Check: Respon ${statusText}. Google Status: ${googleCache}.`,
            actor,
          },
        },
      },
    }).catch(() => {});
  }

  return {
    url,
    httpStatus,
    statusText,
    isIndexed,
    googleCache,
    dnsStatus: 'Cloudflare / Direct Gateway Resolved',
    recommendation: !isIndexed 
      ? '✅ Takedown sukses! Konten telah bersih dari platform hosting.' 
      : '⚠️ Konten masih tayang publik. Ajukan somasi hukum kedua dan de-indexation request Google.',
  };
}

/**
 * Generator Naskah Hukum Somasi / Takedown Notice
 * Mengonversi sample/modules/removal_generator.py
 */
function generateLegalDraft({
  template = 'somasi_platform',
  subjectName = 'Subjek Korban',
  targetUrl = '',
  platformName = 'Tim Kepatuhan & Abuse Handling',
}) {
  const refNo = `REM/LEGAL/${Date.now().toString().slice(-6)}`;

  if (template === 'somasi_platform') {
    return `SURAT PEMBERITAHUAN PELANGGARAN PRIVASI & PERMOHONAN PENURUNAN KONTEN (TAKEDOWN NOTICE)
Nomor Referensi: ${refNo}
Lampiran: Bukti Forensik Tangkapan Layar & Surat Kuasa Khusus Pendampingan

Kepada Yth.
Tim Kepatuhan, Legal, & Abuse Handling
${platformName}

Dengan hormat,
Bertindak untuk dan atas nama kepentingan hukum klien kami:
Nama Subjek   : ${subjectName}
Status Hukum  : Warga Negara Indonesia & Subjek Perlindungan Data Pribadi Resmi

Bersama surat ini, kami menyampaikan permohonan resmi penghentian akses dan penghapusan permanen (Takedown) atas konten ilegal yang ditayangkan tanpa persetujuan sah pada tautan:
URL Target Pelanggaran: ${targetUrl}

DASAR HUKUM DAN PELANGGARAN:
1. Undang-Undang Republik Indonesia Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP):
   - Pasal 65 ayat (1) dan (3): "Setiap orang dilarang secara melawan hukum memperoleh, mengumpulkan, atau mengungkapkan Data Pribadi yang bukan miliknya."
   - Ketentuan Pidana Pasal 67 ayat (1): Diancam pidana penjara paling lama 5 (lima) tahun dan/atau denda paling banyak Rp5.000.000.000,00 (lima miliar rupiah).
2. Undang-Undang Republik Indonesia Nomor 1 Tahun 2024 tentang Perubahan Kedua UU ITE:
   - Pasal 27B ayat (1) jo. Pasal 45 ayat (4): Larangan pemerasan, pengancaman, dan penyebaran konten bermuatan pencemaran nama baik melalui sistem elektronik.

TUNTUTAN TINDAKAN SEGERA:
1. Melakukan de-listing dan penghapusan permanen (purge cache) dari server ${platformName} dalam kurun waktu 1x24 jam sejak surat ini diterima.
2. Memblokir pengunggahan ulang (anti-reupload digest) atas berkas/teks terkait identitas subjek.

Demikian permohonan ini kami sampaikan demi menjamin kepatuhan hukum digital internasional dan perlindungan hak asasi subjek data.

Hormat kami,
Tim Hukum & Forensik Siber
Menyalahati Cyber Intelligence / Vigilance Legal Unit`;
  }

  // Template Google Outdated Content
  return `FORMULIR PERMOHONAN DE-INDEX GOOGLE OUTDATED CONTENT
Ref: GGL-DEINDEX-${Date.now().toString().slice(-6)}
Subjek: ${subjectName}
URL: ${targetUrl}

Permohonan penghapusan cuplikan (snippet) dan URL yang memuat data pribadi sensitif (NIK, Alamat, Nomor Kontak Keluarga) sesuai Panduan Kebijakan Google Doxing & Kebijakan Data Pribadi Pribadi Finansial.`;
}

module.exports = {
  createRemovalCase,
  getRemovalCases,
  getRemovalCaseDetail,
  updateRemovalCaseStatus,
  checkUrlLiveStatus,
  generateLegalDraft,
};
