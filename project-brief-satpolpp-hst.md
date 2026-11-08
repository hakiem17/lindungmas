# Project Brief: LINDUNGMAS HST — Layanan Informasi dan Data Perlindungan Masyarakat Kab. Hulu Sungai Tengah

Dokumen ini adalah spesifikasi dan panduan acuan utama sistem **LINDUNGMAS HST** (*Layanan Informasi dan Data Perlindungan Masyarakat Kabupaten Hulu Sungai Tengah*) yang mengintegrasikan penegakan Peraturan Daerah, Trantibum, dan Perlindungan Masyarakat (Linmas) untuk Satuan Polisi Pamong Praja (Satpol PP) Kabupaten Hulu Sungai Tengah, Kalimantan Selatan.

---

## 1. Ringkasan Proyek

Membangun sistem digital terpadu bagi Satpol PP Kabupaten Hulu Sungai Tengah (HST) guna menggantikan sistem rekapitulasi manual dinas (pembukuan Excel bulanan) ke dalam satu platform digital responsif, spasial, dan akuntabel yang mencakup:

1. **Rekap Pengaduan & Tindak Lanjut Trantibum** — Buku register rekapitulasi penanganan laporan masyarakat dan inisiatif penertiban SKPD (kategori tindakan: Penertiban, Pengamanan, Pengawasan, Peneguran) berdasar Perda No. 6 Tahun 2024, Perda No. 1 Tahun 2024, Perda No. 3 Tahun 2016, dan Perda No. 4 Tahun 2021.
2. **Pendataan Pelanggar & OCR KTP/SIM** — Identifikasi pelanggar via scan/upload KTP, auto-fill OCR, deteksi riwayat otomatis berbasis NIK (*alert residivis* tanpa duplikasi data master).
3. **Manajemen Tindak Lanjut & Sanksi Berjenjang** — Tahapan penegakan berjenjang: **Pernyataan → SP1 → SP2 → SP3 → Eksekusi**, dengan **gatekeeping bukti wajib** dan generator surat PDF dinas otomatis ber-QR code.
4. **Monitoring Patroli Lapangan** — Penjadwalan rute, check-in GPS regu, dan pencatatan cepat temuan pelanggaran lapangan.
5. **Fitur Spasial GIS & Titik Rawan** — Peta sebaran pelanggaran dan titik rawan di 11 kecamatan HST berbasis PostGIS `geography(point, 4326)`.
6. **Kanal Pengaduan Publik Mandiri (PWA)** — Layanan pengaduan masyarakat tanpa login akun dengan tracking nomor tiket unik (`PGD-HST-YYYYMM-XXXX`).

---

## 2. Prinsip Desain & Identitas Visual (Non-negotiable)

- **Palet Warna Institusional Satpol PP**:
  - Warna Utama: Navy gelap berwibawa (`#0F2A4A` – `#14304F`).
  - Warna Aksen: Kuning keemasan seragam Satpol PP (`#F0B429` / `#FFC94D`).
  - Latar Belakang: Abu-abu terang netral (`#F5F6F8`), Card putih bersih (`#FFFFFF`) dengan sudut melengkung halus (radius 12–16px) dan bayangan tipis.
  - Warna Semantik Status: Hijau (`#059669`) untuk "Selesai/Terlayani", Amber/Kuning (`#D97706`) untuk "Proses/SP1/SP2", Merah (`#DC2626`) untuk "SP3/Eksekusi".
- **Tipografi**: Sans-serif modern (*Plus Jakarta Sans* / *Inter*), skala hierarki jelas, line-height lega.
- **Tata Letak**:
  - Sidebar gelap navy di sebelah kiri dengan ikon dan teks rata kiri (*text-left*).
  - Konten utama membentang penuh (*full-width*) tanpa ruang kosong (*blank space*) abnormal di sisi kiri.
  - Tabel dan kartu statistik adaptif di berbagai resolusi layar (desktop, tablet, smartphone).
- **Aksesibilitas Lapangan**: Target sentuh tombol minimal 44–48px, kontras tinggi terbaca di bawah sinar matahari luar ruangan, mode offline-ready.

---

## 3. Tech Stack

| Lapisan | Teknologi Terpilih |
| :--- | :--- |
| **Frontend UI** | React 19 + Vite + Tailwind CSS v4 + Lucide Icons |
| **Spasial / GIS** | Leaflet.js + OpenStreetMap (terintegrasi PostGIS) |
| **PDF Generator** | jsPDF (Template Resmi Berita Acara / Surat Keputusan Satpol PP HST) |
| **Database & Storage** | Supabase (PostgreSQL terkelola + PostGIS extension) |
| **Autentikasi & RLS** | Supabase Auth (Role-based: `admin` dan `user`) |
| **Storage Buckets** | `bukti-pelanggaran` (foto bukti lapangan), `arsip-surat` (PDF resmi) |
| **Penyimpanan Lokal** | LocalStorage + IndexedDB untuk kapabilitas offline lapangan |

---

## 4. Peran Pengguna & Hak Akses (Disederhanakan: Admin & User)

Sesuai simplifikasi sistem, hak akses operasional dibagi menjadi dua peran utama:

| Peran (*Role*) | Deskripsi Pengguna | Hak Akses Utama |
| :--- | :--- | :--- |
| **`admin`** | Administrator Sistem, Kasatpol PP, Kabid Trantibum, Diskominfo SP | - Akses penuh seluruh modul dan konfigurasi sistem.<br>- Kelola master data referensi Perda dan wilayah HST.<br>- Verifikasi dan tindak lanjut laporan pengaduan masyarakat.<br>- Cetak laporan eksekutif dan ekspor seluruh rekapitulasi data.<br>- Persetujuan tahapan akhir sanksi dan perintah eksekusi penertiban. |
| **`user`** | Petugas Lapangan, Operator Regu Patroli, Staf Penegakan | - Input pendataan pelanggar dan scan OCR KTP/SIM.<br>- Catat hasil patroli regu dan check-in GPS lapangan.<br>- Unggah dokumentasi foto bukti pelanggaran.<br>- Update progres tindak lanjut sanksi lapangan (SP1-SP3).<br>- Input entri catatan ke Buku Register Trantibum. |
| **Masyarakat** *(Publik/Anonim)* | Warga Hulu Sungai Tengah | - Tanpa perlu login akun.<br>- Kirim pengaduan disertai foto bukti dan titik koordinat GPS.<br>- Lacak status penanganan laporan via Nomor Tiket (`PGD-HST-...`). |

---

## 5. Modul & Fitur yang Diimplementasikan

### 5.0 Alur Utama Aplikasi: Landing Page ➔ Login ➔ Dashboard
- **Landing Page Publik**:
  - Halaman depan berstandar kedinasan modern untuk masyarakat dan aparatur.
  - Ringkasan fitur sistem, live counters transparansi penegakan, katalog Perda daerah, dan informasi kontak Mako Satpol PP Barabai.
  - Akses langsung tanpa login ke **Kanal Pengaduan Warga** (PWA Mandiri).
  - Tombol aksi menuju **Portal Masuk Petugas**.
- **Portal Autentikasi Kedinasan (Login)**:
  - Form login kredensial dengan pemilih cepat peran (*Admin / User*) yang terhubung ke data Master Pegawai.
  - Proteksi sesi aman, remember-me, dan show/hide password toggle.
- **Transisi Sesi ke Dashboard**:
  - Setelah berhasil login, pengguna diarahkan langsung ke Dashboard Eksekutif.
  - Tombol kembali ke Landing Page dan tombol Logout tersedia di Navbar dan Sidebar.

### 5.1 Dashboard Eksekutif & Pemantauan Trantibum
- Tile metrik KPI: Total Kasus, Kasus SP3 & Eksekusi Aktif, Pelanggar Residivis, dan Kasus Tertib/Selesai.
- Distribusi visual tahapan penegakan berjenjang (Pernyataan s/d Eksekusi).
- Grafik Top Perda yang paling sering dilanggar.
- Tombol aksi cepat: Cetak Rekap Eksekutif, Ekspor Data, dan Akses langsung ke Register.

### 5.2 Rekap Pengaduan & Tindak Lanjut Trantibum (Register Dinas)
- Buku register digital murni pengganti rekap manual buku dinas:
  - Kolom data: No, Nama Pelapor (`Masyarakat` / `Inisiatif SKPD`), Tanggal, Jenis Pengaduan, Tindak Lanjut (`Penertiban`, `Pengamanan`, `Pengawasan`, `Peneguran`), **Status Pengaduan Dinamis** (`Terlayani / Selesai`, `Dalam Penanganan`, `Menunggu Tindak Lanjut`, `Diteruskan ke Tim Penegakan`), **Personil Penanggung Jawab** (terkoneksi Master Pegawai), Wilayah Administratif (**Kecamatan** & **Desa/Kelurahan** di HST), Lokasi Spesifik/Jalan, Titik Koordinat GPS, dan Dasar Perda yang Digunakan.
  - **Sortir & Filter Per Bulan**: Dukungan filter data per bulan (Januari s/d Desember), filter tahun, dan opsi sortir fleksibel (Tanggal Terbaru, Tanggal Terlama, Bulan Januari→Desember, Bulan Desember→Januari, No Register, Nama Pelapor).
  - **Sistem Paging (Pagination) Dinamis**: Pembagian halaman adaptif dengan pilihan ukuran halaman (5, 10, 15, 25, 50 baris), navigasi halaman lengkap (Pertama, Sebelumnya, Nomor Halaman, Selanjutnya, Terakhir), dan penomoran baris berlanjut otomatis antar-halaman.
  - Pre-loaded data kegiatan dinas riil lintas bulan Kabupaten Hulu Sungai Tengah.
  - **Kemampuan Full CRUD**: Tambah catatan kegiatan baru, Edit seluruh kolom data, Hapus catatan dengan konfirmasi aman, dan *Quick Inline Status Change* langsung pada tabel.
  - Filter interaktif per sumber pelapor, jenis tindakan, status penanganan, kecamatan/desa, dan Perda dengan tag/pill filter aktif dan tombol reset cepat.
  - Fitur unduh laporan (.CSV lengkap dengan GPS dan personil) serta cetak rekap format dinas siap tanda tangan.
  - Integrasi terhubung langsung dengan **Master Pelapor** (autofill data pelapor), **Master Pegawai** (pilihan personil/regu patroli), dan **Master Wilayah**.

### 5.3 Pendataan Pelanggar & OCR KTP/SIM
- Input cepat data pelanggar lapangan dengan touch target besar (48px).
- Pemindaian KTP otomatis (client-side OCR) untuk auto-fill Nama, NIK, Tempat/Tgl Lahir, Jenis Kelamin, dan Alamat.
- **Pendeteksi Residivis Otomatis**: Seketika NIK diisi/di-scan, sistem memeriksa basis data:
  - Jika NIK sudah terdaftar $\rightarrow$ Muncul popup riwayat pelanggaran sebelumnya (jumlah kasus, lokasi, pasal yang dilanggar). Data kasus baru ditautkan ke profil master yang sama tanpa duplikasi baris `pelanggar`.
- Perekaman GPS koordinat otomatis dari perangkat dan pilihan lokasi landmark di HST.
- Multi-seleksi pasal Perda yang dilanggar.

### 5.4 Rekap Kasus & Sanksi Berjenjang (Tampilan 2-Level)
- **Level 1 — Rekap Pelanggar**: Satu baris per pelanggar dengan ringkasan status terkini, lokasi, filter kecamatan, dan pencarian cepat.
- **Level 2 — Detail Riwayat Kasus**:
  - Linimasa kronologis tahapan sanksi: **Pernyataan → SP1 → SP2 → SP3 → Eksekusi**.
  - **Gatekeeping Bukti Wajib**: Sistem mengunci eskalasi status ke tahap berikutnya jika petugas belum mengunggah foto/dokumen bukti verifikasi lapangan.
  - **Generator PDF Surat Resmi**: Otomatis membuat dokumen PDF resmi (*Surat Pernyataan, SP1, SP2, SP3, Surat Perintah Eksekusi*) ber-Kop Pemkab HST, stempel digital, dan QR code validasi.

### 5.5 Peta Spasial GIS, Titik Penindakan & Analisis Area Terbanyak
- Peta interaktif Leaflet + OpenStreetMap berpusat di Barabai, Kabupaten Hulu Sungai Tengah.
- **Integrasi Ganda Titik Penindakan**: Memetakan seluruh koordinat kegiatan penindakan Trantibum (*Penertiban, Pengawasan, Pengamanan, Peneguran*) dan berkas perkara pelanggaran Perda.
- **Analisis Peringkat Area Terbanyak (Top Hotspot)**:
  - Mengkalkulasi konsentrasi dan peringkat kejadian di 11 kecamatan se-Kabupaten HST secara otomatis.
  - Kartu wawasan eksekutif mengidentifikasi langsung area dengan frekuensi pelanggaran tertinggi (contoh: *Kecamatan Barabai - 19 Titik / 60% konsentrasi* beserta desa/kelurahan paling rentan).
  - Satu klik pada daftar peringkat (*ranking*) langsung memfokuskan (*flyTo*) kamera peta ke kecamatan terkait.
- Marker berkode warna jenis tindakan: Merah (Penertiban 🚨), Biru (Pengawasan 👁️), Kuning (Pengamanan 🛡️), Oranye (Peneguran ⚠️), dan Ungu/Merah Tua (Berkas Perkara ⚖️).
- Filter komprehensif berdasarkan sumber data (Penindakan / Pelanggaran), kecamatan, dan jenis tindakan.

### 5.6 Monitoring Patroli Wilayah & Penertiban
- **Manajemen Jadwal Operasional Penuh (Full CRUD)**:
  - Pembuatan jadwal rute patroli baru terhubung dengan **Master Pegawai** (pilihan Supervisor) dan **Master Wilayah** (pilihan Kecamatan).
  - Kolom data jadwal: Kode Patroli, Nama Kegiatan, Tanggal & Rentang Jam (WITA), Regu (Regu I Murakata, Regu II, Tim Gabungan Penegakan, Tim Khusus), Jumlah Personel, Rute Singgah, dan Instruksi Khusus.
  - Pengeditan dan penghapusan jadwal dengan konfirmasi aman.
- **Sistem Check-in & Check-out GPS Lapangan**:
  - Check-in GPS langsung dari perangkat lapangan dengan perekaman koordinat presisi dan waktu mulai riil.
  - Timestamp check-in dan check-out tercatat otomatis pada kartu jadwal.
- **Integrasi Cepat "Catat Temuan"**:
  - Tombol aksi sekali klik dari regu yang sedang aktif berpatroli untuk langsung mengisi berkas pelanggaran di modul Form Input Pelanggar tanpa perlu mengetik ulang data regu/patroli.
- **Kartu Ringkasan Metrik (KPI Patroli)**: Total Jadwal, Sedang Berlangsung (Active/Pulse), Terjadwal (Mendatang), dan Tuntas/Selesai.
- **Pencarian & Filter Interaktif**: Filter berdasarkan status operasional dan kecamatan.

### 5.7 Verifikasi Pengaduan & Portal Publik
- **Portal Publik (PWA)**: Formulir pengaduan warga 1-halaman tanpa login akun dengan kamera langsung dan penanda titik peta.
- Pelacakan mandiri status tiket laporan (`PGD-HST-YYYYMM-XXXX`).
- **Konsol Verifikasi Internal**: Menu bagi petugas/admin untuk meninjau laporan masyarakat, memvalidasi bukti, dan mengonversi laporan sah menjadi berkas perkara pelanggaran.

### 5.8 Referensi Perda HST (Master Regulasi Daerah)
- Katalog & master data regulasi daerah lengkap dengan nomor, pasal, uraian larangan, dan ketentuan sanksi:
  - *Perda No. 6 Tahun 2024* tentang Penyelenggaraan Trantibum.
  - *Perda No. 1 Tahun 2024* tentang Pajak Daerah & Retribusi Daerah (Media Reklame/Spanduk).
  - *Perda No. 3 Tahun 2016* tentang Penyelenggaraan Kegiatan pada Bulan Ramadhan.
  - *Perda No. 04 Tahun 2021* tentang Penyelenggaraan Ketertiban Umum & Ketenteraman Masyarakat.
  - *Perda No. 08 Tahun 2018* tentang Pengendalian Minuman Beralkohol.
  - *Perda No. 02 Tahun 2020* tentang Kawasan Tanpa Rokok (KTR).
- **Fitur Pengelolaan**: Tambah Perda baru secara dinamis, Edit pasal/uraian/sanksi, Hapus Perda, Salin kutipan pasal ke clipboard petugas, serta Ekspor katalog ke CSV & Cetak dinas.
- **Integrasi Otomatis**: Setiap Perda baru yang ditambahkan langsung tersinkronisasi ke form input Berita Acara pelanggar dan register pengaduan.

### 5.9 Data Master Pegawai & Personel Satpol PP
- Manajemen data induk seluruh personel Satpol PP Kab. Hulu Sungai Tengah:
  - Atribut: Nama Lengkap, NIP, Jabatan (Kasatpol PP, Kasi Penegakan Perda, Kasi Ops, Danregu, Petugas Lapangan), Pangkat/Golongan (Pembina Utama Muda, Penata, Pengatur, dst.), Regu Patroli (Regu Alabio, Regu Murakata, Regu Barabai, Tim Penegakan, Staf Mako), Peran Sistem (`admin` atau `user`), Nomor HP/WhatsApp, dan Status Keaktifan.
  - Fitur: Tambah pegawai, edit, hapus, pencarian nama/NIP, filter regu/jabatan/role, dan ekspor daftar personel (.CSV).
  - Integrasi: Penugasan regu patroli dan penanggung jawab Berita Acara langsung terhubung dengan data master ini.

### 5.10 Data Master Wilayah (Kecamatan sampai Desa)
- Manajemen hierarki wilayah administratif Kabupaten Hulu Sungai Tengah:
  - Meliputi 11 Kecamatan: **Barabai, Batang Alai Selatan (BAS), Batang Alai Timur (BAT), Batang Alai Utara (BAU), Batu Benawa, Hantakan, Haruyan, Labuan Amas Selatan (LAS), Labuan Amas Utara (LAU), Limpasu, dan Pandawan**.
  - Rincian seluruh Desa & Kelurahan per kecamatan lengkap dengan status desa (Desa/Kelurahan), kode pos, dan titik koordinat pusat wilayah.
  - Tab ganda: **Tabel Kecamatan** (ringkasan jumlah desa, kode pos, koordinat) dan **Daftar Desa & Kelurahan** (detail filter per kecamatan).
  - Fitur: Tambah/Edit kecamatan, Tambah/Edit/Hapus desa dalam kecamatan, ekspor rekap wilayah ke format CSV.
  - Integrasi: Dipakai sebagai referensi terpusat untuk dropdown wilayah di Register Pengaduan, Rekap Kasus Pelanggar, dan Peta Spasial GIS.

### 5.11 Data Master Pelapor (Masyarakat & Instansi SKPD)
- Basis data induk pelapor pengaduan masyarakat dan pemohon inisiatif penertiban SKPD:
  - Tipe Pelapor: **Masyarakat / Warga Publik** dan **Instansi / SKPD Pemerintah Daerah**.
  - Atribut: Nama Pelapor / Nama Lembaga, Kategori (Warga, Tokoh Masyarakat, Pedagang, Pemerintah Daerah, Kecamatan, Desa), NIK (untuk warga) atau PIC Penghubung (untuk SKPD), Kontak HP/WhatsApp, Email, Wilayah Administratif (Kecamatan & Desa di HST), Alamat Lengkap, Status Verifikasi (*Terverifikasi*, *Mitra Dinas Resmi*, *Menunggu Verifikasi*), Riwayat Total Laporan, dan Catatan Tambahan.
  - Fitur: Tambah pelapor, edit, hapus, pencarian komprehensif, filter tipe & kecamatan, ekspor rekap (.CSV), dan cetak daftar kontak pelapor dinas.
  - Integrasi: Terhubung dengan buku register pengaduan dan konsol verifikasi pengaduan publik.

---

## 6. Struktur Skema Database Supabase

File acuan: `skema_satpolpp_supabase.sql`
- **Ekstensi**: `uuid-ossp`, `postgis`
- **Enum `user_role`**: `'admin'`, `'user'`
- **Tabel Utama**:
  - `profiles` (id references auth.users, peran: admin/user, nama_lengkap, nip, no_hp)
  - `wilayah` (kecamatan, desa_kelurahan, koordinat geography)
  - `perda` (nomor, tahun, tentang, pasal_relevan, sanksi)
  - `pelanggar` (nik UNIQUE, nama_lengkap, alamat, kecamatan, foto_ktp)
  - `pelanggaran` (nomor_register UNIQUE, pelanggar_id, sumber, koordinat geography, status_tindaklanjut)
  - `detail_perda` (pelanggaran_id, perda_id)
  - `tindak_lanjut` (pelanggaran_id, tahap, nomor_surat, file_surat_pdf_url)
  - `bukti` (pelanggaran_id, tindak_lanjut_id, file_url, koordinat geography)
  - `jadwal_patroli` & `hasil_patroli`
  - `pengaduan` (nomor_tiket UNIQUE, nama_pelapor, status, koordinat geography)
- **RLS Policies**:
  - Public: Insert pengaduan masyarakat & baca status tiket sendiri.
  - Authenticated (`user` & `admin`): Akses baca & tulis operasional lapangan.
  - `admin`: Hak khusus ubah konfigurasi perda, manajemen pengguna, dan verifikasi akhir.

---

## 7. Rencana Penambahan / Modifikasi Berikutnya

1. **Integrasi Supabase Live Client**: Menghubungkan variabel `.env` (`SUPABASE_URL` dan `SUPABASE_ANON_KEY`) ke backend/frontend.
2. **Offline Background Sync Engine**: Peningkatan antrean IndexedDB lokal saat perangkat petugas kembali mendapatkan sinyal internet di daerah pelosok Meratus.
3. **Ekspor PDF Rekapitulasi Trantibum**: Format cetak laporan bulanan otomatis untuk Kepala Satpol PP dan Bupati HST.
