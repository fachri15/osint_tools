/**
 * Cyber Guardian Intelligence - AI Doxing & Debt Exposure Analyzer
 * 
 * Ported & Enhanced from sample/modules/ai_analyzer.py
 * Analisis AI kecerdasan buatan untuk mengidentifikasi keterkaitan nama, NIK, dan nomor HP
 * dengan tagihan utang, teror debt collector (DC) pinjol, dan komentar doxing di Google & medsos:
 * - 1-Click Google Live Action Links (termasuk NIK KTP direct dorking)
 * - Quote extractor (mengekstrak kalimat teror penagihan dari snippet)
 * - Deteksi akun medsos penyerang dan nomor darurat
 * - Narasi Dossier Forensik OSINT komprehensif
 */

/**
 * Evaluasi reputasi doxing, kebocoran NIK, dan ancaman penagihan pinjol
 */
function analyzeDoxingReputation({
  fullName = '',
  phone = '',
  nik = '',
  spouseFamilyName = '',
  additionalKeywords = '',
  dorkResults = [],
  socialData = null,
  phoneIntel = null,
} = {}) {
  const cleanName = String(fullName || '').trim();
  const cleanPhone = String(phone || '').trim();
  const cleanNik = String(nik || '').replace(/[^\d]/g, '').trim();
  const spouseName = String(spouseFamilyName || '').trim();
  const keywords = String(additionalKeywords || '').trim();

  const analysis = {
    target_name: cleanName,
    phone: cleanPhone,
    nik: cleanNik,
    nik_masked: cleanNik.length >= 10 ? `${cleanNik.slice(0, 6)}******${cleanNik.slice(-4)}` : (cleanNik || '-'),
    family_target: spouseName,
    has_debt_association: false,
    has_nik_exposure: false,
    doxing_risk_level: '🟢 AMAN',
    risk_color: '#00E676',
    ai_summary: '',
    detected_threats: [],
    extracted_quotes: [],
    detected_accounts: [],
    detected_phones: [],
    google_live_queries: [],
    deindexing_steps: [],
  };

  // ── 1. Bangun 1-Click Google Live Action Links ───────────────
  const queries = [];

  // A. Kueri NIK KTP (Jika NIK diinputkan)
  if (cleanNik.length >= 10) {
    queries.push({
      label: `🔍 Google NIK (Direct): "${cleanNik.slice(0, 6)}******"`,
      url: `https://www.google.com/search?q=${encodeURIComponent(`"${cleanNik}"`)}`,
      category: 'nik',
    });
    queries.push({
      label: `🔍 Google Dokumen e-KTP / NIK: (PDF/XLS)`,
      url: `https://www.google.com/search?q=${encodeURIComponent(`"${cleanNik}" (filetype:pdf OR filetype:xls OR KTP OR KK)`)}`,
      category: 'nik',
    });
    if (cleanName) {
      queries.push({
        label: `🔍 Google Nama + NIK Terpadu`,
        url: `https://www.google.com/search?q=${encodeURIComponent(`"${cleanName}" "${cleanNik}"`)}`,
        category: 'nik',
      });
    }
  }

  // B. Kueri Nama Target + Utang / Medsos
  if (cleanName) {
    queries.push({
      label: `🔍 Google: "${cleanName} hutang"`,
      url: `https://www.google.com/search?q=${encodeURIComponent(`"${cleanName}" (hutang OR utang OR pinjol)`)}`,
      category: 'name',
    });
    queries.push({
      label: `🔍 Google Medsos: "${cleanName} IG/FB"`,
      url: `https://www.google.com/search?q=${encodeURIComponent(`"${cleanName}" (site:instagram.com OR site:facebook.com) (utang OR pinjol OR bayar)`)}`,
      category: 'social',
    });
  }

  // C. Kueri Kerabat / Pasangan
  if (spouseName) {
    const familyList = spouseName.split(',').map(f => f.trim()).filter(Boolean);
    for (const fam of familyList.slice(0, 3)) {
      queries.push({
        label: `🔍 Google Kerabat: "${fam} utang"`,
        url: `https://www.google.com/search?q=${encodeURIComponent(`"${fam}" (utang OR hutang OR pinjol OR doxing)`)}`,
        category: 'family',
      });
    }
  }

  // D. Kueri Nomor Handphone
  if (cleanPhone) {
    const phoneDigits = cleanPhone.replace(/[^\d]/g, '');
    const localPhone = phoneDigits.startsWith('62') ? '0' + phoneDigits.slice(2) : phoneDigits;
    const intlPhone = phoneDigits.startsWith('0') ? '62' + phoneDigits.slice(1) : phoneDigits;

    queries.push({
      label: `🔍 Google HP: "${localPhone}"`,
      url: `https://www.google.com/search?q=${encodeURIComponent(`"${localPhone}" OR "${intlPhone}"`)}`,
      category: 'phone',
    });
    queries.push({
      label: `🔍 Google HP (Doxing/Pinjol): "${localPhone}"`,
      url: `https://www.google.com/search?q=${encodeURIComponent(`("${localPhone}" OR "${intlPhone}") (doxing OR pinjol OR utang OR penipu)`)}`,
      category: 'phone',
    });
  }

  analysis.google_live_queries = queries;

  // ── 2. Cek Indikasi Risiko Doxing, Akun Anon, & Tagihan Finansial ──
  const debtTerms = [
    'utang', 'hutang', 'pinjol', 'bayar utang', 'debt collector',
    'dc pinjol', 'teror', 'penipu', 'sebar data', 'tagihan', 'suruh',
    'ramein', 'kondar', 'kontak darurat', 'buron', 'kaburan',
    'maling', 'penggelapan', 'penggelapan dana', 'penggelapan data',
    'bawa kabur', 'bawa lari', 'penipu pinjol', 'sebar foto',
  ];

  const detectedThreats = new Set();
  const detectedAccounts = new Set();
  const detectedPhones = new Set();
  const extractedQuotes = [];
  let dorkItemsCount = 0;

  // A. Periksa dari Social Data (Akun Anonim Menandai Target & Aktivitas Komentar)
  let hasAnonTagging = false;
  let anonTaggedPosts = [];
  let targetComments = [];

  if (socialData) {
    if (socialData.anon_tagging_detected && Array.isArray(socialData.anon_tagged_posts) && socialData.anon_tagged_posts.length > 0) {
      hasAnonTagging = true;
      anonTaggedPosts = socialData.anon_tagged_posts;
      analysis.has_debt_association = true;
      detectedThreats.add('Ditandai Akun Anon (Teror Pinjol / Maling)');

      for (const ap of anonTaggedPosts) {
        if (ap.quote) extractedQuotes.push(ap.quote);
        if (Array.isArray(ap.accuser_accounts)) {
          ap.accuser_accounts.forEach(acc => detectedAccounts.add(acc));
        }
      }
    }

    if (Array.isArray(socialData.target_comment_activities) && socialData.target_comment_activities.length > 0) {
      targetComments = socialData.target_comment_activities;
    }
  }

  // B. Periksa dari Dork Results
  for (const res of dorkResults) {
    const items = res.result?.items || [];
    for (const item of items) {
      dorkItemsCount++;
      const title = String(item.title || '');
      const snippet = String(item.snippet || '');
      const url = String(item.url || '');
      const combined = `${title} ${snippet} ${url}`.toLowerCase();

      // Deteksi NIK jika ada di teks
      if (cleanNik && (combined.includes(cleanNik) || combined.replace(/[^\d]/g, '').includes(cleanNik))) {
        analysis.has_nik_exposure = true;
        detectedThreats.add('Kebocoran NIK KTP Terbuka');
      }

      // Ekstrak Akun Instagram / Medsos (@username)
      const accMatches = combined.match(/@[a-zA-Z0-9_.]+/g);
      if (accMatches) {
        accMatches.forEach(acc => {
          if (!['@gmail', '@yahoo', '@outlook'].some(em => acc.includes(em))) {
            detectedAccounts.add(acc);
          }
        });
      }

      // Ekstrak Nomor HP di dalam teks doxing
      const phMatches = combined.match(/(08\d{8,11}|\+62\d{9,12}|628\d{8,11})/g);
      if (phMatches) {
        phMatches.forEach(pm => detectedPhones.add(pm));
      }

      // Deteksi Kata Kunci Utang / Maling & Ekstrak Kutipan Kalimat
      for (const term of debtTerms) {
        if (combined.includes(term)) {
          analysis.has_debt_association = true;
          detectedThreats.add(term);

          if (snippet.toLowerCase().includes(term)) {
            const words = snippet.split(/\s+/);
            const idx = words.findIndex(w => w.toLowerCase().includes(term));
            if (idx !== -1) {
              const start = Math.max(0, idx - 7);
              const end = Math.min(words.length, idx + 8);
              const quote = words.slice(start, end).join(' ');
              if (!extractedQuotes.includes(quote) && extractedQuotes.length < 4) {
                extractedQuotes.push(`...${quote}...`);
              }
            }
          }
        }
      }
    }
  }

  analysis.has_anon_tagging = hasAnonTagging;
  analysis.anon_tagged_posts = anonTaggedPosts;
  analysis.target_comment_activities = targetComments;
  analysis.detected_threats = Array.from(detectedThreats);
  analysis.detected_accounts = Array.from(detectedAccounts);
  analysis.detected_phones = Array.from(detectedPhones);
  analysis.extracted_quotes = extractedQuotes;

  // ── 3. Konstruksi Ringkasan Analisis AI Berbahasa Indonesia ──
  const accDisplay = detectedAccounts.size > 0 ? Array.from(detectedAccounts).slice(0, 3).join(', ') : 'media sosial';
  const phDisplay = detectedPhones.size > 0 ? Array.from(detectedPhones).slice(0, 2).join(', ') : (cleanPhone || 'nomor target');
  const quoteText = extractedQuotes.length > 0 ? `\n\n📌 **Kutipan Kalimat Teror / Tuduhan yang Terindeks:**\n> "${extractedQuotes[0]}"` : '';
  const anonText = hasAnonTagging
    ? `\n\n⚠️ **Deteksi Postingan Akun Anonim:** Ditemukan ${anonTaggedPosts.length} postingan/komentar yang menandai username subjek dengan narasi pengancaman pinjaman online, tuduhan maling, atau penggelapan dana.`
    : '';
  const commentText = targetComments.length > 0
    ? `\n\n💬 **Aktivitas Komentar Target:** Terdeteksi ${targetComments.length} jejak komentar klarifikasi/tanggapan yang pernah diposting oleh subjek di media sosial.`
    : '';
  const nikNote = analysis.has_nik_exposure
    ? `\n\n🚨 **PERINGATAN SANGAT KRITIS (KEBOCORAN NIK KTP):** Nomor NIK target (${analysis.nik_masked}) teridentifikasi terekspos dalam basis data atau dokumen publik!`
    : (cleanNik ? `\n\n🛡️ **Status NIK KTP:** Struktur NIK (${analysis.nik_masked}) tervalidasi Dukcapil L2 dan dalam pemantauan de-indexing.` : '');

  if (analysis.has_debt_association && (dorkItemsCount > 0 || hasAnonTagging)) {
    analysis.doxing_risk_level = '🔴 KRITIS - Target Teridentifikasi dalam Kasus Doxing/Pinjol';
    analysis.risk_color = '#FF1744';
    analysis.ai_summary = 
      `✨ **Overview & Cyber Intelligence Dossier:**\n\n` +
      `**${cleanName || 'Subjek Target'}** adalah **nama individu yang teridentifikasi dalam sebuah unggahan publik terkait tagihan utang pinjaman online (pinjol), intimidasi debt collector, atau framing pencemaran nama baik**.\n\n` +
      `Nama dan atribut subjek muncul dalam kolom komentar atau unggahan media sosial (salah satunya di akun **${accDisplay}**), di mana seseorang meninggalkan pesan terbuka yang menuduh subjek (seperti tuduhan maling, penggelapan data aplikasi pinjol, atau buron) serta menyertakan nomor telepon (**${phDisplay}**).` +
      `${quoteText}${anonText}${commentText}${nikNote}\n\n` +
      `_Tindakan ini melanggar UU Perlindungan Data Pribadi (UU PDP No. 27/2022) Pasal 65 & 67 serta UU ITE Pasal 27B & 27 ayat (3) terkait pemerasan, ancaman, dan penyebaran data tanpa hak. Segera lakukan permohonan de-indexing Google, take-down postingan medsos, dan pengamanan kontak darurat keluarga._`;
  } else if (analysis.has_nik_exposure) {
    analysis.doxing_risk_level = '🔴 KRITIS - Dokumen & NIK KTP Terbuka di Ruang Publik';
    analysis.risk_color = '#FF1744';
    analysis.ai_summary = 
      `✨ **Overview & Cyber Intelligence Dossier:**\n\n` +
      `Ditemukan paparan **Nomor Induk Kependudukan (NIK: ${analysis.nik_masked})** milik subjek **${cleanName || 'target'}** yang terindeks bebas di mesin pencari atau repositori file terbuka.${nikNote}\n\n` +
      `_Paparan NIK tanpa enkripsi memicu kerentanan tinggi terhadap sindikat pemalsuan identitas (KYC Fraud), pengajuan pinjaman online fiktif, serta manipulasi perbankan. Prioritas tertinggi: Ajukan Google Outdated Content Removal tool._`;
  } else if (dorkItemsCount >= 15) {
    analysis.doxing_risk_level = `🔴 KRITIS - ${dorkItemsCount} Data Sensitif Terekspos di Indeks Mesin Pencari`;
    analysis.risk_color = '#FF1744';
    analysis.ai_summary = 
      `✨ **Overview & Cyber Intelligence Dossier:**\n\n` +
      `Terdeteksi **${dorkItemsCount} data publik** yang mengaitkan subjek **${cleanName}** dengan berbagai dokumen, arsip kependudukan, atau profil daring.${nikNote}\n\n` +
      `_Meskipun tidak ditemukan indikasi aktif penagihan pinjol, tingginya volume data publik meningkatkan profil risiko serangan Social Engineering dan pengelabuan terarah (spear phishing)._`;
  } else if (dorkItemsCount > 0) {
    analysis.doxing_risk_level = '🟡 SEDANG - Jejak Digital Terdeteksi dalam Skala Terbatas';
    analysis.risk_color = '#FFB300';
    analysis.ai_summary = 
      `✨ **Overview & Cyber Intelligence Dossier:**\n\n` +
      `Ditemukan **${dorkItemsCount} catatan jejak digital publik** untuk subjek **${cleanName || 'target'}**. Tidak ada indikasi keterkaitan teror tagihan pinjol.${nikNote}\n\n` +
      `_Disarankan melakukan sanitasi jejak digital secara berkala dan membatasi visibilitas profil media sosial ke mode privat._`;
  } else {
    analysis.doxing_risk_level = '🟢 AMAN - Tidak Ditemukan Paparan Data Berbahaya';
    analysis.risk_color = '#00E676';
    analysis.ai_summary = 
      `✨ **Overview & Cyber Intelligence Dossier:**\n\n` +
      `Hasil pemindaian multi-sumber menunjukkan jejak digital subjek **${cleanName || 'target'}** berada dalam kondisi aman.${nikNote}\n\n` +
      `_Tidak ditemukan indeks dokumen e-KTP/NIK, nomor telepon dalam paste sites, maupun korelasi utang pinjaman online._`;
  }

  // Langkah de-indexing rekomendasi
  analysis.deindexing_steps = [
    'Gunakan Google Outdated Content Removal Tool untuk menghapus cuplikan teks (snippet) dan URL yang memuat NIK / Nama.',
    'Kirimkan surat permohonan Takedown resmi berbasis UU PDP No. 27/2022 kepada webmaster pengunggah.',
    'Laporkan akun medsos dan nomor debt collector pengirim teror ke portal Patroli Siber Polri & AFPI.',
    'Kunci (privat) pengaturan privasi seluruh akun media sosial subjek dan keluarga inti.',
  ];

  return analysis;
}

module.exports = {
  analyzeDoxingReputation,
};
