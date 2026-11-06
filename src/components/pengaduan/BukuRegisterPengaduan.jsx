import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Download, 
  Printer, 
  Plus, 
  Filter, 
  CheckCircle2, 
  Clock,
  AlertTriangle,
  Building2, 
  User, 
  Calendar, 
  CalendarDays,
  ArrowUpDown,
  MapPin, 
  Scale, 
  Navigation, 
  Crosshair, 
  ExternalLink, 
  Compass, 
  Check, 
  Edit, 
  Trash2, 
  AlertCircle,
  Users,
  ShieldCheck,
  ChevronDown,
  X,
  CheckSquare,
  Square,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw
} from 'lucide-react';
import Modal from '../common/Modal';
import ModalMapPicker from './ModalMapPicker';
import { 
  saveRekapTrantibumItem, 
  deleteRekapTrantibumItem, 
  updateRekapTrantibumStatus,
  getWilayahList, 
  getPerdaList,
  getPegawaiList,
  getPelaporList
} from '../../data/storageService';
import { KECAMATAN_HST } from '../../data/mockData';

const STATUS_OPTIONS = [
  { value: 'Terlayani', label: 'Terlayani / Selesai', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { value: 'Dalam Penanganan', label: 'Dalam Penanganan', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: 'Menunggu Tindak Lanjut', label: 'Menunggu Tindak Lanjut', color: 'bg-rose-100 text-rose-800 border-rose-300' },
  { value: 'Diteruskan ke Tim Penegakan', label: 'Diteruskan ke Tim Penegakan', color: 'bg-purple-100 text-purple-800 border-purple-300' }
];

export const BULAN_OPTIONS = [
  { value: 'semua', label: 'Semua Bulan' },
  { value: '1', label: 'Januari' },
  { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' },
  { value: '4', label: 'April' },
  { value: '5', label: 'Mei' },
  { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' },
  { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' }
];

export const SORT_OPTIONS = [
  { value: 'tanggal_desc', label: 'Tanggal: Terbaru ↓' },
  { value: 'tanggal_asc', label: 'Tanggal: Terlama ↑' },
  { value: 'bulan_asc', label: 'Bulan: Januari → Desember' },
  { value: 'bulan_desc', label: 'Bulan: Desember → Januari' },
  { value: 'no_asc', label: 'Nomor Register: Urut 1, 2...' },
  { value: 'pelapor_asc', label: 'Nama Pelapor (A - Z)' }
];

const MONTH_MAP = {
  januari: 1, jan: 1, january: 1,
  februari: 2, feb: 2, february: 2,
  maret: 3, mar: 3, march: 3,
  april: 4, apr: 4,
  mei: 5, may: 5,
  juni: 6, jun: 6, june: 6,
  juli: 7, jul: 7, july: 7,
  agustus: 8, agt: 8, agu: 8, ags: 8, august: 8, aug: 8,
  september: 9, sep: 9,
  oktober: 10, okt: 10, october: 10, oct: 10,
  november: 11, nov: 11, nopember: 11,
  desember: 12, des: 12, december: 12, dec: 12
};

export const parseDateInfo = (dateStr) => {
  if (!dateStr) return { month: null, year: null, day: null, timestamp: 0 };
  const str = String(dateStr).trim();

  // 1. ISO YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10);
    const d = parseInt(isoMatch[3], 10);
    return { month: m, year: y, day: d, timestamp: new Date(y, m - 1, d).getTime() };
  }

  // 2. Numeric DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    const d = parseInt(dmyMatch[1], 10);
    const m = parseInt(dmyMatch[2], 10);
    const y = parseInt(dmyMatch[3], 10);
    return { month: m, year: y, day: d, timestamp: new Date(y, m - 1, d).getTime() };
  }

  // 3. Word format: "14 February 2026", "05 Januari 2026", "23 March 2026"
  const textMatch = str.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (textMatch) {
    const d = parseInt(textMatch[1], 10);
    const monthWord = textMatch[2].toLowerCase();
    const m = MONTH_MAP[monthWord] || null;
    const y = parseInt(textMatch[3], 10);
    if (m) {
      return { month: m, year: y, day: d, timestamp: new Date(y, m - 1, d).getTime() };
    }
  }

  // 4. Fallback native Date
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return {
      month: parsed.getMonth() + 1,
      year: parsed.getFullYear(),
      day: parsed.getDate(),
      timestamp: parsed.getTime()
    };
  }

  return { month: null, year: null, day: null, timestamp: 0 };
};

export const formatPersonilList = (personil) => {
  if (!personil) return [];
  if (Array.isArray(personil)) return personil;
  if (typeof personil === 'string') {
    return personil.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
};

export default function BukuRegisterPengaduan({ rekapList = [], onRefreshData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPelapor, setSelectedPelapor] = useState('semua');
  const [selectedTindakLanjut, setSelectedTindakLanjut] = useState('semua');
  const [selectedStatus, setSelectedStatus] = useState('semua');
  const [selectedPerda, setSelectedPerda] = useState('semua');
  const [selectedKecamatan, setSelectedKecamatan] = useState('semua');
  const [selectedBulan, setSelectedBulan] = useState('semua');
  const [selectedTahun, setSelectedTahun] = useState('semua');
  const [sortBy, setSortBy] = useState('tanggal_desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Dynamic master data
  const wilayahData = getWilayahList() || KECAMATAN_HST;
  const perdaData = getPerdaList();
  const pegawaiData = getPegawaiList();
  const pelaporData = getPelaporList();

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteItemId, setDeleteItemId] = useState(null);

  // Form Fields
  const [namaPelapor, setNamaPelapor] = useState('Masyarakat');
  const [tanggal, setTanggal] = useState(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
  const [jenisPengaduan, setJenisPengaduan] = useState('');
  const [tindakLanjut, setTindakLanjut] = useState('Penertiban');
  const [statusPengaduan, setStatusPengaduan] = useState('Terlayani');
  const [kecamatan, setKecamatan] = useState('Barabai');
  const [desa, setDesa] = useState('Barabai Barat');
  const [lokasi, setLokasi] = useState('');
  const [perdaYangDipakai, setPerdaYangDipakai] = useState('Perda No 6 Tahun 2024 Trantibum');

  // Multi-Personel Checklist State
  const [selectedPersonil, setSelectedPersonil] = useState([]);
  const [searchPersonil, setSearchPersonil] = useState('');
  const [customPersonilInput, setCustomPersonilInput] = useState('');

  // GPS Coordinates & Location Picker state
  const [lat, setLat] = useState(-2.5833);
  const [lng, setLng] = useState(115.3811);
  const [isCapturingGPS, setIsCapturingGPS] = useState(false);
  const [gpsLocked, setGpsLocked] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [coordSource, setCoordSource] = useState('default'); // 'default' | 'gps' | 'map_picker' | 'manual'

  // Handle Capture GPS Langsung (Di Tempat Kejadian)
  const handleCaptureGPS = () => {
    if ('geolocation' in navigator) {
      setIsCapturingGPS(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latVal = parseFloat(pos.coords.latitude.toFixed(6));
          const lngVal = parseFloat(pos.coords.longitude.toFixed(6));
          setLat(latVal);
          setLng(lngVal);
          setIsCapturingGPS(false);
          setGpsLocked(true);
          setCoordSource('gps');
          setGpsAccuracy(Math.round(pos.coords.accuracy || 10));
          setTimeout(() => setGpsLocked(false), 5000);
        },
        (err) => {
          setIsCapturingGPS(false);
          alert('Gagal mengambil titik GPS: ' + (err.message || 'Izin lokasi tidak diberikan. Pastikan GPS aktif.'));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      alert('Perangkat Anda tidak mendukung fitur geolokasi GPS.');
    }
  };

  // Handle Pilih Lokasi via Pop-up Peta (Input di Luar TKP)
  const handleLocationFromMap = (selectedLat, selectedLng) => {
    setLat(selectedLat);
    setLng(selectedLng);
    setCoordSource('map_picker');
    setGpsLocked(false);
  };

  // Handle kecamatan change in modal
  const handleKecamatanChange = (kecName) => {
    setKecamatan(kecName);
    const foundKec = wilayahData.find(k => k.nama === kecName) || KECAMATAN_HST.find(k => k.nama === kecName);
    if (foundKec) {
      if (foundKec.desa && foundKec.desa.length > 0) {
        setDesa(foundKec.desa[0]);
      } else {
        setDesa('');
      }
      if (foundKec.lat && foundKec.lng && !gpsLocked) {
        setLat(foundKec.lat);
        setLng(foundKec.lng);
      }
    }
  };

  // Handle Quick Select Pelapor from Master Pelapor
  const handleSelectMasterPelapor = (pelaporName) => {
    setNamaPelapor(pelaporName);
    const foundPelapor = pelaporData.find(p => p.nama === pelaporName);
    if (foundPelapor) {
      if (foundPelapor.kecamatan) {
        setKecamatan(foundPelapor.kecamatan);
        handleKecamatanChange(foundPelapor.kecamatan);
      }
      if (foundPelapor.desa) {
        setDesa(foundPelapor.desa);
      }
      if (foundPelapor.alamat) {
        setLokasi(foundPelapor.alamat);
      }
    }
  };

  // Personel Checklist Handlers
  const handleTogglePersonil = (namaPersonil) => {
    if (selectedPersonil.includes(namaPersonil)) {
      setSelectedPersonil(selectedPersonil.filter(p => p !== namaPersonil));
    } else {
      setSelectedPersonil([...selectedPersonil, namaPersonil]);
    }
  };

  const handleSelectRegu = (reguKeyword) => {
    const matching = pegawaiData
      .filter(p => (p.regu || '').toLowerCase().includes(reguKeyword.toLowerCase()))
      .map(p => p.nama);
    const combined = Array.from(new Set([...selectedPersonil, ...matching]));
    setSelectedPersonil(combined);
  };

  const handleAddCustomPersonil = () => {
    const trimmed = customPersonilInput.trim();
    if (trimmed && !selectedPersonil.includes(trimmed)) {
      setSelectedPersonil([...selectedPersonil, trimmed]);
      setCustomPersonilInput('');
    }
  };

  const handleRemovePersonil = (namaPersonil) => {
    setSelectedPersonil(selectedPersonil.filter(p => p !== namaPersonil));
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    setNamaPelapor('Masyarakat');
    setTanggal(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
    setJenisPengaduan('');
    setTindakLanjut('Penertiban');
    setStatusPengaduan('Terlayani');
    setSelectedPersonil(pegawaiData.length > 0 ? [pegawaiData[0].nama] : ['Regu I Murakata']);
    setSearchPersonil('');
    setCustomPersonilInput('');
    setKecamatan('Barabai');
    setDesa('Barabai Barat');
    setLokasi('');
    setPerdaYangDipakai(perdaData.length > 0 ? `${perdaData[0].nomor} ${perdaData[0].pasal}` : 'Perda No 6 Tahun 2024 Trantibum');
    setLat(-2.5833);
    setLng(115.3811);
    setGpsLocked(false);
    setCoordSource('default');
    setIsMapPickerOpen(false);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setNamaPelapor(item.namaPelapor || 'Masyarakat');
    setTanggal(item.tanggal || '');
    setJenisPengaduan(item.jenisPengaduan || '');
    setTindakLanjut(item.tindakLanjut || 'Penertiban');
    setStatusPengaduan(item.statusPengaduan || 'Terlayani');
    const parsedPersonil = formatPersonilList(item.personil);
    setSelectedPersonil(parsedPersonil.length > 0 ? parsedPersonil : ['Regu I Murakata']);
    setSearchPersonil('');
    setCustomPersonilInput('');
    setKecamatan(item.kecamatan || 'Barabai');
    setDesa(item.desa || 'Barabai Barat');
    setLokasi(item.lokasi || '');
    setPerdaYangDipakai(item.perdaYangDipakai || '');
    setLat(item.lat || -2.5833);
    setLng(item.lng || 115.3811);
    setGpsLocked(false);
    setCoordSource('default');
    setIsMapPickerOpen(false);
    setIsModalOpen(true);
  };

  // Save Item (Create or Update)
  const handleSaveItem = (e) => {
    e.preventDefault();
    if (!jenisPengaduan.trim() || !lokasi.trim()) {
      alert('Harap lengkapi jenis pengaduan dan lokasi!');
      return;
    }

    if (selectedPersonil.length === 0) {
      alert('Harap pilih minimal 1 personil penanggung jawab penanganan!');
      return;
    }

    saveRekapTrantibumItem({
      id: editingItem ? editingItem.id : undefined,
      namaPelapor,
      tanggal,
      jenisPengaduan: jenisPengaduan.trim(),
      tindakLanjut,
      statusPengaduan,
      personil: selectedPersonil,
      kecamatan,
      desa,
      lokasi: lokasi.trim(),
      lat: parseFloat(lat) || -2.5833,
      lng: parseFloat(lng) || 115.3811,
      perdaYangDipakai
    });

    setIsModalOpen(false);
    if (onRefreshData) onRefreshData();
  };

  // Delete Item
  const handleDeleteItem = (id) => {
    deleteRekapTrantibumItem(id);
    setDeleteItemId(null);
    if (onRefreshData) onRefreshData();
  };

  // Quick Inline Status Change
  const handleQuickStatusChange = (id, newStatus) => {
    updateRekapTrantibumStatus(id, newStatus);
    if (onRefreshData) onRefreshData();
  };

  // Filter & Pagination Handlers
  const handleFilterBulan = (val) => {
    setSelectedBulan(val);
    setCurrentPage(1);
  };

  const handleFilterTahun = (val) => {
    setSelectedTahun(val);
    setCurrentPage(1);
  };

  const handleSortChange = (val) => {
    setSortBy(val);
    setCurrentPage(1);
  };

  const handleSearchChange = (val) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleStatusChange = (val) => {
    setSelectedStatus(val);
    setCurrentPage(1);
  };

  const handlePelaporChange = (val) => {
    setSelectedPelapor(val);
    setCurrentPage(1);
  };

  const handleTindakChange = (val) => {
    setSelectedTindakLanjut(val);
    setCurrentPage(1);
  };

  const handleKecamatanChangeFilter = (val) => {
    setSelectedKecamatan(val);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (val) => {
    setPageSize(Number(val));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('semua');
    setSelectedPelapor('semua');
    setSelectedTindakLanjut('semua');
    setSelectedKecamatan('semua');
    setSelectedPerda('semua');
    setSelectedBulan('semua');
    setSelectedTahun('semua');
    setSortBy('tanggal_desc');
    setCurrentPage(1);
  };

  // Available Years
  const availableYears = Array.from(new Set(
    rekapList.map(item => parseDateInfo(item.tanggal).year).filter(Boolean)
  )).sort((a, b) => b - a);

  // 1. Filter list
  const filtered = rekapList.filter(item => {
    const personilStr = formatPersonilList(item.personil).join(' ');

    const matchSearch = 
      (item.jenisPengaduan || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.lokasi || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.kecamatan || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.desa || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      personilStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.perdaYangDipakai || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.tanggal || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.namaPelapor || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchPelapor = selectedPelapor === 'semua' || item.namaPelapor === selectedPelapor;
    const matchTindak = selectedTindakLanjut === 'semua' || item.tindakLanjut === selectedTindakLanjut;
    const matchStatus = selectedStatus === 'semua' || item.statusPengaduan === selectedStatus;
    const matchPerda = selectedPerda === 'semua' || (item.perdaYangDipakai || '').includes(selectedPerda);
    const matchKecamatan = selectedKecamatan === 'semua' || item.kecamatan === selectedKecamatan;

    const dateInfo = parseDateInfo(item.tanggal);
    const matchBulan = selectedBulan === 'semua' || (dateInfo.month && dateInfo.month === parseInt(selectedBulan, 10));
    const matchTahun = selectedTahun === 'semua' || (dateInfo.year && dateInfo.year === parseInt(selectedTahun, 10));

    return matchSearch && matchPelapor && matchTindak && matchStatus && matchPerda && matchKecamatan && matchBulan && matchTahun;
  });

  // 2. Sort list
  const sorted = [...filtered].sort((a, b) => {
    const dateA = parseDateInfo(a.tanggal);
    const dateB = parseDateInfo(b.tanggal);

    if (sortBy === 'tanggal_desc') {
      return (dateB.timestamp || 0) - (dateA.timestamp || 0);
    }
    if (sortBy === 'tanggal_asc') {
      return (dateA.timestamp || 0) - (dateB.timestamp || 0);
    }
    if (sortBy === 'bulan_asc') {
      const mA = dateA.month || 0;
      const mB = dateB.month || 0;
      if (mA !== mB) return mA - mB;
      return (dateA.timestamp || 0) - (dateB.timestamp || 0);
    }
    if (sortBy === 'bulan_desc') {
      const mA = dateA.month || 0;
      const mB = dateB.month || 0;
      if (mA !== mB) return mB - mA;
      return (dateB.timestamp || 0) - (dateA.timestamp || 0);
    }
    if (sortBy === 'no_asc') {
      return (a.no || 0) - (b.no || 0);
    }
    if (sortBy === 'pelapor_asc') {
      return (a.namaPelapor || '').localeCompare(b.namaPelapor || '');
    }
    return 0;
  });

  // 3. Pagination calculations
  const totalItems = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedRows = totalItems === 0 ? [] : sorted.slice(startIndex, endIndex);

  // Pagination page numbers generator
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    if (safeCurrentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (safeCurrentPage >= totalPages - 3) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages);
    }
    return pages;
  };

  const isFiltered = 
    searchTerm !== '' || 
    selectedStatus !== 'semua' || 
    selectedPelapor !== 'semua' || 
    selectedTindakLanjut !== 'semua' || 
    selectedKecamatan !== 'semua' || 
    selectedBulan !== 'semua' || 
    selectedTahun !== 'semua' || 
    sortBy !== 'tanggal_desc';

  // Filtered Pegawai for Checklist
  const filteredPegawai = pegawaiData.filter(peg => 
    peg.nama.toLowerCase().includes(searchPersonil.toLowerCase()) ||
    (peg.jabatan && peg.jabatan.toLowerCase().includes(searchPersonil.toLowerCase())) ||
    (peg.regu && peg.regu.toLowerCase().includes(searchPersonil.toLowerCase()))
  );

  // KPI Calculations
  const countTerlayani = rekapList.filter(r => r.statusPengaduan === 'Terlayani').length;
  const countDalamPenanganan = rekapList.filter(r => r.statusPengaduan === 'Dalam Penanganan').length;
  const countMenunggu = rekapList.filter(r => r.statusPengaduan === 'Menunggu Tindak Lanjut').length;
  const countPenegakan = rekapList.filter(r => r.statusPengaduan === 'Diteruskan ke Tim Penegakan').length;

  const currentModalKecObj = wilayahData.find(k => k.nama === kecamatan) || KECAMATAN_HST.find(k => k.nama === kecamatan) || KECAMATAN_HST[0];

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'No', 
      'Nama Pelapor', 
      'Tanggal', 
      'Jenis Pengaduan', 
      'Tindak Lanjut', 
      'Status Pengaduan', 
      'Personil yang Menangani', 
      'Kecamatan', 
      'Desa/Kelurahan', 
      'Lokasi', 
      'Latitude GPS', 
      'Longitude GPS', 
      'Perda yang Dipakai'
    ];
    
    const rows = sorted.map((item, idx) => [
      `"${idx + 1}"`,
      `"${item.namaPelapor}"`,
      `"${item.tanggal}"`,
      `"${item.jenisPengaduan}"`,
      `"${item.tindakLanjut}"`,
      `"${item.statusPengaduan}"`,
      `"${formatPersonilList(item.personil).join('; ') || '-'}"`,
      `"${item.kecamatan || '-'}"`,
      `"${item.desa || '-'}"`,
      `"${item.lokasi}"`,
      `"${item.lat || '-'}"`,
      `"${item.lng || '-'}"`,
      `"${item.perdaYangDipakai}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_pengaduan_trantibum_satpolpp_hst_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#0F2A4A] text-white flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#F0B429]" />
              BUKU REGISTER RESMI DINAS
            </span>
            <span className="text-xs text-slate-500 font-medium">Satpol PP Kab. HST</span>
          </div>
          <h2 className="text-xl font-extrabold text-[#0F2A4A] mt-1.5 tracking-tight">
            Rekap Pengaduan & Tindak Lanjut Trantibum
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Buku register penanganan pengaduan warga, inisiatif penertiban SKPD, status progres dinamis, dan penugasan tim personil lapangan
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak Rekap</span>
          </button>
          
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Unduh Laporan (.CSV)</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-[#0F2A4A] hover:bg-[#14365D] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-[#0F2A4A]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F0B429]" />
            <span>Tambah Catatan Baru</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Mini Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Kegiatan</span>
          <p className="text-2xl font-extrabold text-[#0F2A4A] mt-1 font-mono">{rekapList.length}</p>
          <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 mt-1">
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#F0B429]" /> Register Trantibum
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Terlayani / Selesai</span>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1 font-mono">{countTerlayani}</p>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Penindakan Selesai
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dalam Penanganan</span>
          <p className="text-2xl font-extrabold text-amber-700 mt-1 font-mono">{countDalamPenanganan}</p>
          <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1 mt-1">
            <Clock className="w-3.5 h-3.5" /> Regu Bertugas
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Menunggu / Penegakan</span>
          <p className="text-2xl font-extrabold text-rose-700 mt-1 font-mono">{countMenunggu + countPenegakan}</p>
          <span className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 mt-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Butuh Tindak Lanjut
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Row 1: Search & Reset */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari jenis kejadian, lokasi, personil, pelapor, atau perda..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden text-slate-800"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute right-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
              title="Reset seluruh filter dan urutan ke default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>

        {/* Row 2: Sortir Per Bulan & Filter Spesifik */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 pt-1 border-t border-slate-100">
          {/* 1. Sortir / Urutkan */}
          <div className="col-span-2 sm:col-span-1 bg-amber-50/70 border border-amber-200/80 rounded-xl px-2.5 py-1.5 flex flex-col justify-center">
            <label className="text-[10px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-amber-700" />
              <span>Urutkan</span>
            </label>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent outline-hidden cursor-pointer mt-0.5 truncate"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-white text-slate-800 font-semibold">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Filter Bulan */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl px-2.5 py-1.5 flex flex-col justify-center">
            <label className="text-[10px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1">
              <CalendarDays className="w-3 h-3 text-blue-700" />
              <span>Bulan</span>
            </label>
            <select
              value={selectedBulan}
              onChange={(e) => handleFilterBulan(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent outline-hidden cursor-pointer mt-0.5 truncate"
            >
              {BULAN_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-white text-slate-800 font-semibold">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Filter Tahun */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 flex flex-col justify-center">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Tahun
            </label>
            <select
              value={selectedTahun}
              onChange={(e) => handleFilterTahun(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent outline-hidden cursor-pointer mt-0.5 truncate"
            >
              <option value="semua">Semua Tahun</option>
              {availableYears.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>

          {/* 4. Filter Status */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 flex flex-col justify-center">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent outline-hidden cursor-pointer mt-0.5 truncate"
            >
              <option value="semua">Semua Status</option>
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* 5. Filter Sumber Pelapor */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 flex flex-col justify-center">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Sumber
            </label>
            <select
              value={selectedPelapor}
              onChange={(e) => handlePelaporChange(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent outline-hidden cursor-pointer mt-0.5 truncate"
            >
              <option value="semua">Semua Pelapor</option>
              <option value="Masyarakat">Masyarakat</option>
              <option value="Inisiatif SKPD">Inisiatif SKPD</option>
            </select>
          </div>

          {/* 6. Filter Tindakan */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 flex flex-col justify-center">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Tindakan
            </label>
            <select
              value={selectedTindakLanjut}
              onChange={(e) => handleTindakChange(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent outline-hidden cursor-pointer mt-0.5 truncate"
            >
              <option value="semua">Semua Tindakan</option>
              <option value="Penertiban">Penertiban</option>
              <option value="Pengamanan">Pengamanan</option>
              <option value="Pengawasan">Pengawasan</option>
              <option value="Peneguran">Peneguran</option>
            </select>
          </div>

          {/* 7. Filter Kecamatan */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 flex flex-col justify-center">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Kecamatan
            </label>
            <select
              value={selectedKecamatan}
              onChange={(e) => handleKecamatanChangeFilter(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent outline-hidden cursor-pointer mt-0.5 truncate"
            >
              <option value="semua">Semua Wilayah</option>
              {wilayahData.map(k => (
                <option key={k.id} value={k.nama}>{k.nama}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filter Pills (Tags) */}
        {isFiltered && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
            <span className="text-slate-400 font-semibold text-[10px] uppercase">Filter Aktif:</span>
            {selectedBulan !== 'semua' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 font-semibold">
                Bulan: {BULAN_OPTIONS.find(b => b.value === selectedBulan)?.label}
                <button type="button" onClick={() => handleFilterBulan('semua')} className="hover:text-blue-950">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedTahun !== 'semua' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-200 text-slate-800 font-semibold">
                Tahun: {selectedTahun}
                <button type="button" onClick={() => handleFilterTahun('semua')} className="hover:text-slate-950">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedStatus !== 'semua' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-semibold">
                Status: {selectedStatus}
                <button type="button" onClick={() => handleStatusChange('semua')} className="hover:text-amber-950">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedKecamatan !== 'semua' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-900 font-semibold">
                Kec: {selectedKecamatan}
                <button type="button" onClick={() => handleKecamatanChangeFilter('semua')} className="hover:text-indigo-950">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedPelapor !== 'semua' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-100 text-purple-900 font-semibold">
                Sumber: {selectedPelapor}
                <button type="button" onClick={() => handlePelaporChange('semua')} className="hover:text-purple-950">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedTindakLanjut !== 'semua' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-100 text-cyan-900 font-semibold">
                Tindakan: {selectedTindakLanjut}
                <button type="button" onClick={() => handleTindakChange('semua')} className="hover:text-cyan-950">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {sortBy !== 'tanggal_desc' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-semibold">
                Sort: {SORT_OPTIONS.find(s => s.value === sortBy)?.label}
                <button type="button" onClick={() => handleSortChange('tanggal_desc')} className="hover:text-amber-950">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tabel Data Rekapitulasi Trantibum */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 text-left border-r border-slate-200 w-12">No</th>
                <th className="py-3 px-3 border-r border-slate-200 min-w-[120px] text-left">Nama Pelapor</th>
                <th className="py-3 px-3 border-r border-slate-200 min-w-[110px] text-left">Tanggal</th>
                <th className="py-3 px-4 border-r border-slate-200 min-w-[210px] text-left">Jenis Pengaduan & Perda</th>
                <th className="py-3 px-3 border-r border-slate-200 min-w-[100px] text-left">Tindakan</th>
                <th className="py-3 px-3.5 border-r border-slate-200 min-w-[160px] text-left">Wilayah (Kec/Desa)</th>
                <th className="py-3 px-4 border-r border-slate-200 min-w-[180px] text-left">Detail Lokasi & GPS</th>
                <th className="py-3 px-3.5 border-r border-slate-200 min-w-[200px] text-left">Personil Penangan</th>
                <th className="py-3 px-3.5 border-r border-slate-200 min-w-[140px] text-left">Status</th>
                <th className="py-3 px-3 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-600">Tidak ada baris register yang sesuai kriteria filter</p>
                    <p className="text-xs text-slate-400 mt-0.5">Silakan reset filter atau ubah pilihan bulan/status.</p>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => {
                  const isMasyarakat = row.namaPelapor === 'Masyarakat' || pelaporData.some(p => p.nama === row.namaPelapor && p.tipe === 'Masyarakat');
                  const isPenertiban = row.tindakLanjut === 'Penertiban';
                  const isPengamanan = row.tindakLanjut === 'Pengamanan';
                  const isPengawasan = row.tindakLanjut === 'Pengawasan';

                  const currentStatusOpt = STATUS_OPTIONS.find(s => s.value === row.statusPengaduan) || STATUS_OPTIONS[0];
                  const personilList = formatPersonilList(row.personil);
                  const rowNumber = startIndex + idx + 1;

                  return (
                    <tr key={row.id || idx} className="hover:bg-amber-50/40 transition-colors">
                      {/* No */}
                      <td className="py-3 px-3 text-left font-mono font-bold text-slate-600 border-r border-slate-200">
                        {rowNumber}
                      </td>

                      {/* Nama Pelapor */}
                      <td className="py-3 px-3 border-r border-slate-200 font-semibold text-slate-800">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                          isMasyarakat 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {isMasyarakat ? <User className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                          <span className="truncate max-w-[110px]">{row.namaPelapor}</span>
                        </span>
                      </td>

                      {/* Tanggal */}
                      <td className="py-3 px-3 border-r border-slate-200 text-slate-700 whitespace-nowrap font-medium">
                        {row.tanggal}
                      </td>

                      {/* Jenis Pengaduan & Perda */}
                      <td className="py-3 px-4 border-r border-slate-200">
                        <p className="font-bold text-[#0F2A4A] leading-snug">{row.jenisPengaduan}</p>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mt-1">
                          <Scale className="w-3 h-3 text-amber-600 shrink-0" />
                          <span className="line-clamp-1">{row.perdaYangDipakai}</span>
                        </div>
                      </td>

                      {/* Tindak Lanjut */}
                      <td className="py-3 px-3 border-r border-slate-200">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                          isPenertiban ? 'bg-red-50 text-red-700 border border-red-200' :
                          isPengamanan ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                          isPengawasan ? 'bg-cyan-50 text-cyan-800 border border-cyan-200' :
                          'bg-orange-50 text-orange-800 border border-orange-200'
                        }`}>
                          {row.tindakLanjut}
                        </span>
                      </td>

                      {/* Wilayah */}
                      <td className="py-3 px-3.5 border-r border-slate-200 text-left">
                        <div className="flex items-center gap-1 font-bold text-[#0F2A4A]">
                          <MapPin className="w-3.5 h-3.5 text-[#F0B429] shrink-0" />
                          <span>Kec. {row.kecamatan || 'Barabai'}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 pl-4 block mt-0.5">
                          Desa {row.desa || '-'}
                        </span>
                      </td>

                      {/* Detail Lokasi & GPS */}
                      <td className="py-3 px-4 border-r border-slate-200 text-slate-800 text-left">
                        <span className="font-medium text-xs leading-snug block">{row.lokasi}</span>
                        {row.lat && row.lng ? (
                          <a
                            href={`https://www.google.com/maps?q=${row.lat},${row.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Buka titik koordinat GPS di Google Maps"
                            className="inline-flex items-center gap-1 mt-1 text-[10px] font-mono font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200 transition-colors"
                          >
                            <Navigation className="w-2.5 h-2.5 text-blue-500" />
                            <span>GPS: {Number(row.lat).toFixed(4)}, {Number(row.lng).toFixed(4)}</span>
                            <ExternalLink className="w-2.5 h-2.5 text-blue-400" />
                          </a>
                        ) : null}
                      </td>

                      {/* Personil Penangan (Multi-Personel Display) */}
                      <td className="py-3 px-3.5 border-r border-slate-200 text-left">
                        {personilList.length > 0 ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-[11px] font-extrabold text-[#0F2A4A]">
                              <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span>{personilList.length} Personel:</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {personilList.map((p, pIdx) => (
                                <span
                                  key={pIdx}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-900 border border-indigo-200"
                                >
                                  {p}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* Status Pengaduan with Quick Selector */}
                      <td className="py-3 px-3.5 border-r border-slate-200 text-left">
                        <div className="relative group">
                          <select
                            value={row.statusPengaduan || 'Terlayani'}
                            onChange={(e) => handleQuickStatusChange(row.id, e.target.value)}
                            className={`w-full py-1 px-2 rounded-lg text-[11px] font-bold border cursor-pointer outline-hidden transition-all ${currentStatusOpt.color}`}
                          >
                            {STATUS_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value} className="bg-white text-slate-800 font-semibold">
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Aksi CRUD */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(row)}
                            title="Edit Catatan Kegiatan"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteItemId(row.id)}
                            title="Hapus Catatan"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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

        {/* ========================================================================= */}
        {/* PAGING / PAGINATION BAR */}
        {/* ========================================================================= */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Left: Info & Items per page */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Tampilkan:</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden cursor-pointer"
              >
                <option value={5}>5 baris</option>
                <option value={10}>10 baris</option>
                <option value={15}>15 baris</option>
                <option value={25}>25 baris</option>
                <option value={50}>50 baris</option>
              </select>
            </div>

            <span className="text-slate-300">|</span>

            <div>
              Menampilkan <span className="font-extrabold text-[#0F2A4A]">{totalItems === 0 ? 0 : startIndex + 1} - {endIndex}</span> dari <span className="font-extrabold text-[#0F2A4A]">{totalItems}</span> kegiatan
              {isFiltered && (
                <span className="text-slate-400 text-[11px] ml-1 font-medium">
                  (difilter dari {rekapList.length} total register)
                </span>
              )}
            </div>
          </div>

          {/* Right: Page Navigation Buttons */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              {/* Pertama */}
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage === 1}
                title="Halaman Pertama"
                className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                  safeCurrentPage === 1
                    ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-100'
                    : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-100 cursor-pointer'
                }`}
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>

              {/* Sebelumnya */}
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={safeCurrentPage === 1}
                title="Halaman Sebelumnya"
                className={`px-2 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                  safeCurrentPage === 1
                    ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-100'
                    : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-100 cursor-pointer'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sebelumnya</span>
              </button>

              {/* Numbered Buttons */}
              <div className="flex items-center gap-1 px-1">
                {getPageNumbers().map((pageNum, pIdx) => {
                  if (pageNum === '...') {
                    return (
                      <span key={`dots-${pIdx}`} className="px-1 text-slate-400 font-bold">
                        ...
                      </span>
                    );
                  }

                  const isActive = pageNum === safeCurrentPage;
                  return (
                    <button
                      key={`page-${pageNum}`}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-7 h-7 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#0F2A4A] text-white shadow-xs'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Selanjutnya */}
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage === totalPages}
                title="Halaman Selanjutnya"
                className={`px-2 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                  safeCurrentPage === totalPages
                    ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-100'
                    : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-100 cursor-pointer'
                }`}
              >
                <span className="hidden sm:inline">Selanjutnya</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Terakhir */}
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage === totalPages}
                title="Halaman Terakhir"
                className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                  safeCurrentPage === totalPages
                    ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-100'
                    : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-100 cursor-pointer'
                }`}
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL TAMBAH / EDIT CATATAN REGISTER */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Catatan Register Trantibum' : 'Tambah Catatan Buku Register Trantibum'}
        subtitle="Entri data pengaduan, kegiatan penertiban, dan penugasan tim personil lapangan"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Pelapor */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Nama Pelapor / Sumber *</label>
                {pelaporData.length > 0 && (
                  <span className="text-[10px] text-blue-600 font-semibold">Tersambung Master Pelapor</span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={namaPelapor}
                  onChange={(e) => setNamaPelapor(e.target.value)}
                  placeholder="Contoh: Masyarakat / Bapenda / Nama Pelapor"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden font-semibold"
                />
                {pelaporData.length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) handleSelectMasterPelapor(e.target.value);
                    }}
                    className="w-28 px-2 py-2 rounded-xl border border-slate-300 bg-slate-50 text-[11px] font-medium outline-hidden"
                  >
                    <option value="">Pilih Kontak...</option>
                    <option value="Masyarakat">Masyarakat</option>
                    <option value="Inisiatif SKPD">Inisiatif SKPD</option>
                    {pelaporData.map(p => (
                      <option key={p.id} value={p.nama}>{p.nama}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Tanggal */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tanggal Kegiatan *</label>
              <input
                type="text"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                placeholder="Contoh: 31 January 2026"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Jenis Pengaduan / Kejadian *</label>
            <input
              type="text"
              required
              value={jenisPengaduan}
              onChange={(e) => setJenisPengaduan(e.target.value)}
              placeholder="Contoh: Spanduk dan banner tanpa izin / Badut mengemis"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Tindak Lanjut */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tindak Lanjut Operasional *</label>
              <select
                value={tindakLanjut}
                onChange={(e) => setTindakLanjut(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white font-semibold"
              >
                <option value="Penertiban">Penertiban</option>
                <option value="Pengamanan">Pengamanan</option>
                <option value="Pengawasan">Pengawasan</option>
                <option value="Peneguran">Peneguran</option>
              </select>
            </div>

            {/* Status Pengaduan */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status Penanganan *</label>
              <select
                value={statusPengaduan}
                onChange={(e) => setStatusPengaduan(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white font-bold text-[#0F2A4A]"
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* MULTI-PERSONIL CHECKLIST SYSTEM */}
          {/* ========================================================================= */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <label className="font-extrabold text-slate-800 text-xs">
                    Personil Penanggung Jawab & Regu Lapangan *
                  </label>
                  <span className="text-[10px] text-slate-500 block">
                    Bisa pilih lebih dari satu personil menggunakan sistem ceklis
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px]">
                  {selectedPersonil.length} Personel Terpilih
                </span>
              </div>
            </div>

            {/* Selected Personnel Chips */}
            <div>
              <span className="text-[11px] font-bold text-slate-600 block mb-1">
                Daftar Personel yang Ditugaskan:
              </span>
              {selectedPersonil.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-xl border border-slate-200 max-h-24 overflow-y-auto">
                  {selectedPersonil.map((p, i) => (
                    <span 
                      key={i} 
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-900 border border-indigo-200 shadow-2xs"
                    >
                      <span>{p}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemovePersonil(p)}
                        className="text-slate-400 hover:text-rose-600 p-0.5 transition-colors cursor-pointer"
                        title="Hapus personil ini"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-200 text-amber-800 text-xs italic">
                  ⚠️ Belum ada personil yang dipilih. Silakan centang nama personil pada daftar ceklis di bawah.
                </div>
              )}
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Ceklis Cepat:</span>
              <button
                type="button"
                onClick={() => handleSelectRegu('Regu I')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 text-[11px] font-semibold text-slate-700 hover:text-indigo-700 transition-colors cursor-pointer"
              >
                + Regu I (Murakata)
              </button>
              <button
                type="button"
                onClick={() => handleSelectRegu('Regu II')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 text-[11px] font-semibold text-slate-700 hover:text-indigo-700 transition-colors cursor-pointer"
              >
                + Regu II
              </button>
              <button
                type="button"
                onClick={() => handleSelectRegu('Penegakan')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 text-[11px] font-semibold text-slate-700 hover:text-indigo-700 transition-colors cursor-pointer"
              >
                + Tim Penegakan
              </button>
              <button
                type="button"
                onClick={() => setSelectedPersonil(pegawaiData.map(p => p.nama))}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 text-[11px] font-semibold text-slate-700 hover:text-indigo-700 transition-colors cursor-pointer"
              >
                Pilih Semua ({pegawaiData.length})
              </button>
              {selectedPersonil.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedPersonil([])}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer ml-auto"
                >
                  Reset Pilihan
                </button>
              )}
            </div>

            {/* Checklist Box with Search */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-2 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                <input
                  type="text"
                  value={searchPersonil}
                  onChange={(e) => setSearchPersonil(e.target.value)}
                  placeholder="Cari nama personil Satpol PP, jabatan, atau regu..."
                  className="w-full text-xs bg-transparent outline-hidden"
                />
              </div>

              <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 p-1">
                {filteredPegawai.length === 0 ? (
                  <p className="p-3 text-center text-xs text-slate-400 italic">
                    Tidak ada personel yang sesuai pencarian.
                  </p>
                ) : (
                  filteredPegawai.map((peg) => {
                    const isChecked = selectedPersonil.includes(peg.nama);
                    return (
                      <div
                        key={peg.id}
                        onClick={() => handleTogglePersonil(peg.nama)}
                        className={`p-2 rounded-lg flex items-center justify-between gap-3 text-xs cursor-pointer transition-colors ${
                          isChecked ? 'bg-indigo-50/70 text-indigo-950 font-bold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${
                            isChecked ? 'bg-indigo-600 text-white' : 'border border-slate-300 bg-white'
                          }`}>
                            {isChecked ? <Check className="w-3 h-3 stroke-[3]" /> : null}
                          </div>
                          <div className="truncate">
                            <span className="block truncate leading-tight">{peg.nama}</span>
                            <span className="text-[10px] text-slate-400 font-normal block">
                              {peg.jabatan || 'Petugas Satpol PP'} • NIP: {peg.nip || '-'}
                            </span>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                          isChecked ? 'bg-indigo-200/60 text-indigo-900' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {peg.regu || 'Regu Patroli'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Custom Outside Personnel Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={customPersonilInput}
                onChange={(e) => setCustomPersonilInput(e.target.value)}
                placeholder="Atau ketik nama personil/aparat gabungan (misal: Babinsa Kodim, Polsek)..."
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddCustomPersonil}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </div>
          </div>

          {/* Dasar Perda */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Dasar Perda yang Dipakai *</label>
            <select
              value={perdaYangDipakai}
              onChange={(e) => setPerdaYangDipakai(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white"
            >
              {perdaData && perdaData.length > 0 ? (
                perdaData.map(p => (
                  <option key={p.id} value={`${p.nomor} ${p.pasal}`}>
                    {p.nomor} — {p.pasal} ({p.kategori})
                  </option>
                ))
              ) : (
                <>
                  <option value="Perda No 6 Tahun 2024 Trantibum">Perda No 6 Tahun 2024 Trantibum</option>
                  <option value="Perda No 1 Tahun 2024 Retribusi Daerah">Perda No 1 Tahun 2024 Retribusi Daerah</option>
                  <option value="Perda No 3 Tahun 2016 Kegiatan Ramadhan">Perda No 3 Tahun 2016 Kegiatan Ramadhan</option>
                  <option value="Perda No 04 Tahun 2021 Trantibum">Perda No 04 Tahun 2021 Trantibum</option>
                </>
              )}
            </select>
          </div>

          {/* WILAYAH: KECAMATAN & DESA */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#F0B429]" />
                <span>Kecamatan *</span>
              </label>
              <select
                value={kecamatan}
                onChange={(e) => handleKecamatanChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white font-bold text-[#0F2A4A]"
                required
              >
                {wilayahData.map(k => (
                  <option key={k.id} value={k.nama}>{k.nama}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Desa / Kelurahan *
              </label>
              <select
                value={desa}
                onChange={(e) => setDesa(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white"
                required
              >
                {(currentModalKecObj.desa || []).map((d, i) => (
                  <option key={i} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Detail Lokasi / Patokan Jalan *</label>
            <input
              type="text"
              required
              value={lokasi}
              onChange={(e) => setLokasi(e.target.value)}
              placeholder="Contoh: Jl. Murakata seberang minimarket"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
            />
          </div>

          {/* TITIK KOORDINAT GPS (DUAL METODE: GPS LANGSUNG & POP-UP PETA) */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <Compass className="w-4 h-4 text-blue-600" />
                  <span>Titik Koordinat Lokasi Kejadian</span>
                </label>
                <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                  Pilih metode pengambilan titik koordinat lapangan:
                </span>
              </div>

              {/* DUA METODE TOMBOL AMBIL TITIK */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* 1. Ambil Langsung GPS (Di Tempat Kejadian) */}
                <button
                  type="button"
                  onClick={handleCaptureGPS}
                  disabled={isCapturingGPS}
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  title="Ambil titik koordinat otomatis menggunakan sensor GPS perangkat saat Anda berada di lokasi kejadian"
                >
                  {isCapturingGPS ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Mencari Satelit...</span>
                    </>
                  ) : (
                    <>
                      <Crosshair className="w-3.5 h-3.5 text-[#F0B429]" />
                      <span>Ambil GPS Langsung (Di TKP)</span>
                    </>
                  )}
                </button>

                {/* 2. Pop-up Peta Interaktif (Input di Luar Tempat Kejadian) */}
                <button
                  type="button"
                  onClick={() => setIsMapPickerOpen(true)}
                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                  title="Buka pop-up peta interaktif untuk menandai titik jika penginputan dilakukan di luar lokasi (misal di Kantor Mako)"
                >
                  <MapPin className="w-3.5 h-3.5 text-red-600" />
                  <span>Pilih di Peta (Input Luar TKP)</span>
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

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">Latitude (Lintang):</span>
                <input
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => {
                    setLat(e.target.value);
                    setCoordSource('manual');
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
                    setLng(e.target.value);
                    setCoordSource('manual');
                  }}
                  placeholder="115.3811"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-xs focus:ring-2 focus:ring-[#0F2A4A] outline-hidden font-semibold text-slate-800"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
              <span>Wilayah: Kec. {kecamatan}{desa ? `, Desa ${desa}` : ''} ({Number(lat).toFixed(4)}, {Number(lng).toFixed(4)})</span>
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

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#0F2A4A] hover:bg-[#14365D] text-white font-bold rounded-xl shadow-xs transition-all"
            >
              {editingItem ? 'Simpan Perubahan Register' : 'Simpan ke Register'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL KONFIRMASI HAPUS CATATAN */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!deleteItemId}
        onClose={() => setDeleteItemId(null)}
        title="Konfirmasi Hapus Catatan Register"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900">
              <p className="font-bold">Apakah Anda yakin ingin menghapus catatan register ini?</p>
              <p className="mt-1 text-rose-800">
                Data register ini akan dihapus dari buku dinas. Nomor urut baris kegiatan berikutnya akan disesuaikan secara otomatis.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDeleteItemId(null)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => handleDeleteItem(deleteItemId)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-md shadow-rose-600/20 cursor-pointer"
            >
              Ya, Hapus Catatan
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL POP-UP PETA PEMILIH TITIK KEJADIAN (INPUT DI LUAR TKP) */}
      {/* ========================================================================= */}
      <ModalMapPicker
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        initialLat={lat}
        initialLng={lng}
        currentKecamatan={kecamatan}
        currentDesa={desa}
        onSelectLocation={handleLocationFromMap}
      />
    </div>
  );
}
