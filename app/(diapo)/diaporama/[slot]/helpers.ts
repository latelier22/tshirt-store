import type { BadgeStyle, DiapoPhase, DisplayMessage, Frame } from "./types";

export function firstImage(p: any): string | null {
  const list = Array.isArray(p?.images) ? p.images : [];

  const raw = p?.image ?? p?.thumb ?? list[0] ?? null;
  const value = typeof raw === "string" ? raw.trim() : "";

  return value ? value : null;
}

export function hasUsableImage(p: any): boolean {
  return !!firstImage(p);
}

export function getPrice(p: any) {
  const hasPromo =
    (p.product_discount_price ?? "0") !== "0" &&
    Number(p.product_discount_price) > 0;

  return {
    price: hasPromo ? p.product_discount_price : p.product_price,
    hasPromo,
    oldPrice: p.product_price,
  };
}

export function normalizeText(v?: string) {
  return String(v ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function safeText(v?: string | null) {
  return String(v ?? "").trim();
}

export function getMessageDurationMs(
  message?: DisplayMessage | null,
  fallback = 4
) {
  const n = Number(message?.durationSeconds ?? fallback);
  return Math.max(1, n) * 1000;
}

export function getBackgroundClass(backgroundType?: string | null) {
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

export function getAlignConfig(align?: string | null) {
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

export function getEtatStyle(label?: string): BadgeStyle | null {
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

export function getEtatFromSlugs(p: any): BadgeStyle | null {
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

export function getEtatBadge(p: any): BadgeStyle | null {
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

export function computeContainFrame(
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

export function getEtatImageTopRightStyle(
  pad: number,
  maxWidth: number
): React.CSSProperties {
  return {
    top: `${pad}px`,
    right: `${pad}px`,
    maxWidth: `${maxWidth}px`,
  };
}

export function getPromoImageTopLeftStyle(
  pad: number
): React.CSSProperties {
  return {
    top: `${pad}px`,
    left: `${pad}px`,
  };
}

export function getInfoVisualBottomStyle(
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

export function getInfoGradientClass(rotationMode: string): string {
  if (rotationMode === "1") {
    return "bg-gradient-to-l from-black/88 via-black/68 to-transparent";
  }

  if (rotationMode === "-1") {
    return "bg-gradient-to-r from-black/88 via-black/68 to-transparent";
  }

  return "bg-gradient-to-t from-black/88 via-black/68 to-transparent";
}

export function getInfoMotionClass(
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