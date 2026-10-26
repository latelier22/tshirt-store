"use client";

import React from "react";
import ProductImage from "./ProductImage";
import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { HiboutikProduct } from "@/app/types/ProductType";
import { buildAlternatingSequence } from "@/app/lib/diaporama-sequence";
import { getMessageDurationMs } from "./helpers";
import type { DisplayMessage } from "./types";
import ProductSpotlight from "./ProductSpotlight";
import ProductBoard, { BOARD_INTRO_MS, BOARD_FOCUS_MS } from "./ProductBoard";
import ProductStatusOverlay from "./ProductStatusOverlay";
import MessageSlide from "./MessageSlide";
import SignageShell from "./SignageShell";
import { usePreparedImages } from "./PreparedImagesProvider";
import { resolveProductImage } from "@/app/lib/diaporama-assets";
import PreparationScreen from "./PreparationScreen";
import { BOARD_IMAGE_SIZES, HERO_IMAGE_SIZES, preloadProductImages, waitForProductImages } from "./preloadImages";
import styles from "./DiaporamaClient.module.css";

const ITEMS_PER_PAGE = 9;
const PRODUCT_DISPLAY_MS = 8200;

export default function DiaporamaClient({ products, messages = [], portrait = "0" }: {
  products: HiboutikProduct[]; messages?: DisplayMessage[]; portrait?: string;
}) {
  const { entries, loading: manifestLoading } = usePreparedImages();
  const [startupReady, setStartupReady] = React.useState(false);
  const [waiting, setWaiting] = React.useState(false);
  const generation = React.useRef(0);
  const preparing = React.useRef(false);
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

  React.useEffect(() => () => { generation.current++; }, []);

  React.useEffect(() => {
    if (startupReady || manifestLoading) return;
    let cancelled = false;
    const minimum = messages[0] ? getMessageDurationMs(messages[0], 4) : 2500;
    void Promise.all([
      waitForProductImages(currentGrid, BOARD_IMAGE_SIZES, entries, () => !cancelled),
      new Promise(resolve => window.setTimeout(resolve, minimum)),
    ]).then(([ready]) => { if (ready && !cancelled) setStartupReady(true); });
    return () => { cancelled = true; };
  }, [startupReady, manifestLoading, currentGrid, messages, entries]);

  const prepareAndCommit = React.useCallback(async (items: HiboutikProduct[], sizes: string, commit: () => void) => {
    const token = ++generation.current;
    preparing.current = true; setWaiting(true);
    const ready = await waitForProductImages(items, sizes, entries, () => generation.current === token);
    if (generation.current !== token) return;
    preparing.current = false; setWaiting(false);
    if (ready) commit();
  }, [entries]);

  const cancelPreparation = () => {
    generation.current++; preparing.current = false; setWaiting(false);
  };

  const goGrid = React.useCallback((direction: number) => {
    const nextPage = (gridPage + direction + totalPages) % totalPages;
    const nextProducts = products.slice(nextPage * ITEMS_PER_PAGE, (nextPage + 1) * ITEMS_PER_PAGE);
    return prepareAndCommit(nextProducts, BOARD_IMAGE_SIZES, () => {
      setGridPage(nextPage); setMode("grid"); setSequenceIndex(0);
      setMessageOffset(offset => messages.length ? (offset + currentGrid.length) % messages.length : 0);
    });
  }, [gridPage, totalPages, products, messages.length, currentGrid.length, prepareAndCommit]);

  const advance = React.useCallback(() => {
    if (preparing.current) return;
    const nextIndex = mode === "grid" ? 0 : sequenceIndex + 1;
    if (nextIndex >= pageSteps.length) { void goGrid(1); return; }
    const next = pageSteps[nextIndex];
    const commit = () => { setMode("sequence"); setSequenceIndex(nextIndex); };
    if (next.type === "product") void prepareAndCommit([next.product], HERO_IMAGE_SIZES, commit);
    else commit();
  }, [mode, sequenceIndex, pageSteps, goGrid, prepareAndCommit]);

  // Prepare just the upcoming product (or board), keeping decoded-image memory bounded.
  React.useEffect(() => {
    if (!startupReady || isStopped) return;
    const upcoming = pageSteps.slice(mode === "grid" ? 0 : sequenceIndex + 1)
      .find(step => step.type === "product");
    if (upcoming?.type === "product") void preloadProductImages([upcoming.product], HERO_IMAGE_SIZES, entries);
    else {
      const nextPage = (gridPage + 1) % totalPages;
      void preloadProductImages(products.slice(nextPage * ITEMS_PER_PAGE, (nextPage + 1) * ITEMS_PER_PAGE), BOARD_IMAGE_SIZES, entries);
    }
  }, [startupReady, isStopped, pageSteps, mode, sequenceIndex, gridPage, totalPages, products, entries]);

  const durationMs = mode === "grid" ? BOARD_INTRO_MS + currentGrid.length * BOARD_FOCUS_MS
    : currentMessage ? getMessageDurationMs(currentMessage, 5) : PRODUCT_DISPLAY_MS;
  const sceneKey = mode === "grid" ? `grid-${gridPage}`
    : `${gridPage}-${currentStep?.key}`;

  React.useEffect(() => {
    if (!startupReady || isStopped || !pageSteps.length) return;
    const timer = window.setTimeout(advance, durationMs);
    return () => clearTimeout(timer);
  }, [startupReady, isStopped, advance, durationMs, pageSteps.length]);

  if (!startupReady) return <PreparationScreen portrait={portrait} message={messages[0]} />;

  return <SignageShell portrait={portrait} paused={isStopped} sceneKey={sceneKey} durationMs={durationMs}
    footer={waiting ? "La suite arrive…" : paused ? "Lecture en pause" : mode === "grid" ? `La sélection · ${gridPage % totalPages + 1} / ${totalPages}`
      : currentProduct?.salePending ? "Vente en cours · à retrouver demain : notre nouvelle sélection" : "À découvrir en magasin"}
    controls={<>
    <div className={styles.controls}>
      <button className={styles.controlButton} aria-label={paused ? "Reprendre le diaporama" : "Mettre en pause"}
        onClick={() => {
          cancelPreparation();
          if (!paused) {
            setMode("grid"); setSequenceIndex(0); setZoomItem(null);
          }
          setPaused(value => !value);
        }}>{paused ? <Play size={18} /> : <Pause size={18} />}</button>
    </div>
    {paused && <nav className={styles.boardNavigation} aria-label="Navigation entre les planches">
      <button className={styles.boardNavButton} disabled={totalPages <= 1 || waiting} onClick={() => goGrid(-1)}>
        <ChevronLeft size={22} /><span>Précédente</span>
      </button>
      <span className={styles.boardPageCount} aria-live="polite">Planche {gridPage % totalPages + 1} / {totalPages}</span>
      <button className={styles.boardNavButton} disabled={totalPages <= 1 || waiting} onClick={() => goGrid(1)}>
        <span>Suivante</span><ChevronRight size={22} />
      </button>
    </nav>}
    </>}>
      <div key={sceneKey} className="absolute inset-0">
        {mode === "grid" && <ProductBoard products={currentGrid} paused={isStopped} onZoom={product => { cancelPreparation(); setZoomItem(product); }} />}
        {currentProduct && <ProductSpotlight product={currentProduct} index={sequenceIndex}
          portrait={isPortrait} onNext={() => { if (!isStopped) advance(); }} />}
        {currentMessage && <MessageSlide message={currentMessage} slideKey={sceneKey} />}
      </div>
    <AnimatePresence>
      {zoomItem && <motion.div className={styles.zoom} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className={styles.zoomVisual}>
          <ProductImage plan={resolveProductImage(zoomItem, entries.get(Number(zoomItem.product_id)), "individual")} alt={zoomItem.product_model || ""} sizes="90vw" />
          <ProductStatusOverlay productId={zoomItem.product_id} salePending={zoomItem.salePending} large />
        </div>
        <button className={`${styles.controlButton} ${styles.zoomClose}`} onClick={() => setZoomItem(null)} aria-label="Fermer le zoom"><X /></button>
      </motion.div>}
    </AnimatePresence>
  </SignageShell>;
}
