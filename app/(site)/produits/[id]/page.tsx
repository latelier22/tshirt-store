// app/produits/[id]/page.tsx
import PageClient from "./PageClient";
import { HiboutikProduct } from "@/app/types/ProductType";
import {
  hiboutikGetGrid,
  hiboutikGetProduct,
  hiboutikGetProductWithRaw,
} from "@/app/lib/hiboutik-cache";

import { resolveProductTags } from "@/app/lib/hiboutik";

type Props = {
  params: Promise<{ id: string }>;
};

const MIN_ASSOC = 6;
const MAX_ASSOC = 12;

function toValidId(v: any): string | null {
  const s = String(v ?? "").trim();
  return s && s !== "undefined" && s !== "null" ? s : null;
}

function uniqById(list: any[]) {
  const seen = new Set<number>();
  const out: any[] = [];
  for (const p of list) {
    const id = Number(p?.product_id);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(p);
  }
  return out;
}

// ✅ IMPORTANT: sur ton cache, data.product_category peut être 0
// et la vraie valeur est dans raw.product_category (ex: 12)
function catIdFromDataOrRaw(data: any, raw: any): string | null {
  const d = Number(data?.product_category ?? 0);
  if (Number.isFinite(d) && d > 0) return String(d);

  const r = Number(raw?.product_category ?? 0);
  if (Number.isFinite(r) && r > 0) return String(r);

  return null;
}

function catIdFromData(p: any): string | null {
  const n = Number(p?.product_category ?? 0);
  return Number.isFinite(n) && n > 0 ? String(n) : null;
}

export default async function ProduitPage({ params }: Props) {
  const { id: rawId } = await params;
  const id = toValidId(rawId);

  if (!id) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-xl font-semibold">Produit introuvable</h1>
        <p className="mt-2 text-sm opacity-80">ID demandé invalide</p>
      </main>
    );
  }

  // 1) produit (data + raw)
  let detail: { data: HiboutikProduct; raw: any } | null = null;
  try {
    detail = (await hiboutikGetProductWithRaw(id)) as any;
  } catch {
    detail = null;
  }

  const product = detail?.data ?? null;
  const raw = detail?.raw ?? null;

  console.log("[PAGE] fetched product=", product, "raw=", raw);

  const tagsResolved = await resolveProductTags(raw?.tags);

  if (!product) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-xl font-semibold">Produit introuvable</h1>
        <p className="mt-2 text-sm opacity-80">ID demandé : {id}</p>
      </main>
    );
  }

  // 2) associés réels (IDs)
  const assocIds: string[] = (Array.isArray(raw?.associated_products) ? raw.associated_products : [])
    .map((x: any) => toValidId(x?.product_id ?? x?.id ?? x))
    .filter((x: string | null): x is string => !!x);

  const uniqueAssocIds = Array.from(new Set(assocIds)).slice(0, 30);

  // 3) fetch produits associés
  const associatedReal: HiboutikProduct[] = [];
  for (const aid of uniqueAssocIds) {
    try {
      const p = (await hiboutikGetProduct(aid)) as HiboutikProduct | null;
      if (p) associatedReal.push(p);
    } catch {
      // ignore
    }
  }

  console.log("[ASSOC] data.cat=", (product as any)?.product_category, "raw.cat=", raw?.product_category);

  // 4) base + exclusions
  let associatedFinal: HiboutikProduct[] = uniqById(associatedReal);

  const exclude = new Set<number>();
  exclude.add(Number(product.product_id));
  for (const p of associatedFinal) exclude.add(Number(p.product_id));

  const addFromPool = (pool: HiboutikProduct[]) => {
    for (const p of pool) {
      const pid = Number((p as any)?.product_id);
      if (!pid || exclude.has(pid)) continue;
      associatedFinal.push(p);
      exclude.add(pid);
      if (associatedFinal.length >= MIN_ASSOC) break;
    }
  };

  // 5) compléter avec catégories des associés (d’abord)
  if (associatedFinal.length < MIN_ASSOC) {
    const assocCatIds = Array.from(
      new Set(associatedFinal.map((p) => catIdFromData(p)).filter(Boolean) as string[])
    );

    for (const catId of assocCatIds) {
      if (associatedFinal.length >= MIN_ASSOC) break;

      try {
        const pool = (await hiboutikGetGrid({
          product_category: catId,
          include_children: "1",
          order_by: "updated_at",
          sort: "DESC",
          from: 0,
          to: 120,
        })) as HiboutikProduct[];

        addFromPool(pool);
      } catch {
        // ignore
      }
    }
  }

  // ✅ 6) SI TOUJOURS PAS 6 : compléter avec la catégorie du produit LUI-MÊME
  if (associatedFinal.length < MIN_ASSOC) {
    const mainCatId = catIdFromDataOrRaw(product, raw); // ✅ FIX CRITIQUE
    if (mainCatId) {
      try {
        const pool = (await hiboutikGetGrid({
          product_category: mainCatId,
          include_children: "1",
          order_by: "updated_at",
          sort: "DESC",
          from: 0,
          to: 160,
        })) as HiboutikProduct[];

        addFromPool(pool);
      } catch {
        // ignore
      }
    }
  }

  // 7) clean + limite
  associatedFinal = uniqById(associatedFinal).slice(0, MAX_ASSOC);

  return <PageClient product={product} associated={associatedFinal} tags={tagsResolved} />;
}