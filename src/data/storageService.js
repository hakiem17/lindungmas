// ==============================================================================
// STORAGE SERVICE (LIVE SUPABASE DATABASE ADAPTER & PERSISTENCE LAYER)
// ==============================================================================
import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import {
  INITIAL_PELANGGAR,
  INITIAL_PELANGGARAN,
  INITIAL_PENGADUAN,
  INITIAL_JADWAL_PATROLI,
  INITIAL_REKAP_TRANTIBUM,
  INITIAL_PEGAWAI,
  INITIAL_PELAPOR,
  INITIAL_SATLINMAS,
  INITIAL_POSKAMLING,
  INITIAL_KEGIATAN_PATROLI,
  DEFAULT_MASTER_FASILITAS_POSKAMLING,
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
  SATLINMAS: 'lindungmas_hst_satlinmas',
  POSKAMLING: 'lindungmas_hst_poskamling',
  KEGIATAN_PATROLI: 'lindungmas_hst_kegiatan_patroli',
  FASILITAS_POSKAMLING: 'lindungmas_hst_fasilitas_poskamling',
  AUDIT_LOGS: 'lindungmas_hst_audit_logs',
  PROFIL_PENGGUNA: 'lindungmas_hst_profil_pengguna',
  ACTIVE_ROLE: 'siperda_hst_active_role',
  OFFLINE_QUEUE: 'siperda_hst_offline_queue',
  AUTH_SESSION: 'siperda_hst_auth_session'
};

const safeSetItem = (key, val) => {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(key, val);
    } catch (e) {}
  }
};

const safeGetItem = (key) => {
  if (typeof localStorage !== 'undefined') {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }
  return null;
};

// ==============================================================================
// MAPPER DARI DATABASE SUPABASE (SNAKE_CASE) KE MODEL FRONTEND (CAMELCASE)
// ==============================================================================

export const mapSatlinmasFromDB = (row) => ({
  id: row.id,
  noRegistrasi: row.no_registrasi || '',
  nama: row.nama,
  nik: row.nik,
  tempatLahir: row.tempat_lahir || '',
  tanggalLahir: row.tanggal_lahir || '',
  jenisKelamin: row.jenis_kelamin || '',
  alamat: row.alamat || '',
  provinsi: row.provinsi || 'Kalimantan Selatan',
  kabKota: row.kab_kota || 'Kabupaten Hulu Sungai Tengah',
  kecamatan: row.kecamatan || '',
  desaKelurahan: row.desa_kelurahan || '',
  pendapatan: row.pendapatan || '',
  tahunPengangkatan: row.tahun_pengangkatan || '',
  jumlahKeluarga: row.jumlah_keluarga || '',
  noHp: row.no_hp || '',
  email: row.email || '',
  status: row.status || 'aktif',
  jabatan: row.jabatan || '',
  keterangan: row.keterangan || '',
  urutan: row.urutan ?? null,
  pasFoto: row.pas_foto_url || '',
  dokumenSk: {
    nomorSk: row.nomor_sk || '',
    tanggalPenetapanSk: row.tanggal_sk || '',
    fileSk: row.file_sk_url || ''
  },
  qrKtaCode: row.qr_kta_code || null,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const mapPoskamlingFromDB = (row) => ({
  id: row.id,
  namaPoskamling: row.nama_poskamling,
  namaPos: row.nama_poskamling,
  kecamatan: row.kecamatan,
  desaKelurahan: row.desa_kelurahan,
  desa: row.desa_kelurahan,
  alamatLengkap: row.alamat_lengkap,
  alamat: row.alamat_lengkap,
  rt: row.rt || '',
  rw: row.rw || '',
  lat: Number(row.lat) || -2.5855,
  lng: Number(row.lng) || 115.3815,
  kondisiFisik: row.kondisi_fisik || '',
  kondisi: row.kondisi_fisik || '',
  statusOperasional: row.status_operasional || 'Aktif Terjadwal (Tiap Malam)',
  status: row.status_operasional || 'Aktif Terjadwal (Tiap Malam)',
  fasilitas: Array.isArray(row.fasilitas) ? row.fasilitas : [],
  fasilitasTerdata: Array.isArray(row.fasilitas) ? row.fasilitas : [],
  sarana: Array.isArray(row.fasilitas) ? row.fasilitas : [],
  namaKetuaPos: row.nama_ketua_pos || '',
  kontakWa: row.kontak_wa || '',
  kontakKoordinator: row.kontak_wa || '',
  personelRonda: Number(row.personel_ronda) || 0,
  catatanTambahan: row.catatan_tambahan || '',
  catatan: row.catatan_tambahan || '',
  tanggalPendataan: row.tanggal_pendataan || '',
  satlinmasDesa: row.satlinmas_desa ?? null,
  urutan: row.urutan ?? null,
  foto: row.foto_pos_url || '',
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const mapKegiatanPatroliFromDB = (row) => ({
  id: row.id,
  kode: row.kode,
  judulPatroli: row.judul_patroli,
  judulKegiatan: row.judul_patroli,
  jenisKegiatan: row.jenis_kegiatan,
  statusSituasi: row.status_situasi,
  kecamatan: row.kecamatan,
  desaKelurahan: row.desa_kelurahan,
  desa: row.desa_kelurahan,
  lokasiSpesifik: row.lokasi_spesifik,
  petugasPelapor: row.petugas_pelapor,
  namaPelapor: row.petugas_pelapor,
  nikPelapor: row.nik_pelapor,
  jumlahPersonel: Number(row.jumlah_personel) || 4,
  lat: Number(row.lat) || -2.5833,
  lng: Number(row.lng) || 115.3811,
  hasilPatroli: row.hasil_patroli || '',
  uraianKegiatan: row.hasil_patroli || '',
  tindakanDiambil: row.tindakan_diambil || '',
  fotoDokumentasi: Array.isArray(row.foto_dokumentasi) ? row.foto_dokumentasi : (row.foto_dokumentasi ? [row.foto_dokumentasi] : []),
  waktuLapor: row.created_at ? new Date(row.created_at).toLocaleString('id-ID') : '',
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

// Master Pegawai (tabel master_pegawai) -> model frontend
export const mapPegawaiFromDB = (row) => ({
  id: row.id,
  nama: row.nama,
  nip: row.nip,
  jk: row.jenis_kelamin || '',
  pangkat: row.pangkat_golongan || '',
  jabatan: row.jabatan || '',
  statusKepegawaian: row.status_kepegawaian || '',
  pendidikan: row.pendidikan || '',
  noHp: row.no_telepon || '',
  keterangan: row.keterangan || '',
  wilayah: row.wilayah || 'hst',
  urutan: row.urutan ?? null,
  status: row.status || 'Aktif',
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

// Profil Pengguna (tabel profil_pengguna) -> model frontend
export const mapProfilFromDB = (row) => ({
  id: row.id,
  nama: row.nama,
  nip: row.nip,
  nik: row.nik || null,
  noRegistrasi: row.no_registrasi || null,
  pangkat: row.pangkat || '',
  jabatan: row.jabatan || '',
  regu: row.regu || '-',
  peran: row.peran,
  wilayahTugas: row.wilayah_tugas,
  desaTugas: row.desa_tugas || null,
  noHp: row.no_hp || '',
  email: row.email || '',
  foto: row.foto_url || null,
  status: row.status || 'Aktif',
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const mapFasilitasFromDB = (row) => ({
  id: row.id,
  namaFasilitas: row.nama_fasilitas,
  kategori: row.kategori,
  deskripsi: row.deskripsi || '',
  standarMinimal: row.standar_minimal || '1 Unit',
  statusWajib: row.standar_minimal ? 'Wajib' : 'Standar',
  aktif: row.aktif !== false,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const buildWilayahFromDB = (rows) => {
  if (!rows || rows.length === 0) return KECAMATAN_HST;
  
  // Group rows by kecamatan
  const grouped = new Map();
  rows.forEach(r => {
    if (!r || !r.kecamatan) return;
    const kecNama = String(r.kecamatan).trim();
    if (!grouped.has(kecNama)) {
      grouped.set(kecNama, {
        id: `kec-${kecNama.toLowerCase().replace(/\s+/g, '-')}`,
        nama: kecNama,
        pusat: r.pusat_pemerintahan || r.desa_kelurahan || kecNama,
        lat: Number(r.lat) || -2.5833,
        lng: Number(r.lng) || 115.3811,
        kodePos: r.kode_pos || '71311',
        tipe: r.tipe_wilayah || 'Kecamatan',
        desa: []
      });
    }
    const item = grouped.get(kecNama);
    if (r.desa_kelurahan && !item.desa.includes(r.desa_kelurahan)) {
      item.desa.push(String(r.desa_kelurahan).trim());
    }
  });

  // Merge with existing KECAMATAN_HST villages to retain comprehensive lists
  const result = Array.from(grouped.values()).map(kec => {
    const defaultKec = KECAMATAN_HST.find(k => String(k?.nama || '').toLowerCase() === String(kec?.nama || '').toLowerCase());
    if (defaultKec) {
      const mergedDesa = Array.from(new Set([...kec.desa, ...(defaultKec.desa || [])]));
      return {
        ...defaultKec,
        ...kec,
        desa: mergedDesa
      };
    }
    return kec;
  });
  return result.length > 0 ? result : KECAMATAN_HST;
};

// ==============================================================================
// FETCH ALL DATA DIRECTLY FROM SUPABASE DATABASE
// ==============================================================================
export const fetchDatabaseData = async () => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase belum terkonfigurasi, menggunakan data lokal.');
    return null;
  }

  try {
    const [
      resSatlinmas,
      resPoskamling,
      resPatroli,
      resProfil,
      resPegawai,
      resFasilitas,
      resWilayah,
      resAudit
    ] = await Promise.all([
      supabase.from('satlinmas').select('*').order('urutan', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false }),
      supabase.from('poskamling').select('*').order('urutan', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false }),
      supabase.from('kegiatan_patroli').select('*').order('created_at', { ascending: false }),
      supabase.from('profil_pengguna').select('*').order('created_at', { ascending: true }),
      supabase.from('master_pegawai').select('*').order('urutan', { ascending: true, nullsFirst: false }).order('created_at', { ascending: true }),
      supabase.from('master_fasilitas_poskamling').select('*').order('created_at', { ascending: true }),
      supabase.from('master_wilayah').select('*'),
      supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(50)
    ]);

    if (resSatlinmas.error) {
      const retry = await supabase.from('satlinmas').select('*').order('created_at', { ascending: false });
      resSatlinmas.data = retry.data;
      resSatlinmas.error = retry.error;
    }
    const mappedSatlinmas = (resSatlinmas.data || []).map(mapSatlinmasFromDB);
    if (resPoskamling.error) {
      const retry = await supabase.from('poskamling').select('*').order('created_at', { ascending: false });
      resPoskamling.data = retry.data;
      resPoskamling.error = retry.error;
    }
    const mappedPoskamling = (resPoskamling.data || []).map(mapPoskamlingFromDB);
    const mappedPatroli = (resPatroli.data || []).map(mapKegiatanPatroliFromDB);
    // Jika kolom `urutan` belum dibuat di database, ambil tanpa pengurutan tsb
    if (resPegawai.error) {
      const retry = await supabase.from('master_pegawai').select('*').order('created_at', { ascending: true });
      resPegawai.data = retry.data;
      resPegawai.error = retry.error;
    }
    const mappedPegawai = (resPegawai.data || []).map(mapPegawaiFromDB);
    const mappedProfil = (resProfil.data || []).map(mapProfilFromDB);
    const mappedFasilitas = (resFasilitas.data || []).map(mapFasilitasFromDB);
    const mappedWilayah = (resWilayah.data || []).length > 0 ? buildWilayahFromDB(resWilayah.data) : KECAMATAN_HST;

    // Overwrite local cache with live database records
    if (!resSatlinmas.error && resSatlinmas.data) safeSetItem(STORAGE_KEYS.SATLINMAS, JSON.stringify(mappedSatlinmas));
    if (!resPoskamling.error && resPoskamling.data) safeSetItem(STORAGE_KEYS.POSKAMLING, JSON.stringify(mappedPoskamling));
    
    // Update KEGIATAN_PATROLI cache dengan aman (gabungkan record lokal dengan database Supabase)
    let finalPatroli = getKegiatanPatroliList();
    if (mappedPatroli && mappedPatroli.length > 0) {
      const merged = [...mappedPatroli];
      finalPatroli.forEach(localItem => {
        if (!merged.some(m => (m.id && m.id === localItem.id) || (m.kode && m.kode === localItem.kode))) {
          merged.unshift(localItem);
        }
      });
      finalPatroli = merged;
      safeSetItem(STORAGE_KEYS.KEGIATAN_PATROLI, JSON.stringify(finalPatroli));
    } else if (finalPatroli.length > 0) {
      safeSetItem(STORAGE_KEYS.KEGIATAN_PATROLI, JSON.stringify(finalPatroli));
    }

    if (!resPegawai.error && resPegawai.data) {
      safeSetItem(STORAGE_KEYS.PEGAWAI, JSON.stringify(mappedPegawai));
    }
    // Update PROFIL_PENGGUNA cache dengan aman (pertahankan akun linmas / lokal yang telah dibuat)
    let finalProfil = getProfilPenggunaList();
    if (mappedProfil && mappedProfil.length > 0) {
      const merged = [...mappedProfil];
      finalProfil.forEach(lp => {
        if (!merged.some(mp => (mp.id && mp.id === lp.id) || (mp.nik && mp.nik === lp.nik) || (mp.nip && mp.nip === lp.nip))) {
          merged.push(lp);
        }
      });
      finalProfil = merged;
      safeSetItem(STORAGE_KEYS.PROFIL_PENGGUNA, JSON.stringify(finalProfil));
    }
    if (!resFasilitas.error && resFasilitas.data) safeSetItem(STORAGE_KEYS.FASILITAS_POSKAMLING, JSON.stringify(mappedFasilitas));
    if (!resWilayah.error && resWilayah.data) safeSetItem(STORAGE_KEYS.WILAYAH, JSON.stringify(mappedWilayah));

    let mappedAudit = [];
    if (resAudit.data && resAudit.data.length > 0) {
      mappedAudit = resAudit.data.map(log => ({
        id: log.id,
        timestamp: log.timestamp || log.created_at,
        waktu: log.timestamp ? new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA' : '',
        aktor: log.aktor_nama || 'Sistem',
        nipAktor: log.aktor_nip || '-',
        peran: log.aktor_peran || 'Admin',
        aksi: log.aksi,
        modul: log.modul,
        target: log.target || '-',
        detail: log.detail || ''
      }));
      safeSetItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(mappedAudit));
    }

    return {
      satlinmas: mappedSatlinmas,
      poskamling: mappedPoskamling,
      kegiatanPatroli: finalPatroli,
      pegawai: mappedPegawai,
      profilPengguna: finalProfil,
      fasilitasPoskamling: mappedFasilitas,
      wilayah: mappedWilayah,
      auditLogs: mappedAudit,
      isLive: true
    };
  } catch (err) {
    console.error('⚠️ Gagal mengambil data live dari Supabase:', err);
    return null;
  }
};

/**
 * Paksa pembersihan cache lokal dan ambil data riil langsung dari database Supabase
 */
export const forceDatabaseSync = async () => {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEYS.PEGAWAI);
      localStorage.removeItem(STORAGE_KEYS.PROFIL_PENGGUNA);
      localStorage.removeItem(STORAGE_KEYS.SATLINMAS);
      localStorage.removeItem(STORAGE_KEYS.POSKAMLING);
      localStorage.removeItem(STORAGE_KEYS.KEGIATAN_PATROLI);
      localStorage.removeItem(STORAGE_KEYS.FASILITAS_POSKAMLING);
    } catch (e) {}
  }
  return await fetchDatabaseData();
};

// ==============================================================================
// REALTIME SUBSCRIPTION LISTENER
// ==============================================================================
export const subscribeToLiveDatabase = (onUpdateCallback) => {
  if (!isSupabaseConfigured() || typeof window === 'undefined') return () => {};

  const channel = supabase
    .channel('lindungmas_live_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'satlinmas' }, () => onUpdateCallback && onUpdateCallback('satlinmas'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'poskamling' }, () => onUpdateCallback && onUpdateCallback('poskamling'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'kegiatan_patroli' }, () => onUpdateCallback && onUpdateCallback('kegiatan_patroli'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'master_fasilitas_poskamling' }, () => onUpdateCallback && onUpdateCallback('master_fasilitas_poskamling'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profil_pengguna' }, () => onUpdateCallback && onUpdateCallback('profil_pengguna'))
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const getAuditLogs = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (!raw) {
      const defaultLogs = [
        {
          id: 'log-001',
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          waktu: '2 jam yang lalu',
          aktor: 'Drs. H. Subhan, M.Si',
          nipAktor: '19740815 199603 1 002',
          peran: 'Admin Satpol PP Kabupaten',
          aksi: 'TAMBAH',
          modul: 'Master Sarana Poskamling',
          target: 'Standarisasi Perlengkapan Poskamling HST',
          detail: 'Standarisasi master data perlengkapan keamanan pos ronda RT/RW se-Kabupaten HST.'
        },
        {
          id: 'log-002',
          timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
          waktu: '5 jam yang lalu',
          aktor: 'M. Rizky Pratama, S.H.',
          nipAktor: '19850614 201001 1 012',
          peran: 'Operator Kecamatan Barabai',
          aksi: 'VERIFIKASI',
          modul: 'Data Satlinmas',
          target: 'Anggota Satlinmas Barabai Timur',
          detail: 'Verifikasi berkas SK & 17 urutan kolom baku anggota Satlinmas Barabai.'
        },
        {
          id: 'log-003',
          timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
          waktu: '12 jam yang lalu',
          aktor: 'Muhammad Arsyad',
          nipAktor: 'SLM-BRB-001',
          peran: 'Anggota Linmas',
          aksi: 'INPUT',
          modul: 'Kegiatan dan Patroli',
          target: 'Patroli Siskamling RT 04 Barabai Timur',
          detail: 'Input laporan patroli malam mandiri dengan geotagging GPS dan dokumentasi foto.'
        }
      ];
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(defaultLogs));
      return defaultLogs;
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
};

export const addAuditLog = ({ aksi, modul, target, detail, aktor, peran, nipAktor }) => {
  try {
    const logs = getAuditLogs();
    const session = getAuthSession();
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      waktu: 'Baru saja',
      aktor: aktor || session?.nama || 'Petugas Sistem',
      nipAktor: nipAktor || session?.nip || session?.noRegistrasi || '-',
      peran: peran || session?.peran || 'Admin Satpol PP Kabupaten',
      aksi: (aksi || 'AKSI').toUpperCase(),
      modul: modul || 'Sistem',
      target: target || '-',
      detail: detail || '-'
    };
    logs.unshift(newLog);
    const trimmed = logs.slice(0, 150);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(trimmed));
    return newLog;
  } catch (e) {
    console.error('Failed to save audit log', e);
  }
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
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
  }
};

export const initStorage = () => {
  if (typeof localStorage === 'undefined') return;

  // Jika Supabase terkonfigurasi, data utama bersumber riil dari database Supabase
  if (isSupabaseConfigured()) {
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE)) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, 'admin_kabupaten');
    }
    return;
  }

  // Fallback offline jika database tidak terhubung
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
  if (!localStorage.getItem(STORAGE_KEYS.SATLINMAS)) {
    localStorage.setItem(STORAGE_KEYS.SATLINMAS, JSON.stringify(INITIAL_SATLINMAS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.POSKAMLING)) {
    localStorage.setItem(STORAGE_KEYS.POSKAMLING, JSON.stringify(INITIAL_POSKAMLING));
  }
  if (!localStorage.getItem(STORAGE_KEYS.KEGIATAN_PATROLI)) {
    localStorage.setItem(STORAGE_KEYS.KEGIATAN_PATROLI, JSON.stringify(INITIAL_KEGIATAN_PATROLI));
  }
  if (!localStorage.getItem(STORAGE_KEYS.FASILITAS_POSKAMLING)) {
    localStorage.setItem(STORAGE_KEYS.FASILITAS_POSKAMLING, JSON.stringify(DEFAULT_MASTER_FASILITAS_POSKAMLING));
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
// MASTER PEGAWAI OPERATIONS (tabel master_pegawai)
// ==============================================================================
export const getPegawaiList = () => {
  initStorage();
  try {
    const raw = safeGetItem(STORAGE_KEYS.PEGAWAI);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data;
    }
  } catch (e) {}
  return isSupabaseConfigured() ? [] : INITIAL_PEGAWAI;
};

const toMasterPayload = (p) => ({
  nama: p.nama,
  nip: p.nip,
  jenis_kelamin: p.jk || null,
  pangkat_golongan: p.pangkat || null,
  jabatan: p.jabatan || null,
  status_kepegawaian: p.statusKepegawaian || null,
  pendidikan: p.pendidikan || null,
  no_telepon: p.noHp || null,
  keterangan: p.keterangan || null,
  status: p.status || 'Aktif',
  ...(p.urutan != null ? { urutan: p.urutan } : {})
});

const isUuid = (id) => typeof id === 'string' && id.includes('-') && id.length > 20;

export const savePegawai = (pegawaiData) => {
  const list = getPegawaiList();
  let result;
  const idx = pegawaiData.id ? list.findIndex(p => p.id === pegawaiData.id) : -1;
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...pegawaiData, updatedAt: new Date().toISOString() };
    result = list[idx];
  } else {
    const maxUrutan = list.reduce((m, x) => Math.max(m, x.urutan || 0), 0);
    result = { id: `peg-${Date.now()}`, status: 'Aktif', urutan: maxUrutan + 1, ...pegawaiData, createdAt: new Date().toISOString() };
    list.push(result);
  }
  safeSetItem(STORAGE_KEYS.PEGAWAI, JSON.stringify(list));

  if (isSupabaseConfigured()) {
    const payload = toMasterPayload(result);
    if (idx >= 0 && isUuid(result.id)) {
      supabase.from('master_pegawai').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', result.id).then();
    } else {
      supabase.from('master_pegawai').upsert([payload], { onConflict: 'nip' }).then();
    }
  }
  return result;
};

// Geser posisi pegawai ke atas/bawah (direction: -1 = naik, 1 = turun) lalu simpan urutan ke database
export const movePegawai = async (id, direction) => {
  const list = [...getPegawaiList()].sort((a, b) => (a.urutan ?? 1e9) - (b.urutan ?? 1e9));
  const i = list.findIndex(p => p.id === id);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= list.length) return list;
  [list[i], list[j]] = [list[j], list[i]];
  const changed = [];
  list.forEach((p, idx) => {
    if (p.urutan !== idx + 1) { p.urutan = idx + 1; changed.push(p); }
  });
  safeSetItem(STORAGE_KEYS.PEGAWAI, JSON.stringify(list));
  if (isSupabaseConfigured()) {
    await Promise.all(changed.filter(p => isUuid(p.id)).map(p =>
      supabase.from('master_pegawai').update({ urutan: p.urutan }).eq('id', p.id)
    ));
  }
  return list;
};

export const deletePegawai = (id) => {
  let list = getPegawaiList();
  const target = list.find(p => p.id === id);
  list = list.filter(p => p.id !== id);
  safeSetItem(STORAGE_KEYS.PEGAWAI, JSON.stringify(list));

  if (isSupabaseConfigured() && target) {
    if (isUuid(id)) {
      supabase.from('master_pegawai').delete().eq('id', id).then();
    } else if (target.nip) {
      supabase.from('master_pegawai').delete().eq('nip', target.nip).then();
    }
  }
  return list;
};

// ==============================================================================
// PROFIL PENGGUNA & MANAJEMEN AKUN SISTEM (TERPISAH DARI MASTER PEGAWAI)
// ==============================================================================
export const DEFAULT_PROFIL_PENGGUNA = [
  {
    id: '02bc4240-95e9-4523-97c7-e786f8240d0e',
    nama: 'Drs. Ahmad Fathoni',
    nip: '19720217 199203 1 006',
    nik: '6307061702720001',
    jabatan: 'Kepala Satuan Polisi Pamong Praja',
    pangkat: 'Pembina Utama Muda / IV / c',
    peran: 'admin_kabupaten',
    wilayahTugas: 'Seluruh Kabupaten Hulu Sungai Tengah',
    desaTugas: null,
    noHp: '0821-5008-1010',
    email: '197202171992031006@satpolpp.hstkab.go.id',
    status: 'Aktif'
  },
  {
    id: 'usr-op-001',
    nama: 'M. Rizky Pratama, S.H.',
    nip: '19850614 201001 1 012',
    nik: '6307061406850002',
    jabatan: 'Operator Wilayah Kec. Barabai',
    pangkat: 'Penata Muda (III/a)',
    peran: 'operator_kecamatan',
    wilayahTugas: 'Barabai',
    desaTugas: 'Barabai Timur',
    noHp: '0813-4455-6677',
    email: 'operator.barabai@satpolpp.hstkab.go.id',
    status: 'Aktif'
  },
  {
    id: 'slm-001',
    nama: 'Muhammad Arsyad',
    nip: '6307061205840001',
    nik: '6307061205840001',
    noRegistrasi: '63.07/SLM/2026/001',
    jabatan: 'Anggota Satlinmas Barabai Timur',
    pangkat: 'Satlinmas',
    regu: 'Danru',
    peran: 'anggota_linmas',
    wilayahTugas: 'Barabai',
    desaTugas: 'Barabai Timur',
    noHp: '0812-5544-3322',
    email: '6307061205840001@linmas.hstkab.go.id',
    password: 'LinmasHST2026!',
    status: 'Aktif'
  }
];

export const getProfilPenggunaList = () => {
  initStorage();
  try {
    const raw = safeGetItem(STORAGE_KEYS.PROFIL_PENGGUNA);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {}
  safeSetItem(STORAGE_KEYS.PROFIL_PENGGUNA, JSON.stringify(DEFAULT_PROFIL_PENGGUNA));
  return DEFAULT_PROFIL_PENGGUNA;
};

export const saveProfilPengguna = (userData) => {
  let list = getProfilPenggunaList();

  // Cari apakah user sudah ada (berdasarkan id, NIP, atau NIK)
  const idx = list.findIndex(u => 
    (userData.id && u.id === userData.id) || 
    (userData.nip && u.nip === userData.nip) ||
    (userData.nik && u.nik === userData.nik)
  );

  let targetUser;
  if (idx >= 0) {
    list[idx] = {
      ...list[idx],
      ...userData,
      updatedAt: new Date().toISOString()
    };
    targetUser = list[idx];
    addAuditLog({
      aksi: 'UBAH',
      modul: 'Profil Pengguna',
      target: `${targetUser.nama} (${targetUser.peran})`,
      detail: `Pembaruan akun & hak akses profil pengguna ${targetUser.nama} (${targetUser.peran}).`
    });
  } else {
    // Buat akun baru
    targetUser = {
      id: userData.id || `usr-${Date.now().toString().slice(-6)}`,
      nama: userData.nama || '',
      nip: userData.nip || userData.nik || userData.username || `USR-${Date.now().toString().slice(-4)}`,
      nik: userData.nik || userData.nip || null,
      noRegistrasi: userData.noRegistrasi || null,
      pangkat: userData.pangkat || (userData.peran === 'anggota_linmas' ? 'Satlinmas' : 'Pengatur (II/c)'),
      jabatan: userData.jabatan || (userData.peran === 'anggota_linmas' ? 'Anggota Satlinmas' : 'Operator Sistem'),
      regu: userData.regu || '-',
      peran: userData.peran || 'anggota_linmas',
      wilayahTugas: userData.wilayahTugas || 'Barabai',
      desaTugas: userData.desaTugas || null,
      noHp: userData.noHp || '',
      email: userData.email || `${(userData.nik || userData.nip || 'user').replace(/\s+/g, '')}@linmas.hstkab.go.id`,
      password: userData.password || 'LinmasHST2026!',
      foto: userData.foto || null,
      status: userData.status || 'Aktif',
      keterangan: userData.keterangan || null,
      createdAt: new Date().toISOString()
    };
    list = [targetUser, ...list];
    addAuditLog({
      aksi: 'TAMBAH',
      modul: 'Profil Pengguna',
      target: `${targetUser.nama} (${targetUser.peran})`,
      detail: `Pembuatan akun pengguna baru ${targetUser.nama} peran ${targetUser.peran} wilayah ${targetUser.wilayahTugas}.`
    });
  }

  safeSetItem(STORAGE_KEYS.PROFIL_PENGGUNA, JSON.stringify(list));

  // Sinkronkan ke Supabase Live Database jika terkonfigurasi (defensive)
  if (isSupabaseConfigured()) {
    try {
      const payload = {
        nama: targetUser.nama,
        nip: targetUser.nip,
        nik: targetUser.nik || null,
        no_registrasi: targetUser.noRegistrasi || null,
        pangkat: targetUser.pangkat,
        jabatan: targetUser.jabatan,
        regu: targetUser.regu || null,
        peran: targetUser.peran || 'anggota_linmas',
        wilayah_tugas: targetUser.wilayahTugas || 'Barabai',
        desa_tugas: targetUser.desaTugas || null,
        no_hp: targetUser.noHp || '',
        email: targetUser.email,
        foto_url: targetUser.foto || null,
        status: targetUser.status || 'Aktif'
      };
      const isValidUuid = typeof targetUser.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUser.id);
      if (isValidUuid) {
        supabase.from('profil_pengguna').update(payload).eq('id', targetUser.id).then();
      }
    } catch (err) {
      console.warn('Supabase profil_pengguna sync notice:', err);
    }
  }

  return targetUser;
};

export const deleteProfilPengguna = (id) => {
  let list = getProfilPenggunaList();
  const target = list.find(u => u.id === id || u.nik === id || u.nip === id);
  list = list.filter(u => u.id !== id && u.nik !== id && u.nip !== id);
  safeSetItem(STORAGE_KEYS.PROFIL_PENGGUNA, JSON.stringify(list));

  if (target) {
    addAuditLog({
      aksi: 'HAPUS',
      modul: 'Profil Pengguna',
      target: `${target.nama} (${target.peran})`,
      detail: `Penghapusan akun profil pengguna ${target.nama}.`
    });

    if (isSupabaseConfigured()) {
      try {
        const isValidUuid = typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (isValidUuid) {
          supabase.from('profil_pengguna').delete().eq('id', id).then();
        }
      } catch (e) {}
    }
  }

  return list;
};

export const updateCurrentUserProfile = (updatedFields) => {
  const session = getAuthSession();
  if (!session) return null;

  const updatedUser = {
    ...session,
    ...updatedFields,
    updatedAt: new Date().toISOString()
  };

  saveAuthSession(updatedUser);
  saveProfilPengguna(updatedUser);
  return updatedUser;
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

// ==============================================================================
// MASTER DATA & SEED DATA SATLINMAS (17 URUTAN KOLOM BAKU + BERKAS SK)
// ==============================================================================
export const getSatlinmasList = () => {
  initStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SATLINMAS);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data;
    }
    return isSupabaseConfigured() ? [] : INITIAL_SATLINMAS;
  } catch (e) {
    return isSupabaseConfigured() ? [] : INITIAL_SATLINMAS;
  }
};

export const saveSatlinmas = (satlinmasData) => {
  const list = getSatlinmasList();

  if (satlinmasData.id) {
    // Update existing
    const idx = list.findIndex(s => s.id === satlinmasData.id);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        ...satlinmasData,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.SATLINMAS, JSON.stringify(list));
      addAuditLog({
        aksi: 'UBAH',
        modul: 'Data Satlinmas',
        target: `${list[idx].nama} (${list[idx].noRegistrasi})`,
        detail: `Pembaruan data anggota Satlinmas Kec. ${list[idx].kecamatan}, Desa ${list[idx].desaKelurahan}.`
      });

      // Sinkronkan ke Supabase Live Database
      if (isSupabaseConfigured()) {
        const payload = {
          no_registrasi: list[idx].noRegistrasi || null,
          jabatan: list[idx].jabatan || null,
          keterangan: list[idx].keterangan || null,
          nama: list[idx].nama,
          nik: list[idx].nik,
          tempat_lahir: list[idx].tempatLahir,
          tanggal_lahir: list[idx].tanggalLahir,
          jenis_kelamin: list[idx].jenisKelamin,
          alamat: list[idx].alamat,
          kecamatan: list[idx].kecamatan,
          desa_kelurahan: list[idx].desaKelurahan,
          pendapatan: list[idx].pendapatan,
          tahun_pengangkatan: list[idx].tahunPengangkatan,
          jumlah_keluarga: list[idx].jumlahKeluarga,
          no_hp: list[idx].noHp,
          email: list[idx].email,
          status: list[idx].status,
          pas_foto_url: list[idx].pasFoto,
          nomor_sk: list[idx].dokumenSk?.nomorSk || '',
          tanggal_sk: list[idx].dokumenSk?.tanggalPenetapanSk ? list[idx].dokumenSk.tanggalPenetapanSk.slice(0, 10) : null,
          file_sk_url: list[idx].dokumenSk?.fileSk || ''
        };
        supabase.from('satlinmas').upsert([payload], { onConflict: 'nik' }).then(({ error }) => {
          if (error) console.error('Error syncing satlinmas to Supabase:', error.message);
        });
      }

      return list[idx];
    }
  }

  // Create new
  const curYear = satlinmasData.tahunPengangkatan || new Date().getFullYear().toString();
  const regSequence = (list.length + 1).toString().padStart(3, '0');
  const generatedReg = satlinmasData.noRegistrasi || `63.07/SLM/${curYear}/${regSequence}`;

  const newSatlinmas = {
    id: `slm-${Date.now().toString().slice(-6)}`,
    noRegistrasi: generatedReg,
    nama: satlinmasData.nama || '',
    nik: satlinmasData.nik || '',
    tempatLahir: satlinmasData.tempatLahir || 'Barabai',
    tanggalLahir: satlinmasData.tanggalLahir || '1990-01-01',
    jenisKelamin: satlinmasData.jenisKelamin || 'Laki-laki',
    alamat: satlinmasData.alamat || '',
    provinsi: satlinmasData.provinsi || 'Kalimantan Selatan',
    kabKota: satlinmasData.kabKota || 'Kabupaten Hulu Sungai Tengah',
    kecamatan: satlinmasData.kecamatan || 'Barabai',
    desaKelurahan: satlinmasData.desaKelurahan || 'Barabai Barat',
    pendapatan: satlinmasData.pendapatan || 'Rp 1.000.000 / Bulan',
    tahunPengangkatan: satlinmasData.tahunPengangkatan || new Date().getFullYear().toString(),
    jumlahKeluarga: satlinmasData.jumlahKeluarga || '3 Orang',
    noHp: satlinmasData.noHp || '',
    email: satlinmasData.email || '',
    status: satlinmasData.status || 'aktif',
    pasFoto: satlinmasData.pasFoto || '',
    dokumenSk: {
      nomorSk: satlinmasData.dokumenSk?.nomorSk || '',
      tanggalPenetapanSk: satlinmasData.dokumenSk?.tanggalPenetapanSk || '',
      fileSk: satlinmasData.dokumenSk?.fileSk || ''
    },
    createdAt: new Date().toISOString()
  };

  list.unshift(newSatlinmas);
  localStorage.setItem(STORAGE_KEYS.SATLINMAS, JSON.stringify(list));
  addAuditLog({
    aksi: 'TAMBAH',
    modul: 'Data Satlinmas',
    target: `${newSatlinmas.nama} (${newSatlinmas.noRegistrasi})`,
    detail: `Pendaftaran anggota Satlinmas baru Kec. ${newSatlinmas.kecamatan}, Desa ${newSatlinmas.desaKelurahan}.`
  });

  // Sinkronkan ke Supabase Live Database
  if (isSupabaseConfigured()) {
    const payload = {
      no_registrasi: newSatlinmas.noRegistrasi || null,
      jabatan: newSatlinmas.jabatan || null,
      keterangan: newSatlinmas.keterangan || null,
      nama: newSatlinmas.nama,
      nik: newSatlinmas.nik,
      tempat_lahir: newSatlinmas.tempatLahir,
      tanggal_lahir: newSatlinmas.tanggalLahir,
      jenis_kelamin: newSatlinmas.jenisKelamin,
      alamat: newSatlinmas.alamat,
      provinsi: newSatlinmas.provinsi,
      kab_kota: newSatlinmas.kabKota,
      kecamatan: newSatlinmas.kecamatan,
      desa_kelurahan: newSatlinmas.desaKelurahan,
      pendapatan: newSatlinmas.pendapatan,
      tahun_pengangkatan: newSatlinmas.tahunPengangkatan,
      jumlah_keluarga: newSatlinmas.jumlahKeluarga,
      no_hp: newSatlinmas.noHp,
      email: newSatlinmas.email,
      status: newSatlinmas.status,
      pas_foto_url: newSatlinmas.pasFoto,
      nomor_sk: newSatlinmas.dokumenSk.nomorSk,
      tanggal_sk: newSatlinmas.dokumenSk.tanggalPenetapanSk ? newSatlinmas.dokumenSk.tanggalPenetapanSk.slice(0, 10) : null,
      file_sk_url: newSatlinmas.dokumenSk.fileSk
    };
    supabase.from('satlinmas').upsert([payload], { onConflict: 'nik' }).then(({ error }) => {
      if (error) console.error('Error inserting satlinmas to Supabase:', error.message);
    });
  }

  return newSatlinmas;
};

export const deleteSatlinmas = (id) => {
  let list = getSatlinmasList();
  const target = list.find(s => s.id === id);
  list = list.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEYS.SATLINMAS, JSON.stringify(list));
  if (target) {
    addAuditLog({
      aksi: 'HAPUS',
      modul: 'Data Satlinmas',
      target: `${target.nama} (${target.noRegistrasi})`,
      detail: `Penghapusan data anggota Satlinmas Kec. ${target.kecamatan}.`
    });

    // Hapus dari Supabase Live Database
    if (isSupabaseConfigured()) {
      if (id.includes('-') && id.length > 20) {
        supabase.from('satlinmas').delete().eq('id', id).then();
      } else if (target.noRegistrasi) {
        supabase.from('satlinmas').delete().eq('no_registrasi', target.noRegistrasi).then();
      }
    }
  }
  return list;
};

// ==============================================================================
// MASTER DATA & SEED DATA POSKAMLING / POS RONDA OPERATIONS
// ==============================================================================
export const getPoskamlingList = () => {
  initStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.POSKAMLING);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data;
    }
    return isSupabaseConfigured() ? [] : INITIAL_POSKAMLING;
  } catch (e) {
    return isSupabaseConfigured() ? [] : INITIAL_POSKAMLING;
  }
};

export const savePoskamling = (posData) => {
  const list = getPoskamlingList();

  if (posData.id) {
    // Update existing
    const idx = list.findIndex(p => p.id === posData.id);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        ...posData,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.POSKAMLING, JSON.stringify(list));
      addAuditLog({
        aksi: 'UBAH',
        modul: 'Data Poskamling',
        target: `${list[idx].namaPoskamling || list[idx].namaPos} (Kec. ${list[idx].kecamatan})`,
        detail: `Pembaruan data sarana & kesiapsiagaan pos ronda RT ${list[idx].rt || '-'} Desa ${list[idx].desaKelurahan || list[idx].desa}.`
      });

      // Sinkronkan ke Supabase Live Database
      if (isSupabaseConfigured()) {
        const payload = {
          nama_poskamling: list[idx].namaPoskamling || list[idx].namaPos,
          kecamatan: list[idx].kecamatan,
          desa_kelurahan: list[idx].desaKelurahan || list[idx].desa,
          alamat_lengkap: list[idx].alamatLengkap || list[idx].alamat || '',
          rt: list[idx].rt || '01',
          rw: list[idx].rw || '01',
          lat: Number(list[idx].lat) || -2.5855,
          lng: Number(list[idx].lng) || 115.3815,
          kondisi_fisik: list[idx].kondisiFisik || list[idx].kondisi || 'Baik (Siap Pakai)',
          status_operasional: list[idx].statusOperasional || list[idx].status || 'Aktif Terjadwal (Tiap Malam)',
          fasilitas: Array.isArray(list[idx].fasilitas) ? list[idx].fasilitas : (list[idx].sarana || []),
          nama_ketua_pos: list[idx].namaKetuaPos || '',
          kontak_wa: list[idx].kontakWa || list[idx].kontakKoordinator || '',
          personel_ronda: Number(list[idx].personelRonda) || 0,
          catatan_tambahan: list[idx].catatanTambahan || list[idx].catatan || ''
        };
        if (list[idx].id && list[idx].id.includes('-') && list[idx].id.length > 20) {
          supabase.from('poskamling').update(payload).eq('id', list[idx].id).then();
        } else {
          supabase.from('poskamling').insert([payload]).then();
        }
      }

      return list[idx];
    }
  }

  // Create new
  const newPos = {
    id: `pos-${Date.now().toString().slice(-6)}`,
    namaPoskamling: posData.namaPoskamling || posData.namaPos || '',
    namaPos: posData.namaPoskamling || posData.namaPos || '',
    kecamatan: posData.kecamatan || 'Barabai',
    desaKelurahan: posData.desaKelurahan || posData.desa || 'Barabai Timur',
    desa: posData.desaKelurahan || posData.desa || 'Barabai Timur',
    alamatLengkap: posData.alamatLengkap || posData.alamat || '',
    alamat: posData.alamatLengkap || posData.alamat || '',
    rt: posData.rt || '01',
    rw: posData.rw || '01',
    lat: Number(posData.lat) || -2.5855,
    lng: Number(posData.lng) || 115.3815,
    kondisiFisik: posData.kondisiFisik || posData.kondisi || 'Baik (Siap Pakai)',
    kondisi: posData.kondisiFisik || posData.kondisi || 'Baik (Siap Pakai)',
    statusOperasional: posData.statusOperasional || posData.status || 'Aktif Terjadwal (Tiap Malam)',
    status: posData.statusOperasional || posData.status || 'Aktif Terjadwal (Tiap Malam)',
    fasilitas: Array.isArray(posData.fasilitas) ? posData.fasilitas : (posData.sarana || []),
    fasilitasTerdata: Array.isArray(posData.fasilitas) ? posData.fasilitas : (posData.sarana || []),
    sarana: Array.isArray(posData.fasilitas) ? posData.fasilitas : (posData.sarana || []),
    namaKetuaPos: posData.namaKetuaPos || '',
    kontakWa: posData.kontakWa || posData.kontakKoordinator || '',
    kontakKoordinator: posData.kontakWa || posData.kontakKoordinator || '',
    personelRonda: Number(posData.personelRonda) || 0,
    catatanTambahan: posData.catatanTambahan || posData.catatan || '',
    catatan: posData.catatanTambahan || posData.catatan || '',
    createdAt: new Date().toISOString()
  };

  list.unshift(newPos);
  localStorage.setItem(STORAGE_KEYS.POSKAMLING, JSON.stringify(list));
  addAuditLog({
    aksi: 'TAMBAH',
    modul: 'Data Poskamling',
    target: `${newPos.namaPoskamling} (Kec. ${newPos.kecamatan})`,
    detail: `Pencatatan titik poskamling baru di RT ${newPos.rt} Desa ${newPos.desaKelurahan}.`
  });

  // Sinkronkan ke Supabase Live Database
  if (isSupabaseConfigured()) {
    const payload = {
      nama_poskamling: newPos.namaPoskamling,
      kecamatan: newPos.kecamatan,
      desa_kelurahan: newPos.desaKelurahan,
      alamat_lengkap: newPos.alamatLengkap,
      rt: newPos.rt,
      rw: newPos.rw,
      lat: newPos.lat,
      lng: newPos.lng,
      kondisi_fisik: newPos.kondisiFisik,
      status_operasional: newPos.statusOperasional,
      fasilitas: newPos.fasilitas,
      nama_ketua_pos: newPos.namaKetuaPos,
      kontak_wa: newPos.kontakWa,
      personel_ronda: newPos.personelRonda,
      catatan_tambahan: newPos.catatanTambahan
    };
    supabase.from('poskamling').insert([payload]).then();
  }

  return newPos;
};

export const deletePoskamling = (id) => {
  let list = getPoskamlingList();
  const target = list.find(p => p.id === id);
  list = list.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.POSKAMLING, JSON.stringify(list));
  if (target) {
    addAuditLog({
      aksi: 'HAPUS',
      modul: 'Data Poskamling',
      target: `${target.namaPoskamling || target.namaPos} (Kec. ${target.kecamatan})`,
      detail: `Penghapusan data titik poskamling Desa ${target.desaKelurahan || target.desa}.`
    });

    // Hapus dari Supabase Live Database
    if (isSupabaseConfigured()) {
      if (id.includes('-') && id.length > 20) {
        supabase.from('poskamling').delete().eq('id', id).then();
      } else if (target.namaPoskamling || target.namaPos) {
        supabase.from('poskamling').delete().eq('nama_poskamling', target.namaPoskamling || target.namaPos).then();
      }
    }
  }
  return list;
};

// ==============================================================================
// KEGIATAN & PATROLI LAPANGAN SATLINMAS / SATPOL PP OPERATIONS
// ==============================================================================
export const getKegiatanPatroliList = () => {
  initStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.KEGIATAN_PATROLI);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data;
    }
    return isSupabaseConfigured() ? [] : INITIAL_KEGIATAN_PATROLI;
  } catch (e) {
    return isSupabaseConfigured() ? [] : INITIAL_KEGIATAN_PATROLI;
  }
};

export const saveKegiatanPatroli = (data) => {
  let list = getKegiatanPatroliList();

  if (data.id) {
    const idx = list.findIndex(k => k.id === data.id);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        ...data,
        updatedAt: new Date().toISOString()
      };
      safeSetItem(STORAGE_KEYS.KEGIATAN_PATROLI, JSON.stringify(list));
      addAuditLog({
        aksi: 'UBAH',
        modul: 'Kegiatan dan Patroli',
        target: `${list[idx].judulPatroli || list[idx].judulKegiatan} (${list[idx].kode})`,
        detail: `Pembaruan laporan patroli di Desa ${list[idx].desaKelurahan || list[idx].desa}, Kec. ${list[idx].kecamatan}.`
      });

      // Sinkronkan ke Supabase Live Database
      if (isSupabaseConfigured()) {
        try {
          const payload = {
            kode: list[idx].kode,
            judul_patroli: list[idx].judulPatroli || list[idx].judulKegiatan,
            jenis_kegiatan: list[idx].jenisKegiatan,
            status_situasi: list[idx].statusSituasi,
            kecamatan: list[idx].kecamatan,
            desa_kelurahan: list[idx].desaKelurahan || list[idx].desa,
            lokasi_spesifik: list[idx].lokasiSpesifik || '',
            petugas_pelapor: list[idx].petugasPelapor || list[idx].namaPelapor || '',
            nik_pelapor: list[idx].nikPelapor || null,
            jumlah_personel: Number(list[idx].jumlahPersonel) || 4,
            lat: Number(list[idx].lat) || -2.5833,
            lng: Number(list[idx].lng) || 115.3811,
            hasil_patroli: list[idx].hasilPatroli || list[idx].uraianKegiatan || '',
            tindakan_diambil: list[idx].tindakanDiambil || '',
            foto_dokumentasi: Array.isArray(list[idx].fotoDokumentasi) ? list[idx].fotoDokumentasi : []
          };
          if (list[idx].id && list[idx].id.includes('-') && list[idx].id.length > 20) {
            supabase.from('kegiatan_patroli').update(payload).eq('id', list[idx].id).then();
          } else {
            supabase.from('kegiatan_patroli').insert([payload]).then();
          }
        } catch (err) {
          console.warn('Supabase kegiatan_patroli update notice:', err);
        }
      }

      return list[idx];
    }
  }

  // Generate new entry
  const now = new Date();
  const dateCode = now.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = (list.length + 1).toString().padStart(3, '0');
  const kode = data.kode || `LAP-PTR-HST-${dateCode}-${seq}`;
  const waktuLapor = data.waktuLapor || `${now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}, ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WITA`;

  const newKegiatan = {
    id: `keg-${Date.now().toString().slice(-6)}`,
    kode,
    judulPatroli: data.judulPatroli || data.judulKegiatan || 'Patroli Trantibum Siskamling Malam',
    judulKegiatan: data.judulPatroli || data.judulKegiatan || 'Patroli Trantibum Siskamling Malam',
    jenisKegiatan: data.jenisKegiatan || 'Patroli Trantibum',
    statusSituasi: data.statusSituasi || 'Aman & Kondusif',
    kecamatan: data.kecamatan || 'Barabai',
    desaKelurahan: data.desaKelurahan || data.desa || 'Barabai Timur',
    desa: data.desaKelurahan || data.desa || 'Barabai Timur',
    lokasiSpesifik: data.lokasiSpesifik || '',
    petugasPelapor: data.petugasPelapor || data.namaPelapor || 'Anggota Satlinmas HST',
    namaPelapor: data.petugasPelapor || data.namaPelapor || 'Anggota Satlinmas HST',
    nikPelapor: data.nikPelapor || null,
    jumlahPersonel: Number(data.jumlahPersonel) || 4,
    lat: Number(data.lat) || -2.5833,
    lng: Number(data.lng) || 115.3811,
    hasilPatroli: data.hasilPatroli || data.uraianKegiatan || '',
    uraianKegiatan: data.hasilPatroli || data.uraianKegiatan || '',
    tindakanDiambil: data.tindakanDiambil || '',
    fotoDokumentasi: Array.isArray(data.fotoDokumentasi) ? data.fotoDokumentasi : [],
    waktuLapor,
    createdAt: new Date().toISOString()
  };

  list = [newKegiatan, ...list];
  safeSetItem(STORAGE_KEYS.KEGIATAN_PATROLI, JSON.stringify(list));
  addAuditLog({
    aksi: 'INPUT',
    modul: 'Kegiatan dan Patroli',
    target: `${newKegiatan.judulPatroli} (${newKegiatan.kode})`,
    detail: `Input laporan kegiatan/patroli baru oleh ${newKegiatan.petugasPelapor} di Kec. ${newKegiatan.kecamatan}.`
  });

  // Sinkronkan ke Supabase Live Database jika memungkinkan
  if (isSupabaseConfigured()) {
    try {
      const payload = {
        kode: newKegiatan.kode,
        judul_patroli: newKegiatan.judulPatroli,
        jenis_kegiatan: newKegiatan.jenisKegiatan,
        status_situasi: newKegiatan.statusSituasi,
        kecamatan: newKegiatan.kecamatan,
        desa_kelurahan: newKegiatan.desaKelurahan,
        lokasi_spesifik: newKegiatan.lokasiSpesifik,
        petugas_pelapor: newKegiatan.petugasPelapor,
        nik_pelapor: newKegiatan.nikPelapor,
        jumlah_personel: newKegiatan.jumlahPersonel,
        lat: newKegiatan.lat,
        lng: newKegiatan.lng,
        hasil_patroli: newKegiatan.hasilPatroli,
        tindakan_diambil: newKegiatan.tindakanDiambil,
        foto_dokumentasi: newKegiatan.fotoDokumentasi
      };
      supabase.from('kegiatan_patroli').insert([payload]).then(({ error }) => {
        if (error) console.warn('Supabase kegiatan_patroli sync notice:', error.message);
      });
    } catch (err) {
      console.warn('Supabase kegiatan_patroli sync exception:', err);
    }
  }

  return newKegiatan;
};

export const deleteKegiatanPatroli = (id) => {
  let list = getKegiatanPatroliList();
  const target = list.find(k => k.id === id);
  list = list.filter(k => k.id !== id);
  safeSetItem(STORAGE_KEYS.KEGIATAN_PATROLI, JSON.stringify(list));
  if (target) {
    addAuditLog({
      aksi: 'HAPUS',
      modul: 'Kegiatan dan Patroli',
      target: `${target.judulPatroli || target.judulKegiatan} (${target.kode})`,
      detail: `Penghapusan laporan patroli Kec. ${target.kecamatan}.`
    });

    // Hapus dari Supabase Live Database
    if (isSupabaseConfigured()) {
      if (id.includes('-') && id.length > 20) {
        supabase.from('kegiatan_patroli').delete().eq('id', id).then();
      } else if (target.kode) {
        supabase.from('kegiatan_patroli').delete().eq('kode', target.kode).then();
      }
    }
  }
  return list;
};

// ==============================================================================
// MASTER FASILITAS & SARANA POSKAMLING OPERATIONS (TAMBAH / UBAH / KURANG)
// ==============================================================================
export const getFasilitasPoskamlingList = () => {
  initStorage();
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.FASILITAS_POSKAMLING) || '[]');
    return data.length > 0 ? data : DEFAULT_MASTER_FASILITAS_POSKAMLING;
  } catch (e) {
    return DEFAULT_MASTER_FASILITAS_POSKAMLING;
  }
};

export const saveFasilitasPoskamling = (itemData) => {
  const list = getFasilitasPoskamlingList();

  if (itemData.id) {
    const idx = list.findIndex(f => f.id === itemData.id);
    if (idx >= 0) {
      const oldNama = list[idx].namaFasilitas;
      list[idx] = {
        ...list[idx],
        ...itemData,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.FASILITAS_POSKAMLING, JSON.stringify(list));

      // Jika nama fasilitas berubah, sinkronkan nama di seluruh data Poskamling
      if (oldNama && itemData.namaFasilitas && oldNama !== itemData.namaFasilitas) {
        syncRenameFasilitasInPoskamling(oldNama, itemData.namaFasilitas);
      }

      // Sinkronkan ke Supabase Live Database
      if (isSupabaseConfigured()) {
        const payload = {
          nama_fasilitas: list[idx].namaFasilitas,
          kategori: list[idx].kategori,
          deskripsi: list[idx].deskripsi || '',
          standar_minimal: list[idx].standarMinimal || '1 Unit',
          aktif: list[idx].aktif !== false
        };
        if (list[idx].id && list[idx].id.includes('-') && list[idx].id.length > 20) {
          supabase.from('master_fasilitas_poskamling').update(payload).eq('id', list[idx].id).then();
        } else {
          supabase.from('master_fasilitas_poskamling').insert([payload]).then();
        }
      }

      return list[idx];
    }
  }

  const newItem = {
    id: `fas-${Date.now().toString().slice(-6)}`,
    namaFasilitas: (itemData.namaFasilitas || '').trim(),
    kategori: itemData.kategori || 'Peralatan Keamanan',
    statusWajib: itemData.statusWajib || 'Standar',
    standarMinimal: itemData.standarMinimal || '1 Unit',
    deskripsi: itemData.deskripsi || '',
    aktif: itemData.aktif !== false,
    createdAt: new Date().toISOString()
  };

  list.push(newItem);
  localStorage.setItem(STORAGE_KEYS.FASILITAS_POSKAMLING, JSON.stringify(list));

  // Sinkronkan ke Supabase Live Database
  if (isSupabaseConfigured()) {
    const payload = {
      nama_fasilitas: newItem.namaFasilitas,
      kategori: newItem.kategori,
      deskripsi: newItem.deskripsi,
      standar_minimal: newItem.standarMinimal,
      aktif: newItem.aktif
    };
    supabase.from('master_fasilitas_poskamling').insert([payload]).then();
  }

  return newItem;
};

export const deleteFasilitasPoskamling = (id, removeFromPoskamling = false) => {
  let list = getFasilitasPoskamlingList();
  const target = list.find(f => f.id === id);
  if (!target) return list;

  list = list.filter(f => f.id !== id);
  localStorage.setItem(STORAGE_KEYS.FASILITAS_POSKAMLING, JSON.stringify(list));

  // Opsi: Jika removeFromPoskamling true, hapus sarana ini dari poskamling yang telah mencentangnya
  if (removeFromPoskamling && target.namaFasilitas) {
    syncRemoveFasilitasFromPoskamling(target.namaFasilitas);
  }

  // Hapus dari Supabase Live Database
  if (isSupabaseConfigured()) {
    if (id.includes('-') && id.length > 20) {
      supabase.from('master_fasilitas_poskamling').delete().eq('id', id).then();
    } else if (target.namaFasilitas) {
      supabase.from('master_fasilitas_poskamling').delete().eq('nama_fasilitas', target.namaFasilitas).then();
    }
  }

  return list;
};

export const resetFasilitasPoskamlingToDefault = () => {
  localStorage.setItem(STORAGE_KEYS.FASILITAS_POSKAMLING, JSON.stringify(DEFAULT_MASTER_FASILITAS_POSKAMLING));
  return DEFAULT_MASTER_FASILITAS_POSKAMLING;
};

// Sinkronisasi otomatis saat nama fasilitas di master diperbarui
export const syncRenameFasilitasInPoskamling = (oldNama, newNama) => {
  try {
    let posList = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSKAMLING) || '[]');
    let updated = false;
    posList = posList.map(pos => {
      if (Array.isArray(pos.fasilitas) && pos.fasilitas.includes(oldNama)) {
        updated = true;
        return {
          ...pos,
          fasilitas: pos.fasilitas.map(f => f === oldNama ? newNama : f)
        };
      }
      return pos;
    });
    if (updated) {
      localStorage.setItem(STORAGE_KEYS.POSKAMLING, JSON.stringify(posList));
    }
  } catch (e) {
    console.error('Error syncing renamed facility in poskamling:', e);
  }
};

// Sinkronisasi otomatis saat fasilitas di master dihapus
export const syncRemoveFasilitasFromPoskamling = (namaFasilitas) => {
  try {
    let posList = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSKAMLING) || '[]');
    let updated = false;
    posList = posList.map(pos => {
      if (Array.isArray(pos.fasilitas) && pos.fasilitas.includes(namaFasilitas)) {
        updated = true;
        return {
          ...pos,
          fasilitas: pos.fasilitas.filter(f => f !== namaFasilitas)
        };
      }
      return pos;
    });
    if (updated) {
      localStorage.setItem(STORAGE_KEYS.POSKAMLING, JSON.stringify(posList));
    }
  } catch (e) {
    console.error('Error syncing removed facility in poskamling:', e);
  }
};




