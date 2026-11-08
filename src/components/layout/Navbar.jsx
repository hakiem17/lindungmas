import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Wifi, 
  WifiOff, 
  UserCheck, 
  ChevronDown, 
  Menu, 
  Bell, 
  ExternalLink,
  LogOut,
  Home,
  User,
  Database,
  RefreshCw
} from 'lucide-react';
import { USER_ROLES } from '../../data/mockData';

export default function Navbar({ 
  activeRole, 
  onRoleChange, 
  onToggleMobileSidebar, 
  currentUser,
  onNavigateToLanding,
  onLogout,
  isDbLive = false,
  isDbLoading = false,
  onNavigateTab,
  onForceSync
}) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const currentRoleObj = USER_ROLES.find(r => r.id === activeRole || r.alias === activeRole) || USER_ROLES[0];

  const getRoleBadge = (roleId) => {
    if (roleId === 'admin_kabupaten' || roleId === 'admin') {
      return {
        label: 'Admin Satpol PP',
        tag: 'Seluruh HST',
        badgeClass: 'bg-purple-100 text-purple-800 border-purple-200'
      };
    }
    if (roleId === 'operator_kecamatan' || roleId === 'operator') {
      return {
        label: 'Operator Kecamatan',
        tag: currentUser?.wilayahTugas ? `Kec. ${currentUser.wilayahTugas}` : 'Kec. Barabai',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-200'
      };
    }
    return {
      label: 'Anggota Linmas',
      tag: currentUser?.desaTugas ? `Desa ${currentUser.desaTugas}` : 'Barabai Timur',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    };
  };

  const roleMeta = getRoleBadge(activeRole);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between print:hidden">
      {/* Left: Mobile hamburger & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-[#0F2A4A] hover:bg-slate-100 rounded-lg cursor-pointer"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div 
          onClick={onNavigateToLanding}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
          title="Klik untuk membuka Landing Page Publik LINDUNGMAS HST"
        >
          <div className="w-9 h-9 rounded-xl bg-[#0F2A4A] flex items-center justify-center text-[#F0B429] shadow-xs group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#0F2A4A] tracking-tight text-base sm:text-lg group-hover:text-blue-900 transition-colors">
                LINDUNGMAS HST
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold bg-[#F0B429]/20 text-[#0F2A4A] rounded border border-[#F0B429]/40">
                PROD v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">Layanan Informasi & Data Perlindungan Masyarakat Kab. HST</p>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Supabase Live DB status pill */}
        {/* Supabase Live DB status pill with refresh/sync button */}
        <button 
          onClick={onForceSync}
          disabled={isDbLoading}
          type="button"
          title={isDbLive ? "Terhubung langsung ke Database Supabase (Live). Klik untuk sinkronisasi ulang & refresh cache." : "Menghubungkan ke Supabase... Klik untuk coba hubungkan ulang."}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
            isDbLive 
              ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 shadow-xs' 
              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
          }`}
        >
          <Database className={`w-3.5 h-3.5 ${isDbLoading ? 'animate-spin text-amber-600' : 'text-blue-600'}`} />
          <span className="hidden xs:inline">
            {isDbLoading ? 'Sinkron DB...' : (isDbLive ? 'Supabase Live' : 'Menghubungkan...')}
          </span>
          <RefreshCw className={`w-3 h-3 ml-0.5 ${isDbLoading ? 'animate-spin text-amber-600' : 'text-blue-500 hover:text-blue-800'}`} />
        </button>

        {/* Network Online/Offline status pill */}
        <button 
          onClick={() => setIsOnline(!isOnline)}
          title="Klik untuk simulasi mode offline di lapangan"
          className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border transition-all cursor-pointer ${
            isOnline 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
          }`}
        >
          {isOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden xs:inline">Online (Tersinkron)</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden xs:inline">Offline (Mode Lapangan)</span>
            </>
          )}
        </button>

        {/* Shortcut to Landing Page */}
        <button
          onClick={onNavigateToLanding}
          title="Buka Halaman Utama / Landing Page Publik"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors cursor-pointer"
        >
          <Home className="w-3.5 h-3.5 text-slate-500" />
          <span>Beranda Publik</span>
        </button>

        {/* User Profile & Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-xl border border-slate-200 text-left transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-[#0F2A4A] text-[#F0B429] flex items-center justify-center font-bold text-xs shrink-0">
              {currentUser?.nama ? currentUser.nama.charAt(0) : currentRoleObj.nama.charAt(0)}
            </div>
            <div className="hidden sm:block text-left max-w-[150px]">
              <p className="text-xs font-bold text-[#0F2A4A] leading-tight truncate">
                {currentUser?.nama || currentRoleObj.nama}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px] text-slate-500 font-medium truncate">
                  {roleMeta.label}
                </span>
                <span className="text-[9px] px-1 py-0.2 bg-slate-200/70 text-slate-700 rounded font-semibold truncate">
                  {roleMeta.tag}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-0.5" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3.5 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-[#0F2A4A] truncate">{currentUser?.nama || currentRoleObj.nama}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">{currentUser?.nip ? `NIP/NIK: ${currentUser.nip}` : 'Personel Terverifikasi'}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${roleMeta.badgeClass}`}>
                    {currentRoleObj.nama}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium truncate">
                    ({roleMeta.tag})
                  </span>
                </div>
              </div>

              {/* Buka Profil Pengguna Shortcut */}
              <div className="p-1 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateTab) onNavigateTab('profil_pengguna');
                    setRoleMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#0F2A4A] hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4 text-[#F0B429]" />
                  <span>Lihat Profil Pengguna Saya</span>
                </button>
              </div>

              <div className="px-3.5 py-1.5 bg-slate-50 border-b border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Simulasi 3 Peran RBAC</p>
              </div>

              <div className="p-1 space-y-1">
                {USER_ROLES.map((r) => {
                  const isCurrent = activeRole === r.id || activeRole === r.alias;
                  return (
                    <button
                      key={r.id}
                      onClick={() => {
                        onRoleChange(r.id);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-start justify-between transition-colors cursor-pointer ${
                        isCurrent ? 'bg-[#0F2A4A] text-white shadow-xs font-bold' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="pr-2">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-xs">{r.nama}</p>
                        </div>
                        <p className={`text-[10px] line-clamp-2 mt-0.5 ${isCurrent ? 'text-slate-300' : 'text-slate-500'}`}>
                          {r.kewenangan || r.deskripsi}
                        </p>
                      </div>
                      {isCurrent && (
                        <span className="w-2 h-2 mt-1 rounded-full bg-[#F0B429] shrink-0"></span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 mt-1 border-t border-slate-100 px-2 space-y-1">
                <button
                  onClick={() => {
                    setRoleMenuOpen(false);
                    if (onNavigateToLanding) onNavigateToLanding();
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5 text-slate-500" />
                  <span>Ke Landing Page</span>
                </button>

                <button
                  onClick={() => {
                    setRoleMenuOpen(false);
                    if (onLogout) onLogout();
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span>Keluar (Logout)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

