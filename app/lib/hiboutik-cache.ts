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
    if (Array.isArray(parsed)) {
      images = parsed.filter((u) => typeof u === "string");
    }
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

function parseAttributesFromMiscText(miscText: any) {
  if (Array.isArray(miscText)) return miscText;

  if (typeof miscText === "string" && miscText.trim()) {
    const parsed = safeJsonParse<any[]>(miscText);
    return Array.isArray(parsed) ? parsed : [];
  }

  return [];
}

export async function hiboutikGetProduct(id: string) {
  const base = cacheBase();

  const res = await fetch(`${base}/api/products/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });

  const text = await res.text();
  const json = text ? safeJsonParse<any>(text) : null;

  if (!res.ok) {
    throw new Error(`CACHE product ${res.status}: ${text.slice(0, 300)}`);
  }

  const p = json?.data;
  if (!p) return null;

  const raw = json?.raw ?? null;
  const miscText = raw?.misc_text ?? p?.misc_text ?? "";
  const attributes = parseAttributesFromMiscText(miscText);

  return normalizeImagesFromCache({
    ...p,
    raw,
    misc_text: miscText,
    attributes,
  });
}

export async function hiboutikGetProductWithRaw(id: string) {
  const base = cacheBase();

  const res = await fetch(`${base}/api/products/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });

  const text = await res.text();
  const json = text ? safeJsonParse<any>(text) : null;

  if (!res.ok) {
    throw new Error(`CACHE product ${res.status}: ${text.slice(0, 300)}`);
  }

  const p = json?.data;
  if (!p) return null;

  const raw = json?.raw ?? null;
  const miscText = raw?.misc_text ?? p?.misc_text ?? "";
  const attributes = parseAttributesFromMiscText(miscText);

  return {
    data: normalizeImagesFromCache({
      ...p,
      raw,
      misc_text: miscText,
      attributes,
    }),
    raw,
  };
}

export async function hiboutikGetProductsByTag(tag: string) {
  const base = cacheBase();

  const url = new URL(`${base}/api/productsByTag`);
  url.searchParams.set("tag", tag);

  const res = await fetch(url.toString(), {
    cache: "no-store",
  });

  const text = await res.text();
  const json = text ? safeJsonParse<any>(text) : null;

  if (!res.ok) {
    throw new Error(`CACHE productsByTag ${res.status}: ${text.slice(0, 300)}`);
  }

  const items: any[] = Array.isArray(json?.data) ? json.data : [];

  console.log(`Hiboutik productsByTag "${tag}"`, {
    count: items.length,
    items,
  });

  const detailedItems = await Promise.all(
    items.map(async (item) => {
      try {
        const detail = await hiboutikGetProductWithRaw(String(item.product_id));

        if (!detail?.data) {
          return normalizeImagesFromCache({
            ...item,
            attributes: [],
          });
        }

        const detailData = detail.data;
        const raw = detail.raw ?? null;
        const miscText =
          raw?.misc_text ??
          detailData?.misc_text ??
          item?.misc_text ??
          "";

        const attributes = parseAttributesFromMiscText(miscText);

        console.log(`attributes for product ${item?.product_id}:`, attributes);

        // ✅ on garde les images de l’item de la liste si elles existent déjà
        // ✅ sinon on prend celles du détail
        return normalizeImagesFromCache({
          ...detailData,
          ...item,
          raw,
          misc_text: miscText,
          attributes,
        });
      } catch (e) {
        console.error(`Erreur détail produit ${item?.product_id}`, e);

        return normalizeImagesFromCache({
          ...item,
          attributes: [],
        });
      }
    })
  );

  return detailedItems;
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

  if (opts?.product_category) {
    url.searchParams.set("product_category", opts.product_category);
  }

  if (opts?.include_children) {
    url.searchParams.set("include_children", opts.include_children);
  }

  const res = await fetch(url.toString(), { cache: "no-store" });
  const text = await res.text();
  const json = text ? safeJsonParse<any>(text) : null;

  if (!res.ok) {
    throw new Error(`CACHE products ${res.status}: ${text.slice(0, 300)}`);
  }

  const items: any[] = Array.isArray(json?.data) ? json.data : [];
  return items.map(normalizeImagesFromCache);
}