"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { promise } from "@/data/offer";
import { ArrowIcon, CheckIcon } from "@/components/ui/Icons";

const EASE = [0.22, 1, 0.36, 1] as const;

/** La promesse découpée en quatre bulles : pour qui, quel problème, quelle solution, quel résultat. */
const STEPS = [
  { k: "Pour qui", t: "Les 18-35 ans", d: "à la peau mixte, sensible ou à imperfections", tone: "bg-sage-soft" },
  { k: "Le problème", t: "Des soins empilés au hasard", d: "qui se contredisent et irritent", tone: "bg-[#F3E9E2]" },
  { k: "La solution", t: "Le Skin Diag en 2 minutes", d: "compose une routine courte et compatible", tone: "bg-forest text-ivory" },
  { k: "Le résultat", t: "Une peau plus nette", d: "et plus confortable en 4 à 8 semaines", tone: "bg-sand" },
];

/** Mots de la phrase complète mis en valeur par un trait de surligneur animé. */
const MARK = ["18-35 ans", "2 minutes", "routine courte et compatible", "4 à 8 semaines"];

function Highlighted({ text }: { text: string }) {
  const reduce = useReducedMotion();
  const parts = text.split(new RegExp(`(${MARK.map((m) => m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`));
  return (
    <>
      {parts.map((p, i) => MARK.includes(p) ? (
        <motion.span key={i} className="bg-no-repeat [box-decoration-break:clone] [-webkit-box-decoration-break:clone]"
          style={{ backgroundImage: "linear-gradient(transparent 55%, rgba(74, 99, 84, 0.25) 55%)", backgroundSize: reduce ? "100% 100%" : undefined }}
          initial={reduce ? false : { backgroundSize: "0% 100%" }} whileInView={{ backgroundSize: "100% 100%" }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.5 + MARK.indexOf(p) * 0.25, ease: EASE }}>
          {p}
        </motion.span>
      ) : <span key={i}>{p}</span>)}
    </>
  );
}

/** La promesse, juste sous la vidéo d'accueil : lisible en 3 secondes, puis détaillée en une phrase. */
export function PromiseBand() {
  const reduce = useReducedMotion();
  const words = "Arrête d'empiler les soins au hasard.".split(" ");
  return (
    <section aria-labelledby="promesse" className="relative overflow-hidden border-b border-line bg-ivory px-4 py-14 md:px-8 md:py-20">
      <motion.span aria-hidden className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-sage-soft/70 blur-2xl" animate={reduce ? undefined : { y: [0, 24, 0], scale: [1, 1.08, 1] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }} />
      <div className="relative mx-auto max-w-[1400px]">
        <p className="eyebrow text-sage-deep">Notre promesse</p>
        <p className="mt-3 font-display text-[clamp(2rem,4.4vw,4rem)] leading-[1.05]" aria-hidden>
          {words.map((w, i) => (
            <span key={i} className="inline-block overflow-hidden pb-[0.1em] align-bottom">
              <motion.span className="inline-block" initial={reduce ? false : { y: "110%" }} whileInView={{ y: "0%" }} viewport={{ once: true }} transition={{ duration: 0.8, delay: i * 0.07, ease: EASE }}>{w}&nbsp;</motion.span>
            </span>
          ))}
        </p>

        {/* Quatre bulles reliées par une ligne qui se dessine */}
        <div className="relative mt-10">
          <motion.span aria-hidden className="absolute left-[12%] right-[12%] top-1/2 hidden h-px origin-left bg-forest/25 lg:block" initial={reduce ? false : { scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.3, ease: EASE }} />
          <ol className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <motion.li key={s.k} initial={reduce ? false : { opacity: 0, y: 26, scale: 0.94 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.6, delay: 0.25 + i * 0.12, ease: EASE }}
                whileHover={reduce ? undefined : { y: -6, rotate: i % 2 ? 0.6 : -0.6 }} className={`rounded-[28px] p-6 shadow-[0_18px_40px_-28px_rgba(31,51,41,0.45)] ${s.tone}`}>
                <span className="flex items-center gap-2 text-[0.7rem] font-medium uppercase tracking-[0.1em] opacity-70"><span className="grid h-6 w-6 place-items-center rounded-full bg-current/10 font-display text-xs">{i + 1}</span>{s.k}</span>
                <p className="mt-3 font-display text-2xl leading-tight">{s.t}</p>
                <p className="mt-1 text-sm opacity-75">{s.d}</p>
              </motion.li>
            ))}
          </ol>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.1em] text-forest-soft">En une phrase</p>
            <h2 id="promesse" className="mt-2 max-w-4xl text-lg leading-relaxed md:text-xl"><Highlighted text={promise.sentence} /></h2>
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
