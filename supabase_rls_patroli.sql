-- ==============================================================================
-- LINDUNGMAS HST — ATURAN IZIN AKSES DATABASE SUPABASE (ROW LEVEL SECURITY / RLS)
-- ==============================================================================
-- Jalankan skrip SQL ini sekali di menu "SQL Editor" pada Supabase Dashboard Anda:
-- https://supabase.com/dashboard/project/hgbtaojwqstxwolvhukp/sql
--
-- Skrip ini memberikan izin kepada anon / web browser untuk:
-- 1. Menyimpan laporan patroli baru (INSERT) langsung ke database.
-- 2. Membaca riwayat laporan patroli (SELECT) untuk akun Linmas dan Admin.
-- 3. Membaca data satlinmas, poskamling, dan profil pengguna.
-- ==============================================================================

-- 1. Buka akses penuh untuk tabel kegiatan_patroli
ALTER TABLE kegiatan_patroli ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Akses Penuh Laporan Patroli" ON kegiatan_patroli;
CREATE POLICY "Akses Penuh Laporan Patroli"
ON kegiatan_patroli
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 2. Buka akses baca untuk tabel satlinmas
ALTER TABLE satlinmas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Akses Baca Satlinmas" ON satlinmas;
CREATE POLICY "Akses Baca Satlinmas"
ON satlinmas
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 3. Buka akses baca & tulis untuk tabel poskamling
ALTER TABLE poskamling ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Akses Penuh Poskamling" ON poskamling;
CREATE POLICY "Akses Penuh Poskamling"
ON poskamling
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 4. Buka akses baca untuk tabel profil_pengguna
ALTER TABLE profil_pengguna ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Akses Baca Profil Pengguna" ON profil_pengguna;
CREATE POLICY "Akses Baca Profil Pengguna"
ON profil_pengguna
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 5. Buka akses baca untuk tabel master_pegawai
ALTER TABLE master_pegawai ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Akses Baca Master Pegawai" ON master_pegawai;
CREATE POLICY "Akses Baca Master Pegawai"
ON master_pegawai
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 6. Buka akses baca & tulis untuk tabel master_fasilitas_poskamling
ALTER TABLE master_fasilitas_poskamling ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Akses Penuh Fasilitas Poskamling" ON master_fasilitas_poskamling;
CREATE POLICY "Akses Penuh Fasilitas Poskamling"
ON master_fasilitas_poskamling
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Verifikasi status RLS
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

