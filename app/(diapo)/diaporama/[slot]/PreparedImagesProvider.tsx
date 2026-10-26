"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  MANIFEST_REFRESH_MS, parsePreparedManifest, isManifestStale, validSlot,
  type PreparedEntry, type PreparedManifest,
} from "@/app/lib/diaporama-assets";

const emptyEntries = new Map<number, PreparedEntry>();
const Context = createContext({ entries: emptyEntries as ReadonlyMap<number, PreparedEntry>, loading: false, stale: false });
const retained = new Map<string, PreparedManifest>();
export const usePreparedImages = () => useContext(Context);

export default function PreparedImagesProvider({ slot, enabled = true, children }: {
  slot: string; enabled?: boolean; children: ReactNode;
}) {
  const [snapshot, setSnapshot] = useState<{ manifest: PreparedManifest | null; loading: boolean }>({ manifest: null, loading: enabled });
  useEffect(() => {
    let cancelled = false;
    let pending = false;
    let activeController: AbortController | undefined;
    async function load() {
      if (pending) return;
      if (!enabled || !validSlot(slot)) {
        setSnapshot({ manifest: null, loading: false }); return;
      }
      pending = true;
      const controller = new AbortController();
      activeController = controller;
      const timer = window.setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetch(`/api/diaporama/${encodeURIComponent(slot)}/assets`, {
          cache: "no-store", signal: controller.signal,
        });
        if (!response.ok) throw new Error("Manifest unavailable");
        const json: unknown = await response.json();
        if (cancelled) return;
        if (json && typeof json === "object" && "disabled" in json && json.disabled === true) {
          retained.delete(slot); setSnapshot({ manifest: null, loading: false }); return;
        }
        const manifest = parsePreparedManifest(json, slot);
        if (!manifest) throw new Error("Invalid manifest");
        retained.delete(slot); retained.set(slot, manifest);
        if (retained.size > 8) retained.delete(retained.keys().next().value!);
        setSnapshot(current => JSON.stringify(current.manifest) === JSON.stringify(manifest) && !current.loading
          ? current : { manifest, loading: false });
      } catch {
        if (!cancelled) setSnapshot(current => ({ manifest: current.manifest ?? retained.get(slot) ?? null, loading: false }));
      } finally { window.clearTimeout(timer); pending = false; }
    }
    void load();
    const timer = window.setInterval(load, MANIFEST_REFRESH_MS);
    return () => { cancelled = true; activeController?.abort(); window.clearInterval(timer); };
  }, [slot, enabled]);

  const entries = useMemo(() => snapshot.manifest
    ? new Map(snapshot.manifest.products.map(entry => [entry.product_id, entry])) : emptyEntries, [snapshot.manifest]);
  const value = useMemo(() => ({ entries, loading: snapshot.loading,
    stale: !!snapshot.manifest && isManifestStale(snapshot.manifest) }), [entries, snapshot]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
