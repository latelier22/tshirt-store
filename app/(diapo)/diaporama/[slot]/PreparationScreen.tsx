"use client";

import Image from "next/image";
import type { DisplayMessage } from "./types";
import SignageShell from "./SignageShell";
import MessageSlide from "./MessageSlide";
import styles from "./DiaporamaClient.module.css";

export default function PreparationScreen({ portrait = "0", message }: { portrait?: string; message?: DisplayMessage }) {
  return <SignageShell portrait={portrait} paused sceneKey="welcome" durationMs={4000} footer="Bienvenue en magasin">
    {message ? <MessageSlide message={message} slideKey="welcome" /> : <section className={styles.logoScene} role="status">
      <div className={styles.logoPanel}>
        <Image src="/logo-multimedia.png" alt="Multimédia Services" width={800} height={300} priority />
      </div>
      <p>Votre sélection arrive…</p>
    </section>}
  </SignageShell>;
}
