"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, useTransition } from "react";
import clsx from "clsx";
import { useToast } from "@/components/hub/ui";
import { ChevronLeftI, ChevronRightI, InfoI, SearchI } from "@/components/hub/icons";
import { Sparkline, pctf } from "./charts";

/** Vrai sur la démo en ligne (Vercel) : pas de données réelles ni de bascule. */
export const OnlineCtx = createContext(false);

/* ───────── Appels API ───────── */
export async function crmApi<T = unknown>(name: string, body?: unknown): Promise<T> {
  const r = await fetch(`/api/crm/${name}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 401) window.location.href = String(j.error ?? "").includes("Code d'accès") ? "/crm/acces" : "/hub/connexion?next=/crm";
    throw new Error(j.error || `Erreur ${r.status}`);
  }
  return j as T;
}

/** Exécute une action, affiche un message puis rafraîchit les données serveur de la page. */
export function useCrmAction() {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState(false);
  const run = useCallback(async <T,>(name: string, body?: unknown, ok?: string | ((r: T) => string | undefined)): Promise<T | undefined> => {
    setBusy(true);
    try {
      const r = await crmApi<T>(name, body);
      const msg = typeof ok === "function" ? ok(r) : ok;
      if (msg) toast("ok", msg);
      start(() => router.refresh());
      return r;
    } catch (e) {
      toast("err", (e as Error).message);
      return undefined;
    } finally {
      setBusy(false);
    }
  }, [router, toast]);
  return { run, busy: busy || pending };
}

/** Met à jour un paramètre d'URL (filtres, onglets, sélection) sans perdre les autres. */
export function useParam() {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  return useCallback((patch: Record<string, string | null | undefined>, replace = true) => {
    const q = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === undefined || v === "") q.delete(k);
      else q.set(k, v);
    }
    if (!("page" in patch) && Object.keys(patch).some((k) => k !== "id")) q.delete("page");
    const url = `${path}${q.size ? `?${q}` : ""}`;
    if (replace) router.replace(url, { scroll: false });
    else router.push(url, { scroll: false });
  }, [path, router, sp]);
}

/* ───────── Éléments ───────── */
export function Kpi({ label, value, delta, invert, hint, spark, href, tone, points }: { label: string; value: React.ReactNode; delta?: number | null; invert?: boolean; hint?: React.ReactNode; spark?: number[]; href?: string; tone?: "warn" | "bad"; points?: boolean }) {
  const good = delta === null || delta === undefined ? null : invert ? delta < 0 : delta > 0;
  const body = (
    <div className={clsx("hub-card flex h-full flex-col p-4 transition", href && "hover:border-forest", tone === "bad" && "border-[#E8C8C8]", tone === "warn" && "border-[#F0DDA6]")}>
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.05em] text-forest-soft">{label}</p>
      <p className="mt-1.5 font-display text-[1.65rem] font-semibold leading-none tabular-nums">{value}</p>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {delta !== undefined && (
          <span className={clsx("shrink-0 whitespace-nowrap rounded-full px-1.5 py-0.5 font-semibold tabular-nums", good === null ? "bg-[#F1F0EC] text-forest-soft" : good ? "bg-[#E3EFE6] text-[#2E5E3E]" : "bg-[#F8E1E1] text-[#8A2B2B]")} title={points ? "Écart en points par rapport à la période de comparaison" : "Évolution par rapport à la période de comparaison"}>
            {delta === null ? "—" : `${delta > 0 ? "▲" : delta < 0 ? "▼" : "="} ${points ? `${Math.abs(delta).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} pt` : pctf(Math.abs(delta), Math.abs(delta) < 10 ? 1 : 0)}`}
          </span>
        )}
        {hint && <span className="truncate text-forest-soft">{hint}</span>}
      </div>
      {spark && <div className="mt-auto pt-2"><Sparkline values={spark} /></div>}
    </div>
  );
  return href ? <Link href={href} className="block">{body}</Link> : body;
}

const TONES: Record<string, string> = {
  ok: "bg-[#E3EFE6] text-[#2E5E3E]", info: "bg-[#E2ECF8] text-[#1F4E86]", warn: "bg-[#FFF3D6] text-[#7A5B00]", bad: "bg-[#F8E1E1] text-[#8A2B2B]", neutral: "bg-[#F1F0EC] text-[#5C6862]", dark: "bg-forest text-white", violet: "bg-[#E8E2F6] text-[#4A3A86]",
};
export function Pill({ tone = "neutral", children, className }: { tone?: keyof typeof TONES | string; children: React.ReactNode; className?: string }) {
  return <span className={clsx("hub-badge", TONES[tone] ?? TONES.neutral, className)}>{children}</span>;
}
export const ORDER_TONE: Record<string, string> = { payee: "info", en_preparation: "warn", expediee: "violet", livree: "ok", annulee: "neutral", remboursee: "bad" };
export const STOCK_TONE: Record<string, string> = { rupture: "bad", critique: "bad", bas: "warn", ok: "ok", dormant: "neutral" };
export const STOCK_LABEL: Record<string, string> = { rupture: "Rupture", critique: "Critique", bas: "À réassortir", ok: "OK", dormant: "Stock dormant" };

export function PeriodTabs({ periods, value }: { periods: { id: string; label: string }[]; value: string }) {
  const set = useParam();
  return (
    <div className="inline-flex flex-wrap rounded-lg border border-line bg-white p-0.5" role="group" aria-label="Période">
      {periods.map((p) => (
        <button key={p.id} onClick={() => set({ p: p.id })} aria-pressed={value === p.id} className={clsx("rounded-md px-3 py-1.5 text-xs font-medium transition", value === p.id ? "bg-forest text-white" : "text-forest-soft hover:text-forest")}>{p.label}</button>
      ))}
    </div>
  );
}

export function SearchBox({ placeholder, param = "q", className }: { placeholder: string; param?: string; className?: string }) {
  const sp = useSearchParams();
  const set = useParam();
  const [v, setV] = useState(sp.get(param) ?? "");
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(t.current), []);
  return (
    <label className={clsx("relative block", className)}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-forest-soft"><SearchI size={15} /></span>
      <input className="hub-input pl-9" placeholder={placeholder} value={v} aria-label={placeholder}
        onChange={(e) => { setV(e.target.value); clearTimeout(t.current); const val = e.target.value; t.current = setTimeout(() => set({ [param]: val }), 280); }} />
    </label>
  );
}

export function Select({ value, onChange, options, label, className }: { value: string; onChange: (v: string) => void; options: { id: string; label: string }[]; label: string; className?: string }) {
  return (
    <select aria-label={label} className={clsx("hub-input w-auto pr-8", className)} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
    </select>
  );
}

export function Pager({ page, pages, total, label }: { page: number; pages: number; total: number; label: string }) {
  const set = useParam();
  if (pages <= 1) return <p className="px-5 py-3 text-xs text-forest-soft">{total.toLocaleString("fr-FR")} {label}</p>;
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 text-xs text-forest-soft">
      <span>{total.toLocaleString("fr-FR")} {label} · page {page} / {pages}</span>
      <div className="flex gap-1">
        <button className="hub-btn hub-btn-secondary hub-btn-sm" disabled={page <= 1} onClick={() => set({ page: String(page - 1) })} aria-label="Page précédente"><ChevronLeftI size={14} /></button>
        <button className="hub-btn hub-btn-secondary hub-btn-sm" disabled={page >= pages} onClick={() => set({ page: String(page + 1) })} aria-label="Page suivante"><ChevronRightI size={14} /></button>
      </div>
    </div>
  );
}

/** En-tête de colonne triable (tri porté par l'URL). */
export function SortTh({ id, children, sort, className }: { id: string; children: React.ReactNode; sort: string; className?: string }) {
  const set = useParam();
  const [key, dir] = sort.split(":");
  const active = key === id;
  return (
    <th className={clsx("px-3 py-2.5 font-semibold", className)} aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : undefined}>
      <button className="inline-flex items-center gap-1 hover:text-forest" onClick={() => set({ sort: `${id}:${active && dir === "desc" ? "asc" : "desc"}` })}>
        {children}<span className="text-[0.6rem]">{active ? (dir === "asc" ? "▲" : "▼") : "↕"}</span>
      </button>
    </th>
  );
}

export const thead = "border-b border-line bg-[#FAF9F6] text-left text-[0.7rem] uppercase tracking-[0.04em] text-forest-soft";
export const trow = "border-b border-line last:border-0 hover:bg-[#FAF9F6]";

export function SourceNote({ source, what = "Ces indicateurs" }: { source: "demo" | "reel"; what?: string }) {
  const online = useContext(OnlineCtx);
  if (source === "reel") return null;
  return (
    <div className="mb-5 flex items-start gap-2 rounded-lg border border-[#F0DDA6] bg-[#FFF8E6] px-4 py-2.5 text-xs leading-relaxed text-[#6B5000]">
      <InfoI size={15} className="mt-0.5 shrink-0" />
      <p>{what} portent sur le <b>jeu de démonstration</b> : clients et commandes fictifs (adresses @example.com) générés à partir du vrai catalogue SKINCLEAN, prix et formats compris. {online ? "Version de démonstration en ligne : en local, les commandes réelles payées via Stripe s'affichent dans un jeu « Données réelles » séparé." : "Les commandes réelles payées via Stripe s'affichent dans le jeu « Données réelles », jamais mélangées."}</p>
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-forest-soft">{children}</p>;
}
