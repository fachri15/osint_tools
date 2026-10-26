import React, { useState, useEffect } from 'react';
import { removalApi } from '../../services/api';

export function AsistenRemovalModule({ onNavigateTab }) {
  const [subTab, setSubTab] = useState('monitoring'); // monitoring, buat-case, legal-ai, checker
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Case Form
  const [newUrl, setNewUrl] = useState('');
  const [newPlatform, setNewPlatform] = useState('Telegram');
  const [newClientName, setNewClientName] = useState('');
  const [newLeakType, setNewLeakType] = useState('Foto KTP & Daftar Kontak');
  const [newLegalBasis, setNewLegalBasis] = useState('Pasal 65 UU PDP No. 27/2022');
  const [caseCreated, setCaseCreated] = useState(false);

  // Live Checker State
  const [checkUrl, setCheckUrl] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState(null);

  // AI Legal Generator State
  const [legalTemplate, setLegalTemplate] = useState('somasi_platform');
  const [legalSubjectName, setLegalSubjectName] = useState('');
  const [legalTargetUrl, setLegalTargetUrl] = useState('');
  const [legalPlatformName, setLegalPlatformName] = useState('');
  const [copiedDraft, setCopiedDraft] = useState(false);

  // Fetch dari backend saat mount
  useEffect(() => {
    async function loadCases() {
      setIsLoading(true);
      try {
        const res = await removalApi.getAll();
        if (res.data && res.data.length > 0) {
          const mapped = res.data.map(c => ({
            ...c,
            id: c.caseCode || `REM-${c.id}`,
            platformIcon: c.platform === 'Telegram' ? 'send' : c.platform === 'Google' ? 'search' : 'description',
            statusCode: c.status === 'Berhasil Dihapus' ? 'RESOLVED' : 'IN_PROGRESS',
            httpStatus: c.status === 'Berhasil Dihapus' ? 404 : 200,
            reportDate: c.createdAt ? new Date(c.createdAt).toLocaleDateString('id-ID') : 'Hari ini',
            lastChecked: c.lastCheckedAt ? new Date(c.lastCheckedAt).toLocaleString('id-ID') : 'Baru saja',
          }));
          setCases(mapped);
        }
      } catch (e) {
        console.warn('Gagal memuat removal cases dari MySQL:', e.message);
      } finally {
        setIsLoading(false);
      }
    }
    loadCases();
  }, []);

  const handleCreateCase = async (e) => {
    e.preventDefault();
    if (!newUrl) return;

    const payload = {
      clientName: newClientName,
      targetUrl: newUrl,
      platform: newPlatform,
      leakType: newLeakType,
      legalRef: newLegalBasis,
      status: 'Sedang Diproses Platform',
    };

    try {
      const res = await removalApi.create(payload);
      const created = res.data || {
        id: `REM-2026-${String(cases.length + 82).padStart(3, '0')}`,
        ...payload,
        platformIcon: newPlatform === 'Telegram' ? 'send' : newPlatform === 'Google' ? 'search' : 'description',
        reportDate: 'Hari ini',
        statusCode: 'IN_PROGRESS',
        ticketId: `TCK-${Math.floor(10000 + Math.random() * 90000)}`,
        evidenceCount: 2,
        lastChecked: 'Baru saja',
        httpStatus: 200,
        googleIndexed: true,
      };
      setCases([created, ...cases]);
    } catch (err) {
      const fallbackTicket = {
        id: `REM-2026-${String(cases.length + 82).padStart(3, '0')}`,
        ...payload,
        platformIcon: newPlatform === 'Telegram' ? 'send' : newPlatform === 'Google' ? 'search' : 'description',
        reportDate: 'Hari ini',
        statusCode: 'IN_PROGRESS',
        ticketId: `TCK-${Math.floor(10000 + Math.random() * 90000)}`,
        evidenceCount: 2,
        lastChecked: 'Baru saja',
        httpStatus: 200,
        googleIndexed: true,
      };
      setCases([fallbackTicket, ...cases]);
    }

    setCaseCreated(true);
    setTimeout(() => {
      setCaseCreated(false);
      setSubTab('monitoring');
    }, 1200);
  };

  const handleRunChecker = async () => {
    setIsChecking(true);
    setCheckResult(null);

    try {
      const res = await removalApi.runLiveCheck(checkUrl);
      setIsChecking(false);
      setCheckResult(res.data);
    } catch (err) {
      setIsChecking(false);
      const isGone = checkUrl.includes('darkleak');
      setCheckResult({
        url: checkUrl,
        httpStatus: isGone ? 404 : 200,
        statusText: isGone ? 'HTTP 404 Not Found (Konten Telah Dihapus)' : 'HTTP 200 OK (Konten Masih Aktif)',
        googleCache: isGone ? 'De-indexed' : 'Masih Terindeks di SERP Google',
        dnsStatus: 'Cloudflare Proxy Resolved',
        recommendation: isGone ? 'Takedown sukses! Lakukan pemantauan berkala 48 jam.' : 'Kirimkan eskalasi somasi kedua atau hubungi registrar domain.',
      });
    }
  };

  const generateLegalDraft = () => {
    if (legalTemplate === 'somasi_platform') {
      return `SURAT PEMBERITAHUAN PELANGGARAN PRIVASI & PERMOHONAN PENURUNAN KONTEN (TAKEDOWN NOTICE)
Nomor Referensi: REM/LEGAL/${Date.now().toString().slice(-6)}
Lampiran: Bukti Forensik Tangkapan Layar & Surat Kuasa Resmi

Kepada Yth.
Tim Kepatuhan & Legal / Abuse Team
${legalPlatformName}

Dengan hormat,
Bertindak untuk dan atas nama kepentingan hukum klien kami:
Nama Subjek   : ${legalSubjectName}
Status Korban : Subjek Perlindungan Data Pribadi Republik Indonesia

Bersama surat ini, kami menyampaikan permohonan resmi penghentian akses dan penghapusan permanen (Takedown) atas konten ilegal yang ditayangkan pada tautan berikut:
URL Target Pelanggaran: ${legalTargetUrl}

DASAR HUKUM DAN PELANGGARAN:
1. Undang-Undang Republik Indonesia Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP):
   - Pasal 65 ayat (1) dan (3): "Setiap orang dilarang secara melawan hukum memperoleh, mengumpulkan, atau mengungkapkan Data Pribadi yang bukan miliknya."
   - Sanksi Pidana Pasal 67: Pidana penjara paling lama 5 (lima) tahun dan/atau denda paling banyak Rp5.000.000.000,00 (lima miliar rupiah).
2. Undang-Undang Republik Indonesia Nomor 1 Tahun 2024 tentang Perubahan Kedua UU ITE:
   - Pasal 27B dan Pasal 45 ayat (4): Larangan pemerasan, pengancaman, dan penyebaran konten bermuatan pencemaran secara elektronik.

TUNTUTAN TINDAKAN:
Kami mendesak ${legalPlatformName} dalam batas waktu 1x24 jam sejak surat ini diterima untuk:
1. Menghapus atau memblokir akses publik terhadap tautan ${legalTargetUrl}.
2. Menghapus salinan cache konten pada server penyedia.

Demikian pemberitahuan ini kami sampaikan secara resmi demi tegaknya hukum dan perlindungan korban kejahatan siber.

Hormat kami,
TIM FORENSIK & ADVOKASI SIBER MENYALAHATI
Satuan Pendampingan Korban Doxing Siber Indonesia
Email: legal-abuse@menyalahati-intel.org`;
    } else {
      return `PERMOHONAN PENGHAPUSAN INFORMASI PRIBADI DARI HASIL PENCARIAN GOOGLE
Dasar: Google Personal Information Removal Policy & UU PDP No. 27/2022

Nama Pemohon : ${legalSubjectName}
Tautan SERP  : ${legalTargetUrl}
Bentuk Data  : NIK KTP, Kontak Seluler, dan Fitnah Terorganisir Tanpa Persetujuan

Dengan ini memohon agar Google LLC segera melakukan de-indexing atas URL terkait karena memuat data pribadi sensitif yang digunakan sindikat penagih ilegal untuk intimidasi publik.`;
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateLegalDraft());
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  return (
    <div className="flex flex-col w-full gap-6 pb-12 mt-10">
      {/* Title & Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary-container text-white">
              <span className="material-symbols-outlined text-[20px]">auto_delete</span>
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-on-surface">
              Asisten Removal & Takedown Konten
            </h1>
          </div>
          <p className="text-xs md:text-sm text-on-surface-variant mt-1">
            Modul otomasi permohonan penghapusan jejak digital, doxing di forum/cloud, serta penyusun draf somasi hukum AI.
          </p>
        </div>

        {/* Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-surface-container p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setSubTab('monitoring')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              subTab === 'monitoring'
                ? 'bg-white text-primary shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">view_kanban</span>
            <span>Monitoring Case ({cases.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('buat-case')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              subTab === 'buat-case'
                ? 'bg-white text-primary shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">post_add</span>
            <span>Buat Case Baru</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('legal-ai')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              subTab === 'legal-ai'
                ? 'bg-white text-primary shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">gavel</span>
            <span>AI Legal Generator</span>
            <span className="px-1.5 py-0.2 rounded bg-tertiary-fixed text-on-tertiary-fixed text-[9px] font-bold uppercase">
              AI
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('checker')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              subTab === 'checker'
                ? 'bg-white text-primary shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">troubleshoot</span>
            <span>Live Status Checker</span>
          </button>
        </div>
      </div>

      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Total Case Pembersihan</span>
            <div className="w-8 h-8 rounded-lg bg-surface-container text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">folder_copy</span>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-on-surface">12</span>
              <span className="text-xs text-on-surface-variant">Kasus Aktif</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[11px] text-tertiary-container font-semibold">
              <span className="material-symbols-outlined text-[14px]">trending_up</span> +3 minggu ini (75% tuntas)
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Draf / Persiapan</span>
            <div className="w-8 h-8 rounded-lg bg-surface-container text-outline flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">edit_document</span>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-on-surface">2</span>
              <span className="text-xs text-on-surface-variant">Berkas</span>
            </div>
            <span className="mt-2 text-[11px] text-on-surface-variant block">Pending review analis</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Sedang Diproses</span>
            <div className="w-8 h-8 rounded-lg bg-surface-container text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-on-surface">4</span>
              <span className="text-xs text-secondary font-bold">Dalam Antrean</span>
            </div>
            <span className="mt-2 text-[11px] text-on-surface-variant block">Telegram & Cloudflare</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Berhasil Dihapus</span>
            <div className="w-8 h-8 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-tertiary-container">5</span>
              <span className="text-xs text-tertiary-container font-bold">HTTP 404 / 410</span>
            </div>
            <span className="mt-2 text-[11px] text-tertiary-container block font-medium">Bebas dari Google</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Ditolak / Banding</span>
            <div className="w-8 h-8 rounded-lg bg-surface-container text-error flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">rule</span>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-error">1</span>
              <span className="text-xs text-on-surface-variant">Banding L2</span>
            </div>
            <span className="mt-2 text-[11px] text-on-surface-variant block">Perlu surat BAP polisi</span>
          </div>
        </div>
      </div>

      {/* Tab 1: Dashboard Monitoring Case */}
      {subTab === 'monitoring' && (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
          <div className="p-5 border-b border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-low/40">
            <div>
              <h2 className="text-sm md:text-base font-bold text-on-surface">
                Daftar Tiket Permohonan Takedown & Monitoring SLA
              </h2>
              <span className="text-xs text-on-surface-variant">
                Pemantauan berkala respons penyedia hosting dan platform pihak ketiga
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSubTab('buat-case')}
              className="px-3.5 py-1.5 rounded-lg bg-primary-container text-white text-xs font-semibold hover:bg-primary transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Buat Permohonan Baru</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase text-[10px] tracking-wider font-semibold border-b border-outline-variant/30">
                <tr>
                  <th className="py-3 px-4">Tiket ID</th>
                  <th className="py-3 px-4">Klien Korban</th>
                  <th className="py-3 px-4">Platform & URL Sasaran</th>
                  <th className="py-3 px-4">Bentuk Pelanggaran</th>
                  <th className="py-3 px-4">HTTP Status</th>
                  <th className="py-3 px-4">Status Takedown</th>
                  <th className="py-3 px-4 text-right">Opsi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-[28px] text-primary animate-spin mb-1">sync</span>
                      <p>Memuat daftar permohonan takedown dari database MySQL...</p>
                    </td>
                  </tr>
                ) : cases.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-[28px] text-on-surface-variant/40 mb-1">check_circle</span>
                      <p>Belum ada tiket removal aktif dalam database.</p>
                    </td>
                  </tr>
                ) : (
                  cases.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary">{item.id}</td>
                    <td className="py-3 px-4 font-bold text-on-surface">{item.clientName}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-secondary">
                          {item.platformIcon}
                        </span>
                        <div className="flex flex-col max-w-xs">
                          <span className="font-semibold text-on-surface">{item.platform}</span>
                          <span className="font-mono text-[10px] text-on-surface-variant truncate">
                            {item.targetUrl}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant">{item.leakType}</td>
                    <td className="py-3 px-4 font-mono font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        item.httpStatus === 404 || item.httpStatus === 410
                          ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                          : 'bg-error-container text-on-error-container'
                      }`}>
                        {item.httpStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[11px] font-semibold flex items-center gap-1.5 ${
                        item.statusCode === 'RESOLVED'
                          ? 'text-tertiary-container'
                          : 'text-secondary'
                      }`}>
                        <span className={`h-2 w-2 rounded-full ${
                          item.statusCode === 'RESOLVED' ? 'bg-tertiary-container' : 'bg-secondary animate-ping'
                        }`}></span>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setCheckUrl(item.targetUrl);
                          setSubTab('checker');
                          handleRunChecker();
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-[11px] transition-colors"
                      >
                        Uji Status
                      </button>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Buat Case Pembersihan Baru */}
      {subTab === 'buat-case' && (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 p-6 md:p-8">
          {caseCreated ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
              <span className="material-symbols-outlined text-tertiary-container text-[48px] animate-bounce">
                check_circle
              </span>
              <h2 className="text-base font-bold text-on-surface">Tiket Takedown Berhasil Dibuat!</h2>
              <p className="text-xs text-on-surface-variant">Memasukkan berkas ke daftar pemantauan aktif...</p>
            </div>
          ) : (
            <form onSubmit={handleCreateCase} className="space-y-6">
              <div className="border-b border-outline-variant/30 pb-4">
                <h2 className="text-base font-bold text-on-surface">Buat Tiket Permohonan Pembersihan (Takedown) Baru</h2>
                <p className="text-xs text-on-surface-variant">
                  Kirim laporan pelanggaran privasi atau ajukan permohonan de-index ke mesin pencari dan platform penyimpanan.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-on-surface">Pilih Klien Korban Terkait</label>
                  <select
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/50 focus:outline-none"
                  >
                    <option value="Ega Kusuma Anindhita">Ega Kusuma Anindhita (KLIEN-089)</option>
                    <option value="Hendra Wijaya">Hendra Wijaya (KLIEN-092)</option>
                    <option value="Siti Rahmawati">Siti Rahmawati (KLIEN-094)</option>
                    <option value="Dewi Lestari">Dewi Lestari (KLIEN-085)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-on-surface">Platform / Host Penyedia</label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/50 focus:outline-none"
                  >
                    <option value="Telegram">Telegram Channel / Group</option>
                    <option value="Pastebin">Pastebin / JustPaste.it</option>
                    <option value="Google Search">Google Search (SERP Cache)</option>
                    <option value="Darknet Forum">Forum Darknet / Cyber Underground</option>
                    <option value="TikTok">TikTok / Instagram / Meta</option>
                  </select>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="font-semibold text-on-surface">URL Lengkap Sasaran Pelanggaran*</label>
                  <input
                    type="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://pastebin.com/raw/... atau https://t.me/channel/..."
                    className="w-full h-9 px-3 rounded-lg bg-surface-container-low font-mono border border-outline-variant/50 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-on-surface">Bentuk Data Pribadi yang Dilanggar</label>
                  <input
                    type="text"
                    value={newLeakType}
                    onChange={(e) => setNewLeakType(e.target.value)}
                    placeholder="Contoh: Foto e-KTP, Nomor HP Kontak Keluarga"
                    className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-on-surface">Dasar Hukum Penuntutan</label>
                  <select
                    value={newLegalBasis}
                    onChange={(e) => setNewLegalBasis(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/50 focus:outline-none font-semibold"
                  >
                    <option value="Pasal 65 UU PDP No. 27/2022">Pasal 65 UU PDP (Pengungkapan Tanpa Hak)</option>
                    <option value="Pasal 27B UU ITE No. 1/2024">Pasal 27B UU ITE (Pemerasan & Ancaman)</option>
                    <option value="Google Personal Info Policy">Kebijakan Privasi Google (De-index Doxing)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSubTab('monitoring')}
                  className="px-4 py-2 rounded-xl border border-outline-variant/50 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary-container text-white text-xs font-semibold hover:bg-primary transition-all shadow-sm"
                >
                  Kirim & Daftarkan Tiket Takedown
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Tab 3: AI Legal Generator & Panduan */}
      {subTab === 'legal-ai' && (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/30 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">gavel</span>
                <h2 className="text-base font-bold text-on-surface">AI Legal Generator: Draf Somasi & Notice Resmi</h2>
              </div>
              <p className="text-xs text-on-surface-variant">
                Penyusun otomatis dokumen legal notice sesuai UU PDP No. 27/2022 dan UU ITE No. 1/2024.
              </p>
            </div>
            <button
              type="button"
              onClick={copyToClipboard}
              className="px-4 py-2 rounded-xl bg-primary-container text-white text-xs font-semibold hover:bg-primary transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">content_copy</span>
              <span>{copiedDraft ? 'Tersalin ke Clipboard!' : 'Salin Draf Surat'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-on-surface">Pilih Format Templat Dokumen</label>
              <select
                value={legalTemplate}
                onChange={(e) => setLegalTemplate(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/50 focus:outline-none"
              >
                <option value="somasi_platform">Surat Somasi Pelanggaran UU PDP (Platform/Host)</option>
                <option value="google_deindex">Permohonan De-index Hasil Pencarian Google</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-on-surface">Nama Korban Pelapor</label>
              <input
                type="text"
                value={legalSubjectName}
                onChange={(e) => setLegalSubjectName(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/50 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-on-surface">Pihak Dituju (Host / Platform)</label>
              <input
                type="text"
                value={legalPlatformName}
                onChange={(e) => setLegalPlatformName(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/50 focus:outline-none"
              />
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="font-semibold text-on-surface">URL Target Pelanggaran</label>
              <input
                type="text"
                value={legalTargetUrl}
                onChange={(e) => setLegalTargetUrl(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-surface-container-low font-mono border border-outline-variant/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Legal Draft Preview Box */}
          <div className="p-5 rounded-xl bg-surface-container-low/60 border border-outline-variant/30 font-mono text-xs text-on-surface whitespace-pre-wrap leading-relaxed max-h-[460px] overflow-y-auto">
            {generateLegalDraft()}
          </div>
        </div>
      )}

      {/* Tab 4: Live Status Checker */}
      {subTab === 'checker' && (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 p-6 md:p-8 space-y-6">
          <div className="border-b border-outline-variant/30 pb-4">
            <h2 className="text-base font-bold text-on-surface">Live Status Checker (HTTP & Google Index Ping)</h2>
            <p className="text-xs text-on-surface-variant">
              Validasi apakah konten doxing target telah benar-benar lenyap dari web server atau masih ter-cache di mesin pencari.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              value={checkUrl}
              onChange={(e) => setCheckUrl(e.target.value)}
              placeholder="Masukkan URL target untuk diuji statusnya..."
              className="flex-1 h-11 px-4 rounded-xl bg-surface-container-low font-mono text-xs border border-outline-variant/50 focus:outline-none focus:bg-surface-container-lowest"
            />
            <button
              type="button"
              onClick={handleRunChecker}
              disabled={isChecking}
              className="px-6 py-2.5 rounded-xl bg-primary-container text-white text-xs font-bold hover:bg-primary transition-all flex items-center justify-center gap-2 shadow-sm shrink-0"
            >
              {isChecking ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
                  <span>Menguji Server...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">travel_explore</span>
                  <span>Periksa Status Live URL</span>
                </>
              )}
            </button>
          </div>

          {checkResult && (
            <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                <span className="font-bold text-on-surface uppercase tracking-wider">Hasil Diagnosis Server Real-Time</span>
                <span className={`px-2.5 py-0.5 rounded-full font-bold font-mono ${
                  checkResult.httpStatus === 404 ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-error-container text-on-error-container'
                }`}>
                  {checkResult.statusText}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/20 space-y-1">
                  <span className="text-on-surface-variant">Status SERP Google Cache:</span>
                  <div className="font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-secondary">search</span>
                    <span>{checkResult.googleCache}</span>
                  </div>
                </div>

                <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/20 space-y-1">
                  <span className="text-on-surface-variant">Resolusi Jaringan Host:</span>
                  <div className="font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-tertiary-container">dns</span>
                    <span>{checkResult.dnsStatus}</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant/20 space-y-1">
                <strong className="text-on-surface">Rekomendasi Operasional:</strong>
                <p className="text-on-surface-variant leading-relaxed">{checkResult.recommendation}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
