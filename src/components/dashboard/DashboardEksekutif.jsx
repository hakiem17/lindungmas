import React, { useState, useMemo } from 'react';
import { 
  Users, 
  MapPin, 
  Radio, 
  Car, 
  ShieldCheck, 
  Compass, 
  ExternalLink, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Building2, 
  Printer, 
  IdCard, 
  FileText,
  Search,
  PlusCircle,
  Eye,
  Shield,
  Phone,
  Layers,
  Sparkles,
  ArrowRight,
  Filter,
  Download
} from 'lucide-react';
import StatCard from '../common/StatCard';
import Modal from '../common/Modal';
import { KECAMATAN_HST } from '../../data/mockData';
import { getAuditLogs } from '../../data/storageService';

export default function DashboardEksekutif({ 
  satlinmasList = [], 
  poskamlingList = [], 
  kegiatanPatroliList = [], 
  wilayahList = KECAMATAN_HST,
  assignedKecamatan = null,
  currentUser = null,
  activeRole = 'admin_kabupaten',
  onNavigateTab
}) {
  const isAdmin = activeRole === 'admin_kabupaten' || activeRole === 'admin';
  const isOperator = activeRole === 'operator_kecamatan' || activeRole === 'operator';

  // Audit Logs State for Admin Kabupaten
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditFilterAksi, setAuditFilterAksi] = useState('semua');
  const auditLogs = useMemo(() => getAuditLogs(), [isAuditModalOpen]);

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchSearch = 
        (log.aktor || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
        (log.target || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
        (log.modul || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
        (log.detail || '').toLowerCase().includes(auditSearch.toLowerCase());
      const matchAksi = auditFilterAksi === 'semua' || (log.aksi || '').toLowerCase() === auditFilterAksi.toLowerCase();
      return matchSearch && matchAksi;
    });
  }, [auditLogs, auditSearch, auditFilterAksi]);

  // Data scoping based on assigned kecamatan for operator
  const effectiveSatlinmas = useMemo(() => {
    if (!assignedKecamatan) return satlinmasList;
    return satlinmasList.filter(s => (s.kecamatan || '').toLowerCase() === assignedKecamatan.toLowerCase());
  }, [satlinmasList, assignedKecamatan]);

  const effectivePoskamling = useMemo(() => {
    if (!assignedKecamatan) return poskamlingList;
    return poskamlingList.filter(p => (p.kecamatan || '').toLowerCase() === assignedKecamatan.toLowerCase());
  }, [poskamlingList, assignedKecamatan]);

  const effectivePatroli = useMemo(() => {
    if (!assignedKecamatan) return kegiatanPatroliList;
    return kegiatanPatroliList.filter(p => (p.kecamatan || '').toLowerCase() === assignedKecamatan.toLowerCase());
  }, [kegiatanPatroliList, assignedKecamatan]);

  // Total counts
  const totalSatlinmas = effectiveSatlinmas.length;
  const satlinmasAktif = effectiveSatlinmas.filter(s => s.status === 'aktif').length;
  const totalPoskamling = effectivePoskamling.length;
  const poskamlingAktif = effectivePoskamling.filter(p => (p.statusOperasional || '').includes('Aktif')).length;
  const totalPatroli = effectivePatroli.length;
  const patroliAman = effectivePatroli.filter(p => (p.statusSituasi || '').includes('Aman')).length;

  // Fasilitas Poskamling Counts across scoped poskamling
  const fasilitasStats = useMemo(() => {
    const counts = {
      'Kentongan Kayu / Bambu': 0,
      'Buku Mutasi Tamu': 0,
      'Senter LED Sorot': 0,
      'Kotak P3K Lengkap': 0,
      'Rompi / Jas Hujan Linmas': 0,
      'Alat Pemadam / Ember / APAR': 0,
      'Radio Komunikasi / HT': 0,
      'Lampu Panel Surya': 0
    };

    effectivePoskamling.forEach(pos => {
      (pos.fasilitas || []).forEach(f => {
        if (counts[f] !== undefined) {
          counts[f] += 1;
        }
      });
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      pct: totalPoskamling > 0 ? Math.round((count / totalPoskamling) * 100) : 0
    }));
  }, [effectivePoskamling, totalPoskamling]);

  // Sebaran per Kecamatan
  const kecamatanBreakdown = useMemo(() => {
    return wilayahList.map(kec => {
      const kecName = kec.nama.toLowerCase();
      const posCount = poskamlingList.filter(p => (p.kecamatan || '').toLowerCase() === kecName).length;
      const patCount = kegiatanPatroliList.filter(p => (p.kecamatan || '').toLowerCase() === kecName).length;
      const linCount = satlinmasList.filter(s => (s.kecamatan || '').toLowerCase() === kecName).length;
      const total = posCount + patCount + linCount;

      return {
        nama: kec.nama,
        posCount,
        patCount,
        linCount,
        total
      };
    }).sort((a, b) => b.total - a.total);
  }, [wilayahList, poskamlingList, kegiatanPatroliList, satlinmasList]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & QUICK ACTIONS */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#0F2A4A] text-[#F0B429]">
              PEMKAB HULU SUNGAI TENGAH
            </span>
            <span className="text-xs text-slate-500 font-medium">Satpol PP & Damkar &bull; Bidang Linmas</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F2A4A] mt-1.5 tracking-tight">
            Dashboard Utama LINDUNGMAS HST
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Layanan Informasi dan Data Perlindungan Masyarakat Terpadu Kabupaten Hulu Sungai Tengah
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsAuditModalOpen(true)}
              className="px-3.5 py-2 bg-[#0F2A4A] hover:bg-[#16365C] text-[#F0B429] border border-[#F0B429]/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Rekam jejak tindakan penting di seluruh HST (Audit Trail)"
            >
              <FileText className="w-4 h-4 text-[#F0B429]" />
              <span>Log Audit ({auditLogs.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigateTab('kartu_anggota')}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <IdCard className="w-4 h-4 text-amber-700" />
            <span>Cetak KTA Satlinmas</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak Ringkasan</span>
          </button>
        </div>
      </div>

      {/* OPERATOR TERRITORY BANNER */}
      {assignedKecamatan && (
        <div className="bg-gradient-to-r from-[#0F2A4A] via-[#16365C] to-[#0A1A2E] p-4 rounded-2xl text-white border border-[#F0B429]/30 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F0B429]/20 border border-[#F0B429]/40 flex items-center justify-center text-[#F0B429] shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  Mode Operator Kecamatan
                </span>
                <span className="text-xs font-bold text-[#F0B429]">Wilayah Binaan: Kecamatan {assignedKecamatan}</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Statistik dan data dibatasi khusus personil, pos ronda, dan kegiatan patroli di wilayah Kecamatan {assignedKecamatan}.
              </p>
            </div>
          </div>
          <div className="text-right sm:border-l sm:border-white/10 sm:pl-4">
            <p className="text-[11px] text-slate-400">Operator Bertugas:</p>
            <p className="text-xs font-bold text-white">{currentUser?.nama || 'Petugas Operator'}</p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TOP KPI STAT CARDS (4 PILAR DATA LINMAS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Personel Satlinmas"
          value={totalSatlinmas}
          subtitle={`${satlinmasAktif} Anggota Aktif Terdata`}
          icon={ShieldCheck}
          color="navy"
          badgeText="17 Kolom Baku"
          badgeColor="emerald"
        />
        <StatCard
          title="Data Poskamling"
          value={totalPoskamling}
          subtitle={`${poskamlingAktif} Pos Ronda Beroperasi Tiap Malam`}
          icon={Radio}
          color="amber"
          badgeText="Titik Koordinat GIS"
          badgeColor="amber"
        />
        <StatCard
          title="Kegiatan Patroli"
          value={totalPatroli}
          subtitle={`${patroliAman} Laporan Situasi Aman & Kondusif`}
          icon={Car}
          color="emerald"
          badgeText="GPS Live Terkunci"
          badgeColor="emerald"
        />
        <StatCard
          title="Cakupan Wilayah HST"
          value="11 Kecamatan"
          subtitle="169 Desa & Kelurahan Terlayani"
          icon={Building2}
          color="blue"
          badgeText="Bumi Murakata"
          badgeColor="blue"
        />
      </div>

      {/* ========================================================================= */}
      {/* 3. PINTASAN CEPAT MENU OPERASIONAL LINMAS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => onNavigateTab('satlinmas')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-[#0F2A4A] hover:shadow-md transition-all cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#0F2A4A] text-[#F0B429] flex items-center justify-center font-bold shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0F2A4A] group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h4 className="font-extrabold text-[#0F2A4A] text-sm group-hover:text-blue-600 transition-colors">
              Data Satlinmas
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Formulir 17 Kolom Baku, Pas Foto, dan Arsip SK Satlinmas Bupati/Camat.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-600">
            <span>{totalSatlinmas} Anggota Terdata</span>
            <span className="text-emerald-600">Buka Data &rarr;</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigateTab('poskamling')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-[#D97706] hover:shadow-md transition-all cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#D97706] text-white flex items-center justify-center font-bold shadow-xs">
              <Radio className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#D97706] group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h4 className="font-extrabold text-[#0F2A4A] text-sm group-hover:text-[#D97706] transition-colors">
              Data Poskamling
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Inventarisasi fisik pos ronda, kondisi bangunan, kontak ketua, & 8 sarana wajib.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-600">
            <span>{totalPoskamling} Pos Terdaftar</span>
            <span className="text-[#D97706]">Buka Data &rarr;</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigateTab('kegiatan_patroli')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-[#059669] hover:shadow-md transition-all cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#059669] text-white flex items-center justify-center font-bold shadow-xs">
              <Car className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#059669] group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h4 className="font-extrabold text-[#0F2A4A] text-sm group-hover:text-[#059669] transition-colors">
              Kegiatan dan Patroli
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Input cepat laporan patroli trantibum lapangan dengan kunci koordinat GPS instan.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-600">
            <span>{totalPatroli} Laporan GPS</span>
            <span className="text-[#059669]">Buka Data &rarr;</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigateTab('kartu_anggota')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-[#F0B429] hover:shadow-md transition-all cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#F0B429] text-[#0F2A4A] flex items-center justify-center font-bold shadow-xs">
              <IdCard className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0F2A4A] group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h4 className="font-extrabold text-[#0F2A4A] text-sm group-hover:text-amber-600 transition-colors">
              Cetak Kartu Anggota
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Format resmi standar ID Card CR80 tampak muka dan belakang ber-QR Code dinas.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-600">
            <span>Siap Cetak KTA</span>
            <span className="text-amber-700">Cetak KTA &rarr;</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. SEBARAN PER KECAMATAN & FASILITAS SARANA POSKAMLING */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Sebaran per Kecamatan (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-[#0F2A4A] text-sm">
                Sebaran Sarana & Personel di 11 Kecamatan
              </h3>
              <p className="text-xs text-slate-500">
                Rekapitulasi Poskamling, Kegiatan Patroli, dan Anggota Satlinmas
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400 font-mono">11 Kecamatan HST</span>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {kecamatanBreakdown.map((kec, idx) => (
              <div key={kec.nama} className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#0F2A4A] text-[#F0B429] flex items-center justify-center text-[10px] font-black">
                      {idx + 1}
                    </span>
                    <span className="text-[#0F2A4A] text-sm">Kecamatan {kec.nama}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-700 font-extrabold">
                    {kec.total} Sarana Terdata
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-200/60 font-semibold">
                  <span className="text-[#D97706] flex items-center gap-1">
                    📻 <b>{kec.posCount}</b> Poskamling
                  </span>
                  <span className="text-[#059669] flex items-center gap-1">
                    🚓 <b>{kec.patCount}</b> Patroli GPS
                  </span>
                  <span className="text-[#0F2A4A] flex items-center gap-1">
                    🛡️ <b>{kec.linCount}</b> Satlinmas
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Kesiapan Sarana & Fasilitas Poskamling (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-[#0F2A4A] text-sm">
                Kesiapan 8 Sarana Poskamling
              </h3>
              <p className="text-xs text-slate-500">
                Inventarisasi kelengkapan operasional pos ronda
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('poskamling')}
              className="text-xs font-bold text-amber-700 hover:underline"
            >
              Lihat Pos →
            </button>
          </div>

          <div className="space-y-3">
            {fasilitasStats.map((item) => (
              <div key={item.name} className="space-y-1 text-xs">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-slate-700 truncate max-w-[200px]">{item.name}</span>
                  <span className="text-[#0F2A4A] font-bold font-mono">
                    {item.count} Pos ({item.pct}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-400 to-[#D97706] rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(6, item.pct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. RECENT ACTIVITIES: PATROLI TERBARU & POSKAMLING AKTIF */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Aktivitas Patroli Terkini */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-[#0F2A4A] text-sm">
                Laporan Kegiatan Patroli Terkini
              </h3>
              <p className="text-xs text-slate-500">Monitoring patroli lapangan dengan GPS Live</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('kegiatan_patroli')}
              className="text-xs font-bold text-[#059669] hover:underline"
            >
              Semua Patroli →
            </button>
          </div>

          <div className="space-y-3">
            {effectivePatroli.slice(0, 3).map((pat) => (
              <div key={pat.id} className="p-3.5 bg-emerald-50/40 rounded-xl border border-emerald-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#0F2A4A] text-sm">{pat.judulPatroli || pat.judul}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                    {pat.statusSituasi}
                  </span>
                </div>
                <p className="text-slate-600 line-clamp-2 text-[11px]">{pat.hasilPatroli}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-emerald-200/60 font-medium">
                  <span>📍 Kec. {pat.kecamatan} &bull; {pat.petugasPelapor}</span>
                  <span className="font-mono text-emerald-700 font-bold">{pat.waktuLapor || pat.waktu}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Poskamling Siaga Terdaftar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-[#0F2A4A] text-sm">
                Poskamling Siaga RT / RW
              </h3>
              <p className="text-xs text-slate-500">Pos ronda terdaftar dan personel aktif siskamling</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('poskamling')}
              className="text-xs font-bold text-[#D97706] hover:underline"
            >
              Semua Poskamling →
            </button>
          </div>

          <div className="space-y-3">
            {effectivePoskamling.slice(0, 3).map((pos) => (
              <div key={pos.id} className="p-3.5 bg-amber-50/40 rounded-xl border border-amber-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#0F2A4A] text-sm">{pos.namaPoskamling}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900">
                    {pos.kondisiFisik}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600">
                  Desa {pos.desaKelurahan || pos.desa}, Kec. {pos.kecamatan} &bull; RT {pos.rt} RW {pos.rw}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-amber-200/60 font-medium">
                  <span>Ketua: <b>{pos.namaKetuaPos}</b> ({pos.kontakWa})</span>
                  <span className="text-[#D97706] font-bold">👥 {pos.personelRonda} Personel</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. AUDIT LOG MODAL (KHUSUS ADMIN SATPOL PP KABUPATEN) */}
      {/* ========================================================================= */}
      {isAdmin && isAuditModalOpen && (
        <Modal
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
          title="LOG AUDIT & REKAM JEJAK SISTEM (AUDIT TRAIL)"
          size="2xl"
        >
          <div className="space-y-4">
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-700" />
                <div>
                  <p className="text-xs font-bold text-purple-900">
                    Pencatatan Rekam Jejak Tindakan Penting Seluruh HST
                  </p>
                  <p className="text-[11px] text-purple-700">
                    Setiap penambahan, pengubahan, atau penghapusan data anggota, poskamling, dan kegiatan tercatat permanen.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-purple-200 text-purple-900 rounded-lg text-xs font-mono font-bold">
                Total {auditLogs.length} Entri
              </span>
            </div>

            {/* Filter & Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2 relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari aktor, modul, target, atau rincian..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
                />
              </div>

              <div>
                <select
                  value={auditFilterAksi}
                  onChange={(e) => setAuditFilterAksi(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white"
                >
                  <option value="semua">Semua Tindakan</option>
                  <option value="TAMBAH">TAMBAH</option>
                  <option value="EDIT">EDIT / UBAH</option>
                  <option value="HAPUS">HAPUS</option>
                  <option value="VERIFIKASI">VERIFIKASI</option>
                </select>
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="border border-slate-200 rounded-xl overflow-x-auto overflow-y-auto max-h-[420px]">
              <table className="w-full min-w-[620px] text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="p-3">Waktu & Tanggal</th>
                    <th className="p-3">Aktor & Peran</th>
                    <th className="p-3">Tindakan</th>
                    <th className="p-3">Modul</th>
                    <th className="p-3">Target & Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        Tidak ada log yang cocok dengan kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => {
                      const isHapus = log.aksi === 'HAPUS';
                      const isTambah = log.aksi === 'TAMBAH';
                      const isEdit = log.aksi === 'EDIT';

                      const badgeStyle = isHapus 
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : isTambah
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : isEdit
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-blue-100 text-blue-800 border-blue-300';

                      return (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-[11px] whitespace-nowrap text-slate-500">
                            <p className="font-semibold text-slate-800">{log.waktu}</p>
                            <p className="text-[10px] font-mono text-slate-400">
                              {log.timestamp ? new Date(log.timestamp).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : '-'}
                            </p>
                          </td>
                          <td className="p-3">
                            <p className="font-bold text-[#0F2A4A]">{log.aktor}</p>
                            <p className="text-[10px] text-slate-500">{log.peran}</p>
                            {log.nipAktor && (
                              <p className="text-[9px] font-mono text-slate-400">{log.nipAktor}</p>
                            )}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${badgeStyle}`}>
                              {log.aksi}
                            </span>
                          </td>
                          <td className="p-3 text-slate-700 font-semibold whitespace-nowrap">
                            {log.modul}
                          </td>
                          <td className="p-3">
                            <p className="font-bold text-slate-800">{log.target}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{log.detail}</p>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                Menampilkan {filteredAuditLogs.length} dari {auditLogs.length} rekaman audit
              </span>
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}