"use client";

import React from "react";
import Image from "next/image";
import type { HiboutikProduct } from "@/app/types/ProductType";
import { formatPrice } from "@/app/lib/utils";
import Header from "@/components/Header";

function firstImage(p: any) {
  const list = Array.isArray(p?.images) ? p.images : [];
  return p?.image ?? p?.thumb ?? list[0];
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

function getEtatTag(p: any) {
  const tags = p?.tags ?? [];
  return tags.find((t: any) => t.tag_cat === "ETAT");
}

function getEtatFromSlugs(p: any) {
  const slugs = (p?.tags_slug ?? []).map((s: string) => s.toLowerCase());

  // 🔵 NEUF
  if (slugs.some(s => s === "neuf")) {
    return { label: "NEUF", color: "bg-blue-600" };
  }

  // 🟢 TRÈS BON
  if (slugs.some(s => s.includes("tres-bon"))) {
    return { label: "TB", color: "bg-green-600" };
  }

  // 🟡 BON
  if (slugs.some(s => s.includes("bon-etat"))) {
    return { label: "BON", color: "bg-yellow-400 text-black" };
  }

  // 🔴 CORRECT
  if (slugs.some(s => s.includes("correct"))) {
    return { label: "OK", color: "bg-red-600" };
  }

  return null;
}


function getEtatStyle(tag?: string) {
  if (!tag) return null;

  const t = tag.toLowerCase();

  if (t === "neuf") {
    return { label: "NEUF", color: "bg-blue-600" };
  }

  if (t.includes("très bon")) {
    return { label: "TB", color: "bg-green-600" };
  }

  if (t.includes("bon état")) {
    return { label: "BON", color: "bg-yellow-400 text-black" };
  }

  if (t.includes("correct")) {
    return { label: "OK", color: "bg-red-600" };
  }

  return null;
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
  console.log("DiaporamaClient items", items);

  const [mode, setMode] = React.useState<"grid" | "diapo">("grid");
  const [gridPage, setGridPage] = React.useState(0);
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [zoomItem, setZoomItem] = React.useState<HiboutikProduct | null>(null);
  const [fade, setFade] = React.useState(true);

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);

  const currentGrid = items.slice(
    gridPage * ITEMS_PER_PAGE,
    gridPage * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  // 🔥 CYCLE AUTO
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
          if ((next % ITEMS_PER_PAGE === 0) || next >= items.length) {
            setMode("grid");
            setGridPage((p) => (p + 1) % totalPages);
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

        {/* ================= GRID ================= */}
        {mode === "grid" && (
          <div className="w-full h-full flex flex-col p-6">
            <div className="grid grid-cols-3 grid-rows-3 gap-4 flex-1">
              {currentGrid.map((p, idx) => {
                const { price, hasPromo, oldPrice } = getPrice(p);
                const etat = getEtatTag(p);
                const etatStyle = getEtatFromSlugs(p);

                return (
                  <div
  key={idx}
  className="relative cursor-pointer overflow-hidden"
  onClick={() => setZoomItem(p)}
>
  <Image
    src={firstImage(p)}
    alt=""
    fill
    unoptimized
    className="object-contain"
  />

  {/* 🔵 ETAT */}
  {etatStyle && (
    <div className={`
      absolute top-20 right-20
      w-30 h-30 rounded-full
      flex items-center justify-center
      text-xs font-bold
      shadow-lg
      z-20
      ${etatStyle.color}
    `}>
      {etatStyle.label}
    </div>
  )}

  {/* 🔴 PROMO */}
  {hasPromo && (
    <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded z-20">
      PROMO
    </div>
  )}

  <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-sm z-10">
    <div className="truncate">{p.product_model}</div>

    <div className="font-bold text-lg">
      {formatPrice(price ?? "0")}
    </div>

    {hasPromo && (
      <div className="text-xs line-through opacity-70">
        {formatPrice(oldPrice ?? "0")}
      </div>
    )}
  </div>
</div>
                );
              })}
            </div>

            {paused && (
              <div className="flex justify-between mt-4">
                <button onClick={() => setGridPage((p) => (p - 1 + totalPages) % totalPages)}>◀</button>
                <button onClick={() => setPaused(false)}>▶ Reprendre</button>
                <button onClick={() => setGridPage((p) => (p + 1) % totalPages)}>▶</button>
              </div>
            )}
          </div>
        )}

        {/* ================= DIAPO ================= */}
        {mode === "diapo" && (
          <div className="w-full h-full relative">
            {(() => {
              const p: any = items[index];
              const { price, hasPromo, oldPrice } = getPrice(p);
              const etat = getEtatTag(p);
              const etatStyle = getEtatFromSlugs(p);

              return (
                <>
                  <Image
                    src={firstImage(p)}
                    alt=""
                    fill
                    unoptimized
                    className={`
                      object-contain
                      transition-opacity duration-500
                      ${fade ? "opacity-100" : "opacity-0"}
                      animate-[zoomSlow_6s_linear]
                    `}
                  />

                  {/* 🔵 ETAT */}
                 {etatStyle && (
  <div className={`
    absolute top-50 right-50
    w-64 h-64 rounded-full
    flex items-center justify-center
    text-xl font-bold
    shadow-lg
    z-20
    ${etatStyle.color}
  `}>
    {etatStyle.label}
  </div>
)}

                  {/* 🔴 PROMO */}
                  {hasPromo && (
                    <div className="absolute top-10 left-10 bg-red-600 text-white text-2xl px-4 py-2 rounded">
                      PROMO
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-black/80">
                    <div className="text-5xl font-bold">{p.product_model}</div>

                    <div className="text-4xl mt-4 font-semibold drop-shadow-[0_0_10px_rgba(255,255,255,0.6)] animate-[pulsePrice_2s_infinite]">
                      {formatPrice(price ?? "0")}
                    </div>

                    {hasPromo && (
                      <div className="text-xl line-through opacity-70 mt-1">
                        {formatPrice(oldPrice ?? "0")}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* CONTROLS */}
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={() => {
              setPaused((p) => !p);
              setMode("grid");
            }}
            className="text-xl"
          >
            {paused ? "▶" : "⏸"}
          </button>
        </div>

        {/* ZOOM */}
        {zoomItem && (
          <div className="absolute inset-0 bg-black/95 flex items-center justify-center z-50">
            <div className="relative w-[80%] h-[80%]">
              <Image
                src={firstImage(zoomItem)}
                alt=""
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