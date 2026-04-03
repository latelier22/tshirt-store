"use client";

import React from "react";
import Image from "next/image";
import { formatPrice } from "@/app/lib/utils";
import styles from "./DiaporamaClient.module.css";
import type { DiapoPhase } from "./types";
import {
  computeContainFrame,
  firstImage,
  hasUsableImage, 
  getEtatBadge,
  getEtatImageTopRightStyle,
  getInfoGradientClass,
  getInfoMotionClass,
  getInfoVisualBottomStyle,
  getPrice,
  getPromoImageTopLeftStyle,
} from "./helpers";

export default function ProductVisual({
  product,
  fade = true,
  large = false,
  onClick,
  showInfo = true,
  rotationMode = "0",
  phase = "label",
}: {
  product: any;
  fade?: boolean;
  large?: boolean;
  onClick?: () => void;
  showInfo?: boolean;
  rotationMode?: string;
  phase?: DiapoPhase;
}) {
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const [box, setBox] = React.useState({ width: 0, height: 0 });
  const [img, setImg] = React.useState({ width: 0, height: 0 });

  const { price, hasPromo, oldPrice } = getPrice(product);
  const etatStyle = getEtatBadge(product);

  const imageSrc = firstImage(product);

if (!imageSrc) {
  return null;
}

  React.useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const update = () => {
      setBox({
        width: el.clientWidth || 0,
        height: el.clientHeight || 0,
      });
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  const frame = React.useMemo(
    () => computeContainFrame(box.width, box.height, img.width, img.height),
    [box.width, box.height, img.width, img.height]
  );

  const badgePad = large ? 28 : 12;
  const badgeText = large ? "text-3xl" : "text-sm";
  const badgePadding = large ? "px-8 py-4" : "px-4 py-2";

  const promoPad = large ? 28 : 12;
  const promoText = large ? "text-2xl" : "text-xs";
  const promoPadding = large ? "px-6 py-3" : "px-3 py-1";

  const infoPadX = large ? 28 : 12;
  const infoPadBottom = large ? 28 : 12;
  const infoBandDepth = large ? 240 : 90;

  const titleClass = large ? "text-5xl font-bold" : "text-sm font-medium";
  const priceClass = large
    ? "text-4xl mt-4 font-semibold drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]"
    : "text-lg font-bold";
  const oldPriceClass = large
    ? "text-xl line-through opacity-70 mt-1"
    : "text-xs line-through opacity-70";

  const infoMotionClass = getInfoMotionClass(rotationMode, phase, large);

  return (
    <div ref={wrapperRef} className="absolute inset-0" onClick={onClick}>
      <Image
        src={imageSrc}
        alt={product?.product_model ?? ""}
        fill
        unoptimized
        priority
        className={[
          "object-contain transition-opacity duration-700",
          fade ? "opacity-100" : "opacity-0",
          large ? styles.zoomSlow : "",
        ].join(" ")}
        onLoad={(e) => {
          const target = e.currentTarget as HTMLImageElement;
          setImg({
            width: target.naturalWidth || 0,
            height: target.naturalHeight || 0,
          });
        }}
      />

      {frame && (
        <div
          className="absolute z-10"
          style={{
            left: `${frame.left}px`,
            top: `${frame.top}px`,
            width: `${frame.width}px`,
            height: `${frame.height}px`,
          }}
        >
          {etatStyle && (
            <div
              className={[
                "absolute z-30 rounded-full font-bold shadow-lg leading-tight text-right",
                badgeText,
                badgePadding,
                etatStyle.color,
              ].join(" ")}
              style={getEtatImageTopRightStyle(
                badgePad,
                Math.max(frame.width - badgePad * 2, 120)
              )}
            >
              {etatStyle.label}
            </div>
          )}

          {hasPromo && (
            <div
              className={[
                "absolute z-30 rounded-full bg-red-600 text-white font-bold shadow-lg",
                promoText,
                promoPadding,
              ].join(" ")}
              style={getPromoImageTopLeftStyle(promoPad)}
            >
              PROMO
            </div>
          )}

          {showInfo && (
            <div
              className={[
                "absolute z-20 overflow-hidden transition-all duration-900 ease-[cubic-bezier(0.22,1,0.36,1)]",
                infoMotionClass,
              ].join(" ")}
              style={getInfoVisualBottomStyle(rotationMode, infoBandDepth)}
            >
              <div
                className={`${getInfoGradientClass(rotationMode)} flex h-full w-full flex-col justify-end`}
                style={{
                  paddingLeft: `${infoPadX}px`,
                  paddingRight: `${infoPadX}px`,
                  paddingTop: large ? "80px" : "36px",
                  paddingBottom: `${infoPadBottom}px`,
                }}
              >
                <div className={titleClass}>{product.product_model}</div>

                <div className={`${priceClass} ${large ? styles.pulsePrice : ""}`}>
                  {formatPrice(price ?? "0")}
                </div>

                {hasPromo && (
                  <div className={oldPriceClass}>
                    {formatPrice(oldPrice ?? "0")}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}