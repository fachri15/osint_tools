import React from 'react';

export function Footer() {
  return (
    <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/40 mt-auto py-8">
      <div className="max-w-[1440px] mx-auto px-4 md:px-gutter">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 border-b border-outline-variant/30 text-xs">
          {/* Col 1 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">shield</span>
              <span className="font-bold text-on-surface text-sm">Menyalahati Cyber Intelligence</span>
            </div>
            <p className="text-on-surface-variant leading-relaxed">
              Sistem Operasional Intelijen Siber Terpadu & Pendampingan Korban Doxing / Pinjol Ilegal. Berbasis regulasi hukum Republik Indonesia.
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-mono text-tertiary-container font-semibold">
              <span className="h-2 w-2 rounded-full bg-tertiary-container"></span>
              STATUS: ZERO-TRUST ENCRYPTION ACTIVE
            </div>
          </div>

          {/* Col 2 */}
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-on-surface uppercase tracking-wider text-[11px]">Kepatuhan Hukum & Regulasi</span>
            <ul className="space-y-1.5 text-on-surface-variant">
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-primary">gavel</span>
                <span>UU PDP No. 27 Tahun 2022</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-primary">gavel</span>
                <span>UU ITE No. 1 Tahun 2024 (Revisi Ke-2)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-primary">verified</span>
                <span>Standar ISO/IEC 27037:2012 Forensik</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-primary">verified</span>
                <span>Pro-Justitia Evidentiary Standard</span>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-on-surface uppercase tracking-wider text-[11px]">Saluran Pengaduan Pemerintah</span>
            <ul className="space-y-1.5 text-on-surface-variant font-mono">
              <li className="flex items-center justify-between p-1.5 rounded bg-surface-container-low">
                <span>OJK Kontak:</span>
                <span className="font-bold text-primary">157</span>
              </li>
              <li className="flex items-center justify-between p-1.5 rounded bg-surface-container-low">
                <span>Satgas PASTI WA:</span>
                <span className="font-bold text-tertiary-container">0811-5050-100</span>
              </li>
              <li className="flex items-center justify-between p-1.5 rounded bg-surface-container-low">
                <span>Bareskrim Polri:</span>
                <span className="font-bold text-secondary">patrolisiber.id</span>
              </li>
              <li className="flex items-center justify-between p-1.5 rounded bg-surface-container-low">
                <span>Kominfo Aduan:</span>
                <span className="font-bold">aduan.id</span>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-on-surface uppercase tracking-wider text-[11px]">Audit Keamanan Digital</span>
            <p className="text-on-surface-variant text-[11px] leading-relaxed">
              Seluruh data subjek, log kueri HLR, dan tangkapan layar dienkripsi dengan standar AES-256 GCM pada penyimpanan dingin (air-gapped storage).
            </p>
            <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 font-mono text-[10px] text-on-surface-variant space-y-1">
              <div>SIGNATURE: <span className="text-primary font-bold">SHA256:4FA190...89D2</span></div>
              <div>VERIFIER: <span className="text-tertiary-container font-bold">INTERNAL ROOT CA VALID</span></div>
            </div>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-on-surface-variant">
          <span>&copy; 2026 Menyalahati Cyber Intelligence. All Rights Reserved. Hak Cipta Dilindungi Undang-Undang.</span>
          <div className="flex items-center gap-4">
            <span className="hover:text-primary cursor-pointer">Kebijakan Privasi</span>
            <span className="hover:text-primary cursor-pointer">SOP Forensik</span>
            <span className="hover:text-primary cursor-pointer">Dokumentasi API</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
