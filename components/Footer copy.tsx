'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FaFacebookF, FaInstagram, FaTiktok } from 'react-icons/fa'

export default function Footer() {
  // 👉 Liste d’images à faire défiler dans le carrousel
  const images = [
    '/galerie/phenomene1.png',
    '/galerie/phenomene2.png',
    '/galerie/phenomene3.png',
    '/galerie/phenomene4.png',
    '/galerie/phenomene5.png',
    '/galerie/phenomene6.png',
    '/galerie/phenomene7.png',
    '/galerie/phenomene8.png'
  ]

  const [current, setCurrent] = useState(0)

  // 🔁 Changement automatique d’image toutes les 3 secondes
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [images.length])

  return (
    <footer className="bg-black text-white mt-16">
      {/* 🎞️ Carrousel */}
      <div className="relative w-full overflow-hidden h-64 md:h-80">
        <Image
          key={images[current]}
          src={images[current]}
          alt={`Image ${current + 1}`}
          fill
          className="object-cover transition-opacity duration-700 ease-in-out opacity-100"
        />
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {images.map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all ${
                i === current ? 'bg-white' : 'bg-gray-500'
              }`}
            ></div>
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
          <Link
            href="https://www.facebook.com/profile.php?id=100088681437185"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-500 transition"
          >
            <FaFacebookF />
          </Link>
          <Link
            href="https://www.instagram.com/phenomenedeforce"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-pink-500 transition"
          >
            <FaInstagram />
          </Link>
          <Link
            href="https://www.tiktok.com/@phenomenedeforce"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-200 transition"
          >
            <FaTiktok />
          </Link>
        </div>
      </div>
    </footer>
  )
}
