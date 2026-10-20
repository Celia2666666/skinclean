"use client";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Comparateur avant / après.
 * - Glisser la poignée, cliquer, utiliser le clavier (← →) ou, sur desktop, simplement survoler.
 * - `demo` affiche des illustrations générées clairement identifiées : jamais présentées comme de vrais résultats.
 */
export function BeforeAfter({
  before, after, labelBefore = "Avant", labelAfter = "Après", caption, demo, className = "", hoverFollow = true, beforeNode, afterNode, illustrative = false, simulated = false,
}: {
  before?: string; after?: string; labelBefore?: string; labelAfter?: string; caption?: string;
  demo?: "imperfections" | "rougeurs" | "eclat"; className?: string; hoverFollow?: boolean;
  beforeNode?: ReactNode; afterNode?: ReactNode;
  /** Photos réelles mais d'illustration (pas un résultat obtenu avec le produit). */
  illustrative?: boolean;
  /** « Après » obtenu par retouche numérique de la même photo. */
  simulated?: boolean;
}) {
  const [pos, setPos] = useState(50);
  const [drag, setDrag] = useState(false);
  const [touched, setTouched] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  // Petite démonstration automatique à l'apparition, tant que l'utilisateur n'a pas interagi.
  useEffect(() => {
    if (reduce || touched) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const k = (t - start) / 1000;
      if (k > 3.2) { setPos(50); return; }
      setPos(50 + Math.sin(k * 2) * 22);
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { raf = requestAnimationFrame(tick); io.disconnect(); } }, { threshold: 0.6 });
    if (ref.current) io.observe(ref.current);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, [reduce, touched]);

  const move = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos(Math.max(2, Math.min(98, ((clientX - r.left) / r.width) * 100)));
  };

  const layer = (src: string | undefined, node: ReactNode, which: "before" | "after") =>
    node ?? (src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={which === "before" ? labelBefore : labelAfter} loading="lazy" className="h-full w-full object-cover" draggable={false} />
    ) : (
      <DemoSkin kind={demo ?? "eclat"} state={which} />
    ));

  return (
    <figure className={className}>
      <div
        ref={ref}
        className="relative aspect-[4/5] cursor-ew-resize select-none overflow-hidden rounded-[var(--radius-card)] bg-sky touch-pan-y"
        onPointerDown={(e) => { setTouched(true); setDrag(true); (e.target as HTMLElement).setPointerCapture?.(e.pointerId); move(e.clientX); }}
        onPointerMove={(e) => { if (drag || (hoverFollow && e.pointerType === "mouse")) { setTouched(true); move(e.clientX); } }}
        onPointerUp={() => setDrag(false)}
        onPointerLeave={() => setDrag(false)}
      >
        <div className="absolute inset-0">{layer(after, afterNode, "after")}</div>
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>{layer(before, beforeNode, "before")}</div>

        <span className="chip absolute left-3 top-3 bg-ivory/90">{labelBefore}</span>
        <span className="chip absolute right-3 top-3 bg-ivory/90">{labelAfter}</span>

        <div className="pointer-events-none absolute inset-y-0" style={{ left: `${pos}%` }}>
          <div className="absolute inset-y-0 -ml-px w-0.5 bg-ivory shadow" />
          <motion.div animate={{ scale: drag ? 1.15 : 1 }} className="absolute top-1/2 -ml-6 -mt-6 grid h-12 w-12 place-items-center rounded-full bg-ivory text-forest shadow-lg">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m9 7-5 5 5 5M15 7l5 5-5 5" /></svg>
          </motion.div>
        </div>
        <input
          type="range" min={0} max={100} value={Math.round(pos)} aria-label="Comparer avant et après"
          onChange={(e) => { setTouched(true); setPos(Number(e.target.value)); }}
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
        {!before && !beforeNode && <span className="placeholder-tag text-forest/80">Illustration de démonstration — pas un résultat réel</span>}
        {before && simulated && <span className="placeholder-tag text-forest/80">Simulation par retouche numérique — pas un résultat réel</span>}
      </div>
      {caption && <figcaption className="mt-3 text-sm text-forest-soft">{caption}</figcaption>}
    </figure>
  );
}

/** Illustrations neutres de démonstration (aucune photo retouchée présentée comme résultat). */
function DemoSkin({ kind, state }: { kind: "imperfections" | "rougeurs" | "eclat"; state: "before" | "after" }) {
  const base = state === "before" ? (kind === "eclat" ? ["#d9bfae", "#c4a593"] : ["#efcfbd", "#ddb39b"]) : ["#f4d8c6", "#e4bba2"];
  return (
    <div className="relative h-full w-full" style={{ background: `radial-gradient(120% 90% at 30% 20%, ${base[0]}, ${base[1]})` }}>
      {state === "after" && <div className="absolute inset-0" style={{ background: "radial-gradient(50% 40% at 60% 30%, rgba(255,255,255,0.55), transparent 70%)" }} />}
      {kind === "imperfections" &&
        Array.from({ length: state === "before" ? 18 : 4 }).map((_, i) => (
          <span key={i} className="absolute rounded-full" style={{ left: `${(i * 37) % 85 + 6}%`, top: `${(i * 53) % 80 + 8}%`, width: 8 + (i % 4) * 3, height: 8 + (i % 4) * 3, background: state === "before" ? "radial-gradient(circle, #cf7f74, #d99486 55%, transparent 72%)" : "radial-gradient(circle, #e2a99a, transparent 70%)", opacity: state === "before" ? 0.9 : 0.4 }} />
        ))}
      {kind === "rougeurs" && (
        <>
          <div className="absolute left-[10%] top-[35%] h-[30%] w-[38%] rounded-full blur-2xl" style={{ background: "#e08a86", opacity: state === "before" ? 0.65 : 0.15 }} />
          <div className="absolute right-[8%] top-[38%] h-[28%] w-[36%] rounded-full blur-2xl" style={{ background: "#e08a86", opacity: state === "before" ? 0.6 : 0.12 }} />
        </>
      )}
      {kind === "eclat" && state === "after" && <div className="absolute -left-1/4 top-0 h-full w-1/3 rotate-12 bg-white/25 blur-xl" />}
      <div className="absolute inset-0 opacity-30 mix-blend-multiply" style={{ backgroundImage: "radial-gradient(rgba(120,70,50,0.25) 1px, transparent 1.2px)", backgroundSize: state === "before" && kind !== "rougeurs" ? "7px 7px" : "11px 11px" }} />
    </div>
  );
}
