export const ASSET_ORIGIN = "https://boutique.multimedia-services.fr";
export const MANIFEST_REFRESH_MS = 60000;
export const BOARD_IMAGE_SIZES = "(max-width: 800px) 30vw, 20vw";
export const HERO_IMAGE_SIZES = "(max-width: 800px) 90vw, 60vw";

export type ImageDimensions = { width: number; height: number; bytes: number };
export type PreparedEntry = {
  product_id: number; slots: string[]; revision: string;
  status: "fallback" | "ready" | "needs_review"; effects_ready: boolean;
  has_transparency: boolean; cutout_applied: boolean;
  board_url: string; individual_url: string;
  fallback_board_url: string | null; fallback_individual_url: string | null;
  neon_board_url: string | null;
  neon_individual_url: string | null;
  dimensions: Record<string, ImageDimensions>;
};
export type PreparedManifest = {
  schema_version: 1; slot: string; generated_at: string;
  catalog_checked_at: string; catalog_stale_after_seconds: number;
  products: PreparedEntry[];
};
export type ImageCandidate = { url: string; prepared: boolean; dimensions?: ImageDimensions; effects?: boolean };
export type ImagePlan = { candidates: ImageCandidate[]; effects: boolean; revision?: string };
export type ImageProduct = { product_id: number | string; image?: string; thumb?: string; images?: string[] };
export type ImageContext = "board" | "active" | "individual" | "individual-neon";
const record = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;

export function validSlot(slot: string): boolean {
  return slot.length <= 80 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slot);
}
export function normalizeProductId(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
export function preparedImageUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.origin === ASSET_ORIGIN && !url.username && !url.password &&
      url.pathname.startsWith("/diaporama-assets/") && url.pathname.endsWith(".webp") ? value : null;
  } catch { return null; }
}
function ordinaryImageUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const src = value.trim();
  if (src.startsWith("/") && !src.startsWith("//") && !src.includes("\\")) return src;
  try {
    const url = new URL(src);
    return url.protocol === "https:" && !url.username && !url.password && !url.port &&
      ["multimediaservices22.hiboutik.com", "boutique.multimedia-services.fr"].includes(url.hostname) ? src : null;
  } catch { return null; }
}
export function ordinaryProductImage(product: ImageProduct): string | null {
  for (const value of [product.image, product.thumb, ...(Array.isArray(product.images) ? product.images : [])]) {
    const url = ordinaryImageUrl(value);
    if (url) return url;
  }
  return null;
}

export function parsePreparedManifest(input: unknown, slot: string): PreparedManifest | null {
  const root = record(input);
  if (!validSlot(slot) || !root || root.schema_version !== 1 || root.slot !== slot || !Array.isArray(root.products) ||
    typeof root.generated_at !== "string" || !Number.isFinite(Date.parse(root.generated_at)) ||
    typeof root.catalog_checked_at !== "string" || !Number.isFinite(Date.parse(root.catalog_checked_at)) ||
    typeof root.catalog_stale_after_seconds !== "number" || !Number.isFinite(root.catalog_stale_after_seconds) ||
    root.catalog_stale_after_seconds <= 0) return null;
  const products = new Map<number, PreparedEntry>();
  for (const item of root.products) {
    const entry = record(item);
    if (!entry) continue;
    const id = normalizeProductId(entry.product_id);
    const board = preparedImageUrl(entry.board_url), individual = preparedImageUrl(entry.individual_url);
    if (!id || !board || !individual || typeof entry.revision !== "string" || !/^[a-f0-9]{64}$/i.test(entry.revision) ||
      !["fallback", "ready", "needs_review"].includes(String(entry.status)) ||
      !Array.isArray(entry.slots) || !entry.slots.includes(slot)) continue;
    const dimensions: Record<string, ImageDimensions> = {};
    for (const [variant, value] of Object.entries(record(entry.dimensions) ?? {})) {
      const size = record(value);
      if (size && [size.width, size.height, size.bytes].every(n => typeof n === "number" && Number.isSafeInteger(n) && n > 0) &&
        Number(size.width) <= 4096 && Number(size.height) <= 4096 && Number(size.bytes) <= 16777216) {
        dimensions[variant] = { width: Number(size.width), height: Number(size.height), bytes: Number(size.bytes) };
      }
    }
    products.set(id, {
      product_id: id, slots: entry.slots.filter((s): s is string => typeof s === "string"),
      revision: entry.revision, status: entry.status as PreparedEntry["status"],
      effects_ready: entry.effects_ready === true && entry.status === "ready",
      has_transparency: entry.has_transparency === true, cutout_applied: entry.cutout_applied === true,
      board_url: board, individual_url: individual,
      fallback_board_url: preparedImageUrl(entry.fallback_board_url),
      fallback_individual_url: preparedImageUrl(entry.fallback_individual_url),
      neon_board_url: preparedImageUrl(entry.neon_board_url), dimensions,
      neon_individual_url: preparedImageUrl(entry.neon_individual_url),
    });
  }
  return {
    schema_version: 1, slot, generated_at: root.generated_at,
    catalog_checked_at: root.catalog_checked_at, catalog_stale_after_seconds: root.catalog_stale_after_seconds,
    products: [...products.values()],
  };
}
export function isManifestStale(manifest: PreparedManifest, now = Date.now()): boolean {
  return now - Date.parse(manifest.catalog_checked_at) > manifest.catalog_stale_after_seconds * 1000;
}

/** Resolve images only for a product already selected commercially. Never creates products. */
export function resolveProductImage(product: ImageProduct, entry: PreparedEntry | undefined, context: ImageContext): ImagePlan {
  const candidates: ImageCandidate[] = [];
  const ordinary = ordinaryProductImage(product);
  const matching = entry && normalizeProductId(product.product_id) === entry.product_id ? entry : undefined;
  const individual = context === "individual" || context === "individual-neon";
  const neonUrl = individual ? matching?.neon_individual_url : matching?.neon_board_url;
  const effects = (context === "active" || context === "individual-neon") && matching?.status === "ready" &&
    matching.effects_ready && matching.has_transparency && matching.cutout_applied && !!neonUrl;
  const add = (url: string | null | undefined, variant: string, effect = false) => {
    if (url && preparedImageUrl(url) && !candidates.some(candidate => candidate.url === url)) {
      candidates.push({ url, prepared: true, dimensions: matching?.dimensions[variant], effects: effect });
    }
  };
  if (matching) {
    if (effects) add(neonUrl, individual ? "neon_individual" : "neon_board", true);
    add(individual ? matching.individual_url : matching.board_url, individual ? "individual" : "board");
    add(individual ? matching.fallback_individual_url : matching.fallback_board_url,
      individual ? "fallback_individual" : "fallback_board");
  }
  if (ordinary && !candidates.some(candidate => candidate.url === ordinary)) candidates.push({ url: ordinary, prepared: false });
  return { candidates, effects: candidates.some(candidate => candidate.effects === true), revision: matching?.revision };
}
export function imagePlanKey(plan: ImagePlan): string { return plan.candidates.map(candidate => candidate.url).join("|"); }

// Short, bounded failure memory shared by preloading and display; new versioned URLs start clean.
const failures = new Map<string, number>();
export function markImageFailed(url: string, now = Date.now()) {
  failures.delete(url); failures.set(url, now + 300000);
  if (failures.size > 128) failures.delete(failures.keys().next().value!);
}
export function selectImageCandidate(plan: ImagePlan, now = Date.now()): ImageCandidate | undefined {
  return plan.candidates.find(candidate => {
    const expiry = failures.get(candidate.url);
    if (expiry && expiry <= now) failures.delete(candidate.url);
    return !expiry || expiry <= now;
  });
}
export function imageCandidateAfterFailure(plan: ImagePlan, failedUrl: string): ImageCandidate | undefined {
  markImageFailed(failedUrl);
  return selectImageCandidate(plan);
}
