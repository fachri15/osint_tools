/**
 * Cyber Guardian Intelligence - Remediation & Legal Takedown Generator
 * 
 * Ported & Enhanced from sample/modules/remediation.py
 * Modul pemulihan reputasi dan permohonan penghapusan jejak data pribadi:
 * - Google Outdated Content Removal Link Generator
 * - Google Results About You / PII Removal Link Generator
 * - Template Surat Permohonan Takedown Resmi berbasis UU Perlindungan Data Pribadi (UU PDP No. 27/2022) & UU ITE
 * - Generator Kartu Aksi Mitigasi Terstruktur
 */

/**
 * Bentuk tautan Google Search Console untuk permohonan penghapusan konten usang
 */
function generateGoogleRemovalLink(url = '') {
  if (!url) return 'https://search.google.com/search-console/remove-outdated-content';
  const encodedUrl = encodeURIComponent(url);
  return `https://search.google.com/search-console/remove-outdated-content?url=${encodedUrl}`;
}

/**
 * Tautan Google Form Resmi untuk Penghapusan Informasi Identitas Pribadi (PII) Termasuk NIK
 */
function generateGooglePiiRemovalLink() {
  return 'https://support.google.com/websearch/troubleshooter/3111061';
}

/**
 * Buat template surat somasi / permohonan takedown resmi berbasis UU PDP No. 27/2022
 */
function getDmcaTemplate(url = '', name = '', nik = '') {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const targetName = name || 'Pemilik Data Pribadi';
  const maskedNik = nik && nik.length >= 10 ? `${nik.slice(0, 6)}******${nik.slice(-4)}` : (nik || '-');
  const nikSection = nik ? `\n- NIK KTP: ${maskedNik}` : '';

  return `SURAT PERMOHONAN PENGHAPUSAN KONTEN & DATA PRIBADI (TAKEDOWN NOTICE)
Dasar Hukum: Undang-Undang No. 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP)
jo. Undang-Undang No. 1 Tahun 2024 tentang Perubahan Kedua UU ITE

Tanggal: ${currentDate}

Kepada Yth.
Administrator Situs / Webmaster / Penyelenggara Sistem Elektronik (PSE)

Dengan hormat,

Saya yang bertanda tangan di bawah ini:
- Nama Lengkap : ${targetName}${nikSection}

Melalui surat elektronik ini, saya mengajukan PERMOHONAN SEGERA untuk menghapus (takedown), mencabut publikasi, dan memutus akses publik atas data pribadi saya yang dimuat tanpa izin sah pada layanan/situs Anda di URL berikut:

🔗 URL TARGET:
${url}

DASAR HUKUM & PELANGGARAN:
1. UU No. 27 Tahun 2022 (UU PDP):
   - Pasal 4 ayat (2) & (3): Data kependudukan (NIK) dan data keuangan/kontak merupakan Data Pribadi yang dilindungi secara ketat.
   - Pasal 65 ayat (1) & (3): Setiap orang dilarang secara melawan hukum memperoleh atau menyebarluaskan data pribadi yang bukan miliknya.
   - Pasal 67: Pelanggaran atas penyebaran data pribadi tanpa persetujuan subjek data diancam pidana penjara paling lama 5 (lima) tahun dan/atau denda paling banyak Rp5.000.000.000,- (lima miliar rupiah).
2. UU No. 1 Tahun 2024 jo. UU ITE:
   - Pasal 27B ayat (1) & (2): Larangan mendistribusikan informasi elektronik yang memuat pemerasan dan/atau pengancaman.

Informasi yang ada di dalam tautan tersebut melanggar hak privasi konstitusional saya, membahayakan keselamatan saya dan keluarga dari sindikat kejahatan siber/penagihan liar, serta mengandung data sensitif yang berpotensi disalahgunakan untuk tindak pidana fraud.

TUNTUTAN SAYA:
1. Menghentikan pemrosesan dan menghapus halaman serta data pribadi saya secara permanen dari basis data dan server Anda.
2. Memperbarui instruksi meta-robots (noindex, nofollow) atau mengajukan penghapusan cache ke mesin pencari Google dalam kurun waktu selambat-lambatnya 3 x 24 jam terhitung sejak surat ini diterima.

Apabila dalam waktu 3 x 24 jam permohonan ini tidak direspons atau diabaikan, saya akan meneruskan laporan ini kepada Dit Siber Bareskrim Polri dan Direktorat Jenderal Aptika Kominfo RI untuk ditindaklanjuti secara hukum (pro-justitia) serta pemblokiran nama domain situs Anda.

Atas perhatian dan kerja samanya yang beriktikad baik, saya ucapkan terima kasih.

Hormat saya,

${targetName}
(Subjek Data Pribadi)`;
}

/**
 * Bangun daftar kartu aksi mitigasi terstruktur berdasarkan temuan Google dork dan breach
 */
function generateTakedownActions(dorkResults = [], breaches = [], targetName = '', targetNik = '') {
  const actions = [];
  const seenUrls = new Set();

  // 1. Takedown Actions untuk Google Dorking (NIK, KTP, Doxing, Dokumen)
  for (const result of dorkResults) {
    const risk = String(result.risk || 'low').toLowerCase();
    const items = result.result?.items || [];

    if (['high', 'critical'].includes(risk) && items.length > 0) {
      for (const item of items) {
        const itemUrl = item.url || '';
        if (!itemUrl || seenUrls.has(itemUrl)) continue;
        seenUrls.add(itemUrl);

        const isNikLeak = result.category === 'identity' || (targetNik && item.snippet?.includes(targetNik));

        actions.push({
          type: 'dork_removal',
          title: `Hapus Tautan Berbahaya: ${(item.title || itemUrl).slice(0, 55)}...`,
          url: itemUrl,
          risk: risk.toUpperCase(),
          category: result.category || 'general',
          is_nik_exposure: Boolean(isNikLeak),
          google_removal_link: generateGoogleRemovalLink(itemUrl),
          google_pii_link: generateGooglePiiRemovalLink(),
          draft_letter: getDmcaTemplate(itemUrl, targetName, targetNik),
        });
      }
    }
  }

  // 2. Security Steps untuk Breaches
  for (const breach of breaches) {
    const breachName = breach.title || breach.name || 'Layanan';
    const dataClasses = breach.data_classes || [];

    let stepDesc = `Data Anda pernah terdeteksi bocor di insiden ${breachName}. `;

    if (dataClasses.some(dc => String(dc).toLowerCase().includes('password'))) {
      stepDesc += 'Segera GANTI KATA SANDI Anda untuk layanan ini, dan pastikan Anda tidak menggunakan kata sandi yang sama di akun perbankan atau email utama.';
    }
    if (dataClasses.some(dc => String(dc).toLowerCase().includes('nik') || String(dc).toLowerCase().includes('national id'))) {
      stepDesc += ' NIK KTP Anda bocor dalam insiden ini; waspadai pengajuan pinjol fiktif atas nama Anda dan pantau riwayat SLIK OJK secara berkala.';
    }
    if (dataClasses.some(dc => String(dc).toLowerCase().includes('email'))) {
      stepDesc += ' Waspadai email phishing atau surat panggilan palsu yang mengatasnamakan instansi resmi.';
    }
    if (dataClasses.some(dc => String(dc).toLowerCase().includes('phone'))) {
      stepDesc += ' Waspadai panggilan/SMS penipuan dengan teknik Social Engineering.';
    }

    actions.push({
      type: 'breach_security',
      title: `Amankan Kredensial Akun: ${breachName}`,
      desc: stepDesc,
      risk: dataClasses.some(dc => String(dc).toLowerCase().includes('password') || String(dc).toLowerCase().includes('nik')) ? 'CRITICAL' : 'HIGH',
      data_classes: dataClasses,
      breach_date: breach.breach_date || '',
    });
  }

  return actions;
}

module.exports = {
  generateGoogleRemovalLink,
  generateGooglePiiRemovalLink,
  getDmcaTemplate,
  generateTakedownActions,
};
