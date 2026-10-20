"use client";
import { useEffect, useState } from "react";
import { LeafIcon } from "./Icons";

/** Bulles de sérum qui remontent en arrière-plan (purement décoratif). */
export function Bubbles({ count = 14, color = "rgba(255,255,255,0.7)" }: { count?: number; color?: string }) {
  const [items, setItems] = useState<{ l: number; s: number; d: number; dl: number }[]>([]);
  useEffect(() => {
    setItems(Array.from({ length: count }, () => ({ l: Math.random() * 100, s: 4 + Math.random() * 12, d: 8 + Math.random() * 10, dl: -Math.random() * 15 })));
  }, [count]);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((b, i) => (
        <span
          key={i}
          className="absolute bottom-[-40px] rounded-full animate-bubble"
          style={{
            left: `${b.l}%`, width: b.s, height: b.s, animationDuration: `${b.d}s`, animationDelay: `${b.dl}s`,
            background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), ${color} 45%, rgba(255,255,255,0.08) 70%)`,
            boxShadow: "inset -2px -3px 6px rgba(52,77,67,0.08)",
          }}
        />
      ))}
    </div>
  );
}

/** Feuilles qui tombent (programme de fidélité). */
export function FallingLeaves({ count = 10 }: { count?: number }) {
  const [items, setItems] = useState<{ l: number; d: number; dl: number; x: number; r: number; s: number }[]>([]);
  useEffect(() => {
    setItems(Array.from({ length: count }, () => ({ l: Math.random() * 100, d: 7 + Math.random() * 7, dl: -Math.random() * 12, x: -60 + Math.random() * 120, r: 120 + Math.random() * 260, s: 14 + Math.random() * 16 })));
  }, [count]);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((b, i) => (
        <span
          key={i}
          className="absolute top-0 text-sage-deep/60"
          style={{ left: `${b.l}%`, width: b.s, height: b.s, animation: `leaf-fall ${b.d}s linear ${b.dl}s infinite`, ["--lx" as string]: `${b.x}px`, ["--lr" as string]: `${b.r}deg` }}
        >
          <LeafIcon size={b.s} />
        </span>
      ))}
    </div>
  );
}
