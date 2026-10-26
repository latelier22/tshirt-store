import Image from "next/image";

/** Display the original photo, resized and cached by Next. No browser pixel processing. */
export default function ProductImage({ src, alt, className, sizes = "70vw", priority = false }: {
  src: string; alt: string; className?: string; sizes?: string; priority?: boolean;
}) {
  return <Image src={src} alt={alt} fill sizes={sizes} quality={75}
    priority={priority} loading={priority ? undefined : "eager"} className={className} />;
}
