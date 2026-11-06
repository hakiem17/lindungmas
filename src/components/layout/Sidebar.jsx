import React from 'react';
import { 
  LayoutDashboard, 
  UserPlus, 
  ClipboardList, 
  FileSpreadsheet,
  MapPin, 
  Car, 
  Megaphone, 
  BookOpen, 
  ShieldAlert, 
  FileCheck2,
  Users,
  UserCheck,
  Map,
  Database,
  X,
  Home,
  LogOut
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  onSelectTab, 
  isMobileOpen, 
  onCloseMobile, 
  counts = {},
  onNavigateToLanding,
  onLogout
}) {
  const menuOperasional = [
    { id: 'dashboard', label: 'Dashboard & Statistik', icon: LayoutDashboard },
    { id: 'register_pengaduan', label: 'Rekap Pengaduan & Tindak Lanjut Trantibum', icon: FileCheck2, count: counts.rekapTrantibum },
    { id: 'rekap', label: 'Rekap Kasus & Sanksi', icon: ClipboardList, count: counts.pelanggaran },
    { id: 'input', label: 'Input Pelanggar & OCR', icon: UserPlus, badge: 'Cepat' },
    { id: 'spasial', label: 'Peta Spasial & Titik Rawan', icon: MapPin },
    { id: 'patroli', label: 'Monitoring Patroli', icon: Car, count: counts.patroli },
    { id: 'pengaduan', label: 'Verifikasi Pengaduan', icon: Megaphone, count: counts.pengaduan, badgeColor: 'bg-amber-400 text-slate-900' }
  ];

  const menuMaster = [
    { id: 'master_pegawai', label: 'Master Pegawai', icon: Users, count: counts.pegawai },
    { id: 'master_pelapor', label: 'Master Pelapor', icon: UserCheck, count: counts.pelapor },
    { id: 'master_wilayah', label: 'Master Wilayah', icon: Map, count: counts.kecamatan },
    { id: 'perda', label: 'Referensi Perda HST', icon: BookOpen, count: counts.perda }
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
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#14304F] to-[#0A1A2E] border border-[#F0B429]/40 flex items-center justify-center text-[#F0B429] shadow-inner">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-white text-base tracking-wider leading-tight">GARDA MURAKATA</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-[#F0B429]"></span>
              <p className="text-[10px] text-[#F0B429] font-medium tracking-wide">SATPOL PP HST</p>
            </div>
          </div>
        </div>
        {isMobileOpen && (
          <button onClick={onCloseMobile} className="lg:hidden text-white/60 hover:text-white p-1">
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Section 1: Menu Operasional */}
        <div className="space-y-1.5">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Menu Operasional
          </div>
          {menuOperasional.map(renderMenuItem)}
        </div>

        {/* Section 2: Data Master */}
        <div className="space-y-1.5 pt-2 border-t border-white/10">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#F0B429] flex items-center gap-1.5">
            <Database className="w-3 h-3 text-[#F0B429]" />
            <span>Data Master</span>
          </div>
          {menuMaster.map(renderMenuItem)}
        </div>
      </nav>

      {/* Footer Info / Command Center & External Navigation */}
      <div className="p-4 border-t border-white/10 bg-[#091B30]/60 space-y-2.5">
        <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[11px] font-semibold text-slate-300">Posko Komando Barabai</span>
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
      <aside className="hidden lg:block w-72 shrink-0 h-screen sticky top-0 border-r border-[#14304F]">
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

