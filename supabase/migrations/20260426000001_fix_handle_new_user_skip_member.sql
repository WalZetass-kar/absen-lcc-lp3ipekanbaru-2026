-- Fix: handle_new_user harus skip akun mahasiswa (account_type = 'member')
-- Sebelumnya semua akun baru otomatis mendapat profiles dengan role 'admin',
-- termasuk akun mahasiswa yang dibuat via ensureMemberAuthUser.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
BEGIN
  -- Skip akun mahasiswa — mereka tidak boleh masuk ke tabel profiles
  IF (NEW.raw_app_meta_data->>'account_type') = 'member' THEN
    RETURN NEW;
  END IF;

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

-- Hapus record profiles yang sudah terlanjur dibuat untuk akun mahasiswa
DELETE FROM public.profiles
WHERE id IN (
  SELECT u.id
  FROM auth.users u
  WHERE (u.raw_app_meta_data->>'account_type') = 'member'
);
