// app/lib/hiboutik/api.ts


export async function syliusGetMessages(slot: string) {
  

  const url = `https://boutique.multimedia-services.fr/api/display-messages/${encodeURIComponent(slot)}/`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });


  return res.ok ? await res.json() : null;
}
