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

export default function DiaporamaClient({
  products,
  portrait = "0",
}: {
  products: HiboutikProduct[];
  portrait?: string;
}) {
  const items = products ?? [];

  const [mode, setMode] = React.useState<"grid" | "diapo">("grid");
  const [index, setIndex] = React.useState(0);
  const [gridPage, setGridPage] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [zoomItem, setZoomItem] = React.useState<HiboutikProduct | null>(null);

  const ITEMS_PER_PAGE = 9;

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);

  const currentGrid = items.slice(
    gridPage * ITEMS_PER_PAGE,
    gridPage * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  // 🔥 DIAPORAMA AUTO
  React.useEffect(() => {
    if (mode !== "diapo" || paused || !items.length) return;

    const t = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, 4000);

    return () => clearInterval(t);
  }, [mode, paused, items.length]);

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

        {/* ================= GRID MODE ================= */}
        {mode === "grid" && (
          <div className="w-full h-full flex flex-col p-6">
            <div className="grid grid-cols-3 grid-rows-3 gap-4 flex-1">
              {currentGrid.map((p, idx) => {
                const img = firstImage(p);

                return (
                  <div
                    key={idx}
                    className="relative bg-black cursor-pointer"
                    onClick={() => setZoomItem(p)}
                  >
                    <Image
                      src={img}
                      alt={p.product_model ?? ""}
                      fill
                      unoptimized
                      className="object-contain"
                    />

                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-sm">
                      <div className="truncate">{p.product_model}</div>
                      <div className="font-bold">
                        {formatPrice(
                          (p.product_discount_price ?? "0") !== "0"
                            ? p.product_discount_price
                            : p.product_price
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* NAV GRID */}
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() =>
                  setGridPage((p) => (p - 1 + totalPages) % totalPages)
                }
              >
                ◀
              </button>

              <button onClick={() => setMode("diapo")}>
                ▶ Lancer diaporama
              </button>

              <button
                onClick={() => setGridPage((p) => (p + 1) % totalPages)}
              >
                ▶
              </button>
            </div>
          </div>
        )}

        {/* ================= DIAPO MODE ================= */}
        {mode === "diapo" && (
          <div
            className="w-full h-full relative"
            onClick={() => setIndex((i) => (i + 1) % items.length)}
          >
            {(() => {
              const p: any = items[index];
              const img = firstImage(p);

              return (
                <>
                  <Image
                    src={img}
                    alt={p.product_model}
                    fill
                    unoptimized
                    className="object-contain"
                  />

                  <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-black/80">
                    <div className="text-5xl font-bold">
                      {p.product_model}
                    </div>
                    <div className="text-4xl mt-2">
                      {formatPrice(
                        (p.product_discount_price ?? "0") !== "0"
                          ? p.product_discount_price
                          : p.product_price
                      )}
                    </div>
                  </div>
                </>
              );
            })()}

            {/* CONTROLS */}
            <div className="absolute top-4 right-4 flex gap-4">
              <button onClick={() => setPaused((p) => !p)}>
                {paused ? "▶" : "⏸"}
              </button>

              <button onClick={() => setMode("grid")}>☰</button>
            </div>
          </div>
        )}

        {/* ================= ZOOM ================= */}
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