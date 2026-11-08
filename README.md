# LINDUNGMAS HST — Layanan Informasi dan Data Perlindungan Masyarakat
### Satuan Polisi Pamong Praja & Damkar Kabupaten Hulu Sungai Tengah

**LINDUNGMAS HST** (*Layanan Informasi dan Data Perlindungan Masyarakat Kabupaten Hulu Sungai Tengah*) adalah platform sistem informasi operasional, perlindungan masyarakat (Linmas), penegakan Perda/Trantibum, dan pelayanan pengaduan publik terpadu di **Kabupaten Hulu Sungai Tengah, Kalimantan Selatan**. Aplikasi ini dirancang modern berbasis web responsif, kecerdasan pemindai OCR e-KTP, pemetaan spasial GIS bergradasi, perekaman aktivitas patroli berkoordinat, gatekeeping sanksi berjenjang, dan pelacak tiket aduan masyarakat berbasis QR Code mandiri.

---

## 🌟 Arsitektur Alur Sistem

```
Landing Page Resmi Publik ➔ Form Lapor & Pelacak Tiket QR (Warga)
               │
               ▼
Portal Autentikasi Aparatur (Login Petugas / Admin)
               │
               ▼
Dashboard Eksekutif & 9 Modul Operasional Dinas Terpadu
```

---

## 🚀 Fitur Unggulan & Progres Terkini

### 1. Landing Page Publik & Header Dinamis
- **Header Adaptif & Glassmorphism**: Dilengkapi efek dinamis yang mengecil secara elegan saat digulir (*h-20 ke h-16*) dengan *backdrop blur* pekat.
- **Kapsul Navigasi Mengambang (*Floating Glass Nav Capsule*)**: Menu navigasi tertata rapi di tengah dengan *Scroll Spy* otomatis yang menyorot bagian aktif (*Beranda, Fitur, Form Lapor, Alur, Regulasi, Kontak*).
- **Hierarki Aksi Seimbang**: Tombol *Lacak Tiket QR*, *Lapor Pengaduan*, dan *Masuk Petugas* tertata proporsional tanpa tabrakan antarelemen.
- **Form Lapor Terintegrasi Langsung (`#lapor`)**: Warga dapat menyampaikan laporan langsung pada landing page tanpa perlu login.

### 2. Pelacak Tiket Pengaduan Warga via QR (Citizen Tracking Portal)
- **Pelacakan Transparan 5 Tahapan**:
  1. *Pengaduan Diterima* (Tanda Terima & Nomor Tiket Resmi).
  2. *Verifikasi & Telaah Berkas* (Oleh Admin Dinas).
  3. *Penugasan Regu Lapangan* (Disposisi ke Regu Patroli).
  4. *Penindakan Lapangan* (Petugas tiba di lokasi).
  5. *Selesai / Ditindaklanjuti* (Penertiban selesai).
- **Perbandingan Bukti Foto**: Komparasi visual berdampingan antara *Foto Sebelum Penindakan (Warga)* dengan *Foto Hasil Penindakan Lapangan (Satpol PP)*.
- **Pemindai Kamera QR & Generator Mandiri**: Dilengkapi animasi sinar laser pemindai kamera dan generator QR Code murni JavaScript (`qrCodeGenerator.js`) berlogo segel HST tanpa dependensi eksternal.
- **Cetak Struk Digital & Unduh Tiket SVG**: Warga dapat mengunduh QR Code tiket atau mencetak bukti tanda terima aduan.

### 3. Pemindai e-KTP Nyata Berbasis OCR (Tesseract.js Engine)
- **Ekstraksi Teks Asli di Browser**: Menggunakan pustaka *Tesseract.js* dengan model bahasa Indonesia, berjalan langsung di sisi peramban (*client-side*).
- **Pra-Proses Gambar Otomatis**: Perbesaran resolusi hingga lebar optimal, konversi ke *grayscale*, dan peregangan kontras (*auto-level percentile*) untuk mempertegas tulisan hitam di atas latar biru e-KTP.
- **Parser Regex Cerdas & Toleran Salah-Baca**:
  - Mengoreksi karakter yang sering tertukar pada zona angka (`O→0`, `I→1`, `l→1`, `B→8`, `G→6`).
  - Pencocokan nama kecamatan dan desa secara otomatis ke master wilayah 11 kecamatan se-Kabupaten HST.
- **Validasi Silang NIK 16 Digit**:
  - Mendekode struktur NIK: mengekstrak tanggal lahir dan jenis kelamin yang tertanam pada digit NIK (tanggal + 40 untuk perempuan).
  - Memberikan notifikasi peringatan jika teks tanggal lahir KTP tidak sinkron dengan kode NIK.
- **Modal Koreksi & Tinjau Lapangan (Editable Review Panel)**:
  - Pratinjau foto asli berdampingan dengan kolom hasil bacaan yang dapat dikoreksi langsung oleh petugas.
  - Tab *Tempel Teks Mentah (Google Lens / Kamera HP)* untuk kemudahan menyalin teks secara cepat.
  - Skor keyakinan OCR (*Confidence Score*) dan inspeksi teks mentah (*raw OCR text*).
- **Deteksi Residivis Real-Time**: Sistem otomatis memeriksa NIK terhadap database pelanggar. Jika ditemukan riwayat kasus lama, muncul peringatan status residivis beserta riwayat sanksi sebelumnya.
- **Penyimpanan Foto KTP**: Foto fisik kartu KTP tersimpan ke berkas pelanggaran dengan pratinjau thumbnail di formulir.

### 4. Geotagging Ganda & Pop-Up Peta Spasial (Input Luar TKP)
- **Ambil GPS Langsung (Di TKP)**: Sensor geolokasi perangkat membaca koordinat satelit secara otomatis saat petugas/pelapor berada di tempat kejadian, lengkap dengan lencana akurasi presisi (misal `±10m`).
- **Fitur Pop-Up Peta Interaktif (`ModalMapPicker`)**:
  - Pop-up peta *Leaflet GIS* khusus wilayah Kabupaten Hulu Sungai Tengah.
  - Digunakan apabila penginputan dilakukan di luar lokasi (misal saat mencatat di Kantor Mako Satpol PP atau di rumah).
  - Pin merah dapat digeser bebas (*draggable marker*) atau dengan mengklik sembarang titik jalan, gang, dan ruko di peta.
  - Pilihan cepat lompat ke 11 kecamatan (Barabai, Birayang, Haruyan, Batu Benawa, Labuan Amas Selatan, dll).
  - Tautan langsung validasi koordinat ke *Google Maps*.

### 5. Multi-Upload Foto Bukti Pelanggaran (Maksimal 6 Foto)
- Formulir input pelanggaran mendukung pengunggahan **hingga 6 foto dokumentasi penindakan lapangan**.
- Dilengkapi keterangan catatan per foto, tombol hapus foto, serta tombol muat foto demo penertiban.

### 6. Perekaman Aktivitas Patroli Lapangan & Laporan Dinas
- **Multi-Catatan Aktivitas Lapangan**: Perekaman bertahap dalam satu sesi patroli (misal titik pantau 1, titik pantau 2, dan seterusnya).
- **Log Rinci**: Setiap catatan aktivitas menyimpan waktu pencatatan, uraian kondisi lapangan, koordinat GPS, dan unggah foto dokumentasi kegiatan regu.
- **Generator Laporan Patroli Resmi**: Pembuatan laporan dinas berformat cetak rapi lengkap dengan lembar pengesahan, rute patroli, dan rekapitulasi temuan.

### 7. Peta Spasial & Analisis Kerapatan Trantibum Bergradasi
- Pemetaan spasial titik kegiatan penindakan dan berkas pelanggaran di 11 kecamatan Kabupaten Hulu Sungai Tengah.
- Visualisasi tingkat kerapatan penegakan hukum Trantibum menggunakan **gradasi warna bertingkat** (rendah, sedang, tinggi, sangat prioritas) yang informatif dan representatif bagi pimpinan dinas.

### 8. Alur Sanksi Berjenjang & Generator Surat Ber-QR Code
- Tahapan pembinaan dan penegakan hukum bertahap sesuai regulasi:
  - **Tahap 1**: Surat Pernyataan / Teguran Lisan
  - **Tahap 2**: Surat Peringatan I (SP1)
  - **Tahap 3**: Surat Peringatan II (SP2)
  - **Tahap 4**: Surat Peringatan III (SP3)
  - **Tahap 5**: Berita Acara Eksekusi / Tindakan Penertiban
- Gatekeeping wajib unggah foto bukti lapangan sebelum menaikkan status berkas perkara.
- Generator surat resmi dinas Pemkab HST berformat PDF (jsPDF) dengan validasi QR Code tanda tangan elektronik.

### 9. Buku Register Trantibum Digital
- Pencatatan buku register penertiban, pengawasan, dan pengamanan dinas.
- Fitur multi-personil sistem ceklis, penyaringan per bulan/tahun, pencarian cepat, ekspor berkas CSV, dan navigasi halaman (*pagination*).

### 10. Master Data Terpadu
- **Master Perda**: Katalog regulasi daerah lengkap beserta bab, pasal, dan ancaman sanksi.
- **Master Wilayah**: Basis data 11 kecamatan dan seluruh desa/kelurahan di Kabupaten Hulu Sungai Tengah.
- **Master Pegawai & Regu**: Manajemen data personil, jabatan fungsional, dan pembagian regu operasional.
- **Master Pelapor**: Basis data identitas pelapor dan rekam jejak aduan warga.

---

## 🛠️ Tech Stack & Dependensi

| Kategori | Teknologi yang Digunakan |
| :--- | :--- |
| **Framework Frontend** | React 19 + Vite 8 |
| **Styling & Desain** | Tailwind CSS v4 + Lucide React Icons |
| **Mesin OCR KTP** | Tesseract.js v7 (Model Bahasa Indonesia, Client-Side) |
| **Sistem GIS & Peta** | Leaflet.js v1.9 + OpenStreetMap |
| **Generator Dokumen PDF** | jsPDF + html2canvas |
| **QR Code Engine** | Generator Matriks QR Mandiri (Pure SVG/Canvas, Zero Dependencies) |
| **Palet Identitas Satpol PP** | Deep Navy (`#0F2A4A`), Golden Yellow (`#F0B429`), Slate Surface (`#F5F6F8`) |
| **Basis Data Relasional** | PostgreSQL + Ekstensi Spasial PostGIS (`skema_satpolpp_supabase.sql`) |

---

## 💻 Cara Menjalankan Proyek Secara Lokal

Pastikan Node.js (v18+) sudah terpasang di komputer Anda:

```bash
# 1. Masuk ke direktori proyek
cd /Users/ahmadhakim/kimqy/sipolpp

# 2. Instalasi dependensi (jika baru di-clone)
npm install

# 3. Jalankan development server
npm run dev
```

Buka peramban pada alamat:
`http://localhost:5173`

Untuk melakukan kompilasi produksi (*production build*):
```bash
npm run build
```

---

## 🗄️ Menjalankan Skema Basis Data di Supabase / PostgreSQL

Skrip skema lengkap tersimpan pada berkas [skema_satpolpp_supabase.sql](file:///Users/ahmadhakim/kimqy/sipolpp/skema_satpolpp_supabase.sql):
1. Buka dashboard proyek Supabase Anda.
2. Buka menu **SQL Editor**.
3. Buka dan salin seluruh isi berkas `skema_satpolpp_supabase.sql`.
4. Klik tombol **Run**.
5. Skrip akan otomatis mengonfigurasi:
   - Ekstensi spasial `postgis` untuk koordinat lintang/bujur (SRID 4326).
   - Tabel: `pelanggar`, `pelanggaran`, `pengaduan`, `patroli`, `master_perda`, `master_pegawai`, `master_wilayah`.
   - Fungsi generator otomatis nomor register kedinasan (`PLG-HST-YYYYMM-XXXX` & `PGD-HST-YYYYMM-XXXX`).
   - Kebijakan keamanan baris (*Row Level Security / RLS*).
   - Seed data awal wilayah 11 kecamatan se-Kabupaten Hulu Sungai Tengah.

---

## 🏛️ Kepatuhan Standar Kedinasan
Sistem ini mematuhi standar nomenklatur dan tata naskah dinas Satpol PP:
- Fokus penegakan Peraturan Daerah & Peraturan Kepala Daerah (Perda/Perkada) serta Ketenteraman dan Ketertiban Umum (Trantibum).
- Bersih dari istilah non-Satpol PP.
- Tata letak antarmuka mengutamakan kemudahan keterbacaan (*left-aligned text*) dan tombol sentuh ramah perangkat lapangan (*touch target > 44px*).
