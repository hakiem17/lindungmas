import React, { useState } from 'react';
import { 
  Map, 
  MapPin, 
  Building2, 
  Search, 
  Plus, 
  Download, 
  Printer, 
  Edit, 
  Trash2, 
  ChevronRight, 
  Compass, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Info
} from 'lucide-react';
import Modal from '../common/Modal';
import { 
  saveKecamatan, 
  deleteKecamatan, 
  addDesaToKecamatan, 
  editDesaInKecamatan, 
  deleteDesaFromKecamatan 
} from '../../data/storageService';

export default function MasterWilayah({ wilayahList, onRefreshData }) {
  const [activeSubTab, setActiveSubTab] = useState('kecamatan'); // 'kecamatan' or 'desa'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKecFilter, setSelectedKecFilter] = useState('semua');

  // Modals
  const [isKecModalOpen, setIsKecModalOpen] = useState(false);
  const [editingKec, setEditingKec] = useState(null);
  const [deleteKecId, setDeleteKecId] = useState(null);

  const [isDesaModalOpen, setIsDesaModalOpen] = useState(false);
  const [targetKecForDesa, setTargetKecForDesa] = useState(null);
  const [editingDesaName, setEditingDesaName] = useState(null);
  const [newDesaInput, setNewDesaInput] = useState('');
  const [deleteDesaTarget, setDeleteDesaTarget] = useState(null); // { kecId, desaName }

  // Form states for Kecamatan
  const [namaKec, setNamaKec] = useState('');
  const [pusatKec, setPusatKec] = useState('');
  const [kodePosKec, setKodePosKec] = useState('');
  const [tipeKec, setTipeKec] = useState('Kecamatan');
  const [latKec, setLatKec] = useState(-2.5833);
  const [lngKec, setLngKec] = useState(115.3811);

  // Calculate statistics
  const totalKecamatan = wilayahList.length;
  const totalDesa = wilayahList.reduce((acc, k) => acc + (k.desa ? k.desa.length : 0), 0);

  // Filtered Kecamatan
  const filteredKecamatan = wilayahList.filter(k => 
    k.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (k.pusat && k.pusat.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (k.kodePos && k.kodePos.includes(searchTerm))
  );

  // Flattened Desa for Desa View
  const allDesaFlat = [];
  wilayahList.forEach(k => {
    (k.desa || []).forEach(d => {
      allDesaFlat.push({
        kecamatanId: k.id,
        kecamatanNama: k.nama,
        kodePos: k.kodePos,
        desaNama: d
      });
    });
  });

  const filteredDesa = allDesaFlat.filter(d => {
    const matchSearch = 
      d.desaNama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.kecamatanNama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchKec = selectedKecFilter === 'semua' || d.kecamatanNama === selectedKecFilter;
    return matchSearch && matchKec;
  });

  // Open Add Kecamatan
  const handleOpenAddKec = () => {
    setEditingKec(null);
    setNamaKec('');
    setPusatKec('');
    setKodePosKec('71300');
    setTipeKec('Kecamatan');
    setLatKec(-2.5833);
    setLngKec(115.3811);
    setIsKecModalOpen(true);
  };

  // Open Edit Kecamatan
  const handleOpenEditKec = (kec) => {
    setEditingKec(kec);
    setNamaKec(kec.nama || '');
    setPusatKec(kec.pusat || '');
    setKodePosKec(kec.kodePos || '');
    setTipeKec(kec.tipe || 'Kecamatan');
    setLatKec(kec.lat || -2.5833);
    setLngKec(kec.lng || 115.3811);
    setIsKecModalOpen(true);
  };

  const handleSaveKec = (e) => {
    e.preventDefault();
    if (!namaKec.trim()) {
      alert('Nama Kecamatan wajib diisi!');
      return;
    }

    saveKecamatan({
      id: editingKec ? editingKec.id : undefined,
      nama: namaKec.trim(),
      pusat: pusatKec.trim(),
      kodePos: kodePosKec.trim(),
      tipe: tipeKec,
      lat: parseFloat(latKec) || -2.5833,
      lng: parseFloat(lngKec) || 115.3811
    });

    setIsKecModalOpen(false);
    if (onRefreshData) onRefreshData();
  };

  const handleDeleteKec = (id) => {
    deleteKecamatan(id);
    setDeleteKecId(null);
    if (onRefreshData) onRefreshData();
  };

  // Open Add Desa
  const handleOpenAddDesa = (kec) => {
    setTargetKecForDesa(kec || wilayahList[0]);
    setEditingDesaName(null);
    setNewDesaInput('');
    setIsDesaModalOpen(true);
  };

  // Open Edit Desa
  const handleOpenEditDesa = (kecId, desaName) => {
    const foundKec = wilayahList.find(k => k.id === kecId);
    setTargetKecForDesa(foundKec);
    setEditingDesaName(desaName);
    setNewDesaInput(desaName);
    setIsDesaModalOpen(true);
  };

  const handleSaveDesa = (e) => {
    e.preventDefault();
    if (!newDesaInput.trim() || !targetKecForDesa) {
      alert('Nama Desa / Kelurahan tidak boleh kosong!');
      return;
    }

    if (editingDesaName) {
      editDesaInKecamatan(targetKecForDesa.id, editingDesaName, newDesaInput.trim());
    } else {
      addDesaToKecamatan(targetKecForDesa.id, newDesaInput.trim());
    }

    setIsDesaModalOpen(false);
    setNewDesaInput('');
    if (onRefreshData) onRefreshData();
  };

  const handleDeleteDesa = () => {
    if (!deleteDesaTarget) return;
    deleteDesaFromKecamatan(deleteDesaTarget.kecId, deleteDesaTarget.desaName);
    setDeleteDesaTarget(null);
    if (onRefreshData) onRefreshData();
  };

  const handleExportCSV = () => {
    const headers = ['No', 'Kecamatan', 'Pusat Pemerintahan', 'Kode Pos', 'Nama Desa / Kelurahan'];
    const rows = allDesaFlat.map((item, idx) => {
      const kecObj = wilayahList.find(k => k.id === item.kecamatanId);
      return [
        `"${idx + 1}"`,
        `"${item.kecamatanNama}"`,
        `"${kecObj ? kecObj.pusat : '-'}"`,
        `"${item.kodePos || '-'}"`,
        `"${item.desaNama}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `master_wilayah_hst_kecamatan_desa_${new Date().toISOString().slice(0, 10)}.csv`);
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
              <Map className="w-3.5 h-3.5 text-[#F0B429]" />
              MASTER DATA WILAYAH SPASIAL
            </span>
            <span className="text-xs text-slate-500 font-medium">Kabupaten Hulu Sungai Tengah</span>
          </div>
          <h2 className="text-xl font-extrabold text-[#0F2A4A] mt-1.5 tracking-tight">
            Master Wilayah (Kecamatan & Desa)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data administratif wilayah penugasan patroli, sebaran laporan pengaduan warga, dan peta zonasi Perda di Hulu Sungai Tengah
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
            onClick={handleOpenAddKec}
            className="px-4 py-2 bg-[#0F2A4A] hover:bg-[#14365D] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-[#0F2A4A]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F0B429]" />
            <span>Tambah Kecamatan</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Kecamatan</span>
          <p className="text-2xl font-extrabold text-[#0F2A4A] mt-1 font-mono">{totalKecamatan}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Wilayah Administratif HST</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Desa & Kelurahan Terdata</span>
          <p className="text-2xl font-extrabold text-blue-700 mt-1 font-mono">{totalDesa}</p>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Terintegrasi ke Spasial
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pusat Pemerintahan</span>
          <p className="text-base font-extrabold text-purple-800 mt-1">Kec. Barabai</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Pusat Mako Satpol PP</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kawasan Khusus</span>
          <p className="text-base font-extrabold text-amber-700 mt-1">Meratus & Wisata</p>
          <span className="text-[11px] text-slate-500 mt-1 block">BAT, Hantakan, Batu Benawa</span>
        </div>
      </div>

      {/* Sub-tab Switcher (Kecamatan vs Desa) */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setActiveSubTab('kecamatan'); setSearchTerm(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'kecamatan'
                ? 'bg-[#0F2A4A] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4 text-[#F0B429]" />
            <span>Tabel Kecamatan ({totalKecamatan})</span>
          </button>

          <button
            onClick={() => { setActiveSubTab('desa'); setSearchTerm(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'desa'
                ? 'bg-[#0F2A4A] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MapPin className="w-4 h-4 text-[#F0B429]" />
            <span>Daftar Desa & Kelurahan ({totalDesa})</span>
          </button>
        </div>

        {/* Quick search input */}
        <div className="flex items-center gap-2">
          {activeSubTab === 'desa' && (
            <select
              value={selectedKecFilter}
              onChange={(e) => setSelectedKecFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-[#0F2A4A] bg-white outline-hidden"
            >
              <option value="semua">Semua Kecamatan</option>
              {wilayahList.map(k => (
                <option key={k.id} value={k.nama}>Kec. {k.nama}</option>
              ))}
            </select>
          )}

          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={activeSubTab === 'kecamatan' ? 'Cari kecamatan...' : 'Cari desa / kelurahan...'}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
            />
          </div>

          {activeSubTab === 'desa' && (
            <button
              onClick={() => handleOpenAddDesa(wilayahList[0])}
              className="px-3 py-1.5 bg-[#0F2A4A] hover:bg-[#14365D] text-white text-xs font-bold rounded-xl flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-[#F0B429]" />
              <span>Tambah Desa</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: KECAMATAN TABLE */}
      {activeSubTab === 'kecamatan' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 text-left border-r border-slate-200 w-12">No</th>
                  <th className="py-3 px-4 border-r border-slate-200 min-w-[170px] text-left">Nama Kecamatan</th>
                  <th className="py-3 px-4 border-r border-slate-200 min-w-[160px] text-left">Pusat Pemerintahan</th>
                  <th className="py-3 px-3 border-r border-slate-200 min-w-[90px] text-left">Kode Pos</th>
                  <th className="py-3 px-3.5 border-r border-slate-200 min-w-[130px] text-left">Karakter Wilayah</th>
                  <th className="py-3 px-3 border-r border-slate-200 min-w-[100px] text-left">Jumlah Desa</th>
                  <th className="py-3 px-4 border-r border-slate-200 min-w-[160px] text-left">Titik Koordinat GPS</th>
                  <th className="py-3 px-4 min-w-[140px] text-center">Kelola Desa & Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredKecamatan.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      Tidak ada data kecamatan yang cocok.
                    </td>
                  </tr>
                ) : (
                  filteredKecamatan.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-amber-50/40 transition-colors">
                      {/* No */}
                      <td className="py-3 px-3 text-left font-mono font-bold text-slate-600 border-r border-slate-200">
                        {idx + 1}
                      </td>

                      {/* Nama Kecamatan */}
                      <td className="py-3 px-4 border-r border-slate-200 text-left">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-[#0F2A4A] shrink-0" />
                          <span className="font-extrabold text-[#0F2A4A] text-sm">Kec. {item.nama}</span>
                        </div>
                      </td>

                      {/* Pusat Pemerintahan */}
                      <td className="py-3 px-4 border-r border-slate-200 text-slate-700 font-medium text-left">
                        {item.pusat || '-'}
                      </td>

                      {/* Kode Pos */}
                      <td className="py-3 px-3 border-r border-slate-200 font-mono text-slate-700 text-left">
                        {item.kodePos || '-'}
                      </td>

                      {/* Tipe Wilayah */}
                      <td className="py-3 px-3.5 border-r border-slate-200 text-left">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {item.tipe || 'Kecamatan'}
                        </span>
                      </td>

                      {/* Jumlah Desa */}
                      <td className="py-3 px-3 border-r border-slate-200 text-left">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-50 text-blue-800 border border-blue-200">
                          {(item.desa || []).length} Desa/Kel
                        </span>
                      </td>

                      {/* Titik Koordinat GPS */}
                      <td className="py-3 px-4 border-r border-slate-200 text-left font-mono text-[11px] text-slate-600">
                        {item.lat?.toFixed(4)}, {item.lng?.toFixed(4)}
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedKecFilter(item.nama);
                              setActiveSubTab('desa');
                            }}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                            title="Buka daftar desa di kecamatan ini"
                          >
                            <span>Daftar Desa</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenAddDesa(item)}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Tambah Desa ke Kecamatan Ini"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditKec(item)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Kecamatan"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteKecId(item.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Kecamatan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
            <span>Menampilkan {filteredKecamatan.length} dari {wilayahList.length} kecamatan</span>
            <span className="font-semibold text-[#0F2A4A]">Pemerintah Kabupaten Hulu Sungai Tengah</span>
          </div>
        </div>
      )}

      {/* TAB 2: DAFTAR DESA & KELURAHAN TABLE */}
      {activeSubTab === 'desa' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 text-left border-r border-slate-200 w-12">No</th>
                  <th className="py-3 px-4 border-r border-slate-200 min-w-[200px] text-left">Nama Desa / Kelurahan</th>
                  <th className="py-3 px-4 border-r border-slate-200 min-w-[180px] text-left">Kecamatan Induk</th>
                  <th className="py-3 px-3 border-r border-slate-200 min-w-[100px] text-left">Kode Pos</th>
                  <th className="py-3 px-3.5 border-r border-slate-200 min-w-[140px] text-left">Status Administratif</th>
                  <th className="py-3 px-3.5 min-w-[110px] text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredDesa.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      Tidak ada desa / kelurahan yang cocok dengan pencarian atau filter.
                    </td>
                  </tr>
                ) : (
                  filteredDesa.map((item, idx) => {
                    const isKelurahan = item.desaNama.toLowerCase().includes('barabai') || item.desaNama.toLowerCase().includes('birayang');

                    return (
                      <tr key={`${item.kecamatanId}-${item.desaNama}`} className="hover:bg-amber-50/40 transition-colors">
                        {/* No */}
                        <td className="py-3 px-3 text-left font-mono font-bold text-slate-600 border-r border-slate-200">
                          {idx + 1}
                        </td>

                        {/* Nama Desa */}
                        <td className="py-3 px-4 border-r border-slate-200 text-left">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-[#F0B429] shrink-0" />
                            <span className="font-bold text-slate-900 text-sm">{item.desaNama}</span>
                          </div>
                        </td>

                        {/* Kecamatan Induk */}
                        <td className="py-3 px-4 border-r border-slate-200 text-left">
                          <span className="font-extrabold text-[#0F2A4A]">Kec. {item.kecamatanNama}</span>
                        </td>

                        {/* Kode Pos */}
                        <td className="py-3 px-3 border-r border-slate-200 font-mono text-slate-600 text-left">
                          {item.kodePos || '-'}
                        </td>

                        {/* Status Administratif */}
                        <td className="py-3 px-3.5 border-r border-slate-200 text-left">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                            isKelurahan 
                              ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}>
                            {isKelurahan ? 'Kelurahan' : 'Desa'}
                          </span>
                        </td>

                        {/* Aksi */}
                        <td className="py-3 px-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditDesa(item.kecamatanId, item.desaNama)}
                              className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Nama Desa"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteDesaTarget({ kecId: item.kecamatanId, desaName: item.desaNama })}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus Desa"
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

          <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
            <span>Menampilkan {filteredDesa.length} dari {allDesaFlat.length} total desa/kelurahan</span>
            <span className="font-semibold text-[#0F2A4A]">Basis Wilayah Satpol PP Kab. Hulu Sungai Tengah</span>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH / EDIT KECAMATAN */}
      <Modal
        isOpen={isKecModalOpen}
        onClose={() => setIsKecModalOpen(false)}
        title={editingKec ? 'Edit Data Kecamatan' : 'Tambah Kecamatan Baru'}
        subtitle="Entri nama kecamatan dan titik koordinat pusat pemerintahan"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveKec} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Kecamatan *</label>
            <input
              type="text"
              value={namaKec}
              onChange={(e) => setNamaKec(e.target.value)}
              placeholder="Contoh: Barabai"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ibukota / Pusat Pemerintahan</label>
              <input
                type="text"
                value={pusatKec}
                onChange={(e) => setPusatKec(e.target.value)}
                placeholder="Contoh: Barabai Barat"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kode Pos</label>
              <input
                type="text"
                value={kodePosKec}
                onChange={(e) => setKodePosKec(e.target.value)}
                placeholder="71311"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Karakter / Tipe Wilayah</label>
            <select
              value={tipeKec}
              onChange={(e) => setTipeKec(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white"
            >
              <option value="Kecamatan">Kecamatan Biasa</option>
              <option value="Pusat Ibukota Kabupaten">Pusat Ibukota Kabupaten</option>
              <option value="Kecamatan Pegunungan">Kecamatan Pegunungan (Meratus)</option>
              <option value="Kecamatan Wisata">Kecamatan Wisata & Budaya</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Latitude (Lintang)</label>
              <input
                type="number"
                step="any"
                value={latKec}
                onChange={(e) => setLatKec(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden font-mono text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Longitude (Bujur)</label>
              <input
                type="number"
                step="any"
                value={lngKec}
                onChange={(e) => setLngKec(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsKecModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#0F2A4A] hover:bg-[#14365D] text-white font-bold rounded-xl shadow-xs"
            >
              {editingKec ? 'Simpan Perubahan' : 'Tambah Kecamatan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL TAMBAH / EDIT DESA */}
      <Modal
        isOpen={isDesaModalOpen}
        onClose={() => setIsDesaModalOpen(false)}
        title={editingDesaName ? `Edit Nama Desa: ${editingDesaName}` : 'Tambah Desa / Kelurahan Baru'}
        subtitle={targetKecForDesa ? `Di bawah Kecamatan ${targetKecForDesa.nama}` : ''}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveDesa} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Kecamatan Induk *</label>
            <select
              value={targetKecForDesa ? targetKecForDesa.id : ''}
              onChange={(e) => {
                const found = wilayahList.find(k => k.id === e.target.value);
                setTargetKecForDesa(found);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white font-bold text-[#0F2A4A]"
              disabled={!!editingDesaName}
            >
              {wilayahList.map(k => (
                <option key={k.id} value={k.id}>Kecamatan {k.nama}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Desa / Kelurahan *</label>
            <input
              type="text"
              value={newDesaInput}
              onChange={(e) => setNewDesaInput(e.target.value)}
              placeholder="Contoh: Barabai Barat atau Kayu Rabah"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden text-sm"
              required
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsDesaModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#0F2A4A] hover:bg-[#14365D] text-white font-bold rounded-xl shadow-xs"
            >
              {editingDesaName ? 'Simpan Perubahan' : 'Tambah Desa'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL KONFIRMASI HAPUS KECAMATAN */}
      {deleteKecId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h4 className="font-bold text-slate-900 text-base">Hapus Kecamatan?</h4>
            </div>
            <p className="text-xs text-slate-600">
              Apakah Anda yakin ingin menghapus kecamatan ini beserta seluruh desa di dalamnya? Tindakan ini akan memengaruhi pemetaan spasial.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteKecId(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteKec(deleteKecId)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS DESA */}
      {deleteDesaTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h4 className="font-bold text-slate-900 text-base">Hapus Desa / Kelurahan?</h4>
            </div>
            <p className="text-xs text-slate-600">
              Hapus <b>{deleteDesaTarget.desaName}</b> dari basis data desa?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteDesaTarget(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteDesa}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

