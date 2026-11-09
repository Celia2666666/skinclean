"use client";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { useRef } from "react";

/** Étapes de la routine d'un kit : une ligne se dessine entre les numéros au fil du défilement. */
export function KitRoutine({ steps, color }: { steps: string[]; color: string }) {
  const ref = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 60%"] });
  const line = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  return (
    <ol ref={ref} className="relative mt-6 space-y-3">
      {/* Rail + tracé animé, aligné sur le centre des pastilles */}
      <span aria-hidden className="absolute bottom-6 left-[2.25rem] top-6 w-px bg-line" />
      <motion.span aria-hidden className="absolute bottom-6 left-[2.25rem] top-6 w-px origin-top bg-forest" style={reduce ? undefined : { scaleY: line }} />
      {steps.map((s, i) => (
        <motion.li
          key={s}
          className="relative flex items-center gap-4 p-4"
          style={{ background: i % 2 ? "#FFFEFB" : color }}
          initial={reduce ? false : { opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.05 }}
        >
          <motion.span
            className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest font-display text-ivory"
            initial={reduce ? false : { scale: 0.3 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ type: "spring", stiffness: 320, damping: 12, delay: 0.15 + i * 0.05 }}
          >
            {i + 1}
          </motion.span>
          {s}
        </motion.li>
      ))}
    </ol>
  );
}
