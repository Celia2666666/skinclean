"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { Fragment, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import type { EmailCampaign, Platform, Post, Visual } from "@/lib/hub/types";
import { PostPreview } from "@/components/hub/PostPreview";
import { VisualThumb } from "@/components/hub/design/DesignPreview";
import { VisualTextEditor } from "@/components/hub/design/VisualTextEditor";
import { designToDataUrl } from "@/components/hub/design/render";
import { Markdown } from "@/components/hub/Markdown";
import { renderEmailHtml } from "@/lib/hub/email-html";
import { hubData as hub } from "@/data/hub-public";
import { calendar as planCalendar, posts as planPosts, type Post as PlanPost } from "@/data/communication";

const EASE = [0.22, 1, 0.36, 1] as const;
const noop = () => () => {};

/* ───────── Petits magasins locaux : statuts de validation et modifications (dans ce navigateur) ───────── */

function localStore<T>(key: string) {
  const listeners = new Set<() => void>();
  let cache: Record<string, T> | null = null;
  const EMPTY: Record<string, T> = {};
  const read = () => { if (cache) return cache; try { cache = JSON.parse(localStorage.getItem(key) ?? "{}"); } catch { cache = {}; } return cache!; };
  const set = (id: string, v: T) => {
    cache = { ...read(), [id]: v };
    try { localStorage.setItem(key, JSON.stringify(cache)); } catch { /* stockage indisponible : l'état reste en mémoire */ }
    listeners.forEach((l) => l());
  };
  const use = () => useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, read, () => EMPTY);
  return { set, use };
}

type Status = "valide" | "a_valider" | "a_modifier" | "publie_test" | "brouillon";
const statusStore = localStore<Status>("skinclean-validations-v1");
const editStore = localStore<Record<string, unknown>>("skinclean-edits-v1");
const setStatus = statusStore.set;
const useStatuses = statusStore.use;
const useEdits = editStore.use;
const useStatus = (id: string, initial: string): Status => (useStatuses()[id] ?? initial) as Status;
function saveEdit(id: string, patch: Record<string, unknown>) {
  editStore.set(id, patch);
  setStatus(id, "a_valider");
}
/** Applique les modifications enregistrées dans ce navigateur. */
const withEdits = <T extends object>(x: T & { id: string }, edits: Record<string, Record<string, unknown>>): T => ({ ...x, ...(edits[x.id] ?? {}) });

/** Contenus qui attendent une validation (avec les choix faits dans ce navigateur). */
export function usePendingContent() {
  const st = useStatuses();
  const wait = (id: string, initial: string) => !["valide", "publie_test"].includes(st[id] ?? initial);
  return {
    posts: hub.posts.filter((p) => wait(p.id, p.status)).length,
    articles: hub.articles.filter((a) => wait(a.id, a.status)).length,
    emails: hub.emails.filter((e) => wait(e.id, e.status)).length,
    validated: Object.values(st).filter((s) => s === "valide").length,
  };
}

export { useStatuses, setStatus };
export type { Status };

const STATUS: Record<Status, { label: string; dot: string; cls: string }> = {
  valide: { label: "Validé", dot: "bg-[#2E8B57]", cls: "bg-[#E3EFE6] text-[#2E5E3E]" },
  publie_test: { label: "Publié sur le compte de test", dot: "bg-[#1F4E86]", cls: "bg-[#E2ECF8] text-[#1F4E86]" },
  a_valider: { label: "En cours de validation", dot: "bg-[#D4A017]", cls: "bg-[#FFF3D6] text-[#7A5B00]" },
  a_modifier: { label: "À retravailler", dot: "bg-[#C0504D]", cls: "bg-[#F8E3E2] text-[#8A2F2C]" },
  brouillon: { label: "Brouillon", dot: "bg-forest-soft", cls: "bg-cream text-forest-soft" },
};

export function StatusPill({ status }: { status: Status }) {
  const s = STATUS[status] ?? STATUS.brouillon;
  return <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-medium", s.cls)}><span className={clsx("h-1.5 w-1.5 rounded-full", s.dot)} />{s.label}</span>;
}

/** Circuit de validation : Valider, Modifier (édition directe) ou Remettre en validation. */
export function ValidationBar({ id, initial, onEdit }: { id: string; initial: string; onEdit?: () => void }) {
  const status = useStatus(id, initial);
  const edited = !!useEdits()[id];
  const [done, setDone] = useState<string | null>(null);
  const act = (s: Status, msg: string) => { setStatus(id, s); setDone(msg); };
  useEffect(() => { if (!done) return; const t = setTimeout(() => setDone(null), 2200); return () => clearTimeout(t); }, [done]);
  const locked = status === "publie_test";
  return (
    <div className="border-t border-line pt-4">
      <div className="flex flex-wrap items-center gap-2"><span className="text-xs text-forest-soft">Statut :</span><StatusPill status={status} />{edited && <span className="text-[0.7rem] text-forest-soft">· modifié</span>}</div>
      {!locked && (
        <div className="mt-3 flex flex-wrap gap-2">
          {status !== "valide" && <button type="button" onClick={() => act("valide", "Contenu validé")} className="btn btn-primary !px-4 !py-2 text-xs">Valider</button>}
          {onEdit && <button type="button" onClick={onEdit} className="btn btn-ghost !px-4 !py-2 text-xs">Modifier</button>}
          {status === "valide" && <button type="button" onClick={() => act("a_valider", "Remis en validation")} className="btn btn-ghost !px-4 !py-2 text-xs">Remettre en validation</button>}
        </div>
      )}
      <AnimatePresence>{done && <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 text-xs font-medium text-[#2E5E3E]">✓ {done}</motion.p>}</AnimatePresence>
      <p className="mt-2 text-[0.7rem] text-forest-soft">Démo : validations et modifications sont enregistrées dans ce navigateur.</p>
    </div>
  );
}

/** Formulaire d'édition générique (textes courts et longs). */
function EditForm({ fields, values, onSave, onCancel, children }: { fields: { key: string; label: string; long?: boolean; rows?: number }[]; values: Record<string, string>; onSave: (v: Record<string, string>) => void; onCancel: () => void; children?: React.ReactNode }) {
  const [v, setV] = useState(values);
  return (
    <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={(e) => { e.preventDefault(); onSave(v); }} className="space-y-3 border border-forest/20 bg-ivory p-4">
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-sage-deep">Modifier</p>
      {fields.map((f) => (
        <label key={f.key} className="block text-sm">
          <span className="label">{f.label}</span>
          {f.long ? <textarea className="input" rows={f.rows ?? 6} value={v[f.key] ?? ""} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} /> : <input className="input" value={v[f.key] ?? ""} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />}
        </label>
      ))}
      {children}
      <div className="flex gap-2"><button type="submit" className="btn btn-primary !px-4 !py-2 text-xs">Enregistrer</button><button type="button" onClick={onCancel} className="btn btn-ghost !px-4 !py-2 text-xs">Annuler</button></div>
    </motion.form>
  );
}

/* ───────── Fenêtre d'aperçu ───────── */

function Sheet({ open, onClose, children, label, wide }: { open: boolean; onClose: () => void; children: React.ReactNode; label: string; wide?: boolean }) {
  const reduce = useReducedMotion();
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [open, onClose]);
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#16241D]/60 backdrop-blur-sm md:items-center md:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}
            initial={reduce ? false : { y: 60, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ duration: 0.4, ease: EASE }}
            className={clsx("relative max-h-[92vh] w-full overflow-y-auto bg-cream shadow-2xl md:max-h-[88vh]", wide ? "md:max-w-5xl" : "md:max-w-4xl")}>
            <button type="button" onClick={onClose} aria-label="Fermer" className="sticky right-3 top-3 z-10 float-right m-3 grid h-9 w-9 place-items-center rounded-full bg-ivory text-lg shadow">×</button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

const NET: Record<string, string> = { tiktok: "TikTok", instagram: "Instagram", pinterest: "Pinterest", facebook: "Facebook", story: "Stories Instagram", newsletter: "Newsletter", blog: "Blog" };
const FORMAT: Record<string, string> = { video: "Vidéo", reel: "Reel", post: "Post", carrousel: "Carrousel", epingle: "Épingle", story: "Story" };
const campName = (id?: string) => hub.campaigns.find((c) => c.id === id)?.name;
const frDateTime = (d?: string | null) => (d ? new Date(d.length === 10 ? `${d}T12:00` : d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : null);
const isOwnVideo = (p: Post) => p.visual?.kind === "video" && !!p.visual.src?.includes("tiktok-routine");

/** Fiche d'une publication : détails, légende complète, édition directe et validation. */
function PostDetails({ post, initial, compact }: { post: Post; initial?: string; compact?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [visual, setVisual] = useState<Visual | undefined>(post.visual);
  const rows: [string, React.ReactNode][] = [
    ["Réseau", NET[post.platform] ?? post.platform],
    ["Format", (post as Post & { formatLabel?: string }).formatLabel ?? FORMAT[post.format] ?? post.format],
    ["Objectif", post.objective],
    ["Pilier", post.pillar],
    ["Campagne", campName(post.campaignId)],
    ["Date prévue", frDateTime(post.date)],
    ["Appel à l'action", post.cta],
    ["Vidéo", isOwnVideo(post) ? "Vidéo SKINCLEAN créée avec un outil d'IA" : post.visual?.kind === "video" ? "Vidéo de démonstration libre de droits (Pexels)" : undefined],
  ];
  const canEditVisual = !!visual && (visual.kind === "design" || (visual.kind === "video" && !!visual.poster));
  return (
    <div className={compact ? "" : "p-6 md:p-8"}>
      {!compact && <p className="eyebrow text-sage-deep">{NET[post.platform]} · {FORMAT[post.format] ?? post.format}</p>}
      <p className={clsx("font-display leading-tight", compact ? "text-2xl" : "mt-2 text-3xl")}>{post.title}</p>
      <dl className="mt-4 grid grid-cols-[7.5rem_1fr] gap-x-3 gap-y-1.5 text-sm">
        {rows.filter(([, v]) => v).map(([k, v]) => <Fragment key={k}><dt className="text-forest-soft">{k}</dt><dd>{v}</dd></Fragment>)}
      </dl>
      {editing ? (
        <div className="mt-5">
          <EditForm
            fields={[{ key: "title", label: "Titre" }, { key: "caption", label: "Légende", long: true, rows: 8 }, { key: "hashtags", label: "Hashtags (séparés par des espaces)" }, { key: "cta", label: "Appel à l'action" }]}
            values={{ title: post.title, caption: post.caption, hashtags: post.hashtags.join(" "), cta: post.cta ?? "" }}
            onSave={(v) => { saveEdit(post.id, { title: v.title, caption: v.caption, hashtags: v.hashtags.split(/\s+/).filter(Boolean), cta: v.cta, ...(visual !== post.visual ? { visual } : {}) }); setEditing(false); }}
            onCancel={() => { setEditing(false); setVisual(post.visual); }}
          >
            {canEditVisual && <div className="text-sm"><span className="label">Textes du visuel</span><VisualTextEditor visual={visual!} onChange={setVisual} /></div>}
          </EditForm>
        </div>
      ) : (
        <>
          <p className="mt-5 text-xs font-medium uppercase tracking-[0.08em] text-forest-soft">Légende complète</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{post.caption}</p>
          {post.hashtags.length > 0 && <p className="mt-3 text-sm text-[#216FDB]">{post.hashtags.join(" ")}</p>}
        </>
      )}
      <div className="mt-6"><ValidationBar id={post.id} initial={initial ?? post.status} onEdit={editing ? undefined : () => setEditing(true)} /></div>
    </div>
  );
}

function PostSheet({ post, onClose }: { post: Post | null; onClose: () => void }) {
  return (
    <Sheet open={!!post} onClose={onClose} label={post?.title ?? "Aperçu"} wide>
      {post && (
        <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="flex items-start justify-center bg-[radial-gradient(closest-side,#D8DFD4,#EFEEEA)] px-4 py-8 md:sticky md:top-0 md:max-h-[88vh] md:items-center md:py-10">
            <motion.div key={post.id} initial={{ rotate: -3, y: 24, opacity: 0 }} animate={{ rotate: 0, y: 0, opacity: 1 }} transition={{ duration: 0.5, ease: EASE }} className="w-full max-w-[380px]"><PostPreview post={post} /></motion.div>
          </div>
          <PostDetails key={post.id} post={post} />
        </div>
      )}
    </Sheet>
  );
}

/* ───────── Les 9 posts du plan : un clic ouvre l'aperçu réseau (vidéo pour TikTok) ───────── */

const PLAN_PLATFORM: Record<string, Platform> = { Instagram: "instagram", TikTok: "tiktok", Pinterest: "pinterest" };
const toHubPost = (p: PlanPost): Post => ({
  id: `plan-${p.id}`, title: p.title, date: p.dateISO, platform: PLAN_PLATFORM[p.network], format: p.network === "Pinterest" ? "epingle" : p.video ? "video" : p.format.startsWith("Carrousel") ? "carrousel" : "post",
  objective: p.goal, pillar: "", formatLabel: p.format, visual: p.video ? { kind: "video", src: p.video } : { kind: "image", src: p.image },
  caption: p.text, hashtags: p.hashtags.split(" "), cta: "", status: "valide", comments: [], productIds: [],
} as unknown as Post);

const goalColor: Record<string, string> = { Notoriété: "bg-sage", Considération: "bg-sage-soft", Conversion: "bg-forest text-ivory", Fidélisation: "bg-ivory border border-line" };

function PlanCard({ p, onOpen, i }: { p: PlanPost; onOpen: () => void; i: number }) {
  const reduce = useReducedMotion();
  const statuses = useStatuses();
  const edits = useEdits();
  const vid = useRef<HTMLVideoElement>(null);
  const shown = withEdits(toHubPost(p), edits);
  return (
    <motion.article initial={reduce ? false : { opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.6, delay: i * 0.08, ease: EASE }}
      onMouseEnter={() => vid.current?.play().catch(() => {})} onMouseLeave={() => { if (vid.current) { vid.current.pause(); vid.current.currentTime = 0; } }}
      className="group flex h-full flex-col border border-line bg-ivory transition duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-20px_rgba(31,51,41,0.35)]">
      <button type="button" onClick={onOpen} aria-label={`Voir le post ${p.id} tel qu'il apparaîtra sur ${p.network}`} className={clsx("relative block overflow-hidden bg-sky text-left", p.network === "Instagram" ? "aspect-[4/5]" : p.network === "Pinterest" ? "aspect-[2/3] max-h-[520px]" : "aspect-[9/16] max-h-[520px]")}>
        <Image src={p.image} alt={p.alt} fill sizes="(max-width: 768px) 92vw, 30vw" className="object-cover transition duration-700 group-hover:scale-[1.04]" />
        {p.video && <video ref={vid} src={p.video} muted loop playsInline preload="none" className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-500 group-hover:opacity-100" />}
        {p.video && <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/55 text-white" aria-hidden>▶</span>}
        <span className="absolute inset-x-0 bottom-0 flex translate-y-2 items-center justify-center bg-gradient-to-t from-black/60 to-transparent p-4 pt-10 text-sm font-medium text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">{p.video ? "Lire la vidéo comme sur TikTok →" : `Voir comme sur ${p.network} →`}</span>
      </button>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2 text-[0.7rem]">
          <span className="chip bg-cream">Post {p.id}</span>
          <span className={clsx("chip", goalColor[p.goal])}>{p.goal}</span>
          <StatusPill status={statuses[`plan-${p.id}`] ?? "valide"} />
        </div>
        <p className="mt-3 font-display text-xl leading-tight">{shown.title}</p>
        <dl className="mt-3 grid grid-cols-[5rem_1fr] gap-x-3 gap-y-1 text-xs">
          <dt className="text-forest-soft">Format</dt><dd>{p.format}</dd>
          <dt className="text-forest-soft">Date</dt><dd><time dateTime={p.dateISO}>{p.date}</time></dd>
          <dt className="text-forest-soft">Objectif</dt><dd>{p.goal}</dd>
        </dl>
        <details className="group/d mt-4 border-t border-line pt-3">
          <summary className="cursor-pointer list-none text-sm font-medium [&::-webkit-details-marker]:hidden">Texte complet <span className="text-forest-soft group-open/d:hidden">+</span><span className="hidden text-forest-soft group-open/d:inline">−</span></summary>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-forest-soft">{shown.caption}</p>
          <p className="mt-3 text-xs text-sage-deep">{shown.hashtags.join(" ")}</p>
        </details>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <button type="button" onClick={onOpen} className="btn btn-ghost !px-3 !py-1.5 text-xs">Aperçu, modifier, valider</button>
          <a href={p.image} download className="btn btn-ghost !px-3 !py-1.5 text-xs">Télécharger le visuel</a>
        </div>
      </div>
    </motion.article>
  );
}

export function PlanPosts({ posts }: { posts: PlanPost[] }) {
  const [openId, setOpenId] = useState<number | null>(null);
  const edits = useEdits();
  const open = openId == null ? null : withEdits(toHubPost(posts.find((p) => p.id === openId)!), edits);
  return (
    <div className="space-y-14">
      {(["Instagram", "TikTok", "Pinterest"] as const).map((net) => (
        <div key={net}>
          <p className="mb-4 font-display text-2xl">{net}</p>
          <div className="grid gap-6 md:grid-cols-3">
            {posts.filter((p) => p.network === net).map((p, i) => <PlanCard key={p.id} p={p} i={i} onOpen={() => setOpenId(p.id)} />)}
          </div>
        </div>
      ))}
      <PostSheet post={open} onClose={() => setOpenId(null)} />
    </div>
  );
}

/* ───────── Bibliothèque de contenus : téléphone + vignettes ───────── */

const NETS = ["all", "tiktok", "instagram", "pinterest", "facebook", "story"] as const;

export function FeedLibrary() {
  const base = hub.posts as unknown as Post[];
  const statuses = useStatuses();
  const edits = useEdits();
  const posts = useMemo(() => base.map((p) => withEdits(p, edits)), [base, edits]);
  const [net, setNet] = useState<(typeof NETS)[number]>("all");
  const [state, setState] = useState<"all" | "ok" | "wait">("all");
  const statusOf = (p: Post) => (statuses[p.id] ?? p.status) as Status;
  const ok = (p: Post) => ["valide", "publie_test"].includes(statusOf(p));
  const shown = posts.filter((p) => (net === "all" || p.platform === net) && (state === "all" || (state === "ok" ? ok(p) : !ok(p))));
  const [id, setId] = useState(base[0].id);
  const current = posts.find((p) => p.id === id) ?? shown[0] ?? posts[0];
  const phone = useRef<HTMLDivElement>(null);
  const waiting = posts.filter((p) => !ok(p)).length;
  const pick = (p: Post) => { setId(p.id); if (window.innerWidth < 1024) phone.current?.scrollIntoView({ behavior: "smooth", block: "start" }); };

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[400px_1fr]">
      <div ref={phone} className="scroll-mt-[calc(5rem+var(--demo-h))] lg:sticky lg:top-[calc(5.5rem+var(--demo-h))] lg:max-h-[calc(100vh-6.5rem-var(--demo-h))] lg:overflow-y-auto lg:pr-2 no-scrollbar">
        <div className="relative mx-auto w-full max-w-[380px]">
          <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[48px] bg-[radial-gradient(closest-side,#D8DFD4,transparent)]" />
          <AnimatePresence mode="wait">
            <motion.div key={current.id} initial={{ opacity: 0, y: 30, rotate: -2, scale: 0.96 }} animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }} exit={{ opacity: 0, y: -20, rotate: 2, scale: 0.96 }} transition={{ duration: 0.4, ease: EASE }}>
              <PostPreview post={current} />
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="mx-auto mt-5 max-w-[380px] border border-line bg-ivory p-5">
          <PostDetails key={current.id} post={current} compact />
        </div>
      </div>

      <div>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
            {NETS.map((n) => (
              <button key={n} type="button" onClick={() => setNet(n)} aria-pressed={net === n} className="relative shrink-0 rounded-full px-4 py-2 text-sm">
                {net === n && <motion.span layoutId="lib-net" className="absolute inset-0 rounded-full bg-forest" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
                <span className={clsx("relative", net === n ? "text-ivory" : "text-forest")}>{n === "all" ? "Tout" : NET[n]} · {posts.filter((p) => n === "all" || p.platform === n).length}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-1 text-xs">
            {([["all", "Tous"], ["ok", "Validés"], ["wait", `À valider · ${waiting}`]] as const).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setState(k)} aria-pressed={state === k} className={clsx("rounded-full border px-3 py-1.5", state === k ? "border-forest bg-forest text-ivory" : "border-line bg-ivory")}>{l}</button>
            ))}
          </div>
        </div>
        <motion.ul layout className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {shown.map((p, i) => (
              <motion.li key={p.id} layout initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} transition={{ duration: 0.35, delay: Math.min(i, 15) * 0.02 }}>
                <button type="button" onClick={() => pick(p)} aria-label={`Voir ${p.title}`} aria-pressed={p.id === current.id} className="group block w-full text-left">
                  <span className={clsx("relative block aspect-[4/5] overflow-hidden bg-sage-soft ring-offset-2 transition", p.id === current.id ? "ring-2 ring-forest" : "group-hover:-translate-y-1")}>
                    <VisualThumb visual={p.visual} width={220} fill className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    <span className="absolute left-2 top-2 rounded-full bg-ivory/90 px-2 py-0.5 text-[0.6rem] font-medium">{NET[p.platform]}</span>
                  </span>
                  <span className="mt-2 line-clamp-2 block text-xs font-medium leading-snug">{p.title}</span>
                  <span className="mt-1 flex items-center gap-1.5 text-[0.65rem] text-forest-soft"><span className={clsx("h-1.5 w-1.5 rounded-full", STATUS[statusOf(p)].dot)} />{STATUS[statusOf(p)].label}</span>
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      </div>
    </div>
  );
}

/* ───────── SEO : mots-clés et articles ───────── */

const INTENT: Record<string, string> = { commerciale: "Achat", informationnelle: "Information", transactionnelle: "Achat immédiat", navigationnelle: "Marque" };
type Article = (typeof hub.articles)[number];
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
/** Articles qui travaillent un thème : mot-clé principal, secondaire ou titre qui contient un mot du thème. */
function articlesFor(cluster: string, keywords: string[]) {
  const words = [cluster, ...keywords].map(norm);
  return hub.articles.filter((a) => {
    const hay = norm([a.keyword, ...(a.secondary ?? []), a.title].join(" "));
    return words.some((w) => w.split(/\s+/).filter((x) => x.length > 3).every((x) => hay.includes(x)));
  });
}

function ArticleSheet({ article, onClose }: { article: Article | null; onClose: () => void }) {
  const edits = useEdits();
  const a = article ? withEdits(article, edits) : null;
  return (
    <Sheet open={!!a} onClose={onClose} label={a?.title ?? "Article"}>
      {a && <ArticleBody key={a.id} a={a} />}
    </Sheet>
  );
}

function ArticleBody({ a }: { a: Article }) {
  const [editing, setEditing] = useState(false);
  return (
    <>
      {(
        <div className="p-6 md:p-10">
          <p className="eyebrow text-sage-deep">Article SEO · {a.readingMinutes} min de lecture</p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-lg border border-line bg-ivory p-4">
            <p className="text-[0.7rem] text-forest-soft">Aperçu dans Google</p>
            <p className="mt-2 text-xs text-[#4d5156]">skinclean.fr › conseils › {a.slug}</p>
            <p className="mt-0.5 text-lg leading-snug text-[#1a0dab]">{a.metaTitle}</p>
            <p className="mt-1 text-sm text-[#4d5156]">{a.metaDescription}</p>
            <p className="mt-2 text-[0.65rem] text-forest-soft">Titre : {a.metaTitle.length}/60 caractères · Description : {a.metaDescription.length}/155 caractères</p>
          </motion.div>
          <dl className="mt-4 grid grid-cols-[9rem_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-forest-soft">Mot-clé principal</dt><dd>{a.keyword}</dd>
            {a.secondary?.length > 0 && <><dt className="text-forest-soft">Mots-clés associés</dt><dd>{a.secondary.join(", ")}</dd></>}
          </dl>
          {editing && (
            <div className="mt-6">
              <EditForm fields={[{ key: "title", label: "Titre de l'article" }, { key: "metaTitle", label: "Titre pour Google" }, { key: "metaDescription", label: "Description pour Google", long: true, rows: 3 }, { key: "content", label: "Texte (## pour un intertitre, - pour une liste)", long: true, rows: 16 }]}
                values={{ title: a.title, metaTitle: a.metaTitle, metaDescription: a.metaDescription, content: a.content }} onSave={(v) => { saveEdit(a.id, v); setEditing(false); }} onCancel={() => setEditing(false)} />
            </div>
          )}
          <div className="mt-6"><ValidationBar id={a.id} initial={a.status} onEdit={editing ? undefined : () => setEditing(true)} /></div>
          <article className="mt-8 border-t border-line pt-6">
            <h1 className="font-display text-3xl leading-tight md:text-4xl">{a.title}</h1>
            <div className="mt-4 space-y-4 text-[0.95rem] leading-relaxed [&_a]:underline [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h3]:mt-6 [&_h3]:font-medium [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc"><Markdown source={a.content} /></div>
          </article>
        </div>
      )}
    </>
  );
}

export function SeoStudio() {
  const statuses = useStatuses();
  const edits = useEdits();
  const [open, setOpen] = useState<Article | null>(null);
  const [cluster, setCluster] = useState<string | null>(null);
  const clusters = useMemo(() => {
    const m = new Map<string, typeof hub.keywords>();
    for (const k of hub.keywords) m.set(k.cluster, [...(m.get(k.cluster) ?? []), k]);
    return [...m.entries()].map(([c, ks]) => ({ c, ks, arts: articlesFor(c, ks.map((k) => k.keyword)) }));
  }, []);
  const sel = clusters.find((x) => x.c === cluster);
  return (
    <div>
      <p className="mb-2 font-display text-2xl">Les thèmes de recherche visés</p>
      <p className="mb-4 text-sm text-forest-soft">Clique sur un thème pour voir ses mots-clés et les articles qui le travaillent.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {clusters.map(({ c, ks, arts }, i) => (
          <motion.button key={c} type="button" onClick={() => setCluster(c)} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: (i % 4) * 0.06 }}
            whileHover={{ y: -4 }} className="group relative overflow-hidden border border-line bg-ivory p-5 text-left">
            <motion.span aria-hidden className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-sage-soft transition-transform duration-500 group-hover:scale-[2.2]" />
            <span className="relative block font-display text-xl">{c}</span>
            <span className="relative mt-3 flex gap-4 text-xs text-forest-soft"><span><b className="block font-display text-3xl text-forest">{ks.length}</b>mots-clés</span><span><b className="block font-display text-3xl text-forest">{arts.length}</b>articles</span></span>
            <span className="relative mt-3 block text-xs">Voir le détail →</span>
          </motion.button>
        ))}
      </div>
      <p className="mt-3 text-xs text-forest-soft">Les volumes de recherche ne sont pas affichés : ils seront mesurés avec Google Search Console après le lancement, aucun chiffre n&apos;est inventé ici.</p>

      <p className="mb-4 mt-12 font-display text-2xl">{hub.articles.length} articles de blog rédigés pour le référencement</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {hub.articles.map((raw, i) => {
          const a = withEdits(raw, edits);
          return (
            <motion.button key={a.id} type="button" onClick={() => setOpen(raw)} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: (i % 4) * 0.06, ease: EASE }}
              className="group flex flex-col border border-line bg-ivory text-left transition hover:-translate-y-1 hover:shadow-[0_16px_30px_-18px_rgba(31,51,41,0.4)]">
              <span className="relative block aspect-[16/10] overflow-hidden bg-sage-soft">
                <Image src={a.cover} alt="" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-contain p-4 transition duration-700 group-hover:scale-110 group-hover:-rotate-3" />
              </span>
              <span className="flex flex-1 flex-col p-4">
                <span className="text-[0.65rem] uppercase tracking-[0.08em] text-sage-deep">Mot-clé : {a.keyword}</span>
                <span className="mt-1 font-display text-lg leading-tight">{a.title}</span>
                <span className="mt-3 flex items-center justify-between gap-2 text-[0.7rem] text-forest-soft"><StatusPill status={(statuses[a.id] ?? a.status) as Status} /><span>{a.readingMinutes} min</span></span>
              </span>
            </motion.button>
          );
        })}
      </div>

      <Sheet open={!!sel} onClose={() => setCluster(null)} label={sel?.c ?? "Thème"}>
        {sel && (
          <div className="p-6 md:p-10">
            <p className="eyebrow text-sage-deep">Thème SEO</p>
            <p className="mt-2 font-display text-4xl">{sel.c}</p>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {sel.ks.map((k, i) => (
                <motion.li key={k.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center justify-between gap-3 border border-line bg-ivory px-4 py-3 text-sm">
                  <span>« {k.keyword} »</span>
                  <span className="flex shrink-0 gap-1 text-[0.65rem]"><span className="rounded-full bg-cream px-2 py-0.5">{INTENT[k.intent] ?? k.intent}</span><span className={clsx("rounded-full px-2 py-0.5", k.priority === 1 ? "bg-forest text-ivory" : "bg-sage-soft")}>Priorité {k.priority}</span></span>
                </motion.li>
              ))}
            </ul>
            {sel.ks[0]?.targetUrl && <p className="mt-3 text-xs text-forest-soft">Page visée pour « {sel.ks[0].keyword} » : <a href={sel.ks[0].targetUrl} className="underline">{sel.ks[0].targetUrl}</a></p>}
            <p className="mb-3 mt-8 font-display text-2xl">Articles de ce thème ({sel.arts.length})</p>
            {sel.arts.length === 0 ? <p className="text-sm text-forest-soft">Aucun article encore : ce thème est travaillé par les fiches produits.</p> : (
              <div className="grid gap-3 sm:grid-cols-2">
                {sel.arts.map((a) => (
                  <button key={a.id} type="button" onClick={() => { setCluster(null); setOpen(a); }} className="flex items-center gap-3 border border-line bg-ivory p-3 text-left transition hover:bg-sage-soft">
                    <span className="relative h-16 w-16 shrink-0 bg-sage-soft"><Image src={a.cover} alt="" fill sizes="64px" className="object-contain p-1.5" /></span>
                    <span><span className="block font-medium leading-snug">{withEdits(a, edits).title}</span><span className="mt-1 block"><StatusPill status={(statuses[a.id] ?? a.status) as Status} /></span></span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </Sheet>
      <ArticleSheet article={open} onClose={() => setOpen(null)} />
    </div>
  );
}

/* ───────── Calendrier éditorial (mois par mois) ───────── */

const PLAT_COLOR: Record<string, string> = { instagram: "#C2557A", tiktok: "#1F3329", pinterest: "#B23A3A", facebook: "#3B5B99", story: "#9C6ADE", newsletter: "#4A6354", blog: "#B08A3E", prep: "#7D9484", partenariat: "#8C6D3F", bilan: "#5C6862" };
const PREP = [{ d: -21, t: "Brief de campagne" }, { d: -14, t: "Production des contenus" }, { d: -7, t: "Validation des contenus" }, { d: -2, t: "Programmation" }];
const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (s: string, n: number) => { const d = new Date(`${s}T12:00`); d.setDate(d.getDate() + n); return ymd(d); };
interface CalEvent { date: string; title: string; kind: string; campaign?: string; color?: string; detail?: string; plan?: PlanPost }

const PLAN_KIND: Record<string, string> = { Instagram: "instagram", TikTok: "tiktok", Pinterest: "pinterest", Newsletter: "newsletter", Partenariat: "partenariat", Bilan: "bilan" };
/** Date d'une ligne du plan de 4 semaines (23 novembre au 20 décembre 2026) : « Lun. 23 » = novembre, « Mar. 1ᵉʳ » = décembre. */
const planDay = (day: string) => { const n = Number(day.replace(/\D/g, "")); return ymd(new Date(2026, n >= 23 ? 10 : 11, n, 12)); };

function allEvents(): CalEvent[] {
  const ev: CalEvent[] = [];
  for (const c of hub.campaigns) if (c.startDate) for (const a of c.plan) ev.push({ date: addDays(c.startDate, a.day), title: a.title, kind: a.platform, campaign: c.id, color: c.color, detail: [a.idea, a.hour].filter(Boolean).join(" · ") });
  for (const w of planCalendar) for (const it of w.items) {
    const post = it.postId ? planPosts.find((p) => p.id === it.postId) : undefined;
    ev.push({ date: post?.dateISO ?? planDay(it.day), title: post?.title ?? it.action, kind: PLAN_KIND[it.channel] ?? "bilan", campaign: "plan", detail: w.theme, plan: post });
  }
  return ev;
}

export function EditorialCalendar() {
  const events = useMemo(() => allEvents(), []);
  const camps = [{ id: "", name: "Tout" }, { id: "plan", name: "Plan des 4 semaines" }, ...hub.campaigns.filter((c) => c.plan.length).map((c) => ({ id: c.id, name: c.name }))];
  const [camp, setCamp] = useState("plan");
  const [month, setMonth] = useState("2026-11");
  const [dir, setDir] = useState(1);
  const [open, setOpen] = useState<CalEvent | null>(null);
  const [planOpen, setPlanOpen] = useState<Post | null>(null);
  const edits = useEdits();
  const c = hub.campaigns.find((x) => x.id === camp);
  const list = useMemo(() => {
    const base = events.filter((e) => !camp || e.campaign === camp);
    if (c?.startDate) for (const p of PREP) base.push({ date: addDays(c.startDate, p.d), title: p.t, kind: "prep", campaign: c.id, detail: `J${p.d} avant le lancement de « ${c.name} »` });
    return base;
  }, [events, camp, c]);
  const choose = (id: string) => {
    setCamp(id);
    const first = id === "plan" ? "2026-11-23" : hub.campaigns.find((x) => x.id === id)?.startDate;
    if (first) { const m = (id && id !== "plan" ? addDays(first, -21) : first).slice(0, 7); setDir(m >= month ? 1 : -1); setMonth(m); }
  };
  const step = (n: number) => { const d = new Date(`${month}-01T12:00`); d.setMonth(d.getMonth() + n); setDir(n); setMonth(ymd(d).slice(0, 7)); };
  const first = new Date(`${month}-01T12:00`);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((startOffset + daysInMonth) / 7) * 7 }, (_, i) => { const d = new Date(first); d.setDate(1 - startOffset + i); return ymd(d); });
  const byDay = new Map<string, CalEvent[]>();
  for (const e of list) byDay.set(e.date, [...(byDay.get(e.date) ?? []), e]);
  const label = first.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const inMonth = list.filter((e) => e.date.startsWith(month)).length;
  const today = ymd(new Date());

  return (
    <div>
      <div className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
        {camps.map((x) => (
          <button key={x.id || "all"} type="button" onClick={() => choose(x.id)} aria-pressed={camp === x.id} className="relative shrink-0 rounded-full px-4 py-2 text-sm">
            {camp === x.id && <motion.span layoutId="cal-pill" className="absolute inset-0 rounded-full bg-forest" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
            <span className={clsx("relative", camp === x.id ? "text-ivory" : "text-forest")}>{x.name}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 border border-line bg-ivory">
        <div className="flex items-center justify-between gap-3 border-b border-line p-4">
          <button type="button" onClick={() => step(-1)} aria-label="Mois précédent" className="grid h-9 w-9 place-items-center rounded-full border border-line hover:bg-sage-soft">←</button>
          <div className="text-center"><AnimatePresence mode="wait"><motion.p key={month} initial={{ opacity: 0, y: dir * 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -dir * 10 }} className="font-display text-2xl capitalize">{label}</motion.p></AnimatePresence><p className="text-xs text-forest-soft">{inMonth} action{inMonth > 1 ? "s" : ""} ce mois-ci{c ? ` · lancement de « ${c.name} » le ${new Date(`${c.startDate}T12:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}` : ""}</p></div>
          <button type="button" onClick={() => step(1)} aria-label="Mois suivant" className="grid h-9 w-9 place-items-center rounded-full border border-line hover:bg-sage-soft">→</button>
        </div>
        <div className="grid grid-cols-7 border-b border-line text-center text-[0.65rem] font-medium uppercase tracking-[0.08em] text-forest-soft">{DAYS.map((d) => <span key={d} className="py-2">{d}</span>)}</div>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={month} initial={{ opacity: 0, x: dir * 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -dir * 40 }} transition={{ duration: 0.3, ease: EASE }} className="grid grid-cols-7">
            {cells.map((d, i) => {
              const evs = byDay.get(d) ?? [];
              const out = !d.startsWith(month);
              return (
                <div key={d} className={clsx("min-h-[4.5rem] border-b border-r border-line p-1 md:min-h-[7.5rem] md:p-1.5", out && "bg-cream/60", (i + 1) % 7 === 0 && "border-r-0")}>
                  <span className={clsx("text-[0.7rem] tabular-nums", out ? "text-forest-soft/50" : "text-forest-soft", d === today && "rounded-full bg-forest px-1.5 text-ivory")}>{Number(d.slice(8))}</span>
                  <div className="mt-1 space-y-1">
                    {evs.slice(0, 3).map((e, k) => (
                      <motion.button key={k} type="button" onClick={() => (e.plan ? setPlanOpen(withEdits(toHubPost(e.plan), edits)) : setOpen(e))} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 + (i % 7) * 0.02 + k * 0.04 }}
                        className="block w-full truncate rounded px-1 py-0.5 text-left text-[0.6rem] font-medium leading-tight text-white transition hover:brightness-110 md:px-1.5 md:text-[0.68rem]" style={{ background: PLAT_COLOR[e.kind] ?? "#1F3329" }} title={e.title}>
                        <span className="hidden md:inline">{NET[e.kind] ? `${NET[e.kind]} · ` : ""}</span>{e.title}
                      </motion.button>
                    ))}
                    {evs.length > 3 && <button type="button" onClick={() => setOpen({ ...evs[3], title: `${evs.length - 3} autres actions ce jour-là`, detail: evs.slice(3).map((x) => `${NET[x.kind] ?? "Préparation"} : ${x.title}`).join("\n") })} className="text-[0.6rem] text-forest-soft underline">+{evs.length - 3}</button>}
                  </div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-[0.7rem] text-forest-soft">
        {["instagram", "tiktok", "pinterest", "facebook", "story", "newsletter", "blog", "prep"].map((k) => <span key={k} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: PLAT_COLOR[k] }} />{k === "prep" ? "Préparation (rétroplanning)" : NET[k]}</span>)}
      </div>

      <Sheet open={!!open} onClose={() => setOpen(null)} label={open?.title ?? "Action"}>
        {open && (
          <div className="p-6 md:p-10">
            <span className="rounded-full px-3 py-1 text-xs font-medium text-white" style={{ background: PLAT_COLOR[open.kind] ?? "#1F3329" }}>{open.kind === "prep" ? "Préparation" : NET[open.kind] ?? open.kind}</span>
            <p className="mt-4 font-display text-3xl">{open.title}</p>
            <p className="mt-2 text-sm text-forest-soft">{frDateTime(open.date)}{open.campaign && open.campaign !== "plan" ? ` · campagne « ${campName(open.campaign)} »` : ""}</p>
            {open.detail && <p className="mt-4 whitespace-pre-line text-sm">{open.detail}</p>}
          </div>
        )}
      </Sheet>
      <PostSheet post={planOpen} onClose={() => setPlanOpen(null)} />
    </div>
  );
}

/* ───────── Newsletters ───────── */

function EmailFrame({ email }: { email: EmailCampaign }) {
  const [html, setHtml] = useState<string | null>(null);
  const [h, setH] = useState(900);
  useEffect(() => {
    let alive = true;
    (async () => {
      const images: Record<string, string> = {};
      for (const b of email.blocks) { const d = b.type === "hero" ? (b as { design?: Parameters<typeof designToDataUrl>[0] }).design : undefined; if (d) images[b.id] = await designToDataUrl(d, 0, 1, "image/jpeg"); }
      if (alive) setHtml(renderEmailHtml(email, { baseUrl: window.location.origin, images }));
    })();
    return () => { alive = false; };
  }, [email]);
  const scale = 0.9;
  if (!html) return <p className="p-6 text-sm text-forest-soft">Préparation de l&apos;aperçu…</p>;
  return (
    <div className="relative mx-auto overflow-hidden" style={{ width: 600 * scale, maxWidth: "100%", height: h * scale }}>
      <iframe title={`Aperçu : ${email.subject}`} srcDoc={html} sandbox="allow-same-origin" scrolling="no" className="absolute left-0 top-0 origin-top-left border-0 bg-white" style={{ width: 600, height: h, transform: `scale(${scale})` }}
        onLoad={(e) => { const d = e.currentTarget.contentDocument; if (d) setH(Math.min(d.documentElement.scrollHeight, 3200)); }} />
    </div>
  );
}

export function NewsletterShelf() {
  const emails = hub.emails as unknown as (EmailCampaign & { status: string })[];
  const statuses = useStatuses();
  const edits = useEdits();
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const raw = emails.find((e) => e.id === openId);
  const open = raw ? withEdits(raw, edits) : null;
  return (
    <div>
      <ul className="grid gap-3 md:grid-cols-3">
        {emails.map((raw, i) => {
          const e = withEdits(raw, edits);
          return (
            <motion.li key={e.id} initial={{ opacity: 0, y: 20, rotateX: 12 }} whileInView={{ opacity: 1, y: 0, rotateX: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: (i % 3) * 0.07, ease: EASE }}>
              <button type="button" onClick={() => { setOpenId(e.id); setEditing(false); }} className="group relative flex h-full w-full flex-col overflow-hidden border border-line bg-ivory p-5 text-left transition hover:-translate-y-1 hover:shadow-[0_16px_30px_-18px_rgba(31,51,41,0.4)]">
                <span aria-hidden className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-forest transition-transform duration-500 group-hover:scale-x-100" />
                <span className="flex items-center justify-between gap-2"><span className="grid h-9 w-9 place-items-center rounded-full bg-sage-soft text-base transition group-hover:rotate-12" aria-hidden>✉</span><StatusPill status={(statuses[e.id] ?? e.status) as Status} /></span>
                <span className="mt-4 text-xs uppercase tracking-[0.08em] text-sage-deep">{e.name}</span>
                <span className="mt-1 font-display text-lg leading-tight">{e.subject}</span>
                <span className="mt-1 line-clamp-2 text-xs text-forest-soft">{e.preheader}</span>
                <span className="mt-auto pt-4 text-xs font-medium">Ouvrir l&apos;e-mail →</span>
              </button>
            </motion.li>
          );
        })}
      </ul>
      <Sheet open={!!open} onClose={() => setOpenId(null)} label={open?.subject ?? "Newsletter"}>
        {open && (
          <div className="grid md:grid-cols-[1fr_20rem]">
            <div className="bg-sand p-4 md:p-8"><EmailFrame email={open} /></div>
            <div className="p-6">
              <p className="eyebrow text-sage-deep">Newsletter</p>
              <p className="mt-2 font-display text-2xl leading-tight">{open.name}</p>
              {editing ? (
                <div className="mt-4"><EditForm fields={[{ key: "subject", label: "Objet" }, { key: "preheader", label: "Texte d'aperçu", long: true, rows: 3 }]} values={{ subject: open.subject, preheader: open.preheader }} onSave={(v) => { saveEdit(open.id, v); setEditing(false); }} onCancel={() => setEditing(false)} /></div>
              ) : (
                <dl className="mt-4 space-y-2 text-sm"><div><dt className="text-forest-soft">Objet</dt><dd>{open.subject}</dd></div><div><dt className="text-forest-soft">Texte d&apos;aperçu</dt><dd>{open.preheader}</dd></div></dl>
              )}
              <p className="mt-3 text-xs text-forest-soft">Envoyée uniquement aux personnes inscrites qui ont donné leur accord, avec un lien de désinscription.</p>
              <div className="mt-5"><ValidationBar id={open.id} initial={open.status} onEdit={editing ? undefined : () => setEditing(true)} /></div>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
