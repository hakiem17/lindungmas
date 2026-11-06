import React, { useRef } from 'react';
import { 
  Printer, 
  X, 
  Car, 
  CheckCircle2, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  FileText,
  Download,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import Modal from '../common/Modal';

export default function ModalLaporanPatroli({
  isOpen,
  onClose,
  patrol
}) {
  const printAreaRef = useRef(null);

  if (!isOpen || !patrol) return null;

  const aktivitasList = patrol.aktivitasList || [];
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Kumpulkan seluruh foto dokumentasi aktivitas untuk lampiran resmi
  const allPhotos = [];
  aktivitasList.forEach((act, actIdx) => {
    const list = Array.isArray(act.fotoList) && act.fotoList.length > 0
      ? act.fotoList
      : (act.fotoUrl ? [act.fotoUrl] : []);
    list.forEach((url, pIdx) => {
      allPhotos.push({
        url,
        waktu: act.waktu,
        lokasi: act.lokasi,
        kategori: act.kategori,
        uraian: act.uraian,
        statusTitik: act.statusTitik,
        actIndex: actIdx + 1,
        photoIndex: pIdx + 1
      });
    });
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Laporan Hasil Patroli Wilayah (LHP)"
      subtitle={`Dokumen Kedinasan Satpol PP - ${patrol.kode}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="font-bold text-slate-700">Format Resmi Laporan Kedinasan Siap Cetak (A4)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-[#0F2A4A] hover:bg-[#163e6e] text-white text-xs font-extrabold rounded-xl flex items-center gap-2 shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#F0B429]" />
              <span>Cetak Laporan (Print)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>

        {/* PRINTABLE OFFICIAL REPORT SHEET */}
        <div 
          ref={printAreaRef}
          className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xs text-slate-900 font-sans print:border-none print:shadow-none print:p-0 print:m-0"
        >
          {/* 1. KOP SURAT DINAS RESMI PEMKAB HST */}
          <div className="text-center pb-4 border-b-4 border-double border-slate-900 mb-6">
            <div className="flex items-center justify-center gap-4 mb-1">
              {/* Logo Pemkab Simulation */}
              <div className="w-16 h-16 rounded-full bg-[#0F2A4A] text-[#F0B429] flex flex-col items-center justify-center font-extrabold text-xs shrink-0 border-2 border-[#F0B429]">
                <span>HST</span>
                <span className="text-[8px] text-white font-normal">MURAKATA</span>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-slate-800">
                  Pemerintah Kabupaten Hulu Sungai Tengah
                </h3>
                <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-[#0F2A4A]">
                  Satuan Polisi Pamong Praja
                </h2>
                <p className="text-xs text-slate-600 font-medium">
                  Jalan Perwira No. 1 Barabai, Kabupaten Hulu Sungai Tengah, Kalimantan Selatan &bull; Kode Pos 71311
                </p>
                <p className="text-[11px] text-slate-500">
                  Telepon: (0517) 41234 &bull; Laman Resmi: <i>satpolpp.hulusungaitengahkab.go.id</i>
                </p>
              </div>
            </div>
          </div>

          {/* 2. JUDUL DOKUMEN LAPORAN */}
          <div className="text-center mb-6">
            <h3 className="text-base sm:text-lg font-black uppercase underline decoration-2 underline-offset-4 text-slate-900 tracking-tight">
              Laporan Hasil Pelaksanaan Patroli Wilayah (LHP)
            </h3>
            <p className="text-xs text-slate-700 font-bold mt-1 font-mono">
              Nomor: 300 / LHP-PATROLI / POL.PP-HST / {new Date().getFullYear()}
            </p>
          </div>

          {/* 3. BAGIAN I: DATA OPERASIONAL PATROLI */}
          <div className="mb-6 space-y-2 text-xs">
            <h4 className="font-extrabold uppercase text-[#0F2A4A] tracking-wider border-b border-slate-200 pb-1 text-[11px]">
              I. Dasar Pelaksanaan & Identitas Penugasan
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 pt-1 text-slate-800">
              <div className="flex">
                <span className="w-36 font-semibold text-slate-600 shrink-0">Kode Jadwal Patroli</span>
                <span className="w-3 text-center">:</span>
                <span className="font-bold font-mono">{patrol.kode}</span>
              </div>

              <div className="flex">
                <span className="w-36 font-semibold text-slate-600 shrink-0">Nama Kegiatan</span>
                <span className="w-3 text-center">:</span>
                <span className="font-bold">{patrol.nama}</span>
              </div>

              <div className="flex">
                <span className="w-36 font-semibold text-slate-600 shrink-0">Hari & Tanggal</span>
                <span className="w-3 text-center">:</span>
                <span>{patrol.tanggal}</span>
              </div>

              <div className="flex">
                <span className="w-36 font-semibold text-slate-600 shrink-0">Waktu Pelaksanaan</span>
                <span className="w-3 text-center">:</span>
                <span>{patrol.jamMulai} s/d {patrol.jamSelesai} WITA</span>
              </div>

              <div className="flex">
                <span className="w-36 font-semibold text-slate-600 shrink-0">Regu Operasional</span>
                <span className="w-3 text-center">:</span>
                <span className="font-bold text-[#0F2A4A]">{patrol.regu} ({patrol.jumlahPersonel || 6} Personel)</span>
              </div>

              <div className="flex">
                <span className="w-36 font-semibold text-slate-600 shrink-0">Supervisor / Pengendali</span>
                <span className="w-3 text-center">:</span>
                <span className="font-semibold">{patrol.supervisor || '-'}</span>
              </div>

              <div className="flex">
                <span className="w-36 font-semibold text-slate-600 shrink-0">Wilayah Kecamatan</span>
                <span className="w-3 text-center">:</span>
                <span className="font-semibold">Kecamatan {patrol.kecamatan || 'Barabai'}</span>
              </div>

              <div className="flex">
                <span className="w-36 font-semibold text-slate-600 shrink-0">Status Akhir Operasi</span>
                <span className="w-3 text-center">:</span>
                <span className="font-bold uppercase text-emerald-800">
                  {patrol.status === 'selesai' ? 'SELESAI & TUNTAS' : 'SEDANG BERJALAN'}
                </span>
              </div>

              <div className="sm:col-span-2 flex pt-1">
                <span className="w-36 font-semibold text-slate-600 shrink-0">Rute Perjalanan</span>
                <span className="w-3 text-center">:</span>
                <span className="leading-relaxed">{patrol.rute}</span>
              </div>

              {patrol.checkinAt && (
                <div className="sm:col-span-2 flex pt-1 bg-slate-50 p-2 rounded-lg border border-slate-200 text-[11px]">
                  <span className="w-36 font-semibold text-slate-600 shrink-0">Log Kehadiran GPS</span>
                  <span className="w-3 text-center">:</span>
                  <span>
                    Check-in: <b>{patrol.checkinAt}</b>
                    {patrol.checkoutAt && <> &bull; Check-out: <b>{patrol.checkoutAt}</b></>}
                    {patrol.checkinGps && <> &bull; Koordinat: <code>{patrol.checkinGps.lat}, {patrol.checkinGps.lng}</code></>}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 4. BAGIAN II: TABEL REKAPITULASI AKTIVITAS LAPANGAN */}
          <div className="mb-6 space-y-2 text-xs">
            <h4 className="font-extrabold uppercase text-[#0F2A4A] tracking-wider border-b border-slate-200 pb-1 text-[11px]">
              II. Rekapitulasi Rangkaian Aktivitas Lapangan Selama Patroli
            </h4>

            {aktivitasList.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center text-slate-500 italic">
                Belum ada aktivitas khusus yang dicatat. Sepanjang rute dalam situasi aman dan terkendali.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 text-[11px] font-extrabold uppercase tracking-wider">
                      <th className="border border-slate-300 py-2 px-2 text-center w-8">No</th>
                      <th className="border border-slate-300 py-2 px-2.5 w-20">Waktu</th>
                      <th className="border border-slate-300 py-2 px-2.5 w-36">Pos / Lokasi</th>
                      <th className="border border-slate-300 py-2 px-2.5 w-36">Jenis Kegiatan</th>
                      <th className="border border-slate-300 py-2 px-3">Uraian Hasil Tindakan Lapangan</th>
                      <th className="border border-slate-300 py-2 px-2.5 text-center w-28">Status Titik</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aktivitasList.map((act, idx) => {
                      const actPhotos = Array.isArray(act.fotoList) && act.fotoList.length > 0
                        ? act.fotoList
                        : (act.fotoUrl ? [act.fotoUrl] : []);

                      return (
                        <tr key={act.id || idx} className="border-b border-slate-200 hover:bg-slate-50/50">
                          <td className="border border-slate-300 py-2 px-2 text-center font-bold text-slate-600">
                            {idx + 1}
                          </td>
                          <td className="border border-slate-300 py-2 px-2.5 font-mono font-semibold text-slate-700 whitespace-nowrap">
                            {act.waktu}
                          </td>
                          <td className="border border-slate-300 py-2 px-2.5 font-bold text-[#0F2A4A]">
                            {act.lokasi}
                          </td>
                          <td className="border border-slate-300 py-2 px-2.5 text-slate-700 font-medium">
                            {act.kategori}
                          </td>
                          <td className="border border-slate-300 py-2 px-3 text-slate-800 leading-relaxed">
                            <div>{act.uraian}</div>
                            {actPhotos.length > 0 && (
                              <div className="mt-1 flex items-center gap-1 text-[10px] text-blue-700 font-bold print:text-black">
                                <Camera className="w-3 h-3 text-blue-600 print:text-black" />
                                <span>Lampiran Foto #{idx + 1} ({actPhotos.length} dokumentasi)</span>
                              </div>
                            )}
                          </td>
                          <td className="border border-slate-300 py-2 px-2 text-center text-[10.5px] font-bold text-slate-700 whitespace-nowrap">
                            {act.statusTitik || 'Kondusif'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 5. BAGIAN III: KESIMPULAN & SITUASI TRANTIBUM */}
          <div className="mb-6 space-y-2 text-xs">
            <h4 className="font-extrabold uppercase text-[#0F2A4A] tracking-wider border-b border-slate-200 pb-1 text-[11px]">
              III. Kesimpulan & Situasi Umum Ketertiban
            </h4>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed text-xs">
              <p>
                Berdasarkan hasil pemantauan dan tindakan operasional yang dilaksanakan oleh <b>{patrol.regu}</b> pada hari ini, secara umum situasi ketertiban umum dan ketenteraman masyarakat di sepanjang rute wilayah <b>Kecamatan {patrol.kecamatan}</b> terpantau <b>aman, tertib, dan kondusif</b>.
              </p>
              <p className="mt-1.5 text-slate-600">
                Tindakan pencegahan dini (*early warning*) dan himbauan humanis telah diberikan kepada masyarakat serta pedagang yang berpotensi melanggar Perda, dengan kepatuhan yang baik di lapangan.
              </p>
            </div>
          </div>

          {/* 6. BAGIAN IV: LAMPIRAN DOKUMENTASI VISUAL HASIL PATROLI */}
          {allPhotos.length > 0 && (
            <div className="mb-8 space-y-3 text-xs print:break-inside-avoid">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <h4 className="font-extrabold uppercase text-[#0F2A4A] tracking-wider text-[11px] flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-blue-600 print:text-black" />
                  <span>IV. Lampiran Dokumentasi Visual Hasil Patroli Lapangan ({allPhotos.length} Foto)</span>
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">Arsip Kedinasan Satpol PP Kab. HST</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                {allPhotos.map((item, pIdx) => (
                  <div 
                    key={pIdx} 
                    className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs print:shadow-none print:break-inside-avoid"
                  >
                    <div className="h-32 sm:h-36 bg-slate-100 overflow-hidden border-b border-slate-200">
                      <img 
                        src={item.url} 
                        alt={`Foto Dokumentasi ${pIdx + 1}`} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="p-2 space-y-1 text-[10.5px]">
                      <div className="flex items-center justify-between text-[9.5px]">
                        <span className="font-mono font-bold bg-slate-100 px-1 rounded text-slate-700">
                          {item.waktu}
                        </span>
                        <span className="font-bold text-slate-600">
                          {item.statusTitik || 'Kondusif'}
                        </span>
                      </div>
                      <p className="font-extrabold text-[#0F2A4A] line-clamp-1">
                        📍 {item.lokasi}
                      </p>
                      <p className="text-slate-600 line-clamp-2 leading-tight text-[10px]">
                        {item.uraian}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. BAGIAN V: PENGESAHAN & TANDA TANGAN KEDINASAN */}
          <div className="grid grid-cols-2 gap-8 text-xs pt-4 border-t border-slate-200 print:break-inside-avoid">
            {/* Sisi Kiri: Mengetahui Kasatpol PP */}
            <div className="text-center">
              <p className="text-slate-500 font-semibold mb-1">Mengetahui,</p>
              <p className="font-bold text-slate-900 uppercase">
                Kepala Satuan Polisi Pamong Praja<br />Kabupaten Hulu Sungai Tengah
              </p>

              {/* Space for stamp/signature */}
              <div className="h-20 flex items-center justify-center">
                <div className="border border-red-500/40 text-red-600 px-3 py-1 rounded text-[10px] font-bold rotate-[-3deg] uppercase">
                  Terverifikasi Kedinasan
                </div>
              </div>

              <p className="font-extrabold text-slate-900 underline text-sm">
                Drs. H. SUBHAN, M.Si
              </p>
              <p className="text-slate-600 text-[11px]">Pembina Utama Muda (IV/c)</p>
              <p className="text-slate-500 font-mono text-[10px]">NIP. 19740815 199603 1 002</p>
            </div>

            {/* Sisi Kanan: Supervisor / Perwira Pengendali */}
            <div className="text-center">
              <p className="text-slate-600 mb-1">
                Barabai, {currentDate}
              </p>
              <p className="font-bold text-slate-900 uppercase">
                Perwira Pengendali / Supervisor Regu
              </p>

              {/* Space for signature */}
              <div className="h-20 flex items-center justify-center">
                <div className="border border-blue-500/40 text-blue-800 px-3 py-1 rounded text-[10px] font-bold uppercase">
                  Regu Lapangan
                </div>
              </div>

              <p className="font-extrabold text-slate-900 underline text-sm">
                {patrol.supervisor || 'Kapten Inf. (Purn) Sudirman'}
              </p>
              <p className="text-slate-600 text-[11px]">Penanggung Jawab Patroli</p>
              <p className="text-slate-500 font-mono text-[10px]">Satpol PP Kab. Hulu Sungai Tengah</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

