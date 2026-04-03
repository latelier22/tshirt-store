"use client";

import React from "react";
import styles from "./DiaporamaClient.module.css";
import type { DisplayMessage } from "./types";
import {
  getAlignConfig,
  getBackgroundClass,
  safeText,
} from "./helpers";

function useEntranceVisible(keyValue: string) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    setVisible(false);
    const t = window.setTimeout(() => setVisible(true), 40);
    return () => clearTimeout(t);
  }, [keyValue]);

  return visible;
}

function AnimatedLine({
  children,
  visible,
  delayMs = 0,
  hiddenClass,
  visibleClass,
  className = "",
  innerClassName = "",
  style,
}: {
  children: React.ReactNode;
  visible: boolean;
  delayMs?: number;
  hiddenClass: string;
  visibleClass: string;
  className?: string;
  innerClassName?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={[
        "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
        visible ? visibleClass : hiddenClass,
        className,
      ].join(" ")}
      style={{
        transitionDelay: `${delayMs}ms`,
        ...style,
      }}
    >
      <div className={innerClassName}>{children}</div>
    </div>
  );
}

export default function MessageSlide({
  message,
  slideKey,
}: {
  message: DisplayMessage;
  slideKey: string;
}) {
  const visible = useEntranceVisible(slideKey);
  const align = getAlignConfig(message.textAlign);
  const accent = message.accentColor || "#f59e0b";

  const badge = safeText(message.badge);
  const title = safeText(message.title);
  const line1 = safeText(message.line1);
  const line2 = safeText(message.line2);
  const line3 = safeText(message.line3);
  const footerText = safeText(message.footerText);
  const isPromo = message.template === "promo";

  return (
    <div
      className={`absolute inset-0 z-[70] overflow-hidden rounded-2xl ${getBackgroundClass(
        message.backgroundType
      )}`}
    >
      <div className={`absolute inset-0 opacity-90 ${styles.bgPan}`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.16),transparent_30%)]" />

      <div className="relative flex h-full w-full items-center justify-center px-10 py-10">
        <div className={`flex max-w-[90vw] flex-col ${align.wrapper}`}>
          {badge && (
            <AnimatedLine
              visible={visible}
              delayMs={40}
              hiddenClass={align.hidden}
              visibleClass={align.visible}
              className="rounded-full px-8 py-4 text-3xl font-extrabold text-white shadow-[0_0_30px_rgba(0,0,0,0.35)]"
              innerClassName={styles.floatSoft}
              style={{ backgroundColor: accent }}
            >
              {badge}
            </AnimatedLine>
          )}

          {title && (
            <AnimatedLine
              visible={visible}
              delayMs={140}
              hiddenClass={align.hidden}
              visibleClass={align.visible}
              className={
                isPromo
                  ? "mt-8 text-6xl md:text-7xl font-black uppercase leading-none text-white"
                  : "mt-8 text-5xl md:text-6xl font-black uppercase leading-none text-white"
              }
              innerClassName={styles.titleBreathe}
            >
              {title}
            </AnimatedLine>
          )}

          {line1 && (
            <AnimatedLine
              visible={visible}
              delayMs={260}
              hiddenClass={align.hidden}
              visibleClass={align.visible}
              className="mt-8 text-3xl md:text-4xl font-light uppercase tracking-[0.18em] text-white/95"
              innerClassName={`${styles.floatSoft} ${styles.delay1}`}
            >
              {line1}
            </AnimatedLine>
          )}

          {line2 && (
            <AnimatedLine
              visible={visible}
              delayMs={380}
              hiddenClass={align.hidden}
              visibleClass={align.visible}
              className="mt-3 text-3xl md:text-4xl font-semibold text-white"
              innerClassName={`${styles.floatSoft} ${styles.delay2}`}
            >
              {line2}
            </AnimatedLine>
          )}

          {line3 && line3 !== "_________" && (
            <AnimatedLine
              visible={visible}
              delayMs={500}
              hiddenClass={align.hidden}
              visibleClass={align.visible}
              className="mt-4 text-2xl md:text-3xl font-medium text-white/85"
              innerClassName={`${styles.floatSoft} ${styles.delay3}`}
            >
              {line3}
            </AnimatedLine>
          )}

          {line3 === "_________" && (
            <AnimatedLine
              visible={visible}
              delayMs={500}
              hiddenClass={align.hidden}
              visibleClass={align.visible}
              className="mt-8"
              innerClassName={`${styles.lineStretch} h-[2px] w-56 bg-white/70`}
            >
              <span />
            </AnimatedLine>
          )}

          {footerText && (
            <AnimatedLine
              visible={visible}
              delayMs={620}
              hiddenClass={align.hidden}
              visibleClass={align.visible}
              className="mt-10 text-2xl md:text-3xl font-medium uppercase tracking-[0.14em] text-white/90"
              innerClassName={`${styles.floatSoft} ${styles.delay4}`}
            >
              {footerText}
            </AnimatedLine>
          )}
        </div>
      </div>
    </div>
  );
}