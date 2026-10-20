"use client";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { LeafIcon } from "@/components/ui/Icons";

/** Jauge circulaire de feuilles, avec compteur animé. */
export function LeafGauge({ value, max, label, size = 240 }: { value: number; max: number; label?: string; size?: number }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const c = animate(mv, value, { duration: 1.6, ease: [0.22, 1, 0.36, 1] });
    const u = rounded.on("change", setDisplay);
    return () => { c.stop(); u(); };
  }, [value, mv, rounded]);
  const r = 44;
  const C = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 1;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#FFFEFB" strokeWidth="7" />
        <motion.circle cx="50" cy="50" r={r} fill="none" stroke="url(#leafgrad)" strokeWidth="7" strokeLinecap="round" strokeDasharray={C} initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - pct) }} transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }} />
        <defs><linearGradient id="leafgrad" x1="0" x2="1"><stop offset="0" stopColor="#9CB8A6" /><stop offset="1" stopColor="#24392F" /></linearGradient></defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <motion.span animate={{ rotate: [0, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="text-sage-deep"><LeafIcon size={28} /></motion.span>
        <span className="font-display text-5xl leading-none">{display}</span>
        {label && <span className="mt-1 text-xs text-forest-soft">{label}</span>}
      </div>
    </div>
  );
}
