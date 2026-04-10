/*
  # Admin bootstrap hardening and activity tables sync

  This migration keeps the repository schema aligned with the database used by
  the app and adds a safe first-time super admin bootstrap flow for fresh
  deployments.

  ## Adds
  1. activity_documentation
  2. admin_activity_log
  3. can_bootstrap_super_admin()
  4. bootstrap_super_admin()

  ## Updates
  1. handle_new_user() no longer trusts public role metadata
  2. create_admin_user() explicitly upserts the final profile role
*/

CREATE TABLE IF NOT EXISTS public.activity_documentation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  judul text NOT NULL,
  deskripsi text DEFAULT '',
  tanggal_kegiatan date NOT NULL,
  foto_url text,
  foto_path text DEFAULT '',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_documentation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Activity documentation viewable by authenticated users" ON public.activity_documentation;
CREATE POLICY "Activity documentation viewable by authenticated users"
  ON public.activity_documentation FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Activity documentation insertable by authenticated users" ON public.activity_documentation;
CREATE POLICY "Activity documentation insertable by authenticated users"
  ON public.activity_documentation FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Activity documentation updatable by authenticated users" ON public.activity_documentation;
CREATE POLICY "Activity documentation updatable by authenticated users"
  ON public.activity_documentation FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Activity documentation deletable by authenticated users" ON public.activity_documentation;
CREATE POLICY "Activity documentation deletable by authenticated users"
  ON public.activity_documentation FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_activity_documentation_tanggal
  ON public.activity_documentation(tanggal_kegiatan);

CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_nama text,
  aktivitas text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin activity log viewable by authenticated users" ON public.admin_activity_log;
CREATE POLICY "Admin activity log viewable by authenticated users"
  ON public.admin_activity_log FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin activity log insertable by authenticated users" ON public.admin_activity_log;
CREATE POLICY "Admin activity log insertable by authenticated users"
  ON public.admin_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id
  ON public.admin_activity_log(admin_id);

CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at
  ON public.admin_activity_log(created_at DESC);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
BEGIN
  INSERT INTO public.profiles (id, nama, email, role)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'nama'), ''), split_part(NEW.email, '@', 1)),
    NEW.email,
    'admin'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    nama = EXCLUDED.nama,
    email = EXCLUDED.email;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_bootstrap_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1
    FROM public.profiles
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.bootstrap_super_admin(
  p_email text,
  p_password text,
  p_nama text DEFAULT 'Super Admin'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user_id uuid := gen_random_uuid();
  v_email text := lower(trim(p_email));
  v_nama text := NULLIF(trim(COALESCE(p_nama, '')), '');
BEGIN
  IF NOT public.can_bootstrap_super_admin() THEN
    RAISE EXCEPTION 'Super admin awal sudah tersedia';
  END IF;

  IF v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'Email wajib diisi';
  END IF;

  IF p_password IS NULL OR length(trim(p_password)) < 6 THEN
    RAISE EXCEPTION 'Password minimal 6 karakter';
  END IF;

  IF v_nama IS NULL THEN
    v_nama := split_part(v_email, '@', 1);
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
    email_confirmed_at,
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
    jsonb_build_object('nama', v_nama),
    false,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
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

  INSERT INTO public.profiles (id, nama, email, role)
  VALUES (v_user_id, v_nama, v_email, 'super_admin')
  ON CONFLICT (id) DO UPDATE
  SET
    nama = EXCLUDED.nama,
    email = EXCLUDED.email,
    role = EXCLUDED.role;

  RETURN v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.can_bootstrap_super_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_super_admin(text, text, text) TO anon, authenticated;

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
  v_nama text := trim(p_nama);
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
    email_confirmed_at,
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
    jsonb_build_object('nama', v_nama),
    false,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
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

  INSERT INTO public.profiles (id, nama, email, role)
  VALUES (v_user_id, v_nama, v_email, p_role)
  ON CONFLICT (id) DO UPDATE
  SET
    nama = EXCLUDED.nama,
    email = EXCLUDED.email,
    role = EXCLUDED.role;

  RETURN v_user_id;
END;
$$;
