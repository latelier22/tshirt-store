"use client";

import { useEffect, useState, type CSSProperties } from "react";
import CutoutImage, { prepareCutout } from "./CutoutImage";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { HiboutikProduct } from "@/app/types/ProductType";
import { formatPrice } from "@/app/lib/utils";
import { firstImage, getEtatBadge, getPrice } from "./helpers";
import AnimatedWords from "./AnimatedWords";
import StageDecor from "./StageDecor";
import ProductStatusOverlay from "./ProductStatusOverlay";
import styles from "./DiaporamaClient.module.css";

type Attribute = { code?: string; label?: string; value?: string };
type SpotlightProduct = HiboutikProduct & {
  product_brand_name?: string; attributes?: Attribute[]; misc_text?: string | Attribute[];
};

function readAttributes(product: SpotlightProduct): Attribute[] {
  let source: unknown = product.attributes ?? product.misc_text ?? [];
  if (typeof source === "string") {
    try { source = JSON.parse(source); } catch { return []; }
  }
  if (!Array.isArray(source)) return [];
  return source.filter((attribute): attribute is Attribute =>
    attribute && typeof attribute === "object" && String(attribute.value ?? "").trim()
  );
}

export default function ProductSpotlight({ product, index, portrait, paused, onNext }: {
  product: SpotlightProduct; index: number; portrait: boolean; paused: boolean; onNext: () => void;
}) {
  const reduced = useReducedMotion();
  const [view, setView] = useState(0);
  const first = firstImage(product);
  const images = [...new Set([first, ...(product.images ?? [])].filter((src): src is string => !!src))]
    .filter((src, _, list) => list.length === 1 || !decodeURIComponent(src).includes("/mini_"))
    .slice(0, 3);
  const sources = images.length ? images : first ? [first] : [];
  const imageSignature = sources.join("|");

  useEffect(() => {
    for (const src of imageSignature.split("|").filter(Boolean)) void prepareCutout(src);
  }, [imageSignature]);

  useEffect(() => {
    if (paused || reduced || sources.length < 2) return;
    const timer = window.setInterval(() => setView(current => (current + 1) % sources.length), 2600);
    return () => clearInterval(timer);
  }, [paused, reduced, sources.length, imageSignature]);

  const attributes = readAttributes(product);
  const guarantee = attributes.find(attribute => /garant/i.test(`${attribute.code} ${attribute.label}`));
  const features = attributes.filter(attribute => !/garant/i.test(`${attribute.code} ${attribute.label}`)).slice(0, 4);
  const { price, oldPrice, hasPromo } = getPrice(product);
  const condition = getEtatBadge(product);
  const accent = index % 2 === 0 ? "#ff8a36" : "#66d8ff";
  const currentSource = sources[view % Math.max(1, sources.length)];

  return <article className={`${styles.spotlight} ${portrait ? styles.spotlightPortrait : ""}`}
    style={{ "--accent": accent } as CSSProperties}>
    <StageDecor />
    <div className={styles.spotlightCopy}>
      <motion.div className={styles.eyebrow} initial={{ opacity: 0, x: -25 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .15 }}>
        <span className={styles.liveDot} /> {product.product_brand_name || "MULTIMÉDIA SERVICES"}
      </motion.div>
      {condition && <motion.div className={styles.conditionTag} initial={{ opacity: 0, scale: .8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .3 }}>
        {condition.label}
      </motion.div>}
      <h1 className={styles.productTitle}><AnimatedWords text={product.product_model || "À découvrir"} delay={.15} /></h1>
      <motion.div className={styles.priceBlock} initial={{ opacity: 0, y: 45, scale: .85 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: .65, type: "spring", stiffness: 180, damping: 18 }}>
        {hasPromo && <span className={styles.promoTag}>PRIX PROMO</span>}
        <span className={styles.heroPrice}>{formatPrice(price)}</span>
        {hasPromo && <span className={styles.oldPrice}>{formatPrice(oldPrice)}</span>}
      </motion.div>
      <div className={styles.features}>
        {features.map((feature, featureIndex) => <motion.div className={styles.feature} key={`${feature.code}-${featureIndex}`}
          initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: .8 + featureIndex * .12, duration: .45 }}>
          <span>{feature.label || feature.code}</span><strong>{feature.value}</strong>
        </motion.div>)}
      </div>
      {guarantee?.value && <motion.div className={styles.guarantee} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}>
        <span>✓</span> Garantie {guarantee.value}
      </motion.div>}
    </div>
    <button className={styles.productStage} onClick={onNext} aria-label="Afficher le produit suivant">
      <span className={styles.stageWord} aria-hidden="true">{product.product_brand_name || "DÉCOUVRIR"}</span>
      <div className={styles.productHalo} />
      <div className={styles.groundShadow} aria-hidden="true" />
      <div className={styles.imageFloat}>
        <AnimatePresence mode="sync" initial={false}>
          {currentSource && <motion.div key={currentSource} className={styles.heroImage}
            initial={{ opacity: 0, x: reduced ? 0 : 65, scale: reduced ? 1 : .86, rotate: reduced ? 0 : 7 }}
            animate={{ opacity: 1, x: 0, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, x: reduced ? 0 : -50, scale: reduced ? 1 : 1.08 }}
            transition={{ duration: .7, ease: [.22, 1, .36, 1] }}>
            <CutoutImage src={currentSource} alt={product.product_model || "Produit"} priority
              className={styles.productImage} sizes="70vw" />
          </motion.div>}
        </AnimatePresence>
      </div>
      <div className={styles.imageShine} aria-hidden="true" />
      {sources.length > 1 && <div className={styles.viewDots} aria-label={`Vue ${view % sources.length + 1} sur ${sources.length}`}>
        {sources.map((src, sourceIndex) => <span key={src} data-active={sourceIndex === view % sources.length} />)}
      </div>}
    </button>
    <ProductStatusOverlay productId={product.product_id} salePending={product.salePending} large />
  </article>;
}
