import React, { useState } from 'react';
import { 
  Shield, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  LogIn, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  Building2,
  Sparkles
} from 'lucide-react';
import { getPegawaiList, saveAuthSession } from '../../data/storageService';

export default function LoginPage({ 
  onLoginSuccess, 
  onBackToLanding 
}) {
  const pegawaiList = getPegawaiList();
  
  // Default accounts from Master Pegawai
  const adminPegawai = pegawaiList.find(p => p.peran === 'admin') || {
    id: 'peg-001',
    nama: 'Drs. H. Subhan, M.Si',
    nip: '19740815 199603 1 002',
    jabatan: 'Kepala Satuan Polisi Pamong Praja',
    peran: 'admin'
  };

  const userPegawai = pegawaiList.find(p => p.peran === 'user') || {
    id: 'peg-002',
    nama: 'M. Rizky Pratama, S.H.',
    nip: '19820512 200801 1 005',
    jabatan: 'Petugas Penegak Perda',
    peran: 'user'
  };

  const [selectedRolePreset, setSelectedRolePreset] = useState('admin');
  const [username, setUsername] = useState(adminPegawai.nip);
  const [password, setPassword] = useState('satpolpp123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Switch role preset
  const handleSelectPreset = (role) => {
    setSelectedRolePreset(role);
    setErrorMsg('');
    if (role === 'admin') {
      setUsername(adminPegawai.nip);
      setPassword('satpolpp123');
    } else {
      setUsername(userPegawai.nip);
      setPassword('petugas123');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Harap masukkan NIP/Username dan Kata Sandi!');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      // Determine user object based on selected preset or match in pegawaiList
      let matchedUser = pegawaiList.find(p => 
        p.nip === username.trim() || 
        p.nama.toLowerCase().includes(username.toLowerCase())
      );

      if (!matchedUser) {
        matchedUser = selectedRolePreset === 'admin' ? adminPegawai : userPegawai;
      }

      // Save session
      const sessionUser = {
        id: matchedUser.id,
        nama: matchedUser.nama,
        nip: matchedUser.nip,
        jabatan: matchedUser.jabatan,
        peran: selectedRolePreset || matchedUser.peran || 'user',
        foto: matchedUser.foto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
        loginTime: new Date().toISOString()
      };

      saveAuthSession(sessionUser);
      onLoginSuccess(sessionUser);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8] flex flex-col justify-between selection:bg-[#F0B429] selection:text-[#0F2A4A]">
      {/* Top Bar with Back Link */}
      <div className="p-4 sm:p-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <button
          type="button"
          onClick={onBackToLanding}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-[#0F2A4A] bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#0F2A4A]" />
          <span>Kembali ke Halaman Utama</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#0F2A4A] text-[#F0B429] flex items-center justify-center font-bold">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-[#0F2A4A] text-sm hidden sm:inline">GARDA MURAKATA</span>
        </div>
      </div>

      {/* Main Login Card Container */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Panel: Branding & Identity (Desktop) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#0F2A4A] via-[#14365D] to-[#0A1F36] p-8 text-white flex flex-col justify-between relative overflow-hidden">
            {/* Ambient Graphic */}
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-[#F0B429]/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F0B429] text-[#0F2A4A] flex items-center justify-center font-bold shadow-md shadow-[#F0B429]/20">
                <Shield className="w-7 h-7" />
              </div>

              <div>
                <span className="text-[10px] font-extrabold tracking-wider uppercase text-[#F0B429] bg-[#F0B429]/20 px-2.5 py-1 rounded-full border border-[#F0B429]/30">
                  Portal Kedinasan Resmi
                </span>
                <h2 className="text-xl font-extrabold tracking-tight mt-2 text-white">
                  GARDA MURAKATA
                </h2>
                <p className="text-xs text-slate-300 font-medium">
                  Satuan Polisi Pamong Praja Kabupaten Hulu Sungai Tengah
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-2.5 text-xs text-slate-300 leading-relaxed">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#F0B429] shrink-0 mt-0.5" />
                  <span>Akses Register Trantibum & Penindakan Lapangan</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#F0B429] shrink-0 mt-0.5" />
                  <span>Monitoring Patroli Wilayah & Check-in GPS Presisi</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#F0B429] shrink-0 mt-0.5" />
                  <span>Verifikasi Laporan & Generator Surat Dinas QR Code</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-6 mt-6 border-t border-white/10 text-[11px] text-slate-400">
              <p>Mako Satpol PP HST • Barabai</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Sistem Terintegrasi v1.0 (Prod)</p>
            </div>
          </div>

          {/* Right Panel: Login Form */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-extrabold text-[#0F2A4A] tracking-tight">
                  Masuk ke Portal Petugas
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Pilih peran kedinasan atau masukkan NIP dan kata sandi Anda untuk mengakses dashboard
                </p>
              </div>

              {/* Role Presets (Admin & User) */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Pilih Simulasi Akun Masuk:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {/* Admin Preset */}
                  <button
                    type="button"
                    onClick={() => handleSelectPreset('admin')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedRolePreset === 'admin'
                        ? 'border-[#0F2A4A] bg-amber-50/60 ring-2 ring-[#0F2A4A]/10 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                        Admin
                      </span>
                      {selectedRolePreset === 'admin' && (
                        <span className="w-2 h-2 rounded-full bg-[#0F2A4A]"></span>
                      )}
                    </div>
                    <div className="font-bold text-xs text-[#0F2A4A] truncate">{adminPegawai.nama}</div>
                    <div className="text-[10px] text-slate-500 truncate">{adminPegawai.jabatan}</div>
                  </button>

                  {/* User (Petugas Lapangan) Preset */}
                  <button
                    type="button"
                    onClick={() => handleSelectPreset('user')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedRolePreset === 'user'
                        ? 'border-[#0F2A4A] bg-amber-50/60 ring-2 ring-[#0F2A4A]/10 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        User / Petugas
                      </span>
                      {selectedRolePreset === 'user' && (
                        <span className="w-2 h-2 rounded-full bg-[#0F2A4A]"></span>
                      )}
                    </div>
                    <div className="font-bold text-xs text-[#0F2A4A] truncate">{userPegawai.nama}</div>
                    <div className="text-[10px] text-slate-500 truncate">{userPegawai.jabatan}</div>
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Form Fields */}
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Nomor Induk Pegawai (NIP) / Nama Pengguna *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Masukkan NIP Pegawai"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden text-slate-800 font-mono text-xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Kata Sandi Dinas *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi"
                      className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden text-slate-800 text-xs"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-[#0F2A4A] focus:ring-[#0F2A4A]"
                    />
                    <span>Ingat sesi masuk</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Hak Akses: {selectedRolePreset.toUpperCase()}</span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-[#0F2A4A] hover:bg-[#14365D] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-[#0F2A4A]/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4 text-[#F0B429]" />
                  <span>{isLoading ? 'Memverifikasi Kredensial...' : 'Masuk ke Dashboard'}</span>
                </button>
              </form>
            </div>

            {/* Security Notice */}
            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Sistem terlindungi autentikasi internal Satpol PP Kab. Hulu Sungai Tengah.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer text */}
      <div className="p-4 text-center text-xs text-slate-400">
        © 2026 Pemerintah Kabupaten Hulu Sungai Tengah • Penegakan Perda & Trantibum
      </div>
    </div>
  );
}

