export function formatPrice(p?: string) {
  const s = (p ?? "").toString().replace(",", ".");
  const n = Number(s || 0);
  return isNaN(n) ? "—" : n.toFixed(2).replace(".", ",") + " €";
}


export function safeJsonParse<T = any>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}