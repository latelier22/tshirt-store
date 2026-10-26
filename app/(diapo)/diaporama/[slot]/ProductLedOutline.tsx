"use client";

import { useId } from "react";
import type { ProductOutline } from "@/app/lib/product-outline";
import styles from "./ProductLedOutline.module.css";

/** The running light follows the extracted product path, never its rectangular image bounds. */
export default function ProductLedOutline({ outline, variant = 0 }: {
  outline: ProductOutline; variant?: number;
}) {
  const id = useId().replace(/:/g, "");
  const gradient = `led-${id}`;
  return <svg className={styles.ledOutline} viewBox={`0 0 ${outline.width} ${outline.height}`}
    preserveAspectRatio="xMidYMid meet" aria-hidden="true" data-pattern={variant % 3}>
    <defs>
      <linearGradient id={gradient} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ff913b" />
        <stop offset="35%" stopColor="#ff54ae" />
        <stop offset="70%" stopColor="#956aff" />
        <stop offset="100%" stopColor="#64e9ff" />
      </linearGradient>
    </defs>
    <g fill="none" strokeLinejoin="round" strokeLinecap="round">
      <path d={outline.path} vectorEffect="non-scaling-stroke" pathLength={1000}
        stroke={`url(#${gradient})`} className={styles.ledHalo} />
      <path d={outline.path} vectorEffect="non-scaling-stroke" pathLength={1000}
        stroke={`url(#${gradient})`} className={styles.ledRim} />
      <path d={outline.path} vectorEffect="non-scaling-stroke" pathLength={1000}
        className={styles.ledTrail} />
      <path d={outline.path} vectorEffect="non-scaling-stroke" pathLength={1000}
        className={styles.ledRunner} />
      <path d={outline.path} vectorEffect="non-scaling-stroke" pathLength={1000}
        className={styles.ledRunnerSecond} />
    </g>
  </svg>;
}
