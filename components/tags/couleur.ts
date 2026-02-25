export function getColorThemeFromTags(tags?: any[]) {
  if (!Array.isArray(tags)) return null;

  const colorTag = tags.find(
    (t) => t.tag_cat?.toUpperCase() === "COULEUR"
  );

  if (!colorTag) return null;

  const name = colorTag.tag?.toLowerCase();

  const map: Record<string, string> = {
  bleu: "bg-[radial-gradient(circle_at_30%_20%,#bfdbfe,transparent_60%)] bg-white",
  orange: "bg-[radial-gradient(circle_at_30%_20%,#fed7aa,transparent_60%)] bg-white",
  rouge: "bg-[radial-gradient(circle_at_30%_20%,#fecaca,transparent_60%)] bg-white",
  vert: "bg-[radial-gradient(circle_at_30%_20%,#bbf7d0,transparent_60%)] bg-white",
  violet: "bg-[radial-gradient(circle_at_30%_20%,#e9d5ff,transparent_60%)] bg-white",
  rose: "bg-[radial-gradient(circle_at_30%_20%,#fbcfe8,transparent_60%)] bg-white",
  jaune: "bg-[radial-gradient(circle_at_30%_20%,#fef08a,transparent_60%)] bg-white",
  turquoise: "bg-[radial-gradient(circle_at_30%_20%,#a5f3fc,transparent_60%)] bg-white",
  indigo: "bg-[radial-gradient(circle_at_30%_20%,#c7d2fe,transparent_60%)] bg-white",
  gris: "bg-[radial-gradient(circle_at_30%_20%,#e5e7eb,transparent_60%)] bg-white",
};


  return map[name] ?? null;
}