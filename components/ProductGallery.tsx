'use client'
import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface GalleryProps {
  images: string[],
}

export default function ProductGallery({ images }: GalleryProps) {
  const safeImages = images?.filter(Boolean) ?? []
  const [current, setCurrent] = useState(0)
  const [isModalOpen, setModalOpen] = useState(false)

  if (!safeImages.length) {
    return (
      <div className="w-full h-80 flex items-center justify-center text-gray-400">
        Pas d’image
      </div>
    )
  }

  const currentSrc = safeImages[current]

  const next = () => setCurrent((i) => (i + 1) % safeImages.length)
  const prev = () => setCurrent((i) => (i - 1 + safeImages.length) % safeImages.length)

  return (
    <div className="flex flex-col items-center w-full select-none">

      {/* IMAGE PRINCIPALE */}
      <div
        className="relative w-full max-w-md h-80 md:h-96 mb-4 overflow-hidden rounded-xl shadow-lg bg-white cursor-zoom-in"
        onClick={() => setModalOpen(true)}
      >
        <Image
          src={currentSrc}
          alt={`Image ${current + 1}`}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 500px"
          className="object-contain"
        />
      </div>

      {/* MINIATURES UNIQUEMENT SI >1 */}
      {safeImages.length > 1 && (
        <div className="flex gap-3 flex-wrap justify-center">
          {safeImages.map((img, i) => (
            <button
              key={img}
              onClick={() => setCurrent(i)}
              className={`relative w-16 h-16 rounded overflow-hidden border-2 ${
                i === current ? 'border-black' : 'border-transparent'
              }`}
            >
              <Image
                src={img}
                alt={`Miniature ${i + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* MODALE */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          onClick={() => setModalOpen(false)}
        >
          <button
            className="absolute top-6 right-6 text-white"
            onClick={(e) => {
              e.stopPropagation()
              setModalOpen(false)
            }}
          >
            <X size={32} />
          </button>

          <div className="relative w-[90vw] h-[80vh] max-w-5xl">
            <Image
              src={currentSrc}
              alt=""
              fill
              sizes="100vw"
              className="object-contain"
            />

            {safeImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prev() }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white"
                >
                  <ChevronLeft size={40} />
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); next() }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white"
                >
                  <ChevronRight size={40} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}