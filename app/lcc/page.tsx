import Link from 'next/link'
import {
  getPublicLCCPages,
  getPublicDocumentation,
  getPublicActivityDocumentation,
  getPublicAnnouncements,
} from '@/lib/admin-actions'
import { Button } from '@/components/ui/button'
import LCCNavbar from '@/components/shared/lcc-navbar'
import LCCGallery from '@/components/shared/lcc-gallery'
import {
  BookOpen,
  Target,
  Calendar,
  Bell,
  Users,
  GraduationCap,
  Monitor,
  Palette,
  Star,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  Sparkles,
  Coffee,
} from 'lucide-react'

export const metadata = {
  title: 'Learning Coffee Community - Politeknik LP3I Pekanbaru',
  description:
    'LCC adalah komunitas pembelajaran interaktif di Politeknik LP3I Pekanbaru yang berfokus pada pengembangan keterampilan Graphic Design dan Web Design.',
}

export default async function PublicLCCPage() {
  const [pages, docs, activityDocs, announcements] = await Promise.all([
    getPublicLCCPages(),
    getPublicDocumentation(12),
    getPublicActivityDocumentation(12),
    getPublicAnnouncements(5),
  ])

  const pageMap = new Map(pages.map((p) => [p.page_type, p]))
  const aboutPage = pageMap.get('tentang')
  const visiMisiPage = pageMap.get('visi_misi')
  const jadwalPage = pageMap.get('jadwal')
  const pengumumanPage = pageMap.get('pengumuman')

  // Combine documentation photos from both tables
  const galleryPhotos = [
    ...docs.map((d) => ({
      id: d.id,
      judul: d.judul,
      deskripsi: d.deskripsi,
      imageUrl: d.file_url,
      tanggal: d.tanggal,
    })),
    ...activityDocs
      .filter((d) => d.foto_url)
      .map((d) => ({
        id: d.id,
        judul: d.judul,
        deskripsi: d.deskripsi,
        imageUrl: d.foto_url!,
        tanggal: d.tanggal_kegiatan,
      })),
  ].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())

  return (
    <div className="min-h-screen bg-[#080e1a] text-white overflow-x-hidden">
      <LCCNavbar />

      {/* ═══════════════════ HERO SECTION ═══════════════════ */}
      <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0d1f3c] to-[#0a1628]" />
          {/* Glowing Orbs */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/8 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-[150px]" />
          {/* Grid Pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-400/20 mb-8">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300/90 font-medium">Politeknik LP3I Pekanbaru</span>
          </div>

          {/* Title */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.1] tracking-tight">
            <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
              Learning
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500 bg-clip-text text-transparent">
              Coffee Community
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-blue-200/50 max-w-2xl mx-auto leading-relaxed">
            Komunitas pembelajaran interaktif dan kolaboratif untuk mahasiswa
            Politeknik LP3I Pekanbaru dalam bidang{' '}
            <span className="text-blue-300/80 font-medium">Graphic Design</span> dan{' '}
            <span className="text-indigo-300/80 font-medium">Web Design</span>
          </p>

          {/* Stats */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-center">
            <div className="group">
              <div className="flex items-center justify-center gap-2 text-blue-400/70 mb-1">
                <Palette className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Graphic Design</span>
              </div>
              <p className="text-2xl font-bold text-white/90">Kelas Desain</p>
            </div>
            <div className="w-px h-10 bg-white/10 hidden sm:block" />
            <div className="group">
              <div className="flex items-center justify-center gap-2 text-indigo-400/70 mb-1">
                <Monitor className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Web Design</span>
              </div>
              <p className="text-2xl font-bold text-white/90">Kelas Web</p>
            </div>
            <div className="w-px h-10 bg-white/10 hidden sm:block" />
            <div className="group">
              <div className="flex items-center justify-center gap-2 text-emerald-400/70 mb-1">
                <Coffee className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Community</span>
              </div>
              <p className="text-2xl font-bold text-white/90">Aktif & Kreatif</p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <Link href="/auth/mahasiswa/login">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-6 text-base rounded-xl shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:scale-[1.02]"
              >
                <GraduationCap className="w-5 h-5 mr-2" />
                Masuk Mahasiswa
              </Button>
            </Link>
            <a href="#tentang">
              <Button
                size="lg"
                variant="ghost"
                className="text-blue-200/80 hover:text-white hover:bg-white/5 border border-white/10 hover:border-white/20 px-8 py-6 text-base rounded-xl transition-all"
              >
                Pelajari Lebih Lanjut
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="w-6 h-10 rounded-full border-2 border-white/10 flex justify-center">
            <div className="w-1 h-3 bg-white/30 rounded-full mt-2 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ═══════════════════ TENTANG SECTION ═══════════════════ */}
      <section id="tentang" className="relative py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/15 mb-4">
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-medium text-blue-300/80 uppercase tracking-wider">Tentang Kami</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-2">
              <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Apa itu LCC?
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* About Text */}
            <div>
              <p className="text-blue-100/60 text-lg leading-relaxed whitespace-pre-wrap">
                {aboutPage?.konten ||
                  'Learning Coffee Community (LCC) adalah komunitas pembelajaran interaktif yang bernaung di bawah Politeknik LP3I Pekanbaru. Komunitas ini dirancang untuk mendukung pengembangan keterampilan mahasiswa melalui pendekatan belajar yang kolaboratif, praktis, dan menyenangkan.\n\nLCC berfokus pada dua bidang utama, yaitu Graphic Design dan Web Design, yang diajarkan secara terstruktur dengan bimbingan mentor berpengalaman.'}
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: Palette,
                  title: 'Graphic Design',
                  desc: 'Belajar desain grafis dari dasar hingga mahir.',
                  color: 'blue',
                },
                {
                  icon: Monitor,
                  title: 'Web Design',
                  desc: 'Membangun website modern dan responsif.',
                  color: 'indigo',
                },
                {
                  icon: Users,
                  title: 'Kolaboratif',
                  desc: 'Belajar bersama dalam komunitas yang supportif.',
                  color: 'emerald',
                },
                {
                  icon: Star,
                  title: 'Sertifikasi',
                  desc: 'Dapatkan sertifikat kehadiran dan penghargaan.',
                  color: 'amber',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="group p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-blue-400/20 hover:bg-white/[0.04] transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/5"
                >
                  <div
                    className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${
                      item.color === 'blue'
                        ? 'bg-blue-500/10 text-blue-400'
                        : item.color === 'indigo'
                          ? 'bg-indigo-500/10 text-indigo-400'
                          : item.color === 'emerald'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-amber-500/10 text-amber-400'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-white/90 mb-1">{item.title}</h3>
                  <p className="text-sm text-blue-200/40">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ VISI & MISI SECTION ═══════════════════ */}
      <section id="visi-misi" className="relative py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/15 to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/15 mb-4">
              <Target className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-medium text-indigo-300/80 uppercase tracking-wider">Visi & Misi</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-2">
              <span className="bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                Arah & Tujuan Kami
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Visi Card */}
            <div className="relative group">
              <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-blue-500/20 via-transparent to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative p-8 md:p-10 rounded-3xl bg-white/[0.02] border border-white/5 group-hover:border-transparent transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/15 to-blue-600/15 flex items-center justify-center mb-6">
                  <Target className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white/90 mb-4">Visi</h3>
                <p className="text-blue-100/50 leading-relaxed whitespace-pre-wrap">
                  {visiMisiPage?.konten
                    ? visiMisiPage.konten.split('\n\n')[0] || visiMisiPage.konten
                    : 'Menjadi komunitas pembelajaran terdepan yang menghasilkan mahasiswa kreatif, inovatif, dan berdaya saing tinggi dalam bidang desain grafis dan pengembangan web di lingkungan Politeknik LP3I Pekanbaru.'}
                </p>
              </div>
            </div>

            {/* Misi Card */}
            <div className="relative group">
              <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-indigo-500/20 via-transparent to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative p-8 md:p-10 rounded-3xl bg-white/[0.02] border border-white/5 group-hover:border-transparent transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/15 to-purple-600/15 flex items-center justify-center mb-6">
                  <Sparkles className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-bold text-white/90 mb-4">Misi</h3>
                <p className="text-blue-100/50 leading-relaxed whitespace-pre-wrap">
                  {visiMisiPage?.konten
                    ? visiMisiPage.konten.split('\n\n').slice(1).join('\n\n') || visiMisiPage.konten
                    : '• Menyelenggarakan program pembelajaran yang terstruktur dan berkualitas\n• Memfasilitasi mahasiswa dalam pengembangan portofolio profesional\n• Menciptakan lingkungan belajar yang kolaboratif dan supportif\n• Membangun jaringan dan koneksi industri untuk mahasiswa'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ GALERI SECTION ═══════════════════ */}
      <section id="galeri" className="relative py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/10 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/15 mb-4">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-300/80 uppercase tracking-wider">Dokumentasi</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-2">
              <span className="bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent">
                Galeri Kegiatan
              </span>
            </h2>
            <p className="mt-4 text-lg text-blue-200/40 max-w-2xl mx-auto">
              Momen-momen berharga dari kegiatan pembelajaran dan kebersamaan komunitas LCC
            </p>
          </div>

          <LCCGallery photos={galleryPhotos} />
        </div>
      </section>

      {/* ═══════════════════ JADWAL SECTION ═══════════════════ */}
      <section id="jadwal" className="relative py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/10 to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/15 mb-4">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-medium text-blue-300/80 uppercase tracking-wider">Jadwal</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-2">
              <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Jadwal Pembelajaran
              </span>
            </h2>
          </div>

          <div className="relative group">
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-blue-500/15 via-transparent to-indigo-500/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative p-8 md:p-10 rounded-3xl bg-white/[0.02] border border-white/5 group-hover:border-transparent transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white/90 mb-3">Informasi Jadwal</h3>
                  <p className="text-blue-100/50 leading-relaxed whitespace-pre-wrap text-base">
                    {jadwalPage?.konten ||
                      'Kegiatan pembelajaran LCC dilaksanakan setiap minggu sesuai jadwal yang telah ditentukan.\n\n📅 Hari: Setiap Sabtu\n🕐 Waktu: 08:00 - 12:00 WIB\n📍 Tempat: Kampus Politeknik LP3I Pekanbaru\n\nJadwal dapat berubah sewaktu-waktu. Pantau halaman ini untuk informasi terbaru.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ PENGUMUMAN SECTION ═══════════════════ */}
      <section id="pengumuman" className="relative py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-950/5 to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/15 mb-4">
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-medium text-amber-300/80 uppercase tracking-wider">Pengumuman</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-2">
              <span className="bg-gradient-to-r from-white to-amber-200 bg-clip-text text-transparent">
                Pengumuman Terbaru
              </span>
            </h2>
          </div>

          <div className="space-y-4">
            {announcements.length > 0 ? (
              announcements.map((a) => (
                <div
                  key={a.id}
                  className="group p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-amber-400/20 hover:bg-white/[0.03] transition-all duration-500"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bell className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white/90 mb-1">{a.judul}</h3>
                      <p className="text-blue-100/40 text-sm leading-relaxed line-clamp-3">
                        {a.isi}
                      </p>
                      {a.published_at && (
                        <p className="text-blue-300/30 text-xs mt-3">
                          {new Date(a.published_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              /* Fallback */
              <div className="group p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bell className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white/90 mb-1">Info Penting</h3>
                    <p className="text-blue-100/40 text-sm leading-relaxed whitespace-pre-wrap">
                      {pengumumanPage?.konten ||
                        'Pantau halaman ini untuk update terbaru mengenai kegiatan pembelajaran LCC. Informasi jadwal, acara khusus, dan pengumuman penting akan ditampilkan di sini.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════ CTA SECTION ═══════════════════ */}
      <section className="relative py-24 md:py-32">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/30 to-[#080e1a]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px]" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            <span className="bg-gradient-to-r from-white via-blue-200 to-white bg-clip-text text-transparent">
              Siap Bergabung?
            </span>
          </h2>
          <p className="mt-4 text-lg text-blue-200/40 max-w-xl mx-auto">
            Masuk ke platform LCC untuk akses absensi, materi pembelajaran, dan informasi kegiatan
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/auth/mahasiswa/login">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-6 text-base rounded-xl shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:scale-[1.02]"
              >
                <GraduationCap className="w-5 h-5 mr-2" />
                Login Mahasiswa
              </Button>
            </Link>
            <Link href="/auth/admin/login">
              <Button
                size="lg"
                variant="ghost"
                className="text-blue-200/80 hover:text-white hover:bg-white/5 border border-white/10 hover:border-white/20 px-8 py-6 text-base rounded-xl transition-all"
              >
                Login Admin
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="relative border-t border-white/5 bg-[#060b15]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white text-lg leading-tight">Learning Coffee Community</p>
                  <p className="text-xs text-blue-300/50 leading-tight">Politeknik LP3I Pekanbaru</p>
                </div>
              </div>
              <p className="text-blue-200/30 text-sm leading-relaxed max-w-md">
                LCC adalah komunitas pembelajaran di bawah Politeknik LP3I Pekanbaru yang berfokus pada
                pengembangan keterampilan Graphic Design dan Web Design bagi mahasiswa.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white/80 font-semibold text-sm uppercase tracking-wider mb-4">Menu</h4>
              <ul className="space-y-3">
                {[
                  { href: '#tentang', label: 'Tentang LCC' },
                  { href: '#visi-misi', label: 'Visi & Misi' },
                  { href: '#galeri', label: 'Galeri Kegiatan' },
                  { href: '#jadwal', label: 'Jadwal' },
                  { href: '#pengumuman', label: 'Pengumuman' },
                ].map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-blue-200/30 hover:text-blue-300/70 text-sm transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white/80 font-semibold text-sm uppercase tracking-wider mb-4">Kontak</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-400/50 mt-0.5 flex-shrink-0" />
                  <span className="text-blue-200/30 text-sm">
                    Politeknik LP3I Pekanbaru, Riau, Indonesia
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-400/50 flex-shrink-0" />
                  <span className="text-blue-200/30 text-sm">info@lp3i-pekanbaru.ac.id</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-400/50 flex-shrink-0" />
                  <span className="text-blue-200/30 text-sm">(0761) xxxx-xxxx</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-blue-200/20 text-xs">
              &copy; {new Date().getFullYear()} Learning Coffee Community — Politeknik LP3I Pekanbaru. All
              rights reserved.
            </p>
            <p className="text-blue-200/15 text-xs">
              Developed by <span className="text-blue-300/30">WalDevelop-Afk</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
