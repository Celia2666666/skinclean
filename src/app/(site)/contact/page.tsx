import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/catalog/PageHero";
import { ContactInfo } from "@/components/layout/ContactInfo";
import { ContactForm } from "@/components/layout/ContactForm";
import { customerService as cs } from "@/data/config";
import { siteUrlPublic } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact & service client",
  description: `Une question sur une commande, un retour ou un soin ? Le service client SKINCLEAN répond par téléphone au ${cs.phone}, par e-mail ou via le formulaire.`,
};

const shortcuts = [
  { href: "/compte/commandes", t: "Suivre ma commande", d: "Statut et numéro de suivi dans ton compte." },
  { href: "/livraison", t: "Retour ou remboursement", d: "14 jours pour changer d'avis, étape par étape." },
  { href: "/faq", t: "Questions fréquentes", d: "Livraison, paiement, fidélité, utilisation des soins." },
  { href: "/skin-diag", t: "Un conseil de routine", d: "Le Skin Diag compose ta routine en 2 minutes." },
];

export default function ContactPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SKINCLEAN",
    url: siteUrlPublic(),
    contactPoint: [{
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: cs.phoneHref,
      email: cs.email,
      areaServed: ["FR", "BE", "CH", "LU", "MC"],
      availableLanguage: ["French"],
      hoursAvailable: [
        { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "18:00" },
        { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "10:00", closes: "13:00" },
      ],
    }],
  };

  return (
    <>
      <PageHero eyebrow="Aide" title="Contact & service client" intro="Une question sur une commande, un retour ou le choix d'un soin ? Notre équipe te répond, par téléphone, par e-mail ou via le formulaire." bg="#EFEEEA" crumbs={[{ href: "/contact", label: "Contact" }]} />
      <div className="mx-auto max-w-[1300px] space-y-16 px-4 py-14 md:px-8">
        <section aria-labelledby="coordonnees">
          <h2 id="coordonnees" className="sr-only">Nos coordonnées</h2>
          <ContactInfo />
        </section>

        <section aria-labelledby="raccourcis">
          <h2 id="raccourcis" className="font-display text-3xl md:text-4xl">Avant de nous écrire</h2>
          <p className="mt-2 text-forest-soft">La réponse à ta question est peut-être déjà là :</p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {shortcuts.map((s) => (
              <li key={s.href}>
                <Link href={s.href} className="group block h-full border border-line bg-cream p-5 transition hover:border-forest hover:bg-ivory">
                  <p className="font-medium">{s.t} <span aria-hidden className="inline-block transition group-hover:translate-x-1">→</span></p>
                  <p className="mt-1 text-sm text-forest-soft">{s.d}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section id="formulaire" aria-labelledby="ecrire" className="scroll-mt-28 grid grid-cols-[minmax(0,1fr)] gap-10 bg-ivory p-6 md:p-10 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <h2 id="ecrire" className="font-display text-3xl md:text-4xl">Écris-nous</h2>
            <p className="mt-3 text-forest-soft">Réponse sous {cs.emailDelay}. Pour une commande, indique ton numéro (il commence par « SC- ») : on la retrouve plus vite.</p>
            <p className="mt-4 text-sm text-forest-soft">Pour un conseil immédiat sur un soin, ouvre le Glow Assistant en bas à droite de l&apos;écran.</p>
          </div>
          <ContactForm />
        </section>

        <p className="text-xs text-forest-soft">SKINCLEAN est une marque fictive créée pour un projet académique : le numéro de téléphone appartient à une plage réservée aux œuvres de fiction et l&apos;adresse e-mail n&apos;est pas active. Utilise le formulaire pour tester le parcours.</p>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
