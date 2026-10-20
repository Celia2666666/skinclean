import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/catalog/PageHero";
import { loyalty, welcomeOffer, firstOrderGift } from "@/data/config";

const pages: Record<string, { title: string; body: string[] }> = {
  cgv: { title: "Conditions générales de vente", body: [
    "Les présentes CGV régissent les ventes conclues sur le site SKINCLEAN. Modèle de démonstration à faire rédiger et valider par un professionnel du droit avant toute commercialisation.",
    "Prix : indiqués en euros TTC. Le prix applicable est celui affiché au moment de la validation de la commande.",
    "Paiement : carte bancaire, Apple Pay, Google Pay via Stripe. La commande est confirmée uniquement après acceptation du paiement.",
    "Droit de rétractation : 14 jours à compter de la réception, pour les produits non descellés (art. L221-28 du Code de la consommation).",
    "Garanties légales de conformité et contre les vices cachés applicables.",
    "Médiation de la consommation : coordonnées du médiateur à compléter.",
  ]},
  "mentions-legales": { title: "Mentions légales", body: [
    "Éditeur : SKINCLEAN (marque fictive — projet académique). Raison sociale, adresse, SIREN, directeur de la publication : à compléter.",
    "Hébergeur : à compléter (ex. Vercel Inc.).",
    "Propriété intellectuelle : le logo et l'identité SKINCLEAN sont protégés. Toute reproduction est interdite sans autorisation.",
    "Crédits : vidéos de démonstration des produits et photos avant/après issues de Pexels (pexels.com), utilisées selon la licence Pexels à titre d'illustration. Photos du comparateur « imperfections » : source à préciser, usage pédagogique. Photographies produits et vidéo d'accueil : SKINCLEAN.",
  ]},
  confidentialite: { title: "Politique de confidentialité", body: [
    "Responsable de traitement : SKINCLEAN (coordonnées à compléter).",
    "Données traitées : identité, coordonnées, commandes, réponses au Skin Diag, données du Skin Journal (photos, observations cutanées — données sensibles traitées uniquement sur consentement explicite).",
    "Finalités : gestion des commandes, compte client, programme de fidélité, envoi de la routine demandée, newsletter (sur consentement, double opt-in), suivi Skin Journal.",
    "Durées de conservation : compte — 3 ans après la dernière activité ; Skin Journal — 12 mois maximum, suppression à tout moment ; prospects newsletter — 3 ans.",
    "Tes droits : accès, rectification, effacement, portabilité, opposition, retrait du consentement. Export et suppression disponibles depuis ton compte. Réclamation possible auprès de la CNIL.",
    "Paiement : les données bancaires sont traitées exclusivement par Stripe et ne transitent pas par nos serveurs.",
  ]},
  cookies: { title: "Politique cookies", body: [
    "Cookies nécessaires : panier, session, préférences de consentement. Ils ne requièrent pas de consentement.",
    "Mesure d'audience et marketing : déposés uniquement après ton accord via le bandeau. Refuser est aussi simple qu'accepter.",
    "Tu peux modifier ton choix à tout moment en effaçant les données du site dans ton navigateur ; le bandeau réapparaîtra.",
  ]},
  "conditions-offres": { title: "Conditions des offres", body: [
    `Offre newsletter : -${welcomeOffer.newsletterPercent} % sur la première commande éligible, après confirmation de l'adresse e-mail (double opt-in). Code unique, valable ${welcomeOffer.validityDays} jours, utilisable une seule fois, une seule fois par adresse e-mail.`,
    `Exclusions : ${welcomeOffer.excludeKits ? "kits et coffrets déjà remisés ; " : ""}non cumulable avec d'autres codes${welcomeOffer.combinableWithLeaves ? "" : " ni avec l'utilisation de feuilles"}.`,
    `Bonus fidélité newsletter : ${loyalty.newsletterBonus} feuilles, crédités une seule fois après confirmation et rattachement à un compte SKINCLEAN Club.`,
    firstOrderGift.enabled ? `Cadeau de première commande : ${firstOrderGift.name} (${firstOrderGift.description}), ajouté automatiquement, une fois par client.` : "",
    `Feuilles : ${loyalty.leavesPerEuro} feuille par euro dépensé hors livraison, créditées à l'${loyalty.creditedOn}, retirées en cas de retour. Expiration après ${loyalty.expiryMonthsInactivity} mois sans utilisation. Paliers calculés sur ${loyalty.tierWindowMonths} mois glissants.`,
    "SKINCLEAN se réserve le droit de modifier ces offres ; les conditions applicables sont celles en vigueur au jour de la commande.",
  ].filter(Boolean) },
};

export function generateStaticParams() { return Object.keys(pages).map((slug) => ({ slug })); }
export async function generateMetadata({ params }: PageProps<"/legal/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return pages[slug] ? { title: pages[slug].title } : {};
}

export default async function Page({ params }: PageProps<"/legal/[slug]">) {
  const { slug } = await params;
  const p = pages[slug];
  if (!p) notFound();
  return (
    <>
      <PageHero eyebrow="Informations légales" title={p.title} bg="#F4F3EF" crumbs={[{ href: `/legal/${slug}`, label: p.title }]} />
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-14 text-[1.02rem] leading-relaxed md:px-8">
        {p.body.map((b) => <p key={b}>{b}</p>)}
        <p className="rounded-[2px] bg-butter p-4 text-sm">Document de démonstration — à faire valider juridiquement avant mise en ligne.</p>
      </div>
    </>
  );
}
