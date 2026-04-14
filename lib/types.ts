export type Kelas = 'Graphic Design' | 'Web Design'
export type Prodi = 'Humas' | 'Akuntansi' | 'Administrasi Bisnis' | 'Manajemen Informatika'
export type StatusAbsensi = 'Hadir' | 'Izin' | 'Alfa'
export type RoleAdmin = 'super_admin' | 'admin'

export interface Profile {
  id: string
  nama: string
  email: string
  role: RoleAdmin
  profile_photo_url?: string | null
  created_at: string
}

export interface Mahasiswa {
  id: string
  nama: string
  nim?: string
  kelas: Kelas
  prodi: Prodi
  user_id?: string | null
  created_at: string
}

export interface Absensi {
  id: string
  mahasiswa_id: string
  nama_mahasiswa: string
  kelas: string
  status: StatusAbsensi
  tanggal: string
  pertemuan: number
  created_at: string
}

export type ActivityStatusType = 'Belum Dimulai' | 'Sedang Berlangsung' | 'Selesai'

export interface ActivityStatus {
  id: string
  tanggal: string
  status: ActivityStatusType
  absensi_dibuka: boolean
  created_at: string
  updated_at: string
}

export interface Documentation {
  id: string
  tanggal: string
  judul: string
  deskripsi?: string
  file_url: string
  file_path: string
  created_at: string
}

export interface ActivityDocumentation {
  id: string
  judul: string
  deskripsi?: string
  tanggal_kegiatan: string
  foto_url?: string
  foto_path?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface AdminActivityLog {
  id: string
  admin_id: string
  admin_nama?: string
  aktivitas: string
  details?: Record<string, unknown>
  created_at: string
}

export interface MeetingNotes {
  id: string
  pertemuan: number
  tanggal: string
  judul: string
  materi?: string
  mentor_nama?: string
  catatan_evaluasi?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export type BadgeType = 'Bronze' | 'Silver' | 'Gold' | 'Platinum'

export interface StudentBadge {
  id: string
  mahasiswa_id: string
  badge_type: BadgeType
  attendance_count: number
  earned_at: string
  created_at: string
}

export interface StudentCertificate {
  id: string
  mahasiswa_id: string
  total_pertemuan: number
  total_hadir: number
  attendance_percentage: number
  sertifikat_url?: string
  file_path?: string
  downloaded_at?: string
  issued_at?: string
  created_at: string
  updated_at: string
}

export interface CertificateOverview {
  id: string
  nama: string
  nim: string | null
  kelas: Kelas
  prodi: Prodi
  hadirCount: number
  totalPertemuan: number
  percentage: number
  eligible: boolean
  certificateGenerated: boolean
  issuedAt?: string | null
  downloadedAt?: string | null
}

export interface StudentAccount {
  id: string
  mahasiswa_id: string
  nim: string
  password_hash: string
  must_change_password: boolean
  created_at: string
  updated_at: string
}

export interface Pertemuan {
  id: string
  nomor_pertemuan: number
  tanggal: string
  status: 'Dijadwalkan' | 'Berlangsung' | 'Selesai'
  created_at: string
  updated_at: string
}

export interface QRCode {
  id: string
  pertemuan_id: string
  qr_code_data: string
  is_active: boolean
  created_at: string
  expires_at?: string
}

export interface PertemuanWithQR extends Pertemuan {
  qr_codes: QRCode[]
}

export interface StudentPermission {
  id: string
  mahasiswa_id: string
  pertemuan_id: string
  alasan: string
  bukti_file_url?: string
  bukti_file_path?: string
  status: 'Menunggu' | 'Disetujui' | 'Ditolak'
  approved_by?: string
  created_at: string
  updated_at: string
}

export interface PendingPermissionWithDetails extends StudentPermission {
  mahasiswa?: Pick<Mahasiswa, 'nama' | 'kelas'> | null
  pertemuan?: Pick<Pertemuan, 'nomor_pertemuan' | 'tanggal'> | null
}

export interface Announcement {
  id: string
  judul: string
  isi: string
  created_by: string
  is_published: boolean
  published_at?: string
  created_at: string
}

export interface AttendanceWarning {
  id: string
  mahasiswa_id: string
  attendance_percentage: number
  warning_level: 'Kuning' | 'Merah'
  created_at: string
  acknowledged_at?: string
}

export interface PublicLCCPage {
  id: string
  page_type: 'tentang' | 'visi_misi' | 'jadwal' | 'pengumuman'
  judul: string
  konten: string
  updated_by?: string
  created_at: string
  updated_at: string
}
