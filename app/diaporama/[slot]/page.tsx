// app/diaporama/[slot]/page.tsx
import DiaporamaClient from "./DiaporamaClient";
import { hiboutikGetGrid } from "@/app/lib/hiboutik-cache";
import type { HiboutikProduct } from "@/app/types/ProductType";

type Props = {
  params: Promise<{ slot: string }>;
};

function hasImage(p: any) {
  if (p?.image) return true;
  if (p?.thumb) return true;
  if (Array.isArray(p?.images) && p.images.length > 0) return true;
  return false;
}

export const dynamic = "force-dynamic";

export default async function DiaporamaPage({ params }: Props) {
  await params; // slot inutilisé pour l’instant

  // 🔥 on prend les produits récents du cache
  const products = (await hiboutikGetGrid({
    order_by: "updated_at",
    sort: "DESC",
    from: 0,
    to: 200,
  })) as HiboutikProduct[];

  const withImages = products.filter(hasImage);

  if (!withImages.length) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        Aucun produit avec image.
      </main>
    );
  }

  return <DiaporamaClient products={withImages} />;
}




// // app/diaporama/[slot]/DiaporamaClient.tsx
// "use client";

// import React from "react";
// import Image from "next/image";
// import type { HiboutikProduct } from "@/app/types/ProductType";
// import { formatPrice } from "@/app/lib/utils";

// function firstImage(p: any) {
//   const list = Array.isArray(p?.images) ? p.images : [];
//   return p?.image ?? p?.thumb ?? list[0];
// }

// export default function DiaporamaClient({
//   slot,
//   products,
// }: {
//   slot: string;
//   products: HiboutikProduct[];
// }) {
//   const [i, setI] = React.useState(0);

//   // paramètres diaporama
//   const slideMs = 4500;

//   React.useEffect(() => {
//     const t = window.setInterval(() => {
//       setI((prev) => (prev + 1) % products.length);
//     }, slideMs);
//     return () => window.clearInterval(t);
//   }, [products.length]);

//   // clavier: flèches
//   React.useEffect(() => {
//     const onKey = (e: KeyboardEvent) => {
//       if (e.key === "ArrowRight") setI((p) => (p + 1) % products.length);
//       if (e.key === "ArrowLeft") setI((p) => (p - 1 + products.length) % products.length);
//     };
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [products.length]);

//   const p: any = products[i];
//   const img = firstImage(p);

//   const hasPromo =
//     (p.product_discount_price ?? "0") !== "0" && Number(p.product_discount_price) > 0;

//   const priceStr = hasPromo ? p.product_discount_price : p.product_price;

//   return (
//     <main
//       className="fixed inset-0 bg-black text-white"
//       onClick={() => setI((prev) => (prev + 1) % products.length)} // click => slide suivant
//     >
//       {/* image full */}
//       <div className="absolute inset-0">
//         {img ? (
//           <Image
//             src={img}
//             alt={p.product_model ?? "Produit"}
//             fill
//             priority
//             className="object-contain"
//             sizes="100vw"
//             draggable={false}
//           />
//         ) : (
//           <div className="w-full h-full flex items-center justify-center opacity-70">
//             (pas d’image)
//           </div>
//         )}
//       </div>

//       {/* overlay bas */}
//       <div className="absolute left-0 right-0 bottom-0 p-8">
//         <div className="max-w-5xl mx-auto">
//           <div className="text-xs uppercase tracking-widest opacity-70">
//             diaporama / {slot} • {i + 1}/{products.length}
//           </div>

//           <div className="mt-2 text-3xl md:text-5xl font-semibold leading-tight">
//             {p.product_model ?? "(Sans nom)"}
//           </div>

//           <div className="mt-3 flex items-baseline gap-4">
//             <div className="text-3xl md:text-4xl font-bold">
//               {formatPrice(priceStr ?? "0")}
//             </div>
//             {hasPromo && (
//               <div className="text-lg line-through opacity-60">
//                 {formatPrice(p.product_price)}
//               </div>
//             )}
//           </div>

//           {/* barre de progression “simple” (optionnel) */}
//           <div className="mt-5 h-1 w-full bg-white/15 rounded">
//             <div
//               key={i} // reset animation à chaque slide
//               className="h-1 bg-white/70 rounded"
//               style={{
//                 width: "100%",
//                 animation: `progress ${slideMs}ms linear`,
//               }}
//             />
//           </div>
//         </div>
//       </div>

//       <style jsx global>{`
//         @keyframes progress {
//           from { transform: scaleX(0); transform-origin: left; }
//           to   { transform: scaleX(1); transform-origin: left; }
//         }
//       `}</style>
//     </main>
//   );
// }