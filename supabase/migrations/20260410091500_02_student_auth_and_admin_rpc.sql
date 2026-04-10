/*
  # Student auth RPCs, public read policies, and admin management helpers

  This migration closes the gap between the app code and the database schema by:
  1. Allowing public/anon reads for published announcements and meeting schedules
  2. Adding SECURITY DEFINER RPCs for the custom student portal session flow
  3. Adding SECURITY DEFINER RPCs for creating and deleting admin auth users
*/

-- Public read access needed by the custom student portal flow
DROP POLICY IF EXISTS "Announcements viewable by everyone" ON announcements;
CREATE POLICY "Announcements viewable by everyone"
  ON announcements FOR SELECT
  TO anon
  USING (is_published = true);

DROP POLICY IF EXISTS "Pertemuan viewable by everyone" ON pertemuan;
CREATE POLICY "Pertemuan viewable by everyone"
  ON pertemuan FOR SELECT
  TO anon
  USING (true);

-- Student login using the custom student_accounts table
CREATE OR REPLACE FUNCTION public.login_student(
  p_nim text,
  p_password text
)
RETURNS TABLE (
  account_id uuid,
  mahasiswa_id uuid,
  nim text,
  nama text,
  kelas text,
  prodi text,
  must_change_password boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_account public.student_accounts%ROWTYPE;
  v_mahasiswa public.mahasiswa%ROWTYPE;
BEGIN
  SELECT *
  INTO v_account
  FROM public.student_accounts
  WHERE lower(nim) = lower(trim(p_nim));

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_account.password_hash <> extensions.crypt(p_password, v_account.password_hash) THEN
    RETURN;
  END IF;

  SELECT *
  INTO v_mahasiswa
  FROM public.mahasiswa
  WHERE id = v_account.mahasiswa_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    v_account.id,
    v_account.mahasiswa_id,
    v_account.nim,
    v_mahasiswa.nama,
    v_mahasiswa.kelas,
    v_mahasiswa.prodi,
    v_account.must_change_password;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_student_session(
  p_session_id uuid
)
RETURNS TABLE (
  mahasiswa_id uuid,
  nim text,
  nama text,
  kelas text,
  prodi text,
  must_change_password boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sa.mahasiswa_id,
    sa.nim,
    m.nama,
    m.kelas,
    m.prodi,
    sa.must_change_password
  FROM public.student_accounts sa
  JOIN public.mahasiswa m ON m.id = sa.mahasiswa_id
  WHERE sa.id = p_session_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.change_student_password(
  p_session_id uuid,
  p_old_password text,
  p_new_password text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_account public.student_accounts%ROWTYPE;
BEGIN
  SELECT *
  INTO v_account
  FROM public.student_accounts
  WHERE id = p_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session tidak valid';
  END IF;

  IF v_account.password_hash <> extensions.crypt(p_old_password, v_account.password_hash) THEN
    RAISE EXCEPTION 'Password lama salah';
  END IF;

  UPDATE public.student_accounts
  SET
    password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
    must_change_password = false,
    updated_at = now()
  WHERE id = v_account.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_student_attendance(
  p_session_id uuid
)
RETURNS SETOF public.absensi
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_mahasiswa_id uuid;
BEGIN
  SELECT mahasiswa_id
  INTO v_mahasiswa_id
  FROM public.student_accounts
  WHERE id = p_session_id;

  IF v_mahasiswa_id IS NULL THEN
    RAISE EXCEPTION 'Session tidak valid';
  END IF;

  RETURN QUERY
  SELECT a.*
  FROM public.absensi a
  WHERE a.mahasiswa_id = v_mahasiswa_id
  ORDER BY a.tanggal DESC, a.pertemuan DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_student_attendance_stats(
  p_session_id uuid
)
RETURNS TABLE (
  hadir bigint,
  izin bigint,
  alfa bigint,
  total bigint,
  percentage integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_mahasiswa_id uuid;
BEGIN
  SELECT mahasiswa_id
  INTO v_mahasiswa_id
  FROM public.student_accounts
  WHERE id = p_session_id;

  IF v_mahasiswa_id IS NULL THEN
    RAISE EXCEPTION 'Session tidak valid';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE status = 'Hadir')::bigint AS hadir,
    COUNT(*) FILTER (WHERE status = 'Izin')::bigint AS izin,
    COUNT(*) FILTER (WHERE status = 'Alfa')::bigint AS alfa,
    COUNT(*)::bigint AS total,
    CASE
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND((COUNT(*) FILTER (WHERE status = 'Hadir')::numeric / COUNT(*)::numeric) * 100)::integer
    END AS percentage
  FROM public.absensi
  WHERE mahasiswa_id = v_mahasiswa_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_student_permission(
  p_session_id uuid,
  p_pertemuan_id uuid,
  p_alasan text,
  p_bukti_file_url text DEFAULT NULL,
  p_bukti_file_path text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_mahasiswa_id uuid;
  v_nomor_pertemuan integer;
BEGIN
  SELECT mahasiswa_id
  INTO v_mahasiswa_id
  FROM public.student_accounts
  WHERE id = p_session_id;

  IF v_mahasiswa_id IS NULL THEN
    RAISE EXCEPTION 'Session tidak valid';
  END IF;

  SELECT nomor_pertemuan
  INTO v_nomor_pertemuan
  FROM public.pertemuan
  WHERE id = p_pertemuan_id;

  IF v_nomor_pertemuan IS NULL THEN
    RAISE EXCEPTION 'Pertemuan tidak ditemukan';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.student_permissions
    WHERE mahasiswa_id = v_mahasiswa_id
      AND pertemuan_id = p_pertemuan_id
      AND status IN ('Menunggu', 'Disetujui')
  ) THEN
    RAISE EXCEPTION 'Permintaan izin untuk pertemuan ini sudah ada';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.absensi
    WHERE mahasiswa_id = v_mahasiswa_id
      AND pertemuan = v_nomor_pertemuan
  ) THEN
    RAISE EXCEPTION 'Absensi untuk pertemuan ini sudah tercatat';
  END IF;

  INSERT INTO public.student_permissions (
    mahasiswa_id,
    pertemuan_id,
    alasan,
    bukti_file_url,
    bukti_file_path,
    status
  )
  VALUES (
    v_mahasiswa_id,
    p_pertemuan_id,
    p_alasan,
    p_bukti_file_url,
    COALESCE(p_bukti_file_path, ''),
    'Menunggu'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_student_permissions(
  p_session_id uuid
)
RETURNS TABLE (
  id uuid,
  pertemuan_id uuid,
  alasan text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  bukti_file_url text,
  bukti_file_path text,
  nomor_pertemuan integer,
  tanggal_pertemuan date
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_mahasiswa_id uuid;
BEGIN
  SELECT mahasiswa_id
  INTO v_mahasiswa_id
  FROM public.student_accounts
  WHERE id = p_session_id;

  IF v_mahasiswa_id IS NULL THEN
    RAISE EXCEPTION 'Session tidak valid';
  END IF;

  RETURN QUERY
  SELECT
    sp.id,
    sp.pertemuan_id,
    sp.alasan,
    sp.status,
    sp.created_at,
    sp.updated_at,
    sp.bukti_file_url,
    sp.bukti_file_path,
    p.nomor_pertemuan,
    p.tanggal AS tanggal_pertemuan
  FROM public.student_permissions sp
  LEFT JOIN public.pertemuan p ON p.id = sp.pertemuan_id
  WHERE sp.mahasiswa_id = v_mahasiswa_id
  ORDER BY sp.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_student_attendance_warnings(
  p_session_id uuid
)
RETURNS SETOF public.attendance_warnings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_mahasiswa_id uuid;
BEGIN
  SELECT mahasiswa_id
  INTO v_mahasiswa_id
  FROM public.student_accounts
  WHERE id = p_session_id;

  IF v_mahasiswa_id IS NULL THEN
    RAISE EXCEPTION 'Session tidak valid';
  END IF;

  RETURN QUERY
  SELECT aw.*
  FROM public.attendance_warnings aw
  WHERE aw.mahasiswa_id = v_mahasiswa_id
  ORDER BY aw.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.acknowledge_student_warning(
  p_session_id uuid,
  p_warning_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_mahasiswa_id uuid;
BEGIN
  SELECT mahasiswa_id
  INTO v_mahasiswa_id
  FROM public.student_accounts
  WHERE id = p_session_id;

  IF v_mahasiswa_id IS NULL THEN
    RAISE EXCEPTION 'Session tidak valid';
  END IF;

  UPDATE public.attendance_warnings
  SET acknowledged_at = now()
  WHERE id = p_warning_id
    AND mahasiswa_id = v_mahasiswa_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.scan_student_attendance(
  p_session_id uuid,
  p_qr_code_data text
)
RETURNS TABLE (
  success boolean,
  pertemuan_number integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_account public.student_accounts%ROWTYPE;
  v_mahasiswa public.mahasiswa%ROWTYPE;
  v_qr RECORD;
  v_existing RECORD;
BEGIN
  SELECT *
  INTO v_account
  FROM public.student_accounts
  WHERE id = p_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session tidak valid';
  END IF;

  SELECT *
  INTO v_mahasiswa
  FROM public.mahasiswa
  WHERE id = v_account.mahasiswa_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Data mahasiswa tidak ditemukan';
  END IF;

  SELECT
    qc.id,
    qc.pertemuan_id,
    p.nomor_pertemuan,
    p.tanggal
  INTO v_qr
  FROM public.qr_codes qc
  JOIN public.pertemuan p ON p.id = qc.pertemuan_id
  WHERE qc.qr_code_data = trim(p_qr_code_data)
    AND qc.is_active = true
  ORDER BY qc.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'QR code tidak valid atau sudah expired';
  END IF;

  SELECT id, status
  INTO v_existing
  FROM public.absensi
  WHERE mahasiswa_id = v_account.mahasiswa_id
    AND pertemuan = v_qr.nomor_pertemuan
  LIMIT 1;

  IF FOUND THEN
    IF v_existing.status = 'Izin' THEN
      UPDATE public.absensi
      SET
        status = 'Hadir',
        tanggal = v_qr.tanggal
      WHERE id = v_existing.id;

      RETURN QUERY
      SELECT true, v_qr.nomor_pertemuan;
      RETURN;
    END IF;

    RAISE EXCEPTION 'Anda sudah melakukan absensi untuk pertemuan ini';
  END IF;

  INSERT INTO public.absensi (
    mahasiswa_id,
    nama_mahasiswa,
    kelas,
    status,
    tanggal,
    pertemuan
  )
  VALUES (
    v_account.mahasiswa_id,
    v_mahasiswa.nama,
    v_mahasiswa.kelas,
    'Hadir',
    v_qr.tanggal,
    v_qr.nomor_pertemuan
  );

  RETURN QUERY
  SELECT true, v_qr.nomor_pertemuan;
END;
$$;

GRANT EXECUTE ON FUNCTION public.login_student(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_session(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.change_student_password(uuid, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_attendance(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_attendance_stats(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_student_permission(uuid, uuid, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_permissions(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_attendance_warnings(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.acknowledge_student_warning(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.scan_student_attendance(uuid, text) TO anon, authenticated;

-- Admin auth helpers used by the dashboard
CREATE OR REPLACE FUNCTION public.create_admin_user(
  p_email text,
  p_password text,
  p_nama text,
  p_role text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_requester_id uuid := auth.uid();
  v_user_id uuid := gen_random_uuid();
  v_is_super_admin boolean := false;
  v_email text := lower(trim(p_email));
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = v_requester_id
      AND role = 'super_admin'
  )
  INTO v_is_super_admin;

  IF NOT v_is_super_admin THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Role tidak valid';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM auth.users
    WHERE email = v_email
  ) THEN
    RAISE EXCEPTION 'Email sudah terdaftar';
  END IF;

  INSERT INTO auth.users (
    id,
    instance_id,
    role,
    aud,
    email,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    encrypted_password,
    created_at,
    updated_at,
    last_sign_in_at,
    email_confirmed_at,
    confirmed_at,
    confirmation_sent_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  )
  VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    v_email,
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    jsonb_build_object('nama', trim(p_nama), 'role', p_role),
    false,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    now(),
    now(),
    now(),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  INSERT INTO auth.identities (
    id,
    provider_id,
    provider,
    user_id,
    identity_data,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    v_user_id::text,
    'email',
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email),
    now(),
    now(),
    now()
  );

  RETURN v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_admin_user(
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_requester_id uuid := auth.uid();
  v_is_super_admin boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = v_requester_id
      AND role = 'super_admin'
  )
  INTO v_is_super_admin;

  IF NOT v_is_super_admin THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_user_id = v_requester_id THEN
    RAISE EXCEPTION 'Tidak bisa menghapus akun sendiri';
  END IF;

  DELETE FROM auth.identities WHERE user_id = p_user_id;
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_admin_user(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_admin_user(uuid) TO authenticated;
