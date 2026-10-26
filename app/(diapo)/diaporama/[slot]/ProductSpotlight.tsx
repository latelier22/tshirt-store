"use client";

import { useMemo, type CSSProperties } from "react";
import ProductImage from "./ProductImage";
import PreparedNeon from "./PreparedNeon";
import { HERO_IMAGE_SIZES } from "./preloadImages";
import { motion } from "framer-motion";
import type { HiboutikProduct } from "@/app/types/ProductType";
import { formatPrice } from "@/app/lib/utils";
import { getEtatBadge, getPrice } from "./helpers";
import { resolveProductImage } from "@/app/lib/diaporama-assets";
import { usePreparedImages } from "./PreparedImagesProvider";
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

export default function ProductSpotlight({ product, index, portrait, onNext }: {
  product: SpotlightProduct; index: number; portrait: boolean; paused?: boolean; onNext: () => void;
}) {
  const { entries } = usePreparedImages();
  const plan = useMemo(() => resolveProductImage(product, entries.get(Number(product.product_id)), "individual"), [product, entries]);

  const neon = useMemo(() => resolveProductImage(product, entries.get(Number(product.product_id)), "individual-neon"), [product, entries]);

  const attributes = readAttributes(product);
  const guarantee = attributes.find(attribute => /garant/i.test(`${attribute.code} ${attribute.label}`));
  const features = attributes.filter(attribute => !/garant/i.test(`${attribute.code} ${attribute.label}`)).slice(0, 4);
  const { price, oldPrice, hasPromo } = getPrice(product);
  const condition = getEtatBadge(product);
  const accent = index % 2 === 0 ? "#ff8a36" : "#66d8ff";

  return <article className={`${styles.spotlight} ${portrait ? styles.spotlightPortrait : ""}`} data-animated-neon={neon.effects}
    style={{ "--accent": accent } as CSSProperties}>
    <StageDecor />
    <div className={styles.spotlightCopy}>
      <motion.div className={styles.eyebrow} initial={false} animate={{ opacity: 1, x: 0 }} transition={{ delay: .15 }}>
        <span className={styles.liveDot} /> {product.product_brand_name || "MULTIMÉDIA SERVICES"}
      </motion.div>
      {condition && <motion.div className={styles.conditionTag} initial={false} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .3 }}>
        {condition.label}
      </motion.div>}
      <h1 className={styles.productTitle}><AnimatedWords text={product.product_model || "À découvrir"} delay={.15} /></h1>
      <motion.div className={styles.priceBlock} initial={false} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: .65, type: "spring", stiffness: 180, damping: 18 }}>
        {hasPromo && <span className={styles.promoTag}>PRIX PROMO</span>}
        <span className={styles.heroPrice}>{formatPrice(price)}</span>
        {hasPromo && <span className={styles.oldPrice}>{formatPrice(oldPrice)}</span>}
      </motion.div>
      <div className={styles.features}>
        {features.map((feature, featureIndex) => <motion.div className={styles.feature} key={`${feature.code}-${featureIndex}`}
          initial={false} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: .8 + featureIndex * .12, duration: .45 }}>
          <span>{feature.label || feature.code}</span><strong>{feature.value}</strong>
        </motion.div>)}
      </div>
      {guarantee?.value && <motion.div className={styles.guarantee} initial={false} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}>
        <span>✓</span> Garantie {guarantee.value}
      </motion.div>}
    </div>
    <button className={styles.productStage} onClick={onNext} aria-label="Afficher le produit suivant">
      <span className={styles.stageWord} aria-hidden="true">{product.product_brand_name || "DÉCOUVRIR"}</span>
      <div className={styles.productHalo} />
      <div className={styles.imageFloat}>
        <div className={styles.heroImage}>
          <ProductImage plan={plan} alt={product.product_model || "Produit"} priority
            className={styles.productImage} sizes={HERO_IMAGE_SIZES} />
          {neon.effects && <PreparedNeon base={plan} neon={neon} sizes={HERO_IMAGE_SIZES} prominent />}
        </div>
      </div>
    </button>
    <ProductStatusOverlay productId={product.product_id} salePending={product.salePending} large />
  </article>;
}
