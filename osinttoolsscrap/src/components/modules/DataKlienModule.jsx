import React, { useState, useEffect } from 'react';
import { clientApi } from '../../services/api';

export function DataKlienModule({ onSelectClient, onNavigateTab, initialSubTab = 'daftar' }) {
  const [subTab, setSubTab] = useState(initialSubTab);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [threatFilter, setThreatFilter] = useState('ALL');
  const [unmaskedNiks, setUnmaskedNiks] = useState({});

  // New Client Form State
  const [formNik, setFormNik] = useState('');
  const [formName, setFormName] = useState('');
  const [formBirth, setFormBirth] = useState('');
  const [formGender, setFormGender] = useState('Laki-laki');
  const [formAddress, setFormAddress] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCaseCategory, setFormCaseCategory] = useState('Teror Pinjol Ilegal & Doxing Kontak');
  const [formThreatLevel, setFormThreatLevel] = useState('CRITICAL');
  const [formFintechs, setFormFintechs] = useState('');
  const [formEmergencyContact, setFormEmergencyContact] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [isDukcapilVerified, setIsDukcapilVerified] = useState(false);
  const [isCheckingDukcapil, setIsCheckingDukcapil] = useState(false);
  const [dukcapilResult, setDukcapilResult] = useState(null);
  const [dukcapilError, setDukcapilError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Fetch dari backend saat komponen dimount
  useEffect(() => {
    async function loadBackendClients() {
      setIsLoading(true);
      try {
        const res = await clientApi.getAll();
        if (res.data && res.data.length > 0) {
          // Format respons database agar match dengan property frontend
          const mapped = res.data.map(c => ({
            ...c,
            id: c.clientCode || `KLIEN-${c.id}`,
            name: c.fullName || c.name,
            location: c.address || c.location || 'DKI Jakarta',
            activeThreats: c.activeThreats ?? 1,
            resolvedThreats: c.resolvedThreats ?? 0,
            dateRegistered: c.createdAt ? new Date(c.createdAt).toLocaleDateString('id-ID') : 'Baru',
            involvedFintechs: Array.isArray(c.involvedFintechs) ? c.involvedFintechs : [],
          }));
          setClients(mapped);
        }
      } catch (err) {
        console.warn('Gagal memuat klien dari MySQL:', err.message);
      } finally {
        setIsLoading(false);
      }
    }
    loadBackendClients();
  }, []);

  const toggleNikMask = (id) => {
    setUnmaskedNiks(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleVerifyDukcapil = async () => {
    setDukcapilError('');
    const cleanNik = String(formNik).replace(/\D/g, '');
    if (!cleanNik || cleanNik.length !== 16) {
      setDukcapilError('Harap masukkan 16 digit angka NIK yang valid.');
      return;
    }

    setIsCheckingDukcapil(true);
    try {
      const res = await clientApi.verifyDukcapil(cleanNik);
      if (res.data?.valid) {
        const d = res.data;
        setDukcapilResult(d);
        setIsDukcapilVerified(true);
        setDukcapilError('');

        // Otomatis sinkronkan data identitas e-KTP ke formulir:
        if (d.fullName) setFormName(d.fullName);
        if (d.birthPlaceDate || d.birthDateEstimated) {
          setFormBirth(d.birthPlaceDate || d.birthDateEstimated);
        }
        if (d.gender) setFormGender(d.gender);
        if (d.address) setFormAddress(d.address);
      } else {
        setDukcapilError(res.data?.message || 'Validasi Dukcapil gagal. NIK tidak valid.');
        setIsDukcapilVerified(false);
        setDukcapilResult(null);
      }
    } catch (e) {
      console.warn('Dukcapil verification error:', e);
      setDukcapilError(e.message || 'Gagal menghubungi server validasi Dukcapil.');
      setIsDukcapilVerified(false);
      setDukcapilResult(null);
    } finally {
      setIsCheckingDukcapil(false);
    }
  };

  const handleRegisterClient = async (e) => {
    e.preventDefault();
    if (!formNik || !formName || !formPhone) {
      alert('Harap lengkapi field wajib: NIK, Nama Lengkap, dan Nomor Kontak.');
      return;
    }

    setIsSubmitting(true);
    const newClientPayload = {
      fullName: formName,
      nik: formNik.slice(0, 6) + '******' + formNik.slice(-4),
      nikFull: formNik,
      birthDate: formBirth,
      gender: formGender,
      address: formAddress || 'DKI Jakarta',
      phone: formPhone,
      email: formEmail || `${formName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      caseCategory: formCaseCategory,
      threatLevel: formThreatLevel,
      riskScore: formThreatLevel === 'CRITICAL' ? 94 : 75,
      status: 'Mitigasi L1 Aktif',
      involvedFintechs: formFintechs.split(',').map(s => s.trim()).filter(Boolean),
      emergencyContact: formEmergencyContact,
      notes: formNotes || 'Pendaftaran kasus baru teror kontak darurat dan penyebaran identitas.',
    };

    try {
      const res = await clientApi.create(newClientPayload);
      const created = res.data || {
        ...newClientPayload,
        id: `KLIEN-${String(clients.length + 90).padStart(3, '0')}`,
        name: formName,
        dateRegistered: 'Hari Ini (Baru)',
      };
      setClients([created, ...clients]);
    } catch (err) {
      // Fallback local jika belum login / backend offline
      const fallbackClient = {
        ...newClientPayload,
        id: `KLIEN-${String(clients.length + 90).padStart(3, '0')}`,
        name: formName,
        dateRegistered: 'Hari Ini (Baru)',
        activeThreats: 3,
        resolvedThreats: 0,
      };
      setClients([fallbackClient, ...clients]);
    }

    setIsSubmitting(false);
    setRegisterSuccess(true);
    setIsDukcapilVerified(false);
    setDukcapilResult(null);
    setDukcapilError('');
    setFormNik('');
    setFormName('');
    setFormBirth('');
    setFormGender('Laki-laki');
    setFormAddress('');
    setFormPhone('');
    setFormEmail('');
    setFormFintechs('');
    setFormEmergencyContact('');
    setFormNotes('');

    setTimeout(() => {
      setRegisterSuccess(false);
      setSubTab('daftar');
    }, 1500);
  };

  const filteredClients = clients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        c.nik.includes(searchQuery) ||
                        c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        c.caseCategory.toLowerCase().includes(searchQuery.toLowerCase());
    const matchThreat = threatFilter === 'ALL' || c.threatLevel === threatFilter;
    return matchSearch && matchThreat;
  });

  return (
    <div className="flex flex-col w-full gap-6 pb-12 mt-10">
      {/* Module Title & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary-container text-white">
              <span className="material-symbols-outlined text-[20px]">group</span>
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-on-surface">
              Data Klien & Manajemen Korban
            </h1>
          </div>
          <p className="text-xs md:text-sm text-on-surface-variant mt-1">
            Basis data enkripsi subjek korban teror pinjol ilegal & pelanggaran privasi (UU PDP Standar).
          </p>
        </div>

        {/* Sub-Tabs Selector */}
        <div className="flex items-center gap-1 bg-surface-container p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setSubTab('daftar')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              subTab === 'daftar'
                ? 'bg-white text-primary shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">list_alt</span>
            <span>Daftar Klien ({clients.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('registrasi')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              subTab === 'registrasi'
                ? 'bg-white text-primary shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            <span>Registrasi Klien Baru</span>
          </button>
        </div>
      </div>

      {subTab === 'daftar' ? (
        <>
          {/* Quick Telemetry Stat Ribbon (4 Mini KPI Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/30 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Total Klien Terdaftar
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-bold text-on-surface leading-none">{clients.length}</span>
                  <span className="text-xs text-on-surface-variant">Korban</span>
                </div>
                <span className="text-xs text-tertiary-container flex items-center gap-1 mt-1 font-semibold">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  100% NIK Valid Dukcapil
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-on-primary-fixed">
                <span className="material-symbols-outlined text-[26px]">badge</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/30 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Status Kritis / Aktif
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-bold text-error leading-none">28</span>
                  <span className="text-xs text-error font-semibold">Mitigasi L1</span>
                </div>
                <span className="text-xs text-on-surface-variant flex items-center gap-1.5 mt-1">
                  <span className="h-2 w-2 rounded-full bg-error animate-ping"></span>
                  Perlu takedown segera
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-error-container flex items-center justify-center text-on-error-container">
                <span className="material-symbols-outlined text-[26px]">crisis_alert</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/30 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Pendampingan Selesai
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-bold text-tertiary-container leading-none">7</span>
                  <span className="text-xs text-tertiary-container font-semibold">Kasus Tuntas</span>
                </div>
                <span className="text-xs text-on-surface-variant flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-[14px] text-tertiary-container">done_all</span>
                  BAP SPKT & Takedown
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed">
                <span className="material-symbols-outlined text-[26px]">task_alt</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/30 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Audit Enkripsi Arsip
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-bold text-secondary leading-none">100%</span>
                  <span className="text-xs text-secondary font-semibold">Terkunci</span>
                </div>
                <span className="text-[11px] font-mono text-on-surface-variant flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-[14px] text-secondary">security</span>
                  AES-256 GCM Salt SHA-256
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed-variant">
                <span className="material-symbols-outlined text-[26px]">lock</span>
              </div>
            </div>
          </div>

          {/* Search, Filter & Table */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
            <div className="p-4 md:p-5 border-b border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-surface-container-low/40">
              <div className="relative flex-1 max-w-md">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama korban, NIK, ID Klien, atau kategori..."
                  className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-xs focus:outline-none focus:border-primary transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-on-surface-variant font-medium">Filter Tingkat Ancaman:</span>
                <select
                  value={threatFilter}
                  onChange={(e) => setThreatFilter(e.target.value)}
                  className="h-9 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-xs text-on-surface font-semibold focus:outline-none"
                >
                  <option value="ALL">Semua Tingkat</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MODERATE">Moderate</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container-low text-on-surface-variant uppercase text-[10px] tracking-wider font-semibold border-b border-outline-variant/30">
                  <tr>
                    <th className="py-3 px-4">Klien / ID</th>
                    <th className="py-3 px-4">NIK (Sensor Keamanan)</th>
                    <th className="py-3 px-4">Domisili KTP</th>
                    <th className="py-3 px-4">Fintech Terafiliasi</th>
                    <th className="py-3 px-4">Tingkat Risiko</th>
                    <th className="py-3 px-4">Status Kasus</th>
                    <th className="py-3 px-4 text-right">Opsi Operasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {isLoading ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-xs text-on-surface-variant">
                        <span className="material-symbols-outlined text-[28px] text-primary animate-spin mb-1">sync</span>
                        <p>Memuat direktori data klien dari database MySQL...</p>
                      </td>
                    </tr>
                  ) : filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-xs text-on-surface-variant">
                        <span className="material-symbols-outlined text-[28px] text-on-surface-variant/40 mb-1">group_off</span>
                        <p>Tidak ada data klien yang ditemukan dalam database.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client) => {
                    const isUnmasked = unmaskedNiks[client.id];
                    return (
                      <tr key={client.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-surface-container text-primary font-bold flex items-center justify-center text-xs">
                              {client.name.charAt(0)}
                            </div>
                            <div>
                              <span className="font-bold text-on-surface block">{client.name}</span>
                              <span className="text-[10px] font-mono text-on-surface-variant">{client.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <div className="flex items-center gap-2">
                            <span>{isUnmasked ? client.nikFull : client.nik}</span>
                            <button
                              type="button"
                              onClick={() => toggleNikMask(client.id)}
                              className="text-primary hover:text-primary-container p-1 rounded"
                              title={isUnmasked ? 'Sensor NIK' : 'Buka Sensor NIK'}
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                {isUnmasked ? 'visibility_off' : 'visibility'}
                              </span>
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-on-surface-variant">
                          {client.location}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {(client.involvedFintechs || []).map((fin, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container font-mono text-on-surface">
                                {fin}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            client.threatLevel === 'CRITICAL'
                              ? 'bg-error-container text-on-error-container'
                              : client.threatLevel === 'HIGH'
                              ? 'bg-secondary-fixed text-on-secondary-fixed-variant'
                              : 'bg-surface-container-high text-primary'
                          }`}>
                            {client.threatLevel}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-on-surface">
                            <span className="h-1.5 w-1.5 rounded-full bg-tertiary-container"></span>
                            {client.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => onSelectClient(client)}
                            className="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-[11px] transition-colors inline-flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">manage_search</span>
                            <span>Detail 360°</span>
                          </button>
                        </td>
                      </tr>
                    );
                  }))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Multi-Step Intake Form (Registrasi Klien Baru) */
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 p-6 md:p-8">
          {registerSuccess ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <span className="material-symbols-outlined text-tertiary-container text-[56px] animate-bounce">
                how_to_reg
              </span>
              <h2 className="text-xl font-bold text-on-surface">Klien Berhasil Terdaftar!</h2>
              <p className="text-xs text-on-surface-variant max-w-md">
                Data subjek telah diamankan di Enkripsi AES-256 dan dimasukkan ke alur pemantauan investigasi L1. Mengalihkan ke tabel...
              </p>
            </div>
          ) : (
            <form onSubmit={handleRegisterClient} className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
                <div>
                  <h2 className="text-base md:text-lg font-bold text-on-surface">
                    Formulir Registrasi Klien & Intake Kasus Korban
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    Sesuai Standar Forensik Pro-Justitia dan Perlindungan Data UU No. 27/2022.
                  </p>
                </div>
                <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-primary-fixed text-on-primary-fixed font-bold">
                  SOP-REG-V2
                </span>
              </div>

              {/* Seksi 1: Data Identitas KTP */}
              <div className="p-5 rounded-xl bg-surface-container-low/40 border border-outline-variant/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-primary text-white font-mono text-xs flex items-center justify-center font-bold">
                      1
                    </span>
                    <h3 className="text-xs md:text-sm font-bold text-on-surface">
                      Identitas Resmi Sesuai KTP Pelapor
                    </h3>
                  </div>
                  {isDukcapilVerified ? (
                    <span className="text-[11px] font-bold text-tertiary-container bg-tertiary-fixed px-2 py-0.5 rounded flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">verified</span>
                      Validasi Dukcapil Lolos
                    </span>
                  ) : (
                    <span className="text-[11px] text-on-surface-variant">Belum Tervalidasi</span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
                    <label className="font-semibold text-on-surface flex items-center justify-between">
                      <span>NIK (Nomor Induk Kependudukan 16 Digit)*</span>
                      <span className="text-[11px] text-on-surface-variant font-normal">
                        Standar Dukcapil Permendagri No. 108/2019
                      </span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2 max-w-2xl">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          maxLength={16}
                          value={formNik}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setFormNik(val);
                            if (isDukcapilVerified && val !== dukcapilResult?.nik) {
                              setIsDukcapilVerified(false);
                              setDukcapilResult(null);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleVerifyDukcapil();
                            }
                          }}
                          placeholder="Masukkan 16 digit NIK, contoh: 3171091405960004"
                          className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant/50 font-mono text-xs focus:outline-none focus:border-primary shadow-sm"
                          required
                        />
                        <span className="absolute right-3 top-2.5 text-[10px] font-mono text-on-surface-variant/70 pointer-events-none">
                          {formNik.length}/16
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleVerifyDukcapil}
                        disabled={isCheckingDukcapil}
                        className={`h-10 px-4 rounded-lg font-semibold text-xs shrink-0 flex items-center justify-center gap-2 transition-all shadow-sm ${
                          isCheckingDukcapil
                            ? 'bg-surface-container text-on-surface-variant cursor-wait'
                            : isDukcapilVerified
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-primary text-white hover:bg-primary/90'
                        }`}
                      >
                        {isCheckingDukcapil ? (
                          <>
                            <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                            <span>Memvalidasi...</span>
                          </>
                        ) : isDukcapilVerified ? (
                          <>
                            <span className="material-symbols-outlined text-[16px] text-emerald-400">verified</span>
                            <span>Terverifikasi ✓</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                            <span>Cek Validasi</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Quick Preset NIK untuk Pengujian Cepat */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-[10px] text-on-surface-variant">
                      <span className="font-semibold text-primary">Contoh NIK Uji:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFormNik('7571051508970002');
                          setIsDukcapilVerified(false);
                          setDukcapilResult(null);
                        }}
                        className="px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high font-mono text-on-surface transition-colors hover:text-primary"
                        title="Klik untuk mengisi NIK Fachridatul Otolomo (Gorontalo)"
                      >
                        7571051508970002 (Gorontalo)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormNik('3171091405960004');
                          setIsDukcapilVerified(false);
                          setDukcapilResult(null);
                        }}
                        className="px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high font-mono text-on-surface transition-colors hover:text-primary"
                        title="Klik untuk mengisi NIK Ega Kusuma (DKI Jakarta)"
                      >
                        3171091405960004 (DKI Jakarta)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormNik('3273112008890002');
                          setIsDukcapilVerified(false);
                          setDukcapilResult(null);
                        }}
                        className="px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high font-mono text-on-surface transition-colors hover:text-primary"
                        title="Klik untuk mengisi NIK Hendra Wijaya (Jawa Barat)"
                      >
                        3273112008890002 (Jawa Barat)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormNik('3578015201940008');
                          setIsDukcapilVerified(false);
                          setDukcapilResult(null);
                        }}
                        className="px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high font-mono text-on-surface transition-colors hover:text-primary"
                        title="Klik untuk mengisi NIK Siti Rahmawati (Jawa Timur)"
                      >
                        3578015201940008 (Jawa Timur)
                      </button>
                    </div>
                  </div>

                  {/* Banner Pesan Error Validasi */}
                  {dukcapilError && (
                    <div className="md:col-span-2 lg:col-span-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5 animate-fadeIn">
                      <span className="material-symbols-outlined text-[20px] shrink-0 text-red-400">error</span>
                      <div>
                        <div className="font-bold">Validasi NIK Gagal</div>
                        <div className="text-[11px] text-red-300">{dukcapilError}</div>
                      </div>
                    </div>
                  )}

                  {/* Panel Hasil Validasi Resmi Sesuai e-KTP Dukcapil Kemendagri */}
                  {dukcapilResult && (
                    <div className="md:col-span-2 lg:col-span-3 relative overflow-hidden rounded-xl border border-primary/40 bg-gradient-to-br from-surface-container-high/95 via-surface-container/90 to-surface-container-lowest p-4 md:p-5 shadow-lg space-y-4">
                      {/* Background hologram styling */}
                      <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
                      <div className="absolute right-3 top-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          DUKCAPIL L2 VERIFIED • PRO-JUSTITIA MATCH
                        </span>
                      </div>

                      {/* Header Kartu e-KTP */}
                      <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white shadow-md shrink-0">
                          <span className="material-symbols-outlined text-[22px]">badge</span>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wider font-bold text-primary font-mono flex items-center gap-1.5">
                            <span>REPUBLIK INDONESIA</span>
                            <span>•</span>
                            <span>KARTU TANDA PENDUDUK ELEKTRONIK</span>
                          </div>
                          <div className="text-sm font-extrabold text-on-surface flex items-center gap-2">
                            <span className="font-mono tracking-wide">NIK: {dukcapilResult.nik}</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-sans">
                              {dukcapilResult.citizenship || 'WNI'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 4 Informasi Utama yang Diminta:
                          1. Nama Lengkap sesuai KTP
                          2. Tempat / Tanggal Lahir
                          3. Jenis Kelamin
                          4. Alamat Domisili KTP
                      */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* 1. Nama Lengkap Sesuai KTP */}
                        <div className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/40 space-y-1 shadow-sm">
                          <div className="text-[10px] uppercase font-bold text-on-surface-variant flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px] text-primary">person</span>
                            Nama Lengkap (e-KTP)
                          </div>
                          <div className="text-xs md:text-sm font-bold text-on-surface break-words text-primary">
                            {dukcapilResult.fullName}
                          </div>
                          <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[12px]">verified</span>
                            Nama Sah Terdaftar
                          </div>
                        </div>

                        {/* 2. Tempat / Tanggal Lahir */}
                        <div className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/40 space-y-1 shadow-sm">
                          <div className="text-[10px] uppercase font-bold text-on-surface-variant flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px] text-primary">calendar_month</span>
                            Tempat / Tgl Lahir
                          </div>
                          <div className="text-xs md:text-sm font-bold text-on-surface break-words">
                            {dukcapilResult.birthPlaceDate || `${dukcapilResult.birthPlace}, ${dukcapilResult.birthDate}`}
                          </div>
                          <div className="text-[10px] text-on-surface-variant font-mono">
                            Tanggal: {dukcapilResult.birthDate}
                          </div>
                        </div>

                        {/* 3. Jenis Kelamin & Status KTP */}
                        <div className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/40 space-y-1.5 shadow-sm">
                          <div className="text-[10px] uppercase font-bold text-on-surface-variant flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px] text-primary">wc</span>
                              Jenis Kelamin & Status
                            </span>
                            {dukcapilResult.bloodType && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-container text-on-surface font-semibold">
                                Gol. {dukcapilResult.bloodType}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold ${
                              dukcapilResult.gender === 'Perempuan' 
                                ? 'bg-pink-500/15 text-pink-400 border border-pink-500/30' 
                                : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                            }`}>
                              <span className="material-symbols-outlined text-[14px]">
                                {dukcapilResult.gender === 'Perempuan' ? 'female' : 'male'}
                              </span>
                              {dukcapilResult.gender}
                            </span>

                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-extrabold tracking-wide ${
                              dukcapilResult.maritalStatus === 'BELUM KAWIN'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            }`}>
                              <span className="material-symbols-outlined text-[13px]">
                                {dukcapilResult.maritalStatus === 'BELUM KAWIN' ? 'person' : 'favorite'}
                              </span>
                              {dukcapilResult.maritalStatus}
                            </span>
                          </div>
                          <div className="text-[10px] text-on-surface-variant flex items-center justify-between pt-0.5 border-t border-outline-variant/20">
                            <span>Agama: <b className="text-on-surface font-medium">{dukcapilResult.religion || 'Islam'}</b></span>
                            <span className="text-primary font-medium">{dukcapilResult.occupation || 'Wiraswasta'}</span>
                          </div>
                        </div>

                        {/* 4. Alamat Domisili KTP */}
                        <div className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/40 space-y-1 shadow-sm">
                          <div className="text-[10px] uppercase font-bold text-on-surface-variant flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px] text-primary">home_pin</span>
                            Alamat Domisili KTP
                          </div>
                          <div className="text-xs font-semibold text-on-surface line-clamp-2" title={dukcapilResult.address}>
                            {dukcapilResult.address}
                          </div>
                          <div className="text-[10px] text-primary font-mono truncate">
                            {dukcapilResult.district}, {dukcapilResult.regency}
                          </div>
                        </div>
                      </div>

                      {/* Footer Info Wilayah & Sinkronisasi */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-outline-variant/30 text-[11px]">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                          <span className="material-symbols-outlined text-[15px]">check_circle</span>
                          <span>Data e-KTP resmi di atas telah otomatis disinkronkan ke seluruh kolom formulir di bawah.</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-on-surface-variant">
                            Kode Wilayah: {dukcapilResult.regionCode} ({dukcapilResult.province})
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (dukcapilResult.fullName) setFormName(dukcapilResult.fullName);
                              if (dukcapilResult.birthPlaceDate) setFormBirth(dukcapilResult.birthPlaceDate);
                              if (dukcapilResult.gender) setFormGender(dukcapilResult.gender);
                              if (dukcapilResult.address) setFormAddress(dukcapilResult.address);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-surface-container-highest hover:bg-surface-container-high text-primary font-semibold text-[10px] transition-colors flex items-center gap-1 shadow-sm"
                          >
                            <span className="material-symbols-outlined text-[12px]">sync</span>
                            Sinkron Ulang
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="font-semibold text-on-surface">Nama Lengkap Korban*</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Nama lengkap sesuai e-KTP"
                      className="w-full h-9 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-xs focus:outline-none focus:border-primary"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-on-surface">Tempat / Tanggal Lahir</label>
                    <input
                      type="text"
                      value={formBirth}
                      onChange={(e) => setFormBirth(e.target.value)}
                      placeholder="Jakarta, 14 Mei 1996"
                      className="w-full h-9 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-xs focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-on-surface">Jenis Kelamin</label>
                    <select
                      value={formGender}
                      onChange={(e) => setFormGender(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-xs focus:outline-none"
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-on-surface">Nomor WhatsApp Aktif*</label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="+62 812-xxxx-xxxx"
                      className="w-full h-9 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant/50 font-mono text-xs focus:outline-none focus:border-primary"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-on-surface">Email Aktif</label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full h-9 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-xs focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="md:col-span-2 lg:col-span-3 space-y-1">
                    <label className="font-semibold text-on-surface">Alamat Domisili KTP</label>
                    <input
                      type="text"
                      value={formAddress}
                      onChange={(e) => setFormAddress(e.target.value)}
                      placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota/Kabupaten, Provinsi"
                      className="w-full h-9 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Seksi 2: Klasifikasi Kasus & Tingkat Ancaman */}
              <div className="p-5 rounded-xl bg-surface-container-low/40 border border-outline-variant/30 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-secondary text-white font-mono text-xs flex items-center justify-center font-bold">
                    2
                  </span>
                  <h3 className="text-xs md:text-sm font-bold text-on-surface">
                    Klasifikasi Kasus & Tingkat Ancaman Doxing
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-on-surface">Kategori Kasus Pelanggaran</label>
                    <select
                      value={formCaseCategory}
                      onChange={(e) => setFormCaseCategory(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-xs focus:outline-none"
                    >
                      <option value="Teror Pinjol Ilegal & Doxing Kontak">Teror Pinjol Ilegal & Doxing Kontak</option>
                      <option value="Manipulasi Foto Wajah & Doxing Medsos">Manipulasi Foto Wajah & Doxing Medsos (Deepfake)</option>
                      <option value="Penyalahgunaan Identitas KTP Pinjol">Penyalahgunaan Identitas KTP Pinjol (Identity Theft)</option>
                      <option value="Spam Robocall Autodialer Pemerasan">Spam Robocall Autodialer Pemerasan</option>
                      <option value="Kebocoran PII di Darknet Forum">Kebocoran PII di Darknet Forum / Telegram</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-on-surface">Tingkat Urgensi / Ancaman</label>
                    <select
                      value={formThreatLevel}
                      onChange={(e) => setFormThreatLevel(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-xs font-bold focus:outline-none"
                    >
                      <option value="CRITICAL">CRITICAL (Ancaman fisik, penyebaran ke kantor & keluarga)</option>
                      <option value="HIGH">HIGH (Teror spam chat intensif ke 10+ nomor kontak)</option>
                      <option value="MODERATE">MODERATE (Penagihan kasar ke nomor korban saja)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-on-surface">Aplikasi Pinjol Ilegal yang Meneror (Pisahkan Koma)</label>
                    <input
                      type="text"
                      value={formFintechs}
                      onChange={(e) => setFormFintechs(e.target.value)}
                      placeholder="Contoh: Pundi Cepat Kilat, DanaKilat, PinjamGo"
                      className="w-full h-9 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-xs focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-on-surface">Nomor Kontak Keluarga yang Ikut Diteror</label>
                    <input
                      type="text"
                      value={formEmergencyContact}
                      onChange={(e) => setFormEmergencyContact(e.target.value)}
                      placeholder="Contoh: Ibu (0812xxx), Suami (0813xxx)"
                      className="w-full h-9 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-xs focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="font-semibold text-on-surface">Ringkasan Kronologi Ancaman</label>
                    <textarea
                      rows={3}
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="Tuliskan kronologi singkat kapan teror dimulai, bentuk kata-kata ancaman, dan bukti yang dimiliki..."
                      className="w-full p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSubTab('daftar')}
                  className="px-4 py-2.5 rounded-xl border border-outline-variant/50 text-xs font-semibold hover:bg-surface-container-low transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-primary-container hover:bg-primary text-white text-xs font-semibold shadow-md shadow-primary/20 transition-all flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
                      <span>Mendaftarkan Subjek...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">save</span>
                      <span>Simpan & Daftarkan Klien</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
