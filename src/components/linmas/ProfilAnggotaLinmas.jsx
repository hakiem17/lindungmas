import React, { useMemo } from 'react';
import { 
  ShieldCheck, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  CreditCard, 
  IdCard, 
  Printer, 
  Download, 
  CheckCircle2, 
  FileText, 
  Compass, 
  Car,
  QrCode,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';
import { generateQrMatrix } from '../../utils/qrCodeGenerator';

export default function ProfilAnggotaLinmas({ 
  currentUser, 
  satlinmasList = [], 
  onNavigateToPatroli,
  pegawaiList = []
}) {
  // Cari Kepala Satuan sebagai penandatangan resmi
  const kepalaSatuan = useMemo(() => {
    const found = (pegawaiList || []).find(p => {
      const jab = (p.jabatan || '').toLowerCase();
      return jab.includes('kepala satuan') || jab.includes('kasat');
    });
    if (found) {
      return {
        nama: found.nama || 'Drs. Ahmad Fathoni',
        nip: found.nip || '19720217 199203 1 006',
        jabatan: found.jabatan || 'Kepala Satuan'
      };
    }
    return {
      nama: 'Drs. Ahmad Fathoni',
      nip: '19720217 199203 1 006',
      jabatan: 'Kepala Satuan'
    };
  }, [pegawaiList]);
  // Find member from satlinmasList matching current user NIK, No. Registrasi, or fallback to first
  const member = useMemo(() => {
    if (currentUser?.nik || currentUser?.noRegistrasi) {
      const found = satlinmasList.find(m => 
        (currentUser.nik && m.nik === currentUser.nik) ||
        (currentUser.noRegistrasi && m.noRegistrasi === currentUser.noRegistrasi) ||
        (currentUser.nama && m.nama.toLowerCase() === currentUser.nama.toLowerCase())
      );
      if (found) return found;
    }
    return satlinmasList[0] || {
      id: 'slm-001',
      noRegistrasi: '63.07/SLM/2026/001',
      nama: currentUser?.nama || 'Muhammad Arsyad',
      nik: '6307061205840001',
      tempatLahir: 'Barabai',
      tanggalLahir: '1984-05-12',
      jenisKelamin: 'Laki-laki',
      alamat: 'Jl. Brigjend H. Hasan Basry RT 04 RW 02',
      kecamatan: 'Barabai',
      desaKelurahan: 'Barabai Timur',
      kabKota: 'Kabupaten Hulu Sungai Tengah',
      provinsi: 'Kalimantan Selatan',
      pendapatan: 'Rp 1.500.000 / Bulan',
      tahunPengangkatan: '2024',
      jumlahKeluarga: '3 Orang',
      noHp: '081250001122',
      email: 'm.arsyad.linmas@hstkab.go.id',
      status: 'aktif',
      pasFoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      dokumenSk: {
        nomorSk: '188.45/320/SATPOL-PP/2024',
        tanggalPenetapanSk: '15 Januari 2024',
        fileSk: 'sk_penetapan_linmas_barabai_timur.pdf'
      }
    };
  }, [currentUser, satlinmasList]);

  // QR Code Matrix for personal KTA
  const qrMatrix = useMemo(() => {
    const payload = `LINDUNGMAS-HST://KTA/VERIFY?REG=${member.noRegistrasi}&NIK=${member.nik}&DATE=2028-12-31`;
    return generateQrMatrix(payload);
  }, [member]);

  return (
    <div className="space-y-6">
      {/* 1. HEADER SECTION */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0F2A4A] to-[#16365C] text-[#F0B429] flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-[#0F2A4A] tracking-tight">
                PROFIL ANGGOTA SATLINMAS
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-wide">
                Personel Mandiri
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Portal data keanggotaan resmi, status penugasan, dan Kartu Tanda Anggota (KTA) Digital Linmas Kabupaten HST.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {onNavigateToPatroli && (
            <button
              type="button"
              onClick={onNavigateToPatroli}
              className="px-4 py-2 rounded-xl text-xs font-extrabold text-[#0F2A4A] bg-[#F0B429] hover:bg-[#e2a820] flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Car className="w-4 h-4 text-[#0F2A4A]" />
              <span>Input Laporan Patroli Saya</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Cetak KTA Digital</span>
          </button>
        </div>
      </div>

      {/* 2. PROFIL CARD & BIODATA 17 URUTAN KOLOM BAKU */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Photo, Core Identity, Badges */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="w-32 h-40 rounded-2xl overflow-hidden border-4 border-slate-100 shadow-md bg-slate-100">
              {member.pasFoto ? (
                <img 
                  src={member.pasFoto} 
                  alt={member.nama} 
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100">
                  <User className="w-12 h-12" />
                  <span className="text-[10px] mt-1">Pas Foto</span>
                </div>
              )}
            </div>
            <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white shadow-xs border-2 border-white">
              AKTIF
            </span>
          </div>

          <div>
            <h2 className="text-lg font-extrabold text-[#0F2A4A]">{member.nama}</h2>
            <p className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 mt-1 inline-block">
              No. Reg: {member.noRegistrasi}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Satuan Perlindungan Masyarakat (Satlinmas)<br />
              <strong className="text-slate-700">Desa/Kel. {member.desaKelurahan}, Kec. {member.kecamatan}</strong>
            </p>
          </div>

          <div className="w-full pt-4 border-t border-slate-100 space-y-2 text-left text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Status Tugas:</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">Aktif Bertugas</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Tahun Pengangkatan:</span>
              <span className="font-bold text-slate-800">{member.tahunPengangkatan || '2024'}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Wilayah Tugas:</span>
              <span className="font-bold text-slate-800">Kec. {member.kecamatan}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500">Kabupaten:</span>
              <span className="font-bold text-slate-800">Hulu Sungai Tengah</span>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="w-full p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-left text-[11px] text-blue-900 leading-relaxed">
            <p className="font-bold flex items-center gap-1.5 text-blue-800 mb-0.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Hak Akses Anggota Linmas:</span>
            </p>
            Anda memiliki hak akses untuk memantau profil pribadi, mencetak KTA digital, serta menginput laporan kegiatan/patroli mandiri dengan verifikasi GPS dan dokumentasi foto.
          </div>
        </div>

        {/* Right Column: 17 Urutan Kolom Baku + Berkas SK */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: 17 Kolom Baku Identitas */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <IdCard className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-extrabold text-[#0F2A4A] uppercase tracking-wide">
                  Data Pokok Anggota (17 Urutan Kolom Baku)
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-400">Permendagri No. 26/2020</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 font-medium block text-[10px] uppercase">1. Nomor Registrasi</span>
                <span className="font-bold font-mono text-sm text-[#0F2A4A]">{member.noRegistrasi}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 font-medium block text-[10px] uppercase">2. Nama Lengkap</span>
                <span className="font-bold text-sm text-[#0F2A4A]">{member.nama}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 font-medium block text-[10px] uppercase">3. NIK (KTP Elektronik)</span>
                <span className="font-bold font-mono text-slate-800">{member.nik}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 font-medium block text-[10px] uppercase">4 & 5. Tempat, Tanggal Lahir</span>
                <span className="font-bold text-slate-800">{member.tempatLahir}, {member.tanggalLahir}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 font-medium block text-[10px] uppercase">6. Jenis Kelamin</span>
                <span className="font-bold text-slate-800">{member.jenisKelamin || 'Laki-laki'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 font-medium block text-[10px] uppercase">7. Alamat Domisili</span>
                <span className="font-bold text-slate-800">{member.alamat}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 font-medium block text-[10px] uppercase">8 & 9. Prov & Kab/Kota</span>
                <span className="font-bold text-slate-800">{member.kabKota}, {member.provinsi}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 font-medium block text-[10px] uppercase">10 & 11. Kecamatan & Desa/Kel</span>
                <span className="font-bold text-slate-800">Kec. {member.kecamatan} • Desa {member.desaKelurahan}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 font-medium block text-[10px] uppercase">12. Pendapatan</span>
                <span className="font-bold text-slate-800">{member.pendapatan || 'Rp 1.000.000 / Bulan'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 font-medium block text-[10px] uppercase">13. Tahun Pengangkatan</span>
                <span className="font-bold text-slate-800">{member.tahunPengangkatan}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 font-medium block text-[10px] uppercase">14. Jumlah Anggota Keluarga</span>
                <span className="font-bold text-slate-800">{member.jumlahKeluarga || '3 Orang'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 font-medium block text-[10px] uppercase">15 & 16. Kontak & Email</span>
                <span className="font-bold text-slate-800">{member.noHp || '-'} • {member.email || '-'}</span>
              </div>
            </div>
          </div>

          {/* Card 2: SK Pengangkatan & Penetapan Dinas */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-extrabold text-[#0F2A4A] uppercase tracking-wide">
                  Legalisasi Surat Keputusan (SK) Penetapan
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                SAH & BERLAKU
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200">
                <span className="text-emerald-800 font-bold block text-[10px] uppercase">Nomor SK Penetapan</span>
                <span className="font-bold font-mono text-slate-900 mt-0.5 block">
                  {member.dokumenSk?.nomorSk || '188.45/320/SATPOL-PP/2024'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200">
                <span className="text-emerald-800 font-bold block text-[10px] uppercase">Tanggal Penetapan</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {member.dokumenSk?.tanggalPenetapanSk || '15 Januari 2024'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200">
                <span className="text-emerald-800 font-bold block text-[10px] uppercase">Pejabat Pengesah</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  Bupati Hulu Sungai Tengah
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TAMPILAN KARTU TANDA ANGGOTA (KTA) DIGITAL RESMI */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <IdCard className="w-5 h-5 text-[#0F2A4A]" />
              <h3 className="text-base font-extrabold text-[#0F2A4A]">
                Kartu Tanda Anggota (KTA) Digital Linmas HST
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Standar format cetak ID-1 (CR80) 85.6 mm × 53.98 mm berhologram & QR Code Verifikasi Kedinasan
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl text-xs font-extrabold text-[#0F2A4A] bg-[#F0B429] hover:bg-[#e2a820] flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#0F2A4A]" />
            <span>Cetak KTA Saya</span>
          </button>
        </div>

        {/* KTA Preview: Sisi Depan & Sisi Belakang */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-center pt-2">
          {/* DEPAN */}
          <div className="w-[340px] h-[214px] rounded-2xl bg-gradient-to-br from-[#0A1A2E] via-[#0F2A4A] to-[#14304F] text-white p-3.5 relative overflow-hidden shadow-lg border border-amber-400/40 select-none flex flex-col justify-between">
            {/* Header KTA */}
            <div className="flex items-center gap-2.5 border-b border-white/20 pb-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 p-0.5 border border-amber-400/40 flex items-center justify-center shrink-0 shadow-xs">
                <img src="/logo-barabai.png" alt="Logo Barabai HST" className="w-full h-full object-contain filter drop-shadow" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-[10px] font-extrabold tracking-wider text-amber-300 uppercase leading-none">
                  PEMERINTAH KABUPATEN HULU SUNGAI TENGAH
                </h4>
                <p className="text-[8.5px] font-bold text-white tracking-wide mt-0.5 uppercase">
                  SATUAN PERLINDUNGAN MASYARAKAT (SATLINMAS)
                </p>
              </div>
            </div>

            {/* Body KTA Depan */}
            <div className="flex items-center gap-3 my-auto">
              <div className="w-16 h-20 rounded-lg overflow-hidden border-2 border-[#F0B429] shrink-0 bg-slate-800">
                {member.pasFoto ? (
                  <img src={member.pasFoto} alt={member.nama} className="w-full h-full object-cover object-top" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <User className="w-6 h-6" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 text-left text-[9.5px] space-y-0.5 leading-snug">
                <div>
                  <span className="text-slate-300 block text-[7.5px] uppercase">Nama Lengkap</span>
                  <span className="font-extrabold text-white text-[11px] block truncate">{member.nama}</span>
                </div>
                <div>
                  <span className="text-slate-300 block text-[7.5px] uppercase">Nomor Registrasi</span>
                  <span className="font-bold font-mono text-amber-300 block">{member.noRegistrasi}</span>
                </div>
                <div>
                  <span className="text-slate-300 block text-[7.5px] uppercase">NIK</span>
                  <span className="font-mono text-slate-200 block">{member.nik}</span>
                </div>
                <div>
                  <span className="text-slate-300 block text-[7.5px] uppercase">Wilayah Penugasan</span>
                  <span className="font-bold text-white block truncate">Desa {member.desaKelurahan}, Kec. {member.kecamatan}</span>
                </div>
              </div>
            </div>

            {/* Footer KTA Depan */}
            <div className="flex items-center justify-between border-t border-white/20 pt-1.5 text-[8px] text-slate-300">
              <span className="font-bold text-amber-300">KTA RESMI KABUPATEN HST</span>
              <span>Masa Berlaku: <b>2028-12-31</b></span>
            </div>
          </div>

          {/* BELAKANG */}
          <div className="w-[340px] h-[214px] rounded-2xl bg-gradient-to-br from-[#14304F] to-[#0A1A2E] text-white p-3.5 relative overflow-hidden shadow-lg border border-amber-400/40 select-none flex flex-col justify-between">
            <div className="border-b border-white/20 pb-1.5 text-center">
              <h4 className="text-[9.5px] font-extrabold text-amber-300 uppercase tracking-wide">
                KETENTUAN PEMEGANG KARTU TANDA ANGGOTA
              </h4>
            </div>

            <div className="text-[8px] text-slate-300 space-y-1 text-left leading-tight my-auto">
              <p>1. Kartu ini adalah bukti sah keanggotaan Satlinmas Kabupaten Hulu Sungai Tengah.</p>
              <p>2. Wajib dibawa saat melaksanakan tugas pengamanan lingkungan dan patroli siskamling.</p>
              <p>3. Apabila menemukan kartu ini tercecer, harap menyerahkan ke Kantor Satpol PP & Damkar Kab. HST.</p>
            </div>

            {/* QR Code Validation */}
            <div className="flex items-center justify-between border-t border-white/20 pt-2">
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 bg-white rounded-lg p-1 flex items-center justify-center shrink-0">
                  <div className="grid grid-cols-21 gap-px w-full h-full">
                    {qrMatrix.map((row, rIdx) => 
                      row.map((cell, cIdx) => (
                        <div key={`${rIdx}-${cIdx}`} className={cell ? 'bg-black' : 'bg-white'} />
                      ))
                    )}
                  </div>
                </div>
                <div className="text-left text-[7.5px] text-slate-300 leading-tight">
                  <span className="text-amber-300 font-bold block">VERIFIKASI DIGITAL</span>
                  <span>Scan QR untuk validasi keabsahan data anggota di sistem LINDUNGMAS.</span>
                </div>
              </div>

              <div className="text-right text-[7.5px] leading-tight">
                <span className="block text-slate-400">Barabai, HST</span>
                <span className="block font-bold text-white mt-0.5">Kepala Satuan Polisi Pamong Praja</span>
                <span className="block font-mono text-[7px] text-amber-300 font-bold mt-1.5 underline">{kepalaSatuan.nama}</span>
                <span className="block font-mono text-[6px] text-slate-400">NIP. {kepalaSatuan.nip}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

