 sRETURNS TRIGGER AS $$
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
    END IF; a

    IF TG_OP = 'INSERT' THEN
        action_type := 'TAMBAH';
        IF TG_TABLE_NAME = 'satlinmas' THEN
            target_str := NEW.nama || COALESCE(' (' || NEW.no_registrasi || ')', '');
            detail_str := 'Pendaftaran personil Satlinmas di Desa ' || COALESCE(NEW.desa_kelurahan, '-') || ', Kec. ' || COALESCE(NEW.kecamatan, '-');
        ELSIF TG_TABLE_NAME = 'poskamling' THEN
            target_str := NEW.nama_poskamling;
            detail_str := 'Registrasi pos ronda baru di Desa ' || COALESCE(NEW.desa_kelurahan, '-') || ', Kec. ' || COALESCE(NEW.kecamatan, '-');
        ELSIF TG_TABLE_NAME = 'kegiatan_patroli' THEN
            target_str := NEW.judul_patroli;
            detail_str := 'Laporan patroli lapangan di Kec. ' || NEW.kecamatan || ' dengan situasi: ' || NEW.status_situasi::VARCHAR;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        action_type := 'EDIT';
        IF TG_TABLE_NAME = 'satlinmas' THEN
            target_str := NEW.nama || COALESCE(' (' || NEW.no_registrasi || ')', '');
            detail_str := 'Pembaruan data personil Satlinmas (Status: ' || COALESCE(NEW.status::VARCHAR, '-') || ')';
        ELSIF TG_TABLE_NAME = 'poskamling' THEN
            target_str := NEW.nama_poskamling;
            detail_str := 'Pembaruan kondisi fisik pos: ' || COALESCE(NEW.kondisi_fisik::VARCHAR, '-');
        ELSIF TG_TABLE_NAME = 'kegiatan_patroli' THEN
            target_str := NEW.judul_patroli;
            detail_str := 'Perubahan tindak lanjut patroli: ' || COALESCE(NEW.tindakan_diambil, '-');
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        action_type := 'HAPUS';
        IF TG_TABLE_NAME = 'satlinmas' THEN
            target_str := OLD.nama || COALESCE(' (' || OLD.no_registrasi || ')', '');
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

NOTIFY pgrst, 'reload schema';

