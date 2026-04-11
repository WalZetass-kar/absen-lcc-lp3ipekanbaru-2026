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
  Zap,
  Globe,
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
    <div className="min-h-screen bg-[#070b14] text-white overflow-x-hidden">
      <LCCNavbar />

      {/* ═══════════════════ HERO SECTION ═══════════════════ */}
      <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#070b14] via-[#0a1520] to-[#070b14]" />
          
          {/* Teal Orbs */}
          <div className="absolute top-1/4 left-1/6 w-[500px] h-[500px] bg-teal-500/[0.06] rounded-full blur-[130px] animate-glow-pulse" />
          <div className="absolute bottom-1/3 right-1/5 w-[450px] h-[450px] bg-cyan-400/[0.05] rounded-full blur-[120px] animate-glow-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-teal-600/[0.03] rounded-full blur-[160px]" />
          
          {/* Amber accent orb */}
          <div className="absolute top-[15%] right-[20%] w-[200px] h-[200px] bg-amber-400/[0.04] rounded-full blur-[80px] animate-float" />
          
          {/* Grid Pattern */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)`,
              backgroundSize: '80px 80px',
            }}
          />
          
          {/* Diagonal accent lines */}
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-[0.015]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                -45deg,
                transparent,
                transparent 100px,
                rgba(20, 184, 166, 0.3) 100px,
                rgba(20, 184, 166, 0.3) 101px
              )`,
            }}
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge */}
          <div className="animate-slide-up inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-teal-500/[0.08] border border-teal-400/[0.15] mb-8 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-sm text-teal-300/90 font-medium tracking-wide">Politeknik LP3I Pekanbaru</span>
          </div>

          {/* Title */}
          <h1 className="animate-slide-up delay-100 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[1.05] tracking-tight">
            <span className="bg-gradient-to-r from-white via-teal-50 to-white bg-clip-text text-transparent">
              Learning
            </span>
            <br />
            <span className="bg-gradient-to-r from-teal-300 via-cyan-300 to-teal-400 bg-clip-text text-transparent">
              Coffee Community
            </span>
          </h1>

          <p className="animate-slide-up delay-200 mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Komunitas pembelajaran interaktif dan kolaboratif untuk mahasiswa
            Politeknik LP3I Pekanbaru dalam bidang{' '}
            <span className="text-teal-300/90 font-semibold">Graphic Design</span> dan{' '}
            <span className="text-cyan-300/90 font-semibold">Web Design</span>
          </p>

          {/* Stats */}
          <div className="animate-slide-up delay-300 mt-12 flex flex-wrap items-center justify-center gap-8 sm:gap-12 text-center">
            {[
              { icon: Palette, label: 'Graphic Design', value: 'Kelas Desain', color: 'teal' },
              { icon: Monitor, label: 'Web Design', value: 'Kelas Web', color: 'cyan' },
              { icon: Coffee, label: 'Community', value: 'Aktif & Kreatif', color: 'amber' },
            ].map((stat, i) => (
              <div key={stat.label} className="group">
                <div className={`flex items-center justify-center gap-2 mb-2 ${
                  stat.color === 'teal' ? 'text-teal-400/70' : stat.color === 'cyan' ? 'text-cyan-400/70' : 'text-amber-400/70'
                }`}>
                  <stat.icon className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.15em]">{stat.label}</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-white/90">{stat.value}</p>
                {i < 2 && <div className="hidden sm:block absolute" />}
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="animate-slide-up delay-500 mt-14 flex flex-wrap items-center justify-center gap-4">
            <Link href="/auth/mahasiswa/login">
              <Button
                size="lg"
                className="bg-gradient-to-r from-teal-500 via-teal-500 to-cyan-600 hover:from-teal-400 hover:via-teal-500 hover:to-cyan-500 text-white px-8 py-6 text-base rounded-2xl shadow-2xl shadow-teal-500/20 hover:shadow-teal-500/40 transition-all duration-500 hover:scale-[1.03] font-semibold"
              >
                <GraduationCap className="w-5 h-5 mr-2" />
                Masuk Mahasiswa
              </Button>
            </Link>
            <a href="#tentang">
              <Button
                size="lg"
                variant="ghost"
                className="text-slate-300 hover:text-white hover:bg-white/[0.06] border border-white/[0.08] hover:border-teal-400/25 px-8 py-6 text-base rounded-2xl transition-all duration-500 font-medium"
              >
                Pelajari Lebih Lanjut
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-slide-up delay-700">
          <div className="w-6 h-10 rounded-full border-2 border-white/[0.1] flex justify-center">
            <div className="w-1 h-3 bg-teal-400/50 rounded-full mt-2 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ═══════════════════ TENTANG SECTION ═══════════════════ */}
      <section id="tentang" className="relative py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-950/[0.08] to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/[0.08] border border-teal-400/[0.12] mb-4">
              <BookOpen className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-xs font-semibold text-teal-300/80 uppercase tracking-[0.15em]">Tentang Kami</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-3">
              <span className="bg-gradient-to-r from-white via-teal-100 to-white bg-clip-text text-transparent">
                Apa itu LCC?
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* About Text */}
            <div>
              <p className="text-slate-400 text-lg leading-relaxed whitespace-pre-wrap">
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
                  gradient: 'from-teal-500/10 to-teal-600/5',
                  iconBg: 'bg-teal-500/10',
                  iconColor: 'text-teal-400',
                },
                {
                  icon: Monitor,
                  title: 'Web Design',
                  desc: 'Membangun website modern dan responsif.',
                  gradient: 'from-cyan-500/10 to-cyan-600/5',
                  iconBg: 'bg-cyan-500/10',
                  iconColor: 'text-cyan-400',
                },
                {
                  icon: Users,
                  title: 'Kolaboratif',
                  desc: 'Belajar bersama dalam komunitas yang supportif.',
                  gradient: 'from-emerald-500/10 to-emerald-600/5',
                  iconBg: 'bg-emerald-500/10',
                  iconColor: 'text-emerald-400',
                },
                {
                  icon: Star,
                  title: 'Sertifikasi',
                  desc: 'Dapatkan sertifikat kehadiran dan penghargaan.',
                  gradient: 'from-amber-500/10 to-amber-600/5',
                  iconBg: 'bg-amber-500/10',
                  iconColor: 'text-amber-400',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className={`group p-5 rounded-2xl bg-gradient-to-br ${item.gradient} border border-white/[0.04] hover:border-teal-400/20 transition-all duration-500 hover:shadow-xl hover:shadow-teal-500/[0.03] hover:-translate-y-1`}
                >
                  <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${item.iconBg}`}>
                    <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                  </div>
                  <h3 className="font-semibold text-white/90 mb-1">{item.title}</h3>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ VISI & MISI SECTION ═══════════════════ */}
      <section id="visi-misi" className="relative py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-950/[0.06] to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/[0.08] border border-cyan-400/[0.12] mb-4">
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-semibold text-cyan-300/80 uppercase tracking-[0.15em]">Visi & Misi</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-3">
              <span className="bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent">
                Arah & Tujuan Kami
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Visi Card */}
            <div className="relative group">
              <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-teal-500/20 via-transparent to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative p-8 md:p-10 rounded-3xl bg-white/[0.02] border border-white/[0.05] group-hover:border-transparent transition-all duration-500">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500/15 to-teal-600/10 flex items-center justify-center mb-6">
                  <Target className="w-7 h-7 text-teal-400" />
                </div>
                <h3 className="text-2xl font-bold text-white/90 mb-4">Visi</h3>
                <p className="text-slate-400/80 leading-relaxed whitespace-pre-wrap">
                  {visiMisiPage?.konten
                    ? visiMisiPage.konten.split('\n\n')[0] || visiMisiPage.konten
                    : 'Menjadi komunitas pembelajaran terdepan yang menghasilkan mahasiswa kreatif, inovatif, dan berdaya saing tinggi dalam bidang desain grafis dan pengembangan web di lingkungan Politeknik LP3I Pekanbaru.'}
                </p>
              </div>
            </div>

            {/* Misi Card */}
            <div className="relative group">
              <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-cyan-500/20 via-transparent to-amber-500/15 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative p-8 md:p-10 rounded-3xl bg-white/[0.02] border border-white/[0.05] group-hover:border-transparent transition-all duration-500">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/15 to-amber-500/10 flex items-center justify-center mb-6">
                  <Sparkles className="w-7 h-7 text-cyan-400" />
                </div>
                <h3 className="text-2xl font-bold text-white/90 mb-4">Misi</h3>
                <p className="text-slate-400/80 leading-relaxed whitespace-pre-wrap">
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
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-950/[0.05] to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/[0.08] border border-emerald-400/[0.12] mb-4">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-300/80 uppercase tracking-[0.15em]">Dokumentasi</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-3">
              <span className="bg-gradient-to-r from-white via-emerald-100 to-white bg-clip-text text-transparent">
                Galeri Kegiatan
              </span>
            </h2>
            <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
              Momen-momen berharga dari kegiatan pembelajaran dan kebersamaan komunitas LCC
            </p>
          </div>

          <LCCGallery photos={galleryPhotos} />
        </div>
      </section>

      {/* ═══════════════════ JADWAL SECTION ═══════════════════ */}
      <section id="jadwal" className="relative py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-950/[0.06] to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/[0.08] border border-teal-400/[0.12] mb-4">
              <Calendar className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-xs font-semibold text-teal-300/80 uppercase tracking-[0.15em]">Jadwal</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-3">
              <span className="bg-gradient-to-r from-white via-teal-100 to-white bg-clip-text text-transparent">
                Jadwal Pembelajaran
              </span>
            </h2>
          </div>

          <div className="relative group">
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-teal-500/15 via-transparent to-cyan-500/15 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative p-8 md:p-10 rounded-3xl bg-white/[0.02] border border-white/[0.05] group-hover:border-transparent transition-all duration-500">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-7 h-7 text-teal-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white/90 mb-4">Informasi Jadwal</h3>
                  <p className="text-slate-400/80 leading-relaxed whitespace-pre-wrap text-base">
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
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-950/[0.04] to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/[0.08] border border-amber-400/[0.12] mb-4">
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-amber-300/80 uppercase tracking-[0.15em]">Pengumuman</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-3">
              <span className="bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text text-transparent">
                Pengumuman Terbaru
              </span>
            </h2>
          </div>

          <div className="space-y-4">
            {announcements.length > 0 ? (
              announcements.map((a, index) => (
                <div
                  key={a.id}
                  className="group p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:border-amber-400/20 hover:bg-white/[0.03] transition-all duration-500 hover:-translate-y-0.5"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bell className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white/90 mb-1.5">{a.judul}</h3>
                      <p className="text-slate-500 text-sm leading-relaxed line-clamp-3">
                        {a.isi}
                      </p>
                      {a.published_at && (
                        <p className="text-slate-600 text-xs mt-3 font-medium">
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
              <div className="group p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bell className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white/90 mb-1">Info Penting</h3>
                    <p className="text-slate-500 text-sm leading-relaxed whitespace-pre-wrap">
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
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-950/[0.12] to-[#070b14]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/[0.04] rounded-full blur-[150px]" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/[0.08] border border-teal-400/[0.12] mb-6">
            <Zap className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-xs font-semibold text-teal-300/80 uppercase tracking-[0.15em]">Get Started</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            <span className="bg-gradient-to-r from-white via-teal-100 to-white bg-clip-text text-transparent">
              Siap Bergabung?
            </span>
          </h2>
          <p className="mt-5 text-lg text-slate-500 max-w-xl mx-auto">
            Masuk ke platform LCC untuk akses absensi, materi pembelajaran, dan informasi kegiatan
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/auth/mahasiswa/login">
              <Button
                size="lg"
                className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white px-8 py-6 text-base rounded-2xl shadow-2xl shadow-teal-500/20 hover:shadow-teal-500/40 transition-all duration-500 hover:scale-[1.03] font-semibold"
              >
                <GraduationCap className="w-5 h-5 mr-2" />
                Login Mahasiswa
              </Button>
            </Link>
            <Link href="/auth/admin/login">
              <Button
                size="lg"
                variant="ghost"
                className="text-slate-300 hover:text-white hover:bg-white/[0.06] border border-white/[0.08] hover:border-teal-400/25 px-8 py-6 text-base rounded-2xl transition-all duration-500 font-medium"
              >
                Login Admin
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="relative border-t border-white/[0.04] bg-[#050810]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/15">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white text-lg leading-tight tracking-wide">Learning Coffee Community</p>
                  <p className="text-xs text-teal-400/60 leading-tight font-medium">Politeknik LP3I Pekanbaru</p>
                </div>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed max-w-md">
                LCC adalah komunitas pembelajaran di bawah Politeknik LP3I Pekanbaru yang berfokus pada
                pengembangan keterampilan Graphic Design dan Web Design bagi mahasiswa.
              </p>
              {/* Social-like links */}
              <div className="mt-6 flex items-center gap-3">
                {[Globe, Mail, Phone].map((Icon, i) => (
                  <div key={i} className="w-9 h-9 rounded-lg bg-white/[0.04] hover:bg-teal-500/10 border border-white/[0.05] hover:border-teal-400/20 flex items-center justify-center transition-all duration-300 cursor-pointer">
                    <Icon className="w-4 h-4 text-slate-500 hover:text-teal-400 transition-colors" />
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white/80 font-semibold text-sm uppercase tracking-[0.15em] mb-5">Menu</h4>
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
                      className="text-slate-500 hover:text-teal-400 text-sm transition-colors duration-300 flex items-center gap-2 group"
                    >
                      <span className="w-0 h-px bg-teal-400 group-hover:w-3 transition-all duration-300" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white/80 font-semibold text-sm uppercase tracking-[0.15em] mb-5">Kontak</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-teal-400/60 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-500 text-sm">
                    Politeknik LP3I Pekanbaru, Riau, Indonesia
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-teal-400/60 flex-shrink-0" />
                  <span className="text-slate-500 text-sm">info@lp3i-pekanbaru.ac.id</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-teal-400/60 flex-shrink-0" />
                  <span className="text-slate-500 text-sm">(0761) xxxx-xxxx</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-600 text-xs">
              &copy; {new Date().getFullYear()} Learning Coffee Community — Politeknik LP3I Pekanbaru. All
              rights reserved.
            </p>
            <p className="text-slate-700 text-xs">
              Developed by <span className="text-teal-400/40 font-medium">WalDevelop-Afk</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
