import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Scale, 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  Filter, 
  AlertCircle, 
  ShieldAlert,
  Gavel,
  Layers
} from 'lucide-react';
import Modal from '../common/Modal';
import { getPerdaList, savePerda, deletePerda } from '../../data/storageService';

const KATEGORI_OPTIONS = [
  'Trantibum & Ketertiban Sosial',
  'Ketertiban PKL & Jalan',
  'Pajak & Retribusi',
  'Kebersihan Lingkungan',
  'Miras & Asusila',
  'Kawasan Tanpa Rokok',
  'Ketertiban Usaha & Waktu Operasional',
  'Perlindungan Fasilitas Umum'
];

export default function ReferensiPerdaHST({ perdaList, onRefreshData }) {
  // If perdaList prop isn't passed, fall back to storage
  const rawList = perdaList || getPerdaList();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('semua');
  const [copiedId, setCopiedId] = useState(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerda, setEditingPerda] = useState(null);
  const [deletePerdaId, setDeletePerdaId] = useState(null);

  // Form Fields
  const [nomor, setNomor] = useState('');
  const [pasal, setPasal] = useState('');
  const [tentang, setTentang] = useState('');
  const [kategori, setKategori] = useState(KATEGORI_OPTIONS[0]);
  const [deskripsi, setDeskripsi] = useState('');
  const [sanksi, setSanksi] = useState('');

  // Extract unique categories for filter
  const allKategori = Array.from(new Set(rawList.map(p => p.kategori).filter(Boolean)));

  // Filter list
  const filtered = rawList.filter(p => {
    const matchesSearch = 
      (p.nomor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.tentang || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.pasal || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.kategori || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.deskripsi || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sanksi || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesKategori = selectedKategori === 'semua' || p.kategori === selectedKategori;
    return matchesSearch && matchesKategori;
  });

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingPerda(null);
    setNomor('');
    setPasal('');
    setTentang('');
    setKategori(KATEGORI_OPTIONS[0]);
    setDeskripsi('');
    setSanksi('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (perda) => {
    setEditingPerda(perda);
    setNomor(perda.nomor || '');
    setPasal(perda.pasal || '');
    setTentang(perda.tentang || '');
    setKategori(perda.kategori || KATEGORI_OPTIONS[0]);
    setDeskripsi(perda.deskripsi || '');
    setSanksi(perda.sanksi || '');
    setIsModalOpen(true);
  };

  // Save Perda
  const handleSave = (e) => {
    e.preventDefault();
    if (!nomor.trim()) {
      alert('Nomor Perda wajib diisi! (Contoh: Perda No. 6 Tahun 2024)');
      return;
    }
    if (!tentang.trim()) {
      alert('Judul atau Tentang Perda wajib diisi!');
      return;
    }

    savePerda({
      id: editingPerda ? editingPerda.id : undefined,
      nomor: nomor.trim(),
      pasal: pasal.trim() || 'Semua Ketentuan',
      tentang: tentang.trim(),
      kategori: kategori.trim() || 'Trantibum & Ketertiban Sosial',
      deskripsi: deskripsi.trim() || '-',
      sanksi: sanksi.trim() || 'Sanksi Administratif / Pembinaan'
    });

    setIsModalOpen(false);
    if (onRefreshData) onRefreshData();
  };

  // Delete Perda
  const handleDelete = (id) => {
    deletePerda(id);
    setDeletePerdaId(null);
    if (onRefreshData) onRefreshData();
  };

  // Copy Perda text
  const handleCopyCitation = (perda) => {
    const text = `${perda.nomor} tentang "${perda.tentang}" (${perda.pasal}).\nLarangan: ${perda.deskripsi}\nSanksi: ${perda.sanksi}`;
    navigator.clipboard.writeText(text);
    setCopiedId(perda.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Nomor Perda', 'Pasal', 'Tentang', 'Kategori', 'Uraian Larangan', 'Sanksi Hukum'];
    const rows = filtered.map(p => [
      `"${p.nomor || ''}"`,
      `"${p.pasal || ''}"`,
      `"${(p.tentang || '').replace(/"/g, '""')}"`,
      `"${p.kategori || ''}"`,
      `"${(p.deskripsi || '').replace(/"/g, '""')}"`,
      `"${(p.sanksi || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `katalog_referensi_perda_hst_${new Date().toISOString().slice(0, 10)}.csv`);
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
              <BookOpen className="w-3.5 h-3.5 text-[#F0B429]" />
              KATALOG REGULASI DAERAH
            </span>
            <span className="text-xs text-slate-500 font-medium">Kabupaten Hulu Sungai Tengah</span>
          </div>
          <h2 className="text-xl font-extrabold text-[#0F2A4A] mt-1.5 tracking-tight">
            Referensi Peraturan Daerah (Perda HST)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dasar hukum penindakan, pasal relevan, uraian larangan, dan sanksi administratif Satpol PP Kab. Hulu Sungai Tengah
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
            <span>Tambah Perda Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Aturan</p>
            <p className="text-xl font-extrabold text-[#0F2A4A]">{rawList.length} <span className="text-xs font-normal text-slate-500">Pasal/Perda</span></p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Kategori Bidang</p>
            <p className="text-xl font-extrabold text-[#0F2A4A]">{allKategori.length} <span className="text-xs font-normal text-slate-500">Bidang</span></p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tingkat Penindakan</p>
            <p className="text-xl font-extrabold text-[#0F2A4A]">5 <span className="text-xs font-normal text-slate-500">Jenjang Sanksi</span></p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
            <Gavel className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Kewenangan</p>
            <p className="text-xl font-extrabold text-[#0F2A4A]">Penegakan & Ops <span className="text-xs font-normal text-slate-500">Satpol PP</span></p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nomor perda, pasal, judul, uraian larangan, atau sanksi..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Kategori:</span>
          </div>
          <select
            value={selectedKategori}
            onChange={(e) => setSelectedKategori(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden cursor-pointer"
          >
            <option value="semua">Semua Kategori ({rawList.length})</option>
            {allKategori.map(kat => (
              <option key={kat} value={kat}>{kat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Perda Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((perda) => (
          <div 
            key={perda.id} 
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all group"
          >
            <div className="space-y-3">
              {/* Header Card */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    {perda.kategori || 'Trantibum'}
                  </span>
                  <h4 className="font-extrabold text-[#0F2A4A] text-sm mt-1.5 leading-snug">
                    {perda.nomor} — <span className="text-[#D97706]">{perda.pasal}</span>
                  </h4>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleCopyCitation(perda)}
                    title="Salin rujukan pasal"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    {copiedId === perda.id ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(perda)}
                    title="Edit Referensi Perda"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setDeletePerdaId(perda.id)}
                    title="Hapus Referensi Perda"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Title / Tentang */}
              <p className="text-xs font-bold text-slate-800 leading-snug">
                {perda.tentang}
              </p>
              
              {/* Uraian Larangan */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900 block mb-0.5">Uraian Larangan / Ketentuan:</span>
                {perda.deskripsi}
              </div>

              {/* Sanksi Hukum */}
              <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200 text-xs text-rose-950 leading-relaxed">
                <span className="font-bold text-rose-900 block mb-0.5 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  <span>Sanksi Hukum / Penindakan Lapangan:</span>
                </span>
                {perda.sanksi}
              </div>
            </div>

            {/* Footer card metadata */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-mono text-[10px] text-slate-400">ID: {perda.id}</span>
              <button
                onClick={() => handleCopyCitation(perda)}
                className="text-[#0F2A4A] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                {copiedId === perda.id ? 'Tersalin!' : 'Salin Kutipan Perda'}
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-2 p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-700 text-sm">Tidak ada Perda yang cocok</h4>
            <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau ganti kategori filter.</p>
            <button
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 bg-[#0F2A4A] hover:bg-[#14365D] text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#F0B429]" />
              <span>Tambah Perda Baru Sekarang</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL TAMBAH / EDIT PERDA */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPerda ? 'Edit Referensi Perda HST' : 'Tambah Referensi Perda Baru'}
        subtitle="Katalog dasar hukum penindakan Satpol PP Kabupaten Hulu Sungai Tengah"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor Perda <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nomor}
                onChange={(e) => setNomor(e.target.value)}
                placeholder="Contoh: Perda No. 6 Tahun 2024"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pasal / Ayat <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={pasal}
                onChange={(e) => setPasal(e.target.value)}
                placeholder="Contoh: Pasal 12 Ayat 1 atau Ketertiban Umum"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kategori Bidang Pelanggaran <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#0F2A4A] outline-hidden font-semibold"
              >
                {KATEGORI_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Judul / Tentang Perda <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={tentang}
              onChange={(e) => setTentang(e.target.value)}
              placeholder="Contoh: Penyelenggaraan Ketertiban Umum dan Ketenteraman Masyarakat"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Uraian Larangan / Ketentuan Pelanggaran <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Tuliskan uraian jelas mengenai perbuatan yang dilarang atau diatur dalam pasal ini..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ketentuan Sanksi & Penindakan Lapangan <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={sanksi}
              onChange={(e) => setSanksi(e.target.value)}
              placeholder="Contoh: Peringatan tertulis (SP1-SP3), relokasi, penyitaan barang bukti, atau sidang tipiring."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden leading-relaxed font-medium text-rose-900 bg-rose-50/30"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#0F2A4A] hover:bg-[#14365D] text-white text-xs font-bold transition-all shadow-md shadow-[#0F2A4A]/20 cursor-pointer"
            >
              {editingPerda ? 'Simpan Perubahan Perda' : 'Simpan Perda Baru'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL KONFIRMASI HAPUS PERDA */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!deletePerdaId}
        onClose={() => setDeletePerdaId(null)}
        title="Konfirmasi Hapus Referensi Perda"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900">
              <p className="font-bold">Apakah Anda yakin ingin menghapus referensi Perda ini?</p>
              <p className="mt-1 text-rose-800">
                Data Perda yang dihapus tidak akan lagi muncul dalam katalog referensi dan pilihan pembuatan Berita Acara pelanggaran baru.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDeletePerdaId(null)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => handleDelete(deletePerdaId)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-md shadow-rose-600/20 cursor-pointer"
            >
              Ya, Hapus Perda
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
