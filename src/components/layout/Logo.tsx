import Image from "next/image";
import Link from "next/link";

/** Logo officiel SKINCLEAN (symbole S végétal + typographie) — fichiers dans /public/media/brand. */
export function Logo({ className = "", withMark = true }: { className?: string; withMark?: boolean }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`} aria-label="SKINCLEAN — accueil">
      {withMark && <Image src="/media/brand/logo-mark.png" alt="" width={34} height={42} className="h-9 w-auto mix-blend-multiply" priority />}
      <Image src="/media/brand/logo-wordmark.png" alt="skinclean" width={150} height={49} className="h-6 w-auto mix-blend-multiply md:h-7" priority />
    </Link>
  );
}
