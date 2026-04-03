import { redirect } from "next/navigation";
import DiaporamaClient from "./DiaporamaClient";
import DiaporamaMessagesClient from "./DiaporamaMessagesClient";
import type { DisplayMessage } from "./types";
import { hiboutikGetProductsByTag } from "@/app/lib/hiboutik-cache";
import type {
  HiboutikProduct,
  HiboutikResolvedTag,
} from "@/app/types/ProductType";
import { hiboutikGetTagsProductsIndex } from "@/app/lib/hiboutik";
import { syliusGetMessages } from "@/app/lib/sylius/api";
import { hasUsableImage } from "./helpers";

type Props = {
  params: Promise<{ slot: string }>;
  searchParams: Promise<{ portrait?: string }>;
};

type HiboutikProductWithFullTags = HiboutikProduct & {
  fullTags: HiboutikResolvedTag[];
};

function extractTagIds(rawTags: unknown): number[] {
  if (!Array.isArray(rawTags)) return [];

  const ids = rawTags
    .map((x: any) => Number(x?.tag_id ?? x?.id ?? x))
    .filter((n) => Number.isFinite(n) && n > 0);

  return Array.from(new Set(ids));
}

function normalizePortrait(v?: string): 0 | 1 | -1 {
  if (v === "1") return 1;
  if (v === "-1") return -1;
  return 0;
}

function isMessageActive(message: DisplayMessage, now = new Date()) {
  const startOk = !message.startsAt || new Date(message.startsAt) <= now;
  const endOk = !message.endsAt || new Date(message.endsAt) >= now;
  return startOk && endOk;
}

export default async function DiaporamaSlotPage({
  params,
  searchParams,
}: Props) {
  const { slot } = await params;
  const sp = await searchParams;

  const portraitMode = sp?.portrait ?? "0";
  const portrait = normalizePortrait(portraitMode);

  if (slot === "tablette") {
    redirect("https://boutique.multimedia-services.fr/tablet/wait?device=TAB1");
  }

  const rawMessages = await syliusGetMessages(slot);

  const activeMessages: DisplayMessage[] = Array.isArray(rawMessages)
    ? rawMessages
        .filter((m) => isMessageActive(m))
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    : [];

  const rawProducts: HiboutikProduct[] = await hiboutikGetProductsByTag(slot);
const filteredProducts: HiboutikProduct[] = rawProducts.filter(
  (p) => hasUsableImage(p) && Number(p.stock_available) > 0
);


const products = [...filteredProducts];

for (let i = products.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [products[i], products[j]] = [products[j], products[i]];
}

console.log(products[0].stock_available, products[0].product_id, products[0].product_model);

  if (!products.length) {
    if (activeMessages.length > 0) {
      return (
        <DiaporamaMessagesClient
          messages={activeMessages}
          portrait={portrait}
        />
      );
    }

    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white p-8">
        Aucun produit avec le tag "{slot}".
      </main>
    );
  }

  const tagIndex = await hiboutikGetTagsProductsIndex();

  const productsWithTags: HiboutikProductWithFullTags[] = products.map(
    (p: any) => {
      const tagIds = extractTagIds(p.tags);

      const fullTags = tagIds
        .map((id) => tagIndex.get(id))
        .filter((t): t is HiboutikResolvedTag => !!t);

      return {
        ...p,
        fullTags,
      };
    }
  );

  return (
    <DiaporamaClient
      products={productsWithTags}
      messages={activeMessages}
      portrait={portraitMode}
    />
  );
}