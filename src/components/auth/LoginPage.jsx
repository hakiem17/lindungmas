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
import { supabase } from '../../data/supabaseClient';
import { saveAuthSession, getProfilPenggunaList } from '../../data/storageService';

const EMAIL_DOMAIN = '@satpolpp.hstkab.go.id';

export default function LoginPage({ 
  onLoginSuccess, 
  onBackToLanding 
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // NIP (spasi diabaikan) atau email lengkap -> email login Supabase Auth
  const toEmail = (input) => {
    const v = input.trim();
    if (v.includes('@')) return v.toLowerCase();
    const clean = v.replace(/[^a-zA-Z0-9]/g, '');
    return `${clean}${EMAIL_DOMAIN}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Harap masukkan NIP/NIK/Email dan Kata Sandi!');
      return;
    }

    setIsLoading(true);
    try {
      let sessionUser = null;

      // 1. Coba login melalui Supabase Auth
      const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
        email: toEmail(username),
        password
      });

      if (!authErr && auth?.user) {
        const { data: profil } = await supabase
          .from('profil_pengguna')
          .select('*')
          .eq('id', auth.user.id)
          .maybeSingle();

        if (profil) {
          sessionUser = {
            id: profil.id,
            nama: profil.nama,
            nip: profil.nip,
            nik: profil.nik || profil.nip,
            noRegistrasi: profil.no_registrasi || '',
            jabatan: profil.jabatan,
            peran: profil.peran,
            wilayahTugas: profil.wilayah_tugas || 'Seluruh Kabupaten Hulu Sungai Tengah',
            desaTugas: profil.desa_tugas || '',
            noHp: profil.no_hp || '',
            email: profil.email || auth.user.email,
            foto: profil.foto_url || '',
            isSupabaseAuth: true,
            loginTime: new Date().toISOString()
          };
        }
      }

      // 2. Fallback verifikasi profil pengguna (mendukung NIP, NIK 16 digit, No. Registrasi, Email)
      if (!sessionUser) {
        const localList = getProfilPenggunaList();
        const inputClean = username.trim().toLowerCase();
        const inputNoSym = inputClean.replace(/[^a-z0-9]/g, '');

        const found = localList.find(u => {
          const uNip = (u.nip || '').toLowerCase();
          const uNik = (u.nik || '').toLowerCase();
          const uReg = (u.noRegistrasi || '').toLowerCase();
          const uEmail = (u.email || '').toLowerCase();
          return (
            uNip === inputClean ||
            uNik === inputClean ||
            uReg === inputClean ||
            uEmail === inputClean ||
            (uNip.replace(/[^a-z0-9]/g, '') === inputNoSym && inputNoSym.length > 5) ||
            (uReg.replace(/[^a-z0-9]/g, '') === inputNoSym && inputNoSym.length > 5)
          );
        });

        if (found && (found.status === 'Aktif' || !found.status)) {
          sessionUser = {
            id: found.id,
            nama: found.nama,
            nip: found.nip,
            nik: found.nik || found.nip,
            noRegistrasi: found.noRegistrasi || '',
            jabatan: found.jabatan,
            peran: found.peran || 'anggota_linmas',
            wilayahTugas: found.wilayahTugas || 'Barabai',
            desaTugas: found.desaTugas || '',
            noHp: found.noHp || '',
            email: found.email,
            foto: found.foto || '',
            isSupabaseAuth: false,
            loginTime: new Date().toISOString()
          };
        }
      }

      if (!sessionUser) {
        setErrorMsg('NIP, NIK, No. Registrasi atau kata sandi tidak ditemukan.');
        return;
      }

      saveAuthSession(sessionUser);
      onLoginSuccess(sessionUser);
    } catch (err) {
      setErrorMsg('Gagal terhubung ke server: ' + err.message);
    } finally {
      setIsLoading(false);
    }
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
          <span className="font-extrabold text-[#0F2A4A] text-sm hidden sm:inline">LINDUNGMAS HST</span>
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
                  LINDUNGMAS HST
                </h2>
                <p className="text-xs text-slate-300 font-medium">
                  Layanan Informasi & Data Perlindungan Masyarakat Kab. Hulu Sungai Tengah
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
                  Masuk ke Portal Petugas & Linmas
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Masukkan NIP / NIK / No. Registrasi dan kata sandi Anda untuk masuk ke sistem
                </p>
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
                    NIP / NIK / No. Registrasi KTA / Email *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="NIP Pegawai / NIK 16-digit / No. Reg Linmas"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden text-slate-800 font-mono text-xs"
                      required
                    />
                  </div>
                  <p className="text-[10.5px] text-slate-500 mt-1">
                    *Anggota Satlinmas dapat login langsung dengan <strong>NIK 16 digit</strong> atau <strong>No. Registrasi</strong> KTA.
                  </p>
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

