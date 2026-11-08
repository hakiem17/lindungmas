import React, { useState, useEffect } from 'react';
import { supabase } from './data/supabaseClient';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import DashboardEksekutif from './components/dashboard/DashboardEksekutif';
import FormInputPelanggar from './components/pelanggar/FormInputPelanggar';
import RekapPelanggarTable from './components/pelanggar/RekapPelanggarTable';
import DetailPelanggarModal from './components/pelanggar/DetailPelanggarModal';
import PetaSpasialHST from './components/spasial/PetaSpasialHST';
import VerifikasiPengaduan from './components/pengaduan/VerifikasiPengaduan';
import BukuRegisterPengaduan from './components/pengaduan/BukuRegisterPengaduan';
import MasterPegawai from './components/master/MasterPegawai';
import MasterWilayah from './components/master/MasterWilayah';
import MasterFasilitasPoskamling from './components/master/MasterFasilitasPoskamling';
import DataSatlinmas from './components/satlinmas/DataSatlinmas';
import DataPoskamling from './components/poskamling/DataPoskamling';
import KegiatanPatroli from './components/patroli/KegiatanPatroli';
import CetakKartuAnggota from './components/kartu/CetakKartuAnggota';
import ProfilAnggotaLinmas from './components/linmas/ProfilAnggotaLinmas';
import ProfilPengguna from './components/pengguna/ProfilPengguna';
import LaporanRekapSatlinmas from './components/laporan/LaporanRekapSatlinmas';
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
  getProfilPenggunaList,
  getWilayahList,
  getPerdaList,
  getPelaporList,
  getSatlinmasList,
  getPoskamlingList,
  getKegiatanPatroliList,
  getFasilitasPoskamlingList,
  getAuthSession,
  saveAuthSession,
  clearAuthSession,
  fetchDatabaseData,
  forceDatabaseSync,
  subscribeToLiveDatabase
} from './data/storageService';

// Komponen Pelindung ErrorBoundary untuk mencegah Halaman Blank Putih jika terjadi error render
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('LINDUNGMAS Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0F2A4A] flex items-center justify-center p-4 text-white font-sans">
          <div className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/20 p-7 rounded-3xl text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-[#F0B429] text-[#0F2A4A] flex items-center justify-center mx-auto text-3xl font-bold shadow-lg">
              🛡️
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">LINDUNGMAS HST</h2>
              <p className="text-xs text-amber-300 font-semibold mt-1">Pemulihan Tampilan Halaman</p>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Sistem mendeteksi kendala pada pemuatan tampilan. Klik tombol di bawah untuk menyegarkan dan kembali ke halaman utama secara normal.
            </p>
            {this.state.error && (
              <div className="text-left bg-black/40 border border-white/10 rounded-xl p-3 text-[11px] font-mono text-rose-300 overflow-x-auto max-h-36">
                <p className="font-bold text-rose-400">{String(this.state.error?.message || this.state.error)}</p>
                {this.state.error?.stack && (
                  <p className="text-[9.5px] text-slate-400 mt-1 whitespace-pre-wrap">{this.state.error.stack.split('\n').slice(0, 4).join('\n')}</p>
                )}
              </div>
            )}
            <div className="flex gap-2.5 justify-center pt-2">
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="px-5 py-2.5 rounded-xl bg-[#F0B429] hover:bg-amber-400 text-[#0F2A4A] font-extrabold text-xs transition-colors cursor-pointer shadow-md"
              >
                Segarkan Halaman
              </button>
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = window.location.pathname;
                }}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-colors cursor-pointer"
              >
                Ke Beranda
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  // Navigation Flow State: 'landing' | 'login' | 'app'
  const [currentUser, setCurrentUser] = useState(() => getAuthSession());
  const [currentView, setCurrentView] = useState(() => (getAuthSession() ? 'app' : 'landing'));

  const [activeTab, setActiveTab] = useState('kegiatan_patroli');
  const [activeRole, setActiveRole] = useState(() => {
    const session = getAuthSession();
    return session?.peran || 'user';
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
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
  const [satlinmasList, setSatlinmasList] = useState([]);
  const [poskamlingList, setPoskamlingList] = useState([]);
  const [kegiatanPatroliList, setKegiatanPatroliList] = useState([]);
  const [fasilitasPoskamlingList, setFasilitasPoskamlingList] = useState([]);
  const [profilPenggunaList, setProfilPenggunaList] = useState([]);
  const [isDbLive, setIsDbLive] = useState(false);
  const [isDbLoading, setIsDbLoading] = useState(false);

  // Selected Detail Modal
  const [selectedPelanggaran, setSelectedPelanggaran] = useState(null);

  // Initialize and load data (Fetch live directly from Supabase Live Database)
  const refreshAllData = async (forceSync = false) => {
    initStorage();
    // 1. Initial immediate paint from cached storage
    setPelanggarList(getPelanggarList());
    setPelanggaranList(getPelanggaranList());
    setPengaduanList(getPengaduanList());
    setPatroliList(getPatroliList());
    setRekapTrantibumList(getRekapTrantibumList());
    setPegawaiList(getPegawaiList());
    setProfilPenggunaList(getProfilPenggunaList());
    setWilayahList(getWilayahList());
    setPerdaList(getPerdaList());
    setPelaporList(getPelaporList());
    setSatlinmasList(getSatlinmasList());
    setPoskamlingList(getPoskamlingList());
    setKegiatanPatroliList(getKegiatanPatroliList());
    setFasilitasPoskamlingList(getFasilitasPoskamlingList());

    // 2. Fetch directly from Supabase Live Database
    try {
      setIsDbLoading(true);
      const liveData = forceSync ? await forceDatabaseSync() : await fetchDatabaseData();
      if (liveData && liveData.isLive) {
        setIsDbLive(true);
        if (liveData.satlinmas) setSatlinmasList(liveData.satlinmas);
        if (liveData.poskamling) setPoskamlingList(liveData.poskamling);
        if (liveData.kegiatanPatroli) setKegiatanPatroliList(liveData.kegiatanPatroli);
        if (liveData.pegawai) setPegawaiList(liveData.pegawai);
        if (liveData.profilPengguna) setProfilPenggunaList(liveData.profilPengguna);
        if (liveData.fasilitasPoskamling) setFasilitasPoskamlingList(liveData.fasilitasPoskamling);
        if (liveData.wilayah) setWilayahList(liveData.wilayah);
      }
    } catch (e) {
      console.warn('Live database fetch warning:', e);
    } finally {
      setIsDbLoading(false);
    }
  };

  useEffect(() => {
    // Sesi tersimpan di localStorage tapi sesi Supabase sudah habis -> paksa login ulang
    supabase.auth.getSession().then(({ data }) => {
      if (!data?.session && getAuthSession()) {
        clearAuthSession();
        setCurrentUser(null);
        setCurrentView('landing');
      }
    });
    refreshAllData();

    // Subscribe to realtime database changes from Supabase
    const unsubscribe = subscribeToLiveDatabase((tableName) => {
      console.log('🔄 Menerima perubahan realtime dari Supabase tabel:', tableName);
      refreshAllData();
    });

    return () => {
      unsubscribe && unsubscribe();
    };
  }, []);

  // Flow Navigation Handlers
  const handleGoToLanding = () => {
    setCurrentView('landing');
  };

  const handleGoToLogin = () => {
    setCurrentView('login');
  };

  // Role & Territory RBAC Helpers
  const isAdmin = activeRole === 'admin_kabupaten' || activeRole === 'admin';
  const isOperator = activeRole === 'operator_kecamatan' || activeRole === 'operator';
  const isLinmas = activeRole === 'anggota_linmas' || activeRole === 'linmas';

  const assignedKecamatan = isOperator 
    ? (currentUser?.wilayahTugas || 'Barabai') 
    : null;

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    refreshAllData(true);
    if (user?.peran) {
      setActiveRole(user.peran);
      if (user.peran === 'anggota_linmas' || user.peran === 'linmas') {
        setActiveTab('profil_linmas');
      } else {
        setActiveTab('dashboard');
      }
    } else {
      setActiveTab('dashboard');
    }
    setCurrentView('app');
  };

  const handleRoleChange = (newRole) => {
    setActiveRole(newRole);

    if (newRole === 'anggota_linmas' || newRole === 'linmas') {
      const linmasUser = profilPenggunaList.find(p => p.peran === 'anggota_linmas' || p.peran === 'linmas') || 
        (satlinmasList.length > 0 ? {
          id: satlinmasList[0].id,
          nama: satlinmasList[0].nama,
          nip: satlinmasList[0].nik,
          noRegistrasi: satlinmasList[0].noRegistrasi,
          nik: satlinmasList[0].nik,
          jabatan: satlinmasList[0].isDanru ? 'Danru Satlinmas' : 'Anggota Satlinmas',
          peran: 'anggota_linmas',
          wilayahTugas: satlinmasList[0].kecamatan,
          desaTugas: satlinmasList[0].desaKelurahan,
          foto: satlinmasList[0].pasFoto || null
        } : {
          id: 'slm-001',
          nama: 'Muhammad Arsyad',
          nip: '6307061205840001',
          noRegistrasi: '63.07/SLM/2026/001',
          nik: '6307061205840001',
          jabatan: 'Anggota Satlinmas Barabai Timur',
          peran: 'anggota_linmas',
          wilayahTugas: 'Barabai',
          desaTugas: 'Barabai Timur',
          foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
        });
      setCurrentUser(linmasUser);
      saveAuthSession(linmasUser);
      setActiveTab('profil_linmas');
    } else if (newRole === 'operator_kecamatan' || newRole === 'operator') {
      const operatorUser = profilPenggunaList.find(p => p.peran === 'operator_kecamatan' || p.peran === 'operator') || {
        id: 'peg-002',
        nama: 'M. Rizky Pratama, S.H.',
        nip: '19850614 201001 1 012',
        jabatan: 'Operator Wilayah Kec. Barabai',
        peran: 'operator_kecamatan',
        wilayahTugas: 'Barabai',
        desaTugas: 'Barabai Timur',
        foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
      };
      setCurrentUser(operatorUser);
      saveAuthSession(operatorUser);
      setActiveTab(prev => (prev === 'profil_linmas' || prev === 'master_pegawai' || prev === 'master_wilayah') ? 'dashboard' : prev);
    } else {
      const adminUser = profilPenggunaList.find(p => p.peran === 'admin_kabupaten' || p.peran === 'admin') || 
        pegawaiList.find(p => (p.jabatan || '').toLowerCase().includes('kepala satuan')) || {
        id: 'peg-001',
        nama: 'Drs. Ahmad Fathoni',
        nip: '19720217 199203 1 006',
        jabatan: 'Kepala Satuan Polisi Pamong Praja',
        peran: 'admin_kabupaten',
        wilayahTugas: 'Seluruh Kabupaten Hulu Sungai Tengah',
        foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80'
      };
      setCurrentUser(adminUser);
      saveAuthSession(adminUser);
      setActiveTab(prev => (prev === 'profil_linmas' ? 'dashboard' : prev));
    }
  };

  const handleLogout = () => {
    supabase.auth.signOut();
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

  // =========================================================================
  // VIEW 1: LANDING PAGE (PORTAL PUBLIK)
  // =========================================================================
  if (currentView === 'landing') {
    return (
      <ErrorBoundary>
        <LandingPage
          onNavigateToLogin={handleGoToLogin}
          onExploreMap={() => {
            setCurrentView('app');
            setActiveTab('spasial');
          }}
          satlinmasList={Array.isArray(satlinmasList) ? satlinmasList : []}
          poskamlingList={Array.isArray(poskamlingList) ? poskamlingList : []}
          kegiatanPatroliList={Array.isArray(kegiatanPatroliList) ? kegiatanPatroliList : []}
          wilayahList={Array.isArray(wilayahList) && wilayahList.length > 0 ? wilayahList : KECAMATAN_HST}
        />
      </ErrorBoundary>
    );
  }

  // =========================================================================
  // VIEW 2: LOGIN PAGE (PORTAL MASUK PETUGAS)
  // =========================================================================
  if (currentView === 'login') {
    return (
      <ErrorBoundary>
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onBackToLanding={handleGoToLanding}
        />
      </ErrorBoundary>
    );
  }

  // =========================================================================
  // VIEW 3: MAIN APP (DASHBOARD & OPERASIONAL)
  // =========================================================================
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#F5F6F8] flex">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onNavigateToLanding={handleGoToLanding}
        onLogout={handleLogout}
        activeRole={activeRole}
        currentUser={currentUser}
        counts={{
          satlinmas: satlinmasList.length,
          poskamling: poskamlingList.length,
          kegiatanPatroli: kegiatanPatroliList.length,
          pelanggaran: pelanggaranList.length,
          rekapTrantibum: rekapTrantibumList.length,
          pengaduan: pengaduanList.filter(p => p.status === 'menunggu_verifikasi').length,
          pegawai: pegawaiList.length,
          pengguna: profilPenggunaList.length,
          kecamatan: wilayahList.length,
          fasilitasPoskamling: fasilitasPoskamlingList.length
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navbar */}
        <Navbar
          activeRole={activeRole}
          onRoleChange={handleRoleChange}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          currentUser={currentUser}
          onNavigateToLanding={handleGoToLanding}
          onLogout={handleLogout}
          isDbLive={isDbLive}
          isDbLoading={isDbLoading}
          onNavigateTab={setActiveTab}
          onForceSync={() => refreshAllData(true)}
        />

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full">
          {/* 1. KHUSUS ANGGOTA LINMAS: PROFIL & KTA DIGITAL */}
          {activeTab === 'profil_linmas' && (
            <ProfilAnggotaLinmas
              currentUser={currentUser}
              satlinmasList={satlinmasList}
              onNavigateToPatroli={() => setActiveTab('kegiatan_patroli')}
              pegawaiList={pegawaiList}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardEksekutif
              satlinmasList={satlinmasList}
              poskamlingList={poskamlingList}
              kegiatanPatroliList={kegiatanPatroliList}
              wilayahList={wilayahList}
              assignedKecamatan={assignedKecamatan}
              currentUser={currentUser}
              activeRole={activeRole}
              onNavigateTab={setActiveTab}
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
              satlinmasList={satlinmasList}
              poskamlingList={poskamlingList}
              kegiatanPatroliList={kegiatanPatroliList}
              pelanggaranList={pelanggaranList}
              rekapTrantibumList={rekapTrantibumList}
              wilayahList={wilayahList}
              assignedKecamatan={assignedKecamatan}
              onSelectPelanggaran={(item) => setSelectedPelanggaran(item)}
            />
          )}

          {activeTab === 'pengaduan' && (
            <VerifikasiPengaduan
              pengaduanList={pengaduanList}
              onUpdate={refreshAllData}
              onConvertToViolation={handleConvertToViolation}
            />
          )}

          {activeTab === 'satlinmas' && (
            <DataSatlinmas
              satlinmasList={satlinmasList}
              onRefreshData={refreshAllData}
              wilayahList={wilayahList}
              assignedKecamatan={assignedKecamatan}
            />
          )}

          {activeTab === 'poskamling' && (
            <DataPoskamling
              poskamlingList={poskamlingList}
              onRefreshData={refreshAllData}
              wilayahList={wilayahList}
              fasilitasMasterList={fasilitasPoskamlingList}
              assignedKecamatan={assignedKecamatan}
              onNavigateToMasterFasilitas={() => setActiveTab('master_fasilitas_poskamling')}
            />
          )}

          {activeTab === 'master_fasilitas_poskamling' && (
            <MasterFasilitasPoskamling
              fasilitasList={fasilitasPoskamlingList}
              poskamlingList={poskamlingList}
              onRefreshData={refreshAllData}
              onNavigateToPoskamling={() => setActiveTab('poskamling')}
            />
          )}

          {activeTab === 'kegiatan_patroli' && (
            <KegiatanPatroli
              kegiatanList={kegiatanPatroliList}
              satlinmasList={satlinmasList}
              onRefreshData={refreshAllData}
              wilayahList={wilayahList}
              assignedKecamatan={assignedKecamatan}
              currentUser={currentUser}
              isLinmas={isLinmas}
            />
          )}

          {activeTab === 'kartu_anggota' && (
            <CetakKartuAnggota
              satlinmasList={satlinmasList}
              wilayahList={wilayahList}
              assignedKecamatan={assignedKecamatan}
              pegawaiList={pegawaiList}
            />
          )}

          {activeTab === 'master_pegawai' && (
            <MasterPegawai
              pegawaiList={pegawaiList}
              onRefreshData={refreshAllData}
            />
          )}

          {activeTab === 'master_wilayah' && (
            <MasterWilayah
              wilayahList={wilayahList}
              onRefreshData={refreshAllData}
            />
          )}

          {activeTab === 'laporan_rekap_satlinmas' && (
            <LaporanRekapSatlinmas
              satlinmasList={satlinmasList}
              poskamlingList={poskamlingList}
              kegiatanPatroliList={kegiatanPatroliList}
              wilayahList={wilayahList}
              currentUser={currentUser}
              onRefreshData={refreshAllData}
            />
          )}

          {([
            'profil_pengguna',
            'profil_saya',
            'manajemen_pegawai',
            'manajemen_kecamatan',
            'manajemen_linmas'
          ].includes(activeTab)) && (
            <ProfilPengguna
              currentUser={currentUser}
              onUpdateCurrentUser={(updated) => setCurrentUser(updated)}
              profilPenggunaList={profilPenggunaList}
              onRefreshData={refreshAllData}
              wilayahList={wilayahList}
              satlinmasList={satlinmasList}
              initialSubTab={
                ['profil_saya', 'manajemen_pegawai', 'manajemen_kecamatan', 'manajemen_linmas'].includes(activeTab)
                  ? activeTab
                  : 'profil_saya'
              }
              onSubTabChange={(subTab) => setActiveTab(subTab)}
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
    </div>
    </ErrorBoundary>
  );
}
