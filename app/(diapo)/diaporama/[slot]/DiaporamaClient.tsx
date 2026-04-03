"use client";

import React from "react";
import Image from "next/image";
import Header from "@/components/Header";
import EtiquetteProduit from "./Etiquette";
import ProductUpdatesListener from "@/components/ProductUpdatesListener";
import MessageSlide from "./MessageSlide";
import ProductVisual from "./ProductVisual";
import type { DisplayMessage, DiapoPhase } from "./types";
import { getMessageDurationMs, firstImage } from "./helpers";
import type { HiboutikProduct } from "@/app/types/ProductType";

const ITEMS_PER_PAGE = 9;
const GRID_SECONDS = 5;
const DIAPO_LABEL_DELAY_MS = 900;
const DIAPO_EXIT_MS = 4600;
const DIAPO_NEXT_MS = 5400;
const CLICK_NEXT_MS = 760;

export default function DiaporamaClient({
  products,
  messages = [],
  portrait = "0",
}: {
  products: HiboutikProduct[];
  messages?: DisplayMessage[];
  portrait?: string;
}) {
  const items = products ?? [];

  const [mode, setMode] = React.useState<"grid" | "diapo">("grid");
  const [gridPage, setGridPage] = React.useState(0);
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [zoomItem, setZoomItem] = React.useState<HiboutikProduct | null>(null);
  const [fade, setFade] = React.useState(true);
  const [diapoPhase, setDiapoPhase] = React.useState<DiapoPhase>("hero");

  const [messageCursor, setMessageCursor] = React.useState(0);
  const [activeMessage, setActiveMessage] = React.useState<DisplayMessage | null>(null);
  const [messageTick, setMessageTick] = React.useState(0);

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

  const advanceToNext = React.useCallback(() => {
    if (!items.length) return;

    const next = index + 1;

    if (next >= items.length) {
      setMode("grid");
      setGridPage(0);
      setIndex(0);
      setFade(true);
      setDiapoPhase("hero");
      return;
    }

    if (next % ITEMS_PER_PAGE === 0) {
      setMode("grid");
      setGridPage((p) => (p + 1) % totalPages);
      setIndex(next);
      setFade(true);
      setDiapoPhase("hero");
      return;
    }

    setIndex(next);
    setFade(true);
    setDiapoPhase("hero");
  }, [index, items.length, totalPages]);

  const nextProduct = React.useCallback(() => {
    if (!items.length || activeMessage) return;

    setDiapoPhase("exit");
    setFade(false);

    window.setTimeout(() => {
      advanceToNext();
    }, CLICK_NEXT_MS);
  }, [items.length, activeMessage, advanceToNext]);

  React.useEffect(() => {
    if (!messages.length) {
      setMessageCursor(0);
      setActiveMessage(null);
      return;
    }

    setMessageCursor((prev) => prev % messages.length);
  }, [messages]);

  React.useEffect(() => {
    if (paused || zoomItem || activeMessage || !messages.length) return;

    const currentMessage = messages[messageCursor % messages.length];
    const delay =
      Math.max(1, Number(currentMessage.intervalSeconds ?? 10)) * 1000;

    const t = window.setTimeout(() => {
      setActiveMessage(currentMessage);
      setMessageTick((v) => v + 1);
    }, delay);

    return () => clearTimeout(t);
  }, [paused, zoomItem, activeMessage, messages, messageCursor]);

  React.useEffect(() => {
    if (!activeMessage) return;

    const t = window.setTimeout(() => {
      setActiveMessage(null);
      setMessageCursor((prev) =>
        messages.length ? (prev + 1) % messages.length : 0
      );
    }, getMessageDurationMs(activeMessage, 4));

    return () => clearTimeout(t);
  }, [activeMessage, messages.length]);

  React.useEffect(() => {
    if (paused || !items.length || activeMessage) return;

    if (mode === "grid") {
      const t = window.setTimeout(() => {
        setMode("diapo");
        setIndex(gridPage * ITEMS_PER_PAGE);
        setFade(true);
        setDiapoPhase("hero");
      }, GRID_SECONDS * 1000);

      return () => clearTimeout(t);
    }

    if (mode === "diapo") {
      setFade(true);
      setDiapoPhase("hero");

      const t1 = window.setTimeout(() => setDiapoPhase("label"), DIAPO_LABEL_DELAY_MS);
      const t2 = window.setTimeout(() => {
        setDiapoPhase("exit");
        setFade(false);
      }, DIAPO_EXIT_MS);
      const t3 = window.setTimeout(() => advanceToNext(), DIAPO_NEXT_MS);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [mode, index, paused, items.length, gridPage, advanceToNext, activeMessage]);

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
    <>
      <ProductUpdatesListener />

      <div className="fixed inset-0 overflow-hidden bg-black text-white">
        <div style={containerStyle}>
          {mode === "grid" && <Header />}

          {mode === "grid" && (
            <div className="flex h-full w-full flex-col p-6">
              <div className="grid flex-1 grid-cols-3 grid-rows-3 gap-4">
                {currentGrid.map((p, idx) => (
                  <div
                    key={`${p.product_id ?? idx}-${idx}`}
                    className="relative cursor-pointer overflow-hidden rounded-2xl bg-amber-500"
                    onClick={() => setZoomItem(p)}
                  >
                    <ProductVisual
                      product={p}
                      rotationMode={portrait}
                      phase="label"
                    />
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
            <div className="h-full w-full p-6">
              {!isPortrait ? (
                <div
                  className={[
                    "flex h-full w-full gap-6 overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    diapoPhase === "exit"
                      ? "translate-x-12 opacity-0"
                      : "translate-x-0 opacity-100",
                  ].join(" ")}
                >
                  <div
                    className="shrink-0 overflow-hidden transition-[width,opacity,transform] duration-900 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{
                      width: diapoPhase === "hero" ? 0 : 390,
                      maxWidth: "34%",
                      opacity: diapoPhase === "hero" ? 0 : 1,
                      transform:
                        diapoPhase === "hero"
                          ? "translateX(-24px)"
                          : diapoPhase === "exit"
                          ? "translateX(-12px)"
                          : "translateX(0)",
                    }}
                  >
                    <div className="h-full w-[390px] max-w-full">
                      <EtiquetteProduit product={items[index]} landscape />
                    </div>
                  </div>

                  <div
                    className="relative min-w-0 flex-1 cursor-pointer overflow-hidden rounded-2xl bg-black"
                    onClick={nextProduct}
                  >
                    <ProductVisual
                      key={`diapo-${items[index]?.product_id}-${index}`}
                      product={items[index]}
                      fade={fade}
                      large
                      showInfo
                      rotationMode={portrait}
                      phase={diapoPhase}
                    />
                  </div>
                </div>
              ) : (
                <div
                  className={[
                    "flex h-full w-full flex-col gap-4 overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    diapoPhase === "exit"
                      ? "-translate-y-12 opacity-0"
                      : "translate-y-0 opacity-100",
                  ].join(" ")}
                >
                  <div
                    className="relative min-h-0 flex-1 cursor-pointer overflow-hidden rounded-2xl bg-black"
                    onClick={nextProduct}
                  >
                    <ProductVisual
                      key={`diapo-${items[index]?.product_id}-${index}`}
                      product={items[index]}
                      fade={fade}
                      large
                      showInfo
                      rotationMode={portrait}
                      phase={diapoPhase}
                    />
                  </div>

                  <div
                    className="shrink-0 overflow-hidden transition-[height,opacity,transform] duration-900 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{
                      height: diapoPhase === "hero" ? 0 : 430,
                      maxHeight: "44%",
                      opacity: diapoPhase === "hero" ? 0 : 1,
                      transform:
                        diapoPhase === "hero"
                          ? "translateY(24px)"
                          : diapoPhase === "exit"
                          ? "translateY(12px)"
                          : "translateY(0)",
                    }}
                  >
                    <div className="h-[430px] max-h-full w-full">
                      <EtiquetteProduit
                        product={items[index]}
                        landscape={false}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeMessage && (
            <div className="absolute inset-0 z-[60] p-6">
              <MessageSlide
                slideKey={`message-${activeMessage.id}-${messageTick}`}
                message={activeMessage}
              />
            </div>
          )}

          <div className="absolute right-4 top-4 z-50">
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

         {zoomItem && firstImage(zoomItem) && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95">
              <div className="relative h-[80%] w-[80%]">
                <Image
                  src={firstImage(zoomItem)!}
                  alt={zoomItem.product_model ?? ""}
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>

              <button
                className="absolute right-4 top-4 text-3xl"
                onClick={() => setZoomItem(null)}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}