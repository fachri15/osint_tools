import React, { useState, useEffect } from 'react';
import { dashboardApi, auditLogApi } from '../../services/api';

export function DashboardModule({ onSelectClient, onNavigateTab }) {
  const [selectedThreatFilter, setSelectedThreatFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('ops1'); // ops1 = Pusat Operasi 1, ops2 = Tampilan Taktis Cepat
  const [metrics, setMetrics] = useState([
    { id: 'total_diagnosa', title: 'Total Diagnosa', value: '0', unit: 'Target', subtitle: 'Target terverifikasi', change: 'Live', trend: 'up', icon: 'manage_search', iconBg: 'bg-primary-fixed text-on-primary-fixed' },
    { id: 'risiko_kritis', title: 'Risiko Kritis', value: '0', unit: 'Kasus', subtitle: 'Doxing aktif', change: 'Kritis', trend: 'critical', icon: 'crisis_alert', iconBg: 'bg-error-container text-on-error-container' },
    { id: 'konten_takedown', title: 'Konten Dihapus', value: '0', unit: 'URL', subtitle: 'Takedown platform', change: 'Live', trend: 'up', icon: 'auto_delete', iconBg: 'bg-tertiary-fixed text-on-tertiary-fixed' },
    { id: 'nomor_dc_terlacak', title: 'Nomor DC Terlacak', value: '0', unit: 'Sindikat', subtitle: 'Profil forensik & HLR', change: 'Aktif', trend: 'warning', icon: 'phone_in_talk', iconBg: 'bg-secondary-fixed text-on-secondary-fixed-variant' },
    { id: 'bap_siap_ekspor', title: 'BAP Siap Ekspor', value: '0', unit: 'Dokumen', subtitle: 'Format resmi SPKT', change: '100%', trend: 'up', icon: 'description', iconBg: 'bg-primary-fixed text-primary' },
    { id: 'integritas_data', title: 'Integritas Data', value: '100%', unit: 'Audit', subtitle: 'Enkripsi AES-256 GCM', change: 'Aman', trend: 'up', icon: 'verified_user', iconBg: 'bg-surface-container-highest text-primary-container' },
  ]);
  const [clients, setClients] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [statsRes, logsRes] = await Promise.all([
          dashboardApi.getStats(),
          auditLogApi.getAll({ limit: 6 }).catch(() => ({ data: [] })),
        ]);

        if (statsRes?.data) {
          if (statsRes.data.metrics && statsRes.data.metrics.length > 0) {
            setMetrics(statsRes.data.metrics);
          }
          if (statsRes.data.recentClients && statsRes.data.recentClients.length > 0) {
            const mapped = statsRes.data.recentClients.map(c => ({
              ...c,
              name: c.fullName || c.name,
              location: c.address || c.location || 'DKI Jakarta',
              dateRegistered: c.createdAt ? new Date(c.createdAt).toLocaleDateString('id-ID') : 'Hari ini',
              involvedFintechs: Array.isArray(c.involvedFintechs) ? c.involvedFintechs : [],
            }));
            setClients(mapped);
          }
        }

        if (logsRes?.data && logsRes.data.length > 0) {
          const mappedLogs = logsRes.data.map(l => ({
            module: l.module || 'FORENSIK',
            time: l.createdAt ? new Date(l.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Live',
            message: `${l.action} ${l.target ? `[${l.target}]` : ''} - ${l.result || 'Sukses'}`,
            author: l.actor || 'SYSTEM',
          }));
          setRecentLogs(mappedLogs);
        }
      } catch (err) {
        console.warn('Dashboard live stats error:', err.message);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  const filteredClients = clients.filter((client) => {
    if (selectedThreatFilter === 'ALL') return true;
    return client.threatLevel === selectedThreatFilter;
  });

  return (
    <div className="flex flex-col w-full gap-6 pb-12 mt-10">
      {/* Operational Header & Action Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex p-1.5 rounded-lg bg-primary-container text-white shadow-sm">
              <span className="material-symbols-outlined text-[20px]">shield</span>
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-on-surface tracking-tight">
              Dashboard Ringkasan & Pusat Operasi
            </h1>
            <div className="hidden sm:flex items-center gap-1 ml-2 bg-surface-container p-1 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setViewMode('ops1')}
                className={`px-2.5 py-1 rounded-md transition-all font-semibold ${
                  viewMode === 'ops1' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant'
                }`}
              >
                Pusat Operasi 1
              </button>
              <button
                type="button"
                onClick={() => setViewMode('ops2')}
                className={`px-2.5 py-1 rounded-md transition-all font-semibold ${
                  viewMode === 'ops2' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant'
                }`}
              >
                Mode Taktis 2
              </button>
            </div>
          </div>
          <p className="text-xs md:text-sm text-on-surface-variant max-w-3xl leading-relaxed">
            Pemantauan intelijen siber terpadu, deteksi paparan doxing, dan asistensi hukum real-time. Standar operasional forensik sesuai UU PDP No. 27/2022.
          </p>
        </div>

        {/* Quick Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigateTab('data-klien', 'register')}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">person_add</span>
            <span>Registrasi Klien</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('diagnosa-jejak-digital')}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-secondary">radar</span>
            <span>Diagnosa Mandiri</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('asisten-removal')}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-tertiary-container">auto_delete</span>
            <span>Case Removal</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('investigasi-dc-dan-laporan', 'report')}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary-container hover:bg-primary text-white text-xs font-semibold shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">gavel</span>
            <span>Buat Laporan Polisi</span>
          </button>
        </div>
      </div>

      {/* Emergency Notice Banner (Panduan Darurat Teror Pinjol Ilegal) */}
      <div className="relative overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/30">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-error"></div>
        <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-error-container text-on-error-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[26px]">crisis_alert</span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-sm md:text-base font-bold text-on-surface">
                  Prosedur Tanggap Darurat: Teror & Pelecehan Pinjol Ilegal
                </span>
                <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-[10px] font-bold uppercase tracking-wider">
                  Respon Segera
                </span>
              </div>
              <p className="text-xs text-on-surface-variant max-w-xl">
                Ikuti protokol defensif ini segera setelah terdeteksi ancaman penyebaran data pribadi (doxing) atau kontak darurat ilegal.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 max-w-3xl pl-0 lg:pl-6 border-t lg:border-t-0 lg:border-l border-outline-variant/30 pt-4 lg:pt-0">
            {/* Step 1 */}
            <div className="flex flex-col p-3 rounded-xl bg-surface-container-low">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="material-symbols-outlined text-error text-[18px]">phonelink_erase</span>
                <span className="text-xs font-bold text-on-surface">Tindakan Pengamanan Cepat</span>
              </div>
              <ul className="text-xs text-on-surface-variant space-y-1">
                <li className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-error shrink-0"></span>
                  <span>Blokir nomor penagih di kontak seluler & WA</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-error shrink-0"></span>
                  <span>Cabut izin akses kontak & galeri di pengaturan HP</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-error shrink-0"></span>
                  <span>Amankan tangkapan layar digital utuh (bukti BAP)</span>
                </li>
              </ul>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col p-3 rounded-xl bg-surface-container-low">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="material-symbols-outlined text-secondary text-[18px]">headset_mic</span>
                <span className="text-xs font-bold text-on-surface">Saluran Bantuan Resmi Pemerintah</span>
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div className="flex items-center justify-between p-1.5 bg-surface-container-lowest rounded-lg border border-outline-variant/20">
                  <span className="text-on-surface-variant">OJK:</span>
                  <span className="font-bold text-primary">157</span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-surface-container-lowest rounded-lg border border-outline-variant/20">
                  <span className="text-on-surface-variant">Bareskrim:</span>
                  <span className="font-bold text-secondary">patrolisiber.id</span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-surface-container-lowest rounded-lg border border-outline-variant/20">
                  <span className="text-on-surface-variant">Satgas PASTI:</span>
                  <span className="font-bold text-tertiary-container">0811-5050-100</span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-surface-container-lowest rounded-lg border border-outline-variant/20">
                  <span className="text-on-surface-variant">LBH Jakarta:</span>
                  <span className="font-bold text-on-surface">021-3145-518</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Executive KPI Metrics Ribbon (6 Cards High Density) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metrics.map((kpi) => (
          <div
            key={kpi.id}
            className="flex flex-col justify-between p-4 rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md border border-outline-variant/30 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                {kpi.title}
              </span>
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${kpi.iconBg}`}>
                <span className="material-symbols-outlined text-[18px]">{kpi.icon}</span>
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-on-surface leading-none">{kpi.value}</span>
                <span className={`text-[11px] font-bold flex items-center ${
                  kpi.trend === 'critical' ? 'text-error' : 'text-tertiary-container'
                }`}>
                  {kpi.change}
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1.5 truncate">{kpi.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Operational Data Grid + Telemetry Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Active Target Telemetry Table */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
            <div className="p-5 border-b border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-low/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-container text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">monitoring</span>
                </div>
                <div>
                  <h2 className="text-sm md:text-base font-bold text-on-surface">
                    Target Telemetri Aktif Dalam Pemantauan Forensik
                  </h2>
                  <span className="text-xs text-on-surface-variant">
                    Daftar klien terdaftar dengan indikasi kebocoran dan teror aktif
                  </span>
                </div>
              </div>

              {/* Threat Filter Pills */}
              <div className="flex items-center gap-1.5 bg-surface-container p-1 rounded-lg text-xs">
                {['ALL', 'CRITICAL', 'HIGH', 'MODERATE'].map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setSelectedThreatFilter(filter)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                      selectedThreatFilter === filter
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container-low text-on-surface-variant uppercase text-[10px] tracking-wider font-semibold border-b border-outline-variant/30">
                  <tr>
                    <th className="py-3 px-4">Subjek / Klien</th>
                    <th className="py-3 px-4">NIK Terdaftar</th>
                    <th className="py-3 px-4">Kategori Kasus</th>
                    <th className="py-3 px-4">Skor Risiko</th>
                    <th className="py-3 px-4">Status Mitigasi</th>
                    <th className="py-3 px-4 text-right">Aksi Forensik</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {isLoading ? (
                    <tr>
                      <td colSpan="6" className="py-10 text-center text-xs text-on-surface-variant">
                        <span className="material-symbols-outlined text-[24px] text-primary animate-spin mb-1">sync</span>
                        <p>Memuat telemetri klien dari MySQL...</p>
                      </td>
                    </tr>
                  ) : filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-10 text-center text-xs text-on-surface-variant">
                        <span className="material-symbols-outlined text-[24px] text-on-surface-variant/40 mb-1">group_off</span>
                        <p>Belum ada target aktif terdaftar dalam basis data.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client) => (
                      <tr
                        key={client.id}
                      className="hover:bg-surface-container-low/60 transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center font-bold text-primary text-xs">
                            {client.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-on-surface block group-hover:text-primary transition-colors">
                              {client.name}
                            </span>
                            <span className="text-[10px] font-mono text-on-surface-variant">{client.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-on-surface">
                        {client.nik}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-on-surface font-medium block truncate max-w-[180px]">
                          {client.caseCategory}
                        </span>
                        <span className="text-[10px] text-on-surface-variant font-mono">
                          {client.involvedFintechs.slice(0, 2).join(', ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            client.threatLevel === 'CRITICAL'
                              ? 'bg-error-container text-on-error-container'
                              : client.threatLevel === 'HIGH'
                              ? 'bg-warning-container text-warning'
                              : 'bg-secondary-fixed text-on-secondary-fixed-variant'
                          }`}>
                            {client.riskScore}/100
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-on-surface">
                          <span className={`h-2 w-2 rounded-full ${
                            client.status.includes('Aktif') ? 'bg-error animate-ping' : 'bg-tertiary-container'
                          }`}></span>
                          {client.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectClient(client)}
                            className="px-2.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary text-[11px] font-semibold transition-colors flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">visibility</span>
                            <span>Detail 360°</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-surface-container-low/40 border-t border-outline-variant/30 flex items-center justify-between text-xs text-on-surface-variant">
              <span>Menampilkan {filteredClients.length} dari {clients.length} target aktif</span>
              <button
                type="button"
                onClick={() => onNavigateTab('data-klien')}
                className="text-primary font-semibold hover:underline flex items-center gap-1"
              >
                <span>Kelola Seluruh Klien</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Threat Exposure Distribution Matrix */}
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">bubble_chart</span>
                <h3 className="text-sm font-bold text-on-surface">Matriks Distribusi Paparan Doxing & Pelanggaran</h3>
              </div>
              <span className="text-[11px] font-mono text-on-surface-variant">PERIODE OKTOBER 2026</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-error-container/40 border border-error/20 flex flex-col justify-between">
                <span className="text-on-error-container font-semibold">Doxing Kontak HP</span>
                <span className="text-xl font-bold text-error mt-2">
                  {clients.length > 0 ? `${Math.round((clients.filter(c => c.caseCategory?.includes('Kontak')).length / clients.length) * 100)}%` : '0%'}
                </span>
                <span className="text-[10px] text-on-surface-variant mt-1">
                  {clients.filter(c => c.caseCategory?.includes('Kontak')).length} dari {clients.length} klien terdaftar
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between">
                <span className="text-on-surface font-semibold">Foto KTP & Berkas</span>
                <span className="text-xl font-bold text-primary mt-2">
                  {clients.length > 0 ? `${Math.round((clients.filter(c => c.caseCategory?.includes('Doxing') || c.notes?.includes('KTP')).length / clients.length) * 100)}%` : '0%'}
                </span>
                <span className="text-[10px] text-on-surface-variant mt-1">
                  {clients.filter(c => c.caseCategory?.includes('Doxing') || c.notes?.includes('KTP')).length} dari {clients.length} klien terdaftar
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between">
                <span className="text-on-surface font-semibold">Penyelidikan DC</span>
                <span className="text-xl font-bold text-secondary mt-2">
                  {metrics.find(m => m.id === 'nomor_dc_terlacak')?.value || '0'}
                </span>
                <span className="text-[10px] text-on-surface-variant mt-1">
                  Sindikat penagih aktif terlacak
                </span>
              </div>
              <div className="p-3 rounded-xl bg-tertiary-fixed/30 border border-tertiary/20 flex flex-col justify-between">
                <span className="text-on-tertiary-fixed-variant font-semibold">Takedown Berhasil</span>
                <span className="text-xl font-bold text-tertiary-container mt-2">
                  {metrics.find(m => m.id === 'konten_takedown')?.value || '0'}
                </span>
                <span className="text-[10px] text-on-surface-variant mt-1">
                  URL berhasil dihapus bersih
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Live Telemetry Stream & Quick Hotline Triage */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Live Telemetry Stream Logs */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
            <div className="p-4 bg-surface-container-low flex items-center justify-between border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-tertiary-container animate-pulse"></span>
                <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  Alur Intelijen Real-Time
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-container text-primary font-bold">
                LIVE STREAM
              </span>
            </div>

            <div className="p-4 space-y-3.5 max-h-[380px] overflow-y-auto font-mono text-xs">
              {recentLogs.length > 0 ? (
                recentLogs.map((log, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start border-l-2 border-primary/40 pl-3 py-0.5">
                    <div className="flex flex-col gap-0.5 w-full">
                      <div className="flex items-center justify-between text-[10px] text-on-surface-variant">
                        <span className="font-bold text-primary">{log.module}</span>
                        <span>{log.time}</span>
                      </div>
                      <p className="text-[11px] text-on-surface font-sans leading-snug mt-0.5">
                        {log.message}
                      </p>
                      <span className="text-[10px] text-outline mt-0.5">AUTH: {log.author}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-on-surface-variant font-sans">
                  <span className="material-symbols-outlined text-[24px] text-primary mb-1">sync</span>
                  <p>Memuat telemetri audit dari database MySQL...</p>
                </div>
              )}
            </div>

            <div className="p-3 bg-surface-container-low/40 border-t border-outline-variant/30 text-center">
              <button
                type="button"
                onClick={() => onNavigateTab('riwayat-dan-tracking')}
                className="text-primary text-xs font-semibold hover:underline"
              >
                Lihat Semua Audit Forensik &rarr;
              </button>
            </div>
          </div>

          {/* Hotline Triage Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#002c98] to-[#163bac] text-white shadow-md space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">support_agent</span>
              </div>
              <div>
                <h3 className="font-bold text-sm">Pusat Intervensi Cepat</h3>
                <span className="text-[11px] text-white/80">Eskalasi Penegakan Hukum Instan</span>
              </div>
            </div>
            
            <p className="text-xs text-white/90 leading-relaxed">
              Jika ada indikasi ancaman keselamatan fisik atau pemerasan masif terhadap anak/keluarga, hubungi jalur koordinasi Bareskrim langsung.
            </p>

            <div className="space-y-2 pt-1 font-mono text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/10">
                <span>Hotline Siber Polri:</span>
                <span className="font-bold">110 / patrolisiber.id</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/10">
                <span>OJK Satgas Pemberantasan:</span>
                <span className="font-bold">157 / 081-157-157-157</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('investigasi-dc-dan-laporan', 'report')}
              className="w-full py-2.5 rounded-xl bg-white text-primary font-semibold text-xs hover:bg-white/95 transition-all shadow-sm"
            >
              Generate Draft BAP Pengaduan Resmi &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
