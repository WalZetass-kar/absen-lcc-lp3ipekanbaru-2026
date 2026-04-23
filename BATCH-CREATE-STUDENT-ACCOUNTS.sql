-- ============================================
-- BATCH CREATE STUDENT ACCOUNTS
-- ============================================
-- Script untuk membuat akun untuk mahasiswa yang belum punya user_id
-- Jalankan query ini di Supabase SQL Editor

-- ============================================
-- STEP 1: CEK MAHASISWA YANG BELUM PUNYA AKUN
-- ============================================
SELECT 
  id,
  nama,
  nim,
  kelas,
  prodi,
  user_id,
  created_at
FROM mahasiswa
WHERE user_id IS NULL
  AND nim IS NOT NULL
  AND nim != ''
ORDER BY created_at DESC;

-- Catat semua NIM yang muncul di hasil query di atas
-- Anda perlu membuat akun untuk mereka via aplikasi


-- ============================================
-- STEP 2: CEK USER YANG SUDAH ADA DI AUTH
-- ============================================
-- Cek apakah ada user di auth.users yang belum ter-link ke mahasiswa
SELECT 
  u.id as user_id,
  u.email,
  u.created_at,
  u.email_confirmed_at,
  u.user_metadata->>'nim' as nim_from_metadata,
  u.user_metadata->>'nama' as nama_from_metadata,
  m.id as mahasiswa_id,
  m.nama as mahasiswa_nama
FROM auth.users u
LEFT JOIN mahasiswa m ON m.user_id = u.id
WHERE u.email LIKE '%@mcc.local'
  AND m.id IS NULL
ORDER BY u.created_at DESC;

-- Jika ada hasil, berarti ada user yang belum ter-link
-- Anda bisa link manual dengan query di bawah


-- ============================================
-- STEP 3: LINK USER YANG SUDAH ADA KE MAHASISWA
-- ============================================
-- Jika ada user di auth.users tapi belum ter-link ke mahasiswa
-- Ganti {nim} dengan NIM mahasiswa
-- Ganti {user_id} dengan user_id dari auth.users

-- Contoh:
-- UPDATE mahasiswa
-- SET user_id = 'user-id-dari-auth-users'
-- WHERE nim = '202522007';


-- ============================================
-- STEP 4: VERIFIKASI HASIL
-- ============================================
-- Cek semua mahasiswa dan status akun mereka
SELECT 
  m.id,
  m.nama,
  m.nim,
  m.kelas,
  m.prodi,
  m.user_id,
  u.email,
  u.email_confirmed_at,
  CASE 
    WHEN m.user_id IS NOT NULL AND u.id IS NOT NULL THEN '✅ Siap Login'
    WHEN m.user_id IS NOT NULL AND u.id IS NULL THEN '⚠️ User ID Invalid'
    ELSE '❌ Belum Dibuat'
  END as status_akun
FROM mahasiswa m
LEFT JOIN auth.users u ON u.id = m.user_id
ORDER BY 
  CASE 
    WHEN m.user_id IS NULL THEN 1
    WHEN u.id IS NULL THEN 2
    ELSE 3
  END,
  m.nama;


-- ============================================
-- STEP 5: STATISTIK
-- ============================================
SELECT 
  COUNT(*) as total_mahasiswa,
  COUNT(user_id) as punya_user_id,
  COUNT(*) - COUNT(user_id) as belum_punya_user_id,
  ROUND(COUNT(user_id)::numeric / COUNT(*)::numeric * 100, 2) as persentase_punya_akun
FROM mahasiswa
WHERE nim IS NOT NULL;


-- ============================================
-- CATATAN PENTING
-- ============================================
-- 1. SQL tidak bisa membuat user di Supabase Auth secara langsung
-- 2. Anda HARUS menggunakan aplikasi untuk membuat akun:
--    - Login sebagai admin
--    - Buka Dashboard > Mahasiswa
--    - Klik tombol UserPlus (👤+) untuk setiap mahasiswa yang belum punya akun
--
-- 3. Atau gunakan API endpoint untuk batch create (advanced)
--
-- 4. Password default = NIM (lowercase)
--    Contoh: NIM 202522007 → Password 202522007
--
-- 5. Setelah login pertama, mahasiswa diminta ganti password
