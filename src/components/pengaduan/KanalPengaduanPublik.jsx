import React, { useState, useEffect, useRef } from 'react';
import { 
  Megaphone, 
  Camera, 
  MapPin, 
  CheckCircle2, 
  Search, 
  ShieldCheck, 
  X, 
  Clock, 
  ArrowRight,
  Send,
  QrCode,
  Scan,
  Printer,
  Download,
  AlertTriangle,
  Car,
  Users,
  FileCheck,
  Eye,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
  Crosshair,
  Upload,
  Trash2,
  Check
} from 'lucide-react';
import { KECAMATAN_HST } from '../../data/mockData';
import { createPengaduan, getPengaduanList } from '../../data/storageService';
import QrCodeView from '../common/QrCodeView';
import ModalMapPicker from '../common/ModalMapPicker';

export default function KanalPengaduanPublik({ 
  isOpen, 
  onClose,
  initialTab = 'buat',
  initialTicket = ''
}) {
  const [tab, setTab] = useState(initialTab); // 'buat' or 'lacak'
  
  // Form fields
  const [namaPelapor, setNamaPelapor] = useState('');
  const [noHp, setNoHp] = useState('');
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [kecamatan, setKecamatan] = useState('Barabai');
  const [desa, setDesa] = useState('');
  const [alamat, setAlamat] = useState('');
  const [fotoUrl, setFotoUrl] = useState('https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&auto=format&fit=crop&q=80');
  const [photoFileName, setPhotoFileName] = useState('');
  const [submittedReport, setSubmittedReport] = useState(null);

  // Geolocation & Map Picker states
  const [lat, setLat] = useState(-2.5833);
  const [lng, setLng] = useState(115.3811);
  const [isCapturingGPS, setIsCapturingGPS] = useState(false);
  const [gpsLocked, setGpsLocked] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [coordSource, setCoordSource] = useState('default'); // 'default' | 'gps' | 'map_picker'
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

  // Tracking fields
  const [trackTicketInput, setTrackTicketInput] = useState(initialTicket || '');
  const [trackedReport, setTrackedReport] = useState(null);
  const [isScanningQr, setIsScanningQr] = useState(false);
  const [scanLaserActive, setScanLaserActive] = useState(false);

  // Sync initial props
  useEffect(() => {
    if (initialTab) setTab(initialTab);
    if (initialTicket) {
      setTrackTicketInput(initialTicket);
      executeTrackTicket(initialTicket);
    }
  }, [initialTab, initialTicket, isOpen]);

  if (!isOpen) return null;

  // Handle GPS Device Capture
  const handleCaptureGPS = () => {
    if ('geolocation' in navigator) {
      setIsCapturingGPS(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLat = parseFloat(pos.coords.latitude.toFixed(6));
          const newLng = parseFloat(pos.coords.longitude.toFixed(6));
          setLat(newLat);
          setLng(newLng);
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

  // Handle Location from Map Picker
  const handleLocationFromMap = (selectedLat, selectedLng) => {
    setLat(selectedLat);
    setLng(selectedLng);
    setGpsLocked(false);
    setCoordSource('map_picker');
  };

  // Handle File Upload from Camera or Device Storage
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl) {
        setFotoUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!namaPelapor || !noHp || !judul || !deskripsi || !alamat) {
      alert('Harap lengkapi semua kolom wajib!');
      return;
    }

    const report = createPengaduan({
      namaPelapor,
      noHp,
      judul,
      deskripsi,
      kecamatan,
      desa,
      alamat,
      lat,
      lng,
      fotoUrl
    });

    setSubmittedReport(report);
  };

  const executeTrackTicket = (ticketNo) => {
    const list = getPengaduanList();
    const cleanNo = ticketNo.trim().toUpperCase();
    const found = list.find(r => r.nomorTiket.toUpperCase() === cleanNo);
    setTrackedReport(found || 'not_found');
  };

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (!trackTicketInput.trim()) return;
    executeTrackTicket(trackTicketInput);
  };

  const handleSimulateQrScan = (ticketNumber) => {
    setIsScanningQr(true);
    setScanLaserActive(true);
    setTimeout(() => {
      setScanLaserActive(false);
      setIsScanningQr(false);
      setTrackTicketInput(ticketNumber);
      executeTrackTicket(ticketNumber);
    }, 1500);
  };

  const selectedKecData = KECAMATAN_HST.find(k => k.nama.toLowerCase() === kecamatan.toLowerCase());
  const availableDesa = selectedKecData ? selectedKecData.desa : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-left">
        
        {/* Header Kedinasan Satpol PP */}
        <div className="bg-gradient-to-r from-[#0F2A4A] via-[#14365D] to-[#1E3A8A] text-white p-5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#F0B429] text-[#0F2A4A] flex items-center justify-center font-bold shadow-md shrink-0">
              <Megaphone className="w-5 h-5 text-[#0F2A4A]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white/20 text-[#F0B429] uppercase tracking-wider">
                  SIPOL-PP HST &bull; Portal Warga
                </span>
              </div>
              <h3 className="font-extrabold text-base sm:text-lg text-white leading-tight">
                Layanan Pengaduan & Pelacak Tiket QR
              </h3>
              <p className="text-[11px] text-slate-300">
                Satuan Polisi Pamong Praja Kabupaten Hulu Sungai Tengah
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => { setTab('buat'); setSubmittedReport(null); }}
            className={`flex-1 py-3 text-center border-b-2 flex items-center justify-center gap-2 transition-all cursor-pointer ${
              tab === 'buat' ? 'border-[#0F2A4A] text-[#0F2A4A] bg-white shadow-2xs font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Megaphone className="w-4 h-4 text-amber-500" />
            <span>Form Lapor Pengaduan</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('lacak')}
            className={`flex-1 py-3 text-center border-b-2 flex items-center justify-center gap-2 transition-all cursor-pointer ${
              tab === 'lacak' ? 'border-[#0F2A4A] text-[#0F2A4A] bg-white shadow-2xs font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <QrCode className="w-4 h-4 text-blue-600" />
            <span>Pelacak Tiket via QR & Kode</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* ========================================================================= */}
          {/* TAB 1: FORM BUAT LAPORAN BARU */}
          {/* ========================================================================= */}
          {tab === 'buat' ? (
            submittedReport ? (
              /* Success Submission with Official QR Ticket */
              <div className="space-y-5 text-center py-4 animate-in zoom-in-95">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <h4 className="text-xl font-extrabold text-[#0F2A4A]">Laporan Anda Berhasil Terkirim!</h4>
                  <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                    Laporan telah terdaftar di Mako Satpol PP Kabupaten Hulu Sungai Tengah. Simpan tanda terima digital dan QR Code tiket di bawah ini untuk memantau proses tindak lanjut:
                  </p>
                </div>

                {/* QR Code Ticket Card */}
                <div className="max-w-md mx-auto">
                  <QrCodeView 
                    value={submittedReport.nomorTiket}
                    size={170}
                    title="Tanda Terima Tiket Pengaduan"
                    subtitle="Pindai QR ini sewaktu-waktu untuk melihat pergerakan personil"
                  />
                </div>

                {/* Detail Ringkas */}
                <div className="max-w-md mx-auto p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-left space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Judul Pengaduan:</span>
                    <span className="font-bold text-[#0F2A4A]">{submittedReport.judul}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Wilayah:</span>
                    <span className="font-semibold text-slate-800">Kec. {submittedReport.kecamatan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Waktu Terdaftar:</span>
                    <span className="font-mono text-slate-700">{submittedReport.tglPengaduan}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTab('lacak');
                      setTrackTicketInput(submittedReport.nomorTiket);
                      executeTrackTicket(submittedReport.nomorTiket);
                    }}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-transform active:scale-95 cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 text-[#F0B429]" />
                    <span>Lacak Status Tiket Ini Sekarang &rarr;</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedReport(null);
                      setJudul('');
                      setDeskripsi('');
                      setAlamat('');
                      onClose();
                    }}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Selesai & Tutup
                  </button>
                </div>
              </div>
            ) : (
              /* Formulir Input Pengaduan */
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
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
                      value={namaPelapor}
                      onChange={(e) => setNamaPelapor(e.target.value)}
                      placeholder="Contoh: Muhammad Ramli"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden font-semibold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">No. WhatsApp / HP Aktif (Untuk Notifikasi) *</label>
                    <input
                      type="tel"
                      value={noHp}
                      onChange={(e) => setNoHp(e.target.value)}
                      placeholder="0812xxxxxxxx"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden font-semibold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Judul / Pokok Pengaduan *</label>
                  <input
                    type="text"
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                    placeholder="Contoh: Penertiban lapak PKL liar menutupi akses pedestrian trotoar"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden font-semibold"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kecamatan Lokasi Kejadian *</label>
                    <select
                      value={kecamatan}
                      onChange={(e) => {
                        setKecamatan(e.target.value);
                        setDesa('');
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white font-bold"
                    >
                      {KECAMATAN_HST.map(k => (
                        <option key={k.id} value={k.nama}>Kecamatan {k.nama}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Desa / Kelurahan (Opsional)</label>
                    <select
                      value={desa}
                      onChange={(e) => setDesa(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white font-medium"
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
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    placeholder="Contoh: Jl. Murakata seberang Taman Dwi Warna, samping jembatan"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden font-medium"
                    required
                  />
                </div>

                {/* PENENTUAN TITIK GPS & FITUR PETA SPASIAL */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-extrabold text-[#0F2A4A] flex items-center gap-1.5 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-red-600" />
                        <span>Titik Koordinat Lokasi Kejadian (GPS & Peta)</span>
                      </span>
                      <p className="text-[10.5px] text-slate-500 mt-0.5">
                        Bantu petugas mengetahui titik kejadian secara presisi
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Tombol Ambil GPS Lokasi Saya */}
                      <button
                        type="button"
                        onClick={handleCaptureGPS}
                        disabled={isCapturingGPS}
                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
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
                        className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                        title="Buka pop-up peta interaktif untuk menandai titik di peta jika melapor di luar tempat kejadian"
                      >
                        <MapPin className="w-3.5 h-3.5 text-red-600" />
                        <span>Pilih di Peta</span>
                      </button>
                    </div>
                  </div>

                  {/* Status Lencana GPS / Peta */}
                  {gpsLocked && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-[11px] font-bold animate-in fade-in">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>🛰️ Lokasi GPS Anda Berhasil Dikunci (Akurasi: ±{gpsAccuracy}m)</span>
                    </div>
                  )}

                  {coordSource === 'map_picker' && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-[11px] font-bold animate-in fade-in">
                      <MapPin className="w-3.5 h-3.5 text-red-600" />
                      <span>🗺️ Titik Ditandai Melalui Fitur Peta Interaktif</span>
                    </div>
                  )}

                  {/* Koordinat Info Bar */}
                  <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-xl border border-slate-200">
                    <span className="font-mono text-slate-700 font-semibold">
                      Koordinat: <b className="text-[#0F2A4A]">{lat.toFixed(6)}, {lng.toFixed(6)}</b> (Kec. {kecamatan})
                    </span>
                    <a
                      href={`https://www.google.com/maps?q=${lat},${lng}`}
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
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    placeholder="Jelaskan secara jelas bentuk gangguan ketertiban umum, jam terjadinya, dan dampak bagi masyarakat sekitar..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden font-medium"
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

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center gap-3">
                    <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-300 bg-slate-200 shadow-2xs shrink-0 relative group">
                      <img 
                        src={fotoUrl} 
                        alt="Foto Bukti" 
                        className="w-full h-full object-cover" 
                      />
                    </div>

                    <div className="flex-1 space-y-1.5 w-full">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Tombol Ambil Foto Kamera / Pilih File */}
                        <label className="px-3 py-1.5 bg-[#0F2A4A] hover:bg-[#14365D] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer active:scale-95">
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
                            setFotoUrl('https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&auto=format&fit=crop&q=80');
                            setPhotoFileName('contoh-spanduk-liar.jpg');
                          }}
                          className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                        >
                          Ganti Contoh
                        </button>
                      </div>

                      <p className="text-[10.5px] text-slate-500 leading-tight">
                        {photoFileName ? (
                          <span className="text-emerald-700 font-semibold">✓ File terpilih: {photoFileName}</span>
                        ) : (
                          <span>Foto situasi membantu petugas mengenali sasaran penertiban saat tiba di lokasi.</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#0F2A4A] hover:bg-[#14365D] text-white font-extrabold rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98"
                >
                  <Send className="w-4 h-4 text-[#F0B429]" />
                  <span>Kirim Pengaduan & Terbitkan Tiket QR</span>
                </button>
              </form>
            )
          ) : (
            /* ========================================================================= */
            /* TAB 2: PELACAK TIKET PENGADUAN VIA QR & KODE */
            /* ========================================================================= */
            <div className="space-y-5">
              
              {/* Form Input Tiket + QR Scanner Trigger */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-[#0F2A4A] flex items-center gap-1.5 tracking-wider">
                    <Search className="w-4 h-4 text-blue-600" />
                    <span>Lacak Status & Pergerakan Petugas</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-medium">Transparansi Penanganan Trantibum</span>
                </div>

                <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={trackTicketInput}
                      onChange={(e) => setTrackTicketInput(e.target.value)}
                      placeholder="Masukkan Kode Tiket (misal: PGD-HST-202610-0010)"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono uppercase font-bold focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white text-slate-800"
                      required
                    />
                    <QrCode className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#0F2A4A] hover:bg-[#14365D] text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Search className="w-3.5 h-3.5 text-[#F0B429]" />
                      <span>Lacak Tiket</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSimulateQrScan('PGD-HST-202610-0010')}
                      className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-[#0F2A4A] font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
                      title="Pindai QR Code Tiket menggunakan kamera"
                    >
                      <Scan className="w-4 h-4" />
                      <span className="hidden sm:inline">Pindai QR</span>
                    </button>
                  </div>
                </form>

                {/* Quick Simulation Chips */}
                <div className="pt-2 border-t border-slate-200/80">
                  <span className="text-[10.5px] font-bold text-slate-500 block mb-1.5">
                    💡 Atau pilih contoh tiket pengaduan aktif untuk simulasi pelacakan:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setTrackTicketInput('PGD-HST-202610-0010');
                        executeTrackTicket('PGD-HST-202610-0010');
                      }}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg text-[10.5px] font-mono font-bold text-emerald-800 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>✅ PGD-HST-202610-0010</span>
                      <span className="text-[9.5px] bg-emerald-200 px-1 rounded text-emerald-900 font-sans">Selesai</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTrackTicketInput('PGD-HST-202610-0011');
                        executeTrackTicket('PGD-HST-202610-0011');
                      }}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg text-[10.5px] font-mono font-bold text-amber-900 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>🚨 PGD-HST-202610-0011</span>
                      <span className="text-[9.5px] bg-amber-200 px-1 rounded text-amber-900 font-sans">Di Lapangan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTrackTicketInput('PGD-HST-202610-0012');
                        executeTrackTicket('PGD-HST-202610-0012');
                      }}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-lg text-[10.5px] font-mono font-bold text-blue-900 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>📋 PGD-HST-202610-0012</span>
                      <span className="text-[9.5px] bg-blue-200 px-1 rounded text-blue-900 font-sans">Diverifikasi</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTrackTicketInput('PGD-HST-202610-0013');
                        executeTrackTicket('PGD-HST-202610-0013');
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-[10.5px] font-mono font-bold text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>⏳ PGD-HST-202610-0013</span>
                      <span className="text-[9.5px] bg-slate-300 px-1 rounded text-slate-800 font-sans">Baru Masuk</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* QR Scanner Camera Simulation Viewfinder */}
              {isScanningQr && (
                <div className="p-4 bg-slate-900 text-white rounded-2xl border-2 border-[#F0B429] relative overflow-hidden text-center space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-[#F0B429] flex items-center gap-1.5">
                      <Scan className="w-4 h-4 animate-spin" />
                      <span>Kamera Pemindai QR Tiket Aktif</span>
                    </span>
                    <button 
                      type="button"
                      onClick={() => setIsScanningQr(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="w-48 h-48 mx-auto border-2 border-dashed border-[#F0B429] rounded-2xl relative flex items-center justify-center bg-black/50">
                    {/* Animated Scanning Laser Line */}
                    {scanLaserActive && (
                      <div className="absolute left-2 right-2 h-0.5 bg-red-500 shadow-lg shadow-red-500/80 animate-pulse top-1/2 -translate-y-1/2"></div>
                    )}
                    <QrCode className="w-20 h-20 text-slate-600" />
                  </div>
                  <p className="text-[11px] text-slate-300 font-mono">Membaca data QR Tiket Pengaduan Satpol PP HST...</p>
                </div>
              )}

              {/* Error State: Tiket Tidak Ditemukan */}
              {trackedReport === 'not_found' && (
                <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-2 animate-in fade-in">
                  <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
                  <h5 className="font-extrabold text-rose-900 text-sm">Nomor Tiket Tidak Ditemukan</h5>
                  <p className="text-xs text-rose-700 max-w-md mx-auto">
                    Pastikan nomor tiket yang Anda masukkan sudah benar sesuai format resmi: <code>PGD-HST-YYYYMM-XXXX</code> atau pindai ulang QR Code pada lembar tanda terima laporan Anda.
                  </p>
                </div>
              )}

              {/* Success State: Detail Pelacakan Tiket */}
              {trackedReport && trackedReport !== 'not_found' && (
                <div className="space-y-4 animate-in fade-in">
                  
                  {/* Card 1: Header Dokumen Tiket & Status Operasi */}
                  <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-xs space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Tanda Bukti Registrasi Pengaduan Warga
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-base font-extrabold text-[#0F2A4A] tracking-wider">
                            {trackedReport.nomorTiket}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-2">
                        {trackedReport.status === 'selesai' ? (
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>TUNTAS & TERSELESAIKAN</span>
                          </span>
                        ) : trackedReport.status === 'dalam_penindakan' ? (
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-2xs animate-pulse">
                            <Car className="w-4 h-4 text-amber-700" />
                            <span>PETUGAS DI LAPANGAN</span>
                          </span>
                        ) : trackedReport.status === 'diverifikasi' ? (
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1.5 shadow-2xs">
                            <ShieldCheck className="w-4 h-4 text-blue-700" />
                            <span>TERVERIFIKASI & DISPOSISI</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-800 border border-slate-300 flex items-center gap-1.5 shadow-2xs">
                            <Clock className="w-4 h-4 text-slate-600" />
                            <span>MENUNGGU TELAAH</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Judul & Deskripsi Pengaduan */}
                    <div>
                      <h4 className="font-extrabold text-[#0F2A4A] text-sm sm:text-base leading-snug">
                        {trackedReport.judul}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
                        {trackedReport.deskripsi}
                      </p>
                    </div>

                    {/* Meta Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-xs border-t border-slate-100 text-slate-700">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Lokasi Kejadian</span>
                        <span className="font-extrabold text-[#0F2A4A] block mt-0.5">
                          📍 Kec. {trackedReport.kecamatan}{trackedReport.desa ? `, Desa ${trackedReport.desa}` : ''}
                        </span>
                        <span className="text-[10.5px] text-slate-600 block mt-0.5 line-clamp-1">
                          {trackedReport.alamat}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Waktu Laporan</span>
                        <span className="font-bold text-slate-800 block mt-0.5 font-mono">
                          {trackedReport.tglPengaduan}
                        </span>
                        <span className="text-[10.5px] text-slate-500 block mt-0.5">
                          Pelapor: <b>{trackedReport.namaPelapor ? `${trackedReport.namaPelapor.substring(0, 3)}***` : 'Warga HST'}</b>
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Regu Penangan</span>
                        <span className="font-extrabold text-[#0F2A4A] block mt-0.5">
                          🛡️ {trackedReport.reguPenangan || 'Regu Piket Mako'}
                        </span>
                        <span className="text-[10.5px] text-slate-500 block mt-0.5">
                          Piket: {trackedReport.petugasPiket || 'Satpol PP HST'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Visual Workflow Stepper Timeline (5 Tahapan) */}
                  <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <h4 className="text-xs font-black uppercase text-[#0F2A4A] tracking-wider flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4 text-blue-600" />
                        <span>Linimasa Alur Penanganan Resmi (*Tracking Stepper*)</span>
                      </h4>
                      <span className="text-[10px] text-slate-400 font-semibold font-mono">SIPOL-PP Workflow</span>
                    </div>

                    <div className="space-y-4 pt-1">
                      {(trackedReport.tahapanLog || []).map((step, sIdx) => {
                        const isDone = step.status === 'done';
                        const isActive = step.status === 'active';
                        const isPending = step.status === 'pending';

                        return (
                          <div key={sIdx} className="flex items-start gap-3 relative">
                            {/* Connecting Line */}
                            {sIdx < (trackedReport.tahapanLog || []).length - 1 && (
                              <div className={`absolute left-4 top-8 bottom-0 w-0.5 -ml-[1px] ${
                                isDone ? 'bg-emerald-500' : isActive ? 'bg-amber-400' : 'bg-slate-200'
                              }`} />
                            )}

                            {/* Step Badge / Circle */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 z-10 shadow-xs ${
                              isDone ? 'bg-emerald-600 text-white' :
                              isActive ? 'bg-[#F0B429] text-[#0F2A4A] ring-4 ring-amber-100 animate-pulse' :
                              'bg-slate-100 text-slate-400 border border-slate-200'
                            }`}>
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : isActive ? (
                                <Clock className="w-4 h-4" />
                              ) : (
                                <span>{step.tahap}</span>
                              )}
                            </div>

                            {/* Step Text Info */}
                            <div className="flex-1 pb-3 text-xs">
                              <div className="flex flex-wrap items-center justify-between gap-1">
                                <span className={`font-extrabold ${
                                  isDone ? 'text-slate-900' : isActive ? 'text-[#0F2A4A] text-sm' : 'text-slate-400'
                                }`}>
                                  {step.nama}
                                </span>
                                {step.waktu && (
                                  <span className="font-mono text-[10.5px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                    {step.waktu}
                                  </span>
                                )}
                              </div>
                              <p className={`text-[11px] mt-0.5 ${
                                isActive ? 'text-amber-900 font-semibold' : 'text-slate-600'
                              }`}>
                                {step.ket}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Card 3: Catatan Resmi Petugas Lapangan */}
                  {trackedReport.catatanAdmin && (
                    <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl text-xs space-y-1">
                      <span className="font-extrabold text-blue-900 flex items-center gap-1.5 uppercase text-[10.5px]">
                        <Info className="w-3.5 h-3.5 text-blue-700" />
                        <span>Catatan Resmi Penanganan Trantibum</span>
                      </span>
                      <p className="text-slate-800 leading-relaxed font-medium">
                        "{trackedReport.catatanAdmin}"
                      </p>
                    </div>
                  )}

                  {/* Card 4: Dokumentasi Foto Komparasi (Awal vs Hasil Tindak Lanjut) */}
                  <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-xs space-y-3">
                    <h4 className="text-xs font-black uppercase text-[#0F2A4A] tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                      <Camera className="w-4 h-4 text-blue-600" />
                      <span>Dokumentasi Visual Lapangan</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Foto Awal Laporan */}
                      <div className="space-y-1.5">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Foto Bukti Awal (Warga)</span>
                        </span>
                        <div className="rounded-xl overflow-hidden border border-slate-200 aspect-video bg-black flex items-center justify-center">
                          <img 
                            src={trackedReport.fotoUrl} 
                            alt="Bukti Awal" 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      </div>

                      {/* Foto Hasil Penyelesaian (Jika ada) */}
                      <div className="space-y-1.5">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Foto Hasil Penertiban (Satpol PP)</span>
                        </span>
                        {trackedReport.fotoTindakLanjut ? (
                          <div className="rounded-xl overflow-hidden border border-emerald-300 aspect-video bg-black flex items-center justify-center">
                            <img 
                              src={trackedReport.fotoTindakLanjut} 
                              alt="Bukti Hasil Tindak Lanjut" 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-slate-300 aspect-video bg-slate-50 flex flex-col items-center justify-center p-3 text-center text-slate-400">
                            <Clock className="w-6 h-6 text-slate-300 mb-1" />
                            <span className="font-semibold text-[11px] text-slate-600">Dokumentasi Sedang Diproses</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">Akan diunggah oleh regu penindak setelah penertiban tuntas.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card 5: QR Code Tiket & Bukti Cetak Struk */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-xl border border-slate-300 shadow-2xs">
                        <QrCode className="w-10 h-10 text-[#0F2A4A]" />
                      </div>
                      <div>
                        <h5 className="font-bold text-[#0F2A4A] text-xs">Simpan / Cetak Tanda Terima QR</h5>
                        <p className="text-[11px] text-slate-500">Gunakan QR ini sewaktu-waktu untuk memverifikasi ke Mako Satpol PP.</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-white hover:bg-slate-100 text-[#0F2A4A] font-bold rounded-xl text-xs border border-slate-300 flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-600" />
                      <span>Cetak Struk QR</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] text-slate-500 font-medium">
            Layanan Pengaduan 24 Jam Satpol PP Barabai &bull; Bebas Pungutan Biaya
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Tutup Portal
          </button>
        </div>
      </div>

      {/* POPUP PETA PEMILIH TITIK LOKASI PENGADUAN WARGA */}
      <ModalMapPicker
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        initialLat={lat}
        initialLng={lng}
        currentKecamatan={kecamatan}
        currentDesa={desa}
        onSelectLocation={handleLocationFromMap}
        title="Tandai Titik Lokasi Pengaduan di Peta"
        subtitle="Geser pin merah atau klik peta pada posisi kejadian untuk mempermudah respon cepat Regu Satpol PP"
        note="Titik koordinat ini akan dikirimkan ke petugas lapangan untuk navigasi patroli respon cepat."
      />
    </div>
  );
}
