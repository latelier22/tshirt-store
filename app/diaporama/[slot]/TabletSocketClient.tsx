// app/diaporama/[slot]/TabletSocketClient.tsx
"use client";

import React from "react";

type Incoming =
  | { type?: string; url?: string; id?: number | string }
  | any;

function resolveUrl(u: string) {
  // si on reçoit déjà une URL absolue -> ok
  if (/^https?:\/\//i.test(u)) return u;

  // sinon on colle la base Sylius
  const base = (process.env.NEXT_PUBLIC_SYLIUS_BASE || "").replace(/\/+$/, "");
  if (!base) return u; // fallback : relative
  return `${base}${u.startsWith("/") ? u : `/${u}`}`;
}

export default function TabletSocketClient() {
  const [status, setStatus] = React.useState<"connecting" | "connected" | "disconnected">("connecting");
  const [lastMsg, setLastMsg] = React.useState<string>("");

  React.useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_TABLET_WS_URL;
    if (!wsUrl) {
      setStatus("disconnected");
      setLastMsg("NEXT_PUBLIC_TABLET_WS_URL manquant");
      return;
    }

    let ws: WebSocket | null = null;
    let retry = 0;
    let stopped = false;
    let retryTimer: any = null;

    const connect = () => {
      if (stopped) return;

      setStatus("connecting");
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        retry = 0;
        setStatus("connected");

        // Optionnel : annonce d’identification device
        try {
          ws?.send(JSON.stringify({ type: "hello", device: "TAB1" }));
        } catch {}
      };

      ws.onclose = () => {
        setStatus("disconnected");
        if (stopped) return;

        // backoff simple
        retry += 1;
        const waitMs = Math.min(5000, 300 + retry * 500);
        retryTimer = setTimeout(connect, waitMs);
      };

      ws.onerror = () => {
        // on laisse onclose gérer la reconnexion
      };

      ws.onmessage = (ev) => {
        const raw = String(ev.data ?? "");
        setLastMsg(raw.slice(0, 300));

        let msg: Incoming = null;
        try {
          msg = JSON.parse(raw);
        } catch {
          msg = { url: raw }; // si le serveur envoie juste une URL en texte
        }

        const url = msg?.url;
        if (typeof url === "string" && url.trim()) {
          const target = resolveUrl(url.trim());

          // ✅ redirect
          window.location.href = target;
        }
      };
    };

    connect();

    return () => {
      stopped = true;
      if (retryTimer) clearTimeout(retryTimer);
      try {
        ws?.close();
      } catch {}
      ws = null;
    };
  }, []);

  const label =
    status === "connected" ? "Connectée" : status === "connecting" ? "Connexion..." : "Déconnectée";

  return (
    <main className="fixed inset-0 bg-black text-white flex items-center justify-center p-10">
      <div className="w-full max-w-2xl border border-white/10 rounded-2xl p-8 bg-white/5">
        <div className="text-3xl font-semibold">Tablette – en attente</div>
        <div className="mt-2 opacity-80">
          Socket : <span className="font-semibold">{label}</span>
        </div>

        <div className="mt-6 text-sm opacity-70">
          Dernier message :
          <div className="mt-2 p-3 rounded-xl bg-black/40 border border-white/10 break-words">
            {lastMsg || "(aucun)"}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full rounded-xl px-4 py-4 text-lg font-semibold bg-white text-black hover:opacity-90 transition"
          >
            Reconnecter
          </button>

          <button
            type="button"
            onClick={() => {
              const base = (process.env.NEXT_PUBLIC_SYLIUS_BASE || "").replace(/\/+$/, "");
              window.location.href = base ? `${base}/admin` : "/admin";
            }}
            className="w-full rounded-xl px-4 py-4 text-lg font-semibold border border-white/15 hover:bg-white/10 transition"
          >
            Ouvrir admin Sylius
          </button>
        </div>
      </div>
    </main>
  );
}