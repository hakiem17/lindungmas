import React, { useState } from 'react';
import { 
  UserCheck, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Printer, 
  Filter, 
  Building2, 
  User, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  Mail,
  FileSpreadsheet
} from 'lucide-react';
import Modal from '../common/Modal';
import { savePelapor, deletePelapor, getWilayahList } from '../../data/storageService';
import { KECAMATAN_HST } from '../../data/mockData';

const KATEGORI_MASYARAKAT = ['Warga / Individu', 'Tokoh Masyarakat', 'Pedagang / Paguyuban', 'Pemerhati Lingkungan'];
const KATEGORI_SKPD = ['Pemerintah Daerah', 'Kecamatan', 'Pemerintah Desa', 'Instansi Vertikal'];

export default function MasterPelapor({ pelaporList = [], onRefreshData }) {
  const wilayahData = getWilayahList() || KECAMATAN_HST;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTipe, setSelectedTipe] = useState('semua');
  const [selectedKecamatan, setSelectedKecamatan] = useState('semua');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPelapor, setEditingPelapor] = useState(null);
  const [deletePelaporId, setDeletePelaporId] = useState(null);

  // Form Fields
  const [tipe, setTipe] = useState('Masyarakat');
  const [nama, setNama] = useState('');
  const [kategori, setKategori] = useState(KATEGORI_MASYARAKAT[0]);
  const [pic, setPic] = useState('');
  const [nik, setNik] = useState('');
  const [noHp, setNoHp] = useState('');
  const [email, setEmail] = useState('');
  const [kecamatan, setKecamatan] = useState('Barabai');
  const [desa, setDesa] = useState('Barabai Barat');
  const [alamat, setAlamat] = useState('');
  const [statusVerifikasi, setStatusVerifikasi] = useState('Terverifikasi');
  const [keterangan, setKeterangan] = useState('');

  // Handle kecamatan change for desa list
  const handleKecamatanChange = (kecName) => {
    setKecamatan(kecName);
    const foundKec = wilayahData.find(k => k.nama === kecName) || KECAMATAN_HST.find(k => k.nama === kecName);
    if (foundKec && foundKec.desa && foundKec.desa.length > 0) {
      setDesa(foundKec.desa[0]);
    } else {
      setDesa('');
    }
  };

  const currentFormKecObj = wilayahData.find(k => k.nama === kecamatan) || KECAMATAN_HST.find(k => k.nama === kecamatan) || KECAMATAN_HST[0];

  // Filtering
  const filtered = pelaporList.filter(p => {
    const matchSearch = 
      (p.nama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.pic || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.nik || '').includes(searchTerm) ||
      (p.noHp || '').includes(searchTerm) ||
      (p.alamat || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.desa || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.kecamatan || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchTipe = selectedTipe === 'semua' || p.tipe === selectedTipe;
    const matchKecamatan = selectedKecamatan === 'semua' || p.kecamatan === selectedKecamatan;

    return matchSearch && matchTipe && matchKecamatan;
  });

  // KPI Calculations
  const countMasyarakat = pelaporList.filter(p => p.tipe === 'Masyarakat').length;
  const countSKPD = pelaporList.filter(p => p.tipe === 'Instansi SKPD').length;
  const countTerverifikasi = pelaporList.filter(p => p.statusVerifikasi === 'Terverifikasi' || p.statusVerifikasi === 'Mitra Dinas Resmi').length;

  // Open Add
  const handleOpenAdd = () => {
    setEditingPelapor(null);
    setTipe('Masyarakat');
    setNama('');
    setKategori(KATEGORI_MASYARAKAT[0]);
    setPic('');
    setNik('');
    setNoHp('');
    setEmail('');
    setKecamatan('Barabai');
    setDesa('Barabai Barat');
    setAlamat('');
    setStatusVerifikasi('Terverifikasi');
    setKeterangan('');
    setIsModalOpen(true);
  };

  // Open Edit
  const handleOpenEdit = (pelapor) => {
    setEditingPelapor(pelapor);
    setTipe(pelapor.tipe || 'Masyarakat');
    setNama(pelapor.nama || '');
    setKategori(pelapor.kategori || (pelapor.tipe === 'Instansi SKPD' ? KATEGORI_SKPD[0] : KATEGORI_MASYARAKAT[0]));
    setPic(pelapor.pic || '');
    setNik(pelapor.nik || '');
    setNoHp(pelapor.noHp || '');
    setEmail(pelapor.email || '');
    setKecamatan(pelapor.kecamatan || 'Barabai');
    setDesa(pelapor.desa || 'Barabai Barat');
    setAlamat(pelapor.alamat || '');
    setStatusVerifikasi(pelapor.statusVerifikasi || 'Terverifikasi');
    setKeterangan(pelapor.keterangan || '');
    setIsModalOpen(true);
  };

  // Save
  const handleSave = (e) => {
    e.preventDefault();
    if (!nama.trim()) {
      alert('Nama Pelapor atau Nama Instansi wajib diisi!');
      return;
    }

    savePelapor({
      id: editingPelapor ? editingPelapor.id : undefined,
      nama: nama.trim(),
      tipe,
      kategori,
      pic: tipe === 'Instansi SKPD' ? pic.trim() || '-' : '-',
      nik: tipe === 'Masyarakat' ? nik.trim() || '-' : '-',
      noHp: noHp.trim() || '-',
      email: email.trim() || '-',
      kecamatan,
      desa,
      alamat: alamat.trim() || '-',
      statusVerifikasi,
      keterangan: keterangan.trim() || '-'
    });

    setIsModalOpen(false);
    if (onRefreshData) onRefreshData();
  };

  // Delete
  const handleDelete = (id) => {
    deletePelapor(id);
    setDeletePelaporId(null);
    if (onRefreshData) onRefreshData();
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['No', 'Tipe Pelapor', 'Nama Pelapor/Instansi', 'Kategori', 'PIC/NIP', 'NIK', 'No HP/WA', 'Email', 'Kecamatan', 'Desa/Kelurahan', 'Alamat', 'Status Verifikasi', 'Total Laporan'];
    const rows = filtered.map((p, idx) => [
      `"${idx + 1}"`,
      `"${p.tipe}"`,
      `"${p.nama}"`,
      `"${p.kategori || '-'}"`,
      `"${p.pic || '-'}"`,
      `"${p.nik || '-'}"`,
      `"${p.noHp || '-'}"`,
      `"${p.email || '-'}"`,
      `"${p.kecamatan}"`,
      `"${p.desa}"`,
      `"${(p.alamat || '').replace(/"/g, '""')}"`,
      `"${p.statusVerifikasi}"`,
      `"${p.totalLaporan || 0}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `master_pelapor_satpolpp_hst_${new Date().toISOString().slice(0, 10)}.csv`);
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
              <UserCheck className="w-3.5 h-3.5 text-[#F0B429]" />
              MASTER DATA PELAPOR TRANTIBUM
            </span>
            <span className="text-xs text-slate-500 font-medium">Satpol PP Kab. HST</span>
          </div>
          <h2 className="text-xl font-extrabold text-[#0F2A4A] mt-1.5 tracking-tight">
            Master Pelapor (Masyarakat & Instansi SKPD)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Basis data induk pelapor pengaduan masyarakat, tokoh warga, dan instansi pemohon penertiban di Hulu Sungai Tengah
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak Data</span>
          </button>
          
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Unduh CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-[#0F2A4A] hover:bg-[#14365D] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-[#0F2A4A]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F0B429]" />
            <span>Tambah Pelapor Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Pelapor</p>
            <p className="text-xl font-extrabold text-[#0F2A4A]">{pelaporList.length} <span className="text-xs font-normal text-slate-500">Pihak</span></p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Masyarakat</p>
            <p className="text-xl font-extrabold text-[#0F2A4A]">{countMasyarakat} <span className="text-xs font-normal text-slate-500">Warga</span></p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Instansi SKPD</p>
            <p className="text-xl font-extrabold text-[#0F2A4A]">{countSKPD} <span className="text-xs font-normal text-slate-500">Lembaga</span></p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Terverifikasi</p>
            <p className="text-xl font-extrabold text-[#0F2A4A]">{countTerverifikasi} <span className="text-xs font-normal text-slate-500">Mitra/Warga</span></p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama pelapor, instansi, PIC, NIK, No HP/WA, atau alamat..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Tipe:</span>
          </div>
          <select
            value={selectedTipe}
            onChange={(e) => setSelectedTipe(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden cursor-pointer"
          >
            <option value="semua">Semua Tipe ({pelaporList.length})</option>
            <option value="Masyarakat">Masyarakat ({countMasyarakat})</option>
            <option value="Instansi SKPD">Instansi SKPD ({countSKPD})</option>
          </select>

          <select
            value={selectedKecamatan}
            onChange={(e) => setSelectedKecamatan(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden cursor-pointer"
          >
            <option value="semua">Semua Kecamatan</option>
            {wilayahData.map(k => (
              <option key={k.id} value={k.nama}>{k.nama}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabel Data Pelapor */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-12 border-r border-slate-200">No</th>
                <th className="py-3 px-3.5 border-r border-slate-200 min-w-[120px]">Tipe Pelapor</th>
                <th className="py-3 px-4 border-r border-slate-200 min-w-[200px]">Nama Pelapor / Instansi</th>
                <th className="py-3 px-3.5 border-r border-slate-200 min-w-[140px]">Kontak (HP/WA)</th>
                <th className="py-3 px-3.5 border-r border-slate-200 min-w-[150px]">Wilayah (Kec/Desa)</th>
                <th className="py-3 px-4 border-r border-slate-200 min-w-[180px]">Alamat & Keterangan</th>
                <th className="py-3 px-3 border-r border-slate-200 min-w-[120px]">Status</th>
                <th className="py-3 px-3 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-600">Tidak ada data pelapor yang cocok</p>
                    <p className="text-xs text-slate-400 mt-0.5">Silakan ganti kata kunci atau tambahkan pelapor baru.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((pelapor, idx) => {
                  const isMasyarakat = pelapor.tipe === 'Masyarakat';
                  const isResmi = pelapor.statusVerifikasi === 'Mitra Dinas Resmi';
                  const isTerverifikasi = pelapor.statusVerifikasi === 'Terverifikasi';

                  return (
                    <tr key={pelapor.id} className="hover:bg-amber-50/40 transition-colors">
                      {/* No */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-600 border-r border-slate-200">
                        {idx + 1}
                      </td>

                      {/* Tipe */}
                      <td className="py-3 px-3.5 border-r border-slate-200">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                          isMasyarakat 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {isMasyarakat ? <User className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                          {pelapor.tipe}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-0.5 font-medium">
                          {pelapor.kategori || '-'}
                        </span>
                      </td>

                      {/* Nama Pelapor & PIC / NIK */}
                      <td className="py-3 px-4 border-r border-slate-200">
                        <p className="font-extrabold text-[#0F2A4A] text-xs leading-snug">
                          {pelapor.nama}
                        </p>
                        {isMasyarakat ? (
                          <span className="text-[11px] font-mono text-slate-500 block mt-0.5">
                            NIK: {pelapor.nik && pelapor.nik !== '-' ? pelapor.nik : 'Belum diisi'}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-600 block mt-0.5 font-semibold">
                            PIC: {pelapor.pic && pelapor.pic !== '-' ? pelapor.pic : '-'}
                          </span>
                        )}
                      </td>

                      {/* Kontak */}
                      <td className="py-3 px-3.5 border-r border-slate-200">
                        <div className="flex items-center gap-1.5 font-mono text-slate-800 font-semibold">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{pelapor.noHp || '-'}</span>
                        </div>
                        {pelapor.email && pelapor.email !== '-' && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5 truncate max-w-[140px]">
                            <Mail className="w-2.5 h-2.5" />
                            <span>{pelapor.email}</span>
                          </div>
                        )}
                      </td>

                      {/* Wilayah */}
                      <td className="py-3 px-3.5 border-r border-slate-200">
                        <div className="flex items-center gap-1 font-bold text-[#0F2A4A]">
                          <MapPin className="w-3 h-3 text-[#F0B429] shrink-0" />
                          <span>Kec. {pelapor.kecamatan}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 pl-4 block mt-0.5">
                          Desa/Kel. {pelapor.desa || '-'}
                        </span>
                      </td>

                      {/* Alamat & Keterangan */}
                      <td className="py-3 px-4 border-r border-slate-200 text-slate-700">
                        <p className="font-medium text-xs leading-snug line-clamp-1">{pelapor.alamat}</p>
                        {pelapor.keterangan && pelapor.keterangan !== '-' && (
                          <p className="text-[10px] text-slate-400 italic line-clamp-1 mt-0.5">
                            "{pelapor.keterangan}"
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 border-r border-slate-200">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isResmi ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                          isTerverifikasi ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {isResmi || isTerverifikasi ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {pelapor.statusVerifikasi}
                        </span>
                        {pelapor.totalLaporan > 0 && (
                          <span className="block text-[10px] text-slate-400 font-semibold mt-0.5">
                            {pelapor.totalLaporan} Laporan
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(pelapor)}
                            title="Edit Data Pelapor"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletePelaporId(pelapor.id)}
                            title="Hapus Data Pelapor"
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

        {/* Footer info */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Menampilkan {filtered.length} dari {pelaporList.length} total pelapor terdaftar</span>
          <span className="font-semibold text-[#0F2A4A]">Basis Data Induk Satpol PP Kab. Hulu Sungai Tengah</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL TAMBAH / EDIT PELAPOR */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPelapor ? 'Edit Data Pelapor' : 'Tambah Pelapor / Instansi Baru'}
        subtitle="Entri data master pelapor pengaduan Trantibum & penertiban"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Pilihan Tipe Pelapor */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Tipe Pelapor *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setTipe('Masyarakat');
                  setKategori(KATEGORI_MASYARAKAT[0]);
                }}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all cursor-pointer ${
                  tipe === 'Masyarakat'
                    ? 'border-[#0F2A4A] bg-[#0F2A4A] text-white shadow-xs'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Masyarakat / Warga</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTipe('Instansi SKPD');
                  setKategori(KATEGORI_SKPD[0]);
                }}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all cursor-pointer ${
                  tipe === 'Instansi SKPD'
                    ? 'border-[#0F2A4A] bg-[#0F2A4A] text-white shadow-xs'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Instansi / Inisiatif SKPD</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {tipe === 'Masyarakat' ? 'Nama Lengkap Pelapor *' : 'Nama Instansi / Dinas SKPD *'}
              </label>
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder={tipe === 'Masyarakat' ? 'Contoh: H. Subhan / Siti Rahmah' : 'Contoh: Bapenda Kab. HST'}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kategori Pelapor</label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#0F2A4A] outline-hidden font-medium"
              >
                {(tipe === 'Masyarakat' ? KATEGORI_MASYARAKAT : KATEGORI_SKPD).map((kat) => (
                  <option key={kat} value={kat}>{kat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tipe === 'Masyarakat' ? (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor Induk Kependudukan (NIK KTP)
                </label>
                <input
                  type="text"
                  maxLength={16}
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  placeholder="Contoh: 630701xxxxxxxxxx"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
                />
              </div>
            ) : (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Pejabat / PIC Penghubung
                </label>
                <input
                  type="text"
                  value={pic}
                  onChange={(e) => setPic(e.target.value)}
                  placeholder="Contoh: Kasi Penertiban Reklame / Pambakal"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
                />
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor Kontak / WhatsApp *</label>
              <input
                type="text"
                required
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                placeholder="Contoh: 081250112233"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
              />
            </div>
          </div>

          {/* Wilayah Administratif HST */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#F0B429]" />
                <span>Kecamatan di HST *</span>
              </label>
              <select
                value={kecamatan}
                onChange={(e) => handleKecamatanChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-[#0F2A4A] focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
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
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
                required
              >
                {(currentFormKecObj.desa || []).map((d, i) => (
                  <option key={i} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Alamat Lengkap / Kantor *</label>
            <input
              type="text"
              required
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              placeholder="Contoh: Jl. Murakata RT 03 seberang jembatan"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status Verifikasi Pelapor</label>
              <select
                value={statusVerifikasi}
                onChange={(e) => setStatusVerifikasi(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
              >
                <option value="Terverifikasi">Terverifikasi (Warga Resmi)</option>
                <option value="Mitra Dinas Resmi">Mitra Dinas Resmi (SKPD / Instansi)</option>
                <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email (Opsional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan / Keterangan Pelapor</label>
            <textarea
              rows={2}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Keterangan riwayat pengaduan, subjek yang biasa dilaporkan, atau informasi kontak cadangan..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden leading-relaxed"
            />
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
              {editingPelapor ? 'Simpan Perubahan' : 'Simpan Pelapor Baru'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL KONFIRMASI HAPUS PELAPOR */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!deletePelaporId}
        onClose={() => setDeletePelaporId(null)}
        title="Konfirmasi Hapus Data Pelapor"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900">
              <p className="font-bold">Apakah Anda yakin ingin menghapus data pelapor ini?</p>
              <p className="mt-1 text-rose-800">
                Data pelapor yang dihapus akan dikeluarkan dari daftar kontak master. Rekapitulasi register yang sudah tercatat sebelumnya tetap tersimpan.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDeletePelaporId(null)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => handleDelete(deletePelaporId)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-md shadow-rose-600/20 cursor-pointer"
            >
              Ya, Hapus Pelapor
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

