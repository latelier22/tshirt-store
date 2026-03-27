"use client";

import React from "react";
import { formatPrice } from "@/app/lib/utils";

type ProductAttr = {
  code?: string;
  label?: string;
  value?: string;
};

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
    return getEtatStyle(fullEtat?.tag ?? fullEtat?.tag_label);
  }

  const rawEtat = rawTags.find((t: any) => {
    const cat = normalizeText(t?.tag_cat);
    return cat === "etat" || cat.includes("etat");
  });

  if (rawEtat) {
    return getEtatStyle(rawEtat?.tag ?? rawEtat?.tag_label);
  }

  return getEtatFromSlugs(p);
}

function getProductAttrs(product: any): ProductAttr[] {
  if (Array.isArray(product?.attributes)) {
    return product.attributes;
  }

  if (Array.isArray(product?.misc_text)) {
    return product.misc_text;
  }

  if (typeof product?.misc_text === "string" && product.misc_text.trim()) {
    const parsed = safeJsonParse<ProductAttr[]>(product.misc_text);
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
  const attrs = getProductAttrs(product);

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

  if (landscape) {
    return (
      <aside className="h-full w-full" aria-hidden="true">
        <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] border border-black/10 bg-white/95 p-[22px] pb-[150px] text-[#111] shadow-[0_24px_80px_rgba(0,0,0,0.38)]">
          <div className="mb-[18px] flex flex-col gap-[14px]">
            <img
              className="block h-auto w-full max-w-full object-contain"
              src="/logo-multimedia.png"
              alt="Multimédia Services"
            />

            {etat && (
              <div
                className={[
                  "inline-flex min-h-[38px] items-center justify-center self-end rounded-full px-4 py-2",
                  "text-[14px] font-black leading-none whitespace-nowrap",
                  etat.color,
                ].join(" ")}
              >
                {etat.label}
              </div>
            )}
          </div>

          {brand ? (
            <div className="mb-3 text-[22px] font-black uppercase leading-[1.1] text-[#111]">
              {brand}
            </div>
          ) : null}

          <div className="mb-[14px] font-[Rajdhani,Inter,system-ui,sans-serif] text-[34px] font-extrabold leading-[1.02] tracking-[.2px] text-[#111]">
            {model}
          </div>

          {storage ? (
            <div className="mb-[22px] text-[22px] font-extrabold leading-[1.1] text-slate-800">
              {storage}
            </div>
          ) : null}

          <div className="mb-[18px] flex flex-col gap-2">
            <div className="text-[54px] font-black leading-[0.95] text-[#111]">
              {formatPrice(price ?? "0")}
            </div>

            {hasPromo && (
              <div className="text-[20px] font-bold text-slate-500 line-through">
                {formatPrice(oldPrice ?? "0")}
              </div>
            )}
          </div>

          {productId ? (
            <div className="self-end text-[24px] font-bold leading-none text-[#111]">
              {productId}
            </div>
          ) : null}

          <div className="mt-4 flex min-h-0 flex-1 flex-col justify-end gap-5 overflow-y-auto pb-2">
            {visibleAttrs.map((attr, i) => (
              <div
                key={`${attr.code ?? "attr"}-${i}`}
                className="text-[20px] leading-[1.45] text-slate-900"
              >
                <strong className="font-black">{attr.label} :</strong>{" "}
                <span>{attr.value}</span>
              </div>
            ))}
          </div>

          <div className="absolute bottom-0 left-0 right-0 flex h-[120px] items-center justify-center bg-[#e37820] px-[14px] text-center text-[24px] font-black tracking-[.2px] text-white">
            GARANTIE : {guarantee.toUpperCase()}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="h-full w-full" aria-hidden="true">
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] border border-black/10 bg-white/95 p-3 pb-[46px] text-[#111] shadow-[0_24px_80px_rgba(0,0,0,0.38)]">
        <div className="mb-3 grid grid-cols-[1fr_1fr] gap-3">
          <div className="flex min-w-0 items-start">
            <img
              className="block h-auto w-full max-w-[88%] object-contain"
              src="/logo-multimedia.png"
              alt="Multimédia Services"
            />
          </div>

          <div className="flex min-w-0 flex-col items-start justify-start">
            {etat && (
              <div
                className={[
                  "mb-1.5 inline-flex min-h-[30px] items-center justify-center rounded-full px-3 py-1",
                  "text-[11px] font-black leading-none whitespace-nowrap",
                  etat.color,
                ].join(" ")}
              >
                {etat.label}
              </div>
            )}

            {brand ? (
              <div className="mb-1 text-[15px] font-black uppercase leading-[1.05] text-[#111]">
                {brand}
              </div>
            ) : null}

            <div className="mb-1.5 font-[Rajdhani,Inter,system-ui,sans-serif] text-[20px] font-extrabold leading-[1] tracking-[.15px] text-[#111]">
              {model}
            </div>

            {storage ? (
              <div className="mb-1.5 text-[14px] font-extrabold leading-[1.05] text-slate-800">
                {storage}
              </div>
            ) : null}

            <div className="text-[29px] font-black leading-[0.95] text-[#111]">
              {formatPrice(price ?? "0")}
            </div>

            {hasPromo && (
              <div className="mt-1 text-[13px] font-bold text-slate-500 line-through">
                {formatPrice(oldPrice ?? "0")}
              </div>
            )}

            {productId ? (
              <div className="mt-1.5 self-end text-[13px] font-bold leading-none text-[#111]">
                {productId}
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-x-4 gap-y-2 overflow-y-auto pr-1 pb-1">
          {visibleAttrs.map((attr, i) => (
            <div
              key={`${attr.code ?? "attr"}-${i}`}
              className="text-[12.5px] leading-[1.22] text-slate-900"
            >
              <strong className="font-black">{attr.label} :</strong>{" "}
              <span>{attr.value}</span>
            </div>
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 flex h-[34px] items-center justify-center bg-[#e37820] px-2 text-center text-[14px] font-black tracking-[.15px] text-white">
          GARANTIE : {guarantee.toUpperCase()}
        </div>
      </div>
    </aside>
  );
}