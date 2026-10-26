import React, { useState } from 'react';

export function ClientDetailModal({ client, onClose, onLaunchTakedown, onGenerateBap }) {
  const [showFullNik, setShowFullNik] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  if (!client) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface-container-lowest rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-outline-variant/40 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-surface-container-low to-surface-container flex items-center justify-between border-b border-outline-variant/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-container text-white flex items-center justify-center shadow-md shadow-primary/20">
              <span className="material-symbols-outlined text-[26px]">badge</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-bold">
                  {client.id}
                </span>
                <h2 className="text-lg font-bold text-on-surface">{client.name}</h2>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  client.threatLevel === 'CRITICAL' 
                    ? 'bg-error-container text-on-error-container'
                    : 'bg-secondary-fixed text-on-secondary-fixed-variant'
                }`}>
                  {client.threatLevel} RISK
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {client.caseCategory} • Terdaftar sejak {client.dateRegistered}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-highest transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-5 border-b border-outline-variant/20 flex gap-4 text-xs font-semibold bg-surface-container-lowest">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-primary-container text-primary font-bold'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">person</span>
            <span>Profil Subjek 360°</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('threats')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'threats'
                ? 'border-primary-container text-primary font-bold'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">warning</span>
            <span>Matriks Ancaman & Doxing ({client.activeThreats})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('evidence')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'evidence'
                ? 'border-primary-container text-primary font-bold'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">inventory_2</span>
            <span>Arsip Bukti Forensik & Legal</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-surface">
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Identity & Contact Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-3">
                  <span className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[16px]">fingerprint</span>
                    Data Kependudukan (Valid Dukcapil)
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-outline-variant/10">
                      <span className="text-on-surface-variant">NIK Resmi:</span>
                      <div className="flex items-center gap-2 font-mono font-semibold">
                        <span>{showFullNik ? client.nikFull : client.nik}</span>
                        <button
                          type="button"
                          onClick={() => setShowFullNik(!showFullNik)}
                          className="text-primary hover:underline text-[10px]"
                        >
                          {showFullNik ? 'Sensor' : 'Buka'}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between py-1 border-b border-outline-variant/10">
                      <span className="text-on-surface-variant">Domisili KTP:</span>
                      <span className="font-medium text-right text-on-surface">{client.location}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-outline-variant/10">
                      <span className="text-on-surface-variant">Analis Penanggungjawab:</span>
                      <span className="font-mono text-primary font-semibold">{client.assignedAnalyst}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-3">
                  <span className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-secondary text-[16px]">contact_phone</span>
                    Kanal Komunikasi Terpapar
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-outline-variant/10">
                      <span className="text-on-surface-variant">Nomor Handphone:</span>
                      <span className="font-mono font-semibold text-on-surface">{client.phone}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-outline-variant/10">
                      <span className="text-on-surface-variant">Alamat Email:</span>
                      <span className="font-mono text-on-surface">{client.email}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-outline-variant/10">
                      <span className="text-on-surface-variant">Skor Risiko Doxing:</span>
                      <div className="flex items-center gap-1.5 font-bold text-error">
                        <span className="material-symbols-outlined text-[14px]">speed</span>
                        <span>{client.riskScore} / 100</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legal Basis & Notes */}
              <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-2">
                <span className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-tertiary-container text-[16px]">gavel</span>
                  Rekomendasi Dasar Hukum Penuntutan
                </span>
                <p className="text-xs text-primary font-mono font-semibold p-2.5 bg-surface-container rounded-lg">
                  {client.legalBasis}
                </p>
                <div className="text-xs text-on-surface-variant mt-2">
                  <strong className="text-on-surface">Kronologi Ringkas Kasus:</strong>
                  <p className="mt-1 leading-relaxed">{client.notes}</p>
                </div>
              </div>

              {/* Involved Illegal Fintech Apps */}
              <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-2">
                <span className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-error text-[16px]">account_balance</span>
                  Platform Pinjol Ilegal Teridentifikasi
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(client.involvedFintechs || []).map((fin, idx) => (
                    <span 
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-error-container text-on-error-container font-medium text-xs flex items-center gap-1.5"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-error"></span>
                      {fin}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'threats' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-error-container/40 border border-error/20 flex items-center gap-3">
                <span className="material-symbols-outlined text-error text-[24px]">crisis_alert</span>
                <div className="text-xs">
                  <span className="font-bold text-error">Status Mitigasi Kritis: Level 1 Aktif</span>
                  <p className="text-on-surface-variant">
                    Sindikat DC melakukan penagihan agresif ke 3 nomor kontak kantor dan kontak darurat.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-error text-[20px]">phone_disabled</span>
                    <div className="text-xs">
                      <span className="font-semibold text-on-surface">Spam SMS & Robocall Autodialer</span>
                      <p className="text-on-surface-variant">Terdeteksi 120+ upaya panggilan harian dari nomor VoIP Indosat</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-error-container text-error">AKTIF</span>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary text-[20px]">group_remove</span>
                    <div className="text-xs">
                      <span className="font-semibold text-on-surface">Penyebaran Kontak Darurat di Telegram</span>
                      <p className="text-on-surface-variant">Kanal t.me/database_penagihan_nasabah memuat nomor keluarga</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed-variant">SEDANG TAKEDOWN</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'evidence' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-[24px]">image</span>
                  <div className="text-xs">
                    <span className="font-semibold text-on-surface">Bukti-Chat-Ancaman-WA.png</span>
                    <p className="text-on-surface-variant font-mono">SHA256: 4f12...89a1 • Ukuran: 1.8 MB</p>
                  </div>
                </div>
                <span className="text-xs text-primary font-semibold hover:underline cursor-pointer">Lihat Berkas</span>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-tertiary-container text-[24px]">picture_as_pdf</span>
                  <div className="text-xs">
                    <span className="font-semibold text-on-surface">Surat-Kuasa-Pendampingan-Hukum.pdf</span>
                    <p className="text-on-surface-variant font-mono">Tanda Tangan Elektronik e-Meterai Tervalidasi</p>
                  </div>
                </div>
                <span className="text-xs text-primary font-semibold hover:underline cursor-pointer">Unduh PDF</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/30 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-mono text-on-surface-variant">
            STATUS: <span className="text-tertiary-container font-semibold">TERVALIDASI DUKCAPIL</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onLaunchTakedown && onLaunchTakedown(client);
              }}
              className="px-3.5 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">auto_delete</span>
              <span>Buka Case Removal</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onGenerateBap && onGenerateBap(client);
              }}
              className="px-4 py-2 rounded-lg bg-primary-container hover:bg-primary text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">gavel</span>
              <span>Buat Laporan Polisi (BAP)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
