// app/lib/hiboutik.ts
type HiboutikEnv = {
  account: string;
  login: string;
  apiKey: string;
};

function getEnv(): HiboutikEnv {
  const account = process.env.HIBOUTIK_ACCOUNT;
  const login = process.env.HIBOUTIK_LOGIN;
  const apiKey = process.env.HIBOUTIK_API_KEY;

  if (!account || !login || !apiKey) {
    throw new Error("Missing Hiboutik env vars (HIBOUTIK_ACCOUNT / LOGIN / API_KEY)");
  }
  return { account, login, apiKey };
}

// helper pour fabriquer une URL proxy locale (OK pour le client)
function toProxy(u?: string) {
  return u ? `/api/hiboutik/image?src=${encodeURIComponent(u)}` : undefined;
}

function extractImages(obj: any) {
  const urls = new Set<string>();
  const push = (v: any) => {
    if (!v) return;
    if (typeof v === "string" && /^https?:\/\//i.test(v)) urls.add(v);
    if (typeof v === "object" && typeof v.url === "string" && /^https?:\/\//i.test(v.url)) {
      urls.add(v.url);
    }
  };
  const walk = (x: any) => {
    if (!x) return;
    if (Array.isArray(x)) return x.forEach(walk);
    if (typeof x === "object") {
      for (const [k, v] of Object.entries(x)) {
        if (k.toLowerCase().includes("image")) {
          if (Array.isArray(v)) v.forEach(push);
          else push(v);
        }
        if (v && typeof v === "object") walk(v);
      }
    }
  };
  walk(obj);

  const list = Array.from(urls);
  const mini = list.find((u) => /\/mini_/i.test(u));
  const bigs = list.filter((u) => /\/big_/i.test(u));
  const big = bigs[0] ?? undefined;

  return {
    list,
    thumb: mini ?? big ?? list[0],
    image: big ?? mini ?? list[0],
  };
}

function basicToken(login: string, apiKey: string) {
  // Node => Buffer dispo
  return Buffer.from(`${login}:${apiKey}`).toString("base64");
}

export async function hiboutikGetProduct(id: string) {
  const { account, login, apiKey } = getEnv();

  const upstream = `https://${account}.hiboutik.com/api/products/${encodeURIComponent(id)}/`;
  const token = basicToken(login, apiKey);

  const res = await fetch(upstream, {
    headers: { Accept: "application/json", Authorization: `Basic ${token}` },
    next: { revalidate: 900 }, // ✅ 15 min
  });

  const text = await res.text();
  if (!res.ok) {
    // on remonte l’erreur brute (utile en debug)
    throw new Error(`Hiboutik ${res.status}: ${text.slice(0, 300)}`);
  }

  const raw = text ? JSON.parse(text) : null;
  const p = Array.isArray(raw) ? raw[0] : raw;
  if (!p) return null;

  const { list, thumb, image } = extractImages(p);

  return {
    ...p,
    images: list.map(toProxy),
    thumb: toProxy(thumb),
    image: toProxy(image),
  };
}


export async function hiboutikGetGrid(opts?: {
  order_by?: string;
  sort?: "ASC" | "DESC";
  from?: number;
  to?: number;
}) {
  const { account, login, apiKey } = getEnv();
  const token = basicToken(login, apiKey);

  const order_by = opts?.order_by ?? "product_id";
  const sort = opts?.sort ?? "ASC";
  const from = opts?.from ?? 0;
  const to = opts?.to ?? 99;

  // 1) search list
  const searchUrl = new URL(`https://${account}.hiboutik.com/api/products/search/`);
  searchUrl.searchParams.set("product_display_www", "1");
  searchUrl.searchParams.set("order_by", order_by);
  searchUrl.searchParams.set("sort", sort);

  const listRes = await fetch(searchUrl.toString(), {
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${token}`,
      Range: `items=${from}-${to}`,
    },
    next: { revalidate: 900 }, // ✅ 15 min
  });

  const listText = await listRes.text();
  if (!listRes.ok) {
    throw new Error(`Hiboutik search ${listRes.status}: ${listText.slice(0, 300)}`);
  }

  const listJson = listText ? JSON.parse(listText) : null;
  const items: any[] = Array.isArray(listJson) ? listJson : [];

  // 2) hydrate details en parallèle (ATTENTION: 100 produits = 100 appels)
  const hydrated = await Promise.all(
    items.map(async (p) => {
      try {
        const detUrl = `https://${account}.hiboutik.com/api/products/${encodeURIComponent(
          String(p.product_id)
        )}/`;

        const detRes = await fetch(detUrl, {
          headers: { Accept: "application/json", Authorization: `Basic ${token}` },
          next: { revalidate: 900 }, // ✅ 15 min
        });
        if (!detRes.ok) return null;

        const raw = await detRes.json();
        const det = Array.isArray(raw) ? raw[0] : raw;
        if (!det) return null;

        const { list, thumb, image } = extractImages(det);

        const out = {
          ...p,
          images: list.map(toProxy),
          thumb: toProxy(thumb),
          image: toProxy(image),
        };

        // ne garder que ceux avec image
        if (!out.image && !out.thumb && (!out.images || out.images.length === 0)) return null;
        return out;
      } catch {
        return null;
      }
    })
  );

  return hydrated.filter(Boolean);
}