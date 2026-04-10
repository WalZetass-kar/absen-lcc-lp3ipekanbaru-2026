/*
  # Member auth support for MCC attendance

  This migration keeps `public.mahasiswa` as the canonical table used by the
  existing application, then adds the fields required for Supabase Auth-backed
  member accounts and a compatibility view named `public.members`.
*/

ALTER TABLE public.mahasiswa
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

UPDATE public.mahasiswa
SET nim = NULL
WHERE nim IS NOT NULL
  AND btrim(nim) = '';

UPDATE public.mahasiswa
SET nim = lower(btrim(nim))
WHERE nim IS NOT NULL;

DO $$
DECLARE
  duplicate_nims text;
BEGIN
  SELECT string_agg(normalized_nim, ', ')
  INTO duplicate_nims
  FROM (
    SELECT lower(btrim(nim)) AS normalized_nim
    FROM public.mahasiswa
    WHERE nim IS NOT NULL
    GROUP BY 1
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_nims IS NOT NULL THEN
    RAISE EXCEPTION 'Migrasi dibatalkan karena NIM duplikat ditemukan: %', duplicate_nims;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mahasiswa_nim_unique
ON public.mahasiswa ((lower(btrim(nim))))
WHERE nim IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mahasiswa_user_id_unique
ON public.mahasiswa (user_id)
WHERE user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF COALESCE(NEW.raw_app_meta_data->>'account_type', 'admin') = 'admin' THEN
    INSERT INTO public.profiles (id, nama, email, role)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'nama', split_part(NEW.email, '@', 1)),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'role', 'admin')
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;

DROP VIEW IF EXISTS public.members;
CREATE VIEW public.members AS
SELECT
  id,
  nim,
  nama,
  prodi,
  kelas,
  user_id,
  created_at
FROM public.mahasiswa;

GRANT SELECT ON public.members TO authenticated;
