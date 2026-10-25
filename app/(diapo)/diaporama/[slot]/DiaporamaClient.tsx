"use client";

import React from "react";
import CutoutImage from "./CutoutImage";
import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { HiboutikProduct } from "@/app/types/ProductType";
import { buildAlternatingSequence } from "@/app/lib/diaporama-sequence";
import { getMessageDurationMs, firstImage } from "./helpers";
import type { DisplayMessage } from "./types";
import ProductSpotlight from "./ProductSpotlight";
import ProductBoard, { BOARD_INTRO_MS, BOARD_FOCUS_MS } from "./ProductBoard";
import ProductStatusOverlay from "./ProductStatusOverlay";
import MessageSlide from "./MessageSlide";
import SignageShell from "./SignageShell";
import styles from "./DiaporamaClient.module.css";

const ITEMS_PER_PAGE = 9;
const PRODUCT_DISPLAY_MS = 8200;

export default function DiaporamaClient({ products, messages = [], portrait = "0" }: {
  products: HiboutikProduct[]; messages?: DisplayMessage[]; portrait?: string;
}) {
  const [mode, setMode] = React.useState<"grid" | "sequence">("grid");
  const [gridPage, setGridPage] = React.useState(0);
  const [sequenceIndex, setSequenceIndex] = React.useState(0);
  const [messageOffset, setMessageOffset] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [zoomItem, setZoomItem] = React.useState<HiboutikProduct | null>(null);
  const totalPages = Math.max(1, Math.ceil(products.length / ITEMS_PER_PAGE));
  const currentGrid = React.useMemo(() => products.slice(
    (gridPage % totalPages) * ITEMS_PER_PAGE, (gridPage % totalPages + 1) * ITEMS_PER_PAGE
  ), [products, gridPage, totalPages]);
  const pageSteps = React.useMemo(() => buildAlternatingSequence(currentGrid, messages, messageOffset), [currentGrid, messages, messageOffset]);
  const currentStep = mode === "sequence" ? pageSteps[sequenceIndex] : null;
  const currentMessage = currentStep?.type === "message" ? currentStep.message : null;
  const currentProduct = currentStep?.type === "product" ? currentStep.product : null;
  const isPortrait = portrait === "1" || portrait === "-1";
  const isStopped = paused || !!zoomItem;

  const goGrid = React.useCallback((direction: number) => {
    setGridPage(page => (page + direction + totalPages) % totalPages);
    setMode("grid"); setSequenceIndex(0);
    setMessageOffset(offset => messages.length ? (offset + currentGrid.length) % messages.length : 0);
  }, [totalPages, messages.length, currentGrid.length]);

  const advance = React.useCallback(() => {
    if (mode === "grid") {
      setMode("sequence"); setSequenceIndex(0);
      return;
    }
    if (sequenceIndex + 1 < pageSteps.length) {
      setSequenceIndex(index => index + 1);
    } else {
      goGrid(1);
    }
  }, [mode, sequenceIndex, pageSteps.length, goGrid]);

  const durationMs = mode === "grid" ? BOARD_INTRO_MS + currentGrid.length * BOARD_FOCUS_MS
    : currentMessage ? getMessageDurationMs(currentMessage, 5) : PRODUCT_DISPLAY_MS;
  const sceneKey = mode === "grid" ? `grid-${gridPage}`
    : `${gridPage}-${currentStep?.key}`;

  React.useEffect(() => {
    if (isStopped || !pageSteps.length) return;
    const timer = window.setTimeout(advance, durationMs);
    return () => clearTimeout(timer);
  }, [isStopped, advance, durationMs, pageSteps.length]);

  return <SignageShell portrait={portrait} paused={isStopped} sceneKey={sceneKey} durationMs={durationMs}
    footer={paused ? "Lecture en pause" : mode === "grid" ? `La sélection · ${gridPage % totalPages + 1} / ${totalPages}`
      : currentProduct?.salePending ? "Vente en cours · à retrouver demain : notre nouvelle sélection" : "À découvrir en magasin"}
    controls={<>
    <div className={styles.controls}>
      <button className={styles.controlButton} aria-label={paused ? "Reprendre le diaporama" : "Mettre en pause"}
        onClick={() => {
          if (!paused) {
            setMode("grid"); setSequenceIndex(0); setZoomItem(null);
          }
          setPaused(value => !value);
        }}>{paused ? <Play size={18} /> : <Pause size={18} />}</button>
    </div>
    {paused && <nav className={styles.boardNavigation} aria-label="Navigation entre les planches">
      <button className={styles.boardNavButton} disabled={totalPages <= 1} onClick={() => goGrid(-1)}>
        <ChevronLeft size={22} /><span>Précédente</span>
      </button>
      <span className={styles.boardPageCount} aria-live="polite">Planche {gridPage % totalPages + 1} / {totalPages}</span>
      <button className={styles.boardNavButton} disabled={totalPages <= 1} onClick={() => goGrid(1)}>
        <span>Suivante</span><ChevronRight size={22} />
      </button>
    </nav>}
    </>}>
    <AnimatePresence mode="sync" initial={false}>
      <motion.div key={sceneKey} className="absolute inset-0"
        initial={{ opacity: 0, x: 65, scale: 1.03 }} animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -65, scale: .97, pointerEvents: "none" }}
        transition={{ duration: .55, ease: [.22, 1, .36, 1] }}>
        {mode === "grid" && <ProductBoard products={currentGrid} paused={isStopped} onZoom={setZoomItem} />}
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
