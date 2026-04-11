'use client'

import { useState } from 'react'
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
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
          <Calendar className="w-8 h-8 text-blue-400/50" />
        </div>
        <p className="text-blue-200/50 text-lg">Belum ada dokumentasi kegiatan</p>
        <p className="text-blue-300/30 text-sm mt-1">Foto-foto kegiatan akan ditampilkan di sini</p>
      </div>
    )
  }

  const openLightbox = (index: number) => setSelectedIndex(index)
  const closeLightbox = () => setSelectedIndex(null)
  const goNext = () => {
    if (selectedIndex !== null) setSelectedIndex((selectedIndex + 1) % photos.length)
  }
  const goPrev = () => {
    if (selectedIndex !== null) setSelectedIndex((selectedIndex - 1 + photos.length) % photos.length)
  }

  return (
    <>
      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            onClick={() => openLightbox(index)}
            className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer border border-white/5 hover:border-blue-400/30 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10"
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
              <p className="text-blue-200/70 text-xs mt-1 flex items-center gap-1">
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
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>

          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goPrev() }}
                className="absolute left-4 text-white/70 hover:text-white p-3 hover:bg-white/10 rounded-full transition-colors z-10"
                aria-label="Previous"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goNext() }}
                className="absolute right-4 text-white/70 hover:text-white p-3 hover:bg-white/10 rounded-full transition-colors z-10"
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
              className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl"
            />
            <div className="mt-4 text-center">
              <h3 className="text-white font-semibold text-lg">{photos[selectedIndex].judul}</h3>
              {photos[selectedIndex].deskripsi && (
                <p className="text-blue-200/60 text-sm mt-1 max-w-lg">{photos[selectedIndex].deskripsi}</p>
              )}
              <p className="text-blue-300/40 text-xs mt-2">
                {new Date(photos[selectedIndex].tanggal).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <p className="text-white/30 text-xs mt-2">
                {selectedIndex + 1} / {photos.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
