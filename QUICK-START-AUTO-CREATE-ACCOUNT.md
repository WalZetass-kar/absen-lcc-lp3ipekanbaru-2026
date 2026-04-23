# 🚀 Quick Start: Auto Create Akun Mahasiswa

## ⚡ Langkah Cepat (5 Menit)

### Step 1: Jalankan Database Trigger (RECOMMENDED)

1. Buka **Supabase Dashboard** → **SQL Editor**
2. Copy-paste isi file ini:
   ```
   supabase/migrations/20260416000001_auto_create_student_account_trigger.sql
   ```
3. Klik **Run**
4. ✅ Done! Sekarang setiap mahasiswa baru akan otomatis dibuatkan akun

### Step 2: Fix Mahasiswa yang Sudah Ada (Tanpa Akun)

1. Buka **Dashboard → Mahasiswa**
2. Lihat tombol **"Batch Create (X)"** di kanan atas
3. Klik tombol tersebut
4. Konfirmasi
5. ✅ Done! Semua mahasiswa sekarang punya akun

### Step 3: Test Login Mahasiswa

1. Buka `/auth/mahasiswa/login`
2. Login dengan:
   - **NIM**: `202522007` (contoh)
   - **Password**: `202522007` (sama dengan NIM)
3. ✅ Berhasil login!

---

## 🎯 Fitur Baru yang Tersedia

### 1. Batch Create Button
- **Lokasi**: Dashboard Mahasiswa (kanan atas)
- **Fungsi**: Buat akun untuk semua mahasiswa sekaligus
- **Tampilan**: Tombol biru dengan icon UserPlus dan angka

### 2. Reset Password Button
- **Lokasi**: Setiap baris mahasiswa (kolom Aksi)
- **Icon**: 🔑 (KeyRound)
- **Fungsi**: Reset password mahasiswa ke NIM

### 3. Create Account Button (Per Mahasiswa)
- **Lokasi**: Setiap baris mahasiswa tanpa akun (kolom Aksi)
- **Icon**: 👤 (UserPlus)
- **Fungsi**: Buat akun untuk 1 mahasiswa

### 4. Database Trigger (Auto)
- **Fungsi**: Otomatis buat akun saat tambah mahasiswa baru
- **Cara Kerja**: Background, tidak perlu klik apapun
- **Status**: Perlu jalankan migration SQL dulu

---

## 📊 Cara Cek Status Akun

### Via Dashboard
Buka **Dashboard → Mahasiswa**, lihat kolom **"Akun"**:
- ✅ **"Siap Login"** (badge hijau) = Akun sudah ada
- ⚠️ **"Belum Dibuat"** (badge abu-abu) = Akun belum ada

### Via SQL
```sql
-- Cek mahasiswa tanpa akun
SELECT nama, nim, user_id
FROM mahasiswa
WHERE user_id IS NULL AND nim IS NOT NULL;

-- Hitung total
SELECT 
  COUNT(*) FILTER (WHERE user_id IS NOT NULL) as dengan_akun,
  COUNT(*) FILTER (WHERE user_id IS NULL) as tanpa_akun
FROM mahasiswa
WHERE nim IS NOT NULL;
```

---

## 🔐 Format Login

- **URL**: `/auth/mahasiswa/login`
- **Username**: NIM (contoh: `202522007`)
- **Password**: NIM (lowercase, contoh: `202522007`)

**Catatan**: Password minimal 6 karakter. Jika NIM < 6 karakter, akan di-padding dengan '0'.

---

## ❓ FAQ

### Q: Batch Create tidak muncul?
**A**: Berarti semua mahasiswa sudah punya akun. Cek kolom "Akun" di tabel.

### Q: Mahasiswa tidak bisa login?
**A**: 
1. Cek apakah akun sudah dibuat (badge "Siap Login")
2. Pastikan password = NIM (lowercase)
3. Coba reset password dengan tombol 🔑

### Q: Trigger tidak jalan?
**A**: Pastikan sudah jalankan migration SQL di Supabase SQL Editor.

### Q: Error "SUPABASE_SERVICE_ROLE_KEY not found"?
**A**: Cek file `.env.local`, pastikan ada `SUPABASE_SERVICE_ROLE_KEY=...`

---

## 📁 File Penting

- `components/dashboard/mahasiswa-client.tsx` - UI dengan batch create button
- `app/api/batch-create-student-accounts/route.ts` - Batch create API
- `app/api/reset-student-password/route.ts` - Reset password API
- `supabase/migrations/20260416000001_auto_create_student_account_trigger.sql` - Database trigger
- `SOLUSI-COMPLETE-AUTO-CREATE-ACCOUNT.md` - Dokumentasi lengkap

---

## ✅ Checklist

- [ ] Jalankan migration trigger di Supabase SQL Editor
- [ ] Klik "Batch Create" untuk fix mahasiswa lama
- [ ] Test tambah mahasiswa baru (akun harus otomatis dibuat)
- [ ] Test login mahasiswa dengan NIM
- [ ] Verifikasi semua mahasiswa punya badge "Siap Login"

---

**Status**: ✅ Ready to Use  
**Dibuat**: 2026-04-16
