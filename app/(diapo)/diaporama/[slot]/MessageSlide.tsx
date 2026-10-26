"use client";

import { type CSSProperties } from "react";
import { motion } from "framer-motion";
import type { DisplayMessage } from "./types";
import { safeText } from "./helpers";
import AnimatedWords from "./AnimatedWords";
import StageDecor from "./StageDecor";
import styles from "./DiaporamaClient.module.css";

export default function MessageSlide({ message, slideKey }: {
  message: DisplayMessage; slideKey: string;
}) {
  const accent = message.accentColor || (message.backgroundType === "blue" ? "#66d8ff" : "#ff8a36");
  const title = safeText(message.title);
  const badge = safeText(message.badge);
  const lines = [message.line1, message.line2, message.line3].map(safeText);
  return <article key={slideKey} className={styles.messageScene}
    data-align={message.textAlign || "center"} data-background={message.backgroundType || "black"}
    style={{ "--accent": accent } as CSSProperties}>
    <StageDecor />
    <div className={styles.messageGhost} aria-hidden="true">{badge || "MULTIMÉDIA"}</div>
    <div className={styles.messageContent}>
      {badge && <motion.div className={styles.messageBadge} initial={false}
        animate={{ opacity: 1, scale: 1, rotate: -3 }} transition={{ type: "spring", damping: 15, delay: .12 }}>
        <span className={styles.liveDot} />{badge}
      </motion.div>}
      {title && <h1 className={styles.messageTitle}><AnimatedWords text={title} delay={.12} /></h1>}
      <motion.div className={styles.messageRule} initial={false} animate={{ scaleX: 1 }} transition={{ delay: .45, duration: .7 }} />
      {lines.map((line, index) => line && (line === "_________"
        ? <div key={index} className={styles.messageSeparator} />
        : <motion.div key={`${index}-${line}`} className={index === 0 ? styles.messageLead : styles.messageLine}
          initial={false} animate={{ opacity: 1, y: 0 }} transition={{ delay: .55 + index * .16, duration: .6 }}>
          {line}
        </motion.div>))}
      {safeText(message.footerText) && <motion.div className={styles.messageFooter}
        initial={false} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05 }}>
        {message.footerText}<span aria-hidden="true">↗</span>
      </motion.div>}
    </div>
  </article>;
}
