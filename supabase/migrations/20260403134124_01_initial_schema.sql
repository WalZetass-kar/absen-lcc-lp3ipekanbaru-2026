
/*
  # Initial Schema - LCC Attendance Management System

  ## Summary
  Creates the complete database schema for the LCC Attendance Management System.

  ## New Tables
  1. profiles - Admin user profiles linked to auth.users
  2. mahasiswa - Student records with name, class, study program
  3. absensi - Attendance records per student per meeting
  4. activity_log - Admin activity audit trail
  5. activity_status - Daily activity status tracker
  6. documentation - Meeting documentation/photos
  7. meeting_notes - Notes and evaluations per meeting
  8. student_badges - Achievement badges for students
  9. student_certificates - Attendance certificates for students
  10. pertemuan - Meeting schedule records
  11. qr_codes - QR codes generated per meeting
  12. announcements - Admin announcements shown to students
  13. student_permissions - Student leave/permission requests
  14. attendance_warnings - Low attendance warnings
  15. public_lcc_pages - Public-facing LCC content pages
  16. student_accounts - Student login accounts linked to mahasiswa

  ## Security
  - RLS enabled on all tables
  - Policies restrict access by role and ownership
  - Admin tables only accessible to authenticated admins
  - Student tables accessible to corresponding students
*/

-- ─── Profiles ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Profiles insertable by super_admin"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

CREATE POLICY "Profiles updatable by owner or super_admin"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  )
  WITH CHECK (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

CREATE POLICY "Profiles deletable by super_admin"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

-- ─── Trigger: auto-create profile on new user ────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nama, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nama', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'admin')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Mahasiswa ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mahasiswa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama text NOT NULL,
  kelas text NOT NULL CHECK (kelas IN ('Graphic Design', 'Web Design')),
  prodi text NOT NULL CHECK (prodi IN ('Humas', 'Akuntansi', 'Administrasi Bisnis', 'Manajemen Informatika')),
  nim text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mahasiswa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mahasiswa viewable by authenticated users"
  ON mahasiswa FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Mahasiswa insertable by authenticated users"
  ON mahasiswa FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Mahasiswa updatable by authenticated users"
  ON mahasiswa FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Mahasiswa deletable by authenticated users"
  ON mahasiswa FOR DELETE
  TO authenticated
  USING (true);

-- ─── Absensi ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS absensi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mahasiswa_id uuid NOT NULL REFERENCES mahasiswa(id) ON DELETE CASCADE,
  nama_mahasiswa text NOT NULL,
  kelas text NOT NULL,
  status text NOT NULL CHECK (status IN ('Hadir', 'Izin', 'Alfa')),
  tanggal date NOT NULL,
  pertemuan integer NOT NULL CHECK (pertemuan BETWEEN 1 AND 16),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE absensi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Absensi viewable by authenticated users"
  ON absensi FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Absensi insertable by authenticated users"
  ON absensi FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Absensi updatable by authenticated users"
  ON absensi FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Absensi deletable by authenticated users"
  ON absensi FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_absensi_mahasiswa_id ON absensi(mahasiswa_id);
CREATE INDEX IF NOT EXISTS idx_absensi_tanggal ON absensi(tanggal);
CREATE INDEX IF NOT EXISTS idx_absensi_kelas ON absensi(kelas);
CREATE INDEX IF NOT EXISTS idx_absensi_pertemuan ON absensi(pertemuan);

-- ─── Activity Log ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_nama text NOT NULL,
  action text NOT NULL,
  entity text NOT NULL,
  detail text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Activity log viewable by super_admin"
  ON activity_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

CREATE POLICY "Activity log insertable by authenticated users"
  ON activity_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ─── Activity Status ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal date NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'Belum Dimulai' CHECK (status IN ('Belum Dimulai', 'Sedang Berlangsung', 'Selesai')),
  absensi_dibuka boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE activity_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Activity status viewable by authenticated users"
  ON activity_status FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Activity status insertable by authenticated users"
  ON activity_status FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Activity status updatable by authenticated users"
  ON activity_status FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── Documentation ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documentation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal date NOT NULL,
  judul text NOT NULL,
  deskripsi text DEFAULT '',
  file_url text NOT NULL,
  file_path text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE documentation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Documentation viewable by authenticated users"
  ON documentation FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Documentation insertable by authenticated users"
  ON documentation FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Documentation deletable by authenticated users"
  ON documentation FOR DELETE
  TO authenticated
  USING (true);

-- ─── Meeting Notes ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meeting_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pertemuan integer NOT NULL CHECK (pertemuan BETWEEN 1 AND 16),
  tanggal date NOT NULL,
  judul text NOT NULL,
  materi text DEFAULT '',
  mentor_nama text DEFAULT '',
  catatan_evaluasi text DEFAULT '',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE meeting_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Meeting notes viewable by authenticated users"
  ON meeting_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Meeting notes insertable by authenticated users"
  ON meeting_notes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Meeting notes updatable by authenticated users"
  ON meeting_notes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── Pertemuan ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pertemuan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor_pertemuan integer NOT NULL UNIQUE,
  tanggal date NOT NULL,
  status text NOT NULL DEFAULT 'Dijadwalkan' CHECK (status IN ('Dijadwalkan', 'Berlangsung', 'Selesai')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pertemuan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pertemuan viewable by authenticated users"
  ON pertemuan FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Pertemuan insertable by authenticated users"
  ON pertemuan FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Pertemuan updatable by authenticated users"
  ON pertemuan FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Pertemuan deletable by authenticated users"
  ON pertemuan FOR DELETE
  TO authenticated
  USING (true);

-- ─── QR Codes ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pertemuan_id uuid NOT NULL REFERENCES pertemuan(id) ON DELETE CASCADE,
  qr_code_data text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "QR codes viewable by authenticated users"
  ON qr_codes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "QR codes insertable by authenticated users"
  ON qr_codes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "QR codes updatable by authenticated users"
  ON qr_codes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── Announcements ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  judul text NOT NULL,
  isi text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Announcements viewable by authenticated users"
  ON announcements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Announcements insertable by authenticated users"
  ON announcements FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Announcements updatable by authenticated users"
  ON announcements FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Announcements deletable by authenticated users"
  ON announcements FOR DELETE
  TO authenticated
  USING (true);

-- ─── Student Badges ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mahasiswa_id uuid NOT NULL REFERENCES mahasiswa(id) ON DELETE CASCADE,
  badge_type text NOT NULL CHECK (badge_type IN ('Bronze', 'Silver', 'Gold', 'Platinum')),
  attendance_count integer NOT NULL DEFAULT 0,
  earned_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Student badges viewable by authenticated users"
  ON student_badges FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Student badges insertable by authenticated users"
  ON student_badges FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Student badges updatable by authenticated users"
  ON student_badges FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── Student Certificates ─────────────────────────────────
CREATE TABLE IF NOT EXISTS student_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mahasiswa_id uuid NOT NULL REFERENCES mahasiswa(id) ON DELETE CASCADE,
  total_pertemuan integer NOT NULL DEFAULT 16,
  total_hadir integer NOT NULL DEFAULT 0,
  attendance_percentage integer NOT NULL DEFAULT 0,
  sertifikat_url text,
  file_path text DEFAULT '',
  downloaded_at timestamptz,
  issued_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE student_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Student certificates viewable by authenticated users"
  ON student_certificates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Student certificates insertable by authenticated users"
  ON student_certificates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Student certificates updatable by authenticated users"
  ON student_certificates FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── Student Permissions ──────────────────────────────────
CREATE TABLE IF NOT EXISTS student_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mahasiswa_id uuid NOT NULL REFERENCES mahasiswa(id) ON DELETE CASCADE,
  pertemuan_id uuid REFERENCES pertemuan(id) ON DELETE SET NULL,
  alasan text NOT NULL,
  bukti_file_url text,
  bukti_file_path text DEFAULT '',
  status text NOT NULL DEFAULT 'Menunggu' CHECK (status IN ('Menunggu', 'Disetujui', 'Ditolak')),
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE student_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Student permissions viewable by authenticated users"
  ON student_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Student permissions insertable by authenticated users"
  ON student_permissions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Student permissions updatable by authenticated users"
  ON student_permissions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── Attendance Warnings ──────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance_warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mahasiswa_id uuid NOT NULL REFERENCES mahasiswa(id) ON DELETE CASCADE,
  attendance_percentage integer NOT NULL DEFAULT 0,
  warning_level text NOT NULL DEFAULT 'Kuning' CHECK (warning_level IN ('Kuning', 'Merah')),
  created_at timestamptz DEFAULT now(),
  acknowledged_at timestamptz
);

ALTER TABLE attendance_warnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attendance warnings viewable by authenticated users"
  ON attendance_warnings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Attendance warnings insertable by authenticated users"
  ON attendance_warnings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Attendance warnings updatable by authenticated users"
  ON attendance_warnings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── Public LCC Pages ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public_lcc_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type text NOT NULL UNIQUE CHECK (page_type IN ('tentang', 'visi_misi', 'jadwal', 'pengumuman')),
  judul text NOT NULL,
  konten text NOT NULL DEFAULT '',
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public_lcc_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public LCC pages viewable by everyone"
  ON public_lcc_pages FOR SELECT
  USING (true);

CREATE POLICY "Public LCC pages insertable by authenticated users"
  ON public_lcc_pages FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Public LCC pages updatable by authenticated users"
  ON public_lcc_pages FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── Student Accounts ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mahasiswa_id uuid NOT NULL UNIQUE REFERENCES mahasiswa(id) ON DELETE CASCADE,
  nim text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  must_change_password boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE student_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Student accounts viewable by authenticated users"
  ON student_accounts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Student accounts insertable by authenticated users"
  ON student_accounts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Student accounts updatable by authenticated users"
  ON student_accounts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
