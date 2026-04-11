'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'

const navLinks = [
  { href: '#tentang', label: 'Tentang' },
  { href: '#visi-misi', label: 'Visi & Misi' },
  { href: '#galeri', label: 'Galeri' },
  { href: '#jadwal', label: 'Jadwal' },
  { href: '#pengumuman', label: 'Pengumuman' },
]

export default function LCCNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Close mobile menu on resize
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 768) setMobileOpen(false)
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#0a0f1c]/90 backdrop-blur-2xl shadow-2xl shadow-black/20 border-b border-white/[0.06]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/lcc" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/25 group-hover:shadow-teal-500/50 transition-all duration-500 group-hover:scale-105">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 opacity-0 group-hover:opacity-20 blur-lg transition-opacity duration-500" />
            </div>
            <div className="hidden sm:block">
              <p className="font-bold text-white text-sm leading-tight tracking-wide">LCC</p>
              <p className="text-[10px] text-teal-300/70 leading-tight font-medium">Politeknik LP3I Pekanbaru</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative px-4 py-2 text-sm text-slate-300/80 hover:text-white transition-all duration-300 rounded-lg hover:bg-white/[0.06] group"
              >
                {link.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-teal-400 to-cyan-400 group-hover:w-6 transition-all duration-300 rounded-full" />
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth/mahasiswa/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-teal-200/80 hover:text-white hover:bg-white/[0.08] border border-white/[0.08] hover:border-teal-400/30 transition-all duration-300"
              >
                Mahasiswa
              </Button>
            </Link>
            <Link href="/auth/admin/login">
              <Button
                size="sm"
                className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 transition-all duration-300 hover:scale-[1.02]"
              >
                Admin Login
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-white p-2 hover:bg-white/[0.08] rounded-lg transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <div className="relative w-5 h-5">
              <Menu className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${mobileOpen ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'}`} />
              <X className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${mobileOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out ${
          mobileOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-[#0a0f1c]/98 backdrop-blur-2xl border-t border-white/[0.06]">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link, index) => (
              <a
                key={link.href}
                href={link.href}
                className="block px-4 py-3 text-sm text-slate-300/80 hover:text-white hover:bg-white/[0.05] rounded-xl transition-all duration-300"
                onClick={() => setMobileOpen(false)}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-4 mt-2 border-t border-white/[0.06] space-y-2">
              <Link href="/auth/mahasiswa/login" className="block">
                <Button
                  variant="ghost"
                  className="w-full text-teal-200/80 hover:text-white hover:bg-white/[0.08] border border-white/[0.08]"
                >
                  Login Mahasiswa
                </Button>
              </Link>
              <Link href="/auth/admin/login" className="block">
                <Button className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white">
                  Login Admin
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
