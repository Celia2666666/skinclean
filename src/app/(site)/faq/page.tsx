import type { Metadata } from "next";
import { PageHero } from "@/components/catalog/PageHero";
import { Accordion } from "@/components/ui/Accordion";
import { ContactForm } from "@/components/layout/ContactForm";
import { loyalty, shipping, welcomeOffer, firstOrderGift } from "@/data/config";

export const metadata: Metadata = { title: "FAQ & contact", description: "Toutes les réponses sur les soins, le Skin Diag, la livraison, le SKINCLEAN Club. Contacte notre équipe." };

const sections = [
  { t: "Soins & routines", q: [
    ["Dans quel ordre appliquer mes soins ?", "Du plus fluide au plus épais : démaquillant (soir), nettoyant, exfoliant (selon fréquence), toner, sérum(s), soin ciblé, contour des yeux, crème, puis SPF le matin."],
    ["Puis-je utiliser deux sérums ?", "Oui. Applique le plus fluide en premier. Évite de cumuler le même soir un rétinoïde et un exfoliant acide : alterne les soirs."],
    ["Les produits conviennent-ils aux peaux sensibles ?", "Chaque fiche indique les types de peau compatibles et les précautions. Le Skin Diag écarte automatiquement les actifs puissants pour les peaux réactives."],
    ["Le Skin Diag remplace-t-il un dermatologue ?", "Non. C'est un outil de conseil cosmétique. En cas de symptômes sévères ou persistants, consulte un·e professionnel·le de santé."],
  ]},
  { t: "Commande & livraison", q: [
    ["Quels sont les délais et frais de livraison ?", `${shipping.label} : ${shipping.standardPrice.toFixed(2).replace(".", ",")} €, offerte dès ${shipping.freeFrom} €.`],
    ["Quels moyens de paiement acceptez-vous ?", "Carte bancaire, Apple Pay et Google Pay, via notre prestataire sécurisé Stripe. Nous ne stockons jamais tes données bancaires."],
    ["Comment retourner un produit ?", "Tu disposes de 14 jours après réception pour exercer ton droit de rétractation sur les produits non ouverts. Demande ton retour depuis « Mes commandes »."],
    ["Quel est le cadeau de première commande ?", firstOrderGift.enabled ? `${firstOrderGift.name} : ${firstOrderGift.description}. Il s'ajoute automatiquement à ta première commande.` : "Aucun cadeau actif actuellement."],
  ]},
  { t: "SKINCLEAN Club & offres", q: [
    ["Comment gagner des feuilles ?", `${loyalty.leavesPerEuro} feuille par euro dépensé, ${loyalty.newsletterBonus} feuilles à la confirmation de la newsletter, ${loyalty.reviewBonus} feuilles par avis (1 fois par mois) et un bonus anniversaire.`],
    ["Comment utiliser mes feuilles ?", `Au panier : ${loyalty.rewards.map((r) => `${r.leaves} feuilles = ${r.value} €`).join(", ")}. Non cumulable avec un code promo ou un kit remisé.`],
    ["Comment profiter de -20 % ?", `Inscris-toi à la newsletter et confirme ton adresse : tu reçois un code de -${welcomeOffer.newsletterPercent} % valable ${welcomeOffer.validityDays} jours sur ta première commande éligible, une seule fois par personne.`],
  ]},
];

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Aide" title="FAQ & contact" intro="Une question ? La réponse est sûrement ici. Sinon, notre équipe (et le Glow Assistant) sont là." bg="#EFEEEA" crumbs={[{ href: "/faq", label: "FAQ" }]} />
      <div className="mx-auto max-w-[1000px] space-y-14 px-4 py-16 md:px-8">
        {sections.map((s) => (
          <section key={s.t}>
            <h2 className="mb-4 font-display text-4xl">{s.t}</h2>
            <Accordion items={s.q.map(([q, a]) => ({ title: q, content: <p>{a}</p> }))} />
          </section>
        ))}
        <section id="contact" className="scroll-mt-28 rounded-none bg-ivory p-6 md:p-10">
          <h2 className="font-display text-4xl">Nous contacter</h2>
          <p className="mb-6 mt-2 text-forest-soft">Réponse sous 48 h ouvrées. Pour un conseil immédiat, ouvre le Glow Assistant en bas à droite.</p>
          <ContactForm />
        </section>
      </div>
    </>
  );
}
