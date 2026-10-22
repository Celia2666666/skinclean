import Link from "next/link";
import Image from "next/image";
import { NewsletterForm } from "./NewsletterForm";
import { PaymentLogos } from "@/components/checkout/PaymentMethods";
import { InstagramIcon, PinterestIcon, TiktokIcon, YoutubeIcon } from "@/components/ui/Icons";
import { typeCategories } from "@/data/categories";
import { loyalty, welcomeOffer } from "@/data/config";

const cols = [
  { title: "Soins", links: [{ href: "/soins-visage", label: "Tous les soins" }, ...typeCategories.slice(0, 6).map((c) => ({ href: `/soins-visage/${c.slug}`, label: c.short })), { href: "/best-sellers", label: "Best-sellers" }, { href: "/kits", label: "Kits & routines" }] },
  { title: "Accompagnement", links: [{ href: "/skin-diag", label: "Skin Diag" }, { href: "/creer-mon-set", label: "Créer mon set" }, { href: "/club", label: "SKINCLEAN Club" }, { href: "/compte/journal", label: "Skin Journal" }, { href: "/compte", label: "Mon compte" }] },
  { title: "Aide", links: [{ href: "/faq", label: "FAQ" }, { href: "/faq#contact", label: "Contact" }, { href: "/livraison", label: "Livraison & retours" }, { href: "/notre-histoire", label: "Notre histoire" }, { href: "/nos-engagements", label: "Nos engagements" }] },
  { title: "Légal", links: [{ href: "/legal/cgv", label: "CGV" }, { href: "/legal/mentions-legales", label: "Mentions légales" }, { href: "/legal/confidentialite", label: "Confidentialité" }, { href: "/legal/cookies", label: "Cookies" }, { href: welcomeOffer.conditionsHref, label: "Conditions des offres" }] },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-forest text-ivory">
      <svg className="absolute -top-px left-0 w-full text-cream" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden>
        <path d="M0 0h1440v20c-240 40-480 40-720 10S240 0 0 30Z" fill="currentColor" />
      </svg>
      <div className="mx-auto max-w-[1400px] px-5 pb-10 pt-24 md:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-[2px] bg-cream p-2"><Image src="/media/brand/logo-mark.png" alt="" width={40} height={50} className="h-12 w-auto mix-blend-multiply" /></div>
              <div className="rounded-[2px] bg-cream px-3 py-2"><Image src="/media/brand/logo-wordmark.png" alt="skinclean" width={140} height={46} className="h-6 w-auto mix-blend-multiply" /></div>
            </div>
            <p className="eyebrow mt-4 text-sage">Your skin. Your glow.</p>
            <p className="mt-6 font-display text-3xl">Join the Glow Club</p>
            <p className="mt-2 max-w-md text-sm text-ivory/75">-{welcomeOffer.newsletterPercent} % sur ta première commande éligible et {loyalty.newsletterBonus} feuilles après confirmation de ton inscription.</p>
            <div className="mt-5 max-w-md"><NewsletterForm variant="dark" /></div>
            <div className="mt-8 flex gap-3">
              {[{ I: InstagramIcon, l: "Instagram" }, { I: TiktokIcon, l: "TikTok" }, { I: PinterestIcon, l: "Pinterest" }, { I: YoutubeIcon, l: "YouTube" }].map(({ I, l }) => (
                <a key={l} href="#" aria-label={`${l} (lien à configurer)`} className="grid h-11 w-11 place-items-center rounded-full bg-ivory/10 transition hover:-translate-y-1 hover:bg-sage hover:text-forest"><I size={20} /></a>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {cols.map((c) => (
              <div key={c.title}>
                <p className="eyebrow mb-4 text-sage">{c.title}</p>
                <ul className="space-y-2 text-sm text-ivory/80">
                  {c.links.map((l) => <li key={l.href + l.label}><Link href={l.href} className="transition hover:text-ivory hover:underline">{l.label}</Link></li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-14 flex flex-col items-start justify-between gap-6 border-t border-ivory/15 pt-6 md:flex-row md:items-center">
          <div className="flex flex-wrap items-center gap-2" aria-label="Moyens de paiement acceptés">
            <PaymentLogos />
            <span className="ml-1 text-xs text-ivory/60">Paiement sécurisé via Stripe</span>
          </div>
          <p className="text-xs text-ivory/60">© {new Date().getFullYear()} SKINCLEAN — Marque fictive, projet académique. Conseils cosmétiques, pas de diagnostic médical.</p>
        </div>
      </div>
    </footer>
  );
}
