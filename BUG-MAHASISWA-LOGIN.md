# Bug: Mahasiswa Tidak Bisa Login

## Deskripsi Bug
Mahasiswa tidak bisa login dengan NIM `202522007` dan password yang sesuai. Error yang muncul: "Terjadi kesalahan pada sistem mahasiswa. Silakan coba lagi."

## Root Cause
Ada beberapa kemungkinan penyebab:

### 1. **Data Mahasiswa Belum Ada di Database**
   - Tabel `mahasiswa` mungkin kosong atau tidak ada data untuk NIM `202522007`
   - Tabel `student_accounts` mungkin belum memiliki entry untuk mahasiswa tersebut

### 2. **Password Hash Tidak Cocok**
   - Password di `student_accounts` menggunakan `crypt()` function
   - Password yang diinput mungkin tidak cocok dengan hash yang tersimpan

### 3. **User Belum Dibuat di Supabase Auth**
   - Sistem mencoba verifikasi melalui Supabase Auth terlebih dahulu
   - Jika user belum ada di Supabase Auth, akan fallback ke `student_accounts`
   - Jika kedua-duanya gagal, login akan gagal

## Solusi

### Solusi 1: Tambahkan Data Mahasiswa Melalui Admin Dashboard
1. Login sebagai admin
2. Buka halaman **Mahasiswa** di dashboard
3. Tambahkan mahasiswa baru dengan NIM `202522007`
4. Sistem akan otomatis membuat akun di Supabase Auth

### Solusi 2: Insert Data Manual ke Database

```sql
-- 1. Insert data mahasiswa
INSERT INTO mahasiswa (nama, kelas, prodi, nim)
VALUES ('Nama Mahasiswa', 'Web Design', 'Manajemen Informatika', '202522007');

-- 2. Insert student account dengan password = NIM
-- Password akan di-hash menggunakan crypt()
INSERT INTO student_accounts (mahasiswa_id, nim, password_hash, must_change_password)
SELECT 
  id,
  '202522007',
  crypt('202522007', gen_salt('bf')),
  true
FROM mahasiswa
WHERE nim = '202522007';
```

### Solusi 3: Cek Log untuk Debugging

Saya telah menambahkan logging di fungsi `studentLogin` untuk membantu debugging:

```typescript
console.log('[studentLogin] Attempting login for NIM:', normalizedNim)
console.log('[studentLogin] Auth successful, linking student')
console.log('[studentLogin] Trying legacy login via RPC')
console.log('[studentLogin] RPC result:', { data, error })
```

Untuk melihat log:
1. Buka browser console (F12)
2. Atau cek server logs jika running di development mode
3. Atau cek Vercel logs jika deployed

## Testing

Setelah menambahkan data mahasiswa, test login dengan:
- **NIM**: `202522007`
- **Password**: `202522007` (default password = NIM)
- Sistem akan meminta ganti password setelah login pertama

## Perubahan yang Sudah Dilakukan

1. ✅ Menambahkan lazy loading pada semua gambar
2. ✅ Menambahkan logging untuk debugging login mahasiswa
3. ✅ Memperbaiki error handling di `studentLogin` function
4. ✅ Menambahkan try-catch untuk fallback ke legacy login

## Next Steps

1. Cek apakah ada data di tabel `mahasiswa` dan `student_accounts`
2. Jika tidak ada, tambahkan data mahasiswa melalui admin dashboard
3. Test login dengan NIM dan password yang sesuai
4. Cek log untuk melihat di mana proses login gagal
