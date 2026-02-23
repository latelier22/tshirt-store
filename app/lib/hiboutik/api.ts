// app/lib/hiboutik/api.ts
import {
  hiboutikEnv,
  hiboutikToken,
  hiboutikAuthHeaders,
  copySearchParams,
  forceProductDisplayWWW,
} from "./core";
import { attachProxiedImages } from "./images";

// mini util pour limiter la concurrence (sans lib externe)
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>) {
  const out: R[] = new Array(items.length);
  let i = 0;

  const workers = Array.from({ length: Math.max(1, limit) }, async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      out[idx] = await fn(items[idx], idx);
    }
  });

  await Promise.all(workers);
  return out;
}

export async function hiboutikGetProduct(productId: string) {
  const { account, login, apiKey } = hiboutikEnv();
  const token = hiboutikToken(login, apiKey);

  const url = `https://${account}.hiboutik.com/api/products/${encodeURIComponent(productId)}/`;

  const res = await fetch(url, {
    headers: { Accept: "application/json", Authorization: `Basic ${token}` },
    next: { revalidate: 900 }, // ✅ 15 min
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Hiboutik product ${res.status}: ${text.slice(0, 300)}`);

  const raw = text ? JSON.parse(text) : null;
  const p = Array.isArray(raw) ? raw[0] : raw;
  if (!p) return null;

  return attachProxiedImages(p);
}

export async function hiboutikSearch(reqUrl: string) {
  const { account, login, apiKey } = hiboutikEnv();
  const token = hiboutikToken(login, apiKey);

  const url = new URL(reqUrl);

  const upstream = new URL(`https://${account}.hiboutik.com/api/products/search/`);
  copySearchParams(url.searchParams, upstream.searchParams);
  forceProductDisplayWWW(upstream.searchParams);

  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const headers = hiboutikAuthHeaders(
    token,
    from !== null && to !== null ? { from, to } : undefined
  );

  const res = await fetch(upstream.toString(), {
    method: "GET",
    headers,
    next: { revalidate: 900 }, // ✅ 15 min",
  })  ;

  const text = await res.text();
  if (!res.ok) throw new Error(`Hiboutik search ${res.status}: ${text.slice(0, 300)}`);

  // Hiboutik renvoie souvent un tableau
  const json = text ? JSON.parse(text) : null;
  return Array.isArray(json) ? json : [];
}

// Version “hydrated” : liste + détails en parallèle (LIMITÉ)
export async function hiboutikSearchHydrated(reqUrl: string, concurrency = 8) {
  const baseList = await hiboutikSearch(reqUrl);

  const hydrated = await mapLimit(baseList, concurrency, async (p: any) => {
    try {
      const det = await hiboutikGetProduct(String(p.product_id));
      if (!det) return null;

      // tu gardes les champs de la liste + tu ajoutes images/thumb/image du détail
     return {
  ...det,
  ...p, // si tu as des champs utiles dans le listing
  product_price: det.product_price,
  product_discount_price: det.product_discount_price,
  images: det.images,
  thumb: det.thumb,
  image: det.image,
};
    } catch {
      return null;
    }
  });

  // Ne garder que ceux qui ont une image
  return hydrated.filter(
    (r): r is any =>
      !!r && (r.image || r.thumb || (Array.isArray(r.images) && r.images.length > 0))
  );
}