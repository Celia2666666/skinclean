import type { Metadata } from "next";
import { PageHero } from "@/components/catalog/PageHero";
import { shipping } from "@/data/config";

export const metadata: Metadata = { title: "Livraison & retours" };

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Aide" title="Livraison & retours" bg="#EFEEEA" crumbs={[{ href: "/livraison", label: "Livraison & retours" }]} />
      <div className="mx-auto grid max-w-[1000px] gap-5 px-4 py-16 md:grid-cols-2 md:px-8">
        {[
          { t: " Livraison", d: `${shipping.label}. Frais : ${shipping.standardPrice.toFixed(2).replace(".", ",")} €, offerts dès ${shipping.freeFrom} €. Pays desservis : France, Belgique, Suisse, Luxembourg, Monaco (paramétrable).` },
          { t: " Suivi", d: "Un e-mail avec ton numéro de suivi est envoyé à l'expédition. Retrouve le statut à tout moment dans « Mes commandes »." },
          { t: "↩ Retours", d: "14 jours après réception pour exercer ton droit de rétractation (produits non ouverts, pour des raisons d'hygiène). Demande ton retour depuis ton compte." },
          { t: " Remboursements", d: "Remboursement sur le moyen de paiement initial sous 14 jours après réception du retour. Les feuilles gagnées sur la commande sont alors retirées." },
        ].map((x) => <div key={x.t} className="rounded-none bg-ivory p-7"><h2 className="font-display text-2xl">{x.t}</h2><p className="mt-2 text-forest-soft">{x.d}</p></div>)}
        <p className="text-xs text-forest-soft md:col-span-2">Conditions de démonstration à faire valider juridiquement avant mise en ligne.</p>
      </div>
    </>
  );
}
