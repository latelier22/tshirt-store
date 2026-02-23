// app/lib/hiboutik.ts

// ✅ On ne lit plus Hiboutik direct.
// ✅ On lit ton cache VPS : https://api.multimedia-services.fr
// ✅ On garde le proxy d’images /api/hiboutik/image (côté Next) pour ne rien casser.

function cacheBase() {
  const base = process.env.CACHE_API_BASE || "https://api.multimedia-services.fr";
  return base.replace(/\/+$/, "");
}

// helper pour fabriquer une URL proxy locale (OK pour le client)
function toProxy(u?: string) {
  return u ? `/api/hiboutik/image?src=${encodeURIComponent(u)}` : undefined;
}

function safeJsonParse<T = any>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function normalizeImagesFromCache(p: any) {
  // Ton VPS peut renvoyer :
  // - images: string[]
  // - images_json: string (JSON array)
  // - ou rien (dans ce cas on laisse vide)
  let images: string[] = [];

  if (Array.isArray(p?.images)) {
    images = p.images.filter((u: any) => typeof u === "string");
  } else if (typeof p?.images_json === "string") {
    const parsed = safeJsonParse<any[]>(p.images_json);
    if (Array.isArray(parsed)) images = parsed.filter((u) => typeof u === "string");
  }

  const thumb = p?.thumb ?? images[0];
  const image = p?.image ?? images[0];

  return {
    ...p,
    images: images.map(toProxy),
    thumb: toProxy(thumb),
    image: toProxy(image),
  };
}

export async function hiboutikGetProduct(id: string) {
  const base = cacheBase();

  const res = await fetch(`${base}/api/products/${encodeURIComponent(id)}`, {
    // 🔥 comme le VPS répond en ms, tu peux laisser no-store
    cache: "no-store",
  });

  const text = await res.text();
  const json = text ? safeJsonParse<any>(text) : null;

  if (!res.ok) {
    throw new Error(`CACHE product ${res.status}: ${text.slice(0, 300)}`);
  }

  const p = json?.data;
  if (!p) return null;

  return normalizeImagesFromCache(p);
}

export async function hiboutikGetGrid(opts?: {
  order_by?: string;
  sort?: "ASC" | "DESC";
  from?: number;
  to?: number;
  category?: string;
  category_slug?: string;
  product_category?: string;
  include_children?: "0" | "1";
  q?: string;
}) {
  const base = cacheBase();

  const url = new URL(`${base}/api/products`);
  url.searchParams.set("from", String(opts?.from ?? 0));
  url.searchParams.set("to", String(opts?.to ?? 99));

  if (opts?.order_by) url.searchParams.set("order_by", opts.order_by);
  if (opts?.sort) url.searchParams.set("sort", opts.sort);

  if (opts?.q) url.searchParams.set("q", opts.q);

  if (opts?.category) url.searchParams.set("category", opts.category);
  if (opts?.category_slug) url.searchParams.set("category_slug", opts.category_slug);

  if (opts?.product_category) url.searchParams.set("product_category", opts.product_category);
  if (opts?.include_children) url.searchParams.set("include_children", opts.include_children);

  const res = await fetch(url.toString(), { cache: "no-store" });
  const text = await res.text();
  const json = text ? safeJsonParse<any>(text) : null;

  if (!res.ok) throw new Error(`CACHE products ${res.status}: ${text.slice(0, 300)}`);

  const items: any[] = Array.isArray(json?.data) ? json.data : [];
  return items.map(normalizeImagesFromCache);
}