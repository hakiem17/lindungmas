import React, { useState, useRef } from 'react';
import { 
  ClipboardList, 
  Clock, 
  MapPin, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  X, 
  FileText, 
  Car,
  Users,
  Camera,
  Upload,
  Image as ImageIcon,
  ZoomIn,
  Sparkles,
  Info
} from 'lucide-react';
import Modal from '../common/Modal';
import { addPatroliActivity, deletePatroliActivity } from '../../data/storageService';

const KATEGORI_AKTIVITAS = [
  { value: 'Himbauan & Sosialisasi', label: '🗣️ Himbauan & Sosialisasi Trantibum' },
  { value: 'Peneguran Lisan / Tertulis', label: '⚠️ Peneguran Lisan / Tertulis' },
  { value: 'Penertiban PKL & Reklame', label: '🚨 Penertiban PKL & Spanduk Liar' },
  { value: 'Pengamanan Wilayah', label: '🛡️ Pengamanan Wilayah & Keramaian' },
  { value: 'Pengawasan Titik Rawan', label: '👁️ Pengawasan Titik Rawan' },
  { value: 'Koordinasi Warga / Pengelola', label: '🤝 Koordinasi Warga / Aparat Desa' }
];

const STATUS_TITIK_OPTIONS = [
  { value: 'Kondusif & Tertib', label: '✅ Kondusif & Tertib' },
  { value: 'Diberi Teguran Persuasif', label: '⚠️ Diberi Teguran Persuasif' },
  { value: 'Telah Ditertibkan', label: '🚨 Telah Ditertibkan di Tempat' },
  { value: 'Perlu Pantauan Lanjutan', label: '🔄 Perlu Pantauan Lanjutan' }
];

const DEMO_PATROL_PHOTOS = [
  {
    url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&auto=format&fit=crop&q=80',
    ket: 'Dokumentasi Situasi Trotoar & Pedestrian'
  },
  {
    url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=600&auto=format&fit=crop&q=80',
    ket: 'Dialog & Himbauan Humanis Petugas di Lapangan'
  },
  {
    url: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&auto=format&fit=crop&q=80',
    ket: 'Penertiban Spanduk & Penataan Area Parkir Pasar'
  }
];

export default function ModalAktivitasPatroli({
  isOpen,
  onClose,
  patrol,
  onActivityUpdated,
  onOpenReport
}) {
  const [waktu, setWaktu] = useState(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA');
  const [lokasi, setLokasi] = useState('');
  const [kategori, setKategori] = useState('Himbauan & Sosialisasi');
  const [uraian, setUraian] = useState('');
  const [statusTitik, setStatusTitik] = useState('Kondusif & Tertib');
  const [fotoList, setFotoList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [zoomPhoto, setZoomPhoto] = useState(null);

  const fileInputRef = useRef(null);

  if (!isOpen || !patrol) return null;

  const aktivitasList = patrol.aktivitasList || [];

  // Handle Photo Upload via File Picker / Camera
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (fotoList.length + files.length > 6) {
      alert('Maksimal 6 foto dokumentasi per catatan aktivitas.');
      return;
    }

    files.forEach((file) => {
      // Basic size limit: 8MB
      if (file.size > 8 * 1024 * 1024) {
        alert(`File ${file.name} melebihi batas 8MB!`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target?.result;
        if (dataUrl) {
          setFotoList((prev) => {
            if (prev.length >= 6) return prev;
            return [...prev, dataUrl];
          });
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemovePhoto = (indexToRemove) => {
    setFotoList((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddDemoPhoto = () => {
    const randomDemo = DEMO_PATROL_PHOTOS[Math.floor(Math.random() * DEMO_PATROL_PHOTOS.length)];
    if (fotoList.length >= 6) {
      alert('Maksimal 6 foto dokumentasi.');
      return;
    }
    setFotoList((prev) => [...prev, randomDemo.url]);
  };

  const handleAddActivity = (e) => {
    e.preventDefault();
    if (!lokasi.trim() || !uraian.trim()) {
      alert('Lokasi/Pos Singgah dan Uraian Kegiatan wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    addPatroliActivity(patrol.id, {
      waktu,
      lokasi: lokasi.trim(),
      kategori,
      uraian: uraian.trim(),
      statusTitik,
      petugas: patrol.regu,
      fotoList: fotoList,
      fotoUrl: fotoList[0] || ''
    });

    setIsSubmitting(false);
    setLokasi('');
    setUraian('');
    setFotoList([]);
    setWaktu(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA');
    setSuccessMsg('Catatan aktivitas patroli beserta foto dokumentasi berhasil disimpan!');
    setTimeout(() => setSuccessMsg(''), 3500);

    if (onActivityUpdated) onActivityUpdated();
  };

  const handleDeleteActivity = (actId) => {
    if (confirm('Hapus catatan aktivitas ini?')) {
      deletePatroliActivity(patrol.id, actId);
      if (onActivityUpdated) onActivityUpdated();
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Catat & Rekam Aktivitas Patroli Lapangan"
        subtitle={`${patrol.kode} - ${patrol.nama}`}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-5 text-left">
          {/* Patrol Quick Header Banner */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#0F2A4A] text-white flex items-center justify-center font-bold">
                <Car className="w-4 h-4 text-[#F0B429]" />
              </span>
              <div>
                <p className="font-bold text-[#0F2A4A]">{patrol.regu} ({patrol.jumlahPersonel || 6} Personel)</p>
                <span className="text-[11px] text-slate-500">
                  Kec. {patrol.kecamatan} &bull; Supervisor: <b>{patrol.supervisor || '-'}</b>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenReport) onOpenReport(patrol);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-[#F0B429]" />
                <span>Lihat Laporan Hasil Patroli (LHP)</span>
              </button>
            </div>
          </div>

          {/* Success Alert */}
          {successMsg && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Tambah Aktivitas */}
          <form onSubmit={handleAddActivity} className="p-4 bg-white rounded-xl border-2 border-slate-200 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-xs font-extrabold text-[#0F2A4A] uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Input Catatan Aktivitas & Dokumentasi Lapangan</span>
              </h4>
              <span className="text-[10px] text-slate-400 font-semibold">Terekam dalam LHP Resmi</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
              {/* Waktu */}
              <div className="sm:col-span-3">
                <label className="block font-bold text-slate-700 mb-1">Jam Kejadian *</label>
                <input
                  type="text"
                  value={waktu}
                  onChange={(e) => setWaktu(e.target.value)}
                  placeholder="09:15 WITA"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden font-mono font-bold"
                  required
                />
              </div>

              {/* Pos / Titik Singgah */}
              <div className="sm:col-span-5">
                <label className="block font-bold text-slate-700 mb-1">Pos / Titik Lokasi Singgah *</label>
                <input
                  type="text"
                  value={lokasi}
                  onChange={(e) => setLokasi(e.target.value)}
                  placeholder="Contoh: Depan Pasar Keramat Barabai"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden font-semibold"
                  required
                />
              </div>

              {/* Kategori */}
              <div className="sm:col-span-4">
                <label className="block font-bold text-slate-700 mb-1">Jenis Aktivitas *</label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-300 bg-white font-semibold focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
                >
                  {KATEGORI_AKTIVITAS.map(k => (
                    <option key={k.value} value={k.value}>{k.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Uraian Kegiatan */}
            <div className="text-xs">
              <label className="block font-bold text-slate-700 mb-1">
                Uraian Situasi & Tindakan Petugas Lapangan *
              </label>
              <textarea
                rows={2}
                value={uraian}
                onChange={(e) => setUraian(e.target.value)}
                placeholder="Jelaskan tindakan personil: sosialisasi humanis, peneguran lapak, penataan parkir, pembubaran potensi keributan, situasi aman kondusif..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden font-medium"
                required
              />
            </div>

            {/* UPLOAD FOTO DOKUMENTASI LAPANGAN */}
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 text-xs space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-bold text-[#0F2A4A]">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span>Foto Dokumentasi Aktivitas (Maks. 6 Foto)</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddDemoPhoto}
                    className="text-[11px] font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                    title="Gunakan foto simulasi patroli lapangan"
                  >
                    <Sparkles className="w-3 h-3 text-[#F0B429]" />
                    <span>+ Foto Simulasi Demo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] font-bold text-white bg-[#0F2A4A] hover:bg-[#163e6e] px-2.5 py-1 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Upload className="w-3 h-3 text-[#F0B429]" />
                    <span>Upload Foto</span>
                  </button>
                </div>
              </div>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                multiple
                className="hidden"
              />

              {/* Photo Preview Grid */}
              {fotoList.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
                  {fotoList.map((photo, pIdx) => (
                    <div 
                      key={pIdx} 
                      className="relative group rounded-lg overflow-hidden border border-slate-300 bg-black aspect-video sm:aspect-square flex items-center justify-center"
                    >
                      <img 
                        src={photo} 
                        alt={`Foto Bukti ${pIdx + 1}`} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setZoomPhoto(photo)}
                          className="p-1 bg-white/90 hover:bg-white text-slate-800 rounded-full transition-transform active:scale-95"
                          title="Perbesar Foto"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(pIdx)}
                          className="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-transform active:scale-95"
                          title="Hapus Foto"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] font-mono px-1 rounded">
                        #{pIdx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 border border-dashed border-slate-300 rounded-lg text-center cursor-pointer hover:bg-slate-100/60 transition-colors flex items-center justify-center gap-2 text-slate-500"
                >
                  <Camera className="w-4 h-4 text-slate-400" />
                  <span className="text-[11px] font-medium">Klik untuk upload foto dokumentasi dari kamera atau galeri perangkat</span>
                </div>
              )}
            </div>

            {/* Status Kondisi & Submit Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600 shrink-0">Kondisi Titik:</span>
                <select
                  value={statusTitik}
                  onChange={(e) => setStatusTitik(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-slate-50 font-bold text-[#0F2A4A]"
                >
                  {STATUS_TITIK_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#0F2A4A] hover:bg-[#163e6e] text-white font-extrabold rounded-xl shadow-xs transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5 text-[#F0B429]" />
                <span>Simpan Catatan Aktivitas</span>
              </button>
            </div>
          </form>

          {/* Linimasa Kronologis Aktivitas */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-[#0F2A4A]" />
                <span>Kronologi Aktivitas Patroli ({aktivitasList.length})</span>
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">Urutan waktu patroli</span>
            </div>

            {aktivitasList.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-400">
                <ClipboardList className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-bold text-slate-600">Belum ada catatan aktivitas untuk jadwal patroli ini.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Gunakan formulir di atas untuk merekam kegiatan & upload foto di setiap pos rute patroli.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                {aktivitasList.map((act, idx) => {
                  const actPhotos = Array.isArray(act.fotoList) && act.fotoList.length > 0 
                    ? act.fotoList 
                    : (act.fotoUrl ? [act.fotoUrl] : []);

                  return (
                    <div 
                      key={act.id || idx}
                      className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition-all text-xs space-y-2 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded font-mono font-bold bg-[#0F2A4A] text-[#F0B429] text-[10.5px]">
                            {act.waktu}
                          </span>
                          <span className="font-extrabold text-[#0F2A4A] text-xs">
                            📍 {act.lokasi}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border border-slate-200 text-slate-700">
                            {act.statusTitik || 'Kondusif & Tertib'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteActivity(act.id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                            title="Hapus aktivitas"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-slate-700 leading-relaxed font-medium">
                        {act.uraian}
                      </p>

                      {/* Display Attached Photos */}
                      {actPhotos.length > 0 && (
                        <div className="pt-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 mb-1.5">
                            <ImageIcon className="w-3 h-3 text-blue-600" />
                            <span>Foto Dokumentasi Lapangan ({actPhotos.length})</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {actPhotos.map((photo, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => setZoomPhoto(photo)}
                                className="relative rounded-lg overflow-hidden border border-slate-300 w-16 h-16 sm:w-20 sm:h-20 hover:ring-2 hover:ring-[#0F2A4A] transition-all cursor-pointer group/img"
                              >
                                <img 
                                  src={photo} 
                                  alt={`Bukti ${pIdx + 1}`} 
                                  className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-200" 
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                                  <ZoomIn className="w-4 h-4 text-white" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-200/70 font-medium">
                        <span>Kategori: <b>{act.kategori}</b></span>
                        <span>Pelaksana: <b>{act.petugas || patrol.regu}</b></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
            <span className="text-[11px] text-slate-500">
              Semua foto & catatan otomatis dirangkum ke dalam <b>Laporan Hasil Patroli (LHP)</b> resmi.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Selesai & Tutup
            </button>
          </div>
        </div>
      </Modal>

      {/* LIGHTBOX ZOOM MODAL */}
      {zoomPhoto && (
        <Modal
          isOpen={true}
          onClose={() => setZoomPhoto(null)}
          title="Tinjau Foto Dokumentasi Patroli"
          subtitle="Bukti visual situasi ketertiban umum di lapangan"
          maxWidth="max-w-2xl"
        >
          <div className="space-y-3 text-left">
            <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center max-h-[70vh]">
              <img 
                src={zoomPhoto} 
                alt="Zoom Bukti Patroli" 
                className="max-h-[70vh] w-auto object-contain" 
              />
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setZoomPhoto(null)}
                className="px-4 py-2 bg-[#0F2A4A] text-white rounded-xl font-bold text-xs hover:bg-[#163e6e] cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
