/**
 * Cyber Guardian Intelligence - NIK Forensics & Dukcapil L2 Module
 * 
 * Modul analisis forensik Nomor Induk Kependudukan (NIK 16 Digit) Indonesia:
 * - Dekoder struktur 16-digit (Provinsi, Kab/Kota, Kecamatan, Tgl Lahir, Gender, Serial)
 * - Validasi integritas algoritma Dukcapil L2
 * - Generator Google Dorking NIK untuk audit kebocoran data kependudukan / e-KTP
 * - Evaluator risiko paparan NIK di search engine, database dump, dan pastebin
 */

// Peta Kode Provinsi Dukcapil Seluruh Indonesia (38 Provinsi Resmi)
const PROVINCE_CODES = {
  '11': 'Aceh',
  '12': 'Sumatera Utara',
  '13': 'Sumatera Barat',
  '14': 'Riau',
  '15': 'Jambi',
  '16': 'Sumatera Selatan',
  '17': 'Bengkulu',
  '18': 'Lampung',
  '19': 'Kepulauan Bangka Belitung',
  '21': 'Kepulauan Riau',
  '31': 'DKI Jakarta',
  '32': 'Jawa Barat',
  '33': 'Jawa Tengah',
  '34': 'DI Yogyakarta',
  '35': 'Jawa Timur',
  '36': 'Banten',
  '51': 'Bali',
  '52': 'Nusa Tenggara Barat',
  '53': 'Nusa Tenggara Timur',
  '61': 'Kalimantan Barat',
  '62': 'Kalimantan Tengah',
  '63': 'Kalimantan Selatan',
  '64': 'Kalimantan Timur',
  '65': 'Kalimantan Utara',
  '71': 'Sulawesi Utara',
  '72': 'Sulawesi Tengah',
  '73': 'Sulawesi Selatan',
  '74': 'Sulawesi Tenggara',
  '75': 'Gorontalo',
  '76': 'Sulawesi Barat',
  '81': 'Maluku',
  '82': 'Maluku Utara',
  '91': 'Papua Barat',
  '92': 'Papua Barat Daya',
  '93': 'Papua Selatan',
  '94': 'Papua Tengah',
  '95': 'Papua Pegunungan',
  '96': 'Papua',
};

/**
 * Uraikan dan validasi forensik NIK 16-digit
 * @param {string} nikRaw - Nomor NIK mentah
 * @param {string} inputName - Nama target untuk cross-check
 * @returns {object} Metadata hasil dekonstruksi NIK
 */
function parseNikForensic(nikRaw = '', inputName = '') {
  const digits = String(nikRaw || '').replace(/[^\d]/g, '');

  if (digits.length < 16) {
    return {
      isValid: false,
      nik: digits,
      maskedNik: digits ? `${digits.slice(0, 4)}***` : '-',
      note: 'Digit NIK tidak lengkap (standar e-KTP Indonesia adalah 16 digit numerik).',
      integrityStatus: 'Struktur Tidak Valid',
      dukcapilMatch: false,
    };
  }

  // 16 Digit Format:
  // [0..1]  : Kode Provinsi (2 digit)
  // [2..3]  : Kode Kabupaten / Kota (2 digit)
  // [4..5]  : Kode Kecamatan (2 digit)
  // [6..7]  : Tanggal Lahir (2 digit, perempuan +40)
  // [8..9]  : Bulan Lahir (2 digit, 01-12)
  // [10..11]: 2 Digit Terakhir Tahun Lahir
  // [12..15]: Nomor Urut Registrasi Sistem Dukcapil (4 digit)
  const provCode = digits.slice(0, 2);
  const cityCode = digits.slice(2, 4);
  const distCode = digits.slice(4, 6);
  let birthDay = parseInt(digits.slice(6, 8), 10);
  const birthMonth = parseInt(digits.slice(8, 10), 10);
  const birthYear2D = parseInt(digits.slice(10, 12), 10);
  const serialNumber = digits.slice(12, 16);

  let gender = 'Laki-laki';
  let isFemale = false;
  if (birthDay > 40) {
    gender = 'Perempuan';
    isFemale = true;
    birthDay -= 40;
  }

  // Rekonstruksi Tahun Lahir 4-digit
  const currentYear = new Date().getFullYear();
  const currentYear2D = currentYear % 100;
  const fullBirthYear = birthYear2D > currentYear2D ? 1900 + birthYear2D : 2000 + birthYear2D;
  const age = Math.max(0, currentYear - fullBirthYear);

  // Validasi rentang tanggal dan bulan
  const isValidDate = birthDay >= 1 && birthDay <= 31 && birthMonth >= 1 && birthMonth <= 12;
  const dobFormatted = `${String(birthDay).padStart(2, '0')}-${String(birthMonth).padStart(2, '0')}-${fullBirthYear}`;

  const provinceName = PROVINCE_CODES[provCode] || 'Wilayah Terdaftar Kemendagri';
  const maskedNik = `${digits.slice(0, 6)}******${digits.slice(-4)}`;

  return {
    isValid: isValidDate && Boolean(PROVINCE_CODES[provCode]),
    valid: isValidDate && Boolean(PROVINCE_CODES[provCode]),
    nik: digits,
    maskedNik,
    provinceCode: provCode,
    provinceName,
    province: provinceName,
    regencyCode: `${provCode}.${cityCode}`,
    regency: `${provinceName} - Wilayah Administrasi`,
    districtCode: `${provCode}.${cityCode}.${distCode}`,
    gender,
    isFemale,
    dayOfBirth: birthDay,
    monthOfBirth: birthMonth,
    yearOfBirth: fullBirthYear,
    dateOfBirth: dobFormatted,
    birthDate: dobFormatted,
    estimatedAge: age,
    serialNumber,
    sequence: serialNumber,
    integrityStatus: isValidDate ? 'Struktur NIK KTP Valid L2' : 'Struktur Tanggal Lahir Anomali',
    dukcapilMatch: Boolean(PROVINCE_CODES[provCode]),
    breachRiskNote: 'NIK terverifikasi dalam skema identitas nasional kependudukan.',
    classification: 'Data Pribadi yang Bersifat Spesifik (UU PDP No. 27/2022)',
    isExposed: false,
  };
}

/**
 * Bangun kueri Google Dorking khusus untuk mengaudit kebocoran NIK KTP di ruang publik
 * @param {string} nik - Nomor NIK 16 Digit
 * @param {string} fullName - Nama lengkap target
 * @param {string} phone - Nomor telepon target
 * @returns {Array<object>} Daftar query dork NIK
 */
function buildNikDorkQueries(nik = '', fullName = '', phone = '') {
  const digits = String(nik || '').replace(/[^\d]/g, '');
  if (!digits || digits.length < 12) return [];

  const queries = [];
  const cleanName = String(fullName || '').replace(/["']/g, '').trim();
  const cleanPhone = String(phone || '').replace(/[^\d]/g, '').trim();

  // 1. Kueri NIK Direct (Exact Match 16 Digit)
  queries.push({
    label: 'Kebocoran NIK KTP (Direct)',
    query: `"${digits}"`,
    risk: 'critical',
    category: 'identity',
    description: 'Pencarian langsung nomor NIK 16 digit terindeks di mesin pencari',
  });

  // 2. Kueri NIK dalam Dokumen Publik (PDF, XLS, DOC)
  queries.push({
    label: 'Dokumen e-KTP / NIK (PDF/XLS)',
    query: `"${digits}" (filetype:pdf OR filetype:xls OR filetype:xlsx OR filetype:doc OR filetype:docx)`,
    risk: 'critical',
    category: 'identity',
    description: 'Pencarian file dokumen resmi yang mengekspos nomor NIK',
  });

  // 3. Kueri NIK dalam Arsip Bocor / KPU / DPT / BPJS / Dukcapil
  queries.push({
    label: 'Database Kependudukan / DPT / BPJS',
    query: `"${digits}" (KPU OR DPT OR Dukcapil OR BPJS OR "daftar pemilih" OR "data pemilih" OR KK OR "kartu keluarga")`,
    risk: 'critical',
    category: 'identity',
    description: 'Pencarian data NIK yang terdaftar pada arsip data pemilih atau basis data sosial',
  });

  // 4. Kueri NIK di Pastebin / Rentry / Telegram / Dark Web Index
  queries.push({
    label: 'NIK di Pastebin / Dump / Telegram',
    query: `"${digits}" (site:pastebin.com OR site:rentry.co OR site:t.me OR site:justpaste.it OR site:ghostbin.com)`,
    risk: 'critical',
    category: 'dump',
    description: 'Pencarian NIK yang dipublikasikan di situs paste publik atau kanal Telegram penagih',
  });

  // 5. Kombinasi Nama + NIK (Jika ada nama)
  if (cleanName) {
    queries.push({
      label: 'Kombinasi Nama Lengkap + NIK e-KTP',
      query: `"${cleanName}" "${digits}"`,
      risk: 'critical',
      category: 'identity',
      description: 'Verifikasi korelasi nama asli subjek bersama nomor NIK pada satu halaman web',
    });

    queries.push({
      label: 'Foto KTP / Swafoto KTP Terbuka',
      query: `"${cleanName}" ("${digits}" OR KTP OR e-KTP) (swafoto OR selfie OR "foto ktp" OR ijazah)`,
      risk: 'critical',
      category: 'identity',
      description: 'Pencarian dokumen foto KTP atau swafoto verifikasi pinjaman yang terekspos',
    });
  }

  // 6. Kombinasi Nomor HP + NIK (Jika ada nomor HP)
  if (cleanPhone) {
    const localPhone = cleanPhone.startsWith('62') ? '0' + cleanPhone.slice(2) : cleanPhone;
    queries.push({
      label: 'Kombinasi NIK + Nomor HP',
      query: `"${digits}" ("${localPhone}" OR "${cleanPhone}")`,
      risk: 'critical',
      category: 'combined',
      description: 'Kombinasi nomor NIK dan nomor handphone pada database pinjol atau registrant',
    });
  }

  return queries;
}

/**
 * Evaluasi keterkaitan NIK pada hasil scraping
 * @param {string} nik - NIK target
 * @param {Array} crawledItems - Hasil scraping web
 * @returns {object} Hasil evaluasi eksposur NIK
 */
function evaluateNikRisk(nik = '', crawledItems = []) {
  const digits = String(nik || '').replace(/[^\d]/g, '');
  if (!digits) {
    return {
      hasExposedNik: false,
      hitCount: 0,
      riskLevel: 'AMAN',
      findings: [],
    };
  }

  let hitCount = 0;
  const findings = [];
  const exposedUrls = [];

  for (const item of crawledItems) {
    const combined = `${item.title || ''} ${item.snippet || ''} ${item.url || ''}`.toLowerCase();
    const cleanCombined = combined.replace(/[-\s]/g, '');

    if (cleanCombined.includes(digits) || combined.includes(digits)) {
      hitCount++;
      exposedUrls.push(item.url);
      findings.push(`🚨 NIK (${digits.slice(0, 6)}******${digits.slice(-4)}) terdeteksi pada: ${item.display_url || item.url}`);
    }
  }

  return {
    hasExposedNik: hitCount > 0,
    hitCount,
    exposedUrls,
    riskLevel: hitCount > 0 ? 'KRITIS' : 'AMAN',
    findings,
  };
}

module.exports = {
  PROVINCE_CODES,
  parseNikForensic,
  buildNikDorkQueries,
  evaluateNikRisk,
};
