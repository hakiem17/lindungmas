import React, { useState } from 'react';
import { 
  Users, 
  AlertTriangle, 
  FileCheck, 
  ShieldAlert, 
  MapPin, 
  TrendingUp, 
  Download, 
  Calendar, 
  Printer,
  FileSpreadsheet
} from 'lucide-react';
import StatCard from '../common/StatCard';
import { StageBadge } from '../common/Badge';

export default function DashboardEksekutif({ 
  pelanggaranList, 
  pelanggarList, 
  patroliList, 
  pengaduanList,
  onNavigateTab,
  onSelectPelanggaran
}) {
  // Aggregate calculations
  const totalPelanggaran = pelanggaranList.length;
  const countPernyataan = pelanggaranList.filter(p => p.statusTindakLanjut === 'pernyataan').length;
  const countSP1 = pelanggaranList.filter(p => p.statusTindakLanjut === 'sp1').length;
  const countSP2 = pelanggaranList.filter(p => p.statusTindakLanjut === 'sp2').length;
  const countSP3 = pelanggaranList.filter(p => p.statusTindakLanjut === 'sp3').length;
  const countEksekusi = pelanggaranList.filter(p => p.statusTindakLanjut === 'eksekusi').length;
  const countSelesai = pelanggaranList.filter(p => p.isSelesai || p.statusTindakLanjut === 'selesai').length;

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Export Actions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#0F2A4A] text-white">
              KABUPATEN HULU SUNGAI TENGAH
            </span>
            <span className="text-xs text-slate-500">Pembaruan Realtime</span>
          </div>
          <h2 className="text-xl font-extrabold text-[#0F2A4A] mt-1.5 tracking-tight">
            Dashboard Eksekutif & Pemantauan Trantibum
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sistem Informasi Penegakan Peraturan Daerah & Peraturan Kepala Daerah Satpol PP HST
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigateTab('register_pengaduan')}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Rekap Pengaduan & Tindak Lanjut Trantibum</span>
          </button>
          <button
            onClick={handlePrintReport}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak Rekap</span>
          </button>
          <button
            onClick={() => onNavigateTab('input')}
            className="px-4 py-2 bg-[#0F2A4A] hover:bg-[#14365D] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#0F2A4A]/20 transition-all cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4 text-[#F0B429]" />
            <span>Input Kasus Baru</span>
          </button>
        </div>
      </div>

      {/* KPI TILES (STAT CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Kasus Tercatat"
          value={totalPelanggaran}
          subtitle="Tercatat di 11 Kecamatan"
          icon={ShieldAlert}
          color="navy"
          badgeText="+12% bln ini"
          badgeColor="emerald"
        />
        <StatCard
          title="Tahap SP3 & Eksekusi"
          value={countSP3 + countEksekusi}
          subtitle="Tindakan pembongkaran/sitaan"
          icon={AlertTriangle}
          color="red"
          badgeText="Prioritas Tinggi"
          badgeColor="red"
        />
        <StatCard
          title="Pelanggar Residivis"
          value={pelanggarList.filter(p => p.totalKasus > 1).length}
          subtitle="Pelanggaran berulang (NIK sama)"
          icon={Users}
          color="amber"
          badgeText="Pengawasan Ketat"
          badgeColor="amber"
        />
        <StatCard
          title="Kasus Selesai / Taat"
          value={countSelesai}
          subtitle="Komitmen ditaati tanpa paksa"
          icon={FileCheck}
          color="emerald"
          badgeText="Tuntas"
          badgeColor="emerald"
        />
      </div>

      {/* BREAKDOWN TAHAP SANKSI & PERDA PALING SERING DILANGGAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Breakdown Tahap Berjenjang (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-[#0F2A4A] text-sm">Distribusi Status Tindak Lanjut Berjenjang</h3>
              <p className="text-xs text-slate-500">Tahapan sanksi administratif aktif saat ini</p>
            </div>
            <span className="text-xs font-bold text-slate-500 font-mono">{totalPelanggaran} Berkas Aktif</span>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Tahap Pernyataan (Komitmen 1)', count: countPernyataan, color: 'bg-amber-400', pct: 35 },
              { label: 'Peringatan Pertama (SP1)', count: countSP1, color: 'bg-amber-500', pct: 25 },
              { label: 'Peringatan Kedua (SP2)', count: countSP2, color: 'bg-orange-500', pct: 15 },
              { label: 'Peringatan Ketiga (SP3)', count: countSP3, color: 'bg-red-500', pct: 10 },
              { label: 'Eksekusi Lapangan / Bongkar', count: countEksekusi, color: 'bg-rose-900', pct: 5 },
              { label: 'Selesai & Tertib', count: countSelesai, color: 'bg-emerald-500', pct: 10 }
            ].map((step, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700">{step.label}</span>
                  <span className="text-slate-900 font-mono">{step.count} Kasus ({Math.round((step.count / (totalPelanggaran || 1)) * 100)}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${step.color} transition-all duration-500`}
                    style={{ width: `${Math.max(8, (step.count / (totalPelanggaran || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Sesuai SOP Penegakan Perda No. 04 Tahun 2021</span>
            <button 
              onClick={() => onNavigateTab('rekap')}
              className="text-blue-600 font-bold hover:underline"
            >
              Buka Semua di Rekap Kasus →
            </button>
          </div>
        </div>

        {/* Top Perda Dilanggar (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-[#0F2A4A] text-sm">Top Perda HST Paling Dilanggar</h3>
              <p className="text-xs text-slate-500">Frekuensi pelanggaran regulasi daerah</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { perda: 'Perda 04/2021 (Pasal 12)', nama: 'Ketertiban PKL & Bahu Jalan', count: 18, color: 'text-amber-700 bg-amber-50' },
              { perda: 'Perda 06/2019 (Pasal 14)', nama: 'Reklame & Baliho Liar Tanpa Izin', count: 11, color: 'text-blue-700 bg-blue-50' },
              { perda: 'Perda 04/2021 (Pasal 18)', nama: 'Kebersihan & Buang Sampah Saluran', count: 9, color: 'text-purple-700 bg-purple-50' },
              { perda: 'Perda 02/2020 (Pasal 5)', nama: 'Kawasan Tanpa Rokok (KTR RSUD)', count: 6, color: 'text-emerald-700 bg-emerald-50' },
              { perda: 'Perda 08/2018 (Pasal 7)', nama: 'Pengawasan Minuman Beralkohol', count: 3, color: 'text-red-700 bg-red-50' }
            ].map((p, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs">
                <div>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${p.color}`}>{p.perda}</span>
                  <p className="font-semibold text-slate-800 mt-1">{p.nama}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-extrabold text-[#0F2A4A] text-sm">{p.count}</span>
                  <span className="text-[10px] text-slate-400 block">temuan</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RECENT INCIDENTS ROW */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-[#0F2A4A] text-sm">Temuan Pelanggaran Terkini</h3>
            <p className="text-xs text-slate-500">5 kasus terbaru yang ditangani regu patroli dan verifikasi laporan</p>
          </div>
          <button 
            onClick={() => onNavigateTab('rekap')}
            className="text-xs font-bold text-[#0F2A4A] hover:text-[#14365D]"
          >
            Lihat Rekap Lengkap →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pelanggaranList.slice(0, 3).map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectPelanggaran(item)}
              className="p-4 rounded-xl border border-slate-200 hover:border-[#0F2A4A] hover:bg-amber-50/30 transition-all cursor-pointer space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-[#0F2A4A]">{item.nomorRegister}</span>
                <StageBadge stage={item.statusTindakLanjut} />
              </div>
              <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{item.namaPelanggar}</h4>
              <p className="text-slate-600 text-[11px] line-clamp-2">{item.deskripsi}</p>
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                <span>Kec. {item.kecamatan}</span>
                <span>{item.tanggal}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

