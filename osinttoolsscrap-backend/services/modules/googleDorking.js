/**
 * Cyber Guardian Intelligence - Google Dorking Engine
 * 
 * Ported & Enhanced from sample/modules/google_dorking.py
 * Menggunakan Google Search JSON API / SerpAPI untuk mendeteksi data terindeks publik:
 * - Kueri berbasis Nama Lengkap
 * - Kueri berbasis NIK KTP 16-Digit (Dukcapil, DPT, Dokumen PDF/XLS, Dumps)
 * - Kueri berbasis Nomor HP (MSISDN)
 * - Kueri berbasis Email
 * - Kueri Kerabat / Pasangan / Keluarga (Deteksi Doxing DC Pinjol)
 * - Kueri per Platform Media Sosial (Profil, Mention, dan Komentar Terbuka)
 */

const axios = require('axios');
const { buildNikDorkQueries } = require('./nikForensic');
const { extractIntelTags } = require('./realScraper');

// Mapping platform media sosial ke domain, ikon, dan risk rating (sesuai sample/modules/google_dorking.py)
const PLATFORM_META = {
  instagram: {
    domain: 'instagram.com',
    label: 'Instagram',
    icon: '📸',
    url_pattern: 'https://instagram.com/{username}',
    risk: 'medium',
  },
  tiktok: {
    domain: 'tiktok.com',
    label: 'TikTok',
    icon: '🎵',
    url_pattern: 'https://tiktok.com/@{username}',
    risk: 'medium',
  },
  facebook: {
    domain: 'facebook.com',
    label: 'Facebook',
    icon: '👤',
    url_pattern: 'https://facebook.com/{username}',
    risk: 'high', // Facebook memuat lebih banyak info pribadi & keluarga
  },
  twitter: {
    domain: 'twitter.com OR site:x.com',
    label: 'Twitter / X',
    icon: '🐦',
    url_pattern: 'https://x.com/{username}',
    risk: 'medium',
  },
  linkedin: {
    domain: 'linkedin.com',
    label: 'LinkedIn',
    icon: '💼',
    url_pattern: 'https://linkedin.com/in/{username}',
    risk: 'high', // Memuat data profesional & tempat kerja
  },
  youtube: {
    domain: 'youtube.com',
    label: 'YouTube',
    icon: '▶️',
    url_pattern: 'https://youtube.com/@{username}',
    risk: 'low',
  },
  reddit: {
    domain: 'reddit.com',
    label: 'Reddit',
    icon: '🟠',
    url_pattern: 'https://reddit.com/u/{username}',
    risk: 'medium',
  },
  github: {
    domain: 'github.com',
    label: 'GitHub',
    icon: '🐙',
    url_pattern: 'https://github.com/{username}',
    risk: 'low',
  },
  threads: {
    domain: 'threads.net',
    label: 'Threads',
    icon: '🧵',
    url_pattern: 'https://threads.net/@{username}',
    risk: 'medium',
  },
};

/**
 * Bangun daftar kueri Google Dork berdasarkan parameter subjek target.
 * Mendukung NIK KTP 16-Digit secara penuh untuk audit jejak digital.
 * 
 * @param {object} params
 * @returns {Array<object>} Daftar query dork terstruktur
 */
function buildDorkQueries({
  fullName = '',
  nik = '',
  phone = '',
  email = '',
  spouseFamilyName = '',
  additionalKeywords = '',
  usernameInstagram = '',
  usernameTiktok = '',
  usernameFacebook = '',
  usernameTwitter = '',
  usernameLinkedin = '',
  usernameYoutube = '',
  usernameReddit = '',
  usernameGithub = '',
  socialMedia = {},
} = {}) {
  const queries = [];

  // Normalisasi Nama
  let cleanName = String(fullName || '').trim();
  cleanName = cleanName.replace(/\s+(hp|no\s*hp|telp|telepon|handphone|wa|whatsapp)$/i, '').trim();
  const nameQuery = cleanName ? `"${cleanName}"` : '';

  // ── 1. Kueri Berbasis NIK KTP 16-Digit ────────────────────────
  const cleanNik = String(nik || '').replace(/[^\d]/g, '');
  if (cleanNik.length >= 10) {
    const nikQueries = buildNikDorkQueries(cleanNik, cleanName, phone);
    queries.push(...nikQueries);
  }

  // ── 2. Kueri Berbasis Nama Lengkap ─────────────────────────────
  if (cleanName) {
    queries.push(
      {
        label: 'Google Search Organik (Indeks Terbuka)',
        query: cleanName,
        risk: 'medium',
        category: 'web_organic',
        description: 'Hasil pencarian organik teratas Google Search persis seperti di peramban (profil, CV, portofolio & jejak digital)',
      },
      {
        label: 'Jejak Nama Lengkap Terverifikasi',
        query: nameQuery,
        risk: 'medium',
        category: 'general',
        description: 'Mencari semua referensi nama di internet secara persis dengan tanda kutip',
      },
      {
        label: 'Profil Profesional, CV & Portofolio',
        query: `${nameQuery} (site:linkedin.com OR site:cake.me OR site:jobstreet.co.id OR site:jobstreet.com OR site:buildwithangga.com OR site:codepolitan.com OR site:github.com OR site:glints.com OR site:kalibrr.com OR site:fastwork.id)`,
        risk: 'medium',
        category: 'career',
        description: 'Menelusuri profil kerja, resume, keahlian, dan portofolio profesional di platform industri',
      },
      {
        label: 'Pendidikan, Kampus & Sertifikasi',
        query: `${nameQuery} (site:kemdikbud.go.id OR site:pddikti.kemdikbud.go.id OR site:ac.id OR universitas OR institut OR sertifikat OR alumni)`,
        risk: 'low',
        category: 'education',
        description: 'Jejak pendidikan tinggi, pangkalan data dikti, dan sertifikasi keahlian',
      },
      {
        label: 'Jejak Lintas Media Sosial Terbuka',
        query: `${nameQuery} (site:instagram.com OR site:facebook.com OR site:tiktok.com OR site:twitter.com OR site:x.com OR site:threads.net OR site:youtube.com)`,
        risk: 'medium',
        category: 'social',
        description: 'Akun dan aktivitas lintas jejaring media sosial publik',
      },
      {
        label: 'Dokumen Publik (PDF/DOC)',
        query: `${nameQuery} (filetype:pdf OR filetype:doc OR filetype:docx OR filetype:xlsx)`,
        risk: 'high',
        category: 'documents',
        description: 'Dokumen seperti ijazah, SK, kontrak yang mungkin bocor publik',
      },
      {
        label: 'Data KTP / NIK / Ijazah',
        query: `${nameQuery} (KTP OR NIK OR "nomor identitas" OR ijazah OR SKCK)`,
        risk: 'critical',
        category: 'identity',
        description: 'Dokumen kependudukan dan identitas yang mungkin terindeks publik',
      },
      {
        label: 'Informasi Alamat Tempat Tinggal',
        query: `${nameQuery} (alamat OR "RT" OR "RW" OR kelurahan OR kecamatan OR domisili OR "kode pos")`,
        risk: 'critical',
        category: 'address',
        description: 'Data lokasi domisili tempat tinggal yang tersebar',
      },
      {
        label: 'Thread Doxing DC & Utang (Active Target)',
        query: `${nameQuery} (hutang OR utang OR pinjol OR penipu OR penipuan OR "debt collector" OR tagihan OR doxing OR dicari)`,
        risk: 'critical',
        category: 'doxing',
        description: 'Pencarian aktif untuk kasus utang pinjol, penipuan, atau pencemaran nama baik',
      },
      {
        label: 'Tuduhan Maling & Penggelapan Pinjol',
        query: `${nameQuery} (maling OR "penggelapan dana" OR "penggelapan data" OR "bawa kabur uang" OR "bawa lari" OR "debt collector" OR "teror pinjol")`,
        risk: 'critical',
        category: 'doxing_accusation',
        description: 'Deteksi framing jahat tuduhan maling, penggelapan dana pinjol, atau buron',
      },
      {
        label: 'Komentar Doxing di Medsos',
        query: `${nameQuery} (site:instagram.com OR site:facebook.com OR site:tiktok.com) (hutang OR utang OR pinjol OR penipu OR penipuan OR bayar)`,
        risk: 'critical',
        category: 'doxing',
        description: 'Deteksi komentar teror penagihan pinjol di akun media sosial publik',
      }
    );
  }

  // ── 3. Kueri Kerabat / Pasangan / Keluarga (Kontak Darurat / Penjamin) ─
  const famName = String(spouseFamilyName || '').trim();
  if (famName) {
    const famQuery = `"${famName}"`;
    if (cleanName) {
      queries.push(
        {
          label: 'Keluarga/Pasangan + Nama Target',
          query: `${nameQuery} ${famQuery}`,
          risk: 'critical',
          category: 'family',
          description: `Kombinasi nama target dan kerabat (${famName}) di internet`,
        },
        {
          label: 'Doxing Pasangan / Kerabat (Kontak Darurat)',
          query: `${famQuery} ("${cleanName}" OR "kontak darurat" OR kondar OR pinjol OR "debt collector" OR maling OR "penggelapan" OR "penjamin")`,
          risk: 'critical',
          category: 'family',
          description: `Jejak doxing atau teror debt collector terhadap kerabat ${famName}`,
        },
        {
          label: 'Teror Pinjol & DC ke Kerabat',
          query: `${famQuery} (pinjol OR "debt collector" OR teror OR maling OR "sebar data" OR tagihan)`,
          risk: 'critical',
          category: 'family',
          description: `Pemeriksaan jejak teror langsung ke keluarga/kerabat ${famName}`,
        }
      );
    } else {
      queries.push({
        label: 'Doxing Kerabat / Keluarga',
        query: `${famQuery} (pinjol OR utang OR doxing OR teror OR "debt collector" OR maling)`,
        risk: 'critical',
        category: 'family',
        description: `Pemeriksaan jejak kerabat ${famName}`,
      });
    }
  }

  // ── 4. Kueri Kata Kunci Tambahan (Tempat Kerja / Kampus) ────────
  const keywords = String(additionalKeywords || '').trim();
  if (keywords) {
    const kwQuery = keywords.includes(' ') ? `"${keywords}"` : keywords;
    if (cleanName) {
      queries.push({
        label: 'Kata Kunci Tambahan + Nama',
        query: `${nameQuery} ${kwQuery}`,
        risk: 'high',
        category: 'keywords',
        description: `Target dikaitkan dengan atribut ${keywords}`,
      });
    }
  }

  // ── 5. Kueri Berbasis Nomor Handphone ─────────────────────────
  const cleanPhone = String(phone || '').replace(/[^\d]/g, '');
  if (cleanPhone) {
    const localPhone = cleanPhone.startsWith('62') ? '0' + cleanPhone.slice(2) : cleanPhone;
    const intlPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    const phoneCondition = `("${localPhone}" OR "${intlPhone}" OR "+${intlPhone}")`;

    queries.push(
      {
        label: 'Kebocoran Nomor HP di Internet',
        query: phoneCondition,
        risk: 'critical',
        category: 'phone',
        description: 'Nomor HP yang terindeks di halaman web publik',
      },
      {
        label: 'HP di Pastebin / Dump / Telegram',
        query: `${phoneCondition} (site:pastebin.com OR site:rentry.co OR site:t.me OR site:justpaste.it)`,
        risk: 'critical',
        category: 'dump',
        description: 'Nomor HP tersebar di paste/dump/Telegram penagih',
      },
      {
        label: 'Teror DC & Sebar Data Nomor HP',
        query: `${phoneCondition} (pinjol OR "debt collector" OR "penggelapan" OR maling OR teror OR "kontak darurat" OR kondar OR "sebar data" OR tagihan)`,
        risk: 'critical',
        category: 'phone',
        description: 'Nomor HP target disebarkan dalam thread penagihan atau ancaman',
      }
    );

    if (cleanName) {
      queries.push({
        label: 'Nama + Nomor HP (Kombinasi)',
        query: `${nameQuery} ${phoneCondition}`,
        risk: 'critical',
        category: 'combined',
        description: 'Kombinasi nama dan nomor yang muncul bersamaan (indikasi kuat doxing)',
      });
    }
  }

  // ── 6. Kueri Berbasis Email ───────────────────────────────────
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (cleanEmail && cleanEmail.includes('@')) {
    queries.push(
      {
        label: 'Penelusuran Email di Web Terbuka',
        query: `"${cleanEmail}"`,
        risk: 'high',
        category: 'email',
        description: 'Alamat email yang terindeks publik di situs, artikel, dan forum web',
      },
      {
        label: 'Email di Profil Portofolio & Medsos',
        query: `"${cleanEmail}" (site:linkedin.com OR site:cake.me OR site:github.com OR site:facebook.com OR site:instagram.com OR site:twitter.com OR site:x.com)`,
        risk: 'high',
        category: 'career',
        description: 'Email dikaitkan dengan profil profesional, resume kerja, atau media sosial',
      },
      {
        label: 'Email di Database Kebocoran & HIBP',
        query: `"${cleanEmail}" (site:haveibeenpwned.com OR "haveibeenpwned" OR tokpe OR tokopedia OR reddoorz OR wattpad OR canva OR bukalapak OR leak OR breach)`,
        risk: 'critical',
        category: 'email',
        description: 'Pemeriksaan indeks web untuk keterlibatan email dalam kebocoran kredensial HIBP',
      },
      {
        label: 'Email di Paste / Dump Sites',
        query: `"${cleanEmail}" (site:pastebin.com OR site:rentry.co OR site:ghostbin.com)`,
        risk: 'critical',
        category: 'dump',
        description: 'Email muncul di data dump atau bocoran kredensial publik',
      },
      {
        label: 'Email Terkait Penagihan & Pinjol',
        query: `"${cleanEmail}" (pinjol OR utang OR maling OR penggelapan OR "debt collector" OR tagihan)`,
        risk: 'critical',
        category: 'email',
        description: 'Email subjek digunakan dalam platform penagihan atau persengketaan',
      }
    );
  }

  // ── 7. Kueri per Platform Media Sosial ─────────────────────────
  const socialInputs = [
    ['instagram', usernameInstagram || socialMedia.instagram],
    ['tiktok', usernameTiktok || socialMedia.tiktok],
    ['facebook', usernameFacebook || socialMedia.facebook],
    ['twitter', usernameTwitter || socialMedia.twitter || socialMedia.xcom],
    ['linkedin', usernameLinkedin || socialMedia.linkedin],
    ['youtube', usernameYoutube || socialMedia.youtube],
    ['reddit', usernameReddit || socialMedia.reddit],
    ['github', usernameGithub || socialMedia.github],
    ['threads', socialMedia.threads],
  ];

  for (const [platformKey, unameRaw] of socialInputs) {
    if (!unameRaw || !String(unameRaw).trim()) continue;

    // Bersihkan username dari URL dan simbol @
    let uname = String(unameRaw).trim().replace(/^@/, '');
    if (uname.includes('/')) {
      uname = uname.split('/').filter(Boolean).pop().split('?')[0];
    }
    if (!uname) continue;

    const meta = PLATFORM_META[platformKey] || {};
    const domain = (meta.domain || `${platformKey}.com`).split(' OR')[0].replace('site:', '').trim();
    const labelIcon = meta.icon || '🔗';
    const labelName = meta.label || platformKey;
    const risk = meta.risk || 'medium';

    // Kueri 1: Profil langsung di platform
    queries.push({
      label: `${labelIcon} Profil ${labelName}`,
      query: `"${uname}" site:${domain}`,
      risk,
      category: 'social',
      description: `Mencari profil @${uname} langsung di platform ${labelName}`,
      platform: platformKey,
      direct_url: (meta.url_pattern || '').replace('{username}', uname),
    });

    // Kueri 2: username + nama asli
    if (cleanName && ['facebook', 'linkedin', 'instagram', 'threads'].includes(platformKey)) {
      queries.push({
        label: `${labelIcon} Nama + Username ${labelName}`,
        query: `${nameQuery} "${uname}" site:${domain}`,
        risk,
        category: 'social',
        description: `Kombinasi nama asli dan username @${uname} di ${labelName}`,
        platform: platformKey,
        direct_url: '',
      });
    }

    // Kueri 3: Ditandai Postingan / Mention Akun Anon (Teror Pinjol & DC)
    queries.push({
      label: `${labelIcon} Ditandai Akun Anon (Teror & Maling Pinjol)`,
      query: `("@${uname}" OR "${uname}") (site:instagram.com OR site:facebook.com OR site:tiktok.com OR site:twitter.com OR site:x.com OR site:threads.net) (maling OR "penggelapan dana" OR "penggelapan data" OR "bawa kabur" OR pinjol OR "debt collector" OR teror OR penipu OR buron OR "bayar utang")`,
      risk: 'critical',
      category: 'social_anon_tag',
      description: `Deteksi postingan/komentar dari akun anonim yang menandai @${uname} dengan tuduhan maling, penggelapan pinjol, atau teror DC`,
      platform: platformKey,
      direct_url: '',
    });

    // Kueri 4: Postingan Spesifik Instagram Reel / Post / Facebook
    if (['instagram', 'facebook', 'tiktok'].includes(platformKey)) {
      queries.push({
        label: `${labelIcon} Postingan Doxing & Tag @${uname}`,
        query: `("@${uname}") (site:instagram.com/p/ OR site:instagram.com/reel/ OR site:facebook.com OR site:tiktok.com) (pinjol OR "debt collector" OR maling OR penggelapan OR buron OR tagihan)`,
        risk: 'critical',
        category: 'social_post_tag',
        description: `Pemeriksaan tautan postingan spesifik yang meletakkan username @${uname} dalam konten doxing`,
        platform: platformKey,
        direct_url: '',
      });
    }

    // Kueri 5: Aktivitas Komentar Target (Klarifikasi & Sengketa)
    queries.push({
      label: `${labelIcon} Aktivitas Komentar Target @${uname}`,
      query: `("@${uname}" OR "${cleanName || uname}") (site:instagram.com OR site:facebook.com OR site:twitter.com OR site:x.com) ("saya tidak pernah" OR "bukan saya" OR "klarifikasi" OR "lapor polisi" OR "pinjol ilegal" OR "pencemaran nama baik" OR "tidak kenal" OR "stop teror")`,
      risk: 'high',
      category: 'target_comment',
      description: `Menelusuri apakah target @${uname} pernah memberikan komentar tanggapan, klarifikasi, atau bantahan di media sosial`,
      platform: platformKey,
      direct_url: '',
    });
  }

  return queries;
}

// ── In-Memory Cache untuk SerpAPI (60 Menit) ──────────────────
const _serpCache = new Map();
const SERP_CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * Jalankan pencarian Google melalui SerpAPI (Google Search Engine JSON)
 * Dioptimalkan untuk geolokasi Indonesia (google.co.id, hl: id, gl: id)
 * Mendukung ekstraksi sitelinks, twitter results, dan penandaan intelijen.
 * 
 * @param {string} query - Query dork
 * @param {string} apiKey - Kunci API SerpAPI
 * @param {number} numResults - Batas hasil (default: 10)
 * @returns {Promise<object>}
 */
async function searchSerpApi(query, apiKey, numResults = 20, options = {}) {
  if (!apiKey) {
    return { success: false, error: 'SerpAPI Key belum dikonfigurasi', items: [] };
  }

  const cacheKey = `serp:${query}:${numResults}:${options.start || 0}`;
  const cached = _serpCache.get(cacheKey);
  if (cached && Date.now() < cached.expires) {
    return { ...cached.data, from_cache: true };
  }

  const url = 'https://serpapi.com/search.json';
  const params = {
    engine: 'google',
    q: query,
    api_key: apiKey,
    google_domain: 'google.co.id',
    hl: 'id',
    gl: 'id',
    device: 'desktop',
    num: Math.min(Math.max(numResults, 20), 30),
  };
  if (options.start) params.start = options.start;

  try {
    const response = await axios.get(url, { params, timeout: 20000 });
    if (response.status === 200) {
      const data = response.data;
      const rawOrganic = data.organic_results || [];
      const items = [];
      const seenLinks = new Set();

      // 1. Ekstraksi AI Overview / Answer Box jika ada
      if (data.answer_box) {
        const ab = data.answer_box;
        const abTitle = ab.title || 'Google AI Overview / Answer Box';
        const abSnippet = ab.snippet || ab.answer || (Array.isArray(ab.list) ? ab.list.join(' • ') : '');
        const abUrl = ab.link || 'https://www.google.com';
        if (abSnippet) {
          items.push({
            title: abTitle,
            url: abUrl,
            snippet: abSnippet,
            date: '',
            display_url: 'google.com (Ringkasan AI)',
            source_engine: 'SerpAPI AI Overview',
            intel_tags: ['AI Overview & Knowledge Graph', 'Indeks Publik'],
          });
        }
      }

      // 2. Ekstraksi Knowledge Graph jika ada
      if (data.knowledge_graph) {
        const kg = data.knowledge_graph;
        const kgTitle = kg.title || 'Knowledge Graph Google';
        const kgDesc = kg.description || (kg.type ? `${kg.type} terindeks resmi` : '');
        const kgUrl = kg.website || kg.source?.link || 'https://www.google.com';
        if (kgDesc) {
          items.push({
            title: kgTitle,
            url: kgUrl,
            snippet: kgDesc,
            date: '',
            display_url: 'google.com (Knowledge Graph)',
            source_engine: 'SerpAPI Knowledge Graph',
            intel_tags: ['AI Overview & Knowledge Graph'],
          });
        }
      }

      // 3. Proses Hasil Organik Google (Termasuk Ekstraksi Sitelinks & Sub-halaman)
      for (const item of rawOrganic) {
        const link = item.link || '';
        if (!link || seenLinks.has(link)) continue;
        seenLinks.add(link);

        const title = item.title || '';
        const snippet = item.snippet || (item.rich_snippet?.top?.detected_extensions ? JSON.stringify(item.rich_snippet.top.detected_extensions) : '');
        const date = item.date || '';

        items.push({
          title,
          url: link,
          snippet,
          date,
          display_url: item.displayed_link || link.replace(/^https?:\/\//, '').split('/')[0],
          source_engine: 'SerpAPI Google Search',
          intel_tags: extractIntelTags(title, snippet, link),
        });

        // Ekstraksi Sitelinks (sub-profil, portfolio projects, resume links)
        if (item.sitelinks?.inline && Array.isArray(item.sitelinks.inline)) {
          for (const sl of item.sitelinks.inline) {
            if (sl.link && !seenLinks.has(sl.link)) {
              seenLinks.add(sl.link);
              items.push({
                title: `${title} - ${sl.title || 'Sub-halaman'}`,
                url: sl.link,
                snippet: `Sitelink terindeks pada domain ${item.displayed_link || link}: ${sl.title || ''}`,
                date: '',
                display_url: item.displayed_link || link.replace(/^https?:\/\//, '').split('/')[0],
                source_engine: 'SerpAPI Sitelink',
                intel_tags: extractIntelTags(sl.title || '', '', sl.link),
              });
            }
          }
        }
      }

      // 4. Proses Inline Tweets / Twitter Results jika ada
      const twitterResults = data.twitter_results?.tweets || data.inline_tweets || [];
      for (const tw of twitterResults) {
        const link = tw.link || '';
        if (link && !seenLinks.has(link)) {
          seenLinks.add(link);
          items.push({
            title: `Tweet oleh ${tw.author || 'Akun Twitter'}: ${tw.snippet || ''}`.slice(0, 90),
            url: link,
            snippet: tw.snippet || tw.text || '',
            date: tw.date || '',
            display_url: 'twitter.com / x.com',
            source_engine: 'SerpAPI Twitter Results',
            intel_tags: ['Media Sosial', 'Twitter / X'],
          });
        }
      }

      // 5. People Also Ask, Video & Local results (sumber PII tambahan)
      for (const q of data.related_questions || []) {
        const link = q.link || '';
        if (link && !seenLinks.has(link) && q.snippet) {
          seenLinks.add(link);
          items.push({
            title: q.title || q.question || 'People Also Ask',
            url: link,
            snippet: q.snippet,
            date: q.date || '',
            display_url: q.displayed_link || link.replace(/^https?:\/\//, '').split('/')[0],
            source_engine: 'SerpAPI People Also Ask',
            intel_tags: extractIntelTags(q.title || '', q.snippet, link),
          });
        }
      }
      for (const v of data.video_results || []) {
        const link = v.link || '';
        if (link && !seenLinks.has(link)) {
          seenLinks.add(link);
          items.push({
            title: v.title || 'Video',
            url: link,
            snippet: v.snippet || v.description || '',
            date: v.date || '',
            display_url: v.displayed_link || 'video',
            source_engine: 'SerpAPI Video',
            intel_tags: extractIntelTags(v.title || '', v.snippet || '', link),
          });
        }
      }
      const localPlaces = Array.isArray(data.local_results?.places)
        ? data.local_results.places
        : (Array.isArray(data.local_results) ? data.local_results : []);
      for (const l of localPlaces) {
        if (!l || typeof l !== 'object' || !l.title) continue;
        const link = l.website || l.links?.website || '';
        const snippet = [l.address, l.phone, l.type].filter(Boolean).join(' • ');
        if (link && !seenLinks.has(link)) {
          seenLinks.add(link);
          items.push({
            title: l.title,
            url: link,
            snippet,
            date: '',
            display_url: link.replace(/^https?:\/\//, '').split('/')[0],
            source_engine: 'SerpAPI Local',
            intel_tags: extractIntelTags(l.title, snippet, link),
          });
        }
      }

      const result = {
        success: true,
        items: items.slice(0, numResults),
        total_results: String(data.search_information?.total_results || items.length),
        engine: 'serpapi',
        query_executed: query,
      };

      _serpCache.set(cacheKey, { data: result, expires: Date.now() + SERP_CACHE_TTL_MS });
      return result;
    }

    return {
      success: false,
      error: `SerpAPI HTTP ${response.status}: ${JSON.stringify(response.data).slice(0, 150)}`,
      items: [],
      engine: 'serpapi',
    };
  } catch (error) {
    return {
      success: false,
      error: `Error SerpAPI: ${error.message}`,
      items: [],
      engine: 'serpapi',
    };
  }
}

/**
 * Jalankan pencarian Google melalui Google Custom Search JSON API
 * @param {string} query - Query dork
 * @param {string} apiKey - Google API Key
 * @param {string} cx - Google Custom Search Engine ID (cx)
 * @param {number} numResults - Batas hasil
 * @returns {Promise<object>}
 */
async function searchGoogleCustomApi(query, apiKey, cx, numResults = 10) {
  if (!apiKey || !cx) {
    return { success: false, error: 'Google Custom Search API Key / CX belum lengkap', items: [] };
  }

  const url = 'https://www.googleapis.com/customsearch/v1';
  const params = {
    key: apiKey,
    cx,
    q: query,
    num: Math.min(numResults, 10),
  };

  try {
    const response = await axios.get(url, { params, timeout: 10000 });
    if (response.status === 200) {
      const data = response.data;
      const rawItems = data.items || [];
      const items = rawItems.map(item => ({
        title: item.title || '',
        url: item.link || '',
        snippet: item.snippet || '',
        display_url: item.displayLink || '',
      }));

      return {
        success: true,
        items,
        total_results: data.searchInformation?.totalResults || String(items.length),
        engine: 'google_custom_search',
      };
    }

    return {
      success: false,
      error: `Google CSE HTTP ${response.status}`,
      items: [],
      engine: 'google_custom_search',
    };
  } catch (error) {
    return {
      success: false,
      error: `Error Google CSE: ${error.message}`,
      items: [],
      engine: 'google_custom_search',
    };
  }
}

module.exports = {
  PLATFORM_META,
  buildDorkQueries,
  searchSerpApi,
  searchGoogleCustomApi,
};
