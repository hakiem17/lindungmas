import React, { useState, useEffect } from 'react';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import DashboardEksekutif from './components/dashboard/DashboardEksekutif';
import FormInputPelanggar from './components/pelanggar/FormInputPelanggar';
import RekapPelanggarTable from './components/pelanggar/RekapPelanggarTable';
import DetailPelanggarModal from './components/pelanggar/DetailPelanggarModal';
import PetaSpasialHST from './components/spasial/PetaSpasialHST';
import PatroliMonitoring from './components/patroli/PatroliMonitoring';
import VerifikasiPengaduan from './components/pengaduan/VerifikasiPengaduan';
import KanalPengaduanPublik from './components/pengaduan/KanalPengaduanPublik';
import ReferensiPerdaHST from './components/perda/ReferensiPerdaHST';
import BukuRegisterPengaduan from './components/pengaduan/BukuRegisterPengaduan';
import MasterPegawai from './components/master/MasterPegawai';
import MasterWilayah from './components/master/MasterWilayah';
import MasterPelapor from './components/master/MasterPelapor';
import LandingPage from './components/landing/LandingPage';
import LoginPage from './components/auth/LoginPage';
import { 
  initStorage, 
  getPelanggarList, 
  getPelanggaranList, 
  getPengaduanList, 
  getPatroliList,
  getRekapTrantibumList,
  getPegawaiList,
  getWilayahList,
  getPerdaList,
  getPelaporList,
  getAuthSession,
  saveAuthSession,
  clearAuthSession
} from './data/storageService';

export default function App() {
  // Navigation Flow State: 'landing' | 'login' | 'app'
  const [currentUser, setCurrentUser] = useState(() => getAuthSession());
  const [currentView, setCurrentView] = useState(() => (getAuthSession() ? 'app' : 'landing'));

  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeRole, setActiveRole] = useState(() => {
    const session = getAuthSession();
    return session?.peran || 'user';
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isPublicPortalOpen, setIsPublicPortalOpen] = useState(false);
  const [publicPortalTab, setPublicPortalTab] = useState('buat'); // 'buat' | 'lacak'
  const [publicPortalTicket, setPublicPortalTicket] = useState('');

  const handleOpenPublicPortal = (tab = 'buat', ticket = '') => {
    setPublicPortalTab(tab);
    setPublicPortalTicket(ticket);
    setIsPublicPortalOpen(true);
  };
  
  // Data State
  const [pelanggarList, setPelanggarList] = useState([]);
  const [pelanggaranList, setPelanggaranList] = useState([]);
  const [pengaduanList, setPengaduanList] = useState([]);
  const [patroliList, setPatroliList] = useState([]);
  const [rekapTrantibumList, setRekapTrantibumList] = useState([]);
  const [pegawaiList, setPegawaiList] = useState([]);
  const [wilayahList, setWilayahList] = useState([]);
  const [perdaList, setPerdaList] = useState([]);
  const [pelaporList, setPelaporList] = useState([]);

  // Selected Detail Modal
  const [selectedPelanggaran, setSelectedPelanggaran] = useState(null);

  // Initialize and load data
  const refreshAllData = () => {
    initStorage();
    setPelanggarList(getPelanggarList());
    setPelanggaranList(getPelanggaranList());
    setPengaduanList(getPengaduanList());
    setPatroliList(getPatroliList());
    setRekapTrantibumList(getRekapTrantibumList());
    setPegawaiList(getPegawaiList());
    setWilayahList(getWilayahList());
    setPerdaList(getPerdaList());
    setPelaporList(getPelaporList());
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // Flow Navigation Handlers
  const handleGoToLanding = () => {
    setCurrentView('landing');
  };

  const handleGoToLogin = () => {
    setCurrentView('login');
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    if (user?.peran) {
      setActiveRole(user.peran);
    }
    setCurrentView('app');
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    clearAuthSession();
    setCurrentUser(null);
    setCurrentView('landing');
  };

  const handleViolationCreated = (newRecord) => {
    refreshAllData();
    setSelectedPelanggaran(newRecord);
  };

  const handleViolationUpdated = (updatedRecord) => {
    refreshAllData();
    setSelectedPelanggaran(updatedRecord);
  };

  const handleConvertToViolation = (report) => {
    setActiveTab('input');
  };

  const handleNewViolationFromPatrol = (patrol) => {
    setActiveTab('input');
  };

  // =========================================================================
  // VIEW 1: LANDING PAGE (PORTAL PUBLIK)
  // =========================================================================
  if (currentView === 'landing') {
    return (
      <>
        <LandingPage
          onNavigateToLogin={handleGoToLogin}
          onOpenPublicPortal={handleOpenPublicPortal}
        />

        {/* Public Complaint Portal Modal accessible without login */}
        <KanalPengaduanPublik
          isOpen={isPublicPortalOpen}
          initialTab={publicPortalTab}
          initialTicket={publicPortalTicket}
          onClose={() => {
            setIsPublicPortalOpen(false);
            refreshAllData();
          }}
        />
      </>
    );
  }

  // =========================================================================
  // VIEW 2: LOGIN PAGE (PORTAL MASUK PETUGAS)
  // =========================================================================
  if (currentView === 'login') {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onBackToLanding={handleGoToLanding}
      />
    );
  }

  // =========================================================================
  // VIEW 3: MAIN APP (DASHBOARD & OPERASIONAL)
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#F5F6F8] flex">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onNavigateToLanding={handleGoToLanding}
        onLogout={handleLogout}
        counts={{
          pelanggaran: pelanggaranList.length,
          rekapTrantibum: rekapTrantibumList.length,
          patroli: patroliList.filter(p => p.status === 'berlangsung').length,
          pengaduan: pengaduanList.filter(p => p.status === 'menunggu_verifikasi').length,
          pegawai: pegawaiList.length,
          pelapor: pelaporList.length,
          kecamatan: wilayahList.length,
          perda: perdaList.length
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navbar */}
        <Navbar
          activeRole={activeRole}
          onRoleChange={setActiveRole}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onOpenPublicPortal={() => setIsPublicPortalOpen(true)}
          currentUser={currentUser}
          onNavigateToLanding={handleGoToLanding}
          onLogout={handleLogout}
        />

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full">
          {activeTab === 'dashboard' && (
            <DashboardEksekutif
              pelanggaranList={pelanggaranList}
              pelanggarList={pelanggarList}
              patroliList={patroliList}
              pengaduanList={pengaduanList}
              onNavigateTab={setActiveTab}
              onSelectPelanggaran={(item) => setSelectedPelanggaran(item)}
            />
          )}

          {activeTab === 'register_pengaduan' && (
            <BukuRegisterPengaduan
              rekapList={rekapTrantibumList}
              onRefreshData={refreshAllData}
            />
          )}

          {activeTab === 'input' && (
            <FormInputPelanggar
              onSuccess={handleViolationCreated}
              onViewDetail={(item) => setSelectedPelanggaran(item)}
            />
          )}

          {activeTab === 'rekap' && (
            <RekapPelanggarTable
              pelanggaranList={pelanggaranList}
              onSelectPelanggaran={(item) => setSelectedPelanggaran(item)}
            />
          )}

          {activeTab === 'spasial' && (
            <PetaSpasialHST
              pelanggaranList={pelanggaranList}
              rekapTrantibumList={rekapTrantibumList}
              onSelectPelanggaran={(item) => setSelectedPelanggaran(item)}
            />
          )}

          {activeTab === 'patroli' && (
            <PatroliMonitoring
              patroliList={patroliList}
              onUpdatePatroli={refreshAllData}
              onNewViolationFromPatrol={handleNewViolationFromPatrol}
            />
          )}

          {activeTab === 'pengaduan' && (
            <VerifikasiPengaduan
              pengaduanList={pengaduanList}
              onUpdate={refreshAllData}
              onConvertToViolation={handleConvertToViolation}
            />
          )}

          {activeTab === 'perda' && (
            <ReferensiPerdaHST
              perdaList={perdaList}
              onRefreshData={refreshAllData}
            />
          )}

          {activeTab === 'master_pegawai' && (
            <MasterPegawai
              pegawaiList={pegawaiList}
              onRefreshData={refreshAllData}
            />
          )}

          {activeTab === 'master_pelapor' && (
            <MasterPelapor
              pelaporList={pelaporList}
              onRefreshData={refreshAllData}
            />
          )}

          {activeTab === 'master_wilayah' && (
            <MasterWilayah
              wilayahList={wilayahList}
              onRefreshData={refreshAllData}
            />
          )}
        </main>
      </div>

      {/* LEVEL 2 DETAIL & STEPPER MODAL */}
      <DetailPelanggarModal
        isOpen={!!selectedPelanggaran}
        onClose={() => setSelectedPelanggaran(null)}
        pelanggaran={selectedPelanggaran}
        onUpdatePelanggaran={handleViolationUpdated}
      />

      {/* PUBLIC COMPLAINT PORTAL MODAL */}
      <KanalPengaduanPublik
        isOpen={isPublicPortalOpen}
        initialTab={publicPortalTab}
        initialTicket={publicPortalTicket}
        onClose={() => {
          setIsPublicPortalOpen(false);
          refreshAllData();
        }}
      />
    </div>
  );
}
