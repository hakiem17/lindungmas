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
  User
} from 'lucide-react';
import { USER_ROLES } from '../../data/mockData';

export default function Navbar({ 
  activeRole, 
  onRoleChange, 
  onToggleMobileSidebar, 
  onOpenPublicPortal,
  currentUser,
  onNavigateToLanding,
  onLogout
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

  const currentRoleObj = USER_ROLES.find(r => r.id === activeRole) || USER_ROLES[1];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
      {/* Left: Mobile hamburger & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-[#0F2A4A] hover:bg-slate-100 rounded-lg cursor-pointer"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#0F2A4A] flex items-center justify-center text-[#F0B429] shadow-xs">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#0F2A4A] tracking-tight text-base sm:text-lg">GARDA MURAKATA</span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold bg-[#F0B429]/20 text-[#0F2A4A] rounded border border-[#F0B429]/40">
                PROD v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">Satpol PP Kabupaten Hulu Sungai Tengah</p>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
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

        {/* Public Portal Switcher */}
        <button
          onClick={onOpenPublicPortal}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F2A4A] bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
          <span>Kanal Aduan</span>
        </button>

        {/* User Profile & Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-xl border border-slate-200 text-left transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-[#0F2A4A] text-white flex items-center justify-center font-bold text-xs">
              {currentUser?.nama ? currentUser.nama.charAt(0) : currentRoleObj.nama.charAt(0)}
            </div>
            <div className="hidden sm:block text-left max-w-[120px]">
              <p className="text-xs font-bold text-[#0F2A4A] leading-tight truncate">
                {currentUser?.nama || currentRoleObj.nama}
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide truncate">
                {activeRole === 'admin' ? 'Administrator' : 'Petugas'}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-0.5" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3.5 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-[#0F2A4A] truncate">{currentUser?.nama || 'Petugas Satpol PP'}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">{currentUser?.nip || 'NIP Pegawai'}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                  activeRole === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  Peran: {activeRole.toUpperCase()}
                </span>
              </div>

              <div className="px-3 py-1.5 border-b border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Simulasi Hak Akses</p>
              </div>

              {USER_ROLES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    onRoleChange(r.id);
                    setRoleMenuOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                    activeRole === r.id ? 'bg-amber-50/70 font-bold text-[#0F2A4A]' : 'text-slate-700'
                  }`}
                >
                  <div>
                    <p className="font-semibold">{r.nama}</p>
                    <p className="text-[10px] text-slate-500 line-clamp-1">{r.deskripsi}</p>
                  </div>
                  {activeRole === r.id && (
                    <span className="w-2 h-2 rounded-full bg-[#F0B429]"></span>
                  )}
                </button>
              ))}

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

