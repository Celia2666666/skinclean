import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/catalog/PageHero";
import { getBestsellers, getKits, getProducts, kitPricing } from "@/lib/catalog";
import { euro } from "@/lib/format";
import { included, notIncluded, promise, ht } from "@/data/offer";
import { setDiscount, shipping } from "@/data/config";
import { CheckIcon, CloseIcon } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Offre & prix",
  description: "Ce que propose SKINCLEAN : soins à l'unité de 7 € à 36 € TTC, routine du Skin Diag, set sur mesure à -15 %, kits de saison. Ce qui est inclus, ce qui ne l'est pas, prix TTC et HT.",
};

export default function OfferPage() {
  const soins = getProducts().filter((p) => p.type !== "accessoire");
  const prices = soins.flatMap((p) => p.variants.filter((v) => !v.mini).map((v) => v.price));
  const minP = Math.min(...prices), maxP = Math.max(...prices);
  const kits = getKits().map((k) => ({ k, pr: kitPricing(k) }));
  const kitMin = Math.min(...kits.map((x) => x.pr.price)), kitMax = Math.max(...kits.map((x) => x.pr.price));
  const best = getBestsellers();

  const formulas = [
    { t: "Soin à l'unité", price: `${euro(minP)} à ${euro(maxP)}`, d: `${soins.length} soins visage, chacun avec sa liste INCI, son mode d'emploi et ses précautions. Mini-formats pour tester.`, cta: { href: "/soins-visage", l: "Voir les soins" } },
    { t: "Routine du Skin Diag", price: "Prix catalogue", d: "10 questions, 2 minutes : une routine matin et soir de 3 à 6 soins compatibles entre eux, modifiable, envoyée par e-mail.", cta: { href: "/skin-diag", l: "Faire mon Skin Diag" } },
    { t: "Set sur mesure", price: `-${setDiscount.tiers[0].percent} %`, d: `De ${setDiscount.tiers[0].minItems} à ${setDiscount.maxItems} soins au choix : -${setDiscount.tiers[0].percent} % sur le total du set.`, cta: { href: "/creer-mon-set", l: "Créer mon set" } },
    { t: "Kits & routines", price: `${euro(kitMin)} à ${euro(kitMax)}`, d: `${kits.length} coffrets (saisons, imperfections, glass skin, voyage) déjà composés, moins chers que les soins achetés séparément.`, cta: { href: "/kits", l: "Voir les kits" } },
  ];

  return (
    <>
      <PageHero eyebrow="Espace vente" title="Offre & prix" intro={promise.sentence} bg="#EFEEEA" crumbs={[{ href: "/offre", label: "Offre & prix" }]} />
      <div className="mx-auto max-w-[1300px] space-y-20 px-4 py-14 md:px-8">
        <section aria-labelledby="formules">
          <h2 id="formules" className="font-display text-4xl md:text-5xl">Quatre façons d&apos;acheter</h2>
          <p className="mt-2 text-forest-soft">Tous les prix sont en euros <b className="font-medium text-forest">TTC</b> (TVA 20 % incluse). Le SKINCLEAN Club, programme de fidélité, est gratuit.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {formulas.map((f) => (
              <div key={f.t} className="flex flex-col border border-line bg-ivory p-6">
                <p className="eyebrow text-forest-soft">{f.t}</p>
                <p className="mt-3 font-display text-3xl">{f.price}</p>
                <p className="mt-3 flex-1 text-sm text-forest-soft">{f.d}</p>
                <Link href={f.cta.href} className="btn btn-ghost mt-5">{f.cta.l}</Link>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="inclus" className="grid gap-6 md:grid-cols-2">
          <div className="bg-sage-soft p-6 md:p-8">
            <h2 id="inclus" className="font-display text-3xl">Ce qui est inclus</h2>
            <ul className="mt-5 space-y-3 text-sm">
              {included.map((x) => <li key={x} className="flex gap-3"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-forest text-ivory"><CheckIcon size={12} /></span>{x}</li>)}
            </ul>
          </div>
          <div className="border border-line bg-ivory p-6 md:p-8">
            <h2 className="font-display text-3xl">Ce qui n&apos;est pas inclus</h2>
            <ul className="mt-5 space-y-3 text-sm">
              {notIncluded.map((x) => <li key={x} className="flex gap-3"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-forest/30 text-forest-soft"><CloseIcon size={11} /></span>{x}</li>)}
            </ul>
          </div>
        </section>

        <section aria-labelledby="grille">
          <h2 id="grille" className="font-display text-3xl md:text-4xl">Grille de prix des best-sellers</h2>
          <div className="no-scrollbar -mx-4 mt-6 overflow-x-auto px-4 md:mx-0 md:px-0">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <thead><tr className="border-b border-forest/20 text-xs uppercase tracking-[0.06em] text-forest-soft"><th className="py-3 pr-4 font-medium">Soin</th><th className="py-3 pr-4 font-medium">Format</th><th className="py-3 pr-4 text-right font-medium">Prix HT</th><th className="py-3 text-right font-medium">Prix TTC</th></tr></thead>
              <tbody>
                {best.map((p) => (
                  <tr key={p.id} className="border-b border-line">
                    <td className="py-3 pr-4"><Link href={`/produits/${p.slug}`} className="font-medium hover:underline">{p.name}</Link><span className="block text-xs text-forest-soft">{p.kind}</span></td>
                    <td className="py-3 pr-4">{p.variants[0].size}</td>
                    <td className="py-3 pr-4 text-right tabular-nums text-forest-soft">{euro(ht(p.variants[0].price))}</td>
                    <td className="py-3 text-right font-semibold tabular-nums">{euro(p.variants[0].price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-forest-soft">Livraison : {euro(shipping.standardPrice)} TTC, offerte dès {euro(shipping.freeFrom)} d&apos;achat. Le prix applicable est celui affiché au moment de la commande.</p>
        </section>

        <section aria-labelledby="parcours" className="bg-forest p-6 text-ivory md:p-10">
          <h2 id="parcours" className="font-display text-3xl md:text-4xl">Le parcours d&apos;achat, en démo</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-4">
            {[
              ["Choisir", "Un soin, un kit, un set ou la routine du Skin Diag."],
              ["Panier", "Remises calculées automatiquement, livraison offerte dès 100 €."],
              ["Paiement simulé", "Carte, Apple Pay ou Google Pay : aucune somme n'est débitée."],
              ["Confirmation", "Numéro de commande, feuilles gagnées et suivi dans le compte."],
            ].map(([t, d], i) => (
              <li key={t} className="border border-ivory/20 p-4">
                <span className="font-display text-2xl text-sage">{i + 1}</span>
                <p className="mt-2 font-medium">{t}</p>
                <p className="mt-1 text-sm text-ivory/75">{d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/best-sellers" className="btn btn-light">Commencer par un best-seller</Link>
            <Link href="/faq" className="btn border-ivory/50 text-ivory hover:bg-ivory hover:text-forest">FAQ</Link>
            <Link href="/contact" className="btn border-ivory/50 text-ivory hover:bg-ivory hover:text-forest">Contact</Link>
          </div>
        </section>
      </div>
    </>
  );
}
