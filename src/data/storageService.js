// ==============================================================================
// STORAGE SERVICE (OFFLINE-FIRST LOCAL STORAGE & MOCK SUPABASE ADAPTER)
// ==============================================================================
import {
  INITIAL_PELANGGAR,
  INITIAL_PELANGGARAN,
  INITIAL_PENGADUAN,
  INITIAL_JADWAL_PATROLI,
  INITIAL_REKAP_TRANTIBUM,
  INITIAL_PEGAWAI,
  INITIAL_PELAPOR,
  PERDA_HST,
  KECAMATAN_HST
} from './mockData.js';

const STORAGE_KEYS = {
  PELANGGAR: 'siperda_hst_pelanggar',
  PELANGGARAN: 'siperda_hst_pelanggaran',
  PENGADUAN: 'siperda_hst_pengaduan',
  PATROLI: 'siperda_hst_patroli',
  REKAP_TRANTIBUM: 'siperda_hst_rekap_trantibum',
  PEGAWAI: 'siperda_hst_pegawai',
  WILAYAH: 'siperda_hst_wilayah',
  PERDA: 'siperda_hst_perda',
  PELAPOR: 'siperda_hst_pelapor',
  ACTIVE_ROLE: 'siperda_hst_active_role',
  OFFLINE_QUEUE: 'siperda_hst_offline_queue',
  AUTH_SESSION: 'siperda_hst_auth_session'
};

export const getAuthSession = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const saveAuthSession = (user) => {
  if (!user) return null;
  localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(user));
  if (user.peran) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, user.peran);
  }
  return user;
};

export const clearAuthSession = () => {
  localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
};

export const initStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.PELANGGAR)) {
    localStorage.setItem(STORAGE_KEYS.PELANGGAR, JSON.stringify(INITIAL_PELANGGAR));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PELANGGARAN)) {
    localStorage.setItem(STORAGE_KEYS.PELANGGARAN, JSON.stringify(INITIAL_PELANGGARAN));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PENGADUAN)) {
    localStorage.setItem(STORAGE_KEYS.PENGADUAN, JSON.stringify(INITIAL_PENGADUAN));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PATROLI)) {
    localStorage.setItem(STORAGE_KEYS.PATROLI, JSON.stringify(INITIAL_JADWAL_PATROLI));
  }
  if (!localStorage.getItem(STORAGE_KEYS.REKAP_TRANTIBUM)) {
    localStorage.setItem(STORAGE_KEYS.REKAP_TRANTIBUM, JSON.stringify(INITIAL_REKAP_TRANTIBUM));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PEGAWAI)) {
    localStorage.setItem(STORAGE_KEYS.PEGAWAI, JSON.stringify(INITIAL_PEGAWAI));
  }
  if (!localStorage.getItem(STORAGE_KEYS.WILAYAH)) {
    localStorage.setItem(STORAGE_KEYS.WILAYAH, JSON.stringify(KECAMATAN_HST));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PERDA)) {
    localStorage.setItem(STORAGE_KEYS.PERDA, JSON.stringify(PERDA_HST));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PELAPOR)) {
    localStorage.setItem(STORAGE_KEYS.PELAPOR, JSON.stringify(INITIAL_PELAPOR));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE)) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, 'user');
  }
};

// PELANGGAR OPERATIONS
export const getPelanggarList = () => {
  initStorage();
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PELANGGAR) || '[]');
  } catch (e) {
    return INITIAL_PELANGGAR;
  }
};

export const findPelanggarByNik = (nik) => {
  const list = getPelanggarList();
  const cleanNik = (nik || '').trim();
  return list.find(p => p.nik === cleanNik) || null;
};

export const savePelanggar = (pelanggarData) => {
  const list = getPelanggarList();
  const existingIndex = list.findIndex(p => p.nik === pelanggarData.nik);

  if (existingIndex >= 0) {
    // Update existing
    list[existingIndex] = {
      ...list[existingIndex],
      ...pelanggarData,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.PELANGGAR, JSON.stringify(list));
    return list[existingIndex];
  } else {
    // Create new
    const newPelanggar = {
      id: `plgr-${Date.now().toString().slice(-6)}`,
      totalKasus: 0,
      statusTerakhir: 'pernyataan',
      ...pelanggarData,
      createdAt: new Date().toISOString()
    };
    list.unshift(newPelanggar);
    localStorage.setItem(STORAGE_KEYS.PELANGGAR, JSON.stringify(list));
    return newPelanggar;
  }
};

// PELANGGARAN OPERATIONS
export const getPelanggaranList = () => {
  initStorage();
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PELANGGARAN) || '[]');
  } catch (e) {
    return INITIAL_PELANGGARAN;
  }
};

export const getPelanggaranByPelanggarId = (pelanggarId) => {
  const list = getPelanggaranList();
  return list.filter(p => p.pelanggarId === pelanggarId);
};

export const createPelanggaran = (data) => {
  const list = getPelanggaranList();
  const count = list.length + 1;
  const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
  const regNo = `PLG-HST-${yearMonth}-${String(count).padStart(4, '0')}`;

  // Find or create pelanggar
  let pelanggar = findPelanggarByNik(data.nik);
  if (!pelanggar) {
    pelanggar = savePelanggar({
      nik: data.nik,
      nama: data.namaPelanggar,
      tempatLahir: data.tempatLahir || 'Barabai',
      tglLahir: data.tglLahir || '1990-01-01',
      jenisKelamin: data.jenisKelamin || 'Laki-laki',
      pekerjaan: data.pekerjaan || 'Wiraswasta',
      alamat: data.alamat,
      desa: data.desa,
      kecamatan: data.kecamatan,
      noHp: data.noHp,
      fotoKtp: data.fotoKtp
    });
  }

  // Initial stage is 'pernyataan'
  const newPelanggaran = {
    id: `plg-${Date.now().toString().slice(-6)}`,
    nomorRegister: regNo,
    pelanggarId: pelanggar.id,
    namaPelanggar: pelanggar.nama,
    nik: pelanggar.nik,
    tanggal: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
    sumber: data.sumber || 'patroli',
    lokasiNama: data.lokasiNama || 'Lokasi Kejadian Lapangan',
    alamat: data.alamat,
    kecamatan: data.kecamatan,
    desa: data.desa,
    lat: data.lat || -2.5833,
    lng: data.lng || 115.3811,
    perdaIds: data.perdaIds || ['perda-1'],
    deskripsi: data.deskripsi,
    statusTindakLanjut: 'pernyataan',
    isSelesai: false,
    petugasPencatat: data.petugasPencatat || 'Petugas Satpol PP Lapangan',
    tindakLanjutList: [
      {
        tahap: 'pernyataan',
        tanggal: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
        nomorSurat: `005/SPT-SPP/HST/${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
        filePdfUrl: '#',
        bukti: Array.isArray(data.buktiFotoList) && data.buktiFotoList.length > 0
          ? data.buktiFotoList.map((item, idx) => ({
            url: typeof item === 'string' ? item : (item.url || ''),
            ket: (typeof item === 'object' && item.ket) ? item.ket : `Foto bukti awal penindakan #${idx + 1}`
          }))
          : data.buktiFoto ? [{ url: data.buktiFoto, ket: 'Foto bukti awal penindakan di tempat' }] : [],
        catatan: data.catatanAwal || 'Pencatatan pelanggaran pertama dan pengisian Surat Pernyataan komitmen.'
      }
    ]
  };

  list.unshift(newPelanggaran);
  localStorage.setItem(STORAGE_KEYS.PELANGGARAN, JSON.stringify(list));

  // Update pelanggar total kasus
  const allPelanggar = getPelanggarList();
  const targetIdx = allPelanggar.findIndex(p => p.id === pelanggar.id);
  if (targetIdx >= 0) {
    allPelanggar[targetIdx].totalKasus = (allPelanggar[targetIdx].totalKasus || 0) + 1;
    allPelanggar[targetIdx].statusTerakhir = 'pernyataan';
    localStorage.setItem(STORAGE_KEYS.PELANGGAR, JSON.stringify(allPelanggar));
  }

  return newPelanggaran;
};

// PROGRESSION WORKFLOW (Pernyataan -> SP1 -> SP2 -> SP3 -> Eksekusi)
export const advanceTindakLanjut = (pelanggaranId, newStage, stageData) => {
  const list = getPelanggaranList();
  const idx = list.findIndex(p => p.id === pelanggaranId);
  if (idx < 0) return null;

  const item = list[idx];

  // Format official letter number
  let prefix = 'SP-I';
  if (newStage === 'sp2') prefix = 'SP-II';
  if (newStage === 'sp3') prefix = 'SP-III';
  if (newStage === 'eksekusi') prefix = 'SK-EKS';
  if (newStage === 'selesai') prefix = 'SK-SLS';

  const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const curMonth = romanMonths[new Date().getMonth()];
  const noSurat = `300/${Math.floor(Math.random() * 800) + 100}/${prefix}/SatpolPP-HST/${curMonth}/${new Date().getFullYear()}`;

  const newStep = {
    tahap: newStage,
    tanggal: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
    nomorSurat: noSurat,
    filePdfUrl: '#',
    bukti: stageData.bukti || [],
    catatan: stageData.catatan || `Peningkatan status ke tahap ${newStage.toUpperCase()}`,
    petugas: stageData.petugas || 'Petugas Penegak Perda'
  };

  item.tindakLanjutList.push(newStep);
  item.statusTindakLanjut = newStage;
  if (newStage === 'selesai') {
    item.isSelesai = true;
  }

  list[idx] = item;
  localStorage.setItem(STORAGE_KEYS.PELANGGARAN, JSON.stringify(list));

  // Update pelanggar statusTerakhir
  const allPelanggar = getPelanggarList();
  const pIdx = allPelanggar.findIndex(p => p.id === item.pelanggarId);
  if (pIdx >= 0) {
    allPelanggar[pIdx].statusTerakhir = newStage;
    localStorage.setItem(STORAGE_KEYS.PELANGGAR, JSON.stringify(allPelanggar));
  }

  return item;
};

// PENGADUAN OPERATIONS
export const getPengaduanList = () => {
  initStorage();
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENGADUAN) || '[]');
    let updated = false;
    const baseList = raw.length > 0 ? raw : INITIAL_PENGADUAN;

    const enriched = baseList.map(item => {
      let itemUpdated = false;
      const newItem = { ...item };

      if (!Array.isArray(newItem.tahapanLog) || newItem.tahapanLog.length === 0) {
        const match = INITIAL_PENGADUAN.find(i => i.id === newItem.id || i.nomorTiket === newItem.nomorTiket);
        if (match && Array.isArray(match.tahapanLog)) {
          newItem.tahapanLog = match.tahapanLog;
          newItem.reguPenangan = newItem.reguPenangan || match.reguPenangan;
          newItem.fotoTindakLanjut = newItem.fotoTindakLanjut || match.fotoTindakLanjut;
          itemUpdated = true;
        } else {
          const isDone = newItem.status === 'selesai';
          const isActing = newItem.status === 'dalam_penindakan' || newItem.status === 'ditindaklanjuti';
          const isVerified = newItem.status === 'diverifikasi';

          newItem.tahapanLog = [
            { tahap: 1, nama: 'Laporan Diterima', waktu: newItem.tglPengaduan, ket: 'Laporan warga tercatat di SIPOL-PP Satpol PP HST', status: 'done' },
            { tahap: 2, nama: 'Verifikasi Trantibum', waktu: (isVerified || isActing || isDone) ? newItem.tglPengaduan : null, ket: 'Pemeriksaan keabsahan laporan & ketentuan Perda', status: (isVerified || isActing || isDone) ? 'done' : 'active' },
            { tahap: 3, nama: 'Disposisi Regu Patroli', waktu: (isActing || isDone) ? newItem.tglPengaduan : null, ket: 'Disposisi regu penindak lapangan', status: isActing ? 'active' : isDone ? 'done' : 'pending' },
            { tahap: 4, nama: 'Tindakan Lapangan', waktu: isDone ? (newItem.tglSelesai || newItem.tglPengaduan) : null, ket: 'Penertiban & edukasi humanis di lokasi', status: isDone ? 'done' : 'pending' },
            { tahap: 5, nama: 'Selesai & Tuntas', waktu: isDone ? (newItem.tglSelesai || newItem.tglPengaduan) : null, ket: 'Laporan terselesaikan tuntas', status: isDone ? 'done' : 'pending' }
          ];
          itemUpdated = true;
        }
      }

      if (itemUpdated) updated = true;
      return newItem;
    });

    if (updated || raw.length === 0) {
      localStorage.setItem(STORAGE_KEYS.PENGADUAN, JSON.stringify(enriched));
    }
    return enriched;
  } catch (e) {
    return INITIAL_PENGADUAN;
  }
};

export const createPengaduan = (data) => {
  const list = getPengaduanList();
  const count = list.length + 14;
  const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
  const ticketNo = `PGD-HST-${yearMonth}-${String(count).padStart(4, '0')}`;
  const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) + ' WITA';

  const newReport = {
    id: `pgd-${Date.now().toString().slice(-6)}`,
    nomorTiket: ticketNo,
    namaPelapor: data.namaPelapor,
    noHp: data.noHp,
    judul: data.judul,
    deskripsi: data.deskripsi,
    kecamatan: data.kecamatan,
    desa: data.desa || '',
    alamat: data.alamat,
    lat: data.lat || -2.5833,
    lng: data.lng || 115.3811,
    fotoUrl: data.fotoUrl || 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&auto=format&fit=crop&q=80',
    fotoTindakLanjut: null,
    status: 'menunggu_verifikasi',
    reguPenangan: 'Dalam Proses Telaah',
    petugasPiket: 'Petugas Pelayanan Mako Barabai',
    tglPengaduan: nowStr,
    catatanAdmin: 'Laporan baru diterima dari portal warga. Menunggu verifikasi berkas.',
    tahapanLog: [
      { tahap: 1, nama: 'Laporan Diterima', waktu: nowStr, ket: 'Laporan warga tercatat di SIPOL-PP Satpol PP HST', status: 'done' },
      { tahap: 2, nama: 'Verifikasi Trantibum', waktu: null, ket: 'Pemeriksaan keabsahan laporan & ketentuan Perda', status: 'active' },
      { tahap: 3, nama: 'Disposisi Regu Patroli', waktu: null, ket: 'Penugasan personil regu patroli lapangan', status: 'pending' },
      { tahap: 4, nama: 'Tindakan Lapangan', waktu: null, ket: 'Penertiban & edukasi humanis di lokasi', status: 'pending' },
      { tahap: 5, nama: 'Selesai & Tuntas', waktu: null, ket: 'Laporan terselesaikan tuntas', status: 'pending' }
    ]
  };

  list.unshift(newReport);
  localStorage.setItem(STORAGE_KEYS.PENGADUAN, JSON.stringify(list));
  return newReport;
};

export const updateStatusPengaduan = (id, newStatus, catatanAdmin) => {
  const list = getPengaduanList();
  const idx = list.findIndex(p => p.id === id);
  if (idx < 0) return null;

  list[idx].status = newStatus;
  list[idx].catatanAdmin = catatanAdmin || list[idx].catatanAdmin;
  localStorage.setItem(STORAGE_KEYS.PENGADUAN, JSON.stringify(list));
  return list[idx];
};

// PATROLI OPERATIONS
export const getPatroliList = () => {
  initStorage();
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.PATROLI) || '[]');
    let updated = false;

    // Pastikan setiap jadwal memiliki array aktivitasList
    const enriched = raw.map(item => {
      let itemUpdated = false;
      const newItem = { ...item };

      if (!Array.isArray(newItem.aktivitasList) || newItem.aktivitasList.length === 0) {
        const match = INITIAL_JADWAL_PATROLI.find(i => i.id === newItem.id || i.kode === newItem.kode);
        if (match && Array.isArray(match.aktivitasList) && match.aktivitasList.length > 0) {
          newItem.aktivitasList = match.aktivitasList;
          itemUpdated = true;
        } else if (!Array.isArray(newItem.aktivitasList)) {
          newItem.aktivitasList = [];
          itemUpdated = true;
        }
      } else {
        // Lengkapi fotoList jika ada match di initial
        const match = INITIAL_JADWAL_PATROLI.find(i => i.id === newItem.id || i.kode === newItem.kode);
        if (match && Array.isArray(match.aktivitasList)) {
          newItem.aktivitasList = newItem.aktivitasList.map(act => {
            const mAct = match.aktivitasList.find(m => m.id === act.id);
            if (mAct && mAct.fotoList && (!act.fotoList || act.fotoList.length === 0)) {
              itemUpdated = true;
              return { ...act, fotoUrl: mAct.fotoUrl, fotoList: mAct.fotoList };
            }
            if (!act.fotoList && act.fotoUrl) {
              itemUpdated = true;
              return { ...act, fotoList: [act.fotoUrl] };
            }
            return act;
          });
        }
      }

      if (itemUpdated) updated = true;
      return newItem;
    });

    if (updated) {
      localStorage.setItem(STORAGE_KEYS.PATROLI, JSON.stringify(enriched));
    }

    return enriched.length > 0 ? enriched : INITIAL_JADWAL_PATROLI;
  } catch (e) {
    return INITIAL_JADWAL_PATROLI;
  }
};

export const updatePatroliStatus = (id, newStatus, gpsCoords = null) => {
  const list = getPatroliList();
  const idx = list.findIndex(p => p.id === id);
  if (idx < 0) return null;

  list[idx].status = newStatus;
  if (newStatus === 'berlangsung') {
    list[idx].checkinAt = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA';
    if (gpsCoords) list[idx].checkinGps = gpsCoords;
  } else if (newStatus === 'selesai') {
    list[idx].checkoutAt = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA';
  }
  list[idx].updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEYS.PATROLI, JSON.stringify(list));
  return list[idx];
};

export const createPatroli = (data) => {
  const list = getPatroliList();
  const dateStr = (data.tanggal || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
  const count = list.length + 1;
  const kode = data.kode || `PTR-HST-${dateStr}-${String.fromCharCode(64 + (count % 26 || 1))}`;

  const newPatrol = {
    id: `pat-${Date.now().toString().slice(-6)}`,
    kode,
    nama: data.nama,
    tanggal: data.tanggal || new Date().toISOString().slice(0, 10),
    jamMulai: data.jamMulai || '08:00',
    jamSelesai: data.jamSelesai || '12:00',
    regu: data.regu || 'Regu I (Kijang 01)',
    supervisor: data.supervisor || 'Drs. H. Subhan, M.Si',
    rute: data.rute || '',
    kecamatan: data.kecamatan || 'Barabai',
    status: data.status || 'terjadwal',
    jumlahPersonel: Number(data.jumlahPersonel) || 6,
    catatan: data.catatan || '',
    checkinAt: null,
    checkoutAt: null,
    checkinGps: null,
    aktivitasList: Array.isArray(data.aktivitasList) ? data.aktivitasList : [],
    createdAt: new Date().toISOString()
  };

  list.unshift(newPatrol);
  localStorage.setItem(STORAGE_KEYS.PATROLI, JSON.stringify(list));
  return newPatrol;
};

export const updatePatroli = (id, data) => {
  const list = getPatroliList();
  const idx = list.findIndex(p => p.id === id);
  if (idx < 0) return null;

  list[idx] = {
    ...list[idx],
    ...data,
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEYS.PATROLI, JSON.stringify(list));
  return list[idx];
};

export const deletePatroli = (id) => {
  let list = getPatroliList();
  list = list.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.PATROLI, JSON.stringify(list));
  return list;
};

// RECORD AKTIVITAS LAPANGAN SELAMA PATROLI BERJALAN
export const addPatroliActivity = (patrolId, activityData) => {
  const list = getPatroliList();
  const idx = list.findIndex(p => p.id === patrolId);
  if (idx < 0) return null;

  const fotoList = Array.isArray(activityData.fotoList) && activityData.fotoList.length > 0
    ? activityData.fotoList
    : (activityData.fotoUrl ? [activityData.fotoUrl] : []);

  const newActivity = {
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    waktu: activityData.waktu || (new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA'),
    lokasi: activityData.lokasi || 'Rute Patroli',
    kategori: activityData.kategori || 'Himbauan & Sosialisasi',
    uraian: activityData.uraian || '',
    statusTitik: activityData.statusTitik || 'Kondusif & Tertib',
    fotoUrl: activityData.fotoUrl || (fotoList[0] || ''),
    fotoList: fotoList,
    petugas: activityData.petugas || list[idx].regu,
    createdAt: new Date().toISOString()
  };

  if (!Array.isArray(list[idx].aktivitasList)) {
    list[idx].aktivitasList = [];
  }

  list[idx].aktivitasList.push(newActivity);
  list[idx].updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEYS.PATROLI, JSON.stringify(list));
  return newActivity;
};

export const deletePatroliActivity = (patrolId, activityId) => {
  const list = getPatroliList();
  const idx = list.findIndex(p => p.id === patrolId);
  if (idx < 0) return null;

  if (Array.isArray(list[idx].aktivitasList)) {
    list[idx].aktivitasList = list[idx].aktivitasList.filter(a => a.id !== activityId);
    list[idx].updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.PATROLI, JSON.stringify(list));
  }
  return list[idx];
};

// REKAP PENGADUAN & TRANTIBUM OPERATIONS (EXCEL BULANAN DINAS)
export const getRekapTrantibumList = () => {
  initStorage();
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.REKAP_TRANTIBUM) || '[]');
    let updated = false;
    const enriched = raw.map(item => {
      let itemUpdated = false;
      let newItem = { ...item };

      if (!newItem.kecamatan || !newItem.desa) {
        const match = INITIAL_REKAP_TRANTIBUM.find(i => i.id === newItem.id || i.no === newItem.no);
        if (match) {
          newItem.kecamatan = newItem.kecamatan || match.kecamatan;
          newItem.desa = newItem.desa || match.desa;
          itemUpdated = true;
        }
      }

      if (!newItem.lat || !newItem.lng) {
        const foundKec = KECAMATAN_HST.find(k => k.nama === (newItem.kecamatan || 'Barabai')) || KECAMATAN_HST[0];
        if (foundKec) {
          newItem.lat = foundKec.lat;
          newItem.lng = foundKec.lng;
          itemUpdated = true;
        }
      }

      if (!newItem.personil) {
        const match = INITIAL_REKAP_TRANTIBUM.find(i => i.id === newItem.id || i.no === newItem.no);
        newItem.personil = (match && match.personil) ? match.personil : 'Regu I Murakata';
        itemUpdated = true;
      }

      if (newItem.statusPengaduan && !['Terlayani', 'Dalam Penanganan', 'Menunggu Tindak Lanjut', 'Diteruskan ke Tim Penegakan'].includes(newItem.statusPengaduan)) {
        newItem.statusPengaduan = 'Diteruskan ke Tim Penegakan';
        itemUpdated = true;
      }

      if (itemUpdated) updated = true;
      return newItem;
    });

    // Merge new initial items if not yet present
    INITIAL_REKAP_TRANTIBUM.forEach(initItem => {
      if (!enriched.some(i => i.id === initItem.id)) {
        enriched.push(initItem);
        updated = true;
      }
    });

    if (updated) {
      localStorage.setItem(STORAGE_KEYS.REKAP_TRANTIBUM, JSON.stringify(enriched));
    }
    return enriched.length > 0 ? enriched : INITIAL_REKAP_TRANTIBUM;
  } catch (e) {
    return INITIAL_REKAP_TRANTIBUM;
  }
};

export const saveRekapTrantibumItem = (itemData) => {
  const list = getRekapTrantibumList();

  if (itemData.id) {
    // Update existing
    const idx = list.findIndex(item => item.id === itemData.id);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        ...itemData,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.REKAP_TRANTIBUM, JSON.stringify(list));
      return list[idx];
    }
  }

  // Create new
  const newItem = {
    id: `trb-${Date.now().toString().slice(-6)}`,
    no: list.length + 1,
    statusPengaduan: itemData.statusPengaduan || 'Terlayani',
    personil: itemData.personil || 'Regu Patroli Trantibum',
    ...itemData
  };
  list.unshift(newItem);
  localStorage.setItem(STORAGE_KEYS.REKAP_TRANTIBUM, JSON.stringify(list));
  return newItem;
};

export const updateRekapTrantibumStatus = (id, newStatus) => {
  const list = getRekapTrantibumList();
  const idx = list.findIndex(item => item.id === id);
  if (idx >= 0) {
    list[idx].statusPengaduan = newStatus;
    list[idx].updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.REKAP_TRANTIBUM, JSON.stringify(list));
    return list[idx];
  }
  return null;
};

export const deleteRekapTrantibumItem = (id) => {
  let list = getRekapTrantibumList();
  list = list.filter(item => item.id !== id);
  // Re-index row numbers
  list = list.map((item, index) => ({
    ...item,
    no: index + 1
  }));
  localStorage.setItem(STORAGE_KEYS.REKAP_TRANTIBUM, JSON.stringify(list));
  return list;
};

// ==============================================================================
// MASTER PEGAWAI OPERATIONS
// ==============================================================================
export const getPegawaiList = () => {
  initStorage();
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.PEGAWAI) || '[]');
    return data.length > 0 ? data : INITIAL_PEGAWAI;
  } catch (e) {
    return INITIAL_PEGAWAI;
  }
};

export const savePegawai = (pegawaiData) => {
  const list = getPegawaiList();
  if (pegawaiData.id) {
    // Update existing
    const idx = list.findIndex(p => p.id === pegawaiData.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...pegawaiData, updatedAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEYS.PEGAWAI, JSON.stringify(list));
      return list[idx];
    }
  }

  // Create new
  const newPegawai = {
    id: `peg-${Date.now().toString().slice(-6)}`,
    status: 'Aktif',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    ...pegawaiData,
    createdAt: new Date().toISOString()
  };
  list.unshift(newPegawai);
  localStorage.setItem(STORAGE_KEYS.PEGAWAI, JSON.stringify(list));
  return newPegawai;
};

export const deletePegawai = (id) => {
  let list = getPegawaiList();
  list = list.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.PEGAWAI, JSON.stringify(list));
  return list;
};

// ==============================================================================
// MASTER WILAYAH (KECAMATAN & DESA) OPERATIONS
// ==============================================================================
export const getWilayahList = () => {
  initStorage();
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.WILAYAH) || '[]');
    return data.length > 0 ? data : KECAMATAN_HST;
  } catch (e) {
    return KECAMATAN_HST;
  }
};

export const saveKecamatan = (kecData) => {
  const list = getWilayahList();
  if (kecData.id) {
    // Update existing
    const idx = list.findIndex(k => k.id === kecData.id);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        ...kecData,
        desa: kecData.desa || list[idx].desa || []
      };
      localStorage.setItem(STORAGE_KEYS.WILAYAH, JSON.stringify(list));
      return list[idx];
    }
  }

  // Create new
  const newKec = {
    id: `kec-${Date.now().toString().slice(-6)}`,
    lat: -2.5833,
    lng: 115.3811,
    desa: [],
    ...kecData
  };
  list.push(newKec);
  localStorage.setItem(STORAGE_KEYS.WILAYAH, JSON.stringify(list));
  return newKec;
};

export const deleteKecamatan = (id) => {
  let list = getWilayahList();
  list = list.filter(k => k.id !== id);
  localStorage.setItem(STORAGE_KEYS.WILAYAH, JSON.stringify(list));
  return list;
};

export const addDesaToKecamatan = (kecamatanId, desaName) => {
  const list = getWilayahList();
  const idx = list.findIndex(k => k.id === kecamatanId);
  if (idx < 0) return null;

  const trimmed = (desaName || '').trim();
  if (!trimmed) return list[idx];

  if (!list[idx].desa) list[idx].desa = [];
  if (!list[idx].desa.includes(trimmed)) {
    list[idx].desa.push(trimmed);
    localStorage.setItem(STORAGE_KEYS.WILAYAH, JSON.stringify(list));
  }
  return list[idx];
};

export const editDesaInKecamatan = (kecamatanId, oldName, newName) => {
  const list = getWilayahList();
  const idx = list.findIndex(k => k.id === kecamatanId);
  if (idx < 0) return null;

  const trimmedNew = (newName || '').trim();
  if (!trimmedNew) return list[idx];

  const desaIdx = (list[idx].desa || []).indexOf(oldName);
  if (desaIdx >= 0) {
    list[idx].desa[desaIdx] = trimmedNew;
    localStorage.setItem(STORAGE_KEYS.WILAYAH, JSON.stringify(list));
  }
  return list[idx];
};

export const deleteDesaFromKecamatan = (kecamatanId, desaName) => {
  const list = getWilayahList();
  const idx = list.findIndex(k => k.id === kecamatanId);
  if (idx < 0) return null;

  list[idx].desa = (list[idx].desa || []).filter(d => d !== desaName);
  localStorage.setItem(STORAGE_KEYS.WILAYAH, JSON.stringify(list));
  return list[idx];
};

// ==============================================================================
// PERDA OPERATIONS (MASTER DATA REFERENSI PERDA HST)
// ==============================================================================
export const getPerdaList = () => {
  initStorage();
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PERDA) || '[]');
  } catch (e) {
    return PERDA_HST;
  }
};

export const savePerda = (perdaData) => {
  const list = getPerdaList();
  if (perdaData.id) {
    // Update existing
    const idx = list.findIndex(p => p.id === perdaData.id);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        ...perdaData,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.PERDA, JSON.stringify(list));
      return list[idx];
    }
  }

  // Create new
  const newPerda = {
    id: `perda-${Date.now().toString().slice(-6)}`,
    ...perdaData,
    createdAt: new Date().toISOString()
  };
  list.unshift(newPerda);
  localStorage.setItem(STORAGE_KEYS.PERDA, JSON.stringify(list));
  return newPerda;
};

export const deletePerda = (id) => {
  let list = getPerdaList();
  list = list.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.PERDA, JSON.stringify(list));
  return list;
};

// ==============================================================================
// MASTER PELAPOR OPERATIONS (MASYARAKAT & INSTANSI SKPD)
// ==============================================================================
export const getPelaporList = () => {
  initStorage();
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.PELAPOR) || '[]');
    return data.length > 0 ? data : INITIAL_PELAPOR;
  } catch (e) {
    return INITIAL_PELAPOR;
  }
};

export const savePelapor = (pelaporData) => {
  const list = getPelaporList();
  if (pelaporData.id) {
    // Update existing
    const idx = list.findIndex(p => p.id === pelaporData.id);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        ...pelaporData,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.PELAPOR, JSON.stringify(list));
      return list[idx];
    }
  }

  // Create new
  const newPelapor = {
    id: `plr-${Date.now().toString().slice(-6)}`,
    totalLaporan: 0,
    statusVerifikasi: 'Terverifikasi',
    ...pelaporData,
    createdAt: new Date().toISOString()
  };
  list.unshift(newPelapor);
  localStorage.setItem(STORAGE_KEYS.PELAPOR, JSON.stringify(list));
  return newPelapor;
};

export const deletePelapor = (id) => {
  let list = getPelaporList();
  list = list.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.PELAPOR, JSON.stringify(list));
  return list;
};



