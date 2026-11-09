"use client";
import { motion, useInView, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import type { Product } from "@/lib/types";
import { Packshot } from "@/components/product/Packshot";

/**
 * Déballage du kit : les soins tombent un à un dans une boîte ouverte, puis s'écartent en éventail au défilement.
 */
export function KitShowcase({ products, color, discount }: { products: Product[]; color: string; discount: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const spread = useTransform(scrollYProgress, [0.25, 0.65], [0, 1]);
  // Déclenché par la scène (les flacons démarrent hors champ, ils ne peuvent pas déclencher eux-mêmes)
  const play = useInView(ref, { once: true, amount: 0.35 });
  const n = products.length;

  return (
    <div ref={ref} className="relative overflow-hidden" style={{ background: color }}>
      <div className="relative mx-auto h-[300px] max-w-[900px] md:h-[400px]">
        {/* Halo */}
        <div aria-hidden className="absolute left-1/2 top-[55%] h-[70%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.8),transparent)]" />

        {/* Fond de la boîte */}
        <div aria-hidden className="absolute bottom-[10%] left-1/2 h-[26%] w-[min(70%,520px)] -translate-x-1/2 bg-ivory/90 shadow-[0_20px_40px_-24px_rgba(31,51,41,0.45)]">
          <div className="absolute inset-y-0 left-1/2 w-6 -translate-x-1/2 bg-sage" />
        </div>

        {/* Produits */}
        {products.map((p, i) => (
          <KitProduct key={p.id + i} product={p} index={i} count={n} spread={spread} reduce={!!reduce} play={play} />
        ))}

        {/* Face avant de la boîte (passe devant les flacons) */}
        <motion.div
          aria-hidden
          className="absolute bottom-[4%] left-1/2 z-20 h-[16%] w-[min(74%,550px)] -translate-x-1/2 bg-forest"
          initial={reduce ? false : { scaleY: 0, opacity: 0 }}
          animate={play || reduce ? { scaleY: 1, opacity: 1 } : undefined}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: "bottom" }}
        >
          <div className="absolute inset-y-0 left-1/2 w-6 -translate-x-1/2 bg-sage" />
          <p className="absolute inset-0 grid place-items-center font-display text-sm uppercase tracking-[0.3em] text-ivory/90 md:text-base">skinclean</p>
        </motion.div>

        {/* Pastille remise */}
        {discount > 0 && (
          <motion.div
            className="absolute right-[6%] top-[10%] grid h-20 w-20 place-items-center rounded-full bg-forest text-center font-display text-xl text-ivory md:right-[12%] md:h-24 md:w-24 md:text-2xl"
            initial={reduce ? false : { scale: 0, rotate: -120 }}
            animate={play || reduce ? { scale: 1, rotate: -8 } : undefined}
            transition={{ type: "spring", stiffness: 180, damping: 12, delay: 0.25 + n * 0.12 }}
          >
            -{discount} %
          </motion.div>
        )}
      </div>
    </div>
  );
}

function KitProduct({ product, index, count, spread, reduce, play }: { product: Product; index: number; count: number; spread: ReturnType<typeof useTransform<number, number>>; reduce: boolean; play: boolean }) {
  const mid = (count - 1) / 2;
  const offset = index - mid; // -1.5 … 1.5 pour 4 soins
  const step = Math.min(17, 64 / Math.max(1, count - 1));
  // Position dans la boîte puis éventail au défilement
  const left = useTransform(spread, (v) => `calc(50% + ${offset * step * (0.55 + 0.45 * v)}%)`);
  const rotate = useTransform(spread, [0, 1], [offset * 3, offset * 9]);
  const y = useTransform(spread, [0, 1], [0, Math.abs(offset) * 14]);
  return (
    <motion.div
      className="absolute bottom-[14%] left-1/2 h-[64%] w-[22%] max-w-[170px] -translate-x-1/2"
      style={reduce ? { left: `calc(50% + ${offset * step}%)` } : { left, rotate, y, zIndex: 10 - Math.round(Math.abs(offset) * 2) }}
    >
      <motion.div
        className="h-full w-full"
        initial={reduce ? false : { y: -420, opacity: 0, rotate: offset * 25 }}
        animate={play || reduce ? { y: 0, opacity: 1, rotate: 0 } : undefined}
        transition={{ type: "spring", stiffness: 160, damping: 14, delay: 0.15 + index * 0.12 }}
      >
        <Packshot product={product} className="h-full w-full drop-shadow-[0_16px_16px_rgba(31,51,41,0.18)]" showTag={false} sizes="170px" />
      </motion.div>
    </motion.div>
  );
}
