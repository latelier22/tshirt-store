export type BadgeStyle = {
  label: string;
  color: string;
};

export type Frame = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type DiapoPhase = "hero" | "label" | "exit";

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