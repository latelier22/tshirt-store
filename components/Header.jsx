'use client'
import Link from "next/link"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import LiensReseaux from "./LiensResaux"

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="w-full bg-black text-white fixed top-0 left-0 z-20 shadow-md">
      <div className="max-w-6xl mx-auto flex justify-between items-center px-6 py-4">
        {/* Logo + nom du site */}
        <Link href="/" className="flex items-center space-x-3">
          <img
            src="/logo.png"
            alt="Phénomène de Force"
            className="h-10 w-auto"
          />
          <h1 className="text-lg md:text-xl font-bold tracking-wide">
            PHÉNOMÈNE DE FORCE
          </h1>
        </Link>

        {/* Menu principal (desktop) */}
        <nav className="hidden md:flex space-x-8 text-sm font-medium">
          <Link href="/produit" className="hover:text-gray-300 transition">Nos produits</Link>
          <Link href="/produit/tshirt" className="hover:text-gray-300 transition">T-shirt</Link>
          <Link href="/produit/mug" className="hover:text-gray-300 transition">Mug</Link>
          <Link href="/contact" className="hover:text-gray-300 transition">Contact</Link>
        </nav>

        {/* Bouton mobile */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-white focus:outline-none"
          aria-label="Ouvrir le menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Menu mobile */}
      {open && (
        <div className="md:hidden bg-black border-t border-gray-700">
          <nav className="flex flex-col space-y-3 px-6 py-4 text-sm font-medium">
            <Link href="/" onClick={() => setOpen(false)} className="hover:text-gray-300 transition">Accueil</Link>
            <LiensReseaux />
            <Link href="/contact" onClick={() => setOpen(false)} className="hover:text-gray-300 transition">Contact</Link>
          </nav>
        </div>
      )}
    </header>
  )
}
