import Link from "next/link";
import { customerService as cs } from "@/data/config";
import { ClockIcon, MailIcon, PhoneIcon, PinIcon } from "@/components/ui/Icons";

/** Fiche contact du service client : téléphone, e-mail, horaires, adresse des retours. */
export function ContactInfo({ compact = false }: { compact?: boolean }) {
  const cards = [
    {
      icon: <PhoneIcon size={22} />,
      title: "Par téléphone",
      main: <a href={`tel:${cs.phoneHref}`} className="font-display text-2xl underline-offset-4 hover:underline">{cs.phone}</a>,
      sub: cs.phoneNote,
    },
    {
      icon: <MailIcon size={22} />,
      title: "Par e-mail",
      main: <a href={`mailto:${cs.email}`} className="[overflow-wrap:anywhere] font-medium underline-offset-4 hover:underline">{cs.email}</a>,
      sub: `Réponse sous ${cs.emailDelay}`,
    },
    {
      icon: <ClockIcon size={22} />,
      title: "Horaires",
      main: <ul className="space-y-0.5">{cs.hours.map((h) => <li key={h.days}><span className="font-medium">{h.days}</span> · {h.time}</li>)}</ul>,
      sub: "Hors jours fériés",
    },
    {
      icon: <PinIcon size={22} />,
      title: "Adresse des retours",
      main: <address className="not-italic leading-snug">{cs.returnsAddress.map((l) => <span key={l} className="block">{l}</span>)}</address>,
      sub: <Link href="/livraison" className="underline underline-offset-4">Comment retourner un produit</Link>,
    },
  ];
  return (
    <div className={`grid gap-px bg-line ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-4"}`}>
      {cards.map((c) => (
        <div key={c.title} className="flex flex-col gap-3 bg-ivory p-6">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-sage-soft text-forest">{c.icon}</span>
          <p className="eyebrow text-forest-soft">{c.title}</p>
          <div className="text-[0.95rem]">{c.main}</div>
          <p className="mt-auto text-xs text-forest-soft">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}
