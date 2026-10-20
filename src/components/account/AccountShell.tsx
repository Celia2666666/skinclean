"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { leavesBalance, useAccount, useHydrated, useStore } from "@/lib/store";
import { AuthForms } from "./AuthForms";

const links = [
  { href: "/compte", label: "Tableau de bord", e: "" },
  { href: "/compte/commandes", label: "Commandes", e: "" },
  { href: "/compte/routines", label: "Routines & diagnostics", e: "" },
  { href: "/compte/journal", label: "Mon Skin Journal", e: "" },
  { href: "/compte/favoris", label: "Favoris", e: "" },
  { href: "/club", label: "SKINCLEAN Club", e: "" },
  { href: "/compte/profil", label: "Profil, adresses & préférences", e: "" },
];

export function AccountShell({ children }: { children: React.ReactNode }) {
  const acc = useAccount();
  const h = useHydrated();
  const logout = useStore((s) => s.logout);
  const pathname = usePathname();
  if (!h) return <div className="min-h-[60vh]" />;
  if (!acc) return <AuthForms mode="login" />;
  return (
    <div className="mx-auto grid max-w-[1300px] gap-8 px-4 py-10 md:px-8 lg:grid-cols-[260px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-none bg-sage p-5">
          <p className="text-sm">Bonjour</p>
          <p className="font-display text-3xl">{acc.firstName}</p>
          <p className="mt-2 text-sm">{leavesBalance(acc)} feuilles disponibles</p>
        </div>
        <nav className="no-scrollbar mt-4 flex gap-2 overflow-x-auto lg:flex-col" aria-label="Espace client">
          {links.map((l) => {
            const on = pathname === l.href;
            return (
              <Link key={l.href} href={l.href} className="relative shrink-0 rounded-[2px] px-4 py-3 text-sm font-medium">
                {on && <motion.span layoutId="acc-nav" className="absolute inset-0 rounded-[2px] bg-ivory shadow-[var(--shadow-soft)]" />}
                <span className="relative">{l.label}</span>
              </Link>
            );
          })}
          <button onClick={logout} className="shrink-0 rounded-[2px] px-4 py-3 text-left text-sm text-forest-soft hover:bg-ivory">↩ Se déconnecter</button>
        </nav>
        <p className="mt-4 hidden text-xs text-forest-soft lg:block">Mode démo : ton compte est stocké sur cet appareil. En production, il est sécurisé côté serveur.</p>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
