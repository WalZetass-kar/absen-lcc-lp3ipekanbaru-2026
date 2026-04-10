/*
  # Seed initial admin accounts

  Creates the default admin and super admin accounts for the LCC dashboard.
  This migration is idempotent:
  - it creates auth users if they do not exist yet
  - it preserves existing passwords when an account already exists
  - it always upserts the matching profile role and display name

  Initial passwords:
  - iwal@lcc.com -> kartika
  - ezzar@lcc.com -> ezzar123!
  - galang@lcc.com -> galang123!
  - wahana@lcc.com -> wahana123!
  - dimas@lcc.com -> dimas123!
*/

CREATE OR REPLACE FUNCTION public.seed_admin_account(
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
  v_email text := lower(trim(p_email));
  v_user_id uuid;
BEGIN
  IF p_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Role tidak valid: %', p_role;
  END IF;

  SELECT id
  INTO v_user_id
  FROM auth.users
  WHERE email = v_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

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
      jsonb_build_object('nama', trim(p_nama)),
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
  ELSE
    UPDATE auth.users
    SET
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('nama', trim(p_nama)),
      updated_at = now()
    WHERE id = v_user_id;
  END IF;

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
  SELECT
    v_user_id,
    v_user_id::text,
    'email',
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email),
    now(),
    now(),
    now()
  WHERE NOT EXISTS (
    SELECT 1
    FROM auth.identities
    WHERE user_id = v_user_id
      AND provider = 'email'
  );

  INSERT INTO public.profiles (id, nama, email, role)
  VALUES (v_user_id, trim(p_nama), v_email, p_role)
  ON CONFLICT (id) DO UPDATE
  SET
    nama = EXCLUDED.nama,
    email = EXCLUDED.email,
    role = EXCLUDED.role;

  RETURN v_user_id;
END;
$$;

SELECT public.seed_admin_account(
  'iwal@lcc.com',
  'kartika',
  'M Ihwal Maulana',
  'super_admin'
);

SELECT public.seed_admin_account(
  'ezzar@lcc.com',
  'ezzar123!',
  'Ezzar Muhammad Akbar Firdaus',
  'admin'
);

SELECT public.seed_admin_account(
  'galang@lcc.com',
  'galang123!',
  'Galang Febrian',
  'admin'
);

SELECT public.seed_admin_account(
  'wahana@lcc.com',
  'wahana123!',
  'Wahana Fazalsa',
  'admin'
);

SELECT public.seed_admin_account(
  'dimas@lcc.com',
  'dimas123!',
  'Dimas Mandala Putra',
  'admin'
);

DROP FUNCTION public.seed_admin_account(text, text, text, text);
