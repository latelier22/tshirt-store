"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";

import ProductFilters from "@/components/ProductFilters";
import { useProductFilters } from "@/app/stores/productFilters";
import { HiboutikProduct } from "@/app/types/ProductType";

import ProductCarousel from "@/components/ProductCarousel";

type CategoryRow = {
  category_id: number;
  slug: string;
  name: string;
  parent_id: number | null;
  product_count?: number;
};

function toProxy(u?: string) {
  return u ? `/api/hiboutik/image?src=${encodeURIComponent(u)}` : undefined;
}

function norm(s: any) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// ---- icons (simple, rapide)
function iconFor(name: string) {
  const n = norm(name);
  if (n.includes("telephone")) return "📱";
  if (n.includes("tablette")) return "📟";
  if (n.includes("ordinateur")) return "💻";
  if (n.includes("console")) return "🎮";
  if (n.includes("montre")) return "⌚";
  if (n.includes("accessoire")) return "🔌";
  if (n.includes("piece")) return "🧩";
  if (n.includes("trottinette") || n.includes("velo")) return "🛴";
  return "🛍️";
}

// ---------- Hook carousel: auto-slide + drag/swipe
function useAutoDragCarousel(opts?: { intervalMs?: number; pauseAfterUserMs?: number }) {
  const intervalMs = opts?.intervalMs ?? 2600;
  const pauseAfterUserMs = opts?.pauseAfterUserMs ?? 5000;

  const ref = React.useRef<HTMLDivElement | null>(null);
  const isDown = React.useRef(false);
  const startX = React.useRef(0);
  const startScrollLeft = React.useRef(0);
  const lastUserTs = React.useRef(0);
  const didMove = React.useRef(false);

  const markUser = () => {
    lastUserTs.current = Date.now();
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;

    // empêche le drag natif (image / lien)
    e.preventDefault();

    isDown.current = true;
    didMove.current = false;
    startX.current = e.clientX;
    startScrollLeft.current = el.scrollLeft;
    markUser();

    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || !isDown.current) return;

    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 6) didMove.current = true;

    el.scrollLeft = startScrollLeft.current - dx;
  };

  const onPointerUp = () => {
    if (!isDown.current) return;
    isDown.current = false;
    markUser();
  };

  // annule le click si on a réellement swipé
  const onClickCapture = (e: React.MouseEvent) => {
    if (didMove.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const scrollByCard = (dir: -1 | 1) => {
    const el = ref.current;
    if (!el) return;
    const firstCard = el.querySelector<HTMLElement>("[data-carousel-card]");
    const step = (firstCard?.offsetWidth ?? 240) + 16; // + gap
    el.scrollBy({ left: dir * step, behavior: "smooth" });
    markUser();
  };

  const scrollPrev = () => scrollByCard(-1);
  const scrollNext = () => scrollByCard(1);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const t = window.setInterval(() => {
      // pause après interaction user
      if (Date.now() - lastUserTs.current < pauseAfterUserMs) return;

      const nearEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
      if (nearEnd) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        scrollByCard(1);
      }
    }, intervalMs);

    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, pauseAfterUserMs]);

  return { ref, onPointerDown, onPointerMove, onPointerUp, onClickCapture, scrollPrev, scrollNext };
}

// ---------- Placeholder SVG (pas d'image)
const PLACEHOLDER_SVG = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
  <defs>
    <linearGradient id="g" x1="0" x2="1">
      <stop offset="0" stop-color="#eef2ff"/>
      <stop offset="1" stop-color="#f8fafc"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#g)"/>
  <rect x="40" y="40" width="720" height="420" rx="24" fill="white" stroke="#e5e7eb" stroke-width="4"/>
  <g fill="#94a3b8">
    <path d="M240 310l70-80 70 85 55-60 85 95H240z" opacity="0.9"/>
    <circle cx="330" cy="205" r="28" opacity="0.9"/>
  </g>
  <text x="400" y="390" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto" font-size="28" fill="#64748b">
    Pas d’image
  </text>
</svg>
`);

function placeholderDataUrl() {
  return `data:image/svg+xml;charset=utf-8,${PLACEHOLDER_SVG}`;
}

function firstImage(p: any) {
  const list = Array.isArray(p?.images) ? p.images : [];
  return p?.image ?? p?.thumb ?? list[0];
}

function hasAnyImage(p: HiboutikProduct): boolean {
  return !!(p.image || p.thumb || (Array.isArray(p.images) && p.images.length > 0));
}

function isInStock(p: HiboutikProduct): boolean {
  const anyP: any = p;
  if (anyP.stock_available_global === 1 || anyP.stock_available_global === true) return true;
  const v = anyP.stock_available;
  if (Array.isArray(v)) return v.some((e: any) => e?.stock_available === 1 || e?.stock_available === true);
  return v === 1 || v === true;
}

function matches(p: HiboutikProduct, q: string) {
  const qq = norm(q.trim());
  if (!qq) return false;
  const id = String(p.product_id ?? "");
  const name = norm((p as any).product_model ?? (p as any).name ?? "");
  const ean = norm((p as any).product_barcode ?? (p as any).barcode ?? "");
  return id.includes(qq) || name.includes(qq) || ean.includes(qq);
}








export default function HomeClient({
  categories,
  recentProducts,
}: {
  categories: CategoryRow[];
  recentProducts: HiboutikProduct[];
}) {
  const hideOutOfStock = useProductFilters((s) => s.hideOutOfStock);
  const hideNoImage = useProductFilters((s) => s.hideNoImage);
  const query = useProductFilters((s) => s.query);

  // ---- filtering
  const baseRecent = useMemo(() => {
    return (recentProducts ?? []).filter((p) => {
      if (hideNoImage && !hasAnyImage(p)) return false;
      if (hideOutOfStock && !isInStock(p)) return false;
      return true;
    });
  }, [recentProducts, hideNoImage, hideOutOfStock]);

  const matchedRecent = useMemo(() => {
    if (!query.trim()) return [];
    return baseRecent.filter((p) => matches(p, query));
  }, [baseRecent, query]);

  const recentOther = useMemo(() => {
    if (!query.trim()) return baseRecent;
    const ids = new Set(matchedRecent.map((p) => p.product_id));
    return baseRecent.filter((p) => !ids.has(p.product_id));
  }, [baseRecent, matchedRecent, query]);

  return (
    <div className="mx-auto max-w-6xl px-6">
      {/* filtre global */}
      <ProductFilters total={recentProducts.length} shown={baseRecent.length} matched={matchedRecent.length} />

      {/* catégories */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold mb-3">Catégories</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((c) => (
            <Link
              key={c.category_id}
              href={`/categories/${c.slug}`}
              className="border rounded-xl p-4 hover:shadow-lg transition flex gap-3 items-center bg-white"
            >
              <div className="text-2xl">{iconFor(c.name)}</div>
              <div className="min-w-0">
                <div className="font-semibold truncate">{c.name}</div>
                <div className="text-xs opacity-70">{c.product_count ?? 0} produits</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* carousel récents */}
      <section className="mb-10">
  <h2 className="text-sm font-semibold mb-3">Ajouts récents</h2>

  {matchedRecent.length > 0 && (
    <div className="mb-4">
      <ProductCarousel
        title="Match (récents)"
        products={matchedRecent}
        autoplay={true}
        showArrows={true}
      />
    </div>
  )}

  <ProductCarousel
    title="Ajouts récents"
    products={recentOther}
    autoplay={true}
    showArrows={true}
  />
</section>

    </div>
  );
}