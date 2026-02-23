import Link from "next/link";
import { hiboutikGetGrid } from "@/app/lib/hiboutik"; // ou ta future fonction "byCategory"
import { HiboutikProduct } from "@/app/types/ProductType";
import PageClient from "@/app/produits/PageClient";

// slug = "occasion-reconditionne-33"
function parseIdFromSlug(slug: string): number | null {
  const m = slug.match(/-(\d+)$/);
  if (!m) return null;
  const id = Number(m[1]);
  return Number.isFinite(id) ? id : null;
}

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const categoryId = parseIdFromSlug(slug);

  if (!categoryId) {
    return (
      <main className="mx-auto max-w-5xl p-6 mt-28">
        <h1 className="text-xl font-semibold">Catégorie introuvable</h1>
        <p className="mt-2 opacity-80">Slug invalide : {slug}</p>
        <div className="mt-4">
          <Link className="underline" href="/produits">Retour aux produits</Link>
        </div>
      </main>
    );
  }

  // ✅ Ici, tu filtres les produits par catégorie.
  // Option A (rapide à coder) : tu fais une fonction dédiée hiboutikGetProductsByCategory
  // Option B (si tu veux maintenant) : réutiliser un endpoint Hiboutik /products/search/category/{id}
  //
  // Comme ton hiboutikGetGrid actuel fait "search + hydrate images", je te conseille une vraie fonction dédiée.
  //
  // Pour ne pas te bloquer, je te donne la version simple avec hiboutikGetGrid + filtre local
  // MAIS: ça dépend si ton grid renvoie déjà toute la boutique (0-99) => filtre incomplet.
  // => donc on fait la vraie fonction (ci-dessous), c’est mieux.

  const products = (await hiboutikGetProductsByCategory(categoryId, 0, 99)) as HiboutikProduct[];

  return (
    <main className="mt-28">
      {/* tu peux afficher un titre propre en transformant le slug si tu veux */}
      <PageClient products={products} />
    </main>
  );
}

/**
 * ✅ Version "propre" : appelle Hiboutik endpoint /products/search/category/{category_id}
 * + hydrate avec images comme tu fais déjà
 */
async function hiboutikGetProductsByCategory(categoryId: number, from = 0, to = 99) {
  const account = process.env.HIBOUTIK_ACCOUNT!;
  const login = process.env.HIBOUTIK_LOGIN!;
  const apiKey = process.env.HIBOUTIK_API_KEY!;
  if (!account || !login || !apiKey) return [];

  const token = Buffer.from(`${login}:${apiKey}`).toString("base64");

  const listUrl = `https://${account}.hiboutik.com/api/products/search/category/${encodeURIComponent(
    String(categoryId)
  )}`;

  const listRes = await fetch(listUrl, {
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${token}`,
      Range: `items=${from}-${to}`,
    },
    next: { revalidate: 900 }, // ✅ 15 min
  });

  if (!listRes.ok) return [];
  const items = (await listRes.json()) as any[];
  if (!Array.isArray(items)) return [];

  // hydrate details pour images (comme ton grid)
  const hydrated = await Promise.all(
    items.map(async (p: any) => {
      try {
        const detUrl = `https://${account}.hiboutik.com/api/products/${encodeURIComponent(
          String(p.product_id)
        )}/`;

        const detRes = await fetch(detUrl, {
          headers: { Accept: "application/json", Authorization: `Basic ${token}` },
          next: { revalidate: 900 }, // ✅ 15 min",
        });
        if (!detRes.ok) return null;

        const raw = await detRes.json();
        const det = Array.isArray(raw) ? raw[0] : raw;
        if (!det) return null;

        // --- extraction images (copie ta fonction existante si tu veux éviter duplication)
        const urls = new Set<string>();
        const push = (v: any) => {
          if (!v) return;
          if (typeof v === "string" && /^https?:\/\//i.test(v)) urls.add(v);
          if (typeof v === "object" && typeof v.url === "string" && /^https?:\/\//i.test(v.url)) urls.add(v.url);
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
        walk(det);

        const list = Array.from(urls);
        const mini = list.find((u) => /\/mini_/i.test(u));
        const bigs = list.filter((u) => /\/big_/i.test(u));
        const big = bigs[0] ?? undefined;

        const toProxy = (u?: string) =>
          u ? `/api/hiboutik/image?src=${encodeURIComponent(u)}` : undefined;

        const thumb = mini ?? big ?? list[0];
        const image = big ?? mini ?? list[0];

        const out = {
          ...p,
          images: list.map(toProxy),
          thumb: toProxy(thumb),
          image: toProxy(image),
        };

        if (!out.image && !out.thumb && (!out.images || out.images.length === 0)) return null;
        return out;
      } catch {
        return null;
      }
    })
  );

  return hydrated.filter(Boolean);
}