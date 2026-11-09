"use client";
import Link from "next/link";
import { useSyncExternalStore } from "react";

const LOCAL = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);
const noop = () => () => {};
/** Vrai uniquement dans le navigateur, sur un serveur local (le Marketing Hub n'est pas publié en ligne). */
const useIsLocal = () => useSyncExternalStore(noop, () => LOCAL.has(window.location.hostname), () => false);

/**
 * Accès « Espace équipe » : CRM (en ligne et en local) et Marketing Hub (localhost uniquement).
 * `tone="dark"` pour le pied de page vert foncé, `"light"` pour le menu.
 */
export function TeamLinks({ tone = "light" }: { tone?: "light" | "dark" }) {
  const local = useIsLocal();
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
        {local && (
          <Link href="/hub" className={item}>
            <span>Marketing Hub</span>
            <span className={dark ? "text-[0.65rem] text-ivory/50" : "text-xs text-forest-soft"}>local uniquement</span>
          </Link>
        )}
      </div>
    </div>
  );
}
