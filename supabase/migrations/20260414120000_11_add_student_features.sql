-- Migration: Add Student Features
-- Created: 2026-04-14
-- Description: Add tables for leaderboard, calendar, badges, materials, feedback, and QR history

-- 1. Add profile_photo_url to mahasiswa table
ALTER TABLE mahasiswa 
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- 2. Create announcements_read table (track which announcements student has read)
CREATE TABLE IF NOT EXISTS announcements_read (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mahasiswa_id UUID NOT NULL REFERENCES mahasiswa(id) ON DELETE CASCADE,
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(mahasiswa_id, announcement_id)
);

-- 3. Create qr_scan_history table (track QR scan attempts)
CREATE TABLE IF NOT EXISTS qr_scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mahasiswa_id UUID NOT NULL REFERENCES mahasiswa(id) ON DELETE CASCADE,
  pertemuan_id UUID NOT NULL REFERENCES pertemuan(id) ON DELETE CASCADE,
  qr_code_data TEXT NOT NULL,
  scan_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create meeting_feedback table (student feedback for meetings)
CREATE TABLE IF NOT EXISTS meeting_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mahasiswa_id UUID NOT NULL REFERENCES mahasiswa(id) ON DELETE CASCADE,
  pertemuan_id UUID NOT NULL REFERENCES pertemuan(id) ON DELETE CASCADE,
  rating_materi INTEGER CHECK (rating_materi >= 1 AND rating_materi <= 5),
  rating_mentor INTEGER CHECK (rating_mentor >= 1 AND rating_mentor <= 5),
  komentar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(mahasiswa_id, pertemuan_id)
);

-- 5. Create student_achievements table (track achievements/badges)
CREATE TABLE IF NOT EXISTS student_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mahasiswa_id UUID NOT NULL REFERENCES mahasiswa(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL, -- 'perfect_attendance', 'early_bird', 'comeback_king', etc.
  achievement_name TEXT NOT NULL,
  achievement_description TEXT,
  icon TEXT,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_announcements_read_mahasiswa ON announcements_read(mahasiswa_id);
CREATE INDEX IF NOT EXISTS idx_announcements_read_announcement ON announcements_read(announcement_id);
CREATE INDEX IF NOT EXISTS idx_qr_scan_history_mahasiswa ON qr_scan_history(mahasiswa_id);
CREATE INDEX IF NOT EXISTS idx_qr_scan_history_pertemuan ON qr_scan_history(pertemuan_id);
CREATE INDEX IF NOT EXISTS idx_meeting_feedback_mahasiswa ON meeting_feedback(mahasiswa_id);
CREATE INDEX IF NOT EXISTS idx_meeting_feedback_pertemuan ON meeting_feedback(pertemuan_id);
CREATE INDEX IF NOT EXISTS idx_student_achievements_mahasiswa ON student_achievements(mahasiswa_id);

-- 7. Enable RLS
ALTER TABLE announcements_read ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_achievements ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for announcements_read
CREATE POLICY "Students can view their own read announcements"
  ON announcements_read FOR SELECT
  USING (true);

CREATE POLICY "Students can mark announcements as read"
  ON announcements_read FOR INSERT
  WITH CHECK (true);

-- 9. RLS Policies for qr_scan_history
CREATE POLICY "Students can view their own QR scan history"
  ON qr_scan_history FOR SELECT
  USING (true);

CREATE POLICY "System can insert QR scan history"
  ON qr_scan_history FOR INSERT
  WITH CHECK (true);

-- 10. RLS Policies for meeting_feedback
CREATE POLICY "Students can view their own feedback"
  ON meeting_feedback FOR SELECT
  USING (true);

CREATE POLICY "Students can insert their own feedback"
  ON meeting_feedback FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Students can update their own feedback"
  ON meeting_feedback FOR UPDATE
  USING (true);

-- 11. RLS Policies for student_achievements
CREATE POLICY "Students can view their own achievements"
  ON student_achievements FOR SELECT
  USING (true);

CREATE POLICY "System can insert achievements"
  ON student_achievements FOR INSERT
  WITH CHECK (true);

-- 12. Create view for leaderboard
CREATE OR REPLACE VIEW student_leaderboard AS
SELECT 
  m.id,
  m.nama,
  m.nim,
  m.kelas,
  m.prodi,
  m.profile_photo_url,
  COUNT(CASE WHEN a.status = 'Hadir' THEN 1 END) as hadir_count,
  COUNT(a.id) as total_pertemuan,
  ROUND(
    (COUNT(CASE WHEN a.status = 'Hadir' THEN 1 END)::NUMERIC / 
    NULLIF(COUNT(a.id), 0) * 100), 2
  ) as attendance_percentage
FROM mahasiswa m
LEFT JOIN absensi a ON m.id = a.mahasiswa_id
GROUP BY m.id, m.nama, m.nim, m.kelas, m.prodi, m.profile_photo_url
ORDER BY attendance_percentage DESC NULLS LAST, hadir_count DESC;

-- 13. Grant permissions
GRANT SELECT ON student_leaderboard TO authenticated;
GRANT ALL ON announcements_read TO authenticated;
GRANT ALL ON qr_scan_history TO authenticated;
GRANT ALL ON meeting_feedback TO authenticated;
GRANT ALL ON student_achievements TO authenticated;

COMMENT ON TABLE announcements_read IS 'Track which announcements students have read';
COMMENT ON TABLE qr_scan_history IS 'History of QR code scans by students';
COMMENT ON TABLE meeting_feedback IS 'Student feedback and ratings for meetings';
COMMENT ON TABLE student_achievements IS 'Student achievements and badges';
COMMENT ON VIEW student_leaderboard IS 'Leaderboard view showing student attendance rankings';
