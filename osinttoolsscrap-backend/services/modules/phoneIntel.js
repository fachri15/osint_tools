/**
 * Cyber Guardian Intelligence - Phone Intelligence Module
 * 
 * Ported & Enhanced from sample/modules/phone_intel.py
 * Intelijen nomor HP dari sumber web publik:
 * - Normalisasi format nomor Indonesia (local, international, E.164, formatted)
 * - Identifikasi provider operator telekomunikasi & wilayah HLR (Telkomsel, Indosat, XL, Tri, Smartfren)
 * - Truecaller & web OSINT name extraction
 * - Google / Web mention counter & kategorisasi (Paste sites, Medsos, Marketplace)
 * - CekRekening.id & Kredibel fraud / scam report detection
 */

const axios = require('axios');
const { searchWebMultiSource } = require('./realScraper');

// Mapping Awalan Nomor HP Operator Telekomunikasi Indonesia (HLR)
const OPERATOR_PREFIXES = {
  '0811': { operator: 'Telkomsel (Halo)', type: 'Postpaid' },
  '0812': { operator: 'Telkomsel (SimPATI)', type: 'Prepaid' },
  '0813': { operator: 'Telkomsel (SimPATI)', type: 'Prepaid' },
  '0821': { operator: 'Telkomsel (SimPATI)', type: 'Prepaid' },
  '0822': { operator: 'Telkomsel (Loop)', type: 'Prepaid' },
  '0823': { operator: 'Telkomsel (Kartu As)', type: 'Prepaid' },
  '0851': { operator: 'Telkomsel (By.U)', type: 'Prepaid' },
  '0852': { operator: 'Telkomsel (Kartu As)', type: 'Prepaid' },
  '0853': { operator: 'Telkomsel (Kartu As)', type: 'Prepaid' },
  '0814': { operator: 'Indosat Ooredoo', type: 'Data/Broadband' },
  '0815': { operator: 'Indosat Ooredoo (Matrix/Mentari)', type: 'Postpaid/Prepaid' },
  '0816': { operator: 'Indosat Ooredoo (Matrix)', type: 'Postpaid' },
  '0855': { operator: 'Indosat Ooredoo (Matrix)', type: 'Postpaid' },
  '0856': { operator: 'Indosat Ooredoo (IM3)', type: 'Prepaid' },
  '0857': { operator: 'Indosat Ooredoo (IM3)', type: 'Prepaid' },
  '0858': { operator: 'Indosat Ooredoo (Mentari)', type: 'Prepaid' },
  '0817': { operator: 'XL Axiata', type: 'Prepaid' },
  '0818': { operator: 'XL Axiata', type: 'Prepaid' },
  '0819': { operator: 'XL Axiata', type: 'Prepaid' },
  '0859': { operator: 'XL Axiata', type: 'Prepaid' },
  '0877': { operator: 'XL Axiata', type: 'Prepaid' },
  '0878': { operator: 'XL Axiata', type: 'Prepaid' },
  '0831': { operator: 'AXIS (XL Axiata)', type: 'Prepaid' },
  '0832': { operator: 'AXIS (XL Axiata)', type: 'Prepaid' },
  '0833': { operator: 'AXIS (XL Axiata)', type: 'Prepaid' },
  '0838': { operator: 'AXIS (XL Axiata)', type: 'Prepaid' },
  '0895': { operator: 'Tri (3 / IOH)', type: 'Prepaid' },
  '0896': { operator: 'Tri (3 / IOH)', type: 'Prepaid' },
  '0897': { operator: 'Tri (3 / IOH)', type: 'Prepaid' },
  '0898': { operator: 'Tri (3 / IOH)', type: 'Prepaid' },
  '0899': { operator: 'Tri (3 / IOH)', type: 'Prepaid' },
  '0881': { operator: 'Smartfren', type: 'Prepaid' },
  '0882': { operator: 'Smartfren', type: 'Prepaid' },
  '0883': { operator: 'Smartfren', type: 'Prepaid' },
  '0884': { operator: 'Smartfren', type: 'Prepaid' },
  '0885': { operator: 'Smartfren', type: 'Prepaid' },
  '0886': { operator: 'Smartfren', type: 'Prepaid' },
  '0887': { operator: 'Smartfren', type: 'Prepaid' },
  '0888': { operator: 'Smartfren', type: 'Prepaid' },
  '0889': { operator: 'Smartfren', type: 'Prepaid' },
};

/**
 * Normalisasi nomor HP Indonesia ke berbagai format pencarian
 */
function normalizePhone(phone = '') {
  if (!phone) return null;

  const digits = String(phone).replace(/[^\d]/g, '');
  if (digits.length < 7) return null;

  let local = digits;
  let e164 = '+' + digits;
  let intl = digits;

  if (digits.startsWith('62')) {
    local = '0' + digits.slice(2);
    e164 = '+' + digits;
    intl = digits;
  } else if (digits.startsWith('0')) {
    local = digits;
    e164 = '+62' + digits.slice(1);
    intl = '62' + digits.slice(1);
  } else if (digits.startsWith('8')) {
    local = '0' + digits;
    e164 = '+62' + digits;
    intl = '62' + digits;
  }

  const prefix4 = local.slice(0, 4);
  const operatorInfo = OPERATOR_PREFIXES[prefix4] || { operator: 'Telekomunikasi Seluler Indonesia', type: 'GSM' };

  const formatted = local.length >= 10
    ? `${local.slice(0, 4)}-${local.slice(4, 8)}-${local.slice(8)}`
    : local;

  const formattedSpaced = local.length >= 10
    ? `${local.slice(0, 4)} ${local.slice(4, 8)} ${local.slice(8)}`
    : local;

  return {
    original: phone,
    local,
    e164,
    intl,
    formatted,
    formattedSpaced,
    operator: operatorInfo.operator,
    planType: operatorInfo.type,
    search_variants: Array.from(new Set([local, e164, intl, formatted, formattedSpaced])),
  };
}

/**
 * Lookup Truecaller Web & Web OSINT untuk nama pemegang nomor
 */
async function lookupTruecallerWeb(phone = '') {
  const norm = normalizePhone(phone);
  if (!norm) {
    return { success: false, error: 'Format nomor tidak valid' };
  }

  const result = {
    success: true,
    source: 'truecaller_web',
    phone: norm.e164,
    name: '',
    is_spam: false,
    spam_score: 0,
    spam_type: '',
    operator: norm.operator,
    url: `https://www.truecaller.com/search/id/${norm.local}`,
    exposure_score: 0,
    details: [],
  };

  try {
    const q = `site:truecaller.com "${norm.local}" OR "${norm.e164}"`;
    const searchRes = await searchWebMultiSource(q, { phone: norm.local }, { numResults: 5 });

    if (searchRes.items && searchRes.items.length > 0) {
      for (const item of searchRes.items) {
        const title = item.title || '';
        const snippet = item.snippet || '';

        if (title.toLowerCase().includes('truecaller')) {
          let cleanTitle = title.replace(/\b(truecaller|search|lookup|number|phone|indonesia|id)\b/gi, '').replace(/[-|:]/g, '').trim();
          if (cleanTitle.length >= 3 && !['google', 'wikipedia', 'download', 'facebook'].some(w => cleanTitle.toLowerCase().includes(w))) {
            result.name = cleanTitle.slice(0, 35);
            result.details.push(`Nama terdeteksi di Truecaller: "${result.name}"`);
            break;
          }
        }
      }
    }
  } catch (e) {
    // Abaikan jika error jaringan
  }

  return result;
}

/**
 * Hitung jumlah mention nomor HP di web dan kategorisasikan sumbernya
 */
async function countPhoneWebMentions(phone = '') {
  const norm = normalizePhone(phone);
  if (!norm) return { total_mentions: 0, exposure_score: 0, categories: {} };

  const result = {
    phone: norm.local,
    total_mentions: 0,
    urls_found: [],
    categories: {
      marketplace: 0,
      social_media: 0,
      paste_sites: 0,
      forums: 0,
      news: 0,
      other: 0,
    },
    exposure_score: 0,
    details: [],
  };

  try {
    const q = `"${norm.local}" OR "${norm.e164}"`;
    const searchRes = await searchWebMultiSource(q, { phone: norm.local }, { numResults: 10 });
    const items = searchRes.items || [];

    result.total_mentions = items.length;
    result.urls_found = items.map(it => it.url);

    const domainCategories = {
      marketplace: ['tokopedia', 'shopee', 'olx', 'bukalapak', 'tokobagus', 'blibli'],
      social_media: ['facebook', 'instagram', 'tiktok', 'twitter', 'x.com', 'wa.me', 't.me'],
      paste_sites: ['pastebin', 'rentry', 'ghostbin', 'hastebin', 'justpaste'],
      forums: ['kaskus', 'reddit', 'forum', 'detikforum'],
      news: ['detik', 'kompas', 'tribun', 'liputan6', 'cnnindonesia'],
    };

    for (const item of items) {
      const urlLower = (item.url || '').toLowerCase();
      let categorized = false;

      for (const [cat, keywords] of Object.entries(domainCategories)) {
        if (keywords.some(kw => urlLower.includes(kw))) {
          result.categories[cat]++;
          categorized = true;
          break;
        }
      }

      if (!categorized) {
        result.categories.other++;
      }
    }

    let score = Math.min(result.total_mentions * 8, 50);
    score += result.categories.paste_sites * 20;
    score += result.categories.social_media * 10;
    score += result.categories.marketplace * 5;
    result.exposure_score = Math.min(score, 100);

    if (result.total_mentions > 0) {
      result.details.push(`Nomor HP terdeteksi pada ${result.total_mentions} halaman publik web.`);
    }
    if (result.categories.paste_sites > 0) {
      result.details.push(`🚨 KRITIS: Nomor HP muncul di ${result.categories.paste_sites} situs pastebin / data dump terbuka!`);
    }
  } catch (e) {
    result.error = e.message;
  }

  return result;
}

/**
 * Cek laporan penipuan/fraud nomor HP di Kredibel.co, CekRekening.id, dan web
 */
async function checkFraudReports(phone = '') {
  const norm = normalizePhone(phone);
  if (!norm) return { has_report: false, report_count: 0 };

  const result = {
    nomor: phone,
    clean: norm.local,
    has_report: false,
    report_count: 0,
    exposure_score: 0,
    details: [],
    url_kredibel: `https://www.kredibel.co/search/phone/${norm.local}`,
    url_cekrekening: `https://cekrekening.id/search/rekening/${norm.local}`,
  };

  try {
    const q = `"${norm.local}" (penipuan OR penipu OR fraud OR "laporan penipuan" OR cekrekening OR kredibel OR "debt collector")`;
    const searchRes = await searchWebMultiSource(q, { phone: norm.local }, { numResults: 5 });

    if (searchRes.items && searchRes.items.length > 0) {
      for (const item of searchRes.items) {
        const snippet = (item.snippet || '').toLowerCase();
        if (['penipuan', 'penipu', 'dilaporkan', 'laporan', 'scammer', 'fraud', 'utang', 'pinjol'].some(k => snippet.includes(k))) {
          result.has_report = true;
          result.report_count++;
          result.details.push(`🚨 Indikasi laporan penipuan/debt collector terdeteksi di ${item.display_url || 'web'}`);
        }
      }
    }
  } catch (e) {}

  if (result.has_report) {
    result.exposure_score = Math.min(40 + result.report_count * 15, 95);
  } else {
    result.details.push('🟢 Belum ada laporan penipuan atau pemerasan publik terdaftar.');
  }

  return result;
}

/**
 * Jalankan rangkaian evaluasi intelijen nomor HP secara menyeluruh
 */
async function runPhoneIntelligence(phone = '', targetName = '') {
  if (!phone) {
    return { success: false, error: 'Nomor HP tidak diinputkan' };
  }

  const norm = normalizePhone(phone);
  if (!norm) {
    return { success: false, error: 'Format nomor HP tidak valid' };
  }

  const [truecallerRes, webMentionsRes, fraudReportsRes] = await Promise.all([
    lookupTruecallerWeb(phone).catch(() => ({})),
    countPhoneWebMentions(phone).catch(() => ({})),
    checkFraudReports(phone).catch(() => ({})),
  ]);

  let totalPhoneScore = Math.max(
    webMentionsRes.exposure_score || 0,
    fraudReportsRes.exposure_score || 0
  );

  if (fraudReportsRes.has_report) {
    totalPhoneScore = Math.max(totalPhoneScore, 65);
  }
  if ((webMentionsRes.categories?.paste_sites || 0) > 0) {
    totalPhoneScore = Math.max(totalPhoneScore, 80);
  }

  const riskIndicators = [];
  if (fraudReportsRes.has_report) {
    riskIndicators.push(`🚨 Terdeteksi ${fraudReportsRes.report_count} indikasi laporan fraud/DC pada nomor ini.`);
  }
  if ((webMentionsRes.categories?.paste_sites || 0) > 0) {
    riskIndicators.push(`🚨 Nomor HP terekspos di ${webMentionsRes.categories.paste_sites} pastebin / leak site.`);
  }
  if (webMentionsRes.total_mentions > 0) {
    riskIndicators.push(`Nomor terindeks di ${webMentionsRes.total_mentions} halaman publik internet.`);
  }

  return {
    success: true,
    phone_normalized: norm,
    truecaller: truecallerRes,
    google_mentions: webMentionsRes,
    fraud_reports: fraudReportsRes,
    total_phone_score: Math.min(totalPhoneScore, 100),
    risk_indicators: riskIndicators,
  };
}

module.exports = {
  OPERATOR_PREFIXES,
  normalizePhone,
  lookupTruecallerWeb,
  countPhoneWebMentions,
  checkFraudReports,
  runPhoneIntelligence,
};
