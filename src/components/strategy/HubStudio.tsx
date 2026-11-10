"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { Fragment, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import type { EmailCampaign, Platform, Post } from "@/lib/hub/types";
import { PostPreview } from "@/components/hub/PostPreview";
import { VisualThumb } from "@/components/hub/design/DesignPreview";
import { designToDataUrl } from "@/components/hub/design/render";
import { Markdown } from "@/components/hub/Markdown";
import { renderEmailHtml } from "@/lib/hub/email-html";
import { hubData as hub } from "@/data/hub-public";
import type { Post as PlanPost } from "@/data/communication";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ───────── Validation de démonstration (enregistrée dans ce navigateur) ───────── */

type Status = "valide" | "a_valider" | "a_modifier" | "publie_test" | "brouillon";
const KEY = "skinclean-validations-v1";
const listeners = new Set<() => void>();
let cache: Record<string, Status> | null = null;
function read(): Record<string, Status> {
  if (cache) return cache;
  try { cache = JSON.parse(localStorage.getItem(KEY) ?? "{}"); } catch { cache = {}; }
  return cache!;
}
const EMPTY: Record<string, Status> = {};
const noop = () => () => {};
function setStatus(id: string, s: Status) {
  cache = { ...read(), [id]: s };
  try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* stockage indisponible : l'état reste en mémoire */ }
  listeners.forEach((l) => l());
}
function useStatuses() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, read, () => EMPTY);
}
function useStatus(id: string, initial: string): Status {
  return (useStatuses()[id] ?? initial) as Status;
}

/** Contenus du Marketing Hub qui attendent une validation (avec les choix faits dans ce navigateur). */
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
  a_modifier: { label: "Modification demandée", dot: "bg-[#C0504D]", cls: "bg-[#F8E3E2] text-[#8A2F2C]" },
  brouillon: { label: "Brouillon", dot: "bg-forest-soft", cls: "bg-cream text-forest-soft" },
};

export function StatusPill({ status }: { status: Status }) {
  const s = STATUS[status] ?? STATUS.brouillon;
  return <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-medium", s.cls)}><span className={clsx("h-1.5 w-1.5 rounded-full", s.dot)} />{s.label}</span>;
}

/** Circuit de validation : Valider / Demander une modification / Remettre en validation. */
export function ValidationBar({ id, initial }: { id: string; initial: string }) {
  const status = useStatus(id, initial);
  const [done, setDone] = useState<string | null>(null);
  const act = (s: Status, msg: string) => { setStatus(id, s); setDone(msg); };
  useEffect(() => { if (!done) return; const t = setTimeout(() => setDone(null), 2200); return () => clearTimeout(t); }, [done]);
  return (
    <div className="border-t border-line pt-4">
      <div className="flex flex-wrap items-center gap-2"><span className="text-xs text-forest-soft">Statut :</span><StatusPill status={status} /></div>
      <div className="mt-3 flex flex-wrap gap-2">
        {status !== "valide" && status !== "publie_test" && <button type="button" onClick={() => act("valide", "Contenu validé")} className="btn btn-primary !px-4 !py-2 text-xs">Valider</button>}
        {status !== "a_modifier" && status !== "publie_test" && <button type="button" onClick={() => act("a_modifier", "Modification demandée à l'équipe")} className="btn btn-ghost !px-4 !py-2 text-xs">Demander une modification</button>}
        {status !== "a_valider" && status !== "publie_test" && <button type="button" onClick={() => act("a_valider", "Remis en validation")} className="btn btn-ghost !px-4 !py-2 text-xs">Remettre en validation</button>}
      </div>
      <AnimatePresence>{done && <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 text-xs font-medium text-[#2E5E3E]">✓ {done}</motion.p>}</AnimatePresence>
      <p className="mt-2 text-[0.7rem] text-forest-soft">Circuit de validation de démonstration : ton choix est enregistré dans ce navigateur uniquement.</p>
    </div>
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

const NET: Record<string, string> = { tiktok: "TikTok", instagram: "Instagram", pinterest: "Pinterest", facebook: "Facebook", story: "Stories Instagram" };
const FORMAT: Record<string, string> = { video: "Vidéo", reel: "Reel", post: "Post", carrousel: "Carrousel", epingle: "Épingle", story: "Story" };
const campName = (id?: string) => hub.campaigns.find((c) => c.id === id)?.name;
const frDateTime = (d?: string | null) => (d ? new Date(d.length === 10 ? `${d}T12:00` : d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : null);

function PostDetails({ post, children }: { post: Post; children?: React.ReactNode }) {
  const rows: [string, React.ReactNode][] = [
    ["Réseau", NET[post.platform] ?? post.platform],
    ["Format", (post as Post & { formatLabel?: string }).formatLabel ?? FORMAT[post.format] ?? post.format],
    ["Objectif", post.objective],
    ["Pilier", post.pillar],
    ["Campagne", campName(post.campaignId)],
    ["Date prévue", frDateTime(post.date)],
    ["Appel à l'action", post.cta],
  ];
  return (
    <div className="p-6 md:p-8">
      <p className="eyebrow text-sage-deep">{NET[post.platform]} · {FORMAT[post.format] ?? post.format}</p>
      <p className="mt-2 font-display text-3xl leading-tight">{post.title}</p>
      <dl className="mt-5 grid grid-cols-[7.5rem_1fr] gap-x-3 gap-y-2 text-sm">
        {rows.filter(([, v]) => v).map(([k, v]) => <Fragment key={k}><dt className="text-forest-soft">{k}</dt><dd>{v}</dd></Fragment>)}
      </dl>
      <p className="mt-6 text-xs font-medium uppercase tracking-[0.08em] text-forest-soft">Légende complète</p>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{post.caption}</p>
      {post.hashtags.length > 0 && <p className="mt-3 text-sm text-[#216FDB]">{post.hashtags.join(" ")}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

function PostSheet({ post, onClose, initial }: { post: Post | null; onClose: () => void; initial?: string }) {
  return (
    <Sheet open={!!post} onClose={onClose} label={post?.title ?? "Aperçu"} wide>
      {post && (
        <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="flex items-start justify-center bg-[radial-gradient(closest-side,#D8DFD4,#EFEEEA)] px-4 py-8 md:sticky md:top-0 md:max-h-[88vh] md:items-center md:py-10">
            <div className="w-full max-w-[380px]"><PostPreview post={post} /></div>
          </div>
          <PostDetails post={post}><ValidationBar id={post.id} initial={initial ?? post.status} /></PostDetails>
        </div>
      )}
    </Sheet>
  );
}

/* ───────── Les 9 posts du plan : un clic ouvre l'aperçu réseau ───────── */

const PLAN_PLATFORM: Record<string, Platform> = { Instagram: "instagram", TikTok: "tiktok", Pinterest: "pinterest" };
const toHubPost = (p: PlanPost): Post => ({
  id: `plan-${p.id}`, title: p.title, date: p.dateISO, platform: PLAN_PLATFORM[p.network], format: p.network === "Pinterest" ? "epingle" : p.network === "TikTok" ? "video" : p.format.startsWith("Carrousel") ? "carrousel" : "post",
  objective: p.goal, pillar: "", formatLabel: p.format, visual: { kind: "image", src: p.image }, caption: p.text, hashtags: p.hashtags.split(" "), cta: "", status: "valide", comments: [], productIds: [],
} as unknown as Post);

const goalColor: Record<string, string> = { Notoriété: "bg-sage", Considération: "bg-sage-soft", Conversion: "bg-forest text-ivory", Fidélisation: "bg-ivory border border-line" };

export function PlanPosts({ posts }: { posts: PlanPost[] }) {
  const [open, setOpen] = useState<Post | null>(null);
  const statuses = useStatuses();
  const reduce = useReducedMotion();
  return (
    <div className="space-y-14">
      {(["Instagram", "TikTok", "Pinterest"] as const).map((net) => (
        <div key={net}>
          <p className="mb-4 font-display text-2xl">{net}</p>
          <div className="grid gap-6 md:grid-cols-3">
            {posts.filter((p) => p.network === net).map((p, i) => (
              <motion.article key={p.id} initial={reduce ? false : { opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.6, delay: i * 0.08, ease: EASE }}
                className="group flex h-full flex-col border border-line bg-ivory transition duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-20px_rgba(31,51,41,0.35)]">
                <button type="button" onClick={() => setOpen(toHubPost(p))} aria-label={`Voir le post ${p.id} tel qu'il apparaîtra sur ${net}`} className={clsx("relative block overflow-hidden bg-sky text-left", net === "Instagram" ? "aspect-[4/5]" : net === "Pinterest" ? "aspect-[2/3] max-h-[520px]" : "aspect-[9/16] max-h-[520px]")}>
                  <Image src={p.image} alt={p.alt} fill sizes="(max-width: 768px) 92vw, 30vw" className="object-cover transition duration-700 group-hover:scale-[1.04]" />
                  <span className="absolute inset-x-0 bottom-0 flex translate-y-2 items-center justify-center bg-gradient-to-t from-black/60 to-transparent p-4 pt-10 text-sm font-medium text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">Voir comme sur {net} →</span>
                </button>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex flex-wrap items-center gap-2 text-[0.7rem]">
                    <span className="chip bg-cream">Post {p.id}</span>
                    <span className={clsx("chip", goalColor[p.goal])}>{p.goal}</span>
                    <StatusPill status={statuses[`plan-${p.id}`] ?? "valide"} />
                  </div>
                  <p className="mt-3 font-display text-xl leading-tight">{p.title}</p>
                  <dl className="mt-3 grid grid-cols-[5rem_1fr] gap-x-3 gap-y-1 text-xs">
                    <dt className="text-forest-soft">Format</dt><dd>{p.format}</dd>
                    <dt className="text-forest-soft">Date</dt><dd><time dateTime={p.dateISO}>{p.date}</time></dd>
                    <dt className="text-forest-soft">Objectif</dt><dd>{p.goal}</dd>
                  </dl>
                  <details className="group/d mt-4 border-t border-line pt-3">
                    <summary className="cursor-pointer list-none text-sm font-medium [&::-webkit-details-marker]:hidden">Texte complet <span className="text-forest-soft group-open/d:hidden">+</span><span className="hidden text-forest-soft group-open/d:inline">−</span></summary>
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-forest-soft">{p.text}</p>
                    <p className="mt-3 text-xs text-sage-deep">{p.hashtags}</p>
                  </details>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <button type="button" onClick={() => setOpen(toHubPost(p))} className="btn btn-ghost !px-3 !py-1.5 text-xs">Aperçu et validation</button>
                    <a href={p.image} download className="btn btn-ghost !px-3 !py-1.5 text-xs">Télécharger le visuel</a>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      ))}
      <PostSheet post={open} onClose={() => setOpen(null)} />
    </div>
  );
}

/* ───────── Bibliothèque du Marketing Hub ───────── */

const NETS = ["all", "tiktok", "instagram", "pinterest", "facebook", "story"] as const;

export function FeedLibrary() {
  const posts = hub.posts as unknown as Post[];
  const statuses = useStatuses();
  const [net, setNet] = useState<(typeof NETS)[number]>("all");
  const [state, setState] = useState<"all" | "ok" | "wait">("all");
  const [open, setOpen] = useState<Post | null>(null);
  const statusOf = (p: Post) => (statuses[p.id] ?? p.status) as Status;
  const shown = useMemo(() => posts.filter((p) => (net === "all" || p.platform === net) && (state === "all" || (state === "ok" ? ["valide", "publie_test"].includes(statusOf(p)) : !["valide", "publie_test"].includes(statusOf(p))))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [posts, net, state, statuses]);
  const own = posts.find((p) => p.visual?.kind === "video" && p.visual.src?.includes("tiktok-routine"));
  const waiting = posts.filter((p) => !["valide", "publie_test"].includes(statusOf(p))).length;

  return (
    <div>
      {own && (
        <div className="mb-12 grid items-center gap-8 overflow-hidden bg-forest p-6 text-ivory md:grid-cols-[320px_1fr] md:p-10">
          <motion.div initial={{ rotate: -4, y: 30, opacity: 0 }} whileInView={{ rotate: -2, y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.9, ease: EASE }} className="mx-auto w-full max-w-[300px]">
            <PostPreview post={own} />
          </motion.div>
          <div>
            <p className="eyebrow text-sage">Notre vidéo TikTok</p>
            <p className="mt-2 font-display text-3xl md:text-4xl">{own.title}</p>
            <p className="mt-4 max-w-xl whitespace-pre-line text-sm text-ivory/80">{own.caption}</p>
            <p className="mt-3 text-sm text-sage">{own.hashtags.join(" ")}</p>
            <button type="button" onClick={() => setOpen(own)} className="btn btn-light mt-6">Voir la fiche et valider</button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
          {NETS.map((n) => (
            <button key={n} type="button" onClick={() => setNet(n)} aria-pressed={net === n} className="relative shrink-0 rounded-full px-4 py-2 text-sm">
              {net === n && <motion.span layoutId="lib-net" className="absolute inset-0 rounded-full bg-forest" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
              <span className={clsx("relative", net === n ? "text-ivory" : "text-forest")}>{n === "all" ? "Tout" : NET[n]} · {posts.filter((p) => n === "all" || p.platform === n).length}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-1 text-xs">
          {([["all", "Tous les statuts"], ["ok", "Validés"], ["wait", `À valider · ${waiting}`]] as const).map(([k, l]) => (
            <button key={k} type="button" onClick={() => setState(k)} aria-pressed={state === k} className={clsx("rounded-full border px-3 py-1.5", state === k ? "border-forest bg-forest text-ivory" : "border-line bg-ivory")}>{l}</button>
          ))}
        </div>
      </div>

      <motion.ul layout className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <AnimatePresence mode="popLayout">
          {shown.map((p, i) => (
            <motion.li key={p.id} layout initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} transition={{ duration: 0.35, delay: Math.min(i, 15) * 0.02 }}>
              <button type="button" onClick={() => setOpen(p)} aria-label={`Voir ${p.title}`} className="group block w-full text-left">
                <span className="relative block aspect-[4/5] overflow-hidden bg-sage-soft">
                  <VisualThumb visual={p.visual} width={220} fill className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <span className="absolute left-2 top-2 rounded-full bg-ivory/90 px-2 py-0.5 text-[0.6rem] font-medium">{NET[p.platform]}</span>
                  {p.id === own?.id && <span className="absolute bottom-2 left-2 rounded-full bg-[#FE2C55] px-2 py-0.5 text-[0.6rem] font-semibold text-white">Notre vidéo</span>}
                  <span className="absolute inset-0 grid place-items-center bg-forest/0 text-sm font-medium text-white opacity-0 transition group-hover:bg-forest/40 group-hover:opacity-100">Ouvrir l&apos;aperçu</span>
                </span>
                <span className="mt-2 line-clamp-2 block text-xs font-medium leading-snug">{p.title}</span>
                <span className="mt-1 flex items-center gap-1.5 text-[0.65rem] text-forest-soft"><span className={clsx("h-1.5 w-1.5 rounded-full", STATUS[statusOf(p)].dot)} />{STATUS[statusOf(p)].label}</span>
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
      <PostSheet post={open} onClose={() => setOpen(null)} />
    </div>
  );
}

/* ───────── SEO : mots-clés et articles ───────── */

const INTENT: Record<string, string> = { commerciale: "Achat", informationnelle: "Information", transactionnelle: "Achat immédiat", navigationnelle: "Marque" };

export function SeoStudio() {
  const statuses = useStatuses();
  const [open, setOpen] = useState<(typeof hub.articles)[number] | null>(null);
  const clusters = useMemo(() => {
    const m = new Map<string, typeof hub.keywords>();
    for (const k of hub.keywords) m.set(k.cluster, [...(m.get(k.cluster) ?? []), k]);
    return [...m.entries()];
  }, []);
  return (
    <div>
      <p className="mb-4 font-display text-2xl">Les mots-clés visés, par thème</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {clusters.map(([c, ks], i) => (
          <motion.div key={c} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: (i % 4) * 0.06 }} className="border border-line bg-ivory p-4">
            <p className="font-medium">{c}</p>
            <ul className="mt-2 space-y-1.5 text-xs">
              {ks.map((k) => <li key={k.id} className="flex items-center justify-between gap-2"><span>« {k.keyword} »</span><span className={clsx("shrink-0 rounded-full px-1.5 py-0.5 text-[0.6rem]", k.priority === 1 ? "bg-forest text-ivory" : "bg-cream text-forest-soft")}>{INTENT[k.intent] ?? k.intent}</span></li>)}
            </ul>
          </motion.div>
        ))}
      </div>
      <p className="mt-3 text-xs text-forest-soft">Mots-clés choisis dans le Marketing Hub. Les volumes de recherche ne sont pas affichés : ils seront mesurés avec Google Search Console après le lancement, aucun chiffre n&apos;est inventé ici.</p>

      <p className="mb-4 mt-12 font-display text-2xl">{hub.articles.length} articles de blog rédigés pour le référencement</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {hub.articles.map((a, i) => (
          <motion.button key={a.id} type="button" onClick={() => setOpen(a)} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: (i % 4) * 0.06, ease: EASE }}
            className="group flex flex-col border border-line bg-ivory text-left transition hover:-translate-y-1 hover:shadow-[0_16px_30px_-18px_rgba(31,51,41,0.4)]">
            <span className="relative block aspect-[16/10] overflow-hidden bg-sage-soft">
              <Image src={a.cover} alt="" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-contain p-4 transition duration-700 group-hover:scale-110" />
            </span>
            <span className="flex flex-1 flex-col p-4">
              <span className="text-[0.65rem] uppercase tracking-[0.08em] text-sage-deep">Mot-clé : {a.keyword}</span>
              <span className="mt-1 font-display text-lg leading-tight">{a.title}</span>
              <span className="mt-3 flex items-center justify-between gap-2 text-[0.7rem] text-forest-soft"><StatusPill status={(statuses[a.id] ?? a.status) as Status} /><span>{a.readingMinutes} min</span></span>
            </span>
          </motion.button>
        ))}
      </div>

      <Sheet open={!!open} onClose={() => setOpen(null)} label={open?.title ?? "Article"}>
        {open && (
          <div className="p-6 md:p-10">
            <p className="eyebrow text-sage-deep">Article SEO · {open.readingMinutes} min de lecture</p>
            <div className="mt-4 rounded-lg border border-line bg-ivory p-4">
              <p className="text-[0.7rem] text-forest-soft">Aperçu dans Google</p>
              <p className="mt-2 text-xs text-[#4d5156]">skinclean.fr › conseils › {open.slug}</p>
              <p className="mt-0.5 text-lg leading-snug text-[#1a0dab]">{open.metaTitle}</p>
              <p className="mt-1 text-sm text-[#4d5156]">{open.metaDescription}</p>
            </div>
            <dl className="mt-4 grid grid-cols-[9rem_1fr] gap-x-3 gap-y-1 text-sm">
              <dt className="text-forest-soft">Mot-clé principal</dt><dd>{open.keyword}</dd>
              {open.secondary?.length > 0 && <><dt className="text-forest-soft">Mots-clés associés</dt><dd>{open.secondary.join(", ")}</dd></>}
            </dl>
            <div className="mt-6"><ValidationBar id={open.id} initial={open.status} /></div>
            <article className="prose-sc mt-8 border-t border-line pt-6">
              <h1 className="font-display text-3xl leading-tight md:text-4xl">{open.title}</h1>
              <div className="mt-4 space-y-4 text-[0.95rem] leading-relaxed [&_a]:underline [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h3]:mt-6 [&_h3]:font-medium [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc"><Markdown source={open.content} /></div>
            </article>
          </div>
        )}
      </Sheet>
    </div>
  );
}

/* ───────── Rétroplanning des campagnes ───────── */

const PLAT_COLOR: Record<string, string> = { instagram: "#C2557A", tiktok: "#1F3329", pinterest: "#B23A3A", facebook: "#3B5B99", story: "#9C6ADE", newsletter: "#4A6354", blog: "#B08A3E" };
const PREP = [
  { d: -21, t: "Brief de campagne validé", w: "Objectif, cible, message, budget" },
  { d: -14, t: "Production", w: "Tournage, visuels au Studio, textes" },
  { d: -7, t: "Validation des contenus", w: "Relecture et validation de chaque publication" },
  { d: -2, t: "Programmation", w: "Planification des posts et des envois" },
];
const addDays = (ymd: string, n: number) => { const d = new Date(`${ymd}T12:00`); d.setDate(d.getDate() + n); return d; };
const short = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

export function Retroplanning() {
  const list = hub.campaigns.filter((c) => c.plan.length && c.startDate).sort((a, b) => a.startDate!.localeCompare(b.startDate!));
  const [id, setId] = useState(list[0].id);
  const c = list.find((x) => x.id === id)!;
  const span = 21 + (c.durationDays ?? 30);
  const pos = (d: number) => `${((d + 21) / span) * 100}%`;
  return (
    <div>
      <div className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
        {list.map((x) => (
          <button key={x.id} type="button" onClick={() => setId(x.id)} aria-pressed={x.id === id} className="relative shrink-0 rounded-full px-4 py-2 text-sm">
            {x.id === id && <motion.span layoutId="retro-pill" className="absolute inset-0 rounded-full bg-forest" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
            <span className={clsx("relative", x.id === id ? "text-ivory" : "text-forest")}>{x.name}</span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={c.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }} className="mt-6 border border-line bg-ivory p-5 md:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="font-display text-2xl">{c.name}</p>
            <p className="text-sm text-forest-soft">Lancement le {addDays(c.startDate!, 0).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} · {c.durationDays} jours · {c.plan.length} actions</p>
          </div>
          {/* Frise : préparation (J-21 à J-1) puis diffusion */}
          <div className="relative mt-8 hidden h-10 md:block">
            <div className="absolute inset-x-0 top-1/2 h-px bg-line" />
            <div className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-sage" style={{ left: pos(-21), width: `calc(${pos(0)} - ${pos(-21)})` }} />
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.9, ease: EASE }} className="absolute top-1/2 h-1 origin-left -translate-y-1/2 rounded-full bg-forest" style={{ left: pos(0), right: 0 }} />
            <span className="absolute -top-4 text-[0.65rem] font-medium uppercase tracking-[0.08em] text-sage-deep" style={{ left: pos(-21) }}>Préparation</span>
            <span className="absolute -top-4 text-[0.65rem] font-medium uppercase tracking-[0.08em]" style={{ left: pos(0) }}>Diffusion</span>
            {[...PREP.map((p) => ({ d: p.d, color: "#7D9484" })), ...c.plan.map((p) => ({ d: p.day, color: PLAT_COLOR[p.platform] ?? "#1F3329" }))].map((m, i) => (
              <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 + i * 0.05, type: "spring", stiffness: 300, damping: 18 }} className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-ivory" style={{ left: pos(m.d), background: m.color }} />
            ))}
          </div>
          <ol className="mt-6 grid gap-x-8 md:grid-cols-2">
            {[...PREP.map((p) => ({ day: p.d, title: p.t, idea: p.w, platform: "prep", hour: "", format: "" })), ...c.plan].map((p, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="grid grid-cols-[4.5rem_1fr] gap-3 border-b border-line py-3 text-sm">
                <span><span className={clsx("block font-semibold tabular-nums", p.day < 0 ? "text-sage-deep" : "")}>J{p.day >= 0 ? "+" : ""}{p.day}</span><span className="text-xs text-forest-soft">{short(addDays(c.startDate!, p.day))}</span></span>
                <span>
                  <span className="flex flex-wrap items-center gap-2"><span className="font-medium">{p.title}</span>{p.platform !== "prep" && <span className="rounded-full px-2 py-0.5 text-[0.6rem] font-medium text-white" style={{ background: PLAT_COLOR[p.platform] ?? "#1F3329" }}>{NET[p.platform] ?? (p.platform === "newsletter" ? "Newsletter" : p.platform)}</span>}</span>
                  {p.idea && <span className="block text-xs text-forest-soft">{p.idea}{p.hour ? ` · ${p.hour}` : ""}</span>}
                </span>
              </motion.li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-forest-soft">Les étapes de préparation (J-21 à J-2) sont calculées à rebours depuis la date de lancement ; les actions de diffusion viennent du planning de la campagne dans le Marketing Hub.</p>
        </motion.div>
      </AnimatePresence>
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
  const [open, setOpen] = useState<(typeof emails)[number] | null>(null);
  return (
    <div>
      <ul className="divide-y divide-line border-y border-line">
        {emails.map((e, i) => (
          <motion.li key={e.id} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: i * 0.04 }}>
            <button type="button" onClick={() => setOpen(e)} className="group grid w-full gap-1 py-4 text-left md:grid-cols-[14rem_1fr_auto] md:items-center md:gap-6">
              <span className="text-sm font-medium">{e.name}</span>
              <span className="min-w-0"><span className="block truncate text-sm">{e.subject}</span><span className="block truncate text-xs text-forest-soft">{e.preheader}</span></span>
              <span className="flex items-center gap-3"><StatusPill status={(statuses[e.id] ?? e.status) as Status} /><span className="text-sm transition group-hover:translate-x-1">Ouvrir →</span></span>
            </button>
          </motion.li>
        ))}
      </ul>
      <Sheet open={!!open} onClose={() => setOpen(null)} label={open?.subject ?? "Newsletter"}>
        {open && (
          <div className="grid md:grid-cols-[1fr_18rem]">
            <div className="bg-sand p-4 md:p-8"><EmailFrame email={open} /></div>
            <div className="p-6">
              <p className="eyebrow text-sage-deep">Newsletter</p>
              <p className="mt-2 font-display text-2xl leading-tight">{open.name}</p>
              <dl className="mt-4 space-y-2 text-sm"><div><dt className="text-forest-soft">Objet</dt><dd>{open.subject}</dd></div><div><dt className="text-forest-soft">Texte d&apos;aperçu</dt><dd>{open.preheader}</dd></div></dl>
              <p className="mt-3 text-xs text-forest-soft">Envoyée uniquement aux personnes inscrites qui ont donné leur accord, avec un lien de désinscription.</p>
              <div className="mt-5"><ValidationBar id={open.id} initial={open.status} /></div>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
