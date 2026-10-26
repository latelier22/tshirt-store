"use client";

import { memo, useState, type CSSProperties } from "react";
import Image from "next/image";
import {
  imageCandidateAfterFailure, imagePlanKey, selectImageCandidate, type ImagePlan,
} from "@/app/lib/diaporama-assets";

function ProductImage({ plan, alt, className, sizes = "70vw", priority = false, onEffectsChange, onlyEffects = false }: {
  plan: ImagePlan; alt: string; className?: string; sizes?: string; priority?: boolean;
  onEffectsChange?: (active: boolean) => void;
  onlyEffects?: boolean;
}) {
  const key = imagePlanKey(plan);
  const [failure, setFailure] = useState<{ key: string; url: string | null } | null>(null);
  const candidate = failure?.key === key
    ? plan.candidates.find(item => item.url === failure.url) : selectImageCandidate(plan);
  if (onlyEffects && !candidate?.effects) return null;
  if (!candidate) return <span className={className} role="img" aria-label={`${alt} — photo indisponible`}
    style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>Photo indisponible</span>;
  const style: CSSProperties = candidate.prepared ? { backgroundColor: "transparent", zIndex: 1 } : { zIndex: 1 };
  return <Image key={candidate.url} src={candidate.url} alt={alt} fill sizes={sizes} quality={75} unoptimized={candidate.prepared}
    priority={priority} loading={priority ? undefined : "eager"} className={className} style={style}
    onLoad={() => onEffectsChange?.(candidate.effects === true)}
    onError={() => {
      const next = imageCandidateAfterFailure(plan, candidate.url);
      onEffectsChange?.(next?.effects === true);
      setFailure({ key, url: next?.url ?? null });
    }} />;
}
export default memo(ProductImage);
