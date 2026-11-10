import Link from "next/link";
import { promise } from "@/data/offer";
import { ArrowIcon, CheckIcon } from "@/components/ui/Icons";

/** La promesse en une phrase, juste sous la vidéo d'accueil : pour qui, quel problème, quel résultat, à quel prix. */
export function PromiseBand() {
  return (
    <section aria-labelledby="promesse" className="border-b border-line bg-ivory px-4 py-12 md:px-8 md:py-16">
      <div className="mx-auto grid max-w-[1400px] gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-end">
        <div>
          <p className="eyebrow text-sage-deep">Notre promesse</p>
          <h2 id="promesse" className="mt-3 max-w-4xl font-display text-[clamp(1.5rem,2.6vw,2.4rem)] leading-[1.15]">{promise.sentence}</h2>
        </div>
        <div>
          <ul className="space-y-2 text-sm">
            {promise.proofs.map((p) => (
              <li key={p} className="flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-forest text-ivory"><CheckIcon size={12} /></span>{p}</li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/offre" className="btn btn-primary">Voir l&apos;offre et les prix <ArrowIcon size={16} /></Link>
            <Link href="/skin-diag" className="btn btn-ghost">Faire mon Skin Diag</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
