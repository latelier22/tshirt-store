'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import LiensReseaux from './LiensResaux'

export default function Footer() {
  const images = [
    '/galerie/phenomene1.webp',
    '/galerie/phenomene2.webp',
    '/galerie/phenomene3.webp',
    '/galerie/phenomene4.webp',
    '/galerie/phenomene5.webp',
    '/galerie/phenomene6.webp',
    '/galerie/phenomene7.webp',
    '/galerie/phenomene8.webp'
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
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.touches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return
    const distance = touchStartX - touchEndX

    if (distance > 60) {
      // swipe gauche → image suivante
      setModalIndex((i) => (i + 1) % images.length)
    } else if (distance < -60) {
      // swipe droite → image précédente
      setModalIndex((i) => (i - 1 + images.length) % images.length)
    }

    setTouchStartX(null)
    setTouchEndX(null)
  }

  return (
   <footer className="bg-black text-white fixed bottom-0 left-0 w-full z-40">

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
              className={`w-1/4 shrink-0 relative h-48 md:h-64 cursor-pointer transition-all duration-500 ${
                i === index + 1 ? 'opacity-100 scale-105' : 'opacity-60 scale-95'
              }`}
              onClick={() => openModal(i)}
            >
              <Image
                src={src}
                alt={`Image ${i + 1}`}
                fill
                className="object-cover rounded-lg hover:opacity-90"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 🌐 Réseaux sociaux */}
      <div className="flex flex-col md:flex-row items-center justify-between px-6 py-6 max-w-6xl mx-auto">
        <div className="text-center md:text-left mb-4 md:mb-0">
          <h2 className="text-lg font-bold tracking-wide">PHÉNOMÈNE DE FORCE</h2>
          <p className="text-sm text-gray-300">© {new Date().getFullYear()} Tous droits réservés</p>
        </div>
        <div className="flex space-x-6 text-2xl">
          <LiensReseaux/>
        </div>
        <nav className="space-x-6 text-sm font-medium">
          <Link href="/cgv" className="hover:text-gray-700">CGV</Link>
          <Link href="/confidentialite" className="hover:text-gray-700">Données</Link>
          <Link href="/mentions-legales" className="hover:text-gray-700">Mentions légales</Link>

          <Link href="/contact" className="hover:text-gray-700">Contact</Link>
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
