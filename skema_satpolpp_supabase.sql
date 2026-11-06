-- ==============================================================================
-- GARDA MURAKATA — SISTEM PENEGAKAN PERDA & TRANTIBUM
-- SATUAN POLISI PAMONG PRAJA KABUPATEN HULU SUNGAI TENGAH
-- ==============================================================================
-- Skema Database PostgreSQL + PostGIS (Supabase Ready)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. CUSTOM TYPES / ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'admin', 
        'user'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sumber_pelanggaran AS ENUM (
        'pengaduan', 
        'patroli', 
        'inisiatif_skpd'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tahap_tindak_lanjut AS ENUM (
        'pernyataan', 
        'sp1', 
        'sp2', 
        'sp3', 
        'eksekusi', 
        'selesai'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE status_pengaduan AS ENUM (
        'menunggu_verifikasi', 
        'diverifikasi', 
        'ditindaklanjuti', 
        'ditolak'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE status_patroli AS ENUM (
        'terjadwal', 
        'berlangsung', 
        'selesai', 
        'dibatalkan'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nama_lengkap VARCHAR(255) NOT NULL,
    nip VARCHAR(30) UNIQUE,
    no_hp VARCHAR(20),
    peran user_role NOT NULL DEFAULT 'user',
    regu VARCHAR(50),
    jabatan VARCHAR(100),
    avatar_url TEXT,
    aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. WILAYAH (Kabupaten Hulu Sungai Tengah)
CREATE TABLE IF NOT EXISTS public.wilayah (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kecamatan VARCHAR(100) NOT NULL,
    desa_kelurahan VARCHAR(100) NOT NULL,
    kode_pos VARCHAR(10),
    koordinat GEOGRAPHY(Point, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_kecamatan_desa UNIQUE (kecamatan, desa_kelurahan)
);

-- 5. PERDA / PERKADA REFERENSI
CREATE TABLE IF NOT EXISTS public.perda (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nomor VARCHAR(50) NOT NULL,
    tahun INT NOT NULL,
    tentang TEXT NOT NULL,
    pasal_relevan VARCHAR(100),
    deskripsi_pasal TEXT,
    kategori VARCHAR(100) DEFAULT 'Ketertiban Umum',
    sanksi_administratif TEXT,
    sanksi_pidana_denda NUMERIC(15, 2),
    sanksi_kurungan_hari INT,
    aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PELANGGAR (Master Data Identitas - OCR KTP/SIM)
CREATE TABLE IF NOT EXISTS public.pelanggar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nik VARCHAR(16) UNIQUE NOT NULL,
    nama_lengkap VARCHAR(255) NOT NULL,
    tempat_lahir VARCHAR(100),
    tanggal_lahir DATE,
    jenis_kelamin VARCHAR(20) CHECK (jenis_kelamin IN ('Laki-laki', 'Perempuan')),
    pekerjaan VARCHAR(100),
    alamat TEXT NOT NULL,
    rt_rw VARCHAR(10),
    desa_kelurahan VARCHAR(100),
    kecamatan VARCHAR(100),
    kabupaten_kota VARCHAR(100) DEFAULT 'Hulu Sungai Tengah',
    provinsi VARCHAR(100) DEFAULT 'Kalimantan Selatan',
    no_telepon VARCHAR(20),
    foto_identitas_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PENGADUAN MASYARAKAT (Kanal Publik)
CREATE TABLE IF NOT EXISTS public.pengaduan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nomor_tiket VARCHAR(30) UNIQUE NOT NULL,
    nama_pelapor VARCHAR(255) NOT NULL,
    no_telepon_pelapor VARCHAR(20) NOT NULL,
    email_pelapor VARCHAR(100),
    judul TEXT NOT NULL,
    deskripsi TEXT NOT NULL,
    alamat_kejadian TEXT NOT NULL,
    kecamatan VARCHAR(100) NOT NULL,
    desa_kelurahan VARCHAR(100),
    koordinat GEOGRAPHY(Point, 4326),
    foto_bukti_url TEXT,
    status status_pengaduan DEFAULT 'menunggu_verifikasi',
    catatan_verifikasi TEXT,
    diverifikasi_oleh UUID REFERENCES public.profiles(id),
    diverifikasi_pada TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PELANGGARAN (Kasus Kejadian)
CREATE TABLE IF NOT EXISTS public.pelanggaran (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nomor_register VARCHAR(50) UNIQUE NOT NULL,
    pelanggar_id UUID NOT NULL REFERENCES public.pelanggar(id) ON DELETE RESTRICT,
    sumber sumber_pelanggaran NOT NULL DEFAULT 'patroli',
    pengaduan_id UUID REFERENCES public.pengaduan(id) ON DELETE SET NULL,
    tanggal_kejadian TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    lokasi_nama_tempat VARCHAR(255),
    alamat_kejadian TEXT NOT NULL,
    kecamatan VARCHAR(100) NOT NULL,
    desa_kelurahan VARCHAR(100),
    koordinat GEOGRAPHY(Point, 4326) NOT NULL,
    deskripsi_kejadian TEXT,
    status_tindaklanjut tahap_tindak_lanjut NOT NULL DEFAULT 'pernyataan',
    is_selesai BOOLEAN DEFAULT false,
    petugas_pencatat_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. DETAIL PERDA (Many-to-Many Pelanggaran <-> Perda)
CREATE TABLE IF NOT EXISTS public.detail_perda (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pelanggaran_id UUID NOT NULL REFERENCES public.pelanggaran(id) ON DELETE CASCADE,
    perda_id UUID NOT NULL REFERENCES public.perda(id) ON DELETE RESTRICT,
    pasal_spesifik VARCHAR(100),
    uraian_pelanggaran TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_pelanggaran_perda UNIQUE (pelanggaran_id, perda_id)
);

-- 10. TINDAK LANJUT BERJENJANG (Pernyataan -> SP1 -> SP2 -> SP3 -> Eksekusi)
CREATE TABLE IF NOT EXISTS public.tindak_lanjut (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pelanggaran_id UUID NOT NULL REFERENCES public.pelanggaran(id) ON DELETE CASCADE,
    tahap tahap_tindak_lanjut NOT NULL,
    tanggal_tindak_lanjut TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    jatuh_tempo TIMESTAMPTZ,
    nomor_surat VARCHAR(100),
    file_surat_pdf_url TEXT,
    qr_verifikasi_code TEXT,
    catatan TEXT,
    bap_nomor VARCHAR(100),
    bap_file_url TEXT,
    petugas_id UUID REFERENCES public.profiles(id),
    disetujui_oleh UUID REFERENCES public.profiles(id),
    status_eksekusi VARCHAR(50) DEFAULT 'proses',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_pelanggaran_tahap UNIQUE (pelanggaran_id, tahap)
);

-- 11. BUKTI (Foto/Video/Dokumen Pendukung)
CREATE TABLE IF NOT EXISTS public.bukti (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pelanggaran_id UUID NOT NULL REFERENCES public.pelanggaran(id) ON DELETE CASCADE,
    tindak_lanjut_id UUID REFERENCES public.tindak_lanjut(id) ON DELETE CASCADE,
    tipe_media VARCHAR(20) DEFAULT 'foto' CHECK (tipe_media IN ('foto', 'video', 'dokumen_pdf')),
    file_url TEXT NOT NULL,
    nama_file VARCHAR(255),
    keterangan TEXT,
    koordinat GEOGRAPHY(Point, 4326),
    diambil_pada TIMESTAMPTZ DEFAULT NOW(),
    diunggah_oleh UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. JADWAL PATROLI
CREATE TABLE IF NOT EXISTS public.jadwal_patroli (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kode_patroli VARCHAR(30) UNIQUE NOT NULL,
    nama_kegiatan VARCHAR(255) NOT NULL,
    tanggal_patroli DATE NOT NULL,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    regu VARCHAR(50) NOT NULL,
    supervisor_id UUID REFERENCES public.profiles(id),
    rute_patroli TEXT NOT NULL,
    kecamatan_target VARCHAR(100) NOT NULL,
    status status_patroli DEFAULT 'terjadwal',
    catatan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. HASIL PATROLI
CREATE TABLE IF NOT EXISTS public.hasil_patroli (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jadwal_id UUID NOT NULL REFERENCES public.jadwal_patroli(id) ON DELETE CASCADE,
    petugas_id UUID NOT NULL REFERENCES public.profiles(id),
    waktu_checkin TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    waktu_checkout TIMESTAMPTZ,
    koordinat_checkin GEOGRAPHY(Point, 4326),
    koordinat_checkout GEOGRAPHY(Point, 4326),
    ringkasan_situasi TEXT NOT NULL,
    jumlah_teguran INT DEFAULT 0,
    jumlah_pelanggaran_tercatat INT DEFAULT 0,
    kondisi_keamanan VARCHAR(50) DEFAULT 'Kondusif',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 14. SPATIAL & PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_pelanggar_nik ON public.pelanggar(nik);
CREATE INDEX IF NOT EXISTS idx_pelanggar_nama ON public.pelanggar(nama_lengkap);

CREATE INDEX IF NOT EXISTS idx_pelanggaran_nomor_reg ON public.pelanggaran(nomor_register);
CREATE INDEX IF NOT EXISTS idx_pelanggaran_pelanggar ON public.pelanggaran(pelanggar_id);
CREATE INDEX IF NOT EXISTS idx_pelanggaran_status ON public.pelanggaran(status_tindaklanjut);
CREATE INDEX IF NOT EXISTS idx_pelanggaran_tgl ON public.pelanggaran(tanggal_kejadian);
CREATE INDEX IF NOT EXISTS idx_pelanggaran_kecamatan ON public.pelanggaran(kecamatan);
CREATE INDEX IF NOT EXISTS idx_pelanggaran_geom ON public.pelanggaran USING GIST(koordinat);

CREATE INDEX IF NOT EXISTS idx_pengaduan_geom ON public.pengaduan USING GIST(koordinat);
CREATE INDEX IF NOT EXISTS idx_bukti_geom ON public.bukti USING GIST(koordinat);
CREATE INDEX IF NOT EXISTS idx_wilayah_geom ON public.wilayah USING GIST(koordinat);

-- ==============================================================================
-- 15. AUTOMATIC TRIGGERS & FUNCTIONS
-- ==============================================================================

-- Trigger update timestamp
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_pelanggar_updated_at ON public.pelanggar;
CREATE TRIGGER trg_pelanggar_updated_at BEFORE UPDATE ON public.pelanggar FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_pelanggaran_updated_at ON public.pelanggaran;
CREATE TRIGGER trg_pelanggaran_updated_at BEFORE UPDATE ON public.pelanggaran FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_pengaduan_updated_at ON public.pengaduan;
CREATE TRIGGER trg_pengaduan_updated_at BEFORE UPDATE ON public.pengaduan FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto generate Nomor Register Pelanggaran (PLG-HST-YYYYMM-XXXX)
CREATE OR REPLACE FUNCTION generate_pelanggaran_reg_no()
RETURNS TRIGGER AS $$
DECLARE
    seq_num INT;
    prefix VARCHAR(30);
BEGIN
    prefix := 'PLG-HST-' || TO_CHAR(NOW(), 'YYYYMM') || '-';
    SELECT COALESCE(COUNT(*), 0) + 1 INTO seq_num 
    FROM public.pelanggaran 
    WHERE nomor_register LIKE prefix || '%';
    
    NEW.nomor_register := prefix || LPAD(seq_num::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pelanggaran_reg_no ON public.pelanggaran;
CREATE TRIGGER trg_pelanggaran_reg_no 
BEFORE INSERT ON public.pelanggaran 
FOR EACH ROW 
WHEN (NEW.nomor_register IS NULL OR NEW.nomor_register = '')
EXECUTE FUNCTION generate_pelanggaran_reg_no();

-- Auto generate Nomor Tiket Pengaduan (PGD-HST-YYYYMM-XXXX)
CREATE OR REPLACE FUNCTION generate_pengaduan_ticket_no()
RETURNS TRIGGER AS $$
DECLARE
    seq_num INT;
    prefix VARCHAR(30);
BEGIN
    prefix := 'PGD-HST-' || TO_CHAR(NOW(), 'YYYYMM') || '-';
    SELECT COALESCE(COUNT(*), 0) + 1 INTO seq_num 
    FROM public.pengaduan 
    WHERE nomor_tiket LIKE prefix || '%';
    
    NEW.nomor_tiket := prefix || LPAD(seq_num::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pengaduan_ticket_no ON public.pengaduan;
CREATE TRIGGER trg_pengaduan_ticket_no 
BEFORE INSERT ON public.pengaduan 
FOR EACH ROW 
WHEN (NEW.nomor_tiket IS NULL OR NEW.nomor_tiket = '')
EXECUTE FUNCTION generate_pengaduan_ticket_no();

-- ==============================================================================
-- 16. STORAGE BUCKETS (Supabase Storage Initialization)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('bukti-pelanggaran', 'bukti-pelanggaran', true),
    ('arsip-surat', 'arsip-surat', false),
    ('dokumen-bap', 'dokumen-bap', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Public Read Bukti Pelanggaran" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'bukti-pelanggaran');

CREATE POLICY "Authenticated Upload Bukti Pelanggaran" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'bukti-pelanggaran' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated Read Arsip Surat" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'arsip-surat' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated Upload Arsip Surat" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'arsip-surat' AND auth.role() = 'authenticated');

-- ==============================================================================
-- 17. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wilayah ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pelanggar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pelanggaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detail_perda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tindak_lanjut ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bukti ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jadwal_patroli ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hasil_patroli ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengaduan ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION auth.current_user_role()
RETURNS user_role AS $$
    SELECT peran FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Master reference data: Read by all authenticated + public
CREATE POLICY "Wilayah read by anyone" ON public.wilayah FOR SELECT USING (true);
CREATE POLICY "Perda read by anyone" ON public.perda FOR SELECT USING (true);
CREATE POLICY "Perda edit by admin only" ON public.perda FOR ALL USING (auth.current_user_role() = 'admin');

-- Pengaduan: Public can insert without login
CREATE POLICY "Public can submit pengaduan" ON public.pengaduan FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can read own pengaduan by ticket" ON public.pengaduan FOR SELECT USING (true);
CREATE POLICY "Staff can update pengaduan" ON public.pengaduan FOR UPDATE USING (auth.role() = 'authenticated');

-- Pelanggar, Pelanggaran, Detail Perda, Bukti: Authenticated Satpol PP
CREATE POLICY "Satpol PP staff read pelanggar" ON public.pelanggar FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Satpol PP staff write pelanggar" ON public.pelanggar FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Satpol PP staff read pelanggaran" ON public.pelanggaran FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Satpol PP staff write pelanggaran" ON public.pelanggaran FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Satpol PP staff read detail_perda" ON public.detail_perda FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Satpol PP staff write detail_perda" ON public.detail_perda FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Satpol PP staff read bukti" ON public.bukti FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Satpol PP staff write bukti" ON public.bukti FOR ALL USING (auth.role() = 'authenticated');

-- Tindak Lanjut: PPNS & Eksekusi & Admin have special write privileges
CREATE POLICY "Staff read tindak_lanjut" ON public.tindak_lanjut FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authorized write tindak_lanjut" ON public.tindak_lanjut FOR ALL 
USING (
    auth.current_user_role() IN ('admin', 'user')
);

-- ==============================================================================
-- 18. SEED DATA HULU SUNGAI TENGAH (KECAMATAN & PERDA REFERENSI)
-- ==============================================================================
INSERT INTO public.wilayah (kecamatan, desa_kelurahan, kode_pos, koordinat)
VALUES 
    ('Barabai', 'Barabai Barat', '71311', ST_SetSRID(ST_MakePoint(115.3811, -2.5833), 4326)),
    ('Barabai', 'Barabai Timur', '71312', ST_SetSRID(ST_MakePoint(115.3855, -2.5850), 4326)),
    ('Barabai', 'Barabai Selatan', '71313', ST_SetSRID(ST_MakePoint(115.3800, -2.5900), 4326)),
    ('Barabai', 'Barabai Utara', '71314', ST_SetSRID(ST_MakePoint(115.3820, -2.5780), 4326)),
    ('Batang Alai Selatan', 'Birayang', '71361', ST_SetSRID(ST_MakePoint(115.4200, -2.6200), 4326)),
    ('Batang Alai Timur', 'Tandilang', '71362', ST_SetSRID(ST_MakePoint(115.5100, -2.6500), 4326)),
    ('Batang Alai Utara', 'Ilung', '71363', ST_SetSRID(ST_MakePoint(115.4100, -2.5300), 4326)),
    ('Haruyan', 'Haruyan', '71371', ST_SetSRID(ST_MakePoint(115.3100, -2.6700), 4326)),
    ('Hantakan', 'Pagat', '71372', ST_SetSRID(ST_MakePoint(115.4300, -2.6300), 4326)),
    ('Labuan Amas Selatan', 'Pantai Hambawang', '71352', ST_SetSRID(ST_MakePoint(115.2800, -2.6100), 4326)),
    ('Labuan Amas Utara', 'Kasarangan', '71353', ST_SetSRID(ST_MakePoint(115.2500, -2.5400), 4326)),
    ('Pandawan', 'Pandawan', '71351', ST_SetSRID(ST_MakePoint(115.3400, -2.5400), 4326)),
    ('Limpasu', 'Limpasu', '71364', ST_SetSRID(ST_MakePoint(115.4600, -2.4800), 4326)),
    ('Batu Benawa', 'Pagat Batu Benawa', '71373', ST_SetSRID(ST_MakePoint(115.4200, -2.6100), 4326))
ON CONFLICT (kecamatan, desa_kelurahan) DO NOTHING;

INSERT INTO public.perda (nomor, tahun, tentang, pasal_relevan, deskripsi_pasal, kategori, sanksi_administratif)
VALUES 
    ('Nomor 04', 2021, 'Penyelenggaraan Ketertiban Umum dan Ketenteraman Masyarakat', 'Pasal 12 Ayat 1', 'Larangan berdagang / berjualan di trotoar, bahu jalan, dan ruang milik jalan tanpa izin.', 'Ketertiban PKL & Jalan', 'Peringatan tertulis (SP1-SP3), penyitaan barang dagangan, hingga relokasi paksa.'),
    ('Nomor 04', 2021, 'Penyelenggaraan Ketertiban Umum dan Ketenteraman Masyarakat', 'Pasal 18 Ayat 2', 'Larangan membuang sampah sembarangan di bantaran sungai, selokan, dan fasilitas publik.', 'Kebersihan Lingkungan', 'Kerja sosial, denda administratif.'),
    ('Nomor 08', 2018, 'Pengendalian dan Pengawasan Minuman Beralkohol di Kab. Hulu Sungai Tengah', 'Pasal 7', 'Larangan memperjualbelikan, menimbun, atau mengonsumsi minuman beralkohol di wilayah HST.', 'Miras & Asusila', 'Penyitaan barang bukti, penyegelan tempat usaha, pelimpahan ke penyidikan PPNS/Pidana.'),
    ('Nomor 02', 2020, 'Kawasan Tanpa Rokok (KTR) di Kabupaten Hulu Sungai Tengah', 'Pasal 5', 'Larangan merokok di fasilitas pelayanan kesehatan, tempat proses belajar mengajar, dan tempat ibadah.', 'Kawasan Tanpa Rokok', 'Teguran lisan, peringatan tertulis, denda administratif.'),
    ('Nomor 06', 2019, 'Penyelenggaraan Reklame dan Media Luar Ruang', 'Pasal 14', 'Pemasangan baliho/spanduk komersial atau promosi tanpa izin retribusi atau kedaluwarsa.', 'Pajak & Reklame', 'Penurunan/pembongkaran reklame dan pemanggilan pemilik usaha.')
ON CONFLICT DO NOTHING;

