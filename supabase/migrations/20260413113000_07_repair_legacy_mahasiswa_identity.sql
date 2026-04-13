/*
  # Repair legacy mahasiswa identity schema

  The linked Supabase project still uses a legacy `public.mahasiswa` shape:
  - it does not have the `id` primary key expected by the app
  - its existing `user_id` column is being used as the legacy mahasiswa identifier
    and is referenced by `absensi.mahasiswa_id`, `student_accounts.mahasiswa_id`, etc.
  - those legacy `user_id` values are not linked to `auth.users`

  This script repairs the active database without breaking existing attendance data:
  1. Promote the legacy `mahasiswa.user_id` identifier into `mahasiswa.id`
  2. Add a new nullable `mahasiswa.user_id` column as the real FK to `auth.users`
  3. Normalize NIM values and backfill auth links where possible
  4. Re-apply the expected RLS policies for `mahasiswa` and `student_accounts`

  Safe to run repeatedly. On databases that already match the app schema, this
  migration is effectively a no-op plus policy/index normalization.
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'mahasiswa'
      AND column_name = 'user_id'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'mahasiswa'
      AND column_name = 'id'
  ) THEN
    ALTER TABLE public.mahasiswa RENAME COLUMN user_id TO id;
  END IF;
END $$;

ALTER TABLE public.mahasiswa
ADD COLUMN IF NOT EXISTS id uuid;

UPDATE public.mahasiswa
SET id = gen_random_uuid()
WHERE id IS NULL;

ALTER TABLE public.mahasiswa
ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE public.mahasiswa
ALTER COLUMN id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.mahasiswa'::regclass
      AND contype = 'p'
  ) THEN
    ALTER TABLE public.mahasiswa
      ADD CONSTRAINT mahasiswa_pkey PRIMARY KEY (id);
  END IF;
END $$;

ALTER TABLE public.mahasiswa
ADD COLUMN IF NOT EXISTS user_id uuid;

ALTER TABLE public.mahasiswa
ALTER COLUMN user_id DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.mahasiswa'::regclass
      AND conname = 'mahasiswa_user_id_fkey'
  ) THEN
    ALTER TABLE public.mahasiswa
      ADD CONSTRAINT mahasiswa_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

COMMENT ON COLUMN public.mahasiswa.id IS 'Canonical mahasiswa primary key used by all app relations';
COMMENT ON COLUMN public.mahasiswa.user_id IS 'Foreign key to auth.users.id for student login';

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

DROP INDEX IF EXISTS public.idx_mahasiswa_nim_unique;
DROP INDEX IF EXISTS public.idx_mahasiswa_user_id_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mahasiswa_nim_unique
ON public.mahasiswa ((lower(btrim(nim))))
WHERE nim IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mahasiswa_user_id_unique
ON public.mahasiswa (user_id)
WHERE user_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.absensi'::regclass
      AND conname = 'absensi_mahasiswa_id_fkey'
  ) THEN
    ALTER TABLE public.absensi
      ADD CONSTRAINT absensi_mahasiswa_id_fkey
      FOREIGN KEY (mahasiswa_id) REFERENCES public.mahasiswa(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.student_accounts'::regclass
      AND conname = 'student_accounts_mahasiswa_id_fkey'
  ) THEN
    ALTER TABLE public.student_accounts
      ADD CONSTRAINT student_accounts_mahasiswa_id_fkey
      FOREIGN KEY (mahasiswa_id) REFERENCES public.mahasiswa(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.student_permissions'::regclass
      AND conname = 'student_permissions_mahasiswa_id_fkey'
  ) THEN
    ALTER TABLE public.student_permissions
      ADD CONSTRAINT student_permissions_mahasiswa_id_fkey
      FOREIGN KEY (mahasiswa_id) REFERENCES public.mahasiswa(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.student_badges'::regclass
      AND conname = 'student_badges_mahasiswa_id_fkey'
  ) THEN
    ALTER TABLE public.student_badges
      ADD CONSTRAINT student_badges_mahasiswa_id_fkey
      FOREIGN KEY (mahasiswa_id) REFERENCES public.mahasiswa(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.student_certificates'::regclass
      AND conname = 'student_certificates_mahasiswa_id_fkey'
  ) THEN
    ALTER TABLE public.student_certificates
      ADD CONSTRAINT student_certificates_mahasiswa_id_fkey
      FOREIGN KEY (mahasiswa_id) REFERENCES public.mahasiswa(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.attendance_warnings'::regclass
      AND conname = 'attendance_warnings_mahasiswa_id_fkey'
  ) THEN
    ALTER TABLE public.attendance_warnings
      ADD CONSTRAINT attendance_warnings_mahasiswa_id_fkey
      FOREIGN KEY (mahasiswa_id) REFERENCES public.mahasiswa(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE public.mahasiswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_accounts ENABLE ROW LEVEL SECURITY;

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
