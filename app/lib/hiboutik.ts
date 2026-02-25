import { safeJsonParse } from "./utils";

import { HiboutikTagCategory } from "@/app/types/ProductType";
import { TagIndexEntry } from "@/app/types/ProductType";


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
  const json = text ? safeJsonParse<any>(text) : null;

  if (!res.ok) {
    throw new Error(`Hiboutik error ${res.status} — ${text.slice(0, 500)}`);
  }

  // si Hiboutik renvoie un truc non-JSON (rare), on protège
  if (json == null) {
    throw new Error(`Hiboutik invalid JSON — ${text.slice(0, 500)}`);
  }

  return json;
}

// petit cache mémoire (évite de refetch tout le temps)
let _tagsCache: { ts: number; index: Map<number, TagIndexEntry> } | null = null;

export async function hiboutikGetTagsProductsIndex(ttlMs = 10 * 60 * 1000) {
  const now = Date.now();
  if (_tagsCache && now - _tagsCache.ts < ttlMs) return _tagsCache.index;

  const cats = (await hiboutikFetch("/api/tags/products")) as HiboutikTagCategory[];

  const index = new Map<number, TagIndexEntry>();
  for (const cat of Array.isArray(cats) ? cats : []) {
    for (const t of Array.isArray(cat.tag_details) ? cat.tag_details : []) {
      const id = Number(t.tag_id);
      if (!id) continue;
      index.set(id, {
        tag_id: id,
        tag: t.tag,
        tag_cat_id: Number(cat.tag_cat_id),
        tag_cat: cat.tag_cat,
      });
    }
  }

  _tagsCache = { ts: now, index };
  return index;
}

// Résout raw.tags (IDs ou objets) => [{tag_id, tag, tag_cat...}]
export async function resolveProductTags(rawTags: any) {
  const idx = await hiboutikGetTagsProductsIndex();

  const ids: number[] = (Array.isArray(rawTags) ? rawTags : [])
    .map((x: any) => Number(x?.tag_id ?? x?.id ?? x))
    .filter((n: any) => Number.isFinite(n) && n > 0);

  const unique = Array.from(new Set(ids));

  return unique
    .map((id) => idx.get(id))
    .filter(Boolean) as TagIndexEntry[];
}

// app/lib/hiboutik.ts
export async function hiboutikGetTagsProducts() {
  // Hiboutik renvoie un array direct
  return await hiboutikFetch("/api/tags/products");
}