'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookOpen, Menu, X } from 'lucide-react'
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

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0f1b2d]/95 backdrop-blur-xl shadow-lg shadow-black/10 border-b border-white/5'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/lcc" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="font-bold text-white text-sm leading-tight">LCC</p>
              <p className="text-[10px] text-blue-300/80 leading-tight">LP3I Pekanbaru</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm text-blue-100/70 hover:text-white transition-colors rounded-lg hover:bg-white/5"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth/mahasiswa/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-200/80 hover:text-white hover:bg-white/10 border border-white/10"
              >
                Mahasiswa
              </Button>
            </Link>
            <Link href="/auth/admin/login">
              <Button
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
              >
                Admin Login
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0f1b2d]/98 backdrop-blur-xl border-t border-white/5">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block px-4 py-3 text-sm text-blue-100/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-4 border-t border-white/10 space-y-2">
              <Link href="/auth/mahasiswa/login" className="block">
                <Button
                  variant="ghost"
                  className="w-full text-blue-200/80 hover:text-white hover:bg-white/10 border border-white/10"
                >
                  Login Mahasiswa
                </Button>
              </Link>
              <Link href="/auth/admin/login" className="block">
                <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                  Login Admin
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
