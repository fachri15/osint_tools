/**
 * Cyber Guardian Intelligence - 5-Dimension Exposure Risk Scorer
 * 
 * Ported & Enhanced from sample/modules/risk_scorer.py
 * Menghitung Exposure Risk Score (0-100) dari 5 dimensi data nyata:
 * 
 *   DIMENSI 1 - Google Dork Score     (bobot 30%)
 *   DIMENSI 2 - Social Exposure Score  (bobot 25%)
 *   DIMENSI 3 - Phone Intel Score      (bobot 20%)
 *   DIMENSI 4 - HIBP Breach Score      (bobot 15%)
 *   DIMENSI 5 - Doxing Active Score    (bobot 10%)
 * 
 * Formula:
 *   Final = D1×0.30 + D2×0.25 + D3×0.20 + D4×0.15 + D5×0.10
 * 
 * Dilengkapi Cross-Validation NIK KTP, aturan eskalasi ambang batas, dan generator rekomendasi mitigasi.
 */

const WEIGHT_GOOGLE_DORK      = 0.30;
const WEIGHT_SOCIAL_EXPOSURE  = 0.25;
const WEIGHT_PHONE_INTEL      = 0.20;
const WEIGHT_HIBP_BREACH      = 0.15;
const WEIGHT_DOXING_ACTIVE    = 0.10;

const DORK_RISK_SCORES = {
  critical: 20,
  high: 12,
  medium: 6,
  low: 2,
};

const BREACH_DATA_CLASS_SCORES = {
  passwords: 15,
  'credit cards': 20,
  'bank account numbers': 20,
  'social security numbers': 20,
  'passport numbers': 18,
  nik: 20,
  'national id': 20,
  'phone numbers': 12,
  'physical addresses': 12,
  'dates of birth': 10,
  'email addresses': 5,
  usernames: 4,
  'ip addresses': 6,
  'geographic locations': 8,
};

/**
 * Dimensi 1: Hitung skor dari hasil Google Dorking dengan Cross-Validation (termasuk NIK KTP)
 */
function calculateDorkScore(dorkResults = [], targetProfile = {}) {
  let rawScore = 0;
  const findings = [];

  const tPhone = String(targetProfile.phone || targetProfile.target_phone || '').toLowerCase().replace(/[^\d]/g, '');
  const tEmail = String(targetProfile.email || targetProfile.target_email || '').toLowerCase();
  const tSpouse = String(targetProfile.spouse || targetProfile.spouseFamily || '').toLowerCase();
  const tNik = String(targetProfile.nik || targetProfile.targetNik || '').replace(/[^\d]/g, '');

  for (const result of dorkResults) {
    const foundCount = result.found_count || (result.result?.items?.length) || 0;
    const riskLevel = result.risk || 'medium';

    if (foundCount > 0) {
      const baseScore = DORK_RISK_SCORES[riskLevel] || 6;
      let validHits = 0;
      const lowConfidencePenalty = 0.4;

      const items = result.result?.items || [];
      for (const item of items) {
        const snippet = String(item.snippet || '').toLowerCase();
        const title = String(item.title || '').toLowerCase();
        const url = String(item.url || '').toLowerCase();
        const combined = `${snippet} ${title} ${url}`;

        let hasStrongCorrelation = false;
        if (tNik && tNik.length >= 10 && combined.replace(/[^\d]/g, '').includes(tNik)) hasStrongCorrelation = true;
        if (tPhone && tPhone.length >= 8 && combined.replace(/[^\d]/g, '').includes(tPhone)) hasStrongCorrelation = true;
        if (tEmail && combined.includes(tEmail)) hasStrongCorrelation = true;
        if (tSpouse && combined.includes(tSpouse)) hasStrongCorrelation = true;
        if ((item.matched_fields || []).some(f => ['nik', 'phone', 'email', 'family'].includes(f) || f.startsWith('social:'))) hasStrongCorrelation = true;
        if ((item.confidence || 0) >= 40) hasStrongCorrelation = true;

        if (hasStrongCorrelation) {
          validHits++;
        }
      }

      let multiplier = 1.0;
      if (validHits > 0) {
        multiplier = Math.min(validHits, 5) * 0.6 + 0.4;
        findings.push(`[${riskLevel.toUpperCase()}] ${result.label || 'Kueri Dork'}: ${validHits} temuan tervalidasi (High Confidence PII Correlation)`);
      } else {
        multiplier = Math.min(foundCount, 5) * 0.3 * lowConfidencePenalty;
        findings.push(`[${riskLevel.toUpperCase()}] ${result.label || 'Kueri Dork'}: ${foundCount} temuan indeks umum`);
      }

      rawScore += baseScore * multiplier;
    }
  }

  return {
    score: Math.min(Math.round(rawScore), 100),
    findings,
  };
}

/**
 * Dimensi 2: Hitung skor dari jejak Media Sosial
 */
function calculateSocialScore(socialData = null, dorkResults = []) {
  let rawScore = 0;
  const findings = [];

  if (socialData && typeof socialData === 'object') {
    rawScore = socialData.total_social_score || 0;
    if (socialData.exposure_details && Array.isArray(socialData.exposure_details)) {
      findings.push(...socialData.exposure_details);
    }
  } else {
    // Fallback: evaluasi dork results kategori sosial
    for (const res of dorkResults) {
      if (res.category === 'social' && (res.found_count > 0 || res.result?.items?.length > 0)) {
        rawScore += 15;
        findings.push(`[MEDIA SOSIAL] ${res.label} terindeks publik.`);
      }
    }
  }

  return {
    score: Math.min(Math.round(rawScore), 100),
    findings,
  };
}

/**
 * Dimensi 3: Hitung skor dari Intelijen Nomor Telepon
 */
function calculatePhoneScore(phoneIntel = null) {
  if (!phoneIntel || typeof phoneIntel !== 'object') {
    return { score: 0, findings: [] };
  }

  const rawScore = phoneIntel.total_phone_score || 0;
  const findings = phoneIntel.risk_indicators || [];

  return {
    score: Math.min(Math.round(rawScore), 100),
    findings,
  };
}

/**
 * Dimensi 4: Hitung skor dari kebocoran data HIBP & Database Nasional
 */
function calculateBreachScore(breaches = []) {
  let rawScore = 0;
  const findings = [];
  const currentYear = new Date().getFullYear();

  for (const breach of breaches) {
    const dataClasses = (breach.data_classes || breach.dataClasses || []).map(dc => String(dc).toLowerCase());
    let breachScore = 0;
    const breachDate = breach.breach_date || breach.breachDate || '';

    let recencyMultiplier = 1.0;
    if (breachDate) {
      try {
        const bYear = parseInt(breachDate.split('-')[0], 10);
        const age = currentYear - bYear;
        if (age > 10) recencyMultiplier = 0.3;
        else if (age > 5) recencyMultiplier = 0.6;
        else if (age > 2) recencyMultiplier = 0.8;
      } catch (e) {}
    }

    for (const dc of dataClasses) {
      for (const [key, score] of Object.entries(BREACH_DATA_CLASS_SCORES)) {
        if (dc.includes(key)) {
          breachScore += score;
          break;
        }
      }
    }

    // Baseline minimum jika ada breach
    breachScore = Math.max(breachScore, 10);
    const weightedBreach = breachScore * recencyMultiplier;
    rawScore += weightedBreach;

    const bTitle = breach.title || breach.name || 'Insiden Kebocoran';
    findings.push(`[BREACH] ${bTitle} (${breachDate || 'Tahun tidak diketahui'}): ${dataClasses.slice(0, 4).join(', ')}`);
  }

  return {
    // Kurva melandai: banyak insiden menaikkan skor tapi tidak langsung menyentuh 100
    score: Math.min(Math.round(100 * (1 - Math.exp(-rawScore / 120))), 100),
    findings,
  };
}

/**
 * Dimensi 5: Deteksi apakah target aktif di-doxing / diancam debt collector (DC) pinjol
 */
function calculateDoxingActiveScore(dorkResults = [], phoneIntel = null, nik = '') {
  let rawScore = 0;
  const findings = [];

  const doxingKeywords = [
    'doxing', 'doxed', 'pastebin', 'rentry', 't.me', 'telegram',
    'utang', 'hutang', 'pinjol', 'bayar utang', 'suruh', 'tagihan',
    'sebar data', 'debt collector', 'dc pinjol', 'penipu', 'teror',
    'kondar', 'kontak darurat', 'buron', 'kaburan',
  ];

  const cleanNik = String(nik || '').replace(/[^\d]/g, '');

  for (const result of dorkResults) {
    const category = String(result.category || '').toLowerCase();
    const label = String(result.label || '').toLowerCase();
    const items = result.result?.items || [];
    const foundCount = result.found_count || items.length;

    if ((category === 'doxing' || category === 'dump' || label.includes('doxing') || label.includes('utang')) && foundCount > 0) {
      rawScore += 25 * Math.min(foundCount, 4);
      findings.push(`[KRITIS] Aktivitas doxing / penagihan terdeteksi pada kueri: ${result.label} (${foundCount} temuan)`);
    }

    for (const item of items) {
      const combined = `${item.url || ''} ${item.title || ''} ${item.snippet || ''}`.toLowerCase();

      // Deteksi NIK terekspos di thread penagihan
      if (cleanNik && cleanNik.length >= 10 && combined.replace(/[^\d]/g, '').includes(cleanNik)) {
        rawScore += 30;
        findings.push(`🚨 [KRITIS - NIK BOCOR] NIK KTP terindikasi terekspos pada: ${item.display_url || item.url}`);
      }

      if (['utang', 'hutang', 'pinjol', 'bayar utang', 'suruh', 'tagihan', 'teror'].some(kw => combined.includes(kw))) {
        rawScore += 35;
        findings.push(`🚨 [KRITIS - TEROR PINJOL] Pesan penagihan DC terindeks di: ${item.display_url || item.url}`);
      } else if (doxingKeywords.some(kw => combined.includes(kw))) {
        rawScore += 20;
        findings.push(`⚠️ Data doxing terindikasi di: ${item.display_url || item.url}`);
      }
    }
  }

  // Dari phone intelligence
  if (phoneIntel?.google_mentions?.categories?.paste_sites > 0) {
    const pCount = phoneIntel.google_mentions.categories.paste_sites;
    rawScore += pCount * 25;
    findings.push(`[KRITIS] Nomor HP target terekspos di ${pCount} pastebin / leak site`);
  }

  return {
    score: Math.min(Math.round(rawScore), 100),
    findings,
  };
}

/**
 * Generate rekomendasi mitigasi taktis & pro-justitia
 */
function generateRecommendations(finalScore, dorkFindings = [], breachFindings = [], phoneIntel = null, nik = '') {
  const recs = [];

  // Rekomendasi 1: NIK KTP Protection (Jika ada NIK atau paparan identitas)
  if (nik && String(nik).length >= 10) {
    recs.push({
      priority: 'CRITICAL',
      title: 'Proteksi NIK & Ajukan De-Indexing Data Kependudukan',
      desc: 'Ajukan permohonan de-indexing Google Search Console untuk menghapus snippet NIK dan dokumen identitas dari indeks pencarian publik guna menghindari sindikat KYC fraud.',
      action_type: 'google_removal',
    });
  }

  // Rekomendasi 2: Penanganan Teror Pinjol & Doxing
  if (finalScore >= 60) {
    recs.push({
      priority: 'CRITICAL',
      title: 'Takedown Thread Doxing & Laporan Patroli Siber',
      desc: 'Kirimkan surat permohonan Takedown Notice berbasis UU PDP No. 27/2022 Pasal 65 jo. Pasal 67 kepada penyedia platform dan simpan bukti tangkapan layar untuk laporan ke Dit Siber Polri.',
      action_type: 'dmca_takedown',
    });
  }

  // Rekomendasi 3: Pengamanan Kredensial Akun Bocor
  if (breachFindings.length > 0) {
    recs.push({
      priority: 'HIGH',
      title: 'Rotasi Password & Aktifkan Autentikasi 2FA (FIDO2/TOTP)',
      desc: 'Ganti seluruh kata sandi pada layanan yang terdampak kebocoran data HIBP. Hindari penggunaan kata sandi yang sama antar-akun dan aktifkan 2-Factor Authentication.',
      action_type: 'security_audit',
    });
  }

  // Rekomendasi 4: Sanitasi Nomor Telepon
  if (phoneIntel?.total_phone_score >= 40) {
    recs.push({
      priority: 'HIGH',
      title: 'Blokir Kontak Debt Collector & Unlist Truecaller',
      desc: 'Ajukan permohonan delisting nomor pada Truecaller/GetContact dan manfaatkan fitur pemblokir panggilan spam untuk nomor tidak dikenal.',
      action_type: 'phone_sanitization',
    });
  }

  // Rekomendasi 5: Audit Privasi Media Sosial
  recs.push({
    priority: 'MEDIUM',
    title: 'Audit Visibilitas Media Sosial (Mode Privat)',
    desc: 'Ubah akun media sosial personal ke mode privat dan hapus informasi nomor telepon, alamat, serta anggota keluarga dari bio publik.',
    action_type: 'social_privacy',
  });

  return recs;
}

/**
 * Kalkulasi total Exposure Risk Score dari 5 dimensi
 */
function calculateExposureRisk({
  dorkResults = [],
  breaches = [],
  socialData = null,
  phoneIntel = null,
  targetProfile = {},
} = {}) {
  // 1. Google Dorking
  const dorkRes = calculateDorkScore(dorkResults, targetProfile);

  // 2. Social Media
  const socialRes = calculateSocialScore(socialData, dorkResults);

  // 3. Phone Intelligence
  const phoneRes = calculatePhoneScore(phoneIntel);

  // 4. HIBP Breach
  const breachRes = calculateBreachScore(breaches);

  // 5. Doxing Active
  const doxingRes = calculateDoxingActiveScore(dorkResults, phoneIntel, targetProfile.nik || targetProfile.targetNik);

  // Formula Tertimbang 5-Dimensi
  const weightedScore = (
    dorkRes.score    * WEIGHT_GOOGLE_DORK +
    socialRes.score  * WEIGHT_SOCIAL_EXPOSURE +
    phoneRes.score   * WEIGHT_PHONE_INTEL +
    breachRes.score  * WEIGHT_HIBP_BREACH +
    doxingRes.score  * WEIGHT_DOXING_ACTIVE
  );

  // Akumulasi risiko gabungan (probabilistic union / noisy-OR):
  //   SERP (dork + social + doxing), HIBP (breach), dan Node investigasi (phone intel)
  //   Akumulasi = 1 - Π(1 - skor_i/100). Setiap sumber menambah risiko total.
  const serpScore = Math.max(dorkRes.score, socialRes.score, doxingRes.score);
  const sources = [serpScore, breachRes.score, phoneRes.score];
  const accumulatedScore = Math.round(
    (1 - sources.reduce((acc, s) => acc * (1 - Math.min(Math.max(s, 0), 100) / 100), 1)) * 100
  );

  // Akumulasi hanya bonus terbatas (maks +10) di atas skor berbobot, bukan pemaksaan ke 100
  const accumulationBonus = Math.min(10, Math.max(0, Math.round((accumulatedScore - weightedScore) * 0.2)));

  // Skor gabungan HIBP + SERP: rata-rata berbobot (SERP 60%, HIBP 40%) + bonus korelasi
  // maks +10 bila KEDUA sumber sama-sama menemukan paparan (korelasi lintas sumber).
  const combinedBase = serpScore * 0.6 + breachRes.score * 0.4;
  const crossBonus = (serpScore > 0 && breachRes.score > 0)
    ? Math.min(10, Math.round(Math.min(serpScore, breachRes.score) * 0.15))
    : 0;
  const combinedHibpSerpScore = Math.min(Math.round(combinedBase + crossBonus), 100);

  let finalScore = Math.min(Math.max(Math.round(weightedScore) + accumulationBonus, combinedHibpSerpScore), 100);

  const totalDorkItems = dorkResults.reduce((acc, r) => acc + (r.found_count || r.result?.items?.length || 0), 0);
  const totalFindingsCount = dorkRes.findings.length + socialRes.findings.length + phoneRes.findings.length + breachRes.findings.length + doxingRes.findings.length;
  const totalExposureItems = Math.max(totalDorkItems, totalFindingsCount);

  // Lantai proporsional terhadap bukti doxing nyata (bukan angka tetap 65/80)
  if (doxingRes.score > 0) {
    finalScore = Math.max(finalScore, Math.min(Math.round(doxingRes.score * 0.8), 70));
  }

  finalScore = Math.min(finalScore, 100);

  // Kategorisasi Risiko
  let category = 'RENDAH';
  let color = '#388E3C';
  let emoji = '🟢';
  let summary = 'Jejak digital target relatif bersih dan aman dari paparan publik berbahaya.';

  if (finalScore >= 70) {
    category = 'KRITIS';
    color = '#D32F2F';
    emoji = '🔴';
    summary = `Data target SANGAT RENTAN (${totalExposureItems} temuan terekspos)! Tindakan darurat dan de-indexing segera diperlukan.`;
  } else if (finalScore >= 40) {
    category = 'SEDANG';
    color = '#F57C00';
    emoji = '🟡';
    summary = 'Sebagian data pribadi target terdeteksi di ruang publik. Disarankan melakukan sanitasi jejak digital.';
  }

  const allFindings = [
    ...dorkRes.findings,
    ...socialRes.findings,
    ...phoneRes.findings,
    ...breachRes.findings,
    ...doxingRes.findings,
  ];

  const recommendations = generateRecommendations(
    finalScore,
    dorkRes.findings,
    breachRes.findings,
    phoneIntel,
    targetProfile.nik || targetProfile.targetNik
  );

  return {
    finalScore,
    category,
    color,
    emoji,
    summary,
    totalExposureItems,
    // Breakdown Skor 5-Dimensi
    breakdown: {
      dork_score: dorkRes.score,
      social_score: socialRes.score,
      phone_score: phoneRes.score,
      breach_score: breachRes.score,
      doxing_active_score: doxingRes.score,
      serp_score: serpScore,
      weighted_score: Math.min(Math.round(weightedScore), 100),
      accumulated_score: accumulatedScore,
      combined_hibp_serp_score: combinedHibpSerpScore,
    },
    // Findings per Dimensi
    findings: {
      all: allFindings,
      dork: dorkRes.findings,
      social: socialRes.findings,
      phone: phoneRes.findings,
      breach: breachRes.findings,
      doxing: doxingRes.findings,
    },
    recommendations,
  };
}

module.exports = {
  WEIGHT_GOOGLE_DORK,
  WEIGHT_SOCIAL_EXPOSURE,
  WEIGHT_PHONE_INTEL,
  WEIGHT_HIBP_BREACH,
  WEIGHT_DOXING_ACTIVE,
  calculateDorkScore,
  calculateSocialScore,
  calculatePhoneScore,
  calculateBreachScore,
  calculateDoxingActiveScore,
  calculateExposureRisk,
  generateRecommendations,
};
