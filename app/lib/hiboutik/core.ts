// app/lib/hiboutik/core.ts
export function hiboutikEnv() {
  const account = process.env.HIBOUTIK_ACCOUNT;
  const login = process.env.HIBOUTIK_LOGIN;
  const apiKey = process.env.HIBOUTIK_API_KEY;

  if (!account || !login || !apiKey) {
    throw new Error("Missing Hiboutik env vars (HIBOUTIK_ACCOUNT / HIBOUTIK_LOGIN / HIBOUTIK_API_KEY)");
  }
  return { account, login, apiKey };
}

export function hiboutikToken(login: string, apiKey: string) {
  // Node => Buffer dispo
  return Buffer.from(`${login}:${apiKey}`).toString("base64");
}

export function hiboutikAuthHeaders(token: string, range?: { from: string; to: string }) {
  const h: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Basic ${token}`,
  };
  if (range) h["Range"] = `items=${range.from}-${range.to}`;
  return h;
}

export function copySearchParams(src: URLSearchParams, dst: URLSearchParams) {
  for (const [k, v] of src.entries()) dst.set(k, v);
}

export function forceProductDisplayWWW(dst: URLSearchParams) {
  if (!dst.has("product_display_www")) dst.set("product_display_www", "1");
}