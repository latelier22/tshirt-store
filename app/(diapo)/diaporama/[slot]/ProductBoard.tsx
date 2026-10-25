"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { HiboutikProduct } from "@/app/types/ProductType";
import { formatPrice } from "@/app/lib/utils";
import { firstImage, getEtatBadge, getPrice } from "./helpers";
import CutoutImage from "./CutoutImage";
import ProductStatusOverlay from "./ProductStatusOverlay";
import styles from "./DiaporamaClient.module.css";

export const BOARD_INTRO_MS = 700;
export const BOARD_FOCUS_MS = 1800;

export default function ProductBoard({ products, paused, onZoom }: {
  products: HiboutikProduct[]; paused: boolean; onZoom: (product: HiboutikProduct) => void;
}) {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(-1);

  useEffect(() => {
    if (paused || !products.length) return;
    const timer = window.setTimeout(() => setActive(current => (current + 1) % products.length),
      active < 0 ? BOARD_INTRO_MS : BOARD_FOCUS_MS);
    return () => clearTimeout(timer);
  }, [active, paused, products.length]);

  return <section className={styles.gridScene}>
    <div className={styles.gridHeading}>
      <h1>Repérez. <em>Craquez.</em></h1><span>La sélection en magasin</span>
    </div>
    <div className={styles.productGrid}>
      {products.map((product, index) => {
        const image = firstImage(product);
        const condition = getEtatBadge(product);
        const focused = index === active;
        return <motion.button key={product.product_id} className={styles.gridCard} data-focused={focused}
          onClick={() => onZoom(product)} aria-label={`Agrandir ${product.product_model || "le produit"}`}
          initial={{ opacity: 0, y: 40, scale: .9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: index * .055, duration: .6, ease: [.22, 1, .36, 1] }}>
          <motion.div className={styles.boardImageLift}
            animate={{ scale: focused && !reduced ? 1.12 : 1 }}
            transition={{ duration: .55, ease: [.22, 1, .36, 1] }}>
            <div className={styles.boardImageFloat} style={{ animationDelay: `${index * -.4}s` }}>
              {image && <CutoutImage src={image} alt={product.product_model || ""} sizes="40vw" />}
            </div>
          </motion.div>
          <div className={styles.gridCardInfo}>
            {condition && <span className={styles.gridCondition}>{condition.label}</span>}
            <h2>{product.product_model}</h2><strong>{formatPrice(getPrice(product).price)}</strong>
          </div>
          <ProductStatusOverlay productId={product.product_id} salePending={product.salePending} />
        </motion.button>;
      })}
    </div>
  </section>;
}
