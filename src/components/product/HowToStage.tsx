"use client";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import type { Product } from "@/lib/types";
import { Packshot } from "./Packshot";

type Step = { t: string; d: string };
type Effect = "mist" | "drops" | "swirl" | "bubbles" | "sparkle";

/** Effet « Applique » selon la galénique du soin. */
function effectFor(p: Product): Effect {
  if (p.pack === "mist" || /pschit|vaporis/i.test(p.usage)) return "mist";
  if (p.texture === "foam") return "bubbles";
  if (["drops", "liquid", "aqueous"].includes(p.texture) || p.pack === "dropper") return "drops";
  if (["cream", "balm", "gel", "mask"].includes(p.texture)) return "swirl";
  return "sparkle";
}

/**
 * « Comment l'utiliser ? » mis en scène : la zone produit reste fixe pendant que l'on fait défiler les 3 étapes.
 * Chaque étape change la pose du flacon (arrivée → application → éclat), les ingrédients clés gravitent autour.
 */
export function HowToStage({ product: p, steps, footer }: { product: Product; steps: Step[]; footer: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 22 });
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setActive(v < 0.34 ? 0 : v < 0.67 ? 1 : 2));

  // Pose du flacon le long du défilement
  const rotate = useTransform(smooth, [0, 0.33, 0.5, 0.67, 1], [-6, 0, 16, 4, -2]);
  const y = useTransform(smooth, [0, 0.33, 0.67, 1], [40, 0, -10, 0]);
  const scale = useTransform(smooth, [0, 0.33, 0.67, 1], [0.86, 1, 1.02, 1.06]);
  const halo = useTransform(smooth, [0, 0.5, 1], [0.7, 1, 1.15]);
  const orbit = useTransform(smooth, [0, 1], [0, 220]);
  const counter = useTransform(orbit, (x) => -x); // garde les étiquettes à l'horizontale
  const effect = effectFor(p);
  const ingredients = p.keyIngredients.slice(0, 3);

  return (
    <section className="mt-16 bg-sky-soft">
      <div ref={ref} className="relative mx-auto max-w-[1400px] px-4 md:h-[260vh] md:px-8">
        <div className="grid items-center gap-10 py-20 md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:grid-cols-2 md:py-0">
          {/* Scène produit */}
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[520px] overflow-hidden md:max-h-[78vh]" style={{ background: p.color.bg }}>
            {/* Halo */}
            <motion.div aria-hidden style={reduce ? undefined : { scale: halo }} className="absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.95),rgba(216,223,212,0.55),transparent)]" />
            {/* Anneau de l'étape « Sublime » */}
            <AnimatePresence>
              {active === 2 && !reduce && (
                <motion.div aria-hidden initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.2 }} transition={{ duration: 0.7 }} className="absolute left-1/2 top-1/2 aspect-square w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-forest/20">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <motion.span key={i} className="absolute h-2 w-2 rounded-full bg-sage-deep" style={{ left: `${50 + 50 * Math.cos((i / 6) * Math.PI * 2)}%`, top: `${50 + 50 * Math.sin((i / 6) * Math.PI * 2)}%` }} animate={{ scale: [0, 1.2, 0], opacity: [0, 1, 0] }} transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.25 }} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Ingrédients clés en orbite */}
            {!reduce && ingredients.length > 0 && (
              <motion.div aria-hidden style={{ rotate: orbit }} className="absolute left-1/2 top-1/2 aspect-square w-[66%] -translate-x-1/2 -translate-y-1/2">
                {ingredients.map((k, i) => {
                  const a = (i / ingredients.length) * Math.PI * 2 - Math.PI / 2;
                  return (
                    <motion.span key={k.name} style={{ left: `${50 + 50 * Math.cos(a)}%`, top: `${50 + 50 * Math.sin(a)}%`, rotate: counter }} className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap border border-line bg-ivory/90 px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-[0.06em] text-forest shadow-[var(--shadow-soft)] backdrop-blur">
                      {shortName(k.name)}
                    </motion.span>
                  );
                })}
              </motion.div>
            )}

            {/* Flacon */}
            <motion.div style={reduce ? undefined : { rotate, y, scale }} className="absolute inset-x-[22%] bottom-[12%] top-[12%]">
              <div className="h-full w-full animate-float-slow">
                <Packshot product={p} className="h-full w-full drop-shadow-[0_24px_24px_rgba(31,51,41,0.18)]" showTag={false} sizes="(max-width:768px) 70vw, 30vw" />
              </div>
            </motion.div>
            <div aria-hidden className="absolute bottom-[9%] left-1/2 h-4 w-[34%] -translate-x-1/2 rounded-[50%] bg-forest/15 blur-md" />

            {/* Effet d'application */}
            <AnimatePresence>{active === 1 && !reduce && <ApplyEffect key={effect} effect={effect} />}</AnimatePresence>

            {/* Étape en cours */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
              <span className="chip bg-ivory/90">Étape {active + 1} / {steps.length}</span>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-ivory/70">
                <motion.div className="h-full bg-forest" style={{ scaleX: smooth, transformOrigin: "left" }} />
              </div>
            </div>
          </div>

          {/* Étapes */}
          <div>
            <p className="eyebrow text-sage-deep">Tutoriel</p>
            <h2 className="mt-3 font-display text-5xl">Comment l&apos;utiliser ?</h2>
            <ol className="mt-8 space-y-6">
              {steps.map((s, i) => {
                const on = active === i;
                return (
                  <motion.li key={s.t} animate={{ opacity: on || reduce ? 1 : 0.4, x: on ? 8 : 0 }} transition={{ duration: 0.4 }} className="flex gap-5">
                    <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full font-display text-xl transition-colors duration-500 ${on ? "bg-forest text-ivory" : "bg-ivory"}`}>{i + 1}</span>
                    <div><p className="font-display text-2xl">{s.t}</p><p className="mt-1 text-forest-soft">{s.d}</p></div>
                  </motion.li>
                );
              })}
            </ol>
            {footer}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Nom court d'ingrédient pour les étiquettes : sans dosage ni parenthèse, et le mot le plus parlant s'il est long. */
function shortName(name: string) {
  const clean = name.replace(/\s*\(.*?\)/g, "").replace(/\s+\d.*$/, "").trim();
  if (clean.length <= 14) return clean;
  const words = clean.split(/\s+/).filter((w) => !/^(de|du|des|d'|la|le|et|à|acide|extrait|huile|eau)$/i.test(w));
  const best = words.sort((a, b) => b.length - a.length)[0] ?? clean;
  return best.charAt(0).toUpperCase() + best.slice(1);
}

function ApplyEffect({ effect }: { effect: Effect }) {
  const n = effect === "mist" ? 26 : effect === "bubbles" ? 12 : 9;
  return (
    <motion.div aria-hidden initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0">
      {effect === "mist" && (
        <motion.span className="absolute left-[60%] top-[8%] h-[26%] w-[36%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(185,206,193,0.55),transparent)] blur-md" animate={{ scale: [0.4, 1.1, 1.3], opacity: [0, 0.9, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }} />
      )}
      {Array.from({ length: n }, (_, i) => {
        const r = (k: number) => ((Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1; // pseudo-aléatoire stable
        if (effect === "mist") {
          // Brume : nuage de fines gouttelettes qui part du diffuseur vers la droite
          const size = 3 + r(6) * 5;
          return <motion.span key={i} className="absolute rounded-full border border-white/80 bg-[#B9CEC1]/70 shadow-[0_0_8px_rgba(255,255,255,0.9)]" style={{ left: "58%", top: "17%", width: size, height: size }} animate={{ x: [0, 50 + r(1) * 140], y: [0, -40 + r(2) * 70], opacity: [0, 1, 0], scale: [0.3, 1 + r(3), 0.7] }} transition={{ duration: 1.2 + r(4), repeat: Infinity, delay: r(5) * 1.1, ease: "easeOut" }} />;
        }
        if (effect === "drops") {
          return <motion.span key={i} className="absolute h-3 w-2 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] bg-[#E8D9A8]/90 shadow-[inset_0_-2px_3px_rgba(0,0,0,0.12)]" style={{ left: `${44 + r(1) * 14}%`, top: "30%" }} animate={{ y: [0, 120 + r(2) * 60], opacity: [0, 1, 0], scale: [0.6, 1, 0.8] }} transition={{ duration: 1.3 + r(3) * 0.6, repeat: Infinity, delay: r(4) * 1.4, ease: "easeIn" }} />;
        }
        if (effect === "bubbles") {
          return <motion.span key={i} className="absolute rounded-full border border-white bg-white/40" style={{ left: `${30 + r(1) * 40}%`, bottom: "18%", width: 8 + r(2) * 16, height: 8 + r(2) * 16 }} animate={{ y: [0, -(160 + r(3) * 140)], x: [0, (r(4) - 0.5) * 40], opacity: [0, 1, 0] }} transition={{ duration: 2 + r(5), repeat: Infinity, delay: r(6) * 1.5, ease: "easeOut" }} />;
        }
        if (effect === "swirl") {
          return <motion.span key={i} className="absolute h-6 w-10 rounded-[50%] bg-white/80 blur-[1px]" style={{ left: `${30 + r(1) * 40}%`, top: `${35 + r(2) * 35}%` }} animate={{ scale: [0, 1, 0.8], rotate: [0, 120 + r(3) * 120], opacity: [0, 0.9, 0] }} transition={{ duration: 2.2, repeat: Infinity, delay: r(4) * 1.6 }} />;
        }
        return <motion.span key={i} className="absolute h-2 w-2 rotate-45 bg-sage-deep" style={{ left: `${25 + r(1) * 50}%`, top: `${20 + r(2) * 60}%` }} animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }} transition={{ duration: 1.6, repeat: Infinity, delay: r(3) * 1.4 }} />;
      })}
    </motion.div>
  );
}
