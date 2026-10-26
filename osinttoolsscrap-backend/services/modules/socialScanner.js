/**
 * Cyber Guardian Intelligence - Social Media & Anonymous Tagging Scanner Module
 * 
 * Ported & Enhanced from sample/modules/social_scanner.py
 * Pemindaian jejak digital profil dan komentar media sosial publik:
 * - Instagram, TikTok, Facebook, Twitter / X, Threads, LinkedIn, YouTube
 * - Deteksi postingan/komentar dari akun anonim (anon) yang menandai target (@username)
 * - Deteksi tuduhan "maling", "penggelapan dana/data aplikasi pinjol", teror Debt Collector
 * - Deteksi aktivitas komentar yang dilakukan target (klarifikasi / tanggapan)
 * - Integrasi SerpAPI Google Deep Indexing + Fallback Multi-Engine Scraper
 * - Kalkulasi skor keterpaparan media sosial (total_social_score)
 */

const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');
const { searchWebMultiSource, extractIntelTags } = require('./realScraper');
const { searchSerpApi } = require('./googleDorking');

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

function getRandomUserAgent() {
  const agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  ];
  return agents[Math.floor(Math.random() * agents.length)];
}

/**
 * Mesin pencari media sosial cerdas: mengutamakan SerpAPI resmi jika tersedia,
 * dan secara otomatis fallback ke multi-engine scraper lokal jika API key kosong.
 */
async function searchSocialEngine(query, serpApiKey = '', targetData = {}, numResults = 5) {
  if (serpApiKey && String(serpApiKey).trim().length > 0) {
    try {
      const serpRes = await searchSerpApi(query, serpApiKey, numResults);
      if (serpRes.success && Array.isArray(serpRes.items) && serpRes.items.length > 0) {
        return serpRes;
      }
    } catch (e) {
      // Abaikan dan lanjutkan ke fallback
    }
  }
  return searchWebMultiSource(query, targetData, { numResults });
}

/**
 * Ekstrak kutipan kalimat dan akun penyerang anonim dari teks cuplikan
 */
function extractThreatEvidence(text = '') {
  const lower = text.toLowerCase();
  const accMatches = text.match(/@[a-zA-Z0-9_.]+/g) || [];
  
  // Deteksi akun anonim atau penyerang (akun yang bukan nama target umum)
  const suspectAccounts = accMatches.filter(acc => {
    const accLow = acc.toLowerCase();
    return !['@gmail', '@yahoo', '@outlook', '@hotmail'].some(em => accLow.includes(em));
  });

  // Klasifikasi kategori ancaman
  let category = 'UMUM';
  if (lower.includes('maling') || lower.includes('penggelapan') || lower.includes('bawa kabur') || lower.includes('bawa lari')) {
    category = 'TUDUHAN_MALING_PENGGELAPAN';
  } else if (lower.includes('debt collector') || lower.includes('dc lapangan') || lower.includes('teror') || lower.includes('sebar data')) {
    category = 'TEROR_DEBT_COLLECTOR';
  } else if (lower.includes('pinjol') || lower.includes('utang') || lower.includes('tagihan') || lower.includes('bayar')) {
    category = 'PENGANCAMAN_PINJOL';
  }

  // Ekstrak kutipan kalimat teror utama
  const triggerWords = ['maling', 'penggelapan', 'pinjol', 'debt collector', 'bawa kabur', 'utang', 'tagihan', 'teror', 'penipu'];
  let quote = '';
  for (const tw of triggerWords) {
    if (lower.includes(tw)) {
      const words = text.split(/\s+/);
      const idx = words.findIndex(w => w.toLowerCase().includes(tw));
      if (idx !== -1) {
        const start = Math.max(0, idx - 6);
        const end = Math.min(words.length, idx + 10);
        quote = `"...${words.slice(start, end).join(' ')}..."`;
        break;
      }
    }
  }

  return {
    category,
    suspectAccounts,
    quote: quote || (text.length > 100 ? `"...${text.slice(0, 100)}..."` : text),
  };
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * AUDIT KHUSUS: DETEKSI POSTINGAN DITANDAI AKUN ANON & AKTIVITAS KOMENTAR TARGET
 * ─────────────────────────────────────────────────────────────────────────────
 */
async function auditAnonTaggingAndComments({
  socialMedia = {},
  fullName = '',
  phone = '',
  serpApiKey = '',
} = {}) {
  const anonTaggedPosts = [];
  const targetCommentActivities = [];
  const seenUrls = new Set();

  const socialUsernames = [
    ['instagram', socialMedia.instagram, 'site:instagram.com'],
    ['tiktok', socialMedia.tiktok, 'site:tiktok.com'],
    ['facebook', socialMedia.facebook, 'site:facebook.com'],
    ['twitter', socialMedia.twitter || socialMedia.xcom, 'site:twitter.com OR site:x.com'],
    ['threads', socialMedia.threads, 'site:threads.net'],
  ];

  for (const [platformName, rawUname, siteFilter] of socialUsernames) {
    if (!rawUname || !String(rawUname).trim()) continue;

    let uname = String(rawUname).trim().replace(/^@/, '');
    if (uname.includes('/')) uname = uname.split('/').filter(Boolean).pop().split('?')[0];
    if (!uname) continue;

    // 1. Kueri A: Postingan & Komentar Akun Anon yang Menandai Target (@username)
    // Mencari kata kunci ancaman pinjol, debt collector, maling, penggelapan data aplikasi pinjol
    const qAnonTag = `("@${uname}" OR "${uname}") (${siteFilter}) (maling OR "penggelapan dana" OR "penggelapan data" OR "bawa kabur" OR pinjol OR "debt collector" OR teror OR penipu OR buron OR "bayar utang" OR "kontak darurat")`;
    
    try {
      const tagRes = await searchSocialEngine(qAnonTag, serpApiKey, { fullName, phone }, 6);
      if (tagRes.success && Array.isArray(tagRes.items)) {
        for (const item of tagRes.items) {
          if (!item.url || seenUrls.has(item.url)) continue;
          seenUrls.add(item.url);

          const fullSnippet = `${item.title || ''} ${item.snippet || ''}`;
          const evidence = extractThreatEvidence(fullSnippet);

          anonTaggedPosts.push({
            platform: platformName,
            url: item.url,
            title: item.title || 'Unggahan Media Sosial',
            snippet: item.snippet || '',
            display_url: item.display_url || platformName,
            target_username: uname,
            threat_category: evidence.category,
            accuser_accounts: evidence.suspectAccounts,
            quote: evidence.quote,
            is_anonymous_accuser: true,
            detected_at: item.date || new Date().toISOString().split('T')[0],
            intel_tags: extractIntelTags(item.title, item.snippet, item.url),
          });
        }
      }
    } catch (e) {
      console.error(`Error audit anon tagging ${platformName}:`, e.message);
    }

    // 2. Kueri B: Aktivitas Komentar Target (Klarifikasi, Tanggapan, atau Bantahan)
    const qTargetComment = `("@${uname}" OR "${fullName || uname}") (${siteFilter}) ("saya tidak pernah" OR "bukan saya" OR "klarifikasi" OR "lapor polisi" OR "pinjol ilegal" OR "pencemaran nama baik" OR "tidak kenal" OR "stop teror")`;

    try {
      const commentRes = await searchSocialEngine(qTargetComment, serpApiKey, { fullName, phone }, 4);
      if (commentRes.success && Array.isArray(commentRes.items)) {
        for (const item of commentRes.items) {
          if (!item.url || seenUrls.has(item.url)) continue;
          seenUrls.add(item.url);

          targetCommentActivities.push({
            platform: platformName,
            url: item.url,
            title: item.title || 'Komentar Media Sosial',
            snippet: item.snippet || '',
            display_url: item.display_url || platformName,
            target_username: uname,
            comment_type: 'KLARIFIKASI_TARGET',
            quote: item.snippet ? `"...${item.snippet.slice(0, 120)}..."` : '',
            detected_at: item.date || new Date().toISOString().split('T')[0],
          });
        }
      }
    } catch (e) {
      console.error(`Error audit target comment ${platformName}:`, e.message);
    }
  }

  return {
    anon_tagging_detected: anonTaggedPosts.length > 0,
    anon_tagged_posts: anonTaggedPosts,
    target_comment_activities: targetCommentActivities,
    total_threat_tags: anonTaggedPosts.length,
    total_target_comments: targetCommentActivities.length,
  };
}

/**
 * Scan profil dan jejak Instagram publik
 */
async function scanInstagram(username = '', fullName = '', serpApiKey = '') {
  if (!username) return { success: false, platform: 'instagram', error: 'Username kosong' };

  let uname = String(username).trim().replace(/^@/, '');
  if (uname.includes('/')) uname = uname.split('/').filter(Boolean).pop().split('?')[0];

  const profileUrl = `https://www.instagram.com/${uname}/`;
  const result = {
    success: true,
    platform: 'instagram',
    username: uname,
    url: profileUrl,
    exists: false,
    is_public: false,
    full_name: '',
    bio: '',
    exposure_score: 0,
    exposure_details: [],
    doxing_comments_found: 0,
    anon_tags_found: 0,
  };

  try {
    // 1. Verifikasi Profil Publik
    const qProfile = `"${uname}" site:instagram.com`;
    const searchRes = await searchSocialEngine(qProfile, serpApiKey, { fullName }, 3);

    if (searchRes.items && searchRes.items.length > 0) {
      result.exists = true;
      result.is_public = true;
      result.exposure_score += 25;
      result.exposure_details.push(`Profil @${uname} terindeks publik di mesin pencari.`);

      const firstItem = searchRes.items[0];
      result.full_name = firstItem.title ? firstItem.title.split('(@')[0].replace('• Instagram', '').trim() : '';
      result.bio = firstItem.snippet || '';
    }

    // 2. Periksa Komentar Doxing & Tagihan Pinjol / Tuduhan Maling
    const qComments = `("@${uname}" OR "${uname}") site:instagram.com (utang OR pinjol OR maling OR penggelapan OR "debt collector" OR bayar)`;
    const commentRes = await searchSocialEngine(qComments, serpApiKey, {}, 5);

    if (commentRes.items && commentRes.items.length > 0) {
      result.doxing_comments_found = commentRes.items.length;
      result.exposure_score += 45;
      result.exposure_details.push(`🚨 Terdeteksi ${commentRes.items.length} postingan/komentar publik di Instagram terkait tagihan pinjol atau penuduhan data!`);
    }
  } catch (e) {
    result.error = e.message;
  }

  return result;
}

/**
 * Scan profil dan jejak TikTok publik
 */
async function scanTiktok(username = '', serpApiKey = '') {
  if (!username) return { success: false, platform: 'tiktok', error: 'Username kosong' };

  let uname = String(username).trim().replace(/^@/, '');
  if (uname.includes('/')) uname = uname.split('/').filter(Boolean).pop().split('?')[0];

  const result = {
    success: true,
    platform: 'tiktok',
    username: uname,
    url: `https://www.tiktok.com/@${uname}`,
    exists: false,
    exposure_score: 0,
    exposure_details: [],
    doxing_comments_found: 0,
  };

  try {
    const q = `"${uname}" site:tiktok.com`;
    const searchRes = await searchSocialEngine(q, serpApiKey, {}, 3);

    if (searchRes.items && searchRes.items.length > 0) {
      result.exists = true;
      result.exposure_score += 20;
      result.exposure_details.push(`Akun TikTok @${uname} aktif dan terindeks publik.`);
    }

    const qDox = `("@${uname}") site:tiktok.com (pinjol OR utang OR maling OR penggelapan OR penagihan)`;
    const doxRes = await searchSocialEngine(qDox, serpApiKey, {}, 4);
    if (doxRes.items && doxRes.items.length > 0) {
      result.doxing_comments_found = doxRes.items.length;
      result.exposure_score += 35;
      result.exposure_details.push(`🚨 Terdeteksi ${doxRes.items.length} mention/komentar di TikTok terkait teror penagihan.`);
    }
  } catch (e) {}

  return result;
}

/**
 * Scan profil Facebook publik & Forum Doxing
 */
async function scanFacebook(username = '', fullName = '', serpApiKey = '') {
  if (!username && !fullName) return { success: false, platform: 'facebook', error: 'Parameter kosong' };

  let uname = String(username || '').trim().replace(/^@/, '');
  if (uname.includes('/')) uname = uname.split('/').filter(Boolean).pop().split('?')[0];

  const result = {
    success: true,
    platform: 'facebook',
    username: uname,
    url: uname ? `https://www.facebook.com/${uname}` : 'https://www.facebook.com',
    exists: false,
    exposure_score: 0,
    exposure_details: [],
    doxing_threads_found: 0,
  };

  try {
    const queryTerm = uname ? `"${uname}"` : `"${fullName}"`;
    const q = `${queryTerm} site:facebook.com`;
    const searchRes = await searchSocialEngine(q, serpApiKey, { fullName }, 5);

    if (searchRes.items && searchRes.items.length > 0) {
      result.exists = true;
      result.exposure_score += 25;
      result.exposure_details.push(`Profil Facebook terindeks pada ${searchRes.items.length} halaman publik.`);

      // Periksa thread doxing di grup/halaman publik
      for (const it of searchRes.items) {
        const text = `${it.title} ${it.snippet}`.toLowerCase();
        if (['utang', 'hutang', 'pinjol', 'penipu', 'tagihan', 'buron', 'maling', 'penggelapan'].some(w => text.includes(w))) {
          result.doxing_threads_found++;
        }
      }

      if (result.doxing_threads_found > 0) {
        result.exposure_score += 45;
        result.exposure_details.push(`🚨 Terdeteksi ${result.doxing_threads_found} postingan/komentar di Facebook yang mengaitkan target dengan kasus utang/penipuan/maling.`);
      }
    }
  } catch (e) {}

  return result;
}

/**
 * Scan profil Twitter / X publik
 */
async function scanTwitter(username = '', serpApiKey = '') {
  if (!username) return { success: false, platform: 'twitter', error: 'Username kosong' };

  let uname = String(username).trim().replace(/^@/, '');
  if (uname.includes('/')) uname = uname.split('/').filter(Boolean).pop().split('?')[0];

  const result = {
    success: true,
    platform: 'twitter',
    username: uname,
    url: `https://x.com/${uname}`,
    exists: false,
    exposure_score: 0,
    exposure_details: [],
    doxing_tweets_found: 0,
  };

  try {
    const q = `"${uname}" (site:twitter.com OR site:x.com)`;
    const searchRes = await searchSocialEngine(q, serpApiKey, {}, 3);

    if (searchRes.items && searchRes.items.length > 0) {
      result.exists = true;
      result.exposure_score += 20;
      result.exposure_details.push(`Akun Twitter/X @${uname} ditemukan di ruang publik.`);
    }

    const qDox = `("@${uname}") (site:twitter.com OR site:x.com) (pinjol OR "debt collector" OR maling OR penggelapan OR penipu OR teror)`;
    const doxRes = await searchSocialEngine(qDox, serpApiKey, {}, 4);
    if (doxRes.items && doxRes.items.length > 0) {
      result.doxing_tweets_found = doxRes.items.length;
      result.exposure_score += 40;
      result.exposure_details.push(`🚨 Terdeteksi ${doxRes.items.length} cuitan/reply di Twitter/X terkait penyerangan pinjol/maling.`);
    }
  } catch (e) {}

  return result;
}

/**
 * Scan profil LinkedIn publik
 */
async function scanLinkedin(username = '', fullName = '', serpApiKey = '') {
  const target = username || fullName;
  if (!target) return { success: false, platform: 'linkedin', error: 'Target kosong' };

  let uname = String(target).trim().replace(/^@/, '');
  if (uname.includes('/')) uname = uname.split('/').filter(Boolean).pop().split('?')[0];

  const result = {
    success: true,
    platform: 'linkedin',
    username: uname,
    url: `https://www.linkedin.com/in/${encodeURIComponent(uname)}`,
    exists: false,
    exposure_score: 0,
    exposure_details: [],
  };

  try {
    const q = `"${uname}" site:linkedin.com/in/`;
    const searchRes = await searchSocialEngine(q, serpApiKey, { fullName }, 3);

    if (searchRes.items && searchRes.items.length > 0) {
      result.exists = true;
      result.exposure_score += 25;
      result.exposure_details.push(`Profil profesional LinkedIn terindeks publik.`);
    }
  } catch (e) {}

  return result;
}

/**
 * Jalankan pemeriksaan seluruh platform media sosial secara komprehensif
 * Termasuk audit khusus postingan ditandai akun anon & komentar target.
 */
async function scanAllSocialPlatforms({
  socialMedia = {},
  fullName = '',
  phone = '',
  spouseFamilyName = '',
  serpApiKey = '',
} = {}) {
  const platforms = {};
  const tasks = [];

  const igUser = socialMedia.instagram;
  if (igUser) {
    tasks.push(scanInstagram(igUser, fullName, serpApiKey).then(res => { platforms.instagram = res; }));
  }

  const fbUser = socialMedia.facebook;
  if (fbUser || fullName) {
    tasks.push(scanFacebook(fbUser, fullName, serpApiKey).then(res => { platforms.facebook = res; }));
  }

  const ttUser = socialMedia.tiktok;
  if (ttUser) {
    tasks.push(scanTiktok(ttUser, serpApiKey).then(res => { platforms.tiktok = res; }));
  }

  const twUser = socialMedia.twitter || socialMedia.xcom;
  if (twUser) {
    tasks.push(scanTwitter(twUser, serpApiKey).then(res => { platforms.twitter = res; }));
  }

  const inUser = socialMedia.linkedin;
  if (inUser || fullName) {
    tasks.push(scanLinkedin(inUser, fullName, serpApiKey).then(res => { platforms.linkedin = res; }));
  }

  // Audit khusus: Deteksi postingan akun anon yang menandai target & aktivitas komentar target
  let anonAuditResult = {
    anon_tagging_detected: false,
    anon_tagged_posts: [],
    target_comment_activities: [],
    total_threat_tags: 0,
    total_target_comments: 0,
  };

  tasks.push(
    auditAnonTaggingAndComments({
      socialMedia,
      fullName,
      phone,
      serpApiKey,
    }).then(res => {
      anonAuditResult = res;
    }).catch(err => {
      console.error('Error auditAnonTaggingAndComments:', err.message);
    })
  );

  await Promise.all(tasks);

  // Kalkulasi total social score
  let totalScore = 0;
  const allDetails = [];

  for (const [pKey, pData] of Object.entries(platforms)) {
    totalScore += pData.exposure_score || 0;
    if (Array.isArray(pData.exposure_details)) {
      allDetails.push(...pData.exposure_details);
    }
  }

  // Tambahkan skor jika ada postingan anonim yang menandai target
  if (anonAuditResult.anon_tagging_detected) {
    totalScore += Math.min(anonAuditResult.anon_tagged_posts.length * 20, 50);
    allDetails.push(`🚨 Terdeteksi ${anonAuditResult.anon_tagged_posts.length} unggahan/komentar dari akun anonim yang menandai target dengan narasi penagihan/maling!`);
  }

  return {
    success: true,
    platforms,
    total_social_score: Math.min(totalScore, 100),
    exposure_details: allDetails,
    anon_tagging_detected: anonAuditResult.anon_tagging_detected,
    anon_tagged_posts: anonAuditResult.anon_tagged_posts,
    target_comment_activities: anonAuditResult.target_comment_activities,
    threat_summary: anonAuditResult.anon_tagging_detected
      ? `Teridentifikasi ${anonAuditResult.anon_tagged_posts.length} unggahan media sosial berbahaya yang menandai subjek secara sepihak.`
      : 'Tidak ditemukan indikasi postingan akun anonim yang menandai target.',
  };
}

module.exports = {
  scanInstagram,
  scanTiktok,
  scanFacebook,
  scanTwitter,
  scanLinkedin,
  auditAnonTaggingAndComments,
  scanAllSocialPlatforms,
};
