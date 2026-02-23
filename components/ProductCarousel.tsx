
// components/ProductCarousel.tsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

// Si tu as déjà ton type HiboutikProduct ici, tu peux l'importer
export type HiboutikProduct = {
  product_id: number;
  product_model?: string;
  product_price?: string;
  product_discount_price?: string;
  images?: string[];
  thumb?: string;
  image?: string;
};

type Props = {
  products: HiboutikProduct[];
  hrefForProduct?: (p: HiboutikProduct) => string;

  title?: string;
  subtitle?: string;

  autoplay?: boolean;
  intervalMs?: number;
  pauseAfterUserMs?: number;

  showArrows?: boolean;

  // Responsive card widths via Tailwind classes
  cardClassName?: string;

  // Optional: proxy function for images
  toProxy?: (url?: string) => string | undefined;

  // Optional placeholder override
  placeholderDataUrl?: string;
};

function defaultToProxy(u?: string) {
  return u ? `/api/hiboutik/image?src=${encodeURIComponent(u)}` : undefined;
}

function firstImage(p: any) {
  const list = Array.isArray(p?.images) ? p.images : [];
  return p?.image ?? p?.thumb ?? list[0];
}

// Placeholder SVG (pas d'image)
const DEFAULT_PLACEHOLDER_SVG = encodeURIComponent(`
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

function defaultPlaceholderDataUrl() {
  return `data:image/svg+xml;charset=utf-8,${DEFAULT_PLACEHOLDER_SVG}`;
}

function useAutoDragCarousel(opts?: {
  intervalMs?: number;
  pauseAfterUserMs?: number;
  autoplay?: boolean;
}) {
  const intervalMs = opts?.intervalMs ?? 2600;
  const pauseAfterUserMs = opts?.pauseAfterUserMs ?? 5000;
  const autoplay = opts?.autoplay ?? true;

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
    e.preventDefault(); // empêche drag natif image/lien

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
    if (!autoplay) return;
    const el = ref.current;
    if (!el) return;

    const t = window.setInterval(() => {
      if (Date.now() - lastUserTs.current < pauseAfterUserMs) return;

      const nearEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
      if (nearEnd) el.scrollTo({ left: 0, behavior: "smooth" });
      else scrollByCard(1);
    }, intervalMs);

    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, pauseAfterUserMs, autoplay]);

  return { ref, onPointerDown, onPointerMove, onPointerUp, onClickCapture, scrollPrev, scrollNext };
}

export default function ProductCarousel({
  products,
  hrefForProduct,
  title,
  subtitle,
  autoplay = true,
  intervalMs = 2600,
  pauseAfterUserMs = 5000,
  showArrows = true,
  cardClassName = "w-[80vw] sm:w-[45vw] md:w-[260px] lg:w-[220px]",
  toProxy = defaultToProxy,
  placeholderDataUrl = defaultPlaceholderDataUrl(),
}: Props) {
  const items = products ?? [];
  if (!items.length) return <div className="opacity-70">Aucun produit.</div>;

  const { ref, onPointerDown, onPointerMove, onPointerUp, onClickCapture, scrollPrev, scrollNext } =
    useAutoDragCarousel({ intervalMs, pauseAfterUserMs, autoplay });

  return (
    <section className="relative">
      {(title || subtitle) && (
        <div className="mb-3">
          {title && <h2 className="text-sm font-semibold">{title}</h2>}
          {subtitle && <div className="text-xs opacity-70 mt-1">{subtitle}</div>}
        </div>
      )}

      {showArrows && (
        <>
          <button
            type="button"
            onClick={scrollPrev}
            className="hidden md:flex items-center justify-center absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full border bg-white/90 shadow hover:bg-white"
            aria-label="Précédent"
          >
            ‹
          </button>

          <button
            type="button"
            onClick={scrollNext}
            className="hidden md:flex items-center justify-center absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full border bg-white/90 shadow hover:bg-white"
            aria-label="Suivant"
          >
            ›
          </button>
        </>
      )}

      <div
        ref={ref}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="
          flex gap-4 overflow-x-auto pb-3
          snap-x snap-mandatory
          scroll-smooth
          select-none
          cursor-grab active:cursor-grabbing
          touch-pan-y overscroll-x-contain
        "
      >
        {items.map((p: any) => {
          const img = toProxy(firstImage(p)) ?? placeholderDataUrl;
          const href = hrefForProduct ? hrefForProduct(p) : `/produits/${p.product_id}`;

          return (
            <Link
              key={p.product_id}
              href={href}
              onClickCapture={onClickCapture}
              data-carousel-card
              className={`
                snap-start
                border rounded-xl p-3 hover:shadow-lg transition bg-white
                shrink-0
                ${cardClassName}
              `}
            >
              <div className="relative w-full h-36 mb-2">
                <Image
                  src={img}
                  alt={p.product_model ?? "Produit"}
                  fill
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  className="object-contain pointer-events-none"
                />
              </div>

              <div className="text-sm font-semibold line-clamp-2">{p.product_model}</div>

              <div className="mt-1 flex items-baseline gap-2">
                {p.product_discount_price ? (
                  <>
                    <div className="text-lg font-bold">{p.product_discount_price} €</div>
                    <div className="text-sm line-through opacity-60">{p.product_price} €</div>
                  </>
                ) : (
                  <div className="text-lg font-bold">{p.product_price} €</div>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="flex justify-center mt-2 opacity-70">
        <span className="text-xs">Swipe / glisse pour naviguer</span>
      </div>
    </section>
  );
}