'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import LiensReseaux from './LiensResaux'

export default function Footer() {
  const images = [
    '/galerie/multimedia-services1.webp',
    '/galerie/multimedia-services2.webp',
    '/galerie/multimedia-services3.webp',
    '/galerie/multimedia-services4.webp',
    '/galerie/multimedia-services5.webp',
    '/galerie/multimedia-services6.webp',
    '/galerie/multimedia-services7.webp',
    '/galerie/multimedia-services8.webp'
  ]

  const [index, setIndex] = useState(0)
  const [isModalOpen, setModalOpen] = useState(false)
  const [modalIndex, setModalIndex] = useState(0)

  // 🔁 défilement automatique dans le footer
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [images.length])

  // 🧷 bloquer le scroll derrière la modale (mobile friendly)
  useEffect(() => {
    if (!isModalOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isModalOpen])

  // ⌨️ navigation clavier dans la modale
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (!isModalOpen) return
      if (e.key === 'Escape') setModalOpen(false)
      if (e.key === 'ArrowRight') setModalIndex((i) => (i + 1) % images.length)
      if (e.key === 'ArrowLeft') setModalIndex((i) => (i - 1 + images.length) % images.length)
    },
    [isModalOpen, images.length]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  const openModal = (i: number) => {
    setModalIndex(i)
    setModalOpen(true)
  }

  // 👉 SWIPE uniquement dans la modale
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [touchEndX, setTouchEndX] = useState<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX)
    setTouchEndX(null)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.touches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return
    const distance = touchStartX - touchEndX

    if (distance > 60) {
      setModalIndex((i) => (i + 1) % images.length)
    } else if (distance < -60) {
      setModalIndex((i) => (i - 1 + images.length) % images.length)
    }

    setTouchStartX(null)
    setTouchEndX(null)
  }

  // Pour l’effet "image active" stable (évite le index+1 qui casse au wrap)
  const activeIndex = index % images.length

  return (
    <footer className="bg-black text-white w-full z-40 md:fixed md:bottom-0 md:left-0">
      {/* 🎞️ Carrousel horizontal */}
      <div className="relative w-full overflow-hidden py-6 bg-black">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{
            transform: `translateX(-${index * 25}%)`,
            width: `${(images.length / 4) * 100}%`,
          }}
        >
          {images.map((src, i) => (
            <div
              key={i}
              className={`w-1/4 shrink-0 relative h-24 sm:h-32 md:h-48 lg:h-64 cursor-pointer transition-all duration-500 ${
                i === activeIndex ? 'opacity-100 scale-105' : 'opacity-60 scale-95'
              }`}
              onClick={() => openModal(i)}
            >
              <Image
                src={src}
                alt={`Image ${i + 1}`}
                fill
                className="object-cover rounded-lg hover:opacity-90"
                // ✅ IMPORTANT: sizes obligatoire avec fill
                sizes="
                  (max-width: 640px) 25vw,
                  (max-width: 1024px) 25vw,
                  (max-width: 1280px) 20vw,
                  25vw
                "
              />
            </div>
          ))}
        </div>
      </div>

      {/* 🌐 Réseaux sociaux */}
      <div className="flex flex-col md:flex-row items-center justify-between px-6 py-6 max-w-6xl mx-auto">
        <div className="text-center md:text-left mb-4 md:mb-0">
          <h2 className="text-lg font-bold tracking-wide">Multimédia services</h2>
          <p className="text-sm text-gray-300">© {new Date().getFullYear()} Tous droits réservés</p>
        </div>

        <div className="flex space-x-6 text-2xl">
          <LiensReseaux />
        </div>

        <nav className="space-x-6 text-sm font-medium">
          <Link href="/cgv" className="hover:text-gray-700">
            CGV
          </Link>
          <Link href="/confidentialite" className="hover:text-gray-700">
            Données
          </Link>
          <Link href="/mentions-legales" className="hover:text-gray-700">
            Mentions légales
          </Link>
          <Link href="/contact" className="hover:text-gray-700">
            Contact
          </Link>
        </nav>
      </div>

      {/* 🪟 MODALE PLEIN ÉCRAN */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          onClick={() => setModalOpen(false)}
        >
          {/* bouton fermer */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setModalOpen(false)
            }}
            className="absolute top-6 right-6 text-white text-3xl hover:text-gray-400"
          >
            <X />
          </button>

          {/* image affichée */}
          <div
            className="relative w-[90vw] h-[80vh] max-w-5xl"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Image
              src={images[modalIndex]}
              alt={`Image ${modalIndex + 1}`}
              fill
              className="object-contain rounded-lg transition-all duration-500"
              // ✅ IMPORTANT: sizes obligatoire avec fill
              sizes="90vw"
              priority
            />

            {/* flèches */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setModalIndex((i) => (i - 1 + images.length) % images.length)
              }}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-4xl hover:text-gray-400"
            >
              <ChevronLeft size={40} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                setModalIndex((i) => (i + 1) % images.length)
              }}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-4xl hover:text-gray-400"
            >
              <ChevronRight size={40} />
            </button>
          </div>
        </div>
      )}
    </footer>
  )
}