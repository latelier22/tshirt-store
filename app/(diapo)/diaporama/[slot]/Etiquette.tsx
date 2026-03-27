"use client";

import React from "react";
import { formatPrice } from "@/app/lib/utils";

type BadgeStyle = {
  label: string;
  color: string;
};

function normalizeText(v?: string) {
  return String(v ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function safeJsonParse<T = any>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
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

  return { label: label ?? "", color: "bg-slate-700 text-white" };
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

type ProductAttr = {
  code?: string;
  label?: string;
  value?: string;
};

function getParsedAttrs(product: any): ProductAttr[] {
  const raw = product?.misc_text;

  if (Array.isArray(raw)) {
    return raw;
  }

  if (typeof raw === "string" && raw.trim()) {
    const parsed = safeJsonParse<ProductAttr[]>(raw);
    return Array.isArray(parsed) ? parsed : [];
  }

  return [];
}

function isStorageAttr(a: ProductAttr) {
  const code = normalizeText(a.code);
  const label = normalizeText(a.label);
  return code.includes("stock") || label.includes("stock");
}

function isGuaranteeAttr(a: ProductAttr) {
  const code = normalizeText(a.code);
  const label = normalizeText(a.label);
  return code.includes("garant") || label.includes("garant");
}

export default function EtiquetteProduit({
  product,
  landscape,
}: {
  product: any;
  landscape: boolean;
}) {
  const attrs = getParsedAttrs(product);

  const storageAttr = attrs.find(isStorageAttr);
  const guaranteeAttr = attrs.find(isGuaranteeAttr);

  const visibleAttrs = attrs.filter((a) => {
    const value = String(a?.value ?? "").trim();
    if (!value) return false;
    if (isStorageAttr(a)) return false;
    if (isGuaranteeAttr(a)) return false;
    return true;
  });

  const etat = getEtatBadge(product);
  const { price, hasPromo, oldPrice } = getPrice(product);

  const brand = String(product?.product_brand_name ?? "").trim();
  const model = String(product?.product_model ?? "").trim() || "Produit";
  const storage = String(storageAttr?.value ?? "").trim();
  const guarantee = String(guaranteeAttr?.value ?? "").trim() || "1 AN";
  const productId = product?.product_id ? `Id ${product.product_id}` : "";

  return (
    <aside
      className={
        landscape
          ? "w-[390px] max-w-[390px] shrink-0 self-stretch"
          : "w-full shrink-0"
      }
      aria-hidden="true"
    >
      <div
        className={[
          "relative overflow-hidden rounded-[24px] border border-black/10 bg-white/95 text-[#111]",
          "shadow-[0_24px_80px_rgba(0,0,0,0.38)]",
          "flex flex-col",
          landscape ? "h-full p-[22px] pb-[78px]" : "p-4 pb-[58px]",
        ].join(" ")}
      >
        <div className={landscape ? "mb-[18px] flex flex-col gap-[14px]" : "mb-4 flex flex-col gap-3"}>
          <img
            className="block h-auto w-full max-w-full object-contain"
            src="/logo-multimedia.png"
            alt="Multimédia Services"
          />

          {etat && (
            <div
              className={[
                "inline-flex min-h-[38px] items-center justify-center self-end rounded-full px-4 py-2",
                "whitespace-nowrap text-center font-black leading-none",
                landscape ? "text-[14px]" : "text-[13px]",
                etat.color,
              ].join(" ")}
            >
              {etat.label}
            </div>
          )}
        </div>

        {brand ? (
          <div
            className={[
              "font-black uppercase leading-[1.1] text-[#111]",
              landscape ? "mb-3 text-[22px]" : "mb-2 text-[18px]",
            ].join(" ")}
          >
            {brand}
          </div>
        ) : null}

        <div
          className={[
            "font-extrabold leading-[1.02] tracking-[.2px] text-[#111]",
            "font-[Rajdhani,Inter,system-ui,sans-serif]",
            landscape ? "mb-[14px] text-[34px]" : "mb-3 text-[24px]",
          ].join(" ")}
        >
          {model}
        </div>

        {storage ? (
          <div
            className={[
              "font-extrabold leading-[1.1] text-slate-800",
              landscape ? "mb-[22px] text-[22px]" : "mb-3 text-[18px]",
            ].join(" ")}
          >
            {storage}
          </div>
        ) : null}

        <div className={landscape ? "mb-[22px] flex flex-col gap-2" : "mb-4 flex flex-col gap-1.5"}>
          <div
            className={[
              "font-black leading-[0.95] text-[#111]",
              landscape ? "text-[54px]" : "text-[34px]",
            ].join(" ")}
          >
            {formatPrice(price ?? "0")}
          </div>

          {hasPromo && (
            <div
              className={[
                "font-bold text-slate-500 line-through",
                landscape ? "text-[20px]" : "text-[17px]",
              ].join(" ")}
            >
              {formatPrice(oldPrice ?? "0")}
            </div>
          )}
        </div>

        {productId ? (
          <div
            className={[
              "self-end font-bold leading-none text-[#111]",
              landscape ? "text-[24px]" : "text-[20px]",
            ].join(" ")}
          >
            {productId}
          </div>
        ) : null}

        <div
          className={[
            "mt-4 flex min-h-0 flex-1 flex-col items-stretch",
            landscape ? "gap-3 overflow-y-auto" : "gap-2 overflow-y-auto",
          ].join(" ")}
        >
          {visibleAttrs.map((attr, i) => (
            <div
              key={`${attr.code ?? "attr"}-${i}`}
              className={[
                "leading-[1.35] text-slate-900",
                landscape ? "text-[20px]" : "text-[14px]",
              ].join(" ")}
            >
              <strong className="font-black">{attr.label} :</strong>{" "}
              <span>{attr.value}</span>
            </div>
          ))}
        </div>

        <div
          className={[
            "absolute bottom-0 left-0 right-0 bg-[#e37820] text-center font-black tracking-[.2px] text-white",
            landscape ? "px-[10px] py-3 text-[20px]" : "px-2 py-3 text-[17px]",
          ].join(" ")}
        >
          GARANTIE : {guarantee.toUpperCase()}
        </div>
      </div>
    </aside>
  );
}