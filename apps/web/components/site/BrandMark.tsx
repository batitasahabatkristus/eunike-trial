import Image from "next/image";

/** The Eunike mark, used where the full logo is too tall (app shell). */
export function BrandMark({ size = 44 }: { size?: number }) {
  return <Image src="/assets/site/eunike-mark.png" alt="" width={size} height={Math.round((size * 197) / 280)} style={{ height: "auto" }} />;
}
