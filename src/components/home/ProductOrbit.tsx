"use client";
import Link from "next/link";
import { AnimatePresence, motion, useAnimationFrame, useReducedMotion, useScroll, useVelocity } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/types";
import { Packshot } from "@/components/product/Packshot";
import { PriceTag } from "@/components/product/PriceTag";
import { ArrowIcon, ChevronIcon } from "@/components/ui/Icons";

export interface OrbitItem { product: Product; category: string; href: string }

const TAU = Math.PI * 2;

/**
 * Carrousel 3D « orbite » : les produits tournent lentement sur un anneau incliné.
 * - rotation automatique, accélérée par la vitesse de défilement de la page ;
 * - glisser (souris / doigt) pour faire tourner, clic sur un produit pour l'amener devant ;
 * - le produit de face est mis en avant (nom, catégorie, prix, lien).
 * Positions calculées à chaque image et appliquées directement au DOM (pas de rendu React par image).
 */
export function ProductOrbit({ items }: { items: OrbitItem[] }) {
  const reduce = useReducedMotion();
  const n = items.length;
  const stage = useRef<HTMLDivElement>(null);
  const nodes = useRef<(HTMLButtonElement | null)[]>([]);
  const angle = useRef(0); // rotation de l'anneau (radians)
  const target = useRef<number | null>(null); // rotation visée après un clic
  const drag = useRef<{ x: number; a: number; moved: boolean } | null>(null);
  const hover = useRef(false);
  const [front, setFront] = useState(0);
  const [radius, setRadius] = useState({ x: 420, z: 260, size: 230 });
  const { scrollY } = useScroll();
  const scrollVel = useVelocity(scrollY);

  // Rayon adapté à la largeur disponible
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const w = e.contentRect.width;
      setRadius({ x: Math.min(460, w * 0.4), z: Math.min(280, w * 0.26), size: Math.max(120, Math.min(240, w * 0.2)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const frontOf = (a: number) => ((Math.round(-a / (TAU / n)) % n) + n) % n;

  useAnimationFrame((_, delta) => {
    const dt = Math.min(delta, 50) / 1000;
    if (target.current !== null) {
      const diff = target.current - angle.current;
      angle.current += diff * Math.min(1, dt * 6);
      if (Math.abs(diff) < 0.002) target.current = null;
    } else if (!drag.current && !reduce) {
      const boost = Math.min(2.5, Math.abs(scrollVel.get()) / 900);
      const speed = hover.current ? 0.04 : 0.18 + boost; // rad/s
      angle.current -= speed * dt;
    }
    const step = TAU / n;
    const tilt = radius.z * 0.3;
    nodes.current.forEach((el, i) => {
      if (!el) return;
      const t = i * step + angle.current;
      const x = Math.sin(t) * radius.x;
      const z = Math.cos(t); // 1 = devant, -1 = derrière
      const depth = (z + 1) / 2; // 0 → 1
      const y = z * tilt + Math.sin(t * 2 + i) * 5; // devant = plus bas (anneau vu de dessus) + légère ondulation
      const scale = 0.55 + depth * 0.55;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale}) rotate(${Math.sin(t) * -8}deg)`;
      el.style.zIndex = String(Math.round(depth * 100));
      el.style.opacity = String(0.35 + depth * 0.65);
      el.style.filter = depth < 0.5 ? `blur(${(0.5 - depth) * 3}px) saturate(${0.6 + depth})` : "none";
    });
    const f = frontOf(angle.current);
    if (f !== front) setFront(f);
  });

  const goTo = (i: number) => {
    const step = TAU / n;
    // chemin le plus court vers l'angle où l'élément i est de face
    const desired = -i * step;
    let diff = (desired - angle.current) % TAU;
    if (diff > Math.PI) diff -= TAU;
    if (diff < -Math.PI) diff += TAU;
    target.current = angle.current + diff;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, a: angle.current, moved: false };
    target.current = null;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    angle.current = drag.current.a + dx / Math.max(200, radius.x);
  };
  const onPointerUp = () => {
    if (drag.current?.moved) goTo(frontOf(angle.current));
    setTimeout(() => (drag.current = null), 0);
  };

  const cur = items[front];
  // Base des flacons : centre de l'élément + demi-hauteur × échelle + décalage vertical
  const top0 = 24, h = radius.size * 1.25, tilt = radius.z * 0.3;
  const baseFront = top0 + h / 2 + (h / 2) * 1.1 + tilt;
  const baseBack = top0 + h / 2 + (h / 2) * 0.55 - tilt;
  const floor = { top: baseBack - 6, h: baseFront - baseBack + 12 };

  return (
    <div className="relative mt-10 select-none">
      <div
        ref={stage}
        className="relative touch-pan-y"
        style={{ height: baseFront + 30 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={() => { hover.current = false; if (drag.current) onPointerUp(); }}
        onPointerEnter={() => (hover.current = true)}
        role="region"
        aria-roledescription="carrousel"
        aria-label="Produits mis en avant"
      >
        {/* Sol : ellipse et halo */}
        {/* Sol : l'ellipse passe sous la base des flacons (devant ≈ bas, derrière ≈ haut) */}
        <div aria-hidden className="absolute left-1/2 -translate-x-1/2 rounded-[50%] border border-forest/10 bg-[radial-gradient(closest-side,rgba(31,51,41,0.07),transparent)]" style={{ width: radius.x * 2 + radius.size * 0.5, top: floor.top, height: floor.h }} />
        <div aria-hidden className="absolute left-1/2 h-6 -translate-x-1/2 rounded-[50%] bg-forest/20 blur-xl" style={{ width: radius.size * 0.9, top: floor.top + floor.h - 18 }} />
        {items.map((it, i) => (
          <button
            key={it.product.id}
            ref={(el) => { nodes.current[i] = el; }}
            onClick={(e) => {
              if (drag.current?.moved) { e.preventDefault(); return; }
              if (i !== front) goTo(i);
              else window.location.assign(`/produits/${it.product.slug}`);
            }}
            aria-label={i === front ? `Voir ${it.product.name}` : `Amener ${it.product.name} au premier plan`}
            className="absolute left-1/2 top-[24px] -ml-[var(--s-half)] cursor-grab will-change-transform active:cursor-grabbing"
            style={{ width: radius.size, height: radius.size * 1.25, ["--s-half" as string]: `${radius.size / 2}px` }}
          >
            <Packshot product={it.product} className="pointer-events-none h-full w-full drop-shadow-[0_18px_22px_rgba(31,51,41,0.18)]" showTag={false} sizes="240px" />
          </button>
        ))}
      </div>

      {/* Produit de face */}
      <div className="relative mx-auto -mt-4 flex max-w-xl flex-col items-center text-center md:-mt-2">
        <AnimatePresence mode="wait">
          <motion.div key={cur?.product.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="flex flex-col items-center">
            <p className="eyebrow text-forest-soft">{cur?.category}</p>
            <p className="mt-1 font-display text-3xl md:text-4xl">{cur?.product.name}</p>
            <p className="mt-1 text-sm text-forest-soft">{cur?.product.kind} · <PriceTag productId={cur?.product.id ?? ""} className="inline" /></p>
          </motion.div>
        </AnimatePresence>
        <div className="mt-5 flex items-center gap-3">
          <button onClick={() => goTo((front - 1 + n) % n)} className="grid h-11 w-11 rotate-180 place-items-center rounded-full border border-line bg-ivory transition hover:bg-forest hover:text-ivory" aria-label="Produit précédent"><ChevronIcon size={18} /></button>
          {cur && <Link href={`/produits/${cur.product.slug}`} className="btn btn-primary">Découvrir <ArrowIcon size={16} /></Link>}
          {cur && <Link href={cur.href} className="btn btn-ghost hidden sm:inline-flex">Toute la catégorie</Link>}
          <button onClick={() => goTo((front + 1) % n)} className="grid h-11 w-11 place-items-center rounded-full border border-line bg-ivory transition hover:bg-forest hover:text-ivory" aria-label="Produit suivant"><ChevronIcon size={18} /></button>
        </div>
        <p className="mt-3 hidden text-xs text-forest-soft md:block">Fais glisser pour faire tourner, clique sur un produit pour l&apos;amener devant.</p>
      </div>
    </div>
  );
}
