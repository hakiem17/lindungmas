-- ==============================================================================
-- LINDUNGMAS HST — SKEMA DATABASE SUPABASE & ROW LEVEL SECURITY (RLS) CRUD
-- LAYANAN INFORMASI & DATA PERLINDUNGAN MASYARAKAT KABUPATEN HULU SUNGAI TENGAH
-- SATPOL PP & DAMKAR KABUPATEN HULU SUNGAI TENGAH
-- ==============================================================================
-- Mendukung 3-Tier Role-Based Access Control (RBAC):
-- 1. Admin Satpol PP Kabupaten (Akses Penuh Seluruh HST, tercatat dalam Audit Log)
-- 2. Operator Kecamatan / Desa (Akses data wilayah tugas, tidak bisa ubah luar wilayah / admin)
-- 3. Anggota Linmas (Akses profil mandiri, lapor patroli GPS, riwayat sendiri)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ------------------------------------------------------------------------------
-- 2. ENUM TYPES
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE peran_pengguna AS ENUM (
        'admin_kabupaten',
        'operator_kecamatan',
        'anggota_linmas'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE status_linmas AS ENUM (
        'aktif',
        'tidak aktif',
        'mutasi',
        'diberhentikan'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE kondisi_poskamling AS ENUM (
        'Baik (Siap Pakai)',
        'Rusak Ringan',
        'Rusak Berat / Perlu Renovasi',
        'Tidak Layak'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE status_poskamling AS ENUM (
        'Aktif Terjadwal (Tiap Malam)',
        'Aktif Berkala (Akhir Pekan)',
        'Non-Aktif / Butuh Revitalisasi'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE status_situasi_patroli AS ENUM (
        'Aman & Kondusif',
        'Ada Potensi Gangguan',
        'Ditemukan Pelanggaran Ringan',
        'Butuh Bantuan Personil Mako',
        'Darurat / Perlu Tindakan Cepat'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE jenis_aksi_audit AS ENUM (
        'TAMBAH',
        'EDIT',
        'HAPUS',
        'VERIFIKASI'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 3. TABEL: PROFIL PENGGUNA (PEGAWAI / PERSONEL - TERKONEKSI KE auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profil_pengguna (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nama VARCHAR(255) NOT NULL,
    nip VARCHAR(30),
    nik VARCHAR(16) UNIQUE,
    no_registrasi VARCHAR(50),
    jabatan VARCHAR(150),
    pangkat VARCHAR(100),
    regu VARCHAR(100),
    peran peran_pengguna NOT NULL DEFAULT 'anggota_linmas',
    wilayah_tugas VARCHAR(100) NOT NULL DEFAULT 'Seluruh Kabupaten Hulu Sungai Tengah',
    desa_tugas VARCHAR(100),
    no_hp VARCHAR(25),
    email VARCHAR(100),
    foto_url TEXT,
    status VARCHAR(20) DEFAULT 'Aktif',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index profil
CREATE INDEX IF NOT EXISTS idx_profil_peran ON public.profil_pengguna(peran);
CREATE INDEX IF NOT EXISTS idx_profil_wilayah ON public.profil_pengguna(wilayah_tugas);
CREATE INDEX IF NOT EXISTS idx_profil_nik ON public.profil_pengguna(nik);

-- ------------------------------------------------------------------------------
-- 4. TABEL: MASTER SARANA & FASILITAS POSKAMLING
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.master_fasilitas_poskamling (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_fasilitas VARCHAR(150) UNIQUE NOT NULL,
    kategori VARCHAR(100) NOT NULL DEFAULT 'Peralatan Keamanan',
    deskripsi TEXT,
    standar_minimal VARCHAR(100) DEFAULT '1 Unit / Pos',
    aktif BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. TABEL: MASTER WILAYAH (11 KECAMATAN & 169 DESA KAB. HST)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.master_wilayah (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kecamatan VARCHAR(100) NOT NULL,
    desa_kelurahan VARCHAR(100) NOT NULL,
    pusat_pemerintahan VARCHAR(100),
    kode_pos VARCHAR(10),
    tipe_wilayah VARCHAR(50) DEFAULT 'Desa',
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    geom GEOMETRY(Point, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_wilayah_kec_desa UNIQUE (kecamatan, desa_kelurahan)
);

CREATE INDEX IF NOT EXISTS idx_wilayah_kec ON public.master_wilayah(kecamatan);

-- ------------------------------------------------------------------------------
-- 6. TABEL: DATA SATLINMAS HST (17 KOLOM BAKU PERMENDAGRI NO. 26/2020)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.satlinmas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- 17 Urutan Kolom Baku:
    no_registrasi VARCHAR(50) UNIQUE NOT NULL,                       -- Kolom 1
    nama VARCHAR(255) NOT NULL,                                       -- Kolom 2
    nik VARCHAR(16) UNIQUE NOT NULL,                                  -- Kolom 3
    tempat_lahir VARCHAR(100) NOT NULL,                               -- Kolom 4
    tanggal_lahir DATE NOT NULL,                                      -- Kolom 5
    jenis_kelamin VARCHAR(20) NOT NULL DEFAULT 'Laki-laki',           -- Kolom 6
    alamat TEXT NOT NULL,                                             -- Kolom 7
    provinsi VARCHAR(100) NOT NULL DEFAULT 'Kalimantan Selatan',      -- Kolom 8
    kab_kota VARCHAR(100) NOT NULL DEFAULT 'Kabupaten Hulu Sungai Tengah', -- Kolom 9
    kecamatan VARCHAR(100) NOT NULL,                                  -- Kolom 10
    desa_kelurahan VARCHAR(100) NOT NULL,                             -- Kolom 11
    pendapatan VARCHAR(100),                                          -- Kolom 12
    tahun_pengangkatan VARCHAR(4) NOT NULL,                           -- Kolom 13
    jumlah_keluarga VARCHAR(50) DEFAULT '3 Orang',                   -- Kolom 14
    no_hp VARCHAR(25),                                                -- Kolom 15
    email VARCHAR(100),                                               -- Kolom 16
    status status_linmas NOT NULL DEFAULT 'aktif',                    -- Kolom 17

    -- Lampiran Berkas & KTA
    pas_foto_url TEXT,
    nomor_sk VARCHAR(100),
    tanggal_sk DATE,
    file_sk_url TEXT,
    qr_kta_code TEXT,

    -- Audit Metadata
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_satlinmas_kec ON public.satlinmas(kecamatan);
CREATE INDEX IF NOT EXISTS idx_satlinmas_desa ON public.satlinmas(desa_kelurahan);
CREATE INDEX IF NOT EXISTS idx_satlinmas_nik ON public.satlinmas(nik);
CREATE INDEX IF NOT EXISTS idx_satlinmas_status ON public.satlinmas(status);

-- ------------------------------------------------------------------------------
-- 7. TABEL: DATA POSKAMLING HST (GIS GEOTAGGING & FASILITAS SARANA)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.poskamling (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_poskamling VARCHAR(255) NOT NULL,
    kecamatan VARCHAR(100) NOT NULL,
    desa_kelurahan VARCHAR(100) NOT NULL,
    alamat_lengkap TEXT NOT NULL,
    rt VARCHAR(10) NOT NULL DEFAULT '01',
    rw VARCHAR(10) NOT NULL DEFAULT '01',
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    geom GEOMETRY(Point, 4326),
    kondisi_fisik kondisi_poskamling NOT NULL DEFAULT 'Baik (Siap Pakai)',
    status_operasional status_poskamling NOT NULL DEFAULT 'Aktif Terjadwal (Tiap Malam)',
    fasilitas JSONB NOT NULL DEFAULT '[]'::jsonb,
    nama_ketua_pos VARCHAR(150),
    kontak_wa VARCHAR(25),
    personel_ronda INT NOT NULL DEFAULT 8,
    catatan_tambahan TEXT,
    foto_pos_url TEXT,

    -- Audit Metadata
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_poskamling_kec ON public.poskamling(kecamatan);
CREATE INDEX IF NOT EXISTS idx_poskamling_geom ON public.poskamling USING GIST(geom);

-- ------------------------------------------------------------------------------
-- 8. TABEL: KEGIATAN DAN PATROLI HST (PELAPORAN LAPANGAN DENGAN GPS LIVE)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kegiatan_patroli (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode VARCHAR(50) UNIQUE,
    judul_patroli VARCHAR(255) NOT NULL,
    jenis_kegiatan VARCHAR(100) NOT NULL DEFAULT 'Patroli Trantibum',
    status_situasi status_situasi_patroli NOT NULL DEFAULT 'Aman & Kondusif',
    kecamatan VARCHAR(100) NOT NULL,
    desa_kelurahan VARCHAR(100) NOT NULL,
    lokasi_spesifik TEXT,
    petugas_pelapor VARCHAR(255) NOT NULL,
    nik_pelapor VARCHAR(16),
    jumlah_personel INT NOT NULL DEFAULT 1,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    geom GEOMETRY(Point, 4326),
    hasil_patroli TEXT NOT NULL,
    tindakan_diambil TEXT,
    foto_dokumentasi JSONB DEFAULT '[]'::jsonb,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patroli_kec ON public.kegiatan_patroli(kecamatan);
CREATE INDEX IF NOT EXISTS idx_patroli_nik ON public.kegiatan_patroli(nik_pelapor);
CREATE INDEX IF NOT EXISTS idx_patroli_user ON public.kegiatan_patroli(user_id);
CREATE INDEX IF NOT EXISTS idx_patroli_geom ON public.kegiatan_patroli USING GIST(geom);

-- ------------------------------------------------------------------------------
-- 9. TABEL: AUDIT LOGS (REKAM JEJAK SISTEM KHUSUS ADMIN KABUPATEN)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    aktor VARCHAR(255) NOT NULL,
    nip_aktor VARCHAR(50),
    peran VARCHAR(100) NOT NULL,
    aksi jenis_aksi_audit NOT NULL,
    modul VARCHAR(100) NOT NULL,
    target VARCHAR(255) NOT NULL,
    detail TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_time ON public.audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_modul ON public.audit_logs(modul);
CREATE INDEX IF NOT EXISTS idx_audit_aksi ON public.audit_logs(aksi);

-- ------------------------------------------------------------------------------
-- 10. HELPER FUNCTIONS UNTUK ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------

-- Dapatkan data profil pengguna yang sedang login saat ini
CREATE OR REPLACE FUNCTION public.get_auth_profile()
RETURNS public.profil_pengguna AS $$
    SELECT * FROM public.profil_pengguna WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Dapatkan peran aktif pengguna
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS peran_pengguna AS $$
    SELECT peran FROM public.profil_pengguna WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Dapatkan wilayah penugasan operator kecamatan
CREATE OR REPLACE FUNCTION public.current_user_wilayah()
RETURNS VARCHAR AS $$
    SELECT wilayah_tugas FROM public.profil_pengguna WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Dapatkan NIK anggota linmas yang sedang login
CREATE OR REPLACE FUNCTION public.current_user_nik()
RETURNS VARCHAR AS $$
    SELECT nik FROM public.profil_pengguna WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Checkers boolean
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT (public.current_user_role() = 'admin_kabupaten');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_operator()
RETURNS BOOLEAN AS $$
    SELECT (public.current_user_role() = 'operator_kecamatan');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_linmas()
RETURNS BOOLEAN AS $$
    SELECT (public.current_user_role() = 'anggota_linmas');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 11. TRIGGER: OTOMATIS GENERATE POSTGIS GEOM POINT
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_update_geom()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
        NEW.geom = ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_poskamling_geom ON public.poskamling;
CREATE TRIGGER set_poskamling_geom
    BEFORE INSERT OR UPDATE ON public.poskamling
    FOR EACH ROW EXECUTE FUNCTION public.trg_update_geom();

DROP TRIGGER IF EXISTS set_patroli_geom ON public.kegiatan_patroli;
CREATE TRIGGER set_patroli_geom
    BEFORE INSERT OR UPDATE ON public.kegiatan_patroli
    FOR EACH ROW EXECUTE FUNCTION public.trg_update_geom();

-- ------------------------------------------------------------------------------
-- 12. TRIGGER: OTOMATIS CATAT AUDIT LOG SAAT INSERT/UPDATE/DELETE
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_record_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    cur_actor VARCHAR;
    cur_nip VARCHAR;
    cur_role VARCHAR;
    action_type jenis_aksi_audit;
    target_str VARCHAR;
    detail_str TEXT;
BEGIN
    -- Ambil profil pelaku
    SELECT COALESCE(nama, 'Sistem / Anonim'), nip, peran::VARCHAR
    INTO cur_actor, cur_nip, cur_role
    FROM public.profil_pengguna
    WHERE id = auth.uid();

    IF cur_actor IS NULL THEN
        cur_actor := 'Sistem Internal';
        cur_role := 'admin_kabupaten';
    END IF;

    IF TG_OP = 'INSERT' THEN
        action_type := 'TAMBAH';
        IF TG_TABLE_NAME = 'satlinmas' THEN
            target_str := NEW.nama || ' (' || NEW.no_registrasi || ')';
            detail_str := 'Pendaftaran personil Satlinmas di Desa ' || NEW.desa_kelurahan || ', Kec. ' || NEW.kecamatan;
        ELSIF TG_TABLE_NAME = 'poskamling' THEN
            target_str := NEW.nama_poskamling;
            detail_str := 'Registrasi pos ronda baru di RT ' || NEW.rt || ' Desa ' || NEW.desa_kelurahan || ', Kec. ' || NEW.kecamatan;
        ELSIF TG_TABLE_NAME = 'kegiatan_patroli' THEN
            target_str := NEW.judul_patroli;
            detail_str := 'Laporan patroli lapangan di Kec. ' || NEW.kecamatan || ' dengan situasi: ' || NEW.status_situasi::VARCHAR;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        action_type := 'EDIT';
        IF TG_TABLE_NAME = 'satlinmas' THEN
            target_str := NEW.nama || ' (' || NEW.no_registrasi || ')';
            detail_str := 'Pembaruan data personil Satlinmas (Status: ' || NEW.status::VARCHAR || ')';
        ELSIF TG_TABLE_NAME = 'poskamling' THEN
            target_str := NEW.nama_poskamling;
            detail_str := 'Pembaruan kondisi fisik pos: ' || NEW.kondisi_fisik::VARCHAR;
        ELSIF TG_TABLE_NAME = 'kegiatan_patroli' THEN
            target_str := NEW.judul_patroli;
            detail_str := 'Perubahan tindak lanjut patroli: ' || COALESCE(NEW.tindakan_diambil, '-');
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        action_type := 'HAPUS';
        IF TG_TABLE_NAME = 'satlinmas' THEN
            target_str := OLD.nama || ' (' || OLD.no_registrasi || ')';
            detail_str := 'Penghapusan data personil Satlinmas dari database';
        ELSIF TG_TABLE_NAME = 'poskamling' THEN
            target_str := OLD.nama_poskamling;
            detail_str := 'Penghapusan pos ronda ' || OLD.nama_poskamling;
        ELSIF TG_TABLE_NAME = 'kegiatan_patroli' THEN
            target_str := OLD.judul_patroli;
            detail_str := 'Penghapusan laporan kegiatan patroli ' || OLD.judul_patroli;
        END IF;
    END IF;

    INSERT INTO public.audit_logs (
        aktor, nip_aktor, peran, aksi, modul, target, detail, user_id
    ) VALUES (
        cur_actor, cur_nip, cur_role, action_type, TG_TABLE_NAME, target_str, detail_str, auth.uid()
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pasang trigger audit pada ketiga modul operasional
DROP TRIGGER IF EXISTS audit_satlinmas ON public.satlinmas;
CREATE TRIGGER audit_satlinmas
    AFTER INSERT OR UPDATE OR DELETE ON public.satlinmas
    FOR EACH ROW EXECUTE FUNCTION public.trg_record_audit_log();

DROP TRIGGER IF EXISTS audit_poskamling ON public.poskamling;
CREATE TRIGGER audit_poskamling
    AFTER INSERT OR UPDATE OR DELETE ON public.poskamling
    FOR EACH ROW EXECUTE FUNCTION public.trg_record_audit_log();

DROP TRIGGER IF EXISTS audit_patroli ON public.kegiatan_patroli;
CREATE TRIGGER audit_patroli
    AFTER INSERT OR UPDATE OR DELETE ON public.kegiatan_patroli
    FOR EACH ROW EXECUTE FUNCTION public.trg_record_audit_log();

-- ==============================================================================
-- 13. IMPLEMENTASI ROW LEVEL SECURITY (RLS) SESUAI TINGKATAN HAK AKSES
-- ==============================================================================

ALTER TABLE public.profil_pengguna ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_fasilitas_poskamling ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_wilayah ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.satlinmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poskamling ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kegiatan_patroli ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- A. KEBIJAKAN RLS: public.profil_pengguna
-- ------------------------------------------------------------------------------
-- 1. Admin Kabupaten: Akses penuh semua profil
CREATE POLICY admin_profil_all ON public.profil_pengguna
    FOR ALL
    TO authenticated
    USING (public.is_admin());

-- 2. Operator Kecamatan: Boleh melihat semua profil, tetapi dilarang mengedit admin kabupaten
CREATE POLICY operator_profil_select ON public.profil_pengguna
    FOR SELECT
    TO authenticated
    USING (public.is_operator());

CREATE POLICY operator_profil_update_self ON public.profil_pengguna
    FOR UPDATE
    TO authenticated
    USING (public.is_operator() AND id = auth.uid())
    WITH CHECK (id = auth.uid() AND peran = 'operator_kecamatan');

-- 3. Anggota Linmas: Hanya melihat dan memperbarui profil diri sendiri
CREATE POLICY linmas_profil_self ON public.profil_pengguna
    FOR SELECT
    TO authenticated
    USING (public.is_linmas() AND id = auth.uid());

CREATE POLICY linmas_profil_update_self ON public.profil_pengguna
    FOR UPDATE
    TO authenticated
    USING (public.is_linmas() AND id = auth.uid())
    WITH CHECK (id = auth.uid() AND peran = 'anggota_linmas');

-- ------------------------------------------------------------------------------
-- B. KEBIJAKAN RLS: public.satlinmas (DATA ANGGOTA LINMAS)
-- ------------------------------------------------------------------------------
-- 1. Admin Kabupaten: Akses penuh seluruh HST (CRUD)
CREATE POLICY admin_satlinmas_all ON public.satlinmas
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 2. Operator Kecamatan: CRUD hanya pada kecamatan wilayah tugasnya
CREATE POLICY operator_satlinmas_select ON public.satlinmas
    FOR SELECT
    TO authenticated
    USING (public.is_operator() AND kecamatan = public.current_user_wilayah());

CREATE POLICY operator_satlinmas_insert ON public.satlinmas
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_operator() AND kecamatan = public.current_user_wilayah());

CREATE POLICY operator_satlinmas_update ON public.satlinmas
    FOR UPDATE
    TO authenticated
    USING (public.is_operator() AND kecamatan = public.current_user_wilayah())
    WITH CHECK (public.is_operator() AND kecamatan = public.current_user_wilayah());

CREATE POLICY operator_satlinmas_delete ON public.satlinmas
    FOR DELETE
    TO authenticated
    USING (public.is_operator() AND kecamatan = public.current_user_wilayah());

-- 3. Anggota Linmas: HANYA MELIHAT DATA DIRI SENDIRI (Berdasarkan NIK / Akun)
-- Tidak dapat melihat anggota lain, tidak dapat menghapus atau membuat personil baru
CREATE POLICY linmas_satlinmas_view_self ON public.satlinmas
    FOR SELECT
    TO authenticated
    USING (
        public.is_linmas() AND (
            nik = public.current_user_nik() OR 
            created_by = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- C. KEBIJAKAN RLS: public.poskamling
-- ------------------------------------------------------------------------------
-- 1. Admin Kabupaten: Akses penuh seluruh HST (CRUD)
CREATE POLICY admin_poskamling_all ON public.poskamling
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 2. Operator Kecamatan: CRUD hanya pada kecamatan wilayah tugasnya
CREATE POLICY operator_poskamling_select ON public.poskamling
    FOR SELECT
    TO authenticated
    USING (public.is_operator() AND kecamatan = public.current_user_wilayah());

CREATE POLICY operator_poskamling_insert ON public.poskamling
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_operator() AND kecamatan = public.current_user_wilayah());

CREATE POLICY operator_poskamling_update ON public.poskamling
    FOR UPDATE
    TO authenticated
    USING (public.is_operator() AND kecamatan = public.current_user_wilayah())
    WITH CHECK (public.is_operator() AND kecamatan = public.current_user_wilayah());

CREATE POLICY operator_poskamling_delete ON public.poskamling
    FOR DELETE
    TO authenticated
    USING (public.is_operator() AND kecamatan = public.current_user_wilayah());

-- 3. Anggota Linmas: Tidak memiliki hak akses mengelola data Poskamling
-- (Secara default tidak ada policy untuk linmas, sehingga akses otomatis ditolak oleh RLS)

-- ------------------------------------------------------------------------------
-- D. KEBIJAKAN RLS: public.kegiatan_patroli
-- ------------------------------------------------------------------------------
-- 1. Admin Kabupaten: Akses penuh seluruh HST (CRUD)
CREATE POLICY admin_patroli_all ON public.kegiatan_patroli
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 2. Operator Kecamatan: CRUD patroli di wilayah kecamatannya
CREATE POLICY operator_patroli_select ON public.kegiatan_patroli
    FOR SELECT
    TO authenticated
    USING (public.is_operator() AND kecamatan = public.current_user_wilayah());

CREATE POLICY operator_patroli_insert ON public.kegiatan_patroli
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_operator() AND kecamatan = public.current_user_wilayah());

CREATE POLICY operator_patroli_update ON public.kegiatan_patroli
    FOR UPDATE
    TO authenticated
    USING (public.is_operator() AND kecamatan = public.current_user_wilayah())
    WITH CHECK (public.is_operator() AND kecamatan = public.current_user_wilayah());

CREATE POLICY operator_patroli_delete ON public.kegiatan_patroli
    FOR DELETE
    TO authenticated
    USING (public.is_operator() AND kecamatan = public.current_user_wilayah());

-- 3. Anggota Linmas: Menginput kegiatan/patroli, mengambil GPS, mengunggah foto, & melihat riwayat sendiri
CREATE POLICY linmas_patroli_select_own ON public.kegiatan_patroli
    FOR SELECT
    TO authenticated
    USING (
        public.is_linmas() AND (
            user_id = auth.uid() OR 
            nik_pelapor = public.current_user_nik()
        )
    );

CREATE POLICY linmas_patroli_insert_own ON public.kegiatan_patroli
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_linmas() AND (
            user_id = auth.uid() OR
            nik_pelapor = public.current_user_nik()
        )
    );

CREATE POLICY linmas_patroli_update_own ON public.kegiatan_patroli
    FOR UPDATE
    TO authenticated
    USING (
        public.is_linmas() AND (
            user_id = auth.uid() OR
            nik_pelapor = public.current_user_nik()
        )
    )
    WITH CHECK (
        user_id = auth.uid() OR
        nik_pelapor = public.current_user_nik()
    );

-- ------------------------------------------------------------------------------
-- E. KEBIJAKAN RLS: public.master_fasilitas_poskamling
-- ------------------------------------------------------------------------------
-- Admin & Operator dapat mengelola sarana, Linmas & Publik hanya membaca
CREATE POLICY admin_fasilitas_all ON public.master_fasilitas_poskamling
    FOR ALL
    TO authenticated
    USING (public.is_admin() OR public.is_operator())
    WITH CHECK (public.is_admin() OR public.is_operator());

CREATE POLICY linmas_fasilitas_select ON public.master_fasilitas_poskamling
    FOR SELECT
    TO authenticated
    USING (true);

-- ------------------------------------------------------------------------------
-- F. KEBIJAKAN RLS: public.audit_logs
-- ------------------------------------------------------------------------------
-- Hanya Admin Kabupaten yang dapat melihat Log Audit Sistem
CREATE POLICY admin_audit_select ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- ==============================================================================
-- 14. STORED PROCEDURES / RPC CRUD SIAP PAKAI DI SUPABASE CLIENT (JS/TS)
-- ==============================================================================

-- 1. RPC: Tambah Anggota Satlinmas (17 Kolom Baku)
CREATE OR REPLACE FUNCTION public.tambah_anggota_satlinmas(
    p_no_registrasi VARCHAR,
    p_nama VARCHAR,
    p_nik VARCHAR,
    p_tempat_lahir VARCHAR,
    p_tanggal_lahir DATE,
    p_jenis_kelamin VARCHAR,
    p_alamat TEXT,
    p_kecamatan VARCHAR,
    p_desa_kelurahan VARCHAR,
    p_tahun_pengangkatan VARCHAR,
    p_pendapatan VARCHAR DEFAULT 'Rp 1.000.000 - Rp 2.000.000',
    p_jumlah_keluarga VARCHAR DEFAULT '3 Orang',
    p_no_hp VARCHAR DEFAULT '',
    p_email VARCHAR DEFAULT '',
    p_pas_foto TEXT DEFAULT '',
    p_nomor_sk VARCHAR DEFAULT '',
    p_tanggal_sk DATE DEFAULT NULL,
    p_file_sk TEXT DEFAULT ''
)
RETURNS UUID AS $$
DECLARE
    new_id UUID;
BEGIN
    INSERT INTO public.satlinmas (
        no_registrasi, nama, nik, tempat_lahir, tanggal_lahir, jenis_kelamin,
        alamat, kecamatan, desa_kelurahan, tahun_pengangkatan, pendapatan,
        jumlah_keluarga, no_hp, email, pas_foto_url, nomor_sk, tanggal_sk,
        file_sk_url, created_by
    ) VALUES (
        p_no_registrasi, p_nama, p_nik, p_tempat_lahir, p_tanggal_lahir, p_jenis_kelamin,
        p_alamat, p_kecamatan, p_desa_kelurahan, p_tahun_pengangkatan, p_pendapatan,
        p_jumlah_keluarga, p_no_hp, p_email, p_pas_foto, p_nomor_sk, p_tanggal_sk,
        p_file_sk, auth.uid()
    )
    RETURNING id INTO new_id;

    RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. RPC: Input Patroli Cepat oleh Anggota Linmas / Operator
CREATE OR REPLACE FUNCTION public.lapor_patroli_lapangan(
    p_judul_patroli VARCHAR,
    p_jenis_kegiatan VARCHAR,
    p_status_situasi status_situasi_patroli,
    p_kecamatan VARCHAR,
    p_desa_kelurahan VARCHAR,
    p_lokasi_spesifik TEXT,
    p_petugas_pelapor VARCHAR,
    p_nik_pelapor VARCHAR,
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_hasil_patroli TEXT,
    p_tindakan_diambil TEXT DEFAULT '',
    p_foto_urls JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID AS $$
DECLARE
    new_id UUID;
    new_kode VARCHAR;
BEGIN
    new_kode := 'PTR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(gen_random_uuid()::text FROM 1 FOR 6);

    INSERT INTO public.kegiatan_patroli (
        kode, judul_patroli, jenis_kegiatan, status_situasi, kecamatan,
        desa_kelurahan, lokasi_spesifik, petugas_pelapor, nik_pelapor,
        lat, lng, hasil_patroli, tindakan_diambil, foto_dokumentasi, user_id
    ) VALUES (
        new_kode, p_judul_patroli, p_jenis_kegiatan, p_status_situasi, p_kecamatan,
        p_desa_kelurahan, p_lokasi_spesifik, p_petugas_pelapor, p_nik_pelapor,
        p_lat, p_lng, p_hasil_patroli, p_tindakan_diambil, p_foto_urls, auth.uid()
    )
    RETURNING id INTO new_id;

    RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RPC: Cari Poskamling Terdekat dari Koordinat Patroli (Spatial Query PostGIS)
CREATE OR REPLACE FUNCTION public.cari_poskamling_terdekat(
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_radius_meter INT DEFAULT 3000
)
RETURNS TABLE (
    id UUID,
    nama_poskamling VARCHAR,
    kecamatan VARCHAR,
    desa_kelurahan VARCHAR,
    kondisi_fisik kondisi_poskamling,
    jarak_meter DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.nama_poskamling,
        p.kecamatan,
        p.desa_kelurahan,
        p.kondisi_fisik,
        ROUND(ST_Distance(p.geom, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography)::numeric, 1)::double precision AS jarak_meter
    FROM public.poskamling p
    WHERE ST_DWithin(p.geom, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_radius_meter)
    ORDER BY jarak_meter ASC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql STABLE;

-- ==============================================================================
-- 15. SEED DATA AWAL (MASTER WILAYAH, SARANA POSKAMLING & PERSONA 3 ROLES)
-- ==============================================================================

-- A. Master Sarana Poskamling
INSERT INTO public.master_fasilitas_poskamling (nama_fasilitas, kategori, deskripsi, standar_minimal)
VALUES
    ('Kentongan Kayu / Bambu', 'Alat Komunikasi Tradisional', 'Kentongan kayu ulin/bambu petung beserta alat pemukul', '1 Unit / Pos'),
    ('Buku Mutasi Tamu', 'Administrasi Siskamling', 'Buku register tamu wajib lapor 1x24 jam dan mutasi ronda malam', '1 Buku'),
    ('Senter LED Sorot', 'Peralatan Penerangan', 'Senter sorot LED tahan air jarak jauh min 500 meter', '2 Buah / Pos'),
    ('Kotak P3K Lengkap', 'Kesehatan & Keselamatan', 'Kotak obat darurat, perban steril, antiseptik, dan obat luka', '1 Set Lengkap'),
    ('Rompi / Jas Hujan Linmas', 'Perlengkapan Lapangan', 'Rompi keselamatan scotlight hijau stabilo dan jas hujan dinas', '4 Set / Pos'),
    ('Alat Pemadam / Ember / APAR', 'Kesiapsiagaan Kebakaran', 'APAR bubuk kering 3kg atau ember pasir gantung siaga kebakaran', '1 Unit APAR / 2 Ember'),
    ('Radio Komunikasi / HT', 'Telekomunikasi Darurat', 'Handy Talky frekuensi VHF/UHF terkoneksi ke Posko Satpol PP HST', '1 Unit / Pos'),
    ('Lampu Panel Surya', 'Penerangan Darurat', 'Lampu darurat tenaga surya otomatis menyala saat pemadaman listrik', '1 Unit / Pos')
ON CONFLICT (nama_fasilitas) DO NOTHING;

-- B. Master 11 Kecamatan di Hulu Sungai Tengah
INSERT INTO public.master_wilayah (kecamatan, desa_kelurahan, pusat_pemerintahan, kode_pos, tipe_wilayah, lat, lng)
VALUES
    ('Barabai', 'Barabai Barat', 'Barabai Barat', '71311', 'Kelurahan', -2.5833, 115.3811),
    ('Barabai', 'Barabai Timur', 'Barabai Barat', '71311', 'Kelurahan', -2.5855, 115.3860),
    ('Barabai', 'Barabai Selatan', 'Barabai Barat', '71311', 'Kelurahan', -2.5920, 115.3810),
    ('Barabai', 'Barabai Utara', 'Barabai Barat', '71311', 'Kelurahan', -2.5760, 115.3815),
    ('Batang Alai Selatan', 'Birayang', 'Birayang', '71361', 'Kelurahan', -2.6200, 115.4200),
    ('Batang Alai Timur', 'Tandilang', 'Tandilang', '71362', 'Desa', -2.6500, 115.5100),
    ('Batang Alai Utara', 'Ilung', 'Ilung', '71363', 'Desa', -2.5300, 115.4100),
    ('Batu Benawa', 'Pagat', 'Pagat', '71371', 'Desa', -2.6300, 115.3800),
    ('Hantakan', 'Hantakan', 'Hantakan', '71372', 'Desa', -2.6700, 115.4200),
    ('Haruyan', 'Haruyan', 'Haruyan', '71364', 'Desa', -2.6700, 115.3300),
    ('Labuan Amas Selatan', 'Pantai Hambawang Barat', 'Pantai Hambawang Barat', '71365', 'Desa', -2.6200, 115.3100),
    ('Labuan Amas Utara', 'Kasarangan', 'Kasarangan', '71366', 'Desa', -2.5700, 115.2800),
    ('Limanau', 'Limanau', 'Limanau', '71381', 'Desa', -2.7100, 115.4600),
    ('Pandawan', 'Pandawan', 'Pandawan', '71352', 'Desa', -2.5500, 115.3400)
ON CONFLICT (kecamatan, desa_kelurahan) DO NOTHING;

