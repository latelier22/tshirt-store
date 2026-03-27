"use client";

import React from "react";
import Image from "next/image";
import type { HiboutikProduct } from "@/app/types/ProductType";
import { formatPrice } from "@/app/lib/utils";
import Header from "@/components/Header";

type BadgeStyle = {
  label: string;
  color: string;
};

type Frame = {
  left: number;
  top: number;
  width: number;
  height: number;
};

function firstImage(p: any) {
  const list = Array.isArray(p?.images) ? p.images : [];
  return p?.image ?? p?.thumb ?? list[0] ?? "";
}

function getPrice(p: any) {
  const hasPromo =
    (p.product_discount_price ?? "0") !== "0" &&
    Number(p.product_discount_price) > 0;

  return {
    price: hasPromo ? p.product_discount_price : p.product_price,
    hasPromo,
    oldPrice: p.product_price,
  };
}

function normalizeText(v?: string) {
  return String(v ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getEtatStyle(label?: string): BadgeStyle | null {
  const t = normalizeText(label);
  if (!t) return null;

  if (t === "neuf") {
    return { label: "NEUF", color: "bg-blue-600 text-white" };
  }

  if (t.includes("tres bon")) {
    return { label: "TRÈS BON ÉTAT", color: "bg-green-600 text-white" };
  }

  if (t.includes("bon etat")) {
    return { label: "BON ÉTAT", color: "bg-yellow-400 text-black" };
  }

  if (t.includes("correct")) {
    return { label: "ÉTAT CORRECT", color: "bg-red-600 text-white" };
  }

  return { label: label ?? "", color: "bg-white text-black" };
}

function getEtatFromSlugs(p: any): BadgeStyle | null {
  const slugs: string[] = (p?.tags_slug ?? []).map((s: string) =>
    normalizeText(s)
  );

  if (slugs.some((s) => s === "neuf")) {
    return { label: "NEUF", color: "bg-blue-600 text-white" };
  }

  if (slugs.some((s) => s.includes("tres-bon") || s.includes("tres bon"))) {
    return { label: "TRÈS BON ÉTAT", color: "bg-green-600 text-white" };
  }

  if (slugs.some((s) => s.includes("bon-etat") || s.includes("bon etat"))) {
    return { label: "BON ÉTAT", color: "bg-yellow-400 text-black" };
  }

  if (slugs.some((s) => s.includes("correct"))) {
    return { label: "ÉTAT CORRECT", color: "bg-red-600 text-white" };
  }

  return null;
}

function getEtatBadge(p: any): BadgeStyle | null {
  const fullTags = Array.isArray(p?.fullTags) ? p.fullTags : [];
  const rawTags = Array.isArray(p?.tags) ? p.tags : [];

  const fullEtat = fullTags.find((t: any) => {
    const cat = normalizeText(t?.tag_cat);
    return cat === "etat" || cat.includes("etat");
  });

  if (fullEtat) {
    const label = fullEtat?.tag ?? fullEtat?.tag_label;
    return getEtatStyle(label);
  }

  const rawEtat = rawTags.find((t: any) => {
    const cat = normalizeText(t?.tag_cat);
    return cat === "etat" || cat.includes("etat");
  });

  if (rawEtat) {
    const label = rawEtat?.tag ?? rawEtat?.tag_label;
    return getEtatStyle(label);
  }

  return getEtatFromSlugs(p);
}

function computeContainFrame(
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number
): Frame | null {
  if (
    !containerWidth ||
    !containerHeight ||
    !imageWidth ||
    !imageHeight ||
    containerWidth <= 0 ||
    containerHeight <= 0 ||
    imageWidth <= 0 ||
    imageHeight <= 0
  ) {
    return null;
  }

  const scale = Math.min(
    containerWidth / imageWidth,
    containerHeight / imageHeight
  );

  const width = imageWidth * scale;
  const height = imageHeight * scale;
  const left = (containerWidth - width) / 2;
  const top = (containerHeight - height) / 2;

  return { left, top, width, height };
}

function ProductVisual({
  product,
  fade = true,
  large = false,
  onClick,
}: {
  product: any;
  fade?: boolean;
  large?: boolean;
  onClick?: () => void;
}) {
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const [box, setBox] = React.useState({ width: 0, height: 0 });
  const [img, setImg] = React.useState({ width: 0, height: 0 });

  const { price, hasPromo, oldPrice } = getPrice(product);
  const etatStyle = getEtatBadge(product);

  React.useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      setBox({
        width: rect.width,
        height: rect.height,
      });
    };

    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  const frame = React.useMemo(
    () => computeContainFrame(box.width, box.height, img.width, img.height),
    [box.width, box.height, img.width, img.height]
  );

  const badgePad = large ? 28 : 12;
  const badgeText = large ? "text-3xl" : "text-sm";
  const badgePadding = large ? "px-8 py-4" : "px-4 py-2";

  const promoPad = large ? 28 : 12;
  const promoText = large ? "text-2xl" : "text-xs";
  const promoPadding = large ? "px-6 py-3" : "px-3 py-1";

  const infoPadX = large ? 28 : 12;
  const infoPadBottom = large ? 28 : 12;
  const titleClass = large ? "text-5xl font-bold" : "text-sm font-medium";
  const priceClass = large
    ? "text-4xl mt-4 font-semibold drop-shadow-[0_0_10px_rgba(255,255,255,0.6)] animate-[pulsePrice_2s_infinite]"
    : "text-lg font-bold";
  const oldPriceClass = large
    ? "text-xl line-through opacity-70 mt-1"
    : "text-xs line-through opacity-70";

  return (
    <div ref={wrapperRef} className="absolute inset-0" onClick={onClick}>
      <Image
        src={firstImage(product)}
        alt={product?.product_model ?? ""}
        fill
        unoptimized
        className={`
          object-contain
          transition-opacity duration-500
          ${fade ? "opacity-100" : "opacity-0"}
          ${large ? "animate-[zoomSlow_6s_linear]" : ""}
        `}
        onLoad={(e) => {
          const target = e.currentTarget as HTMLImageElement;
          setImg({
            width: target.naturalWidth || 0,
            height: target.naturalHeight || 0,
          });
        }}
      />

      {frame && etatStyle && (
        <div
          className={`
            absolute z-20 rounded-full font-bold shadow-lg leading-tight text-right
            ${badgeText} ${badgePadding} ${etatStyle.color}
          `}
          style={{
            top: `${frame.top + badgePad}px`,
            right: `${Math.max(box.width - (frame.left + frame.width) + badgePad, 0)}px`,
            maxWidth: `${Math.max(frame.width * 0.72, 120)}px`,
          }}
        >
          {etatStyle.label}
        </div>
      )}

      {frame && hasPromo && (
        <div
          className={`
            absolute z-20 rounded-full bg-red-600 text-white font-bold shadow-lg
            ${promoText} ${promoPadding}
          `}
          style={{
            top: `${frame.top + promoPad}px`,
            left: `${frame.left + promoPad}px`,
          }}
        >
          PROMO
        </div>
      )}

      {frame && (
        <div
          className="absolute z-10"
          style={{
            left: `${frame.left}px`,
            width: `${frame.width}px`,
            bottom: `${Math.max(box.height - (frame.top + frame.height), 0)}px`,
          }}
        >
          <div
            className="bg-gradient-to-t from-black/85 via-black/65 to-transparent"
            style={{
              paddingLeft: `${infoPadX}px`,
              paddingRight: `${infoPadX}px`,
              paddingTop: large ? "80px" : "36px",
              paddingBottom: `${infoPadBottom}px`,
            }}
          >
            <div className={titleClass}>{product.product_model}</div>

            <div className={priceClass}>{formatPrice(price ?? "0")}</div>

            {hasPromo && (
              <div className={oldPriceClass}>{formatPrice(oldPrice ?? "0")}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DiaporamaClient({
  products,
  portrait = "0",
}: {
  products: HiboutikProduct[];
  portrait?: string;
}) {
  const items = products ?? [];
  const ITEMS_PER_PAGE = 9;

  const [mode, setMode] = React.useState<"grid" | "diapo">("grid");
  const [gridPage, setGridPage] = React.useState(0);
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [zoomItem, setZoomItem] = React.useState<HiboutikProduct | null>(null);
  const [fade, setFade] = React.useState(true);

  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));

  const currentGrid = items.slice(
    gridPage * ITEMS_PER_PAGE,
    gridPage * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  const nextGrid = React.useCallback(() => {
    setGridPage((p) => (p + 1) % totalPages);
    setMode("grid");
  }, [totalPages]);

  const prevGrid = React.useCallback(() => {
    setGridPage((p) => (p - 1 + totalPages) % totalPages);
    setMode("grid");
  }, [totalPages]);

  const nextProduct = React.useCallback(() => {
    if (!items.length) return;

    setFade(false);

    window.setTimeout(() => {
      const next = (index + 1) % items.length;
      setIndex(next);
      setGridPage(Math.floor(next / ITEMS_PER_PAGE));
      setFade(true);
    }, 180);
  }, [index, items.length]);

  React.useEffect(() => {
    if (paused || !items.length) return;

    if (mode === "grid") {
      const t = setTimeout(() => {
        setMode("diapo");
        setIndex(gridPage * ITEMS_PER_PAGE);
      }, 4000);

      return () => clearTimeout(t);
    }

    if (mode === "diapo") {
      const t = setTimeout(() => {
        const next = index + 1;

        setFade(false);

        setTimeout(() => {
          if (next >= items.length) {
            setMode("grid");
            setGridPage(0);
            setIndex(0);
          } else if (next % ITEMS_PER_PAGE === 0) {
            setMode("grid");
            setGridPage((p) => (p + 1) % totalPages);
            setIndex(next);
          } else {
            setIndex(next);
          }
          setFade(true);
        }, 300);
      }, 3000);

      return () => clearTimeout(t);
    }
  }, [mode, index, paused, items.length, gridPage, totalPages]);

  const isPortrait = portrait === "1" || portrait === "-1";
  const angle = portrait === "-1" ? -90 : 90;

  const containerStyle = isPortrait
    ? {
        position: "absolute" as const,
        top: "50%",
        left: "50%",
        width: "100vh",
        height: "100vw",
        transform: `translate(-50%, -50%) rotate(${angle}deg)`,
      }
    : {
        position: "absolute" as const,
        inset: 0,
      };

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden">
      <div style={containerStyle}>
        <Header />

        {mode === "grid" && (
          <div className="w-full h-full flex flex-col p-6">
            <div className="grid grid-cols-3 grid-rows-3 gap-4 flex-1">
              {currentGrid.map((p, idx) => (
                <div
                  key={idx}
                  className="relative cursor-pointer overflow-hidden rounded-2xl bg-black"
                  onClick={() => setZoomItem(p)}
                >
                  <ProductVisual product={p} />
                </div>
              ))}
            </div>

            {paused && (
              <div className="mt-4 flex items-center justify-center gap-6">
                <button
                  onClick={prevGrid}
                  className="rounded-full bg-white/10 px-6 py-3 text-2xl hover:bg-white/20"
                >
                  ◀
                </button>

                <div className="text-lg font-semibold">
                  Grille {gridPage + 1} / {totalPages}
                </div>

                <button
                  onClick={nextGrid}
                  className="rounded-full bg-white/10 px-6 py-3 text-2xl hover:bg-white/20"
                >
                  ▶
                </button>
              </div>
            )}
          </div>
        )}

        {mode === "diapo" && items[index] && (
          <div className="w-full h-full relative">
            <div className="absolute inset-0 cursor-pointer" onClick={nextProduct}>
              <ProductVisual product={items[index]} fade={fade} large />
            </div>
          </div>
        )}

        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={() => {
              if (paused) {
                setPaused(false);
              } else {
                setPaused(true);
                setMode("grid");
              }
            }}
            className="rounded-full bg-black/60 px-4 py-2 text-xl"
          >
            {paused ? "▶" : "⏸"}
          </button>
        </div>

        {zoomItem && (
          <div className="absolute inset-0 bg-black/95 flex items-center justify-center z-50">
            <div className="relative w-[80%] h-[80%]">
              <Image
                src={firstImage(zoomItem)}
                alt={zoomItem.product_model ?? ""}
                fill
                unoptimized
                className="object-contain"
              />
            </div>

            <button
              className="absolute top-4 right-4 text-3xl"
              onClick={() => setZoomItem(null)}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}