"use client";

import React from "react";
import Image from "next/image";
import EtiquetteProduit from "@/app/(diapo)/diaporama/[slot]/Etiquette";



type Props = {
  open: boolean;
  onClose: () => void;
  product: any;
};

function firstImage(p: any) {
  const list = Array.isArray(p?.images) ? p.images : [];
  return p?.image ?? p?.thumb ?? list[0] ?? "";
}

export default function ProductUpdateModal({
  open,
  onClose,
  product,
}: Props) {
  const [isLeaving, setIsLeaving] = React.useState(false);
  const closingRef = React.useRef(false);

  const startClose = React.useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setIsLeaving(true);

    window.setTimeout(() => {
      onClose();
      closingRef.current = false;
      setIsLeaving(false);
    }, 500);
  }, [onClose]);

  React.useEffect(() => {
    if (!open) return;

    const autoClose = window.setTimeout(() => {
      startClose();
    }, 3000);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        startClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      clearTimeout(autoClose);
      window.removeEventListener("keydown", onKeyDown);
      closingRef.current = false;
      setIsLeaving(false);
    };
  }, [open, startClose, product?.product_id]);

  if (!open || !product) return null;

  const imageUrl = firstImage(product);

  return (
    <div
      className={`
        fixed inset-0 z-[9999] flex items-center justify-center p-6 backdrop-blur-[2px]
        transition-all duration-500
        ${isLeaving ? "bg-black/0 opacity-0" : "bg-black/80 opacity-100"}
      `}
      onClick={startClose}
    >
      <div
        className={`
          relative flex h-[88vh] w-[92vw] max-w-[1500px] overflow-hidden rounded-[28px]
          border border-white/10 bg-[#111] shadow-[0_30px_120px_rgba(0,0,0,0.55)]
          transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
          ${
            isLeaving
              ? "scale-[0.96] opacity-0 translate-y-4"
              : "scale-100 opacity-100 translate-y-0"
          }
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={startClose}
          className="
            absolute right-4 top-4 z-50 flex h-12 w-12 items-center justify-center
            rounded-full bg-black/60 text-2xl text-white transition hover:bg-black/80
          "
          aria-label="Fermer"
        >
          ✕
        </button>

        <div className="flex h-full w-full flex-col lg:flex-row">
          <div className="h-[38%] w-full shrink-0 bg-[#181818] p-4 lg:h-full lg:w-[390px] xl:w-[430px]">
            <EtiquetteProduit product={product} landscape />
          </div>

          <div className="relative min-h-0 min-w-0 flex-1 bg-black">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={product?.product_model ?? "Produit"}
                fill
                unoptimized
                priority
                sizes="(max-width: 1024px) 100vw, 70vw"
                className="object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-white/70">
                Aucune image
              </div>
            )}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10">
              <div className="bg-gradient-to-t from-black/85 via-black/45 to-transparent px-8 pb-8 pt-24 text-white">
                <div className="text-2xl font-black md:text-4xl">
                  {product?.product_brand_name
                    ? `${product.product_brand_name} ${product?.product_model ?? ""}`
                    : product?.product_model ?? "Produit"}
                </div>

                {product?.stock_available !== undefined &&
                  product?.stock_available !== null && (
                    <div className="mt-3 text-lg font-semibold text-white/85 md:text-2xl">
                      Stock : {product.stock_available}
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}