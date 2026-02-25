'use client'

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Menu, X, ChevronDown } from "lucide-react"
import LiensReseaux from "./LiensResaux"

type HiboutikCategory = {
  category_id: number
  category_name: string
  category_id_parent: number
  category_enabled?: 0 | 1
  category_position?: number
}

type CatNode = HiboutikCategory & { children: CatNode[] }

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " et ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function buildCategoryTree(cats: HiboutikCategory[]): CatNode[] {
  const filtered = cats.filter((c) => c.category_enabled !== 0)

  filtered.sort(
    (a, b) => (a.category_position ?? 0) - (b.category_position ?? 0)
  )

  const byId = new Map<number, CatNode>()
  for (const c of filtered) byId.set(c.category_id, { ...c, children: [] })

  const roots: CatNode[] = []
  for (const c of filtered) {
    const node = byId.get(c.category_id)!
    const parentId = c.category_id_parent ?? 0
    if (parentId && byId.has(parentId)) byId.get(parentId)!.children.push(node)
    else roots.push(node)
  }

  return roots
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}


function CategoryLink({ id, name, onClick }: { id: number; name: string; onClick?: () => void }) {
  const slug = `${slugify(name)}-${id}`;
  return (
    <Link href={`/categories/${slug}`} onClick={onClick} className="block hover:text-gray-200 transition">
      {name}
    </Link>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false)
  const [catsOpen, setCatsOpen] = useState(false) // mobile
  const [megaOpen, setMegaOpen] = useState(false) // desktop hover/focus
  const [loadingCats, setLoadingCats] = useState(false)
  const [cats, setCats] = useState<HiboutikCategory[]>([])

  // Fetch catégories (1 fois)
  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        setLoadingCats(true)
        const res = await fetch("/api/hiboutik/categories", {  next: { revalidate: 900 }, // ✅ 15 min
         });
        if (!res.ok) throw new Error(`Erreur ${res.status}`)
        const json = await res.json()
        if (cancelled) return
        setCats(Array.isArray(json) ? json : [])
      } catch {
        if (!cancelled) setCats([])
      } finally {
        if (!cancelled) setLoadingCats(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [])

  const tree = useMemo(() => buildCategoryTree(cats), [cats])
  const columns = useMemo(() => chunk(tree, 6), [tree]) // 6 colonnes max (tu ajustes)

  // Fermeture mega menu au click outside
  useEffect(() => {
    if (!megaOpen) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest?.("[data-mega-root]")) setMegaOpen(false)
    }
    window.addEventListener("mousedown", onDown)
    return () => window.removeEventListener("mousedown", onDown)
  }, [megaOpen])

  return (
    <header className="w-full bg-black text-white fixed top-0 left-0 z-20 shadow-md">
      <div className="max-w-6xl mx-auto flex justify-between items-center px-6 py-4">
        {/* Logo + nom du site */}
        <div className="flex items-center space-x-3">

        <Link href="/diaporama" className="flex items-center space-x-3">
          <img src="/logo.png" alt="Multimédia services" className="h-10 w-auto" />
                  </Link>
        <Link href="/" className="flex items-center space-x-3">
                    <h1 className="text-lg md:text-xl font-bold tracking-wide">
            Multimédia services
          </h1>
        </Link>
        </div>

        {/* Menu principal (desktop) */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
          <Link href="/produits" className="hover:text-gray-300 transition">
            Nos produits
          </Link>

      {/* ✅ Mega menu catégories (desktop) */}
<div
  className="relative"
  data-mega-root
  onMouseEnter={() => setMegaOpen(true)}
  onMouseLeave={() => setMegaOpen(false)}
>
  <button
    type="button"
    className="inline-flex items-center gap-1 hover:text-gray-300 transition"
    aria-haspopup="menu"
    aria-expanded={megaOpen}
    onClick={() => setMegaOpen((v) => !v)}
  >
    Catégories <ChevronDown size={16} className="opacity-80" />
  </button>

  {megaOpen && (
    <>
      {/* ✅ zone tampon invisible pour éviter le “trou” */}
      <div className="absolute left-0 right-0 h-4" />

      <div
        className="absolute left-1/2 -translate-x-1/2 mt-4 w-[980px] max-w-[95vw] bg-white text-black rounded-xl shadow-2xl border border-black/10 overflow-hidden"
        // optionnel : si tu veux être sûr que le menu reste ouvert quand tu es dedans
        onMouseEnter={() => setMegaOpen(true)}
        onMouseLeave={() => setMegaOpen(false)}
      >
        <div className="px-6 py-5 border-b border-black/10 flex items-center justify-between">
          <Link href="/categories" className="text-sm text-blue-600 hover:underline" onClick={() => setMegaOpen(false)}>
            Voir toutes les catégories
          </Link>
          <div className="font-semibold tracking-wide">Catégories</div>
          {loadingCats && <div className="text-xs text-black/50">Chargement…</div>}
        </div>

        <div className="p-6">
          {!loadingCats && tree.length === 0 ? (
            <div className="text-sm text-black/60">Aucune catégorie.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
              {columns.map((col, ci) => (
                <div key={ci} className="space-y-6">
                  {col.map((root) => (
                    <div key={root.category_id}>
                      <div className="text-[13px] font-semibold uppercase tracking-wide text-blue-600">
                        <CategoryLink
                          id={root.category_id}
                          name={root.category_name}
                          onClick={() => setMegaOpen(false)}
                        />
                      </div>

                      {root.children?.length ? (
                        <div className="mt-3 space-y-2 text-[13px] text-black/70">
                          {root.children.map((child) => (
                            <CategoryLink
                              key={child.category_id}
                              id={child.category_id}
                              name={child.category_name}
                              onClick={() => setMegaOpen(false)}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )}
</div>

          <Link href="/contact" className="hover:text-gray-300 transition">
            Contact
          </Link>
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
            <Link href="/" onClick={() => setOpen(false)} className="hover:text-gray-300 transition">
              Accueil
            </Link>

            <Link href="/produits" onClick={() => setOpen(false)} className="hover:text-gray-300 transition">
              Nos produits
            </Link>

            {/* ✅ Catégories mobile (accordéon) */}
            <button
              type="button"
              className="flex items-center justify-between py-2 hover:text-gray-300 transition"
              onClick={() => setCatsOpen((v) => !v)}
              aria-expanded={catsOpen}
            >
              <span>Catégories</span>
              <ChevronDown size={18} className={`transition-transform ${catsOpen ? "rotate-180" : ""}`} />
            </button>

            {catsOpen && (
              <div className="pl-3 border-l border-gray-700 space-y-3">
                {loadingCats && <div className="text-xs text-gray-400">Chargement…</div>}
                {!loadingCats && tree.length === 0 && (
                  <div className="text-xs text-gray-400">Aucune catégorie.</div>
                )}

                {tree.map((root) => (
                  <div key={root.category_id} className="space-y-2">
                    <CategoryLink
                      id={root.category_id}
                      name={root.category_name}
                      onClick={() => setOpen(false)}
                    />
                    {root.children?.length ? (
                      <div className="pl-3 space-y-1 text-gray-300">
                        {root.children.map((child) => (
                          <CategoryLink
                            key={child.category_id}
                            id={child.category_id}
                            name={child.category_name}
                            onClick={() => setOpen(false)}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            <LiensReseaux />

            <Link href="/contact" onClick={() => setOpen(false)} className="hover:text-gray-300 transition">
              Contact
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}