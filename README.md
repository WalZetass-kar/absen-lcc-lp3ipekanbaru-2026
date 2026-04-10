# 📊 LCC Attendance Management System

Sistem **Absensi Kegiatan LCC (Learning Community Club)** berbasis web yang dirancang untuk mengelola kehadiran mahasiswa dalam kegiatan rutin yang diadakan setiap hari **Sabtu**.

Website ini menyediakan dashboard admin dan dashboard mahasiswa untuk mempermudah pengelolaan absensi, monitoring kehadiran, serta dokumentasi kegiatan.

---

# 🚀 Features

## 👨‍💻 Admin Features

### 📋 Student Management

* Import mahasiswa dari **file Excel (.xlsx / .xls)**
* Format Excel: **NIM | Nama | Program Studi**
* Preview data sebelum import
* **Auto generate akun mahasiswa**
* Download template Excel

### 🔐 Multi Admin System

Role sistem:

* **Super Admin** – akses penuh ke sistem
* **Admin** – mengelola mahasiswa dan absensi
* **Operator** – membuka absensi dan melihat data

### 📅 Meeting Management

* Sistem **pertemuan otomatis setiap hari Sabtu**
* Nomor pertemuan otomatis
* Admin dapat membuka dan menutup absensi

### 📱 QR Code Attendance

* Admin membuat **QR Code absensi**
* Mahasiswa dapat **scan QR langsung dari kamera HP**
* Sistem mencegah **absensi ganda**

### 📊 Dashboard & Analytics

Statistik kehadiran dalam bentuk grafik:

* Kehadiran per pertemuan
* Kehadiran berdasarkan program studi
* Tren kehadiran mahasiswa

### ⚠ Attendance Monitoring

* Sistem mendeteksi mahasiswa dengan **kehadiran < 70%**
* Menampilkan **peringatan kehadiran rendah**

### 🏆 Student Leaderboard

Menampilkan **mahasiswa paling aktif** berdasarkan jumlah kehadiran.

### 📂 Documentation System

Admin dapat mengunggah:

* Foto kegiatan
* Judul kegiatan
* Deskripsi kegiatan
* Tanggal kegiatan

Dokumentasi ditampilkan dalam **gallery modern**.

### 📢 Announcement System

Admin dapat membuat pengumuman yang tampil di:

* Dashboard mahasiswa
* Halaman publik website

### 📑 Reports & Export

Admin dapat membuat laporan absensi:

* Export **Excel**
* Export **PDF**
* Print laporan

Format print termasuk **kolom tanda tangan mahasiswa**.

### 📜 Activity Log

Sistem mencatat aktivitas admin seperti:

* Login admin
* Import data mahasiswa
* Membuka / menutup absensi
* Export laporan

---

# 🎓 Student Features

### 🔐 Student Login

Mahasiswa dapat login menggunakan:

Username : **NIM**
Password : **NIM (default)**

Saat login pertama mahasiswa harus **mengganti password**.

### 📱 QR Attendance

Mahasiswa dapat melakukan absensi dengan:

* Scan QR Code
* Menggunakan **kamera browser HP**

### 📈 Attendance Progress

Mahasiswa dapat melihat:

* Total kehadiran
* Persentase kehadiran
* **Progress bar kehadiran**

### 🏅 Achievement Badge

Mahasiswa mendapatkan badge berdasarkan kehadiran:

* 🥉 Bronze – 5 kehadiran
* 🥈 Silver – 10 kehadiran
* 🥇 Gold – 15 kehadiran
* 💎 Platinum – 20 kehadiran

### 📜 Automatic Certificate

Mahasiswa dengan kehadiran **≥ 80%** dapat mengunduh **sertifikat otomatis (PDF)**.

Sertifikat berisi:

* Nama Mahasiswa
* NIM
* Program Studi
* Persentase Kehadiran
* Nama kegiatan
* Tanggal penerbitan

---

# 🌐 Public Website

Website juga memiliki halaman publik yang berisi:

* Tentang LCC
* Visi & Misi
* Jadwal kegiatan
* Dokumentasi kegiatan
* Pengumuman

---

# 🛠 Tech Stack

Project ini dibangun menggunakan teknologi modern:

* **Next.js**
* **React**
* **TypeScript**
* **Tailwind CSS**
* **Chart.js / Recharts**
* **Vercel Deployment**

---

# 📂 Project Structure

```
app/
components/
hooks/
lib/
public/
styles/
```

---

# ⚙ Installation

Clone repository:

```
git clone https://github.com/WalZetass-kar/absen-lcc-lp3ipekanbaru-2026
```

Install dependencies:

```
npm install
```

Run development server:

```
npm run dev
```

Open browser:

```
http://localhost:3000
```

---

# 🚀 Deployment

Project dapat dengan mudah dideploy menggunakan:

**Vercel**

---

# 👨‍💻 Author

Developed by:

**WalZetass-kar**

GitHub:
https://github.com/WalZetass-kar

---

# ⭐ Support

Jika project ini membantu atau kamu menyukainya, jangan lupa untuk memberikan **⭐ Star di repository ini**.
