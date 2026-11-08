import React, { useState, useId } from 'react';
import { 
  CheckSquare, 
  Search, 
  Plus, 
  Download, 
  Printer, 
  Edit, 
  Trash2, 
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  X,
  Package,
  ShieldCheck,
  Radio,
  FileSpreadsheet,
  Layers,
  ArrowRight
} from 'lucide-react';
import Modal from '../common/Modal';
import { 
  saveFasilitasPoskamling, 
  deleteFasilitasPoskamling, 
  resetFasilitasPoskamlingToDefault 
} from '../../data/storageService';

const KATEGORI_OPTIONS = [
  'Komunikasi & Tanda Bahaya',
  'Penerangan & Kelistrikan',
  'Administrasi & Penjagaan',
  'Medis & Keselamatan',
  'Perlengkapan Petugas',
  'Sarana Penunjang Lainnya'
];

export default function MasterFasilitasPoskamling({ 
  fasilitasList = [], 
  poskamlingList = [], 
  onRefreshData,
  onNavigateToPoskamling
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('semua');
  const [selectedWajib, setSelectedWajib] = useState('semua');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [removeFromPoskamlingChecked, setRemoveFromPoskamlingChecked] = useState(true);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Form State
  const [namaFasilitas, setNamaFasilitas] = useState('');
  const [kategori, setKategori] = useState(KATEGORI_OPTIONS[0]);
  const [statusWajib, setStatusWajib] = useState(true);
  const [deskripsi, setDeskripsi] = useState('');

  // Accessibility IDs
  const searchInputId = useId();
  const filterKategoriId = useId();
  const filterWajibId = useId();

  // Calculate usage count in existing poskamling
  const getUsageCount = (facilityName) => {
    if (!facilityName || !Array.isArray(poskamlingList)) return 0;
    return poskamlingList.filter(pos => 
      Array.isArray(pos.fasilitas) && pos.fasilitas.includes(facilityName)
    ).length;
  };

  // Filter list
  const filteredList = fasilitasList.filter(item => {
    const matchSearch = 
      (item.namaFasilitas || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.deskripsi || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.kategori || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchKategori = selectedKategori === 'semua' || item.kategori === selectedKategori;
    const matchWajib = 
      selectedWajib === 'semua' || 
      (selectedWajib === 'wajib' && item.statusWajib) ||
      (selectedWajib === 'opsional' && !item.statusWajib);

    return matchSearch && matchKategori && matchWajib;
  });

  // KPI Calculations
  const totalFasilitas = fasilitasList.length;
  const totalWajib = fasilitasList.filter(f => f.statusWajib).length;
  const totalOpsional = totalFasilitas - totalWajib;
  const totalPos = poskamlingList.length;

  const handleOpenAdd = () => {
    setEditingItem(null);
    setNamaFasilitas('');
    setKategori(KATEGORI_OPTIONS[0]);
    setStatusWajib(true);
    setDeskripsi('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setNamaFasilitas(item.namaFasilitas || '');
    setKategori(item.kategori || KATEGORI_OPTIONS[0]);
    setStatusWajib(item.statusWajib !== undefined ? item.statusWajib : true);
    setDeskripsi(item.deskripsi || '');
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!namaFasilitas.trim()) {
      alert('Nama Fasilitas / Sarana wajib diisi!');
      return;
    }

    saveFasilitasPoskamling({
      id: editingItem ? editingItem.id : null,
      namaFasilitas: namaFasilitas.trim(),
      kategori,
      statusWajib,
      deskripsi: deskripsi.trim()
    });

    if (onRefreshData) onRefreshData();
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteFasilitasPoskamling(deleteTarget.id, removeFromPoskamlingChecked);
    setDeleteTarget(null);
    if (onRefreshData) onRefreshData();
  };

  const handleResetDefault = () => {
    resetFasilitasPoskamlingToDefault();
    setIsResetConfirmOpen(false);
    if (onRefreshData) onRefreshData();
  };

  const handleExportCsv = () => {
    if (fasilitasList.length === 0) {
      alert('Tidak ada data untuk diekspor');
      return;
    }

    const headers = ['ID', 'Nama Fasilitas / Sarana', 'Kategori', 'Status Standar', 'Jumlah Pos Pemakai', 'Deskripsi Standar'];
    const rows = fasilitasList.map(item => [
      item.id,
      `"${item.namaFasilitas || ''}"`,
      `"${item.kategori || ''}"`,
      item.statusWajib ? 'Wajib' : 'Opsional',
      getUsageCount(item.namaFasilitas),
      `"${(item.deskripsi || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Master_Sarana_Poskamling_HST_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER SECTION */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0F2A4A] to-[#1a406e] text-amber-400 flex items-center justify-center shadow-xs">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-[#0F2A4A] tracking-tight">
                MASTER FASILITAS & SARANA POSKAMLING
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                Terkoneksi Form Pos Ronda
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Standarisasi sarana keamanan pos ronda se-Kabupaten HST. Item yang ditambah atau dikurangi otomatis terhubung ke checklist Data Poskamling.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {onNavigateToPoskamling && (
            <button
              type="button"
              onClick={onNavigateToPoskamling}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Lihat Data Poskamling"
            >
              <Radio className="w-3.5 h-3.5 text-slate-600" />
              <span>Buka Data Poskamling</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Ekspor CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Cetak Daftar Master"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Cetak</span>
          </button>

          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 flex items-center gap-1.5 transition-colors cursor-pointer border border-amber-300"
            title="Reset ke 8 Sarana Standar"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-800" />
            <span>Reset Standar</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl text-xs font-extrabold text-[#0F2A4A] bg-[#F0B429] hover:bg-[#e0a724] flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#0F2A4A]" />
            <span>Tambah Sarana Baru</span>
          </button>
        </div>
      </div>

      {/* 2. STATISTIK KPI SARANA */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Sarana Terdaftar</p>
            <h3 className="text-2xl font-extrabold text-[#0F2A4A] mt-1">{totalFasilitas}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Item Perlengkapan Master</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Sarana Wajib</p>
            <h3 className="text-2xl font-extrabold text-emerald-700 mt-1">{totalWajib}</h3>
            <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Standar Minimal Pos Ronda</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Sarana Opsional</p>
            <h3 className="text-2xl font-extrabold text-amber-700 mt-1">{totalOpsional}</h3>
            <p className="text-[10px] text-amber-600 font-medium mt-0.5">Perlengkapan Tambahan</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Pos Terkoneksi</p>
            <h3 className="text-2xl font-extrabold text-indigo-700 mt-1">{totalPos}</h3>
            <p className="text-[10px] text-indigo-600 font-medium mt-0.5">Titik Poskamling di HST</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Radio className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. TOOLBAR & FILTER */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <label htmlFor={searchInputId} className="sr-only">Cari Sarana Poskamling</label>
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id={searchInputId}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama sarana, kategori, atau deskripsi..."
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

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div>
              <label htmlFor={filterKategoriId} className="sr-only">Filter Kategori</label>
              <select
                id={filterKategoriId}
                value={selectedKategori}
                onChange={(e) => setSelectedKategori(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="semua">Semua Kategori</option>
                {KATEGORI_OPTIONS.map(kat => (
                  <option key={kat} value={kat}>{kat}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor={filterWajibId} className="sr-only">Filter Status</label>
              <select
                id={filterWajibId}
                value={selectedWajib}
                onChange={(e) => setSelectedWajib(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="semua">Semua Status</option>
                <option value="wajib">Wajib Standar Pos</option>
                <option value="opsional">Opsional / Pendukung</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 4. TABEL DATA MASTER FASILITAS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Sarana & Fasilitas</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Ketersediaan di Poskamling</th>
                <th className="py-3 px-4">Deskripsi / Standar Fisik</th>
                <th className="py-3 px-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium">Tidak ada sarana atau fasilitas poskamling yang cocok.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Gunakan tombol "Tambah Sarana Baru" atau sesuaikan kata kunci pencarian.</p>
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => {
                  const usageCount = getUsageCount(item.namaFasilitas);
                  const usagePercent = totalPos > 0 ? Math.round((usageCount / totalPos) * 100) : 0;

                  return (
                    <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            item.statusWajib 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            <CheckSquare className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 text-sm block">
                              {item.namaFasilitas}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: {item.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {item.kategori || 'Umum'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {item.statusWajib ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>WAJIB</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Opsional
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-700">
                              {usageCount} dari {totalPos} Pos
                            </span>
                            <span className={`font-mono font-bold ${
                              usagePercent >= 75 ? 'text-emerald-600' :
                              usagePercent >= 40 ? 'text-amber-600' : 'text-slate-500'
                            }`}>
                              {usagePercent}%
                            </span>
                          </div>
                          <div className="w-36 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                usagePercent >= 75 ? 'bg-emerald-500' :
                                usagePercent >= 40 ? 'bg-amber-500' : 'bg-slate-400'
                              }`} 
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="text-xs text-slate-600 max-w-xs line-clamp-2" title={item.deskripsi}>
                          {item.deskripsi || '-'}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit Fasilitas"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteTarget(item);
                              setRemoveFromPoskamlingChecked(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus Fasilitas"
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

      {/* ========================================================================= */}
      {/* 5. MODAL TAMBAH / EDIT SARANA */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Sarana / Fasilitas Poskamling' : 'Tambah Sarana / Fasilitas Poskamling'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Koneksi Otomatis ke Poskamling</p>
              <p className="text-amber-800 mt-0.5">
                {editingItem 
                  ? 'Jika nama sarana diubah, seluruh data Poskamling yang mencentang sarana ini akan diperbarui namanya secara otomatis.'
                  : 'Sarana baru yang Anda tambahkan akan langsung muncul sebagai opsi checklist di formulir input & edit Poskamling.'}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Nama Sarana / Fasilitas <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={namaFasilitas}
              onChange={(e) => setNamaFasilitas(e.target.value)}
              placeholder="Contoh: Lampu Sorot LED, Kotak P3K, Rompi Linmas"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Kategori Sarana
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
              >
                {KATEGORI_OPTIONS.map(kat => (
                  <option key={kat} value={kat}>{kat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Status Standar
              </label>
              <select
                value={statusWajib ? 'wajib' : 'opsional'}
                onChange={(e) => setStatusWajib(e.target.value === 'wajib')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
              >
                <option value="wajib">Wajib (Standar Pos Ronda)</option>
                <option value="opsional">Opsional (Sarana Pendukung)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Deskripsi / Spesifikasi Standar
            </label>
            <textarea
              rows={3}
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Jelaskan standar fisik atau fungsi sarana untuk kelayakan pos ronda..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-[#0F2A4A] bg-[#F0B429] hover:bg-[#e2a820] flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 text-[#0F2A4A]" />
              <span>{editingItem ? 'Perbarui Sarana' : 'Simpan Sarana'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* 6. MODAL KONFIRMASI HAPUS SARANA */}
      {/* ========================================================================= */}
      {deleteTarget && (
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Konfirmasi Hapus Sarana"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
              <p className="font-bold text-sm text-rose-800 mb-1">
                Hapus "{deleteTarget.namaFasilitas}"?
              </p>
              <p>
                Sarana ini terdaftar pada kategori <span className="font-semibold">{deleteTarget.kategori}</span>.
                Saat ini terdapat <span className="font-bold text-rose-700">{getUsageCount(deleteTarget.namaFasilitas)} Poskamling</span> yang mencentang sarana ini.
              </p>
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={removeFromPoskamlingChecked}
                onChange={(e) => setRemoveFromPoskamlingChecked(e.target.checked)}
                className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
              />
              <span className="text-xs text-slate-700">
                <strong className="block text-slate-900">Bersihkan dari Data Poskamling</strong>
                Hilangkan centang sarana ini dari seluruh poskamling yang sedang menggunakannya.
              </span>
            </label>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Sarana</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL RESET KE 8 SARANA STANDAR */}
      {/* ========================================================================= */}
      {isResetConfirmOpen && (
        <Modal
          isOpen={isResetConfirmOpen}
          onClose={() => setIsResetConfirmOpen(false)}
          title="Reset ke Sarana Standar"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Tindakan ini akan mengembalikan daftar master fasilitas ke <strong>8 sarana standar pos ronda</strong> (Kentongan, Buku Mutasi, Senter LED, Kotak P3K, Rompi/Jas Hujan, APAR/Ember, Radio HT, Lampu Panel Surya).
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetDefault}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#0F2A4A] bg-[#F0B429] hover:bg-[#e2a820] flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Sekarang</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

