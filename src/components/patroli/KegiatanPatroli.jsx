import React, { useState, useId } from 'react';
import {
  Car,
  Search,
  Plus,
  Download,
  Printer,
  Edit,
  Trash2,
  MapPin,
  Clock,
  Send,
  Compass,
  AlertCircle,
  Eye,
  CheckCircle2,
  ShieldCheck,
  Radio,
  X,
  ExternalLink,
  Users,
  AlertTriangle,
  Flame,
  FileText,
  Camera,
  Image as ImageIcon,
  UploadCloud,
  UserCheck
} from 'lucide-react';
import Modal from '../common/Modal';
import { KECAMATAN_HST } from '../../data/mockData';
import { saveKegiatanPatroli, deleteKegiatanPatroli } from '../../data/storageService';

export default function KegiatanPatroli({ 
  kegiatanList = [], 
  satlinmasList = [],
  onRefreshData, 
  wilayahList = KECAMATAN_HST,
  assignedKecamatan = null,
  currentUser = null,
  isLinmas = false
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKecamatan, setSelectedKecamatan] = useState(assignedKecamatan || 'semua');
  const [selectedSituasi, setSelectedSituasi] = useState('semua');
  const [selectedJenis, setSelectedJenis] = useState('semua');
  const [viewMode, setViewMode] = useState('tabel'); // 'tabel' | 'kartu'

  React.useEffect(() => {
    if (assignedKecamatan) {
      setSelectedKecamatan(assignedKecamatan);
    }
  }, [assignedKecamatan]);

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedKegiatan, setSelectedKegiatan] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isLockingGps, setIsLockingGps] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [isManualPelapor, setIsManualPelapor] = useState(false);

  // Form State - Matches uploaded screenshot precisely!
  const [formData, setFormData] = useState({
    id: null,
    kode: '',
    judulPatroli: 'Patroli Trantibum Siskamling Malam',
    jenisKegiatan: 'Patroli Trantibum',
    statusSituasi: 'Aman & Kondusif',
    kecamatan: assignedKecamatan || (isLinmas ? (currentUser?.wilayahTugas || 'Barabai') : 'Barabai'),
    desaKelurahan: isLinmas ? (currentUser?.desaTugas || 'Barabai Timur') : 'Barabai Timur',
    lokasiSpesifik: 'Depan Pos Ronda RT 04 Lapangan Dwi Warna',
    petugasPelapor: isLinmas 
      ? (currentUser?.nama ? `${currentUser.nama} (Satlinmas)` : 'Muhammad Arsyad (Satlinmas)') 
      : (currentUser?.nama || 'Petugas Satpol PP'),
    nikPelapor: '',
    jumlahPersonel: isLinmas ? 1 : 4,
    lat: -2.5855,
    lng: 115.3815,
    hasilPatroli: '',
    tindakanDiambil: '',
    fotoDokumentasi: []
  });

  // Unique IDs for accessibility
  const searchInputId = useId();
  const filterKecamatanId = useId();
  const filterSituasiId = useId();
  const filterJenisId = useId();

  // Dynamic Desa list based on selected Kecamatan in Form
  const availableDesa = React.useMemo(() => {
    const curKec = String(formData.kecamatan || '').trim().toLowerCase();
    const foundKec = (wilayahList || []).find(k => String(k?.nama || k?.kecamatan || '').trim().toLowerCase() === curKec);
    return foundKec?.desa || [];
  }, [formData.kecamatan, wilayahList]);

  // Anggota Linmas Terdaftar HANYA di Desa terpilih dari Database (tanpa desa lain)
  const availableLinmas = React.useMemo(() => {
    if (!satlinmasList || !Array.isArray(satlinmasList) || satlinmasList.length === 0) {
      return [];
    }
    const curKec = String(formData.kecamatan || '').trim().toLowerCase();
    const curDesa = String(formData.desaKelurahan || '').trim().toLowerCase();

    return satlinmasList.filter(s => 
      s &&
      String(s.kecamatan || '').trim().toLowerCase() === curKec &&
      String(s.desaKelurahan || '').trim().toLowerCase() === curDesa
    );
  }, [satlinmasList, formData.kecamatan, formData.desaKelurahan]);

  // Helper Kompresi & Upload Foto Lapangan (Maks 4 Gambar, resize max 1000px agar ringan)
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1000;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const currentPhotos = formData.fotoDokumentasi || [];
    const remainingSlots = 4 - currentPhotos.length;

    if (remainingSlots <= 0) {
      alert('Maksimal 4 foto dokumentasi temuan lapangan.');
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      alert(`Hanya ${remainingSlots} foto yang dapat ditambahkan (batas maksimal 4 foto).`);
    }

    setIsUploadingPhotos(true);
    try {
      const base64List = await Promise.all(filesToProcess.map(f => compressImage(f)));
      setFormData(prev => ({
        ...prev,
        fotoDokumentasi: [...(prev.fotoDokumentasi || []), ...base64List].slice(0, 4)
      }));
    } catch (err) {
      console.error('Error processing photos:', err);
      alert('Gagal memproses file foto.');
    } finally {
      setIsUploadingPhotos(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      fotoDokumentasi: (prev.fotoDokumentasi || []).filter((_, idx) => idx !== indexToRemove)
    }));
  };

  // Scoped Data by Role (Anggota Linmas melihat riwayat sendiri, Operator melihat wilayahnya, Admin melihat seluruh HST)
  const linmasName = currentUser?.nama || 'Muhammad Arsyad';
  const scopedKegiatan = React.useMemo(() => {
    if (isLinmas) {
      const own = kegiatanList.filter(k => 
        (k.petugasPelapor || '').toLowerCase().includes(linmasName.toLowerCase()) ||
        (k.desaKelurahan || '').toLowerCase() === (currentUser?.desaTugas || 'Barabai Timur').toLowerCase()
      );
      return own.length > 0 ? own : kegiatanList.slice(0, 5);
    }
    if (assignedKecamatan) {
      return kegiatanList.filter(k => (k.kecamatan || '').toLowerCase() === assignedKecamatan.toLowerCase());
    }
    return kegiatanList;
  }, [kegiatanList, isLinmas, assignedKecamatan, linmasName, currentUser]);

  // Filtering Logic
  const filteredList = scopedKegiatan.filter(item => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      (item.judulPatroli || '').toLowerCase().includes(term) ||
      (item.petugasPelapor || '').toLowerCase().includes(term) ||
      (item.desaKelurahan || '').toLowerCase().includes(term) ||
      (item.lokasiSpesifik || '').toLowerCase().includes(term) ||
      (item.hasilPatroli || '').toLowerCase().includes(term) ||
      (item.kode || '').toLowerCase().includes(term);

    const matchKecamatan = assignedKecamatan
      ? (item.kecamatan || '').toLowerCase() === assignedKecamatan.toLowerCase()
      : (selectedKecamatan === 'semua' || item.kecamatan === selectedKecamatan);

    const matchSituasi = selectedSituasi === 'semua' || item.statusSituasi === selectedSituasi;
    const matchJenis = selectedJenis === 'semua' || item.jenisKegiatan === selectedJenis;

    return matchSearch && matchKecamatan && matchSituasi && matchJenis;
  });

  // KPI Calculations based on scoped data
  const totalLaporan = scopedKegiatan.length;
  const totalAman = scopedKegiatan.filter(k => (k.statusSituasi || '').includes('Aman')).length;
  const totalPerhatian = scopedKegiatan.filter(k => 
    (k.statusSituasi || '').includes('Potensi') || 
    (k.statusSituasi || '').includes('Pelanggaran') || 
    (k.statusSituasi || '').includes('Bantuan') ||
    (k.statusSituasi || '').includes('Darurat')
  ).length;
  const totalPersonelBergerak = scopedKegiatan.reduce((acc, curr) => acc + (Number(curr.jumlahPersonel) || 0), 0);

  // Form Handlers
  const handleOpenAddModal = () => {
    const curKec = isLinmas ? (currentUser?.wilayahTugas || 'Barabai') : (assignedKecamatan || 'Barabai');
    const curDesa = isLinmas ? (currentUser?.desaTugas || 'Barabai Timur') : 'Barabai Timur';

    // Cari anggota linmas di database KHUSUS di desa terpilih
    const matchingLinmas = satlinmasList.find(s => 
      (s.kecamatan || '').toLowerCase() === curKec.toLowerCase() && 
      (s.desaKelurahan || '').toLowerCase() === curDesa.toLowerCase()
    );

    const defaultPetugas = isLinmas 
      ? (currentUser?.nama ? `${currentUser.nama} (Anggota Satlinmas)` : 'Muhammad Arsyad (Anggota Satlinmas)') 
      : (matchingLinmas ? matchingLinmas.nama : '');

    const defaultNik = isLinmas 
      ? (currentUser?.nik || '') 
      : (matchingLinmas?.nik || '');

    setFormData({
      id: null,
      kode: '',
      judulPatroli: isLinmas ? 'Laporan Ronda Malam & Sambang Warga' : 'Patroli Trantibum Siskamling Malam',
      jenisKegiatan: isLinmas ? 'Siskamling' : 'Patroli Trantibum',
      statusSituasi: 'Aman & Kondusif',
      kecamatan: curKec,
      desaKelurahan: curDesa,
      lokasiSpesifik: `Pos Ronda RT ${isLinmas ? '04' : '01'} Desa ${curDesa}`,
      petugasPelapor: defaultPetugas,
      nikPelapor: defaultNik,
      jumlahPersonel: isLinmas ? 1 : 4,
      lat: -2.5855,
      lng: 115.3815,
      hasilPatroli: '',
      tindakanDiambil: isLinmas ? 'Monitoring keamanan lingkungan RT/RW dan patroli keliling.' : '',
      fotoDokumentasi: []
    });
    setIsManualPelapor(false);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setFormData({
      id: item.id,
      kode: item.kode || '',
      judulPatroli: item.judulPatroli || '',
      jenisKegiatan: item.jenisKegiatan || 'Patroli Trantibum',
      statusSituasi: item.statusSituasi || 'Aman & Kondusif',
      kecamatan: item.kecamatan || 'Barabai',
      desaKelurahan: item.desaKelurahan || 'Barabai Timur',
      lokasiSpesifik: item.lokasiSpesifik || '',
      petugasPelapor: item.petugasPelapor || '',
      nikPelapor: item.nikPelapor || '',
      jumlahPersonel: item.jumlahPersonel || 4,
      lat: item.lat || -2.79025,
      lng: item.lng || 115.25698,
      hasilPatroli: item.hasilPatroli || '',
      tindakanDiambil: item.tindakanDiambil || '',
      fotoDokumentasi: Array.isArray(item.fotoDokumentasi) ? item.fotoDokumentasi : []
    });
    setIsManualPelapor(false);
    setIsFormModalOpen(true);
  };

  const handleOpenDetailModal = (item) => {
    setSelectedKegiatan(item);
    setIsDetailModalOpen(true);
  };

  // Re-lock GPS Live Coordinates
  const handleRelockGps = () => {
    if (!navigator.geolocation) {
      alert('Browser tidak mendukung GPS Geolocation.');
      return;
    }

    setIsLockingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setFormData(prev => ({
          ...prev,
          lat: Number(latitude.toFixed(5)),
          lng: Number(longitude.toFixed(5))
        }));
        setIsLockingGps(false);
      },
      (err) => {
        setIsLockingGps(false);
        // Fallback default coordinates within HST (Barabai)
        setFormData(prev => ({
          ...prev,
          lat: -2.79025,
          lng: 115.25698
        }));
        alert(`Koordinat GPS Barabai dikunci (-2.79025, 115.25698). Info: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // Submit Handler
  const handleSaveSubmit = (e) => {
    e.preventDefault();
    if (!formData.judulPatroli.trim()) {
      alert('Judul Patroli / Kejadian wajib diisi.');
      return;
    }
    if (!formData.hasilPatroli.trim()) {
      alert('Hasil Patroli / Temuan Lapangan wajib diisi.');
      return;
    }
    if (!formData.petugasPelapor || !formData.petugasPelapor.trim()) {
      alert('Petugas Pelapor wajib dipilih dari database Linmas atau diisi.');
      return;
    }

    saveKegiatanPatroli(formData);
    setIsFormModalOpen(false);
    if (onRefreshData) onRefreshData();
  };

  // Delete Handler
  const handleDelete = (id) => {
    deleteKegiatanPatroli(id);
    setDeleteConfirmId(null);
    if (onRefreshData) onRefreshData();
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'No',
      'Kode Laporan',
      'Waktu Lapor',
      'Judul Patroli / Kejadian',
      'Jenis Kegiatan',
      'Status Situasi',
      'Kecamatan',
      'Desa / Kelurahan',
      'Lokasi Spesifik',
      'Petugas Pelapor',
      'Jumlah Personel',
      'Latitude',
      'Longitude',
      'Hasil Patroli / Temuan',
      'Tindakan Diambil'
    ];

    const rows = filteredList.map((k, idx) => [
      idx + 1,
      `"${k.kode || ''}"`,
      `"${k.waktuLapor || ''}"`,
      `"${(k.judulPatroli || '').replace(/"/g, '""')}"`,
      `"${k.jenisKegiatan || ''}"`,
      `"${k.statusSituasi || ''}"`,
      `"${k.kecamatan || ''}"`,
      `"${k.desaKelurahan || ''}"`,
      `"${(k.lokasiSpesifik || '').replace(/"/g, '""')}"`,
      `"${k.petugasPelapor || ''}"`,
      k.jumlahPersonel || 0,
      k.lat,
      k.lng,
      `"${(k.hasilPatroli || '').replace(/"/g, '""')}"`,
      `"${(k.tindakanDiambil || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Kegiatan_Patroli_HST_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER SECTION */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center shadow-xs">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-[#0F2A4A] tracking-tight">
                  {isLinmas ? 'RIWAYAT & LAPOR PATROLI SAYA' : 'KEGIATAN DAN PATROLI HST'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-wide">
                  {isLinmas ? 'Personel Mandiri' : 'GPS Live Monitoring'}
                </span>
                {assignedKecamatan && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-300 uppercase tracking-wide">
                    Wilayah: Kec. {assignedKecamatan}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isLinmas 
                  ? `Laporan aktivitas siskamling, penguncian GPS koordinat, dan riwayat patroli mandiri ${currentUser?.nama || 'Anggota Linmas'}`
                  : assignedKecamatan
                    ? `Perekaman dan monitoring patroli keamanan trantibum wilayah binaan Kecamatan ${assignedKecamatan}`
                    : 'Perekaman Aktivitas Lapangan, Sambang Warga, dan Laporan Patroli Real-Time Satlinmas & Satpol PP HST'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Ekspor Seluruh Kolom ke Format CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Cetak Laporan Patroli"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Cetak Rekap</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Lapor Patroli Lapangan</span>
          </button>
        </div>
      </div>

      {/* 2. STATISTIK KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Kegiatan</p>
            <h3 className="text-2xl font-extrabold text-[#0F2A4A] mt-1">{totalLaporan}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Laporan Patroli Masuk</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Car className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Aman & Kondusif</p>
            <h3 className="text-2xl font-extrabold text-emerald-700 mt-1">{totalAman}</h3>
            <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Situasi Terkendali</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Perlu Atensi / Tindak</p>
            <h3 className="text-2xl font-extrabold text-amber-700 mt-1">{totalPerhatian}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Potensi / Pelanggaran</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-teal-600 uppercase tracking-wider">Personel Terlibat</p>
            <h3 className="text-2xl font-extrabold text-[#0F2A4A] mt-1">{totalPersonelBergerak}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Personil Linmas & Aparat</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. TOOLBAR & FILTER */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <label htmlFor={searchInputId} className="sr-only">Cari Laporan Patroli</label>
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id={searchInputId}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari judul kegiatan, nama petugas, desa, atau temuan lapangan..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Kecamatan */}
            <div>
              <label htmlFor={filterKecamatanId} className="sr-only">Filter Kecamatan</label>
              <select
                id={filterKecamatanId}
                value={selectedKecamatan}
                disabled={!!assignedKecamatan || isLinmas}
                onChange={(e) => setSelectedKecamatan(e.target.value)}
                className={`px-3 py-2 border rounded-xl text-xs font-medium focus:outline-hidden ${
                  (assignedKecamatan || isLinmas)
                    ? 'bg-blue-50 border-blue-200 text-blue-900 font-bold cursor-not-allowed'
                    : 'bg-slate-50 border-slate-200 text-slate-700 focus:ring-2 focus:ring-emerald-500/20'
                }`}
              >
                {(assignedKecamatan || isLinmas) ? (
                  <option value={assignedKecamatan || currentUser?.wilayahTugas || 'Barabai'}>
                    Kec. {assignedKecamatan || currentUser?.wilayahTugas || 'Barabai'} ({isLinmas ? 'Wilayah Tugas' : 'Binaan'})
                  </option>
                ) : (
                  <>
                    <option value="semua">Semua Kecamatan (11)</option>
                    {wilayahList.map(k => (
                      <option key={k.id || k.nama} value={k.nama}>{k.nama}</option>
                    ))}
                  </>
                )}
              </select>
            </div>

            {/* Filter Situasi */}
            <div>
              <label htmlFor={filterSituasiId} className="sr-only">Filter Status Situasi</label>
              <select
                id={filterSituasiId}
                value={selectedSituasi}
                onChange={(e) => setSelectedSituasi(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="semua">Semua Situasi</option>
                <option value="Aman & Kondusif">Aman & Kondusif</option>
                <option value="Ada Potensi Gangguan">Ada Potensi Gangguan</option>
                <option value="Ditemukan Pelanggaran Ringan">Ditemukan Pelanggaran Ringan</option>
                <option value="Butuh Bantuan Personil Mako">Butuh Bantuan Personil Mako</option>
                <option value="Darurat / Perlu Tindakan Cepat">Darurat / Perlu Tindakan</option>
              </select>
            </div>

            {/* Filter Jenis Kegiatan */}
            <div>
              <label htmlFor={filterJenisId} className="sr-only">Filter Jenis Kegiatan</label>
              <select
                id={filterJenisId}
                value={selectedJenis}
                onChange={(e) => setSelectedJenis(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="semua">Semua Jenis Kegiatan</option>
                <option value="Patroli Trantibum">Patroli Trantibum</option>
                <option value="Sambang Poskamling / Pos Ronda">Sambang Poskamling</option>
                <option value="Pengamanan Kegiatan Warga">Pengamanan Kegiatan Warga</option>
                <option value="Pengecekan Titik Rawan Banjir / Bencana">Pengecekan Rawan Bencana</option>
                <option value="Penertiban K3 & Fasilitas Umum">Penertiban K3 & Fasum</option>
              </select>
            </div>

            {/* View Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('tabel')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'tabel' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tabel
              </button>
              <button
                type="button"
                onClick={() => setViewMode('kartu')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'kartu' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Kartu
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. CONTENT VIEW (TABEL OR KARTU) */}
      {viewMode === 'tabel' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead className="bg-[#0F2A4A] text-white uppercase text-[10px] tracking-wider font-extrabold select-none">
                <tr>
                  <th className="py-3 px-3 w-12 text-center border-r border-white/10">No</th>
                  <th className="py-3 px-3.5 border-r border-white/10 whitespace-nowrap">Waktu & Kode</th>
                  <th className="py-3 px-3.5 border-r border-white/10 min-w-[200px]">Judul Patroli / Kejadian</th>
                  <th className="py-3 px-3.5 border-r border-white/10 whitespace-nowrap">Jenis Kegiatan</th>
                  <th className="py-3 px-3.5 border-r border-white/10 whitespace-nowrap">Status Situasi</th>
                  <th className="py-3 px-3.5 border-r border-white/10 min-w-[170px]">Lokasi & Wilayah</th>
                  <th className="py-3 px-3.5 border-r border-white/10 whitespace-nowrap">Petugas & Personel</th>
                  <th className="py-3 px-3.5 border-r border-white/10 min-w-[200px]">Temuan & Tindakan</th>
                  <th className="py-3 px-3 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Car className="w-10 h-10 text-slate-300" />
                        <p className="font-semibold text-sm text-slate-600">Tidak ada laporan kegiatan & patroli yang sesuai</p>
                        <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau filter status situasi</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item, idx) => {
                    const isAman = (item.statusSituasi || '').includes('Aman');
                    const isPotensi = (item.statusSituasi || '').includes('Potensi') || (item.statusSituasi || '').includes('Pelanggaran');

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-3 px-3 text-center font-bold text-slate-400 border-r border-slate-100">
                          {idx + 1}
                        </td>

                        {/* Waktu & Kode */}
                        <td className="py-3 px-3.5 border-r border-slate-100 whitespace-nowrap">
                          <p className="font-mono text-[10px] font-bold text-slate-800">{item.kode}</p>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            <span>{item.waktuLapor}</span>
                          </div>
                        </td>

                        {/* Judul Patroli */}
                        <td className="py-3 px-3.5 border-r border-slate-100">
                          <p className="font-bold text-[#0F2A4A] group-hover:text-emerald-700 transition-colors">
                            {item.judulPatroli}
                          </p>
                          <a
                            href={`https://www.google.com/maps?q=${item.lat},${item.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-mono text-blue-600 hover:underline mt-0.5"
                          >
                            <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                            <span>GPS: {item.lat}, {item.lng}</span>
                          </a>
                        </td>

                        {/* Jenis Kegiatan */}
                        <td className="py-3 px-3.5 border-r border-slate-100 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {item.jenisKegiatan}
                          </span>
                        </td>

                        {/* Status Situasi */}
                        <td className="py-3 px-3.5 border-r border-slate-100 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            isAman 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                              : isPotensi 
                              ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}>
                            {item.statusSituasi}
                          </span>
                        </td>

                        {/* Lokasi & Wilayah */}
                        <td className="py-3 px-3.5 border-r border-slate-100 text-[11px] leading-tight">
                          <p className="font-bold text-slate-800">{item.desaKelurahan}, Kec. {item.kecamatan}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1" title={item.lokasiSpesifik}>
                            {item.lokasiSpesifik || '-'}
                          </p>
                        </td>

                        {/* Petugas & Personel */}
                        <td className="py-3 px-3.5 border-r border-slate-100 whitespace-nowrap">
                          <p className="font-semibold text-slate-800">{item.petugasPelapor}</p>
                          <span className="text-[10px] font-mono text-emerald-700 font-bold">
                            {item.jumlahPersonel} Personel
                          </span>
                        </td>

                        {/* Temuan & Tindakan */}
                        <td className="py-3 px-3.5 border-r border-slate-100 text-[11px] leading-snug">
                          <p className="line-clamp-2 text-slate-700" title={item.hasilPatroli}>
                            {item.hasilPatroli}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {item.tindakanDiambil && (
                              <p className="text-[10px] text-emerald-700 italic line-clamp-1" title={item.tindakanDiambil}>
                                Tindakan: {item.tindakanDiambil}
                              </p>
                            )}
                            {item.fotoDokumentasi && item.fotoDokumentasi.length > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                                <Camera className="w-3 h-3 text-blue-600" />
                                <span>{item.fotoDokumentasi.length} Foto</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenDetailModal(item)}
                              className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                              title="Lihat Detail Laporan"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit Laporan"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(item.id)}
                              className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Hapus Laporan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* KARTU PATROLI VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
            >
              {/* Photo Banner jika ada foto dokumentasi */}
              {item.fotoDokumentasi && item.fotoDokumentasi.length > 0 && (
                <div className="relative h-36 w-full bg-slate-900 overflow-hidden">
                  <img
                    src={item.fotoDokumentasi[0]}
                    alt={item.judulPatroli}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/70 text-white backdrop-blur-xs flex items-center gap-1 border border-white/20">
                    <Camera className="w-3 h-3 text-emerald-400" />
                    <span>{item.fotoDokumentasi.length} Foto</span>
                  </span>
                </div>
              )}

              <div className="bg-gradient-to-r from-[#0F2A4A] via-[#14365D] to-[#0A1F36] p-4 text-white">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-300 font-bold">
                      {item.kode}
                    </span>
                    <h3 className="font-extrabold text-sm text-white mt-0.5 leading-tight">
                      {item.judulPatroli}
                    </h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase shrink-0 ${
                    item.statusSituasi.includes('Aman') 
                      ? 'bg-emerald-400 text-slate-900' 
                      : 'bg-amber-400 text-slate-900'
                  }`}>
                    {item.statusSituasi}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-2.5 flex-1 text-xs text-slate-600">
                <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-100">
                  <span>{item.waktuLapor}</span>
                  <span className="font-bold text-slate-700">{item.jenisKegiatan}</span>
                </div>

                <div className="flex items-start gap-1.5 text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-tight font-medium">
                    {item.lokasiSpesifik} ({item.desaKelurahan}, Kec. {item.kecamatan})
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-semibold">Temuan Lapangan:</span>
                  <p className="text-[11px] text-slate-700 line-clamp-3 leading-relaxed">
                    {item.hasilPatroli}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Pelapor:</span>
                    <span className="font-semibold text-slate-800">{item.petugasPelapor}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">Personel:</span>
                    <span className="font-bold text-emerald-700">{item.jumlahPersonel} Orang</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleOpenDetailModal(item)}
                  className="px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Detail Laporan</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(item)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(item.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL FORMULIR LAPOR PATROLI LAPANGAN (SESUAI DENGAN GAMBAR USER) */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* MODAL HEADER (SESUAI GAMBAR) */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-600 font-extrabold shrink-0">
                  <Car className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-[#0F2A4A] tracking-tight">
                      Lapor Patroli Lapangan
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 tracking-wider uppercase">
                      GPS LIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Mode Cepat HP Anggota Satlinmas HST
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MODAL BODY (SCROLLABLE) */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              <form id="form-patroli-lapangan" onSubmit={handleSaveSubmit} className="space-y-4 text-slate-700">
                {/* TOP BOX: TITIK GPS TERKUNCI AKURAT */}
                <div className="bg-[#0c1a2e] text-white rounded-2xl p-3.5 flex items-center justify-between shadow-inner">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight">
                        Titik GPS Terkunci Akurat
                      </h4>
                      <p className="text-[11px] font-mono text-slate-300 mt-0.5">
                        Lat: {formData.lat} • Lng: {formData.lng}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRelockGps}
                    disabled={isLockingGps}
                    className="px-3 py-1.5 rounded-xl bg-[#1e2d45] hover:bg-[#283b59] text-amber-300 border border-amber-400/20 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Compass className={`w-3.5 h-3.5 text-amber-400 ${isLockingGps ? 'animate-spin' : ''}`} />
                    <span>{isLockingGps ? 'Mengunci...' : 'Kunci Ulang'}</span>
                  </button>
                </div>

                {/* 1. JUDUL PATROLI / KEJADIAN * */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Judul Patroli / Kejadian <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.judulPatroli}
                    onChange={(e) => setFormData({ ...formData, judulPatroli: e.target.value })}
                    placeholder="Patroli Trantibum Siskamling Malam"
                    className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>

                {/* 2. JENIS KEGIATAN & STATUS SITUASI */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Jenis Kegiatan
                    </label>
                    <select
                      value={formData.jenisKegiatan}
                      onChange={(e) => setFormData({ ...formData, jenisKegiatan: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                    >
                      <option value="Patroli Trantibum">Patroli Trantibum</option>
                      <option value="Sambang Poskamling / Pos Ronda">Sambang Poskamling / Pos Ronda</option>
                      <option value="Pengamanan Kegiatan Warga">Pengamanan Kegiatan Warga</option>
                      <option value="Pengecekan Titik Rawan Banjir / Bencana">Pengecekan Titik Rawan Banjir / Bencana</option>
                      <option value="Penertiban K3 & Fasilitas Umum">Penertiban K3 & Fasilitas Umum</option>
                      <option value="Operasi Gabungan Linmas & Aparat">Operasi Gabungan Linmas & Aparat</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Status Situasi
                    </label>
                    <select
                      value={formData.statusSituasi}
                      onChange={(e) => setFormData({ ...formData, statusSituasi: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                    >
                      <option value="Aman & Kondusif">Aman & Kondusif</option>
                      <option value="Ada Potensi Gangguan">Ada Potensi Gangguan</option>
                      <option value="Ditemukan Pelanggaran Ringan">Ditemukan Pelanggaran Ringan</option>
                      <option value="Butuh Bantuan Personil Mako">Butuh Bantuan Personil Mako</option>
                      <option value="Darurat / Perlu Tindakan Cepat">Darurat / Perlu Tindakan Cepat</option>
                    </select>
                  </div>
                </div>

                {/* 3. KECAMATAN (HST) & DESA / KELURAHAN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-800">
                        Kecamatan (HST)
                      </label>
                      {(assignedKecamatan || isLinmas) && (
                        <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          Terkunci ({isLinmas ? 'Linmas' : 'Operator'})
                        </span>
                      )}
                    </div>
                    <select
                      value={formData.kecamatan}
                      disabled={!!assignedKecamatan || isLinmas}
                      onChange={(e) => {
                        const newKec = e.target.value;
                        const foundKec = (wilayahList || []).find(k => String(k?.nama || k?.kecamatan || '').toLowerCase() === String(newKec || '').toLowerCase());
                        const firstDesa = foundKec && foundKec.desa && foundKec.desa[0] ? foundKec.desa[0] : '';
                        
                        const matchingLinmas = (Array.isArray(satlinmasList) ? satlinmasList : []).find(s => 
                          s &&
                          String(s.kecamatan || '').toLowerCase() === String(newKec || '').toLowerCase() && 
                          String(s.desaKelurahan || '').toLowerCase() === String(firstDesa || '').toLowerCase()
                        );

                        setFormData({
                          ...formData,
                          kecamatan: newKec,
                          desaKelurahan: firstDesa,
                          ...(isLinmas ? {} : {
                            petugasPelapor: matchingLinmas ? matchingLinmas.nama : '',
                            nikPelapor: matchingLinmas ? matchingLinmas.nik : ''
                          })
                        });
                      }}
                      className={`w-full px-3 py-2 border rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden ${
                        (assignedKecamatan || isLinmas)
                          ? 'bg-slate-100 border-slate-300 cursor-not-allowed text-slate-500'
                          : 'bg-white border-slate-300 focus:ring-2 focus:ring-teal-500/20'
                      }`}
                    >
                      {wilayahList.map(k => (
                        <option key={k.id || k.nama} value={k.nama}>Kec. {k.nama}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Desa / Kelurahan
                    </label>
                    <select
                      value={formData.desaKelurahan}
                      onChange={(e) => {
                        const newDesa = e.target.value;
                        const matchingLinmas = (Array.isArray(satlinmasList) ? satlinmasList : []).find(s => 
                          s &&
                          String(s.kecamatan || '').toLowerCase() === String(formData.kecamatan || '').toLowerCase() && 
                          String(s.desaKelurahan || '').toLowerCase() === String(newDesa || '').toLowerCase()
                        );

                        setFormData({
                          ...formData,
                          desaKelurahan: newDesa,
                          ...(isLinmas ? {} : {
                            petugasPelapor: matchingLinmas ? matchingLinmas.nama : '',
                            nikPelapor: matchingLinmas ? matchingLinmas.nik : ''
                          })
                        });
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                    >
                      {availableDesa.map(d => (
                        <option key={d} value={d}>Desa {d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 4. LOKASI SPESIFIK / NAMA JALAN */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Lokasi Spesifik / Nama Jalan
                  </label>
                  <input
                    type="text"
                    value={formData.lokasiSpesifik}
                    onChange={(e) => setFormData({ ...formData, lokasiSpesifik: e.target.value })}
                    placeholder="Contoh: Depan Pos Ronda RT 04 Lapangan Dwi Warna"
                    className="w-full px-3 py-2 bg-slate-50/50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                {/* 5. PETUGAS PELAPOR DARI DATABASE LINMAS DESA TERDAFTAR & JUMLAH PERSONEL */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                  <div className="sm:col-span-8 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Petugas Pelapor (Linmas Desa {formData.desaKelurahan})</span>
                      </label>
                      {isLinmas ? (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          Identitas Terverifikasi
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsManualPelapor(!isManualPelapor)}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                        >
                          {isManualPelapor ? 'Pilih dari Linmas Desa' : 'Input Petugas Manual'}
                        </button>
                      )}
                    </div>

                    {isLinmas ? (
                      <input
                        type="text"
                        readOnly
                        value={formData.petugasPelapor}
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 cursor-not-allowed"
                      />
                    ) : isManualPelapor ? (
                      <div className="space-y-1">
                        <input
                          type="text"
                          required
                          value={formData.petugasPelapor}
                          onChange={(e) => setFormData({ ...formData, petugasPelapor: e.target.value })}
                          placeholder="Masukkan nama petugas / pelapor..."
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                        />
                        <p className="text-[10px] text-slate-400">
                          Mode manual aktif. Masukkan nama personel jika di luar daftar linmas.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <select
                          value={formData.petugasPelapor}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '__MANUAL__') {
                              setIsManualPelapor(true);
                              return;
                            }
                            const found = availableLinmas.find(s => s.nama === val);
                            setFormData({
                              ...formData,
                              petugasPelapor: val,
                              nikPelapor: found?.nik || ''
                            });
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                        >
                          {availableLinmas.length === 0 ? (
                            <option value="">Belum ada Anggota Linmas terdaftar di Desa {formData.desaKelurahan}</option>
                          ) : (
                            <>
                              <option value="">-- Pilih Anggota Linmas Desa {formData.desaKelurahan} ({availableLinmas.length} Orang) --</option>
                              {availableLinmas.map(s => (
                                <option key={s.id || s.nik} value={s.nama}>
                                  {s.nama} ({s.noRegistrasi || `NIK: ${s.nik ? s.nik.slice(-4) : '-'}`})
                                </option>
                              ))}
                            </>
                          )}
                          <option value="__MANUAL__">+ Input Petugas Lainnya (Manual)...</option>
                        </select>

                        {/* Info Ringkas Anggota Terpilih */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className={`px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 border ${
                            availableLinmas.length > 0 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>
                              {availableLinmas.length > 0 
                                ? `Database Desa ${formData.desaKelurahan}: ${availableLinmas.length} Personel Terdaftar` 
                                : `Belum ada anggota terdaftar di Desa ${formData.desaKelurahan}`}
                            </span>
                          </span>
                          {formData.nikPelapor && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono">
                              NIK: {formData.nikPelapor}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-4 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      Jumlah Personel Ikut
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.jumlahPersonel}
                      onChange={(e) => setFormData({ ...formData, jumlahPersonel: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-center text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                    />
                    <p className="text-[10px] text-slate-400 text-center">
                      Termasuk pelapor & regu
                    </p>
                  </div>
                </div>

                {/* 6. HASIL PATROLI / TEMUAN LAPANGAN * */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Hasil Patroli / Temuan Lapangan <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.hasilPatroli}
                    onChange={(e) => setFormData({ ...formData, hasilPatroli: e.target.value })}
                    placeholder="Jelaskan kondisi ketertiban, sambang warga, atau situasi banjir/lalulintas..."
                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 resize-none"
                  />
                </div>

                {/* 7. TINDAKAN YANG DIAMBIL (OPSIONAL) */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Tindakan Yang Diambil (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.tindakanDiambil}
                    onChange={(e) => setFormData({ ...formData, tindakanDiambil: e.target.value })}
                    placeholder="Contoh: Menghimbau remaja pulang tertib dan koordinasi dengan Polsek"
                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                {/* 8. DOKUMENTASI FOTO HASIL / TEMUAN LAPANGAN (MAKSIMAL 4 GAMBAR) */}
                <div className="space-y-2 pt-1 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-emerald-600" />
                      <span>Foto Dokumentasi / Temuan Lapangan</span>
                    </label>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      (formData.fotoDokumentasi || []).length === 4
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {(formData.fotoDokumentasi || []).length} / 4 Foto
                    </span>
                  </div>

                  {/* Thumbnail Previews & Upload Box */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {(formData.fotoDokumentasi || []).map((foto, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border-2 border-emerald-500/40 bg-slate-100 shadow-xs group">
                        <img 
                          src={foto} 
                          alt={`Dokumentasi ${idx + 1}`} 
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            className="p-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-transform hover:scale-110 cursor-pointer"
                            title="Hapus foto ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/60 text-white backdrop-blur-xs">
                          Foto {idx + 1}
                        </span>
                      </div>
                    ))}

                    {/* Upload Box (jika belum mencapai 4 gambar) */}
                    {(formData.fotoDokumentasi || []).length < 4 && (
                      <label className="relative aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/40 flex flex-col items-center justify-center p-2 text-center transition-all cursor-pointer group">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoUpload}
                          disabled={isUploadingPhotos}
                          className="sr-only"
                        />
                        <div className="w-8 h-8 rounded-full bg-emerald-100 group-hover:bg-emerald-200 text-emerald-700 flex items-center justify-center mb-1 transition-colors">
                          <Plus className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-700 group-hover:text-emerald-800">
                          {isUploadingPhotos ? 'Memproses...' : 'Upload Foto'}
                        </span>
                        <span className="text-[9px] text-slate-400 mt-0.5 leading-tight">
                          Ambil / Pilih (Maks 4)
                        </span>
                      </label>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 italic">
                    * Ambil foto langsung dari kamera perangkat atau pilih file galeri (maksimal 4 gambar).
                  </p>
                </div>

                {/* 8. SUBMIT BUTTON (SESUAI GAMBAR SCREENSHOT) */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold text-white bg-teal-600 hover:bg-teal-700 flex items-center justify-center gap-2 shadow-lg shadow-teal-700/20 transition-all cursor-pointer active:scale-98"
                  >
                    <Send className="w-4 h-4 -rotate-45" />
                    <span>Kirim Laporan GPS ke Satpol PP HST</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL DETAIL LAPORAN PATROLI */}
      {/* ========================================================================= */}
      {selectedKegiatan && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Detail Laporan: ${selectedKegiatan.kode}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-[#0F2A4A] to-[#16365C] p-4 rounded-2xl text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-emerald-300 font-bold">
                  {selectedKegiatan.kode} • {selectedKegiatan.waktuLapor}
                </span>
                <h3 className="text-base font-extrabold text-white mt-0.5">
                  {selectedKegiatan.judulPatroli}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Desa {selectedKegiatan.desaKelurahan}, Kec. {selectedKegiatan.kecamatan}
                </p>
              </div>

              <a
                href={`https://www.google.com/maps?q=${selectedKegiatan.lat},${selectedKegiatan.lng}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 border border-white/20 transition-colors shrink-0"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Peta GIS</span>
              </a>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Jenis Kegiatan:</span>
                <span className="font-bold text-slate-800 text-sm">{selectedKegiatan.jenisKegiatan}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Status Situasi Lapangan:</span>
                <span className="font-bold text-emerald-700 text-sm">{selectedKegiatan.statusSituasi}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Petugas Pelapor:</span>
                <span className="font-bold text-slate-800 text-sm">{selectedKegiatan.petugasPelapor}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Kekuatan Personel:</span>
                <span className="font-bold text-teal-700 text-sm">{selectedKegiatan.jumlahPersonel} Orang</span>
              </div>
            </div>

            {/* Lokasi Spesifik */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <span className="text-[10px] text-slate-400 block">Lokasi Spesifik / Nama Jalan:</span>
              <p className="font-semibold text-slate-800 mt-0.5">{selectedKegiatan.lokasiSpesifik || '-'}</p>
            </div>

            {/* Temuan */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1 text-xs">
              <span className="font-bold text-slate-700 block">Hasil Patroli / Temuan Lapangan:</span>
              <p className="text-slate-700 leading-relaxed">{selectedKegiatan.hasilPatroli}</p>
            </div>

            {/* Tindakan */}
            {selectedKegiatan.tindakanDiambil && (
              <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200 text-xs space-y-1">
                <span className="font-bold text-emerald-900 block">Tindakan Yang Diambil:</span>
                <p className="text-slate-700">{selectedKegiatan.tindakanDiambil}</p>
              </div>
            )}

            {/* Foto Hasil & Temuan Lapangan */}
            {selectedKegiatan.fotoDokumentasi && selectedKegiatan.fotoDokumentasi.length > 0 && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>Foto Dokumentasi / Temuan Lapangan ({selectedKegiatan.fotoDokumentasi.length} Foto)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Klik foto untuk perbesar</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {selectedKegiatan.fotoDokumentasi.map((foto, idx) => (
                    <a
                      key={idx}
                      href={foto}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative block aspect-square rounded-xl overflow-hidden border border-slate-200 bg-black/5 hover:border-emerald-500 transition-all shadow-xs"
                    >
                      <img
                        src={foto}
                        alt={`Temuan ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/60 text-white backdrop-blur-xs">
                        Foto {idx + 1}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleOpenEditModal(selectedKegiatan);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Laporan</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteConfirmId && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteConfirmId(null)}
          title="Konfirmasi Hapus Laporan Patroli"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-[#0F2A4A]">Hapus laporan patroli ini?</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Laporan kegiatan beserta titik GPS akan dihapus dari arsip sistem LINDUNGMAS HST.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

