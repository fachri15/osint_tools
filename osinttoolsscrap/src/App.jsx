import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ClientDetailModal } from './components/ClientDetailModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { AdminLoginScreen } from './components/AdminLoginScreen';
import { authApi } from './services/api';

import { DashboardModule } from './components/modules/DashboardModule';
import { DataKlienModule } from './components/modules/DataKlienModule';
import { DiagnosaJejakDigitalModule } from './components/modules/DiagnosaJejakDigitalModule';
import { AsistenRemovalModule } from './components/modules/AsistenRemovalModule';
import { InvestigasiDCModule } from './components/modules/InvestigasiDCModule';
import { RiwayatTrackingModule } from './components/modules/RiwayatTrackingModule';
import { PengaturanModule } from './components/modules/PengaturanModule';

export function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [subParam, setSubParam] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Authentication State: Enforce Login First
  const [isAuthenticated, setIsAuthenticated] = useState(() => authApi.isAuthenticated());
  const [currentUser, setCurrentUser] = useState(() => authApi.getCurrentUser());

  useEffect(() => {
    if (isAuthenticated) {
      // Refresh user profil from MySQL jika ada token
      authApi.getMe()
        .then(res => {
          if (res.user) {
            setCurrentUser(res.user);
          }
        })
        .catch(() => {
          // Jika token invalid/expired, reset ke screen login
          authApi.logout();
          setIsAuthenticated(false);
          setCurrentUser(null);
        });
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    authApi.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  // Navigation helper that can also set a sub-view
  const handleNavigateTab = (tabId, param = null) => {
    let target = tabId;
    if (tabId === 'investigasi-dc-laporan' || tabId === 'investigasi-dc') {
      target = 'investigasi-dc-dan-laporan';
    } else if (tabId === 'riwayat-tracking') {
      target = 'riwayat-dan-tracking';
    }
    setActiveTab(target);
    setSubParam(param);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLaunchTakedownFromClient = (client) => {
    handleNavigateTab('asisten-removal');
  };

  const handleGenerateBapFromClient = (client) => {
    handleNavigateTab('investigasi-dc-dan-laporan', { subTab: 'report', client });
  };

  // Jika belum login admin, tampilkan AdminLoginScreen terlebih dahulu
  if (!isAuthenticated) {
    return (
      <AdminLoginScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface antialiased font-sans">
      {/* Fixed Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSubParam(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="w-full pt-28 flex-1 bg-background">
        <div className="max-w-[1440px] mx-auto px-4 md:px-gutter py-6">
          {activeTab === 'dashboard' && (
            <DashboardModule
              onSelectClient={(client) => setSelectedClient(client)}
              onNavigateTab={handleNavigateTab}
            />
          )}

          {activeTab === 'data-klien' && (
            <DataKlienModule
              initialSubTab={subParam === 'register' ? 'registrasi' : 'daftar'}
              onSelectClient={(client) => setSelectedClient(client)}
              onNavigateTab={handleNavigateTab}
            />
          )}

          {activeTab === 'diagnosa-jejak-digital' && (
            <DiagnosaJejakDigitalModule
              onNavigateTab={handleNavigateTab}
              initialScan={subParam}
            />
          )}

          {activeTab === 'asisten-removal' && (
            <AsistenRemovalModule
              onNavigateTab={handleNavigateTab}
            />
          )}

          {activeTab === 'investigasi-dc-dan-laporan' && (
            <InvestigasiDCModule
              initialSubTab={typeof subParam === 'string' ? subParam : (subParam?.subTab || 'profiling')}
              initialClient={typeof subParam === 'object' ? subParam?.client : null}
            />
          )}

          {activeTab === 'riwayat-dan-tracking' && (
            <RiwayatTrackingModule
              onNavigateTab={handleNavigateTab}
            />
          )}

          {activeTab === 'pengaturan' && (
            <PengaturanModule />
          )}
        </div>
      </main>

      {/* Persistent Enterprise Footer */}
      <Footer />

      {/* Modals */}
      <ClientDetailModal
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
        onLaunchTakedown={handleLaunchTakedownFromClient}
        onGenerateBap={handleGenerateBapFromClient}
      />

      <AdminAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default App;
