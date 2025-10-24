type StockEntry = {
  stock_available?: 0 | 1 | boolean;
  [k: string]: any;
};

type HiboutikProduct = {
  product_id: number;
  product_model?: string;
  product_price?: string;
  product_discount_price?: string;
  product_desc?: string;
  product_barcode?: string;
  stock_available_global?: 0 | 1 | boolean;
  stock_available?: StockEntry[]; // tableau côté Hiboutik
};

function formatPrice(p?: string) {
  const n = Number(p ?? 0);
  return isNaN(n) ? "—" : n.toFixed(2).replace(".", ",") + " €";
}

async function getProduct(id: string): Promise<HiboutikProduct | null> {
  const account = process.env.HIBOUTIK_ACCOUNT!;
  const login   = process.env.HIBOUTIK_LOGIN!;
  const apiKey  = process.env.HIBOUTIK_API_KEY!;
  if (!account || !login || !apiKey) return null;

  const url = `https://${account}.hiboutik.com/api/products/${encodeURIComponent(id)}/`;
  const token =
    (globalThis as any).Buffer
      ? Buffer.from(`${login}:${apiKey}`).toString("base64")
      : (typeof btoa !== "undefined" ? btoa(`${login}:${apiKey}`) : "");

  const res = await fetch(url, {
    headers: { Accept: "application/json", Authorization: `Basic ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;

  const data = await res.json();
  const p = Array.isArray(data) ? data[0] : data; // ✅ Hiboutik renvoie parfois [ {...} ]
  return p ?? null;
}

function isInStock(p: HiboutikProduct): boolean {
  if (p.stock_available_global === 1 || p.stock_available_global === true) return true;
  if (Array.isArray(p.stock_available) && p.stock_available.length > 0) {
    return p.stock_available.some(e => e?.stock_available === 1 || e?.stock_available === true);
  }
  return false;
}

export default async function ProduitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // App Router: params est un Promise
  const product = await getProduct(id);

  if (!product) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-xl font-semibold">Produit introuvable</h1>
      </main>
    );
  }

  const hasPromo =
    (product.product_discount_price ?? "0") !== "0" &&
    Number(product.product_discount_price) > 0;
  const finalPrice = hasPromo ? product.product_discount_price : product.product_price;
  const enStock = isInStock(product);

  return (
    <main className="mx-auto max-w-3xl mt-32 p-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Placeholder image (à remplacer par ta vraie image si dispo) */}
        <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center">
          <span className="opacity-40">Image</span>
        </div>

        <div>
          <h1 className="text-2xl font-semibold">
            {product.product_model ?? "(Sans nom)"}{" "}
            <span className="text-sm opacity-60">#{product.product_id}</span>
          </h1>

          <div className="mt-3 flex items-baseline gap-3">
            <div className="text-2xl font-bold">{formatPrice(finalPrice)}</div>
            {hasPromo && (
              <div className="text-base line-through opacity-60">
                {formatPrice(product.product_price)}
              </div>
            )}
          </div>

          <div className="mt-3">
            <span
              className={
                enStock
                  ? "text-xs px-2 py-1 rounded-full bg-green-100 text-green-700"
                  : "text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700"
              }
            >
              {enStock ? "En stock" : "Rupture"}
            </span>
          </div>

          {product.product_barcode && (
            <p className="mt-2 text-sm opacity-70">EAN : {product.product_barcode}</p>
          )}

          {product.product_desc && product.product_desc.trim() !== "" && (
            <p className="mt-4 whitespace-pre-wrap">{product.product_desc}</p>
          )}
        </div>
      </div>
    </main>
  );
}
