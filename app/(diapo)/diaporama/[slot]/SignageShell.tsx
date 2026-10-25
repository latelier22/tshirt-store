"use client";

import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { MotionConfig } from "framer-motion";
import styles from "./DiaporamaClient.module.css";

export default function SignageShell({ portrait = "0", paused = false, sceneKey, durationMs,
  footer = "À découvrir en magasin", children, controls }: {
  portrait?: string; paused?: boolean; sceneKey: string; durationMs: number;
  footer?: string; children: ReactNode; controls?: ReactNode;
}) {
  const rotated = portrait === "1" || portrait === "-1";
  const canvas: CSSProperties = rotated ? {
    position: "absolute", top: "50%", left: "50%", width: "100vh", height: "100vw",
    transform: `translate(-50%, -50%) rotate(${portrait === "-1" ? -90 : 90}deg)`,
  } : { position: "absolute", inset: 0 };
  return <MotionConfig reducedMotion="user">
    <main className="fixed inset-0 overflow-hidden bg-[#080c14] text-white">
      <div style={canvas}>
        <div className={styles.shell} data-paused={paused}>
          <header className={styles.brandBar}>
            <div className={styles.brandLogo}>
              <Image src="/logo-multimedia.png" alt="Multimédia Services" width={300} height={100} priority />
            </div>
            <span className={styles.brandCaption}>Votre prochain coup de cœur</span>
          </header>
          <div className={styles.scene}>{children}</div>
          <footer className={styles.footerBar}>
            <div className={styles.progressTrack} aria-hidden="true">
              <div key={sceneKey} className={styles.progressFill} style={{ "--duration": `${durationMs}ms` } as CSSProperties} />
            </div>
            <strong>Multimédia Services</strong><span>{footer}</span>
          </footer>
          {controls}
        </div>
      </div>
    </main>
  </MotionConfig>;
}
