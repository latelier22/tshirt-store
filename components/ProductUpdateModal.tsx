"use client";

import Image from "next/image";
import Link from "next/link";

type Props = {
  open: boolean;
  onClose: () => void;
  product?: {
    product_id: number;
    product_model: string;
    product_price: string;
    thumb?: string | null;
    image?: string | null;
  } | null;
};

export default function ProductUpdateModal({ open, onClose, product }: Props) {
  if (!open) return null;

  const thumbSrc =
    product?.thumb
      ? `/api/hiboutik/image?src=${encodeURIComponent(product.thumb)}`
      : null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="font-semibold">Produit mis à jour</div>
          <button onClick={onClose} className="px-3 py-1 rounded-lg border">
            Fermer
          </button>
        </div>

        <div className="p-4 flex gap-4">
          <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0">
            {thumbSrc ? (
              <Image
                src={thumbSrc}
                alt=""
                fill
                sizes="96px"
                className="object-cover"
              />
            ) : null}
          </div>

          <div className="min-w-0">
            <div className="font-semibold truncate">
              {product?.product_model ?? "…"}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Prix: <span className="font-semibold">{product?.product_price ?? "—"}</span> €
            </div>

            {product?.product_id ? (
              <div className="mt-3 flex gap-2">
                <Link
                  href={`/produits/${product.product_id}`}
                  className="px-3 py-2 rounded-lg bg-black text-white"
                  onClick={onClose}
                >
                  Voir le produit
                </Link>
                <button onClick={onClose} className="px-3 py-2 rounded-lg border">
                  OK
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}