import React, { useState, useEffect, useId, useMemo } from 'react';
import {
  IdCard,
  Printer,
  Download,
  Shield,
  ShieldCheck,
  Check,
  CheckCircle2,
  QrCode,
  FileText,
  Users,
  Search,
  Filter,
  Layers,
  Sparkles
} from 'lucide-react';
import { generateQrMatrix } from '../../utils/qrCodeGenerator';
import { KECAMATAN_HST } from '../../data/mockData';
import { getPegawaiList } from '../../data/storageService';

export default function CetakKartuAnggota({ 
  satlinmasList = [], 
  wilayahList = KECAMATAN_HST,
  assignedKecamatan = null,
  pegawaiList = []
}) {
  // Sync atau muat pegawai dari database bila pegawaiList belum tersedia
  const [dbPegawai, setDbPegawai] = useState(pegawaiList);

  useEffect(() => {
    if (pegawaiList && pegawaiList.length > 0) {
      setDbPegawai(pegawaiList);
    } else {
      getPegawaiList().then(res => {
        if (res && res.length > 0) setDbPegawai(res);
      }).catch(console.error);
    }
  }, [pegawaiList]);

  // Cari Kepala Satuan secara dinamis dari database master_pegawai
  const kepalaSatuan = useMemo(() => {
    const list = dbPegawai && dbPegawai.length > 0 ? dbPegawai : pegawaiList;
    const found = (list || []).find(p => {
      const jab = (p.jabatan || '').toLowerCase();
      return jab.includes('kepala satuan') || jab.includes('kasat');
    });

    if (found) {
      return {
        nama: found.nama || 'Drs. Ahmad Fathoni',
        nip: found.nip || '19720217 199203 1 006',
        pangkat: found.pangkat || 'Pembina Utama Muda / IV / c',
        jabatan: found.jabatan || 'Kepala Satuan'
      };
    }

    // Default resmi Kepala Satuan HST
    return {
      nama: 'Drs. Ahmad Fathoni',
      nip: '19720217 199203 1 006',
      pangkat: 'Pembina Utama Muda / IV / c',
      jabatan: 'Kepala Satuan'
    };
  }, [dbPegawai, pegawaiList]);

  // Nama tanpa gelar untuk simulasi tanda tangan kursif
  const signatureText = useMemo(() => {
    return kepalaSatuan.nama.replace(/^(Drs\.|Dra\.|H\.|Hj\.|Dr\.|Ir\.|M\.)\s*/gi, '').split(',')[0].trim();
  }, [kepalaSatuan.nama]);

  const scopedSatlinmas = useMemo(() => {
    if (!assignedKecamatan) return satlinmasList;
    return satlinmasList.filter(m => (m.kecamatan || '').toLowerCase() === assignedKecamatan.toLowerCase());
  }, [satlinmasList, assignedKecamatan]);

  // Member selection
  const [selectedMemberId, setSelectedMemberId] = useState(() => {
    return scopedSatlinmas.length > 0 ? scopedSatlinmas[0].id : '';
  });

  // Controls State
  const [printMode, setPrintMode] = useState('tunggal'); // 'tunggal' | 'massal'
  const [showCropMarks, setShowCropMarks] = useState(true);
  const [filterMassalKecamatan, setFilterMassalKecamatan] = useState(assignedKecamatan || 'semua');

  // Accessible IDs
  const selectMemberId = useId();
  const filterKecId = useId();

  // Active Member for single print
  const selectedMember = useMemo(() => {
    return scopedSatlinmas.find(m => m.id === selectedMemberId) || scopedSatlinmas[0] || null;
  }, [scopedSatlinmas, selectedMemberId]);

  // Mass print list
  const massalList = useMemo(() => {
    if (assignedKecamatan) return scopedSatlinmas;
    if (filterMassalKecamatan === 'semua') return scopedSatlinmas;
    return scopedSatlinmas.filter(m => m.kecamatan === filterMassalKecamatan);
  }, [scopedSatlinmas, filterMassalKecamatan, assignedKecamatan]);

  // Generate QR Matrix
  const qrMatrix = useMemo(() => {
    if (!selectedMember) return [];
    const verifyString = `LINDUNGMAS-HST://KTA/VERIFY?REG=${selectedMember.noRegistrasi}&NIK=${selectedMember.nik}&DATE=2028-12-31`;
    return generateQrMatrix(verifyString);
  }, [selectedMember]);

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & CONTROLS (SCREENSHOT HEADER) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#F0B429]/15 border border-[#F0B429]/40 flex items-center justify-center text-[#F0B429] shrink-0 shadow-xs">
            <IdCard className="w-6 h-6 text-[#0F2A4A]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-[#0F2A4A] tracking-tight leading-tight">
                Generator & Pencetakan Kartu Tanda Anggota (KTA) Satlinmas HST
              </h1>
              {assignedKecamatan && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-300 uppercase tracking-wide">
                  Kec. {assignedKecamatan}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Format resmi standar Satpol PP & Linmas Pemkab Hulu Sungai Tengah dilengkapi QR Code verifikasi & stempel dinas
            </p>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
          {/* Switcher Pill */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setPrintMode('tunggal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                printMode === 'tunggal'
                  ? 'bg-white text-[#0F2A4A] shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Cetak Tunggal
            </button>
            <button
              type="button"
              onClick={() => setPrintMode('massal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                printMode === 'massal'
                  ? 'bg-white text-[#0F2A4A] shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Cetak Massal (Lembar A4)
            </button>
          </div>

          {/* Cetak Button (Amber Orange Button as in Screenshot) */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-[#0F2A4A] bg-[#F0B429] hover:bg-[#e2a820] flex items-center justify-center gap-2 shadow-md shadow-[#F0B429]/25 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Printer className="w-4 h-4 text-[#0F2A4A]" />
            <span>Cetak KTA / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FILTER & SELECTION BAR (SCREENSHOT CONTROL ROW) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 print:hidden">
        {printMode === 'tunggal' ? (
          <div className="flex items-center gap-2 flex-1">
            <label htmlFor={selectMemberId} className="text-xs font-bold text-slate-700 whitespace-nowrap">
              Pilih Anggota Satlinmas:
            </label>
            <select
              id={selectMemberId}
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="flex-1 max-w-xl px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#F0B429]/30"
            >
              {scopedSatlinmas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.noRegistrasi} - {m.nama} (Kec. {m.kecamatan})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <label htmlFor={filterKecId} className="text-xs font-bold text-slate-700 whitespace-nowrap">
              Filter Wilayah Kecamatan:
            </label>
            <select
              id={filterKecId}
              value={filterMassalKecamatan}
              disabled={!!assignedKecamatan}
              onChange={(e) => setFilterMassalKecamatan(e.target.value)}
              className={`max-w-xs px-3.5 py-2 border rounded-xl text-xs font-medium focus:outline-hidden ${
                assignedKecamatan 
                  ? 'bg-blue-50 border-blue-200 text-blue-900 font-bold cursor-not-allowed'
                  : 'bg-slate-50 border-slate-300 text-slate-800 focus:ring-2 focus:ring-[#F0B429]/30'
              }`}
            >
              {assignedKecamatan ? (
                <option value={assignedKecamatan}>Kec. {assignedKecamatan} (Wilayah Binaan)</option>
              ) : (
                <>
                  <option value="semua">Semua Kecamatan ({satlinmasList.length} Anggota)</option>
                  {wilayahList.map(w => (
                    <option key={w.id || w.nama} value={w.nama}>Kec. {w.nama}</option>
                  ))}
                </>
              )}
            </select>
            <span className="text-xs text-slate-500 font-medium">
              Siap cetak {massalList.length} kartu
            </span>
          </div>
        )}

        {/* Checkbox Garis Potong (Crop Marks) */}
        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showCropMarks}
            onChange={(e) => setShowCropMarks(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
          />
          <span>Tampilkan Garis Potong (Crop Marks)</span>
        </label>
      </div>

      {/* ========================================================================= */}
      {/* 3. TAMPILAN CETAK TUNGGAL (CR80 DEPAN & BELAKANG) */}
      {/* ========================================================================= */}
      {printMode === 'tunggal' && selectedMember && (
        <div className="space-y-4">
          {/* Dimension Notice Header */}
          <div className="text-center print:hidden">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
              UKURAN STANDAR ID CARD (CR80: 85.6 MM × 54 MM)
            </p>
          </div>

          {/* Side-by-Side Cards Container */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-5xl mx-auto items-center justify-center print:block print:max-w-none">
            {/* ---------------- SISI DEPAN (TAMPAK MUKA) ---------------- */}
            <div className="w-full flex flex-col items-center space-y-2 overflow-x-auto pb-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 print:hidden">
                SISI DEPAN (TAMPAK MUKA)
              </h4>

              {/* CARD WRAPPER WITH CROP MARKS */}
              <div className={`relative p-3 shrink-0 ${showCropMarks ? 'border border-dashed border-slate-300 rounded-2xl bg-slate-50/50' : ''}`}>
                {/* Crop marks crosshairs */}
                {showCropMarks && (
                  <>
                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-slate-500" />
                    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-slate-500" />
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-slate-500" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-slate-500" />
                  </>
                )}

                {/* CR80 PHYSICAL CARD FRONT */}
                <div
                  className="w-[420px] h-[265px] rounded-[18px] shadow-2xl relative overflow-hidden flex flex-col justify-between border border-slate-700/40 select-none text-white print:shadow-none"
                  style={{
                    background: 'linear-gradient(135deg, #0A1A2E 0%, #0F2A4A 45%, #053326 100%)'
                  }}
                >
                  {/* Subtle Security Guilloche Pattern Overlay */}
                  <div 
                    className="absolute inset-0 pointer-events-none opacity-10"
                    style={{
                      backgroundImage: 'radial-gradient(circle at 50% 50%, #ffffff 1px, transparent 1px)',
                      backgroundSize: '12px 12px'
                    }}
                  />

                  {/* 1. Header Dinas (Logo Barabai + Title) */}
                  <div className="p-3 pb-2 flex items-center gap-2.5 relative z-10">
                    {/* Official Barabai Logo Shield */}
                    <div className="w-11 h-11 rounded-xl bg-white/10 p-0.5 border border-[#F0B429]/40 shadow-md shrink-0 flex items-center justify-center">
                      <img 
                        src="/logo-barabai.png" 
                        alt="Logo Barabai HST" 
                        className="w-full h-full object-contain filter drop-shadow" 
                      />
                    </div>

                    <div className="leading-tight">
                      <p className="text-[9px] font-extrabold uppercase tracking-wider text-[#F0B429]">
                        PEMERINTAH KABUPATEN HULU SUNGAI TENGAH
                      </p>
                      <h3 className="text-[12px] font-black uppercase tracking-wider text-white">
                        SATUAN POLISI PAMONG PRAJA
                      </h3>
                      <p className="text-[8px] font-extrabold uppercase tracking-wider text-amber-200">
                        SATUAN PERLINDUNGAN MASYARAKAT (SATLINMAS)
                      </p>
                    </div>
                  </div>

                  {/* 2. Yellow Ribbon Banner */}
                  <div className="bg-[#F0B429] text-[#0F2A4A] py-1 px-4 text-center shadow-xs relative z-10">
                    <h4 className="text-[11px] font-black tracking-widest uppercase">
                      KARTU TANDA ANGGOTA SATLINMAS
                    </h4>
                  </div>

                  {/* 3. Card Body Content (Photo + Bio) */}
                  <div className="px-3.5 py-2.5 flex items-start gap-3.5 relative z-10 flex-1">
                    {/* Member Photo */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-[84px] h-[106px] rounded-xl overflow-hidden border-2 border-[#F0B429] shadow-md bg-white">
                        <img
                          src={selectedMember.pasFoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'}
                          alt={selectedMember.nama}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';
                          }}
                        />
                      </div>
                      <span className="text-[9px] font-bold text-slate-300 font-mono mt-1">
                        GOL. {selectedMember.golonganDarah || 'O'}
                      </span>
                    </div>

                    {/* Member Details */}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div>
                        <span className="text-[8px] font-extrabold text-[#F0B429] uppercase tracking-wider block">
                          NAMA LENGKAP
                        </span>
                        <h2 className="text-[15px] font-black text-white leading-tight truncate">
                          {selectedMember.nama}
                        </h2>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span className="text-[8px] font-bold text-slate-300 uppercase block">
                            NO. REGISTRASI
                          </span>
                          <span className="font-mono font-bold text-white tracking-wide">
                            {selectedMember.noRegistrasi}
                          </span>
                        </div>
                        <div>
                          <span className="text-[8px] font-bold text-slate-300 uppercase block">
                            NIK
                          </span>
                          <span className="font-mono font-bold text-white tracking-wide">
                            {selectedMember.nik}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[8px] font-bold text-slate-300 uppercase block">
                          WILAYAH PENUGASAN
                        </span>
                        <span className="text-[10px] font-bold text-white block leading-tight">
                          Kec. {selectedMember.kecamatan} • Desa {selectedMember.desaKelurahan}
                        </span>
                      </div>

                      {/* Pill Badge & Slogan */}
                      <div className="pt-1 flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-600 text-white shadow-xs">
                          Anggota Satlinmas
                        </span>
                        <span className="text-[9px] font-black text-emerald-300 font-mono tracking-widest uppercase">
                          BUMI MURAKATA
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Micro Security Footnote */}
                  <div className="px-3 pb-1 text-right relative z-10">
                    <span className="text-[7px] font-mono text-emerald-300/60 uppercase tracking-widest">
                      SATLINMAS-HST-SECURE
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ---------------- SISI BELAKANG (KETENTUAN & TANDA TANGAN) ---------------- */}
            <div className="w-full flex flex-col items-center space-y-2 overflow-x-auto pb-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 print:hidden">
                SISI BELAKANG (KETENTUAN & TANDA TANGAN)
              </h4>

              {/* CARD WRAPPER WITH CROP MARKS */}
              <div className={`relative p-3 shrink-0 ${showCropMarks ? 'border border-dashed border-slate-300 rounded-2xl bg-slate-50/50' : ''}`}>
                {/* Crop marks crosshairs */}
                {showCropMarks && (
                  <>
                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-slate-500" />
                    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-slate-500" />
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-slate-500" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-slate-500" />
                  </>
                )}

                {/* CR80 PHYSICAL CARD BACK */}
                <div
                  className="w-[420px] h-[265px] rounded-[18px] shadow-2xl relative overflow-hidden flex flex-col justify-between border border-slate-300 select-none bg-white p-3.5 text-slate-800 print:shadow-none"
                >
                  {/* Faint Central Seal Watermark */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.08]">
                    <img src="/logo-barabai.png" alt="Watermark Barabai" className="w-40 h-40 object-contain grayscale" />
                  </div>

                  {/* 1. Header Ketentuan */}
                  <div className="text-center border-b border-slate-200 pb-1 relative z-10">
                    <h4 className="text-[10px] font-black tracking-wider uppercase text-[#0F2A4A]">
                      KETENTUAN PEMEGANG KARTU SATLINMAS
                    </h4>
                  </div>

                  {/* 2. Isi Ketentuan (Numbered 1-4) */}
                  <div className="space-y-1 text-[8.5px] text-slate-700 leading-tight px-1 relative z-10 font-medium">
                    <p>1. Kartu Tanda Anggota ini sah dan wajib dibawa saat bertugas di wilayah Kab. Hulu Sungai Tengah.</p>
                    <p>2. Pemegang kartu berkewajiban menjaga ketertiban umum, penanggulangan bencana, dan siskamling.</p>
                    <p>3. Apabila kartu ini hilang/rusak, segera laporkan ke Satpol PP Kab. Hulu Sungai Tengah.</p>
                    <p>4. Penyalahgunaan kartu ini akan ditindak sesuai ketentuan peraturan perundang-undangan.</p>
                  </div>

                  {/* 3. Footer: QR Code & Signature Section */}
                  <div className="pt-2 border-t border-slate-200 flex items-end justify-between relative z-10">
                    {/* Left: QR Code Verifikasi */}
                    <div className="flex flex-col items-start space-y-0.5">
                      <div className="w-[62px] h-[62px] p-1 bg-white border border-slate-300 rounded-lg shadow-2xs flex items-center justify-center">
                        {/* SVG QR Code Rendering */}
                        <svg viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`} className="w-full h-full">
                          {qrMatrix.map((row, r) =>
                            row.map((cell, c) => (
                              <rect
                                key={`${r}-${c}`}
                                x={c}
                                y={r}
                                width="1"
                                height="1"
                                fill={cell ? '#0F2A4A' : '#ffffff'}
                              />
                            ))
                          )}
                        </svg>
                      </div>
                      <span className="text-[7.5px] font-bold text-slate-700 font-mono">
                        Berlaku s.d: 31 DESEMBER 2028
                      </span>
                      <span className="text-[6.5px] font-black text-slate-400 tracking-wider uppercase">
                        SCAN VERIFIKASI RESMI
                      </span>
                    </div>

                    {/* Right: Signature & Official Seal Stamp */}
                    <div className="text-center relative pr-2">
                      <p className="text-[8.5px] text-slate-600">Ditetapkan di Barabai</p>
                      <p className="text-[9px] font-black text-slate-900 leading-tight">
                        KEPALA SATUAN POLISI PAMONG PRAJA
                      </p>
                      <p className="text-[9px] font-black text-slate-900 leading-tight">
                        KABUPATEN HULU SUNGAI TENGAH
                      </p>

                      {/* Signature & Seal Simulation */}
                      <div className="h-11 relative flex items-center justify-center my-0.5">
                        {/* Official Blue/Purple Stamp Simulation */}
                        <div className="absolute -left-3 w-12 h-12 rounded-full border-2 border-blue-600/70 rotate-[-15deg] flex flex-col items-center justify-center text-blue-700 pointer-events-none opacity-85">
                          <span className="text-[5px] font-black uppercase text-center leading-none">PEMKAB HST</span>
                          <span className="text-[7px] font-black">★ SATPOL PP ★</span>
                          <span className="text-[5px] font-black uppercase text-center leading-none">KAB. HST</span>
                        </div>

                        {/* Signature Line */}
                        <div className="relative z-10 italic font-serif text-blue-900 text-base font-bold tracking-wider transform -rotate-3 select-none">
                          {signatureText}
                        </div>
                      </div>

                      <p className="text-[9.5px] font-black text-slate-900 leading-tight underline font-bold">
                        {kepalaSatuan.nama}
                      </p>
                      <p className="text-[8px] font-mono text-slate-600 font-medium">
                        NIP. {kepalaSatuan.nip}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAMPILAN CETAK MASSAL (LEMBAR A4) */}
      {/* ========================================================================= */}
      {printMode === 'massal' && (
        <div className="space-y-4">
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Mode Cetak Massal: Memuat <strong>{massalList.length} kartu KTA</strong> siap cetak di atas lembar kertas A4 atau lembar PVC khusus.
              </span>
            </div>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-[#0F2A4A] text-white font-bold text-xs hover:bg-[#14365D] transition-colors cursor-pointer"
            >
              Cetak Semua Kartu A4
            </button>
          </div>

          {/* Grid of Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center print:block">
            {massalList.map((m) => (
              <div key={m.id} className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3 page-break-inside-avoid print:border-none print:shadow-none print:mb-8">
                <div className="flex items-center justify-between text-xs pb-1 border-b print:hidden">
                  <span className="font-bold text-slate-700">{m.nama}</span>
                  <span className="font-mono text-slate-400">{m.noRegistrasi}</span>
                </div>

                {/* Sisi Depan Mini/Standard */}
                <div
                  className="w-[380px] h-[240px] rounded-[16px] shadow-md relative overflow-hidden flex flex-col justify-between border border-slate-700/40 select-none text-white"
                  style={{
                    background: 'linear-gradient(135deg, #0A1A2E 0%, #0F2A4A 45%, #053326 100%)'
                  }}
                >
                  <div className="p-2.5 pb-1 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/10 p-0.5 border border-[#F0B429]/40 shrink-0 flex items-center justify-center shadow-xs">
                      <img 
                        src="/logo-barabai.png" 
                        alt="Logo Barabai" 
                        className="w-full h-full object-contain filter drop-shadow" 
                      />
                    </div>
                    <div className="leading-tight">
                      <p className="text-[8px] font-extrabold text-[#F0B429]">PEMKAB HULU SUNGAI TENGAH</p>
                      <h3 className="text-[10px] font-black text-white">SATPOL PP & SATLINMAS</h3>
                    </div>
                  </div>

                  <div className="bg-[#F0B429] text-[#0F2A4A] py-0.5 px-3 text-center">
                    <h4 className="text-[9.5px] font-black tracking-wider uppercase">
                      KARTU TANDA ANGGOTA SATLINMAS
                    </h4>
                  </div>

                  <div className="p-2.5 flex items-start gap-3">
                    <img
                      src={m.pasFoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'}
                      alt={m.nama}
                      className="w-[70px] h-[90px] rounded-lg object-cover border border-[#F0B429] bg-white"
                    />
                    <div className="text-[9px] space-y-1">
                      <p className="font-extrabold text-white text-xs truncate max-w-[220px]">{m.nama}</p>
                      <p className="font-mono text-slate-300">Reg: {m.noRegistrasi}</p>
                      <p className="font-mono text-slate-300">NIK: {m.nik}</p>
                      <p className="text-emerald-300 font-bold">{m.desaKelurahan}, Kec. {m.kecamatan}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

