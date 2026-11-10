"use client";
import Link from "next/link";

/**
 * Accès « Espace équipe » : CRM et Admin (back-office complet).
 * `tone="dark"` pour le pied de page vert foncé, `"light"` pour le menu.
 */
export function TeamLinks({ tone = "light" }: { tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  const item = dark
    ? "inline-flex items-center gap-2 border border-ivory/25 px-3 py-1.5 text-xs text-ivory/80 transition hover:border-ivory hover:text-ivory"
    : "flex items-center justify-between rounded-[2px] bg-ivory p-3 text-sm transition hover:bg-sage-soft";
  return (
    <div className={dark ? "flex flex-wrap items-center gap-2" : ""} aria-label="Espace équipe">
      <p className={dark ? "mr-1 text-xs text-ivory/60" : "eyebrow mb-2 text-forest/50"}>Espace équipe</p>
      <div className={dark ? "contents" : "grid gap-2"}>
        <Link href="/crm" className={item}>
          <span>CRM SKINCLEAN</span>
          {!dark && <span className="text-xs text-forest-soft">Clients, commandes, SAV</span>}
        </Link>
        <Link href="/hub" className={item}>
          <span>Admin</span>
          {!dark && <span className="text-xs text-forest-soft">Contenus, campagnes, boutique</span>}
        </Link>
      </div>
    </div>
  );
}
