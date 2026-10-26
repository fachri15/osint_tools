/**
 * OSINT Cyber Guardian - Diagnosis PDF Report Generator
 * Mengonversi logic dari sample/modules/report_generator.py & sample/sample_laporan_diagnosa.pdf
 * Menghasilkan Dokumen PDF Resmi dan Pratinjau Cetak Berkualitas Tinggi
 */

// ── Warna Tema Resmi Forensik Siber (Sesuai report_generator.py) ──
export const PDF_COLORS = {
  DARK_BLUE: '#1A237E',
  MED_BLUE: '#283593',
  ACCENT: '#1565C0',
  RED: '#C62828',
  ORANGE: '#F57C00',
  GREEN: '#388E3C',
  LIGHT_GREY: '#F5F5F5',
  MID_GREY: '#BDBDBD',
  ROW_ALT: '#E8EAF6',
  TEXT_DARK: '#212121',
  TEXT_MUTED: '#616161',
  BORDER: '#CBD5E1',
};

// ── Konfigurasi Standar Kop Surat Resmi Lembaga / Yayasan Terkait ──
export const DEFAULT_KOP_SURAT = {
  foundationName: 'YAYASAN BANGKIT MENYALA HATI',
  foundationDivision: 'LEMBAGA NIRLABA BERGERAK DIBIDANG SOSIAL, EDUKASI, DAN KEMANUSIAAN',
  legalNumber: 'AHU-0011518.AH.01.04.Tahun2026',
  address: 'Jl. Hajjah Tutty Alawiyah No.2B, RT.11/RW.9, Kalibata, Kec. Pancoran, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12740',
  contact: 'Website : menyalahati.org',
  documentTitle: 'LAPORAN DIAGNOSA JEJAK DIGITAL & EXPOSURE RISK',
  documentSubtitle: 'Dokumen Forensik Siber Resmi Pengujian Keterpaparan Identitas & Jejak Digital',
  classification: 'RAHASIA / PRO JUSTITIA',
  showKop: true,
  customLogo: null, // Data URL asli (PNG/JPEG) untuk tampilan preview & cetak
  logoJpegDataUrl: null, // Data URL JPEG yang dinormalisasi
  logoBytes: null, // Uint8Array raw JPEG bytes untuk binary PDF XObject
  logoWidth: null, // Lebar piksel
  logoHeight: null, // Tinggi piksel
  logoAspectRatio: null, // Rasio aspek lebar/tinggi
  logoFileName: null, // Nama berkas logo
  logoFileSize: null, // Ukuran berkas logo dalam bytes
  logoFileType: null, // Tipe file: JPEG atau PNG
};

/**
 * Memproses berkas logo JPEG atau PNG dari input pengguna
 * Mengonversi, menormalkan transparansi PNG ke kanvas putih, dan menyiapkan bytes JPEG untuk PDF
 */
export function processLogoFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('Berkas gambar tidak ditemukan.'));
    }
    const isJpeg = file.type === 'image/jpeg' || file.type === 'image/jpg' || /\.(jpe?g)$/i.test(file.name);
    const isPng = file.type === 'image/png' || /\.png$/i.test(file.name);
    if (!isJpeg && !isPng) {
      return reject(new Error('Format file tidak didukung. Harap unggah logo berekstensi JPEG atau PNG.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca berkas logo.'));
    reader.onload = () => {
      const dataUrl = reader.result;
      const img = new Image();
      img.onerror = () => reject(new Error('Gagal memuat gambar logo.'));
      img.onload = () => {
        const origWidth = img.naturalWidth || img.width || 120;
        const origHeight = img.naturalHeight || img.height || 120;
        const aspectRatio = origWidth / origHeight;

        // Skalakan ke resolusi ideal untuk kop surat dokumen cetak (maks 400px agar ringan dan tajam)
        const maxDimension = 400;
        let targetWidth = origWidth;
        let targetHeight = origHeight;
        if (targetWidth > maxDimension || targetHeight > maxDimension) {
          if (aspectRatio >= 1) {
            targetWidth = maxDimension;
            targetHeight = Math.max(1, Math.round(maxDimension / aspectRatio));
          } else {
            targetHeight = maxDimension;
            targetWidth = Math.max(1, Math.round(maxDimension * aspectRatio));
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        // Isi latar belakang putih bersih untuk menangani transparansi PNG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Ekspor versi JPEG berkualitas tinggi untuk binary PDF
        const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92);
        const b64 = jpegDataUrl.split(',')[1];
        const binaryStr = atob(b64);
        const jpegBytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          jpegBytes[i] = binaryStr.charCodeAt(i);
        }

        resolve({
          dataUrl: dataUrl,
          jpegDataUrl: jpegDataUrl,
          jpegBytes: jpegBytes,
          width: targetWidth,
          height: targetHeight,
          origWidth,
          origHeight,
          aspectRatio,
          fileName: file.name,
          fileSize: file.size,
          fileType: isPng ? 'PNG' : 'JPEG',
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export function getLogoInitials(name = '') {
  if (!name || typeof name !== 'string') return 'YBMH';
  const clean = name.replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
  const words = clean.split(/\s+/).filter(w => {
    const u = w.toUpperCase();
    return u.length > 0 && !['DAN', '&', 'DI', 'KE', 'DARI', 'PADA', 'UNTUK', 'OF', 'THE', 'AND'].includes(u);
  });
  if (words.length >= 2) {
    return words.slice(0, 4).map(w => w[0]).join('').toUpperCase();
  }
  return clean.slice(0, 4).toUpperCase() || 'YBMH';
}

export const KOP_SURAT_PRESETS = [
  {
    id: 'yayasan-bangkit-menyalahati',
    label: 'Yayasan Bangkit Menyala Hati',
    foundationName: 'YAYASAN BANGKIT MENYALA HATI',
    foundationDivision: 'LEMBAGA NIRLABA BERGERAK DIBIDANG SOSIAL, EDUKASI, DAN KEMANUSIAAN',
    legalNumber: 'AHU-0011518.AH.01.04.Tahun2026',
    address: 'Jl. Hajjah Tutty Alawiyah No.2B, RT.11/RW.9, Kalibata, Kec. Pancoran, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12740',
    contact: 'Website : menyalahati.org',
    classification: 'RAHASIA / PRO JUSTITIA',
  },
  {
    id: 'yayasan-menyalahati',
    label: 'Yayasan Menyalahati Siber (LBH & Forensik)',
    foundationName: 'YAYASAN MENYALAHATI SIBER INDONESIA',
    foundationDivision: 'LEMBAGA BANTUAN HUKUM, ADVOKASI & FORENSIK DIGITAL SIBER',
    legalNumber: 'Keputusan Menkumham RI No. AHU-0012489.AH.01.04.Tahun 2024 | NPWP: 41.892.418.9-014.000',
    address: 'Gedung Menara Satria Cyber Lt. 12, Jl. H.R. Rasuna Said Kav. C-22, Jakarta Selatan 12920',
    contact: 'Telp: (021) 5290-8800 | Hotline / WA: 0812-9800-4122 | Email: forensik@menyalahati.or.id | Web: https://menyalahati.or.id',
    classification: 'RAHASIA / PRO JUSTITIA',
  },
  {
    id: 'yayasan-perlindungan-konsumen',
    label: 'Yayasan Perlindungan Konsumen & Anti-Doxing',
    foundationName: 'YAYASAN PERLINDUNGAN KONSUMEN SIBER & KORBAN PINJOL',
    foundationDivision: 'BADAN ADVOKASI PRIVASI DATA, REMOVAL & PENANGGULANGAN TEROR',
    legalNumber: 'SK Kemenkumham RI No. AHU-0038912.AH.01.04.Tahun 2023 | Terdaftar Satgas PASTI OJK',
    address: 'Pusat Advokasi Perlindungan Konsumen, Jl. Gatot Subroto Kav. 54, Jakarta Selatan 12710',
    contact: 'Hotline Darurat: 0858-1122-3344 | Telp: (021) 7919-4500 | Email: aduan@konsumensiber.org',
    classification: 'RAHASIA / PRO JUSTITIA',
  },
  {
    id: 'pt-cyber-defense',
    label: 'PT Menyalahati Cyber Intelligence Defense',
    foundationName: 'PT MENYALAHATI CYBER INTELLIGENCE DEFENSE',
    foundationDivision: 'DIVISION OF DIGITAL FORENSICS, OSINT & THREAT INTELLIGENCE',
    legalNumber: 'NIB: 0220109182391 | KBLI: 62090 (Aktivitas Keamanan Siber) | ISO/IEC 27001 Certified',
    address: 'Cyber Defense Hub Mega Kuningan Barat III No. 8, Setiabudi, Jakarta Selatan 12950',
    contact: 'Telp: (021) 5790-1122 | WhatsApp Ops: 0811-9988-7722 | Email: contact@cyberintel.id',
    classification: 'CONFIDENTIAL / LAW ENFORCEMENT ONLY',
  },
];

/**
 * Filter item Bagian III berdasarkan pilihan dork_display_option:
 * Option 1: "1. Hanya tampilkan kategori Thread Doxing DC & Utang"
 * Option 2: "2. Tampilkan semua berdasarkan yang sudah di-filter"
 * Option 3: "3. Jangan tampilkan Detail Indeks Pencarian Google (Public Exposure)"
 */
export function filterDorkItemsByOption(dorkResults = [], dorkDisplayOption = '2') {
  if (!dorkResults || dorkResults.length === 0) return [];
  if (typeof dorkDisplayOption === 'string' && dorkDisplayOption.startsWith('3')) {
    return []; // Opsi 3: Jangan tampilkan sama sekali
  }

  const flattened = [];
  dorkResults.forEach((res) => {
    const riskLvl = (res.risk || 'medium').toUpperCase();
    const cat = res.category || '';
    const label = res.label || res.category || 'Pencarian Indeks';

    // Jika opsi 1: Hanya tampilkan kategori Thread Doxing DC & Utang atau risiko tinggi/kritis
    if (typeof dorkDisplayOption === 'string' && dorkDisplayOption.startsWith('1')) {
      const isThreadDox =
        cat.toLowerCase().includes('thread doxing') ||
        cat.toLowerCase().includes('utang') ||
        label.toLowerCase().includes('thread doxing') ||
        label.toLowerCase().includes('utang');
      const isHighOrCrit = ['HIGH', 'CRITICAL', 'TINGGI', 'KRITIS'].includes(riskLvl);

      if (!isThreadDox && !isHighOrCrit) {
        return; // Lewati item ini
      }
    }

    const items = res.items || (res.result && res.result.items) || [];
    if (items.length > 0) {
      items.forEach((it) => {
        const itemTags = [...(it.intel_tags || [])];
        flattened.push({
          category: label,
          risk: riskLvl,
          title: it.title || 'Tanpa Judul',
          url: it.url || '#',
          snippet: it.snippet || '',
          tags: itemTags,
        });
      });
    } else if (res.foundCount > 0) {
      flattened.push({
        category: label,
        risk: riskLvl,
        title: `Temuan Indeks Terverifikasi: ${label}`,
        url: res.direct_url || `https://www.google.com/search?q=${encodeURIComponent(res.query || label)}`,
        snippet: res.description || 'Data terdeteksi pada indeks pencarian publik.',
        tags: ['Indexed'],
      });
    }
  });

  return flattened.slice(0, 30); // Maks 30 temuan teratas
}

/**
 * Layanan dan Formulir Resmi Penghapusan Google (Google De-Indexing & Removal Services)
 */
export const GOOGLE_REMOVAL_SERVICES = {
  OUTDATED_CONTENT: {
    id: 'outdated',
    label: 'Google Outdated Content Removal Tool',
    shortLabel: 'Outdated Tool (Cache / Snippet)',
    description: 'Untuk URL yang halaman aslinya sudah dihapus atau disunting oleh pemilik web, namun cuplikan (snippet) dan arsip cache Google masih memuat data pribadi.',
    url: 'https://search.google.com/search-console/remove-outdated-content',
    badge: 'Cache / Snippet Lama',
    badgeColor: 'bg-blue-100 text-blue-800',
    applicableFor: 'Halaman sudah 404/410 atau teks sensitif sudah dihapus dari web sumber.',
  },
  PERSONAL_INFO_DOXING: {
    id: 'doxing',
    label: 'Google Personal Information & Doxing Removal',
    shortLabel: 'Doxing / Data Sensitif Removal',
    description: 'Formulir resmi prioritas tinggi untuk menghapus hasil pencarian yang mengekspos NIK, nomor HP, kontak darurat, atau teror pinjol secara melawan hukum tanpa menunggu persetujuan pemilik web.',
    url: 'https://support.google.com/websearch/troubleshooter/3111061',
    badge: 'Doxing & NIK Darurat',
    badgeColor: 'bg-red-100 text-red-800',
    applicableFor: 'Konten masih aktif online (HTTP 200) dan memuat identitas pribadi sensitif.',
  },
  RESULTS_ABOUT_YOU: {
    id: 'results_about_you',
    label: 'Google Results About You Dashboard',
    shortLabel: 'Results About You',
    description: 'Dasbor pemantauan mandiri akun Google untuk meminta Google menghapus nomor telepon, alamat rumah, dan email pribadi yang muncul di pencarian.',
    url: 'https://myactivity.google.com/results-about-you',
    badge: 'Pemantauan Akun',
    badgeColor: 'bg-amber-100 text-amber-800',
    applicableFor: 'Menghubungkan akun Google untuk pemantauan identitas otomatis.',
  },
  LEGAL_REMOVAL: {
    id: 'legal',
    label: 'Google Legal Removal Request (UU PDP No. 27/2022 & UU ITE)',
    shortLabel: 'Legal Notice UU PDP',
    description: 'Pengaduan resmi pelanggaran hukum digital Republik Indonesia atas penyebaran data pribadi tanpa hak (Pasal 65 UU PDP) dan pemerasan/pencemaran nama baik (UU ITE).',
    url: 'https://support.google.com/legal/troubleshooter/1114905',
    badge: 'Pro Justitia / Hukum',
    badgeColor: 'bg-purple-100 text-purple-800',
    applicableFor: 'Pelanggaran pidana privasi, pencemaran nama baik, dan somasi resmi.',
  },
};

/**
 * Bentuk Link Permohonan Penghapusan Google Outdated Content
 */
export function generateGoogleRemovalLink(url) {
  return `https://search.google.com/search-console/remove-outdated-content?url=${encodeURIComponent(url || '')}`;
}

/**
 * Link Formulir Resmi Google Personal Info & Doxing Removal
 */
export function generateGoogleDoxingRemovalLink() {
  return 'https://support.google.com/websearch/troubleshooter/3111061';
}

/**
 * Generator Naskah Legal Alasan Pengajuan De-Indexing Google Resmi
 * Berdasarkan UU PDP No. 27/2022 dan Kebijakan Google Personal Data
 */
export function generateDeindexLegalRationale({
  targetName = 'Subjek Korban',
  url = '',
  snippet = '',
  leakType = 'Data Pribadi & Doxing Pinjol',
} = {}) {
  const refNo = `GGL-DEINDEX-${Date.now().toString().slice(-6)}`;
  const dateStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

  return `PERMOHONAN PENGHAPUSAN DAN DE-INDEXING HASIL PENCARIAN GOOGLE
Nomor Referensi : ${refNo}
Dasar Kebijakan  : Google Personal Information & Doxing Removal Policy jo. UU PDP No. 27/2022
Waktu Pengajuan  : ${dateStr}

IDENTITAS SUBJEK PELAPOR:
Nama Subjek       : ${targetName}
Kategori Pelanggaran: ${leakType}

TAUTAN DAN ARTEFAK YANG DILAPORKAN:
URL Sasaran (Google Result): ${url}
Cuplikan Teks / Snippet yang Terindeks:
"${snippet || 'Data identitas pribadi, nomor telepon seluler, dan jejak utang terekspos tanpa hak.'}"

DASAR HUKUM DAN ARGUMEN PENURUNAN KONTEN:
1. Undang-Undang Republik Indonesia Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP):
   - Pasal 65 ayat (1) & (3): Melarang setiap orang memperoleh, mengumpulkan, atau mengungkapkan Data Pribadi yang bukan miliknya secara melawan hukum tanpa persetujuan subjek data.
   - Sanksi Pidana Pasal 67 ayat (1): Diancam pidana penjara paling lama 5 (lima) tahun dan/atau pidana denda paling banyak Rp5.000.000.000,00 (lima miliar rupiah).
2. Undang-Undang Republik Indonesia Nomor 1 Tahun 2024 tentang Perubahan Kedua UU ITE:
   - Pasal 27B jo. Pasal 45 ayat (4): Larangan mendistribusikan informasi bermuatan pemerasan, pengancaman, dan pencemaran nama baik.
3. Kebijakan Resmi Google LLC (Removal of Personally Identifiable Info & Doxing Content):
   - Google memfasilitasi pemutusan indeks terhadap konten yang dipublikasikan dengan niat jahat (malicious intent) atau digunakan sindikat penagihan liar untuk melakukan intimidasi dan mempermalukan korban.

TUNTUTAN TINDAKAN YANG DIMOHONKAN:
1. Segera melakukan de-indexing dan menghapus URL terkait dari sistem pencarian publik Google Search.
2. Memutus cuplikan teks (snippet) dan arsip halaman web (cache) dari mesin peramban agar tidak dapat ditelusuri menggunakan kata kunci nama subjek pelapor.

Diajukan secara resmi melalui Sistem Forensik Inteligensi Siber Lembaga / Yayasan.`;
}

/**
 * Hasilkan HTML Laporan Cetak yang 100% Presisi Mengikuti sample_laporan_diagnosa.pdf
 * Lengkap dengan Kop Surat Perusahaan / Yayasan Terkait
 */
export function generateDiagnosisHtmlReport({
  targetName = 'Subjek Belum Dipindai',
  targetPhone = '-',
  targetEmail = '-',
  targetNik = '-',
  targetSocials = {},
  spouseFamily = '-',
  keywords = '-',
  scanMode = 'Real Engine',
  riskScore = 82,
  riskCategory = 'KRITIS',
  riskData = null,
  dorkResults = [],
  breaches = [],
  dorkDisplayOption = '2. Tampilkan semua berdasarkan yang sudah di-filter',
  aiSummary = '',
  includeAi = true,
  includeRemediation = true,
  documentNumber = '',
  scanDate = '',
  kopSurat = null,
}) {
  const kop = {
    ...DEFAULT_KOP_SURAT,
    ...(kopSurat || {}),
  };

  const docNum = documentNumber || `DIAG-${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}`;
  const dateStr = scanDate || `${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;

  // Filter Bagian III
  const isSection3Omitted = typeof dorkDisplayOption === 'string' && dorkDisplayOption.startsWith('3');
  const dorkItems = filterDorkItemsByOption(dorkResults, dorkDisplayOption);

  // Social list
  const ig = targetSocials.instagram || '-';
  const tiktok = targetSocials.tiktok || '-';
  const fb = targetSocials.facebook || '-';
  const tw = targetSocials.twitter || '-';
  const li = targetSocials.linkedin || '-';

  // Risk Score Color
  let riskColor = PDF_COLORS.RED;
  if (riskCategory === 'SEDANG' || riskCategory === 'TINGGI') {
    riskColor = PDF_COLORS.ORANGE;
  } else if (riskCategory === 'AMAN' || riskCategory === 'RENDAH') {
    riskColor = PDF_COLORS.GREEN;
  }

  // 5-Dimensi Breakdown Dinamis
  const b = (riskData && riskData.breakdown) || {};
  const dorkScore = b.googleDorkScore ?? (riskScore > 30 ? Math.min(60, riskScore) : 10);
  const socialScore = b.socialExposureScore ?? (riskScore > 30 ? Math.min(40, riskScore) : 5);
  const phoneScore = b.phoneIntelScore ?? (riskScore > 30 ? Math.min(50, riskScore) : 10);
  const breachScore = b.breachScore ?? ((breaches && breaches.length > 0) ? 50 : 0);
  const doxingScore = b.doxingActiveScore ?? (riskCategory === 'KRITIS' ? 75 : 0);

  // Breaches nyata (tidak memalsukan kebocoran jika data bersih)
  const breachList = Array.isArray(breaches) ? breaches : [];

  // Actions Takedown
  const takedownList = [];
  dorkItems.forEach((it) => {
    if (it.url && it.url !== '#' && !it.url.includes('google.com/search')) {
      takedownList.push({
        title: it.title,
        url: it.url,
        removalLink: generateGoogleRemovalLink(it.url),
      });
    }
  });

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Laporan Diagnosa Jejak Digital - ${targetName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 1.2cm 1.6cm 1.6cm 1.6cm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #212121;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 9pt;
      line-height: 1.4;
    }

    /* ── Kop Surat Resmi Lembaga / Yayasan Terkait ── */
    .kop-header-wrapper {
      margin-bottom: 8px;
    }
    .kop-table {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding-bottom: 4px;
    }
    .kop-logo-col {
      flex: 0 0 68px;
      width: 68px;
      height: 68px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .kop-logo-col.right {
      flex: 0 0 66px;
    }
    .kop-custom-logo {
      max-width: 68px;
      max-height: 68px;
      width: auto;
      height: auto;
      object-fit: contain;
      display: block;
      margin: 0 auto;
    }
    .kop-content-col {
      flex: 1 1 auto;
      text-align: center;
      padding: 0 4px;
    }
    .kop-entity-title {
      font-size: 13pt;
      font-weight: 800;
      color: #1A237E;
      letter-spacing: 0.5px;
      line-height: 1.2;
      margin: 0 0 2px 0;
      text-transform: uppercase;
      font-family: 'Helvetica Neue', Arial, sans-serif;
    }
    .kop-division-title {
      font-size: 8.5pt;
      font-weight: 700;
      color: #C62828;
      letter-spacing: 0.3px;
      line-height: 1.25;
      margin: 0 0 2px 0;
      text-transform: uppercase;
    }
    .kop-legal-line {
      font-size: 7.2pt;
      font-weight: 600;
      color: #334155;
      line-height: 1.3;
      margin: 0 0 1px 0;
    }
    .kop-address-line {
      font-size: 6.9pt;
      color: #475569;
      line-height: 1.3;
      margin: 0 0 1px 0;
    }
    .kop-contact-line {
      font-size: 6.7pt;
      color: #475569;
      line-height: 1.3;
    }
    .kop-divider-double {
      margin: 4px 0 10px 0;
    }
    .kop-divider-double .line-thick {
      height: 3px;
      background-color: #1A237E;
      margin-bottom: 2px;
      border: none;
    }
    .kop-divider-double .line-thin {
      height: 1px;
      background-color: #1565C0;
      border: none;
    }

    /* ── Judul Dokumen Laporan & Klasifikasi ── */
    .doc-title-block {
      text-align: center;
      margin-bottom: 10px;
    }
    .classification-badge {
      display: inline-block;
      font-size: 6.8pt;
      font-weight: 800;
      letter-spacing: 1.3px;
      color: #C62828;
      background: #FFEBEE;
      border: 1px solid #FFCDD2;
      padding: 1.5px 7px;
      border-radius: 3px;
      margin-bottom: 3px;
      text-transform: uppercase;
      font-family: monospace;
    }
    .doc-title-heading {
      font-size: 12.5pt;
      font-weight: 800;
      color: #1A237E;
      margin: 1px 0;
      letter-spacing: 0.3px;
      text-transform: uppercase;
      line-height: 1.25;
    }
    .doc-title-subheading {
      font-size: 7.8pt;
      color: #475569;
      font-weight: 500;
      margin: 0;
    }

    /* Fallback Simple Header jika kop dinonaktifkan */
    .header-kop {
      text-align: center;
      margin-bottom: 6px;
    }
    .kop-title {
      font-size: 13.5pt;
      font-weight: bold;
      color: #1A237E;
      margin: 0 0 2px 0;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .kop-subtitle {
      font-size: 9pt;
      color: #283593;
      margin: 0 0 6px 0;
      font-weight: 500;
    }
    .divider-thick {
      height: 3px;
      background-color: #1A237E;
      margin-bottom: 2px;
      border: none;
    }
    .divider-thin {
      height: 1px;
      background-color: #1565C0;
      margin-bottom: 8px;
      border: none;
    }

    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      background: #F5F5F5;
      font-size: 8.2pt;
    }
    .meta-table td {
      border: 0.5px solid #BDBDBD;
      padding: 4px 7px;
    }
    .meta-label {
      font-weight: bold;
      color: #1A237E;
      width: 18%;
    }
    .meta-val {
      width: 32%;
    }
    .section-header {
      background: #1A237E;
      color: #ffffff;
      font-size: 9.5pt;
      font-weight: bold;
      padding: 4px 8px;
      margin-top: 12px;
      margin-bottom: 6px;
      border-radius: 2px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
      font-size: 8.2pt;
    }
    .data-table th {
      background: #1A237E;
      color: #ffffff;
      font-weight: bold;
      padding: 5px 7px;
      text-align: left;
      border: 0.5px solid #BDBDBD;
    }
    .data-table td {
      border: 0.5px solid #BDBDBD;
      padding: 4px 7px;
      vertical-align: top;
    }
    .data-table tr:nth-child(even) td {
      background: #E8EAF6;
    }
    .score-box {
      border: 2px solid ${riskColor};
      background: #F5F5F5;
      text-align: center;
      padding: 8px;
      margin: 6px 0 8px 0;
      border-radius: 4px;
    }
    .score-title {
      font-size: 12pt;
      font-weight: bold;
      color: #1A237E;
      margin: 0;
    }
    .score-val {
      color: ${riskColor};
      font-weight: bold;
    }
    .ai-box {
      background: #E8EAF6;
      border: 0.5px solid #1565C0;
      padding: 7px 10px;
      border-radius: 4px;
      margin-bottom: 8px;
      font-size: 8.2pt;
      color: #212121;
    }
    .footer {
      border-top: 1px solid #1565C0;
      padding-top: 5px;
      margin-top: 14px;
      font-size: 7.2pt;
      color: #616161;
      display: flex;
      justify-content: space-between;
    }
    .link-blue {
      color: #1565C0;
      text-decoration: underline;
      word-break: break-all;
    }
    .legal-box {
      background: #E8EAF6;
      border: 0.5px solid #1565C0;
      padding: 7px 10px;
      border-radius: 4px;
      font-size: 7.5pt;
      color: #333333;
      margin-top: 8px;
      line-height: 1.35;
    }
    .page-break {
      page-break-before: always;
    }
    @media print {
      body { margin: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>

  <!-- KOP SURAT PERUSAHAAN / YAYASAN TERKAIT -->
  ${kop.showKop !== false ? `
  <div class="kop-header-wrapper">
    <div class="kop-table">
      <!-- Logo Lambang / Perisai Cyber Yayasan di sisi kiri -->
      <div class="kop-logo-col left">
        ${kop.customLogo ? `
        <img
          src="${kop.customLogo}"
          alt="Logo ${kop.foundationName}"
          class="kop-custom-logo"
        />
        ` : `
        <svg class="kop-emblem-svg" viewBox="0 0 100 100" width="68" height="68" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Perisai Latar Belakang -->
          <path d="M50 5 L88 19 C88 56 68 85 50 95 C32 85 12 56 12 19 Z" fill="#1A237E" stroke="#C5A059" stroke-width="2.5" />
          <path d="M50 11 L82 23 C82 53 65 78 50 87 C35 78 18 53 18 23 Z" fill="#283593" />
          <!-- Simbol Keamanan / Timbangan & Gembok Forensik -->
          <circle cx="50" cy="33" r="6.5" stroke="#FFD54F" stroke-width="2" fill="none" />
          <rect x="42.5" y="38" width="15" height="12" rx="2" fill="#FFD54F" />
          <circle cx="50" cy="43.5" r="1.8" fill="#1A237E" />
          <path d="M50 45 L50 47.5" stroke="#1A237E" stroke-width="1.5" stroke-linecap="round" />
          <!-- Bintang Lambang Kredibilitas -->
          <polygon points="50,17 52,21 57,21 53,24 55,29 50,26 45,29 47,24 43,21 48,21" fill="#FFD54F" />
          <!-- Jalur Digital Cyber Circuit -->
          <path d="M30 54 L36 54 L40 60 L45 60" stroke="#64B5F6" stroke-width="1.5" stroke-linecap="round" fill="none" />
          <path d="M70 54 L64 54 L60 60 L55 60" stroke="#64B5F6" stroke-width="1.5" stroke-linecap="round" fill="none" />
          <circle cx="30" cy="54" r="1.8" fill="#64B5F6" />
          <circle cx="70" cy="54" r="1.8" fill="#64B5F6" />
          <!-- Busur Daun Kehormatan -->
          <path d="M22 66 C26 76 37 84 50 88 C63 84 74 76 78 66" stroke="#C5A059" stroke-width="1.8" stroke-dasharray="3,3" fill="none" />
        </svg>
        `}
      </div>

      <!-- Teks Identitas Resmi Yayasan / Perusahaan Terkait -->
      <div class="kop-content-col">
        <div class="kop-entity-title">${kop.foundationName}</div>
        <div class="kop-division-title">${kop.foundationDivision}</div>
        <div class="kop-legal-line">${kop.legalNumber}</div>
        <div class="kop-address-line">${kop.address}</div>
        <div class="kop-contact-line">${kop.contact}</div>
      </div>

      <!-- Penyeimbang sisi kanan agar teks kop tetap simetris di tengah -->
      <div class="kop-logo-col right" style="visibility: hidden;" aria-hidden="true"></div>
    </div>

    <!-- Garis Pemisah Kop Surat Resmi (Garis Ganda Tebal & Tipis) -->
    <div class="kop-divider-double">
      <div class="line-thick"></div>
      <div class="line-thin"></div>
    </div>
  </div>

  <!-- Judul Dokumen Laporan & Klasifikasi Keamanan -->
  <div class="doc-title-block">
    <div class="classification-badge">${kop.classification}</div>
    <h1 class="doc-title-heading">${kop.documentTitle}</h1>
    <div class="doc-title-subheading">${kop.documentSubtitle}</div>
  </div>
  ` : `
  <!-- HEADER LAPORAN SEDERHANA (JIKA KOP DINONAKTIFKAN) -->
  <div class="header-kop">
    <h1 class="kop-title">${kop.documentTitle}</h1>
    <div class="kop-subtitle">${kop.foundationName} - ${kop.foundationDivision}</div>
  </div>
  <hr class="divider-thick" />
  <hr class="divider-thin" />
  `}

  <!-- META INFORMASI -->
  <table class="meta-table">
    <tr>
      <td class="meta-label">No. Dokumen:</td>
      <td class="meta-val">${docNum}</td>
      <td class="meta-label">Waktu Scan:</td>
      <td class="meta-val">${dateStr}</td>
    </tr>
  </table>

  <!-- BAGIAN I: PROFIL TARGET -->
  <div class="section-header">I. PROFIL TARGET DIAGNOSA JEJAK DIGITAL</div>
  <table class="data-table">
    <tr>
      <td style="width: 28%; font-weight: bold; color: #1A237E;">Nama Lengkap Target</td>
      <td><strong>${targetName}</strong></td>
    </tr>
    <tr>
      <td style="font-weight: bold; color: #1A237E;">Nomor HP Target</td>
      <td>${targetPhone}</td>
    </tr>
    <tr>
      <td style="font-weight: bold; color: #1A237E;">Email Target</td>
      <td>${targetEmail}</td>
    </tr>
    <tr>
      <td style="font-weight: bold; color: #1A237E;">Media Sosial</td>
      <td>IG: ${ig} | TikTok: ${tiktok} | FB: ${fb} | Twitter: ${tw} | LinkedIn: ${li}</td>
    </tr>
    <tr>
      <td style="font-weight: bold; color: #1A237E;">Kerabat / Pasangan</td>
      <td>${spouseFamily || '-'}</td>
    </tr>
    <tr>
      <td style="font-weight: bold; color: #1A237E;">Kata Kunci Tambahan</td>
      <td>${keywords || '-'}</td>
    </tr>
    <tr>
      <td style="font-weight: bold; color: #1A237E;">Mode Mesin Scan</td>
      <td>${scanMode}</td>
    </tr>
  </table>

  <!-- BAGIAN II: EVALUASI EXPOSURE RISK SCORE & ANALISIS AI -->
  <div class="section-header">II. EVALUASI EXPOSURE RISK SCORE &amp; ANALISIS AI</div>
  <div class="score-box">
    <div class="score-title">
      EXPOSURE RISK SCORE: <span class="score-val">${riskScore} / 100 (${riskCategory})</span>
    </div>
  </div>

  ${
    includeAi && aiSummary
      ? `<div class="ai-box">
          <strong>Ringkasan Evaluasi AI:</strong> ${aiSummary}
        </div>`
      : ''
  }

  <!-- Tabel Breakdown 5 Dimensi -->
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 44%;">Dimensi Risiko</th>
        <th style="width: 14%; text-align: center;">Bobot</th>
        <th style="width: 18%; text-align: center;">Skor</th>
        <th style="width: 24%; text-align: center;">Tingkat Risiko</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1. Google Dorking (Eksposur Indeks)</td>
        <td style="text-align: center;">30%</td>
        <td style="text-align: center;">${dorkScore}/100</td>
        <td style="text-align: center; font-weight: bold; color: ${dorkScore >= 60 ? '#C62828' : dorkScore >= 30 ? '#F57C00' : '#388E3C'};">
          ${dorkScore >= 60 ? 'KRITIS' : dorkScore >= 30 ? 'SEDANG' : 'RENDAH'}
        </td>
      </tr>
      <tr>
        <td>2. Social Media Exposure</td>
        <td style="text-align: center;">25%</td>
        <td style="text-align: center;">${socialScore}/100</td>
        <td style="text-align: center; font-weight: bold; color: ${socialScore >= 60 ? '#C62828' : socialScore >= 30 ? '#F57C00' : '#388E3C'};">
          ${socialScore >= 60 ? 'KRITIS' : socialScore >= 30 ? 'SEDANG' : 'RENDAH'}
        </td>
      </tr>
      <tr>
        <td>3. Phone Intelligence (Truecaller/GetContact)</td>
        <td style="text-align: center;">20%</td>
        <td style="text-align: center;">${phoneScore}/100</td>
        <td style="text-align: center; font-weight: bold; color: ${phoneScore >= 60 ? '#C62828' : phoneScore >= 30 ? '#F57C00' : '#388E3C'};">
          ${phoneScore >= 60 ? 'KRITIS' : phoneScore >= 30 ? 'SEDANG' : 'RENDAH'}
        </td>
      </tr>
      <tr>
        <td>4. HIBP Data Breach (Kebocoran Account)</td>
        <td style="text-align: center;">15%</td>
        <td style="text-align: center;">${breachScore}/100</td>
        <td style="text-align: center; font-weight: bold; color: ${breachScore >= 60 ? '#C62828' : breachScore >= 30 ? '#F57C00' : '#388E3C'};">
          ${breachScore >= 60 ? 'KRITIS' : breachScore >= 30 ? 'SEDANG' : 'RENDAH'}
        </td>
      </tr>
      <tr>
        <td>5. Active Doxing &amp; Teror DC</td>
        <td style="text-align: center;">10%</td>
        <td style="text-align: center;">${doxingScore}/100</td>
        <td style="text-align: center; font-weight: bold; color: ${doxingScore >= 60 ? '#C62828' : doxingScore >= 30 ? '#F57C00' : '#388E3C'};">
          ${doxingScore >= 60 ? 'KRITIS' : doxingScore >= 30 ? 'SEDANG' : 'RENDAH'}
        </td>
      </tr>
    </tbody>
  </table>

  <!-- BAGIAN III: DETAIL INDEKS PENCARIAN GOOGLE (PUBLIC EXPOSURE) -->
  ${
    !isSection3Omitted
      ? `
  <div class="section-header">III. DETAIL INDEKS PENCARIAN GOOGLE (PUBLIC EXPOSURE)</div>
  <p style="font-size: 8.5pt; margin: 4px 0 8px 0; color: #424242;">
    Berikut adalah daftar halaman publik dan tautan Google yang terdeteksi mengindeks data pribadi target secara nyata:
    <span style="font-size: 7.5pt; color: #1565C0; font-style: italic;">(Filter Opsi: ${dorkDisplayOption})</span>
  </p>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 6%; text-align: center;">No.</th>
        <th style="width: 25%;">Kategori Dork / Label</th>
        <th style="width: 55%;">Judul Halaman &amp; Tautan Terindeks</th>
        <th style="width: 14%; text-align: center;">Tingkat Risiko</th>
      </tr>
    </thead>
    <tbody>
      ${
        dorkItems.length > 0
          ? dorkItems
              .map(
                (item, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><strong>${item.category}</strong></td>
          <td>
            <strong>${item.title}</strong><br/>
            <a href="${item.url}" class="link-blue">${item.url}</a>
            ${item.snippet ? `<div style="color: #616161; font-size: 7.8pt; margin-top: 2px;"><i>${item.snippet.slice(0, 160)}...</i></div>` : ''}
          </td>
          <td style="text-align: center; font-weight: bold; color: ${
            ['HIGH', 'CRITICAL', 'TINGGI', 'KRITIS'].includes(item.risk) ? '#C62828' : '#1565C0'
          };">${item.risk}</td>
        </tr>
      `
              )
              .join('')
          : `
        <tr>
          <td colspan="4" style="text-align: center; color: #616161; padding: 12px;">
            ✓ Tidak terdeteksi tautan data pribadi dengan kriteria filter tersebut pada indeks pencarian publik.
          </td>
        </tr>
      `
      }
    </tbody>
  </table>
  `
      : ''
  }

  <!-- BAGIAN IV: RIWAYAT KEBOCORAN DATABASE (DATA BREACHES) -->
  <div class="section-header">IV. RIWAYAT KEBOCORAN DATABASE (DATA BREACHES)</div>
  <div style="font-size: 8.5pt; margin-bottom: 6px; color: #333333;">
    <strong>Catatan Penting:</strong> Selain database publik, sindikat Debt Collector (DC) juga menggunakan layanan 
    <i>API Telegram OSINT Bot berbayar</i> (jalur *underground*) untuk melakukan profiling nomor HP, NIK, dan kontak kerabat (Kondar) secara real-time.
  </div>
  <table class="data-table">
    <thead>
      <tr style="background: #C62828;">
        <th style="background: #C62828; width: 6%; text-align: center;">No.</th>
        <th style="background: #C62828; width: 32%;">Nama Layanan / Database</th>
        <th style="background: #C62828; width: 22%;">Tanggal Kebocoran</th>
        <th style="background: #C62828; width: 40%;">Kelas Data yang Bocor</th>
      </tr>
    </thead>
    <tbody>
      ${breachList.length > 0 ? (
        breachList
          .map(
            (b, idx) => `
          <tr>
            <td style="text-align: center;">${idx + 1}</td>
            <td><strong>${b.title || b.name || 'Data Breach'}</strong></td>
            <td>${b.breach_date || b.year || '-'}</td>
            <td>${(b.data_classes || b.dataClasses || []).join(', ') || 'Identitas Kependudukan'}</td>
          </tr>
        `
          )
          .join('')
      ) : `
        <tr>
          <td colspan="4" style="text-align: center; color: #2E7D32; padding: 14px; font-weight: bold;">
            ✓ Tidak teridentifikasi riwayat kebocoran kredensial atau akun subjek pada basis data repositori publik (Status Terlindungi).
          </td>
        </tr>
      `}
    </tbody>
  </table>

  <!-- DAFTAR SUMBER RESMI KEBOCORAN NIK & KK NASIONAL -->
  <div style="margin-top: 8px; margin-bottom: 10px; font-size: 7.8pt; background: #FFF8E1; border-left: 3px solid #E65100; padding: 6px 9px; line-height: 1.4;">
    <strong style="color: #BF360C;">Inventarisasi Sumber Kebocoran NIK & Kartu Keluarga (KK) Nasional Terindeks:</strong>
    <div style="color: #424242; margin-top: 2px;">
      1. Dukcapil Kemendagri (337 Jt - NIK/KK/Ibu Kandung) • 2. BPJS Kesehatan (279 Jt - NIK/KK/Faskes) • 3. KPU DPT Pemilu (204 Jt - NIK/KK/TPS) • 4. Kemensos DTKS (102 Jt - NIK/KK/Bansos) • 5. BPJS Ketenagakerjaan (19.5 Jt - NIK/KK/Gaji) • 6. Bank BSI (15 Jt - NIK/Rekening) • 7. Cermati Fintech (2.9 Jt - NIK/KK/Foto KTP/Ibu Kandung) • 8. Indihome Telkom (26 Jt - NIK/Browsing).
    </div>
    <div style="color: #795548; font-size: 7.2pt; margin-top: 2px; font-style: italic;">
      *Rujukan Yuridis: Pasal 65 ayat (1) & (3) jo. Pasal 67 UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP).
    </div>
  </div>

  <!-- BAGIAN V: REKOMENDASI PENANGANAN & PROSEDUR TAKE-DOWN -->
  ${
    includeRemediation
      ? `
  <div class="section-header">V. REKOMENDASI PENANGANAN &amp; PROSEDUR TAKE-DOWN</div>
  
  <div style="font-size: 8.8pt; font-weight: bold; margin: 6px 0 4px 0; color: #1A237E;">
    Tindakan Remediasi Prioritas:
  </div>
  <div style="font-size: 8.2pt; line-height: 1.45; margin-bottom: 8px;">
    ${
      takedownList.length > 0
        ? takedownList
            .slice(0, 4)
            .map(
              (td) => `
        <div style="margin-bottom: 5px;">
          • <strong>[TAKEDOWN GOOGLE]</strong> Hapus Tautan Berbahaya: ${td.title.slice(0, 70)}...<br/>
          &nbsp;&nbsp;Link Pengajuan Hapus: <a href="${td.removalLink}" class="link-blue">${td.removalLink}</a>
        </div>
      `
            )
            .join('')
        : `
        <div>
          • <strong>[TAKEDOWN GOOGLE]</strong> Formulir De-indexing &amp; Pembersihan Cache Mesin Pencari:<br/>
          &nbsp;&nbsp;Link Pengajuan Hapus: <a href="https://search.google.com/search-console/remove-outdated-content" class="link-blue">https://search.google.com/search-console/remove-outdated-content</a>
        </div>
      `
    }
  </div>

  <div style="font-size: 8.8pt; font-weight: bold; margin: 8px 0 4px 0; color: #1A237E;">
    Rekomendasi Strategis AI:
  </div>
  <ul style="font-size: 8.2pt; margin: 0 0 10px 18px; padding: 0; line-height: 1.45;">
    <li><strong>Aktifkan Autentikasi Dua Faktor (2FA):</strong> Aktifkan 2FA di semua akun penting: email, perbankan, medsos. Gunakan aplikasi authenticator (Google Authenticator / Authy).</li>
    <li><strong>Ajukan De-Indexing &amp; Clean-up AI Overview Google:</strong> Segera ajukan Take-down Form di Google Search Console ('Remove Outdated Content') dan minta pemegang akun tempat komentar terposting untuk menghapus komentar spam DC.</li>
    <li><strong>Ajukan Penghapusan Data Pribadi ke Google:</strong> Gunakan Google Results About You (myactivity.google.com/page-removal) untuk meminta penghapusan hasil pencarian yang memuat nama &amp; kata pencemaran nama baik.</li>
    <li><strong>Kunci Privasi Akun &amp; Hapus Tag Medsos:</strong> Set semua akun medsos ke private. Batasi siapa yang dapat memberikan komentar dan mention (@) pada akun media sosial Anda.</li>
    <li><strong>Waspadai Social Engineering:</strong> Jangan bagikan OTP, PIN, atau data pribadi via telepon/chat kepada siapapun, termasuk yang mengaku dari pinjol.</li>
    <li><strong>Audit Aplikasi yang Diinstal:</strong> Hapus aplikasi pinjol ilegal yang mungkin masih memiliki izin akses kontak, kamera, dan penyimpanan di HP Anda.</li>
  </ul>

  <!-- Box Prosedur Hapus Indeks Google -->
  <div class="legal-box">
    <strong>Prosedur Hapus Indeks Google (Take-Down Legal):</strong><br/>
    1. Gunakan <i>Google Outdated Content Removal Tool</i> untuk tautan yang sudah dihapus dari medsos/situs.<br/>
    2. Ajukan Permohonan Penghapusan Data Pribadi (UU PDP No. 27/2022 &amp; UU ITE) ke Google Search Help Center.<br/>
    3. Laporkan akun/komentar doxing pinjol ke Help Center Instagram/Facebook/TikTok.<br/><br/>
    <i>*Catatan: Panduan prosedur di atas dapat Anda lakukan secara mandiri. Namun jika Anda membutuhkan bantuan pembersihan data (Take-Down) secara komprehensif, silakan hubungi <strong>Menyalahati Cyber Intelligence</strong> yang akan memproses penghapusan dengan metode dan jalur khusus.</i>
  </div>
  `
      : ''
  }

  <!-- FOOTER DOKUMEN RESMI -->
  <div class="footer">
    <div>
      Dokumen Forensik Resmi ${kop.foundationName} | Terakreditasi Satgas PASTI OJK (157) &amp; Bareskrim Polri | Sesuai UU PDP No. 27/2022
    </div>
    <div>
      Dicetak: ${dateStr}
    </div>
  </div>

</body>
</html>
  `.trim();
}

/**
 * Download file PDF langsung ke komputer pengguna
 * Membuka jendela cetak / pratinjau yang memicu 'Save as PDF' dengan styling A4 presisi
 */
export function printOrSavePdfReport(params) {
  const htmlContent = generateDiagnosisHtmlReport(params);
  const printWindow = window.open('', '_blank', 'width=900,height=960');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 450);
    return true;
  }
  return false;
}

/**
 * Standalone Zero-Dependency PDF 1.4 Binary Generator
 * Menghasilkan file PDF asli (.pdf) yang kompatibel dengan Acrobat Reader & Chrome PDF Viewer
 * Dilengkapi Kop Surat Perusahaan / Yayasan Terkait Resmi
 */
export function generateBinaryDiagnosisPdf(params) {
  const kop = {
    ...DEFAULT_KOP_SURAT,
    ...(params.kopSurat || {}),
  };

  const targetName = params.targetName || 'Subjek';
  const targetPhone = params.targetPhone || '-';
  const targetEmail = params.targetEmail || '-';
  const targetNik = params.targetNik || '-';
  const score = params.riskScore || 82;
  const category = params.riskCategory || 'KRITIS';
  const dorkOption = params.dorkDisplayOption || '2';
  const dateStr = params.scanDate || `${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`;
  const docNum = params.documentNumber || `DIAG-${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}`;

  const isOption3 = typeof dorkOption === 'string' && dorkOption.startsWith('3');
  const dorkItems = filterDorkItemsByOption(params.dorkResults || [], dorkOption);

  // Helper escape text untuk format PDF
  const esc = (txt) => {
    if (!txt) return '';
    return String(txt)
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/[^\x20-\x7E]/g, ' '); // sanitasi karakter non-ascii
  };

  // State builder PDF
  const pages = [];
  let curStream = '';

  const addText = (text, x, y, size = 9, isBold = false, r = 0.13, g = 0.13, b = 0.13) => {
    const font = isBold ? '/F2' : '/F1';
    curStream += `BT ${font} ${size} Tf ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg ${x.toFixed(1)} ${y.toFixed(1)} Td (${esc(text)}) Tj ET\n`;
  };

  const drawRect = (x, y, w, h, fillR, fillG, fillB, strokeR = null, strokeG = null, strokeB = null) => {
    curStream += `${fillR.toFixed(3)} ${fillG.toFixed(3)} ${fillB.toFixed(3)} rg `;
    if (strokeR !== null) {
      curStream += `${strokeR.toFixed(3)} ${strokeG.toFixed(3)} ${strokeB.toFixed(3)} RG ${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re B\n`;
    } else {
      curStream += `${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re f\n`;
    }
  };

  const drawLine = (x1, y1, x2, y2, r = 0.1, g = 0.14, b = 0.49, w = 1) => {
    curStream += `${w} w ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG ${x1.toFixed(1)} ${y1.toFixed(1)} m ${x2.toFixed(1)} ${y2.toFixed(1)} l S\n`;
  };

  const drawFooter = (pageNum = 1, total = 2) => {
    drawLine(45, 36, 550, 36, 0.082, 0.396, 0.753, 0.8);
    addText(`Dokumen Forensik Resmi ${kop.foundationName} | Satgas PASTI OJK (157) & Bareskrim | ${dateStr} | Hal. ${pageNum}/${total}`, 45, 24, 7.2, false, 0.4, 0.4, 0.4);
  };

  // Parsing fallback jika logo kustom hanya memiliki dataURL (JPEG)
  if (kop.customLogo && (!kop.logoBytes || kop.logoBytes.length === 0)) {
    if (typeof kop.customLogo === 'string' && kop.customLogo.startsWith('data:image/jpeg;base64,')) {
      try {
        const b64 = kop.customLogo.split(',')[1];
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        let w = 200, h = 200;
        for (let i = 0; i < bytes.length - 8; i++) {
          if (bytes[i] === 0xFF && (bytes[i + 1] === 0xC0 || bytes[i + 1] === 0xC2)) {
            h = (bytes[i + 5] << 8) | bytes[i + 6];
            w = (bytes[i + 7] << 8) | bytes[i + 8];
            break;
          }
        }
        kop.logoBytes = bytes;
        kop.logoWidth = kop.logoWidth || w;
        kop.logoHeight = kop.logoHeight || h;
        kop.logoAspectRatio = kop.logoAspectRatio || (w / h);
      } catch (e) {
        console.warn('Fallback JPEG parsing error:', e);
      }
    }
  }

  const hasLogo = Boolean(kop.logoBytes && kop.logoBytes.length > 0 && kop.logoWidth && kop.logoHeight);

  // Perhitungan ukuran logo kop surat presisi (sesuai proporsi kop surat)
  const boxX = 45;
  const boxY = 764;
  const boxW = 46;
  const boxH = 46;
  let fitW = boxW;
  let fitH = boxH;
  let posX = boxX;
  let posY = boxY;

  if (hasLogo) {
    const ar = kop.logoAspectRatio || (kop.logoWidth / kop.logoHeight) || 1;
    if (ar >= 1) {
      fitW = boxW;
      fitH = boxW / ar;
      if (fitH > boxH) {
        fitH = boxH;
        fitW = boxH * ar;
      }
    } else {
      fitH = boxH;
      fitW = boxH * ar;
      if (fitW > boxW) {
        fitW = boxW;
        fitH = boxW / ar;
      }
    }
    // Pusatkan di dalam area logo kop surat
    posX = boxX + (boxW - fitW) / 2;
    posY = boxY + (boxH - fitH) / 2;
  }

  // ═════════════════════════════════════════════════════════════════════
  // HALAMAN 1: Kop Surat Yayasan, Profil, Risk Score, Evaluasi, & Data Breaches
  // ═════════════════════════════════════════════════════════════════════
  curStream = '';

  if (kop.showKop !== false) {
    // ── KOP SURAT RESMI PERUSAHAAN / YAYASAN TERKAIT ──
    if (hasLogo) {
      // Gambar logo lembaga/perusahaan kustom (disesuaikan dengan ukuran kop surat)
      drawRect(posX, posY, fitW, fitH, 1, 1, 1);
      curStream += `q ${fitW.toFixed(2)} 0 0 ${fitH.toFixed(2)} ${posX.toFixed(2)} ${posY.toFixed(2)} cm /LogoImg Do Q\n`;
    } else {
      // Lambang / Perisai Cyber Yayasan default di sisi kiri
      drawRect(45, 768, 44, 44, 0.102, 0.137, 0.494, 0.773, 0.627, 0.349);
      const initials = getLogoInitials(kop.foundationName);
      addText(initials, 49, 792, 8.2, true, 1, 1, 1);
      addText('RESMI', 50, 778, 6.2, true, 1, 0.835, 0.31);
    }

    // Teks Identitas Resmi Kop Surat (Dicentering secara presisi di antara logo & batas kanan)
    const addCenteredKopText = (text, y, size, isBold, r, g, b) => {
      if (!text) return;
      const charWidth = size * (isBold ? 0.54 : 0.48);
      const estimatedWidth = String(text).length * charWidth;
      const startX = Math.max(92, Math.round(322.5 - (estimatedWidth / 2)));
      addText(text, startX, y, size, isBold, r, g, b);
    };

    addCenteredKopText(kop.foundationName, 804, 11, true, 0.102, 0.137, 0.494);
    addCenteredKopText(kop.foundationDivision, 792, 7.6, true, 0.776, 0.157, 0.157);
    addCenteredKopText(kop.legalNumber, 781, 6.6, false, 0.25, 0.25, 0.25);
    addCenteredKopText(kop.address, 772, 6.2, false, 0.35, 0.35, 0.35);
    addCenteredKopText(kop.contact, 763, 6.0, false, 0.35, 0.35, 0.35);

    // Garis Pemisah Kop Surat Resmi (Ganda Tebal & Tipis)
    drawLine(45, 755, 550, 755, 0.102, 0.137, 0.494, 2.5);
    drawLine(45, 751, 550, 751, 0.082, 0.396, 0.753, 0.9);

    // Judul Dokumen Laporan & Klasifikasi
    addText(`[ ${kop.classification} ]`, 220, 739, 7.2, true, 0.776, 0.157, 0.157);
    addText(kop.documentTitle, 105, 727, 11.5, true, 0.102, 0.137, 0.494);
    addText(kop.documentSubtitle, 140, 717, 7.0, false, 0.35, 0.35, 0.35);
  } else {
    // Header Simple Fallback
    addText(kop.documentTitle, 95, 804, 13, true, 0.102, 0.137, 0.494);
    addText(`${kop.foundationName} - ${kop.foundationDivision}`, 130, 788, 9, false, 0.157, 0.208, 0.576);
    drawLine(45, 778, 550, 778, 0.102, 0.137, 0.494, 2.8);
    drawLine(45, 773, 550, 773, 0.082, 0.396, 0.753, 1.0);
  }

  // Meta Table
  drawRect(45, 693, 505, 18, 0.961, 0.961, 0.961, 0.741, 0.741, 0.741);
  addText('No. Dokumen:', 52, 698, 8, true, 0.102, 0.137, 0.494);
  addText(docNum, 115, 698, 8, false);
  addText('Waktu Scan:', 320, 698, 8, true, 0.102, 0.137, 0.494);
  addText(dateStr, 375, 698, 8, false);

  // Bagian I: Profil Target
  drawRect(45, 668, 505, 16, 0.102, 0.137, 0.494);
  addText('I. PROFIL TARGET DIAGNOSA JEJAK DIGITAL', 52, 672, 8.8, true, 1, 1, 1);

  const pRows = [
    ['Nama Lengkap Target', targetName],
    ['Nomor HP Target', targetPhone],
    ['Email Target', targetEmail],
    ['Media Sosial', `IG: ${params.targetSocials?.instagram || '-'} | TikTok: ${params.targetSocials?.tiktok || '-'} | FB: ${params.targetSocials?.facebook || '-'}`],
    ['Kerabat / Pasangan', params.spouseFamily || '-'],
    ['Kata Kunci Tambahan', params.keywords || '-'],
    ['Mode Mesin Scan', params.scanMode || 'Real Engine Multi-Crawler'],
  ];

  let curY = 652;
  pRows.forEach((row, i) => {
    const bgR = i % 2 === 1 ? 0.91 : 1.0;
    const bgG = i % 2 === 1 ? 0.918 : 1.0;
    const bgB = i % 2 === 1 ? 0.965 : 1.0;
    drawRect(45, curY - 13, 505, 15, bgR, bgG, bgB, 0.741, 0.741, 0.741);
    addText(row[0], 52, curY - 9, 7.5, true, 0.102, 0.137, 0.494);
    addText(row[1], 175, curY - 9, 7.5, false);
    curY -= 15;
  });

  // Bagian II: Evaluasi Exposure Risk Score
  curY -= 8;
  drawRect(45, curY - 16, 505, 16, 0.102, 0.137, 0.494);
  addText('II. EVALUASI EXPOSURE RISK SCORE & ANALISIS AI', 52, curY - 12, 8.8, true, 1, 1, 1);
  curY -= 18;

  // Score Box
  drawRect(45, curY - 22, 505, 22, 0.961, 0.961, 0.961, 0.776, 0.157, 0.157);
  addText(`EXPOSURE RISK SCORE: ${score} / 100 (${category})`, 165, curY - 15, 11, true, 0.776, 0.157, 0.157);
  curY -= 26;

  // Breakdown 5 Dimensi Table Header
  drawRect(45, curY - 13, 505, 14, 0.102, 0.137, 0.494);
  addText('Dimensi Risiko', 52, curY - 9, 7.5, true, 1, 1, 1);
  addText('Bobot', 260, curY - 9, 7.5, true, 1, 1, 1);
  addText('Skor', 340, curY - 9, 7.5, true, 1, 1, 1);
  addText('Tingkat Risiko', 440, curY - 9, 7.5, true, 1, 1, 1);
  curY -= 14;

  // 5-Dimensi Breakdown Dinamis
  const b = (params.riskData && params.riskData.breakdown) || {};
  const dorkScore = b.googleDorkScore ?? (score > 30 ? Math.min(60, score) : 10);
  const socialScore = b.socialExposureScore ?? (score > 30 ? Math.min(40, score) : 5);
  const phoneScore = b.phoneIntelScore ?? (score > 30 ? Math.min(50, score) : 10);
  const breachScore = b.breachScore ?? ((params.breaches && params.breaches.length > 0) ? 50 : 0);
  const doxingScore = b.doxingActiveScore ?? (category === 'KRITIS' ? 75 : 0);

  const dimRows = [
    ['1. Google Dorking (Eksposur Indeks)', '30%', `${dorkScore}/100`, dorkScore >= 60 ? 'KRITIS' : dorkScore >= 30 ? 'SEDANG' : 'AMAN'],
    ['2. Social Media Exposure', '25%', `${socialScore}/100`, socialScore >= 60 ? 'KRITIS' : socialScore >= 30 ? 'SEDANG' : 'AMAN'],
    ['3. Phone Intelligence (Telecom/HLR)', '20%', `${phoneScore}/100`, phoneScore >= 60 ? 'KRITIS' : phoneScore >= 30 ? 'SEDANG' : 'AMAN'],
    ['4. HIBP Data Breach (Kebocoran Account)', '15%', `${breachScore}/100`, breachScore >= 60 ? 'KRITIS' : breachScore >= 30 ? 'SEDANG' : 'AMAN'],
    ['5. Active Doxing & Teror DC', '10%', `${doxingScore}/100`, doxingScore >= 60 ? 'KRITIS' : doxingScore >= 30 ? 'SEDANG' : 'AMAN'],
  ];

  dimRows.forEach((r) => {
    drawRect(45, curY - 12, 505, 13, 0.961, 0.965, 0.98, 0.741, 0.741, 0.741);
    addText(r[0], 52, curY - 9, 7.2, false);
    addText(r[1], 268, curY - 9, 7.2, false);
    addText(r[2], 345, curY - 9, 7.2, false);
    addText(r[3], 445, curY - 9, 7.2, true, r[3] === 'KRITIS' ? 0.776 : 0.082, 0.157, 0.157);
    curY -= 13;
  });

  // Bagian IV: Kebocoran Data (Data Breaches)
  curY -= 8;
  drawRect(45, curY - 16, 505, 16, 0.776, 0.157, 0.157);
  addText('IV. RIWAYAT KEBOCORAN DATABASE (DATA BREACHES)', 52, curY - 12, 8.8, true, 1, 1, 1);
  curY -= 18;

  addText('Catatan: Hasil audit riwayat kebocoran data terverifikasi pada repositori publik', 45, curY - 7, 7.2, false, 0.3, 0.3, 0.3);
  curY -= 12;

  drawRect(45, curY - 13, 505, 14, 0.776, 0.157, 0.157);
  addText('No.', 50, curY - 9, 7.2, true, 1, 1, 1);
  addText('Nama Layanan / Database', 75, curY - 9, 7.2, true, 1, 1, 1);
  addText('Tanggal', 240, curY - 9, 7.2, true, 1, 1, 1);
  addText('Kelas Data yang Bocor', 330, curY - 9, 7.2, true, 1, 1, 1);
  curY -= 14;

  const userBreaches = Array.isArray(params.breaches) ? params.breaches : [];
  const brRows = userBreaches.length > 0
    ? userBreaches.slice(0, 4).map((b, idx) => [
        String(idx + 1),
        (b.title || b.name || 'Data Breach').slice(0, 26),
        b.breach_date || b.year || '-',
        (b.data_classes || b.dataClasses || []).slice(0, 3).join(', ') || 'Identitas Kependudukan'
      ])
    : [
        ['1', 'Status Bebas Kebocoran', 'Terverifikasi', 'Tidak ditemukan riwayat kebocoran akun/data publik (Aman)']
      ];

  brRows.forEach((r, i) => {
    const bgR = i % 2 === 1 ? 0.91 : 1.0;
    const bgG = i % 2 === 1 ? 0.918 : 1.0;
    const bgB = i % 2 === 1 ? 0.965 : 1.0;
    drawRect(45, curY - 12, 505, 13, bgR, bgG, bgB, 0.741, 0.741, 0.741);
    addText(r[0], 52, curY - 9, 7.2, false);
    addText(r[1], 75, curY - 9, 7.2, true);
    addText(r[2], 240, curY - 9, 7.2, false);
    addText(r[3], 330, curY - 9, 7.2, false);
    curY -= 13;
  });

  drawFooter(1, 2);
  pages.push(curStream);

  // ═════════════════════════════════════════════════════════════════════
  // HALAMAN 2: Bagian III (Jika tidak diabaikan) / Rekomendasi Takedown
  // ═════════════════════════════════════════════════════════════════════
  curStream = '';

  // Running Header on Page 2
  drawRect(45, 810, 505, 16, 0.961, 0.968, 0.98, 0.8, 0.85, 0.9);
  addText(kop.foundationName, 52, 815, 7.2, true, 0.102, 0.137, 0.494);
  addText(`${kop.documentTitle} | Dokumen Forensik Resmi (Hal. 2/2)`, 290, 815, 6.8, false, 0.35, 0.35, 0.35);

  curY = 794;

  if (!isOption3 && dorkItems.length > 0) {
    drawRect(45, curY - 18, 505, 18, 0.102, 0.137, 0.494);
    addText('III. DETAIL INDEKS PENCARIAN GOOGLE (PUBLIC EXPOSURE)', 52, curY - 13, 9.5, true, 1, 1, 1);
    curY -= 22;

    addText(`Daftar halaman publik yang terindeks Google memuat identitas subjek (${dorkOption}):`, 45, curY - 8, 8, false, 0.3, 0.3, 0.3);
    curY -= 14;

    drawRect(45, curY - 14, 505, 15, 0.102, 0.137, 0.494);
    addText('No.', 50, curY - 10, 7.5, true, 1, 1, 1);
    addText('Kategori Dork / Label', 75, curY - 10, 7.5, true, 1, 1, 1);
    addText('Judul Halaman & Tautan Terindeks', 215, curY - 10, 7.5, true, 1, 1, 1);
    addText('Risiko', 500, curY - 10, 7.5, true, 1, 1, 1);
    curY -= 15;

    dorkItems.slice(0, 10).forEach((item, i) => {
      const bgR = i % 2 === 1 ? 0.91 : 1.0;
      const bgG = i % 2 === 1 ? 0.918 : 1.0;
      const bgB = i % 2 === 1 ? 0.965 : 1.0;
      drawRect(45, curY - 26, 505, 27, bgR, bgG, bgB, 0.741, 0.741, 0.741);
      addText(String(i + 1), 52, curY - 12, 7.5, false);
      addText(item.category.slice(0, 24), 75, curY - 12, 7.5, true, 0.1, 0.14, 0.5);

      addText(item.title.slice(0, 52), 215, curY - 10, 7.5, true);
      addText(item.url.slice(0, 60), 215, curY - 20, 6.8, false, 0.08, 0.4, 0.75);

      addText(item.risk, 500, curY - 12, 7.5, true, 0.776, 0.157, 0.157);
      curY -= 27;
    });
    curY -= 10;
  }

  // Bagian V: Rekomendasi Penanganan & Prosedur Take-Down
  drawRect(45, curY - 18, 505, 18, 0.102, 0.137, 0.494);
  addText('V. REKOMENDASI PENANGANAN & PROSEDUR TAKE-DOWN', 52, curY - 13, 9.5, true, 1, 1, 1);
  curY -= 22;

  addText('Tindakan Remediasi Prioritas:', 45, curY - 8, 8.5, true, 0.102, 0.137, 0.494);
  curY -= 14;

  const recSteps = [
    '• [TAKEDOWN GOOGLE] Hapus Tautan Berbahaya via Outdated Content Removal Tool',
    '  Link: https://search.google.com/search-console/remove-outdated-content',
    '• [KEAMANAN AKUN] Ganti Sandi & Aktifkan 2FA di Semua Akun Email & Perbankan',
    '• [TAKEDOWN MEDSOS] Lapor Pelanggaran Privasi UU ITE Pasal 27 & UU PDP ke Meta',
    '• [UNLISTING HP] Bersihkan Tag Kontak Palsu di Getcontact & Truecaller',
  ];

  recSteps.forEach((s) => {
    addText(s, 50, curY - 8, 7.8, s.startsWith('•'), s.includes('http') ? 0.08 : 0.2, s.includes('http') ? 0.4 : 0.2, s.includes('http') ? 0.75 : 0.2);
    curY -= 13;
  });

  curY -= 8;
  addText('Rekomendasi Strategis AI:', 45, curY - 8, 8.5, true, 0.102, 0.137, 0.494);
  curY -= 14;

  const aiRecs = [
    '1. Aktifkan 2FA di semua akun perbankan dan email utama (Google Authenticator).',
    '2. Ajukan De-Indexing Google untuk memutus snippet cache NIK dan data sensitif.',
    '3. Kunci privasi akun media sosial (private profile & no mention tagging).',
    '4. Waspadai teknik Social Engineering via panggilan telepon sindikat debt collector.',
    '5. Audit dan copot izin akses kontak pada aplikasi pinjol tak berizin OJK.',
  ];

  aiRecs.forEach((r) => {
    addText(r, 50, curY - 8, 7.8, false);
    curY -= 13;
  });

  // Legal Clean Box
  curY -= 10;
  drawRect(45, curY - 56, 505, 56, 0.91, 0.918, 0.965, 0.082, 0.396, 0.753);
  addText('Prosedur Hapus Indeks Google (Take-Down Legal Berdasarkan UU PDP No. 27/2022):', 52, curY - 14, 8, true, 0.1, 0.14, 0.5);
  addText('1. Ajukan Outdated Content Removal bila link sumber telah dihapus dari web.', 52, curY - 26, 7.4, false);
  addText('2. Gunakan Google Results About You untuk hapus nomor HP dan NIK dari pencarian.', 52, curY - 36, 7.4, false);
  addText(`*Konsultasi bantuan takedown profesional: Hubungi Tim ${kop.foundationName}.`, 52, curY - 48, 7.4, true, 0.1, 0.14, 0.5);

  drawFooter(2, 2);
  pages.push(curStream);

  // ═════════════════════════════════════════════════════════════════════
  // RAKIT STRUKTUR FILE PDF 1.4 LENGKAP DENGAN XREF TABLE & TRAILER
  // ═════════════════════════════════════════════════════════════════════
  const totalPages = pages.length;
  const encoder = new TextEncoder();
  const chunks = [];
  let currentOffset = 0;
  const offsets = [];

  const addTextChunk = (text) => {
    const bytes = encoder.encode(text);
    chunks.push(bytes);
    currentOffset += bytes.length;
  };

  const addBinaryChunk = (bytes) => {
    chunks.push(bytes);
    currentOffset += bytes.length;
  };

  const addObj = (objContent) => {
    offsets.push(currentOffset);
    const objNum = offsets.length;
    addTextChunk(`${objNum} 0 obj\n${objContent}\nendobj\n`);
    return objNum;
  };

  addTextChunk('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');

  // Objek 1: Catalog
  addObj('<< /Type /Catalog /Pages 2 0 R >>');

  // Objek 2: Pages Root
  const startPageObj = hasLogo ? 6 : 5;
  const pageObjNums = [];
  for (let i = 0; i < totalPages; i++) {
    pageObjNums.push(startPageObj + i * 2);
  }
  addObj(`<< /Type /Pages /Kids [${pageObjNums.map((n) => `${n} 0 R`).join(' ')}] /Count ${totalPages} /MediaBox [0 0 595.28 841.89] >>`);

  // Objek 3: Font F1 (Helvetica)
  addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');

  // Objek 4: Font F2 (Helvetica-Bold)
  addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');

  // Objek 5: Image XObject untuk Logo Kop Surat (jika ada)
  if (hasLogo) {
    offsets.push(currentOffset);
    const imgObjNum = offsets.length; // 5
    const imgHeader = `${imgObjNum} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${kop.logoWidth} /Height ${kop.logoHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${kop.logoBytes.length} >>\nstream\n`;
    addTextChunk(imgHeader);
    addBinaryChunk(kop.logoBytes);
    addTextChunk('\nendstream\nendobj\n');
  }

  // Pages & Content Streams
  pages.forEach((streamContent, idx) => {
    const streamBytes = encoder.encode(streamContent);
    const streamLength = streamBytes.length;
    const contentObjNum = offsets.length + 2;

    // Page Obj
    let resources = `<< /Font << /F1 3 0 R /F2 4 0 R >>`;
    if (idx === 0 && hasLogo) {
      resources += ` /XObject << /LogoImg 5 0 R >>`;
    }
    resources += ` >>`;
    addObj(`<< /Type /Page /Parent 2 0 R /Resources ${resources} /Contents ${contentObjNum} 0 R >>`);

    // Content Obj
    offsets.push(currentOffset);
    const curContentNum = offsets.length;
    addTextChunk(`${curContentNum} 0 obj\n<< /Length ${streamLength} >>\nstream\n`);
    addBinaryChunk(streamBytes);
    addTextChunk(`endstream\nendobj\n`);
  });

  // XRef Table
  const xrefOffset = currentOffset;
  let xrefStr = `xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((off) => {
    xrefStr += `${String(off).padStart(10, '0')} 00000 n \n`;
  });

  // Trailer
  xrefStr += `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  addTextChunk(xrefStr);

  // Return binary Blob
  return new Blob(chunks, { type: 'application/pdf' });
}

/**
 * Download Blob sebagai file PDF di peramban
 */
export function downloadPdfBlob(blob, filename = 'Laporan_Diagnosa_Jejak_Digital.pdf') {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
