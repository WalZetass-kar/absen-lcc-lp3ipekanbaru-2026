-- ============================================================
-- MANUAL SQL EDITOR RUNBOOK
-- Sinkronisasi flow mahasiswa -> Supabase Auth
-- ============================================================
--
-- Jalankan terlebih dahulu migration:
--   supabase/migrations/20260413090000_06_fix_mahasiswa_auth_flow.sql
--
-- File ini berisi query audit yang aman dijalankan berulang kali
-- setelah migration selesai.

-- 1. Pastikan kolom `user_id` sudah ada di tabel mahasiswa
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'mahasiswa'
  AND column_name IN ('nim', 'user_id')
ORDER BY column_name;

-- 2. Audit jumlah data mahasiswa yang belum punya NIM / belum terhubung auth.users
SELECT
  COUNT(*) AS total_mahasiswa,
  COUNT(*) FILTER (WHERE nim IS NULL OR btrim(nim) = '') AS mahasiswa_tanpa_nim,
  COUNT(*) FILTER (WHERE user_id IS NULL) AS mahasiswa_tanpa_user_id
FROM public.mahasiswa;

-- 3. Audit data mahasiswa yang masih belum lengkap
SELECT id, nama, nim, user_id, created_at
FROM public.mahasiswa
WHERE nim IS NULL
   OR btrim(coalesce(nim, '')) = ''
   OR user_id IS NULL
ORDER BY created_at DESC
LIMIT 100;

-- 4. Audit data auth student berbasis email/metadata NIM
SELECT
  u.id,
  u.email,
  u.raw_user_meta_data->>'nim' AS nim_metadata,
  u.raw_app_meta_data->>'account_type' AS account_type,
  u.created_at
FROM auth.users u
WHERE split_part(lower(coalesce(u.email, '')), '@', 2) = 'mcc.local'
   OR lower(coalesce(u.raw_app_meta_data->>'account_type', '')) = 'member'
ORDER BY u.created_at DESC;

-- 5. Audit tabel legacy student_accounts
SELECT
  COUNT(*) AS total_student_accounts,
  COUNT(*) FILTER (WHERE nim IS NULL OR btrim(nim) = '') AS student_accounts_tanpa_nim
FROM public.student_accounts;

SELECT id, mahasiswa_id, nim, must_change_password, created_at
FROM public.student_accounts
ORDER BY created_at DESC
LIMIT 100;

-- 6. Audit policy aktif untuk mahasiswa dan student_accounts
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('mahasiswa', 'student_accounts')
ORDER BY tablename, policyname;
