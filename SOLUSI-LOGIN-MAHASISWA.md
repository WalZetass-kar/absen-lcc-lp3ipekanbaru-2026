# Solusi Login Mahasiswa

## Masalah
Mahasiswa dengan NIM `202522001` tidak bisa login meskipun data sudah ada di tabel `mahasiswa`.

## Root Cause
Ada 2 kemungkinan:

### 1. **Belum Ada Entry di `student_accounts`**
Tabel `mahasiswa` hanya menyimpan data mahasiswa (nama, kelas, prodi, nim).
Untuk login, mahasiswa harus memiliki entry di tabel `student_accounts` yang berisi:
- `mahasiswa_id` (foreign key ke tabel mahasiswa)
- `nim`
- `password_hash` (password yang di-hash dengan bcrypt)
- `must_change_password` (boolean)

### 2. **Password Hash Tidak Cocok**
Password di `student_accounts` harus di-hash menggunakan PostgreSQL `crypt()` function dengan bcrypt.

## Solusi

### Opsi 1: Buat Akun Melalui Admin Dashboard (RECOMMENDED)

1. Login sebagai admin
2. Buka **Dashboard > Mahasiswa**
3. Cari mahasiswa dengan NIM `202522001`
4. Jika ada tombol "Buat Akun" atau "Reset Password", klik tombol tersebut
5. Sistem akan otomatis:
   - Membuat entry di `student_accounts` dengan password = NIM
   - Atau membuat user di Supabase Auth
   - Set `must_change_password = true`

### Opsi 2: Insert Manual ke Database

Jalankan SQL berikut di Supabase SQL Editor:

```sql
-- Cek apakah mahasiswa sudah ada
SELECT id, nama, nim, kelas, prodi 
FROM mahasiswa 
WHERE nim = '202522001';

-- Jika mahasiswa ada, buat akun di student_accounts
-- Password default = NIM (202522001)
INSERT INTO student_accounts (mahasiswa_id, nim, password_hash, must_change_password)
SELECT 
  id,
  '202522001',
  crypt('202522001', gen_salt('bf')),
  true
FROM mahasiswa
WHERE nim = '202522001'
ON CONFLICT (nim) DO NOTHING;

-- Verifikasi akun sudah dibuat
SELECT sa.nim, sa.must_change_password, m.nama
FROM student_accounts sa
JOIN mahasiswa m ON m.id = sa.mahasiswa_id
WHERE sa.nim = '202522001';
```

### Opsi 3: Buat User di Supabase Auth

Jika ingin menggunakan Supabase Auth (lebih modern):

```sql
-- Cek apakah mahasiswa sudah ada
SELECT id, nama, nim, kelas, prodi 
FROM mahasiswa 
WHERE nim = '202522001';

-- Catat mahasiswa_id dari query di atas
-- Kemudian jalankan di aplikasi (bukan SQL):
```

Atau buat melalui kode:

```typescript
import { ensureMemberAuthUser } from '@/lib/member-auth'

// Jalankan di server action atau API route
await ensureMemberAuthUser({
  memberId: 'mahasiswa_id_dari_database',
  nim: '202522001',
  nama: 'Nama Mahasiswa',
  prodi: 'Manajemen Informatika',
  password: '202522001',
  mustChangePassword: true,
  syncPassword: true,
})
```

## Testing

Setelah membuat akun, test login dengan:
- **NIM**: `202522001`
- **Password**: `202522001`

Sistem akan meminta ganti password setelah login pertama.

## Debugging

Jika masih error, cek log di browser console (F12) untuk melihat:
- `[verifyMemberCredentials]` - Apakah mencoba login via Supabase Auth
- `[studentLogin]` - Apakah fallback ke legacy login
- `[studentLogin] RPC result` - Hasil dari fungsi `login_student`

## Catatan Penting

1. **Password Default = NIM**: Semua mahasiswa baru memiliki password default = NIM mereka
2. **Must Change Password**: Setelah login pertama, mahasiswa akan diminta ganti password
3. **Case Insensitive**: NIM tidak case-sensitive (202522001 = 202522001)
4. **Normalisasi**: NIM akan di-normalize (trim, lowercase) sebelum disimpan

## Cek Status Akun

Untuk mengecek apakah mahasiswa sudah memiliki akun:

```sql
-- Cek di student_accounts (legacy)
SELECT sa.nim, sa.must_change_password, m.nama, m.kelas
FROM student_accounts sa
JOIN mahasiswa m ON m.id = sa.mahasiswa_id
WHERE sa.nim = '202522001';

-- Cek di mahasiswa dengan user_id (Supabase Auth)
SELECT id, nama, nim, kelas, user_id
FROM mahasiswa
WHERE nim = '202522001';
```

Jika `user_id` NULL dan tidak ada di `student_accounts`, berarti akun belum dibuat.
