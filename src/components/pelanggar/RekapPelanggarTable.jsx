import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  FileText, 
  Download, 
  AlertCircle, 
  ChevronRight, 
  ShieldCheck, 
  Layers 
} from 'lucide-react';
import { KECAMATAN_HST } from '../../data/mockData';
import { StageBadge, SourceBadge } from '../common/Badge';

export default function RekapPelanggarTable({ pelanggaranList, onSelectPelanggaran }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKecamatan, setSelectedKecamatan] = useState('semua');
  const [selectedStatus, setSelectedStatus] = useState('semua');

  // Filter list
  const filtered = pelanggaranList.filter(item => {
    const matchSearch = 
      item.namaPelanggar.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nik.includes(searchTerm) ||
      item.nomorRegister.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.alamat.toLowerCase().includes(searchTerm.toLowerCase());

    const matchKecamatan = selectedKecamatan === 'semua' || item.kecamatan === selectedKecamatan;
    const matchStatus = selectedStatus === 'semua' || item.statusTindakLanjut === selectedStatus;

    return matchSearch && matchKecamatan && matchStatus;
  });

  const handleExportCSV = () => {
    const headers = ['Nomor Register', 'Nama Pelanggar', 'NIK', 'Kecamatan', 'Lokasi', 'Tahap Tindak Lanjut', 'Tanggal Kejadian'];
    const rows = filtered.map(item => [
      `"${item.nomorRegister}"`,
      `"${item.namaPelanggar}"`,
      `"${item.nik}"`,
      `"${item.kecamatan}"`,
      `"${item.lokasiNama || item.alamat}"`,
      `"${item.statusTindakLanjut.toUpperCase()}"`,
      `"${item.tanggal}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_pelanggaran_satpolpp_hst_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
      {/* Table Header & Controls */}
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#0F2A4A] tracking-tight">
              Level 1 — Rekap Pelanggar & Tindak Lanjut
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0F2A4A] text-white">
              {filtered.length} Kasus
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Klik baris pelanggar untuk membuka <b>Level 2 (Detail Riwayat & Stepper Sanksi)</b>
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="px-5 grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search Input */}
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari NIK, nama, register, atau lokasi..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
          />
        </div>

        {/* Kecamatan Filter */}
        <div className="sm:col-span-4">
          <select
            value={selectedKecamatan}
            onChange={(e) => setSelectedKecamatan(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white"
          >
            <option value="semua">Semua Kecamatan (11 Kecamatan HST)</option>
            {KECAMATAN_HST.map(k => (
              <option key={k.id} value={k.nama}>{k.nama}</option>
            ))}
          </select>
        </div>

        {/* Status Stage Filter */}
        <div className="sm:col-span-3">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white"
          >
            <option value="semua">Semua Tahap Sanksi</option>
            <option value="pernyataan">Tahap Pernyataan</option>
            <option value="sp1">Peringatan 1 (SP1)</option>
            <option value="sp2">Peringatan 2 (SP2)</option>
            <option value="sp3">Peringatan 3 (SP3)</option>
            <option value="eksekusi">Eksekusi / Bongkar</option>
            <option value="selesai">Selesai / Taat</option>
          </select>
        </div>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/70 border-y border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Register / Tgl</th>
              <th className="py-3 px-4">Pelanggar (NIK)</th>
              <th className="py-3 px-4">Lokasi Terakhir</th>
              <th className="py-3 px-4">Tahapan Sanksi</th>
              <th className="py-3 px-4">Sumber</th>
              <th className="py-3 px-4 text-center">Aksi Level 2</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="w-8 h-8 text-slate-300" />
                    <p className="font-medium text-slate-500">Tidak ada data pelanggaran yang sesuai filter.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr 
                  key={item.id}
                  onClick={() => onSelectPelanggaran(item)}
                  className="hover:bg-amber-50/40 transition-colors cursor-pointer group"
                >
                  {/* Register & Date */}
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                    <div className="font-bold text-[#0F2A4A] group-hover:text-blue-700">{item.nomorRegister}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{item.tanggal}</div>
                  </td>

                  {/* Pelanggar & NIK */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 text-sm group-hover:text-[#0F2A4A]">{item.namaPelanggar}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">NIK: {item.nik}</div>
                  </td>

                  {/* Location */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="font-semibold text-slate-800 line-clamp-1">{item.lokasiNama || item.alamat}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Kec. {item.kecamatan}</div>
                  </td>

                  {/* Stage Badge */}
                  <td className="py-3.5 px-4">
                    <StageBadge stage={item.statusTindakLanjut} />
                    <div className="text-[10px] text-slate-400 mt-1">
                      {item.tindakLanjutList?.length || 1} surat diterbitkan
                    </div>
                  </td>

                  {/* Source */}
                  <td className="py-3.5 px-4">
                    <SourceBadge source={item.sumber} />
                  </td>

                  {/* Action Link */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPelanggaran(item);
                      }}
                      className="px-3 py-1.5 bg-[#0F2A4A] group-hover:bg-[#F0B429] text-white group-hover:text-[#0F2A4A] rounded-lg font-bold text-xs inline-flex items-center gap-1 transition-all shadow-xs"
                    >
                      <span>Detail Riwayat</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
        <span>Menampilkan {filtered.length} dari {pelanggaranList.length} total catatan</span>
        <span className="font-medium text-[#0F2A4A]">Satpol PP Hulu Sungai Tengah</span>
      </div>
    </div>
  );
}

