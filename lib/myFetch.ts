// lib/myFetch.ts
import { headers } from "next/headers";

export type MyFetchOptions = Omit<RequestInit, "cache"> & {
  cache?: RequestCache; // default: "no-store"
  next?: { revalidate?: number; tags?: string[] };
  softFail?: boolean;
};

function isAbsoluteUrl(u: string) {
  return /^https?:\/\//i.test(u);
}

async function buildAbsoluteUrl(input: string): Promise<string> {
  if (isAbsoluteUrl(input)) return input;

  // 1) Base explicite si tu la fournis (recommandé)
  const envBase =
    process.env.MY_APP_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  // 2) Si on a une base env, on l'utilise
  if (envBase) {
    return new URL(input, envBase).toString();
  }

  // 3) Sinon, on tente via headers() (Next moderne => async)
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "http";

    if (host) {
      return new URL(input, `${proto}://${host}`).toString();
    }
  } catch {
    // ignore: parfois headers() indispo selon contexte
  }

  // 4) Fallback dev local
  return new URL(input, "http://localhost:3000").toString();
}

async function readBodySafe(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

export async function myFetch<T = unknown>(
  input: string,
  options: MyFetchOptions = {},
): Promise<T> {
  const { cache = "no-store", headers: hdrs, next, softFail, ...rest } = options;

  const url = await buildAbsoluteUrl(input);

  const res = await fetch(url, {
    cache,
    headers: {
      Accept: "application/json",
      ...hdrs,
    },
    next,
    ...rest,
  } as RequestInit);

  if (!res.ok) {
    const body = await readBodySafe(res);
    const msg = `myFetch ${res.status} ${res.statusText} on ${url}${body ? ` — ${body.slice(0, 300)}` : ""}`;
    if (softFail) return null as T;
    throw new Error(msg);
  }

  if (res.status === 204) return undefined as T;

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return (await res.json()) as T;
  console.warn(`myFetch: content-type ${ct} on ${url}, returning text`);
  return (await res.text()) as unknown as T;
}