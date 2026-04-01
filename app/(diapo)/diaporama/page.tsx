// app/diaporama/page.tsx
import Link from "next/link";
import { headers } from "next/headers";
import { hiboutikGetTagsProducts } from "@/app/lib/hiboutik";
import type {
  HiboutikTagCategory,
  HiboutikTagDetail,
} from "@/app/types/ProductType";
import Header from "@/components/Header";

export const dynamic = "force-dynamic";

type DiapoSlot = {
  id: number;
  label: string;
  slot: string;
};

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

function normalizeMessages(input: any): any[] {
  const rawList = Array.isArray(input)
    ? input
    : Array.isArray(input?.data)
      ? input.data
      : [];

  return rawList.filter((m: any) => Number(m?.id ?? 0) > 0);
}



async function getMessageCountBySlot(slot: string): Promise<number> {
  try {
    const boutiqueUrl = "https://boutique.multimedia-services.fr";

    const res = await fetch(
      `${boutiqueUrl}/api/display-messages/${encodeURIComponent(slot)}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    if (!res.ok) return 0;

    const json = await res.json();
    return normalizeMessages(json).length;
  } catch (e) {
    console.error(`Erreur chargement messages pour slot "${slot}"`, e);
    return 0;
  }
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

  const countsEntries = await Promise.all(
    tags.map(async (t) => {
      const count = await getMessageCountBySlot(t.slot);
      return [t.slot, count] as const;
    })
  );

  const messageCountBySlot = Object.fromEntries(countsEntries);
  const slotsWithMessages = tags.filter((t) => (messageCountBySlot[t.slot] ?? 0) > 0);

  return (
    <>
      <Header />

      <main className="mx-auto max-w-4xl px-6 mt-24 pb-20">
        <h1 className="text-2xl md:text-3xl font-semibold">Diaporama</h1>

        <p className="mt-2 text-sm opacity-70">
          Sélectionne un slot (tags catégorie <b>DIAPORAMA</b>).
        </p>

        {slotsWithMessages.length > 0 && (
          <div className="mt-6 rounded-2xl border bg-white p-5">
            <div className="text-lg font-semibold">Messages disponibles</div>
            <div className="mt-3 flex flex-wrap gap-3">
              {slotsWithMessages.map((t) => (
                <Link
                  key={`msg-top-${t.id}`}
                  href={`/messages/${t.slot}`}
                  target="_blank"
                  className="rounded-xl bg-blue-600 text-white px-4 py-2 font-semibold hover:bg-blue-700 transition"
                >
                  {t.label} — {messageCountBySlot[t.slot]} message
                  {(messageCountBySlot[t.slot] ?? 0) > 1 ? "s" : ""}
                </Link>
              ))}
            </div>
          </div>
        )}

        {!tags.length ? (
          <div className="mt-6 rounded-xl border p-4 opacity-80">
            Aucun tag DIAPORAMA trouvé.
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {tags.map((t) => {
              const isTablette = t.slot === "tablette";
              const messageCount = messageCountBySlot[t.slot] ?? 0;
              const hasMessages = messageCount > 0;

              return (
                <div
                  key={t.id}
                  className="w-full rounded-2xl border px-5 py-4 bg-white flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-semibold">{t.label}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        slot : <b>{t.slot}</b>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {hasMessages ? (
                        <span className="inline-flex rounded-full bg-blue-100 text-blue-800 px-3 py-1 text-sm font-semibold">
                          {messageCount} message
                          {messageCount > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-gray-100 text-gray-600 px-3 py-1 text-sm font-semibold">
                          Aucun message
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/diaporama/${t.slot}`}
                      className="flex-1 min-w-[180px] rounded-xl bg-gray-900 text-white px-4 py-3 text-center font-semibold hover:bg-black transition flex items-center justify-center gap-2"
                    >
                      <span className="text-xl">🖥️</span>
                      <span>Paysage</span>
                    </Link>

                    {!isTablette && (
                      <>
                        <Link
                          href={`/diaporama/${t.slot}?portrait=1`}
                          className="flex-1 min-w-[180px] rounded-xl bg-orange-500 text-white px-4 py-3 text-center font-semibold hover:bg-orange-600 transition flex items-center justify-center gap-2"
                        >
                          <span className="text-xl">📱</span>
                          <span>Portrait (+90°)</span>
                        </Link>

                        <Link
                          href={`/diaporama/${t.slot}?portrait=-1`}
                          className="flex-1 min-w-[180px] rounded-xl bg-orange-300 text-black px-4 py-3 text-center font-semibold hover:bg-orange-400 transition flex items-center justify-center gap-2"
                        >
                          <span className="text-xl">🔄</span>
                          <span>Portrait (-90°)</span>
                        </Link>
                      </>
                    )}

                    {hasMessages && (
  <>
    <Link
      href={`/messages/${t.slot}`}
      className="flex-1 min-w-[180px] rounded-xl bg-blue-600 text-white px-4 py-3 text-center font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
    >
      <span className="text-xl">💬</span>
      <span>Messages</span>
    </Link>

    {!isTablette && (
      <>
        <Link
          href={`/messages/${t.slot}?portrait=1`}
          className="flex-1 min-w-[180px] rounded-xl bg-cyan-600 text-white px-4 py-3 text-center font-semibold hover:bg-cyan-700 transition flex items-center justify-center gap-2"
        >
          <span className="text-xl">📱</span>
          <span>Messages (+90°)</span>
        </Link>

        <Link
          href={`/messages/${t.slot}?portrait=-1`}
          className="flex-1 min-w-[180px] rounded-xl bg-cyan-300 text-black px-4 py-3 text-center font-semibold hover:bg-cyan-400 transition flex items-center justify-center gap-2"
        >
          <span className="text-xl">🔄</span>
          <span>Messages (-90°)</span>
        </Link>
      </>
    )}
  </>
)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}