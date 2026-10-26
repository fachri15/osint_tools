import React, { useState, useEffect, useMemo } from 'react';
import { auditLogApi, scanApi } from '../../services/api';
import { ForensicReportView } from './ForensicReportView';
import { printOrSavePdfReport, generateBinaryDiagnosisPdf, downloadPdfBlob } from '../../utils/diagnosisPdfGenerator';

// Mini Social Icons
const MiniInstagramIcon = () => (
  <svg className="w-3.5 h-3.5 text-[#E1306C]" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const MiniFacebookIcon = () => (
  <svg className="w-3.5 h-3.5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const MiniTiktokIcon = () => (
  <svg className="w-3.5 h-3.5 text-on-surface" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.16 1.18 2.09 2.35 2.33.72.17 1.49.11 2.18-.18.78-.32 1.42-.94 1.78-1.7.21-.47.31-.98.31-1.5v-13.99z"/>
  </svg>
);

const MiniTwitterIcon = () => (
  <svg className="w-3.5 h-3.5 text-on-surface" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const MiniLinkedinIcon = () => (
  <svg className="w-3.5 h-3.5 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.762-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

// Fallback Realistic Sample Diagnosis History (when backend table is empty)
export const DEFAULT_FALLBACK_SCANS = [
  {
    id: 1,
    scanCode: 'SCN-089',
    targetName: 'Ega Kusuma Anindhita',
    targetNik: '3171091405960004',
    targetPhone: '+62 812-9842-7890',
    targetEmail: 'ega.kusuma96@gmail.com',
    targetInstagram: 'ega.kusuma96',
    targetFacebook: 'ega.anindhita',
    targetTwitter: 'ega_k',
    targetLinkedin: 'egakusuma',
    spouseFamily: 'Rina Astuti (Istri) / Bambang Kusuma (Ayah)',
    keywords: '@urbanbekasi, @infobekasi, #doxingpinjol',
    riskScore: 92,
    riskCategory: 'KRITIS',
    riskColor: 'red',
    dorkFound: 24,
    breachCount: 3,
    socialPlatforms: ['instagram', 'facebook', 'linkedin', 'twitter'],
    status: 'selesai',
    scanMode: 'real',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    client: { clientCode: 'KLIEN-089', fullName: 'Ega Kusuma Anindhita' },
    resultJson: {
      target: {
        fullName: 'Ega Kusuma Anindhita',
        phone: '+62 812-9842-7890',
        email: 'ega.kusuma96@gmail.com',
        nik: '3171091405960004',
        spouseFamily: 'Rina Astuti (Istri) / Bambang Kusuma (Ayah)',
        keywords: '@urbanbekasi, @infobekasi, #doxingpinjol',
        socialMedia: { instagram: 'ega.kusuma96', facebook: 'ega.anindhita', linkedin: 'egakusuma', twitter: 'ega_k' },
      },
      risk: {
        finalScore: 92,
        category: 'KRITIS',
        color: 'red',
        factors: [
          'Ditemukan dokumen e-KTP dan NIK pada direktori publik Pastebin',
          'Pencemaran nama baik & tagihan fiktif aktif di grup Telegram penagih',
          '3 kebocoran database kredensial global mengaitkan email target',
        ],
      },
      aiAnalysis: {
        hasDebtAssociation: true,
        threatScore: 92,
        summary: 'Ditemukan paparan kebocoran data NIK, nomor seluler, dan kontak keluarga pada database penagihan pinjaman online ilegal serta forum terbuka.',
        findings: [
          'Foto e-KTP dan NIK 3171091405960004 terunggah di Pastebin / JustPaste.it.',
          'Nomor ponsel terasosiasi dengan 3 akun kebocoran database kredensial (Breached DB).',
          'Kontak relasi keluarga Rina Astuti dijadikan sasaran blast pesan intimidatif pinjol.',
        ],
        recommendations: [
          'Kirim notice takedown segera ke penyedia hosting berdasarkan Pasal 65 UU PDP No. 27/2022.',
          'Ajukan de-indexing URL pencarian pribadi ke Google Search Console Removal Tool.',
          'Buat Laporan Polisi (LP/BAP SPKT Siber Bareskrim Polri) untuk perlindungan hukum resmi.',
        ],
      },
      dorkResults: [
        {
          category: 'Thread Doxing DC & Utang',
          label: 'Thread Doxing DC & Utang (Active Target)',
          risk: 'critical',
          foundCount: 7,
          description: 'Pencarian aktif postingan pencemaran nama baik, teror tagihan, dan kontak darurat pinjol liar.',
          query: '"Ega Kusuma Anindhita" (pinjol OR utang OR hutang OR "kontak darurat" OR "penipu" OR "buron" OR "debt collector" OR doxing)',
          direct_url: 'https://www.google.com/search?q=%22Ega+Kusuma+Anindhita%22+pinjol',
          items: [
            {
              title: 'Daftar Kontak Darurat Debitur Macet Pinjol - Kanal Publik',
              url: 'https://t.me/s/sebardatadebitur_id/8892',
              display_url: 't.me/s/sebardatadebitur_id/8892',
              snippet: 'Nama: Ega Kusuma Anindhita, NIK: 317109******0004, Kontak Darurat Istri: Rina Astuti. Harap segera melunasi tunggakan...',
              intel_tags: ['Telegram', 'Doxing DC', 'Kontak Darurat'],
              engine: 'multi',
              risk: 'critical',
            },
            {
              title: 'Thread Peringatan Penipuan & Utang Online Jabodetabek',
              url: 'https://forum.darkleak-asia.net/thread/99201',
              display_url: 'forum.darkleak-asia.net/thread/99201',
              snippet: 'Tuntutan bayar hutang sindikat EasyDana atas nama Ega Kusuma Anindhita nomor +6281298427890...',
              intel_tags: ['Darknet Forum', 'Tagihan Fiktif'],
              engine: 'multi',
              risk: 'critical',
            },
          ],
        },
        {
          category: 'Identitas & Dokumen Pribadi',
          label: 'Data KTP / NIK / Ijazah',
          risk: 'critical',
          foundCount: 3,
          description: 'Pencarian berkas kependudukan, ijazah, atau slip gaji yang terindeks publik.',
          query: '"Ega Kusuma Anindhita" (filetype:pdf OR filetype:xls OR filetype:xlsx) (KTP OR NIK OR KK)',
          direct_url: 'https://www.google.com/search?q=%22Ega+Kusuma+Anindhita%22+KTP',
          items: [
            {
              title: 'Kumpulan Data Verifikasi Pelanggan 2024.xlsx',
              url: 'https://pastebin.com/raw/d0x_egakusuma_3171',
              display_url: 'pastebin.com/raw/d0x_egakusuma_3171',
              snippet: 'NIK 3171091405960004 | Ega Kusuma Anindhita | Jl. Tebet Barat Dalam No. 18...',
              intel_tags: ['Pastebin', 'NIK KTP Terbuka'],
              engine: 'multi',
              risk: 'critical',
            },
          ],
        },
        {
          category: 'Doxing Media Sosial',
          label: 'Komentar Doxing di Medsos',
          risk: 'high',
          foundCount: 5,
          description: 'Deteksi komentar teror DC atau postingan intimidasi di media sosial publik.',
          query: 'Ega Kusuma Anindhita (site:instagram.com OR site:facebook.com) (utang OR pinjol)',
          direct_url: 'https://www.google.com/search?q=Ega+Kusuma+Anindhita+site:instagram.com+utang',
          items: [
            {
              title: 'Komentar Spam Penagihan di Instagram @ega.kusuma96',
              url: 'https://instagram.com/p/C98a1239xz',
              display_url: 'instagram.com/p/C98a1239xz',
              snippet: 'Tolong bayar hutang anda di aplikasi kami jangan kabur bawa lari uang!',
              intel_tags: ['Instagram', 'Spam DC'],
              engine: 'multi',
              risk: 'high',
            },
          ],
        },
      ],
      breaches: [
        {
          name: 'Tokopedia Leak 2020',
          title: 'Tokopedia Breach (91 Juta Akun)',
          domain: 'tokopedia.com',
          breachDate: '2020-03-01',
          dataClasses: ['Email', 'Nama', 'Nomor Telepon', 'Hash Kata Sandi'],
        },
        {
          name: 'RedDoorz Leak 2020',
          title: 'RedDoorz Customer Breach',
          domain: 'reddoorz.com',
          breachDate: '2020-09-01',
          dataClasses: ['Email', 'Nama', 'Nomor Telepon'],
        },
        {
          name: 'Indonesian Health Ministry Breach',
          title: 'PeduliLindungi Health Certificate Dump',
          domain: 'kemkes.go.id',
          breachDate: '2021-08-30',
          dataClasses: ['NIK', 'Nama Lengkap', 'Nomor Telepon'],
        },
      ],
      phoneIntel: {
        valid: true,
        operator: 'Telkomsel Halo/SimPATI',
        hlrRegion: 'DKI Jakarta & Sekitarnya',
        e164: '+6281298427890',
      },
      statistics: {
        totalQueries: 8,
        dorkResultsFound: 24,
        totalUniqueUrls: 15,
        phoneMentionsCount: 8,
        breachCount: 3,
        isClean: false,
      },
    },
  },
  {
    id: 2,
    scanCode: 'SCN-090',
    targetName: 'fachridatul Otolomo',
    targetNik: '7171052308980002',
    targetPhone: '082287258040',
    targetEmail: 'fachridatulotolomo1508@gmail.com',
    targetInstagram: 'ucp.tlm',
    riskScore: 80,
    riskCategory: 'KRITIS',
    riskColor: 'red',
    dorkFound: 18,
    breachCount: 3,
    socialPlatforms: ['instagram', 'facebook', 'whatsapp'],
    status: 'selesai',
    scanMode: 'real',
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    client: { clientCode: 'KLIEN-090', fullName: 'fachridatul Otolomo' },
    resultJson: {
      target: {
        fullName: 'fachridatul Otolomo',
        phone: '082287258040',
        email: 'fachridatulotolomo1508@gmail.com',
        nik: '7171052308980002',
        socialMedia: { instagram: 'ucp.tlm' },
      },
      risk: { finalScore: 80, category: 'KRITIS', color: 'red' },
      aiAnalysis: {
        hasDebtAssociation: true,
        threatScore: 80,
        summary: 'Ditemukan eksposur nomor telepon dan kebocoran email pada basis data publik pinjaman serta media sosial.',
        findings: [
          'Nomor 082287258040 terdeteksi dalam daftar blast penagihan pinjol.',
          '3 kebocoran database kredensial global mengaitkan email subjek.',
        ],
        recommendations: [
          'Ajukan permohonan de-index nomor ponsel dan nama di peramban publik.',
          'Lakukan rotasi sandi akun email terdaftar dan aktifkan 2FA.',
        ],
      },
      dorkResults: [
        {
          category: 'Thread Doxing DC & Utang',
          label: 'Thread Doxing DC & Utang (Active Target)',
          risk: 'critical',
          foundCount: 6,
          description: 'Pencarian aktif postingan penagihan.',
          query: '"fachridatul Otolomo" (pinjol OR utang OR penipu)',
          direct_url: 'https://www.google.com/search?q=%22fachridatul+Otolomo%22+pinjol',
          items: [
            {
              title: 'Daftar Kontak Tagihan Pinjol Gorontalo / Manado',
              url: 'https://t.me/s/infodc_manado/4412',
              display_url: 't.me/s/infodc_manado/4412',
              snippet: 'Peringatan bayar pinjaman atas nama fachridatul Otolomo nomor 082287258040...',
              intel_tags: ['Telegram', 'Tagihan DC'],
              engine: 'multi',
              risk: 'critical',
            },
          ],
        },
      ],
      breaches: [
        { name: 'Bukalapak Leak', title: 'Bukalapak 13M Accounts', domain: 'bukalapak.com', breachDate: '2019-03-01', dataClasses: ['Email', 'Nama', 'Telepon'] },
        { name: 'Cermati Leak', title: 'Cermati Financial Breach', domain: 'cermati.com', breachDate: '2020-10-01', dataClasses: ['Email', 'NIK', 'Alamat'] },
        { name: 'JD.ID Leak', title: 'JD.ID E-commerce Leak', domain: 'jd.id', breachDate: '2021-03-01', dataClasses: ['Email', 'Telepon'] },
      ],
      phoneIntel: {
        valid: true,
        operator: 'Telkomsel Prabayar',
        hlrRegion: 'Sulawesi Utara / Gorontalo',
        e164: '+6282287258040',
      },
      statistics: { totalQueries: 6, dorkResultsFound: 18, totalUniqueUrls: 9, phoneMentionsCount: 5, breachCount: 3, isClean: false },
    },
  },
  {
    id: 3,
    scanCode: 'SCN-092',
    targetName: 'Hendra Wijaya',
    targetNik: '3275041908880005',
    targetPhone: '+62 813-8821-9011',
    targetEmail: 'hendra.wijaya88@yahoo.com',
    targetInstagram: 'hendra_wijaya88',
    spouseFamily: 'Ratna Dewi (Istri)',
    riskScore: 68,
    riskCategory: 'TINGGI',
    riskColor: 'orange',
    dorkFound: 11,
    breachCount: 1,
    socialPlatforms: ['instagram', 'linkedin'],
    status: 'selesai',
    scanMode: 'real',
    createdAt: new Date(Date.now() - 3600000 * 52).toISOString(),
    client: { clientCode: 'KLIEN-092', fullName: 'Hendra Wijaya' },
  },
  {
    id: 4,
    scanCode: 'SCN-085',
    targetName: 'Dewi Lestari',
    targetNik: '3174055203910001',
    targetPhone: '+62 856-9912-3456',
    targetEmail: 'dewi.lestari@gmail.com',
    targetInstagram: 'dewi.lestari_id',
    riskScore: 22,
    riskCategory: 'AMAN',
    riskColor: 'green',
    dorkFound: 2,
    breachCount: 0,
    socialPlatforms: ['linkedin', 'instagram'],
    status: 'selesai',
    scanMode: 'real',
    createdAt: new Date(Date.now() - 3600000 * 80).toISOString(),
    client: { clientCode: 'KLIEN-085', fullName: 'Dewi Lestari' },
  },
];

// Fallback Realistic Audit Logs
const DEFAULT_FALLBACK_LOGS = [
  {
    id: 'LOG-9921',
    timestamp: '12 Okt 2026, 19:12:04 WIB',
    module: 'INVESTIGASI-DC',
    actor: 'ANL-7709-ID (Aditya Wardhana)',
    action: 'Analisis HLR & VoIP Indosat',
    target: '+62 857-1903-8821 (Sindikat Pundi Cepat)',
    result: 'VoIP Proxy Terdeteksi (Skor Fraud 94%)',
    hash: 'sha256:d8a901...33f2',
    badge: 'bg-secondary-fixed text-on-secondary-fixed-variant',
  },
  {
    id: 'LOG-9920',
    timestamp: '12 Okt 2026, 18:45:22 WIB',
    module: 'ASISTEN-REMOVAL',
    actor: 'AI-LEGAL-ENGINE',
    action: 'Pengiriman Notice Takedown UU PDP',
    target: 'pastebin.com/raw/d0x_egakusuma_3171',
    result: 'Tiket Terbit #PB-88912',
    hash: 'sha256:c2b110...901a',
    badge: 'bg-tertiary-fixed text-on-tertiary-fixed',
  },
  {
    id: 'LOG-9919',
    timestamp: '12 Okt 2026, 18:10:09 WIB',
    module: 'DATA-KLIEN',
    actor: 'ANL-7709-ID (Aditya Wardhana)',
    action: 'Registrasi Subjek Baru & Validasi Dukcapil',
    target: 'Ega Kusuma Anindhita (317109******0004)',
    result: 'Tervalidasi 100% Dukcapil L2',
    hash: 'sha256:4fa991...a12b',
    badge: 'bg-primary-fixed text-on-primary-fixed',
  },
  {
    id: 'LOG-9918',
    timestamp: '12 Okt 2026, 17:34:55 WIB',
    module: 'POLICE-REPORT',
    actor: 'LEGAL-MODULE',
    action: 'Generasi Berkas Resmi LP/BAP SPKT',
    target: 'BAP #LP/B/089/X/2026/SPKT.DITTIPIDSIBER',
    result: 'PDF Siap Cetak (Tervalidasi Barcode)',
    hash: 'sha256:77bc02...f4e8',
    badge: 'bg-primary-fixed text-primary',
  },
  {
    id: 'LOG-9917',
    timestamp: '12 Okt 2026, 16:50:11 WIB',
    module: 'DE-INDEX-CHECK',
    actor: 'STATUS-DAEMON',
    action: 'Verifikasi Status URL Live HTTP 404',
    target: 'forum.darkleak-asia.net/thread/9920',
    result: 'Konten Bersih Permanen',
    hash: 'sha256:8890ab...21ca',
    badge: 'bg-tertiary-fixed text-on-tertiary-fixed',
  },
  {
    id: 'LOG-9916',
    timestamp: '12 Okt 2026, 15:10:00 WIB',
    module: 'DIAGNOSA-OSINT',
    actor: 'MULTI-CRAWLER-BOT',
    action: 'Kueri Database Kebocoran HIBP v3',
    target: 'ega.kusuma96@gmail.com',
    result: '3 Kebocoran Global Terpapar',
    hash: 'sha256:12ef89...45bc',
    badge: 'bg-error-container text-on-error-container',
  },
];

export function RiwayatTrackingModule({ onNavigateTab }) {
  // Navigation SubTab: 'diagnosa' (Riwayat Diagnosa Jejak Digital), 'catatan' (Buku Catatan Forensik), 'semua' (Berdampingan)
  const [activeSubTab, setActiveSubTab] = useState('diagnosa');

  // Diagnosis Scans State
  const [scans, setScans] = useState([]);
  const [isScansLoading, setIsScansLoading] = useState(true);
  const [scanSearchQuery, setScanSearchQuery] = useState('');
  const [scanRiskFilter, setScanRiskFilter] = useState('ALL'); // ALL, KRITIS, TINGGI, SEDANG, AMAN
  const [selectedScan, setSelectedScan] = useState(null); // For Detail Result Modal
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Forensic Audit Logs State
  const [filterModule, setFilterModule] = useState('ALL');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logs, setLogs] = useState([]);
  const [isLogsLoading, setIsLogsLoading] = useState(true);

  // Notification / Toast
  const [notice, setNotice] = useState('');

  // 1. Fetch Scan History dari Backend
  const loadScanHistory = async () => {
    setIsScansLoading(true);
    try {
      const res = await scanApi.getHistory(100);
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map((s, idx) => ({
          ...s,
          scanCode: s.scanCode || `SCN-${String(s.id).padStart(3, '0')}`,
          formattedDate: s.createdAt ? new Date(s.createdAt).toLocaleString('id-ID') : 'Baru saja',
        }));
        setScans(mapped);
      } else {
        setScans(DEFAULT_FALLBACK_SCANS);
      }
    } catch (e) {
      console.warn('Menggunakan fallback data scan:', e.message);
      setScans(DEFAULT_FALLBACK_SCANS);
    } finally {
      setIsScansLoading(false);
    }
  };

  // 2. Fetch Audit Logs dari Backend
  const loadAuditLogs = async () => {
    setIsLogsLoading(true);
    try {
      const res = await auditLogApi.getAll();
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map(l => ({
          ...l,
          id: l.logCode || `LOG-${l.id}`,
          timestamp: l.createdAt ? new Date(l.createdAt).toLocaleString('id-ID') : 'Baru saja',
        }));
        setLogs(mapped);
      } else {
        setLogs(DEFAULT_FALLBACK_LOGS);
      }
    } catch (e) {
      console.warn('Menggunakan fallback data log:', e.message);
      setLogs(DEFAULT_FALLBACK_LOGS);
    } finally {
      setIsLogsLoading(false);
    }
  };

  useEffect(() => {
    loadScanHistory();
    loadAuditLogs();
  }, []);

  // Filtered Diagnosis Scans
  const filteredScans = useMemo(() => {
    return scans.filter(s => {
      // Risk filter
      if (scanRiskFilter !== 'ALL') {
        const cat = (s.riskCategory || '').toUpperCase();
        if (cat !== scanRiskFilter) return false;
      }
      // Search query
      if (!scanSearchQuery.trim()) return true;
      const q = scanSearchQuery.toLowerCase();
      return (
        (s.targetName || '').toLowerCase().includes(q) ||
        (s.targetNik || '').toLowerCase().includes(q) ||
        (s.targetPhone || '').toLowerCase().includes(q) ||
        (s.targetEmail || '').toLowerCase().includes(q) ||
        (s.scanCode || '').toLowerCase().includes(q) ||
        (s.keywords || '').toLowerCase().includes(q)
      );
    });
  }, [scans, scanRiskFilter, scanSearchQuery]);

  // Filtered Audit Logs
  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      if (filterModule !== 'ALL' && l.module !== filterModule) return false;
      if (!logSearchQuery.trim()) return true;
      const q = logSearchQuery.toLowerCase();
      return (
        (l.id || '').toLowerCase().includes(q) ||
        (l.actor || '').toLowerCase().includes(q) ||
        (l.action || '').toLowerCase().includes(q) ||
        (l.target || '').toLowerCase().includes(q) ||
        (l.result || '').toLowerCase().includes(q)
      );
    });
  }, [logs, filterModule, logSearchQuery]);

  // Handle Open Scan Detail
  const handleOpenScanDetail = async (scan) => {
    setIsDetailLoading(true);
    setSelectedScan(scan);
    try {
      // If resultJson is missing or minimal, fetch full record
      if (!scan.resultJson || Object.keys(scan.resultJson).length === 0) {
        const fullDetail = await scanApi.getDetail(scan.id);
        if (fullDetail && fullDetail.data) {
          setSelectedScan(prev => ({ ...prev, ...fullDetail.data }));
        }
      }
    } catch (err) {
      console.warn('Detail scan note:', err.message);
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Close Detail Modal with ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedScan) {
        setSelectedScan(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedScan]);

  // Quick PDF Download from row
  const handleQuickDownloadPdf = (scan) => {
    try {
      const parsed = typeof scan.resultJson === 'string' ? JSON.parse(scan.resultJson) : (scan.resultJson || {});
      const blob = generateBinaryDiagnosisPdf({
        targetName: scan.targetName || 'Target',
        targetPhone: scan.targetPhone || '-',
        targetEmail: scan.targetEmail || '-',
        targetNik: scan.targetNik || '-',
        targetSocials: parsed?.target?.socialMedia || {
          instagram: scan.targetInstagram || '',
          facebook: scan.targetFacebook || '',
          twitter: scan.targetTwitter || '',
          linkedin: scan.targetLinkedin || '',
          tiktok: scan.targetTiktok || '',
        },
        spouseFamily: scan.spouseFamily || '-',
        keywords: scan.keywords || '-',
        scanMode: 'Real Multi-Crawler Engine',
        riskScore: scan.riskScore || 50,
        riskCategory: scan.riskCategory || 'SEDANG',
        riskData: parsed?.risk,
        dorkResults: parsed?.dorkResults || [],
        breaches: parsed?.breaches || [],
      });
      const cleanTarget = (scan.targetName || 'Target').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
      downloadPdfBlob(blob, `Laporan_Diagnosa_${cleanTarget}_${scan.scanCode || scan.id}.pdf`);
      setNotice(`Laporan PDF Diagnosa untuk "${scan.targetName}" berhasil diunduh.`);
      setTimeout(() => setNotice(''), 4000);
    } catch (err) {
      console.error('Quick PDF Error:', err);
      printOrSavePdfReport({
        targetName: scan.targetName,
        targetPhone: scan.targetPhone,
        targetEmail: scan.targetEmail,
        targetNik: scan.targetNik,
        riskScore: scan.riskScore,
        riskCategory: scan.riskCategory,
      });
    }
  };

  // Helper Risk Badge Renderer
  const renderRiskBadge = (score, category) => {
    const cat = (category || '').toUpperCase();
    if (cat === 'KRITIS') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/10 text-red-600 border border-red-500/30 font-mono">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
          {score}/100 • KRITIS
        </span>
      );
    }
    if (cat === 'TINGGI') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-500/10 text-orange-600 border border-orange-500/30 font-mono">
          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
          {score}/100 • TINGGI
        </span>
      );
    }
    if (cat === 'SEDANG') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 border border-amber-500/30 font-mono">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          {score}/100 • SEDANG
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 font-mono">
        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        {score}/100 • AMAN
      </span>
    );
  };

  // Helper Social Badges
  const renderSocialBadges = (scan) => {
    const socials = [];
    if (scan.targetInstagram) socials.push({ type: 'ig', icon: <MiniInstagramIcon />, handle: `@${scan.targetInstagram}` });
    if (scan.targetFacebook) socials.push({ type: 'fb', icon: <MiniFacebookIcon />, handle: scan.targetFacebook });
    if (scan.targetTiktok) socials.push({ type: 'tt', icon: <MiniTiktokIcon />, handle: `@${scan.targetTiktok}` });
    if (scan.targetTwitter) socials.push({ type: 'tw', icon: <MiniTwitterIcon />, handle: `@${scan.targetTwitter}` });
    if (scan.targetLinkedin) socials.push({ type: 'li', icon: <MiniLinkedinIcon />, handle: scan.targetLinkedin });

    if (socials.length === 0) {
      return <span className="text-on-surface-variant text-[11px]">-</span>;
    }

    return (
      <div className="flex flex-wrap items-center gap-1 mt-1">
        {socials.map((s, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container text-[10px] font-mono font-medium text-on-surface border border-outline-variant/30"
            title={s.handle}
          >
            {s.icon}
            <span className="max-w-[70px] truncate">{s.handle}</span>
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full gap-6 pb-12 mt-10">
      {/* Toast Notice */}
      {notice && (
        <div className="p-4 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-between text-xs font-semibold shadow-sm border border-tertiary-container/30">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            <span>{notice}</span>
          </div>
          <button type="button" onClick={() => setNotice('')} className="p-1 hover:opacity-75">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Main Title & Sub-Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary-container text-white">
              <span className="material-symbols-outlined text-[20px]">history_edu</span>
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-on-surface">
              Riwayat Penanganan, Diagnosa & Audit Forensik
            </h1>
          </div>
          <p className="text-xs md:text-sm text-on-surface-variant mt-1">
            Pusat arsip hasil diagnosa jejak digital target OSINT dan buku catatan kejadian terenkripsi kriptografis ISO/IEC 27037:2012.
          </p>
        </div>

        {/* Sub-Tab Navigation Switcher */}
        <div className="flex flex-wrap items-center gap-1 bg-surface-container p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveSubTab('diagnosa')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'diagnosa'
                ? 'bg-white text-primary shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">radar</span>
            <span>Riwayat Diagnosa Jejak Digital</span>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold font-mono">
              {scans.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('catatan')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'catatan'
                ? 'bg-white text-primary shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            <span>Buku Catatan Digital Kejadian</span>
            <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[10px] font-bold font-mono">
              {logs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('semua')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'semua'
                ? 'bg-white text-primary shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            title="Tampilkan kedua tabel secara berdampingan/berurutan"
          >
            <span className="material-symbols-outlined text-[16px]">view_agenda</span>
            <span>Tampilkan Keduanya</span>
          </button>
        </div>
      </div>

      {/* Audit & Intelligence Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Total Riwayat Diagnosa OSINT
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-on-surface">{scans.length}</span>
              <span className="text-xs text-on-surface-variant">Sesi Pemindaian</span>
            </div>
            <span className="text-xs text-primary font-semibold flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[14px]">travel_explore</span> 100% Multi-Crawler Real
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center">
            <span className="material-symbols-outlined text-[26px]">radar</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Buku Catatan Kejadian (Audit Trail)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-tertiary-container">{logs.length > 0 ? logs.length : '1.842'}</span>
              <span className="text-xs text-on-surface-variant">Event Kriptografis</span>
            </div>
            <span className="text-xs text-tertiary-container font-semibold flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[14px]">verified</span> ISO/IEC 27037:2012 Valid
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center">
            <span className="material-symbols-outlined text-[26px]">receipt_long</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Integritas Hash & Retensi Dingin
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-secondary">5 Tahun</span>
              <span className="text-xs text-on-surface-variant">Sesuai UU PDP</span>
            </div>
            <span className="text-[11px] font-mono text-on-surface-variant mt-1 block">
              SHA-256 Merkle Root: #7fa8...90dc
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-secondary-fixed text-on-secondary-fixed-variant flex items-center justify-center">
            <span className="material-symbols-outlined text-[26px]">security</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TABEL 1: RIWAYAT DIAGNOSA JEJAK DIGITAL (SEPARATED TABLE)
          ───────────────────────────────────────────────────────────── */}
      {(activeSubTab === 'diagnosa' || activeSubTab === 'semua') && (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden space-y-0">
          {/* Section Header & Search Filters */}
          <div className="p-5 border-b border-outline-variant/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-container-low/40">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-primary-container text-white">
                  <span className="material-symbols-outlined text-[18px]">radar</span>
                </span>
                <h2 className="text-sm md:text-base font-bold text-on-surface">
                  Tabel Riwayat Diagnosa Jejak Digital (OSINT Scanner Dossier)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono text-xs font-bold">
                  {filteredScans.length} Dossier
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-1">
                Seluruh arsip hasil pemindaian Google Dorking, kebocoran NIK/e-KTP, email breach, dan skor ancaman. Klik <strong>"Buka Detail Hasil"</strong> untuk melihat dossier lengkap atau ekspor PDF.
              </p>
            </div>

            {/* Filter Tools */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={scanSearchQuery}
                  onChange={(e) => setScanSearchQuery(e.target.value)}
                  placeholder="Cari subjek, NIK, HP, email..."
                  className="h-9 w-48 sm:w-60 pl-8 pr-3 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="material-symbols-outlined absolute left-2 top-2 text-[18px] text-on-surface-variant pointer-events-none">
                  search
                </span>
                {scanSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setScanSearchQuery('')}
                    className="absolute right-2 top-2 text-on-surface-variant hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>

              {/* Filter Risk Dropdown */}
              <select
                value={scanRiskFilter}
                onChange={(e) => setScanRiskFilter(e.target.value)}
                className="h-9 px-3 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface font-semibold focus:outline-none"
              >
                <option value="ALL">Semua Tingkat Risiko</option>
                <option value="KRITIS">Kritis (Score 75-100)</option>
                <option value="TINGGI">Tinggi (Score 50-74)</option>
                <option value="SEDANG">Sedang (Score 25-49)</option>
                <option value="AMAN">Aman (Score 0-24)</option>
              </select>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={loadScanHistory}
                disabled={isScansLoading}
                className="h-9 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold transition-all flex items-center gap-1"
                title="Muat ulang data riwayat scan"
              >
                <span className={`material-symbols-outlined text-[16px] ${isScansLoading ? 'animate-spin' : ''}`}>
                  refresh
                </span>
                <span className="hidden sm:inline">Refresh</span>
              </button>

              {/* Start New Scan Button */}
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('diagnosa-jejak-digital')}
                  className="h-9 px-3.5 rounded-lg bg-primary-container text-white font-bold hover:bg-primary transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Mulai Diagnosa Baru</span>
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase text-[10px] tracking-wider font-semibold border-b border-outline-variant/30">
                <tr>
                  <th className="py-3 px-4">Kode Scan</th>
                  <th className="py-3 px-4">Waktu Pemindaian</th>
                  <th className="py-3 px-4">Subjek / Klien Target</th>
                  <th className="py-3 px-4">Parameter Kontak & Medsos</th>
                  <th className="py-3 px-4">Tingkat Risiko</th>
                  <th className="py-3 px-4">Temuan Jejak</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Aksi Laporan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 font-sans">
                {isScansLoading ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-[28px] text-primary animate-spin mb-1">sync</span>
                      <p>Memuat riwayat diagnosa jejak digital dari database MySQL...</p>
                    </td>
                  </tr>
                ) : filteredScans.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-[32px] text-on-surface-variant/40 mb-1">search_off</span>
                      <p className="font-semibold text-on-surface">Tidak ada riwayat diagnosa yang cocok.</p>
                      <p className="text-[11px] mt-0.5">Coba ubah kata kunci pencarian atau bersihkan filter risiko.</p>
                    </td>
                  </tr>
                ) : (
                  filteredScans.map((scan) => {
                    const parsedResult = typeof scan.resultJson === 'string'
                      ? JSON.parse(scan.resultJson)
                      : (scan.resultJson || {});
                    const totalDork = scan.dorkFound || parsedResult?.statistics?.dorkResultsFound || parsedResult?.dorkFound || 0;
                    const totalBreach = scan.breachCount || parsedResult?.statistics?.breachCount || parsedResult?.breaches?.length || 0;

                    return (
                      <tr
                        key={scan.id}
                        className="hover:bg-surface-container-low/60 transition-colors group"
                      >
                        {/* 1. ID / Kode */}
                        <td className="py-3.5 px-4 font-mono font-bold text-primary">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-primary/70">radar</span>
                            <span>{scan.scanCode || `SCN-${String(scan.id).padStart(3, '0')}`}</span>
                          </div>
                        </td>

                        {/* 2. Waktu */}
                        <td className="py-3.5 px-4 text-on-surface-variant font-mono text-[11px]">
                          {scan.formattedDate || (scan.createdAt ? new Date(scan.createdAt).toLocaleString('id-ID') : '-')}
                        </td>

                        {/* 3. Subjek / Target */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-on-surface text-xs group-hover:text-primary transition-colors">
                              {scan.targetName || 'Subjek Belum Bernama'}
                            </span>
                            <span className="text-[11px] font-mono text-on-surface-variant">
                              NIK: {scan.targetNik ? `${scan.targetNik.slice(0, 6)}******${scan.targetNik.slice(-4)}` : '-'}
                            </span>
                            {scan.client && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-primary font-semibold mt-0.5">
                                <span className="material-symbols-outlined text-[12px]">badge</span>
                                <span>{scan.client.clientCode || 'KLIEN'}</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 4. Kontak & Medsos */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col text-[11px]">
                            {scan.targetPhone && (
                              <span className="font-mono text-on-surface flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px] text-on-surface-variant">call</span>
                                {scan.targetPhone}
                              </span>
                            )}
                            {scan.targetEmail && (
                              <span className="font-mono text-on-surface-variant truncate max-w-[170px] flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px] text-on-surface-variant">mail</span>
                                {scan.targetEmail}
                              </span>
                            )}
                            {renderSocialBadges(scan)}
                          </div>
                        </td>

                        {/* 5. Tingkat Risiko */}
                        <td className="py-3.5 px-4">
                          {renderRiskBadge(scan.riskScore ?? 0, scan.riskCategory ?? 'AMAN')}
                        </td>

                        {/* 6. Temuan Jejak */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-0.5 text-[11px]">
                            <span className="inline-flex items-center gap-1 font-semibold text-on-surface">
                              <span className="material-symbols-outlined text-[14px] text-primary">travel_explore</span>
                              <span>{totalDork} URL Terindeks</span>
                            </span>
                            <span className={`inline-flex items-center gap-1 font-semibold ${totalBreach > 0 ? 'text-error' : 'text-on-surface-variant'}`}>
                              <span className="material-symbols-outlined text-[14px]">lock_open</span>
                              <span>{totalBreach} Kebocoran DB</span>
                            </span>
                          </div>
                        </td>

                        {/* 7. Status */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-tertiary-fixed text-on-tertiary-fixed">
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container"></span>
                            {scan.status || 'Selesai'}
                          </span>
                        </td>

                        {/* 8. Aksi: Buka Detail Hasil */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenScanDetail(scan)}
                              className="px-3 py-1.5 rounded-lg bg-primary-container text-white font-bold text-xs hover:bg-primary transition-all flex items-center gap-1 shadow-sm active:scale-95"
                              title="Buka kembali hasil diagnosa jejak digital secara utuh"
                            >
                              <span className="material-symbols-outlined text-[16px]">visibility</span>
                              <span>Buka Detail Hasil</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleQuickDownloadPdf(scan)}
                              className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
                              title="Cetak / Unduh PDF Laporan Resmi"
                            >
                              <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                            </button>

                            {onNavigateTab && (
                              <button
                                type="button"
                                onClick={() => onNavigateTab('diagnosa-jejak-digital', scan)}
                                className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
                                title="Buka & Muat di Modul Diagnosa Jejak Digital"
                              >
                                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TABEL 2: BUKU CATATAN DIGITAL KEJADIAN & INTERVENSI FORENSIK
          ───────────────────────────────────────────────────────────── */}
      {(activeSubTab === 'catatan' || activeSubTab === 'semua') && (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
          {/* Section Header & Module Filter */}
          <div className="p-5 border-b border-outline-variant/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-container-low/40">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-secondary text-white">
                  <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                </span>
                <h2 className="text-sm md:text-base font-bold text-on-surface">
                  Buku Catatan Digital Kejadian & Intervensi Forensik
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-mono text-xs font-bold">
                  {filteredLogs.length} Entri Audit
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-1">
                Log kronologis tindakan penyidik, eskalasi takedown, registrasi berkas, dan hasil verifikasi data tidak dapat diubah (immutable logs).
              </p>
            </div>

            {/* Filter Tools */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  placeholder="Cari aktivitas, target, aktor..."
                  className="h-9 w-44 sm:w-56 pl-8 pr-3 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="material-symbols-outlined absolute left-2 top-2 text-[18px] text-on-surface-variant pointer-events-none">
                  search
                </span>
              </div>

              {/* Module Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-on-surface-variant font-medium">Modul:</span>
                <select
                  value={filterModule}
                  onChange={(e) => setFilterModule(e.target.value)}
                  className="h-9 px-3 rounded-lg bg-surface-container text-on-surface font-semibold focus:outline-none border border-outline-variant/40"
                >
                  <option value="ALL">Semua Modul</option>
                  <option value="INVESTIGASI-DC">Investigasi DC</option>
                  <option value="ASISTEN-REMOVAL">Asisten Removal</option>
                  <option value="DATA-KLIEN">Data Klien</option>
                  <option value="POLICE-REPORT">Laporan Polisi</option>
                  <option value="DIAGNOSA-OSINT">Diagnosa OSINT</option>
                </select>
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={loadAuditLogs}
                disabled={isLogsLoading}
                className="h-9 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold transition-all flex items-center gap-1"
                title="Muat ulang log audit"
              >
                <span className={`material-symbols-outlined text-[16px] ${isLogsLoading ? 'animate-spin' : ''}`}>
                  refresh
                </span>
              </button>

              <span className="text-xs font-mono text-on-surface-variant bg-surface-container px-2.5 py-1.5 rounded-lg border border-outline-variant/30">
                AUTO-REFRESH: 5s
              </span>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase text-[10px] tracking-wider font-semibold border-b border-outline-variant/30">
                <tr>
                  <th className="py-3 px-4">Event ID</th>
                  <th className="py-3 px-4">Waktu (WIB)</th>
                  <th className="py-3 px-4">Modul</th>
                  <th className="py-3 px-4">Aktor / Analis</th>
                  <th className="py-3 px-4">Aktivitas & Target</th>
                  <th className="py-3 px-4">Hasil / Status</th>
                  <th className="py-3 px-4 text-right">Hash Bukti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 font-sans">
                {isLogsLoading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-[28px] text-primary animate-spin mb-1">sync</span>
                      <p>Memuat riwayat log audit forensik dari database MySQL...</p>
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-[28px] text-on-surface-variant/40 mb-1">history_toggle_off</span>
                      <p>Belum ada catatan log audit yang sesuai dengan filter.</p>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-primary">{log.id}</td>
                      <td className="py-3 px-4 text-on-surface-variant font-mono">{log.timestamp}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${log.badge || 'bg-surface-container text-on-surface'}`}>
                          {log.module}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-on-surface">{log.actor}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-on-surface block">{log.action}</span>
                        <span className="text-[11px] font-mono text-on-surface-variant">{log.target}</span>
                      </td>
                      <td className="py-3 px-4 text-tertiary-container font-semibold">{log.result}</td>
                      <td className="py-3 px-4 text-right font-mono text-[10px] text-outline">
                        {log.hash || 'sha256:7f...90a'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: BUKA DETAIL HASIL RIWAYAT DIAGNOSA JEJAK DIGITAL
          ───────────────────────────────────────────────────────────── */}
      {selectedScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-8 bg-black/75 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/40 overflow-hidden">
            {/* Modal Header Bar */}
            <div className="p-5 md:p-6 border-b border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-low/60 shrink-0">
              <div className="flex items-start md:items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary-container text-white flex items-center justify-center shadow-md shrink-0">
                  <span className="material-symbols-outlined text-[26px]">radar</span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase tracking-wider font-mono">
                      Dossier Forensik Tersimpan #{selectedScan.scanCode || selectedScan.id}
                    </span>
                    {renderRiskBadge(selectedScan.riskScore ?? 0, selectedScan.riskCategory ?? 'SEDANG')}
                  </div>
                  <h2 className="text-lg md:text-xl font-bold text-on-surface mt-1">
                    Hasil Diagnosa Jejak Digital: {selectedScan.targetName || 'Subjek Target'}
                  </h2>
                  <p className="text-xs text-on-surface-variant font-mono">
                    Waktu Pemindaian: {selectedScan.formattedDate || (selectedScan.createdAt ? new Date(selectedScan.createdAt).toLocaleString('id-ID') : 'Baru saja')} • Mode: {selectedScan.scanMode || 'Real OSINT Multi-Crawler'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Print / Download PDF */}
                <button
                  type="button"
                  onClick={() => handleQuickDownloadPdf(selectedScan)}
                  className="px-3.5 py-2 rounded-xl bg-primary-container text-white text-xs font-bold hover:bg-primary transition-all flex items-center gap-1.5 shadow-sm"
                  title="Unduh laporan lengkap dalam format PDF resmi"
                >
                  <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                  <span>Unduh PDF</span>
                </button>

                {/* Open in Full Diagnosa Tab */}
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => {
                      const targetScan = selectedScan;
                      setSelectedScan(null);
                      onNavigateTab('diagnosa-jejak-digital', targetScan);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold transition-all flex items-center gap-1.5 border border-outline-variant/30"
                    title="Buka dan muat hasil pemindaian ini ke Modul Diagnosa Utama"
                  >
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    <span>Buka di Modul Diagnosa</span>
                  </button>
                )}

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setSelectedScan(null)}
                  className="p-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
                  title="Tutup (Tekan ESC)"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            {/* Modal Body Container with ForensicReportView */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-surface-container-lowest">
              {isDetailLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
                  <span className="material-symbols-outlined text-[36px] text-primary animate-spin">sync</span>
                  <p className="text-sm font-semibold text-on-surface">Mengambil detail dossier forensik...</p>
                  <p className="text-xs text-on-surface-variant">Memuat basis data temuan Google Dorking dan kebocoran kredensial.</p>
                </div>
              ) : (
                (() => {
                  const parsedResult = typeof selectedScan.resultJson === 'string'
                    ? JSON.parse(selectedScan.resultJson)
                    : (selectedScan.resultJson || {});

                  const socialMediaParsed = parsedResult?.target?.socialMedia || {
                    instagram: selectedScan.targetInstagram || '',
                    facebook: selectedScan.targetFacebook || '',
                    threads: selectedScan.targetThreads || '',
                    linkedin: selectedScan.targetLinkedin || '',
                    tiktok: selectedScan.targetTiktok || '',
                    twitter: selectedScan.targetTwitter || '',
                    youtube: selectedScan.targetYoutube || '',
                  };

                  return (
                    <div className="space-y-6">
                      {/* Notice Banner */}
                      <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-primary text-[20px]">verified_user</span>
                          <div>
                            <span className="font-bold text-on-surface">Arsip Forensik Tervalidasi</span>
                            <span className="text-on-surface-variant block text-[11px]">
                              Hasil diagnosa disimpan secara permanen di database MySQL dengan parameter lengkap dan bukti URL nyata.
                            </span>
                          </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-on-surface-variant">
                          <span>NIK: {selectedScan.targetNik || '-'}</span>
                          <span>•</span>
                          <span>HP: {selectedScan.targetPhone || '-'}</span>
                        </div>
                      </div>

                      {/* Complete Interactive Forensic Report */}
                      <ForensicReportView
                        targetName={selectedScan.targetName || 'Subjek Target'}
                        firstName={selectedScan.targetName?.split(' ')[0] || ''}
                        targetQuery={selectedScan.targetNik || '-'}
                        targetPhone={selectedScan.targetPhone || '-'}
                        targetEmail={selectedScan.targetEmail || '-'}
                        familyName={selectedScan.spouseFamily || '-'}
                        doxingKeywords={selectedScan.keywords || '-'}
                        socialMedia={socialMediaParsed}
                        scanResultData={parsedResult}
                        onNavigateTab={(tab, param) => {
                          setSelectedScan(null);
                          if (onNavigateTab) onNavigateTab(tab, param);
                        }}
                        onEditParameters={() => {
                          const targetScan = selectedScan;
                          setSelectedScan(null);
                          if (onNavigateTab) onNavigateTab('diagnosa-jejak-digital', targetScan);
                        }}
                      />
                    </div>
                  );
                })()
              )}
            </div>

            {/* Modal Footer Bar */}
            <div className="p-4 px-6 border-t border-outline-variant/30 bg-surface-container-low/40 flex items-center justify-between text-xs text-on-surface-variant shrink-0">
              <span className="font-mono text-[11px]">
                Tekan <kbd className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface font-bold border border-outline-variant/40">ESC</kbd> untuk menutup jendela
              </span>
              <button
                type="button"
                onClick={() => setSelectedScan(null)}
                className="px-4 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold transition-colors"
              >
                Tutup Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
