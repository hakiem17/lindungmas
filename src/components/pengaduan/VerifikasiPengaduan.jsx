import React, { useState } from 'react';
import { 
  Megaphone, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  Clock, 
  User, 
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { updateStatusPengaduan } from '../../data/storageService';

export default function VerifikasiPengaduan({ pengaduanList, onUpdate, onConvertToViolation }) {
  const [selectedReport, setSelectedReport] = useState(null);
  const [catatan, setCatatan] = useState('');

  const handleAction = (id, newStatus) => {
    updateStatusPengaduan(id, newStatus, catatan || `Telah diproses oleh petugas verifikasi.`);
    if (onUpdate) onUpdate();
    setSelectedReport(null);
    setCatatan('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0F2A4A] text-[#F0B429] flex items-center justify-center font-bold">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[#0F2A4A] text-base tracking-tight">
                Verifikasi Pengaduan Masyarakat Masuk
              </h3>
              <p className="text-xs text-slate-500">
                Laporan dari warga Hulu Sungai Tengah yang membutuhkan validasi petugas sebelum dijadikan berkas pelanggaran
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Complaints List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pengaduanList.map((item) => {
          const isPending = item.status === 'menunggu_verifikasi';

          return (
            <div 
              key={item.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs space-y-3 transition-all ${
                isPending ? 'border-amber-300 ring-2 ring-amber-300/20' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-mono text-xs font-bold text-[#0F2A4A]">{item.nomorTiket}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  item.status === 'diverifikasi' ? 'bg-blue-100 text-blue-800' :
                  item.status === 'ditindaklanjuti' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {item.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm leading-snug">{item.judul}</h4>
                <p className="text-xs text-slate-600 mt-1 line-clamp-3 leading-relaxed">{item.deskripsi}</p>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <img src={item.fotoUrl} alt="Bukti" className="w-14 h-14 rounded-xl object-cover border border-slate-200" />
                <div className="text-[11px] text-slate-500 space-y-0.5">
                  <p><b>Pelapor:</b> {item.namaPelapor} ({item.noHp})</p>
                  <p><b>Lokasi:</b> {item.alamat}, Kec. {item.kecamatan}</p>
                  <p><b>Waktu:</b> {item.tglPengaduan}</p>
                </div>
              </div>

              {item.catatanAdmin && (
                <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-600 border border-slate-200">
                  <b>Catatan Petugas:</b> {item.catatanAdmin}
                </div>
              )}

              {/* Action Buttons */}
              {isPending && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleAction(item.id, 'ditolak')}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 transition-colors"
                  >
                    Tolak Laporan
                  </button>
                  <button
                    onClick={() => {
                      handleAction(item.id, 'diverifikasi');
                      if (onConvertToViolation) onConvertToViolation(item);
                    }}
                    className="px-3.5 py-1.5 bg-[#0F2A4A] hover:bg-[#14365D] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#F0B429]" />
                    <span>Verifikasi & Buat Kasus Pelanggaran</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

