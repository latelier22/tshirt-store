export function formatPrice(p?: string) {
  const s = (p ?? "").toString().replace(",", ".");
  const n = Number(s || 0);
  return isNaN(n) ? "—" : n.toFixed(2).replace(".", ",") + " €";
}