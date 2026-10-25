"use client";

import { useEffect, useState } from "react";
import DiaporamaMessagesClient from "../../diaporama/[slot]/DiaporamaMessagesClient";
import type { DisplayMessage } from "../../diaporama/[slot]/types";

function normalizeMessages(input: unknown): DisplayMessage[] {
  const rawList = Array.isArray(input)
    ? input
    : Array.isArray((input as { data?: unknown[] })?.data)
      ? (input as { data: unknown[] }).data
      : [];

  return rawList
    .map((value: unknown): DisplayMessage => {
      const m = value && typeof value === "object" ? value as Partial<DisplayMessage> : {};
      return ({
      id: Number(m?.id ?? 0),
      name: String(m?.name ?? ""),
      slot: String(m?.slot ?? ""),
      template: String(m?.template ?? "promo"),
      badge: m?.badge ?? null,
      title: m?.title ?? null,
      line1: m?.line1 ?? null,
      line2: m?.line2 ?? null,
      line3: m?.line3 ?? null,
      footerText: m?.footerText ?? null,
      backgroundType: m?.backgroundType ?? "black",
      textAlign: (m?.textAlign ?? "center") as "left" | "center" | "right",
      accentColor: m?.accentColor ?? "#f59e0b",
      intervalSeconds: Number(m?.intervalSeconds ?? 30),
      durationSeconds: Number(m?.durationSeconds ?? 4),
      sortOrder: Number(m?.sortOrder ?? 0),
      startsAt: m?.startsAt ?? null,
      endsAt: m?.endsAt ?? null,
      });
    })
    .filter((m: DisplayMessage) => m.id > 0)
    .sort(
      (a: DisplayMessage, b: DisplayMessage) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    );
}

export default function PageClient({ slot, portrait = 0 }: {
  slot: string; portrait?: 0 | 1 | -1;
}) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [notice, setNotice] = useState("Chargement des messages…");

  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    async function loadMessages() {
      if (pending) return;
      pending = true;
      try {
        const response = await fetch(`/api/display-messages/${encodeURIComponent(slot)}`, {
          cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const list = normalizeMessages(await response.json());
        if (controller.signal.aborted) return;
        setMessages(current => JSON.stringify(current) === JSON.stringify(list) ? current : list);
        setNotice(list.length ? "" : "À découvrir en magasin");
      } catch {
        if (!controller.signal.aborted) setNotice("Actualisation des messages en attente");
      } finally {
        pending = false;
      }
    }
    void loadMessages();
    const timer = window.setInterval(loadMessages, 30000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [slot]);

  return <DiaporamaMessagesClient messages={messages} portrait={portrait} notice={notice} />;
}
