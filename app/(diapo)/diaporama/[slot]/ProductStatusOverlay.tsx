export default function ProductStatusOverlay({ productId, salePending, large = false }: {
  productId?: number;
  salePending?: boolean;
  large?: boolean;
}) {
  return <>
    {salePending && (
      <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center overflow-hidden">
        <div className={[
          "w-[145%] shrink-0 -rotate-[18deg] border-y-2 border-white/80 bg-red-600/95 text-center font-black uppercase tracking-wider text-white shadow-2xl",
          large ? "py-5 text-4xl" : "py-2 text-base",
        ].join(" ")}>
          VENTE EN COURS !
        </div>
      </div>
    )}
    {productId != null && (
      <div className={[
        "pointer-events-none absolute bottom-3 left-3 z-40 rounded-lg bg-black/80 font-bold text-white shadow-lg",
        large ? "px-4 py-2 text-2xl" : "px-2 py-1 text-sm",
      ].join(" ")}>
        N° {productId}
      </div>
    )}
  </>;
}
