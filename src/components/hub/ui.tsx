"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import type { Platform, PostStatus, Role } from "@/lib/hub/types";
import { PLATFORM_LABEL, STATUS_LABEL } from "@/lib/hub/types";
import { can, type Permission } from "@/lib/hub/permissions";
import { BlogI, CheckI, FacebookI, InfoI, InstagramI, MailI, PinterestI, StoryI, TiktokI, XI, AlertI } from "./icons";

/* ───────── Session côté client ───────── */
export interface ClientUser { id: string; name: string; email: string; role: Role; title?: string; avatarColor: string }
const UserCtx = createContext<ClientUser | null>(null);
export const UserProvider = ({ user, children }: { user: ClientUser; children: React.ReactNode }) => <UserCtx.Provider value={user}>{children}</UserCtx.Provider>;
export const useUser = () => useContext(UserCtx)!;
export const useCan = () => {
  const u = useUser();
  return (p: Permission) => can(u?.role, p);
};

/* ───────── Toasts ───────── */
type Toast = { id: number; kind: "ok" | "err" | "info"; text: string };
const ToastCtx = createContext<(kind: Toast["kind"], text: string) => void>(() => {});
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x, { id, kind, text }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), kind === "err" ? 7000 : 4500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[300] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={clsx("pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg", t.kind === "err" ? "border-[#E8C8C8] bg-[#FBF1F1] text-[#7A2B2B]" : t.kind === "ok" ? "border-sage bg-white text-forest" : "border-line bg-white text-forest")}>
            <span className="mt-0.5 shrink-0">{t.kind === "err" ? <AlertI size={16} /> : t.kind === "ok" ? <CheckI size={16} /> : <InfoI size={16} />}</span>
            <span className="whitespace-pre-line">{t.text}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

/* ───────── Appels API ───────── */
export async function hubApi<T = unknown>(name: string, body?: unknown): Promise<T> {
  const r = await fetch(`/api/hub/${name}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 401) window.location.href = "/hub/connexion";
    throw new Error(j.error || `Erreur ${r.status}`);
  }
  return j as T;
}

/** Exécute une action serveur, affiche un message, puis rafraîchit les données de la page. */
export function useAction() {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState(false);
  const run = useCallback(
    async <T,>(name: string, body?: unknown, okText?: string | ((r: T) => string | undefined)): Promise<T | undefined> => {
      setBusy(true);
      try {
        const r = await hubApi<T>(name, body);
        const msg = typeof okText === "function" ? okText(r) : okText;
        if (msg) toast("ok", msg);
        start(() => router.refresh());
        return r;
      } catch (e) {
        toast("err", (e as Error).message);
        return undefined;
      } finally {
        setBusy(false);
      }
    },
    [router, toast]
  );
  const refresh = useCallback(() => start(() => router.refresh()), [router]);
  return { run, busy: busy || pending, refresh };
}

export async function uploadFiles(files: FileList | File[], folder: string, library = false, libraryFolder?: string) {
  const fd = new FormData();
  for (const f of Array.from(files)) fd.append("files", f);
  fd.append("folder", folder);
  if (library) fd.append("library", "1");
  if (libraryFolder) fd.append("libraryFolder", libraryFolder);
  const r = await fetch("/api/hub/upload", { method: "POST", body: fd });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "Import impossible");
  return j.files as { name: string; url: string; size: number; assetId?: string }[];
}

/* ───────── Éléments ───────── */
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "soft" | "ghost" | "danger"; size?: "sm" | "md"; icon?: React.ReactNode };
export function Button({ variant = "secondary", size = "md", icon, className, children, ...p }: BtnProps) {
  return (
    <button type="button" {...p} className={clsx("hub-btn", `hub-btn-${variant}`, size === "sm" && "hub-btn-sm", className)}>
      {icon}
      {children}
    </button>
  );
}

export function Card({ title, action, children, className, pad = true, subtitle }: { title?: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={clsx("hub-card", className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div>
            {title && <h2 className="font-display text-[1.02rem] font-semibold">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-forest-soft">{subtitle}</p>}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </header>
      )}
      <div className={pad ? "p-5" : ""}>{children}</div>
    </section>
  );
}

export function PageHeader({ title, intro, actions, eyebrow }: { title: string; intro?: React.ReactNode; actions?: React.ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl">
        {eyebrow && <p className="eyebrow text-forest-soft">{eyebrow}</p>}
        <h1 className="mt-1 font-display text-3xl font-semibold md:text-[2.1rem]">{title}</h1>
        {intro && <div className="mt-2 text-sm leading-relaxed text-forest-soft">{intro}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const STATUS_STYLE: Record<string, string> = {
  brouillon: "bg-[#F1F0EC] text-[#5C6862]", a_valider: "bg-[#FFF3D6] text-[#7A5B00]", modifications: "bg-[#FBE7DF] text-[#8A3D1E]", valide: "bg-[#E3EFE6] text-[#2E5E3E]",
  programme: "bg-[#E2ECF8] text-[#1F4E86]", publie: "bg-forest text-white", publie_manuel: "bg-[#DDE6DF] text-forest", echec: "bg-[#F8E1E1] text-[#8A2B2B]",
  active: "bg-forest text-white", planifiee: "bg-[#E2ECF8] text-[#1F4E86]", bibliotheque: "bg-[#F1F0EC] text-[#5C6862]", terminee: "bg-[#EDEDED] text-[#666]", en_pause: "bg-[#FBE7DF] text-[#8A3D1E]",
  prete: "bg-[#E3EFE6] text-[#2E5E3E]", programmee: "bg-[#E2ECF8] text-[#1F4E86]", envoye: "bg-forest text-white", ouvert: "bg-[#FFF3D6] text-[#7A5B00]", en_cours: "bg-[#E2ECF8] text-[#1F4E86]",
  en_attente: "bg-[#F1F0EC] text-[#5C6862]", resolu: "bg-[#E3EFE6] text-[#2E5E3E]", ferme: "bg-[#EDEDED] text-[#666]",
};
const OTHER_LABEL: Record<string, string> = {
  active: "Active", planifiee: "Planifiée", bibliotheque: "Bibliothèque", terminee: "Terminée", en_pause: "En pause", prete: "Prête (budget validé)", programmee: "Programmée",
  envoye: "Envoyée", ouvert: "Ouvert", en_cours: "En cours", en_attente: "En attente de ta réponse", resolu: "Résolu", ferme: "Fermé",
};
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return <span className={clsx("hub-badge", STATUS_STYLE[status] ?? "bg-sage-soft", className)}>{STATUS_LABEL[status as PostStatus] ?? OTHER_LABEL[status] ?? status}</span>;
}

export const PLATFORM_ICON: Record<Platform, (p: { size?: number }) => React.ReactElement> = {
  instagram: InstagramI, story: StoryI, tiktok: TiktokI, facebook: FacebookI, pinterest: PinterestI, newsletter: MailI, blog: BlogI,
};
export function PlatformBadge({ platform, compact }: { platform: Platform; compact?: boolean }) {
  const Icon = PLATFORM_ICON[platform];
  return (
    <span className="hub-badge border border-line bg-white text-forest" title={PLATFORM_LABEL[platform]}>
      <Icon size={13} />
      {!compact && PLATFORM_LABEL[platform]}
    </span>
  );
}

export function Field({ label, children, hint, className }: { label: string; children: React.ReactNode; hint?: React.ReactNode; className?: string }) {
  return (
    <label className={clsx("block", className)}>
      <span className="hub-label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-forest-soft">{hint}</span>}
    </label>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange, className }: { tabs: { id: T; label: React.ReactNode; count?: number }[]; value: T; onChange: (t: T) => void; className?: string }) {
  return (
    <div role="tablist" className={clsx("hub-scroll flex gap-1 overflow-x-auto border-b border-line", className)}>
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}
          className={clsx("relative shrink-0 px-3 py-2.5 text-sm transition", value === t.id ? "font-semibold text-forest after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:bg-forest" : "text-forest-soft hover:text-forest")}>
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 rounded-full bg-sage-soft px-1.5 text-[0.68rem] text-forest">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, size = "md" }: { open: boolean; onClose: () => void; title: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode; size?: "sm" | "md" | "lg" | "xl" }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    ref.current?.focus();
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open || typeof document === "undefined") return null;
  const w = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-4xl", xl: "max-w-6xl" }[size];
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-[rgb(20_30_25/0.45)] p-4 md:p-10" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" className={clsx("w-full rounded-xl bg-white shadow-2xl outline-none", w)}>
        <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="hub-btn hub-btn-ghost hub-btn-sm" aria-label="Fermer"><XI size={16} /></button>
        </header>
        <div className="p-5">{children}</div>
        {footer && <footer className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3.5">{footer}</footer>}
      </div>
    </div>,
    document.body
  );
}

export function Drawer({ open, onClose, title, children, footer, width = "max-w-3xl" }: { open: boolean; onClose: () => void; title: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode; width?: string }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[150] flex justify-end bg-[rgb(20_30_25/0.35)]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside role="dialog" aria-modal="true" className={clsx("flex h-full w-full flex-col bg-cream shadow-2xl", width)}>
        <header className="flex items-center justify-between gap-4 border-b border-line bg-white px-5 py-3.5">
          <div className="min-w-0 font-display text-lg font-semibold">{title}</div>
          <button onClick={onClose} className="hub-btn hub-btn-ghost hub-btn-sm" aria-label="Fermer"><XI size={16} /></button>
        </header>
        <div className="hub-scroll flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-white px-5 py-3">{footer}</footer>}
      </aside>
    </div>,
    document.body
  );
}

/** Demande de confirmation (remplace window.confirm). */
export function useConfirm() {
  const [state, setState] = useState<{ title: string; text: React.ReactNode; confirm: string; danger?: boolean; resolve: (v: boolean) => void } | null>(null);
  const ask = (title: string, text: React.ReactNode, confirm = "Confirmer", danger = false) => new Promise<boolean>((resolve) => setState({ title, text, confirm, danger, resolve }));
  const close = (v: boolean) => { state?.resolve(v); setState(null); };
  const dialog = (
    <Modal open={!!state} onClose={() => close(false)} title={state?.title ?? ""} size="sm"
      footer={<><Button onClick={() => close(false)}>Annuler</Button><Button variant={state?.danger ? "danger" : "primary"} onClick={() => close(true)}>{state?.confirm}</Button></>}>
      <div className="text-sm leading-relaxed text-forest-soft">{state?.text}</div>
    </Modal>
  );
  return { ask, dialog };
}

export function Empty({ title, text, action, icon }: { title: string; text?: React.ReactNode; action?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line px-6 py-10 text-center">
      {icon && <div className="mb-3 text-forest-soft">{icon}</div>}
      <p className="font-medium">{title}</p>
      {text && <p className="mt-1 max-w-md text-sm text-forest-soft">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Avatar({ name, color, size = 32 }: { name: string; color?: string; size?: number }) {
  const initials = name.split(/\s+/).map((x) => x[0]).slice(0, 2).join("").toUpperCase();
  return <span className="grid shrink-0 place-items-center rounded-full font-semibold text-white" style={{ width: size, height: size, background: color ?? "#4A6354", fontSize: size * 0.38 }}>{initials}</span>;
}

export function DemoBanner({ children }: { children: React.ReactNode }) {
  return <div className="mb-4 flex items-start gap-2 rounded-lg border border-[#F0DDA6] bg-[#FFF8E6] px-4 py-3 text-sm text-[#6B5000]"><InfoI size={16} className="mt-0.5 shrink-0" /><div>{children}</div></div>;
}

export function Notice({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "ok" | "warn" }) {
  const c = tone === "ok" ? "border-sage bg-sage-soft text-forest" : tone === "warn" ? "border-[#F0DDA6] bg-[#FFF8E6] text-[#6B5000]" : "border-line bg-white text-forest-soft";
  return <div className={clsx("flex items-start gap-2 rounded-lg border px-4 py-3 text-sm", c)}><InfoI size={16} className="mt-0.5 shrink-0" /><div className="min-w-0">{children}</div></div>;
}

export async function copyText(text: string, toast: (k: "ok" | "err", t: string) => void, label = "Texte copié") {
  try {
    await navigator.clipboard.writeText(text);
    toast("ok", label);
  } catch {
    toast("err", "Copie impossible : sélectionne le texte manuellement.");
  }
}

export const euro = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
export const num = (n: number) => n.toLocaleString("fr-FR");
