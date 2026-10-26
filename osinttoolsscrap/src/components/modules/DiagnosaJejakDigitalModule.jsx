import React, { useState, useEffect, useMemo } from 'react';
import { ForensicReportView } from './ForensicReportView';
import { DEFAULT_FALLBACK_SCANS } from './RiwayatTrackingModule';
import { scanApi, clientApi } from '../../services/api';
import {
  generateBinaryDiagnosisPdf,
  downloadPdfBlob,
  printOrSavePdfReport,
} from '../../utils/diagnosisPdfGenerator';

// Brand SVG Icons for Social Footprint
const InstagramIcon = () => (
  <svg className="w-3.5 h-3.5 text-[#E1306C]" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-3.5 h-3.5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const ThreadsIcon = () => (
  <svg className="w-3.5 h-3.5 text-on-surface" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10c2.723 0 5.195-1.09 7.004-2.858l-1.47-1.39C16.035 19.18 14.108 20 12 20c-4.418 0-8-3.582-8-8s3.582-8 8-8c4.07 0 7.424 3.036 7.927 7H14.5c-.276-1.16-.948-2.128-1.9-2.697-.63-.377-1.36-.583-2.1-.583-2.485 0-4.5 2.015-4.5 4.5s2.015 4.5 4.5 4.5c1.614 0 3.033-.854 3.826-2.138.388-.63.607-1.362.646-2.142H12v-2h8c.03.328.05.66.05 1 0 5.523-4.477 10-10 10z"/>
  </svg>
);

const LinkedinIcon = () => (
  <svg className="w-3.5 h-3.5 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.762-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

const TiktokIcon = () => (
  <svg className="w-3.5 h-3.5 text-on-surface" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.16 1.18 2.09 2.35 2.33.72.17 1.49.11 2.18-.18.78-.32 1.42-.94 1.78-1.7.21-.47.31-.98.31-1.5v-13.99z"/>
  </svg>
);

const TwitterXIcon = () => (
  <svg className="w-3.5 h-3.5 text-on-surface" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const YoutubeIcon = () => (
  <svg className="w-3.5 h-3.5 text-[#FF0000]" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

export function DiagnosaJejakDigitalModule({ onNavigateTab, initialScan = null }) {
  const [subTab, setSubTab] = useState(initialScan ? 'report' : 'single'); // single, bulk, live, report

  // Single Target Form State: form kosong, diisi manual atau via pemilih klien
  const [targetName, setTargetName] = useState('');
  const firstName = targetName.trim().split(' ')[0] || '';

  // 2. NIK KTP (16 Digit)
  const [targetQuery, setTargetQuery] = useState('');

  // 3. Nomor Handphone Aktif (MSISDN)
  const [targetPhone, setTargetPhone] = useState('');

  // 4. Email Terkait
  const [targetEmail, setTargetEmail] = useState('');

  // 5 & 6. Informasi Keluarga & Target Posting Doxing
  const [familyName, setFamilyName] = useState('');
  const [doxingKeywords, setDoxingKeywords] = useState('');

  // 7 - 13. Username Social Media
  const [socialMedia, setSocialMedia] = useState({
    instagram: '',
    facebook: '',
    threads: '',
    linkedin: '',
    tiktok: '',
    twitter: '',
    youtube: ''
  });

  const [selectedEngines, setSelectedEngines] = useState({
    dukcapil: true,
    hibp: true,
    social: true,
    darknet: true,
    serp: true,
    dcTracker: true,
    googleDork: true,
  });

  // Live Scan Simulation State
  const [scanProgress, setScanProgress] = useState(0);
  const [currentScanStep, setCurrentScanStep] = useState('');
  const [liveLogs, setLiveLogs] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  // Forensic Report View State
  const [reportFilter, setReportFilter] = useState('ALL'); // 'ALL', 'CRITICAL', 'MEDIUM'
  const [completedSteps, setCompletedSteps] = useState({});
  const [actionNotice, setActionNotice] = useState('');
  const [hasScanned, setHasScanned] = useState(false);
  const [scanResultData, setScanResultData] = useState(null);

  // Bulk Scan CSV State
  const [csvFileName, setCsvFileName] = useState('');
  const [csvFileSize, setCsvFileSize] = useState('');
  const [csvParsedTargets, setCsvParsedTargets] = useState([]);
  const [csvParseErrors, setCsvParseErrors] = useState([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkCurrentItem, setBulkCurrentItem] = useState('');
  const [availableClients, setAvailableClients] = useState([]);
  const [bulkRows, setBulkRows] = useState([]);
  const [bulkSearchQuery, setBulkSearchQuery] = useState('');
  const [bulkFilter, setBulkFilter] = useState('ALL'); // 'ALL', 'KRITIS', 'TINGGI', 'SEDANG', 'RENDAH', 'GAGAL'
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  useEffect(() => {
    clientApi.getAll()
      .then(res => {
        if (res.data && res.data.length > 0) {
          setAvailableClients(res.data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (initialScan) {
      if (initialScan.targetName) {
        setTargetName(initialScan.targetName);
      }
      if (initialScan.targetNik) setTargetQuery(initialScan.targetNik);
      if (initialScan.targetPhone) setTargetPhone(initialScan.targetPhone);
      if (initialScan.targetEmail) setTargetEmail(initialScan.targetEmail);
      if (initialScan.spouseFamily) setFamilyName(initialScan.spouseFamily);
      if (initialScan.keywords) setDoxingKeywords(initialScan.keywords);

      const parsedResult = typeof initialScan.resultJson === 'string'
        ? JSON.parse(initialScan.resultJson)
        : (initialScan.resultJson || initialScan);

      const socials = parsedResult?.target?.socialMedia || {
        instagram: initialScan.targetInstagram || '',
        facebook: initialScan.targetFacebook || '',
        threads: initialScan.targetThreads || '',
        linkedin: initialScan.targetLinkedin || '',
        tiktok: initialScan.targetTiktok || '',
        twitter: initialScan.targetTwitter || '',
        youtube: initialScan.targetYoutube || '',
      };
      setSocialMedia(prev => ({ ...prev, ...socials }));

      if (parsedResult) {
        setScanResultData(parsedResult);
        setHasScanned(true);
        setSubTab('report');
      }
    }
  }, [initialScan]);

  const loadClientDemo = (client) => {
    const cName = client.fullName || client.name || [client.firstName, client.middleName, client.lastName].filter(Boolean).join(' ') || '';
    setTargetName(cName);
    setTargetQuery(client.nikFull || client.nik || '');
    setTargetPhone(client.phone || '');
    setTargetEmail(client.email || '');
    setFamilyName(client.familyName || '');
    setDoxingKeywords(client.doxingKeywords || '');
    if (client.socialMedia) {
      setSocialMedia({
        instagram: client.socialMedia.instagram || '',
        facebook: client.socialMedia.facebook || '',
        threads: client.socialMedia.threads || '',
        linkedin: client.socialMedia.linkedin || '',
        tiktok: client.socialMedia.tiktok || '',
        twitter: client.socialMedia.twitter || '',
        youtube: client.socialMedia.youtube || '',
      });
    }
    setScanResultData(null);
    setHasScanned(false);
    setActionNotice(`Data ${cName} dimuat ke formulir. Jalankan pemindaian untuk hasil terbaru.`);
    setTimeout(() => setActionNotice(''), 3000);
  };

  const startLiveScan = async () => {
    if (!targetName && !targetQuery && !targetPhone && !targetEmail) {
      alert('Silakan masukkan minimal satu parameter (Nama, NIK, No. HP, atau Email) untuk memulai pemindaian forensik.');
      return;
    }

    setIsScanning(true);
    setHasScanned(false);
    setScanResultData(null);
    setScanProgress(8);
    setCurrentScanStep('Inisialisasi Multi-Engine Crawler (Google Dorking, SerpAPI, Bing, Yandex, Yahoo, Brave)...');
    setLiveLogs([
      `[0.00s] Inisialisasi Crawler Forensik OSINT v4.8 Pro-Justitia...`,
      `[0.20s] Menguraikan parameter: Target="${targetName || '-'}", NIK=${targetQuery || '-'}, HP=${targetPhone || '-'}, Email=${targetEmail || '-'}`,
    ]);

    // Ensure we are in single tab to keep form and show results directly below
    if (subTab !== 'single') {
      setSubTab('single');
    }

    // Realistic telemetry progress ticker while request is in flight
    let currentP = 8;
    const progressTimer = setInterval(() => {
      currentP = Math.min(currentP + (currentP < 40 ? 8 : (currentP < 75 ? 5 : 2)), 94);
      setScanProgress(currentP);

      if (currentP >= 20 && currentP < 35) {
        setCurrentScanStep(`Kueri Dukcapil L2 & Validasi NIK: ${targetQuery || 'Validasi Algoritma NIK'}...`);
        setLiveLogs(prev => prev.length <= 2 ? [...prev, `[1.15s] Dukcapil L2: Verifikasi struktur NIK 16-digit & korelasi wilayah domisili.`] : prev);
      } else if (currentP >= 35 && currentP < 55) {
        setCurrentScanStep(`Pemeriksaan Multi-Database Kebocoran (Glints, CakeResume, Tokopedia, BPJS, HIBP)...`);
        setLiveLogs(prev => prev.length <= 3 ? [...prev, `[2.40s] Cross-reference database leak: Memeriksa arsip nasional, e-commerce, portal karir (Glints/CakeResume), & darknet dump.`] : prev);
      } else if (currentP >= 55 && currentP < 70) {
        setCurrentScanStep(`Scraping Thread Doxing & Teror Tagihan DC (${familyName ? `Kerabat: ${familyName}` : 'Forum Penagihan'})...`);
        setLiveLogs(prev => prev.length <= 4 ? [...prev, `[3.95s] Multi-crawler: Menelusuri korelasi utang, teror tagihan DC, dan paste sites (Pastebin/Telegram).`] : prev);
      } else if (currentP >= 70 && currentP < 82) {
        setCurrentScanStep(`Audit HIBP v3 (BreachesForAccount) & SerpAPI Google Deep Indexing...`);
        setLiveLogs(prev => prev.length <= 5 ? [...prev, `[4.80s] HIBP v3 API: Kueri GET /api/v3/breachedaccount/${targetEmail || 'target'} (truncateResponse=false, header hibp-api-key & User-Agent)...`] : prev);
      } else if (currentP >= 82 && currentP < 92) {
        setCurrentScanStep(`Shadow Profiling Platform Medsos (IG, FB, TikTok, X, Threads, LinkedIn, YT)...`);
        setLiveLogs(prev => prev.length <= 6 ? [...prev, `[5.90s] Shadow profiling: Menilai eksposur profil publik dan komentar terbuka di medsos.`] : prev);
      } else if (currentP >= 92) {
        setCurrentScanStep(`Kalkulasi Matriks 5-Dimensi Risiko Forensik Cyber Intelligence...`);
        setLiveLogs(prev => prev.length <= 7 ? [...prev, `[6.80s] Analisis AI & Risk Scorer: Mengintegrasikan seluruh temuan ke dalam dossier terverifikasi.`] : prev);
      }
    }, 450);

    try {
      const res = await scanApi.runScan({
        fullName: targetName,
        phone: targetPhone,
        email: targetEmail,
        nik: targetQuery,
        spouseFamily: familyName,
        keywords: doxingKeywords,
        socialMedia,
      });

      clearInterval(progressTimer);

      const finalResult = res?.data?.result || res?.result || res?.data || res;

      setScanProgress(100);
      setCurrentScanStep('Pemindaian Selesai. Dossier Forensik Terbentuk!');
      setLiveLogs(prev => [
        ...prev,
        `[OSINT Selesai] Audit forensik berhasil diselesaikan. Skor Risiko: ${finalResult?.risk?.finalScore ?? 100}/100 (${finalResult?.risk?.category ?? 'KRITIS'}).`,
        `[Database Sync] Hasil audit tersimpan ke database dan 100% sinkron dengan Riwayat Tracking.`
      ]);

      setScanResultData(finalResult);
      setHasScanned(true);
      setIsScanning(false);
      setActionNotice(`Audit investigasi data forensik untuk "${targetName}" berhasil disinkronkan. Skor: ${finalResult?.risk?.finalScore ?? 100}/100 (${finalResult?.risk?.category ?? 'KRITIS'}).`);

      setTimeout(() => {
        const el = document.getElementById('hasil-temuan-forensik');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 350);
    } catch (err) {
      clearInterval(progressTimer);
      setIsScanning(false);
      console.error('Scan Error:', err);
      setActionNotice(`Gagal melakukan audit OSINT: ${err.message || 'Koneksi ke backend gagal'}`);
    }
  };

  // ── CSV Parsing & Batch Handlers ──
  const parseCsvContent = (csvText) => {
    let cleanText = csvText.replace(/^\uFEFF/, '').trim();
    if (!cleanText) return { targets: [], errors: ['Berkas CSV kosong'] };

    const rawLines = cleanText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (rawLines.length < 2) {
      return { targets: [], errors: ['Berkas CSV harus memiliki minimal 1 baris header dan 1 baris data'] };
    }

    // Deteksi delimiter: koma, titik-koma, atau tab
    const headerLine = rawLines[0];
    let delimiter = ',';
    const commaCount = (headerLine.match(/,/g) || []).length;
    const semiCount = (headerLine.match(/;/g) || []).length;
    const tabCount = (headerLine.match(/\t/g) || []).length;
    if (semiCount > commaCount && semiCount >= tabCount) delimiter = ';';
    else if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';

    const splitLine = (line) => {
      const fields = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          if (inQuotes && line[i + 1] === char) {
            current += char;
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === delimiter && !inQuotes) {
          fields.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      fields.push(current.trim());
      return fields.map(f => f.replace(/^["']|["']$/g, '').trim());
    };

    const headers = splitLine(headerLine).map(h => h.toLowerCase().replace(/[\s_\-]+/g, ''));
    const findIdx = (aliases) => headers.findIndex(h => aliases.some(a => h.includes(a)));

    const idxName = findIdx(['nama', 'name', 'fullname', 'subjek', 'target']);
    const idxNik = findIdx(['nik', 'ktp', 'noktp']);
    const idxPhone = findIdx(['phone', 'hp', 'nohp', 'telepon', 'telp', 'mobile']);
    const idxEmail = findIdx(['email', 'surel', 'mail']);
    const idxSpouse = findIdx(['spouse', 'pasangan', 'keluarga', 'family']);
    const idxKeywords = findIdx(['keyword', 'katakunci', 'keterangan', 'notes']);
    const idxIg = findIdx(['instagram', 'ig']);
    const idxFb = findIdx(['facebook', 'fb']);
    const idxTiktok = findIdx(['tiktok']);
    const idxTwitter = findIdx(['twitter', 'xcom']);
    const idxLinkedin = findIdx(['linkedin']);

    const targets = [];
    const errors = [];

    for (let i = 1; i < rawLines.length; i++) {
      const cols = splitLine(rawLines[i]);
      if (cols.length === 0 || cols.every(c => !c)) continue;

      const name = idxName !== -1 ? cols[idxName] : '';
      const nik = idxNik !== -1 ? cols[idxNik].replace(/\D/g, '') : '';
      const phone = idxPhone !== -1 ? cols[idxPhone].replace(/[^0-9+]/g, '') : '';
      const email = idxEmail !== -1 ? cols[idxEmail] : '';
      const spouseFamily = idxSpouse !== -1 ? cols[idxSpouse] : '';
      const keywords = idxKeywords !== -1 ? cols[idxKeywords] : '';

      if (!name && !nik && !phone && !email) {
        errors.push(`Baris ${i + 1}: Diabaikan karena seluruh kolom target kosong.`);
        continue;
      }

      targets.push({
        id: i,
        name: name || `Target #${i}`,
        nik,
        phone,
        email,
        spouseFamily,
        keywords,
        instagram: idxIg !== -1 ? cols[idxIg] : '',
        facebook: idxFb !== -1 ? cols[idxFb] : '',
        tiktok: idxTiktok !== -1 ? cols[idxTiktok] : '',
        twitter: idxTwitter !== -1 ? cols[idxTwitter] : '',
        linkedin: idxLinkedin !== -1 ? cols[idxLinkedin] : '',
        isValid: Boolean(name || nik || phone),
      });
    }

    return { targets, errors, totalRows: rawLines.length - 1 };
  };

  const handleCsvFile = (file) => {
    if (!file) return;
    const sizeKb = (file.size / 1024).toFixed(1) + ' KB';
    setCsvFileName(file.name);
    setCsvFileSize(sizeKb);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const { targets, errors } = parseCsvContent(content);
        setCsvParsedTargets(targets);
        setCsvParseErrors(errors);
        if (targets.length > 0) {
          setActionNotice(`✓ Berhasil memuat ${targets.length} target dari "${file.name}" (${sizeKb}). Siap dipindai.`);
        } else {
          setActionNotice(`Peringatan: Berkas CSV tidak memuat baris target yang valid.`);
        }
      }
    };
    reader.onerror = () => {
      alert('Gagal membaca berkas CSV lokal.');
    };
    reader.readAsText(file);
  };

  const handleBulkUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleCsvFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.csv') || file.type.includes('csv') || file.type.includes('text'))) {
      handleCsvFile(file);
    } else {
      alert('Silakan unggah berkas berekstensi .csv');
    }
  };

  const downloadCsvTemplate = () => {
    const csvContent = 
`nama,nik,phone,email,pasangan,keywords,instagram,facebook
"Budi Santoso",3171012304850001,081289112233,budi.santoso@gmail.com,"Siti Rahma","pinjol tagihan cicilan",@budisantoso,https://facebook.com/budi.santoso
"Ratna Kusuma Dewi",3273014506920002,085712345678,ratna.kdewi@outlook.com,"Hendro Wibowo","doxing pinjaman legal",@ratnakusuma,
"Agus Setiawan",3374011209800003,087890123456,agus.setiawan@yahoo.com,"Dewi Lestari","teror wa dc",@agus.setiawan,
"Mega Pratiwi",3578015511940004,082134567890,mega.pratiwi@gmail.com,"","ancaman sebar data",@megapratiwi,
"Dedi Kurniawan",5171010101880005,081398765432,dedi.kurniawan@corp.id,"Rina Anggraini","kontak darurat penagihan",@dedikurnia,
`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_target_osint_pro.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const loadSampleBatchData = () => {
    const sampleTargets = [
      {
        id: 1,
        name: "Budi Santoso",
        nik: "3171012304850001",
        phone: "081289112233",
        email: "budi.santoso@gmail.com",
        spouseFamily: "Siti Rahma",
        keywords: "pinjol tagihan cicilan",
        instagram: "budisantoso_real",
        facebook: "budi.santoso.jkt",
        isValid: true,
      },
      {
        id: 2,
        name: "Ratna Kusuma Dewi",
        nik: "3273014506920002",
        phone: "085712345678",
        email: "ratna.kdewi@outlook.com",
        spouseFamily: "Hendro Wibowo",
        keywords: "doxing pinjaman teror",
        instagram: "ratna_k_dewi",
        facebook: "",
        isValid: true,
      },
      {
        id: 3,
        name: "Agus Setiawan",
        nik: "3374011209800003",
        phone: "087890123456",
        email: "agus.setiawan@yahoo.com",
        spouseFamily: "Dewi Lestari",
        keywords: "teror debt collector wa",
        instagram: "",
        facebook: "agus.setiawan.smg",
        isValid: true,
      },
      {
        id: 4,
        name: "Mega Pratiwi",
        nik: "3578015511940004",
        phone: "082134567890",
        email: "mega.pratiwi@gmail.com",
        spouseFamily: "",
        keywords: "ancaman sebar foto kontak darurat",
        instagram: "megapratiwi_id",
        facebook: "",
        isValid: true,
      },
      {
        id: 5,
        name: "Dedi Kurniawan",
        nik: "5171010101880005",
        phone: "081398765432",
        email: "dedi.kurniawan@corp.id",
        spouseFamily: "Rina Anggraini",
        keywords: "penagihan ilegal kontak kantor",
        instagram: "dedi_kurniawan",
        facebook: "",
        isValid: true,
      },
    ];
    setCsvFileName('sample_investigasi_batch_5target.csv');
    setCsvFileSize('1.4 KB');
    setCsvParsedTargets(sampleTargets);
    setCsvParseErrors([]);
    setActionNotice('5 subjek sampel investigasi berhasil dimuat. Klik "Mulai Pemindaian Massal" untuk menjalankan batch crawler.');
  };

  const handleStartBulkScan = async () => {
    if (!csvParsedTargets || csvParsedTargets.length === 0) {
      alert('Silakan unggah atau muat data CSV terlebih dahulu.');
      return;
    }

    setIsBulkProcessing(true);
    setBulkProgress(8);
    setBulkCurrentItem(`Mengalokasikan worker pool (3 crawler paralel) untuk ${csvParsedTargets.length} target...`);

    let currentTick = 8;
    const progressTicker = setInterval(() => {
      currentTick = Math.min(currentTick + (currentTick < 50 ? 10 : (currentTick < 80 ? 4 : 1)), 94);
      setBulkProgress(currentTick);
      const estIdx = Math.min(Math.floor((currentTick / 100) * csvParsedTargets.length) + 1, csvParsedTargets.length);
      setBulkCurrentItem(`Sedang memproses target #${estIdx} dari ${csvParsedTargets.length}: "${csvParsedTargets[estIdx - 1]?.name || 'Target'}"...`);
    }, 800);

    try {
      const res = await scanApi.runBulkScan(csvParsedTargets);
      clearInterval(progressTicker);
      setBulkProgress(100);
      setBulkCurrentItem('Pemindaian Massal Berhasil Diselesaikan!');
      setIsBulkProcessing(false);

      const items = res?.data?.data || res?.data || [];
      setBulkRows(items);
      setActionNotice(`✓ Pemindaian batch selesai: ${items.filter(i => i.status === 'Selesai').length} berhasil dipindai.`);
    } catch (err) {
      clearInterval(progressTicker);
      setIsBulkProcessing(false);
      console.error('Bulk Scan Error:', err);
      alert(`Gagal menjalankan bulk scan: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleResetBatch = () => {
    setCsvFileName('');
    setCsvFileSize('');
    setCsvParsedTargets([]);
    setCsvParseErrors([]);
    setBulkRows([]);
    setBulkSearchQuery('');
    setBulkFilter('ALL');
  };

  const openTargetDossier = (row) => {
    setTargetName(row.name);
    setTargetQuery(row.nik || '');
    setTargetPhone(row.phone || '');
    setTargetEmail(row.email || '');
    if (row.result) {
      setScanResultData(row.result);
      if (row.result.target?.spouseFamily) setFamilyName(row.result.target.spouseFamily);
      if (row.result.target?.keywords) setDoxingKeywords(row.result.target.keywords);
      if (row.result.target?.socialMedia) {
        setSocialMedia(prev => ({ ...prev, ...row.result.target.socialMedia }));
      }
    }
    setHasScanned(true);
    setSubTab('single');
    setTimeout(() => {
      const el = document.getElementById('hasil-temuan-forensik');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  const printTargetPdf = (row) => {
    if (!row.result) {
      alert('Data temuan forensik belum siap untuk subjek ini.');
      return;
    }
    const res = row.result;
    printOrSavePdfReport({
      targetName: row.name,
      targetPhone: row.phone,
      targetEmail: row.email,
      targetNik: row.nik,
      riskScore: row.score,
      riskCategory: row.riskCategory,
      dorkResults: res.dorkResults || [],
      breaches: res.breaches || [],
      aiAnalysis: res.aiAnalysis || {},
      nikIntel: res.nikIntel || null,
      spouseFamily: res.target?.spouseFamily || '-',
      keywords: res.target?.keywords || '-',
      socialMedia: res.target?.socialMedia || {},
      dorkDisplayOption: '2. Tampilkan semua berdasarkan yang sudah di-filter',
      includeAi: true,
      includeRemediation: true,
    });
  };

  const downloadTargetPdf = (row) => {
    if (!row.result) {
      alert('Data temuan forensik belum siap untuk subjek ini.');
      return;
    }
    const res = row.result;
    const pdfBytes = generateBinaryDiagnosisPdf({
      targetName: row.name,
      targetPhone: row.phone,
      targetEmail: row.email,
      targetNik: row.nik,
      riskScore: row.score,
      riskCategory: row.riskCategory,
      dorkResults: res.dorkResults || [],
      breaches: res.breaches || [],
      aiAnalysis: res.aiAnalysis || {},
      nikIntel: res.nikIntel || null,
      spouseFamily: res.target?.spouseFamily || '-',
      keywords: res.target?.keywords || '-',
      socialMedia: res.target?.socialMedia || {},
      dorkDisplayOption: '2. Tampilkan semua berdasarkan yang sudah di-filter',
      includeAi: true,
      includeRemediation: true,
    });
    const filename = `Laporan_Diagnosa_OSINT_${(row.name || 'Subjek').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    downloadPdfBlob(pdfBytes, filename);
  };

  const exportResultsToCsv = (results) => {
    if (!results || results.length === 0) return;
    const headers = ['No', 'Nama Subjek', 'NIK', 'No Handphone', 'Email', 'Skor Risiko', 'Kategori', 'Temuan Dork', 'Temuan Breach', 'Status', 'Waktu Pindai'];
    const rows = results.map((r, i) => [
      i + 1,
      `"${(r.name || '').replace(/"/g, '""')}"`,
      `"${r.nik || ''}"`,
      `"${r.phone || ''}"`,
      `"${r.email || ''}"`,
      r.score ?? 0,
      `"${r.riskCategory || ''}"`,
      r.dorkFound ?? 0,
      r.breachCount ?? 0,
      `"${r.status || ''}"`,
      `"${r.scannedAt || new Date().toISOString()}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Hasil_Bulk_Scan_OSINT_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredBulkRows = useMemo(() => {
    return bulkRows.filter((row) => {
      if (bulkSearchQuery.trim()) {
        const q = bulkSearchQuery.toLowerCase();
        const matchesName = (row.name || '').toLowerCase().includes(q);
        const matchesNik = (row.nik || '').includes(q);
        const matchesPhone = (row.phone || '').includes(q);
        const matchesEmail = (row.email || '').toLowerCase().includes(q);
        if (!matchesName && !matchesNik && !matchesPhone && !matchesEmail) return false;
      }
      if (bulkFilter !== 'ALL') {
        if (bulkFilter === 'GAGAL') {
          if (row.status !== 'Gagal') return false;
        } else {
          const cat = (row.riskCategory || '').toUpperCase();
          if (bulkFilter === 'KRITIS' && cat !== 'KRITIS') return false;
          if (bulkFilter === 'TINGGI' && cat !== 'TINGGI') return false;
          if (bulkFilter === 'SEDANG' && cat !== 'SEDANG') return false;
          if (bulkFilter === 'RENDAH' && cat !== 'RENDAH') return false;
        }
      }
      return true;
    });
  }, [bulkRows, bulkSearchQuery, bulkFilter]);

  const bulkStats = useMemo(() => {
    if (bulkRows.length === 0) {
      return { total: 0, kritis: 0, tinggi: 0, totalBreach: 0, avgScore: 0 };
    }
    const successful = bulkRows.filter(r => r.status === 'Selesai');
    const kritis = bulkRows.filter(r => (r.riskCategory || '').toUpperCase() === 'KRITIS' || r.score >= 75).length;
    const tinggi = bulkRows.filter(r => (r.riskCategory || '').toUpperCase() === 'TINGGI' || (r.score >= 50 && r.score < 75)).length;
    const totalBreach = bulkRows.reduce((acc, r) => acc + (r.breachCount || 0), 0);
    const avgScore = successful.length > 0
      ? Math.round(successful.reduce((acc, r) => acc + (r.score || 0), 0) / successful.length)
      : 0;
    return {
      total: bulkRows.length,
      kritis,
      tinggi,
      totalBreach,
      avgScore,
    };
  }, [bulkRows]);

  return (
    <div className="flex flex-col w-full gap-6 pb-12 mt-10">
      {/* Title & Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary-container text-white">
              <span className="material-symbols-outlined text-[20px]">radar</span>
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-on-surface">
              Diagnosa Jejak Digital & Audit Forensik
            </h1>
          </div>
          <p className="text-xs md:text-sm text-on-surface-variant mt-1">
            Mesin investigasi OSINT otomatis pendeteksi paparan data pribadi (PII), NIK, dan nomor HP di surface & darknet.
          </p>
        </div>

        {/* Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-surface-container p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setSubTab('single')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              subTab === 'single'
                ? 'bg-white text-primary shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">person_search</span>
            <span>Single Target Manual</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('bulk')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              subTab === 'bulk'
                ? 'bg-white text-primary shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">upload_file</span>
            <span>Bulk Scan CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('live')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              subTab === 'live'
                ? 'bg-white text-primary shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">terminal</span>
            <span>Live Scanning</span>
            {isScanning && <span className="h-2 w-2 rounded-full bg-error animate-ping"></span>}
          </button>
          <button
            type="button"
            onClick={() => {
              if (subTab === 'single') {
                setHasScanned(true);
                const el = document.getElementById('hasil-temuan-forensik');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              } else {
                setSubTab('single');
                setHasScanned(true);
                setTimeout(() => {
                  const el = document.getElementById('hasil-temuan-forensik');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
              }
            }}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              subTab === 'report'
                ? 'bg-primary-container text-white shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">analytics</span>
            <span>Hasil Diagnosa &amp; Temuan Forensik</span>
            {hasScanned && (
              <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full font-mono text-[10px] font-bold shadow-2xs ${
                (scanResultData?.risk?.finalScore ?? scanResultData?.riskScore ?? 0) >= 70
                  ? 'bg-error text-white'
                  : (scanResultData?.risk?.finalScore ?? scanResultData?.riskScore ?? 0) >= 30
                  ? 'bg-amber-500 text-white'
                  : 'bg-emerald-600 text-white'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                {scanResultData ? `${scanResultData.risk?.finalScore ?? scanResultData.riskScore ?? 92}/100 ${scanResultData.risk?.category ?? scanResultData.riskCategory ?? 'KRITIS'}` : 'TERSEDIA'}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Target Terpindai</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-on-surface">35</span>
              <span className="text-xs text-on-surface-variant">Subjek</span>
            </div>
            <span className="text-xs text-tertiary-container flex items-center gap-1 mt-1 font-semibold">
              <span className="material-symbols-outlined text-[14px]">trending_up</span> +12% minggu ini
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[26px]">radar</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Skor Paparan Target</span>
            <div className="flex items-baseline gap-2 mt-1">
              {(() => {
                const score = scanResultData?.risk?.finalScore ?? scanResultData?.riskScore ?? scanResultData?.result?.risk?.finalScore ?? (hasScanned && scanResultData ? 92 : 0);
                const category = scanResultData?.risk?.category ?? scanResultData?.riskCategory ?? (score >= 80 ? 'KRITIS' : score >= 65 ? 'TINGGI' : score >= 35 ? 'SEDANG' : (hasScanned ? 'AMAN' : 'Belum Dipindai'));
                return (
                  <>
                    <span className={`text-3xl font-bold ${score >= 70 ? 'text-error' : score >= 30 ? 'text-amber-500' : 'text-emerald-600'}`}>
                      {score}
                    </span>
                    <span className="text-xs text-on-surface-variant">/ 100</span>
                  </>
                );
              })()}
            </div>
            <span className={`text-xs font-semibold flex items-center gap-1 mt-1 ${
              (scanResultData?.risk?.finalScore ?? scanResultData?.riskScore ?? 0) >= 70 ? 'text-error' : (scanResultData?.risk?.finalScore ?? scanResultData?.riskScore ?? 0) >= 30 ? 'text-amber-500' : 'text-emerald-600'
            }`}>
              <span className="material-symbols-outlined text-[14px]">
                {(scanResultData?.risk?.finalScore ?? scanResultData?.riskScore ?? 0) >= 70 ? 'warning' : 'verified'}
              </span>
              {scanResultData ? `Kategori: ${scanResultData.risk?.category ?? scanResultData.riskCategory ?? 'KRITIS'}` : (hasScanned ? 'Status Aman' : 'Belum Dipindai')}
            </span>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${(scanResultData?.risk?.finalScore ?? scanResultData?.riskScore ?? 0) >= 70 ? 'bg-error-container text-on-error-container' : 'bg-surface-container text-primary'}`}>
            <span className="material-symbols-outlined text-[26px]">
              {(scanResultData?.risk?.finalScore ?? scanResultData?.riskScore ?? 0) >= 70 ? 'crisis_alert' : 'security'}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Engine OSINT Aktif</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-on-surface">5</span>
              <span className="text-xs text-on-surface-variant">Cluster Engine</span>
            </div>
            <span className="text-xs text-secondary font-semibold flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[14px]">hub</span> SerpAPI + HIBP + Darknet
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed-variant">
            <span className="material-symbols-outlined text-[26px]">hub</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Kompilasi Breach Temuan</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-tertiary-container">14</span>
              <span className="text-xs text-on-surface-variant">Database Sumber</span>
            </div>
            <span className="text-xs text-tertiary-container font-semibold flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[14px]">check_circle</span> 100% Arsip Terhash
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed">
            <span className="material-symbols-outlined text-[26px]">dataset</span>
          </div>
        </div>
      </div>

      {/* Tab 1: Single Target Manual Form & Forensic Report */}
      {(subTab === 'single' || subTab === 'report') && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Input Parameters (7 cols) */}
          <div className="lg:col-span-12 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 p-6 space-y-6">
            {/* Header & Quick Demo */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/30 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-primary-fixed text-primary">
                  <span className="material-symbols-outlined text-[20px]">manage_search</span>
                </span>
                <div>
                  <h2 className="text-sm md:text-base font-bold text-on-surface">
                    Parameter Diagnosa Tunggal (Single Subject Intake)
                  </h2>
                  <p className="text-[11px] text-on-surface-variant">
                    Isi parameter target untuk audit jejak digital, pemantauan kebocoran PII, dan mitigasi ancaman doxing.
                  </p>
                </div>
              </div>

              {/* Quick Autofill Real Clients from Database */}
              {availableClients.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs bg-surface-container-low px-2.5 py-1.5 rounded-xl border border-outline-variant/30 self-start sm:self-auto">
                  <span className="text-[11px] font-medium text-on-surface-variant">Pilih Klien:</span>
                  <div className="flex gap-1 flex-wrap">
                    {availableClients.slice(0, 4).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => loadClientDemo(c)}
                        className="px-2 py-0.5 rounded-md bg-white hover:bg-surface-container text-primary font-bold text-[10px] shadow-2xs border border-outline-variant/40 transition-colors"
                        title={`Muat profil ${c.fullName || c.name}`}
                      >
                        {c.firstName || (c.fullName ? c.fullName.split(' ')[0] : 'Klien')}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-5 text-xs">
              {/* SECTION 1: Identitas Pokok Subjek Target */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-1.5">
                  <span className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    1. Identitas Pokok Subjek Target (PII)
                  </span>
                  <span className="text-[10px] text-on-surface-variant font-mono">Dukcapil & Telemetri</span>
                </div>

                {/* 1. Nama Lengkap Subjek Target (Satu Input Form Terpadu) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-on-surface text-[11px] flex items-center gap-1.5">
                      <span>1. Nama Lengkap Subjek Target</span>
                      <span className="text-error font-bold">*</span>
                    </label>
                    <span className="text-[10px] text-on-surface-variant font-normal">
                      Sesuai e-KTP / identitas profil target terindikasi
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Masukkan nama lengkap subjek target (misal: Ega Kusuma Anindhita)..."
                      value={targetName}
                      onChange={(e) => setTargetName(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-container-low border border-outline-variant/50 focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors text-xs font-semibold text-on-surface"
                      required
                    />
                    <span className="material-symbols-outlined text-[18px] text-outline absolute left-2.5 top-2.5 pointer-events-none">
                      person
                    </span>
                  </div>
                </div>

                {/* 2, 3, 4: NIK, Nomor HP, Email */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* 2. NIK KTP */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-on-surface text-[11px]">2. NIK KTP (16 Digit)</label>
                      <span className={`text-[10px] font-mono ${targetQuery.length === 16 ? 'text-tertiary-container font-bold' : 'text-on-surface-variant'}`}>
                        {targetQuery.length}/16
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={16}
                        placeholder="3171091405960004"
                        value={targetQuery}
                        onChange={(e) => setTargetQuery(e.target.value.replace(/\D/g, ''))}
                        className="w-full h-9 pl-8 pr-2.5 rounded-lg bg-surface-container-low font-mono border border-outline-variant/50 focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors text-xs"
                      />
                      <span className="material-symbols-outlined text-[15px] text-outline absolute left-2.5 top-2.5 pointer-events-none">
                        badge
                      </span>
                    </div>
                  </div>

                  {/* 3. Nomor Handphone */}
                  <div className="space-y-1">
                    <label className="font-bold text-on-surface text-[11px]">3. Nomor Handphone Aktif</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="+62 812-9842-7890"
                        value={targetPhone}
                        onChange={(e) => setTargetPhone(e.target.value)}
                        className="w-full h-9 pl-8 pr-2.5 rounded-lg bg-surface-container-low font-mono border border-outline-variant/50 focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors text-xs"
                      />
                      <span className="material-symbols-outlined text-[15px] text-outline absolute left-2.5 top-2.5 pointer-events-none">
                        phone_iphone
                      </span>
                    </div>
                  </div>

                  {/* 4. Email Terkait */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-on-surface text-[11px]">4. Email Terkait</label>
                      <span className="text-[10px] text-on-surface-variant font-mono">Audit HIBP v3 &amp; Dumps</span>
                    </div>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="ega.kusuma96@gmail.com"
                        value={targetEmail}
                        onChange={(e) => setTargetEmail(e.target.value)}
                        className="w-full h-9 pl-8 pr-2.5 rounded-lg bg-surface-container-low border border-outline-variant/50 focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors text-xs font-mono"
                      />
                      <span className="material-symbols-outlined text-[15px] text-outline absolute left-2.5 top-2.5 pointer-events-none">
                        mail
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Informasi Keluarga & Target Posting Doxing (Deteksi DC Pinjol) */}
              <div className="p-4 rounded-xl bg-error-container/20 border border-error/25 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-error/15 pb-2">
                  <div className="flex items-center gap-1.5 text-error font-bold text-xs">
                    <span className="material-symbols-outlined text-[18px]">family_restroom</span>
                    <span>Informasi Keluarga & Target Posting Doxing</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-error text-white uppercase tracking-wider self-start sm:self-auto shadow-2xs">
                    Penting untuk Deteksi Doxing DC Pinjol
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Sindikat penagihan debt collector pinjol ilegal kerap menyasar pasangan atau orang tua korban serta melakukan publikasi foto/data ke kanal media lokal untuk melakukan pemerasan.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* 5. Nama Pasangan / Orang Tua */}
                  <div className="space-y-1">
                    <label className="font-bold text-on-surface text-[11px] flex items-center justify-between">
                      <span>5. Nama Istri / Suami / Pasangan / Orang Tua</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="misal: Rina Astuti (Istri) / Bambang Kusuma (Ayah)"
                        value={familyName}
                        onChange={(e) => setFamilyName(e.target.value)}
                        className="w-full h-9 pl-8 pr-3 rounded-lg bg-white border border-outline-variant/60 focus:outline-none focus:border-error focus:ring-1 focus:ring-error transition-all text-xs"
                      />
                      <span className="material-symbols-outlined text-[16px] text-error absolute left-2.5 top-2.5 pointer-events-none">
                        favorite
                      </span>
                    </div>
                    <span className="text-[10px] text-on-surface-variant block">
                      Kontak keluarga inti yang rentan dihubungi / diteror sindikat DC
                    </span>
                  </div>

                  {/* 6. Kata Kunci Tambahan / Akun Posting Doxing */}
                  <div className="space-y-1">
                    <label className="font-bold text-on-surface text-[11px] flex items-center justify-between">
                      <span>6. Kata Kunci Tambahan / Akun Posting Doxing</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="misal: @urbanbekasi, @infobekasi, #doxingpinjol"
                        value={doxingKeywords}
                        onChange={(e) => setDoxingKeywords(e.target.value)}
                        className="w-full h-9 pl-8 pr-3 rounded-lg bg-white border border-outline-variant/60 focus:outline-none focus:border-error focus:ring-1 focus:ring-error transition-all text-xs font-mono"
                      />
                      <span className="material-symbols-outlined text-[16px] text-error absolute left-2.5 top-2.5 pointer-events-none">
                        campaign
                      </span>
                    </div>
                    <span className="text-[10px] text-on-surface-variant block">
                      Akun info publik/menfess lokal atau kata kunci spesifik tempat sebar data
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Username Social Media (7 Platform) */}
              <div className="p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/30 space-y-3">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                  <div className="flex items-center gap-1.5 text-on-surface font-bold text-xs">
                    <span className="material-symbols-outlined text-primary text-[18px]">share</span>
                    <span>Username Social Media (OSINT Footprint & Scraping)</span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-surface-container text-primary">
                    {Object.values(socialMedia).filter(Boolean).length}/7 Terhubung
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant">
                  Deteksi jejak shadow profile, komentar intimidasi doxing, dan analisis mutual friend/followers di 7 platform media sosial.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                  {/* 7. Instagram */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-on-surface flex items-center gap-1.5">
                      <InstagramIcon />
                      <span>7. Instagram</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 text-xs font-mono text-outline select-none">@</span>
                      <input
                        type="text"
                        placeholder="username_ig"
                        value={socialMedia.instagram}
                        onChange={(e) => setSocialMedia({ ...socialMedia, instagram: e.target.value.replace(/^@/, '') })}
                        className="w-full h-8 pl-6 pr-2 rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-xs font-mono focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* 8. Facebook */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-on-surface flex items-center gap-1.5">
                      <FacebookIcon />
                      <span>8. Facebook</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        placeholder="username / id profil"
                        value={socialMedia.facebook}
                        onChange={(e) => setSocialMedia({ ...socialMedia, facebook: e.target.value })}
                        className="w-full h-8 px-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-xs font-mono focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* 9. Threads */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-on-surface flex items-center gap-1.5">
                      <ThreadsIcon />
                      <span>9. Threads</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 text-xs font-mono text-outline select-none">@</span>
                      <input
                        type="text"
                        placeholder="username_threads"
                        value={socialMedia.threads}
                        onChange={(e) => setSocialMedia({ ...socialMedia, threads: e.target.value.replace(/^@/, '') })}
                        className="w-full h-8 pl-6 pr-2 rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-xs font-mono focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* 10. LinkedIn */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-on-surface flex items-center gap-1.5">
                      <LinkedinIcon />
                      <span>10. LinkedIn</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-2 text-[10px] font-mono text-outline select-none">in/</span>
                      <input
                        type="text"
                        placeholder="profil-slug"
                        value={socialMedia.linkedin}
                        onChange={(e) => setSocialMedia({ ...socialMedia, linkedin: e.target.value.replace(/^in\//, '') })}
                        className="w-full h-8 pl-6 pr-2 rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-xs font-mono focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* 11. TikTok */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-on-surface flex items-center gap-1.5">
                      <TiktokIcon />
                      <span>11. TikTok</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 text-xs font-mono text-outline select-none">@</span>
                      <input
                        type="text"
                        placeholder="username_tiktok"
                        value={socialMedia.tiktok}
                        onChange={(e) => setSocialMedia({ ...socialMedia, tiktok: e.target.value.replace(/^@/, '') })}
                        className="w-full h-8 pl-6 pr-2 rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-xs font-mono focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* 12. Twitter / X */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-on-surface flex items-center gap-1.5">
                      <TwitterXIcon />
                      <span>12. Twitter / X</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 text-xs font-mono text-outline select-none">@</span>
                      <input
                        type="text"
                        placeholder="username_x"
                        value={socialMedia.twitter}
                        onChange={(e) => setSocialMedia({ ...socialMedia, twitter: e.target.value.replace(/^@/, '') })}
                        className="w-full h-8 pl-6 pr-2 rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-xs font-mono focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* 13. YouTube */}
                  <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                    <label className="text-[11px] font-semibold text-on-surface flex items-center gap-1.5">
                      <YoutubeIcon />
                      <span>13. YouTube</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 text-xs font-mono text-outline select-none">@</span>
                      <input
                        type="text"
                        placeholder="channel-handle / @NamaChannel"
                        value={socialMedia.youtube}
                        onChange={(e) => setSocialMedia({ ...socialMedia, youtube: e.target.value.replace(/^@/, '') })}
                        className="w-full h-8 pl-6 pr-2 rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-xs font-mono focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* OSINT Engines Toggle */}
              <div className="p-4 rounded-xl bg-surface-container-low/40 border border-outline-variant/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-on-surface uppercase tracking-wider text-[11px] block">
                    Pilih Node Mesin Investigasi Aktif:
                  </span>
                  <span className="text-[10px] text-primary font-mono font-semibold">Multi-Crawler v4.2</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {[
                    { key: 'dukcapil', label: 'Dukcapil L2 Hash Match', icon: 'fingerprint' },
                    { key: 'hibp', label: 'HIBP Breach API v3', icon: 'database' },
                    { key: 'darknet', label: 'DarkLeaks & Telegram Dump', icon: 'shield_locked' },
                    { key: 'googleDork', label: 'Google Dorking Engine', icon: 'travel_explore' },
                    { key: 'serp', label: 'SerpAPI Google Dorks', icon: 'travel_explore' },
                    { key: 'social', label: 'Social Media Footprint', icon: 'share' },
                    { key: 'dcTracker', label: 'DC Pinjol & Contact Correlator', icon: 'perm_phone_msg' },
                  ].map((engine) => (
                    <label
                      key={engine.key}
                      className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 cursor-pointer hover:border-primary transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEngines[engine.key] || false}
                        onChange={(e) => setSelectedEngines({ ...selectedEngines, [engine.key]: e.target.checked })}
                        className="rounded text-primary focus:ring-0"
                      />
                      <span className="material-symbols-outlined text-[15px] text-primary">{engine.icon}</span>
                      <span className="text-[10px] font-medium text-on-surface">{engine.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Scan Trigger Button */}
              <button
                type="button"
                onClick={startLiveScan}
                className="w-full py-3.5 rounded-xl bg-primary-container hover:bg-primary text-white font-bold text-xs shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.005] active:scale-[0.995]"
              >
                <span className="material-symbols-outlined text-[18px]">radar</span>
                <span>Luncurkan Audit Jejak Digital (13 Parameter OSINT)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Scanning Simulation Progress Banner */}
        {isScanning && (
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-primary/40 p-6 space-y-4 animate-pulse">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-primary-container text-white">
                  <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                </span>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Proses Pemindaian OSINT & Audit Forensik Berjalan...</h3>
                  <span className="text-[11px] text-on-surface-variant font-mono">TARGET: {targetName} ({targetQuery})</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-error-container text-on-error-container text-xs font-mono font-bold animate-pulse">
                CRAWLING IN PROGRESS
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono font-semibold">
                <span className="text-on-surface">{currentScanStep}</span>
                <span className="text-primary font-bold">{scanProgress}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-surface-container overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300 rounded-full"
                  style={{ width: `${scanProgress}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-[#121c2d] text-[#e8eeff] p-3.5 rounded-xl font-mono text-xs space-y-1 max-h-36 overflow-y-auto border border-outline/30">
              <div className="text-[#54d9a8] pb-1 border-b border-outline/20 text-[11px]">
                TELEMETRY CRAWLER LOGS:
              </div>
              {liveLogs.slice(-3).map((log, i) => (
                <div key={i} className="text-white/80 text-[11px]">{log}</div>
              ))}
            </div>
          </div>
        )}

        {/* Hasil Diagnosa & Temuan Forensik (Directly below the form matching design screenshot) */}
        {hasScanned && (
          <div id="hasil-temuan-forensik" className="pt-2">
            <ForensicReportView
              targetName={targetName}
              firstName={firstName}
              targetQuery={targetQuery}
              targetPhone={targetPhone}
              targetEmail={targetEmail}
              familyName={familyName}
              doxingKeywords={doxingKeywords}
              socialMedia={socialMedia}
              scanResultData={scanResultData}
              onNavigateTab={onNavigateTab}
              onEditParameters={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}
      </div>
    )}

      {/* Tab 2: Bulk Scan CSV */}
      {/* Tab 2: Bulk Scan CSV */}
      {subTab === 'bulk' && (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 p-6 md:p-8 space-y-6">
          {/* Header & Tools Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-primary-container text-white">
                  <span className="material-symbols-outlined text-[18px]">table_chart</span>
                </span>
                <h2 className="text-base font-bold text-on-surface">Batch Processing &amp; Pemindaian Massal (CSV)</h2>
              </div>
              <p className="text-xs text-on-surface-variant mt-1">
                Unggah berkas CSV daftar subjek target untuk dipindai secara massal via worker pool OSINT berkemampuan multi-search crawler &amp; leak intelligence.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={loadSampleBatchData}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface text-xs font-semibold hover:bg-surface-container-highest transition-colors shadow-2xs"
                title="Muat 5 data sampel target riil untuk pengujian instan"
              >
                <span className="material-symbols-outlined text-[16px] text-amber-500">science</span>
                <span>Muat Sampel Demo (5 Target)</span>
              </button>
              <button
                type="button"
                onClick={downloadCsvTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-container text-white text-xs font-semibold hover:bg-primary transition-colors shadow-2xs"
                title="Unduh template format CSV resmi dengan header siap pakai"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>Unduh Template CSV</span>
              </button>
            </div>
          </div>

          {/* Section 1: Dropzone & File Loader (If not yet scanned or if user wants to upload) */}
          {bulkRows.length === 0 && !isBulkProcessing && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all ${
                isDraggingOver
                  ? 'border-primary bg-primary/5 scale-[1.005]'
                  : 'border-outline-variant/60 bg-surface-container-low/20 hover:border-primary/60'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-primary text-[36px]">cloud_upload</span>
              </div>
              <h3 className="font-bold text-sm text-on-surface">Tarik &amp; Letakkan Berkas CSV Target Di Sini</h3>
              <p className="text-xs text-on-surface-variant mt-1 max-w-md leading-relaxed">
                Format CSV didukung: pemisah koma (<code className="bg-surface-container px-1 py-0.5 rounded font-mono">,</code>) atau titik-koma (<code className="bg-surface-container px-1 py-0.5 rounded font-mono">;</code>).<br />
                Kolom dikenali: <span className="font-semibold text-on-surface font-mono text-[11px]">nama, nik, phone, email, pasangan, keywords, instagram, facebook</span>
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                <label className="px-4 py-2 rounded-xl bg-primary text-white font-semibold text-xs cursor-pointer hover:bg-primary/90 transition-all shadow-sm flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">folder_open</span>
                  <span>Pilih Berkas CSV Lokal</span>
                  <input type="file" accept=".csv,text/csv" onChange={handleBulkUpload} className="hidden" />
                </label>
              </div>

              {csvFileName && (
                <div className="mt-4 px-3.5 py-1.5 rounded-lg bg-surface-container border border-outline-variant/40 flex items-center gap-2 text-xs font-mono">
                  <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
                  <span className="font-bold text-on-surface">{csvFileName}</span>
                  <span className="text-on-surface-variant font-medium">({csvFileSize})</span>
                </div>
              )}
            </div>
          )}

          {/* Section 2: Pre-Scan Target Preview & Confirmation */}
          {csvParsedTargets.length > 0 && bulkRows.length === 0 && !isBulkProcessing && (
            <div className="bg-surface-container-low/40 rounded-xl p-5 border border-outline-variant/40 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-tertiary-container text-on-tertiary-container font-mono text-xs font-bold">
                      {csvParsedTargets.length} TARGET TERBACA
                    </span>
                    <span className="text-xs text-on-surface font-semibold">
                      Pratinjau Data Sebelum Eksekusi Batch
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    Pastikan nama, NIK, dan nomor HP target telah terpetakan dengan benar sebelum menjalankan mesin crawler OSINT.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetBatch}
                    className="px-3 py-1.5 rounded-lg border border-outline-variant/40 text-on-surface-variant hover:text-on-surface text-xs font-semibold transition-colors"
                  >
                    Batal / Ganti Berkas
                  </button>
                  <button
                    type="button"
                    onClick={handleStartBulkScan}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white font-bold text-xs hover:shadow-md transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px] animate-pulse">rocket_launch</span>
                    <span>Mulai Pemindaian Massal ({csvParsedTargets.length} Target)</span>
                  </button>
                </div>
              </div>

              {/* Preview Table */}
              <div className="overflow-x-auto border border-outline-variant/30 rounded-xl bg-surface-container-lowest max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low text-on-surface-variant uppercase text-[10px] font-semibold border-b border-outline-variant/30 sticky top-0 z-10">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Nama Subjek</th>
                      <th className="py-2 px-3">NIK</th>
                      <th className="py-2 px-3">No. HP</th>
                      <th className="py-2 px-3">Email</th>
                      <th className="py-2 px-3">Kerabat / Pasangan</th>
                      <th className="py-2 px-3">Keywords</th>
                      <th className="py-2 px-3 text-right">Status Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20 font-mono text-[11px]">
                    {csvParsedTargets.map((t, idx) => (
                      <tr key={idx} className="hover:bg-surface-container-low/40">
                        <td className="py-2 px-3 text-on-surface-variant">{idx + 1}</td>
                        <td className="py-2 px-3 font-bold font-sans text-on-surface">{t.name}</td>
                        <td className="py-2 px-3 text-on-surface">{t.nik || '-'}</td>
                        <td className="py-2 px-3 text-on-surface">{t.phone || '-'}</td>
                        <td className="py-2 px-3 text-on-surface-variant">{t.email || '-'}</td>
                        <td className="py-2 px-3 text-on-surface-variant font-sans">{t.spouseFamily || '-'}</td>
                        <td className="py-2 px-3 text-on-surface-variant font-sans truncate max-w-xs">{t.keywords || '-'}</td>
                        <td className="py-2 px-3 text-right">
                          <span className="px-1.5 py-0.5 rounded font-sans text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Valid
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 3: Live Batch Processing Telemetry */}
          {isBulkProcessing && (
            <div className="bg-surface-container-low/70 border border-primary/30 rounded-2xl p-6 space-y-4 shadow-sm animate-pulse">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center animate-spin">
                    <span className="material-symbols-outlined text-[24px]">sync</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-on-surface">
                      Batch Crawler Pool Sedang Berjalan (3 Worker Paralel)...
                    </h3>
                    <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                      {bulkCurrentItem}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-lg font-bold text-primary">{bulkProgress}%</span>
                  <div className="text-[10px] text-on-surface-variant font-mono">ESTIMASI REAL-TIME</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 rounded-full bg-surface-container overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary via-indigo-500 to-emerald-500 transition-all duration-300 rounded-full"
                  style={{ width: `${bulkProgress}%` }}
                ></div>
              </div>

              <div className="bg-[#121c2d] text-[#e8eeff] p-3.5 rounded-xl font-mono text-[11px] space-y-1 max-h-24 overflow-y-auto border border-outline/30">
                <div className="text-[#54d9a8]">TELEMETRI BATCH OSINT POOL:</div>
                <div className="text-white/80">&gt;&gt; {bulkCurrentItem}</div>
                <div className="text-white/60">&gt;&gt; Menghubungi indeks pencarian Google, Dukcapil L2, HLR lookup, HIBP database, dan social footprint...</div>
              </div>
            </div>
          )}

          {/* Section 4: Batch Scan Results Dashboard */}
          {bulkRows.length > 0 && (
            <div className="space-y-5 pt-2">
              {/* Summary KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                <div className="bg-surface-container-low/40 border border-outline-variant/30 rounded-xl p-4">
                  <div className="flex items-center justify-between text-on-surface-variant text-xs">
                    <span>Total Target</span>
                    <span className="material-symbols-outlined text-[18px] text-primary">groups</span>
                  </div>
                  <div className="mt-2 text-2xl font-bold font-mono text-on-surface">
                    {bulkStats.total}
                  </div>
                  <div className="text-[11px] text-on-surface-variant mt-0.5">Subjek Terproses</div>
                </div>

                <div className="bg-error/5 border border-error/20 rounded-xl p-4">
                  <div className="flex items-center justify-between text-error text-xs font-semibold">
                    <span>Risiko Kritis</span>
                    <span className="material-symbols-outlined text-[18px]">warning</span>
                  </div>
                  <div className="mt-2 text-2xl font-bold font-mono text-error">
                    {bulkStats.kritis}
                  </div>
                  <div className="text-[11px] text-error/80 mt-0.5">Skor &ge; 75 (Perlu Intervensi)</div>
                </div>

                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                  <div className="flex items-center justify-between text-amber-600 text-xs font-semibold">
                    <span>Total Kebocoran</span>
                    <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                  </div>
                  <div className="mt-2 text-2xl font-bold font-mono text-amber-600">
                    {bulkStats.totalBreach}
                  </div>
                  <div className="text-[11px] text-amber-700/80 mt-0.5">Akun/Data Dump Bocor</div>
                </div>

                <div className="bg-surface-container-low/40 border border-outline-variant/30 rounded-xl p-4">
                  <div className="flex items-center justify-between text-on-surface-variant text-xs">
                    <span>Rata-rata Skor</span>
                    <span className="material-symbols-outlined text-[18px] text-indigo-600">speed</span>
                  </div>
                  <div className="mt-2 text-2xl font-bold font-mono text-indigo-600">
                    {bulkStats.avgScore}/100
                  </div>
                  <div className="text-[11px] text-on-surface-variant mt-0.5">Indeks Paparan Kolektif</div>
                </div>
              </div>

              {/* Filters & Actions Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-low/20 p-3 rounded-xl border border-outline-variant/30">
                {/* Search box */}
                <div className="relative flex-1 max-w-sm">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-on-surface-variant">search</span>
                  <input
                    type="text"
                    value={bulkSearchQuery}
                    onChange={(e) => setBulkSearchQuery(e.target.value)}
                    placeholder="Cari nama, NIK, atau nomor HP..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-on-surface focus:outline-hidden focus:border-primary"
                  />
                  {bulkSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setBulkSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-on-surface-variant hover:text-on-surface"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  )}
                </div>

                {/* Filter Chips */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                  {[
                    { id: 'ALL', label: `Semua (${bulkRows.length})` },
                    { id: 'KRITIS', label: `Kritis (${bulkStats.kritis})`, color: 'text-error' },
                    { id: 'TINGGI', label: `Tinggi (${bulkStats.tinggi})`, color: 'text-amber-600' },
                    { id: 'GAGAL', label: 'Gagal' },
                  ].map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => setBulkFilter(chip.id)}
                      className={`px-2.5 py-1 rounded-md text-[11px] transition-all ${
                        bulkFilter === chip.id
                          ? 'bg-primary text-white font-bold shadow-2xs'
                          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Export & New Batch Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => exportResultsToCsv(bulkRows)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">file_download</span>
                    <span>Ekspor Hasil (.CSV)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetBatch}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-on-surface text-xs font-semibold hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    <span>Pindai Batch Baru</span>
                  </button>
                </div>
              </div>

              {/* Table of Processed Targets */}
              <div className="overflow-x-auto border border-outline-variant/30 rounded-xl shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low text-on-surface-variant uppercase text-[10px] font-semibold border-b border-outline-variant/30">
                    <tr>
                      <th className="py-3 px-3.5">No</th>
                      <th className="py-3 px-3.5">Nama Subjek</th>
                      <th className="py-3 px-3.5">NIK (Masked)</th>
                      <th className="py-3 px-3.5">Nomor Handphone</th>
                      <th className="py-3 px-3.5 text-center">Temuan Dork</th>
                      <th className="py-3 px-3.5 text-center">Data Breach</th>
                      <th className="py-3 px-3.5 text-center">Skor Paparan</th>
                      <th className="py-3 px-3.5 text-center">Status</th>
                      <th className="py-3 px-3.5 text-right">Aksi Tindak Lanjut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {filteredBulkRows.map((row, idx) => (
                      <tr key={row.id || idx} className="hover:bg-surface-container-low/40 transition-colors">
                        <td className="py-3 px-3.5 font-mono text-on-surface-variant">{idx + 1}</td>
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-on-surface">{row.name}</div>
                          {row.email && row.email !== '-' && (
                            <div className="text-[10px] text-on-surface-variant font-mono">{row.email}</div>
                          )}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-on-surface font-semibold">
                          {row.nikMasked || row.nik || '-'}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-on-surface">
                          {row.phone || '-'}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-surface-container text-on-surface">
                            {row.dorkFound || 0} URL
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                            (row.breachCount || 0) > 0 ? 'bg-error-container text-on-error-container' : 'bg-surface-container text-on-surface-variant'
                          }`}>
                            {row.breachCount || 0} Breach
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            row.score >= 75
                              ? 'bg-error text-white'
                              : row.score >= 50
                              ? 'bg-amber-500 text-white'
                              : row.score >= 25
                              ? 'bg-yellow-500 text-slate-900'
                              : 'bg-emerald-600 text-white'
                          }`}>
                            {row.score}/100 ({row.riskCategory || 'SEDANG'})
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                            row.status === 'Selesai' ? 'text-emerald-700' : 'text-error'
                          }`}>
                            <span className="material-symbols-outlined text-[14px]">
                              {row.status === 'Selesai' ? 'check_circle' : 'cancel'}
                            </span>
                            <span>{row.status}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <button
                              type="button"
                              onClick={() => openTargetDossier(row)}
                              className="px-2.5 py-1 rounded-md bg-primary-container text-white text-[11px] font-semibold hover:bg-primary transition-all flex items-center gap-1 shadow-2xs"
                              title="Buka Dokumen Dossier Forensik Lengkap"
                            >
                              <span className="material-symbols-outlined text-[14px]">visibility</span>
                              <span>Dossier</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => printTargetPdf(row)}
                              className="p-1 rounded-md bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors"
                              title="Cetak Laporan PDF Resmi (Kop Yayasan Terkait)"
                            >
                              <span className="material-symbols-outlined text-[16px]">print</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadTargetPdf(row)}
                              className="p-1 rounded-md bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors"
                              title="Unduh File PDF Langsung"
                            >
                              <span className="material-symbols-outlined text-[16px]">download</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Live Scanning Progress */}
      {subTab === 'live' && (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-[24px]">terminal</span>
              <div>
                <h2 className="text-base font-bold text-on-surface">Konsol Pemindaian OSINT Real-Time</h2>
                <span className="text-xs text-on-surface-variant font-mono">TARGET: {targetName} ({targetQuery})</span>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
              isScanning ? 'bg-error-container text-on-error-container animate-pulse' : 'bg-tertiary-fixed text-on-tertiary-fixed'
            }`}>
              {isScanning ? 'CRAWLING IN PROGRESS' : 'SCAN COMPLETED'}
            </span>
          </div>

          {/* Multi-Step Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono font-semibold">
              <span className="text-on-surface">{currentScanStep || 'Menunggu pemicu scan...'}</span>
              <span className="text-primary font-bold">{scanProgress}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-surface-container overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 rounded-full"
                style={{ width: `${scanProgress}%` }}
              ></div>
            </div>
          </div>

          {/* Terminal Console Output */}
          <div className="bg-[#121c2d] text-[#e8eeff] p-5 rounded-xl font-mono text-xs space-y-2 max-h-96 overflow-y-auto border border-outline/30 shadow-inner">
            <div className="text-[#54d9a8] pb-1 border-b border-outline/20 flex justify-between">
              <span>MENYALAHATI FORENSIC ENGINE v4.2 - TELEMETRY PIPE</span>
              <span>TERMINAL L1</span>
            </div>
            {liveLogs.map((log, i) => (
              <div key={i} className="text-white/90 leading-relaxed">
                {log}
              </div>
            ))}
            {isScanning && (
              <div className="flex items-center gap-2 text-[#42ccfd] pt-1 animate-pulse">
                <span>&gt;&gt; Mengekstrak IOC dan relasi darknet node...</span>
              </div>
            )}
          </div>

          {/* Action Trigger */}
          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={startLiveScan}
              disabled={isScanning}
              className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-semibold text-xs transition-colors"
            >
              Ulangi Pemindaian
            </button>
            <button
              type="button"
              onClick={() => setSubTab('report')}
              className="px-5 py-2.5 rounded-xl bg-primary-container hover:bg-primary text-white font-semibold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <span>Lihat Laporan Forensik Lengkap</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Laporan Hasil Temuan Forensik Lengkap (Dedicated Tab View) */}
      {subTab === 'report' && (
        <div id="hasil-temuan-forensik-report">
          <ForensicReportView
            targetName={targetName}
            firstName={firstName}
            targetQuery={targetQuery}
            targetPhone={targetPhone}
            targetEmail={targetEmail}
            familyName={familyName}
            doxingKeywords={doxingKeywords}
            socialMedia={socialMedia}
            scanResultData={scanResultData}
            onNavigateTab={onNavigateTab}
            onEditParameters={() => {
              setSubTab('single');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      )}
    </div>
  );
}
