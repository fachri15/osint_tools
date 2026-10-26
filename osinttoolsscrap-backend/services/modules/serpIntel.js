/**
 * Cyber Guardian Intelligence - SERP Intelligence Layer
 *
 * Melengkapi googleDorking.searchSerpApi dengan:
 *  1. Multi-engine SerpAPI (Google halaman 1-2, Bing, DuckDuckGo, Yahoo) + deduplikasi
 *  2. Korelasi tiap hasil dengan SELURUH field form (nama, NIK, HP, email, keluarga,
 *     keyword, username media sosial) -> matched_fields & confidence
 *  3. Ekstraksi entitas PII (email, HP, NIK, username) dari title/snippet
 *  4. Scraping isi halaman hasil teratas untuk menemukan entitas & korelasi yang tidak muncul di snippet
 *  5. Agregasi seluruh temuan menjadi ringkasan serpIntel
 */

const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');
const { searchSerpApi } = require('./googleDorking');
const { extractIntelTags, decodeBingUrl } = require('./realScraper');

const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const _engineCache = new Map();
const ENGINE_CACHE_TTL_MS = 60 * 60 * 1000;

const SOCIAL_DOMAINS = [
  'instagram.com', 'facebook.com', 'tiktok.com', 'twitter.com', 'x.com',
  'threads.net', 'linkedin.com', 'youtube.com', 'youtu.be',
];
const SCRAPE_SKIP_EXT = /\.(pdf|docx?|xlsx?|pptx?|zip|rar|jpg|jpeg|png|gif|webp|mp4|mp3)(\?|$)/i;

/* ─────────────────────────  Entity extraction  ───────────────────────── */

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}/gi;
const PHONE_RE = /(?<![\d])(?:\+62|62|0)[\s.-]?8[1-9](?:[\s.-]?\d){6,10}(?![\d])/g;
const NIK_RE = /(?<![\d])[1-9]\d{15}(?![\d])/g;
const HANDLE_RE = /(?<![\w@])@([a-z0-9_.]{3,30})\b/gi;

function normalizePhone(raw) {
  let d = String(raw).replace(/[^\d]/g, '');
  if (d.startsWith('62')) d = '0' + d.slice(2);
  return d;
}

function isPlausibleNik(v) {
  const prov = parseInt(v.slice(0, 2), 10);
  const day = parseInt(v.slice(6, 8), 10);
  const month = parseInt(v.slice(8, 10), 10);
  return prov >= 11 && prov <= 94 && month >= 1 && month <= 12 && ((day >= 1 && day <= 31) || (day >= 41 && day <= 71));
}

function extractEntities(text = '') {
  const t = String(text || '');
  const emails = [...new Set((t.match(EMAIL_RE) || []).map(e => e.toLowerCase()))]
    .filter(e => !/\.(png|jpg|jpeg|gif|webp|svg)$/.test(e));
  const phones = [...new Set((t.match(PHONE_RE) || []).map(normalizePhone))].filter(p => p.length >= 10 && p.length <= 13);
  const niks = [...new Set((t.match(NIK_RE) || []).filter(isPlausibleNik))];
  const handles = [...new Set([...t.matchAll(HANDLE_RE)].map(m => m[1].toLowerCase()))]
    .filter(h => !/\.(com|id|net|org)$/.test(h));
  return { emails, phones, niks, handles };
}

function usernameFromUrl(url = '') {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    if (!SOCIAL_DOMAINS.some(d => host.endsWith(d))) return null;
    const seg = u.pathname.split('/').filter(Boolean);
    if (seg.length === 0) return null;
    if (host.endsWith('linkedin.com')) return seg[0] === 'in' && seg[1] ? { platform: 'linkedin', username: seg[1] } : null;
    const first = seg[0].replace(/^@/, '');
    if (['p', 'reel', 'watch', 'share', 'groups', 'hashtag', 'explore', 'search', 'status'].includes(first)) return null;
    return { platform: host.split('.')[0], username: first.toLowerCase() };
  } catch (e) {
    return null;
  }
}

/* ─────────────────────────  Target correlation  ───────────────────────── */

function cleanUsername(raw = '') {
  let u = String(raw || '').trim().replace(/^@/, '');
  if (u.includes('/')) u = u.split('/').filter(Boolean).pop().split('?')[0];
  return u.toLowerCase();
}

/**
 * Cocokkan teks dengan seluruh field target. Return daftar field yang cocok.
 */
function matchTargetFields(text = '', target = {}) {
  const lower = String(text || '').toLowerCase();
  const digits = lower.replace(/[^\d]/g, '');
  const matched = [];

  const name = String(target.fullName || '').toLowerCase().trim();
  if (name) {
    const tokens = name.split(/\s+/).filter(t => t.length >= 3);
    if (lower.includes(name)) matched.push('name_full');
    else if (tokens.length >= 2 && tokens.filter(t => lower.includes(t)).length >= Math.min(2, tokens.length)) matched.push('name_partial');
  }

  const nik = String(target.nik || '').replace(/[^\d]/g, '');
  if (nik.length === 16 && digits.includes(nik)) matched.push('nik');
  else if (nik.length === 16 && digits.includes(nik.slice(0, 6)) && digits.includes(nik.slice(-4))) matched.push('nik_partial');

  const phone = normalizePhone(target.phone || '');
  if (phone.length >= 9) {
    if (digits.includes(phone) || digits.includes('62' + phone.slice(1)) || digits.includes(phone.slice(1))) matched.push('phone');
  }

  const email = String(target.email || '').toLowerCase().trim();
  if (email.includes('@')) {
    if (lower.includes(email)) matched.push('email');
    else if (email.split('@')[0].length >= 5 && lower.includes(email.split('@')[0])) matched.push('email_partial');
  }

  const fam = String(target.spouseFamily || '').toLowerCase().trim();
  if (fam && fam.length >= 3 && lower.includes(fam)) matched.push('family');

  const kws = String(target.keywords || '').toLowerCase().split(/[,;\n]+/).map(k => k.trim()).filter(k => k.length >= 3);
  if (kws.some(k => lower.includes(k))) matched.push('keyword');

  const social = target.socialMedia || {};
  for (const [platform, raw] of Object.entries(social)) {
    const u = cleanUsername(raw);
    if (u.length >= 3 && lower.includes(u)) {
      matched.push(`social:${platform}`);
    }
  }

  return matched;
}

const FIELD_WEIGHTS = {
  nik: 40, nik_partial: 15, phone: 30, email: 30, email_partial: 10,
  name_full: 15, name_partial: 5, family: 12, keyword: 6,
};

function confidenceFromFields(fields = []) {
  let score = 0;
  for (const f of fields) {
    if (f.startsWith('social:')) score += 20;
    else score += FIELD_WEIGHTS[f] || 0;
  }
  return Math.min(score, 100);
}

/**
 * Tempelkan matched_fields, entities, confidence ke item hasil pencarian.
 */
function annotateItem(item, target) {
  const text = `${item.title || ''} ${item.snippet || ''} ${item.url || ''} ${item.display_url || ''}`;
  const matched_fields = matchTargetFields(text, target);
  const entities = extractEntities(`${item.title || ''} ${item.snippet || ''}`);
  const profile = usernameFromUrl(item.url);
  item.matched_fields = matched_fields;
  item.entities = entities;
  if (profile) item.social_profile = profile;
  item.confidence = confidenceFromFields(matched_fields);
  return item;
}

/* ─────────────────────────  Multi-engine SerpAPI  ───────────────────────── */

const ENGINE_CONFIG = {
  bing: (q, key, num) => ({ engine: 'bing', q, api_key: key, cc: 'ID', mkt: 'id-ID', count: Math.min(num, 50) }),
  duckduckgo: (q, key) => ({ engine: 'duckduckgo', q, api_key: key, kl: 'id-id' }),
  yahoo: (q, key) => ({ engine: 'yahoo', p: q, api_key: key, vl: 'lang_id' }),
};

async function searchSerpOtherEngine(engine, query, apiKey, numResults = 20) {
  const cfg = ENGINE_CONFIG[engine];
  if (!cfg) return { success: false, items: [], engine };
  const cacheKey = `${engine}:${query}:${numResults}`;
  const hit = _engineCache.get(cacheKey);
  if (hit && Date.now() < hit.expires) return hit.data;

  try {
    const res = await axios.get('https://serpapi.com/search.json', { params: cfg(query, apiKey, numResults), timeout: 20000 });
    const data = res.data || {};
    const items = [];
    for (const r of data.organic_results || []) {
      const link = decodeBingUrl(r.link || r.url || '');
      if (!link) continue;
      const title = r.title || '';
      const snippet = r.snippet || r.description || '';
      items.push({
        title,
        url: link,
        snippet,
        date: r.date || '',
        display_url: r.displayed_link || r.displayed_url || link.replace(/^https?:\/\//, '').split('/')[0],
        source_engine: `SerpAPI ${engine}`,
        intel_tags: extractIntelTags(title, snippet, link),
      });
    }
    const out = { success: true, items: items.slice(0, numResults), engine };
    _engineCache.set(cacheKey, { data: out, expires: Date.now() + ENGINE_CACHE_TTL_MS });
    return out;
  } catch (e) {
    return { success: false, items: [], engine, error: e.message };
  }
}

/**
 * Jalankan satu kueri ke beberapa engine SerpAPI + halaman 2 Google, merge & dedupe.
 */
async function searchSerpMulti(query, apiKey, { engines = ['google', 'bing', 'duckduckgo'], numResults = 20, deepPages = false } = {}) {
  const tasks = [];
  if (engines.includes('google')) {
    tasks.push(searchSerpApi(query, apiKey, numResults));
    if (deepPages) tasks.push(searchSerpApi(query, apiKey, numResults, { start: 20 }));
  }
  for (const eng of engines) {
    if (eng !== 'google') tasks.push(searchSerpOtherEngine(eng, query, apiKey, numResults));
  }

  const settled = await Promise.all(tasks.map(t => t.catch(e => ({ success: false, items: [], error: e.message }))));
  const seen = new Set();
  const items = [];
  const enginesUsed = new Set();
  const errors = [];

  for (const r of settled) {
    if (!r.success) { if (r.error) errors.push(r.error); continue; }
    enginesUsed.add(r.engine || 'serpapi');
    for (const it of r.items || []) {
      const key = String(it.url || '').replace(/^https?:\/\/(www\.)?/, '').replace(/[#?].*$/, '').replace(/\/$/, '').toLowerCase();
      if (!key) continue;
      if (seen.has(key)) {
        const existing = items.find(x => x._key === key);
        if (existing && it.source_engine && !existing.source_engines.includes(it.source_engine)) {
          existing.source_engines.push(it.source_engine);
        }
        continue;
      }
      seen.add(key);
      items.push({ ...it, _key: key, source_engines: [it.source_engine || 'SerpAPI'] });
    }
  }

  items.forEach(i => { delete i._key; });
  return {
    success: items.length > 0,
    items,
    engine: [...enginesUsed].join('+') || 'serpapi',
    errors,
  };
}

/* ─────────────────────────  Page scraping  ───────────────────────── */

function isSafeUrl(url) {
  try {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol)) return false;
    const h = u.hostname;
    if (h === 'localhost' || /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.)/.test(h) || h.endsWith('.local')) return false;
    return true;
  } catch (e) {
    return false;
  }
}

async function scrapePage(item, target, timeoutMs = 7000) {
  try {
    const res = await axios.get(item.url, {
      timeout: timeoutMs,
      httpsAgent,
      maxContentLength: 1.5 * 1024 * 1024,
      maxRedirects: 3,
      responseType: 'text',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
        'Accept-Language': 'id-ID,id;q=0.9,en;q=0.7',
      },
      validateStatus: s => s < 400,
    });
    const ctype = String(res.headers['content-type'] || '');
    if (!/text\/html|text\/plain|xml/.test(ctype)) return { fetched: false, reason: ctype || 'non-html' };

    const $ = cheerio.load(String(res.data));
    $('script, style, noscript, svg, iframe').remove();
    const pageTitle = $('title').first().text().trim();
    const metaDesc = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
    const hrefs = [];
    $('a[href^="mailto:"], a[href^="tel:"], a[href*="wa.me"]').each((_, el) => hrefs.push($(el).attr('href')));
    const body = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 200000);
    const text = `${pageTitle} ${metaDesc} ${body} ${hrefs.join(' ')}`;

    const entities = extractEntities(text);
    const matched_fields = matchTargetFields(text, target);

    // Ambil kutipan sekitar kecocokan pertama (nama / HP / NIK / email)
    let excerpt = metaDesc.slice(0, 220);
    const needle = String(target.fullName || target.email || '').toLowerCase();
    if (needle) {
      const idx = body.toLowerCase().indexOf(needle);
      if (idx >= 0) excerpt = body.slice(Math.max(0, idx - 100), idx + needle.length + 160);
    }

    return {
      fetched: true,
      page_title: pageTitle.slice(0, 160),
      entities: {
        emails: entities.emails.slice(0, 15),
        phones: entities.phones.slice(0, 15),
        niks: entities.niks.slice(0, 10),
        handles: entities.handles.slice(0, 15),
      },
      matched_fields,
      excerpt: excerpt.slice(0, 320),
    };
  } catch (e) {
    return { fetched: false, reason: e.code || e.message };
  }
}

/**
 * Scrape halaman teratas (urut confidence) secara paralel terbatas. Mutasi item in-place.
 */
async function enrichWithPageScrape(items, target, { limit = 12, concurrency = 4, timeoutMs = 7000 } = {}) {
  const candidates = items
    .filter(it => it.url && isSafeUrl(it.url) && !SCRAPE_SKIP_EXT.test(it.url))
    .filter(it => !SOCIAL_DOMAINS.some(d => String(it.url).toLowerCase().includes(d)))
    .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
    .slice(0, limit);

  let scraped = 0;
  for (let i = 0; i < candidates.length; i += concurrency) {
    const chunk = candidates.slice(i, i + concurrency);
    const results = await Promise.all(chunk.map(it => scrapePage(it, target, timeoutMs)));
    results.forEach((r, idx) => {
      const it = chunk[idx];
      it.page_scrape = r;
      if (r.fetched) {
        scraped++;
        const merged = new Set([...(it.matched_fields || []), ...(r.matched_fields || [])]);
        it.matched_fields = [...merged];
        it.confidence = confidenceFromFields(it.matched_fields);
        it.entities = {
          emails: [...new Set([...(it.entities?.emails || []), ...r.entities.emails])],
          phones: [...new Set([...(it.entities?.phones || []), ...r.entities.phones])],
          niks: [...new Set([...(it.entities?.niks || []), ...r.entities.niks])],
          handles: [...new Set([...(it.entities?.handles || []), ...r.entities.handles])],
        };
        if (r.excerpt && (!it.snippet || it.snippet.length < 40)) it.snippet = r.excerpt;
      }
    });
  }
  return { attempted: candidates.length, scraped };
}

/* ─────────────────────────  Aggregation  ───────────────────────── */

function aggregateSerpIntel(items = [], target = {}, meta = {}) {
  const buckets = { emails: new Map(), phones: new Map(), niks: new Map(), handles: new Map() };
  const profiles = new Map();
  const fieldHits = {};

  const targetPhone = normalizePhone(target.phone || '');
  const targetEmail = String(target.email || '').toLowerCase();
  const targetNik = String(target.nik || '');

  for (const it of items) {
    for (const key of Object.keys(buckets)) {
      for (const v of it.entities?.[key] || []) {
        if (!buckets[key].has(v)) buckets[key].set(v, new Set());
        buckets[key].get(v).add(it.url);
      }
    }
    if (it.social_profile) {
      const k = `${it.social_profile.platform}:${it.social_profile.username}`;
      if (!profiles.has(k)) profiles.set(k, { ...it.social_profile, url: it.url, title: it.title });
    }
    for (const f of it.matched_fields || []) fieldHits[f] = (fieldHits[f] || 0) + 1;
  }

  const toList = (map, flag) => [...map.entries()]
    .map(([value, urls]) => ({
      value,
      count: urls.size,
      sources: [...urls].slice(0, 5),
      isTarget: flag ? flag(value) : false,
    }))
    .sort((a, b) => Number(b.isTarget) - Number(a.isTarget) || b.count - a.count)
    .slice(0, 30);

  return {
    engines: meta.engines || [],
    totalItems: items.length,
    highConfidenceItems: items.filter(i => (i.confidence || 0) >= 40).length,
    pagesScraped: meta.scraped || 0,
    pagesAttempted: meta.attempted || 0,
    fieldHits,
    entities: {
      emails: toList(buckets.emails, v => v === targetEmail),
      phones: toList(buckets.phones, v => targetPhone && v === targetPhone),
      niks: toList(buckets.niks, v => targetNik && v === targetNik),
      handles: toList(buckets.handles),
    },
    socialProfiles: [...profiles.values()].slice(0, 30),
  };
}

module.exports = {
  extractEntities,
  matchTargetFields,
  annotateItem,
  searchSerpMulti,
  enrichWithPageScrape,
  aggregateSerpIntel,
};
