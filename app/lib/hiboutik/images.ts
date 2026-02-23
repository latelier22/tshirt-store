// app/lib/hiboutik/images.ts

// helper pour fabriquer une URL proxy locale
export function toProxy(u?: string) {
  return u ? `/api/hiboutik/image?src=${encodeURIComponent(u)}` : undefined;
}

export function extractImages(obj: any) {
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

export function attachProxiedImages(p: any) {
  const { list, thumb, image } = extractImages(p);

  return {
    ...p,
    images: list.map(toProxy),
    thumb: toProxy(thumb),
    image: toProxy(image),
  };
}