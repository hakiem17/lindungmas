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
  X
} from 'lucide-react';
import Modal from '../common/Modal';
import { savePegawai, deletePegawai } from '../../data/storageService';

export default function MasterPegawai({ pegawaiList, onRefreshData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeran, setSelectedPeran] = useState('semua');
  const [selectedRegu, setSelectedRegu] = useState('semua');
  const [selectedStatus, setSelectedStatus] = useState('semua');

  // Modal State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPegawai, setEditingPegawai] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form State
  const [nama, setNama] = useState('');
  const [nip, setNip] = useState('');
  const [pangkat, setPangkat] = useState('Pengatur (II/c)');
  const [jabatan, setJabatan] = useState('');
  const [regu, setRegu] = useState('Regu I (Kijang 01)');
  const [peran, setPeran] = useState('user');
  const [noHp, setNoHp] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('Aktif');

  // Filter list
  const filtered = pegawaiList.filter(item => {
    const matchSearch = 
      item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.jabatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.regu && item.regu.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchPeran = selectedPeran === 'semua' || item.peran === selectedPeran;
    const matchRegu = selectedRegu === 'semua' || item.regu === selectedRegu;
    const matchStatus = selectedStatus === 'semua' || item.status === selectedStatus;

    return matchSearch && matchPeran && matchRegu && matchStatus;
  });

  // Calculate statistics
  const totalPegawai = pegawaiList.length;
  const countAdmin = pegawaiList.filter(p => p.peran === 'admin').length;
  const countUser = pegawaiList.filter(p => p.peran === 'user').length;
  const countAktif = pegawaiList.filter(p => p.status === 'Aktif').length;

  const handleOpenAdd = () => {
    setEditingPegawai(null);
    setNama('');
    setNip('');
    setPangkat('Pengatur (II/c)');
    setJabatan('Petugas Lapangan Trantibum');
    setRegu('Regu I (Kijang 01)');
    setPeran('user');
    setNoHp('');
    setEmail('');
    setStatus('Aktif');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (peg) => {
    setEditingPegawai(peg);
    setNama(peg.nama || '');
    setNip(peg.nip || '');
    setPangkat(peg.pangkat || '');
    setJabatan(peg.jabatan || '');
    setRegu(peg.regu || 'Regu I (Kijang 01)');
    setPeran(peg.peran || 'user');
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
      nama,
      nip,
      pangkat,
      jabatan,
      regu,
      peran,
      noHp,
      email,
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
    const headers = ['No', 'Nama Pegawai', 'NIP', 'Pangkat/Gol', 'Jabatan', 'Regu Penugasan', 'Peran Sistem', 'No. HP', 'Email', 'Status'];
    const rows = filtered.map((item, idx) => [
      `"${idx + 1}"`,
      `"${item.nama}"`,
      `"${item.nip}"`,
      `"${item.pangkat || '-'}"`,
      `"${item.jabatan}"`,
      `"${item.regu || '-'}"`,
      `"${item.peran.toUpperCase()}"`,
      `"${item.noHp || '-'}"`,
      `"${item.email || '-'}"`,
      `"${item.status}"`
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
              MASTER DATA KEPEGAWAIAN
            </span>
            <span className="text-xs text-slate-500 font-medium">Satpol PP Kab. HST</span>
          </div>
          <h2 className="text-xl font-extrabold text-[#0F2A4A] mt-1.5 tracking-tight">
            Data Pegawai & Personel Operasional
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar lengkap aparatur Satpol PP, kepala regu, serta petugas lapangan penegak Perda di Hulu Sungai Tengah
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
            <span>Tambah Pegawai Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Personel</span>
          <p className="text-2xl font-extrabold text-[#0F2A4A] mt-1 font-mono">{totalPegawai}</p>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> {countAktif} Personel Aktif
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Petugas Lapangan (User)</span>
          <p className="text-2xl font-extrabold text-blue-700 mt-1 font-mono">{countUser}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Regu Patroli & Tim Tindak</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pimpinan & Penegakan (Admin)</span>
          <p className="text-2xl font-extrabold text-purple-700 mt-1 font-mono">{countAdmin}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Verifikator & Pejabat Penegak</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Unit Operasional</span>
          <p className="text-2xl font-extrabold text-amber-600 mt-1 font-mono">4 Regu</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Kijang 01, 02, Penegakan, Mako</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
          {/* Search box */}
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama, NIP, atau jabatan pegawai..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
            />
          </div>

          {/* Filter Peran */}
          <div className="sm:col-span-3">
            <select
              value={selectedPeran}
              onChange={(e) => setSelectedPeran(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white"
            >
              <option value="semua">Semua Peran Sistem</option>
              <option value="admin">Admin (Pimpinan / Penegakan)</option>
              <option value="user">User (Petugas Lapangan)</option>
            </select>
          </div>

          {/* Filter Regu */}
          <div className="sm:col-span-3">
            <select
              value={selectedRegu}
              onChange={(e) => setSelectedRegu(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white"
            >
              <option value="semua">Semua Regu Penugasan</option>
              <option value="Regu I (Kijang 01)">Regu I (Kijang 01)</option>
              <option value="Regu II (Kijang 02)">Regu II (Kijang 02)</option>
              <option value="Regu Penegakan Perda">Regu Penegakan Perda</option>
              <option value="Pimpinan & Sekretariat">Pimpinan & Sekretariat</option>
              <option value="Regu Tindak Cepat">Regu Tindak Cepat</option>
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
                <th className="py-3 px-3.5 border-r border-slate-200 min-w-[150px] text-left">NIP Pegawai</th>
                <th className="py-3 px-4 border-r border-slate-200 min-w-[190px] text-left">Jabatan Kedinasan</th>
                <th className="py-3 px-3.5 border-r border-slate-200 min-w-[160px] text-left">Regu / Penugasan</th>
                <th className="py-3 px-3 border-r border-slate-200 min-w-[90px] text-left">Hak Akses</th>
                <th className="py-3 px-3.5 border-r border-slate-200 min-w-[150px] text-left">Kontak</th>
                <th className="py-3 px-3 border-r border-slate-200 min-w-[80px] text-left">Status</th>
                <th className="py-3 px-3.5 min-w-[110px] text-center">Aksi</th>
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
                  const isAdmin = item.peran === 'admin';
                  const isAktif = item.status === 'Aktif';

                  return (
                    <tr key={item.id} className="hover:bg-amber-50/40 transition-colors">
                      {/* No */}
                      <td className="py-3 px-3 text-left font-mono font-bold text-slate-600 border-r border-slate-200">
                        {idx + 1}
                      </td>

                      {/* Nama & Foto */}
                      <td className="py-3 px-4 border-r border-slate-200 text-left">
                        <div className="flex items-center gap-3">
                          <img 
                            src={item.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'} 
                            alt={item.nama} 
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-[#0F2A4A] text-sm block leading-snug">{item.nama}</span>
                            <span className="text-[11px] text-slate-500 font-medium">{item.pangkat || '-'}</span>
                          </div>
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

                      {/* Regu */}
                      <td className="py-3 px-3.5 border-r border-slate-200 text-left">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {item.regu || 'Sekretariat'}
                        </span>
                      </td>

                      {/* Hak Akses / Peran */}
                      <td className="py-3 px-3 border-r border-slate-200 text-left">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isAdmin 
                            ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          <ShieldCheck className="w-3 h-3" />
                          {isAdmin ? 'ADMIN' : 'USER'}
                        </span>
                      </td>

                      {/* Kontak */}
                      <td className="py-3 px-3.5 border-r border-slate-200 text-left">
                        <div className="space-y-0.5 text-[11px]">
                          {item.noHp && (
                            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                              <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{item.noHp}</span>
                            </div>
                          )}
                          {item.email && (
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[130px]">{item.email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 border-r border-slate-200 text-left">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isAktif 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {item.status}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Data Pegawai"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(item.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
          <span>Menampilkan {filtered.length} dari {pegawaiList.length} total pegawai terdaftar</span>
          <span className="font-semibold text-[#0F2A4A]">Satuan Polisi Pamong Praja Kab. Hulu Sungai Tengah</span>
        </div>
      </div>

      {/* MODAL TAMBAH / EDIT PEGAWAI */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPegawai ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}
        subtitle="Kelola identitas personel, regu, dan hak akses operasional Satpol PP HST"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar *</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Drs. H. Subhan, M.Si"
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
                placeholder="19740815 199603 1 002"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden font-mono"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pangkat / Golongan Ruang</label>
              <select
                value={pangkat}
                onChange={(e) => setPangkat(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white"
              >
                <option value="Pembina Utama Muda (IV/c)">Pembina Utama Muda (IV/c)</option>
                <option value="Pembina Tingkat I (IV/b)">Pembina Tingkat I (IV/b)</option>
                <option value="Pembina (IV/a)">Pembina (IV/a)</option>
                <option value="Penata Tingkat I (III/d)">Penata Tingkat I (III/d)</option>
                <option value="Penata (III/c)">Penata (III/c)</option>
                <option value="Penata Muda Tingkat I (III/b)">Penata Muda Tingkat I (III/b)</option>
                <option value="Penata Muda (III/a)">Penata Muda (III/a)</option>
                <option value="Pengatur Tingkat I (II/d)">Pengatur Tingkat I (II/d)</option>
                <option value="Pengatur (II/c)">Pengatur (II/c)</option>
                <option value="Pengatur Muda Tingkat I (II/b)">Pengatur Muda Tingkat I (II/b)</option>
                <option value="Pengatur Muda (II/a)">Pengatur Muda (II/a)</option>
                <option value="Tenaga Honorer / Kontrak">Tenaga Honorer / Kontrak</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Jabatan Kedinasan *</label>
            <input
              type="text"
              value={jabatan}
              onChange={(e) => setJabatan(e.target.value)}
              placeholder="Contoh: Petugas Lapangan Trantibum"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Regu / Penugasan</label>
              <select
                value={regu}
                onChange={(e) => setRegu(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white"
              >
                <option value="Regu I (Kijang 01)">Regu I (Kijang 01)</option>
                <option value="Regu II (Kijang 02)">Regu II (Kijang 02)</option>
                <option value="Regu Penegakan Perda">Regu Penegakan Perda</option>
                <option value="Pimpinan & Sekretariat">Pimpinan & Sekretariat</option>
                <option value="Regu Tindak Cepat">Regu Tindak Cepat</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hak Akses Sistem (Peran)</label>
              <select
                value={peran}
                onChange={(e) => setPeran(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white font-bold"
              >
                <option value="user">User (Petugas Lapangan)</option>
                <option value="admin">Admin (Pimpinan / Penegakan)</option>
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
                placeholder="0812xxxxxxxx"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Kedinasan</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@hulusungaitengahkab.go.id"
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

      {/* MODAL KONFIRMASI HAPUS */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h4 className="font-bold text-slate-900 text-base">Hapus Data Pegawai?</h4>
            </div>
            <p className="text-xs text-slate-600">
              Apakah Anda yakin ingin menghapus personel ini dari daftar master pegawai Satpol PP HST? Tindakan ini tidak dapat dibatalkan.
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

