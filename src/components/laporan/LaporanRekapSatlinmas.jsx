import React, { useState, useMemo } from 'react';
import { 
  Printer, 
  Download, 
  Calendar, 
  Search, 
  RefreshCw, 
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Users,
  Radio,
  Car,
  ShieldCheck,
  MapPin,
  Sparkles,
  Loader2
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { KECAMATAN_HST } from '../../data/mockData';

// Daftar Nama Bulan
const BULAN_LIST = [
  { id: '1', label: 'Januari' },
  { id: '2', label: 'Februari' },
  { id: '3', label: 'Maret' },
  { id: '4', label: 'April' },
  { id: '5', label: 'Mei' },
  { id: '6', label: 'Juni' },
  { id: '7', label: 'Juli' },
  { id: '8', label: 'Agustus' },
  { id: '9', label: 'September' },
  { id: '10', label: 'Oktober' },
  { id: '11', label: 'November' },
  { id: '12', label: 'Desember' }
];

const TAHUN_LIST = ['2026', '2025', '2024'];

// Helper Parse Bulan dan Tahun dari Kegiatan Patroli
function getPatrolMonthYear(patrol) {
  const rawDate = patrol.tanggal || patrol.waktuLapor || patrol.created_at;
  if (!rawDate) return { month: null, year: null };

  const isoMatch = String(rawDate).match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return {
      year: parseInt(isoMatch[1], 10),
      month: parseInt(isoMatch[2], 10)
    };
  }

  const monthMap = {
    jan: 1, januari: 1, january: 1,
    feb: 2, februari: 2, february: 2,
    mar: 3, maret: 3, march: 3,
    apr: 4, april: 4,
    mei: 5, may: 5,
    jun: 6, juni: 6, june: 6,
    jul: 7, juli: 7, july: 7,
    agu: 8, ags: 8, agustus: 8, august: 8,
    sep: 9, september: 9,
    okt: 10, oct: 10, oktober: 10, october: 10,
    nov: 11, november: 11,
    des: 12, dec: 12, desember: 12, december: 12
  };

  const words = String(rawDate).toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/);
  let year = null;
  let month = null;

  for (const w of words) {
    if (/^\d{4}$/.test(w)) {
      year = parseInt(w, 10);
    } else if (monthMap[w]) {
      month = monthMap[w];
    }
  }

  if (!month || !year) {
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      return {
        year: d.getFullYear(),
        month: d.getMonth() + 1
      };
    }
  }

  return { month, year };
}

export default function LaporanRekapSatlinmas({
  satlinmasList = [],
  poskamlingList = [],
  kegiatanPatroliList = [],
  wilayahList = [],
  currentUser,
  onRefreshData
}) {
  // Filter State
  const [selectedMonth, setSelectedMonth] = useState('11'); // Default Bulan November
  const [selectedYear, setSelectedYear] = useState('2026'); // Default Tahun 2026
  const [searchTerm, setSearchTerm] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Fallback 11 Kecamatan
  const effectiveWilayahList = useMemo(() => {
    return (wilayahList && wilayahList.length > 0) ? wilayahList : KECAMATAN_HST;
  }, [wilayahList]);

  // Label Periode Terpilih
  const selectedMonthLabel = useMemo(() => {
    const found = BULAN_LIST.find(b => b.id === selectedMonth);
    return found ? found.label : 'November';
  }, [selectedMonth]);

  // Kalkulasi Rekapitulasi per Kecamatan
  const rekapData = useMemo(() => {
    return effectiveWilayahList.map((kec, index) => {
      const kecName = kec.nama;

      // 1. Personel Linmas di Kecamatan ini (L, P, Total)
      const linmasInKec = satlinmasList.filter(s => 
        (s.kecamatan || '').toLowerCase() === kecName.toLowerCase()
      );

      const countL = linmasInKec.filter(s => {
        const jk = s.jenisKelamin || s.jk || '';
        return jk.toLowerCase().startsWith('l');
      }).length;

      const countP = linmasInKec.filter(s => {
        const jk = s.jenisKelamin || s.jk || '';
        return jk.toLowerCase().startsWith('p');
      }).length;

      const totalLinmas = countL + countP > 0 ? (countL + countP) : linmasInKec.length;
      const finalL = (countL === 0 && countP === 0 && totalLinmas > 0) ? totalLinmas : countL;
      const finalP = countP;

      const countAktif = linmasInKec.filter(s => 
        (s.status || 'Aktif').toLowerCase() === 'aktif' || (s.status || '').toLowerCase() === 'siaga'
      ).length;

      // 2. Poskamling di Kecamatan ini (Baik, Rusak, Total)
      const posInKec = poskamlingList.filter(p => 
        (p.kecamatan || '').toLowerCase() === kecName.toLowerCase()
      );
      const totalPos = posInKec.length;

      const countBaik = posInKec.filter(p => {
        const cond = (p.kondisiFisik || p.statusKondisi || '').toLowerCase();
        return cond.includes('baik') || cond.includes('siap pakai');
      }).length;

      const countRusak = posInKec.filter(p => {
        const cond = (p.kondisiFisik || p.statusKondisi || '').toLowerCase();
        return cond.includes('rusak') || cond.includes('tidak layak') || cond.includes('perbaikan');
      }).length;

      const finalBaik = (countBaik === 0 && countRusak === 0 && totalPos > 0) ? totalPos : countBaik;
      const finalRusak = countRusak;

      // 3. Kegiatan Patroli di Kecamatan ini pada bulan & tahun terpilih
      const patroliInKec = kegiatanPatroliList.filter(p => {
        const matchKec = (p.kecamatan || '').toLowerCase() === kecName.toLowerCase();
        if (!matchKec) return false;

        const { month, year } = getPatrolMonthYear(p);
        const matchYear = !selectedYear || String(year) === String(selectedYear);
        const matchMonth = !selectedMonth || String(month) === String(selectedMonth);

        return matchYear && matchMonth;
      });
      const totalPatroli = patroliInKec.length;

      // 4. Keterangan Situasi
      const hasGangguan = patroliInKec.some(p => {
        const sit = (p.statusSituasi || '').toLowerCase();
        return sit.includes('gangguan') || sit.includes('waspada') || sit.includes('potensi');
      });

      const keterangan = hasGangguan ? 'Perlu Atensi' : 'Terkendali';

      return {
        no: index + 1,
        id: kec.id || kecName,
        kecamatan: `Kec. ${kecName}`,
        rawKecamatan: kecName,
        pria: finalL,
        wanita: finalP,
        totalLinmas,
        aktifLinmas: countAktif,
        posBaik: finalBaik,
        posRusak: finalRusak,
        totalPos,
        kegiatanPatroli: totalPatroli,
        keterangan
      };
    });
  }, [effectiveWilayahList, satlinmasList, poskamlingList, kegiatanPatroliList, selectedMonth, selectedYear]);

  // Data Terfilter Pencarian
  const filteredRekapData = useMemo(() => {
    if (!searchTerm.trim()) return rekapData;
    const term = searchTerm.toLowerCase();
    return rekapData.filter(r => 
      r.kecamatan.toLowerCase().includes(term) ||
      r.keterangan.toLowerCase().includes(term)
    );
  }, [rekapData, searchTerm]);

  // Total Rekapitulasi Keseluruhan Kabupaten HST
  const totalRekap = useMemo(() => {
    return rekapData.reduce((acc, row) => ({
      pria: acc.pria + row.pria,
      wanita: acc.wanita + row.wanita,
      totalLinmas: acc.totalLinmas + row.totalLinmas,
      aktifLinmas: acc.aktifLinmas + row.aktifLinmas,
      posBaik: acc.posBaik + row.posBaik,
      posRusak: acc.posRusak + row.posRusak,
      totalPos: acc.totalPos + row.totalPos,
      kegiatanPatroli: acc.kegiatanPatroli + row.kegiatanPatroli
    }), { 
      pria: 0, 
      wanita: 0, 
      totalLinmas: 0, 
      aktifLinmas: 0, 
      posBaik: 0, 
      posRusak: 0, 
      totalPos: 0, 
      kegiatanPatroli: 0 
    });
  }, [rekapData]);

  // Cetak Dokumen via Browser Print (A4 Portrait)
  const handlePrint = () => {
    window.print();
  };

  // Unduh PDF Resmi Standar A4
  const handleExportPDF = async () => {
    const element = document.getElementById('report-document-a4');
    if (!element) return;

    setIsGeneratingPDF(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2, // Kualitas tinggi (retina / print quality)
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

      // Margin seimbang untuk standar A4 (10mm kiri/kanan, 8mm atas/bawah)
      const marginX = 10;
      const marginY = 8;
      const contentWidth = pdfWidth - (marginX * 2);
      const contentHeight = (canvas.height * contentWidth) / canvas.width;
      const maxAvailableHeight = pdfHeight - (marginY * 2);

      let finalWidth = contentWidth;
      let finalHeight = contentHeight;

      // Pastikan muat tepat dalam 1 halaman A4 utuh tanpa terpotong
      if (contentHeight > maxAvailableHeight) {
        finalHeight = maxAvailableHeight;
        finalWidth = (canvas.width * finalHeight) / canvas.height;
      }

      const posX = marginX + (contentWidth - finalWidth) / 2;
      const posY = marginY;

      pdf.addImage(
        imgData, 
        'PNG', 
        posX, 
        posY, 
        finalWidth, 
        finalHeight
      );
      
      pdf.save(`Laporan_Rekapitulasi_Satlinmas_HST_${selectedMonthLabel}_${selectedYear}.pdf`);
    } catch (err) {
      console.error('Gagal export PDF:', err);
      // Fallback ke window.print jika canvas gagal
      window.print();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Ekspor CSV
  const handleExportCSV = () => {
    const headers = [
      'NO',
      'KECAMATAN',
      'LINMAS (L)',
      'LINMAS (P)',
      'TOTAL LINMAS',
      'POSKAMLING (BAIK)',
      'POSKAMLING (RUSAK)',
      'TOTAL POSKAMLING',
      'KEGIATAN PATROLI',
      'KETERANGAN'
    ];

    const rows = rekapData.map(r => [
      r.no,
      `"${r.kecamatan}"`,
      r.pria,
      r.wanita,
      r.totalLinmas,
      r.posBaik,
      r.posRusak,
      r.totalPos,
      r.kegiatanPatroli,
      `"${r.keterangan}"`
    ]);

    rows.push([
      'TOTAL',
      '"JUMLAH KESELURUHAN (SE-KAB. HST)"',
      totalRekap.pria,
      totalRekap.wanita,
      totalRekap.totalLinmas,
      totalRekap.posBaik,
      totalRekap.posRusak,
      totalRekap.totalPos,
      totalRekap.kegiatanPatroli,
      '"KONDUSIF"'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Rekapitulasi_Satlinmas_HST_${selectedMonthLabel}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Tanggal Hari Ini untuk Tanda Tangan
  const tanggalHariIni = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  return (
    <div className="space-y-6">
      {/* 1. TOP BAR CONTROLS (TIDAK TAMPIL SAAT PRINT) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs print:hidden max-w-[210mm] mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 w-full md:w-auto md:flex-1">
          {/* Pilihan Bulan */}
          <div className="sm:col-span-5">
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Periode Bulan</span>
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white font-bold text-slate-800 text-xs transition-colors"
            >
              {BULAN_LIST.map(b => (
                <option key={b.id} value={b.id}>Bulan {b.label}</option>
              ))}
            </select>
          </div>

          {/* Pilihan Tahun */}
          <div className="sm:col-span-3">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Tahun
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white font-bold text-slate-800 text-xs transition-colors"
            >
              {TAHUN_LIST.map(y => (
                <option key={y} value={y}>Tahun {y}</option>
              ))}
            </select>
          </div>

          {/* Cari Kecamatan */}
          <div className="sm:col-span-4">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Cari Kecamatan
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari kecamatan..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden text-xs bg-white transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons: Export PDF, Print A4, and CSV */}
        <div className="flex items-center flex-wrap gap-2 self-end md:self-center mt-2 md:mt-4">
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isGeneratingPDF}
            className="px-3.5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap disabled:opacity-50"
            title="Unduh Dokumen Laporan Format PDF A4"
          >
            {isGeneratingPDF ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 text-rose-200" />
            )}
            <span>{isGeneratingPDF ? 'Membuat PDF...' : 'Unduh PDF (A4)'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            title="Unduh Data Format Excel / CSV"
          >
            <Download className="w-4 h-4 text-emerald-200" />
            <span>Ekspor Excel</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-[#0F2A4A] hover:bg-[#16365C] text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            title="Cetak Dokumen Resmi Ukuran A4"
          >
            <Printer className="w-4 h-4 text-[#F0B429]" />
            <span>Cetak (A4)</span>
          </button>
        </div>
      </div>

      {/* 2. DOKUMEN LAPORAN RESMI DISESUAIKAN UNTUK UKURAN A4 PORTRAIT */}
      <div 
        id="report-document-a4"
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 sm:p-6 md:p-7 max-w-[210mm] mx-auto w-full print:max-w-none print:w-full print:p-0 print:m-0 print:border-none print:shadow-none font-sans"
      >
        
        {/* KOP SURAT RESMI KABUPATEN HULU SUNGAI TENGAH (HANYA SATU GARIS PEMBATAS HITAM TEBAL) */}
        <div className="pb-3 mb-4 border-b-2 border-black">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            {/* Logo Barabai Resmi */}
            <div className="w-12 h-16 sm:w-16 sm:h-20 shrink-0 flex items-center justify-center">
              <img 
                src="/logo-barabai.png" 
                alt="Logo Barabai HST" 
                className="max-h-16 sm:max-h-20 w-auto object-contain" 
              />
            </div>

            {/* Teks Kop Surat */}
            <div className="flex-1 text-center pr-4">
              <h2 className="text-xs sm:text-[13px] font-extrabold text-slate-900 uppercase tracking-wider font-serif">
                PEMERINTAH KABUPATEN HULU SUNGAI TENGAH
              </h2>
              <h1 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-widest font-serif mt-0.5">
                SATUAN POLISI PAMONG PRAJA
              </h1>
              <p className="text-[10px] text-slate-800 font-sans mt-0.5 leading-snug">
                Jl. Perwira No. 1, Kelurahan Barabai Timur, Kec. Barabai, Kab. Hulu Sungai Tengah, Kode Pos 71314
              </p>
              <p className="text-[9.5px] text-slate-700 font-sans leading-snug">
                Telepon: (0517) 41234 • Posko Darurat: 112 / (0517) 41113 • Email: satpolpp@hulusungaitengahkab.go.id
              </p>
            </div>

            {/* Spacer penyeimbang kanan agar teks benar-benar simetris */}
            <div className="w-16 shrink-0 hidden sm:block"></div>
          </div>
        </div>

        {/* JUDUL RESMI LAPORAN */}
        <div className="text-center mb-4">
          <h2 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider underline decoration-2 underline-offset-4">
            LAPORAN REKAPITULASI SITUASI SATUAN PERLINDUNGAN MASYARAKAT (SATLINMAS)
          </h2>
          <p className="text-[11px] sm:text-xs font-bold text-slate-800 mt-1">
            Bulan {selectedMonthLabel} Tahun {selectedYear}
          </p>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
            Nomor: 300 / 11.LINMAS / SATPOLPP-HST / {selectedYear}
          </p>
        </div>

        {/* 3. TOP 4 KPI CARDS (KOMPAK UNTUK MENJAMIN PAS DI HALAMAN A4) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
          {/* Card 1: Total Personel Linmas */}
          <div className="bg-[#F0F7FF] border border-[#BFDBFE] rounded-xl p-2.5">
            <span className="text-[9.5px] font-bold text-blue-600 uppercase tracking-wider block">
              TOTAL PERSONEL LINMAS
            </span>
            <p className="text-lg font-black text-[#0F2A4A] mt-0.5">
              {totalRekap.totalLinmas} Personel
            </p>
          </div>

          {/* Card 2: Personel Aktif Siaga */}
          <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-2.5">
            <span className="text-[9.5px] font-bold text-emerald-600 uppercase tracking-wider block">
              PERSONEL AKTIF SIAGA
            </span>
            <p className="text-lg font-black text-emerald-950 mt-0.5">
              {totalRekap.aktifLinmas} Orang
            </p>
          </div>

          {/* Card 3: Total Poskamling */}
          <div className="bg-[#FEFCE8] border border-[#FEF08A] rounded-xl p-2.5">
            <span className="text-[9.5px] font-bold text-amber-600 uppercase tracking-wider block">
              TOTAL POSKAMLING
            </span>
            <p className="text-lg font-black text-amber-950 mt-0.5">
              {totalRekap.totalPos} Pos <span className="text-xs font-bold text-amber-800">({totalRekap.posBaik} Baik)</span>
            </p>
          </div>

          {/* Card 4: Laporan Patroli Terlaksana */}
          <div className="bg-[#F5F3FF] border border-[#DDD6FE] rounded-xl p-2.5">
            <span className="text-[9.5px] font-bold text-indigo-600 uppercase tracking-wider block">
              LAPORAN PATROLI TERLAKSANA
            </span>
            <p className="text-lg font-black text-indigo-950 mt-0.5">
              {totalRekap.kegiatanPatroli} Kegiatan
            </p>
          </div>
        </div>

        {/* 4. TABEL REKAPITULASI DENGAN HEADER BERTINGKAT (PERSIS SEPERTI GAMBAR CONTOH) */}
        <div className="overflow-x-auto rounded-lg border border-slate-300">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              {/* Header Tingkat 1 */}
              <tr className="bg-slate-50 text-slate-800 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-300 text-center">
                <th rowSpan={2} className="py-2 px-2 border-r border-slate-300 w-10 text-slate-700">
                  NO
                </th>
                <th rowSpan={2} className="py-2 px-3 border-r border-slate-300 text-left min-w-[170px] text-slate-800">
                  KECAMATAN
                </th>
                <th colSpan={3} className="py-1.5 px-2 border-r border-slate-300 text-center bg-blue-50/70 text-blue-950">
                  PERSONEL LINMAS
                </th>
                <th colSpan={3} className="py-1.5 px-2 border-r border-slate-300 text-center bg-amber-50/70 text-amber-950">
                  POSKAMLING
                </th>
                <th rowSpan={2} className="py-2 px-2.5 border-r border-slate-300 text-center min-w-[110px] text-slate-800">
                  KEGIATAN PATROLI
                </th>
                <th rowSpan={2} className="py-2 px-3 text-center min-w-[110px] text-slate-800">
                  KETERANGAN
                </th>
              </tr>

              {/* Header Tingkat 2 (Sub-Kolom) */}
              <tr className="bg-slate-50 text-slate-700 font-bold text-[10px] border-b border-slate-300 text-center">
                {/* Personel Linmas: L | P | Total */}
                <th className="py-1 px-2 border-r border-slate-300 w-10">L</th>
                <th className="py-1 px-2 border-r border-slate-300 w-10">P</th>
                <th className="py-1 px-2.5 border-r border-slate-300 w-12 bg-blue-100/60 font-black text-blue-950">Total</th>

                {/* Poskamling: Baik | Rusak | Total */}
                <th className="py-1 px-2 border-r border-slate-300 w-10">Baik</th>
                <th className="py-1 px-2 border-r border-slate-300 w-10 text-amber-700 font-extrabold">Rusak</th>
                <th className="py-1 px-2.5 border-r border-slate-300 w-12 bg-amber-100/60 font-black text-amber-950">Total</th>
              </tr>
            </thead>

            {/* Body 11 Kecamatan */}
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredRekapData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-slate-400">
                    Tidak ada data kecamatan yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredRekapData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* NO */}
                    <td className="py-1.5 px-2 border-r border-slate-300 text-center font-mono text-slate-600">
                      {row.no}
                    </td>

                    {/* KECAMATAN */}
                    <td className="py-1.5 px-3 border-r border-slate-300 font-bold text-slate-900">
                      {row.kecamatan}
                    </td>

                    {/* LINMAS: L */}
                    <td className="py-1.5 px-2 border-r border-slate-300 text-center font-mono">
                      {row.pria}
                    </td>

                    {/* LINMAS: P */}
                    <td className="py-1.5 px-2 border-r border-slate-300 text-center font-mono">
                      {row.wanita}
                    </td>

                    {/* LINMAS: TOTAL */}
                    <td className="py-1.5 px-2.5 border-r border-slate-300 text-center font-mono font-black text-slate-950 bg-blue-50/40">
                      {row.totalLinmas}
                    </td>

                    {/* POSKAMLING: BAIK */}
                    <td className="py-1.5 px-2 border-r border-slate-300 text-center font-mono">
                      {row.posBaik}
                    </td>

                    {/* POSKAMLING: RUSAK */}
                    <td className="py-1.5 px-2 border-r border-slate-300 text-center font-mono font-bold text-amber-700">
                      {row.posRusak}
                    </td>

                    {/* POSKAMLING: TOTAL */}
                    <td className="py-1.5 px-2.5 border-r border-slate-300 text-center font-mono font-black text-slate-950 bg-amber-50/40">
                      {row.totalPos}
                    </td>

                    {/* KEGIATAN PATROLI */}
                    <td className="py-1.5 px-2.5 border-r border-slate-300 text-center font-mono font-bold text-slate-900">
                      {row.kegiatanPatroli}
                    </td>

                    {/* KETERANGAN */}
                    <td className="py-1.5 px-3 text-center font-bold text-emerald-700">
                      {row.keterangan}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* 5. FOOTER JUMLAH KESELURUHAN (SE-KAB. HST) */}
            <tfoot>
              <tr className="bg-[#DCEBF9] text-slate-900 font-black text-[11px] uppercase border-t-2 border-slate-400">
                <td colSpan={2} className="py-2 px-3 border-r border-slate-300 text-center tracking-wider">
                  JUMLAH KESELURUHAN (SE-KAB. HST)
                </td>
                <td className="py-2 px-2 border-r border-slate-300 text-center font-mono font-black">
                  {totalRekap.pria}
                </td>
                <td className="py-2 px-2 border-r border-slate-300 text-center font-mono font-black">
                  {totalRekap.wanita}
                </td>
                <td className="py-2 px-2.5 border-r border-slate-300 text-center font-mono font-black bg-blue-200/50">
                  {totalRekap.totalLinmas}
                </td>
                <td className="py-2 px-2 border-r border-slate-300 text-center font-mono font-black">
                  {totalRekap.posBaik}
                </td>
                <td className="py-2 px-2 border-r border-slate-300 text-center font-mono font-black text-amber-800">
                  {totalRekap.posRusak}
                </td>
                <td className="py-2 px-2.5 border-r border-slate-300 text-center font-mono font-black bg-[#FDF0A6]/70">
                  {totalRekap.totalPos}
                </td>
                <td className="py-2 px-2.5 border-r border-slate-300 text-center font-mono font-black">
                  {totalRekap.kegiatanPatroli}
                </td>
                <td className="py-2 px-3 text-center font-black text-emerald-900 tracking-wider">
                  KONDUSIF
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* 6. TANDA TANGAN PENGESAHAN KEPALA SATUAN POLISI PAMONG PRAJA */}
        <div className="mt-5 pt-2 flex justify-end text-[11px] text-slate-900 page-break-inside-avoid">
          <div className="text-right w-72 space-y-0.5">
            <p className="font-serif">Barabai, {tanggalHariIni}</p>
            <p className="font-bold uppercase leading-tight font-serif">
              Mengetahui,<br />
              KEPALA SATUAN POLISI PAMONG PRAJA<br />
              KABUPATEN HULU SUNGAI TENGAH
            </p>
            
            {/* Space untuk tanda tangan & cap stempel dinas */}
            <div className="h-14 flex items-center justify-center">
              <span className="text-[9px] text-slate-300 font-mono italic print:hidden">
                (Tanda Tangan & Cap Stempel Dinas)
              </span>
            </div>

            <p className="font-extrabold text-xs underline decoration-1 underline-offset-2">
              Drs. AHMAD FATHONI
            </p>
            <p className="text-[10px] text-slate-700 font-medium">Pembina Utama Muda / IV / c</p>
            <p className="text-[10.5px] font-mono text-slate-800">NIP. 19720217 199203 1 006</p>
          </div>
        </div>
      </div>
    </div>
  );
}
