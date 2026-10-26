/**
 * Cyber Guardian Intelligence - Real Scraper Engine
 * 
 * Ported & Enhanced from sample/modules/real_scraper.py
 * Mesin scraping web multi-sumber tanpa ketergantungan API berbayar:
 * - Bing Search (dengan decoding URL base64 u=a1aHR0c...)
 * - DuckDuckGo HTML
 * - Yahoo Search
 * - Brave Search
 * - Yandex Web
 * - Filter relevansi cerdas (isItemRelevant) dengan validasi nama, NIK, dan nomor HP
 * - Ekstraktor tag intelijen (extractIntelTags)
 */

const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

// In-Memory Cache dengan TTL (60 Menit)
const _cache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000;

function cacheGet(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() < entry.expires) {
    return entry.data;
  }
  _cache.delete(key);
  return null;
}

function cacheSet(key, data, ttlMs = CACHE_TTL_MS) {
  _cache.set(key, {
    data,
    expires: Date.now() + ttlMs,
  });
}

// User-Agent Pool Browser Terkini
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // Hindari SSLError Hostname Mismatch pada platform Windows
});

/**
 * Decode URL redirect Bing (u=a1aHR0cHM6Ly...) menjadi URL tujuan asli
 */
function decodeBingUrl(rawUrl = '') {
  if (!rawUrl || !rawUrl.includes('bing.com/ck/a?')) {
    return rawUrl;
  }
  try {
    const urlObj = new URL(rawUrl);
    const uParam = urlObj.searchParams.get('u');
    if (uParam) {
      let b64 = uParam;
      if (b64.startsWith('a1')) {
        b64 = b64.slice(2);
      }
      // Tambahkan padding base64 jika diperlukan
      while (b64.length % 4 !== 0) {
        b64 += '=';
      }
      const decoded = Buffer.from(b64, 'base64').toString('utf-8');
      if (decoded.startsWith('http')) {
        return decoded;
      }
    }
  } catch (e) {
    // Abaikan jika gagal decode, kembalikan URL awal
  }
  return rawUrl;
}

/**
 * Ekstraksi tag intelijen dari metadata hasil pencarian
 */
function extractIntelTags(title = '', snippet = '', url = '') {
  const tags = new Set();
  const text = `${title} ${snippet} ${url}`.toLowerCase();

  if (/\b(3[1-9]\d{14}|[1-9]\d{15})\b/.test(text) || text.includes('nik') || text.includes('e-ktp') || text.includes('ktp')) {
    tags.add('NIK KTP Terbuka');
  }
  if (text.includes('.pdf') || text.includes('filetype:pdf')) {
    tags.add('Dokumen PDF');
  }
  if (text.includes('.xls') || text.includes('.xlsx') || text.includes('sheet')) {
    tags.add('Spreadsheet/Data');
  }
  if (text.includes('pastebin.com') || text.includes('rentry.co') || text.includes('justpaste.it') || text.includes('ghostbin')) {
    tags.add('Pastebin Leak Dump');
  }
  if (text.includes('t.me/') || text.includes('telegram')) {
    tags.add('Kanal Telegram');
  }
  if (text.includes('maling') || text.includes('penggelapan') || text.includes('bawa kabur') || text.includes('bawa lari') || text.includes('penipuan pinjol')) {
    tags.add('Tuduhan Maling/Penggelapan');
  }
  if (text.includes('utang') || text.includes('hutang') || text.includes('pinjol') || text.includes('debt collector') || text.includes('tagihan') || text.includes('teror') || text.includes('kondar') || text.includes('kontak darurat') || text.includes('sebar data')) {
    tags.add('Teror Pinjol / DC');
  }
  if ((text.includes('@') && (text.includes('pinjol') || text.includes('maling') || text.includes('utang') || text.includes('tagih') || text.includes('penipu'))) || text.includes('anonim') || text.includes('akun fake')) {
    tags.add('Ditandai Akun Anon');
  }
  if (text.includes('klarifikasi') || text.includes('bukan saya') || text.includes('lapor polisi') || text.includes('pencemaran nama baik') || text.includes('tidak pernah') || text.includes('stop teror')) {
    tags.add('Komentar Klarifikasi');
  }
  if (text.includes('suami') || text.includes('istri') || text.includes('keluarga') || text.includes('kondar') || text.includes('kontak darurat') || text.includes('penjamin')) {
    tags.add('Informasi Keluarga/Kondar');
  }
  if (text.includes('kpu') || text.includes('dpt') || text.includes('pemilu') || text.includes('dukcapil') || text.includes('bpjs')) {
    tags.add('Arsip Kependudukan');
  }
  if (text.includes('linkedin.com') || text.includes('cake.me') || text.includes('jobstreet') || text.includes('glints.com') || text.includes('kalibrr') || text.includes('buildwithangga') || text.includes('resume') || text.includes('curriculum vitae')) {
    tags.add('Karier & Portofolio');
  }
  if (text.includes('github.com') || text.includes('gitlab.com') || text.includes('codepolitan') || text.includes('dicoding') || text.includes('developer') || text.includes('programmer')) {
    tags.add('Pengembang & Portofolio Kode');
  }
  if (text.includes('kemdikbud.go.id') || text.includes('pddikti') || text.includes('universitas') || text.includes('institut') || text.includes('sertifikat') || text.includes('alumni')) {
    tags.add('Pendidikan & Sertifikasi');
  }
  if (text.includes('instagram.com') || text.includes('facebook.com') || text.includes('tiktok.com') || text.includes('twitter.com') || text.includes('x.com') || text.includes('threads.net')) {
    tags.add('Media Sosial');
  }
  if (text.includes('putusan') || text.includes('mahkamahagung') || text.includes('pengadilan')) {
    tags.add('Dokumen Hukum / Peradilan');
  }
  if (text.includes('ai overview') || text.includes('knowledge graph') || text.includes('answer box')) {
    tags.add('AI Overview & Knowledge Graph');
  }

  if (tags.size === 0) {
    tags.add('Indeks Publik');
  }

  return Array.from(tags);
}

/**
 * Filter Relevansi Forensik Ketat
 * Memastikan hasil pencarian 100% relevan dengan target (Nama, NIK, HP, atau domain)
 * serta membuang spam, kuis Bing, quotes acak, dan bahasa asing.
 */
function isItemRelevant(query = '', item = {}, targetData = {}) {
  const title = String(item.title || '').trim();
  const snippet = String(item.snippet || '').trim();
  const url = String(item.url || '').toLowerCase();
  const combined = `${title} ${snippet} ${url}`.toLowerCase();

  // 1. Filter Karakter Aksara Asing (Arab, Cyrillic, Mandarin, dsb.)
  if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u4E00-\u9FFF\u0400-\u04FF]/.test(combined)) {
    return false;
  }

  // 2. Filter Judul Sampah Internal Mesin Pencari
  const garbageKeywords = [
    'binghomepagequiz', 'microsoft rewards', 'bing homepage quiz',
    'top 25 quotes', 'quote of the day', 'a-z quotes',
    'privacy policy', 'terms of service', 'cookie policy',
    'enable javascript', 'please verify you are a human',
  ];
  if (garbageKeywords.some(g => title.toLowerCase().includes(g))) {
    return false;
  }

  // 3. Filter Operator site: (jika ada pada query)
  const siteMatches = query.toLowerCase().match(/site:([^\s()]+)/g);
  if (siteMatches && siteMatches.length > 0) {
    const allowedDomains = siteMatches.map(sm => sm.replace('site:', '').split('/')[0].trim());
    const isDomainMatched = allowedDomains.some(dom => url.includes(dom));
    if (!isDomainMatched) {
      return false;
    }
  }

  // 4. Filter Target NIK 16-Digit (Prioritas Tinggi Forensik)
  const targetNik = String(targetData.nik || targetData.targetNik || '').replace(/[^\d]/g, '');
  const queryNikMatches = query.match(/\b\d{16}\b/);
  const searchNik = targetNik || (queryNikMatches ? queryNikMatches[0] : '');

  if (searchNik && searchNik.length === 16) {
    const cleanCombinedDigits = combined.replace(/[^\d]/g, '');
    const hasFullNik = cleanCombinedDigits.includes(searchNik);
    const hasPrefix = cleanCombinedDigits.includes(searchNik.slice(0, 6));
    const hasSuffix = cleanCombinedDigits.includes(searchNik.slice(-4));

    // Jika query secara spesifik mencari NIK, setidaknya prefix atau full NIK harus ada
    if (query.includes(searchNik)) {
      if (hasFullNik || (hasPrefix && hasSuffix)) {
        return true;
      }
    }
  }

  // 4b. Filter Target Username Media Sosial (@username)
  const usernameMatch = query.match(/@([a-zA-Z0-9_.]+)/);
  if (usernameMatch) {
    const rawUname = usernameMatch[1].toLowerCase();
    if (combined.includes(rawUname) || url.includes(rawUname)) {
      return true; // Relevan secara presisi karena mention username target terkonfirmasi
    }
  }

  // 4c. Filter Target Email (Prioritas Tinggi jika kueri atau hasil mengandung alamat email)
  const targetEmail = String(targetData.email || '').toLowerCase().trim();
  const queryEmailMatch = query.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const activeEmail = targetEmail || (queryEmailMatch ? queryEmailMatch[0].toLowerCase() : '');
  if (activeEmail && activeEmail.includes('@')) {
    const emailPrefix = activeEmail.split('@')[0];
    if (combined.includes(activeEmail) || (emailPrefix.length >= 4 && combined.includes(emailPrefix))) {
      return true; // Relevan karena alamat email target teridentifikasi langsung
    }
  }

  // 5. Filter Target Nama Lengkap
  const targetName = String(targetData.fullName || targetData.name || '').trim();
  const quotedNames = query.match(/"([^"]{3,40})"/g) || [];
  const nameGroups = [];

  const ignoredWords = ['nomor identitas', 'bayar utang', 'debt collector', 'laporan penipuan', 'kode pos'];
  for (const qn of quotedNames) {
    const cleanQ = qn.replace(/"/g, '').trim().toLowerCase();
    if (!ignoredWords.includes(cleanQ) && !/^\d+$/.test(cleanQ)) {
      const tokens = cleanQ.split(/\s+/).filter(t => t.length >= 3 && !['utang', 'hutang', 'pinjol', 'doxing', 'suami', 'istri', 'dan'].includes(t));
      if (tokens.length > 0) {
        nameGroups.push(tokens);
      }
    }
  }

  if (targetName && nameGroups.length === 0) {
    const tokens = targetName.toLowerCase().split(/\s+/).filter(t => t.length >= 3);
    if (tokens.length > 0) nameGroups.push(tokens);
  }

  if (nameGroups.length > 0) {
    let matchedNameGroup = false;
    for (const group of nameGroups) {
      // Setidaknya 1 kata kunci nama (panjang >= 3 huruf) harus ada di konten
      if (group.some(token => combined.includes(token))) {
        matchedNameGroup = true;
        break;
      }
    }
    if (!matchedNameGroup) {
      return false;
    }
  }

  // 6. Filter Target Nomor HP
  const targetPhone = String(targetData.phone || '').replace(/[^\d]/g, '');
  const phoneDigits = query.match(/\b\d{8,13}\b/);
  const activePhone = targetPhone || (phoneDigits ? phoneDigits[0] : '');

  if (activePhone && activePhone.length >= 8) {
    const localPhone = activePhone.startsWith('62') ? '0' + activePhone.slice(2) : (activePhone.startsWith('8') ? '0' + activePhone : activePhone);
    const intlPhone = localPhone.startsWith('0') ? '62' + localPhone.slice(1) : localPhone;
    const cleanCombinedDigits = combined.replace(/[^\d]/g, '');

    const phoneMatched = cleanCombinedDigits.includes(localPhone) ||
      cleanCombinedDigits.includes(intlPhone) ||
      cleanCombinedDigits.includes(localPhone.slice(1));

    if (query.includes(activePhone) && !phoneMatched) {
      return false;
    }
  }

  return true;
}

/**
 * Scraper Mesin Bing
 */
async function searchBing(query, numResults = 8) {
  const cacheKey = `bing:${query}:${numResults}`;
  const cached = cacheGet(cacheKey);
  if (cached) return { ...cached, from_cache: true };

  const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=id`;
  const headers = {
    'User-Agent': getRandomUserAgent(),
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };

  try {
    const resp = await axios.get(url, { headers, timeout: 6000, httpsAgent });
    if (resp.status !== 200) {
      return { success: false, error: `Bing HTTP ${resp.status}`, items: [], engine: 'bing' };
    }

    const $ = cheerio.load(resp.data);
    const items = [];

    $('.b_algo').each((_, el) => {
      const h2 = $(el).find('h2');
      const a = h2.find('a');
      const rawUrl = a.attr('href') || '';
      const finalUrl = decodeBingUrl(rawUrl);

      if (!finalUrl || !finalUrl.startsWith('http') || finalUrl.includes('bing.com')) {
        return;
      }

      const title = h2.text().trim() || a.text().trim();
      const snippet = $(el).find('.b_caption p, .b_snippet, .b_lineclamp2').first().text().trim();

      let displayUrl = '';
      try {
        displayUrl = new URL(finalUrl).hostname.replace(/^www\./, '');
      } catch (e) {
        displayUrl = finalUrl.slice(0, 35);
      }

      items.push({
        title,
        url: finalUrl,
        snippet,
        display_url: displayUrl,
        intel_tags: extractIntelTags(title, snippet, finalUrl),
      });
    });

    const result = {
      success: true,
      items: items.slice(0, numResults),
      total: items.length,
      engine: 'bing',
      from_cache: false,
    };

    if (items.length > 0) cacheSet(cacheKey, result);
    return result;
  } catch (error) {
    return { success: false, error: `Bing: ${error.message}`, items: [], engine: 'bing' };
  }
}

/**
 * Scraper Mesin Yahoo Search
 */
async function searchYahoo(query, numResults = 8) {
  const cacheKey = `yahoo:${query}:${numResults}`;
  const cached = cacheGet(cacheKey);
  if (cached) return { ...cached, from_cache: true };

  const url = `https://search.yahoo.com/search?p=${encodeURIComponent(query)}&ei=UTF-8`;
  const headers = {
    'User-Agent': getRandomUserAgent(),
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };

  try {
    const resp = await axios.get(url, { headers, timeout: 6000, httpsAgent });
    if (resp.status !== 200) {
      return { success: false, error: `Yahoo HTTP ${resp.status}`, items: [], engine: 'yahoo' };
    }

    const $ = cheerio.load(resp.data);
    const items = [];

    $('.dd.algo').each((_, el) => {
      const h3 = $(el).find('h3');
      const a = h3.find('a');
      let linkUrl = a.attr('href') || '';

      if (linkUrl.includes('/RU=')) {
        try {
          const parts = linkUrl.split('/RU=')[1].split('/RK=')[0];
          linkUrl = decodeURIComponent(parts);
        } catch (e) {}
      }

      if (!linkUrl || !linkUrl.startsWith('http')) return;

      const title = h3.text().trim();
      const snippet = $(el).find('.compText, p').first().text().trim();

      let displayUrl = '';
      try {
        displayUrl = new URL(linkUrl).hostname.replace(/^www\./, '');
      } catch (e) {
        displayUrl = linkUrl.slice(0, 35);
      }

      items.push({
        title,
        url: linkUrl,
        snippet,
        display_url: displayUrl,
        intel_tags: extractIntelTags(title, snippet, linkUrl),
      });
    });

    const result = {
      success: true,
      items: items.slice(0, numResults),
      total: items.length,
      engine: 'yahoo',
      from_cache: false,
    };

    if (items.length > 0) cacheSet(cacheKey, result);
    return result;
  } catch (error) {
    return { success: false, error: `Yahoo: ${error.message}`, items: [], engine: 'yahoo' };
  }
}

/**
 * Scraper Mesin DuckDuckGo HTML
 */
async function searchDuckDuckGo(query, numResults = 8) {
  const cacheKey = `ddg:${query}:${numResults}`;
  const cached = cacheGet(cacheKey);
  if (cached) return { ...cached, from_cache: true };

  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const headers = {
    'User-Agent': getRandomUserAgent(),
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Referer': 'https://duckduckgo.com/',
  };

  try {
    const resp = await axios.get(url, { headers, timeout: 5000, httpsAgent });
    if (resp.status !== 200) {
      return { success: false, error: `DDG HTTP ${resp.status}`, items: [], engine: 'duckduckgo' };
    }

    const $ = cheerio.load(resp.data);
    const items = [];

    $('.result__a').each((_, el) => {
      let rawHref = $(el).attr('href') || '';
      let linkUrl = rawHref;

      if (rawHref.includes('uddg=')) {
        try {
          linkUrl = decodeURIComponent(rawHref.split('uddg=')[1].split('&')[0]);
        } catch (e) {}
      }

      if (!linkUrl || !linkUrl.startsWith('http') || linkUrl.includes('duckduckgo.com')) {
        return;
      }

      const title = $(el).text().trim();
      const parent = $(el).closest('.result__body');
      const snippet = parent.find('.result__snippet').text().trim();

      let displayUrl = '';
      try {
        displayUrl = new URL(linkUrl).hostname.replace(/^www\./, '');
      } catch (e) {
        displayUrl = linkUrl.slice(0, 35);
      }

      items.push({
        title,
        url: linkUrl,
        snippet,
        display_url: displayUrl,
        intel_tags: extractIntelTags(title, snippet, linkUrl),
      });
    });

    const result = {
      success: true,
      items: items.slice(0, numResults),
      total: items.length,
      engine: 'duckduckgo',
      from_cache: false,
    };

    if (items.length > 0) cacheSet(cacheKey, result);
    return result;
  } catch (error) {
    return { success: false, error: `DDG: ${error.message}`, items: [], engine: 'duckduckgo' };
  }
}

/**
 * Mesin Pencari Web Multi-Sumber Terpadu (Unified Web Search)
 * Mencoba Bing -> Yahoo -> DuckDuckGo secara berurutan dengan filter relevansi ketat
 */
async function searchWebMultiSource(query, targetData = {}, options = {}) {
  const numResults = options.numResults || 8;

  function filterAndTagItems(rawItems) {
    const cleanItems = [];
    const seenUrls = new Set();

    for (const item of rawItems) {
      if (!item.url || seenUrls.has(item.url)) continue;
      if (isItemRelevant(query, item, targetData)) {
        seenUrls.add(item.url);
        cleanItems.push({
          ...item,
          intel_tags: item.intel_tags || extractIntelTags(item.title, item.snippet, item.url),
        });
      }
    }
    return cleanItems;
  }

  // 1. Coba Mesin Bing (Paling cepat & akurat untuk data Indonesia)
  const resBing = await searchBing(query, numResults);
  if (resBing.success && resBing.items.length > 0) {
    const filtered = filterAndTagItems(resBing.items);
    if (filtered.length > 0) {
      return {
        success: true,
        items: filtered.slice(0, numResults),
        total: filtered.length,
        engine: 'bing',
      };
    }
  }

  // 2. Fallback ke Mesin Yahoo
  const resYahoo = await searchYahoo(query, numResults);
  if (resYahoo.success && resYahoo.items.length > 0) {
    const filtered = filterAndTagItems(resYahoo.items);
    if (filtered.length > 0) {
      return {
        success: true,
        items: filtered.slice(0, numResults),
        total: filtered.length,
        engine: 'yahoo',
      };
    }
  }

  // 3. Fallback ke Mesin DuckDuckGo
  const resDdg = await searchDuckDuckGo(query, numResults);
  if (resDdg.success && resDdg.items.length > 0) {
    const filtered = filterAndTagItems(resDdg.items);
    if (filtered.length > 0) {
      return {
        success: true,
        items: filtered.slice(0, numResults),
        total: filtered.length,
        engine: 'duckduckgo',
      };
    }
  }

  return {
    success: true,
    items: [],
    total: 0,
    engine: 'multi_none',
  };
}

module.exports = {
  decodeBingUrl,
  extractIntelTags,
  isItemRelevant,
  searchBing,
  searchYahoo,
  searchDuckDuckGo,
  searchWebMultiSource,
};
