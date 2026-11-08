<div align="center">

  <img src="public/logo-barabai.png" alt="Logo Kabupaten Hulu Sungai Tengah" width="110" height="auto" />

  # 🛡️ LINDUNGMAS HST
  ### Layanan Informasi & Data Perlindungan Masyarakat Terpadu
  **Satuan Polisi Pamong Praja & Pemadam Kebakaran — Bidang Perlindungan Masyarakat**  
  **Pemerintah Kabupaten Hulu Sungai Tengah, Kalimantan Selatan**

  <p align="center">
    <!-- Status & Repository Badges -->
    <a href="https://github.com/hakiem17/lindungmas">
      <img src="https://img.shields.io/badge/Version-1.0.0_PROD-0F2A4A?style=for-the-badge&logo=github&logoColor=F0B429" alt="Version 1.0.0" />
    </a>
    <a href="https://github.com/hakiem17/lindungmas/actions/workflows/supabase-keepalive.yml">
      <img src="https://img.shields.io/github/actions/workflow/status/hakiem17/lindungmas/supabase-keepalive.yml?label=Supabase%20Keep--Alive&style=for-the-badge&logo=supabase&logoColor=3ECF8E&color=0F2A4A" alt="Supabase Keep-Alive" />
    </a>
    <a href="https://github.com/hakiem17/lindungmas">
      <img src="https://img.shields.io/badge/Build-Passing-10B981?style=for-the-badge&logo=vite&logoColor=white" alt="Build Passing" />
    </a>
    <a href="https://github.com/hakiem17/lindungmas/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/License-MIT-059669?style=for-the-badge" alt="License MIT" />
    </a>
  </p>

  <p align="center">
    <!-- Framework & Tech Stack Badges -->
    <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" />
    <img src="https://img.shields.io/badge/Tailwind_CSS_v4-0F172A?style=for-the-badge&logo=tailwindcss&logoColor=38BDF8" alt="Tailwind CSS v4" />
    <img src="https://img.shields.io/badge/Supabase-Live_PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase Live DB" />
    <img src="https://img.shields.io/badge/Leaflet-GIS_Mapping-199900?style=for-the-badge&logo=leaflet&logoColor=white" alt="Leaflet GIS" />
    <img src="https://img.shields.io/badge/Vite-8.3.5-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  </p>

  <p align="center">
    <!-- Government Attribution Badges -->
    <img src="https://img.shields.io/badge/Wilayah-11_Kecamatan_•_169_Desa-0F2A4A?style=for-the-badge&logo=googlemaps&logoColor=F0B429" alt="Wilayah HST" />
    <img src="https://img.shields.io/badge/Perangkat-Mobile_•_iPad_•_Monitor-F0B429?style=for-the-badge&logo=responsive&logoColor=0F2A4A" alt="Responsive All Devices" />
    <img src="https://img.shields.io/badge/Standar_Cetak-Dokumen_Dinas_A4-E11D48?style=for-the-badge&logo=adobeacrobatreader&logoColor=white" alt="Standar A4" />
  </p>

  <p align="center">
    Platform operasional resmi berbasis web responsif untuk digitalisasi data <b>Satuan Perlindungan Masyarakat (Satlinmas)</b>, inventarisasi <b>Poskamling berbasis GIS</b>, pemantauan <b>Patroli Lapangan GPS Live</b>, pencetakan <b>KTA CR80 QR Code</b>, dan pelaporan situasi berkala ukuran A4 se-Kabupaten Hulu Sungai Tengah.
  </p>

</div>

---

## 📑 Daftar Isi
- [🌟 Latar Belakang & Tujuan](#-latar-belakang--tujuan)
- [🏛️ 4 Pilar Utama LINDUNGMAS HST](#️-4-pilar-utama-lindungmas-hst)
- [🗺️ Arsitektur Spasial GIS (11 Kecamatan & 169 Desa)](#️-arsitektur-spasial-gis-11-kecamatan--169-desa)
- [🔄 Otomatisasi Supabase Free Tier Keep-Alive](#-otomatisasi-supabase-free-tier-keep-alive)
- [🪪 Generator KTA Standar CR80 & Laporan A4](#-generator-kta-standar-cr80--laporan-a4)
- [👥 Hak Akses Pengguna (Role-Based Access Control)](#-hak-akses-pengguna-role-based-access-control)
- [🛠️ Tech Stack & Dependensi](#️-tech-stack--dependensi)
- [💻 Panduan Instalasi & Menjalankan Proyek](#-panduan-instalasi--menjalankan-proyek)
- [📄 Lisensi & Hak Cipta](#-lisensi--hak-cipta)

---

## 🌟 Latar Belakang & Tujuan

Kabupaten Hulu Sungai Tengah memiliki luas wilayah **1.472 km²** dengan **11 Kecamatan** dan **169 Desa/Kelurahan**. Selama ini pendataan Satlinmas, pos ronda siskamling, dan aktivitas patroli keamanan lingkungan masih dilakukan secara parsial. 

**LINDUNGMAS HST** hadir sebagai solusi terpadu untuk:
1. **Single Source of Truth**: Menghubungkan Satpol PP Kabupaten, Operator 11 Kecamatan, dan Anggota Satlinmas ke satu database terpusat (*Supabase Live PostgreSQL*).
2. **Visualisasi Spasial Wilayah**: Memetakan titik rawan, keberadaan pos ronda aktif, dan sebaran personil linmas dengan poligon batas resmi wilayah.
3. **Standarisasi Administrasi**: Memenuhi 17 kolom baku kementerian dalam negeri, arsip SK Pengangkatan, serta pencetakan KTA resmi ber-QR verifikasi.
4. **Efisiensi Pelaporan Pimpinan**: Menyajikan laporan situasi bulanan berformat resmi siap cetak dan ekspor ukuran **A4** dengan sekali klik.

---

## 🏛️ 4 Pilar Utama LINDUNGMAS HST

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             LINDUNGMAS HST                                  │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│ 1. DATA SATLINMAS    │ 2. DATA POSKAMLING   │ 3. KEGIATAN & PATROLI         │
│ • 17 Kolom Baku      │ • Titik GIS Presisi  │ • Kunci GPS Real-Time         │
│ • Upload Berkas SK   │ • 8 Sarana Standar   │ • Foto Dokumentasi Lapangan   │
│ • Pas Foto Personil  │ • Kontak Ketua Pos   │ • Status Situasi Wilayah      │
├──────────────────────┴──────────────────────┴───────────────────────────────┤
│ 4. REKAPITULASI & STATISTIK (DOKUMEN RESMI A4 SATPOL PP KABUPATEN HST)      │
│ • Kop Surat Dinas Resmi • Matriks 11 Kecamatan • Ekspor Excel & PDF A4      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1. Data Satlinmas (17 Kolom Baku)
* Formulir input baku: No. Registrasi, NIK 16 digit, Nama, Tempat/Tgl Lahir, Jenis Kelamin, Alamat, Kecamatan, Desa/Kelurahan, Agama, Pendidikan, Pekerjaan, Golongan Darah, Status Perkawinan, No. HP, Jabatan, dan Keterangan.
* Pratinjau pas foto personil dan berkas SK Pengangkatan (Bupati/Camat).
* Filter dinamis per kecamatan dan desa tugas.

### 2. Data Poskamling (GIS Berbasis Titik & 8 Sarana Wajib)
* Perekaman titik koordinat GPS lokasi poskamling (*latitude & longitude*).
* Inventarisasi kondisi fisik bangunan (Permanen, Semi Permanen, Kayu) dan status operasional.
* Ceklis 8 Sarana Minimal: *Kentongan, Buku Mutasi, Senter LED, Kotak P3K, Rompi/Jas Hujan, Alat Pemadam, Radio HT, dan Lampu Panel Surya*.

### 3. Kegiatan & Patroli Lapangan
* Perekaman laporan patroli siskamling dengan penandaan waktu (*timestamp*) dan koordinat otomatis.
* Dokumentasi foto bukti situasi lapangan.
* Klasifikasi status keamanan (*Aman, Waspada, Butuh Penanganan, Kondusif*).

### 4. Laporan Rekapitulasi Situasi Satlinmas (Standar A4)
* Mengacu pada format baku laporan kedinasan Satpol PP Kabupaten Hulu Sungai Tengah.
* Dilengkapi Kop Surat Resmi (Satu Garis Batas Hitam Tegas) dan nomor surat otomatis per periode bulan.
* Matriks tabel bertingkat 11 Kecamatan: *Personel Linmas (L, P, Total), Poskamling (Baik, Rusak, Total), Kegiatan Patroli, dan Keterangan Situasi*.
* Fitur ekspor langsung ke **Excel (CSV UTF-8)** dan **Cetak / Unduh PDF format kertas A4 Portrait**.

---

## 🗺️ Arsitektur Spasial GIS (11 Kecamatan & 169 Desa)

Sistem mengintegrasikan peta interaktif **Leaflet.js** dengan aset spasial GeoJSON presisi:

* **Layer Batas 11 Kecamatan**: `map.json` dengan gradasi warna aktivitas wilayah (makin pekat sarana/personil, makin tinggi indeks keamanan).
* **Layer Batas 169 Desa/Kelurahan**: `desa_hst.geojson` dengan kemampuan interaktif:
  * Klik kecamatan ➔ Peta otomatis *zoom & fitBounds* ke wilayah kecamatan dan memunculkan batas seluruh desa di dalamnya.
  * Klik desa ➔ Peta mengunci (*lock focus*) pada poligon desa terpilih dan menampilkan statistik ringkas titik poskamling, linmas, dan patroli.
* **Tombol Cepat "Fokus Kab. HST"**: Mengembalikan sudut pandang kamera peta ke batas menyeluruh Kabupaten Hulu Sungai Tengah secara instan.

---

## 🔄 Otomatisasi Supabase Free Tier Keep-Alive

<div align="center">
  <img src="https://img.shields.io/badge/Workflow-Automated_Ping_Every_48h-3ECF8E?style=for-the-badge&logo=githubactions&logoColor=white" alt="Keep-Alive Ping" />
</div>

Supabase paket gratis akan **menjeda proyek (*paused*)** jika tidak menerima request selama 7 hari berturut-turut. Repository ini telah dilengkapi otomatisasi bawaan:

1. **Script Eksekusi (`scripts/keep-alive.js`)**:
   Melakukan query ringan ke database PostgreSQL (`/rest/v1/satlinmas?select=id&limit=1`) dan memeriksa kesehatan endpoint autentikasi (`/auth/v1/health`).
2. **GitHub Actions Workflow (`.github/workflows/supabase-keepalive.yml`)**:
   Berjalan secara otomatis di cloud setiap **2 hari sekali (cron: `0 4 */2 * *`)**.
   * 100% Gratis di infrastruktur cloud GitHub.
   * Tidak memerlukan komputer atau laptop dalam kondisi menyala.
   * Dilengkapi trigger manual (*workflow_dispatch*) untuk pengujian mandiri kapan saja.

---

## 🪪 Generator KTA Standar CR80 & Laporan A4

* **Cetak Kartu Tanda Anggota (KTA)**:
  * Mengikuti standar fisik kartu ID Card ISO/IEC 7810 ID-1 (**CR80: 85.6 mm × 54 mm**).
  * Format cetak bolak-balik: Sisi Depan (Identitas, Pas Foto, No. Reg) dan Sisi Belakang (Ketentuan Dinas, QR Verifikasi, Tanda Tangan Kasatpol PP).
  * Dilengkapi garis potong (*crop marks*) untuk mempermudah pemotongan pasca cetak.
* **Laporan Siap Cetak A4**:
  * Menggunakan CSS Media Print presisi `@media print { @page { size: A4 portrait; margin: 10mm; } }`.

---

## 👥 Hak Akses Pengguna (Role-Based Access Control)

Aplikasi mendukung 3 tingkatan peran (*RBAC*) dengan hak ases terspesifikasi:

| Peran Akun | Cakupan Akses | Fitur Unggulan |
| :--- | :--- | :--- |
| **🛡️ Admin Satpol PP (Kabupaten)** | Seluruh Wilayah Kab. HST | Akses master wilayah, manajemen akun operator & linmas, log audit trail, verifikasi data se-kabupaten. |
| **🏢 Operator Kecamatan (11 Kec)** | 1 Kecamatan Binaan | Dibatasi khusus wilayah tugasnya, verifikasi data linmas & poskamling kecamatan terkait. |
| **🪪 Anggota Linmas Mandiri** | Desa / Kelurahan Penugasan | Tampilan mandiri mobile-first: KTA Digital pribadi, input laporan patroli lingkungan dengan GPS. |

---

## 🛠️ Tech Stack & Dependensi

| Layer | Teknologi |
| :--- | :--- |
| **Frontend Core** | React 19 + Vite 8 |
| **Styling Framework** | Tailwind CSS v4 + Lucide React Icons |
| **Basis Data & Autentikasi** | Supabase (PostgreSQL 15 + RLS + Realtime Channel) |
| **Spasial & GIS** | Leaflet.js v1.9 + OpenStreetMap Tile Layer |
| **Mesin Dokumen & Cetak** | html2canvas + jsPDF |
| **Mesin OCR KTP** | Tesseract.js v7 (Model Bahasa Indonesia) |
| **Otomatisasi Cloud** | GitHub Actions Cron Runner (Keep-Alive) |
| **Palet Identitas Satpol PP HST** | Deep Navy (`#0F2A4A`), Golden Yellow (`#F0B429`), Slate Canvas (`#F5F6F8`) |

---

## 💻 Panduan Instalasi & Menjalankan Proyek

### 1. Kloning Repository
```bash
git clone https://github.com/hakiem17/lindungmas.git
cd lindungmas
```

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment (`.env`)
Salin file percontohan `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Sesuaikan konfigurasi kunci Supabase Anda:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Jalankan Aplikasi di Lingkungan Lokal
```bash
npm run dev
```
Buka browser pada alamat: `http://localhost:5173`

### 5. Kompilasi Produksi (Production Build)
```bash
npm run build
```

### 6. Uji Coba Script Keep-Alive
```bash
npm run keep-alive
```

---

## 🏛️ Pemerintah Kabupaten Hulu Sungai Tengah

Sistem ini dikembangkan khusus untuk mendukung tugas pokok dan fungsi:
* **Satuan Polisi Pamong Praja dan Pemadam Kebakaran Kabupaten Hulu Sungai Tengah**
* Alamat: *Jl. Perwira No. 1, Kelurahan Barabai Timur, Kecamatan Barabai, Kabupaten Hulu Sungai Tengah, Kalimantan Selatan (71314)*
* Posko Darurat: `112` / `(0517) 41234` • Email: `satpolpp@hulusungaitengahkab.go.id`

---

## 📄 Lisensi
Didistribusikan di bawah Lisensi **MIT**. Hak cipta & atribusi resmi Pemerintah Kabupaten Hulu Sungai Tengah.

<div align="center">
  <b>LINDUNGMAS HST — Menjaga Ketenteraman & Ketertiban Masyarakat Bumi Murakata</b>
</div>
