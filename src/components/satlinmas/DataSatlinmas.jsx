import React, { useState, useId } from 'react';
import {
  ShieldCheck,
  Search,
  Plus,
  Download,
  Printer,
  Edit,
  Trash2,
  FileText,
  UserCheck,
  UserX,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Users,
  CheckCircle2,
  AlertCircle,
  Eye,
  Upload,
  Camera,
  FileCheck,
  Layers,
  Filter,
  X,
  FileSpreadsheet,
  IdCard,
  QrCode
} from 'lucide-react';
import Modal from '../common/Modal';
import { KECAMATAN_HST } from '../../data/mockData';
import { saveSatlinmas, deleteSatlinmas } from '../../data/storageService';
import { processImageUpload } from '../../utils/imageHelper';

export default function DataSatlinmas({ 
  satlinmasList = [], 
  onRefreshData, 
  wilayahList = KECAMATAN_HST,
  assignedKecamatan = null 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKecamatan, setSelectedKecamatan] = useState(assignedKecamatan || 'semua');
  const [selectedStatus, setSelectedStatus] = useState('semua');
  const [selectedTahun, setSelectedTahun] = useState('semua');
  const [viewMode, setViewMode] = useState('tabel'); // 'tabel' | 'kartu'

  React.useEffect(() => {
    if (assignedKecamatan) {
      setSelectedKecamatan(assignedKecamatan);
    }
  }, [assignedKecamatan]);

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form State - 17 Urutan Kolom Baku + Lampiran Berkas
  const [formData, setFormData] = useState({
    id: null,
    // 17 Urutan Kolom Baku + Jabatan:
    noRegistrasi: '',          // Kolom 1
    nama: '',                  // Kolom 2
    nik: '',                   // Kolom 3
    jabatan: 'Anggota Satlinmas', // Jabatan / Penugasan (Komandan Regu / Anggota)
    tempatLahir: '',           // Kolom 4
    tanggalLahir: '',          // Kolom 5
    jenisKelamin: 'Laki-laki', // Kolom 6
    alamat: '',                // Kolom 7
    provinsi: 'Kalimantan Selatan', // Kolom 8
    kabKota: 'Kabupaten Hulu Sungai Tengah', // Kolom 9
    kecamatan: assignedKecamatan || 'Barabai',      // Kolom 10
    desaKelurahan: 'Barabai Timur', // Kolom 11
    pendapatan: '', // Kolom 12 (Inputan Manual Nominal Pendapatan)
    tahunPengangkatan: new Date().getFullYear().toString(), // Kolom 13
    jumlahKeluarga: '3 Orang', // Kolom 14
    noHp: '',                  // Kolom 15
    email: '',                 // Kolom 16
    status: 'aktif',           // Kolom 17
    // Lampiran Berkas:
    pasFoto: '',
    dokumenSk: {
      nomorSk: '',
      tanggalPenetapanSk: '',
      fileSk: ''
    }
  });

  // Unique IDs for accessibility
  const searchInputId = useId();
  const filterKecamatanId = useId();
  const filterStatusId = useId();
  const filterTahunId = useId();

  // Desa options based on selected kecamatan in Form
  const availableDesa = React.useMemo(() => {
    const foundKec = wilayahList.find(k => k.nama.toLowerCase() === (formData.kecamatan || '').toLowerCase());
    return foundKec ? foundKec.desa : [];
  }, [formData.kecamatan, wilayahList]);

  // Unique Years for Filter
  const availableYears = React.useMemo(() => {
    const years = new Set(satlinmasList.map(s => s.tahunPengangkatan).filter(Boolean));
    return Array.from(years).sort((a, b) => b - a);
  }, [satlinmasList]);

  // Filtering Logic
  const filteredList = satlinmasList.filter(item => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      (item.nama || '').toLowerCase().includes(term) ||
      (item.nik || '').toLowerCase().includes(term) ||
      (item.noRegistrasi || '').toLowerCase().includes(term) ||
      (item.desaKelurahan || '').toLowerCase().includes(term) ||
      (item.noHp || '').toLowerCase().includes(term) ||
      (item.dokumenSk?.nomorSk || '').toLowerCase().includes(term);

    const matchKecamatan = assignedKecamatan 
      ? (item.kecamatan || '').toLowerCase() === assignedKecamatan.toLowerCase()
      : (selectedKecamatan === 'semua' || item.kecamatan === selectedKecamatan);

    const matchStatus = selectedStatus === 'semua' || item.status === selectedStatus;
    const matchTahun = selectedTahun === 'semua' || item.tahunPengangkatan === selectedTahun;

    return matchSearch && matchKecamatan && matchStatus && matchTahun;
  });

  // KPI Statistics based on scoped data
  const scopedSatlinmas = assignedKecamatan 
    ? satlinmasList.filter(s => (s.kecamatan || '').toLowerCase() === assignedKecamatan.toLowerCase())
    : satlinmasList;

  const totalAnggota = scopedSatlinmas.length;
  const totalAktif = scopedSatlinmas.filter(s => s.status === 'aktif').length;
  const totalTidakAktif = scopedSatlinmas.filter(s => s.status === 'tidak aktif').length;
  const totalKecamatanTercakup = new Set(scopedSatlinmas.map(s => s.kecamatan)).size;

  // Handlers for Form
  const handleOpenAddModal = () => {
    const curYear = new Date().getFullYear().toString();
    const seq = (satlinmasList.length + 1).toString().padStart(3, '0');
    const defaultKec = assignedKecamatan || 'Barabai';
    const foundKec = wilayahList.find(k => k.nama.toLowerCase() === defaultKec.toLowerCase());
    const defaultDesa = foundKec?.desa?.[0] || 'Barabai Timur';

    setFormData({
      id: null,
      noRegistrasi: `63.07/01/SLM/${curYear}/${seq}`,
      nama: '',
      nik: '',
      jabatan: 'Anggota Satlinmas',
      tempatLahir: 'Barabai',
      tanggalLahir: '1985-01-01',
      jenisKelamin: 'Laki-laki',
      alamat: '',
      provinsi: 'Kalimantan Selatan',
      kabKota: 'Kabupaten Hulu Sungai Tengah',
      kecamatan: defaultKec,
      desaKelurahan: defaultDesa,
      pendapatan: '',
      tahunPengangkatan: curYear,
      jumlahKeluarga: '3 Orang',
      noHp: '',
      email: '',
      status: 'aktif',
      pasFoto: '',
      dokumenSk: {
        nomorSk: '',
        tanggalPenetapanSk: '',
        fileSk: ''
      }
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setFormData({
      id: item.id,
      noRegistrasi: item.noRegistrasi || '',
      nama: item.nama || '',
      nik: item.nik || '',
      jabatan: item.jabatan || 'Anggota Satlinmas',
      tempatLahir: item.tempatLahir || '',
      tanggalLahir: item.tanggalLahir || '',
      jenisKelamin: item.jenisKelamin || 'Laki-laki',
      alamat: item.alamat || '',
      provinsi: item.provinsi || 'Kalimantan Selatan',
      kabKota: item.kabKota || 'Kabupaten Hulu Sungai Tengah',
      kecamatan: item.kecamatan || 'Barabai',
      desaKelurahan: item.desaKelurahan || '',
      pendapatan: item.pendapatan || '',
      tahunPengangkatan: item.tahunPengangkatan || '',
      jumlahKeluarga: item.jumlahKeluarga || '',
      noHp: item.noHp || '',
      email: item.email || '',
      status: item.status || 'aktif',
      pasFoto: item.pasFoto || '',
      dokumenSk: {
        nomorSk: item.dokumenSk?.nomorSk || '',
        tanggalPenetapanSk: item.dokumenSk?.tanggalPenetapanSk || '',
        fileSk: item.dokumenSk?.fileSk || ''
      }
    });
    setIsFormModalOpen(true);
  };

  const handleOpenDetailModal = (item) => {
    setSelectedMember(item);
    setIsDetailModalOpen(true);
  };

  const handleSaveSubmit = (e) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      alert('Nama lengkap wajib diisi');
      return;
    }
    if (!formData.nik.trim()) {
      alert('NIK 16 digit wajib diisi');
      return;
    }

    saveSatlinmas(formData);
    setIsFormModalOpen(false);
    if (onRefreshData) onRefreshData();
  };

  const handleDelete = (id) => {
    deleteSatlinmas(id);
    setDeleteConfirmId(null);
    if (onRefreshData) onRefreshData();
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      '1. No Registrasi',
      '2. Nama Lengkap',
      '3. NIK',
      '4. Tempat Lahir',
      '5. Tanggal Lahir',
      '6. Jenis Kelamin',
      '7. Alamat',
      '8. Provinsi',
      '9. Kab/Kota',
      '10. Kecamatan',
      '11. Desa/Kelurahan',
      '12. Pendapatan',
      '13. Tahun Pengangkatan',
      '14. Jumlah Keluarga',
      '15. No. Hp',
      '16. Email',
      '17. Status',
      'Nomor SK',
      'Tanggal SK',
      'Berkas SK'
    ];

    const rows = filteredList.map(s => [
      `"${s.noRegistrasi || ''}"`,
      `"${s.nama || ''}"`,
      `"${s.nik || ''}"`,
      `"${s.tempatLahir || ''}"`,
      `"${s.tanggalLahir || ''}"`,
      `"${s.jenisKelamin || ''}"`,
      `"${(s.alamat || '').replace(/"/g, '""')}"`,
      `"${s.provinsi || ''}"`,
      `"${s.kabKota || ''}"`,
      `"${s.kecamatan || ''}"`,
      `"${s.desaKelurahan || ''}"`,
      `"${s.pendapatan || ''}"`,
      `"${s.tahunPengangkatan || ''}"`,
      `"${s.jumlahKeluarga || ''}"`,
      `"${s.noHp || ''}"`,
      `"${s.email || ''}"`,
      `"${s.status || ''}"`,
      `"${s.dokumenSk?.nomorSk || ''}"`,
      `"${s.dokumenSk?.tanggalPenetapanSk || ''}"`,
      `"${s.dokumenSk?.fileSk || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Database_Satlinmas_HST_17Kolom_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Summary
  const handlePrintSummary = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER SECTION */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-[#0F2A4A] tracking-tight">
                  DATA SATLINMAS HST
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-wide">
                  17 Kolom Baku
                </span>
                {assignedKecamatan && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-300 uppercase tracking-wide">
                    Wilayah: Kec. {assignedKecamatan}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {assignedKecamatan 
                  ? `Pengelolaan data personil Satlinmas di wilayah binaan Kecamatan ${assignedKecamatan}`
                  : 'Database Resmi Satuan Perlindungan Masyarakat Kab. Hulu Sungai Tengah — Sesuai Format Baku Kemendagri & Registrasi SK'}
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
            title="Ekspor Seluruh Kolom ke Format CSV/Excel"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrintSummary}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Cetak Rekap Dinas"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Cetak Rekap</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Anggota Satlinmas</span>
          </button>
        </div>
      </div>

      {/* 2. STATISTIK KPI LINMAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Anggota</p>
            <h3 className="text-2xl font-extrabold text-[#0F2A4A] mt-1">{totalAnggota}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Personil Satlinmas HST</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Anggota Aktif</p>
            <h3 className="text-2xl font-extrabold text-emerald-700 mt-1">{totalAktif}</h3>
            <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Siaga di Pos & Lapangan</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">Tidak Aktif / Purna</p>
            <h3 className="text-2xl font-extrabold text-rose-600 mt-1">{totalTidakAktif}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Purna Tugas / Mutasi</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <UserX className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Cakupan Wilayah</p>
            <h3 className="text-2xl font-extrabold text-[#0F2A4A] mt-1">{totalKecamatanTercakup} / 11</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Kecamatan Tersebar</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. FILTER & TOOLBAR */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <label htmlFor={searchInputId} className="sr-only">Cari Anggota Satlinmas</label>
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id={searchInputId}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari berdasarkan No Reg, Nama, NIK, Desa, No SK, atau Kontak..."
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
                disabled={!!assignedKecamatan}
                onChange={(e) => setSelectedKecamatan(e.target.value)}
                className={`px-3 py-2 border rounded-xl text-xs font-medium focus:outline-hidden ${
                  assignedKecamatan
                    ? 'bg-blue-50 border-blue-200 text-blue-900 font-bold cursor-not-allowed'
                    : 'bg-slate-50 border-slate-200 text-slate-700 focus:ring-2 focus:ring-emerald-500/20'
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
              <label htmlFor={filterStatusId} className="sr-only">Filter Status</label>
              <select
                id={filterStatusId}
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="semua">Semua Status</option>
                <option value="aktif">Status: Aktif</option>
                <option value="tidak aktif">Status: Tidak Aktif</option>
              </select>
            </div>

            {/* Filter Tahun Pengangkatan */}
            <div>
              <label htmlFor={filterTahunId} className="sr-only">Filter Tahun Pengangkatan</label>
              <select
                id={filterTahunId}
                value={selectedTahun}
                onChange={(e) => setSelectedTahun(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="semua">Semua Tahun SK</option>
                {availableYears.map(yr => (
                  <option key={yr} value={yr}>Tahun {yr}</option>
                ))}
              </select>
            </div>

            {/* View Switcher: Tabel vs Kartu KTA */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('tabel')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'tabel' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Tampilan Tabel Database Baku"
              >
                Tabel Baku
              </button>
              <button
                type="button"
                onClick={() => setViewMode('kartu')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'kartu' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Tampilan Kartu Anggota Linmas"
              >
                Kartu KTA
              </button>
            </div>
          </div>
        </div>

        {/* 17 Urutan Kolom Baku Helper Indicator */}
        <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-xl px-3.5 py-2 flex items-center justify-between text-[11px] text-emerald-900 overflow-x-auto">
          <div className="flex items-center gap-2">
            <span className="font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] uppercase">
              Standar Baku 17 Kolom
            </span>
            <span className="text-slate-600 hidden sm:inline">
              1. No Reg • 2. Nama • 3. NIK • 4. Tempat Lahir • 5. Tgl Lahir • 6. JK • 7. Alamat • 8. Prov • 9. Kab • 10. Kec • 11. Desa • 12. Pendapatan • 13. Thn SK • 14. Jml Keluarga • 15. No HP • 16. Email • 17. Status
            </span>
          </div>
          <span className="font-bold text-emerald-700 whitespace-nowrap ml-2">
            {filteredList.length} dari {totalAnggota} personil
          </span>
        </div>
      </div>

      {/* 4. MAIN CONTENT VIEW (TABEL BAKU OR KARTU KTA) */}
      {viewMode === 'tabel' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead className="bg-[#0F2A4A] text-white uppercase text-[10px] tracking-wider font-extrabold select-none">
                <tr>
                  <th className="py-3 px-3 w-12 text-center border-r border-white/10">No</th>
                  <th className="py-3 px-3.5 border-r border-white/10 whitespace-nowrap">
                    1. No Registrasi
                  </th>
                  <th className="py-3 px-3.5 border-r border-white/10 min-w-[180px]">
                    2. Nama Lengkap & Foto
                  </th>
                  <th className="py-3 px-3.5 border-r border-white/10 whitespace-nowrap">
                    3. NIK
                  </th>
                  <th className="py-3 px-3.5 border-r border-white/10 whitespace-nowrap">
                    4-5. TTL
                  </th>
                  <th className="py-3 px-3 border-r border-white/10 text-center">
                    6. JK
                  </th>
                  <th className="py-3 px-3.5 border-r border-white/10 min-w-[150px]">
                    7. Alamat
                  </th>
                  <th className="py-3 px-3.5 border-r border-white/10 whitespace-nowrap">
                    10-11. Kecamatan / Desa
                  </th>
                  <th className="py-3 px-3.5 border-r border-white/10 whitespace-nowrap">
                    12. Pendapatan
                  </th>
                  <th className="py-3 px-3 border-r border-white/10 text-center whitespace-nowrap">
                    13. Thn SK
                  </th>
                  <th className="py-3 px-3.5 border-r border-white/10 whitespace-nowrap">
                    15. Kontak HP
                  </th>
                  <th className="py-3 px-3 border-r border-white/10 text-center whitespace-nowrap">
                    17. Status
                  </th>
                  <th className="py-3 px-3.5 border-r border-white/10 whitespace-nowrap">
                    Lampiran SK
                  </th>
                  <th className="py-3 px-3 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan="14" className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Users className="w-10 h-10 text-slate-300" />
                        <p className="font-semibold text-sm text-slate-600">Tidak ada data anggota Satlinmas yang sesuai</p>
                        <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau reset filter wilayah</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item, idx) => {
                    const isAktif = item.status === 'aktif';
                    return (
                      <tr 
                        key={item.id} 
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* Number */}
                        <td className="py-3 px-3 text-center font-bold text-slate-400 border-r border-slate-100">
                          {idx + 1}
                        </td>

                        {/* 1. No Registrasi */}
                        <td className="py-3 px-3.5 border-r border-slate-100 font-mono text-[11px] font-bold text-[#0F2A4A] whitespace-nowrap">
                          {item.noRegistrasi}
                        </td>

                        {/* 2. Nama Lengkap & Foto */}
                        <td className="py-3 px-3.5 border-r border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={item.pasFoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'}
                              alt={item.nama}
                              className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';
                              }}
                            />
                            <div>
                              <p className="font-bold text-[#0F2A4A] group-hover:text-emerald-700 transition-colors">
                                {item.nama}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {item.jabatan === 'Komandan Regu' ? (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-purple-100 text-purple-900 border border-purple-200">
                                    Danru Satlinmas
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-600">
                                    {item.jabatan || 'Anggota Satlinmas'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 3. NIK */}
                        <td className="py-3 px-3.5 border-r border-slate-100 font-mono text-slate-700 whitespace-nowrap">
                          {item.nik}
                        </td>

                        {/* 4-5. Tempat & Tgl Lahir */}
                        <td className="py-3 px-3.5 border-r border-slate-100 whitespace-nowrap">
                          <p className="font-semibold text-slate-700">{item.tempatLahir}</p>
                          <p className="text-[10px] text-slate-400">{item.tanggalLahir}</p>
                        </td>

                        {/* 6. JK */}
                        <td className="py-3 px-3 border-r border-slate-100 text-center font-medium">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.jenisKelamin === 'Perempuan' 
                              ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {item.jenisKelamin === 'Perempuan' ? 'P' : 'L'}
                          </span>
                        </td>

                        {/* 7. Alamat */}
                        <td className="py-3 px-3.5 border-r border-slate-100 text-[11px] leading-tight">
                          <span className="line-clamp-2" title={item.alamat}>
                            {item.alamat || '-'}
                          </span>
                        </td>

                        {/* 10-11. Kecamatan & Desa */}
                        <td className="py-3 px-3.5 border-r border-slate-100 whitespace-nowrap">
                          <p className="font-bold text-slate-800">{item.desaKelurahan}</p>
                          <p className="text-[10px] text-emerald-700 font-medium">Kec. {item.kecamatan}</p>
                        </td>

                        {/* 12. Pendapatan */}
                        <td className="py-3 px-3.5 border-r border-slate-100 whitespace-nowrap text-[11px] font-medium text-slate-700">
                          {item.pendapatan || '-'}
                        </td>

                        {/* 13. Tahun SK */}
                        <td className="py-3 px-3 border-r border-slate-100 text-center font-bold text-slate-800 whitespace-nowrap">
                          {item.tahunPengangkatan}
                        </td>

                        {/* 15. No HP */}
                        <td className="py-3 px-3.5 border-r border-slate-100 whitespace-nowrap font-mono text-[11px]">
                          {item.noHp ? (
                            <a 
                              href={`tel:${item.noHp}`} 
                              className="text-slate-700 hover:text-emerald-700 flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>{item.noHp}</span>
                            </a>
                          ) : '-'}
                        </td>

                        {/* 17. Status */}
                        <td className="py-3 px-3 border-r border-slate-100 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            isAktif 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}>
                            {item.status}
                          </span>
                        </td>

                        {/* Lampiran SK */}
                        <td className="py-3 px-3.5 border-r border-slate-100 whitespace-nowrap">
                          {item.dokumenSk?.nomorSk ? (
                            <div className="space-y-0.5">
                              <p className="font-mono text-[10px] font-bold text-slate-700 truncate max-w-[140px]" title={item.dokumenSk.nomorSk}>
                                {item.dokumenSk.nomorSk}
                              </p>
                              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                <FileCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>{item.dokumenSk.tanggalPenetapanSk || 'Terlampir'}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Belum ada SK</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenDetailModal(item)}
                              className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                              title="Lihat KTA Digital & Berkas Lengkap"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit Data 17 Kolom"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(item.id)}
                              className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Hapus Anggota"
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
        /* KARTU KTA LINMAS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Card Header (KTA Satlinmas Style) */}
              <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-[#0F2A4A] p-4 text-white relative overflow-hidden">
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold tracking-wider uppercase text-emerald-300 leading-none">
                        SATLINMAS HST
                      </h4>
                      <p className="text-[10px] text-slate-300 font-mono mt-0.5">
                        {item.noRegistrasi}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                    item.status === 'aktif' ? 'bg-emerald-400 text-slate-900' : 'bg-rose-400 text-slate-900'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3 flex-1">
                <div className="flex items-start gap-3">
                  <img
                    src={item.pasFoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'}
                    alt={item.nama}
                    className="w-16 h-20 rounded-xl object-cover border-2 border-emerald-600/30 shadow-xs shrink-0 bg-slate-100"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="font-extrabold text-sm text-[#0F2A4A] leading-tight truncate" title={item.nama}>
                      {item.nama}
                    </h3>
                    <p className="font-mono text-xs text-slate-500">NIK: {item.nik}</p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{item.desaKelurahan}, Kec. {item.kecamatan}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Tahun Pengangkatan: <span className="font-bold text-slate-700">{item.tahunPengangkatan}</span>
                    </p>
                  </div>
                </div>

                {/* SK & Contact Snippet */}
                <div className="pt-2 border-t border-slate-100 text-xs space-y-1 text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Jabatan:</span>
                    <span className="text-[11px] font-bold text-slate-800">{item.jabatan || 'Anggota'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Nomor SK:</span>
                    <span className="font-mono text-[10px] font-bold text-slate-700 truncate max-w-[170px]" title={item.dokumenSk?.nomorSk}>
                      {item.dokumenSk?.nomorSk || '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Kontak HP:</span>
                    <span className="font-mono text-[11px] font-semibold text-emerald-700">{item.noHp || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleOpenDetailModal(item)}
                  className="px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors"
                >
                  <IdCard className="w-3.5 h-3.5" />
                  <span>Lihat KTA</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(item)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
                    title="Edit Data"
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
      {/* 5. MODAL FORMULIR TAMBAH / EDIT (17 URUTAN KOLOM BAKU + LAMPIRAN BERKAS) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={formData.id ? 'Edit Data Anggota Satlinmas (17 Kolom Baku)' : 'Formulir Pendaftaran Anggota Satlinmas (17 Kolom Baku)'}
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSaveSubmit} className="space-y-6">
          <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
            <p>
              Formulir ini telah distandardisasi mengikuti <strong>17 Urutan Kolom Baku Registrasi Satlinmas</strong> dan lampiran berkas fisik SK Penetapan Bupati/Kades.
            </p>
          </div>

          {/* BAGIAN I: IDENTITAS & REGISTRASI (KOLOM 1 - 6) */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0F2A4A] flex items-center gap-1.5 border-b pb-1.5">
              <span className="w-5 h-5 rounded-full bg-[#0F2A4A] text-white flex items-center justify-center text-[10px]">I</span>
              <span>Identitas Pokok & Registrasi (Kolom 1 - 6)</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* 1. No Registrasi */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  1. No Registrasi <span className="text-emerald-600 font-normal">(Format Resmi)</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.noRegistrasi}
                  onChange={(e) => setFormData({ ...formData, noRegistrasi: e.target.value })}
                  placeholder="63.07/01/SLM/2024/001"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* 2. Nama Lengkap */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  2. Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Nama Lengkap Sesuai KTP"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Jabatan / Penugasan Satlinmas */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Jabatan Satlinmas <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.jabatan || 'Anggota Satlinmas'}
                  onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="Anggota Satlinmas">Anggota Satlinmas</option>
                  <option value="Komandan Regu">Komandan Regu (Danru)</option>
                  <option value="Wakil Komandan Regu">Wakil Komandan Regu (Wadanru)</option>
                </select>
              </div>

              {/* 3. NIK */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  3. NIK (16 Digit) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={16}
                  value={formData.nik}
                  onChange={(e) => setFormData({ ...formData, nik: e.target.value.replace(/\D/g, '') })}
                  placeholder="6307xxxxxxxxxxxx"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* 4. Tempat Lahir */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  4. Tempat Lahir
                </label>
                <input
                  type="text"
                  value={formData.tempatLahir}
                  onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })}
                  placeholder="Barabai"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* 5. Tanggal Lahir */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  5. Tanggal Lahir
                </label>
                <input
                  type="date"
                  value={formData.tanggalLahir}
                  onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* 6. Jenis Kelamin */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  6. Jenis Kelamin
                </label>
                <select
                  value={formData.jenisKelamin}
                  onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
            </div>
          </div>

          {/* BAGIAN II: DOMISILI & WILAYAH TUGAS (KOLOM 7 - 11) */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0F2A4A] flex items-center gap-1.5 border-b pb-1.5">
              <span className="w-5 h-5 rounded-full bg-[#0F2A4A] text-white flex items-center justify-center text-[10px]">II</span>
              <span>Domisili & Wilayah Administratif (Kolom 7 - 11)</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* 7. Alamat */}
              <div className="md:col-span-3">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  7. Alamat Domisili Lengkap (Jalan, RT, RW)
                </label>
                <input
                  type="text"
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  placeholder="Jl. Pangeran Antasari No. 12 RT 03 RW 01"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* 8. Provinsi */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  8. Provinsi
                </label>
                <input
                  type="text"
                  value={formData.provinsi}
                  onChange={(e) => setFormData({ ...formData, provinsi: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 font-semibold"
                />
              </div>

              {/* 9. Kab/Kota */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  9. Kab/Kota
                </label>
                <input
                  type="text"
                  value={formData.kabKota}
                  onChange={(e) => setFormData({ ...formData, kabKota: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 font-semibold"
                />
              </div>

              {/* 10. Kecamatan */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    10. Kecamatan <span className="text-rose-500">*</span>
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
                  className={`w-full px-3 py-2 border rounded-xl text-xs font-bold text-[#0F2A4A] ${
                    assignedKecamatan 
                      ? 'bg-slate-100 border-slate-300 cursor-not-allowed text-slate-600' 
                      : 'bg-white border-slate-200 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                >
                  {wilayahList.map(k => (
                    <option key={k.id || k.nama} value={k.nama}>{k.nama}</option>
                  ))}
                </select>
              </div>

              {/* 11. Desa/Kelurahan */}
              <div className="md:col-span-3">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  11. Desa / Kelurahan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.desaKelurahan}
                  onChange={(e) => setFormData({ ...formData, desaKelurahan: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#0F2A4A] focus:ring-2 focus:ring-emerald-500/20"
                >
                  {availableDesa.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* BAGIAN III: SOSIAL, EKONOMI, DAN KONTAK (KOLOM 12 - 17) */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0F2A4A] flex items-center gap-1.5 border-b pb-1.5">
              <span className="w-5 h-5 rounded-full bg-[#0F2A4A] text-white flex items-center justify-center text-[10px]">III</span>
              <span>Sosial Ekonomi, Keanggotaan & Kontak (Kolom 12 - 17)</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* 12. Pendapatan (Inputan Manual) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  12. Pendapatan Bulanan
                </label>
                <input
                  type="text"
                  value={formData.pendapatan}
                  onChange={(e) => setFormData({ ...formData, pendapatan: e.target.value })}
                  placeholder="Contoh: Rp 1.500.000 / Bulan"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 font-medium"
                />
              </div>

              {/* 13. Tahun Pengangkatan */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  13. Tahun Pengangkatan
                </label>
                <input
                  type="number"
                  value={formData.tahunPengangkatan}
                  onChange={(e) => setFormData({ ...formData, tahunPengangkatan: e.target.value })}
                  placeholder="2022"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* 14. Jumlah Keluarga */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  14. Jumlah Keluarga / Tanggungan
                </label>
                <input
                  type="text"
                  value={formData.jumlahKeluarga}
                  onChange={(e) => setFormData({ ...formData, jumlahKeluarga: e.target.value })}
                  placeholder="4 Orang"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* 15. No. Hp */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  15. No. Handphone / WhatsApp
                </label>
                <input
                  type="tel"
                  value={formData.noHp}
                  onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* 16. Email */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  16. Alamat Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="linmas.desa@gmail.com"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* 17. Status (aktif/tidak aktif) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  17. Status Keanggotaan
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-xl text-xs font-extrabold ${
                    formData.status === 'aktif' 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                      : 'bg-rose-50 text-rose-800 border-rose-300'
                  }`}
                >
                  <option value="aktif">Aktif (Siaga)</option>
                  <option value="tidak aktif">Tidak Aktif (Purna Tugas)</option>
                </select>
              </div>
            </div>
          </div>

          {/* BAGIAN IV: LAMPIRAN BERKAS (PAS FOTO & DOKUMEN SK) */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0F2A4A] flex items-center gap-1.5 border-b pb-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">IV</span>
              <span>Lampiran Berkas: Pas Foto & Dokumen SK Satlinmas</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Pas Foto Upload & Preview */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <label className="block text-[11px] font-bold text-slate-700">
                  Pas Foto Resmi Anggota
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-20 rounded-lg overflow-hidden border-2 border-slate-300 bg-white shadow-xs shrink-0 flex items-center justify-center">
                    {formData.pasFoto ? (
                      <img
                        src={formData.pasFoto}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div className="space-y-1.5 text-xs flex-1">
                    {/* Tombol Unggah File dari Kamera / Komputer */}
                    <label className="px-3 py-1.5 bg-[#0F2A4A] hover:bg-[#16365C] text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer w-full">
                      <Camera className="w-3.5 h-3.5 text-[#F0B429]" />
                      <span>{formData.pasFoto ? 'Ganti Foto' : 'Unggah Foto'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const base64 = await processImageUpload(file);
                              setFormData({ ...formData, pasFoto: base64 });
                            } catch (err) {
                              alert('Gagal memproses foto: ' + err.message);
                            }
                          }
                          e.target.value = '';
                        }}
                      />
                    </label>

                    {formData.pasFoto && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, pasFoto: '' })}
                        className="px-2 py-0.5 text-rose-600 hover:text-rose-800 text-[10px] font-semibold block text-center w-full cursor-pointer"
                      >
                        Hapus Foto
                      </button>
                    )}
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Mendukung kamera HP & file JPG/PNG galeri.
                    </p>
                  </div>
                </div>
              </div>

              {/* Dokumen SK Satlinmas (Nomor, Tanggal, File) */}
              <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <p className="text-[11px] font-bold text-slate-700">
                  Rincian Dokumen SK Satlinmas
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                      Nomor SK Satlinmas
                    </label>
                    <input
                      type="text"
                      value={formData.dokumenSk.nomorSk}
                      onChange={(e) => setFormData({
                        ...formData,
                        dokumenSk: { ...formData.dokumenSk, nomorSk: e.target.value }
                      })}
                      placeholder="188.45/45/Satlinmas-HST/2023"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                      Tanggal Penetapan SK
                    </label>
                    <input
                      type="date"
                      value={formData.dokumenSk.tanggalPenetapanSk}
                      onChange={(e) => setFormData({
                        ...formData,
                        dokumenSk: { ...formData.dokumenSk, tanggalPenetapanSk: e.target.value }
                      })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                    Upload Berkas SK (PDF / Dokumen Fisik)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.dokumenSk.fileSk}
                      onChange={(e) => setFormData({
                        ...formData,
                        dokumenSk: { ...formData.dokumenSk, fileSk: e.target.value }
                      })}
                      placeholder="Nama berkas SK atau link arsip PDF"
                      className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const sampleFile = `SK_Satlinmas_${formData.kecamatan.replace(/\s+/g, '_')}_${formData.tahunPengangkatan}.pdf`;
                        setFormData({
                          ...formData,
                          dokumenSk: { ...formData.dokumenSk, fileSk: sampleFile }
                        });
                      }}
                      className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer transition-colors"
                    >
                      Pilih Dokumen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Data Satlinmas</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* 6. MODAL DETAIL & KTA DIGITAL SATLINMAS */}
      {/* ========================================================================= */}
      {selectedMember && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Kartu Tanda Anggota (KTA) & Berkas Lengkap Satlinmas HST"
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            {/* PRATINJAU KTA DIGITAL LINMAS */}
            <div className="bg-gradient-to-br from-emerald-900 via-teal-950 to-[#0F2A4A] rounded-2xl p-5 text-white shadow-xl border border-emerald-500/30 relative overflow-hidden">
              {/* Watermark Crest */}
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

              {/* KTA Header */}
              <div className="flex items-center justify-between border-b border-white/15 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs tracking-wider uppercase text-emerald-300 leading-tight">
                      KARTU TANDA ANGGOTA SATLINMAS
                    </h3>
                    <p className="text-[10px] text-slate-300 font-medium">
                      Pemerintah Kabupaten Hulu Sungai Tengah
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    selectedMember.status === 'aktif' ? 'bg-emerald-400 text-slate-900' : 'bg-rose-400 text-slate-900'
                  }`}>
                    {selectedMember.status}
                  </span>
                </div>
              </div>

              {/* KTA Body */}
              <div className="pt-4 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                <div className="sm:col-span-4 flex flex-col items-center text-center">
                  <img
                    src={selectedMember.pasFoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'}
                    alt={selectedMember.nama}
                    className="w-24 h-32 rounded-xl object-cover border-2 border-emerald-400/60 shadow-md bg-white"
                  />
                  <span className="font-mono text-[9px] text-emerald-300 mt-2 font-bold tracking-wider">
                    {selectedMember.noRegistrasi}
                  </span>
                </div>

                <div className="sm:col-span-8 space-y-1.5 text-xs">
                  <div>
                    <span className="text-[10px] text-emerald-300 uppercase font-semibold">Nama Lengkap & Jabatan</span>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-extrabold text-white leading-tight">
                        {selectedMember.nama}
                      </h2>
                      {selectedMember.jabatan === 'Komandan Regu' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-200 text-purple-900 border border-purple-300 uppercase">
                          Danru Satlinmas
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-950 border border-emerald-300 uppercase">
                          {selectedMember.jabatan || 'Anggota Satlinmas'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-400 block">NIK</span>
                      <span className="font-mono font-bold">{selectedMember.nik}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Jenis Kelamin</span>
                      <span className="font-bold">{selectedMember.jenisKelamin}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Tempat, Tanggal Lahir</span>
                    <span className="font-semibold">{selectedMember.tempatLahir}, {selectedMember.tanggalLahir}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Penugasan Wilayah</span>
                    <span className="font-extrabold text-emerald-300">
                      Desa {selectedMember.desaKelurahan}, Kec. {selectedMember.kecamatan}
                    </span>
                  </div>
                </div>
              </div>

              {/* KTA Footer */}
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300">
                <span>SK: {selectedMember.dokumenSk?.nomorSk || 'Dalam Verifikasi'}</span>
                <span>Tahun Pengangkatan: {selectedMember.tahunPengangkatan}</span>
              </div>
            </div>

            {/* TABEL RINCIAN 17 KOLOM BAKU */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0F2A4A] mb-2">
                Rincian Lengkap Database 17 Kolom Baku:
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <span className="text-slate-400">1. No Registrasi:</span>{' '}
                  <span className="font-mono font-bold text-slate-800">{selectedMember.noRegistrasi}</span>
                </div>
                <div>
                  <span className="text-slate-400">2. Nama Lengkap:</span>{' '}
                  <span className="font-bold text-slate-800">{selectedMember.nama}</span>
                </div>
                <div>
                  <span className="text-slate-400">3. NIK:</span>{' '}
                  <span className="font-mono font-bold text-slate-800">{selectedMember.nik}</span>
                </div>
                <div>
                  <span className="text-slate-400">4. Tempat Lahir:</span>{' '}
                  <span className="font-semibold text-slate-800">{selectedMember.tempatLahir}</span>
                </div>
                <div>
                  <span className="text-slate-400">5. Tanggal Lahir:</span>{' '}
                  <span className="font-semibold text-slate-800">{selectedMember.tanggalLahir}</span>
                </div>
                <div>
                  <span className="text-slate-400">6. Jenis Kelamin:</span>{' '}
                  <span className="font-semibold text-slate-800">{selectedMember.jenisKelamin}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400">7. Alamat Domisili:</span>{' '}
                  <span className="font-medium text-slate-800">{selectedMember.alamat}</span>
                </div>
                <div>
                  <span className="text-slate-400">8. Provinsi:</span>{' '}
                  <span className="font-semibold text-slate-800">{selectedMember.provinsi}</span>
                </div>
                <div>
                  <span className="text-slate-400">9. Kab/Kota:</span>{' '}
                  <span className="font-semibold text-slate-800">{selectedMember.kabKota}</span>
                </div>
                <div>
                  <span className="text-slate-400">10. Kecamatan:</span>{' '}
                  <span className="font-bold text-emerald-800">{selectedMember.kecamatan}</span>
                </div>
                <div>
                  <span className="text-slate-400">11. Desa/Kelurahan:</span>{' '}
                  <span className="font-bold text-emerald-800">{selectedMember.desaKelurahan}</span>
                </div>
                <div>
                  <span className="text-slate-400">12. Pendapatan:</span>{' '}
                  <span className="font-semibold text-slate-800">{selectedMember.pendapatan}</span>
                </div>
                <div>
                  <span className="text-slate-400">13. Tahun Pengangkatan:</span>{' '}
                  <span className="font-bold text-slate-800">{selectedMember.tahunPengangkatan}</span>
                </div>
                <div>
                  <span className="text-slate-400">14. Jumlah Keluarga:</span>{' '}
                  <span className="font-semibold text-slate-800">{selectedMember.jumlahKeluarga}</span>
                </div>
                <div>
                  <span className="text-slate-400">15. No. Handphone:</span>{' '}
                  <span className="font-mono font-bold text-emerald-700">{selectedMember.noHp || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400">16. Email:</span>{' '}
                  <span className="font-medium text-slate-800">{selectedMember.email || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400">17. Status Keanggotaan:</span>{' '}
                  <span className="font-extrabold uppercase text-emerald-700">{selectedMember.status}</span>
                </div>
                <div>
                  <span className="text-slate-400">Jabatan Satlinmas:</span>{' '}
                  <span className="font-extrabold text-purple-900">{selectedMember.jabatan || 'Anggota Satlinmas'}</span>
                </div>
              </div>

              {/* Lampiran SK Dokumen Section */}
              <div className="pt-3 border-t border-slate-200 mt-2">
                <p className="text-[11px] font-bold text-slate-700 mb-1.5">Lampiran Dokumen SK:</p>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="font-mono font-bold text-xs text-slate-800">{selectedMember.dokumenSk?.nomorSk || 'SK-TETAP-LINMAS'}</p>
                      <p className="text-[10px] text-slate-400">Ditetapkan: {selectedMember.dokumenSk?.tanggalPenetapanSk || '-'}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                    {selectedMember.dokumenSk?.fileSk || 'Arsip_SK.pdf'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleOpenEditModal(selectedMember);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Anggota</span>
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
          title="Konfirmasi Hapus Anggota Satlinmas"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-[#0F2A4A]">Apakah Anda yakin ingin menghapus data personil ini?</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Data keanggotaan beserta berkas lampiran SK Satlinmas akan dihapus dari database sistem.
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
