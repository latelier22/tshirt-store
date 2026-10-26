import { redirect } from "next/navigation";
import DailyDiaporamaClient from "./DailyDiaporamaClient";
import type { DisplayMessage } from "./types";
import { hiboutikGetProductsByTag } from "@/app/lib/hiboutik-cache";
import type {
  HiboutikProduct,
  HiboutikResolvedTag,
} from "@/app/types/ProductType";
import { hiboutikGetTagsProductsIndex } from "@/app/lib/hiboutik";
import { syliusGetMessages } from "@/app/lib/sylius/api";
import { hasUsableImage } from "./helpers";
import { isDiaporamaProductAvailable } from "@/app/lib/diaporama-stock";
import StockRefresh from "./StockRefresh";
import { sortProductsByRecency, getProductsRevision } from "@/app/lib/product-order";

type Props = {
  params: Promise<{ slot: string }>;
  searchParams: Promise<{ portrait?: string; prepared?: string }>;
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

  if (slot === "tablette") {
    redirect("https://boutique.multimedia-services.fr/tablet/wait?device=TAB1");
  }

  const [messageResult, productResult] = await Promise.allSettled([
    syliusGetMessages(slot), hiboutikGetProductsByTag(slot),
  ]);
  const rawMessages: unknown = messageResult.status === "fulfilled" ? messageResult.value : [];
  const commercialReliable = productResult.status === "fulfilled";
  const rawProducts: HiboutikProduct[] = commercialReliable && productResult.status === "fulfilled" ? productResult.value : [];
  const messageList: DisplayMessage[] = Array.isArray(rawMessages) ? rawMessages
    : rawMessages && typeof rawMessages === "object" && "data" in rawMessages && Array.isArray(rawMessages.data)
      ? rawMessages.data : [];

  const activeMessages: DisplayMessage[] = messageList
    .filter((m) => isMessageActive(m))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const filteredProducts: HiboutikProduct[] = rawProducts.filter(
    (p) => hasUsableImage(p) && isDiaporamaProductAvailable(p)
  );

  const products = sortProductsByRecency(filteredProducts);
  const productIds = products.map((product) => product.product_id).sort((a, b) => a - b);
  const stockRefresh = <StockRefresh slot={slot} productIds={productIds} revision={getProductsRevision(products)} />;

  const tagIndex = products.length ? await hiboutikGetTagsProductsIndex() : new Map<number, HiboutikResolvedTag>();

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
    <>
      {stockRefresh}
      <DailyDiaporamaClient
        slot={slot}
        products={productsWithTags}
        messages={activeMessages}
        portrait={portraitMode}
        commercialReliable={commercialReliable}
        preparedImagesEnabled={sp.prepared !== "0" && process.env.DIAPORAMA_PREPARED_IMAGES !== "0"}
      />
    </>
  );
}
