'use client'

import { useState, useCallback, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

interface GalleryPhoto {
  id: string
  judul: string
  deskripsi?: string | null
  imageUrl: string
  tanggal: string
}

export default function LCCGallery({ photos }: { photos: GalleryPhoto[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  if (photos.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/[0.05]">
          <Calendar className="w-8 h-8 text-teal-400/40" />
        </div>
        <p className="text-slate-400 text-lg">Belum ada dokumentasi kegiatan</p>
        <p className="text-slate-600 text-sm mt-1">Foto-foto kegiatan akan ditampilkan di sini</p>
      </div>
    )
  }

  const openLightbox = (index: number) => setSelectedIndex(index)
  const closeLightbox = useCallback(() => setSelectedIndex(null), [])
  const goNext = useCallback(() => {
    if (selectedIndex !== null) setSelectedIndex((selectedIndex + 1) % photos.length)
  }, [selectedIndex, photos.length])
  const goPrev = useCallback(() => {
    if (selectedIndex !== null) setSelectedIndex((selectedIndex - 1 + photos.length) % photos.length)
  }, [selectedIndex, photos.length])

  // Keyboard navigation
  useEffect(() => {
    if (selectedIndex === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedIndex, closeLightbox, goNext, goPrev])

  return (
    <>
      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            onClick={() => openLightbox(index)}
            className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer border border-white/[0.04] hover:border-teal-400/25 transition-all duration-500 hover:shadow-2xl hover:shadow-teal-500/[0.08] hover:-translate-y-1"
          >
            <img
              src={photo.imageUrl}
              alt={photo.judul}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
              <p className="text-white font-medium text-sm line-clamp-2">{photo.judul}</p>
              <p className="text-teal-200/70 text-xs mt-1.5 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                {new Date(photo.tanggal).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/60 hover:text-white p-2.5 hover:bg-white/10 rounded-xl transition-all duration-300 z-10"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>

          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goPrev() }}
                className="absolute left-4 text-white/60 hover:text-white p-3 hover:bg-white/10 rounded-xl transition-all duration-300 z-10"
                aria-label="Previous"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goNext() }}
                className="absolute right-4 text-white/60 hover:text-white p-3 hover:bg-white/10 rounded-xl transition-all duration-300 z-10"
                aria-label="Next"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          <div
            className="max-w-5xl max-h-[85vh] mx-4 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photos[selectedIndex].imageUrl}
              alt={photos[selectedIndex].judul}
              className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl"
            />
            <div className="mt-5 text-center">
              <h3 className="text-white font-semibold text-lg">{photos[selectedIndex].judul}</h3>
              {photos[selectedIndex].deskripsi && (
                <p className="text-slate-400 text-sm mt-1.5 max-w-lg">{photos[selectedIndex].deskripsi}</p>
              )}
              <p className="text-slate-600 text-xs mt-3 font-medium">
                {new Date(photos[selectedIndex].tanggal).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <p className="text-white/20 text-xs mt-2 font-mono">
                {selectedIndex + 1} / {photos.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
