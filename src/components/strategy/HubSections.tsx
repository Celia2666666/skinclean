"use client";
import { AnimatePresence, animate, motion, useInView, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import type { Post } from "@/lib/hub/types";
import { VisualThumb } from "@/components/hub/design/DesignPreview";
import { hubData as hub, type HubBlock as Block, type HubSection } from "@/data/hub-public";

const EASE = [0.22, 1, 0.36, 1] as const;

const KIND: Record<string, { label: string; cls: string }> = {
  fait: { label: "Fait vérifié", cls: "bg-[#E3EFE6] text-[#2E5E3E]" },
  hypothese: { label: "Hypothèse à tester", cls: "bg-[#FFF3D6] text-[#7A5B00]" },
  proposition: { label: "Choix de l'équipe", cls: "bg-[#E2ECF8] text-[#1F4E86]" },
  texte: { label: "Note", cls: "bg-cream text-forest-soft" },
};

export function KindBadge({ kind }: { kind: string }) {
  const k = KIND[kind] ?? KIND.texte;
  return <span className={clsx("inline-block rounded-full px-2 py-0.5 text-[0.65rem] font-medium", k.cls)}>{k.label}</span>;
}

export function KindLegend() {
  return <p className="flex flex-wrap items-center gap-2 text-xs text-forest-soft">Chaque information est qualifiée : <KindBadge kind="fait" /> <KindBadge kind="hypothese" /> <KindBadge kind="proposition" /></p>;
}

/** Cartes de blocs qui apparaissent en cascade, légère inclinaison 3D au survol. */
export function BlockGrid({ blocks, cols = 3, dark }: { blocks: Block[]; cols?: 2 | 3; dark?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <div className={clsx("grid gap-4 sm:grid-cols-2", cols === 3 && "lg:grid-cols-3")}>
      {blocks.map((b, i) => (
        <motion.div
          key={(b.title ?? "") + i}
          initial={reduce ? false : { opacity: 0, y: 34, rotateX: 8 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          whileHover={reduce ? undefined : { y: -6 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.7, delay: (i % 3) * 0.08, ease: EASE }}
          className={clsx("flex flex-col p-6", dark ? "bg-forest text-ivory" : "border border-line bg-ivory")}
        >
          <KindBadge kind={b.kind} />
          {b.title && <p className="mt-3 font-display text-xl leading-tight">{b.title}</p>}
          <p className={clsx("mt-2 flex-1 text-sm leading-relaxed", dark ? "text-ivory/75" : "text-forest-soft")}>{b.text}</p>
          {b.source && <p className={clsx("mt-4 border-t pt-3 text-[0.7rem]", dark ? "border-ivory/15 text-ivory/55" : "border-line text-forest-soft")}>Source : {b.source}</p>}
        </motion.div>
      ))}
    </div>
  );
}

/**
 * Explorateur : la liste des points à gauche, une grande carte animée à droite.
 * Les points défilent seuls tant que la section est à l'écran ; un clic reprend la main.
 */
export function BlockExplorer({ blocks, dark, interval = 6500 }: { blocks: Block[]; dark?: boolean; interval?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-25% 0px" });
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!auto || !inView || reduce || blocks.length < 2) return;
    const t = setTimeout(() => setI((x) => (x + 1) % blocks.length), interval);
    return () => clearTimeout(t);
  }, [i, auto, inView, reduce, blocks.length, interval]);
  const b = blocks[i];
  const pick = (k: number) => { setAuto(false); setI(k); };
  return (
    <div ref={ref} className="grid gap-4 md:grid-cols-[minmax(0,19rem)_1fr]">
      <ol className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-col md:gap-1 md:overflow-visible md:px-0">
        {blocks.map((x, k) => (
          <li key={(x.title ?? "") + k} className="shrink-0">
            <button type="button" onClick={() => pick(k)} aria-pressed={k === i} className={clsx("relative flex w-full items-center gap-3 overflow-hidden rounded-md px-4 py-3 text-left text-sm transition", k === i ? (dark ? "text-forest" : "text-ivory") : dark ? "bg-forest/90 text-ivory/80 hover:bg-forest" : "bg-ivory text-forest hover:bg-sage-soft")}>
              {k === i && <motion.span layoutId={`explorer-${blocks[0]?.title}`} className={clsx("absolute inset-0", dark ? "bg-sage" : "bg-forest")} transition={{ type: "spring", stiffness: 380, damping: 34 }} />}
              <span className="relative font-display text-lg tabular-nums opacity-60">{String(k + 1).padStart(2, "0")}</span>
              <span className="relative whitespace-nowrap font-medium md:whitespace-normal">{x.title ?? `Point ${k + 1}`}</span>
              {k === i && auto && inView && !reduce && <motion.span key={`p${i}`} className={clsx("absolute bottom-0 left-0 h-0.5", dark ? "bg-forest" : "bg-sage")} initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: interval / 1000, ease: "linear" }} />}
            </button>
          </li>
        ))}
      </ol>
      <div className={clsx("relative min-h-[17rem] overflow-hidden p-7 md:p-10", dark ? "bg-forest text-ivory" : "bg-sage-soft")}>
        <motion.span aria-hidden className={clsx("pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full border", dark ? "border-ivory/15" : "border-forest/10")} animate={reduce ? undefined : { rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} />
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.45, ease: EASE }} className="relative">
            <div className="flex items-center gap-3"><span className={clsx("font-display text-6xl leading-none md:text-7xl", dark ? "text-sage/40" : "text-forest/15")}>{String(i + 1).padStart(2, "0")}</span><KindBadge kind={b.kind} /></div>
            {b.title && <p className="mt-4 font-display text-3xl leading-tight md:text-4xl">{b.title}</p>}
            <p className={clsx("mt-4 max-w-2xl text-[0.95rem] leading-relaxed", dark ? "text-ivory/80" : "text-forest/80")}>
              {b.text.split(" · ").length > 2
                ? b.text.split(" · ").map((t, k) => <motion.span key={k} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + k * 0.06 }} className="mb-1.5 flex gap-2"><span className={clsx("mt-2 h-1.5 w-1.5 shrink-0 rounded-full", dark ? "bg-sage" : "bg-forest")} />{t}</motion.span>)
                : b.text}
            </p>
            {b.source && <p className={clsx("mt-5 inline-block rounded-full px-3 py-1 text-[0.7rem]", dark ? "bg-ivory/10 text-ivory/70" : "bg-ivory text-forest-soft")}>Source : {b.source}</p>}
          </motion.div>
        </AnimatePresence>
        <div className="absolute bottom-4 right-5 flex gap-2">
          <button type="button" aria-label="Point précédent" onClick={() => pick((i - 1 + blocks.length) % blocks.length)} className={clsx("grid h-9 w-9 place-items-center rounded-full", dark ? "bg-ivory/10 hover:bg-ivory/20" : "bg-ivory hover:bg-forest hover:text-ivory")}>←</button>
          <button type="button" aria-label="Point suivant" onClick={() => pick((i + 1) % blocks.length)} className={clsx("grid h-9 w-9 place-items-center rounded-full", dark ? "bg-ivory/10 hover:bg-ivory/20" : "bg-ivory hover:bg-forest hover:text-ivory")}>→</button>
        </div>
      </div>
    </div>
  );
}

/** Plusieurs stratégies : grandes cartes-onglets, puis l'explorateur de la stratégie choisie. */
export function StrategyTabs({ sections }: { sections: HubSection[] }) {
  const [id, setId] = useState(sections[0].id);
  const s = sections.find((x) => x.id === id)!;
  return (
    <div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {sections.map((x, k) => (
          <motion.button key={x.id} type="button" onClick={() => setId(x.id)} aria-pressed={x.id === id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: k * 0.06 }} whileHover={{ y: -4 }}
            className={clsx("relative overflow-hidden p-5 text-left transition-colors", x.id === id ? "bg-forest text-ivory" : "border border-line bg-ivory")}>
            <span className={clsx("font-display text-4xl", x.id === id ? "text-sage" : "text-forest/20")}>{String(k + 1).padStart(2, "0")}</span>
            <span className="mt-2 block font-display text-xl leading-tight">{x.title.replace(/^Stratégie (de |d')/, "").replace(/^./, (c) => c.toUpperCase())}</span>
            <span className={clsx("mt-1 block text-xs", x.id === id ? "text-ivory/70" : "text-forest-soft")}>{x.summary}</span>
          </motion.button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={s.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="mt-4">
          <BlockExplorer blocks={s.blocks} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** SWOT : 4 quadrants qui s'ouvrent depuis le centre. */
export function SwotGrid({ section }: { section: HubSection }) {
  const reduce = useReducedMotion();
  const tone = ["bg-forest text-ivory", "bg-sand", "bg-sage-soft", "bg-[#F3E9E2]"];
  const letter = ["S", "W", "O", "T"];
  const origin = ["100% 100%", "0% 100%", "100% 0%", "0% 0%"];
  return (
    <div className="grid gap-2 md:grid-cols-2">
      {section.blocks.map((b, i) => (
        <motion.div
          key={b.title}
          style={{ transformOrigin: origin[i] }}
          initial={reduce ? false : { opacity: 0, scale: 0.85 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, delay: i * 0.1, ease: EASE }}
          className={clsx("relative overflow-hidden p-6 md:p-8", tone[i])}
        >
          <span className="pointer-events-none absolute -right-2 -top-6 font-display text-[9rem] leading-none opacity-10">{letter[i]}</span>
          <div className="flex items-center gap-2"><p className="font-display text-2xl">{b.title}</p><KindBadge kind={b.kind} /></div>
          <ul className="mt-4 space-y-2 text-sm">
            {b.text.split(" · ").map((t) => <li key={t} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-50" />{t}</li>)}
          </ul>
        </motion.div>
      ))}
    </div>
  );
}

/** Parcours de découverte : une ligne se dessine au fil du scroll et allume chaque étape. */
export function Funnel({ section }: { section: HubSection }) {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 55%"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  return (
    <ol ref={ref} className="relative space-y-4 pl-10 md:pl-14">
      <span className="absolute bottom-2 left-[15px] top-2 w-px bg-line md:left-[23px]" />
      <motion.span style={{ scaleY }} className="absolute bottom-2 left-[15px] top-2 w-px origin-top bg-forest md:left-[23px]" />
      {section.blocks.map((b, i) => (
        <motion.li key={b.title} initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7, ease: EASE }} className="relative">
          <span className="absolute -left-10 top-4 grid h-8 w-8 place-items-center rounded-full bg-forest text-xs font-semibold text-ivory md:-left-14 md:h-12 md:w-12 md:text-sm">{i + 1}</span>
          <div className="border border-line bg-ivory p-5" style={{ marginRight: `${(section.blocks.length - 1 - i) * 3}%` }}>
            <p className="font-display text-xl">{b.title?.replace(/^\d\.\s*/, "")}</p>
            <p className="mt-1 text-sm text-forest-soft">{b.text}</p>
          </div>
        </motion.li>
      ))}
    </ol>
  );
}

/** Ligne éditoriale : chaque pilier avec sa part, barre qui se remplit. */
export function PillarBars({ section }: { section: HubSection }) {
  const pillars = section.blocks.filter((b) => /\(\d+ %\)/.test(b.title ?? ""));
  const rules = section.blocks.find((b) => !/\(\d+ %\)/.test(b.title ?? ""));
  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
      <ul className="space-y-5">
        {pillars.map((b, i) => {
          const pct = Number(/\((\d+) %\)/.exec(b.title!)![1]);
          const name = b.title!.replace(/ \(\d+ %\)/, "").replace(/^Pilier \d — /, "");
          return (
            <li key={b.title}>
              <div className="flex items-baseline justify-between gap-4"><p className="font-display text-xl">{name}</p><p className="font-display text-2xl tabular-nums"><Counter to={pct} />&nbsp;%</p></div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-sage-soft">
                <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct * 2.4}%` }} viewport={{ once: true }} transition={{ duration: 1.2, delay: i * 0.12, ease: EASE }} className="h-full rounded-full bg-forest" />
              </div>
              <p className="mt-1.5 text-sm text-forest-soft">{b.text}</p>
            </li>
          );
        })}
      </ul>
      {rules && (
        <div className="self-start bg-forest p-6 text-ivory md:p-8">
          <p className="eyebrow text-sage">{rules.title}</p>
          <ul className="mt-4 space-y-2.5 text-sm">{rules.text.split(" · ").map((t) => <li key={t} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />{t}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

/** Compteur qui défile jusqu'à sa valeur quand il entre à l'écran. */
export function Counter({ to, className }: { to: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!inView || !ref.current) return;
    const el = ref.current;
    if (reduce) { el.textContent = to.toLocaleString("fr-FR"); return; }
    const c = animate(0, to, { duration: 1.4, ease: EASE, onUpdate: (v) => { el.textContent = Math.round(v).toLocaleString("fr-FR"); } });
    return () => c.stop();
  }, [inView, to, reduce]);
  return <span ref={ref} className={className}>{to.toLocaleString("fr-FR")}</span>;
}

const frMonth = (ym: string, long = true) => new Date(`${ym}-01T12:00`).toLocaleDateString("fr-FR", { month: long ? "long" : "short", year: "numeric" });
const frDate = (d: string) => new Date(`${d}T12:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/** Objectifs SMART : grandes valeurs animées. */
export function ObjectiveCards() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {hub.objectives.map((o, i) => (
        <motion.div key={o.id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: (i % 5) * 0.07, ease: EASE }}
          className={clsx("flex flex-col p-5", i % 3 === 0 ? "bg-forest text-ivory" : "border border-line bg-ivory")}>
          <p className={clsx("text-[0.7rem] uppercase tracking-[0.08em]", i % 3 === 0 ? "text-sage" : "text-sage-deep")}>{o.axis}</p>
          <p className="mt-2 font-display text-4xl tabular-nums"><Counter to={o.target} /><span className="ml-1 text-base">{o.unit === "%" ? "%" : ""}</span></p>
          <p className={clsx("text-xs", i % 3 === 0 ? "text-ivory/60" : "text-forest-soft")}>{o.unit !== "%" && o.unit}</p>
          <p className="mt-3 flex-1 text-sm">{o.title}</p>
          <p className={clsx("mt-3 border-t pt-2 text-[0.7rem]", i % 3 === 0 ? "border-ivory/15 text-ivory/60" : "border-line text-forest-soft")}>Échéance : {frDate(o.deadline)} · {o.owner}</p>
        </motion.div>
      ))}
    </div>
  );
}

/** Plan annuel : frise horizontale à faire glisser, barre de progression du défilement. */
export function RoadmapTimeline() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollXProgress } = useScroll({ container: ref });
  const total = hub.roadmap.reduce((a, r) => a + r.budget, 0);
  const max = Math.max(...hub.roadmap.map((r) => r.budget));
  const [open, setOpen] = useState(0);
  const m = hub.roadmap[open];
  return (
    <div>
      <div ref={ref} className="no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0">
        {hub.roadmap.map((r, i) => (
          <button key={r.month} type="button" onClick={() => setOpen(i)} aria-pressed={open === i}
            className={clsx("group relative flex w-44 shrink-0 snap-start flex-col overflow-hidden p-4 text-left transition-colors", open === i ? "bg-forest text-ivory" : "bg-ivory hover:bg-sage-soft", "border border-line")}>
            <span className="text-[0.7rem] uppercase tracking-[0.08em] opacity-70">{frMonth(r.month, false)}</span>
            <span className="mt-1 min-h-[3.2em] font-display text-lg leading-tight">{r.theme}</span>
            <span className="mt-4 flex h-14 items-end"><motion.span initial={{ height: 0 }} whileInView={{ height: `${(r.budget / max) * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.9, delay: i * 0.05, ease: EASE }} className={clsx("w-full", open === i ? "bg-sage" : "bg-sage-deep/30")} /></span>
            <span className="mt-2 text-xs tabular-nums opacity-80">{r.budget.toLocaleString("fr-FR")} € · {r.posts} contenus</span>
          </button>
        ))}
      </div>
      <div className="h-0.5 bg-line"><motion.div style={{ scaleX: scrollXProgress }} className="h-full origin-left bg-forest" /></div>
      <AnimatePresence mode="wait">
        <motion.div key={m.month} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }} className="mt-6 grid gap-4 bg-sage-soft p-6 md:grid-cols-[1.2fr_1fr_1fr] md:p-8">
          <div>
            <p className="eyebrow text-sage-deep">{frMonth(m.month)}</p>
            <p className="mt-1 font-display text-3xl">{m.theme}</p>
            <p className="mt-2 text-sm text-forest-soft">{m.objective}</p>
            <p className="mt-4 text-sm"><b className="font-medium">Campagnes :</b> {m.campaigns.join(", ")}</p>
            <p className="mt-1 text-sm"><b className="font-medium">Réseaux :</b> {m.networks.join(", ")}</p>
          </div>
          <dl className="space-y-3 text-sm">
            <div><dt className="font-medium">Référencement (SEO)</dt><dd className="text-forest-soft">{m.seo.join(" · ")}</dd></div>
            <div><dt className="font-medium">Publicité (SEA)</dt><dd className="text-forest-soft">{m.sea.join(" · ") || "Aucune"}</dd></div>
            <div><dt className="font-medium">Newsletters</dt><dd className="text-forest-soft">{m.newsletters.join(" · ")}</dd></div>
          </dl>
          <dl className="space-y-3 text-sm">
            <div><dt className="font-medium">Objectifs du mois</dt><dd className="text-forest-soft">{m.kpis.join(" · ")}</dd></div>
            <div><dt className="font-medium">Livrables</dt><dd className="text-forest-soft">{m.deliverables.join(" · ")}</dd></div>
            <div><dt className="font-medium">Budget prévu</dt><dd className="font-display text-2xl">{m.budget.toLocaleString("fr-FR")} €</dd></div>
          </dl>
        </motion.div>
      </AnimatePresence>
      <p className="mt-3 text-xs text-forest-soft">Budget marketing prévisionnel sur 12 mois : {total.toLocaleString("fr-FR")} € (montants planifiés, rien n&apos;a été dépensé). Clique sur un mois pour voir le détail.</p>
    </div>
  );
}

/** Personas : onglets, la fiche glisse d'un profil à l'autre. */
export function PersonaDeck() {
  const [i, setI] = useState(0);
  const p = hub.personas[i];
  const rows: [string, string[]][] = [["Sa peau", p.skin], ["Ce qui la motive", p.motivations], ["Ce qui la freine", p.frustrations], ["Sa vie en ligne", p.digital], ["Ce qu'on lui dit", p.messages]];
  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist">
        {hub.personas.map((x, k) => (
          <button key={x.id} type="button" role="tab" aria-selected={k === i} onClick={() => setI(k)} className="relative rounded-full px-4 py-2 text-sm">
            {k === i && <motion.span layoutId="persona-pill" className="absolute inset-0 rounded-full bg-forest" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
            <span className={clsx("relative", k === i ? "text-ivory" : "text-forest")}>{x.name}, {x.age.split(" · ")[0]}</span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.article key={p.id} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.4, ease: EASE }} className="mt-5 grid gap-6 border border-line bg-ivory p-6 md:grid-cols-[14rem_1fr] md:p-8">
          <div>
            <motion.span initial={{ scale: 0.6, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 18 }} className="grid h-24 w-24 place-items-center rounded-full font-display text-4xl" style={{ background: p.color }}>{p.avatar}</motion.span>
            <p className="mt-4 font-display text-3xl">{p.name}</p>
            <p className="text-sm text-forest-soft">{p.age}</p>
            <p className="mt-3 text-sm">{p.summary}</p>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            {rows.map(([k, v]) => (
              <div key={k} className="border-t border-line pt-3"><dt className="font-medium">{k}</dt><dd><ul className="mt-1 space-y-1 text-sm text-forest-soft">{v.map((t) => <li key={t}>· {t}</li>)}</ul></dd></div>
            ))}
          </dl>
        </motion.article>
      </AnimatePresence>
    </div>
  );
}

const CAMP_STATUS: Record<string, string> = { active: "En cours", planifiee: "Planifiée", bibliotheque: "Prête, à lancer" };

/** Campagnes : cartes colorées en défilement, la carte survolée s'agrandit. */
export function CampaignStrip() {
  const reduce = useReducedMotion();
  return (
    <div className="no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-4 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0">
      {hub.campaigns.map((c, i) => (
        <motion.article key={c.id} initial={reduce ? false : { opacity: 0, x: 60 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: Math.min(i, 4) * 0.08, ease: EASE }}
          whileHover={reduce ? undefined : { y: -8 }} className="flex w-[19rem] shrink-0 snap-start flex-col border border-line bg-ivory">
          <div className="relative h-24 overflow-hidden" style={{ background: c.color }}>
            <motion.span className="absolute -right-6 -top-10 h-36 w-36 rounded-full bg-white/20" animate={reduce ? undefined : { scale: [1, 1.15, 1] }} transition={{ duration: 5, repeat: Infinity, delay: i * 0.3 }} />
            <span className="absolute bottom-3 left-4 rounded-full bg-ivory/90 px-2.5 py-0.5 text-[0.7rem] font-medium">{CAMP_STATUS[c.status] ?? c.status}</span>
          </div>
          <div className="flex flex-1 flex-col p-5">
            <p className="font-display text-2xl leading-tight">{c.name}</p>
            <p className="mt-2 text-sm italic text-forest-soft">{c.concept}</p>
            <p className="mt-3 text-sm">{c.objective}</p>
            <p className="mt-3 text-xs text-forest-soft"><b className="font-medium text-forest">Cible :</b> {c.target}</p>
            <p className="mt-1 text-xs text-forest-soft"><b className="font-medium text-forest">Canaux :</b> {c.channels.join(", ")}</p>
            <ul className="mt-4 flex-1 space-y-1 border-t border-line pt-3 text-xs">{c.kpis.map((k) => <li key={k.label} className="flex justify-between gap-3"><span className="text-forest-soft">{k.label}</span><b className="font-medium">{k.target}</b></li>)}</ul>
            <p className="mt-3 text-xs text-forest-soft">Budget prévu : <b className="font-medium text-forest">{c.budget.toLocaleString("fr-FR")} €</b></p>
          </div>
        </motion.article>
      ))}
    </div>
  );
}

const AD_PLATFORM: Record<string, string> = { google_ads: "Google Ads", meta_ads: "Meta Ads", tiktok_ads: "TikTok Ads" };
const AD_STATUS: Record<string, string> = { brouillon: "Brouillon", a_valider: "À valider", prete: "Prête" };

/** Publicités préparées (jamais diffusées) : aperçu de l'annonce. */
export function AdsGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {hub.ads.map((a, i) => {
        const cr = a.creatives[0] as { headline?: string; text?: string; description?: string; cta?: string; visual?: Post["visual"] } | undefined;
        return (
          <motion.div key={a.id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55, delay: (i % 4) * 0.07, ease: EASE }} className="flex flex-col border border-line bg-ivory p-5">
            <div className="flex items-center justify-between gap-2 text-[0.7rem]"><span className="chip bg-forest text-ivory">{AD_PLATFORM[a.platform]}</span><span className="text-forest-soft">{AD_STATUS[a.status] ?? a.status}</span></div>
            <p className="mt-3 font-medium">{a.name}</p>
            <p className="mt-1 text-xs text-forest-soft">{a.objective}</p>
            {cr && (
              <div className="mt-4 flex-1 rounded-md bg-cream p-3 text-xs">
                <p className="text-[0.6rem] uppercase tracking-wide text-forest-soft">Sponsorisé · skinclean</p>
                {cr.visual && <div className="mt-2 overflow-hidden rounded"><VisualThumb visual={cr.visual} width={260} className={cr.visual.kind === "video" ? "max-h-56" : undefined} /></div>}
                {cr.headline && <p className="mt-1 font-medium text-[#1a0dab]">{cr.headline}</p>}
                {cr.text && <p className="mt-1 text-forest-soft">{cr.text}</p>}
                {cr.cta && <span className="mt-2 inline-block rounded bg-forest px-2 py-1 text-[0.65rem] text-ivory">{cr.cta}</span>}
              </div>
            )}
            <p className="mt-3 text-[0.7rem] text-forest-soft">Cible : {a.audience.age} ans, {a.audience.locations}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
