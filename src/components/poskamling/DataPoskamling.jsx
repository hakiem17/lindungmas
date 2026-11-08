import React, { useState, useId } from 'react';
import {
  Radio,
  Search,
  Plus,
  Download,
  Printer,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Compass,
  CheckSquare,
  Square,
  Save,
  X,
  AlertCircle,
  Eye,
  CheckCircle2,
  Layers,
  ExternalLink,
  ShieldAlert,
  Activity,
  Wrench,
  Users
} from 'lucide-react';
import Modal from '../common/Modal';
import ModalMapPicker from '../common/ModalMapPicker';
import { KECAMATAN_HST } from '../../data/mockData';
import { savePoskamling, deletePoskamling, getFasilitasPoskamlingList } from '../../data/storageService';

const DAFTAR_FASILITAS_DEFAULT = [
  'Kentongan Kayu / Bambu',
  'Buku Mutasi Tamu',
  'Senter LED Sorot',
  'Kotak P3K Lengkap',
  'Rompi / Jas Hujan Linmas',
  'Alat Pemadam / Ember / APAR',
  'Radio Komunikasi / HT',
  'Lampu Panel Surya'
];

export default function DataPoskamling({
  poskamlingList = [],
  onRefreshData,
  wilayahList = KECAMATAN_HST,
  fasilitasMasterList = [],
  assignedKecamatan = null,
  onNavigateToMasterFasilitas
}) {
  const effectiveFasilitasList = (fasilitasMasterList && fasilitasMasterList.length > 0)
    ? fasilitasMasterList
    : getFasilitasPoskamlingList();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKecamatan, setSelectedKecamatan] = useState(assignedKecamatan || 'semua');
  const [selectedStatus, setSelectedStatus] = useState('semua');
  const [selectedKondisi, setSelectedKondisi] = useState('semua');
  const [viewMode, setViewMode] = useState('tabel'); // 'tabel' | 'kartu'

  React.useEffect(() => {
    if (assignedKecamatan) {
      setSelectedKecamatan(assignedKecamatan);
    }
  }, [assignedKecamatan]);

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [selectedPos, setSelectedPos] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isLocatingGps, setIsLocatingGps] = useState(false);

  // Form State (Matches uploaded UI screenshot precisely)
  const [formData, setFormData] = useState({
    id: null,
    namaPoskamling: '',
    kecamatan: assignedKecamatan || 'Barabai',
    desaKelurahan: 'Barabai Timur',
    alamatLengkap: '',
    rt: '01',
    rw: '01',
    lat: -2.5855,
    lng: 115.3815,
    kondisiFisik: 'Baik (Siap Pakai)',
    statusOperasional: 'Aktif Terjadwal (Tiap Malam)',
    fasilitas: [
      'Kentongan Kayu / Bambu',
      'Buku Mutasi Tamu',
      'Senter LED Sorot',
      'Kotak P3K Lengkap'
    ],
    namaKetuaPos: '',
    kontakWa: '',
    personelRonda: 8,
    catatanTambahan: ''
  });

  // Unique IDs for accessibility
  const searchInputId = useId();
  const filterKecamatanId = useId();
  const filterStatusId = useId();
  const filterKondisiId = useId();

  // Dynamic Desa list based on selected Kecamatan in Form
  const availableDesa = React.useMemo(() => {
    const foundKec = wilayahList.find(k => k.nama.toLowerCase() === (formData.kecamatan || '').toLowerCase());
    return foundKec ? foundKec.desa : [];
  }, [formData.kecamatan, wilayahList]);

  // Filtering Logic
  const filteredList = poskamlingList.filter(item => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      (item.namaPoskamling || '').toLowerCase().includes(term) ||
      (item.desaKelurahan || '').toLowerCase().includes(term) ||
      (item.namaKetuaPos || '').toLowerCase().includes(term) ||
      (item.alamatLengkap || '').toLowerCase().includes(term) ||
      (item.rt || '').includes(term) ||
      (item.kontakWa || '').includes(term);

    const matchKecamatan = assignedKecamatan
      ? (item.kecamatan || '').toLowerCase() === assignedKecamatan.toLowerCase()
      : (selectedKecamatan === 'semua' || item.kecamatan === selectedKecamatan);

    const matchStatus = selectedStatus === 'semua' || item.statusOperasional === selectedStatus;
    const matchKondisi = selectedKondisi === 'semua' || item.kondisiFisik === selectedKondisi;

    return matchSearch && matchKecamatan && matchStatus && matchKondisi;
  });

  // KPI Calculations based on scoped data
  const scopedPoskamling = assignedKecamatan
    ? poskamlingList.filter(p => (p.kecamatan || '').toLowerCase() === assignedKecamatan.toLowerCase())
    : poskamlingList;

  const totalPos = scopedPoskamling.length;
  const totalAktif = scopedPoskamling.filter(p => (p.statusOperasional || '').startsWith('Aktif')).length;
  const totalBaik = scopedPoskamling.filter(p => (p.kondisiFisik || '').includes('Baik')).length;
  const totalButuhRenovasi = scopedPoskamling.filter(p =>
    (p.kondisiFisik || '').includes('Rusak') || (p.kondisiFisik || '').includes('Tidak Layak')
  ).length;

  // Form Handlers
  const handleOpenAddModal = () => {
    const defaultKec = assignedKecamatan || 'Barabai';
    const foundKec = wilayahList.find(k => k.nama.toLowerCase() === defaultKec.toLowerCase());
    const defaultDesa = foundKec?.desa?.[0] || 'Barabai Timur';

    setFormData({
      id: null,
      namaPoskamling: '',
      kecamatan: defaultKec,
      desaKelurahan: defaultDesa,
      alamatLengkap: '',
      rt: '01',
      rw: '01',
      lat: -2.5855,
      lng: 115.3815,
      kondisiFisik: 'Baik (Siap Pakai)',
      statusOperasional: 'Aktif Terjadwal (Tiap Malam)',
      fasilitas: [
        'Kentongan Kayu / Bambu',
        'Buku Mutasi Tamu',
        'Senter LED Sorot',
        'Kotak P3K Lengkap'
      ],
      namaKetuaPos: '',
      kontakWa: '',
      personelRonda: 8,
      catatanTambahan: ''
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setFormData({
      id: item.id,
      namaPoskamling: item.namaPoskamling || '',
      kecamatan: item.kecamatan || 'Barabai',
      desaKelurahan: item.desaKelurahan || 'Barabai Timur',
      alamatLengkap: item.alamatLengkap || '',
      rt: item.rt || '01',
      rw: item.rw || '01',
      lat: item.lat || -2.5855,
      lng: item.lng || 115.3815,
      kondisiFisik: item.kondisiFisik || 'Baik (Siap Pakai)',
      statusOperasional: item.statusOperasional || 'Aktif Terjadwal (Tiap Malam)',
      fasilitas: Array.isArray(item.fasilitas) ? item.fasilitas : [],
      namaKetuaPos: item.namaKetuaPos || '',
      kontakWa: item.kontakWa || '',
      personelRonda: item.personelRonda || 8,
      catatanTambahan: item.catatanTambahan || ''
    });
    setIsFormModalOpen(true);
  };

  const handleOpenDetailModal = (item) => {
    setSelectedPos(item);
    setIsDetailModalOpen(true);
  };

  // Toggle Fasilitas Checkbox
  const handleToggleFasilitas = (itemFasilitas) => {
    const exists = formData.fasilitas.includes(itemFasilitas);
    if (exists) {
      setFormData({
        ...formData,
        fasilitas: formData.fasilitas.filter(f => f !== itemFasilitas)
      });
    } else {
      setFormData({
        ...formData,
        fasilitas: [...formData.fasilitas, itemFasilitas]
      });
    }
  };

  // Real-time GPS Location Handler
  const handleGetGpsLocation = () => {
    if (!navigator.geolocation) {
      alert('Fitur Geolocation tidak didukung oleh browser Anda.');
      return;
    }

    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          lat: Number(latitude.toFixed(6)),
          lng: Number(longitude.toFixed(6))
        }));
        setIsLocatingGps(false);
      },
      (error) => {
        setIsLocatingGps(false);
        // Fallback default coordinates within HST (Barabai)
        setFormData(prev => ({
          ...prev,
          lat: -2.5855,
          lng: 115.3815
        }));
        alert(`Lokasi GPS default diterapkan (-2.5855, 115.3815). Info: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Location Selected from Map Picker (Input Luar Titik)
  const handleLocationFromMap = (lat, lng, kec, desa) => {
    setFormData(prev => ({
      ...prev,
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      ...(kec ? { kecamatan: kec } : {})
    }));
    setIsMapPickerOpen(false);
  };

  // Save Submit
  const handleSaveSubmit = (e) => {
    e.preventDefault();
    if (!formData.namaPoskamling.trim()) {
      alert('Nama Poskamling wajib diisi');
      return;
    }

    savePoskamling(formData);
    setIsFormModalOpen(false);
    if (onRefreshData) onRefreshData();
  };

  // Delete Handler
  const handleDelete = (id) => {
    deletePoskamling(id);
    setDeleteConfirmId(null);
    if (onRefreshData) onRefreshData();
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'No',
      'Nama Poskamling',
      'Kecamatan',
      'Desa / Kelurahan',
      'Alamat Lengkap',
      'RT',
      'RW',
      'Latitude',
      'Longitude',
      'Kondisi Fisik',
      'Status Operasional',
      'Fasilitas',
      'Nama Ketua Pos',
      'Kontak WA',
      'Personel Ronda',
      'Catatan Tambahan'
    ];

    const rows = filteredList.map((p, idx) => [
      idx + 1,
      `"${p.namaPoskamling || ''}"`,
      `"${p.kecamatan || ''}"`,
      `"${p.desaKelurahan || ''}"`,
      `"${(p.alamatLengkap || '').replace(/"/g, '""')}"`,
      `"${p.rt || ''}"`,
      `"${p.rw || ''}"`,
      p.lat,
      p.lng,
      `"${p.kondisiFisik || ''}"`,
      `"${p.statusOperasional || ''}"`,
      `"${(p.fasilitas || []).join('; ')}"`,
      `"${p.namaKetuaPos || ''}"`,
      `"${p.kontakWa || ''}"`,
      p.personelRonda || 0,
      `"${(p.catatanTambahan || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Database_Poskamling_HST_${new Date().toISOString().slice(0, 10)}.csv`);
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-xs">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-[#0F2A4A] tracking-tight">
                  DATA POSKAMLING HST
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 uppercase tracking-wide">
                  Pos Ronda RT/RW
                </span>
                {assignedKecamatan && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-300 uppercase tracking-wide">
                    Wilayah: Kec. {assignedKecamatan}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {assignedKecamatan
                  ? `Monitoring sarana keamanan dan kesiapsiagaan pos ronda wilayah binaan Kecamatan ${assignedKecamatan}`
                  : 'Monitoring Sarana Keamanan Lingkungan, Geotagging GIS, dan Kesiapsiagaan Pos Ronda se-Kabupaten HST'}
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
            title="Cetak Rekap Dinas"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Cetak Rekap</span>
          </button>

          {onNavigateToMasterFasilitas && (
            <button
              type="button"
              onClick={onNavigateToMasterFasilitas}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#0F2A4A] bg-amber-100 hover:bg-amber-200 border border-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Kelola Master Fasilitas & Sarana Poskamling (Tambah/Kurang)"
            >
              <CheckSquare className="w-3.5 h-3.5 text-amber-800" />
              <span>Master Sarana</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl text-xs font-extrabold text-[#0F2A4A] bg-[#F0B429] hover:bg-[#e0a724] flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#0F2A4A]" />
            <span>Tambah Poskamling</span>
          </button>
        </div>
      </div>

      {/* 2. STATISTIK KPI POSKAMLING */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Poskamling</p>
            <h3 className="text-2xl font-extrabold text-[#0F2A4A] mt-1">{totalPos}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Titik Pos Terdata di HST</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Radio className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Aktif Terjadwal</p>
            <h3 className="text-2xl font-extrabold text-emerald-700 mt-1">{totalAktif}</h3>
            <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Ronda Setiap Malam</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Kondisi Bangunan Baik</p>
            <h3 className="text-2xl font-extrabold text-blue-700 mt-1">{totalBaik}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Siap Pakai & Layak</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">Butuh Renovasi</p>
            <h3 className="text-2xl font-extrabold text-rose-600 mt-1">{totalButuhRenovasi}</h3>
            <p className="text-[10px] text-rose-600 font-medium mt-0.5">Usulan Perbaikan Dinas</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. TOOLBAR & FILTER */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <label htmlFor={searchInputId} className="sr-only">Cari Poskamling</label>
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id={searchInputId}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama pos, ketua pos, RT/RW, desa, atau alamat..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
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
                disabled={!!assignedKecamatan}
                onChange={(e) => setSelectedKecamatan(e.target.value)}
                className={`px-3 py-2 border rounded-xl text-xs font-medium focus:outline-hidden ${assignedKecamatan
                  ? 'bg-blue-50 border-blue-200 text-blue-900 font-bold cursor-not-allowed'
                  : 'bg-slate-50 border-slate-200 text-slate-700 focus:ring-2 focus:ring-amber-500/20'
                  }`}
              >
                {assignedKecamatan ? (
                  <option value={assignedKecamatan}>Kec. {assignedKecamatan} (Wilayah Binaan)</option>
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

            {/* Filter Status */}
            <div>
              <label htmlFor={filterStatusId} className="sr-only">Filter Status Operasional</label>
              <select
                id={filterStatusId}
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="semua">Semua Status Operasional</option>
                <option value="Aktif">Aktif</option>
                <option value="Aktif Terjadwal (Tiap Malam)">Aktif Terjadwal</option>
                <option value="Aktif Berkala (Malam Tertentu)">Aktif Berkala</option>
                <option value="Kurang Aktif / Jarang Ronda">Kurang Aktif</option>
                <option value="Tidak Aktif / Non-Aktif">Tidak Aktif</option>
              </select>
            </div>

            {/* Filter Kondisi */}
            <div>
              <label htmlFor={filterKondisiId} className="sr-only">Filter Kondisi Bangunan</label>
              <select
                id={filterKondisiId}
                value={selectedKondisi}
                onChange={(e) => setSelectedKondisi(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="semua">Semua Kondisi Fisik</option>
                <option value="Baik (Siap Pakai)">Baik (Siap Pakai)</option>
                <option value="Rusak Ringan">Rusak Ringan</option>
                <option value="Rusak Berat / Butuh Renovasi">Rusak Berat</option>
                <option value="Tidak Layak Pakai">Tidak Layak Pakai</option>
              </select>
            </div>

            {/* View Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('tabel')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'tabel' ? 'bg-white text-[#0F2A4A] shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                Tabel
              </button>
              <button
                type="button"
                onClick={() => setViewMode('kartu')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'kartu' ? 'bg-white text-[#0F2A4A] shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                Kartu Pos
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
                  <th className="py-3 px-3.5 border-r border-white/10 min-w-[200px]">Nama Poskamling</th>
                  <th className="py-3 px-3.5 border-r border-white/10 whitespace-nowrap">Wilayah & RT/RW</th>
                  <th className="py-3 px-3.5 border-r border-white/10 min-w-[170px]">Alamat Lengkap</th>
                  <th className="py-3 px-3.5 border-r border-white/10 whitespace-nowrap">Koordinat GIS</th>
                  <th className="py-3 px-3.5 border-r border-white/10 whitespace-nowrap">Kondisi Bangunan</th>
                  <th className="py-3 px-3.5 border-r border-white/10 whitespace-nowrap">Status Operasional</th>
                  <th className="py-3 px-3.5 border-r border-white/10 whitespace-nowrap">Ketua Pos / Kontak</th>
                  <th className="py-3 px-3 border-r border-white/10 text-center whitespace-nowrap">Personel</th>
                  <th className="py-3 px-3 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Radio className="w-10 h-10 text-slate-300" />
                        <p className="font-semibold text-sm text-slate-600">Tidak ada data Poskamling yang sesuai</p>
                        <p className="text-xs text-slate-400">Coba atur ulang kata kunci pencarian atau filter wilayah</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item, idx) => {
                    const isBaik = (item.kondisiFisik || '').includes('Baik');
                    const isAktifTiapMalam = (item.statusOperasional || '').includes('Aktif Terjadwal');

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-3 px-3 text-center font-bold text-slate-400 border-r border-slate-100">
                          {idx + 1}
                        </td>

                        {/* Nama Poskamling */}
                        <td className="py-3 px-3.5 border-r border-slate-100">
                          <p className="font-bold text-[#0F2A4A] group-hover:text-amber-700 transition-colors">
                            {item.namaPoskamling}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-400">Fasilitas:</span>
                            <span className="text-[10px] font-semibold text-emerald-700">
                              {(item.fasilitas || []).length} Alat Siaga
                            </span>
                          </div>
                        </td>

                        {/* Wilayah & RT/RW */}
                        <td className="py-3 px-3.5 border-r border-slate-100 whitespace-nowrap">
                          <p className="font-bold text-slate-800">{item.desaKelurahan}</p>
                          <p className="text-[10px] text-slate-500">
                            Kec. {item.kecamatan} • <span className="font-bold text-amber-700">RT {item.rt} / RW {item.rw}</span>
                          </p>
                        </td>

                        {/* Alamat */}
                        <td className="py-3 px-3.5 border-r border-slate-100 text-[11px] leading-tight">
                          <span className="line-clamp-2" title={item.alamatLengkap}>
                            {item.alamatLengkap || '-'}
                          </span>
                        </td>

                        {/* Koordinat GIS */}
                        <td className="py-3 px-3.5 border-r border-slate-100 whitespace-nowrap font-mono text-[11px]">
                          <a
                            href={`https://www.google.com/maps?q=${item.lat},${item.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                            title="Buka titik di Google Maps"
                          >
                            <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span>{item.lat}, {item.lng}</span>
                          </a>
                        </td>

                        {/* Kondisi Fisik */}
                        <td className="py-3 px-3.5 border-r border-slate-100 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isBaik
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}>
                            {item.kondisiFisik}
                          </span>
                        </td>

                        {/* Status Operasional */}
                        <td className="py-3 px-3.5 border-r border-slate-100 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isAktifTiapMalam
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-300'
                            }`}>
                            {item.statusOperasional}
                          </span>
                        </td>

                        {/* Ketua Pos & Kontak */}
                        <td className="py-3 px-3.5 border-r border-slate-100 whitespace-nowrap">
                          <p className="font-bold text-slate-800">{item.namaKetuaPos || '-'}</p>
                          {item.kontakWa ? (
                            <a
                              href={`https://wa.me/${item.kontakWa.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 hover:underline"
                            >
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>{item.kontakWa}</span>
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-400">-</span>
                          )}
                        </td>

                        {/* Personel */}
                        <td className="py-3 px-3 border-r border-slate-100 text-center font-bold text-slate-800 whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-mono">
                            {item.personelRonda} Warga
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenDetailModal(item)}
                              className="p-1 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                              title="Lihat Detail Poskamling"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit Data Poskamling"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(item.id)}
                              className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Hapus Poskamling"
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
        /* KARTU POSKAMLING VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-[#0F2A4A] via-[#14365D] to-[#0A1F36] p-4 text-white">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                      <Radio className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-white leading-tight">
                        {item.namaPoskamling}
                      </h3>
                      <p className="text-[10px] text-amber-300 font-semibold mt-0.5">
                        Kec. {item.kecamatan} • Desa {item.desaKelurahan}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3 flex-1 text-xs text-slate-600">
                <div className="flex items-start gap-1.5 text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-tight font-medium">
                    {item.alamatLengkap} (RT {item.rt} / RW {item.rw})
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Kondisi Bangunan:</span>
                    <span className="font-bold text-slate-800">{item.kondisiFisik}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Status Ronda:</span>
                    <span className="font-bold text-blue-700">{item.statusOperasional}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Ketua Pos:</span>
                    <span className="font-semibold text-slate-800">{item.namaKetuaPos || '-'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">Personel Ronda:</span>
                    <span className="font-bold text-emerald-700">{item.personelRonda} Warga</span>
                  </div>
                </div>

                {/* Fasilitas Pills */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 block mb-1">Fasilitas Tersedia:</span>
                  <div className="flex flex-wrap gap-1">
                    {(item.fasilitas || []).map((f, i) => (
                      <span key={i} className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleOpenDetailModal(item)}
                  className="px-2.5 py-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Detail Lengkap</span>
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
      {/* 5. MODAL FORMULIR INPUT POSKAMLING (SESUAI DENGAN GAMBAR SCREENSHOT USER) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={formData.id ? 'Edit Data Poskamling' : 'Tambah Data Poskamling'}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSaveSubmit} className="space-y-4 text-slate-700">
          {/* 1. NAMA POSKAMLING * */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Nama Poskamling <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.namaPoskamling}
              onChange={(e) => setFormData({ ...formData, namaPoskamling: e.target.value })}
              placeholder="Contoh: Pos Ronda Gotong Royong RT 02"
              className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
          </div>

          {/* 2. GROUP BOX: KECAMATAN, DESA, ALAMAT, RT, RW */}
          <div className="bg-slate-50/40 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-800">
                    Kecamatan
                  </label>
                  {assignedKecamatan && (
                    <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      Terkunci (Operator)
                    </span>
                  )}
                </div>
                <select
                  value={formData.kecamatan}
                  disabled={!!assignedKecamatan}
                  onChange={(e) => {
                    const newKec = e.target.value;
                    const foundKec = wilayahList.find(k => k.nama.toLowerCase() === newKec.toLowerCase());
                    const firstDesa = foundKec && foundKec.desa && foundKec.desa[0] ? foundKec.desa[0] : '';
                    setFormData({
                      ...formData,
                      kecamatan: newKec,
                      desaKelurahan: firstDesa
                    });
                  }}
                  className={`w-full px-3 py-2 border rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden ${assignedKecamatan
                    ? 'bg-slate-100 border-slate-300 cursor-not-allowed text-slate-500'
                    : 'bg-white border-slate-300 focus:ring-2 focus:ring-amber-500/30'
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
                  onChange={(e) => setFormData({ ...formData, desaKelurahan: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                >
                  {availableDesa.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-8">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Alamat Lengkap / Patokan
                </label>
                <input
                  type="text"
                  value={formData.alamatLengkap}
                  onChange={(e) => setFormData({ ...formData, alamatLengkap: e.target.value })}
                  placeholder="Jl. / Depan Masjid / Sebelah Lapangan..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  RT
                </label>
                <input
                  type="text"
                  value={formData.rt}
                  onChange={(e) => setFormData({ ...formData, rt: e.target.value })}
                  placeholder="01"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-center font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  RW
                </label>
                <input
                  type="text"
                  value={formData.rw}
                  onChange={(e) => setFormData({ ...formData, rw: e.target.value })}
                  placeholder="01"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-center font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
            </div>
          </div>

          {/* 3. GROUP BOX: TITIK KOORDINAT PETA GIS */}
          <div className="bg-blue-50/40 border border-blue-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Titik Koordinat Peta GIS</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* PILIH TITIK DI PETA (INPUT DI LUAR LOKASI) */}
                <button
                  type="button"
                  onClick={() => setIsMapPickerOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-[#0F2A4A] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer active:scale-95"
                  title="Pilih titik lokasi di peta jika menginput dari luar lokasi poskamling (misal di Kantor Mako Satpol PP/Desa)"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#0F2A4A]" />
                  <span>Pilih Titik di Peta (Input Luar Titik)</span>
                </button>

                {/* AMBIL GPS HP/DEVICE LANGSUNG */}
                <button
                  type="button"
                  onClick={handleGetGpsLocation}
                  disabled={isLocatingGps}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
                  title="Ambil koordinat satelit GPS perangkat saat berada langsung di lokasi poskamling"
                >
                  <Compass className={`w-3.5 h-3.5 ${isLocatingGps ? 'animate-spin' : ''}`} />
                  <span>{isLocatingGps ? 'Membaca GPS...' : 'Ambil GPS HP/Device'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.lat}
                  onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) || 0 })}
                  placeholder="-2.5855"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.lng}
                  onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) || 0 })}
                  placeholder="115.3815"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>

            {/* Petunjuk Input Luar Titik */}
            <div className="bg-white/80 border border-blue-100 rounded-xl p-2.5 flex items-start gap-2 text-[11px] text-slate-600">
              <span className="text-amber-500 font-bold shrink-0">💡</span>
              <p className="leading-relaxed">
                <strong>Panduan Penentuan Titik:</strong> Gunakan tombol <span className="text-blue-700 font-bold">"Ambil GPS HP/Device"</span> jika petugas sedang berada langsung di tempat poskamling. Jika pencatatan dilakukan dari kantor/rumah, klik <span className="text-amber-800 font-bold">"Pilih Titik di Peta (Input Luar Titik)"</span> untuk menandai dan menggeser pin lokasi pos ronda secara presisi di peta GIS Kab. HST.
              </p>
            </div>
          </div>

          {/* 4. KONDISI FISIK BANGUNAN & STATUS OPERASIONAL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Kondisi Fisik Bangunan
              </label>
              <select
                value={formData.kondisiFisik}
                onChange={(e) => setFormData({ ...formData, kondisiFisik: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
              >
                <option value="Baik (Siap Pakai)">Baik (Siap Pakai)</option>
                <option value="Rusak Ringan">Rusak Ringan</option>
                <option value="Rusak Berat / Butuh Renovasi">Rusak Berat / Butuh Renovasi</option>
                <option value="Tidak Layak Pakai">Tidak Layak Pakai</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Status Operasional
              </label>
              <select
                value={formData.statusOperasional}
                onChange={(e) => setFormData({ ...formData, statusOperasional: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
              >
                <option value="Aktif">Aktif</option>
                <option value="Aktif Terjadwal (Tiap Malam)">Aktif Terjadwal (Tiap Malam)</option>
                <option value="Aktif Berkala (Malam Tertentu)">Aktif Berkala (Malam Tertentu)</option>
                <option value="Kurang Aktif / Jarang Ronda">Kurang Aktif / Jarang Ronda</option>
                <option value="Tidak Aktif / Non-Aktif">Tidak Aktif / Non-Aktif</option>
              </select>
            </div>
          </div>

          {/* 5. FASILITAS & SARANA POSKAMLING TERSEDIA */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block text-xs font-bold text-slate-800">
                Fasilitas & Sarana Poskamling Tersedia:
              </label>
              {onNavigateToMasterFasilitas && (
                <button
                  type="button"
                  onClick={() => {
                    setIsFormModalOpen(false);
                    onNavigateToMasterFasilitas();
                  }}
                  className="text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Wrench className="w-3 h-3 text-amber-700" />
                  <span>Kelola Master Sarana (Tambah/Kurang)</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {effectiveFasilitasList.map((item) => {
                const fasilitasNama = typeof item === 'string' ? item : item.namaFasilitas;
                const isChecked = (formData.fasilitas || []).includes(fasilitasNama);
                const isWajib = typeof item === 'object' && item.statusWajib;

                return (
                  <button
                    key={typeof item === 'object' ? item.id || fasilitasNama : fasilitasNama}
                    type="button"
                    onClick={() => handleToggleFasilitas(fasilitasNama)}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 transition-all cursor-pointer text-left ${isChecked
                      ? 'border-amber-500 bg-amber-50/70 text-amber-950 font-bold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className="truncate">{fasilitasNama}</span>
                    </div>
                    {isWajib && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">
                        Wajib
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom/legacy facilities tag */}
            {(() => {
              const masterNames = effectiveFasilitasList.map(f => typeof f === 'string' ? f : f.namaFasilitas);
              const customItems = (formData.fasilitas || []).filter(name => !masterNames.includes(name));
              if (customItems.length === 0) return null;
              return (
                <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">Sarana Tambahan Khusus Pos Ini:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {customItems.map(cName => (
                      <span key={cName} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[11px] font-medium border border-amber-300">
                        <CheckSquare className="w-3 h-3 text-amber-700" />
                        {cName}
                        <button
                          type="button"
                          onClick={() => handleToggleFasilitas(cName)}
                          className="hover:text-rose-600 ml-0.5 cursor-pointer"
                          title="Hapus dari pos ini"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 6. NAMA KETUA POS / RT, KONTAK WA, PERSONEL RONDA WARGA */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Nama Ketua Pos / RT
              </label>
              <input
                type="text"
                value={formData.namaKetuaPos}
                onChange={(e) => setFormData({ ...formData, namaKetuaPos: e.target.value })}
                placeholder="Nama Ketua Poskamling"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Kontak WA / Telepon
              </label>
              <input
                type="tel"
                value={formData.kontakWa}
                onChange={(e) => setFormData({ ...formData, kontakWa: e.target.value })}
                placeholder="0812-"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Personel Ronda Warga
              </label>
              <input
                type="number"
                min="0"
                value={formData.personelRonda}
                onChange={(e) => setFormData({ ...formData, personelRonda: parseInt(e.target.value) || 0 })}
                placeholder="8"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-center text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
          </div>

          {/* 7. CATATAN TAMBAHAN / USULAN RENOVASI */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Catatan Tambahan / Usulan Renovasi
            </label>
            <input
              type="text"
              value={formData.catatanTambahan}
              onChange={(e) => setFormData({ ...formData, catatanTambahan: e.target.value })}
              placeholder="Contoh: Diusulkan bantuan lampu panel surya dan renovasi lantai kayu"
              className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          {/* 8. FOOTER BUTTONS (BATAL & SIMPAN POSKAMLING) */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-[#0F2A4A] bg-[#F0B429] hover:bg-[#e2a820] flex items-center gap-2 shadow-md shadow-[#F0B429]/20 transition-all cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4 text-[#0F2A4A]" />
              <span>Simpan Poskamling</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* 6. MODAL DETAIL POSKAMLING */}
      {/* ========================================================================= */}
      {selectedPos && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Detail ${selectedPos.namaPoskamling}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-[#0F2A4A] to-[#16365C] p-4 rounded-2xl text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                  Kec. {selectedPos.kecamatan} • Desa {selectedPos.desaKelurahan}
                </span>
                <h3 className="text-base font-extrabold text-white mt-0.5">
                  {selectedPos.namaPoskamling}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  RT {selectedPos.rt} / RW {selectedPos.rw} — {selectedPos.alamatLengkap}
                </p>
              </div>

              <a
                href={`https://www.google.com/maps?q=${selectedPos.lat},${selectedPos.lng}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 border border-white/20 transition-colors shrink-0"
              >
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Peta GIS</span>
              </a>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Kondisi Bangunan:</span>
                <span className="font-bold text-slate-800 text-sm">{selectedPos.kondisiFisik}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Status Operasional:</span>
                <span className="font-bold text-blue-700 text-sm">{selectedPos.statusOperasional}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Ketua Pos / Kontak:</span>
                <span className="font-bold text-slate-800 text-sm">{selectedPos.namaKetuaPos || '-'}</span>
                <p className="text-[11px] font-mono text-emerald-700 mt-0.5">{selectedPos.kontakWa || '-'}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Kekuatan Personel:</span>
                <span className="font-bold text-emerald-700 text-sm">{selectedPos.personelRonda} Warga Ronda</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Jadwal Ronda Bergilir</p>
              </div>
            </div>

            {/* Fasilitas */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <p className="text-xs font-bold text-slate-700">Fasilitas & Sarana Poskamling:</p>
              <div className="flex flex-wrap gap-1.5">
                {(selectedPos.fasilitas || []).map((f, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                    <span>{f}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Catatan */}
            {selectedPos.catatanTambahan && (
              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 text-xs">
                <p className="font-bold text-amber-900 mb-0.5">Catatan Tambahan / Usulan Renovasi:</p>
                <p className="text-slate-700">{selectedPos.catatanTambahan}</p>
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
                  handleOpenEditModal(selectedPos);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Poskamling</span>
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
          title="Konfirmasi Hapus Poskamling"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-[#0F2A4A]">Hapus data Poskamling ini?</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Data pos ronda beserta titik koordinat peta GIS akan dihapus dari sistem.
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

      {/* 7. MODAL MAP PICKER (UNTUK INPUT DI LUAR TITIK / LOKASI) */}
      <ModalMapPicker
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        initialLat={formData.lat}
        initialLng={formData.lng}
        currentKecamatan={formData.kecamatan}
        currentDesa={formData.desaKelurahan}
        onSelectLocation={handleLocationFromMap}
        title="Tandai Titik Lokasi Poskamling di Peta Kab. HST"
        subtitle="Pilih lokasi pos ronda jika pencatatan dilakukan di luar lokasi fisik (misal dari Mako / Kantor Desa)"
        note="Geser pin merah atau klik peta jalan/gang untuk menentukan titik koordinat poskamling."
      />
    </div>
  );
}

