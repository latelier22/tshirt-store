"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export type HiboutikProduct = {
  product_id: number;
  product_model?: string;
  product_price?: string;
  product_discount_price?: string;
  images?: string[];
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
  cardClassName?: string;

  toProxy?: (url?: string) => string | undefined;
};

function defaultToProxy(u?: string) {
  if (!u) return undefined;
  if (u.startsWith("/api/hiboutik/image?src=") || u.startsWith("data:image/")) return u;
  return `/api/hiboutik/image?src=${encodeURIComponent(u)}`;
}

// ✅ IMAGE PROPRE (UNIQUEMENT big_)
function firstImage(p: any) {
  const list = Array.isArray(p?.images) ? p.images : [];

  const big = list.find((img: string) => img.includes("big_"));
  if (big) return big;

  return list[0] ?? null;
}

function useDragScrollCarousel() {
  const ref = React.useRef<HTMLDivElement | null>(null);

  const isDown = React.useRef(false);
  const startX = React.useRef(0);
  const startScrollLeft = React.useRef(0);

  const dragged = React.useRef(false);
  const blockClickUntil = React.useRef(0);

  const DRAG_THRESHOLD = 10;

  const onPointerDown = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;

    isDown.current = true;
    dragged.current = false;

    startX.current = e.clientX;
    startScrollLeft.current = el.scrollLeft;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || !isDown.current) return;

    const dx = e.clientX - startX.current;

    if (!dragged.current && Math.abs(dx) > DRAG_THRESHOLD) {
      dragged.current = true;
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      e.preventDefault();
    }

    if (dragged.current) {
      el.scrollLeft = startScrollLeft.current - dx;
    }
  };

  const onPointerUp = () => {
    if (!isDown.current) return;
    isDown.current = false;

    if (dragged.current) {
      blockClickUntil.current = Date.now() + 350;
    }

    dragged.current = false;
  };

  const onClick = (e: React.MouseEvent) => {
    if (Date.now() < blockClickUntil.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return { ref, onPointerDown, onPointerMove, onPointerUp, onClick };
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
}: Props) {
  const items = products ?? [];
  if (!items.length) return null;

  const { ref, onPointerDown, onPointerMove, onPointerUp, onClick } = useDragScrollCarousel();

  const lastUserTs = React.useRef(0);
  const markUser = () => (lastUserTs.current = Date.now());

  const scrollByCard = React.useCallback(
    (dir: -1 | 1) => {
      const el = ref.current;
      if (!el) return;

      const firstCard = el.querySelector<HTMLElement>("[data-carousel-card]");
      const step = (firstCard?.offsetWidth ?? 240) + 16;
      el.scrollBy({ left: dir * step, behavior: "smooth" });
      markUser();
    },
    [ref]
  );

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
  }, [autoplay, intervalMs, pauseAfterUserMs, scrollByCard]);

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
            onClick={scrollPrev}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full border bg-white/90 shadow"
          >
            ‹
          </button>

          <button
            onClick={scrollNext}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full border bg-white/90 shadow"
          >
            ›
          </button>
        </>
      )}

      <div
        ref={ref}
        onPointerDown={(e) => {
          markUser();
          onPointerDown(e);
        }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scroll-smooth select-none cursor-grab active:cursor-grabbing"
      >
        {items.map((p: any) => {
          const rawImg = firstImage(p);
          const safeImg = rawImg && rawImg.trim() !== "" ? rawImg : undefined;
          const img = toProxy(safeImg);

          const href = hrefForProduct
            ? hrefForProduct(p)
            : `/produits/${p.product_id}`;

          return (
            <Link
              key={p.product_id}
              href={href}
              onClick={onClick}
              data-carousel-card
              className={`snap-start border rounded-xl p-3 hover:shadow-lg bg-white shrink-0 ${cardClassName}`}
            >
              <div className="relative w-full h-36 mb-2">
                {img ? (
                  <Image
                    src={img}
                    alt={p.product_model ?? "Produit"}
                    fill
                    sizes="(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 220px"
                    className="object-contain pointer-events-none"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                    Pas d’image
                  </div>
                )}
              </div>

              <div className="text-sm font-semibold line-clamp-2">
                {p.product_model} SALUT
              </div>

              <div className="mt-1 flex items-baseline gap-2">
                {p.product_discount_price && Number(p.product_discount_price) > 0 ? (
                  <>
                    <div className="text-lg font-bold">{p.product_discount_price} €</div>
                    <div className="text-sm line-through opacity-60">
                      {p.product_price} €
                    </div>
                  </>
                ) : (
                  <div className="text-lg font-bold">{p.product_price} €</div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}