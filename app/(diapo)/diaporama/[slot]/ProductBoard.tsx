"use client";

import { memo, useEffect, useMemo, useState } from "react";
import type { HiboutikProduct } from "@/app/types/ProductType";
import { formatPrice } from "@/app/lib/utils";
import { resolveProductImage, type PreparedEntry } from "@/app/lib/diaporama-assets";
import { getEtatBadge, getPrice } from "./helpers";
import ProductImage from "./ProductImage";
import PreparedNeon from "./PreparedNeon";
import { BOARD_IMAGE_SIZES, preloadBoardEffect } from "./preloadImages";
import { usePreparedImages } from "./PreparedImagesProvider";
import ProductStatusOverlay from "./ProductStatusOverlay";
import styles from "./DiaporamaClient.module.css";

export const BOARD_INTRO_MS = 700;
export const BOARD_FOCUS_MS = 1800;
const Tile = memo(function Tile({ product, entry, focused, onZoom }: {
  product: HiboutikProduct; entry?: PreparedEntry; focused: boolean; onZoom: (product: HiboutikProduct) => void;
}) {
  const normal = useMemo(() => resolveProductImage(product, entry, "board"), [product, entry]);
  const active = useMemo(() => resolveProductImage(product, entry, "active"), [product, entry]);
  const [hasHalo, setHasHalo] = useState(false);
  const condition = getEtatBadge(product);
  return <button className={styles.gridCard} data-focused={focused} data-silhouette-halo={focused && hasHalo && active.effects}
    onClick={() => onZoom(product)} aria-label={`Agrandir ${product.product_model || "le produit"}`}>
    <div className={styles.boardImageLift}><div className={styles.boardImageFloat}>
      <ProductImage plan={normal} alt={product.product_model || ""} sizes={BOARD_IMAGE_SIZES} />
      {focused && active.effects && <PreparedNeon base={normal} neon={active} productId={product.product_id} variant={product.product_id % 3} sizes={BOARD_IMAGE_SIZES} onVisibleChange={setHasHalo} />}
    </div></div>
    <div className={styles.gridCardInfo}>
      {condition && <span className={styles.gridCondition}>{condition.label}</span>}
      <h2>{product.product_model}</h2><strong>{formatPrice(getPrice(product).price)}</strong>
    </div>
    <ProductStatusOverlay productId={product.product_id} salePending={product.salePending} />
  </button>;
});

export default function ProductBoard({ products, paused, onZoom }: {
  products: HiboutikProduct[]; paused: boolean; onZoom: (product: HiboutikProduct) => void;
}) {
  const [active, setActive] = useState(-1);
  const { entries } = usePreparedImages();
  useEffect(() => {
    if (paused || !products.length) return;
    const timer = window.setTimeout(() => setActive(current => (current + 1) % products.length),
      active < 0 ? BOARD_INTRO_MS : BOARD_FOCUS_MS);
    return () => clearTimeout(timer);
  }, [active, paused, products.length]);
  useEffect(() => {
    if (paused || !products.length) return;
    void preloadBoardEffect(products[(active + 1) % products.length], entries);
  }, [active, products, entries, paused]);
  return <section className={styles.gridScene}>
    <div className={styles.gridHeading}><h1>Repérez. <em>Craquez.</em></h1><span>La sélection en magasin</span></div>
    <div className={styles.productGrid}>
      {products.map((product, index) => <Tile key={product.product_id} product={product}
        entry={entries.get(Number(product.product_id))} focused={index === active} onZoom={onZoom} />)}
    </div>
  </section>;
}
