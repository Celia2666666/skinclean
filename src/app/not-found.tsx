import Link from "next/link";
import Image from "next/image";

/** 404 globale (URL inconnue hors des sections du site). */
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-xl flex-col items-center justify-center px-5 text-center">
      <Image src="/media/brand/logo-wordmark.png" alt="skinclean" width={150} height={49} className="h-7 w-auto mix-blend-multiply" />
      <h1 className="mt-8 font-display text-5xl">Page introuvable</h1>
      <p className="mt-3 text-forest-soft">Cette page s&apos;est évaporée comme une brume. Revenons à l&apos;essentiel.</p>
      <div className="mt-6 flex gap-3"><Link href="/" className="btn btn-primary">Accueil</Link><Link href="/hub" className="btn btn-ghost">Marketing Hub</Link></div>
    </div>
  );
}
