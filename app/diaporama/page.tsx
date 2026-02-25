// app/diaporama/page.tsx
import Link from "next/link";
import { hiboutikGetTagsProducts } from "@/app/lib/hiboutik";
import type { HiboutikTagCategory, HiboutikTagDetail } from "@/app/types/ProductType";
import Header from "@/components/Header";

export const dynamic = "force-dynamic";

type DiapoSlot = { id: number; label: string; slot: string };

function slugify(s: string) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " et ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function norm(s: unknown) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default async function DiaporamaIndexPage() {
  const cats = (await hiboutikGetTagsProducts()) as HiboutikTagCategory[];

  const diapoCat = cats.find((c) => norm(c.tag_cat) === "diaporama");

  const tags: DiapoSlot[] = (diapoCat?.tag_details ?? [])
    .filter((t: HiboutikTagDetail) => (t.tag_enabled ?? 1) === 1)
    .map((t: HiboutikTagDetail) => ({
      id: Number(t.tag_id),
      label: String(t.tag ?? "").trim(),
      slot: slugify(String(t.tag ?? "").trim()),
    }))
    .filter((t) => t.id > 0 && t.label);

  return (
    <>
    <Header />
    <main className="mx-auto max-w-3xl px-6 mt-24 pb-20">
      <h1 className="text-2xl md:text-3xl font-semibold">Diaporama</h1>
      <p className="mt-2 text-sm opacity-70">
        Sélectionne un slot (tags catégorie <b>DIAPORAMA</b>).
      </p>

     

      {!tags.length ? (
        <div className="mt-6 rounded-xl border p-4 opacity-80">
          Aucun tag DIAPORAMA trouvé.
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {tags.map((t) => (
            <Link
            key={t.id}
            href={`/diaporama/${t.slot}`}
            className="w-full rounded-2xl border px-5 py-4 text-lg font-semibold bg-white hover:bg-gray-50 transition flex items-center justify-between"
            >
              <span className="truncate">{t.label}</span>
              <span className="opacity-60">→</span>
            </Link>
          ))}
        </div>
      )}
    </main>
      </>
  );
}