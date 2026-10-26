import React, { useState } from 'react';

export function Header({ activeTab, setActiveTab, onOpenAuthModal, onOpenQuickScan, currentUser, onLogout }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [notifications] = useState([
    {
      id: 1,
      title: 'Takedown Berhasil',
      desc: 'URL forum.darkleak-asia.net terkonfirmasi HTTP 404',
      time: '5 menit lalu',
      unread: true,
      icon: 'check_circle',
      color: 'text-tertiary-container'
    },
    {
      id: 2,
      title: 'Ancaman Kritis Baru',
      desc: 'Target KLIEN-089: Terdeteksi 2 nomor DC VoIP baru',
      time: '18 menit lalu',
      unread: true,
      icon: 'crisis_alert',
      color: 'text-error'
    },
    {
      id: 3,
      title: 'Pembaruan API HIBP',
      desc: 'Kueri breach v3 selesai dengan 100% throughput',
      time: '1 jam lalu',
      unread: false,
      icon: 'database',
      color: 'text-secondary'
    }
  ]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'data-klien', label: 'Data Klien', icon: 'group' },
    { id: 'diagnosa-jejak-digital', label: 'Diagnosa Jejak Digital', icon: 'radar' },
    { id: 'asisten-removal', label: 'Asisten Removal', icon: 'auto_delete' },
    { id: 'investigasi-dc-dan-laporan', label: 'Investigasi DC & Laporan', icon: 'phone_in_talk' },
    { id: 'riwayat-dan-tracking', label: 'Riwayat & Tracking', icon: 'history' },
    { id: 'pengaturan', label: 'Pengaturan', icon: 'settings' },
  ];

  return (
    <header className="fixed pt-5 pb-5 top-0 left-0 right-0 z-50 bg-surface-container-lowest border-b border-outline-variant/40 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="max-w-[1440px] mx-auto px-4 md:px-gutter">
        {/* Top Tier: Logo, Search, System Health, User */}
        <div className="h-16 flex items-center justify-between gap-4 border-b border-outline-variant/30">
          {/* Brand Logo & Title */}
          <div 
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-container via-primary to-[#0e1d52] flex items-center justify-center text-white shadow-md shadow-primary/20 shrink-0">
              <span className="material-symbols-outlined text-[24px]">shield</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base md:text-lg text-primary tracking-tight leading-tight">
                  Menyalahati Cyber Intelligence
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-primary-fixed text-on-primary-fixed uppercase tracking-wider">
                  OSINT v2.8
                </span>
              </div>
              <span className="text-[11px] text-on-surface-variant font-medium">
                Anti-Doxing & Forensic Operations System
              </span>
            </div>
          </div>

          {/* Central Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-md mx-4">
            <div className="relative w-full flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari entitas, NIK, domain, nomor seluler, IOC hash..."
                className="w-full h-10 pl-10 pr-20 bg-surface-container-low text-on-surface placeholder:text-outline text-xs md:text-sm rounded-lg border border-outline-variant/50 focus:outline-none focus:border-primary-container focus:bg-surface-container-lowest transition-all"
              />
              <div className="absolute right-2.5 flex items-center pointer-events-none">
                <kbd className="px-1.5 py-0.5 font-mono text-[10px] text-on-surface-variant bg-surface-container border border-outline-variant/50 rounded">
                  Ctrl+K
                </kbd>
              </div>
            </div>
          </div>

          {/* Right Action Icons & User Profile */}
          <div className="flex items-center gap-3">
            {/* Live System Status Indicator */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1 bg-surface-container-low rounded-full border border-outline-variant/40">
              <span className="h-2 w-2 rounded-full bg-tertiary-container animate-pulse"></span>
              <span className="text-xs text-tertiary-container font-semibold">
                Sistem Online - API Aktif 5/5
              </span>
            </div>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                title="Pemberitahuan Sistem"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-error ring-2 ring-surface-container-lowest"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/30 py-2 z-50">
                  <div className="px-4 py-2 border-b border-outline-variant/20 flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface uppercase tracking-wider">Notifikasi Forensik</span>
                    <span className="text-[10px] bg-error-container text-on-error-container px-1.5 py-0.5 rounded font-bold">2 Baru</span>
                  </div>
                  <div className="divide-y divide-outline-variant/10 max-h-72 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className="p-3 hover:bg-surface-container-low transition-colors flex gap-2.5">
                        <span className={`material-symbols-outlined text-[18px] ${n.color} shrink-0 mt-0.5`}>
                          {n.icon}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-on-surface">{n.title}</span>
                          <span className="text-[11px] text-on-surface-variant leading-tight mt-0.5">{n.desc}</span>
                          <span className="text-[10px] text-outline font-mono mt-1">{n.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Auth Modal Trigger */}
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
              title="Autentikasi & Keamanan Admin"
            >
              <span className="material-symbols-outlined text-[20px]">lock</span>
            </button>

            {/* User Profile Info with Dropdown */}
            <div className="relative">
              <div 
                className="flex items-center gap-2.5 pl-3 border-l border-outline-variant/40 cursor-pointer select-none"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
              >
                <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {currentUser?.fullName ? currentUser.fullName.slice(0, 2).toUpperCase() : 'AU'}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-on-surface font-semibold">
                      {currentUser?.fullName || 'Administrator Utama'}
                    </span>
                    <span className="px-1.5 py-0.2 bg-primary-fixed text-on-primary-fixed text-[10px] rounded uppercase font-bold">
                      {currentUser?.role || 'Superadmin'}
                    </span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-mono leading-none">
                    {currentUser?.nip || 'ANL-7709-ID'}
                  </span>
                </div>
                <span className="material-symbols-outlined text-outline text-[18px]">
                  {showUserDropdown ? 'arrow_drop_up' : 'arrow_drop_down'}
                </span>
              </div>

              {/* User Actions Dropdown */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-52 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/40 p-2 z-50 animate-fadeIn text-xs">
                  <div className="p-2 border-b border-outline-variant/20 mb-1">
                    <span className="font-bold text-on-surface block">{currentUser?.fullName || 'Administrator'}</span>
                    <span className="text-[10px] text-on-surface-variant font-mono">{currentUser?.nip || 'ANL-7709-ID'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenAuthModal();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-container-low flex items-center gap-2 text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">verified_user</span>
                    <span>Verifikasi 2FA</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserDropdown(false);
                      if (onLogout) onLogout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-error-container text-error flex items-center gap-2 font-semibold"
                  >
                    <span className="material-symbols-outlined text-[16px]">logout</span>
                    <span>Keluar (Logout)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lower Tier: Main Navigation Menu Ribbons */}
        <nav className="h-12 flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-primary-container text-white font-semibold shadow-sm shadow-primary/20'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
