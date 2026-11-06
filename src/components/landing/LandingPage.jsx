import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Car, 
  MapPin, 
  FileSpreadsheet, 
  Scale, 
  CheckCircle2, 
  Clock, 
  Users, 
  ArrowRight, 
  ExternalLink, 
  LogIn, 
  AlertCircle, 
  Menu, 
  X, 
  ChevronRight, 
  Building2, 
  PhoneCall, 
  Mail, 
  Eye, 
  FileText, 
  Compass, 
  Sparkles,
  Lock,
  Navigation,
  QrCode,
  Megaphone,
  Search,
  Scan,
  Crosshair,
  Upload,
  Send,
  Check,
  ShieldCheck,
  Camera
} from 'lucide-react';
import { KECAMATAN_HST } from '../../data/mockData';
import { createPengaduan } from '../../data/storageService';
import QrCodeView from '../common/QrCodeView';
import ModalMapPicker from '../common/ModalMapPicker';

export default function LandingPage({ 
  onNavigateToLogin, 
  onOpenPublicPortal 
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // States for Embedded Form Lapor Pengaduan Warga
  const [laporNama, setLaporNama] = useState('');
  const [laporNoHp, setLaporNoHp] = useState('');
  const [laporJudul, setLaporJudul] = useState('');
  const [laporDeskripsi, setLaporDeskripsi] = useState('');
  const [laporKecamatan, setLaporKecamatan] = useState('Barabai');
  const [laporDesa, setLaporDesa] = useState('');
  const [laporAlamat, setLaporAlamat] = useState('');
  const [laporLat, setLaporLat] = useState(-2.5833);
  const [laporLng, setLaporLng] = useState(115.3811);
  const [isCapturingGPS, setIsCapturingGPS] = useState(false);
  const [gpsLocked, setGpsLocked] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [coordSource, setCoordSource] = useState('default'); // 'default' | 'gps' | 'map_picker'
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [laporFotoUrl, setLaporFotoUrl] = useState('https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&auto=format&fit=crop&q=80');
  const [laporPhotoName, setLaporPhotoName] = useState('');
  const [submittedReport, setSubmittedReport] = useState(null);

  // Geolocation & Map Handlers
  const handleCaptureGPS = () => {
    if ('geolocation' in navigator) {
      setIsCapturingGPS(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLat = parseFloat(pos.coords.latitude.toFixed(6));
          const newLng = parseFloat(pos.coords.longitude.toFixed(6));
          setLaporLat(newLat);
          setLaporLng(newLng);
          setGpsLocked(true);
          setGpsAccuracy(Math.round(pos.coords.accuracy || 10));
          setCoordSource('gps');
          setIsCapturingGPS(false);
        },
        (err) => {
          setIsCapturingGPS(false);
          alert('Gagal mengambil titik GPS: ' + (err.message || 'Izin lokasi tidak diberikan. Anda dapat menandai lokasi menggunakan fitur peta.'));
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      alert('Perangkat Anda tidak mendukung sensor geolokasi.');
    }
  };

  const handleLocationFromMap = (selectedLat, selectedLng) => {
    setLaporLat(selectedLat);
    setLaporLng(selectedLng);
    setGpsLocked(false);
    setCoordSource('map_picker');
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLaporPhotoName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl) {
        setLaporFotoUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleLaporSubmit = (e) => {
    e.preventDefault();
    if (!laporNama || !laporNoHp || !laporJudul || !laporDeskripsi || !laporAlamat) {
      alert('Harap lengkapi semua kolom wajib!');
      return;
    }

    const report = createPengaduan({
      namaPelapor: laporNama,
      noHp: laporNoHp,
      judul: laporJudul,
      deskripsi: laporDeskripsi,
      kecamatan: laporKecamatan,
      desa: laporDesa,
      alamat: laporAlamat,
      lat: laporLat,
      lng: laporLng,
      fotoUrl: laporFotoUrl
    });

    setSubmittedReport(report);
  };

  const selectedKecData = KECAMATAN_HST.find(k => k.nama.toLowerCase() === laporKecamatan.toLowerCase());
  const availableDesa = selectedKecData ? selectedKecData.desa : [];

  // Dynamic Scroll & Active Section Spy
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('beranda');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      const sections = ['beranda', 'fitur', 'lapor', 'alur', 'regulasi', 'kontak'];
      const scrollPos = window.scrollY + 120;
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -72;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8] text-slate-800 font-sans flex flex-col selection:bg-[#F0B429] selection:text-[#0F2A4A]">
      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR / HEADER (DYNAMIC GLASS & REPOSITIONED CLEAN HIERARCHY) */}
      {/* ========================================================================= */}
      <header className={`sticky top-0 z-50 transition-all duration-300 text-white ${
        isScrolled 
          ? 'bg-[#0F2A4A]/95 backdrop-blur-xl shadow-xl shadow-slate-950/20 border-b border-slate-700/80' 
          : 'bg-[#0F2A4A]/90 backdrop-blur-md border-b border-slate-700/50'
      }`}>
        <div className={`max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-6 transition-all duration-300 ${
          isScrolled ? 'h-16' : 'h-20'
        }`}>
          {/* Logo & Brand Identity */}
          <div 
            onClick={() => scrollToSection('beranda')}
            className="flex items-center gap-3 shrink-0 cursor-pointer group select-none"
          >
            <div className={`rounded-2xl bg-gradient-to-br from-[#F0B429] to-[#d99f1f] p-0.5 shadow-md shadow-[#F0B429]/20 flex items-center justify-center transition-all duration-300 group-hover:scale-105 shrink-0 ${
              isScrolled ? 'w-10 h-10' : 'w-11 h-11'
            }`}>
              <div className="w-full h-full bg-[#0F2A4A] rounded-[14px] flex items-center justify-center text-[#F0B429]">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white whitespace-nowrap">
                  GARDA MURAKATA
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-black bg-[#F0B429] text-[#0F2A4A] rounded uppercase tracking-wider">
                  Resmi
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-300 font-medium mt-1 leading-none whitespace-nowrap hidden sm:block">
                Satpol PP Kab. Hulu Sungai Tengah
              </p>
            </div>
          </div>

          {/* Center Dynamic Navigation Capsule (Glass Floating Pill) */}
          <nav className="hidden xl:flex items-center gap-1 bg-white/[0.07] backdrop-blur-md px-2 py-1.5 rounded-full border border-white/10 text-xs font-semibold text-slate-200 shadow-inner">
            <button 
              type="button" 
              onClick={() => scrollToSection('beranda')} 
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                activeSection === 'beranda' 
                  ? 'bg-[#F0B429] text-[#0F2A4A] font-extrabold shadow-xs' 
                  : 'hover:text-white hover:bg-white/10'
              }`}
            >
              Beranda
            </button>
            <button 
              type="button" 
              onClick={() => scrollToSection('fitur')} 
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                activeSection === 'fitur' 
                  ? 'bg-[#F0B429] text-[#0F2A4A] font-extrabold shadow-xs' 
                  : 'hover:text-white hover:bg-white/10'
              }`}
            >
              Layanan & Fitur
            </button>
            <button 
              type="button" 
              onClick={() => scrollToSection('lapor')} 
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                activeSection === 'lapor' 
                  ? 'bg-[#F0B429] text-[#0F2A4A] font-extrabold shadow-xs' 
                  : 'hover:text-white hover:bg-white/10 text-amber-300 font-bold'
              }`}
            >
              <Megaphone className="w-3 h-3" />
              <span>Form Lapor</span>
            </button>
            <button 
              type="button" 
              onClick={() => scrollToSection('alur')} 
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                activeSection === 'alur' 
                  ? 'bg-[#F0B429] text-[#0F2A4A] font-extrabold shadow-xs' 
                  : 'hover:text-white hover:bg-white/10'
              }`}
            >
              Alur Penindakan
            </button>
            <button 
              type="button" 
              onClick={() => scrollToSection('regulasi')} 
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                activeSection === 'regulasi' 
                  ? 'bg-[#F0B429] text-[#0F2A4A] font-extrabold shadow-xs' 
                  : 'hover:text-white hover:bg-white/10'
              }`}
            >
              Dasar Perda
            </button>
            <button 
              type="button" 
              onClick={() => scrollToSection('kontak')} 
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                activeSection === 'kontak' 
                  ? 'bg-[#F0B429] text-[#0F2A4A] font-extrabold shadow-xs' 
                  : 'hover:text-white hover:bg-white/10'
              }`}
            >
              Kontak
            </button>
          </nav>

          {/* Right-Side Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Lacak Tiket (Citizen QR Tracking) */}
            <button
              type="button"
              onClick={() => onOpenPublicPortal('lacak')}
              className="px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-white/10 border border-white/15 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              title="Lacak status tindak lanjut pengaduan via nomor tiket atau QR Code"
            >
              <QrCode className="w-3.5 h-3.5 text-[#F0B429] shrink-0" />
              <span className="hidden md:inline">Lacak Tiket QR</span>
              <span className="md:hidden">Lacak</span>
            </button>

            {/* Lapor Pengaduan CTA Button */}
            <button
              type="button"
              onClick={() => scrollToSection('lapor')}
              className="px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Laporkan gangguan ketertiban umum online"
            >
              <Megaphone className="w-3.5 h-3.5 text-[#F0B429] shrink-0" />
              <span className="hidden sm:inline">Lapor Pengaduan</span>
              <span className="sm:hidden">Lapor</span>
            </button>

            {/* Subtle Divider */}
            <div className="h-6 w-px bg-white/20 hidden sm:block"></div>

            {/* Masuk Portal Petugas CTA Button */}
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="px-3 sm:px-4 py-2 rounded-xl text-xs font-extrabold bg-[#F0B429] hover:bg-[#e2a820] text-[#0F2A4A] flex items-center gap-1.5 shadow-md shadow-[#F0B429]/20 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5 text-[#0F2A4A] shrink-0" />
              <span>Masuk Petugas</span>
            </button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 ml-1 transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-Down Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-[#0A1F36]/98 backdrop-blur-xl border-t border-slate-700/80 px-4 pt-3 pb-6 animate-in slide-in-from-top duration-200 shadow-2xl">
            <div className="flex flex-col gap-1.5 text-sm font-semibold text-slate-200">
              <button 
                type="button" 
                onClick={() => scrollToSection('beranda')} 
                className={`text-left px-3 py-2.5 rounded-xl transition-colors ${
                  activeSection === 'beranda' ? 'bg-[#F0B429] text-[#0F2A4A] font-extrabold' : 'hover:bg-white/10'
                }`}
              >
                Beranda
              </button>
              <button 
                type="button" 
                onClick={() => scrollToSection('fitur')} 
                className={`text-left px-3 py-2.5 rounded-xl transition-colors ${
                  activeSection === 'fitur' ? 'bg-[#F0B429] text-[#0F2A4A] font-extrabold' : 'hover:bg-white/10'
                }`}
              >
                Layanan & Fitur
              </button>
              <button 
                type="button" 
                onClick={() => scrollToSection('lapor')} 
                className={`text-left px-3 py-2.5 rounded-xl transition-colors flex items-center gap-2 ${
                  activeSection === 'lapor' ? 'bg-[#F0B429] text-[#0F2A4A] font-extrabold' : 'hover:bg-white/10 text-[#F0B429]'
                }`}
              >
                <Megaphone className="w-4 h-4" />
                <span>Form Lapor Pengaduan Warga</span>
              </button>
              <button 
                type="button" 
                onClick={() => scrollToSection('alur')} 
                className={`text-left px-3 py-2.5 rounded-xl transition-colors ${
                  activeSection === 'alur' ? 'bg-[#F0B429] text-[#0F2A4A] font-extrabold' : 'hover:bg-white/10'
                }`}
              >
                Alur Penindakan
              </button>
              <button 
                type="button" 
                onClick={() => scrollToSection('regulasi')} 
                className={`text-left px-3 py-2.5 rounded-xl transition-colors ${
                  activeSection === 'regulasi' ? 'bg-[#F0B429] text-[#0F2A4A] font-extrabold' : 'hover:bg-white/10'
                }`}
              >
                Dasar Perda
              </button>
              <button 
                type="button" 
                onClick={() => scrollToSection('kontak')} 
                className={`text-left px-3 py-2.5 rounded-xl transition-colors ${
                  activeSection === 'kontak' ? 'bg-[#F0B429] text-[#0F2A4A] font-extrabold' : 'hover:bg-white/10'
                }`}
              >
                Kontak & Informasi
              </button>
            </div>

            <div className="pt-4 mt-3 border-t border-slate-700/80 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPublicPortal('lacak');
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-white/10 text-white flex items-center justify-center gap-2 border border-white/20"
              >
                <QrCode className="w-4 h-4 text-[#F0B429]" />
                <span>Lacak Tiket via QR</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  scrollToSection('lapor');
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white flex items-center justify-center gap-2 shadow-xs"
              >
                <Megaphone className="w-4 h-4 text-[#F0B429]" />
                <span>Lapor Pengaduan Warga</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateToLogin();
                }}
                className="w-full py-3 rounded-xl text-xs font-extrabold bg-[#F0B429] text-[#0F2A4A] flex items-center justify-center gap-2 shadow-md"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk ke Portal Petugas</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION */}
      {/* ========================================================================= */}
      <section id="beranda" className="relative bg-gradient-to-b from-[#0F2A4A] via-[#14365D] to-[#0F2A4A] text-white pt-16 pb-24 overflow-hidden">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#F0B429]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-32 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Government Badges */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-slate-200 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#F0B429] animate-pulse"></span>
              <span>Pemerintah Kabupaten Hulu Sungai Tengah</span>
              <span className="text-slate-400">•</span>
              <span className="text-[#F0B429] font-bold">Satpol PP HST</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Sistem Informasi Terpadu <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-[#F0B429] to-yellow-200">
                Penegakan Perda & Trantibum
              </span>
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Platform operasional modern untuk digitalisasi penertiban, monitoring patroli ber-GPS, pemetaan sebaran titik rawan di 11 kecamatan, dan pelayanan pengaduan terbuka demi Banua Murakata yang tertib dan berkeadilan.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#F0B429] hover:bg-[#e2a820] text-[#0F2A4A] text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-xl shadow-[#F0B429]/25 hover:shadow-[#F0B429]/40 transition-all cursor-pointer active:scale-95"
              >
                <LogIn className="w-4 h-4 text-[#0F2A4A]" />
                <span>Masuk Portal Petugas</span>
                <ArrowRight className="w-4 h-4 text-[#0F2A4A]" />
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('lapor')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <Megaphone className="w-4 h-4 text-[#F0B429]" />
                <span>Lapor Pengaduan Warga</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenPublicPortal('lacak')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold border border-white/25 flex items-center justify-center gap-2 transition-all cursor-pointer backdrop-blur-md"
              >
                <QrCode className="w-4 h-4 text-[#F0B429]" />
                <span>Lacak Tiket via QR</span>
              </button>
            </div>

            {/* Quick Citizen Tracking Bar (Live Search by Ticket) */}
            <div className="pt-6 max-w-xl mx-auto">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const inputVal = e.target.ticketCode.value.trim();
                  if (inputVal) onOpenPublicPortal('lacak', inputVal);
                  else onOpenPublicPortal('lacak');
                }}
                className="p-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex flex-col sm:flex-row items-center gap-2 shadow-xl"
              >
                <div className="relative flex-1 w-full">
                  <QrCode className="w-4 h-4 text-[#F0B429] absolute left-3.5 top-3.5" />
                  <input
                    name="ticketCode"
                    type="text"
                    placeholder="Punya Nomor Tiket? (misal: PGD-HST-202610-0010)"
                    className="w-full pl-10 pr-3 py-2.5 bg-black/40 border border-white/15 rounded-xl text-xs font-mono uppercase text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#F0B429]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#F0B429] hover:bg-[#d99f1f] text-[#0F2A4A] rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap transition-transform active:scale-95"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Lacak Sekarang</span>
                </button>
              </form>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2.5 text-[11px] text-slate-300">
                <span className="text-slate-400 font-medium">Contoh Tiket Pengaduan:</span>
                <button 
                  type="button" 
                  onClick={() => onOpenPublicPortal('lacak', 'PGD-HST-202610-0010')}
                  className="font-mono font-bold underline text-[#F0B429] hover:text-white cursor-pointer"
                >
                  PGD-HST-202610-0010 (Selesai)
                </button>
                <span className="text-slate-500">&bull;</span>
                <button 
                  type="button" 
                  onClick={() => onOpenPublicPortal('lacak', 'PGD-HST-202610-0011')}
                  className="font-mono font-bold underline text-[#F0B429] hover:text-white cursor-pointer"
                >
                  PGD-HST-202610-0011 (Di Lapangan)
                </button>
              </div>
            </div>
          </div>

          {/* Floating Key Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16 max-w-5xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 text-left space-y-2 hover:bg-white/15 transition-all">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-300 flex items-center justify-center font-bold text-lg">
                🚨
              </div>
              <h3 className="font-bold text-white text-sm">Register Penindakan Dinamis</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Pencatatan kegiatan penertiban, pengawasan, dan peneguran trantibum lengkap dengan personil regu dan titik GPS.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 text-left space-y-2 hover:bg-white/15 transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#F0B429]/20 text-[#F0B429] flex items-center justify-center font-bold text-lg">
                ⚖️
              </div>
              <h3 className="font-bold text-white text-sm">Sanksi Berjenjang & QR Code</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Alur penegakan terstruktur: Pernyataan, SP1, SP2, SP3 hingga Eksekusi dengan verifikasi bukti foto wajib.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 text-left space-y-2 hover:bg-white/15 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-lg">
                🗺️
              </div>
              <h3 className="font-bold text-white text-sm">Peta Titik Rawan 11 Kecamatan</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Visualisasi titik razia dan ranking otomatis untuk mengetahui wilayah pelanggaran terbanyak di Hulu Sungai Tengah.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PUBLIC TRANSPARENCY STATISTICS */}
      {/* ========================================================================= */}
      <section className="bg-white border-y border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#0F2A4A] font-mono block">11</span>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mt-1">Kecamatan Terjangkau</span>
              <span className="text-[11px] text-slate-400">Seluruh wilayah hukum HST</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <span className="text-3xl sm:text-4xl font-extrabold text-emerald-700 font-mono block">100%</span>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mt-1">Payung Hukum Sah</span>
              <span className="text-[11px] text-slate-400">Rujukan Perda Resmi Pemkab</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <span className="text-3xl sm:text-4xl font-extrabold text-amber-600 font-mono block">4 Regu</span>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mt-1">Siaga Patroli</span>
              <span className="text-[11px] text-slate-400">Monitoring & check-in GPS</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <span className="text-3xl sm:text-4xl font-extrabold text-blue-700 font-mono block">24 / 7</span>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mt-1">Portal Pengaduan</span>
              <span className="text-[11px] text-slate-400">Bebas akses bagi masyarakat</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. LAYANAN & FITUR UTAMA */}
      {/* ========================================================================= */}
      <section id="fitur" className="py-20 bg-[#F5F6F8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0F2A4A] bg-[#F0B429]/30 px-3 py-1 rounded-full border border-[#F0B429]/50">
              Modul & Kapabilitas Unggulan
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F2A4A] tracking-tight">
              Arsitektur Sistem Modern Penegakan Hukum Daerah
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Dirancang khusus untuk mendukung operasional lapangan dan manajerial pimpinan Satpol PP Kabupaten Hulu Sungai Tengah
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all text-left space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#0F2A4A] text-[#F0B429] flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-[#0F2A4A] text-base">Buku Register Trantibum Digital</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pencatatan buku register dinas penertiban, pengamanan, pengawasan, dan peneguran. Dilengkapi multi-personil sistem ceklis, sorting per bulan, dan sistem halaman paging.
              </p>
              <div className="pt-2 text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ekspor CSV & Format Cetak Dinas</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all text-left space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#0F2A4A] text-[#F0B429] flex items-center justify-center">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-[#0F2A4A] text-base">Sanksi Berjenjang & Generator Surat</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Alur penegakan bertahap (Pernyataan s/d Eksekusi) dengan gatekeeping bukti foto wajib. Pembuatan otomatis surat dinas resmi Pemkab HST ber-QR Code validasi.
              </p>
              <div className="pt-2 text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Deteksi Residivis Otomatis via NIK</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all text-left space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#0F2A4A] text-[#F0B429] flex items-center justify-center">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-[#0F2A4A] text-base">Peta Spasial & Titik Rawan</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pemetaan titik kegiatan penindakan lapangan dan berkas perkara. Menghitung peringkat area kejadian terbanyak di 11 kecamatan secara otomatis dan presisi.
              </p>
              <div className="pt-2 text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Integrasi Koordinat PostGIS 4326</span>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all text-left space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#0F2A4A] text-[#F0B429] flex items-center justify-center">
                <Car className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-[#0F2A4A] text-base">Monitoring Patroli & Check-in GPS</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Penyusunan jadwal regu patroli harian, presensi GPS saat check-in di lapangan, dan integrasi tombol "Catat Temuan" yang langsung membuka berkas perkara baru.
              </p>
              <div className="pt-2 text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pencatatan Waktu & Koordinat Riil</span>
              </div>
            </div>

            {/* Card 5 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all text-left space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#0F2A4A] text-[#F0B429] flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-[#0F2A4A] text-base">Portal Pengaduan & Pelacak QR Warga</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Layanan aduan masyarakat tanpa perlu login. Menerbitkan nomor tiket dan QR Code resmi untuk melacak progres verifikasi, disposisi regu patroli, hingga dokumentasi bukti penertiban lapangan.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenPublicPortal('buat')}
                  className="px-3 py-1.5 bg-[#0F2A4A] hover:bg-[#14365D] text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                >
                  <Megaphone className="w-3 h-3 text-[#F0B429]" />
                  <span>Lapor Aduan</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenPublicPortal('lacak')}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <QrCode className="w-3 h-3 text-blue-700" />
                  <span>Lacak Tiket QR</span>
                </button>
              </div>
            </div>

            {/* Card 6 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all text-left space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#0F2A4A] text-[#F0B429] flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-[#0F2A4A] text-base">Master Regulasi & Data Wilayah</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Katalog referensi Peraturan Daerah terstruktur, data master pegawai/regu operasional, master pelapor, dan master wilayah dari kecamatan hingga desa/kelurahan.
              </p>
              <div className="pt-2 text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>CRUD Lengkap Master Perda & Wilayah</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4B. FORM LAPOR PENGADUAN WARGA ONLINE (GPS, FITUR PETA, & UPLOAD FOTO) */}
      {/* ========================================================================= */}
      <section id="lapor" className="py-20 bg-gradient-to-b from-[#F5F6F8] via-white to-[#F5F6F8] border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0F2A4A] bg-[#F0B429]/30 px-3 py-1 rounded-full border border-[#F0B429]/50">
              Pelayanan Publik Online 24 Jam
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F2A4A] tracking-tight">
              Formulir Pengaduan Pelanggaran Trantibum & Perda
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Laporkan gangguan ketertiban umum di wilayah Kabupaten Hulu Sungai Tengah. Dilengkapi pendeteksi GPS langsung, penandaan titik di peta, dan unggah foto dokumentasi kejadian.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 text-left">
            {submittedReport ? (
              /* Success Submission Card with QR Code */
              <div className="space-y-6 text-center py-4 animate-in zoom-in-95">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold text-[#0F2A4A]">Laporan Anda Berhasil Terkirim!</h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                    Laporan telah terdaftar resmi di Mako Satpol PP Kabupaten Hulu Sungai Tengah. Simpan Tanda Terima Digital dan QR Code tiket Anda untuk memantau status tindak lanjut:
                  </p>
                </div>

                <div className="max-w-md mx-auto">
                  <QrCodeView 
                    value={submittedReport.nomorTiket}
                    size={180}
                    title="Tanda Terima Tiket Pengaduan"
                    subtitle="Pindai QR ini sewaktu-waktu untuk melihat pergerakan personil regu patroli"
                  />
                </div>

                <div className="max-w-md mx-auto p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-left space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Judul Pengaduan:</span>
                    <span className="font-bold text-[#0F2A4A]">{submittedReport.judul}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Lokasi:</span>
                    <span className="font-semibold text-slate-800">{submittedReport.alamat}, Kec. {submittedReport.kecamatan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Titik Koordinat:</span>
                    <span className="font-mono text-slate-700">{Number(submittedReport.lat).toFixed(6)}, {Number(submittedReport.lng).toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Waktu Lapor:</span>
                    <span className="font-mono text-slate-700">{submittedReport.tglPengaduan}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => onOpenPublicPortal('lacak', submittedReport.nomorTiket)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-md transition-transform active:scale-95 cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 text-[#F0B429]" />
                    <span>Lacak Status Tiket Ini Sekarang &rarr;</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedReport(null);
                      setLaporJudul('');
                      setLaporDeskripsi('');
                      setLaporAlamat('');
                    }}
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Kirim Laporan Baru Lainnya
                  </button>
                </div>
              </div>
            ) : (
              /* The Form */
              <form onSubmit={handleLaporSubmit} className="space-y-4 text-xs">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-2.5 text-blue-900">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[11.5px] leading-relaxed">
                    Identitas pelapor <b>dijamin kerahasiaannya</b> oleh Satpol PP Kab. Hulu Sungai Tengah sesuai ketentuan perundang-undangan. Anda akan mendapatkan <b>QR Code Tiket Pelacakan</b> setelah laporan dikirim.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Pelapor *</label>
                    <input
                      type="text"
                      value={laporNama}
                      onChange={(e) => setLaporNama(e.target.value)}
                      placeholder="Contoh: Muhammad Ramli"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden font-semibold text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">No. WhatsApp / HP Aktif (Untuk Notifikasi) *</label>
                    <input
                      type="tel"
                      value={laporNoHp}
                      onChange={(e) => setLaporNoHp(e.target.value)}
                      placeholder="0812xxxxxxxx"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden font-semibold text-xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Judul / Pokok Pengaduan *</label>
                  <input
                    type="text"
                    value={laporJudul}
                    onChange={(e) => setLaporJudul(e.target.value)}
                    placeholder="Contoh: Penertiban lapak PKL liar menutupi akses pedestrian trotoar"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden font-semibold text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kecamatan Lokasi Kejadian *</label>
                    <select
                      value={laporKecamatan}
                      onChange={(e) => {
                        setLaporKecamatan(e.target.value);
                        setLaporDesa('');
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white font-bold text-xs"
                    >
                      {KECAMATAN_HST.map(k => (
                        <option key={k.id} value={k.nama}>Kecamatan {k.nama}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Desa / Kelurahan (Opsional)</label>
                    <select
                      value={laporDesa}
                      onChange={(e) => setLaporDesa(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white font-medium text-xs"
                    >
                      <option value="">Pilih Desa / Kelurahan...</option>
                      {availableDesa.map(d => (
                        <option key={d} value={d}>Desa/Kel. {d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap & Patokan Lapangan *</label>
                  <input
                    type="text"
                    value={laporAlamat}
                    onChange={(e) => setLaporAlamat(e.target.value)}
                    placeholder="Contoh: Jl. Murakata seberang Taman Dwi Warna, samping jembatan"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden font-medium text-xs"
                    required
                  />
                </div>

                {/* PENENTUAN TITIK GPS & FITUR PETA SPASIAL */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-extrabold text-[#0F2A4A] flex items-center gap-1.5 text-xs">
                        <MapPin className="w-4 h-4 text-red-600" />
                        <span>Titik Lokasi Kejadian (Fitur GPS & Peta Interaktif)</span>
                      </span>
                      <p className="text-[10.5px] text-slate-500 mt-0.5">
                        Bantu petugas mengetahui titik kejadian secara presisi
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Tombol Ambil GPS Lokasi Saya */}
                      <button
                        type="button"
                        onClick={handleCaptureGPS}
                        disabled={isCapturingGPS}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                        title="Ambil titik koordinat otomatis menggunakan sensor GPS perangkat Anda saat ini"
                      >
                        {isCapturingGPS ? (
                          <>
                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            <span>Mencari Satelit...</span>
                          </>
                        ) : (
                          <>
                            <Crosshair className="w-3.5 h-3.5 text-[#F0B429]" />
                            <span>Ambil GPS Saya</span>
                          </>
                        )}
                      </button>

                      {/* Tombol Fitur Peta Interaktif */}
                      <button
                        type="button"
                        onClick={() => setIsMapPickerOpen(true)}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                        title="Buka pop-up peta interaktif untuk menandai titik di peta jika melapor di luar tempat kejadian"
                      >
                        <MapPin className="w-3.5 h-3.5 text-red-600" />
                        <span>Pilih di Peta HST</span>
                      </button>
                    </div>
                  </div>

                  {/* Status Lencana GPS / Peta */}
                  {gpsLocked && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-[11px] font-bold animate-in fade-in">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>🛰️ Lokasi GPS Anda Berhasil Dikunci Presisi (Akurasi: ±{gpsAccuracy}m)</span>
                    </div>
                  )}

                  {coordSource === 'map_picker' && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-[11px] font-bold animate-in fade-in">
                      <MapPin className="w-3.5 h-3.5 text-red-600" />
                      <span>🗺️ Titik Ditandai Melalui Fitur Peta Spasial Interaktif</span>
                    </div>
                  )}

                  {/* Koordinat Info Bar */}
                  <div className="flex items-center justify-between text-[11px] bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="font-mono text-slate-700 font-semibold">
                      Koordinat: <b className="text-[#0F2A4A]">{laporLat.toFixed(6)}, {laporLng.toFixed(6)}</b> (Kec. {laporKecamatan})
                    </span>
                    <a
                      href={`https://www.google.com/maps?q=${laporLat},${laporLng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                    >
                      <span>Cek Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Uraian Rinci Situasi / Kejadian *</label>
                  <textarea
                    rows={3}
                    value={laporDeskripsi}
                    onChange={(e) => setLaporDeskripsi(e.target.value)}
                    placeholder="Jelaskan secara jelas bentuk gangguan ketertiban umum, jam terjadinya, dan dampak bagi masyarakat sekitar..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden font-medium text-xs"
                    required
                  />
                </div>

                {/* Upload Foto Bukti Lapangan */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700">
                      Lampiran Foto Bukti Lapangan (Kamera / File)
                    </label>
                    <span className="text-[10.5px] text-slate-500">Maks. 5 MB (JPG/PNG)</span>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border border-slate-300 bg-slate-200 shadow-2xs shrink-0 relative group">
                      <img 
                        src={laporFotoUrl} 
                        alt="Foto Bukti" 
                        className="w-full h-full object-cover" 
                      />
                    </div>

                    <div className="flex-1 space-y-2 w-full">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Tombol Ambil Foto Kamera / Pilih File */}
                        <label className="px-4 py-2 bg-[#0F2A4A] hover:bg-[#14365D] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer active:scale-95">
                          <Camera className="w-3.5 h-3.5 text-[#F0B429]" />
                          <span>Ambil Foto / Unggah File</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment" 
                            className="hidden" 
                            onChange={handlePhotoUpload} 
                          />
                        </label>

                        {/* Reset / Demo Photo */}
                        <button
                          type="button"
                          onClick={() => {
                            setLaporFotoUrl('https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&auto=format&fit=crop&q=80');
                            setLaporPhotoName('contoh-spanduk-liar.jpg');
                          }}
                          className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                        >
                          Ganti Contoh
                        </button>
                      </div>

                      <p className="text-[10.5px] text-slate-500 leading-tight">
                        {laporPhotoName ? (
                          <span className="text-emerald-700 font-semibold">✓ File terpilih: {laporPhotoName}</span>
                        ) : (
                          <span>Foto dokumentasi membantu regu patroli mengenali target penertiban saat tiba di lapangan.</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#0F2A4A] hover:bg-[#14365D] text-white font-extrabold rounded-2xl shadow-lg shadow-[#0F2A4A]/20 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98 text-sm"
                  >
                    <Send className="w-4 h-4 text-[#F0B429]" />
                    <span>Kirim Pengaduan & Terbitkan Tiket QR</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. ALUR PENINDAKAN & PELAYANAN (STEPPER) */}
      {/* ========================================================================= */}
      <section id="alur" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0F2A4A] bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              Prosedur Operasional Standar
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F2A4A] tracking-tight">
              Alur Penanganan Laporan & Penegakan Perda
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Standar tahapan kerja terukur dan berkeadilan bagi seluruh personil Satpol PP Hulu Sungai Tengah
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3 relative">
              <span className="w-8 h-8 rounded-full bg-[#0F2A4A] text-[#F0B429] flex items-center justify-center font-bold text-sm">
                1
              </span>
              <h4 className="font-extrabold text-[#0F2A4A] text-sm">Penerimaan & Temuan</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Laporan masuk dari kanal publik warga atau hasil temuan langsung tim patroli regu saat beroperasi di lapangan.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3 relative">
              <span className="w-8 h-8 rounded-full bg-[#0F2A4A] text-[#F0B429] flex items-center justify-center font-bold text-sm">
                2
              </span>
              <h4 className="font-extrabold text-[#0F2A4A] text-sm">Verifikasi & Penugasan</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Petugas/Admin memverifikasi bukti laporan dan menugaskan tim personil (Regu I, Regu II, atau Regu Penegakan) ke lokasi kejadian.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3 relative">
              <span className="w-8 h-8 rounded-full bg-[#0F2A4A] text-[#F0B429] flex items-center justify-center font-bold text-sm">
                3
              </span>
              <h4 className="font-extrabold text-[#0F2A4A] text-sm">Penertiban Humanis</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pelaksanaan penindakan di lapangan berlandaskan Perda, pembuatan berita acara, dan dokumentasi bukti otentik.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3 relative">
              <span className="w-8 h-8 rounded-full bg-[#0F2A4A] text-[#F0B429] flex items-center justify-center font-bold text-sm">
                4
              </span>
              <h4 className="font-extrabold text-[#0F2A4A] text-sm">Rekapitulasi & Spasial</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Data tercatat permanen di buku register dinas, dievaluasi pada peta spasial wilayah, dan laporan status terupdate ke pelapor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. DASAR HUKUM PERDA HST */}
      {/* ========================================================================= */}
      <section id="regulasi" className="py-20 bg-[#F5F6F8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0F2A4A] bg-[#F0B429]/30 px-3 py-1 rounded-full border border-[#F0B429]/50">
              Landasan Yuridis
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F2A4A] tracking-tight">
              Peraturan Daerah Kabupaten Hulu Sungai Tengah
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Payung hukum resmi yang menjadi rujukan dalam setiap kegiatan patroli dan penertiban
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-left">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">
                Trantibum Utama
              </span>
              <h4 className="font-bold text-[#0F2A4A] text-base">Perda No. 6 Tahun 2024</h4>
              <p className="text-xs text-slate-500 font-medium">Penyelenggaraan Ketenteraman dan Ketertiban Umum</p>
              <p className="text-xs text-slate-600 pt-2 border-t border-slate-100 leading-relaxed">
                Mengatur penertiban pemanfaatan jalan, trotoar, taman kota, tertib tuna susila, serta larangan mengemis dan badut liar.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-left">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                Pajak & Reklame
              </span>
              <h4 className="font-bold text-[#0F2A4A] text-base">Perda No. 1 Tahun 2024</h4>
              <p className="text-xs text-slate-500 font-medium">Pajak Daerah dan Retribusi Daerah</p>
              <p className="text-xs text-slate-600 pt-2 border-t border-slate-100 leading-relaxed">
                Mengatur penertiban media promosi komersil liar, spanduk, bando, dan banner tanpa izin atau kedaluwarsa masa retribusi.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-left">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                Ketertiban Khusus
              </span>
              <h4 className="font-bold text-[#0F2A4A] text-base">Perda No. 3 Tahun 2016</h4>
              <p className="text-xs text-slate-500 font-medium">Penyelenggaraan Kegiatan Bulan Suci Ramadhan</p>
              <p className="text-xs text-slate-600 pt-2 border-t border-slate-100 leading-relaxed">
                Mengatur jam operasional rumah makan, warung makan, serta kepatuhan menghormati ibadah warga di Kabupaten Hulu Sungai Tengah.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. CTA BANNER MASUK SISTEM */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-r from-[#0F2A4A] via-[#14365D] to-[#0F2A4A] text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-[#F0B429] text-[#0F2A4A] flex items-center justify-center mx-auto font-bold shadow-lg shadow-[#F0B429]/30">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Akses Khusus Aparatur Penegak Perda
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Halaman internal ini diperuntukkan bagi Pimpinan, Petugas Penegak Perda, dan Personil Satpol PP Pemkab Hulu Sungai Tengah yang memiliki otorisasi kedinasan.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="px-8 py-3.5 rounded-2xl bg-[#F0B429] hover:bg-[#e2a820] text-[#0F2A4A] text-sm font-extrabold inline-flex items-center gap-2 shadow-xl shadow-[#F0B429]/20 transition-all cursor-pointer active:scale-95"
            >
              <LogIn className="w-4 h-4 text-[#0F2A4A]" />
              <span>Masuk ke Dashboard Sistem</span>
              <ArrowRight className="w-4 h-4 text-[#0F2A4A]" />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FOOTER RESMI */}
      {/* ========================================================================= */}
      <footer id="kontak" className="bg-[#0A1F36] text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-left">
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#F0B429] text-[#0F2A4A] flex items-center justify-center font-bold">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-white text-base">GARDA MURAKATA</span>
                  <p className="text-[10px] text-slate-400">Satpol PP Kabupaten Hulu Sungai Tengah</p>
                </div>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed max-w-md">
                Sistem Informasi Terpadu Penegakan Peraturan Daerah, Trantibum, dan Pengaduan Masyarakat Pemerintah Kabupaten Hulu Sungai Tengah, Provinsi Kalimantan Selatan.
              </p>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-white text-xs uppercase tracking-wider">Alamat Kantor</h5>
              <p className="leading-relaxed">
                Mako Satuan Polisi Pamong Praja <br />
                Jl. Perwira No. 1, Barabai <br />
                Kab. Hulu Sungai Tengah <br />
                Kalimantan Selatan 71315
              </p>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-white text-xs uppercase tracking-wider">Layanan Informasi</h5>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-3.5 h-3.5 text-[#F0B429]" />
                  <span>Call Center: (0517) 41234</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#F0B429]" />
                  <span>satpolpp@hulusungaitengahkab.go.id</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#F0B429]" />
                  <span>Senin - Jumat: 08.00 - 16.30 WITA</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 text-center flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
            <span>© 2026 Pemerintah Kabupaten Hulu Sungai Tengah. Seluruh Hak Cipta Dilindungi.</span>
            <span>GARDA MURAKATA • Sistem Digital Penegakan Perda & Trantibum</span>
          </div>
        </div>
      </footer>

      {/* POPUP PETA INTERAKTIF UNTUK FORM LANDING PAGE */}
      <ModalMapPicker
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        initialLat={laporLat}
        initialLng={laporLng}
        currentKecamatan={laporKecamatan}
        currentDesa={laporDesa}
        onSelectLocation={handleLocationFromMap}
        title="Tandai Titik Lokasi Kejadian di Peta Kab. HST"
        subtitle="Geser pin merah atau klik peta pada posisi kejadian untuk mempermudah respon cepat Regu Satpol PP"
        note="Titik koordinat ini akan disimpan ke dalam Buku Register Pengaduan untuk analisis respon cepat."
      />
    </div>
  );
}

