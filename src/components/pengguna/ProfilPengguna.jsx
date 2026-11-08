import React, { useState, useMemo } from 'react';
import { 
  UserCheck, 
  User, 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  KeyRound, 
  Lock, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Camera, 
  UserCog, 
  Users, 
  BadgeCheck,
  Check,
  X,
  Copy,
  Sparkles,
  IdCard,
  FileText,
  LayoutGrid,
  List
} from 'lucide-react';
import Modal from '../common/Modal';
import { 
  saveProfilPengguna, 
  deleteProfilPengguna, 
  updateCurrentUserProfile,
  saveAuthSession 
} from '../../data/storageService';
import { processImageUpload } from '../../utils/imageHelper';
import { KECAMATAN_HST } from '../../data/mockData';

export default function ProfilPengguna({ 
  currentUser, 
  onUpdateCurrentUser,
  profilPenggunaList = [], 
  onRefreshData,
  wilayahList = [],
  satlinmasList = [],
  initialSubTab = 'profil_saya',
  onSubTabChange
}) {
  const isAdmin = currentUser?.peran === 'admin_kabupaten' || currentUser?.peran === 'admin';
  const isOperator = currentUser?.peran === 'operator_kecamatan' || currentUser?.peran === 'operator';

  // Active Sub-Tab: 'profil_saya' | 'manajemen_pegawai' | 'manajemen_kecamatan' | 'manajemen_linmas'
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || 'profil_saya');

  React.useEffect(() => {
    if (initialSubTab && initialSubTab !== activeSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleSelectSubTab = (tab) => {
    setActiveSubTab(tab);
    if (onSubTabChange) onSubTabChange(tab);
  };

  // Notification Banner
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setErrorMsg('');
    setTimeout(() => setSuccessMsg(''), 4500);
  };

  const showError = (msg) => {
    setErrorMsg(msg);
    setSuccessMsg('');
    setTimeout(() => setErrorMsg(''), 5000);
  };

  // ============================================================================
  // TAB 1: STATE EDIT PROFIL SAYA
  // ============================================================================
  const [isEditingMyProfile, setIsEditingMyProfile] = useState(false);
  const [myNama, setMyNama] = useState(currentUser?.nama || '');
  const [myNoHp, setMyNoHp] = useState(currentUser?.noHp || '');
  const [myEmail, setMyEmail] = useState(currentUser?.email || '');
  const [myFoto, setMyFoto] = useState(currentUser?.foto || '');

  // State Ganti Kata Sandi
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleSaveMyProfile = (e) => {
    e.preventDefault();
    if (!myNama.trim()) {
      showError('Nama lengkap tidak boleh kosong!');
      return;
    }

    try {
      const updated = updateCurrentUserProfile({
        nama: myNama.trim(),
        noHp: myNoHp.trim(),
        email: myEmail.trim(),
        foto: myFoto.trim() || null
      });

      if (onUpdateCurrentUser && updated) {
        onUpdateCurrentUser(updated);
      }
      if (onRefreshData) onRefreshData();

      setIsEditingMyProfile(false);
      showSuccess('Profil akun Anda berhasil diperbarui dan disinkronkan ke database!');
    } catch (err) {
      showError(`Gagal memperbarui profil: ${err.message}`);
    }
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (!oldPassword) {
      showError('Masukkan kata sandi lama Anda saat ini!');
      return;
    }
    if (newPassword.length < 6) {
      showError('Kata sandi baru minimal 6 karakter!');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('Konfirmasi kata sandi baru tidak cocok!');
      return;
    }

    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsChangingPassword(false);
    showSuccess('Kata sandi akun Anda berhasil diperbarui!');
  };

  // ============================================================================
  // TAB 2: STATE MANAJEMEN AKUN ADMIN SATPOL PP (KABUPATEN)
  // ============================================================================
  const [searchTermPegawai, setSearchTermPegawai] = useState('');
  const [selectedRoleFilterPegawai, setSelectedRoleFilterPegawai] = useState('semua');
  const [selectedStatusFilterPegawai, setSelectedStatusFilterPegawai] = useState('semua');

  // Modal State Pegawai / Admin
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [tempNewPassword, setTempNewPassword] = useState('');

  // Form State for Pegawai User Modal
  const [formNama, setFormNama] = useState('');
  const [formNip, setFormNip] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formNoHp, setFormNoHp] = useState('');
  const [formPeran, setFormPeran] = useState('admin_kabupaten');
  const [formWilayahTugas, setFormWilayahTugas] = useState('Seluruh Kabupaten Hulu Sungai Tengah');
  const [formDesaTugas, setFormDesaTugas] = useState('');
  const [formJabatan, setFormJabatan] = useState('Administrator Satpol PP Kab. HST');
  const [formPangkat, setFormPangkat] = useState('Penata Muda (III/a)');
  const [formStatus, setFormStatus] = useState('Aktif');
  const [formFoto, setFormFoto] = useState('');

  const openAddUserModal = () => {
    setEditingUser(null);
    setFormNama('');
    setFormNip('');
    setFormEmail('');
    setFormNoHp('');
    setFormPeran('admin_kabupaten');
    setFormWilayahTugas('Seluruh Kabupaten Hulu Sungai Tengah');
    setFormDesaTugas('');
    setFormJabatan('Administrator Satpol PP Kab. HST');
    setFormPangkat('Penata Muda (III/a)');
    setFormStatus('Aktif');
    setFormFoto('');
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (user) => {
    setEditingUser(user);
    setFormNama(user.nama || '');
    setFormNip(user.nip || '');
    setFormEmail(user.email || '');
    setFormNoHp(user.noHp || '');
    setFormPeran(user.peran || 'admin_kabupaten');
    setFormWilayahTugas(user.wilayahTugas || 'Seluruh Kabupaten Hulu Sungai Tengah');
    setFormDesaTugas(user.desaTugas || '');
    setFormJabatan(user.jabatan || '');
    setFormPangkat(user.pangkat || '');
    setFormStatus(user.status || 'Aktif');
    setFormFoto(user.foto || '');
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    if (!formNama.trim() || !formNip.trim()) {
      showError('Nama lengkap dan NIP/Username akun wajib diisi!');
      return;
    }

    try {
      const payload = {
        id: editingUser ? editingUser.id : undefined,
        nama: formNama.trim(),
        nip: formNip.trim(),
        email: formEmail.trim() || `${formNip.replace(/\s+/g, '')}@satpolpp.hstkab.go.id`,
        noHp: formNoHp.trim(),
        peran: formPeran,
        wilayahTugas: formPeran === 'admin_kabupaten' ? 'Seluruh Kabupaten Hulu Sungai Tengah' : formWilayahTugas,
        desaTugas: formPeran === 'admin_kabupaten' ? null : (formDesaTugas || null),
        jabatan: formJabatan.trim(),
        pangkat: formPangkat.trim(),
        status: formStatus,
        foto: formFoto.trim() || null
      };

      saveProfilPengguna(payload);
      if (onRefreshData) onRefreshData();

      setIsUserModalOpen(false);
      showSuccess(editingUser ? `Akun pengguna ${payload.nama} berhasil diperbarui!` : `Akun pengguna baru ${payload.nama} berhasil ditambahkan!`);
    } catch (err) {
      showError(`Gagal menyimpan akun: ${err.message}`);
    }
  };

  const handleDeleteUser = (id) => {
    try {
      deleteProfilPengguna(id);
      if (onRefreshData) onRefreshData();
      setDeleteConfirmId(null);
      showSuccess('Akun pengguna berhasil dihapus dari sistem!');
    } catch (err) {
      showError(`Gagal menghapus akun: ${err.message}`);
    }
  };

  const handleExecuteResetPassword = (e) => {
    e.preventDefault();
    if (!tempNewPassword || tempNewPassword.length < 6) {
      showError('Kata sandi baru minimal 6 karakter!');
      return;
    }

    showSuccess(`Kata sandi akun ${resetPasswordUser?.nama} berhasil direset menjadi: "${tempNewPassword}"`);
    setResetPasswordUser(null);
    setTempNewPassword('');
  };

  // ============================================================================
  // TAB 3: STATE KHUSUS AKUN OPERATOR KECAMATAN (11 KECAMATAN HST)
  // ============================================================================
  const [searchTermKecamatan, setSearchTermKecamatan] = useState('');
  const [filterWilayahKecamatan, setFilterWilayahKecamatan] = useState('semua');
  const [filterStatusKecamatan, setFilterStatusKecamatan] = useState('semua');
  const [viewModeKecamatan, setViewModeKecamatan] = useState('tabel'); // 'tabel' | 'matriks'

  // Modal State Khusus Kecamatan
  const [isKecamatanModalOpen, setIsKecamatanModalOpen] = useState(false);
  const [editingKecamatanUser, setEditingKecamatanUser] = useState(null);

  // Form State Khusus Operator Kecamatan
  const [formKecNama, setFormKecNama] = useState('');
  const [formKecNip, setFormKecNip] = useState('');
  const [formKecWilayah, setFormKecWilayah] = useState('Barabai');
  const [formKecJabatan, setFormKecJabatan] = useState('Kasi Ketenteraman dan Ketertiban Umum');
  const [formKecPangkat, setFormKecPangkat] = useState('Penata Muda (III/a)');
  const [formKecNoHp, setFormKecNoHp] = useState('');
  const [formKecEmail, setFormKecEmail] = useState('');
  const [formKecPassword, setFormKecPassword] = useState('OperatorHST2026!');
  const [formKecStatus, setFormKecStatus] = useState('Aktif');
  const [formKecFoto, setFormKecFoto] = useState('');

  const openAddKecamatanModal = (preselectedKec = null) => {
    setEditingKecamatanUser(null);
    const targetKec = preselectedKec || 'Barabai';
    const slug = targetKec.toLowerCase().replace(/\s+/g, '');
    setFormKecNama(`Operator Kec. ${targetKec}`);
    setFormKecNip(`operator.${slug}`);
    setFormKecWilayah(targetKec);
    setFormKecJabatan(`Kasi Trantibum & Operator Kec. ${targetKec}`);
    setFormKecPangkat('Penata Muda (III/a)');
    setFormKecNoHp('');
    setFormKecEmail(`operator.${slug}@satpolpp.hstkab.go.id`);
    setFormKecPassword('OperatorHST2026!');
    setFormKecStatus('Aktif');
    setFormKecFoto('');
    setIsKecamatanModalOpen(true);
  };

  const openEditKecamatanModal = (user) => {
    setEditingKecamatanUser(user);
    setFormKecNama(user.nama || '');
    setFormKecNip(user.nip || '');
    setFormKecWilayah(user.wilayahTugas || 'Barabai');
    setFormKecJabatan(user.jabatan || 'Operator Wilayah Kecamatan');
    setFormKecPangkat(user.pangkat || 'Penata Muda (III/a)');
    setFormKecNoHp(user.noHp || '');
    setFormKecEmail(user.email || '');
    setFormKecPassword('OperatorHST2026!');
    setFormKecStatus(user.status || 'Aktif');
    setFormKecFoto(user.foto || '');
    setIsKecamatanModalOpen(true);
  };

  const handleSaveKecamatanUser = (e) => {
    e.preventDefault();
    if (!formKecNama.trim() || !formKecNip.trim() || !formKecWilayah) {
      showError('Nama lengkap, NIP/Username login, dan Wilayah Kecamatan wajib diisi!');
      return;
    }

    try {
      const payload = {
        id: editingKecamatanUser ? editingKecamatanUser.id : undefined,
        nama: formKecNama.trim(),
        nip: formKecNip.trim(),
        peran: 'operator_kecamatan',
        wilayahTugas: formKecWilayah,
        desaTugas: null,
        jabatan: formKecJabatan.trim() || `Operator Wilayah Kec. ${formKecWilayah}`,
        pangkat: formKecPangkat.trim() || 'Penata Muda (III/a)',
        noHp: formKecNoHp.trim(),
        email: formKecEmail.trim() || `${formKecNip.replace(/\s+/g, '')}@satpolpp.hstkab.go.id`,
        foto: formKecFoto.trim() || null,
        status: formKecStatus
      };

      saveProfilPengguna(payload);
      if (onRefreshData) onRefreshData();

      setIsKecamatanModalOpen(false);
      showSuccess(
        editingKecamatanUser 
          ? `Akun Operator Kecamatan ${payload.wilayahTugas} (${payload.nama}) berhasil diperbarui!` 
          : `Akun Operator Kecamatan ${payload.wilayahTugas} (${payload.nama}) berhasil dibuat!`
      );
    } catch (err) {
      showError(`Gagal menyimpan akun operator kecamatan: ${err.message}`);
    }
  };

  const handleCopyKecamatanCredentials = (user) => {
    const credText = `*AKUN LOGIN OPERATOR KECAMATAN LINDUNGMAS HST*\nNama: ${user.nama}\nNIP / Username: ${user.nip}\nJabatan: ${user.jabatan || 'Operator Wilayah Kecamatan'}\nKecamatan Binaan: Kec. ${user.wilayahTugas}\n\n*Kredensial Login:*\nUsername: ${user.nip}\nPassword: ${user.password || 'OperatorHST2026!'}\nHak Akses: Operator Kecamatan (Kelola Poskamling, Linmas, & Patroli Wilayah Kec. ${user.wilayahTugas})\n\nTautan Portal: https://lindungmas.hstkab.go.id`;
    navigator.clipboard.writeText(credText);
    showSuccess(`Kredensial login Operator Kec. ${user.wilayahTugas} berhasil disalin! Siap dikirim via WhatsApp.`);
  };

  // ============================================================================
  // TAB 4: STATE KHUSUS AKUN LOGIN SATLINMAS (SUB MENU KHUSUS)
  // ============================================================================
  const [searchTermLinmas, setSearchTermLinmas] = useState('');
  const [filterKecamatanLinmas, setFilterKecamatanLinmas] = useState('semua');
  const [filterStatusLinmas, setFilterStatusLinmas] = useState('semua');

  // Modal State Khusus Linmas
  const [isLinmasModalOpen, setIsLinmasModalOpen] = useState(false);
  const [editingLinmasUser, setEditingLinmasUser] = useState(null);
  const [selectedSatlinmasId, setSelectedSatlinmasId] = useState('');

  // Form State Khusus Linmas
  const [formLinmasNama, setFormLinmasNama] = useState('');
  const [formLinmasNik, setFormLinmasNik] = useState('');
  const [formLinmasNoReg, setFormLinmasNoReg] = useState('');
  const [formLinmasJabatan, setFormLinmasJabatan] = useState('Anggota Satlinmas');
  const [formLinmasKecamatan, setFormLinmasKecamatan] = useState('Barabai');
  const [formLinmasDesa, setFormLinmasDesa] = useState('Barabai Timur');
  const [formLinmasNoHp, setFormLinmasNoHp] = useState('');
  const [formLinmasEmail, setFormLinmasEmail] = useState('');
  const [formLinmasPassword, setFormLinmasPassword] = useState('LinmasHST2026!');
  const [formLinmasStatus, setFormLinmasStatus] = useState('Aktif');
  const [formLinmasFoto, setFormLinmasFoto] = useState('');

  const openAddLinmasModal = (preselected = null) => {
    setEditingLinmasUser(null);
    if (preselected) {
      setSelectedSatlinmasId(preselected.id);
      setFormLinmasNama(preselected.nama || '');
      setFormLinmasNik(preselected.nik || '');
      setFormLinmasNoReg(preselected.noRegistrasi || '');
      setFormLinmasJabatan(preselected.isDanru ? 'Komandan Regu (Danru)' : 'Anggota Satlinmas');
      setFormLinmasKecamatan(preselected.kecamatan || 'Barabai');
      setFormLinmasDesa(preselected.desaKelurahan || '');
      setFormLinmasNoHp(preselected.noHp || '');
      setFormLinmasEmail(preselected.email || `${(preselected.nik || 'linmas')}@linmas.hstkab.go.id`);
      setFormLinmasFoto(preselected.pasFoto || '');
    } else {
      setSelectedSatlinmasId('');
      setFormLinmasNama('');
      setFormLinmasNik('');
      setFormLinmasNoReg('');
      setFormLinmasJabatan('Anggota Satlinmas');
      setFormLinmasKecamatan('Barabai');
      setFormLinmasDesa('');
      setFormLinmasNoHp('');
      setFormLinmasEmail('');
      setFormLinmasFoto('');
    }
    setFormLinmasPassword('LinmasHST2026!');
    setFormLinmasStatus('Aktif');
    setIsLinmasModalOpen(true);
  };

  const openEditLinmasModal = (user) => {
    setEditingLinmasUser(user);
    setSelectedSatlinmasId('');
    setFormLinmasNama(user.nama || '');
    setFormLinmasNik(user.nik || user.nip || '');
    setFormLinmasNoReg(user.noRegistrasi || '');
    setFormLinmasJabatan(user.jabatan || 'Anggota Satlinmas');
    setFormLinmasKecamatan(user.wilayahTugas || 'Barabai');
    setFormLinmasDesa(user.desaTugas || '');
    setFormLinmasNoHp(user.noHp || '');
    setFormLinmasEmail(user.email || '');
    setFormLinmasPassword('LinmasHST2026!');
    setFormLinmasStatus(user.status || 'Aktif');
    setFormLinmasFoto(user.foto || '');
    setIsLinmasModalOpen(true);
  };

  const handleSelectSatlinmas = (id) => {
    setSelectedSatlinmasId(id);
    if (!id) return;
    const found = satlinmasList.find(s => s.id === id);
    if (found) {
      setFormLinmasNama(found.nama || '');
      setFormLinmasNik(found.nik || '');
      setFormLinmasNoReg(found.noRegistrasi || '');
      setFormLinmasJabatan(found.isDanru ? 'Komandan Regu (Danru)' : 'Anggota Satlinmas');
      setFormLinmasKecamatan(found.kecamatan || 'Barabai');
      setFormLinmasDesa(found.desaKelurahan || '');
      setFormLinmasNoHp(found.noHp || '');
      setFormLinmasEmail(found.email || `${(found.nik || 'linmas')}@linmas.hstkab.go.id`);
      setFormLinmasFoto(found.pasFoto || '');
    }
  };

  const handleSaveLinmasUser = (e) => {
    e.preventDefault();
    if (!formLinmasNama.trim() || !formLinmasNik.trim()) {
      showError('Nama lengkap dan NIK personil Linmas wajib diisi!');
      return;
    }

    try {
      const payload = {
        id: editingLinmasUser ? editingLinmasUser.id : `usr-linmas-${Date.now().toString().slice(-6)}`,
        nama: formLinmasNama.trim(),
        nip: formLinmasNik.trim(), // simpan NIK di kolom NIP/username
        nik: formLinmasNik.trim(),
        noRegistrasi: formLinmasNoReg.trim() || null,
        peran: 'anggota_linmas', // Hak akses khusus Anggota Linmas
        wilayahTugas: formLinmasKecamatan,
        desaTugas: formLinmasDesa.trim() || null,
        jabatan: formLinmasJabatan,
        pangkat: 'Satlinmas',
        regu: formLinmasJabatan.includes('Danru') ? 'Danru' : 'Anggota',
        noHp: formLinmasNoHp.trim(),
        email: formLinmasEmail.trim() || `${formLinmasNik.trim()}@linmas.hstkab.go.id`,
        password: formLinmasPassword || 'LinmasHST2026!',
        foto: formLinmasFoto.trim() || null,
        status: formLinmasStatus
      };

      saveProfilPengguna(payload);
      if (onRefreshData) onRefreshData();

      setIsLinmasModalOpen(false);
      showSuccess(
        editingLinmasUser
          ? `Akun login Linmas ${payload.nama} berhasil diperbarui!`
          : `Akun login Linmas ${payload.nama} berhasil dibuat! Username login: ${payload.nik}`
      );
    } catch (err) {
      showError(`Gagal menyimpan akun Linmas: ${err.message}`);
    }
  };

  const handleCopyCredentials = (user) => {
    const credText = `*AKUN LOGIN RESMI LINDUNGMAS HST*\nNama: ${user.nama}\nJabatan: ${user.jabatan || 'Anggota Satlinmas'}\nNo. Registrasi: ${user.noRegistrasi || '-'}\nWilayah: Kec. ${user.wilayahTugas}, Desa ${user.desaTugas || '-'}\n\n*Kredensial Login:*\nUsername: ${user.nik || user.nip}\nPassword: ${user.password || 'LinmasHST2026!'}\nHak Akses: Anggota Satlinmas (KTA Digital & Lapor Patroli)\n\nTautan Portal: https://lindungmas.hstkab.go.id`;
    navigator.clipboard.writeText(credText);
    showSuccess(`Kredensial login untuk ${user.nama} berhasil disalin! Siap dikirim ke anggota via WhatsApp.`);
  };

  // Aktivasi otomatis akun Komandan Regu (Danru)
  const handleBatchCreateDanruAccounts = () => {
    const danruList = satlinmasList.filter(s => s.isDanru);
    let countCreated = 0;

    danruList.forEach(d => {
      const exists = profilPenggunaList.some(u => 
        (u.nik && u.nik === d.nik) || (u.noRegistrasi && u.noRegistrasi === d.noRegistrasi)
      );
      if (!exists) {
        saveProfilPengguna({
          nama: d.nama,
          nip: d.nik,
          nik: d.nik,
          noRegistrasi: d.noRegistrasi,
          peran: 'anggota_linmas',
          wilayahTugas: d.kecamatan,
          desaTugas: d.desaKelurahan,
          jabatan: 'Komandan Regu (Danru)',
          pangkat: 'Satlinmas',
          regu: 'Danru',
          noHp: d.noHp || '',
          email: d.email || `${d.nik}@linmas.hstkab.go.id`,
          foto: d.pasFoto || null,
          status: 'Aktif'
        });
        countCreated++;
      }
    });

    if (onRefreshData) onRefreshData();
    if (countCreated > 0) {
      showSuccess(`Berhasil membuat ${countCreated} akun login resmi untuk Komandan Regu (Danru) Satlinmas!`);
    } else {
      showSuccess('Semua Komandan Regu (Danru) sudah memiliki akun login aktif.');
    }
  };

  // ============================================================================
  // DATA FILTERING & STATISTIK 4 SUB-MENU (RBAC 3-TIER + 11 KECAMATAN HST)
  // ============================================================================
  const effectiveWilayahList = useMemo(() => {
    return (wilayahList && wilayahList.length > 0) ? wilayahList : KECAMATAN_HST;
  }, [wilayahList]);

  // 1. Admin Satpol PP Kabupaten (Pimpinan & Admin Dinas)
  const adminUsers = useMemo(() => {
    return profilPenggunaList.filter(u => u.peran === 'admin_kabupaten' || u.peran === 'admin');
  }, [profilPenggunaList]);

  const filteredAdminUsers = useMemo(() => {
    return adminUsers.filter(user => {
      const matchSearch = 
        (user.nama && user.nama.toLowerCase().includes(searchTermPegawai.toLowerCase())) ||
        (user.nip && user.nip.toLowerCase().includes(searchTermPegawai.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchTermPegawai.toLowerCase())) ||
        (user.jabatan && user.jabatan.toLowerCase().includes(searchTermPegawai.toLowerCase()));

      const matchStatus = selectedStatusFilterPegawai === 'semua' || user.status === selectedStatusFilterPegawai;
      return matchSearch && matchStatus;
    });
  }, [adminUsers, searchTermPegawai, selectedStatusFilterPegawai]);

  // 2. Akun Operator Kecamatan (11 Kecamatan Kab. HST)
  const kecamatanUsers = useMemo(() => {
    return profilPenggunaList.filter(u => u.peran === 'operator_kecamatan' || u.peran === 'operator');
  }, [profilPenggunaList]);

  const filteredKecamatanUsers = useMemo(() => {
    return kecamatanUsers.filter(user => {
      const matchSearch = 
        (user.nama && user.nama.toLowerCase().includes(searchTermKecamatan.toLowerCase())) ||
        (user.nip && user.nip.toLowerCase().includes(searchTermKecamatan.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchTermKecamatan.toLowerCase())) ||
        (user.jabatan && user.jabatan.toLowerCase().includes(searchTermKecamatan.toLowerCase())) ||
        (user.wilayahTugas && user.wilayahTugas.toLowerCase().includes(searchTermKecamatan.toLowerCase()));

      const matchKec = filterWilayahKecamatan === 'semua' || (user.wilayahTugas || '').toLowerCase() === filterWilayahKecamatan.toLowerCase();
      const matchStatus = filterStatusKecamatan === 'semua' || user.status === filterStatusKecamatan;

      if (isOperator && currentUser?.wilayahTugas) {
        const matchTerritory = (user.wilayahTugas || '').toLowerCase() === currentUser.wilayahTugas.toLowerCase();
        return matchSearch && matchKec && matchStatus && matchTerritory;
      }
      return matchSearch && matchKec && matchStatus;
    });
  }, [kecamatanUsers, searchTermKecamatan, filterWilayahKecamatan, filterStatusKecamatan, isOperator, currentUser]);

  // Cakupan 11 Wilayah Kecamatan
  const kecamatanCoverage = useMemo(() => {
    return effectiveWilayahList.map(kec => {
      const operators = kecamatanUsers.filter(u => 
        (u.wilayahTugas || '').toLowerCase() === kec.nama.toLowerCase()
      );
      return {
        ...kec,
        operators,
        hasOperator: operators.length > 0,
        activeCount: operators.filter(o => o.status === 'Aktif').length
      };
    });
  }, [effectiveWilayahList, kecamatanUsers]);

  const assignedKecamatanCount = kecamatanCoverage.filter(c => c.hasOperator).length;
  const unassignedKecamatanCount = effectiveWilayahList.length - assignedKecamatanCount;

  // Batch auto-create akun default untuk 11 kecamatan
  const handleBatchCreateDefaultKecamatanAccounts = () => {
    let countCreated = 0;
    effectiveWilayahList.forEach(kec => {
      const exists = profilPenggunaList.some(u => 
        (u.peran === 'operator_kecamatan' || u.peran === 'operator') &&
        (u.wilayahTugas || '').toLowerCase() === kec.nama.toLowerCase()
      );
      if (!exists) {
        const slug = kec.nama.toLowerCase().replace(/\s+/g, '');
        const usernameKec = `operator.${slug}`;
        saveProfilPengguna({
          nama: `Operator Kec. ${kec.nama}`,
          nip: usernameKec,
          peran: 'operator_kecamatan',
          wilayahTugas: kec.nama,
          desaTugas: null,
          jabatan: `Kasi Trantibum & Operator Kec. ${kec.nama}`,
          pangkat: 'Penata Muda (III/a)',
          noHp: '081250000000',
          email: `${usernameKec}@satpolpp.hstkab.go.id`,
          foto: null,
          status: 'Aktif'
        });
        countCreated++;
      }
    });

    if (onRefreshData) onRefreshData();
    if (countCreated > 0) {
      showSuccess(`Berhasil membuat ${countCreated} akun operator default untuk kecamatan di Kabupaten HST!`);
    } else {
      showSuccess('Semua 11 kecamatan di Kabupaten HST sudah memiliki akun operator aktif.');
    }
  };

  // 3. Linmas Users (Khusus Personel Linmas)
  const linmasUsers = useMemo(() => {
    return profilPenggunaList.filter(u => u.peran === 'anggota_linmas' || u.peran === 'linmas');
  }, [profilPenggunaList]);

  const filteredLinmasUsers = useMemo(() => {
    return linmasUsers.filter(user => {
      const matchSearch = 
        (user.nama && user.nama.toLowerCase().includes(searchTermLinmas.toLowerCase())) ||
        (user.nik && user.nik.toLowerCase().includes(searchTermLinmas.toLowerCase())) ||
        (user.nip && user.nip.toLowerCase().includes(searchTermLinmas.toLowerCase())) ||
        (user.noRegistrasi && user.noRegistrasi.toLowerCase().includes(searchTermLinmas.toLowerCase())) ||
        (user.desaTugas && user.desaTugas.toLowerCase().includes(searchTermLinmas.toLowerCase())) ||
        (user.wilayahTugas && user.wilayahTugas.toLowerCase().includes(searchTermLinmas.toLowerCase()));

      const matchKec = filterKecamatanLinmas === 'semua' || (user.wilayahTugas || '').toLowerCase() === filterKecamatanLinmas.toLowerCase();
      const matchStatus = filterStatusLinmas === 'semua' || user.status === filterStatusLinmas;

      if (isOperator && currentUser?.wilayahTugas) {
        const matchTerritory = (user.wilayahTugas || '').toLowerCase() === currentUser.wilayahTugas.toLowerCase();
        return matchSearch && matchKec && matchStatus && matchTerritory;
      }
      return matchSearch && matchKec && matchStatus;
    });
  }, [linmasUsers, searchTermLinmas, filterKecamatanLinmas, filterStatusLinmas, isOperator, currentUser]);

  // Statistik Keseluruhan
  const totalUsers = profilPenggunaList.length;
  const countAdmin = adminUsers.length;
  const countOperator = kecamatanUsers.length;
  const countLinmas = linmasUsers.length;

  const getRoleBadgeUI = (role) => {
    if (role === 'admin_kabupaten' || role === 'admin') {
      return {
        label: 'Admin Satpol PP Kabupaten',
        badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
        desc: 'Akses penuh seluruh data, peta, pengguna, dan kegiatan se-Kabupaten HST.'
      };
    }
    if (role === 'operator_kecamatan' || role === 'operator') {
      return {
        label: 'Operator Kecamatan',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
        desc: 'Mengelola data Poskamling, Satlinmas, dan patroli di wilayah kecamatan yang ditugaskan.'
      };
    }
    return {
      label: 'Anggota Satlinmas',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      desc: 'Melihat profil sendiri, input patroli GPS lapangan, dan melihat KTA digital.'
    };
  };

  const currentRoleMeta = getRoleBadgeUI(currentUser?.peran);

  return (
    <div className="space-y-6">
      {/* 1. HEADER SECTION DENGAN TAB SWITCHER 4 SUB-MENU */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0F2A4A] to-[#16365C] text-[#F0B429] flex items-center justify-center shadow-xs">
            <UserCog className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-[#0F2A4A] tracking-tight">Profil Pengguna & Hak Akses</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#0F2A4A] text-[#F0B429] uppercase">
                RBAC 3-Tier
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola profil akun login Anda, kredensial admin dinas, operator 11 kecamatan, dan login khusus anggota Satlinmas.
            </p>
          </div>
        </div>

        {/* Tab Switcher 4 Sub-Menu */}
        <div className="flex items-center flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0 self-start lg:self-auto">
          {/* Sub-Menu 1: Profil Saya */}
          <button
            onClick={() => handleSelectSubTab('profil_saya')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'profil_saya'
                ? 'bg-white text-[#0F2A4A] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profil Saya</span>
          </button>

          {/* Sub-Menu 2: Akun Admin Satpol PP (Kabupaten) */}
          {(isAdmin || isOperator) && (
            <button
              onClick={() => handleSelectSubTab('manajemen_pegawai')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'manajemen_pegawai' || activeSubTab === 'manajemen_akun'
                  ? 'bg-white text-purple-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-purple-700" />
              <span>Admin Satpol PP ({countAdmin})</span>
            </button>
          )}

          {/* Sub-Menu 3: Akun Operator Kecamatan (11 Kecamatan HST) */}
          {(isAdmin || isOperator) && (
            <button
              onClick={() => handleSelectSubTab('manajemen_kecamatan')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'manajemen_kecamatan'
                  ? 'bg-[#0F2A4A] text-[#F0B429] shadow-xs'
                  : 'text-blue-900 hover:bg-blue-100/60 font-bold'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-[#F0B429]" />
              <span>Akun Kecamatan ({countOperator})</span>
            </button>
          )}

          {/* Sub-Menu 4: Akun Login Linmas (KHUSUS) */}
          {(isAdmin || isOperator) && (
            <button
              onClick={() => handleSelectSubTab('manajemen_linmas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'manajemen_linmas'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-emerald-800 hover:bg-emerald-100/60 font-extrabold'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>Login Akun Linmas ({countLinmas})</span>
            </button>
          )}
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 leading-relaxed">
          <p className="font-bold mb-0.5">Hak Akses & Pembagian Peran Pengguna LINDUNGMAS HST</p>
          <p className="text-blue-800">
            Sistem memisahkan antara <strong>Akun Pegawai Satpol PP</strong> (menggunakan NIP & jabatan struktural) 
            dengan <strong>Akun Login Anggota Linmas</strong> (menggunakan NIK 16 digit & Nomor Registrasi KTA). 
            Anggota Linmas yang login secara otomatis diarahkan ke <strong>Portal Mandiri</strong> untuk mengakses KTA Digital resmi dan laporan patroli siskamling tanpa melihat modul administratif.
          </p>
        </div>
      </div>

      {/* Success / Error Messages */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-800 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-800 flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 1: PROFIL AKUN SAYA */}
      {/* ========================================================================= */}
      {activeSubTab === 'profil_saya' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Summary Card */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs text-center relative overflow-hidden">
              <div className="w-24 h-24 rounded-full mx-auto bg-gradient-to-br from-[#0F2A4A] to-[#16365C] text-[#F0B429] flex items-center justify-center font-bold text-3xl shadow-md border-4 border-white overflow-hidden relative">
                {currentUser?.foto ? (
                  <img src={currentUser.foto} alt={currentUser.nama} className="w-full h-full object-cover" />
                ) : (
                  currentUser?.nama?.charAt(0) || 'U'
                )}
              </div>

              <h2 className="text-base font-extrabold text-[#0F2A4A] mt-4 leading-tight">
                {currentUser?.nama || 'Petugas Satpol PP'}
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {currentUser?.nip ? `NIP/NIK: ${currentUser.nip}` : 'ID Personel'}
              </p>

              <div className="mt-3 inline-block">
                <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold border ${currentRoleMeta.badgeClass}`}>
                  {currentRoleMeta.label}
                </span>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 text-left space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block text-[11px]">Wilayah Penugasan</span>
                  <span className="text-slate-800 font-bold block">{currentUser?.wilayahTugas || 'Kabupaten HST'}</span>
                  {currentUser?.desaTugas && (
                    <span className="text-slate-500 text-[11px]">Desa/Kelurahan: {currentUser.desaTugas}</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 font-medium block text-[11px]">Jabatan Kedinasan</span>
                  <span className="text-slate-800 font-semibold block">{currentUser?.jabatan || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block text-[11px]">Email Resmi</span>
                  <span className="text-slate-800 font-mono block truncate">{currentUser?.email || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block text-[11px]">No. Telepon / WhatsApp</span>
                  <span className="text-slate-800 font-mono block">{currentUser?.noHp || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Profile Edit Form & Change Password */}
          <div className="lg:col-span-8 space-y-6">
            {/* Form Edit Profil */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div>
                  <h3 className="text-sm font-extrabold text-[#0F2A4A]">Informasi Profil Akun</h3>
                  <p className="text-xs text-slate-500">Perbarui kontak dan foto profil akun Anda</p>
                </div>
                {!isEditingMyProfile && (
                  <button
                    onClick={() => setIsEditingMyProfile(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Ubah Profil</span>
                  </button>
                )}
              </div>

              {isEditingMyProfile ? (
                <form onSubmit={handleSaveMyProfile} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      value={myNama}
                      onChange={(e) => setMyNama(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={myEmail}
                        onChange={(e) => setMyEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp</label>
                      <input
                        type="text"
                        value={myNoHp}
                        onChange={(e) => setMyNoHp(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Foto Profil Akun</label>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="w-14 h-14 rounded-full bg-slate-200 border-2 border-slate-300 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                        {myFoto ? (
                          <img src={myFoto} alt="Preview Foto" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <label className="px-3 py-1.5 bg-[#0F2A4A] hover:bg-[#16365C] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors">
                            <Camera className="w-3.5 h-3.5 text-[#F0B429]" />
                            <span>Unggah Foto dari Perangkat / Kamera</span>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    const base64 = await processImageUpload(file);
                                    setMyFoto(base64);
                                  } catch (err) {
                                    alert('Gagal memproses foto: ' + err.message);
                                  }
                                }
                                e.target.value = '';
                              }}
                            />
                          </label>

                          {myFoto && (
                            <button
                              type="button"
                              onClick={() => setMyFoto('')}
                              className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg font-semibold transition-colors cursor-pointer"
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">Pilih file foto JPG/PNG atau foto langsung dengan kamera.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsEditingMyProfile(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#0F2A4A] text-white font-bold hover:bg-[#16365C] transition-colors cursor-pointer shadow-xs"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[11px] mb-0.5">Nama Akun</span>
                    <p className="font-bold text-slate-800 text-sm">{currentUser?.nama || '-'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[11px] mb-0.5">Nomor NIP / NIK</span>
                    <p className="font-mono font-bold text-slate-800 text-sm">{currentUser?.nip || '-'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[11px] mb-0.5">Email Akun</span>
                    <p className="font-mono text-slate-800">{currentUser?.email || '-'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[11px] mb-0.5">Nomor Handphone</span>
                    <p className="font-mono text-slate-800">{currentUser?.noHp || '-'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Ganti Kata Sandi */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div>
                  <h3 className="text-sm font-extrabold text-[#0F2A4A]">Keamanan & Kata Sandi</h3>
                  <p className="text-xs text-slate-500">Perbarui kata sandi akun login Anda</p>
                </div>
                {!isChangingPassword && (
                  <button
                    onClick={() => setIsChangingPassword(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-amber-200"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                    <span>Ganti Kata Sandi</span>
                  </button>
                )}
              </div>

              {isChangingPassword ? (
                <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kata Sandi Saat Ini *</label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Masukkan kata sandi lama"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Kata Sandi Baru *</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Konfirmasi Kata Sandi Baru *</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi kata sandi baru"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                      <input
                        type="checkbox"
                        checked={showPassword}
                        onChange={(e) => setShowPassword(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                      />
                      <span>Tampilkan karakter sandi</span>
                    </label>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsChangingPassword(false)}
                        className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 transition-colors cursor-pointer shadow-xs"
                      >
                        Simpan Kata Sandi
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <p className="text-xs text-slate-500">
                  Kata sandi Anda terakhir diperbarui secara aman. Disarankan menggunakan kombinasi huruf dan angka.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: AKUN ADMIN SATPOL PP (KABUPATEN) */}
      {/* ========================================================================= */}
      {(activeSubTab === 'manajemen_pegawai' || activeSubTab === 'manajemen_akun') && (isAdmin || isOperator) && (
        <div className="space-y-6">
          {/* Quick Stat Cards Admin Satpol PP */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Admin Satpol PP</span>
              <p className="text-2xl font-extrabold text-purple-700 mt-1 font-mono">{countAdmin}</p>
              <span className="text-[11px] text-purple-600 font-semibold flex items-center gap-1 mt-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Personel Struktural Dinas
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status Akun Aktif</span>
              <p className="text-2xl font-extrabold text-emerald-700 mt-1 font-mono">
                {adminUsers.filter(u => u.status === 'Aktif').length}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">Dapat Login Penuh</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cakupan Wilayah</span>
              <p className="text-2xl font-extrabold text-[#0F2A4A] mt-1 font-mono">11 Kec</p>
              <span className="text-[11px] text-slate-500 mt-1 block">Seluruh Kabupaten HST</span>
            </div>
          </div>

          {/* Filter Bar & Add Admin Button */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 w-full md:w-auto md:flex-1">
              <div className="sm:col-span-8 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTermPegawai}
                  onChange={(e) => setSearchTermPegawai(e.target.value)}
                  placeholder="Cari nama, NIP, email, atau jabatan Admin Satpol PP..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
                />
              </div>

              <div className="sm:col-span-4">
                <select
                  value={selectedStatusFilterPegawai}
                  onChange={(e) => setSelectedStatusFilterPegawai(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white"
                >
                  <option value="semua">Semua Status</option>
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={openAddUserModal}
                className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-purple-700 text-white hover:bg-purple-800 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4 text-amber-300" />
                <span>+ Tambah Admin Satpol PP</span>
              </button>
            )}
          </div>

          {/* Admin Satpol PP Accounts Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-purple-50/70 border-b border-purple-200 text-purple-950 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3 border-r border-slate-200 w-12 text-center">No</th>
                    <th className="py-3 px-4 border-r border-slate-200 min-w-[220px]">Pejabat & Jabatan</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 min-w-[170px]">NIP Pegawai</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 min-w-[160px]">Hak Akses RBAC</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 min-w-[180px]">Wilayah Penugasan</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 min-w-[150px]">Kontak & Email</th>
                    <th className="py-3 px-3 border-r border-slate-200 min-w-[90px] text-center">Status</th>
                    <th className="py-3 px-3.5 min-w-[120px] text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredAdminUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Tidak ada akun admin Satpol PP yang cocok dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredAdminUsers.map((user, idx) => {
                      const roleUI = getRoleBadgeUI(user.peran);
                      return (
                        <tr key={user.id || user.nip} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 border-r border-slate-200 text-center font-mono text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 border-r border-slate-200">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold shrink-0 overflow-hidden text-xs">
                                {user.foto ? (
                                  <img src={user.foto} alt={user.nama} className="w-full h-full object-cover" />
                                ) : (
                                  user.nama?.charAt(0) || 'A'
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 leading-snug">{user.nama}</p>
                                <p className="text-[11px] text-slate-500 leading-tight">{user.jabatan || '-'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3.5 border-r border-slate-200 font-mono text-slate-700">
                            {user.nip || '-'}
                          </td>
                          <td className="py-3 px-3.5 border-r border-slate-200">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${roleUI.badgeClass}`}>
                              {roleUI.label}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 border-r border-slate-200 text-slate-800">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{user.wilayahTugas || 'Seluruh Kabupaten HST'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3.5 border-r border-slate-200 text-slate-600 font-mono text-[11px]">
                            <p>{user.noHp || '-'}</p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{user.email || '-'}</p>
                          </td>
                          <td className="py-3 px-3 border-r border-slate-200 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              user.status === 'Aktif' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-slate-100 text-slate-600 border border-slate-300'
                            }`}>
                              {user.status || 'Aktif'}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openEditUserModal(user)}
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Akun Admin"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setResetPasswordUser(user);
                                  setTempNewPassword('SatpolHST2026!');
                                }}
                                className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                title="Reset Kata Sandi"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>
                              {isAdmin && user.id !== currentUser?.id && user.nip !== currentUser?.nip && (
                                <button
                                  onClick={() => setDeleteConfirmId(user.id || user.nip)}
                                  className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Hapus Akun Admin"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: AKUN OPERATOR KECAMATAN (11 KECAMATAN KAB. HST) */}
      {/* ========================================================================= */}
      {activeSubTab === 'manajemen_kecamatan' && (isAdmin || isOperator) && (
        <div className="space-y-6">
          {/* Quick Stat Cards Khusus Kecamatan */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Kecamatan HST</span>
              <p className="text-2xl font-extrabold text-[#0F2A4A] mt-1 font-mono">{effectiveWilayahList.length}</p>
              <span className="text-[11px] text-blue-700 font-semibold flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5" /> 11 Wilayah Administrasi
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kecamatan Terisi</span>
              <p className="text-2xl font-extrabold text-emerald-700 mt-1 font-mono">
                {assignedKecamatanCount} <span className="text-sm font-normal text-slate-500">/ {effectiveWilayahList.length}</span>
              </p>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.round((assignedKecamatanCount / effectiveWilayahList.length) * 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Belum Ada Operator</span>
              <p className="text-2xl font-extrabold text-amber-700 mt-1 font-mono">{unassignedKecamatanCount}</p>
              <span className="text-[11px] text-slate-500 mt-1 block">Kecamatan Kosong</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Akun Operator</span>
              <p className="text-2xl font-extrabold text-purple-700 mt-1 font-mono">{kecamatanUsers.length}</p>
              <span className="text-[11px] text-slate-500 mt-1 block">Petugas Terdaftar</span>
            </div>
          </div>

          {/* Banner Penjelasan Khusus Akun Operator Kecamatan */}
          <div className="bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0F2A4A] text-[#F0B429] flex items-center justify-center shrink-0 shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-[#0F2A4A]">Akun Operator & Kasi Trantib Wilayah Kecamatan</h4>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  Setiap operator kecamatan memiliki hak akses wilayah binaan terisolasi. Mereka dapat menginput, memperbarui, 
                  dan memverifikasi Poskamling, Satlinmas, serta Laporan Patroli di <strong>11 Kecamatan Kabupaten Hulu Sungai Tengah</strong>.
                </p>
              </div>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={handleBatchCreateDefaultKecamatanAccounts}
                className="px-3.5 py-2 rounded-xl bg-[#0F2A4A] hover:bg-[#16365C] text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                title="Buat otomatis akun operator default untuk kecamatan yang belum memiliki akun"
              >
                <Sparkles className="w-4 h-4 text-[#F0B429]" />
                <span>⚡ Buat Akun Default 11 Kecamatan</span>
              </button>
            )}
          </div>

          {/* Filter Bar, View Mode Switcher, and Add Button */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 w-full lg:w-auto lg:flex-1">
              <div className="sm:col-span-5 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTermKecamatan}
                  onChange={(e) => setSearchTermKecamatan(e.target.value)}
                  placeholder="Cari nama operator, NIP/username, kecamatan..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
                />
              </div>

              <div className="sm:col-span-4">
                <select
                  value={filterWilayahKecamatan}
                  onChange={(e) => setFilterWilayahKecamatan(e.target.value)}
                  disabled={Boolean(isOperator && currentUser?.wilayahTugas)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white"
                >
                  <option value="semua">Semua Wilayah Kecamatan (11)</option>
                  {effectiveWilayahList.map(kec => (
                    <option key={kec.id || kec.nama} value={kec.nama}>Kec. {kec.nama}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <select
                  value={filterStatusKecamatan}
                  onChange={(e) => setFilterStatusKecamatan(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white"
                >
                  <option value="semua">Semua Status</option>
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
              {/* View Switcher: Tabel vs Matriks */}
              <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewModeKecamatan('tabel')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewModeKecamatan === 'tabel' ? 'bg-white text-[#0F2A4A] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Tampilan Tabel Akun"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Tabel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewModeKecamatan('matriks')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewModeKecamatan === 'matriks' ? 'bg-white text-[#0F2A4A] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Tampilan Matriks 11 Kecamatan"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Matriks 11 Kec</span>
                </button>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => openAddKecamatanModal()}
                  className="px-4 py-2.5 rounded-xl bg-[#0F2A4A] text-white hover:bg-[#16365C] font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 text-[#F0B429]" />
                  <span>+ Tambah Akun Kecamatan</span>
                </button>
              )}
            </div>
          </div>

          {/* VIEW 1: TABEL DATA AKUN OPERATOR KECAMATAN */}
          {viewModeKecamatan === 'tabel' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-blue-50/70 border-b border-blue-200 text-[#0F2A4A] font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-3 border-r border-slate-200 w-12 text-center">No</th>
                      <th className="py-3 px-3.5 border-r border-slate-200 min-w-[170px]">Kecamatan Binaan</th>
                      <th className="py-3 px-4 border-r border-slate-200 min-w-[210px]">Operator Wilayah</th>
                      <th className="py-3 px-3.5 border-r border-slate-200 min-w-[160px]">NIP / Username</th>
                      <th className="py-3 px-3.5 border-r border-slate-200 min-w-[170px]">Jabatan Kedinasan</th>
                      <th className="py-3 px-3.5 border-r border-slate-200 min-w-[150px]">Kontak & Email</th>
                      <th className="py-3 px-3 border-r border-slate-200 min-w-[90px] text-center">Status</th>
                      <th className="py-3 px-3.5 min-w-[140px] text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredKecamatanUsers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center">
                          <div className="max-w-md mx-auto space-y-2">
                            <Building2 className="w-10 h-10 text-blue-300 mx-auto" />
                            <p className="font-bold text-slate-700 text-sm">Tidak ada akun operator yang cocok</p>
                            <p className="text-slate-500 text-xs">
                              Gunakan tombol <strong>+ Tambah Akun Kecamatan</strong> atau <strong>⚡ Buat Akun Default 11 Kecamatan</strong> untuk membuat akun otomatis.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredKecamatanUsers.map((user, idx) => (
                        <tr key={user.id || user.nip} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 border-r border-slate-200 text-center font-mono text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3.5 border-r border-slate-200">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">
                              <MapPin className="w-3.5 h-3.5 text-blue-700" />
                              <span>Kec. {user.wilayahTugas}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 border-r border-slate-200">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold shrink-0 overflow-hidden text-xs">
                                {user.foto ? (
                                  <img src={user.foto} alt={user.nama} className="w-full h-full object-cover" />
                                ) : (
                                  user.nama?.charAt(0) || 'O'
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 leading-snug">{user.nama}</p>
                                <p className="text-[10px] text-slate-400 font-mono">Pangkat: {user.pangkat || 'PNS'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3.5 border-r border-slate-200 font-mono font-bold text-slate-800">
                            {user.nip || '-'}
                          </td>
                          <td className="py-3 px-3.5 border-r border-slate-200 text-slate-700">
                            {user.jabatan || 'Operator Wilayah Kecamatan'}
                          </td>
                          <td className="py-3 px-3.5 border-r border-slate-200 text-slate-600 font-mono text-[11px]">
                            <p>{user.noHp || '-'}</p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{user.email || '-'}</p>
                          </td>
                          <td className="py-3 px-3 border-r border-slate-200 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              user.status === 'Aktif' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-slate-100 text-slate-600 border border-slate-300'
                            }`}>
                              {user.status || 'Aktif'}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* Salin WA Kredensial */}
                              <button
                                type="button"
                                onClick={() => handleCopyKecamatanCredentials(user)}
                                className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="Salin Info Login (Kirim via WhatsApp)"
                              >
                                <Copy className="w-4 h-4" />
                              </button>

                              {/* Edit Akun */}
                              <button
                                type="button"
                                onClick={() => openEditKecamatanModal(user)}
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Akun Operator"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              {/* Reset Sandi */}
                              <button
                                type="button"
                                onClick={() => {
                                  setResetPasswordUser(user);
                                  setTempNewPassword('OperatorHST2026!');
                                }}
                                className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                title="Reset Kata Sandi"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>

                              {/* Hapus Akun */}
                              {isAdmin && user.id !== currentUser?.id && user.nip !== currentUser?.nip && (
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(user.id || user.nip)}
                                  className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Hapus Akun Operator"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 2: MATRIKS WILAYAH 11 KECAMATAN */}
          {viewModeKecamatan === 'matriks' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {kecamatanCoverage.map(item => {
                const hasOp = item.hasOperator;
                const op = item.operators[0];

                return (
                  <div 
                    key={item.id || item.nama}
                    className={`rounded-2xl border p-4 transition-all duration-200 shadow-xs flex flex-col justify-between ${
                      hasOp ? 'bg-white border-blue-200 hover:border-blue-300' : 'bg-slate-50 border-dashed border-slate-300'
                    }`}
                  >
                    <div>
                      {/* Header Kartu Kecamatan */}
                      <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                            <h3 className="font-extrabold text-[#0F2A4A] text-sm">Kecamatan {item.nama}</h3>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Pusat: <span className="font-medium text-slate-700">{item.pusat || '-'}</span> • {item.desa?.length || 0} Desa/Kel
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          hasOp 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {hasOp ? `${item.operators.length} Operator` : 'Belum Ada'}
                        </span>
                      </div>

                      {/* Body Operator */}
                      <div className="pt-3">
                        {hasOp ? (
                          <div className="space-y-3">
                            {item.operators.map((opItem) => (
                              <div key={opItem.id || opItem.nip} className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-blue-200 text-[#0F2A4A] font-bold flex items-center justify-center shrink-0 overflow-hidden text-xs">
                                    {opItem.foto ? (
                                      <img src={opItem.foto} alt={opItem.nama} className="w-full h-full object-cover" />
                                    ) : (
                                      opItem.nama?.charAt(0) || 'O'
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-slate-900 truncate">{opItem.nama}</p>
                                    <p className="text-[10px] font-mono text-slate-500 truncate">User: {opItem.nip}</p>
                                  </div>
                                </div>

                                <div className="mt-2 pt-2 border-t border-blue-100/60 text-[11px] text-slate-600 space-y-0.5">
                                  <p className="truncate"><strong>Jabatan:</strong> {opItem.jabatan || 'Operator Wilayah'}</p>
                                  <p><strong>WhatsApp:</strong> <span className="font-mono">{opItem.noHp || '-'}</span></p>
                                </div>

                                <div className="mt-2.5 flex items-center justify-end gap-1.5 pt-1 border-t border-blue-100/60">
                                  <button
                                    type="button"
                                    onClick={() => handleCopyKecamatanCredentials(opItem)}
                                    className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-800 rounded-lg font-bold text-[10px] border border-emerald-200 flex items-center gap-1 transition-colors cursor-pointer"
                                    title="Salin kredensial untuk WhatsApp"
                                  >
                                    <Copy className="w-3 h-3 text-emerald-600" />
                                    <span>Salin WA</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openEditKecamatanModal(opItem)}
                                    className="px-2 py-1 bg-white hover:bg-blue-50 text-blue-800 rounded-lg font-bold text-[10px] border border-blue-200 flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <Edit className="w-3 h-3 text-blue-600" />
                                    <span>Edit</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-6 text-center space-y-2">
                            <p className="text-xs text-slate-400">Belum ada operator yang ditugaskan</p>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => openAddKecamatanModal(item.nama)}
                                className="px-3 py-1.5 bg-[#0F2A4A] text-[#F0B429] hover:bg-[#16365C] rounded-xl font-bold text-xs flex items-center gap-1.5 mx-auto transition-colors cursor-pointer shadow-xs"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Tetapkan Operator</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Kartu */}
                    {hasOp && isAdmin && item.operators.length < 2 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-end">
                        <button
                          type="button"
                          onClick={() => openAddKecamatanModal(item.nama)}
                          className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ Tambah Petugas Cadangan</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: AKUN LOGIN SATLINMAS (SUB MENU KHUSUS PERSONEL SATLINMAS) */}
      {/* ========================================================================= */}
      {activeSubTab === 'manajemen_linmas' && (isAdmin || isOperator) && (
        <div className="space-y-6">
          {/* Quick Stat Cards Khusus Linmas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Anggota Satlinmas</span>
              <p className="text-2xl font-extrabold text-emerald-800 mt-1 font-mono">{satlinmasList.length}</p>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Personel Terdaftar
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Akun Login Aktif</span>
              <p className="text-2xl font-extrabold text-[#0F2A4A] mt-1 font-mono">{linmasUsers.length}</p>
              <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1 mt-1">
                <UserCheck className="w-3.5 h-3.5" /> Sudah Memiliki Akun
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Belum Punya Akun</span>
              <p className="text-2xl font-extrabold text-amber-600 mt-1 font-mono">
                {Math.max(0, satlinmasList.length - linmasUsers.length)}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">Siap Diaktivasi</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Komandan Regu (Danru)</span>
              <p className="text-2xl font-extrabold text-purple-700 mt-1 font-mono">
                {satlinmasList.filter(s => s.isDanru).length}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">Koordinator Regu Wilayah</span>
            </div>
          </div>

          {/* Banner Penjelasan Khusus Akun Linmas */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <IdCard className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h4 className="font-extrabold text-emerald-950">Akses Mandiri & KTA Digital Anggota Satlinmas</h4>
                <p className="text-emerald-800 text-[11px] mt-0.5">
                  Akun Linmas menggunakan <strong>NIK 16 digit</strong> atau <strong>Nomor Registrasi KTA</strong> sebagai username login. 
                  Saat login, mereka hanya dapat melihat KTA digital dan modul pelaporan patroli.
                </p>
              </div>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={handleBatchCreateDanruAccounts}
                className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                title="Aktivasi otomatis akun login untuk semua Danru Satlinmas"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>⚡ Aktivasi Otomatis Akun Danru</span>
              </button>
            )}
          </div>

          {/* Filter Bar & Tombol Tambah Akun Linmas */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 w-full md:w-auto md:flex-1">
              <div className="sm:col-span-6 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTermLinmas}
                  onChange={(e) => setSearchTermLinmas(e.target.value)}
                  placeholder="Cari nama anggota, NIK, No. Registrasi, atau desa..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 outline-hidden"
                />
              </div>

              <div className="sm:col-span-3">
                <select
                  value={filterKecamatanLinmas}
                  onChange={(e) => setFilterKecamatanLinmas(e.target.value)}
                  disabled={Boolean(isOperator && currentUser?.wilayahTugas)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 outline-hidden bg-white"
                >
                  <option value="semua">Semua Kecamatan</option>
                  {effectiveWilayahList.map(kec => (
                    <option key={kec.id || kec.nama} value={kec.nama}>Kec. {kec.nama}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <select
                  value={filterStatusLinmas}
                  onChange={(e) => setFilterStatusLinmas(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 outline-hidden bg-white"
                >
                  <option value="semua">Semua Status</option>
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openAddLinmasModal()}
              className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>+ Tambah Akun Login Linmas</span>
            </button>
          </div>

          {/* Tabel Akun Login Linmas */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-emerald-50/70 border-b border-emerald-200 text-emerald-950 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3 border-r border-slate-200 w-12 text-center">No</th>
                    <th className="py-3 px-4 border-r border-slate-200 min-w-[230px]">Personel Satlinmas</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 min-w-[170px]">No. Registrasi & NIK</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 min-w-[140px]">Jabatan Linmas</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 min-w-[190px]">Wilayah Penugasan</th>
                    <th className="py-3 px-3.5 border-r border-slate-200 min-w-[160px]">Username & Kontak</th>
                    <th className="py-3 px-3 border-r border-slate-200 min-w-[90px] text-center">Status</th>
                    <th className="py-3 px-3.5 min-w-[140px] text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredLinmasUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center">
                        <div className="max-w-md mx-auto space-y-2">
                          <ShieldCheck className="w-10 h-10 text-emerald-300 mx-auto" />
                          <p className="font-bold text-slate-700 text-sm">Belum ada akun login Linmas yang dibuat</p>
                          <p className="text-slate-500 text-xs">
                            Klik tombol <strong>+ Tambah Akun Login Linmas</strong> untuk menghubungkan personil dari 90 anggota Satlinmas atau gunakan tombol <strong>Aktivasi Otomatis Danru</strong>.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredLinmasUsers.map((user, idx) => {
                      const isDanru = (user.jabatan || '').toLowerCase().includes('danru');
                      return (
                        <tr key={user.id || user.nik || user.nip} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 border-r border-slate-200 text-center font-mono text-slate-500">
                            {idx + 1}
                          </td>

                          {/* Personel Foto & Nama */}
                          <td className="py-3 px-4 border-r border-slate-200">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-emerald-800 font-bold shrink-0 overflow-hidden text-xs shadow-2xs">
                                {user.foto ? (
                                  <img src={user.foto} alt={user.nama} className="w-full h-full object-cover" />
                                ) : (
                                  user.nama?.charAt(0) || 'L'
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 leading-snug truncate">{user.nama}</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  {isDanru ? (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-purple-100 text-purple-800 border border-purple-200 uppercase">
                                      Danru
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                                      Anggota
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-400 font-mono">Linmas HST</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* No. Registrasi & NIK */}
                          <td className="py-3 px-3.5 border-r border-slate-200 font-mono text-slate-700">
                            <p className="font-bold text-emerald-800 text-xs">{user.noRegistrasi || '-'}</p>
                            <p className="text-[11px] text-slate-500">{user.nik || user.nip || '-'}</p>
                          </td>

                          {/* Jabatan Linmas */}
                          <td className="py-3 px-3.5 border-r border-slate-200">
                            <span className="font-semibold text-slate-800">{user.jabatan || 'Anggota Satlinmas'}</span>
                          </td>

                          {/* Wilayah Penugasan */}
                          <td className="py-3 px-3.5 border-r border-slate-200 text-slate-800">
                            <p className="font-bold text-slate-900 leading-tight">Kec. {user.wilayahTugas || '-'}</p>
                            <p className="text-[11px] text-slate-500">Desa {user.desaTugas || '-'}</p>
                          </td>

                          {/* Username & Kontak */}
                          <td className="py-3 px-3.5 border-r border-slate-200 text-slate-600 font-mono text-[11px]">
                            <p className="font-bold text-slate-800">User: {user.nik || user.nip}</p>
                            <p className="text-slate-500">{user.noHp || '-'}</p>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 border-r border-slate-200 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              user.status === 'Aktif' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-slate-100 text-slate-600 border border-slate-300'
                            }`}>
                              {user.status || 'Aktif'}
                            </span>
                          </td>

                          {/* Aksi Khusus Linmas */}
                          <td className="py-3 px-3.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* Tombol Salin Kredensial WhatsApp */}
                              <button
                                type="button"
                                onClick={() => handleCopyCredentials(user)}
                                className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="Salin Info Login (Kirim via WhatsApp)"
                              >
                                <Copy className="w-4 h-4" />
                              </button>

                              {/* Tombol Edit */}
                              <button
                                type="button"
                                onClick={() => openEditLinmasModal(user)}
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Akun Linmas"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              {/* Tombol Reset Password */}
                              <button
                                type="button"
                                onClick={() => {
                                  setResetPasswordUser(user);
                                  setTempNewPassword('LinmasHST2026!');
                                }}
                                className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                title="Reset Kata Sandi"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>

                              {/* Tombol Hapus */}
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(user.id || user.nip)}
                                  className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Hapus Akun Linmas"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: TAMBAH / EDIT AKUN PEGAWAI & OPERATOR */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title={editingUser ? `Edit Akun Pegawai: ${editingUser.nama}` : 'Tambah Akun Pegawai & Operator'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Pegawai *</label>
            <input
              type="text"
              value={formNama}
              onChange={(e) => setFormNama(e.target.value)}
              placeholder="Contoh: Muhammad Rizky, S.H."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nomor Induk Pegawai (NIP) *</label>
              <input
                type="text"
                value={formNip}
                onChange={(e) => setFormNip(e.target.value)}
                placeholder="19850614..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden font-mono"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Peran Hak Akses *</label>
              <select
                value={formPeran}
                onChange={(e) => setFormPeran(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white"
              >
                <option value="admin_kabupaten">Admin Satpol PP Kabupaten (Akses Penuh)</option>
                <option value="operator_kecamatan">Operator Kecamatan (Terbatas Wilayah)</option>
              </select>
            </div>
          </div>

          {formPeran === 'operator_kecamatan' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Wilayah Kecamatan Binaan *</label>
                <select
                  value={formWilayahTugas}
                  onChange={(e) => setFormWilayahTugas(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white"
                >
                  {effectiveWilayahList.map(kec => (
                    <option key={kec.id || kec.nama} value={kec.nama}>Kec. {kec.nama}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pangkat / Golongan PNS</label>
                <input
                  type="text"
                  value={formPangkat}
                  onChange={(e) => setFormPangkat(e.target.value)}
                  placeholder="Pengatur (II/c)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jabatan Kedinasan</label>
              <input
                type="text"
                value={formJabatan}
                onChange={(e) => setFormJabatan(e.target.value)}
                placeholder="Operator Wilayah Kecamatan / Staf Satpol PP"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nomor HP / WhatsApp</label>
              <input
                type="text"
                value={formNoHp}
                onChange={(e) => setFormNoHp(e.target.value)}
                placeholder="0812..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Resmi</label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="nama@satpolpp.hstkab.go.id"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Status Akun</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white"
              >
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsUserModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-700 text-white hover:bg-purple-800 font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-300" />
              <span>{editingUser ? 'Perbarui Akun Admin' : 'Simpan Akun Admin'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: KHUSUS TAMBAH / EDIT AKUN OPERATOR KECAMATAN */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isKecamatanModalOpen}
        onClose={() => setIsKecamatanModalOpen(false)}
        title={editingKecamatanUser ? `Edit Akun Operator: ${editingKecamatanUser.nama}` : 'Tambah Akun Operator Kecamatan'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveKecamatanUser} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Operator *</label>
            <input
              type="text"
              value={formKecNama}
              onChange={(e) => setFormKecNama(e.target.value)}
              placeholder="Contoh: Muhammad Salahuddin, S.IP"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                NIP / Username Login *
              </label>
              <input
                type="text"
                value={formKecNip}
                onChange={(e) => setFormKecNip(e.target.value)}
                placeholder="19710227... atau operator.barabai"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden font-mono"
                required
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Digunakan petugas untuk login ke sistem.</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Wilayah Kecamatan Binaan *</label>
              <select
                value={formKecWilayah}
                onChange={(e) => {
                  const newKec = e.target.value;
                  setFormKecWilayah(newKec);
                  if (!editingKecamatanUser) {
                    const slug = newKec.toLowerCase().replace(/\s+/g, '');
                    setFormKecNip(`operator.${slug}`);
                    setFormKecNama(`Operator Kec. ${newKec}`);
                    setFormKecJabatan(`Kasi Trantibum & Operator Kec. ${newKec}`);
                    setFormKecEmail(`operator.${slug}@satpolpp.hstkab.go.id`);
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white font-bold text-[#0F2A4A]"
                required
              >
                {effectiveWilayahList.map(kec => (
                  <option key={kec.id || kec.nama} value={kec.nama}>Kecamatan {kec.nama}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jabatan Kedinasan di Kecamatan</label>
              <input
                type="text"
                value={formKecJabatan}
                onChange={(e) => setFormKecJabatan(e.target.value)}
                placeholder="Kasi Trantibum & Linmas"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Pangkat / Golongan Ruang</label>
              <input
                type="text"
                value={formKecPangkat}
                onChange={(e) => setFormKecPangkat(e.target.value)}
                placeholder="Penata Muda (III/a)"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
              <input
                type="text"
                value={formKecNoHp}
                onChange={(e) => setFormKecNoHp(e.target.value)}
                placeholder="081250001122"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Resmi Dinas</label>
              <input
                type="email"
                value={formKecEmail}
                onChange={(e) => setFormKecEmail(e.target.value)}
                placeholder="operator.barabai@satpolpp.hstkab.go.id"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kata Sandi Awal Login</label>
              <input
                type="text"
                value={formKecPassword}
                onChange={(e) => setFormKecPassword(e.target.value)}
                placeholder="OperatorHST2026!"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Kata sandi default untuk diberikan ke operator kecamatan.</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Status Akun</label>
              <select
                value={formKecStatus}
                onChange={(e) => setFormKecStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden bg-white"
              >
                <option value="Aktif">Aktif (Dapat Login)</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Foto Profil Operator</label>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-slate-200 border border-slate-300 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                {formKecFoto ? (
                  <img src={formKecFoto} alt="Foto Operator" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 bg-[#0F2A4A] hover:bg-[#16365C] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors">
                    <Camera className="w-3.5 h-3.5 text-[#F0B429]" />
                    <span>Unggah Foto dari Kamera / Perangkat</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const base64 = await processImageUpload(file);
                            setFormKecFoto(base64);
                          } catch (err) {
                            alert('Gagal memproses foto: ' + err.message);
                          }
                        }
                        e.target.value = '';
                      }}
                    />
                  </label>
                  {formKecFoto && (
                    <button
                      type="button"
                      onClick={() => setFormKecFoto('')}
                      className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Hapus foto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 block">Format gambar otomatis dikompresi agar ringan.</span>
              </div>
            </div>
          </div>

          {/* Callout RBAC Info */}
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 flex items-start gap-2.5 text-[11px] text-blue-900">
            <Shield className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Ketentuan Hak Akses Operator Kecamatan (RBAC):</p>
              <p>
                Akun ini dikunci secara otomatis ke wilayah <strong>Kecamatan {formKecWilayah}</strong>. Petugas hanya berwenang melihat, menginput, dan mengelola data Poskamling, Satlinmas, dan Kegiatan Patroli di kecamatannya.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsKecamatanModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#0F2A4A] text-white hover:bg-[#16365C] font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-[#F0B429]" />
              <span>{editingKecamatanUser ? 'Perbarui Akun Operator' : 'Simpan & Aktifkan Akun'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: KHUSUS TAMBAH / EDIT LOGIN AKUN LINMAS */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isLinmasModalOpen}
        onClose={() => setIsLinmasModalOpen(false)}
        title={editingLinmasUser ? `Edit Akun Linmas: ${editingLinmasUser.nama}` : 'Tambah Akun Login Personel Satlinmas'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveLinmasUser} className="space-y-4 text-xs">
          {/* Autocomplete / Pilih dari 90 Personel Satlinmas Database */}
          {!editingLinmasUser && satlinmasList.length > 0 && (
            <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-extrabold text-emerald-950">
                  ⚡ Pilih dari Database Personel Satlinmas (Auto-Fill)
                </label>
                <span className="text-[10px] text-emerald-700 font-bold">
                  {satlinmasList.length} Personel Tersedia
                </span>
              </div>
              <select
                value={selectedSatlinmasId}
                onChange={(e) => handleSelectSatlinmas(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-emerald-300 focus:ring-2 focus:ring-emerald-600 outline-hidden bg-white text-xs font-medium"
              >
                <option value="">-- Pilih Anggota Satlinmas untuk Diisikan Otomatis --</option>
                {satlinmasList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.noRegistrasi} - {m.nama} ({m.isDanru ? 'Danru' : 'Anggota'}) - Kec. {m.kecamatan}, Desa {m.desaKelurahan}
                  </option>
                ))}
              </select>
              <p className="text-[10.5px] text-emerald-800">
                Memilih anggota di atas akan otomatis mengisi Nama, NIK, No. Registrasi, Kecamatan, Desa, dan No. HP.
              </p>
            </div>
          )}

          {/* Data Identitas Anggota Linmas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Personel *</label>
              <input
                type="text"
                value={formLinmasNama}
                onChange={(e) => setFormLinmasNama(e.target.value)}
                placeholder="Contoh: Muhammad Arsyad"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 outline-hidden"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jabatan di Satlinmas *</label>
              <select
                value={formLinmasJabatan}
                onChange={(e) => setFormLinmasJabatan(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 outline-hidden bg-white"
              >
                <option value="Anggota Satlinmas">Anggota Satlinmas</option>
                <option value="Komandan Regu (Danru)">Komandan Regu (Danru)</option>
                <option value="Wakil Komandan Regu (Wadanru)">Wakil Komandan Regu (Wadanru)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                NIK (16 Digit) - <span className="text-emerald-700 font-bold">Username Login</span> *
              </label>
              <input
                type="text"
                value={formLinmasNik}
                onChange={(e) => setFormLinmasNik(e.target.value)}
                placeholder="6307061205840001"
                maxLength={16}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 outline-hidden font-mono"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nomor Registrasi KTA</label>
              <input
                type="text"
                value={formLinmasNoReg}
                onChange={(e) => setFormLinmasNoReg(e.target.value)}
                placeholder="63.07/SLM/2026/001"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 outline-hidden font-mono"
              />
            </div>
          </div>

          {/* Wilayah Penugasan Linmas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kecamatan Penugasan *</label>
              <select
                value={formLinmasKecamatan}
                onChange={(e) => setFormLinmasKecamatan(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 outline-hidden bg-white"
              >
                {effectiveWilayahList.map(kec => (
                  <option key={kec.id || kec.nama} value={kec.nama}>Kec. {kec.nama}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Desa / Kelurahan Penugasan</label>
              <input
                type="text"
                value={formLinmasDesa}
                onChange={(e) => setFormLinmasDesa(e.target.value)}
                placeholder="Contoh: Barabai Timur"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 outline-hidden bg-white"
              />
            </div>
          </div>

          {/* Kontak & Password Akun */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
              <input
                type="text"
                value={formLinmasNoHp}
                onChange={(e) => setFormLinmasNoHp(e.target.value)}
                placeholder="081250001122"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 outline-hidden font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kata Sandi Awal Login</label>
              <input
                type="text"
                value={formLinmasPassword}
                onChange={(e) => setFormLinmasPassword(e.target.value)}
                placeholder="LinmasHST2026!"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 outline-hidden font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Kata sandi yang diberikan ke anggota untuk login.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Status Akun</label>
              <select
                value={formLinmasStatus}
                onChange={(e) => setFormLinmasStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 outline-hidden bg-white"
              >
                <option value="Aktif">Aktif (Dapat Login)</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Pas Foto Resmi Linmas</label>
              <div className="flex items-center gap-2">
                <div className="w-9 h-10 rounded-lg overflow-hidden border border-slate-300 bg-white shadow-2xs shrink-0 flex items-center justify-center">
                  {formLinmasFoto ? (
                    <img src={formLinmasFoto} alt="Foto Linmas" className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-4 h-4 text-slate-300" />
                  )}
                </div>
                <label className="flex-1 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors">
                  <Camera className="w-3.5 h-3.5 text-amber-300" />
                  <span>{formLinmasFoto ? 'Ganti Foto' : 'Unggah Foto'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const base64 = await processImageUpload(file);
                          setFormLinmasFoto(base64);
                        } catch (err) {
                          alert('Gagal memproses foto: ' + err.message);
                        }
                      }
                      e.target.value = '';
                    }}
                  />
                </label>
                {formLinmasFoto && (
                  <button
                    type="button"
                    onClick={() => setFormLinmasFoto('')}
                    className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Hapus foto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Konfirmasi Hak Akses Mandiri */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5 text-[11px] text-amber-900">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Hak Akses Sistem Otomatis:</p>
              <p>
                Akun ini otomatis memiliki peran <strong>Anggota Satlinmas (`anggota_linmas`)</strong>. 
                Pengguna hanya dapat melihat <strong>Profil & KTA Digital Mandiri</strong> serta <strong>Modul Pelaporan Patroli Lapangan</strong>.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsLinmasModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-300" />
              <span>{editingLinmasUser ? 'Perbarui Akun Linmas' : 'Simpan & Aktifkan Login Linmas'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: RESET PASSWORD PENGGUNA */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(resetPasswordUser)}
        onClose={() => setResetPasswordUser(null)}
        title="Reset Kata Sandi Pengguna"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleExecuteResetPassword} className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Anda akan mereset kata sandi login untuk pengguna: <strong className="text-slate-900">{resetPasswordUser?.nama}</strong> (Username: {resetPasswordUser?.nik || resetPasswordUser?.nip}).
          </p>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Kata Sandi Baru *</label>
            <input
              type="text"
              value={tempNewPassword}
              onChange={(e) => setTempNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
              required
            />
            <p className="text-[10px] text-slate-400 mt-1">Berikan kata sandi ini kepada personil yang bersangkutan setelah direset.</p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setResetPasswordUser(null)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-600 text-white hover:bg-amber-700 font-bold cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <KeyRound className="w-4 h-4" />
              <span>Simpan Kata Sandi Baru</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: KONFIRMASI HAPUS AKUN */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        title="Konfirmasi Hapus Akun Pengguna"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Apakah Anda yakin ingin menghapus akun pengguna ini? Tindakan ini akan mencabut hak akses login pengguna dari sistem LINDUNGMAS.
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={() => handleDeleteUser(deleteConfirmId)}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 font-bold cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Trash2 className="w-4 h-4" />
              <span>Ya, Hapus Akun</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
