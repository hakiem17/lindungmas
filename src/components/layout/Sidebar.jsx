import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  MapPin, 
  Car, 
  ShieldAlert, 
  ShieldCheck,
  Shield,
  Users,
  Map,
  Database,
  Radio,
  IdCard,
  X,
  Home,
  LogOut,
  CheckSquare,
  UserCog,
  UserCheck,
  User,
  Building2,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  ExternalLink
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  onSelectTab, 
  isMobileOpen, 
  onCloseMobile, 
  counts = {},
  onNavigateToLanding,
  onLogout,
  activeRole = 'admin_kabupaten',
  currentUser
}) {
  const isAdmin = activeRole === 'admin_kabupaten' || activeRole === 'admin';
  const isOperator = activeRole === 'operator_kecamatan' || activeRole === 'operator';
  const isLinmas = activeRole === 'anggota_linmas' || activeRole === 'linmas';

  // State untuk expand/collapse sub-menu Profil Pengguna
  const isProfilSectionActive = [
    'profil_pengguna',
    'profil_saya',
    'manajemen_pegawai',
    'manajemen_kecamatan',
    'manajemen_linmas'
  ].includes(activeTab);

  const [isProfilExpanded, setIsProfilExpanded] = useState(true);

  // 1. Menu Mandiri untuk Anggota Linmas (Profil, KTA Digital, dan Input/Riwayat Patroli)
  const menuLinmasMandiri = [
    { id: 'profil_linmas', label: 'Profil & KTA Digital', icon: IdCard },
    { id: 'kegiatan_patroli', label: 'Lapor Patroli & Riwayat', icon: Car, count: counts.kegiatanPatroli }
  ];

  // 2. Menu Operasional untuk Admin & Operator
  const menuOperasional = [
    { 
      id: 'dashboard', 
      label: isOperator ? 'Dashboard Wilayah' : 'Dashboard Utama', 
      icon: LayoutDashboard 
    },
    { 
      id: 'spasial', 
      label: isOperator ? 'Peta Wilayah' : 'Peta Digital', 
      icon: MapPin 
    }
  ];

  // 3. Menu Perlindungan Masyarakat (Satlinmas & Poskamling)
  const menuLinmas = [
    { 
      id: 'satlinmas', 
      label: isOperator ? 'Data Satlinmas Wilayah' : 'Data Satlinmas', 
      icon: ShieldCheck, 
      count: counts.satlinmas 
    },
    { 
      id: 'poskamling', 
      label: isOperator ? 'Data Poskamling Wilayah' : 'Data Poskamling', 
      icon: Radio, 
      count: counts.poskamling 
    },
    { 
      id: 'kegiatan_patroli', 
      label: isOperator ? 'Kegiatan Patroli Wilayah' : 'Kegiatan dan Patroli', 
      icon: Car, 
      count: counts.kegiatanPatroli 
    },
    { 
      id: 'kartu_anggota', 
      label: isOperator ? 'Cetak KTA Wilayah' : 'Cetak Kartu Anggota', 
      icon: IdCard 
    }
  ];

  // 4. Menu Data Master (Operator TIDAK bisa mengatur admin kabupaten / master pegawai)
  const menuMaster = isAdmin ? [
    { id: 'master_pegawai', label: 'Master Pegawai', icon: Users, count: counts.pegawai },
    { id: 'master_wilayah', label: 'Master Wilayah', icon: Map, count: counts.kecamatan },
    { id: 'master_fasilitas_poskamling', label: 'Master Sarana Poskamling', icon: CheckSquare, count: counts.fasilitasPoskamling }
  ] : [
    // Operator Kecamatan hanya memiliki sarana poskamling
    { id: 'master_fasilitas_poskamling', label: 'Sarana Poskamling', icon: CheckSquare, count: counts.fasilitasPoskamling }
  ];

  // 5. Menu Laporan dan Statistik (Rekapitulasi Situasi Satlinmas)
  const menuLaporan = [
    { 
      id: 'laporan_rekap_satlinmas', 
      label: 'Rekap Situasi Satlinmas', 
      icon: FileSpreadsheet
    }
  ];

  // 6. Menu Akun & Hak Akses (BARU: Profil Pengguna terpisah dari Master Pegawai)
  const menuPengguna = [
    { 
      id: 'profil_pengguna', 
      label: isAdmin ? 'Profil & Akun Pengguna' : 'Profil Pengguna', 
      icon: UserCog, 
      count: isAdmin ? (counts.pengguna || counts.pegawai) : undefined 
    }
  ];

  const renderMenuItem = (item) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    return (
      <button
        key={item.id}
        onClick={() => {
          onSelectTab(item.id);
          if (onCloseMobile) onCloseMobile();
        }}
        style={{ textAlign: 'left' }}
        className={`w-full text-left flex items-start justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
          isActive 
            ? 'bg-[#F0B429] text-[#0F2A4A] shadow-lg shadow-[#F0B429]/20 font-bold' 
            : 'text-slate-300 hover:bg-white/5 hover:text-white'
        }`}
      >
        <div className="flex items-start gap-3 text-left min-w-0 flex-1" style={{ textAlign: 'left' }}>
          <Icon className={`w-4 h-4 shrink-0 mt-0.5 transition-transform group-hover:scale-110 ${isActive ? 'text-[#0F2A4A]' : 'text-slate-400'}`} />
          <span 
            className="text-left block leading-snug break-words" 
            style={{ textAlign: 'left', display: 'block', width: '100%' }}
          >
            {item.label}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2 mt-0.5">
          {item.count !== undefined && item.count > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              isActive ? 'bg-[#0F2A4A] text-white' : 'bg-white/10 text-slate-300'
            }`}>
              {item.count}
            </span>
          )}
          {item.badge && (
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-extrabold ${
              isActive ? 'bg-[#0F2A4A] text-[#F0B429]' : 'bg-[#F0B429] text-[#0F2A4A]'
            }`}>
              {item.badge}
            </span>
          )}
        </div>
      </button>
    );
  };

  const content = (
    <div className="flex flex-col h-full bg-[#0F2A4A] text-slate-200 select-none">
      {/* Brand & Crest */}
      <div 
        onClick={() => {
          if (onNavigateToLanding) onNavigateToLanding();
          if (onCloseMobile) onCloseMobile();
        }}
        className="p-6 border-b border-white/10 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors group"
        title="Buka Landing Page Publik LINDUNGMAS HST"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/10 border border-[#F0B429]/40 flex items-center justify-center p-1 shadow-inner shrink-0 group-hover:scale-105 transition-transform">
            <img src="/logo-barabai.png" alt="Logo Barabai HST" className="w-full h-full object-contain filter drop-shadow" />
          </div>
          <div>
            <h2 className="font-extrabold text-white text-base tracking-wider leading-tight group-hover:text-[#F0B429] transition-colors">LINDUNGMAS HST</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-[#F0B429]"></span>
              <p className="text-[10px] text-[#F0B429] font-medium tracking-wide">LINMAS & SATPOL PP HST</p>
            </div>
          </div>
        </div>
        {isMobileOpen && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onCloseMobile();
            }} 
            className="lg:hidden text-white/60 hover:text-white p-1"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Tombol Cepat ke Landing Page Publik */}
        <button
          type="button"
          onClick={() => {
            if (onNavigateToLanding) onNavigateToLanding();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-[#F0B429] border border-[#F0B429]/30 transition-all cursor-pointer shadow-xs group mb-1"
          title="Buka Halaman Depan / Landing Page Publik LINDUNGMAS HST"
        >
          <div className="flex items-center gap-2.5">
            <Home className="w-4 h-4 text-[#F0B429] transition-transform group-hover:scale-110" />
            <span>Landing Page Publik</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
        </button>
        {/* KHUSUS ANGGOTA LINMAS: Hanya Menu Mandiri */}
        {isLinmas ? (
          <div className="space-y-2">
            <div className="p-3 bg-white/5 border border-emerald-500/30 rounded-xl mb-3">
              <span className="text-[10px] font-extrabold uppercase text-emerald-400 block tracking-wider">Akses Personel Mandiri</span>
              <p className="text-xs font-bold text-white mt-0.5">{currentUser?.nama || 'Anggota Satlinmas'}</p>
              <p className="text-[10px] text-slate-400 truncate">Wilayah: Desa {currentUser?.desaTugas || 'Barabai Timur'}</p>
            </div>

            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#F0B429] flex items-center gap-1.5">
              <IdCard className="w-3.5 h-3.5 text-[#F0B429]" />
              <span>Layanan Anggota Linmas</span>
            </div>
            {menuLinmasMandiri.map(renderMenuItem)}
          </div>
        ) : (
          <>
            {/* Operator Territory Notification */}
            {isOperator && (
              <div className="p-2.5 bg-blue-900/30 border border-blue-500/30 rounded-xl mb-1">
                <span className="text-[9px] font-extrabold uppercase text-blue-300 block tracking-wider">Wilayah Penugasan Operator</span>
                <p className="text-xs font-bold text-white mt-0.5 truncate">
                  Kecamatan {currentUser?.wilayahTugas || 'Barabai'}
                </p>
                <p className="text-[10px] text-blue-200/70 mt-0.5">Akses terbatas data wilayah tugas</p>
              </div>
            )}

            {/* Section 1: Menu Operasional */}
            <div className="space-y-1.5">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Menu Operasional
              </div>
              {menuOperasional.map(renderMenuItem)}
            </div>

            {/* Section 2: Perlindungan Masyarakat (Linmas) */}
            <div className="space-y-1.5 pt-2 border-t border-white/10">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#F0B429] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#F0B429]" />
                <span>Perlindungan Masyarakat</span>
              </div>
              {menuLinmas.map(renderMenuItem)}
            </div>

            {/* Section 3: Data Master */}
            <div className="space-y-1.5 pt-2 border-t border-white/10">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#F0B429] flex items-center gap-1.5">
                <Database className="w-3 h-3 text-[#F0B429]" />
                <span>{isAdmin ? 'Data Master Kabupaten' : 'Data Fasilitas'}</span>
              </div>
              {menuMaster.map(renderMenuItem)}
            </div>

            {/* Section 4: Laporan dan Statistik (SEBELUM AKUN & HAK AKSES) */}
            <div className="space-y-1.5 pt-2 border-t border-white/10">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#F0B429] flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#F0B429]" />
                <span>Laporan & Statistik</span>
              </div>
              {menuLaporan.map(renderMenuItem)}
            </div>

            {/* Section 5: Akun & Hak Akses (Profil Pengguna & Sub-Menu Langsung) */}
            <div className="space-y-1.5 pt-2 border-t border-white/10">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#F0B429] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#F0B429]" />
                  <span>Akun & Hak Akses</span>
                </div>
              </div>

              {/* Parent Item: Profil & Akun Pengguna dengan Collapse Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfilExpanded(!isProfilExpanded);
                    onSelectTab('profil_pengguna');
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full text-left flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${
                    activeTab === 'profil_pengguna'
                      ? 'bg-[#F0B429] text-[#0F2A4A] shadow-lg shadow-[#F0B429]/20 font-bold'
                      : isProfilSectionActive
                      ? 'bg-white/10 text-white font-bold'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <UserCog className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      activeTab === 'profil_pengguna' 
                        ? 'text-[#0F2A4A]' 
                        : isProfilSectionActive 
                        ? 'text-[#F0B429]' 
                        : 'text-slate-400'
                    }`} />
                    <span className="truncate">Profil & Akun Pengguna</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    <span className={`p-0.5 rounded transition-transform duration-200 ${isProfilExpanded ? 'rotate-180' : ''}`}>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    </span>
                  </div>
                </button>

                {/* Sub-Menu Akses Langsung */}
                {isProfilExpanded && (
                  <div className="ml-3 pl-3 border-l-2 border-white/10 space-y-1 mt-1.5 animate-fadeIn">
                    {/* 1. Profil Akun Saya */}
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTab('profil_saya');
                        if (onCloseMobile) onCloseMobile();
                      }}
                      className={`w-full text-left flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                        activeTab === 'profil_saya' || activeTab === 'profil_pengguna'
                          ? 'bg-[#F0B429] text-[#0F2A4A] font-bold shadow-xs'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <User className={`w-3.5 h-3.5 shrink-0 ${
                          activeTab === 'profil_saya' || activeTab === 'profil_pengguna' 
                            ? 'text-[#0F2A4A]' 
                            : 'text-slate-400 group-hover:text-[#F0B429]'
                        }`} />
                        <span className="truncate">Profil Saya</span>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                        activeTab === 'profil_saya' || activeTab === 'profil_pengguna'
                          ? 'bg-[#0F2A4A] text-white'
                          : 'bg-white/10 text-slate-400'
                      }`}>
                        Pribadi
                      </span>
                    </button>

                    {/* 2. Admin Satpol PP (Kabupaten) - Khusus Admin */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectTab('manajemen_pegawai');
                          if (onCloseMobile) onCloseMobile();
                        }}
                        className={`w-full text-left flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                          activeTab === 'manajemen_pegawai'
                            ? 'bg-[#F0B429] text-[#0F2A4A] font-bold shadow-xs'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Shield className={`w-3.5 h-3.5 shrink-0 ${
                            activeTab === 'manajemen_pegawai' ? 'text-[#0F2A4A]' : 'text-purple-400 group-hover:text-purple-300'
                          }`} />
                          <span className="truncate">Admin Satpol PP</span>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          activeTab === 'manajemen_pegawai'
                            ? 'bg-[#0F2A4A] text-white'
                            : 'bg-purple-900/60 text-purple-200 border border-purple-500/30'
                        }`}>
                          Dinas
                        </span>
                      </button>
                    )}

                    {/* 3. Akun Operator Kecamatan (11 Kecamatan HST) */}
                    {(isAdmin || isOperator) && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectTab('manajemen_kecamatan');
                          if (onCloseMobile) onCloseMobile();
                        }}
                        className={`w-full text-left flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                          activeTab === 'manajemen_kecamatan'
                            ? 'bg-[#F0B429] text-[#0F2A4A] font-bold shadow-xs'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Building2 className={`w-3.5 h-3.5 shrink-0 ${
                            activeTab === 'manajemen_kecamatan' ? 'text-[#0F2A4A]' : 'text-blue-400 group-hover:text-blue-300'
                          }`} />
                          <span className="truncate">Akun Kecamatan</span>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          activeTab === 'manajemen_kecamatan'
                            ? 'bg-[#0F2A4A] text-[#F0B429]'
                            : 'bg-blue-900/60 text-blue-200 border border-blue-500/30'
                        }`}>
                          11 Kec
                        </span>
                      </button>
                    )}

                    {/* 4. Login Akun Linmas */}
                    {(isAdmin || isOperator) && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectTab('manajemen_linmas');
                          if (onCloseMobile) onCloseMobile();
                        }}
                        className={`w-full text-left flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                          activeTab === 'manajemen_linmas'
                            ? 'bg-[#F0B429] text-[#0F2A4A] font-bold shadow-xs'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${
                            activeTab === 'manajemen_linmas' ? 'text-[#0F2A4A]' : 'text-emerald-400 group-hover:text-emerald-300'
                          }`} />
                          <span className="truncate">Login Akun Linmas</span>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          activeTab === 'manajemen_linmas'
                            ? 'bg-[#0F2A4A] text-white'
                            : 'bg-emerald-900/60 text-emerald-200 border border-emerald-500/30'
                        }`}>
                          {counts.satlinmas || '90'}
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </nav>

      {/* Footer Info / Command Center & External Navigation */}
      <div className="p-4 border-t border-white/10 bg-[#091B30]/60 space-y-2.5">
        <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[11px] font-semibold text-slate-300">
              {isLinmas ? 'Siskamling Barabai Timur' : isOperator ? `Posko Kec. ${currentUser?.wilayahTugas || 'Barabai'}` : 'Posko Komando Satpol PP HST'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Layanan Darurat: (0517) 41234</p>
        </div>

        {/* Quick Back to Landing & Logout Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={onNavigateToLanding}
            className="w-full py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title="Buka Landing Page Publik"
          >
            <Home className="w-3.5 h-3.5 text-[#F0B429]" />
            <span>Beranda</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="w-full py-1.5 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 text-[11px] font-bold flex items-center justify-center gap-1.5 border border-rose-500/20 transition-colors cursor-pointer"
            title="Keluar dari sesi kedinasan"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 h-screen sticky top-0 border-r border-[#14304F] print:hidden">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onCloseMobile}></div>
          <div className="relative w-80 max-w-[85%] h-full bg-[#0F2A4A] shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
}

