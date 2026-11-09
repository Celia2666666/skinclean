"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Avatar, ToastProvider, UserProvider, Modal, type ClientUser } from "@/components/hub/ui";
import { ArrowRightI, ChartI, ChatI, HomeI, LogoutI, MailI, MegaphoneI, MenuI, SearchI, StoreI } from "@/components/hub/icons";
import { BoltI, BoxI, CartI, EuroI, GearI, PipelineI, SegmentI, TaskI, TicketI, UsersI, TrendUpI } from "./icons";
import { OnlineCtx, crmApi } from "./ui";

type Icon = (p: { size?: number }) => React.ReactElement;
export const CRM_NAV: { group: string; items: { href: string; label: string; icon: Icon }[] }[] = [
  { group: "Pilotage", items: [{ href: "/crm", label: "Tableau de bord", icon: HomeI }, { href: "/crm/rentabilite", label: "Rentabilité & prévisions", icon: EuroI }] },
  { group: "Ventes", items: [{ href: "/crm/ventes", label: "Commandes", icon: CartI }, { href: "/crm/produits", label: "Produits & best-sellers", icon: TrendUpI }, { href: "/crm/paniers", label: "Paniers abandonnés", icon: ChartI }] },
  { group: "Clients", items: [{ href: "/crm/clients", label: "Contacts", icon: UsersI }, { href: "/crm/analyses", label: "Segments, cohortes & LTV", icon: SegmentI }, { href: "/crm/sav", label: "Service client", icon: TicketI }, { href: "/crm/messages", label: "Messages & contact", icon: MailI }] },
  { group: "Automatisation", items: [{ href: "/crm/automatisations", label: "Automatisations", icon: BoltI }, { href: "/crm/chatbot", label: "Chatbot (Glow Assistant)", icon: ChatI }, { href: "/crm/boite-demo", label: "Boîte mail de démo", icon: MailI }] },
  { group: "Opérations", items: [{ href: "/crm/stock", label: "Stock & réassort", icon: BoxI }, { href: "/crm/pipeline", label: "Pipeline B2B", icon: PipelineI }, { href: "/crm/taches", label: "Tâches", icon: TaskI }] },
  { group: "", items: [{ href: "/crm/parametres", label: "Paramètres & exports", icon: GearI }] },
];

type Hit = { kind: string; label: string; sub: string; href: string };

export function CrmShell({ user, source, hasReal, badges, children, online = false, hubUrl = "/hub" }: { user: ClientUser; source: "demo" | "reel"; hasReal: boolean; badges: Record<string, number>; children: React.ReactNode; online?: boolean; hubUrl?: string }) {
  const path = usePathname();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  useEffect(() => setMenu(false), [path]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearch((x) => !x); } };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);
  const active = (href: string) => (href === "/crm" ? path === "/crm" : path === href || path.startsWith(`${href}/`));
  const setSource = async (s: "demo" | "reel") => { await crmApi("source", { source: s }); router.refresh(); };
  const logout = async () => { await fetch("/api/hub/auth/logout", { method: "POST" }); window.location.href = "/hub/connexion?next=/crm"; };

  const sidebar = (
    <nav aria-label="Navigation du CRM" className="flex h-full flex-col">
      <Link href="/crm" className="flex items-center gap-2.5 px-5 pb-4 pt-5">
        <Image src="/media/brand/transparent/logo-mark.png" alt="" width={28} height={35} className="h-8 w-auto" />
        <span>
          <Image src="/media/brand/transparent/logo-wordmark.png" alt="skinclean" width={110} height={25} className="h-[18px] w-auto brightness-0 invert" />
          <span className="mt-0.5 block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-sage">CRM · ventes & clients</span>
        </span>
      </Link>
      <div className="hub-scroll flex-1 overflow-y-auto px-3 pb-4">
        {CRM_NAV.map((g) => (
          <div key={g.group || "x"} className="mb-3">
            {g.group && <p className="px-3 pb-1 pt-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-white/35">{g.group}</p>}
            <ul className="space-y-0.5">
              {g.items.map((n) => {
                const I = n.icon;
                const b = badges[n.href];
                return (
                  <li key={n.href}>
                    <Link href={n.href} aria-current={active(n.href) ? "page" : undefined} className={clsx("flex items-center gap-3 rounded-md px-3 py-2 text-[0.83rem] transition", active(n.href) ? "bg-white/12 font-medium text-white" : "text-white/70 hover:bg-white/6 hover:text-white")}>
                      <I size={17} /><span className="flex-1 truncate">{n.label}</span>
                      {!!b && <span className="rounded-full bg-[#F2C14E] px-1.5 text-[0.65rem] font-semibold text-forest">{b}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="space-y-1.5 border-t border-white/10 p-3">
        <a href="/" target="_blank" rel="noopener" className="flex items-center gap-2.5 rounded-md bg-white/8 px-3 py-2 text-[0.8rem] text-white hover:bg-white/14"><StoreI size={16} /><span className="flex-1">Voir le site SKINCLEAN</span><ArrowRightI size={12} /></a>
        <a href={hubUrl} target={online ? "_blank" : undefined} rel="noopener" className="flex items-center gap-2.5 rounded-md bg-white/8 px-3 py-2 text-[0.8rem] text-white hover:bg-white/14" title={online ? "Le Marketing Hub ne fonctionne qu'en local : lance le projet sur ton ordinateur (npm run dev)" : undefined}>
          <MegaphoneI size={16} /><span className="flex-1">Marketing Hub{online && <span className="block text-[0.62rem] text-white/55">en local uniquement</span>}</span><ArrowRightI size={12} />
        </a>
      </div>
    </nav>
  );

  return (
    <UserProvider user={user}>
      <OnlineCtx.Provider value={online}>
      <ToastProvider>
        <div className="min-h-screen bg-[#F6F5F1] text-forest lg:pl-[256px] print:bg-white print:pl-0">
          <aside className="fixed inset-y-0 left-0 z-40 hidden w-[256px] bg-forest lg:block print:hidden">{sidebar}</aside>
          {menu && (
            <div className="fixed inset-0 z-[120] lg:hidden" onClick={() => setMenu(false)}>
              <div className="absolute inset-0 bg-black/40" />
              <aside className="absolute inset-y-0 left-0 w-[280px] bg-forest" onClick={(e) => e.stopPropagation()}>{sidebar}</aside>
            </div>
          )}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur md:px-6 print:hidden">
            <button className="hub-btn hub-btn-ghost lg:hidden" onClick={() => setMenu(true)} aria-label="Ouvrir le menu"><MenuI /></button>
            <button onClick={() => setSearch(true)} className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-line bg-[#FAF9F6] px-3 text-sm text-forest-soft hover:border-forest md:max-w-md">
              <SearchI size={15} /><span className="truncate">Rechercher un client, une commande, un produit…</span><kbd className="ml-auto hidden rounded border border-line bg-white px-1.5 text-[0.65rem] sm:inline">⌘ K</kbd>
            </button>
            <div className="ml-auto flex items-center gap-2">
              <div className="hidden items-center rounded-lg border border-line bg-white p-0.5 sm:flex" role="group" aria-label="Jeu de données">
                {(["demo", "reel"] as const).map((s) => (
                  <button key={s} onClick={() => setSource(s)} aria-pressed={source === s} className={clsx("rounded-md px-2.5 py-1 text-xs font-medium", source === s ? (s === "demo" ? "bg-[#FFF3D6] text-[#6B5000]" : "bg-forest text-white") : "text-forest-soft hover:text-forest")}>
                    {s === "demo" ? "Démonstration" : `Données réelles${hasReal ? "" : " (0)"}`}
                  </button>
                ))}
              </div>
              <span className="flex items-center gap-2 px-1">
                <Avatar name={user.name} color={user.avatarColor} size={30} />
                <span className="hidden text-sm font-medium md:block">{user.name}</span>
              </span>
              {!online && <button onClick={logout} className="hub-btn hub-btn-ghost" title="Déconnexion" aria-label="Déconnexion"><LogoutI /></button>}
            </div>
          </header>
          {source === "reel" && online && <div className="border-b border-line bg-white px-4 py-1.5 text-center text-[0.72rem] text-forest-soft md:px-6 print:hidden">Données réelles de la version en ligne : questions posées au Glow Assistant, alertes « retour en stock » et messages envoyés depuis le site. Base temporaire : elles peuvent être effacées au redémarrage du serveur.</div>}
          {source === "demo" && <div className="border-b border-[#F0DDA6] bg-[#FFF8E6] px-4 py-1.5 text-center text-[0.72rem] text-[#6B5000] md:px-6 print:hidden">{online ? "Démo en ligne : données fictives générées à partir du vrai catalogue. Tu peux tout tester ; les modifications ne sont pas conservées et aucun e-mail n'est envoyé. Bascule sur « Données réelles » pour voir ce que les visiteurs du site ont envoyé." : "Mode démonstration : données fictives générées à partir du vrai catalogue. Bascule sur « Données réelles » pour voir les commandes Stripe."}</div>}
          <main className="mx-auto max-w-[1500px] px-4 py-6 md:px-8 md:py-8">{children}</main>
          <footer className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-6 gap-y-2 border-t border-line px-4 py-5 text-sm text-forest-soft md:px-8 print:hidden">
            <span className="flex items-center gap-2"><Image src="/media/brand/transparent/logo-mark.png" alt="" width={16} height={20} className="h-5 w-auto" />CRM SKINCLEAN</span>
            <a href="/" target="_blank" rel="noopener" className="flex items-center gap-1 font-medium text-forest underline-offset-4 hover:underline"><StoreI size={15} />Voir le site SKINCLEAN</a>
            <a href={hubUrl} target={online ? "_blank" : undefined} rel="noopener" className="flex items-center gap-1 font-medium text-forest underline-offset-4 hover:underline"><MegaphoneI size={15} />Marketing Hub{online && <span className="font-normal text-forest-soft">(en local : lance <code className="rounded bg-white px-1">npm run dev</code> sur ton ordinateur)</span>}</a>
          </footer>
          <GlobalSearch open={search} onClose={() => setSearch(false)} />
        </div>
      </ToastProvider>
      </OnlineCtx.Provider>
    </UserProvider>
  );
}

function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [i, setI] = useState(0);
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) setTimeout(() => input.current?.focus(), 30); else { setQ(""); setHits([]); } }, [open]);
  useEffect(() => {
    if (q.trim().length < 2) { setHits([]); return; }
    const c = new AbortController();
    const t = setTimeout(() => fetch(`/api/crm/search?q=${encodeURIComponent(q)}`, { signal: c.signal }).then((r) => r.json()).then((h) => { setHits(Array.isArray(h) ? h : []); setI(0); }).catch(() => {}), 160);
    return () => { clearTimeout(t); c.abort(); };
  }, [q]);
  const go = (h?: Hit) => { if (!h) return; onClose(); router.push(h.href); };
  return (
    <Modal open={open} onClose={onClose} title="Recherche globale" size="md">
      <input ref={input} autoFocus className="hub-input" placeholder="Nom, e-mail, n° de commande (SC-…), produit, entreprise…" value={q} onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => { if (e.key === "ArrowDown") { e.preventDefault(); setI((x) => Math.min(hits.length - 1, x + 1)); } if (e.key === "ArrowUp") { e.preventDefault(); setI((x) => Math.max(0, x - 1)); } if (e.key === "Enter") go(hits[i]); }} />
      <ul className="mt-3 max-h-[50vh] overflow-y-auto">
        {q.trim().length >= 2 && !hits.length && <li className="px-2 py-6 text-center text-sm text-forest-soft">Aucun résultat.</li>}
        {hits.map((h, k) => (
          <li key={h.href + k}>
            <button onMouseEnter={() => setI(k)} onClick={() => go(h)} className={clsx("flex w-full items-center gap-3 rounded-md px-3 py-2 text-left", k === i && "bg-sage-soft")}>
              <span className="w-20 shrink-0 text-[0.65rem] font-semibold uppercase tracking-wide text-forest-soft">{h.kind}</span>
              <span className="min-w-0"><span className="block truncate text-sm font-medium">{h.label}</span><span className="block truncate text-xs text-forest-soft">{h.sub}</span></span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
