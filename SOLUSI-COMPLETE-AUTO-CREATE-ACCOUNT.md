# Solusi Lengkap: Auto Create Akun Mahasiswa

## 📋 Ringkasan Masalah

Ketika menambahkan mahasiswa baru melalui dashboard, akun login mahasiswa **TIDAK** otomatis dibuat di Supabase Auth, meskipun kode sudah memanggil `ensureMemberAuthUser()`. Akibatnya:
- Kolom `user_id` di tabel `mahasiswa` tetap `NULL`
- Mahasiswa tidak bisa login dengan NIM dan password
- Error: "NIM atau password salah"

## ✅ Solusi yang Telah Diimplementasikan

### 1. **Enhanced Logging** ✓
Semua fungsi terkait pembuatan akun sudah dilengkapi dengan logging detail:
- `lib/member-auth.ts` → `ensureMemberAuthUser()` 
- `lib/member-auth.ts` → `verifyMemberCredentials()`
- `lib/actions.ts` → `createMahasiswaWithAccount()`

### 2. **Batch Create Accounts Button** ✓
Tombol baru di dashboard mahasiswa untuk membuat akun secara massal:
- **Lokasi**: Dashboard Mahasiswa (tombol "Batch Create")
- **Fungsi**: Membuat akun untuk semua mahasiswa yang belum punya akun
- **API Endpoint**: `/api/batch-create-student-accounts`
- **File**: `components/dashboard/mahasiswa-client.tsx`

### 3. **Reset Password API** ✓
Endpoint untuk reset password mahasiswa ke NIM:
- **Endpoint**: `/api/reset-student-password`
- **Method**: POST
- **Body**: `{ "nim": "202522007" }`
- **Tombol**: 🔑 (KeyRound icon) di setiap baris mahasiswa yang sudah punya akun

### 4. **Database Trigger (BARU)** ✓
Trigger otomatis yang membuat akun saat mahasiswa baru ditambahkan:
- **File**: `supabase/migrations/20260416000001_auto_create_student_account_trigger.sql`
- **Fungsi**: `auto_create_student_auth_account()`
- **Trigger**: `trigger_auto_create_student_auth_account`

## 🚀 Cara Menggunakan

### Opsi 1: Batch Create (Untuk Mahasiswa yang Sudah Ada)

1. Buka **Dashboard → Mahasiswa**
2. Lihat tombol **"Batch Create (X)"** di kanan atas (X = jumlah mahasiswa tanpa akun)
3. Klik tombol tersebut
4. Konfirmasi dialog
5. Tunggu proses selesai
6. Lihat hasil detail (berhasil/gagal)

**Hasil:**
- Semua mahasiswa yang belum punya akun akan dibuatkan akun
- Password default = NIM (lowercase)
- Kolom `user_id` akan terisi
- Mahasiswa bisa langsung login

### Opsi 2: Database Trigger (Untuk Mahasiswa Baru)

1. **Jalankan Migration** di Supabase SQL Editor:
   ```bash
   # Copy isi file ini ke Supabase SQL Editor:
   supabase/migrations/20260416000001_auto_create_student_account_trigger.sql
   ```

2. **Tambah Mahasiswa Baru** seperti biasa melalui dashboard

3. **Akun Otomatis Dibuat** oleh trigger database

**Keuntungan:**
- ✅ Otomatis, tidak perlu klik tombol
- ✅ Bekerja untuk semua cara menambah mahasiswa (manual, import CSV)
- ✅ Tidak bergantung pada kode aplikasi
- ✅ Lebih reliable

### Opsi 3: Manual per Mahasiswa

1. Buka **Dashboard → Mahasiswa**
2. Cari mahasiswa yang belum punya akun (badge "Belum Dibuat")
3. Klik tombol **👤 (UserPlus icon)** di kolom Aksi
4. Akun akan dibuat untuk mahasiswa tersebut

## 🔍 Cara Cek Apakah Akun Sudah Dibuat

### Via Dashboard
- Buka **Dashboard → Mahasiswa**
- Lihat kolom **"Akun"**:
  - ✅ **"Siap Login"** (hijau) = Akun sudah ada
  - ⚠️ **"Belum Dibuat"** (abu-abu) = Akun belum ada

### Via SQL Query
```sql
-- Cek mahasiswa tanpa akun
SELECT id, nama, nim, user_id
FROM mahasiswa
WHERE user_id IS NULL
  AND nim IS NOT NULL
  AND nim != '';

-- Cek total mahasiswa dengan/tanpa akun
SELECT 
  COUNT(*) FILTER (WHERE user_id IS NOT NULL) as dengan_akun,
  COUNT(*) FILTER (WHERE user_id IS NULL) as tanpa_akun,
  COUNT(*) as total
FROM mahasiswa
WHERE nim IS NOT NULL AND nim != '';
```

### Via Supabase Auth Dashboard
1. Buka **Supabase Dashboard → Authentication → Users**
2. Cari email: `{nim}@mcc.local` (contoh: `202522007@mcc.local`)
3. Jika ada = akun sudah dibuat
4. Jika tidak ada = akun belum dibuat

## 🔐 Format Login Mahasiswa

- **Username/NIM**: NIM mahasiswa (contoh: `202522007`)
- **Password Default**: NIM (lowercase, contoh: `202522007`)
- **URL Login**: `/auth/mahasiswa/login`

**Catatan:**
- Password harus minimal 6 karakter
- Jika NIM < 6 karakter, password akan di-padding dengan '0' (contoh: NIM `123` → password `123000`)
- Mahasiswa akan diminta ganti password saat login pertama kali

## 🛠️ Troubleshooting

### Problem: Batch Create Gagal

**Cek:**
1. **Environment Variable**
   ```bash
   # Pastikan ada di .env.local
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```

2. **Permissions**
   - Service role key harus valid
   - Harus punya akses ke `auth.users` table

3. **Browser Console**
   - Buka Developer Tools → Console
   - Lihat error message detail

**Solusi:**
- Restart development server setelah update `.env.local`
- Verifikasi service role key di Supabase Dashboard → Settings → API

### Problem: Trigger Tidak Jalan

**Cek:**
1. **Migration Sudah Dijalankan?**
   ```sql
   -- Cek apakah trigger ada
   SELECT * FROM pg_trigger 
   WHERE tgname = 'trigger_auto_create_student_auth_account';
   ```

2. **Function Ada?**
   ```sql
   -- Cek apakah function ada
   SELECT * FROM pg_proc 
   WHERE proname = 'auto_create_student_auth_account';
   ```

**Solusi:**
- Jalankan ulang migration file
- Pastikan tidak ada error saat menjalankan SQL

### Problem: Mahasiswa Tidak Bisa Login

**Cek:**
1. **Akun Sudah Dibuat?**
   ```sql
   SELECT user_id FROM mahasiswa WHERE nim = '202522007';
   ```

2. **Password Benar?**
   - Password = NIM (lowercase)
   - Coba reset password dengan tombol 🔑

3. **Email Confirmed?**
   ```sql
   SELECT email, email_confirmed_at 
   FROM auth.users 
   WHERE email = '202522007@mcc.local';
   ```

**Solusi:**
- Gunakan tombol Reset Password (🔑) di dashboard
- Atau jalankan SQL:
  ```sql
  UPDATE auth.users
  SET encrypted_password = crypt('202522007', gen_salt('bf')),
      email_confirmed_at = NOW()
  WHERE email = '202522007@mcc.local';
  ```

## 📊 Monitoring & Logs

### Server Logs (Development)
```bash
# Terminal tempat npm run dev berjalan
# Cari log dengan prefix:
[ensureMemberAuthUser]
[createMahasiswaWithAccount]
[verifyMemberCredentials]
[batch-create]
```

### Browser Console Logs
```javascript
// Buka Developer Tools → Console
// Filter dengan keyword:
handleBatchCreateAccounts
handleSyncAccount
handleResetPassword
```

### Database Logs
```sql
-- Lihat log dari trigger
-- (Jika Supabase logging enabled)
SELECT * FROM postgres_logs
WHERE message LIKE '%auto_create_student_auth_account%'
ORDER BY timestamp DESC
LIMIT 20;
```

## 📝 File-File yang Dimodifikasi

### Backend
1. `lib/member-auth.ts` - Enhanced logging
2. `lib/actions.ts` - Enhanced logging
3. `app/api/batch-create-student-accounts/route.ts` - Batch create endpoint
4. `app/api/reset-student-password/route.ts` - Reset password endpoint

### Frontend
1. `components/dashboard/mahasiswa-client.tsx` - Batch create button & UI
2. `app/dashboard/mahasiswa/batch-create-accounts.tsx` - Batch create component (standalone)

### Database
1. `supabase/migrations/20260416000001_auto_create_student_account_trigger.sql` - Auto create trigger

### Documentation
1. `SOLUSI-COMPLETE-AUTO-CREATE-ACCOUNT.md` - Dokumentasi lengkap (file ini)
2. `BATCH-CREATE-STUDENT-ACCOUNTS.sql` - SQL queries helper

## 🎯 Rekomendasi

### Untuk Production
1. ✅ **Gunakan Database Trigger** (Opsi 2)
   - Paling reliable
   - Otomatis untuk semua cara input
   - Tidak bergantung pada kode aplikasi

2. ✅ **Batch Create sebagai Backup** (Opsi 1)
   - Untuk fix mahasiswa lama yang belum punya akun
   - Untuk recovery jika trigger gagal

3. ✅ **Monitor Logs**
   - Setup logging/monitoring di production
   - Alert jika ada mahasiswa tanpa akun

### Untuk Development
1. Jalankan migration trigger
2. Test dengan menambah mahasiswa baru
3. Verifikasi akun otomatis dibuat
4. Test login mahasiswa

## 🔄 Next Steps

1. **Jalankan Migration Trigger**
   ```bash
   # Copy isi file ke Supabase SQL Editor dan execute:
   supabase/migrations/20260416000001_auto_create_student_account_trigger.sql
   ```

2. **Test Batch Create**
   - Buka dashboard mahasiswa
   - Klik tombol "Batch Create"
   - Verifikasi hasil

3. **Test Auto Create**
   - Tambah mahasiswa baru
   - Cek apakah akun otomatis dibuat
   - Test login dengan NIM

4. **Monitor**
   - Cek logs di terminal
   - Cek browser console
   - Verifikasi di Supabase Auth dashboard

## ✨ Kesimpulan

Sekarang ada **3 cara** untuk membuat akun mahasiswa:

1. **Otomatis via Trigger** (Recommended) - Saat tambah mahasiswa baru
2. **Batch Create** - Untuk mahasiswa yang sudah ada tanpa akun
3. **Manual per Mahasiswa** - Klik tombol UserPlus di dashboard

Semua cara menggunakan password default = NIM (lowercase).

---

**Dibuat**: 2026-04-16  
**Status**: ✅ Implemented & Ready to Use
