# Debug Login Mahasiswa

## Langkah-langkah Debug

### 1. Cek Data Mahasiswa di Database

Jalankan query ini di Supabase SQL Editor:

```sql
-- Cek data mahasiswa dengan NIM 202522001
SELECT 
  m.id,
  m.nama,
  m.nim,
  m.kelas,
  m.prodi,
  m.user_id,
  m.created_at
FROM mahasiswa m
WHERE m.nim = '202522001';

-- Cek apakah ada di student_accounts (legacy)
SELECT 
  sa.id,
  sa.nim,
  sa.must_change_password,
  sa.created_at,
  m.nama
FROM student_accounts sa
LEFT JOIN mahasiswa m ON m.id = sa.mahasiswa_id
WHERE sa.nim = '202522001';

-- Cek user di Supabase Auth
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  app_metadata,
  user_metadata
FROM auth.users
WHERE email = '202522001@mcc.local';
```

### 2. Cek Log Browser Console

1. Buka halaman login mahasiswa: `/auth/mahasiswa/login`
2. Buka Browser Console (F12)
3. Masukkan NIM dan password
4. Klik "Masuk"
5. Lihat log yang muncul:
   - `[studentLogin] Attempting login for NIM:`
   - `[verifyMemberCredentials] Attempting login:`
   - `[verifyMemberCredentials] Login failed:` atau `Login successful`
   - `[studentLogin] Trying legacy login via RPC`
   - `[studentLogin] RPC result:`

### 3. Kemungkinan Error dan Solusi

#### Error 1: "NIM atau password salah"
**Penyebab**: 
- User belum dibuat di Supabase Auth
- Password tidak cocok
- Tidak ada entry di `student_accounts`

**Solusi**:
1. Login sebagai admin
2. Buka Dashboard > Mahasiswa
3. Cari mahasiswa dengan NIM tersebut
4. Klik tombol "Buat Akun Login" (icon UserPlus)

#### Error 2: "Terjadi kesalahan pada sistem mahasiswa"
**Penyebab**:
- Error di server
- Environment variable tidak lengkap
- Database migration belum dijalankan

**Solusi**:
1. Cek `.env.local` pastikan semua variable ada:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STUDENT_SESSION_SECRET`

2. Cek migration database sudah dijalankan semua

#### Error 3: "Akun anggota belum terhubung ke data mahasiswa"
**Penyebab**:
- User sudah ada di Supabase Auth tapi `user_id` di tabel `mahasiswa` NULL

**Solusi**:
```sql
-- Update user_id di tabel mahasiswa
UPDATE mahasiswa
SET user_id = (
  SELECT id FROM auth.users 
  WHERE email = '202522001@mcc.local'
)
WHERE nim = '202522001';
```

### 4. Test Manual Login

Setelah membuat akun, test dengan:
- **NIM**: `202522001`
- **Password**: `202522001`

Jika berhasil, mahasiswa akan diarahkan ke:
- `/student/change-password` (jika `must_change_password = true`)
- `/student/dashboard` (jika sudah ganti password)

### 5. Verifikasi Akun Sudah Dibuat

```sql
-- Cek status akun mahasiswa
SELECT 
  m.id,
  m.nama,
  m.nim,
  m.user_id,
  CASE 
    WHEN m.user_id IS NOT NULL THEN 'Siap Login'
    ELSE 'Belum Dibuat'
  END as status_akun,
  u.email,
  u.email_confirmed_at
FROM mahasiswa m
LEFT JOIN auth.users u ON u.id = m.user_id
WHERE m.nim = '202522001';
```

### 6. Reset Password Manual (Jika Perlu)

Jika lupa password atau ingin reset:

```sql
-- Reset password ke NIM (hanya bisa dilakukan oleh super admin)
-- Jalankan di Supabase SQL Editor dengan service_role key
```

Atau gunakan fungsi di aplikasi (akan ditambahkan jika perlu).

## Checklist Debug

- [ ] Data mahasiswa ada di tabel `mahasiswa`
- [ ] NIM sudah terisi dan benar
- [ ] Kolom `user_id` di tabel `mahasiswa` sudah terisi (bukan NULL)
- [ ] User ada di `auth.users` dengan email `{nim}@mcc.local`
- [ ] Password di Supabase Auth sudah di-set
- [ ] Environment variables lengkap di `.env.local`
- [ ] Browser console menunjukkan log yang jelas
- [ ] Tidak ada error di server logs

## Jika Masih Gagal

Silakan share:
1. Screenshot browser console (F12)
2. Hasil query SQL di atas
3. Error message yang muncul

Saya akan bantu debug lebih lanjut.
