import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Download, 
  Printer, 
  Edit, 
  Trash2, 
  ShieldCheck, 
  Phone, 
  Mail, 
  BadgeCheck, 
  UserCheck, 
  AlertCircle, 
  CheckCircle2, 
  X,
  ArrowUp,
  ArrowDown,
  GraduationCap,
  Briefcase,
  Building2,
  FileSpreadsheet,
  Eye
} from 'lucide-react';
import Modal from '../common/Modal';
import { savePegawai, deletePegawai, movePegawai } from '../../data/storageService';

export default function MasterPegawai({ pegawaiList = [], onRefreshData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusKepegawaian, setSelectedStatusKepegawaian] = useState('semua');
  const [selectedPendidikan, setSelectedPendidikan] = useState('semua');
  const [selectedStatus, setSelectedStatus] = useState('semua');

  // Modal State (Add / Edit / Detail)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPegawai, setEditingPegawai] = useState(null);
  const [detailPegawai, setDetailPegawai] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form State
  const [nama, setNama] = useState('');
  const [nip, setNip] = useState('');
  const [jk, setJk] = useState('Laki-laki');
  const [pangkat, setPangkat] = useState('Penata Muda (III/a)');
  const [jabatan, setJabatan] = useState('');
  const [statusKepegawaian, setStatusKepegawaian] = useState('PNS');
  const [pendidikan, setPendidikan] = useState('S-1');
  const [noHp, setNoHp] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('Aktif');

  // Filter list
  const sortedList = [...pegawaiList].sort((a, b) => (a.urutan ?? 1e9) - (b.urutan ?? 1e9));
  const isFiltering = Boolean(searchTerm) || selectedStatusKepegawaian !== 'semua' || selectedPendidikan !== 'semua' || selectedStatus !== 'semua';

  const handleMove = async (id, dir) => {
    await movePegawai(id, dir);
    if (onRefreshData) onRefreshData();
  };

  const filtered = sortedList.filter(item => {
    const matchSearch = 
      (item.nama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.nip || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.jabatan || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.pangkat || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatusPeg = selectedStatusKepegawaian === 'semua' || 
      (item.statusKepegawaian || 'PNS').toLowerCase() === selectedStatusKepegawaian.toLowerCase();

    const matchPendidikan = selectedPendidikan === 'semua' || 
      (item.pendidikan || 'S-1').toLowerCase() === selectedPendidikan.toLowerCase();

    const matchStatus = selectedStatus === 'semua' || 
      (item.status || 'Aktif').toLowerCase() === selectedStatus.toLowerCase();

    return matchSearch && matchStatusPeg && matchPendidikan && matchStatus;
  });

  // Calculate statistics
  const totalPegawai = pegawaiList.length;
  const countPns = pegawaiList.filter(p => (p.statusKepegawaian || 'PNS') === 'PNS').length;
  const countPppk = pegawaiList.filter(p => (p.statusKepegawaian || '') === 'PPPK').length;
  const countS1 = pegawaiList.filter(p => (p.pendidikan || '').includes('S-1') || (p.pendidikan || '').includes('S1')).length;
  const countSma = pegawaiList.filter(p => (p.pendidikan || '').includes('SMA')).length;
  const countAktif = pegawaiList.filter(p => (p.status || 'Aktif') === 'Aktif').length;

  const handleOpenAdd = () => {
    setEditingPegawai(null);
    setNama('');
    setNip('');
    setJk('Laki-laki');
    setPangkat('Penata Muda (III/a)');
    setJabatan('Polisi Pamong Praja Pelaksana Lanjutan');
    setStatusKepegawaian('PNS');
    setPendidikan('S-1');
    setNoHp('');
    setEmail('');
    setStatus('Aktif');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (peg) => {
    setEditingPegawai(peg);
    setNama(peg.nama || '');
    setNip(peg.nip || '');
    setJk(peg.jk || 'Laki-laki');
    setPangkat(peg.pangkat || 'Penata Muda (III/a)');
    setJabatan(peg.jabatan || '');
    setStatusKepegawaian(peg.statusKepegawaian || 'PNS');
    setPendidikan(peg.pendidikan || 'S-1');
    setNoHp(peg.noHp || '');
    setEmail(peg.email || '');
    setStatus(peg.status || 'Aktif');
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!nama.trim() || !nip.trim()) {
      alert('Nama Lengkap dan NIP wajib diisi!');
      return;
    }

    savePegawai({
      id: editingPegawai ? editingPegawai.id : undefined,
      nama: nama.trim(),
      nip: nip.trim(),
      jk,
      pangkat,
      jabatan: jabatan.trim(),
      statusKepegawaian,
      pendidikan,
      noHp: noHp.trim(),
      email: email.trim(),
      status
    });

    setIsModalOpen(false);
    if (onRefreshData) onRefreshData();
  };

  const handleDelete = (id) => {
    deletePegawai(id);
    setDeleteConfirmId(null);
    if (onRefreshData) onRefreshData();
  };

  const handleExportCSV = () => {
    const headers = ['No', 'Nama Lengkap', 'NIP / NRP', 'Jenis Kelamin', 'Pangkat / Golongan', 'Jabatan Kedinasan', 'Status Kepegawaian', 'Pendidikan', 'No. Telepon', 'Status'];
    const rows = filtered.map((item, idx) => [
      `"${idx + 1}"`,
      `"${item.nama}"`,
      `"${item.nip}"`,
      `"${item.jk || 'Laki-laki'}"`,
      `"${item.pangkat || '-'}"`,
      `"${item.jabatan}"`,
      `"${item.statusKepegawaian || 'PNS'}"`,
      `"${item.pendidikan || 'S-1'}"`,
      `"${item.noHp || '-'}"`,
      `"${item.status || 'Aktif'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `master_pegawai_satpolpp_hst_${new Date().toISOString().slice(0, 10)}.csv`);
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
              <Users className="w-3.5 h-3.5 text-[#F0B429]" />
              DATA MASTER KEPEGAWAIAN
            </span>
            <span className="text-xs text-slate-500 font-medium">Satpol PP Kab. HST</span>
          </div>
          <h2 className="text-xl font-extrabold text-[#0F2A4A] mt-1.5 tracking-tight">
            Master Data Pegawai Satpol PP Kabupaten Hulu Sungai Tengah
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Database kepegawaian aparatur sipil Satpol PP & Damkar Kabupaten Hulu Sungai Tengah bersumber langsung dari Database Supabase (Live).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            Ekspor CSV
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-[#0F2A4A] hover:bg-[#14365D] text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F0B429]" />
            Tambah Pegawai
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Personel Satpol PP</span>
          <p className="text-2xl font-extrabold text-[#0F2A4A] mt-1 font-mono">{totalPegawai}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Aparatur Tercatat di HST</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status Kepegawaian</span>
          <p className="text-2xl font-extrabold text-blue-700 mt-1 font-mono">{countPns} PNS</p>
          <span className="text-[11px] text-slate-500 mt-1 block">{countPppk} PPPK / Tenaga Kontrak</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kualifikasi Pendidikan</span>
          <p className="text-2xl font-extrabold text-purple-700 mt-1 font-mono">{countS1} Sarjana</p>
          <span className="text-[11px] text-slate-500 mt-1 block">{countSma} SMA / Sederajat</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Keaktifan Personel</span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1 font-mono">{countAktif}</p>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% Siap Bertugas
          </span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
          {/* Search box */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama, NIP, pangkat, atau jabatan pegawai..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
            />
          </div>

          {/* Filter Status Kepegawaian */}
          <div className="sm:col-span-3">
            <select
              value={selectedStatusKepegawaian}
              onChange={(e) => setSelectedStatusKepegawaian(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white"
            >
              <option value="semua">Semua Status Kepegawaian</option>
              <option value="PNS">PNS (Pegawai Negeri Sipil)</option>
              <option value="PPPK">PPPK</option>
              <option value="Non-PNS">Non-PNS / Kontrak</option>
            </select>
          </div>

          {/* Filter Pendidikan */}
          <div className="sm:col-span-2">
            <select
              value={selectedPendidikan}
              onChange={(e) => setSelectedPendidikan(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white"
            >
              <option value="semua">Semua Pendidikan</option>
              <option value="S-1">Sarjana (S-1)</option>
              <option value="SMA">SMA / Sederajat</option>
            </select>
          </div>

          {/* Filter Status */}
          <div className="sm:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white"
            >
              <option value="semua">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 text-left border-r border-slate-200 w-12">No</th>
                <th className="py-3 px-4 border-r border-slate-200 min-w-[220px] text-left">Nama Lengkap & Pangkat</th>
                <th className="py-3 px-3.5 border-r border-slate-200 min-w-[170px] text-left">NIP Pegawai</th>
                <th className="py-3 px-4 border-r border-slate-200 min-w-[220px] text-left">Jabatan Kedinasan</th>
                <th className="py-3 px-3 border-r border-slate-200 min-w-[100px] text-center">Status Peg.</th>
                <th className="py-3 px-3 border-r border-slate-200 min-w-[90px] text-center">Pendidikan</th>
                <th className="py-3 px-3.5 border-r border-slate-200 min-w-[140px] text-left">Kontak / HP</th>
                <th className="py-3 px-3 border-r border-slate-200 min-w-[80px] text-center">Status</th>
                <th className="py-3 px-3.5 min-w-[170px] text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    Tidak ada data pegawai yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => {
                  const isAktif = (item.status || 'Aktif') === 'Aktif';

                  return (
                    <tr key={item.id || idx} className="hover:bg-amber-50/40 transition-colors">
                      {/* No */}
                      <td className="py-3 px-3 text-left font-mono font-bold text-slate-600 border-r border-slate-200">
                        {idx + 1}
                      </td>

                      {/* Nama & Pangkat */}
                      <td className="py-3 px-4 border-r border-slate-200 text-left">
                        <div>
                          <span className="font-bold text-[#0F2A4A] text-sm block leading-snug">{item.nama}</span>
                          <span className="text-[11px] text-slate-500 font-medium">{item.pangkat || '-'}</span>
                        </div>
                      </td>

                      {/* NIP */}
                      <td className="py-3 px-3.5 border-r border-slate-200 font-mono text-slate-700 text-xs text-left">
                        {item.nip}
                      </td>

                      {/* Jabatan */}
                      <td className="py-3 px-4 border-r border-slate-200 font-semibold text-slate-800 text-left leading-snug">
                        {item.jabatan}
                      </td>

                      {/* Status Kepegawaian */}
                      <td className="py-3 px-3 border-r border-slate-200 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {item.statusKepegawaian || 'PNS'}
                        </span>
                      </td>

                      {/* Pendidikan */}
                      <td className="py-3 px-3 border-r border-slate-200 text-center font-semibold text-slate-700">
                        {item.pendidikan || 'S-1'}
                      </td>

                      {/* Kontak */}
                      <td className="py-3 px-3.5 border-r border-slate-200 text-left">
                        {item.noHp ? (
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{item.noHp}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 border-r border-slate-200 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isAktif 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {item.status || 'Aktif'}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleMove(item.id, -1)}
                            disabled={isFiltering || idx === 0}
                            className="p-1.5 text-slate-500 hover:text-[#0F2A4A] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title={isFiltering ? 'Hapus filter/pencarian untuk mengatur urutan' : 'Naikkan urutan'}
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleMove(item.id, 1)}
                            disabled={isFiltering || idx === filtered.length - 1}
                            className="p-1.5 text-slate-500 hover:text-[#0F2A4A] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title={isFiltering ? 'Hapus filter/pencarian untuk mengatur urutan' : 'Turunkan urutan'}
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDetailPegawai(item)}
                            className="p-1.5 text-slate-500 hover:text-[#0F2A4A] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Lihat Detail Profil Pegawai"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Data Pegawai"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(item.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Pegawai"
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
          <span>Menampilkan {filtered.length} dari {pegawaiList.length} total personel Satpol PP Kabupaten Hulu Sungai Tengah</span>
          <span className="font-semibold text-[#0F2A4A]">Satuan Polisi Pamong Praja & Damkar Kab. Hulu Sungai Tengah</span>
        </div>
      </div>

      {/* MODAL TAMBAH / EDIT PEGAWAI */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPegawai ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}
        subtitle="Kelola identitas personel, pangkat/golongan, dan jabatan kedinasan Satpol PP HST"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar *</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Drs. Ahmad Fathoni"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">NIP (Nomor Induk Pegawai) *</label>
              <input
                type="text"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="19720217 199203 1 006"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden font-mono"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
              <select
                value={jk}
                onChange={(e) => setJk(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white"
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pangkat / Golongan</label>
              <input
                type="text"
                value={pangkat}
                onChange={(e) => setPangkat(e.target.value)}
                placeholder="Pembina Utama Muda / IV / c"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status Kepegawaian</label>
              <select
                value={statusKepegawaian}
                onChange={(e) => setStatusKepegawaian(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white font-bold"
              >
                <option value="PNS">PNS (Pegawai Negeri Sipil)</option>
                <option value="PPPK">PPPK</option>
                <option value="Non-PNS">Non-PNS / Kontrak</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Jabatan Kedinasan *</label>
              <input
                type="text"
                value={jabatan}
                onChange={(e) => setJabatan(e.target.value)}
                placeholder="Contoh: Kepala Satuan"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pendidikan Terakhir</label>
              <select
                value={pendidikan}
                onChange={(e) => setPendidikan(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white"
              >
                <option value="S-1">S-1 (Sarjana)</option>
                <option value="S-2">S-2 (Magister)</option>
                <option value="D-3">D-3 (Diploma)</option>
                <option value="SMA">SMA / Sederajat</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp / HP</label>
              <input
                type="tel"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                placeholder="0821xxxxxxxx"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Kedinasan</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@satpolpp.hulusungaitengahkab.go.id"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Status Keaktifan</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white"
            >
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
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
              className="px-5 py-2 bg-[#0F2A4A] hover:bg-[#14365D] text-white font-bold rounded-xl shadow-xs"
            >
              {editingPegawai ? 'Simpan Perubahan' : 'Tambah Pegawai'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL DETAIL PEGAWAI */}
      {detailPegawai && (
        <Modal
          isOpen={Boolean(detailPegawai)}
          onClose={() => setDetailPegawai(null)}
          title="Detail Biodata Pegawai Satpol PP"
          subtitle="Lembar data aparatur Satpol PP & Damkar Kab. Hulu Sungai Tengah"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#0F2A4A] text-white flex items-center justify-center font-bold text-lg">
                {detailPegawai.nama.charAt(0)}
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">{detailPegawai.nama}</h4>
                <p className="text-slate-500 font-mono text-[11px]">{detailPegawai.nip}</p>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 mt-1">
                  {detailPegawai.statusKepegawaian || 'PNS'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Pangkat / Golongan</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{detailPegawai.pangkat || '-'}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Jenis Kelamin</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{detailPegawai.jk || 'Laki-laki'}</span>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Jabatan Kedinasan</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">{detailPegawai.jabatan}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Pendidikan Terakhir</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{detailPegawai.pendidikan || 'S-1'}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">No. WhatsApp / HP</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{detailPegawai.noHp || '-'}</span>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Wilayah Penugasan</span>
              <span className="font-bold text-slate-800 mt-0.5 block">{detailPegawai.wilayahTugas || 'Kabupaten Hulu Sungai Tengah'}</span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDetailPegawai(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h4 className="font-bold text-slate-900 text-base">Hapus Data Pegawai?</h4>
            </div>
            <p className="text-xs text-slate-600">
              Apakah Anda yakin ingin menghapus personel ini dari master data kepegawaian Satpol PP HST? Tindakan ini akan menghapus data di database.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
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