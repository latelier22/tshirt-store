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

// durée totale d'affichage d'un produit
const PRODUCT_DISPLAY_MS = 6200;

// apparition de l'étiquette / infos
const DIAPO_LABEL_DELAY_MS = 900;

// début de sortie avant la fin
const DIAPO_EXIT_MS = PRODUCT_DISPLAY_MS - 800;

// clic manuel pour passer plus vite
const CLICK_NEXT_MS = 760;

type SequenceStep =
  | {
      type: "product";
      key: string;
      product: HiboutikProduct;
    }
  | {
      type: "messages";
      key: string;
      messages: DisplayMessage[];
    };

function normalizeSortOrder(message: DisplayMessage): number {
  const value = Number(message.sortOrder ?? 999999);
  return Number.isFinite(value) ? value : 999999;
}

function groupMessagesByOrder(messages: DisplayMessage[]): DisplayMessage[][] {
  const sorted = [...(messages ?? [])].sort((a, b) => {
    const diff = normalizeSortOrder(a) - normalizeSortOrder(b);
    if (diff !== 0) return diff;

    const aId = Number(a.id ?? 0);
    const bId = Number(b.id ?? 0);
    return aId - bId;
  });

  const groups: DisplayMessage[][] = [];

  for (const message of sorted) {
    const order = normalizeSortOrder(message);
    const lastGroup = groups[groups.length - 1];

    if (!lastGroup || normalizeSortOrder(lastGroup[0]) !== order) {
      groups.push([message]);
    } else {
      lastGroup.push(message);
    }
  }

  return groups;
}

function buildInsertionPositions(
  productCount: number,
  groupCount: number
): number[] {
  if (groupCount <= 0) return [];

  // le premier groupe sera toujours juste après la grille
  if (productCount <= 0) {
    return Array.from({ length: groupCount }, () => 0);
  }

  const step = productCount / groupCount;

  return Array.from({ length: groupCount }, (_, i) => {
    const pos = Math.round(i * step);
    return Math.max(0, Math.min(productCount, pos));
  });
}

function buildSequenceSteps(
  pageProducts: HiboutikProduct[],
  messageGroups: DisplayMessage[][]
): SequenceStep[] {
  const steps: SequenceStep[] = [];

  if (!pageProducts.length && !messageGroups.length) {
    return steps;
  }

  const positions = buildInsertionPositions(
    pageProducts.length,
    messageGroups.length
  );

  const groupsByPosition = new Map<number, DisplayMessage[][]>();

  positions.forEach((position, groupIndex) => {
    const list = groupsByPosition.get(position) ?? [];
    list.push(messageGroups[groupIndex]);
    groupsByPosition.set(position, list);
  });

  for (let productIndex = 0; productIndex <= pageProducts.length; productIndex++) {
    const groupsAtThisPosition = groupsByPosition.get(productIndex) ?? [];

    groupsAtThisPosition.forEach((group, localIndex) => {
      steps.push({
        type: "messages",
        key: `messages-${productIndex}-${localIndex}-${group
          .map((m) => m.id)
          .join("-")}`,
        messages: group,
      });
    });

    if (productIndex < pageProducts.length) {
      const product = pageProducts[productIndex];
      steps.push({
        type: "product",
        key: `product-${product.product_id ?? productIndex}-${productIndex}`,
        product,
      });
    }
  }

  return steps;
}

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

  const [mode, setMode] = React.useState<"grid" | "sequence">("grid");
  const [gridPage, setGridPage] = React.useState(0);
  const [sequenceIndex, setSequenceIndex] = React.useState(0);
  const [messageIndexInGroup, setMessageIndexInGroup] = React.useState(0);

  const [paused, setPaused] = React.useState(false);
  const [zoomItem, setZoomItem] = React.useState<HiboutikProduct | null>(null);
  const [fade, setFade] = React.useState(true);
  const [diapoPhase, setDiapoPhase] = React.useState<DiapoPhase>("hero");

  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));

  React.useEffect(() => {
    if (gridPage >= totalPages) {
      setGridPage(0);
    }
  }, [gridPage, totalPages]);

  const currentGrid = React.useMemo(() => {
    const start = gridPage * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return items.slice(start, end);
  }, [items, gridPage]);

  const messageGroups = React.useMemo(() => {
    return groupMessagesByOrder(messages);
  }, [messages]);

  const pageSteps = React.useMemo(() => {
    return buildSequenceSteps(currentGrid, messageGroups);
  }, [currentGrid, messageGroups]);

  const currentStep =
    mode === "sequence" ? pageSteps[sequenceIndex] ?? null : null;

  const currentMessage =
    currentStep?.type === "messages"
      ? currentStep.messages[messageIndexInGroup] ?? null
      : null;

  const nextGrid = React.useCallback(() => {
    setGridPage((p) => (p + 1) % totalPages);
    setMode("grid");
    setSequenceIndex(0);
    setMessageIndexInGroup(0);
    setFade(true);
    setDiapoPhase("hero");
  }, [totalPages]);

  const prevGrid = React.useCallback(() => {
    setGridPage((p) => (p - 1 + totalPages) % totalPages);
    setMode("grid");
    setSequenceIndex(0);
    setMessageIndexInGroup(0);
    setFade(true);
    setDiapoPhase("hero");
  }, [totalPages]);

  const goToNextPageGrid = React.useCallback(() => {
    setMode("grid");
    setGridPage((p) => (p + 1) % totalPages);
    setSequenceIndex(0);
    setMessageIndexInGroup(0);
    setFade(true);
    setDiapoPhase("hero");
  }, [totalPages]);

  const advanceSequence = React.useCallback(() => {
    if (mode !== "sequence") return;

    if (!currentStep) {
      goToNextPageGrid();
      return;
    }

    // Si on est dans un groupe de messages, on enchaîne ceux du même order
    if (currentStep.type === "messages") {
      if (messageIndexInGroup < currentStep.messages.length - 1) {
        setMessageIndexInGroup((v) => v + 1);
        return;
      }
    }

    const nextIndex = sequenceIndex + 1;

    if (nextIndex >= pageSteps.length) {
      goToNextPageGrid();
      return;
    }

    setSequenceIndex(nextIndex);
    setMessageIndexInGroup(0);
    setFade(true);
    setDiapoPhase("hero");
  }, [
    mode,
    currentStep,
    messageIndexInGroup,
    sequenceIndex,
    pageSteps.length,
    goToNextPageGrid,
  ]);

  const nextProduct = React.useCallback(() => {
    if (mode !== "sequence") return;
    if (!currentStep || currentStep.type !== "product") return;

    setDiapoPhase("exit");
    setFade(false);

    window.setTimeout(() => {
      advanceSequence();
    }, CLICK_NEXT_MS);
  }, [mode, currentStep, advanceSequence]);

  React.useEffect(() => {
    if (paused || zoomItem || mode !== "grid") return;
    if (!pageSteps.length) return;

    const t = window.setTimeout(() => {
      setMode("sequence");
      setSequenceIndex(0);
      setMessageIndexInGroup(0);
      setFade(true);
      setDiapoPhase("hero");
    }, GRID_SECONDS * 1000);

    return () => clearTimeout(t);
  }, [paused, zoomItem, mode, pageSteps.length]);

  React.useEffect(() => {
    if (paused || zoomItem || mode !== "sequence" || !currentStep) return;

    if (currentStep.type === "messages" && currentMessage) {
      const t = window.setTimeout(() => {
        advanceSequence();
      }, getMessageDurationMs(currentMessage, 4));

      return () => clearTimeout(t);
    }

    if (currentStep.type === "product") {
      setFade(true);
      setDiapoPhase("hero");

      const t1 = window.setTimeout(() => {
        setDiapoPhase("label");
      }, DIAPO_LABEL_DELAY_MS);

      const t2 = window.setTimeout(() => {
        setDiapoPhase("exit");
        setFade(false);
      }, DIAPO_EXIT_MS);

      const t3 = window.setTimeout(() => {
        advanceSequence();
      }, PRODUCT_DISPLAY_MS);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [
    paused,
    zoomItem,
    mode,
    currentStep,
    currentMessage,
    advanceSequence,
  ]);

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

  const currentProduct =
    currentStep?.type === "product" ? currentStep.product : null;

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

          {mode === "sequence" && currentProduct && (
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
                      <EtiquetteProduit product={currentProduct} landscape />
                    </div>
                  </div>

                  <div
                    className="relative min-w-0 flex-1 cursor-pointer overflow-hidden rounded-2xl bg-black"
                    onClick={nextProduct}
                  >
                    <ProductVisual
                      key={`diapo-${currentProduct?.product_id}-${sequenceIndex}`}
                      product={currentProduct}
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
                      key={`diapo-${currentProduct?.product_id}-${sequenceIndex}`}
                      product={currentProduct}
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
                        product={currentProduct}
                        landscape={false}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {mode === "sequence" && currentMessage && (
            <div className="absolute inset-0 z-[60] p-6">
              <MessageSlide
                slideKey={`message-${currentMessage.id}-${sequenceIndex}-${messageIndexInGroup}`}
                message={currentMessage}
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
                  setSequenceIndex(0);
                  setMessageIndexInGroup(0);
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