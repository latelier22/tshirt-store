"use client";

import React from "react";

export type DisplayMessage = {
  id: number;
  name: string;
  slot: string;
  template: string;
  badge: string | null;
  title: string | null;
  line1: string | null;
  line2: string | null;
  line3: string | null;
  footerText: string | null;
  backgroundType: string | null;
  textAlign: "left" | "center" | "right" | null;
  accentColor: string | null;
  intervalSeconds: number | null;
  durationSeconds: number | null;
  sortOrder: number | null;
  startsAt: string | null;
  endsAt: string | null;
};

type SlideState =
  | { kind: "logo" }
  | { kind: "message"; message: DisplayMessage; index: number };

type Props = {
  messages: DisplayMessage[];
  portrait?: 0 | 1 | -1;
};

const DEFAULT_LOGO_SECONDS = 6;

function safeText(v?: string | null) {
  return String(v ?? "").trim();
}

function getDurationMs(seconds?: number | null, fallback = 4) {
  const n = Number(seconds ?? fallback);
  return Math.max(1, n) * 1000;
}

function getLogoGapMs(message?: DisplayMessage | null) {
  if (!message) return DEFAULT_LOGO_SECONDS * 1000;

  const interval = Math.max(1, Number(message.intervalSeconds ?? 10));
  return interval * 1000;
}

function getBackgroundClass(backgroundType?: string | null) {
  switch (backgroundType) {
    case "orange":
      return "bg-gradient-to-br from-orange-700 via-orange-500 to-amber-300";
    case "blue":
      return "bg-gradient-to-br from-slate-950 via-blue-900 to-sky-400";
    case "black":
    default:
      return "bg-black";
  }
}

function getAlignConfig(align?: string | null) {
  if (align === "left") {
    return {
      wrapper: "items-start text-left",
      hidden: "-translate-x-12 opacity-0 scale-95",
      visible: "translate-x-0 opacity-100 scale-100",
    };
  }

  if (align === "right") {
    return {
      wrapper: "items-end text-right",
      hidden: "translate-x-12 opacity-0 scale-95",
      visible: "translate-x-0 opacity-100 scale-100",
    };
  }

  return {
    wrapper: "items-center text-center",
    hidden: "translate-y-8 opacity-0 scale-95",
    visible: "translate-y-0 opacity-100 scale-100",
  };
}

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

function MessageSlide({
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
      className={`absolute inset-0 overflow-hidden ${getBackgroundClass(
        message.backgroundType
      )}`}
    >
      <div className="ms-bg-pan absolute inset-0 opacity-90" />
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
              innerClassName="ms-float-soft"
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
              innerClassName="ms-title-breathe"
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
              innerClassName="ms-float-soft ms-delay-1"
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
              innerClassName="ms-float-soft ms-delay-2"
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
              innerClassName="ms-float-soft ms-delay-3"
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
              innerClassName="ms-line-stretch h-[2px] w-56 bg-white/70"
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
              innerClassName="ms-float-soft ms-delay-4"
            >
              {footerText}
            </AnimatedLine>
          )}
        </div>
      </div>
    </div>
  );
}

function LogoSlide({ slideKey }: { slideKey: string }) {
  const visible = useEntranceVisible(slideKey);

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <div className="ms-bg-pan absolute inset-0 opacity-80" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.12),transparent_28%)]" />

      <div className="relative flex h-full w-full items-center justify-center px-8 py-8">
        <div
          className={[
            "flex flex-col items-center transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]",
            visible
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-8 scale-95 opacity-0",
          ].join(" ")}
        >
          <div className="ms-logo-breathe relative h-[180px] w-[520px] max-w-[82vw]">
            <img
              src="/logo-multimedia.png"
              alt="Logo Multimedia"
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function getRotationClass(portrait: 0 | 1 | -1) {
  if (portrait === 1) return "rotate-90";
  if (portrait === -1) return "-rotate-90";
  return "";
}

export default function DiaporamaMessagesClient({
  messages,
  portrait = 0,
}: Props) {
  const [slide, setSlide] = React.useState<SlideState>({ kind: "logo" });
  const [slideTick, setSlideTick] = React.useState(0);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (messages.length === 0) {
      setCurrentIndex(0);
      setSlide({ kind: "logo" });
      setSlideTick((v) => v + 1);
      return;
    }

    setCurrentIndex((prev) => {
      if (prev < messages.length) return prev;
      return 0;
    });

    setSlide((current) => {
      if (current.kind === "message") {
        const sameIndex = messages.findIndex((m) => m.id === current.message.id);
        if (sameIndex >= 0) {
          return {
            kind: "message",
            message: messages[sameIndex],
            index: sameIndex,
          };
        }
      }

      return { kind: "logo" };
    });
  }, [messages]);

  React.useEffect(() => {
    if (messages.length === 0) return;

    if (slide.kind === "logo") {
      const nextMessage = messages[currentIndex] ?? messages[0];

      const t = window.setTimeout(() => {
        setSlide({
          kind: "message",
          message: nextMessage,
          index: currentIndex,
        });
        setSlideTick((v) => v + 1);
      }, getLogoGapMs(nextMessage));

      return () => clearTimeout(t);
    }

    const currentMessage = slide.message;

    const t = window.setTimeout(() => {
      setCurrentIndex((slide.index + 1) % messages.length);
      setSlide({ kind: "logo" });
      setSlideTick((v) => v + 1);
    }, getDurationMs(currentMessage.durationSeconds, 4));

    return () => clearTimeout(t);
  }, [slide, messages, currentIndex]);

  const isPortrait = portrait === 1 || portrait === -1;

  return (
    <main className="fixed inset-0 overflow-hidden bg-black text-white">
      <style jsx global>{`
        @keyframes msBgPan {
          0% {
            transform: scale(1) translate3d(0, 0, 0);
          }
          50% {
            transform: scale(1.06) translate3d(1.5%, -1.5%, 0);
          }
          100% {
            transform: scale(1) translate3d(0, 0, 0);
          }
        }

        @keyframes msLogoBreathe {
          0% {
            transform: scale(0.96);
          }
          50% {
            transform: scale(1.06);
          }
          100% {
            transform: scale(0.96);
          }
        }

        @keyframes msFloatSoft {
          0% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-6px) scale(1.015);
          }
          100% {
            transform: translateY(0) scale(1);
          }
        }

        @keyframes msTitleBreathe {
          0% {
            transform: translateY(0) scale(1);
            text-shadow: 0 0 0 rgba(255, 255, 255, 0);
          }
          50% {
            transform: translateY(-4px) scale(1.02);
            text-shadow: 0 0 24px rgba(255, 255, 255, 0.12);
          }
          100% {
            transform: translateY(0) scale(1);
            text-shadow: 0 0 0 rgba(255, 255, 255, 0);
          }
        }

        @keyframes msLineStretch {
          0% {
            transform: scaleX(0.92);
            opacity: 0.65;
          }
          50% {
            transform: scaleX(1);
            opacity: 1;
          }
          100% {
            transform: scaleX(0.92);
            opacity: 0.65;
          }
        }

        .ms-bg-pan {
          background:
            radial-gradient(circle at top right, rgba(255, 255, 255, 0.08), transparent 28%),
            radial-gradient(circle at bottom left, rgba(245, 158, 11, 0.16), transparent 30%);
          animation: msBgPan 12s ease-in-out infinite;
          will-change: transform;
        }

        .ms-logo-breathe {
          animation: msLogoBreathe 4.8s ease-in-out infinite;
          will-change: transform;
        }

        .ms-float-soft {
          animation: msFloatSoft 4.2s ease-in-out infinite;
          will-change: transform;
        }

        .ms-title-breathe {
          animation: msTitleBreathe 4.6s ease-in-out infinite;
          will-change: transform;
        }

        .ms-line-stretch {
          transform-origin: center center;
          animation: msLineStretch 2.8s ease-in-out infinite;
          will-change: transform, opacity;
        }

        .ms-delay-1 {
          animation-delay: 0.2s;
        }

        .ms-delay-2 {
          animation-delay: 0.45s;
        }

        .ms-delay-3 {
          animation-delay: 0.7s;
        }

        .ms-delay-4 {
          animation-delay: 0.95s;
        }
      `}</style>

      {!isPortrait && (
        <>
          {slide.kind === "logo" && <LogoSlide slideKey={`logo-${slideTick}`} />}

          {slide.kind === "message" && (
            <MessageSlide
              slideKey={`message-${slide.message.id}-${slide.message.slot}-${slide.index}-${slideTick}`}
              message={slide.message}
            />
          )}
        </>
      )}

      {isPortrait && (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-black">
          <div
            className={`relative shrink-0 overflow-hidden ${getRotationClass(
              portrait
            )}`}
            style={{
              width: "100vh",
              height: "100vw",
            }}
          >
            <div
              className="absolute left-1/2 top-1/2"
              style={{
                width: "100vw",
                height: "100vh",
                transform: "translate(-50%, -50%)",
              }}
            >
              {slide.kind === "logo" && <LogoSlide slideKey={`logo-${slideTick}`} />}

              {slide.kind === "message" && (
                <MessageSlide
                  slideKey={`message-${slide.message.id}-${slide.message.slot}-${slide.index}-${slideTick}`}
                  message={slide.message}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}