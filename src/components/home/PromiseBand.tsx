"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { promise } from "@/data/offer";
import { ArrowIcon, CheckIcon } from "@/components/ui/Icons";

const EASE = [0.22, 1, 0.36, 1] as const;

/** La promesse découpée en quatre bulles : pour qui, quel problème, quelle solution, quel résultat. */
const STEPS = [
  { k: "Pour qui", t: "Les 18-35 ans", d: "à la peau mixte, sensible ou à imperfections", tone: "border border-line bg-white" },
  { k: "Le problème", t: "Des soins empilés au hasard", d: "qui se contredisent et irritent", tone: "border border-line bg-white" },
  { k: "La solution", t: "Le Skin Diag en 2 minutes", d: "compose une routine courte et compatible", tone: "border border-forest bg-forest text-ivory", href: "/skin-diag" },
  { k: "Le résultat", t: "Une peau plus nette", d: "et plus confortable en 4 à 8 semaines", tone: "border border-line bg-white" },
];

/** Mots clés de la phrase complète, mis en gras. */
const MARK = ["18-35 ans", "2 minutes", "routine courte et compatible", "4 à 8 semaines"];

function Highlighted({ text }: { text: string }) {
  const parts = text.split(new RegExp(`(${MARK.map((m) => m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`));
  return <>{parts.map((p, i) => (MARK.includes(p) ? <strong key={i} className="font-semibold text-forest">{p}</strong> : <span key={i}>{p}</span>))}</>;
}

/** La promesse, juste sous la vidéo d'accueil : lisible en 3 secondes, puis détaillée en une phrase. */
export function PromiseBand() {
  const reduce = useReducedMotion();
  const words = "Arrête d'empiler les soins au hasard.".split(" ");
  return (
    <section aria-labelledby="promesse" className="relative overflow-hidden border-b border-line bg-ivory px-4 py-14 md:px-8 md:py-20">
      <div className="relative mx-auto max-w-[1400px]">
        <p className="eyebrow text-sage-deep">Notre promesse</p>
        <p className="mt-3 font-display text-[clamp(2rem,4.4vw,4rem)] leading-[1.05]" aria-hidden>
          {words.map((w, i) => (
            <span key={i} className="inline-block overflow-hidden pb-[0.1em] align-bottom">
              <motion.span className="inline-block" initial={reduce ? false : { y: "110%" }} whileInView={{ y: "0%" }} viewport={{ once: true }} transition={{ duration: 0.8, delay: i * 0.07, ease: EASE }}>{w}&nbsp;</motion.span>
            </span>
          ))}
        </p>

        {/* Quatre cartes : pour qui, problème, solution, résultat */}
        <div className="relative mt-10">
          <ol className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => {
              const body = (
                <>
                  <span className="flex items-center gap-2 text-[0.7rem] font-medium uppercase tracking-[0.1em] opacity-70"><span className="grid h-6 w-6 place-items-center rounded-full bg-current/10 font-display text-xs">{i + 1}</span>{s.k}</span>
                  <p className="mt-3 font-display text-2xl leading-tight">{s.t}</p>
                  <p className="mt-1 text-sm opacity-75">{s.d}</p>
                  {"href" in s && <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 group-hover:underline">Faire mon Skin Diag <ArrowIcon size={14} /></span>}
                </>
              );
              return (
                <motion.li key={s.k} initial={reduce ? false : { opacity: 0, y: 26, scale: 0.94 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.6, delay: 0.25 + i * 0.12, ease: EASE }}
                  whileHover={reduce ? undefined : { y: -4 }} className={`rounded-2xl transition-shadow hover:shadow-[0_14px_30px_-22px_rgba(31,51,41,0.5)] ${s.tone}`}>
                  {"href" in s && s.href ? <Link href={s.href} className="group block h-full p-6">{body}</Link> : <div className="p-6">{body}</div>}
                </motion.li>
              );
            })}
          </ol>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.1em] text-forest-soft">En une phrase</p>
            <h2 id="promesse" className="mt-2 max-w-4xl text-lg leading-relaxed text-forest-soft md:text-xl"><Highlighted text={promise.sentence} /></h2>
          </div>
          <div>
            <ul className="space-y-2 text-sm">
              {promise.proofs.map((p, i) => (
                <motion.li key={p} initial={reduce ? false : { opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.8 + i * 0.1 }} className="flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-forest text-ivory"><CheckIcon size={12} /></span>{p}</motion.li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/offre" className="btn btn-primary">Voir l&apos;offre et les prix <ArrowIcon size={16} /></Link>
              <Link href="/skin-diag" className="btn btn-ghost">Faire mon Skin Diag</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
