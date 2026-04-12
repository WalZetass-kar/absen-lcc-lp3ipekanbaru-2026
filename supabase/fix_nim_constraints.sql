-- ============================================================
-- FIX: Hardening NIM constraints di tabel mahasiswa
-- Jalankan di Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Pastikan kolom nim tidak boleh NULL dan di-lowercase
-- (jika belum ada constraint)
ALTER TABLE mahasiswa
  ALTER COLUMN nim SET NOT NULL;

-- 2. Tambahkan UNIQUE constraint pada nim jika belum ada
-- (safety net agar duplikasi tidak bisa terjadi dari luar kode)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'mahasiswa'::regclass
      AND contype = 'u'
      AND conname = 'mahasiswa_nim_unique'
  ) THEN
    ALTER TABLE mahasiswa
      ADD CONSTRAINT mahasiswa_nim_unique UNIQUE (nim);
    RAISE NOTICE 'UNIQUE constraint mahasiswa_nim_unique berhasil ditambahkan.';
  ELSE
    RAISE NOTICE 'UNIQUE constraint sudah ada, dilewati.';
  END IF;
END
$$;

-- 3. Tambahkan CHECK constraint panjang NIM (3-50 karakter)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'mahasiswa'::regclass
      AND contype = 'c'
      AND conname = 'mahasiswa_nim_length_check'
  ) THEN
    ALTER TABLE mahasiswa
      ADD CONSTRAINT mahasiswa_nim_length_check CHECK (
        LENGTH(TRIM(nim)) BETWEEN 3 AND 50
      );
    RAISE NOTICE 'CHECK constraint mahasiswa_nim_length_check berhasil ditambahkan.';
  ELSE
    RAISE NOTICE 'CHECK constraint sudah ada, dilewati.';
  END IF;
END
$$;

-- 4. Cek duplikasi NIM yang mungkin sudah ada sebelum constraint ditambahkan
SELECT nim, COUNT(*) AS jumlah
FROM mahasiswa
GROUP BY nim
HAVING COUNT(*) > 1
ORDER BY jumlah DESC;

-- 5. Cek mahasiswa yang belum ter-link ke Supabase Auth
SELECT id, nama, nim, user_id, created_at
FROM mahasiswa
WHERE user_id IS NULL
ORDER BY created_at DESC;

-- 6. Audit: tampilkan semua constraints di tabel mahasiswa
SELECT conname AS constraint_name, contype AS type,
       pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'mahasiswa'::regclass
ORDER BY contype, conname;
