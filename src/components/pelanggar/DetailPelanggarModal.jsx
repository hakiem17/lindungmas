import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  FileText, 
  Camera, 
  Upload, 
  AlertTriangle, 
  Download, 
  ArrowRight, 
  ShieldAlert, 
  MapPin, 
  User, 
  FileCheck,
  Printer
} from 'lucide-react';
import Modal from '../common/Modal';
import { StageBadge, SourceBadge } from '../common/Badge';
import { advanceTindakLanjut } from '../../data/storageService';
import { generateOfficialLetterPDF } from '../../utils/pdfGenerator';

const STAGES_FLOW = ['pernyataan', 'sp1', 'sp2', 'sp3', 'eksekusi'];

export default function DetailPelanggarModal({ isOpen, onClose, pelanggaran, onUpdatePelanggaran }) {
  if (!pelanggaran) return null;

  const [activeStepTab, setActiveStepTab] = useState(pelanggaran.statusTindakLanjut);
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  
  // Advance form state (Gatekeeping requires proof)
  const [newCatatan, setNewCatatan] = useState('');
  const [newProofKet, setNewProofKet] = useState('Verifikasi lapangan oleh petugas');
  const [newProofUrl, setNewProofUrl] = useState('https://images.unsplash.com/photo-1577495508048-b635879837f1?w=600&auto=format&fit=crop&q=80');
  const [isAdvancing, setIsAdvancing] = useState(false);

  // Compute next available stage
  const currentStageIndex = STAGES_FLOW.indexOf(pelanggaran.statusTindakLanjut);
  const nextStage = currentStageIndex >= 0 && currentStageIndex < STAGES_FLOW.length - 1 
    ? STAGES_FLOW[currentStageIndex + 1] 
    : null;

  const handleAdvanceStage = (e) => {
    e.preventDefault();
    if (!nextStage) return;

    if (!newProofUrl) {
      alert('Sesuai SOP Satpol PP: Unggah foto/dokumen bukti wajib dilakukan sebelum menerbitkan surat peringatan tahap berikutnya!');
      return;
    }

    setIsAdvancing(true);

    const updated = advanceTindakLanjut(pelanggaran.id, nextStage, {
      catatan: newCatatan || `Peningkatan ke tahap ${nextStage.toUpperCase()} karena batas waktu terlewati dan belum ditertibkan mandiri.`,
      bukti: [
        {
          url: newProofUrl,
          ket: newProofKet || `Foto bukti saat verifikasi tahap ${nextStage.toUpperCase()}`
        }
      ]
    });

    setTimeout(() => {
      setIsAdvancing(false);
      setShowAdvanceForm(false);
      if (onUpdatePelanggaran) onUpdatePelanggaran(updated);
      setActiveStepTab(nextStage);
    }, 600);
  };

  const handleDownloadPDF = (step) => {
    const doc = generateOfficialLetterPDF(pelanggaran, step);
    doc.save(`${step.nomorSurat ? step.nomorSurat.replace(/[\/]/g, '_') : 'surat_resmi_satpolpp'}.pdf`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Level 2 — Detail Kasus & Sanksi Berjenjang`}
      subtitle={`Register: ${pelanggaran.nomorRegister} | Pelanggar: ${pelanggaran.namaPelanggar}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {/* SUMMARY HERO CARD */}
        <div className="bg-[#0F2A4A] text-white p-5 rounded-2xl shadow-md border border-[#F0B429]/30 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-[#F0B429]">Profil Pelanggar</span>
            <h4 className="text-lg font-bold text-white mt-0.5">{pelanggaran.namaPelanggar}</h4>
            <p className="text-xs text-slate-300 font-mono mt-0.5">NIK: {pelanggaran.nik}</p>
            <p className="text-xs text-slate-300 mt-1 line-clamp-1">{pelanggaran.alamat}</p>
          </div>

          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-[#F0B429]">Lokasi & Waktu Kejadian</span>
            <p className="text-xs font-semibold text-white mt-1">{pelanggaran.lokasiNama || pelanggaran.alamat}</p>
            <p className="text-xs text-slate-300 mt-0.5">Kecamatan {pelanggaran.kecamatan}</p>
            <p className="text-[11px] text-slate-400 mt-1">Dicatat pada: {pelanggaran.tanggal}</p>
          </div>

          <div className="flex flex-col justify-between items-start md:items-end">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#F0B429] block md:text-right">Status Penegakan</span>
              <div className="mt-1">
                <StageBadge stage={pelanggaran.statusTindakLanjut} />
              </div>
            </div>
            <div className="text-[11px] text-slate-300 mt-2 md:text-right">
              {pelanggaran.isSelesai ? 'Kasus Ditutup (Tertib)' : 'Proses Penegakan Berjalan'}
            </div>
          </div>
        </div>

        {/* STEPPER BERJENJANG (Pernyataan -> SP1 -> SP2 -> SP3 -> Eksekusi) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[#0F2A4A]" />
              <span>Linimasa Penegakan Berjenjang (Wajib Bersyarat)</span>
            </h4>
            
            {nextStage && !pelanggaran.isSelesai && (
              <button
                onClick={() => setShowAdvanceForm(!showAdvanceForm)}
                className="px-3 py-1.5 bg-[#F0B429] hover:bg-[#d99b16] text-[#0F2A4A] text-xs font-extrabold rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Tingkatkan ke {nextStage.toUpperCase()}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Stepper Progress Bar */}
          <div className="grid grid-cols-5 gap-2">
            {STAGES_FLOW.map((stageKey, idx) => {
              const stepRecord = pelanggaran.tindakLanjutList?.find(s => s.tahap === stageKey);
              const isPastOrCurrent = !!stepRecord;
              const isCurrent = pelanggaran.statusTindakLanjut === stageKey;

              return (
                <div
                  key={stageKey}
                  onClick={() => isPastOrCurrent && setActiveStepTab(stageKey)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    isCurrent 
                      ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/30' 
                      : isPastOrCurrent 
                      ? 'bg-slate-50 border-slate-300 cursor-pointer hover:bg-slate-100' 
                      : 'bg-slate-50/50 border-dashed border-slate-200 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-center mb-1">
                    {isPastOrCurrent ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-slate-300 text-[10px] text-slate-400 flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-bold text-[#0F2A4A] uppercase">{stageKey}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    {stepRecord ? stepRecord.tanggal.split(' ')[0] : 'Belum aktif'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ADVANCE TO NEXT STAGE FORM (GATEKEEPING VERIFICATION) */}
        {showAdvanceForm && nextStage && (
          <form onSubmit={handleAdvanceStage} className="bg-amber-50/70 border border-amber-300 p-5 rounded-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
                <h5 className="font-bold text-slate-900 text-sm">
                  Peningkatan Status ke: {nextStage.toUpperCase()} (Verifikasi Bukti Wajib)
                </h5>
              </div>
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded">
                SOP Satpol PP Kab. HST
              </span>
            </div>

            <p className="text-xs text-slate-700">
              Sistem mensyaratkan bukti dokumentasi lapangan sebelum surat resmi tahap selanjutnya dapat diterbitkan dan dicetak.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Pelanggaran / Alasan Eskalasi *
                </label>
                <textarea
                  rows={3}
                  value={newCatatan}
                  onChange={(e) => setNewCatatan(e.target.value)}
                  placeholder="Contoh: Petugas patroli mendapati pelanggar belum membongkar lapak liar sesuai tenggat waktu yang disepakati..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan Bukti Foto Baru (Wajib) *
                </label>
                <input
                  type="text"
                  value={newProofKet}
                  onChange={(e) => setNewProofKet(e.target.value)}
                  placeholder="Contoh: Foto lapak masih berdiri saat patroli hari ke-3"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#0F2A4A] outline-hidden mb-2"
                  required
                />

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newProofUrl}
                    onChange={(e) => setNewProofUrl(e.target.value)}
                    placeholder="URL / File Bukti"
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => alert('Foto kamera lapangan tersimulasi dan terlampir.')}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Ambil Foto</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAdvanceForm(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isAdvancing}
                className="px-4 py-2 bg-[#0F2A4A] hover:bg-[#14365D] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
              >
                <CheckCircle2 className="w-4 h-4 text-[#F0B429]" />
                <span>{isAdvancing ? 'Menyimpan & Menerbitkan Surat...' : `Konfirmasi Terbitkan Surat ${nextStage.toUpperCase()}`}</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP DETAILS & OFFICIAL PDF GENERATION BAR */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h5 className="font-bold text-[#0F2A4A] text-sm flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Dokumen Resmi: Tahap {activeStepTab.toUpperCase()}</span>
              </h5>
              <p className="text-xs text-slate-500 mt-0.5">
                Surat resmi pemerintah daerah dengan QR code validasi keaslian digital
              </p>
            </div>

            {/* Print Official Letter Action */}
            {pelanggaran.tindakLanjutList?.find(s => s.tahap === activeStepTab) && (
              <button
                onClick={() => handleDownloadPDF(pelanggaran.tindakLanjutList.find(s => s.tahap === activeStepTab))}
                className="px-4 py-2 bg-[#0F2A4A] hover:bg-[#14365D] text-white text-xs font-bold rounded-xl shadow-md shadow-[#0F2A4A]/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#F0B429]" />
                <span>Cetak / Download Surat PDF Resmi</span>
              </button>
            )}
          </div>

          {/* Active Step Content */}
          {(() => {
            const currentStepData = pelanggaran.tindakLanjutList?.find(s => s.tahap === activeStepTab);
            if (!currentStepData) {
              return <p className="text-xs text-slate-400 italic">Tahap ini belum diproses.</p>;
            }

            return (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block font-medium">Nomor Surat Resmi</span>
                    <span className="font-mono font-bold text-slate-900 mt-0.5 block">{currentStepData.nomorSurat}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block font-medium">Tanggal Diterbitkan</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">{currentStepData.tanggal}</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
                  <span className="text-slate-400 block font-medium mb-1">Catatan Penindakan Lapangan:</span>
                  <p className="text-slate-700 leading-relaxed">{currentStepData.catatan}</p>
                </div>

                {/* Evidence Photo Gallery */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                    Galeri Bukti Otentik Dilampirkan:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {currentStepData.bukti && currentStepData.bukti.length > 0 ? (
                      currentStepData.bukti.map((b, i) => (
                        <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                          <img src={b.url} alt="Bukti" className="w-full h-28 object-cover" />
                          <div className="p-2 text-[11px] text-slate-600 bg-slate-50 border-t border-slate-100">
                            {b.ket}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic col-span-3">Tidak ada foto bukti.</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </Modal>
  );
}

