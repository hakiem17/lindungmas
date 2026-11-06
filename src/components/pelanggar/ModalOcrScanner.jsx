import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Scan,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  Upload,
  Edit3,
  ClipboardPaste,
  FileText,
  RefreshCw,
  Info
} from 'lucide-react';
import Modal from '../common/Modal';
import { SAMPLE_KTP_PRESETS, parseKTPRawText, recognizeKTPImage, decodeNIK } from '../../utils/ocrHelper';
import { KECAMATAN_HST } from '../../data/mockData';
import { findPelanggarByNik } from '../../data/storageService';

const EMPTY_FORM = {
  nik: '',
  nama: '',
  tempatLahir: '',
  tglLahir: '',
  jenisKelamin: 'Laki-laki',
  pekerjaan: '',
  alamat: '',
  desa: '',
  kecamatan: '',
  noHp: '',
  fotoUrl: ''
};

export default function ModalOcrScanner({ isOpen, onClose, onApplyData, initialFile = null }) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [imageUrl, setImageUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState({ status: '', progress: 0 });
  const [rawText, setRawText] = useState('');
  const [confidence, setConfidence] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [error, setError] = useState('');
  const [source, setSource] = useState(null); // 'ocr' | 'paste' | 'demo'
  const [showRaw, setShowRaw] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const lastInitialFile = useRef(null);

  // Reset setiap kali modal dibuka
  useEffect(() => {
    if (isOpen) {
      setFormData(EMPTY_FORM);
      setImageUrl('');
      setRawText('');
      setConfidence(null);
      setWarnings([]);
      setError('');
      setSource(null);
      setShowRaw(false);
      setPasteMode(false);
      setPasteText('');
    } else {
      lastInitialFile.current = null;
    }
  }, [isOpen]);

  // Bila dibuka dari tombol "Foto KTP" dengan file langsung
  useEffect(() => {
    if (isOpen && initialFile && lastInitialFile.current !== initialFile) {
      lastInitialFile.current = initialFile;
      runOCR(initialFile);
    }
  }, [isOpen, initialFile]);

  if (!isOpen) return null;

  const applyParsed = (parsed, extra = {}) => {
    setFormData((prev) => ({
      ...EMPTY_FORM,
      ...Object.fromEntries(Object.entries(parsed).filter(([k, v]) => k in EMPTY_FORM && v)),
      jenisKelamin: parsed.jenisKelamin || 'Laki-laki',
      noHp: prev.noHp,
      ...extra
    }));
    setWarnings(parsed.warnings || []);
  };

  const runOCR = async (file) => {
    setError('');
    setIsScanning(true);
    setSource('ocr');
    setPasteMode(false);
    setProgress({ status: 'Memulai...', progress: 0 });
    try {
      const preview = URL.createObjectURL(file);
      setImageUrl(preview);
      const result = await recognizeKTPImage(file, setProgress);
      setRawText(result.rawText);
      setConfidence(result.confidence);
      applyParsed(result.data, { fotoUrl: result.imageUrl });
      setImageUrl(result.imageUrl);
    } catch (err) {
      console.error(err);
      setError(
        'Mesin OCR gagal dijalankan. Pastikan perangkat terhubung ke internet (model bahasa diunduh saat pertama kali), lalu coba lagi. Data tetap bisa diketik manual di bawah.'
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) runOCR(file);
  };

  const handleParsePaste = () => {
    if (!pasteText.trim()) return;
    const parsed = parseKTPRawText(pasteText);
    setSource('paste');
    setRawText(pasteText);
    setConfidence(null);
    applyParsed(parsed, { fotoUrl: imageUrl });
    setPasteMode(false);
  };

  const handleDemo = (p) => {
    setSource('demo');
    setRawText('');
    setConfidence(null);
    setImageUrl(p.fotoUrl);
    setWarnings([]);
    setFormData({ ...EMPTY_FORM, ...p });
  };

  const handleApply = () => {
    if (formData.nik.length !== 16 && !confirm('NIK belum 16 digit. Tetap terapkan ke formulir?')) return;
    onApplyData?.({ ...formData, fotoUrl: formData.fotoUrl || imageUrl });
    onClose();
  };

  const set = (k) => (e) => setFormData({ ...formData, [k]: e.target.value });

  const nikInfo = decodeNIK(formData.nik);
  const residivis = formData.nik.length === 16 ? findPelanggarByNik(formData.nik) : null;
  const kecObj = KECAMATAN_HST.find((k) => k.nama === formData.kecamatan);
  const confCls =
    confidence == null
      ? ''
      : confidence >= 80
        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
        : confidence >= 60
          ? 'bg-amber-50 text-amber-800 border-amber-300'
          : 'bg-rose-50 text-rose-800 border-rose-300';

  const inputCls =
    'w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pemindai e-KTP (OCR)"
      subtitle="Unggah / foto KTP → teks dibaca otomatis → periksa & koreksi → terapkan ke formulir"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4 text-left text-xs">
        {/* ===== AKSI UTAMA ===== */}
        <div className="flex flex-wrap items-center gap-2">
          <label className={`px-4 py-2 bg-[#0F2A4A] hover:bg-[#14365D] text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-xs ${isScanning ? 'opacity-50 pointer-events-none' : ''}`}>
            <Camera className="w-4 h-4 text-[#F0B429]" />
            <span>Foto / Unggah KTP</span>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
          </label>
          <button
            type="button"
            onClick={() => setPasteMode((v) => !v)}
            className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <ClipboardPaste className="w-4 h-4 text-blue-600" />
            <span>Tempel Teks (Google Lens)</span>
          </button>
          <div className="ml-auto flex items-center gap-1.5 text-[10.5px] text-slate-500">
            <span className="font-semibold">Data contoh (demo):</span>
            {SAMPLE_KTP_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleDemo(p)}
                className="px-2 py-1 rounded-lg border border-dashed border-slate-300 hover:bg-slate-100 text-slate-600 font-semibold cursor-pointer"
              >
                {p.nama.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Tips foto */}
        {!imageUrl && !pasteMode && source !== 'demo' && (
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
            <div className="text-[11px] leading-relaxed">
              <b>Tips agar hasil akurat:</b> foto KTP lurus (tidak miring), memenuhi bingkai, cahaya terang tanpa pantulan
              lampu/flash, dan teks tajam (tidak blur). Hasil OCR tetap wajib diperiksa petugas sebelum disimpan.
            </div>
          </div>
        )}

        {/* Mode tempel teks */}
        {pasteMode && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <p className="text-[11px] text-slate-600">
              Salin teks KTP dari Google Lens / fitur "Salin teks" kamera HP, lalu tempel di sini.
            </p>
            <textarea
              rows={6}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={'NIK : 6307011205850001\nNama : SYAHRIL RAMADHAN\nTempat/Tgl Lahir : BARABAI, 12-05-1985\n...'}
              className="w-full p-2.5 rounded-lg border border-slate-300 font-mono text-xs bg-white outline-hidden focus:ring-2 focus:ring-[#0F2A4A]"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleParsePaste}
                className="px-4 py-1.5 bg-[#0F2A4A] text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#F0B429]" />
                Urai Teks ke Form
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="text-[11px]">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* ===== KIRI: FOTO ASLI + STATUS ===== */}
          <div className="md:col-span-2 space-y-2">
            <div className="relative rounded-xl overflow-hidden border border-slate-300 bg-slate-100 aspect-[1.58] flex items-center justify-center">
              {imageUrl ? (
                <img src={imageUrl} alt="Foto KTP" className="w-full h-full object-contain bg-slate-900" />
              ) : (
                <div className="text-center text-slate-400 p-4">
                  <Scan className="w-10 h-10 mx-auto mb-1" />
                  <span className="text-[11px]">Foto KTP akan tampil di sini</span>
                </div>
              )}
              {isScanning && (
                <div className="absolute inset-0 bg-[#0F2A4A]/60 flex flex-col items-center justify-center text-white p-4">
                  <RefreshCw className="w-7 h-7 animate-spin text-[#F0B429] mb-2" />
                  <span className="text-[11px] font-semibold text-center">{progress.status}</span>
                  <div className="w-3/4 h-1.5 bg-white/20 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-[#F0B429] transition-all"
                      style={{ width: `${Math.round((progress.progress || 0) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {source && !isScanning && (
              <div className="flex flex-wrap items-center gap-1.5">
                {source === 'ocr' && confidence != null && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${confCls}`}>
                    Keyakinan OCR: {confidence}%
                  </span>
                )}
                {source === 'paste' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold border bg-blue-50 text-blue-800 border-blue-300">
                    Dari teks tempelan
                  </span>
                )}
                {source === 'demo' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold border bg-slate-100 text-slate-700 border-slate-300">
                    Data contoh — bukan hasil OCR
                  </span>
                )}
                {rawText && (
                  <button
                    type="button"
                    onClick={() => setShowRaw((v) => !v)}
                    className="text-[10.5px] text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-3 h-3" />
                    {showRaw ? 'Sembunyikan' : 'Lihat'} teks mentah
                  </button>
                )}
              </div>
            )}

            {showRaw && rawText && (
              <pre className="p-2 rounded-lg bg-slate-900 text-emerald-300 text-[10px] leading-snug max-h-48 overflow-auto whitespace-pre-wrap">
                {rawText}
              </pre>
            )}

            {source === 'ocr' && confidence != null && confidence < 60 && (
              <p className="text-[10.5px] text-rose-700">
                Kualitas foto rendah. Pertimbangkan foto ulang dengan cahaya lebih terang & posisi lurus.
              </p>
            )}
          </div>

          {/* ===== KANAN: FORM HASIL (DAPAT DIKOREKSI) ===== */}
          <div className="md:col-span-3 space-y-3">
            {/* Peringatan validasi */}
            {warnings.length > 0 && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-1">
                <div className="font-bold text-[11px] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Perlu diperiksa:
                </div>
                <ul className="list-disc pl-5 text-[10.5px] space-y-0.5">
                  {warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}

            {residivis && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-[11px]">
                ⚠️ <b>Residivis:</b> NIK ini terdaftar atas nama <b>{residivis.nama}</b> ({residivis.totalKasus} kasus,
                status terakhir {residivis.statusTerakhir?.toUpperCase()}).
              </div>
            )}

            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#0F2A4A]">
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              Periksa & koreksi hasil sebelum diterapkan
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="col-span-2">
                <div className="flex justify-between mb-0.5">
                  <label className="text-[11px] font-bold text-slate-700">NIK *</label>
                  <span className={`text-[10px] font-mono font-bold ${formData.nik.length === 16 && nikInfo?.valid ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {formData.nik.length}/16 {formData.nik.length === 16 ? (nikInfo?.valid ? '✓ struktur valid' : '⚠ struktur tidak valid') : ''}
                  </span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={16}
                  value={formData.nik}
                  onChange={(e) => setFormData({ ...formData, nik: e.target.value.replace(/\D/g, '') })}
                  className={`${inputCls} font-mono tracking-wider text-sm`}
                />
                {nikInfo?.valid && formData.kecamatan && !nikInfo.kodeKabupaten.startsWith('6307') && (
                  <p className="text-[10px] text-slate-500 mt-0.5">Info: NIK berasal dari luar Kab. HST (kode {nikInfo.kodeKabupaten}).</p>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Nama Lengkap *</label>
                <input type="text" value={formData.nama} onChange={set('nama')} className={inputCls} />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Tempat Lahir</label>
                <input type="text" value={formData.tempatLahir} onChange={set('tempatLahir')} className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Tanggal Lahir</label>
                <input type="date" value={formData.tglLahir} onChange={set('tglLahir')} className={inputCls} />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Jenis Kelamin</label>
                <select value={formData.jenisKelamin} onChange={set('jenisKelamin')} className={inputCls}>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Pekerjaan</label>
                <input type="text" value={formData.pekerjaan} onChange={set('pekerjaan')} className={inputCls} />
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Alamat & RT/RW</label>
                <input type="text" value={formData.alamat} onChange={set('alamat')} className={inputCls} />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Kecamatan</label>
                <input
                  type="text"
                  list="ocr-kec-list"
                  value={formData.kecamatan}
                  onChange={set('kecamatan')}
                  className={inputCls}
                />
                <datalist id="ocr-kec-list">
                  {KECAMATAN_HST.map((k) => <option key={k.id} value={k.nama} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Kel/Desa</label>
                <input
                  type="text"
                  list="ocr-desa-list"
                  value={formData.desa}
                  onChange={set('desa')}
                  className={inputCls}
                />
                <datalist id="ocr-desa-list">
                  {(kecObj?.desa || []).map((d) => <option key={d} value={d} />)}
                </datalist>
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">No. HP / WhatsApp (tidak ada di KTP)</label>
                <input type="text" value={formData.noHp} onChange={set('noHp')} className={`${inputCls} font-mono`} />
              </div>
            </div>
          </div>
        </div>

        {/* ===== FOOTER ===== */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl font-bold hover:bg-slate-100 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={isScanning || (!formData.nik && !formData.nama)}
            className="px-5 py-2 bg-[#0F2A4A] hover:bg-[#14365D] text-white rounded-xl font-extrabold flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4 text-[#F0B429]" />
            Terapkan ke Formulir
          </button>
        </div>
      </div>
    </Modal>
  );
}
