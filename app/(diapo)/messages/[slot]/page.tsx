// app/(diapo)/messages/[slot]/page.tsx
import PageClient from "./PageClient";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slot: string }>;
  searchParams?: Promise<{ portrait?: string }>;
};

function normalizePortrait(value?: string) {
  if (value === "1") return 1;
  if (value === "-1") return -1;
  return 0;
}

export default async function MessagesSlotPage({ params, searchParams }: Props) {
  const { slot } = await params;
  const sp = searchParams ? await searchParams : undefined;

  const portrait = normalizePortrait(sp?.portrait);

  return <PageClient slot={slot} portrait={portrait} />;
}