import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-5 text-center">
      <h1 className="mt-4 font-display text-5xl">Page introuvable</h1>
      <p className="mt-3 text-forest-soft">Cette page s&apos;est évaporée comme une brume. Revenons à l&apos;essentiel.</p>
      <div className="mt-6 flex gap-3"><Link href="/" className="btn btn-primary">Accueil</Link><Link href="/skin-diag" className="btn btn-ghost">Skin Diag</Link></div>
    </div>
  );
}
