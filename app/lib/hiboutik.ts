// app/lib/hiboutik.ts
import { safeJsonParse } from "./utils";
import type { HiboutikTagCategory, HiboutikResolvedTag } from "@/app/types/ProductType";

function hiboutikBase() {
  const account = process.env.HIBOUTIK_ACCOUNT;
  if (!account) throw new Error("HIBOUTIK_ACCOUNT manquant");
  return `https://${account}.hiboutik.com`;
}

function hiboutikAuthHeader() {
  const login = process.env.HIBOUTIK_LOGIN;
  const apiKey = process.env.HIBOUTIK_API_KEY;
  if (!login) throw new Error("HIBOUTIK_LOGIN manquant");
  if (!apiKey) throw new Error("HIBOUTIK_API_KEY manquant");

  const token = Buffer.from(`${login}:${apiKey}`).toString("base64");
  return `Basic ${token}`;
}

async function hiboutikFetch(path: string) {
  const base = hiboutikBase();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: hiboutikAuthHeader(),
    },
  });

  const text = await res.text();
  const json = text ? safeJsonParse<unknown>(text) : null;

  if (!res.ok) {
    throw new Error(`Hiboutik error ${res.status} — ${text.slice(0, 500)}`);
  }
  if (json == null) {
    throw new Error(`Hiboutik invalid JSON — ${text.slice(0, 500)}`);
  }

  return json;
}

// ✅ export brut pour /diaporama
export async function hiboutikGetTagsProducts(): Promise<HiboutikTagCategory[]> {
  return (await hiboutikFetch("/api/tags/products")) as HiboutikTagCategory[];
}

// petit cache mémoire
let _tagsCache: { ts: number; index: Map<number, HiboutikResolvedTag> } | null = null;

export async function hiboutikGetTagsProductsIndex(ttlMs = 10 * 60 * 1000) {
  const now = Date.now();
  if (_tagsCache && now - _tagsCache.ts < ttlMs) return _tagsCache.index;

  const cats = await hiboutikGetTagsProducts();

  const index = new Map<number, HiboutikResolvedTag>();
  for (const cat of cats) {
    for (const t of cat.tag_details ?? []) {
      const id = Number(t.tag_id);
      if (!id) continue;
      index.set(id, {
        tag_id: id,
        tag: String(t.tag ?? ""),
        tag_cat_id: Number(cat.tag_cat_id),
        tag_cat: String(cat.tag_cat ?? ""),
      });
    }
  }

  _tagsCache = { ts: now, index };
  return index;
}

// Résout raw.tags (IDs ou objets) => HiboutikResolvedTag[]
export async function resolveProductTags(rawTags: unknown): Promise<HiboutikResolvedTag[]> {
  const idx = await hiboutikGetTagsProductsIndex();

  const ids: number[] = (Array.isArray(rawTags) ? rawTags : [])
    .map((x: any) => Number(x?.tag_id ?? x?.id ?? x))
    .filter((n: any) => Number.isFinite(n) && n > 0);

  const unique = Array.from(new Set(ids));

  return unique
    .map((id) => idx.get(id))
    .filter((x): x is HiboutikResolvedTag => !!x);
}