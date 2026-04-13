/*
  # Fix mahasiswa account flow for Supabase Auth

  This migration aligns the database with the current application flow:
  1. Create student auth user in `auth.users`
  2. Insert canonical student row in `public.mahasiswa`
  3. Link them through `public.mahasiswa.user_id`

  Notes:
  - `student_accounts` remains as a legacy compatibility table and is no longer
    the canonical source of truth for new student accounts.
  - Existing rows with `nim IS NULL` are preserved. Backfill those NIMs manually
    before forcing `mahasiswa.nim` to be `NOT NULL`.
*/

ALTER TABLE public.mahasiswa
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.mahasiswa.user_id IS 'Foreign key to auth.users.id for student login';

ALTER TABLE public.mahasiswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_accounts ENABLE ROW LEVEL SECURITY;

UPDATE public.mahasiswa
SET nim = NULL
WHERE nim IS NOT NULL
  AND btrim(nim) = '';

UPDATE public.student_accounts
SET nim = lower(btrim(nim))
WHERE nim IS NOT NULL;

UPDATE public.mahasiswa m
SET nim = lower(btrim(sa.nim))
FROM public.student_accounts sa
WHERE sa.mahasiswa_id = m.id
  AND sa.nim IS NOT NULL
  AND (m.nim IS NULL OR btrim(m.nim) = '');

UPDATE public.mahasiswa
SET nim = lower(btrim(nim))
WHERE nim IS NOT NULL;

UPDATE public.mahasiswa m
SET user_id = u.id
FROM auth.users u
WHERE m.user_id IS NULL
  AND m.nim IS NOT NULL
  AND (
    lower(coalesce(u.raw_user_meta_data->>'nim', '')) = lower(btrim(m.nim))
    OR split_part(lower(coalesce(u.email, '')), '@', 1) = lower(btrim(m.nim))
  );

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

DO $$
DECLARE
  duplicate_user_ids text;
BEGIN
  SELECT string_agg(user_id::text, ', ')
  INTO duplicate_user_ids
  FROM (
    SELECT user_id
    FROM public.mahasiswa
    WHERE user_id IS NOT NULL
    GROUP BY user_id
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_user_ids IS NOT NULL THEN
    RAISE EXCEPTION 'Migrasi dibatalkan karena user_id ganda ditemukan di mahasiswa: %', duplicate_user_ids;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.mahasiswa'::regclass
      AND conname = 'mahasiswa_nim_format_check'
  ) THEN
    ALTER TABLE public.mahasiswa
      ADD CONSTRAINT mahasiswa_nim_format_check
      CHECK (
        nim IS NULL OR (
          char_length(btrim(nim)) BETWEEN 3 AND 50
          AND lower(btrim(nim)) ~ '^[a-z0-9._-]+$'
        )
      ) NOT VALID;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mahasiswa_nim_unique
ON public.mahasiswa ((lower(btrim(nim))))
WHERE nim IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mahasiswa_user_id_unique
ON public.mahasiswa (user_id)
WHERE user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.is_admin_user(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = COALESCE(p_user_id, auth.uid())
      AND role IN ('admin', 'super_admin')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO authenticated;

DROP POLICY IF EXISTS "Mahasiswa viewable by authenticated users" ON public.mahasiswa;
DROP POLICY IF EXISTS "Mahasiswa insertable by authenticated users" ON public.mahasiswa;
DROP POLICY IF EXISTS "Mahasiswa updatable by authenticated users" ON public.mahasiswa;
DROP POLICY IF EXISTS "Mahasiswa deletable by authenticated users" ON public.mahasiswa;

DROP POLICY IF EXISTS "Mahasiswa readable by admin" ON public.mahasiswa;
DROP POLICY IF EXISTS "Mahasiswa readable by owner" ON public.mahasiswa;
DROP POLICY IF EXISTS "Mahasiswa insertable by admin" ON public.mahasiswa;
DROP POLICY IF EXISTS "Mahasiswa updatable by admin" ON public.mahasiswa;
DROP POLICY IF EXISTS "Mahasiswa deletable by admin" ON public.mahasiswa;

CREATE POLICY "Mahasiswa readable by admin"
  ON public.mahasiswa FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

CREATE POLICY "Mahasiswa readable by owner"
  ON public.mahasiswa FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Mahasiswa insertable by admin"
  ON public.mahasiswa FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_user());

CREATE POLICY "Mahasiswa updatable by admin"
  ON public.mahasiswa FOR UPDATE
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

CREATE POLICY "Mahasiswa deletable by admin"
  ON public.mahasiswa FOR DELETE
  TO authenticated
  USING (public.is_admin_user());

DROP POLICY IF EXISTS "Student accounts viewable by authenticated users" ON public.student_accounts;
DROP POLICY IF EXISTS "Student accounts insertable by authenticated users" ON public.student_accounts;
DROP POLICY IF EXISTS "Student accounts updatable by authenticated users" ON public.student_accounts;

DROP POLICY IF EXISTS "Student accounts readable by admin" ON public.student_accounts;
DROP POLICY IF EXISTS "Student accounts insertable by admin" ON public.student_accounts;
DROP POLICY IF EXISTS "Student accounts updatable by admin" ON public.student_accounts;
DROP POLICY IF EXISTS "Student accounts deletable by admin" ON public.student_accounts;

CREATE POLICY "Student accounts readable by admin"
  ON public.student_accounts FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

CREATE POLICY "Student accounts insertable by admin"
  ON public.student_accounts FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_user());

CREATE POLICY "Student accounts updatable by admin"
  ON public.student_accounts FOR UPDATE
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

CREATE POLICY "Student accounts deletable by admin"
  ON public.student_accounts FOR DELETE
  TO authenticated
  USING (public.is_admin_user());
