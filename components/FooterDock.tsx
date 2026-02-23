'use client'

import { useEffect, useState } from 'react'
import { Plus, X, ChevronDown } from 'lucide-react'
import Footer from './Footer'

export default function FooterDock() {
  const [open, setOpen] = useState(true)

  // visible à l'ouverture puis se replie
  useEffect(() => {
    const t = setTimeout(() => setOpen(false), 2200)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      {/* PANEL footer en overlay */}
      <div
        className={[
          "fixed left-0 right-0 bottom-0 z-[80] transition-transform duration-300",
          open ? "translate-y-0" : "translate-y-[calc(100%-52px)]",
        ].join(" ")}
      >
        {/* petite barre de contrôle (fine) */}
        <div className="bg-black text-white h-[52px] flex items-center justify-between px-4">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 text-sm opacity-90"
            aria-label={open ? "Réduire le footer" : "Afficher le footer"}
          >
            <ChevronDown className={open ? "rotate-180 transition-transform" : "transition-transform"} size={18} />
            {open ? "Réduire" : "Galerie / infos"}
          </button>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="h-9 w-9 rounded-full bg-white text-black flex items-center justify-center"
            aria-label={open ? "Réduire" : "Afficher"}
            title={open ? "Réduire" : "Afficher"}
          >
            {open ? <X size={18} /> : <Plus size={18} />}
          </button>
        </div>

        {/* contenu footer */}
        <div className="max-h-[60vh] overflow-auto">
          <Footer />
        </div>
      </div>

      {/* Pour éviter que le panel cache le bas de page quand il est replié */}
      <div className="h-[52px]" />
    </>
  )
}