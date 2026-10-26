import { ASSET_ORIGIN, parsePreparedManifest, validSlot, type PreparedManifest } from "./diaporama-assets";

const cache = new Map<string, { manifest: PreparedManifest; checked: number }>();
const pending = new Map<string, Promise<PreparedManifest | null>>();

export async function getSlotManifest(slot: string): Promise<PreparedManifest | null> {
  if (!validSlot(slot)) return null;
  const cached = cache.get(slot);
  if (cached && Date.now() - cached.checked < 30000) return cached.manifest;
  const existing = pending.get(slot);
  if (existing) return existing;
  const request = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    try {
      const response = await fetch(`${ASSET_ORIGIN}/diaporama-assets/slots/${encodeURIComponent(slot)}/manifest.json`, {
        cache: "no-store", signal: controller.signal, headers: { Accept: "application/json" }, redirect: "error",
      });
      if (!response.ok) throw new Error("Manifest unavailable");
      const manifest = parsePreparedManifest(await response.json(), slot);
      if (!manifest) throw new Error("Invalid manifest");
      cache.delete(slot); cache.set(slot, { manifest, checked: Date.now() });
      if (cache.size > 8) cache.delete(cache.keys().next().value!);
      return manifest;
    } catch {
      // The retained manifest is image metadata only, never a source of current stock.
      if (cached) cached.checked = Date.now();
      return cached?.manifest ?? null;
    } finally { clearTimeout(timer); pending.delete(slot); }
  })();
  pending.set(slot, request);
  return request;
}
