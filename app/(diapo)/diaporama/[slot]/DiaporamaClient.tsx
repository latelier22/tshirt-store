"use client";

import React from "react";
import CutoutImage from "./CutoutImage";
import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { HiboutikProduct } from "@/app/types/ProductType";
import { formatPrice } from "@/app/lib/utils";
import { getMessageDurationMs, firstImage, getEtatBadge, getPrice } from "./helpers";
import type { DisplayMessage } from "./types";
import ProductSpotlight from "./ProductSpotlight";
import ProductStatusOverlay from "./ProductStatusOverlay";
import MessageSlide from "./MessageSlide";
import SignageShell from "./SignageShell";
import styles from "./DiaporamaClient.module.css";

const ITEMS_PER_PAGE = 9;
const GRID_DISPLAY_MS = 6000;
const PRODUCT_DISPLAY_MS = 8200;

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

export default function DiaporamaClient({ products, messages = [], portrait = "0" }: {
  products: HiboutikProduct[]; messages?: DisplayMessage[]; portrait?: string;
}) {
  const [mode, setMode] = React.useState<"grid" | "sequence">("grid");
  const [gridPage, setGridPage] = React.useState(0);
  const [sequenceIndex, setSequenceIndex] = React.useState(0);
  const [messageIndexInGroup, setMessageIndexInGroup] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [zoomItem, setZoomItem] = React.useState<HiboutikProduct | null>(null);
  const totalPages = Math.max(1, Math.ceil(products.length / ITEMS_PER_PAGE));
  const currentGrid = React.useMemo(() => products.slice(
    (gridPage % totalPages) * ITEMS_PER_PAGE, (gridPage % totalPages + 1) * ITEMS_PER_PAGE
  ), [products, gridPage, totalPages]);
  const messageGroups = React.useMemo(() => groupMessagesByOrder(messages), [messages]);
  const pageSteps = React.useMemo(() => buildSequenceSteps(currentGrid, messageGroups), [currentGrid, messageGroups]);
  const currentStep = mode === "sequence" ? pageSteps[sequenceIndex] : null;
  const currentMessage = currentStep?.type === "messages" ? currentStep.messages[messageIndexInGroup] : null;
  const currentProduct = currentStep?.type === "product" ? currentStep.product : null;
  const isPortrait = portrait === "1" || portrait === "-1";
  const isStopped = paused || !!zoomItem;

  const goGrid = React.useCallback((direction: number) => {
    setGridPage(page => (page + direction + totalPages) % totalPages);
    setMode("grid"); setSequenceIndex(0); setMessageIndexInGroup(0);
  }, [totalPages]);

  const advance = React.useCallback(() => {
    if (mode === "grid") {
      setMode("sequence"); setSequenceIndex(0); setMessageIndexInGroup(0);
      return;
    }
    if (currentStep?.type === "messages" && messageIndexInGroup < currentStep.messages.length - 1) {
      setMessageIndexInGroup(index => index + 1);
    } else if (sequenceIndex + 1 < pageSteps.length) {
      setSequenceIndex(index => index + 1); setMessageIndexInGroup(0);
    } else {
      goGrid(1);
    }
  }, [mode, currentStep, messageIndexInGroup, sequenceIndex, pageSteps.length, goGrid]);

  const durationMs = mode === "grid" ? GRID_DISPLAY_MS
    : currentMessage ? getMessageDurationMs(currentMessage, 5) : PRODUCT_DISPLAY_MS;
  const sceneKey = mode === "grid" ? `grid-${gridPage}`
    : `${gridPage}-${currentStep?.key}-${messageIndexInGroup}`;

  React.useEffect(() => {
    if (isStopped || !pageSteps.length) return;
    const timer = window.setTimeout(advance, durationMs);
    return () => clearTimeout(timer);
  }, [isStopped, advance, durationMs, pageSteps.length]);

  return <SignageShell portrait={portrait} paused={isStopped} sceneKey={sceneKey} durationMs={durationMs}
    footer={paused ? "Lecture en pause" : mode === "grid" ? `La sélection · ${gridPage % totalPages + 1} / ${totalPages}`
      : currentProduct?.salePending ? "Vente en cours · à retrouver demain : notre nouvelle sélection" : "À découvrir en magasin"}
    controls={<div className={styles.controls}>
      {paused && <>
        <button className={styles.controlButton} onClick={() => goGrid(-1)} aria-label="Grille précédente"><ChevronLeft size={20} /></button>
        <button className={styles.controlButton} onClick={() => goGrid(1)} aria-label="Grille suivante"><ChevronRight size={20} /></button>
      </>}
      <button className={styles.controlButton} aria-label={paused ? "Reprendre le diaporama" : "Mettre en pause"}
        onClick={() => setPaused(value => !value)}>{paused ? <Play size={18} /> : <Pause size={18} />}</button>
    </div>}>
    <AnimatePresence mode="sync" initial={false}>
      <motion.div key={sceneKey} className="absolute inset-0"
        initial={{ opacity: 0, x: 65, scale: 1.03 }} animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -65, scale: .97, pointerEvents: "none" }}
        transition={{ duration: .55, ease: [.22, 1, .36, 1] }}>
        {mode === "grid" && <section className={styles.gridScene}>
          <div className={styles.gridHeading}>
            <h1>Repérez. <em>Craquez.</em></h1><span>La sélection en magasin</span>
          </div>
          <div className={styles.productGrid}>
            {currentGrid.map((product, index) => {
              const image = firstImage(product);
              const condition = getEtatBadge(product);
              return <motion.button key={product.product_id} className={styles.gridCard}
                onClick={() => setZoomItem(product)} aria-label={`Agrandir ${product.product_model || "le produit"}`}
                initial={{ opacity: 0, y: 40, scale: .9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * .055, duration: .6, ease: [.22, 1, .36, 1] }}>
                <div className={styles.gridImage} style={{ animationDelay: `${index * -.4}s` }}>
                  {image && <CutoutImage src={image} alt={product.product_model || ""} sizes="30vw" />}
                </div>
                <div className={styles.gridCardInfo}>
                  {condition && <span className={styles.gridCondition}>{condition.label}</span>}
                  <h2>{product.product_model}</h2><strong>{formatPrice(getPrice(product).price)}</strong>
                </div>
                <ProductStatusOverlay productId={product.product_id} salePending={product.salePending} />
              </motion.button>;
            })}
          </div>
        </section>}
        {currentProduct && <ProductSpotlight product={currentProduct} index={sequenceIndex}
          portrait={isPortrait} paused={isStopped} onNext={() => { if (!isStopped) advance(); }} />}
        {currentMessage && <MessageSlide message={currentMessage} slideKey={sceneKey} />}
      </motion.div>
    </AnimatePresence>
    <AnimatePresence>
      {zoomItem && <motion.div className={styles.zoom} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className={styles.zoomVisual}>
          {firstImage(zoomItem) && <CutoutImage src={firstImage(zoomItem)!} alt={zoomItem.product_model || ""} sizes="90vw" />}
          <ProductStatusOverlay productId={zoomItem.product_id} salePending={zoomItem.salePending} large />
        </div>
        <button className={`${styles.controlButton} ${styles.zoomClose}`} onClick={() => setZoomItem(null)} aria-label="Fermer le zoom"><X /></button>
      </motion.div>}
    </AnimatePresence>
  </SignageShell>;
}
