"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { Avatar, Drawer, ToastProvider, UserProvider, hubApi, type ClientUser } from "./ui";
import { CopilotChat } from "./Copilot";
import { ROLE_LABEL, type Notification } from "@/lib/hub/types";
import {
  AdsI, BellI, CalendarI, ChartI, ChatI, HomeI, LogoutI, MailI, MegaphoneI, MenuI, PaletteI, RoadmapI, SearchI, ShareI, SparkI, StoreI, TargetI, UserI, XI, ArrowRightI,
} from "./icons";

export const NAV = [
  { href: "/hub", label: "Mon Marketing Hub", icon: HomeI },
  { href: "/hub/strategie", label: "Ma stratégie marketing", icon: TargetI },
  { href: "/hub/calendrier", label: "Calendrier éditorial", icon: CalendarI },
  { href: "/hub/reseaux-sociaux", label: "Réseaux sociaux", icon: ShareI },
  { href: "/hub/studio", label: "Studio créatif", icon: PaletteI },
  { href: "/hub/campagnes", label: "Campagnes marketing", icon: MegaphoneI },
  { href: "/hub/seo", label: "SEO", icon: SearchI },
  { href: "/hub/ads", label: "SEA & Social Ads", icon: AdsI },
  { href: "/hub/emailing", label: "E-mailing & newsletters", icon: MailI },
  { href: "/hub/site", label: "Gestion du site et des visuels", icon: StoreI },
  { href: "/hub/plan-annuel", label: "Plan marketing annuel", icon: RoadmapI },
  { href: "/hub/performances", label: "Performances marketing", icon: ChartI },
  { href: "/hub/messages", label: "Messages & demandes", icon: ChatI },
  { href: "/hub/assistant", label: "Assistant marketing IA", icon: SparkI },
  { href: "/hub/compte", label: "Mon compte", icon: UserI },
];

export function HubShell({ user, children, unread, badges }: { user: ClientUser; children: React.ReactNode; unread: number; badges: Record<string, number> }) {
  const path = usePathname();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [copilot, setCopilot] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[] | null>(null);

  useEffect(() => setMenu(false), [path]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCopilot((x) => !x); } };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  const openNotifs = useCallback(async () => {
    setNotifOpen((x) => !x);
    try { setNotifs(await (await fetch("/api/hub/notifications")).json()); } catch { setNotifs([]); }
  }, []);
  const readAll = async () => {
    await hubApi("notifications/read", { all: true });
    setNotifs((n) => n?.map((x) => ({ ...x, read: true })) ?? null);
    router.refresh();
  };
  const logout = async () => {
    await hubApi("auth/logout");
    window.location.href = "/hub/connexion";
  };

  const active = (href: string) => (href === "/hub" ? path === "/hub" : path.startsWith(href));
  const sidebar = (
    <nav aria-label="Navigation du Marketing Hub" className="flex h-full flex-col">
      <Link href="/hub" className="flex items-center gap-2.5 px-5 pb-4 pt-5">
        <Image src="/media/brand/transparent/logo-mark.png" alt="" width={28} height={35} className="h-8 w-auto" />
        <span>
          <Image src="/media/brand/transparent/logo-wordmark.png" alt="skinclean" width={110} height={25} className="h-[18px] w-auto brightness-0 invert" />
          <span className="mt-0.5 block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-sage">Marketing Hub</span>
        </span>
      </Link>
      <ul className="hub-scroll flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {NAV.map((n, i) => {
          const Icon = n.icon;
          const b = badges[n.href];
          return (
            <li key={n.href}>
              <Link href={n.href} aria-current={active(n.href) ? "page" : undefined}
                className={clsx("group flex items-center gap-3 rounded-md px-3 py-2 text-[0.83rem] transition", active(n.href) ? "bg-white/12 font-medium text-white" : "text-white/70 hover:bg-white/6 hover:text-white")}>
                <span className="w-4 text-right text-[0.65rem] tabular-nums text-white/35">{i + 1}</span>
                <Icon size={17} />
                <span className="flex-1 truncate">{n.label}</span>
                {!!b && <span className="rounded-full bg-[#F2C14E] px-1.5 text-[0.65rem] font-semibold text-forest">{b}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-white/10 p-4 text-[0.7rem] leading-relaxed text-white/50">
        Outil de stratégie, création et pilotage marketing. La gestion commerciale (clients, commandes) relève du CRM.
        <Link href="/" target="_blank" className="mt-2 flex items-center gap-1 text-white/80 hover:text-white">Voir le site SKINCLEAN <ArrowRightI size={12} /></Link>
      </div>
    </nav>
  );

  return (
    <UserProvider user={user}>
      <ToastProvider>
        <div className="min-h-screen bg-[#F6F5F1] text-forest lg:pl-[268px]">
          <aside className="fixed inset-y-0 left-0 z-40 hidden w-[268px] bg-forest lg:block">{sidebar}</aside>
          {menu && (
            <div className="fixed inset-0 z-[120] lg:hidden" onClick={() => setMenu(false)}>
              <div className="absolute inset-0 bg-black/40" />
              <aside className="absolute inset-y-0 left-0 w-[280px] bg-forest" onClick={(e) => e.stopPropagation()}>{sidebar}</aside>
            </div>
          )}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur md:px-6">
            <button className="hub-btn hub-btn-ghost lg:hidden" onClick={() => setMenu(true)} aria-label="Ouvrir le menu"><MenuI /></button>
            <p className="hidden truncate text-sm text-forest-soft md:block">{NAV.find((n) => active(n.href))?.label ?? "Marketing Hub"}</p>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => setCopilot(true)} className="hub-btn hub-btn-soft" title="Marketing Copilot (Ctrl/⌘ K)">
                <SparkI size={16} /><span className="hidden sm:inline">Copilot</span>
              </button>
              <div className="relative">
                <button onClick={openNotifs} className="hub-btn hub-btn-ghost relative" aria-label={`Notifications (${unread} non lues)`}>
                  <BellI />
                  {unread > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#C2477A] px-1 text-[0.6rem] font-bold text-white">{unread}</span>}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-11 z-50 w-[min(380px,90vw)] rounded-xl border border-line bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-line px-4 py-3">
                      <p className="text-sm font-semibold">Notifications</p>
                      <div className="flex gap-1">
                        <button onClick={readAll} className="text-xs underline">Tout marquer comme lu</button>
                        <button onClick={() => setNotifOpen(false)} className="ml-2" aria-label="Fermer"><XI size={14} /></button>
                      </div>
                    </div>
                    <ul className="hub-scroll max-h-96 overflow-y-auto">
                      {notifs === null && <li className="p-4 text-sm text-forest-soft">Chargement…</li>}
                      {notifs?.length === 0 && <li className="p-4 text-sm text-forest-soft">Aucune notification.</li>}
                      {notifs?.map((n) => (
                        <li key={n.id} className={clsx("border-b border-line last:border-0", !n.read && "bg-sage-soft/60")}>
                          <Link href={n.href ?? "/hub"} onClick={() => { setNotifOpen(false); hubApi("notifications/read", { id: n.id }).then(() => router.refresh()); }} className="block px-4 py-3 hover:bg-sage-soft">
                            <p className="text-sm font-medium">{n.title}</p>
                            <p className="line-clamp-2 text-xs text-forest-soft">{n.body}</p>
                            <p className="mt-1 text-[0.65rem] text-forest-soft">{new Date(n.at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <Link href="/hub/compte" className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-sage-soft">
                <Avatar name={user.name} color={user.avatarColor} size={30} />
                <span className="hidden text-left leading-tight md:block">
                  <span className="block text-sm font-medium">{user.name}</span>
                  <span className="block text-[0.68rem] text-forest-soft">{ROLE_LABEL[user.role]}</span>
                </span>
              </Link>
              <button onClick={logout} className="hub-btn hub-btn-ghost" title="Déconnexion" aria-label="Déconnexion"><LogoutI /></button>
            </div>
          </header>
          <main className="mx-auto max-w-[1500px] px-4 py-6 md:px-8 md:py-8">{children}</main>
          <Drawer open={copilot} onClose={() => setCopilot(false)} width="max-w-xl" title={<span className="flex items-center gap-2"><SparkI size={18} /> SKINCLEAN Marketing Copilot</span>}>
            <div className="-m-5 h-[calc(100vh-57px)]"><CopilotChat compact /></div>
          </Drawer>
        </div>
      </ToastProvider>
    </UserProvider>
  );
}
