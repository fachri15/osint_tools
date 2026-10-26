/**
 * Cyber Guardian Intelligence - OSINT Scan Orchestrator Service
 * 
 * Recoded & Re-architected following the modular design of sample/modules/
 * Mengintegrasikan seluruh cluster intelijen siber:
 * 1. NIK Forensics & Dukcapil L2 Decoding (services/modules/nikForensic.js)
 * 2. Google Dorking Engine (services/modules/googleDorking.js)
 * 3. Real Multi-Engine Web Scraper & Bing Base64 Decoder (services/modules/realScraper.js)
 * 4. Breach Audit & HIBP v3 API (services/modules/breachAudit.js)
 * 5. Phone Intelligence & Fraud Tracker (services/modules/phoneIntel.js)
 * 6. Social Media Scanner & Mention Profiler (services/modules/socialScanner.js)
 * 7. AI Doxing & Debt Exposure Analyzer (services/modules/aiAnalyzer.js)
 * 8. 5-Dimension Risk Scorer & Escalation Rules (services/modules/riskScorer.js)
 * 9. Remediation & UU PDP No. 27/2022 Legal Takedown Generator (services/modules/remediation.js)
 */

const prisma = require('../config/prisma');
const { getSetting } = require('./settingsService');
const hibpService = require('./hibpService');

// Import Seluruh Modul Terpadu
const {
  PROVINCE_CODES,
  parseNikForensic,
  buildNikDorkQueries,
  evaluateNikRisk,
} = require('./modules/nikForensic');

const {
  PLATFORM_META,
  buildDorkQueries,
  searchSerpApi,
  searchGoogleCustomApi,
} = require('./modules/googleDorking');

const {
  decodeBingUrl,
  extractIntelTags,
  isItemRelevant,
  searchBing,
  searchYahoo,
  searchDuckDuckGo,
  searchWebMultiSource,
} = require('./modules/realScraper');

const {
  formatPwnCount,
  getSeverityFromDataClasses,
  checkEmailBreaches,
  checkEmailPastes,
  checkPhoneBreaches,
  auditNationalLeaks,
  auditBreachDatabasesOptimized,
  getAllBreachesCatalog,
} = require('./modules/breachAudit');

const {
  OPERATOR_PREFIXES,
  normalizePhone,
  lookupTruecallerWeb,
  countPhoneWebMentions,
  checkFraudReports,
  runPhoneIntelligence,
} = require('./modules/phoneIntel');

const {
  scanInstagram,
  scanTiktok,
  scanFacebook,
  scanTwitter,
  scanLinkedin,
  scanAllSocialPlatforms,
} = require('./modules/socialScanner');

const {
  analyzeDoxingReputation,
} = require('./modules/aiAnalyzer');

const {
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
} = require('./modules/riskScorer');

const {
  searchSerpMulti,
  annotateItem,
  enrichWithPageScrape,
  aggregateSerpIntel,
} = require('./modules/serpIntel');

const {
  generateGoogleRemovalLink,
  generateGooglePiiRemovalLink,
  getDmcaTemplate,
  generateTakedownActions,
} = require('./modules/remediation');

/**
 * Eksekusi Diagnosa Jejak Digital & Audit Forensik Menyeluruh (Single Target)
 * @param {object} scanParams - Parameter intake target
 * @param {number|null} clientId - ID Klien (opsional untuk sinkronisasi)
 * @returns {Promise<object>} Hasil investigasi dossier lengkap
 */
async function runOsintScan(scanParams = {}, clientId = null) {
  const startTime = Date.now();

  // ── 1. Ekstraksi & Normalisasi Parameter Intake ──────────────
  const fullName = String(scanParams.fullName || scanParams.name || scanParams.targetName || '').trim();
  const nik = String(scanParams.nik || scanParams.targetNik || scanParams.targetQuery || '').replace(/[^\d]/g, '').trim();
  const phone = String(scanParams.phone || scanParams.targetPhone || scanParams.hp || '').trim();
  const email = String(scanParams.email || scanParams.targetEmail || '').trim().toLowerCase();
  const spouseFamily = String(scanParams.spouseFamily || scanParams.familyName || scanParams.spouseFamilyName || '').trim();
  const keywords = String(scanParams.keywords || scanParams.doxingKeywords || scanParams.additionalKeywords || '').trim();

  const socialMedia = scanParams.socialMedia || {
    instagram: scanParams.usernameInstagram || scanParams.instagram || '',
    facebook: scanParams.usernameFacebook || scanParams.facebook || '',
    tiktok: scanParams.usernameTiktok || scanParams.tiktok || '',
    twitter: scanParams.usernameTwitter || scanParams.twitter || scanParams.xcom || '',
    linkedin: scanParams.usernameLinkedin || scanParams.linkedin || '',
    threads: scanParams.threads || '',
    youtube: scanParams.usernameYoutube || scanParams.youtube || '',
  };

  // ── 2. Langkah 1: Forensik NIK KTP & Validasi Dukcapil L2 ───────
  const nikForensicResult = parseNikForensic(nik, fullName);

  // ── 3. Ambil Kunci Konfigurasi API dari Database ─────────────
  const [serpApiKey, hibpApiKey, googleCseKey, googleCseCx, serpEnginesSetting] = await Promise.all([
    getSetting('SERP_API_KEY').catch(() => process.env.SERP_API_KEY || ''),
    getSetting('HIBP_API_KEY').catch(() => process.env.HIBP_API_KEY || ''),
    getSetting('GOOGLE_CSE_KEY').catch(() => process.env.GOOGLE_CSE_KEY || ''),
    getSetting('GOOGLE_CSE_CX').catch(() => process.env.GOOGLE_CSE_CX || ''),
    getSetting('SERP_ENGINES').catch(() => process.env.SERP_ENGINES || ''),
  ]);
  const serpEngines = String(serpEnginesSetting || 'google,bing,duckduckgo')
    .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const targetProfile = { fullName, nik, phone, email, spouseFamily, keywords, socialMedia };

  // ── 4. Langkah 2: Konstruksi & Eksekusi Google Dorking ─────────
  const dorkQueryList = buildDorkQueries({
    fullName,
    nik,
    phone,
    email,
    spouseFamilyName: spouseFamily,
    additionalKeywords: keywords,
    socialMedia,
  });

  const dorkResults = [];
  const crawledHits = [];
  const seenUrls = new Set();

  // Eksekusi kueri dorking secara paralel terkontrol (maksimal 4 kueri sekaligus)
  const dorkConcurrency = 4;
  for (let i = 0; i < dorkQueryList.length; i += dorkConcurrency) {
    const chunk = dorkQueryList.slice(i, i + dorkConcurrency);
    const chunkPromises = chunk.map(async (dorkItem) => {
      let searchRes = null;

      // Gunakan SerpAPI multi-engine jika API key tersedia. Kueri nama/identitas dipindai lebih dalam (Google hal. 2)
      if (serpApiKey && serpApiKey.trim().length > 0) {
        const deep = ['general', 'web_organic', 'identity', 'combined', 'email', 'phone'].includes(dorkItem.category);
        searchRes = await searchSerpMulti(dorkItem.query, serpApiKey, {
          engines: serpEngines,
          numResults: 20,
          deepPages: deep,
        });
      }

      // Fallback ke multi-sumber real scraper jika SerpAPI tidak ada atau nihil hasil
      if (!searchRes || !searchRes.success || !searchRes.items || searchRes.items.length === 0) {
        searchRes = await searchWebMultiSource(dorkItem.query, { fullName, nik, phone }, { numResults: 20 });
      }

      const validItems = [];
      if (searchRes.success && Array.isArray(searchRes.items)) {
        for (const item of searchRes.items) {
          if (!item.url || seenUrls.has(item.url)) continue;

          // Verifikasi relevansi ketat
          if (isItemRelevant(dorkItem.query, item, { fullName, nik, phone, email })) {
            seenUrls.add(item.url);
            const taggedItem = annotateItem({
              ...item,
              intel_tags: item.intel_tags || extractIntelTags(item.title, item.snippet, item.url),
            }, targetProfile);
            validItems.push(taggedItem);
            crawledHits.push(taggedItem);
          }
        }
      }

      return {
        label: dorkItem.label,
        query: dorkItem.query,
        risk: dorkItem.risk,
        category: dorkItem.category || 'general',
        description: dorkItem.description,
        platform: dorkItem.platform,
        direct_url: dorkItem.direct_url,
        found_count: validItems.length,
        result: {
          success: true,
          items: validItems,
          total: validItems.length,
          engine: searchRes.engine || 'multi',
        },
      };
    });

    const chunkResults = await Promise.all(chunkPromises);
    dorkResults.push(...chunkResults);
  }

  // ── 4b. Scraping isi halaman hasil teratas + agregasi entitas PII ──
  let scrapeMeta = { attempted: 0, scraped: 0 };
  try {
    scrapeMeta = await enrichWithPageScrape(crawledHits, targetProfile, { limit: 12 });
  } catch (e) {
    console.error('[serpIntel] page scrape error:', e.message);
  }
  const serpIntel = aggregateSerpIntel(crawledHits, targetProfile, { engines: serpEngines, ...scrapeMeta });

  // ── 5. Langkah 3 & 4: Social Media & Phone Intelligence ───────
  const [socialScanData, phoneIntelData] = await Promise.all([
    scanAllSocialPlatforms({
      socialMedia,
      fullName,
      phone,
      spouseFamilyName: spouseFamily,
      serpApiKey,
    }).catch(() => ({ total_social_score: 0, platforms: {} })),
    phone ? runPhoneIntelligence(phone, fullName).catch(() => ({ total_phone_score: 0 })) : Promise.resolve(null),
  ]);

  // ── 6. Langkah 5: Audit Kebocoran HIBP v3 & Database Nasional ──
  const breachAuditResult = await auditBreachDatabasesOptimized({
    email,
    phone,
    nik,
    fullName,
    hibpApiKey,
    crawledHits,
  });

  const breaches = breachAuditResult.breaches || [];
  const pastes = breachAuditResult.pastes || [];
  const hibpApiStatus = breachAuditResult.hibpApiStatus || {
    code: 200,
    statusText: 'AMAN',
    message: 'Audit HIBP selesai.',
    liveVerified: false,
  };

  // ── 7. Langkah 6: AI Doxing & Debt Exposure Analyzer ──────────
  const doxingAnalysis = analyzeDoxingReputation({
    fullName,
    phone,
    nik,
    spouseFamilyName: spouseFamily,
    additionalKeywords: keywords,
    dorkResults,
    socialData: socialScanData,
    phoneIntel: phoneIntelData,
  });

  // ── 8. Langkah 7: 5-Dimension Exposure Risk Score ──────────────
  const risk = calculateExposureRisk({
    dorkResults,
    breaches,
    socialData: socialScanData,
    phoneIntel: phoneIntelData,
    targetProfile: {
      fullName,
      phone,
      email,
      spouse: spouseFamily,
      nik,
      targetNik: nik,
    },
  });

  // ── 9. Langkah 8: Remediation & Legal Takedown Generator ──────
  const takedownActions = generateTakedownActions(dorkResults, breaches, fullName, nik);

  // ── 10. Kompilasi Dossier Forensik Lengkap ─────────────────────
  const totalFoundUrls = seenUrls.size;
  const executionTimeMs = Date.now() - startTime;

  const resultJson = {
    target: {
      fullName,
      nik,
      nikMasked: nikForensicResult.maskedNik,
      phone,
      email,
      spouseFamily,
      keywords,
      socialMedia,
    },
    nikForensic: nikForensicResult,
    dorkResults,
    serpIntel,
    breaches,
    pastes,
    domainAdvisories: breachAuditResult.domainAdvisories || [],
    nationalLeakSources: breachAuditResult.nationalLeakSources || [],
    hibpApiStatus,
    socialData: socialScanData,
    phoneIntel: phoneIntelData,
    doxingAnalysis,
    risk,
    takedownActions,
    stats: {
      totalFoundUrls,
      breachCount: breaches.length,
      pasteCount: pastes.length,
      dorkQueriesCount: dorkQueryList.length,
      executionTimeMs,
      completedAt: new Date().toISOString(),
    },
  };

  // ── 11. Simpan Dossier ke Database MySQL via Prisma ────────────
  const savedScan = await prisma.scanHistory.create({
    data: {
      clientId: clientId ? Number(clientId) : null,
      targetName: fullName || 'Subjek Target OSINT',
      targetPhone: phone || null,
      targetEmail: email || null,
      targetNik: nik || null,
      targetInstagram: socialMedia.instagram || null,
      targetTiktok: socialMedia.tiktok || null,
      targetFacebook: socialMedia.facebook || null,
      targetTwitter: socialMedia.twitter || null,
      targetLinkedin: socialMedia.linkedin || null,
      targetThreads: socialMedia.threads || null,
      targetYoutube: socialMedia.youtube || null,
      spouseFamily: spouseFamily || null,
      keywords: keywords || null,
      riskScore: risk.finalScore,
      riskCategory: risk.category,
      riskColor: risk.color,
      dorkFound: totalFoundUrls,
      breachCount: breaches.length,
      socialPlatforms: Object.keys(socialMedia).filter(k => socialMedia[k]),
      status: 'selesai',
      scanMode: 'real',
      resultJson,
      notes: `Diagnosa jejak digital selesai. Skor Risiko: ${risk.finalScore}/100 (${risk.category}). Total temuan URL unik: ${totalFoundUrls}. Total kebocoran data: ${breaches.length}. NIK KTP: ${nikForensicResult.maskedNik || '-'}.`,
    },
  });

  // Sinkronisasi pembaruan profil klien jika terkait
  if (clientId) {
    await prisma.client.update({
      where: { id: Number(clientId) },
      data: {
        riskScore: risk.finalScore,
        threatLevel: risk.category === 'KRITIS' ? 'CRITICAL' : (risk.category === 'SEDANG' ? 'MODERATE' : 'LOW'),
      },
    }).catch(() => {});
  }

  return {
    scanId: savedScan.id,
    record: savedScan,
    result: resultJson,
  };
}

/**
 * Ambil daftar riwayat scan dari database
 */
async function getScanHistory(limit = 100) {
  return prisma.scanHistory.findMany({
    orderBy: { id: 'desc' },
    take: Number(limit),
    include: {
      client: {
        select: { id: true, clientCode: true, fullName: true, threatLevel: true },
      },
    },
  });
}

/**
 * Ambil detail scan berdasarkan ID
 */
async function getScanDetail(id) {
  return prisma.scanHistory.findUnique({
    where: { id: Number(id) },
    include: { client: true },
  });
}

// ── Backward Compatibility Aliases ────────────────────────────
async function auditBreachDatabases(params = {}) {
  const breaches = [];
  if (params.email) {
    const res = await checkEmailBreaches(params.email, params.hibpApiKey);
    if (res.success && res.breaches) breaches.push(...res.breaches);
  }
  const nat = auditNationalLeaks(params);
  breaches.push(...nat);
  return breaches;
}

function analyzeDoxingAi(params = {}) {
  return analyzeDoxingReputation(params);
}

function calculateRiskScore(params = {}) {
  return calculateExposureRisk(params);
}

const searchGoogle = searchWebMultiSource;
const searchYandex = searchWebMultiSource;
const searchBrave = searchWebMultiSource;

module.exports = {
  // Main Entrypoints
  runOsintScan,
  getScanHistory,
  getScanDetail,

  // Modular Exposes
  PROVINCE_CODES,
  parseNikForensic,
  buildNikDorkQueries,
  evaluateNikRisk,

  PLATFORM_META,
  buildDorkQueries,
  searchSerpApi,
  searchGoogleCustomApi,

  decodeBingUrl,
  extractIntelTags,
  isItemRelevant,
  searchBing,
  searchYahoo,
  searchDuckDuckGo,
  searchWebMultiSource,
  searchGoogle,
  searchYandex,
  searchBrave,

  formatPwnCount,
  getSeverityFromDataClasses,
  checkEmailBreaches,
  checkEmailPastes,
  checkPhoneBreaches,
  auditBreachDatabases,
  auditNationalLeaks,

  normalizePhone,
  runPhoneIntelligence,
  lookupTruecallerWeb,
  countPhoneWebMentions,
  checkFraudReports,

  scanAllSocialPlatforms,
  scanInstagram,
  scanFacebook,
  scanTiktok,
  scanTwitter,
  scanLinkedin,

  analyzeDoxingReputation,
  analyzeDoxingAi,

  calculateExposureRisk,
  calculateRiskScore,
  generateRecommendations,

  generateGoogleRemovalLink,
  generateGooglePiiRemovalLink,
  getDmcaTemplate,
  generateTakedownActions,

  hibpService,
};
