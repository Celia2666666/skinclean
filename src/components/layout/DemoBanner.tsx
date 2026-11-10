"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** Les quatre espaces demandés (+ l'admin), reliés depuis toutes les pages. */
export const SPACES = [
  { href: "/", label: "Vente", hint: "côté client" },
  { href: "/crm", label: "CRM", hint: "côté entreprise" },
  { href: "/strategie", label: "Stratégie", hint: "pourquoi ce produit" },
  { href: "/communication", label: "Communication", hint: "comment le vendre" },
  { href: "/hub", label: "Admin", hint: "gérer la marque et la boutique" },
] as const;

const activeSpace = (path: string) =>
  path.startsWith("/crm") ? "/crm" : path.startsWith("/strategie") ? "/strategie" : path.startsWith("/communication") ? "/communication" : path.startsWith("/hub") || path.startsWith("/admin") ? "/hub" : "/";

/**
 * Bandeau obligatoire « Projet étudiant INSEEC, démo sans vente réelle » + navigation entre les 4 espaces.
 * Fixé en haut de chaque page ; sa hauteur est réservée par la variable CSS --demo-h (voir globals.css).
 * Affiché aussi sur le Marketing Hub (espace « Admin »), dont la mise en page est décalée de --demo-h.
 */
export function DemoBanner() {
  const path = usePathname() ?? "/";
  const current = activeSpace(path);
  return (
    <>
      <div aria-hidden className="h-[var(--demo-h)] print:hidden" />
      <div role="region" aria-label="Projet de démonstration" className="fixed inset-x-0 top-0 z-50 flex h-[var(--demo-h)] flex-col justify-center gap-0.5 bg-[#16241D] px-3 text-ivory md:flex-row md:items-center md:justify-between md:gap-4 md:px-6 print:hidden">
        <p className="truncate text-center text-[0.68rem] font-medium tracking-[0.02em] md:text-left md:text-xs">
          <span className="mr-1.5 inline-block rounded-sm bg-sage px-1.5 py-px text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-forest">Démo</span>
          Projet étudiant INSEEC, démo sans vente réelle
        </p>
        <nav aria-label="Espaces du projet" className="no-scrollbar flex gap-0.5 overflow-x-auto md:justify-end md:gap-1 max-md:[&>*:first-child]:ml-auto max-md:[&>*:last-child]:mr-auto">
          {SPACES.map((s) => {
            const on = current === s.href;
            return (
              <Link
                key={s.href}
                href={s.href}
                aria-current={on ? "page" : undefined}
                title={s.hint}
                className={`shrink-0 rounded-sm px-1.5 py-0.5 text-[0.62rem] font-medium uppercase tracking-[0.04em] transition md:px-2.5 md:text-[0.7rem] md:tracking-[0.06em] ${on ? "bg-ivory text-forest" : "text-ivory/80 hover:bg-ivory/15 hover:text-ivory"}`}
              >
                {s.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
