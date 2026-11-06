import React, { useState, useMemo } from 'react';
import { 
  Car, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  UserCheck, 
  Calendar, 
  Play, 
  Plus, 
  AlertCircle, 
  ShieldCheck, 
  Search, 
  Filter, 
  Navigation, 
  ExternalLink, 
  Edit, 
  Trash2, 
  Users, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Info,
  ClipboardList,
  FileText,
  Printer,
  Camera
} from 'lucide-react';
import Modal from '../common/Modal';
import ModalAktivitasPatroli from './ModalAktivitasPatroli';
import ModalLaporanPatroli from './ModalLaporanPatroli';
import { 
  updatePatroliStatus, 
  createPatroli, 
  updatePatroli, 
  deletePatroli,
  getPegawaiList,
  getWilayahList
} from '../../data/storageService';
import { KECAMATAN_HST } from '../../data/mockData';

export default function PatroliMonitoring({ 
  patroliList = [], 
  onUpdatePatroli, 
  onNewViolationFromPatrol 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('semua');
  const [selectedKecamatan, setSelectedKecamatan] = useState('semua');
  const [checkinSuccess, setCheckinSuccess] = useState('');
  const [isCapturingGPS, setIsCapturingGPS] = useState(false);

  // Master Data
  const pegawaiList = useMemo(() => getPegawaiList(), []);
  const wilayahList = useMemo(() => getWilayahList() || KECAMATAN_HST, []);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatrol, setEditingPatrol] = useState(null);
  const [deletePatrolId, setDeletePatrolId] = useState(null);

  // Activity & Report Modals State
  const [selectedPatrolForActivity, setSelectedPatrolForActivity] = useState(null);
  const [selectedPatrolForReport, setSelectedPatrolForReport] = useState(null);

  // Keep active modal objects synced with latest list data
  const currentActivityPatrol = useMemo(() => {
    if (!selectedPatrolForActivity) return null;
    return patroliList.find(p => p.id === selectedPatrolForActivity.id) || selectedPatrolForActivity;
  }, [patroliList, selectedPatrolForActivity]);

  const currentReportPatrol = useMemo(() => {
    if (!selectedPatrolForReport) return null;
    return patroliList.find(p => p.id === selectedPatrolForReport.id) || selectedPatrolForReport;
  }, [patroliList, selectedPatrolForReport]);

  // Form State
  const [nama, setNama] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [jamMulai, setJamMulai] = useState('08:00');
  const [jamSelesai, setJamSelesai] = useState('12:00');
  const [regu, setRegu] = useState('Regu I (Kijang 01)');
  const [supervisor, setSupervisor] = useState(pegawaiList[0]?.nama || 'Kapten Inf. (Purn) Sudirman');
  const [kecamatan, setKecamatan] = useState('Barabai');
  const [rute, setRute] = useState('');
  const [jumlahPersonel, setJumlahPersonel] = useState(8);
  const [catatan, setCatatan] = useState('');

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingPatrol(null);
    setNama('');
    setTanggal(new Date().toISOString().slice(0, 10));
    setJamMulai('08:00');
    setJamSelesai('12:00');
    setRegu('Regu I (Kijang 01)');
    setSupervisor(pegawaiList[0]?.nama || 'Kapten Inf. (Purn) Sudirman');
    setKecamatan('Barabai');
    setRute('Mako Satpol PP -> Lapangan Dwi Warna -> Jl. Murakata');
    setJumlahPersonel(8);
    setCatatan('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (patrol) => {
    setEditingPatrol(patrol);
    setNama(patrol.nama || '');
    setTanggal(patrol.tanggal || new Date().toISOString().slice(0, 10));
    setJamMulai(patrol.jamMulai || '08:00');
    setJamSelesai(patrol.jamSelesai || '12:00');
    setRegu(patrol.regu || 'Regu I (Kijang 01)');
    setSupervisor(patrol.supervisor || pegawaiList[0]?.nama || '');
    setKecamatan(patrol.kecamatan || 'Barabai');
    setRute(patrol.rute || '');
    setJumlahPersonel(patrol.jumlahPersonel || 8);
    setCatatan(patrol.catatan || '');
    setIsModalOpen(true);
  };

  // Save Patrol Schedule
  const handleSavePatrol = (e) => {
    e.preventDefault();
    if (!nama.trim() || !rute.trim()) {
      alert('Nama kegiatan patroli dan rute wajib diisi!');
      return;
    }

    if (editingPatrol) {
      updatePatroli(editingPatrol.id, {
        nama: nama.trim(),
        tanggal,
        jamMulai,
        jamSelesai,
        regu,
        supervisor,
        kecamatan,
        rute: rute.trim(),
        jumlahPersonel: Number(jumlahPersonel),
        catatan: catatan.trim()
      });
      setCheckinSuccess(`Jadwal patroli ${editingPatrol.kode} berhasil diperbarui.`);
    } else {
      const created = createPatroli({
        nama: nama.trim(),
        tanggal,
        jamMulai,
        jamSelesai,
        regu,
        supervisor,
        kecamatan,
        rute: rute.trim(),
        jumlahPersonel: Number(jumlahPersonel),
        catatan: catatan.trim()
      });
      setCheckinSuccess(`Jadwal patroli baru ${created.kode} berhasil diterbitkan.`);
    }

    setIsModalOpen(false);
    if (onUpdatePatroli) onUpdatePatroli();
    setTimeout(() => setCheckinSuccess(''), 4000);
  };

  // Delete Patrol
  const handleDeletePatrol = (id) => {
    deletePatroli(id);
    setDeletePatrolId(null);
    setCheckinSuccess('Jadwal patroli berhasil dihapus.');
    if (onUpdatePatroli) onUpdatePatroli();
    setTimeout(() => setCheckinSuccess(''), 3000);
  };

  // Handle Status Change with GPS Capture on Check-In
  const handleStartPatrolWithGPS = (patrol) => {
    if ('geolocation' in navigator) {
      setIsCapturingGPS(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsCapturingGPS(false);
          const coords = {
            lat: parseFloat(pos.coords.latitude.toFixed(6)),
            lng: parseFloat(pos.coords.longitude.toFixed(6)),
            accuracy: Math.round(pos.coords.accuracy || 10)
          };
          const updated = updatePatroliStatus(patrol.id, 'berlangsung', coords);
          if (updated) {
            if (onUpdatePatroli) onUpdatePatroli();
            setCheckinSuccess(`GPS Check-in sukses! Regu ${patrol.regu} mulai berpatroli (Koordinat: ${coords.lat}, ${coords.lng}).`);
            setTimeout(() => setCheckinSuccess(''), 4000);
          }
        },
        () => {
          setIsCapturingGPS(false);
          // Fallback check-in without GPS if permission denied
          const updated = updatePatroliStatus(patrol.id, 'berlangsung');
          if (updated) {
            if (onUpdatePatroli) onUpdatePatroli();
            setCheckinSuccess(`Patroli ${patrol.kode} dimulai (Check-in manual tanpa koordinat GPS).`);
            setTimeout(() => setCheckinSuccess(''), 4000);
          }
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      const updated = updatePatroliStatus(patrol.id, 'berlangsung');
      if (updated) {
        if (onUpdatePatroli) onUpdatePatroli();
        setCheckinSuccess(`Patroli ${patrol.kode} dimulai.`);
        setTimeout(() => setCheckinSuccess(''), 4000);
      }
    }
  };

  const handleFinishPatrol = (patrol) => {
    const updated = updatePatroliStatus(patrol.id, 'selesai');
    if (updated) {
      if (onUpdatePatroli) onUpdatePatroli();
      setCheckinSuccess(`Patroli ${patrol.kode} telah diselesaikan dan dilaporkan.`);
      setTimeout(() => setCheckinSuccess(''), 4000);
    }
  };

  // KPIs
  const countTotal = patroliList.length;
  const countOngoing = patroliList.filter(p => p.status === 'berlangsung').length;
  const countScheduled = patroliList.filter(p => p.status === 'terjadwal').length;
  const countFinished = patroliList.filter(p => p.status === 'selesai').length;

  // Filtered List
  const filteredPatroli = useMemo(() => {
    return patroliList.filter(item => {
      const matchSearch = !searchTerm || 
        (item.nama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.rute || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.regu || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.supervisor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.kode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.kecamatan || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = selectedStatus === 'semua' || item.status === selectedStatus;
      const matchKec = selectedKecamatan === 'semua' || item.kecamatan === selectedKecamatan;

      return matchSearch && matchStatus && matchKec;
    });
  }, [patroliList, searchTerm, selectedStatus, selectedKecamatan]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#0F2A4A] text-white flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-[#F0B429]" />
              SISTEM PATROLI WILAYAH
            </span>
            <span className="text-xs text-slate-500 font-medium">Satpol PP Kab. Hulu Sungai Tengah</span>
          </div>
          <h2 className="text-xl font-extrabold text-[#0F2A4A] mt-1.5 tracking-tight">
            Monitoring Patroli & Penertiban Wilayah
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Penyusunan jadwal rute, check-in GPS regu lapangan, monitoring kehadiran personil, dan tindak lanjut temuan pelanggaran
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-[#0F2A4A] hover:bg-[#14365D] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-[#0F2A4A]/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-[#F0B429]" />
          <span>Buat Jadwal Patroli Regu</span>
        </button>
      </div>

      {/* KPI Mini Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Jadwal</span>
          <p className="text-2xl font-extrabold text-[#0F2A4A] mt-1 font-mono">{countTotal}</p>
          <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 mt-1">
            <Calendar className="w-3.5 h-3.5 text-[#F0B429]" /> Agenda Patroli
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sedang Berlangsung</span>
          <p className="text-2xl font-extrabold text-amber-700 mt-1 font-mono">{countOngoing}</p>
          <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1 mt-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Regu Lapangan Aktif
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Terjadwal (Mendatang)</span>
          <p className="text-2xl font-extrabold text-blue-700 mt-1 font-mono">{countScheduled}</p>
          <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1 mt-1">
            <Clock className="w-3.5 h-3.5" /> Menunggu Jam Mulai
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tuntas / Selesai</span>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1 font-mono">{countFinished}</p>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Telah Dilaporkan
          </span>
        </div>
      </div>

      {/* Success Notification Alert */}
      {checkinSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{checkinSuccess}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama patroli, rute, regu, supervisor, atau kode..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden text-slate-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden cursor-pointer"
          >
            <option value="semua">Semua Status ({patroliList.length})</option>
            <option value="berlangsung">Sedang Berlangsung ({countOngoing})</option>
            <option value="terjadwal">Terjadwal ({countScheduled})</option>
            <option value="selesai">Selesai ({countFinished})</option>
          </select>

          {/* Kecamatan Filter */}
          <select
            value={selectedKecamatan}
            onChange={(e) => setSelectedKecamatan(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden cursor-pointer"
          >
            <option value="semua">Semua Wilayah</option>
            {wilayahList.map(k => (
              <option key={k.id} value={k.nama}>{k.nama}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Patrol Schedules */}
      {filteredPatroli.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <Car className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-slate-600 text-sm">Tidak ada jadwal patroli yang sesuai filter</p>
          <p className="text-xs text-slate-400 mt-1">Silakan ubah kata kunci pencarian atau buat jadwal patroli baru.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatroli.map((patrol) => {
            const isOngoing = patrol.status === 'berlangsung';
            const isFinished = patrol.status === 'selesai';

            return (
              <div
                key={patrol.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
                  isOngoing 
                    ? 'border-amber-400 ring-2 ring-amber-400/20' 
                    : isFinished 
                      ? 'border-slate-200 bg-slate-50/30' 
                      : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Top Header: Code, Status & Actions */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {patrol.kode}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                        isOngoing ? 'bg-amber-100 text-amber-800 animate-pulse' :
                        isFinished ? 'bg-emerald-100 text-emerald-800' : 
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {patrol.status === 'berlangsung' ? 'BERLANGSUNG' :
                         patrol.status === 'terjadwal' ? 'TERJADWAL' : 'SELESAI'}
                      </span>

                      {/* Edit & Delete Mini Buttons */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(patrol)}
                        title="Edit Jadwal"
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletePatrolId(patrol.id)}
                        title="Hapus Jadwal"
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="font-bold text-[#0F2A4A] text-sm leading-snug mb-2">
                    {patrol.nama}
                  </h4>

                  {/* Details List */}
                  <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span><b>Regu:</b> {patrol.regu} ({patrol.jumlahPersonel || 6} Personel)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span><b>Waktu:</b> {patrol.tanggal} ({patrol.jamMulai} - {patrol.jamSelesai} WITA)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#F0B429] shrink-0" />
                      <span><b>Wilayah:</b> Kec. {patrol.kecamatan || 'Barabai'}</span>
                    </div>

                    <div className="flex items-start gap-2 pt-0.5">
                      <Navigation className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2"><b>Rute:</b> {patrol.rute}</span>
                    </div>

                    {patrol.supervisor && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                        <Users className="w-3 h-3 text-slate-400 shrink-0" />
                        <span><b>Supervisor:</b> {patrol.supervisor}</span>
                      </div>
                    )}

                    {/* GPS Check-in Info if available */}
                    {patrol.checkinAt && (
                      <div className="bg-emerald-50 text-emerald-800 p-2 rounded-lg text-[11px] font-medium border border-emerald-200 mt-2">
                        <div className="flex items-center justify-between">
                          <span>Check-in: <b>{patrol.checkinAt}</b></span>
                          {patrol.checkoutAt && <span>Check-out: <b>{patrol.checkoutAt}</b></span>}
                        </div>
                        {patrol.checkinGps && (
                          <div className="text-[10px] font-mono text-emerald-700 mt-0.5">
                            GPS: {patrol.checkinGps.lat}, {patrol.checkinGps.lng} (±{patrol.checkinGps.accuracy}m)
                          </div>
                        )}
                      </div>
                    )}

                    {/* Activity Log Mini Banner */}
                    <div className="pt-2">
                      {(() => {
                        const actCount = (patrol.aktivitasList || []).length;
                        const photoCount = (patrol.aktivitasList || []).reduce((acc, a) => {
                          const pLen = Array.isArray(a.fotoList) ? a.fotoList.length : (a.fotoUrl ? 1 : 0);
                          return acc + pLen;
                        }, 0);

                        return (
                          <button
                            type="button"
                            onClick={() => setSelectedPatrolForActivity(patrol)}
                            className="w-full p-2 bg-blue-50/80 hover:bg-blue-100/80 rounded-xl border border-blue-200/80 text-blue-900 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                            title="Catat dan rekam rincian aktivitas beserta foto selama patroli berlangsung"
                          >
                            <span className="flex items-center gap-1.5 text-[11px]">
                              <ClipboardList className="w-3.5 h-3.5 text-blue-700" />
                              <span>Aktivitas: <b>{actCount} Catatan</b></span>
                              {photoCount > 0 && (
                                <span className="inline-flex items-center gap-0.5 bg-blue-100/90 text-blue-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                  <Camera className="w-2.5 h-2.5 text-blue-700" />
                                  <span>{photoCount} Foto</span>
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-blue-700 font-extrabold underline flex items-center gap-0.5">
                              <span>Log & Foto</span>
                              <span>&rarr;</span>
                            </span>
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col gap-2">
                  {/* Row 1 Actions: Laporan Hasil Patroli & Log Kegiatan */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPatrolForReport(patrol)}
                      className="py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border border-slate-300 transition-colors cursor-pointer shadow-2xs"
                      title="Lihat dan Cetak Laporan Hasil Patroli (LHP) resmi"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-700" />
                      <span>Laporan (LHP)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPatrolForActivity(patrol)}
                      className="py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border border-blue-200 transition-colors cursor-pointer shadow-2xs"
                      title="Tambah catatan aktivitas kegiatan lapangan"
                    >
                      <ClipboardList className="w-3.5 h-3.5 text-blue-600" />
                      <span>Log Kegiatan</span>
                    </button>
                  </div>

                  {/* Row 2 Actions: Status Workflow */}
                  <div>
                    {isOngoing ? (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => onNewViolationFromPatrol(patrol)}
                          className="py-2 bg-[#F0B429] hover:bg-[#d99b16] text-[#0F2A4A] font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4 text-[#0F2A4A]" />
                          <span>Catat Temuan</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleFinishPatrol(patrol)}
                          className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          Check-out Selesai
                        </button>
                      </div>
                    ) : !isFinished ? (
                      <button
                        type="button"
                        disabled={isCapturingGPS}
                        onClick={() => handleStartPatrolWithGPS(patrol)}
                        className="w-full py-2.5 bg-[#0F2A4A] hover:bg-[#14365D] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5 text-[#F0B429]" />
                        <span>{isCapturingGPS ? 'Mengambil Titik GPS...' : 'Mulai Patroli (Check-in GPS)'}</span>
                      </button>
                    ) : (
                      <div className="w-full text-center text-xs text-emerald-700 font-bold py-2 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Patroli Tuntas & Dilaporkan</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL BUAT / EDIT JADWAL PATROLI REGU */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPatrol ? 'Edit Jadwal Patroli Wilayah' : 'Buat Jadwal Patroli Regu Baru'}
        subtitle="Rencanakan rute operasi, regu bertugas, wilayah kecamatan, dan waktu operasional"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSavePatrol} className="space-y-4 text-xs">
          {/* Nama Kegiatan */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Nama Kegiatan Patroli / Operasi *
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Patroli Penegakan K3 Trotoar & Reklame Barabai"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden text-slate-800"
              required
            />
          </div>

          {/* Tanggal & Waktu */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Tanggal *</label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden text-slate-800"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Jam Mulai (WITA) *</label>
              <input
                type="time"
                value={jamMulai}
                onChange={(e) => setJamMulai(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden text-slate-800"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Jam Selesai (WITA) *</label>
              <input
                type="time"
                value={jamSelesai}
                onChange={(e) => setJamSelesai(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden text-slate-800"
                required
              />
            </div>
          </div>

          {/* Regu & Jumlah Personel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Regu Operasional *</label>
              <select
                value={regu}
                onChange={(e) => setRegu(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden text-slate-800 cursor-pointer"
              >
                <option value="Regu I (Kijang 01)">Regu I (Kijang 01 - Murakata)</option>
                <option value="Regu II (Kijang 02)">Regu II (Kijang 02)</option>
                <option value="Regu Gabungan Penegakan & Trantibum">Regu Gabungan Penegakan & Trantibum</option>
                <option value="Tim Khusus Penertiban">Tim Khusus Penertiban</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Jumlah Personel *</label>
              <input
                type="number"
                min="1"
                max="50"
                value={jumlahPersonel}
                onChange={(e) => setJumlahPersonel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden text-slate-800"
                required
              />
            </div>
          </div>

          {/* Supervisor & Wilayah Kecamatan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Supervisor / Pimpinan Regu *</label>
              <select
                value={supervisor}
                onChange={(e) => setSupervisor(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden text-slate-800 cursor-pointer"
              >
                {pegawaiList.map(peg => (
                  <option key={peg.id} value={peg.nama}>
                    {peg.nama} ({peg.jabatan || 'Anggota'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Kecamatan Fokus *</label>
              <select
                value={kecamatan}
                onChange={(e) => setKecamatan(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden text-slate-800 cursor-pointer"
              >
                {wilayahList.map(kec => (
                  <option key={kec.id} value={kec.nama}>
                    Kec. {kec.nama}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Rute Lintasan */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Rute Patroli / Titik Singgah *
            </label>
            <textarea
              rows={2}
              value={rute}
              onChange={(e) => setRute(e.target.value)}
              placeholder="Contoh: Mako Satpol PP -> Lapangan Dwi Warna -> Jl. Brigjend H. Hasan Basry -> Pasar Keramat Barabai"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden text-slate-800"
              required
            />
          </div>

          {/* Catatan / Arahan Khusus */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Catatan / Instruksi Khusus (Opsional)
            </label>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Prioritaskan penertiban gerobak pedagang di bahu jalan"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden text-slate-800"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-100 font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0F2A4A] hover:bg-[#14365D] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Check className="w-4 h-4 text-[#F0B429]" />
              <span>{editingPatrol ? 'Simpan Perubahan' : 'Terbitkan Jadwal'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL KONFIRMASI HAPUS JADWAL PATROLI */}
      {/* ========================================================================= */}
      {deletePatrolId && (
        <Modal
          isOpen={true}
          onClose={() => setDeletePatrolId(null)}
          title="Konfirmasi Hapus Jadwal Patroli"
          subtitle="Tindakan ini akan menghapus jadwal patroli dari daftar aktif"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
              Apakah Anda yakin ingin menghapus jadwal patroli ini?
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletePatrolId(null)}
                className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-100 font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeletePatrol(deletePatrolId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold cursor-pointer"
              >
                Ya, Hapus Jadwal
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL PENCATATAN AKTIVITAS SELAMA PATROLI */}
      {/* ========================================================================= */}
      <ModalAktivitasPatroli
        isOpen={!!selectedPatrolForActivity}
        onClose={() => setSelectedPatrolForActivity(null)}
        patrol={currentActivityPatrol}
        onActivityUpdated={onUpdatePatroli}
        onOpenReport={(patrol) => setSelectedPatrolForReport(patrol)}
      />

      {/* ========================================================================= */}
      {/* MODAL LAPORAN HASIL PATROLI (LHP) */}
      {/* ========================================================================= */}
      <ModalLaporanPatroli
        isOpen={!!selectedPatrolForReport}
        onClose={() => setSelectedPatrolForReport(null)}
        patrol={currentReportPatrol}
      />
    </div>
  );
}
