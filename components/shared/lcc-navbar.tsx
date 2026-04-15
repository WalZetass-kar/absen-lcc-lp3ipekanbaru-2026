'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
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
          ? 'bg-white/90 backdrop-blur-2xl shadow-lg shadow-black/[0.04] border-b border-slate-200/60'
          : 'bg-white/60 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/lp3i-logo.png"
              alt="LP3I Pekanbaru"
              className="h-10 w-10 rounded-lg object-contain"
            />
            <div className="hidden sm:block">
              <p className="font-bold text-slate-900 text-sm leading-tight tracking-wide">LCC</p>
              <p className="text-[10px] text-slate-400 leading-tight font-medium">Politeknik LP3I Pekanbaru</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative px-4 py-2 text-sm text-slate-600 hover:text-blue-600 transition-all duration-300 rounded-lg hover:bg-blue-50/60 group font-medium"
              >
                {link.label}
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-blue-500 group-hover:w-5 transition-all duration-300 rounded-full" />
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center">
            <Link href="/auth/mahasiswa/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-all duration-300 font-medium"
              >
                Mahasiswa
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-slate-700 p-2 hover:bg-slate-100 rounded-lg transition-colors"
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
        <div className="bg-white/98 backdrop-blur-2xl border-t border-slate-100">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link, index) => (
              <a
                key={link.href}
                href={link.href}
                className="block px-4 py-3 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50/60 rounded-xl transition-all duration-300 font-medium"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-4 mt-2 border-t border-slate-100 space-y-2">
              <Link href="/auth/mahasiswa/login" className="block">
                <Button
                  variant="ghost"
                  className="w-full text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200"
                >
                  Login Mahasiswa
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
