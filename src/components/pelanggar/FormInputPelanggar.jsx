import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Search, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  User, 
  Calendar, 
  Map, 
  Sparkles, 
  Eye, 
  Clock, 
  ArrowRight,
  ShieldAlert,
  Image as ImageIcon,
  Plus,
  Trash2,
  X,
  Scan,
  Crosshair,
  ExternalLink,
  Check,
  Edit3
} from 'lucide-react';
import { KECAMATAN_HST } from '../../data/mockData';
import { findPelanggarByNik, getPelanggaranByPelanggarId, createPelanggaran, getPerdaList } from '../../data/storageService';
import { SAMPLE_KTP_PRESETS } from '../../utils/ocrHelper';
import Modal from '../common/Modal';
import ModalOcrScanner from './ModalOcrScanner';
import ModalMapPicker from '../common/ModalMapPicker';
import { StageBadge } from '../common/Badge';

export default function FormInputPelanggar({ onSuccess, onViewDetail }) {
  // Form States
  const [nik, setNik] = useState('');
  const [nama, setNama] = useState('');
  const [tempatLahir, setTempatLahir] = useState('Barabai');
  const [tglLahir, setTglLahir] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState('Laki-laki');
  const [pekerjaan, setPekerjaan] = useState('');
  const [alamat, setAlamat] = useState('');
  const [desa, setDesa] = useState('Barabai Barat');
  const [kecamatan, setKecamatan] = useState('Barabai');
  const [noHp, setNoHp] = useState('');
  
  // Incident Data
  const [lokasiNama, setLokasiNama] = useState('');
  const [selectedPerdaIds, setSelectedPerdaIds] = useState(['perda-1']);
  const [deskripsi, setDeskripsi] = useState('');
  const [sumber, setSumber] = useState('patroli');
  const [lat, setLat] = useState(-2.5833);
  const [lng, setLng] = useState(115.3811);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [isCapturingGPS, setIsCapturingGPS] = useState(false);
  const [gpsLocked, setGpsLocked] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [coordSource, setCoordSource] = useState('default'); // 'default' | 'gps' | 'map_picker' | 'manual'
  
  // Bukti Foto Lapangan States (Maksimal 6 Foto)
  const MAX_PHOTOS = 6;
  const [buktiFotoList, setBuktiFotoList] = useState([
    {
      id: 'foto-init-1',
      url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&auto=format&fit=crop&q=80',
      ket: 'Lapak PKL menempati trotoar & bahu jalan umum'
    }
  ]);

  // OCR & Duplicate Detection states
  const [fotoKtp, setFotoKtp] = useState('');
  const [isScanningOCR, setIsScanningOCR] = useState(false);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [ocrInitialFile, setOcrInitialFile] = useState(null);
  const [existingPelanggar, setExistingPelanggar] = useState(null);
  const [riwayatList, setRiwayatList] = useState([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const handleApplyOcrData = (data) => {
    setNik(data.nik || '');
    setNama((data.nama || '').replace(/\s*\([^)]*\)/g, ''));
    setTempatLahir(data.tempatLahir || 'Barabai');
    setTglLahir(data.tglLahir || '');
    setJenisKelamin(data.jenisKelamin || 'Laki-laki');
    setPekerjaan(data.pekerjaan || '');
    setAlamat(data.alamat || '');
    setDesa(data.desa || 'Barabai Barat');
    setKecamatan(data.kecamatan || 'Barabai');
    if (data.noHp) setNoHp(data.noHp);
    if (data.fotoUrl) setFotoKtp(data.fotoUrl);
  };

  // Handle Multi-Upload Foto Bukti (Maksimal 6)
  const handleUploadPhotos = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = MAX_PHOTOS - buktiFotoList.length;
    if (remainingSlots <= 0) {
      alert(`Maksimal ${MAX_PHOTOS} foto bukti pelanggaran sudah terpenuhi.`);
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      alert(`Hanya ${remainingSlots} foto pertama yang ditambahkan (batas maksimal ${MAX_PHOTOS} foto).`);
    }

    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target?.result;
        if (dataUrl) {
          setBuktiFotoList((prev) => {
            if (prev.length >= MAX_PHOTOS) return prev;
            return [
              ...prev,
              {
                id: `foto-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                url: dataUrl,
                ket: file.name ? `Bukti: ${file.name.substring(0, 30)}` : `Foto Bukti #${prev.length + 1}`
              }
            ];
          });
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemovePhoto = (id) => {
    if (buktiFotoList.length <= 1) {
      if (!confirm('Hapus foto ini? Disarankan minimal ada 1 foto dokumentasi penindakan.')) {
        return;
      }
    }
    setBuktiFotoList((prev) => prev.filter(f => f.id !== id));
  };

  const handleUpdateCaption = (id, newKet) => {
    setBuktiFotoList((prev) => prev.map(f => f.id === id ? { ...f, ket: newKet } : f));
  };

  const handleLoadDemoPhotos = () => {
    const demos = [
      {
        id: `foto-${Date.now()}-1`,
        url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&auto=format&fit=crop&q=80',
        ket: 'Lapak dagangan PKL semi permanen di trotoar'
      },
      {
        id: `foto-${Date.now()}-2`,
        url: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&auto=format&fit=crop&q=80',
        ket: 'Spanduk promosi komersial tanpa izin Perda'
      },
      {
        id: `foto-${Date.now()}-3`,
        url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=600&auto=format&fit=crop&q=80',
        ket: 'Proses penertiban & dialog humanis oleh petugas'
      }
    ];

    setBuktiFotoList((prev) => {
      const combined = [...prev];
      demos.forEach(d => {
        if (combined.length < MAX_PHOTOS && !combined.some(c => c.url === d.url)) {
          combined.push(d);
        }
      });
      return combined;
    });
  };

  // Watch NIK change for deduplication
  useEffect(() => {
    if (nik.length >= 16) {
      const match = findPelanggarByNik(nik);
      if (match) {
        setExistingPelanggar(match);
        const history = getPelanggaranByPelanggarId(match.id);
        setRiwayatList(history);
        setShowDuplicateModal(true);
      } else {
        setExistingPelanggar(null);
        setRiwayatList([]);
      }
    }
  }, [nik]);

  // Handle OCR extraction
  const handleScanPreset = (preset) => {
    setIsScanningOCR(true);
    setTimeout(() => {
      handleApplyOcrData(preset);
      setIsScanningOCR(false);
    }, 400);
  };

  const handleFileUploadOCR = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    // Teruskan ke modal OCR nyata agar hasil bisa diperiksa sebelum diterapkan
    setOcrInitialFile(file);
    setIsOcrModalOpen(true);
  };

  // Handle Capture GPS Langsung (Di Tempat Kejadian)
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
          alert('Gagal mengambil titik GPS langsung: ' + (err.message || 'Izin lokasi tidak diberikan. Silakan atur manual melalui pop up peta.'));
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      alert('Perangkat tidak mendukung sensor geolokasi.');
    }
  };

  // Handle Titik dari Pop-up Peta Spasial (Input Luar TKP)
  const handleLocationFromMap = (selectedLat, selectedLng) => {
    setLat(selectedLat);
    setLng(selectedLng);
    setGpsLocked(false);
    setCoordSource('map_picker');
  };

  const handleTogglePerda = (id) => {
    if (selectedPerdaIds.includes(id)) {
      if (selectedPerdaIds.length > 1) {
        setSelectedPerdaIds(selectedPerdaIds.filter(item => item !== id));
      }
    } else {
      setSelectedPerdaIds([...selectedPerdaIds, id]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nik || !nama || !deskripsi) {
      alert('Harap lengkapi NIK, Nama, dan Deskripsi Pelanggaran!');
      return;
    }

    const newRecord = createPelanggaran({
      nik,
      namaPelanggar: nama,
      tempatLahir,
      tglLahir,
      jenisKelamin,
      pekerjaan,
      alamat,
      desa,
      kecamatan,
      noHp,
      fotoKtp: fotoKtp || existingPelanggar?.fotoKtp || '',
      lokasiNama,
      perdaIds: selectedPerdaIds,
      deskripsi,
      sumber,
      lat,
      lng,
      buktiFoto: buktiFotoList[0]?.url || '',
      buktiFotoList: buktiFotoList.map(f => ({ url: f.url, ket: f.ket })),
      catatanAwal: `Pencatatan pelanggaran baru di ${lokasiNama || alamat} (${buktiFotoList.length} foto bukti terlampir)`
    });

    setSaveSuccessMsg(`Berhasil mencatat pelanggaran dengan Nomor Register: ${newRecord.nomorRegister}`);
    setTimeout(() => {
      if (onSuccess) onSuccess(newRecord);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Mobile Optimization Notice */}
      <div className="bg-gradient-to-r from-[#0F2A4A] to-[#14304F] text-white p-5 rounded-2xl shadow-md border border-[#F0B429]/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F0B429] text-[#0F2A4A] uppercase">
                Mode Petugas Lapangan
              </span>
              <span className="text-xs text-slate-300">Form Cepat Terpadu</span>
            </div>
            <h2 className="text-xl font-bold mt-1 tracking-tight">Pendataan Pelanggar & OCR KTP/SIM</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Scan atau masukkan identitas pelanggar. Sistem akan otomatis memverifikasi riwayat residivis berdasarkan NIK.
            </p>
          </div>

          {/* Quick OCR Presets & Full Scanner Action */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsOcrModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#F0B429] hover:bg-amber-400 text-[#0F2A4A] flex items-center gap-1.5 shadow-md shadow-[#F0B429]/20 transition-all cursor-pointer active:scale-95"
            >
              <Scan className="w-4 h-4 text-[#0F2A4A]" />
              <span>Pindai e-KTP (OCR)</span>
            </button>
            <span className="text-xs text-slate-300 flex items-center gap-1 ml-1">
              <Sparkles className="w-3.5 h-3.5 text-[#F0B429]" />
              Preset:
            </span>
            {SAMPLE_KTP_PRESETS.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleScanPreset(p)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-[#F0B429] hover:text-[#0F2A4A] text-white border border-white/20 transition-all cursor-pointer"
              >
                {p.nama.split(' ')[0]} ({p.nik.slice(-4)})
              </button>
            ))}
          </div>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold">{saveSuccessMsg}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SECTION 1: IDENTITAS PELANGGAR (OCR) - 6 cols */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-[#0F2A4A] text-sm">1. Identitas Pelanggar (OCR)</h3>
            </div>

            {/* OCR Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsOcrModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F2A4A] hover:bg-[#14365D] text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Scan className="w-3.5 h-3.5 text-[#F0B429]" />
                <span>Pindai KTP (OCR)</span>
              </button>

              <label className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors">
                <Camera className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Foto KTP</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  className="hidden" 
                  onChange={handleFileUploadOCR} 
                  disabled={isScanningOCR}
                />
              </label>
            </div>
          </div>

          {/* Card Pratinjau KTP Terpindai */}
          {fotoKtp && (
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-14 h-16 rounded-lg overflow-hidden border border-blue-300 bg-white shadow-2xs shrink-0">
                  <img src={fotoKtp} alt="Foto KTP" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded uppercase">
                      e-KTP Terlampir
                    </span>
                    <span className="text-xs font-bold text-slate-800">{nama || 'Identitas KTP'}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-mono mt-0.5">NIK: {nik || '-'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOcrModalOpen(true)}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-blue-800 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Koreksi OCR</span>
              </button>
            </div>
          )}

          {/* NIK Field with Instant Deduplication Warning */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nomor Induk Kependudukan (NIK 16 Digit) *
            </label>
            <div className="relative">
              <input
                type="text"
                maxLength={16}
                value={nik}
                onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                placeholder="Contoh: 6307011205850001"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono tracking-wider focus:ring-2 outline-hidden transition-all ${
                  existingPelanggar 
                    ? 'border-amber-400 bg-amber-50/50 focus:ring-amber-400' 
                    : 'border-slate-300 focus:ring-[#0F2A4A]'
                }`}
                required
              />
              {existingPelanggar && (
                <button
                  type="button"
                  onClick={() => setShowDuplicateModal(true)}
                  className="absolute right-2 top-2 px-2.5 py-1 bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-amber-600 shadow-xs"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Residivis ({existingPelanggar.totalKasus} Kasus)</span>
                </button>
              )}
            </div>
            {existingPelanggar && (
              <p className="text-xs text-amber-700 mt-1 font-medium flex items-center gap-1">
                ⚠️ NIK terdaftar atas nama <b>{existingPelanggar.nama}</b>. Data kasus baru akan otomatis ditambahkan ke riwayatnya.
              </p>
            )}
          </div>

          {/* Nama Lengkap */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap Sesuai KTP *</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Syahril Ramadhan"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
              required
            />
          </div>

          {/* Tempat & Tanggal Lahir */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tempat Lahir</label>
              <input
                type="text"
                value={tempatLahir}
                onChange={(e) => setTempatLahir(e.target.value)}
                placeholder="Barabai"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Lahir</label>
              <input
                type="date"
                value={tglLahir}
                onChange={(e) => setTglLahir(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
              />
            </div>
          </div>

          {/* Jenis Kelamin & Pekerjaan */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
              <select
                value={jenisKelamin}
                onChange={(e) => setJenisKelamin(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white"
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pekerjaan</label>
              <input
                type="text"
                value={pekerjaan}
                onChange={(e) => setPekerjaan(e.target.value)}
                placeholder="Pedagang / Karyawan"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
              />
            </div>
          </div>

          {/* Alamat Lengkap */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Domisili KTP *</label>
            <textarea
              rows={2}
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              placeholder="Nama jalan, RT/RW, nomor rumah"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
              required
            />
          </div>

          {/* Kecamatan & No HP */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kecamatan Domisili</label>
              <select
                value={kecamatan}
                onChange={(e) => setKecamatan(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white"
              >
                {KECAMATAN_HST.map((k) => (
                  <option key={k.id} value={k.nama}>{k.nama}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">No. WhatsApp / HP</label>
              <input
                type="tel"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                placeholder="0812xxxxxxxx"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: DETAIL PELANGGARAN & LOKASI SPASIAL - 6 cols */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-[#0F2A4A] text-sm">2. Kasus Pelanggaran & Spasial</h3>
            </div>

            <select
              value={sumber}
              onChange={(e) => setSumber(e.target.value)}
              className="text-xs px-2.5 py-1 border border-slate-200 rounded-lg bg-slate-50 font-medium"
            >
              <option value="patroli">Sumber: Patroli Rutin</option>
              <option value="pengaduan">Sumber: Pengaduan Warga</option>
              <option value="inisiatif_skpd">Sumber: Inisiatif SKPD</option>
            </select>
          </div>

          {/* Lokasi & Geotagging */}
          <div className="space-y-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Tempat / Landmark Kejadian *
              </label>
              <input
                type="text"
                value={lokasiNama}
                onChange={(e) => setLokasiNama(e.target.value)}
                placeholder="Contoh: Trotoar Depan Lapangan Dwi Warna Barabai"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
                required
              />
            </div>

            {/* DUA METODE TOMBOL AMBIL TITIK LOKASI */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#F0B429]" />
                  <span>Titik Koordinat Kejadian</span>
                </span>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* 1. Ambil Langsung GPS (Di TKP) */}
                  <button
                    type="button"
                    onClick={handleCaptureGPS}
                    disabled={isCapturingGPS}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                    title="Ambil titik koordinat otomatis menggunakan sensor GPS perangkat saat berada di lokasi kejadian"
                  >
                    {isCapturingGPS ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Mencari Satelit...</span>
                      </>
                    ) : (
                      <>
                        <Crosshair className="w-3.5 h-3.5 text-[#F0B429]" />
                        <span>Ambil GPS (Di TKP)</span>
                      </>
                    )}
                  </button>

                  {/* 2. Pop-up Peta Interaktif (Input di Luar Tempat Kejadian) */}
                  <button
                    type="button"
                    onClick={() => setIsMapPickerOpen(true)}
                    className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                    title="Buka pop-up peta interaktif untuk menandai titik jika penginputan dilakukan di luar lokasi (misal di Kantor Mako Satpol PP)"
                  >
                    <MapPin className="w-3.5 h-3.5 text-red-600" />
                    <span>Pilih di Peta (Luar TKP)</span>
                  </button>
                </div>
              </div>

              {/* STATUS BADGE METODE PENGAMBILAN */}
              {gpsLocked && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg text-[11px] font-bold">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>🛰️ Koordinat GPS Langsung Terkunci Presisi (Akurasi: ±{gpsAccuracy}m)</span>
                </div>
              )}

              {coordSource === 'map_picker' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100/90 border border-amber-300 text-amber-900 rounded-lg text-[11px] font-bold">
                  <MapPin className="w-3.5 h-3.5 text-red-600" />
                  <span>🗺️ Titik Ditandai Melalui Pop-up Peta Spasial (Input di Luar Tempat Kejadian)</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">Latitude (Lintang):</span>
                  <input
                    type="number"
                    step="any"
                    value={lat}
                    onChange={(e) => {
                      setLat(parseFloat(e.target.value) || 0);
                      setCoordSource('manual');
                      setGpsLocked(false);
                    }}
                    placeholder="-2.5833"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-xs focus:ring-2 focus:ring-[#0F2A4A] outline-hidden font-semibold text-slate-800"
                    required
                  />
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">Longitude (Bujur):</span>
                  <input
                    type="number"
                    step="any"
                    value={lng}
                    onChange={(e) => {
                      setLng(parseFloat(e.target.value) || 0);
                      setCoordSource('manual');
                      setGpsLocked(false);
                    }}
                    placeholder="115.3811"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-xs focus:ring-2 focus:ring-[#0F2A4A] outline-hidden font-semibold text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                <span>Wilayah: Kec. {kecamatan}{desa ? `, Desa ${desa}` : ''}</span>
                <a
                  href={`https://www.google.com/maps?q=${lat},${lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                >
                  <span>Cek di Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Pilih Perda yang Dilanggar */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Peraturan Daerah yang Dilanggar (Bisa pilih lebih dari 1) *
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {getPerdaList().map((perda) => {
                const isSelected = selectedPerdaIds.includes(perda.id);
                return (
                  <div
                    key={perda.id}
                    onClick={() => handleTogglePerda(perda.id)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#0F2A4A] bg-slate-50 text-[#0F2A4A] shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="font-bold flex items-center gap-1.5">
                        <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                          isSelected ? 'bg-[#0F2A4A] text-white' : 'border border-slate-300'
                        }`}>
                          {isSelected ? '✓' : ''}
                        </span>
                        <span>{perda.nomor} — {perda.pasal}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        {perda.kategori}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 pl-5">
                      {perda.deskripsi}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Deskripsi Temuan Lapangan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kronologi / Uraian Pelanggaran di Lapangan *
            </label>
            <textarea
              rows={3}
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Jelaskan jenis lapak, barang sitaan, atau tindakan yang mengganggu ketertiban umum..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
              required
            />
          </div>

          {/* ========================================================================= */}
          {/* BUKTI FOTO LAPANGAN (MULTI-UPLOAD HINGGA 6 FOTO) */}
          {/* ========================================================================= */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
              <div>
                <label className="text-xs font-bold text-[#0F2A4A] flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span>Foto Bukti Pelanggaran di Lapangan *</span>
                </label>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Bisa mengunggah beberapa foto dokumentasi penindakan (<b>Maksimal {MAX_PHOTOS} foto</b>).
                </p>
              </div>

              {/* Counter Pill & Demo Shortcut */}
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold ${
                  buktiFotoList.length >= MAX_PHOTOS
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-blue-100 text-[#0F2A4A] border border-blue-200'
                }`}>
                  {buktiFotoList.length} / {MAX_PHOTOS} Foto Terlampir
                </span>

                {buktiFotoList.length < 3 && (
                  <button
                    type="button"
                    onClick={handleLoadDemoPhotos}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
                  >
                    + Contoh 3 Foto
                  </button>
                )}
              </div>
            </div>

            {/* Gallery Grid (Up to 6 slots) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {buktiFotoList.map((foto, idx) => (
                <div 
                  key={foto.id}
                  className="group relative rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs hover:border-[#0F2A4A] transition-all"
                >
                  {/* Photo Preview Container */}
                  <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
                    <img 
                      src={foto.url} 
                      alt={foto.ket || `Bukti ${idx + 1}`} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    
                    {/* Badge Number */}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#0F2A4A]/80 text-white font-mono font-bold text-[10px] backdrop-blur-xs shadow-xs">
                      #{idx + 1}
                    </span>

                    {/* Delete Action Button */}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(foto.id)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-md bg-rose-600/90 text-white flex items-center justify-center hover:bg-rose-700 transition-colors cursor-pointer shadow-xs"
                      title="Hapus foto ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Caption Input */}
                  <div className="p-2 bg-white">
                    <input
                      type="text"
                      value={foto.ket || ''}
                      onChange={(e) => handleUpdateCaption(foto.id, e.target.value)}
                      placeholder={`Keterangan foto #${idx + 1}...`}
                      className="w-full px-2 py-1 text-[11px] rounded-lg border border-slate-200 focus:border-[#0F2A4A] outline-hidden text-slate-700 font-medium"
                    />
                  </div>
                </div>
              ))}

              {/* Upload New Photo Card Slot (if slots remaining) */}
              {buktiFotoList.length < MAX_PHOTOS && (
                <div className="border-2 border-dashed border-slate-300 hover:border-[#0F2A4A] rounded-xl p-4 flex flex-col items-center justify-center text-center bg-white/60 hover:bg-slate-50 transition-all aspect-4/3 relative cursor-pointer group">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-1.5 group-hover:scale-110 transition-transform">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-[#0F2A4A] block">
                    Tambah Foto
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    ({MAX_PHOTOS - buktiFotoList.length} slot tersisa)
                  </span>

                  {/* Hidden file input spanning entire card */}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleUploadPhotos}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    title="Unggah beberapa foto dokumentasi"
                  />
                </div>
              )}
            </div>

            {/* Quick Upload Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-1 border-t border-slate-200/60">
              <span className="text-[11px] text-slate-500 font-medium">
                💡 Mendukung format JPG, PNG, WEBP dari kamera langsung maupun galeri perangkat.
              </span>

              {buktiFotoList.length < MAX_PHOTOS && (
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs border border-blue-200 transition-colors cursor-pointer shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Pilih Foto dari Perangkat</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleUploadPhotos}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Submit Action (Touch target 48px height) */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full h-12 bg-[#0F2A4A] hover:bg-[#14365D] text-white font-bold rounded-xl shadow-lg shadow-[#0F2A4A]/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]"
            >
              <CheckCircle2 className="w-5 h-5 text-[#F0B429]" />
              <span className="text-sm">Simpan & Terbitkan Surat Pernyataan (Tahap 1)</span>
            </button>
          </div>
        </div>
      </form>

      {/* POPUP RIWAYAT RESIDIVIS (DEDUPLICATION ALERT MODAL) */}
      <Modal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        title="⚠️ Pelanggar Terdaftar (Residivis Ditemukan!)"
        subtitle={`NIK: ${nik} sudah memiliki catatan pelanggaran sebelumnya`}
        maxWidth="max-w-2xl"
      >
        {existingPelanggar && (
          <div className="space-y-4">
            {/* Header profile info */}
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center font-bold text-lg shrink-0">
                {existingPelanggar.totalKasus}x
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">{existingPelanggar.nama}</h4>
                <p className="text-xs text-slate-600 mt-0.5">{existingPelanggar.alamat}, Kec. {existingPelanggar.kecamatan}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-semibold text-amber-800">Status Terakhir:</span>
                  <StageBadge stage={existingPelanggar.statusTerakhir} />
                </div>
              </div>
            </div>

            {/* Previous cases table */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Daftar Pelanggaran Sebelumnya:
              </h5>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {riwayatList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Belum ada riwayat tersimpan untuk profil ini.</p>
                ) : (
                  riwayatList.map((item) => (
                    <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#0F2A4A]">{item.nomorRegister}</span>
                        <StageBadge stage={item.statusTindakLanjut} />
                      </div>
                      <p className="text-slate-600">{item.lokasiNama} ({item.tanggal})</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1 italic">"{item.deskripsi}"</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowDuplicateModal(false);
                  if (onViewDetail && riwayatList[0]) onViewDetail(riwayatList[0]);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors"
              >
                Lihat Detail Riwayat Kasus
              </button>
              <button
                type="button"
                onClick={() => setShowDuplicateModal(false)}
                className="px-4 py-2.5 rounded-xl bg-[#0F2A4A] hover:bg-[#14365D] text-white text-xs font-bold transition-colors"
              >
                Lanjut Tambah Pelanggaran Baru
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* POPUP MODAL OCR SCANNER DENGAN LIVE HUD */}
      <ModalOcrScanner
        isOpen={isOcrModalOpen}
        onClose={() => {
          setIsOcrModalOpen(false);
          setOcrInitialFile(null);
        }}
        onApplyData={handleApplyOcrData}
        initialFile={ocrInitialFile}
      />

      {/* POPUP PETA INTERAKTIF UNTUK PENGATURAN LOKASI MANUAL (INPUT LUAR TKP) */}
      <ModalMapPicker
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        initialLat={lat}
        initialLng={lng}
        currentKecamatan={kecamatan}
        currentDesa={desa}
        onSelectLocation={handleLocationFromMap}
        title="Pilih Titik Lokasi Kejadian (Input Luar TKP / Manual)"
        subtitle="Geser pin atau klik pada peta untuk menandai titik pelanggaran jika diinput di luar lokasi kejadian (misal di Kantor Mako)"
        note="Titik koordinat ini akan disimpan ke dalam berkas pelanggaran untuk visualisasi peta sebaran spasial."
      />
    </div>
  );
}

