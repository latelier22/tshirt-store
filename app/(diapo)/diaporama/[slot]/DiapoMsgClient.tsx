"use client";

import React from "react";
import Image from "next/image";
import type { HiboutikProduct } from "@/app/types/ProductType";
import { formatPrice } from "@/app/lib/utils";
import Header from "@/components/Header";
import EtiquetteProduit from "./Etiquette";
import ProductUpdatesListener from "@/components/ProductUpdatesListener";

type BadgeStyle = {
  label: string;
  color: string;
};

type Frame = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type DiapoPhase = "hero" | "label" | "exit";

type DisplayMessage = {
  id: number;
  name: string;
  slot: string;
  template: string;
  badge: string | null;
  title: string | null;
  line1: string | null;
  line2: string | null;
  line3: string | null;
  footerText: string | null;
  backgroundType: string | null;
  textAlign: "left" | "center" | "right" | null;
  accentColor: string | null;
  intervalSeconds: number | null;
  durationSeconds: number | null;
  sortOrder: number | null;
  startsAt: string | null;
  endsAt: string | null;
};

function firstImage(p: any) {
  const list = Array.isArray(p?.images) ? p.images : [];
  return p?.image ?? p?.thumb ?? list[0] ?? "";
}

function getPrice(p: any) {
  const hasPromo =
    (p.product_discount_price ?? "0") !== "0" &&
    Number(p.product_discount_price) > 0;

  return {
    price: hasPromo ? p.product_discount_price : p.product_price,
    hasPromo,
    oldPrice: p.product_price,
  };
}

function normalizeText(v?: string) {
  return String(v ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getEtatStyle(label?: string): BadgeStyle | null {
  const t = normalizeText(label);
  if (!t) return null;

  if (t === "neuf") {
    return { label: "NEUF", color: "bg-blue-600 text-white" };
  }

  if (t.includes("tres bon")) {
    return { label: "TRÈS BON ÉTAT", color: "bg-green-600 text-white" };
  }

  if (t.includes("bon etat")) {
    return { label: "BON ÉTAT", color: "bg-yellow-400 text-black" };
  }

  if (t.includes("correct")) {
    return { label: "ÉTAT CORRECT", color: "bg-red-600 text-white" };
  }

  return { label: label ?? "", color: "bg-white text-black" };
}

function getEtatFromSlugs(p: any): BadgeStyle | null {
  const slugs: string[] = (p?.tags_slug ?? []).map((s: string) =>
    normalizeText(s)
  );

  if (slugs.some((s) => s === "neuf")) {
    return { label: "NEUF", color: "bg-blue-600 text-white" };
  }

  if (slugs.some((s) => s.includes("tres-bon") || s.includes("tres bon"))) {
    return { label: "TRÈS BON ÉTAT", color: "bg-green-600 text-white" };
  }

  if (slugs.some((s) => s.includes("bon-etat") || s.includes("bon etat"))) {
    return { label: "BON ÉTAT", color: "bg-yellow-400 text-black" };
  }

  if (slugs.some((s) => s.includes("correct"))) {
    return { label: "ÉTAT CORRECT", color: "bg-red-600 text-white" };
  }

  return null;
}

function getEtatBadge(p: any): BadgeStyle | null {
  const fullTags = Array.isArray(p?.fullTags) ? p.fullTags : [];
  const rawTags = Array.isArray(p?.tags) ? p.tags : [];

  const fullEtat = fullTags.find((t: any) => {
    const cat = normalizeText(t?.tag_cat);
    return cat === "etat" || cat.includes("etat");
  });

  if (fullEtat) {
    const label = fullEtat?.tag ?? fullEtat?.tag_label;
    return getEtatStyle(label);
  }

  const rawEtat = rawTags.find((t: any) => {
    const cat = normalizeText(t?.tag_cat);
    return cat === "etat" || cat.includes("etat");
  });

  if (rawEtat) {
    const label = rawEtat?.tag ?? rawEtat?.tag_label;
    return getEtatStyle(label);
  }

  return getEtatFromSlugs(p);
}

function computeContainFrame(
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number
): Frame | null {
  if (
    !containerWidth ||
    !containerHeight ||
    !imageWidth ||
    !imageHeight ||
    containerWidth <= 0 ||
    containerHeight <= 0 ||
    imageWidth <= 0 ||
    imageHeight <= 0
  ) {
    return null;
  }

  const scale = Math.min(
    containerWidth / imageWidth,
    containerHeight / imageHeight
  );

  const width = imageWidth * scale;
  const height = imageHeight * scale;
  const left = (containerWidth - width) / 2;
  const top = (containerHeight - height) / 2;

  return { left, top, width, height };
}

function getEtatImageTopRightStyle(
  pad: number,
  maxWidth: number
): React.CSSProperties {
  return {
    top: `${pad}px`,
    right: `${pad}px`,
    maxWidth: `${maxWidth}px`,
  };
}

function getPromoImageTopLeftStyle(pad: number): React.CSSProperties {
  return {
    top: `${pad}px`,
    left: `${pad}px`,
  };
}

function getInfoVisualBottomStyle(
  rotationMode: string,
  bandDepth: number
): React.CSSProperties {
  if (rotationMode === "1") {
    return {
      top: 0,
      bottom: 0,
      right: 0,
      width: `${bandDepth}px`,
    };
  }

  if (rotationMode === "-1") {
    return {
      top: 0,
      bottom: 0,
      left: 0,
      width: `${bandDepth}px`,
    };
  }

  return {
    left: 0,
    right: 0,
    bottom: 0,
  };
}

function getInfoGradientClass(rotationMode: string): string {
  if (rotationMode === "1") {
    return "bg-gradient-to-l from-black/88 via-black/68 to-transparent";
  }

  if (rotationMode === "-1") {
    return "bg-gradient-to-r from-black/88 via-black/68 to-transparent";
  }

  return "bg-gradient-to-t from-black/88 via-black/68 to-transparent";
}

function getInfoMotionClass(
  rotationMode: string,
  phase: DiapoPhase,
  large: boolean
): string {
  if (!large) {
    return "opacity-100 translate-x-0 translate-y-0";
  }

  if (rotationMode === "1") {
    if (phase === "hero") return "opacity-0 translate-x-8";
    if (phase === "exit") return "opacity-0 translate-x-4";
    return "opacity-100 translate-x-0";
  }

  if (rotationMode === "-1") {
    if (phase === "hero") return "opacity-0 -translate-x-8";
    if (phase === "exit") return "opacity-0 -translate-x-4";
    return "opacity-100 translate-x-0";
  }

  if (phase === "hero") return "opacity-0 translate-y-8";
  if (phase === "exit") return "opacity-0 translate-y-4";
  return "opacity-100 translate-y-0";
}

function safeText(v?: string | null) {
  return String(v ?? "").trim();
}

function getMessageDurationMs(message?: DisplayMessage | null, fallback = 4) {
  const n = Number(message?.durationSeconds ?? fallback);
  return Math.max(1, n) * 1000;
}

function getBackgroundClass(backgroundType?: string | null) {
  switch (backgroundType) {
    case "orange":
      return "bg-gradient-to-br from-orange-700 via-orange-500 to-amber-300";
    case "blue":
      return "bg-gradient-to-br from-slate-950 via-blue-900 to-sky-400";
    case "black":
    default:
      return "bg-black";
  }
}

function getAlignConfig(align?: string | null) {
  if (align === "left") {
    return {
      wrapper: "items-start text-left",
      hidden: "-translate-x-12 opacity-0 scale-95",
      visible: "translate-x-0 opacity-100 scale-100",
    };
  }

  if (align === "right") {
    return {
      wrapper: "items-end text-right",
      hidden: "translate-x-12 opacity-0 scale-95",
      visible: "translate-x-0 opacity-100 scale-100",
    };
  }

  return {
    wrapper: "items-center text-center",
    hidden: "translate-y-8 opacity-0 scale-95",
    visible: "translate-y-0 opacity-100 scale-100",
  };
}

function useEntranceVisible(keyValue: string) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    setVisible(false);
    const t = window.setTimeout(() => setVisible(true), 40);
    return () => clearTimeout(t);
  }, [keyValue]);

  return visible;
}

function AnimatedLine({
  children,
  visible,
  delayMs = 0,
  hiddenClass,
  visibleClass,
  className = "",
  innerClassName = "",
  style,
}: {
  children: React.ReactNode;
  visible: boolean;
  delayMs?: number;
  hiddenClass: string;
  visibleClass: string;
  className?: string;
  innerClassName?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={[
        "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
        visible ? visibleClass : hiddenClass,
        className,
      ].join(" ")}
      style={{
        transitionDelay: `${delayMs}ms`,
        ...style,
      }}
    >
      <div className={innerClassName}>{children}</div>
    </div>
  );
}

function MessageSlide({
  message,
  slideKey,
}: {
  message: DisplayMessage;
  slideKey: string;
}) {
  const visible = useEntranceVisible(slideKey);
  const align = getAlignConfig(message.textAlign);
  const accent = message.accentColor || "#f59e0b";

  const badge = safeText(message.badge);
  const title = safeText(message.title);
  const line1 = safeText(message.line1);
  const line2 = safeText(message.line2);
  const line3 = safeText(message.line3);
  const footerText = safeText(message.footerText);
  const isPromo = message.template === "promo";

  return (
    <div
      className={`absolute inset-0 z-[70] overflow-hidden rounded-2xl ${getBackgroundClass(
        message.backgroundType
      )}`}
    >
      <div className="ms-bg-pan absolute inset-0 opacity-90" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.16),transparent_30%)]" />

      <div className="relative flex h-full w-full items-center justify-center px-10 py-10">
        <div className={`flex max-w-[90vw] flex-col ${align.wrapper}`}>
          {badge && (
            <AnimatedLine
              visible={visible}
              delayMs={40}
              hiddenClass={align.hidden}
              visibleClass={align.visible}
              className="rounded-full px-8 py-4 text-3xl font-extrabold text-white shadow-[0_0_30px_rgba(0,0,0,0.35)]"
              innerClassName="ms-float-soft"
              style={{ backgroundColor: accent }}
            >
              {badge}
            </AnimatedLine>
          )}

          {title && (
            <AnimatedLine
              visible={visible}
              delayMs={140}
              hiddenClass={align.hidden}
              visibleClass={align.visible}
              className={
                isPromo
                  ? "mt-8 text-6xl md:text-7xl font-black uppercase leading-none text-white"
                  : "mt-8 text-5xl md:text-6xl font-black uppercase leading-none text-white"
              }
              innerClassName="ms-title-breathe"
            >
              {title}
            </AnimatedLine>
          )}

          {line1 && (
            <AnimatedLine
              visible={visible}
              delayMs={260}
              hiddenClass={align.hidden}
              visibleClass={align.visible}
              className="mt-8 text-3xl md:text-4xl font-light uppercase tracking-[0.18em] text-white/95"
              innerClassName="ms-float-soft ms-delay-1"
            >
              {line1}
            </AnimatedLine>
          )}

          {line2 && (
            <AnimatedLine
              visible={visible}
              delayMs={380}
              hiddenClass={align.hidden}
              visibleClass={align.visible}
              className="mt-3 text-3xl md:text-4xl font-semibold text-white"
              innerClassName="ms-float-soft ms-delay-2"
            >
              {line2}
            </AnimatedLine>
          )}

          {line3 && line3 !== "_________" && (
            <AnimatedLine
              visible={visible}
              delayMs={500}
              hiddenClass={align.hidden}
              visibleClass={align.visible}
              className="mt-4 text-2xl md:text-3xl font-medium text-white/85"
              innerClassName="ms-float-soft ms-delay-3"
            >
              {line3}
            </AnimatedLine>
          )}

          {line3 === "_________" && (
            <AnimatedLine
              visible={visible}
              delayMs={500}
              hiddenClass={align.hidden}
              visibleClass={align.visible}
              className="mt-8"
              innerClassName="ms-line-stretch h-[2px] w-56 bg-white/70"
            >
              <span />
            </AnimatedLine>
          )}

          {footerText && (
            <AnimatedLine
              visible={visible}
              delayMs={620}
              hiddenClass={align.hidden}
              visibleClass={align.visible}
              className="mt-10 text-2xl md:text-3xl font-medium uppercase tracking-[0.14em] text-white/90"
              innerClassName="ms-float-soft ms-delay-4"
            >
              {footerText}
            </AnimatedLine>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductVisual({
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

    const ro = new ResizeObserver(() => update());
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
    ? "text-4xl mt-4 font-semibold drop-shadow-[0_0_10px_rgba(255,255,255,0.6)] animate-[pulsePrice_2.8s_infinite]"
    : "text-lg font-bold";
  const oldPriceClass = large
    ? "text-xl line-through opacity-70 mt-1"
    : "text-xs line-through opacity-70";

  const infoMotionClass = getInfoMotionClass(rotationMode, phase, large);

  return (
    <div ref={wrapperRef} className="absolute inset-0" onClick={onClick}>
      <ProductUpdatesListener />

      <Image
        src={firstImage(product)}
        alt={product?.product_model ?? ""}
        fill
        unoptimized
        priority
        className={`
          object-contain
          transition-opacity duration-700
          ${fade ? "opacity-100" : "opacity-0"}
          ${large ? "animate-[zoomSlow_8s_linear]" : ""}
        `}
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
              className={`
                absolute z-30 rounded-full font-bold shadow-lg leading-tight text-right
                ${badgeText} ${badgePadding} ${etatStyle.color}
              `}
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
              className={`
                absolute z-30 rounded-full bg-red-600 text-white font-bold shadow-lg
                ${promoText} ${promoPadding}
              `}
              style={getPromoImageTopLeftStyle(promoPad)}
            >
              PROMO
            </div>
          )}

          {showInfo && (
            <div
              className={`
                absolute z-20 overflow-hidden
                transition-all duration-900 ease-[cubic-bezier(0.22,1,0.36,1)]
                ${infoMotionClass}
              `}
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

                <div className={priceClass}>{formatPrice(price ?? "0")}</div>

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
  const ITEMS_PER_PAGE = 9;

  const [mode, setMode] = React.useState<"grid" | "diapo">("grid");
  const [gridPage, setGridPage] = React.useState(0);
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [zoomItem, setZoomItem] = React.useState<HiboutikProduct | null>(null);
  const [fade, setFade] = React.useState(true);
  const [diapoPhase, setDiapoPhase] = React.useState<DiapoPhase>("hero");

  const [messageCursor, setMessageCursor] = React.useState(0);
  const [activeMessage, setActiveMessage] = React.useState<DisplayMessage | null>(null);
  const [messageTick, setMessageTick] = React.useState(0);

  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));

  const currentGrid = items.slice(
    gridPage * ITEMS_PER_PAGE,
    gridPage * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  const nextGrid = React.useCallback(() => {
    setGridPage((p) => (p + 1) % totalPages);
    setMode("grid");
  }, [totalPages]);

  const prevGrid = React.useCallback(() => {
    setGridPage((p) => (p - 1 + totalPages) % totalPages);
    setMode("grid");
  }, [totalPages]);

  const advanceToNext = React.useCallback(() => {
    if (!items.length) return;

    const next = index + 1;

    if (next >= items.length) {
      setMode("grid");
      setGridPage(0);
      setIndex(0);
      setFade(true);
      setDiapoPhase("hero");
      return;
    }

    if (next % ITEMS_PER_PAGE === 0) {
      setMode("grid");
      setGridPage((p) => (p + 1) % totalPages);
      setIndex(next);
      setFade(true);
      setDiapoPhase("hero");
      return;
    }

    setIndex(next);
    setFade(true);
    setDiapoPhase("hero");
  }, [index, items.length, totalPages]);

  const nextProduct = React.useCallback(() => {
    if (!items.length || activeMessage) return;

    setDiapoPhase("exit");
    setFade(false);

    window.setTimeout(() => {
      advanceToNext();
    }, 760);
  }, [items.length, advanceToNext, activeMessage]);

  React.useEffect(() => {
    if (!messages.length) {
      setMessageCursor(0);
      setActiveMessage(null);
      return;
    }

    setMessageCursor((prev) => prev % messages.length);
  }, [messages]);

  React.useEffect(() => {
    if (paused || !items.length || zoomItem || activeMessage || !messages.length) {
      return;
    }

    const currentMessage = messages[messageCursor % messages.length];
    const delay = Math.max(1, Number(currentMessage.intervalSeconds ?? 10)) * 1000;

    const t = window.setTimeout(() => {
      setActiveMessage(currentMessage);
      setMessageTick((v) => v + 1);
    }, delay);

    return () => clearTimeout(t);
  }, [paused, items.length, zoomItem, activeMessage, messages, messageCursor]);

  React.useEffect(() => {
    if (!activeMessage) return;

    const t = window.setTimeout(() => {
      setActiveMessage(null);
      setMessageCursor((prev) => {
        if (!messages.length) return 0;
        return (prev + 1) % messages.length;
      });
    }, getMessageDurationMs(activeMessage, 4));

    return () => clearTimeout(t);
  }, [activeMessage, messages.length]);

  React.useEffect(() => {
    if (paused || !items.length || activeMessage) return;

    if (mode === "grid") {
      const t = setTimeout(() => {
        setMode("diapo");
        setIndex(gridPage * ITEMS_PER_PAGE);
        setFade(true);
        setDiapoPhase("hero");
      }, 5000);

      return () => clearTimeout(t);
    }

    if (mode === "diapo") {
      setFade(true);
      setDiapoPhase("hero");

      const t1 = window.setTimeout(() => {
        setDiapoPhase("label");
      }, 900);

      const t2 = window.setTimeout(() => {
        setDiapoPhase("exit");
        setFade(false);
      }, 4600);

      const t3 = window.setTimeout(() => {
        advanceToNext();
      }, 5400);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [mode, index, paused, items.length, gridPage, advanceToNext, activeMessage]);

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

  return (
    <div className="fixed inset-0 overflow-hidden bg-black text-white">
      <style jsx global>{`
        @keyframes msBgPan {
          0% {
            transform: scale(1) translate3d(0, 0, 0);
          }
          50% {
            transform: scale(1.06) translate3d(1.5%, -1.5%, 0);
          }
          100% {
            transform: scale(1) translate3d(0, 0, 0);
          }
        }

        @keyframes msFloatSoft {
          0% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-6px) scale(1.015);
          }
          100% {
            transform: translateY(0) scale(1);
          }
        }

        @keyframes msTitleBreathe {
          0% {
            transform: translateY(0) scale(1);
            text-shadow: 0 0 0 rgba(255, 255, 255, 0);
          }
          50% {
            transform: translateY(-4px) scale(1.02);
            text-shadow: 0 0 24px rgba(255, 255, 255, 0.12);
          }
          100% {
            transform: translateY(0) scale(1);
            text-shadow: 0 0 0 rgba(255, 255, 255, 0);
          }
        }

        @keyframes msLineStretch {
          0% {
            transform: scaleX(0.92);
            opacity: 0.65;
          }
          50% {
            transform: scaleX(1);
            opacity: 1;
          }
          100% {
            transform: scaleX(0.92);
            opacity: 0.65;
          }
        }

        @keyframes zoomSlow {
          0% {
            transform: scale(1);
          }
          100% {
            transform: scale(1.06);
          }
        }

        @keyframes pulsePrice {
          0% {
            transform: scale(1);
            opacity: 0.95;
          }
          50% {
            transform: scale(1.04);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0.95;
          }
        }

        .ms-bg-pan {
          background:
            radial-gradient(circle at top right, rgba(255, 255, 255, 0.08), transparent 28%),
            radial-gradient(circle at bottom left, rgba(245, 158, 11, 0.16), transparent 30%);
          animation: msBgPan 12s ease-in-out infinite;
          will-change: transform;
        }

        .ms-float-soft {
          animation: msFloatSoft 4.2s ease-in-out infinite;
          will-change: transform;
        }

        .ms-title-breathe {
          animation: msTitleBreathe 4.6s ease-in-out infinite;
          will-change: transform;
        }

        .ms-line-stretch {
          transform-origin: center center;
          animation: msLineStretch 2.8s ease-in-out infinite;
          will-change: transform, opacity;
        }

        .ms-delay-1 {
          animation-delay: 0.2s;
        }

        .ms-delay-2 {
          animation-delay: 0.45s;
        }

        .ms-delay-3 {
          animation-delay: 0.7s;
        }

        .ms-delay-4 {
          animation-delay: 0.95s;
        }
      `}</style>

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

        {mode === "diapo" && items[index] && (
          <div className="h-full w-full p-6">
            {!isPortrait ? (
              <div
                className={`
                  flex h-full w-full gap-6 overflow-hidden
                  transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]
                  ${
                    diapoPhase === "exit"
                      ? "translate-x-12 opacity-0"
                      : "translate-x-0 opacity-100"
                  }
                `}
              >
                <div
                  className="
                    shrink-0 overflow-hidden
                    transition-[width,opacity,transform] duration-900 ease-[cubic-bezier(0.22,1,0.36,1)]
                  "
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
                    <EtiquetteProduit product={items[index]} landscape />
                  </div>
                </div>

                <div
                  className="relative min-w-0 flex-1 cursor-pointer overflow-hidden rounded-2xl bg-black"
                  onClick={nextProduct}
                >
                  <ProductVisual
                    key={`diapo-${items[index]?.product_id}-${index}`}
                    product={items[index]}
                    fade={fade}
                    large
                    showInfo={true}
                    rotationMode={portrait}
                    phase={diapoPhase}
                  />
                </div>
              </div>
            ) : (
              <div
                className={`
                  flex h-full w-full flex-col gap-4 overflow-hidden
                  transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]
                  ${
                    diapoPhase === "exit"
                      ? "-translate-y-12 opacity-0"
                      : "translate-y-0 opacity-100"
                  }
                `}
              >
                <div
                  className="relative min-h-0 flex-1 cursor-pointer overflow-hidden rounded-2xl bg-black"
                  onClick={nextProduct}
                >
                  <ProductVisual
                    key={`diapo-${items[index]?.product_id}-${index}`}
                    product={items[index]}
                    fade={fade}
                    large
                    showInfo={true}
                    rotationMode={portrait}
                    phase={diapoPhase}
                  />
                </div>

                <div
                  className="
                    shrink-0 overflow-hidden
                    transition-[height,opacity,transform] duration-900 ease-[cubic-bezier(0.22,1,0.36,1)]
                  "
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
                      product={items[index]}
                      landscape={false}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeMessage && (
          <div className="absolute inset-0 z-[60] p-6">
            <MessageSlide
              slideKey={`message-${activeMessage.id}-${messageTick}`}
              message={activeMessage}
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
              }
            }}
            className="rounded-full bg-black/60 px-4 py-2 text-xl"
          >
            {paused ? "▶" : "⏸"}
          </button>
        </div>

        {zoomItem && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95">
            <div className="relative h-[80%] w-[80%]">
              <Image
                src={firstImage(zoomItem)}
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
  );
}