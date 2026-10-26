"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { DisplayMessage } from "./types";
import { getMessageDurationMs } from "./helpers";
import MessageSlide from "./MessageSlide";
import SignageShell from "./SignageShell";
import StageDecor from "./StageDecor";
import AnimatedWords from "./AnimatedWords";
import styles from "./DiaporamaClient.module.css";

export type { DisplayMessage } from "./types";

export default function DiaporamaMessagesClient({ messages, portrait = 0, notice }: {
  messages: DisplayMessage[]; portrait?: 0 | 1 | -1; notice?: string;
}) {
  const [slide, setSlide] = useState({ kind: "logo", index: 0, tick: 0 });
  const message = messages.length ? messages[slide.index % messages.length] : null;
  const showMessage = slide.kind === "message" && !!message;
  const interval = Number(message?.intervalSeconds ?? 10);
  const gap = Number.isFinite(interval) ? Math.max(3, interval) * 1000 : 6000;
  const durationMs = showMessage ? getMessageDurationMs(message, 5) : gap;
  const sceneKey = `${showMessage ? message.id : "logo"}-${slide.tick}`;

  useEffect(() => {
    if (!messages.length) return;
    const timer = window.setTimeout(() => setSlide(current => ({
      kind: showMessage ? "logo" : "message",
      index: showMessage ? (current.index + 1) % messages.length : current.index,
      tick: current.tick + 1,
    })), durationMs);
    return () => clearTimeout(timer);
  }, [showMessage, durationMs, messages.length, slide.tick]);

  return <SignageShell portrait={String(portrait)} sceneKey={sceneKey} durationMs={durationMs}
    footer={notice || "À découvrir en magasin"}>
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={sceneKey} className="absolute inset-0"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        exit={{ opacity: 0 }} transition={{ duration: .18 }}>
        {showMessage ? <MessageSlide message={message} slideKey={sceneKey} /> : <section className={styles.logoScene}>
          <StageDecor />
          <motion.div className={styles.logoPanel} initial={{ opacity: 0, scale: .8, rotate: -4 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ type: "spring", damping: 17 }}>
            <Image src="/logo-multimedia.png" alt="Multimédia Services" width={800} height={300} priority />
          </motion.div>
          <p><AnimatedWords text="À découvrir en magasin" delay={.35} /></p>
        </section>}
      </motion.div>
    </AnimatePresence>
  </SignageShell>;
}
