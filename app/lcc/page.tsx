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
  title: 'LP3I Computer Club - Politeknik LP3I Pekanbaru',
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
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      <LCCNavbar />

      {/* ═══════════════════ HERO SECTION ═══════════════════ */}
      <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
        {/* Background Decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 -right-20 w-[400px] h-[400px] bg-sky-100/50 rounded-full blur-[100px]" />
          <div className="absolute top-[15%] right-[25%] w-[200px] h-[200px] bg-amber-100/30 rounded-full blur-[80px]" />
          {/* Grid Pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)`,
              backgroundSize: '80px 80px',
            }}
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge */}
          <div className="animate-slide-up inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-blue-50 border border-blue-100 mb-8">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-sm text-blue-600 font-semibold tracking-wide">Politeknik LP3I Pekanbaru</span>
          </div>

          {/* Title */}
          <h1 className="animate-slide-up delay-100 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[1.05] tracking-tight">
            <span className="text-slate-900">LP3I</span>
            <br />
            <span className="bg-gradient-to-r from-blue-500 via-blue-600 to-sky-500 bg-clip-text text-transparent">
              Computer Club
            </span>
          </h1>

          <p className="animate-slide-up delay-200 mt-6 text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Komunitas pembelajaran interaktif dan kolaboratif untuk mahasiswa
            Politeknik LP3I Pekanbaru dalam bidang{' '}
            <span className="text-blue-600 font-semibold">Graphic Design</span> dan{' '}
            <span className="text-sky-600 font-semibold">Web Design</span>
          </p>

          {/* Stats */}
          <div className="animate-slide-up delay-300 mt-12 flex flex-wrap items-center justify-center gap-8 sm:gap-12 text-center">
            {[
              { icon: Palette, label: 'Graphic Design', value: 'Kelas Desain', color: 'text-blue-500', bg: 'bg-blue-50' },
              { icon: Monitor, label: 'Web Design', value: 'Kelas Web', color: 'text-sky-500', bg: 'bg-sky-50' },
              { icon: Coffee, label: 'Community', value: 'Aktif & Kreatif', color: 'text-amber-500', bg: 'bg-amber-50' },
            ].map((stat) => (
              <div key={stat.label} className="group">
                <div className={`flex items-center justify-center gap-2 mb-2 ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.15em]">{stat.label}</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-slate-800">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="animate-slide-up delay-500 mt-14 flex flex-wrap items-center justify-center gap-4">
            <Link href="/auth/mahasiswa/login">
              <Button
                size="lg"
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-6 text-base rounded-2xl shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-500 hover:scale-[1.03] font-semibold"
              >
                <GraduationCap className="w-5 h-5 mr-2" />
                Masuk Mahasiswa
              </Button>
            </Link>
            <a href="#tentang">
              <Button
                size="lg"
                variant="ghost"
                className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 px-8 py-6 text-base rounded-2xl transition-all duration-500 font-medium"
              >
                Pelajari Lebih Lanjut
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-slide-up delay-700">
          <div className="w-6 h-10 rounded-full border-2 border-slate-200 flex justify-center">
            <div className="w-1 h-3 bg-blue-400 rounded-full mt-2 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ═══════════════════ TENTANG SECTION ═══════════════════ */}
      <section id="tentang" className="relative py-24 md:py-32 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-4">
              <BookOpen className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-[0.15em]">Tentang Kami</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-3 text-slate-900">
              Apa itu LCC?
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-slate-500 text-lg leading-relaxed whitespace-pre-wrap">
                {aboutPage?.konten ||
                  'LP3I Computer Club (LCC) adalah komunitas pembelajaran interaktif yang bernaung di bawah Politeknik LP3I Pekanbaru. Komunitas ini dirancang untuk mendukung pengembangan keterampilan mahasiswa melalui pendekatan belajar yang kolaboratif, praktis, dan menyenangkan.\n\nLCC berfokus pada dua bidang utama, yaitu Graphic Design dan Web Design, yang diajarkan secara terstruktur dengan bimbingan mentor berpengalaman.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: Palette, title: 'Graphic Design', desc: 'Belajar desain grafis dari dasar hingga mahir.', iconColor: 'text-blue-500', bg: 'bg-blue-50', border: 'hover:border-blue-200' },
                { icon: Monitor, title: 'Web Design', desc: 'Membangun website modern dan responsif.', iconColor: 'text-sky-500', bg: 'bg-sky-50', border: 'hover:border-sky-200' },
                { icon: Users, title: 'Kolaboratif', desc: 'Belajar bersama dalam komunitas yang supportif.', iconColor: 'text-emerald-500', bg: 'bg-emerald-50', border: 'hover:border-emerald-200' },
                { icon: Star, title: 'Sertifikasi', desc: 'Dapatkan sertifikat kehadiran dan penghargaan.', iconColor: 'text-amber-500', bg: 'bg-amber-50', border: 'hover:border-amber-200' },
              ].map((item) => (
                <div
                  key={item.title}
                  className={`group p-5 rounded-2xl bg-white border border-slate-100 ${item.border} transition-all duration-500 hover:shadow-lg hover:shadow-slate-100 hover:-translate-y-1`}
                >
                  <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${item.bg}`}>
                    <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-1">{item.title}</h3>
                  <p className="text-sm text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ VISI & MISI SECTION ═══════════════════ */}
      <section id="visi-misi" className="relative py-24 md:py-32 bg-slate-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-100 mb-4">
              <Target className="w-3.5 h-3.5 text-sky-500" />
              <span className="text-xs font-semibold text-sky-600 uppercase tracking-[0.15em]">Visi & Misi</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-3 text-slate-900">
              Arah & Tujuan Kami
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Visi Card */}
            <div className="group p-8 md:p-10 rounded-3xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50 transition-all duration-500">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Visi</h3>
              <p className="text-slate-500 leading-relaxed whitespace-pre-wrap">
                {visiMisiPage?.konten
                  ? visiMisiPage.konten.split('\n\n')[0] || visiMisiPage.konten
                  : 'Menjadi komunitas pembelajaran terdepan yang menghasilkan mahasiswa kreatif, inovatif, dan berdaya saing tinggi dalam bidang desain grafis dan pengembangan web di lingkungan Politeknik LP3I Pekanbaru.'}
              </p>
            </div>

            {/* Misi Card */}
            <div className="group p-8 md:p-10 rounded-3xl bg-white border border-slate-100 hover:border-sky-200 hover:shadow-xl hover:shadow-sky-50 transition-all duration-500">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center mb-6">
                <Sparkles className="w-7 h-7 text-sky-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Misi</h3>
              <p className="text-slate-500 leading-relaxed whitespace-pre-wrap">
                {visiMisiPage?.konten
                  ? visiMisiPage.konten.split('\n\n').slice(1).join('\n\n') || visiMisiPage.konten
                  : '• Menyelenggarakan program pembelajaran yang terstruktur dan berkualitas\n• Memfasilitasi mahasiswa dalam pengembangan portofolio profesional\n• Menciptakan lingkungan belajar yang kolaboratif dan supportif\n• Membangun jaringan dan koneksi industri untuk mahasiswa'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ GALERI SECTION ═══════════════════ */}
      <section id="galeri" className="relative py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 mb-4">
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-[0.15em]">Dokumentasi</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-3 text-slate-900">
              Galeri Kegiatan
            </h2>
            <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
              Momen-momen berharga dari kegiatan pembelajaran dan kebersamaan komunitas LCC
            </p>
          </div>

          <LCCGallery photos={galleryPhotos} />
        </div>
      </section>

      {/* ═══════════════════ JADWAL SECTION ═══════════════════ */}
      <section id="jadwal" className="relative py-24 md:py-32 bg-slate-50/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-4">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-[0.15em]">Jadwal</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-3 text-slate-900">
              Jadwal Pembelajaran
            </h2>
          </div>

          <div className="group p-8 md:p-10 rounded-3xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50 transition-all duration-500">
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-7 h-7 text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Informasi Jadwal</h3>
                <p className="text-slate-500 leading-relaxed whitespace-pre-wrap text-base">
                  {jadwalPage?.konten ||
                    'Kegiatan pembelajaran LCC dilaksanakan setiap minggu sesuai jadwal yang telah ditentukan.\n\n📅 Hari: Setiap Sabtu\n🕐 Waktu: 10:00 - 12:00 WIB\n📍 Tempat: Kampus Politeknik LP3I Pekanbaru\n\nJadwal dapat berubah sewaktu-waktu. Pantau halaman ini untuk informasi terbaru.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ PENGUMUMAN SECTION ═══════════════════ */}
      <section id="pengumuman" className="relative py-24 md:py-32 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100 mb-4">
              <Bell className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-amber-600 uppercase tracking-[0.15em]">Pengumuman</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-3 text-slate-900">
              Pengumuman Terbaru
            </h2>
          </div>

          <div className="space-y-4">
            {announcements.length > 0 ? (
              announcements.map((a) => (
                <div
                  key={a.id}
                  className="group p-6 rounded-2xl bg-white border border-slate-100 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-50 transition-all duration-500 hover:-translate-y-0.5"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bell className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 mb-1.5">{a.judul}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">{a.isi}</p>
                      {a.published_at && (
                        <p className="text-slate-300 text-xs mt-3 font-medium">
                          {new Date(a.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="group p-6 rounded-2xl bg-white border border-slate-100">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bell className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1">Info Penting</h3>
                    <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
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
      <section className="relative py-24 md:py-32 bg-gradient-to-br from-blue-500 via-blue-600 to-sky-500 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 -left-20 w-[400px] h-[400px] bg-white/[0.06] rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 -right-20 w-[300px] h-[300px] bg-white/[0.08] rounded-full blur-[80px]" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            Siap Bergabung?
          </h2>
          <p className="mt-5 text-lg text-blue-100 max-w-xl mx-auto">
            Masuk ke platform LCC untuk akses absensi, materi pembelajaran, dan informasi kegiatan
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/auth/mahasiswa/login">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-base rounded-2xl shadow-2xl shadow-blue-900/20 hover:shadow-blue-900/30 transition-all duration-500 hover:scale-[1.03] font-semibold"
              >
                <GraduationCap className="w-5 h-5 mr-2" />
                Login Mahasiswa
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-5">
                <img
                  src="/lp3i-logo.png"
                  alt="LP3I Pekanbaru"
                  className="h-11 w-11 rounded-lg object-contain"
                  loading="lazy"
                />
                <div>
                  <p className="font-bold text-white text-lg leading-tight tracking-wide">LCC</p>
                  <p className="text-xs text-slate-400 leading-tight font-medium">Politeknik LP3I Pekanbaru</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-md">
                LCC adalah komunitas pembelajaran di bawah Politeknik LP3I Pekanbaru yang berfokus pada
                pengembangan keterampilan Graphic Design dan Web Design bagi mahasiswa.
              </p>
              <div className="mt-6 flex items-center gap-3">
                {[Globe, Mail, Phone].map((Icon, i) => (
                  <div key={i} className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-blue-500/20 border border-slate-700 hover:border-blue-400/30 flex items-center justify-center transition-all duration-300 cursor-pointer">
                    <Icon className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold text-sm uppercase tracking-[0.15em] mb-5">Menu</h4>
              <ul className="space-y-3">
                {[
                  { href: '#tentang', label: 'Tentang LCC' },
                  { href: '#visi-misi', label: 'Visi & Misi' },
                  { href: '#galeri', label: 'Galeri Kegiatan' },
                  { href: '#jadwal', label: 'Jadwal' },
                  { href: '#pengumuman', label: 'Pengumuman' },
                ].map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="text-slate-400 hover:text-blue-400 text-sm transition-colors duration-300 flex items-center gap-2 group">
                      <span className="w-0 h-px bg-blue-400 group-hover:w-3 transition-all duration-300" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold text-sm uppercase tracking-[0.15em] mb-5">Kontak</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-400 text-sm">Politeknik LP3I Pekanbaru, Riau, Indonesia</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span className="text-slate-400 text-sm">info@lp3i-pekanbaru.ac.id</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span className="text-slate-400 text-sm">085265866661</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-xs">
              &copy; {new Date().getFullYear()} LP3I Computer Club — Politeknik LP3I Pekanbaru. All rights reserved.
            </p>
            <p className="text-slate-600 text-xs">
              Developed by <span className="text-blue-400/60 font-medium">WalDevelop-Afk</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
