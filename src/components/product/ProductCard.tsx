"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/types";
import { Packshot } from "./Packshot";
import { AddToCartButton, FavoriteButton } from "./AddToCart";
import { PriceTag } from "./PriceTag";
import { RatingSummary } from "@/components/reviews/RatingSummary";
import { concernLabels } from "@/data/categories";

/**
 * Carte produit « vivante » :
 * - desktop : au survol, la photo laisse place à la vidéo d'application (ou à la mise en scène animée) ;
 * - mobile : la démonstration se lance quand la carte passe au centre de l'écran ;
 * - inclinaison 3D légère suivant la souris.
 */
export function ProductCard({ product, priority = false, badge }: { product: Product; priority?: boolean; badge?: string }) {
  const [hover, setHover] = useState(false);
  const [inCenter, setInCenter] = useState(false);
  const [touch, setTouch] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();


  useEffect(() => {
    setTouch(window.matchMedia("(hover: none)").matches);
  }, []);

  useEffect(() => {
    if (!touch || !ref.current) return;
    const io = new IntersectionObserver(([e]) => setInCenter(e.isIntersecting), { rootMargin: "-35% 0px -35% 0px" });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [touch]);

  const hasMedia = !!(product.media.hoverVideo || product.media.hover);
  const active = !reduce && hasMedia && (hover || (touch && inCenter));
  const zoom = !reduce && !hasMedia && hover;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active) v.play().catch(() => {});
    else { v.pause(); v.currentTime = 0; }
  }, [active]);

  const mainConcern = product.concerns[0];

  return (
    <motion.div
      ref={ref}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="group relative"
    >
      <Link href={`/produits/${product.slug}`} className="block focus-visible:outline-none" aria-label={`${product.name} — ${product.kind}`}>
        <div className="relative aspect-[4/5] overflow-hidden" style={{ background: product.color.bg }}>
          {/* Photo principale */}
          <motion.div className="absolute inset-[8%]" animate={{ opacity: active ? 0 : 1, scale: active || zoom ? 1.06 : 1 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
            <Packshot product={product} className="h-full w-full" priority={priority} showTag={false} />
          </motion.div>
          {/* Démonstration au survol : vraie vidéo d'application (media.hoverVideo) ou photo secondaire */}
          <motion.div className="absolute inset-0" initial={false} animate={{ opacity: active ? 1 : 0 }} transition={{ duration: 0.6 }}>
            {product.media.hoverVideo ? (
              <video ref={videoRef} src={product.media.hoverVideo} muted loop playsInline preload="none" poster={product.media.hover} className="h-full w-full object-cover" />
            ) : product.media.hover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.media.hover} alt="" loading="lazy" className="h-full w-full object-cover" />
            ) : null}
          </motion.div>

          <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
            {product.bestseller && <span className="chip bg-forest text-ivory">Best-seller</span>}
            {product.isNew && <span className="chip bg-blush">Nouveau</span>}
            {badge && <span className="chip">{badge}</span>}
          </div>
        </div>
        <div className="mt-4 px-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-[0.95rem] font-medium leading-tight">{product.name}</h3>
              <p className="mt-0.5 truncate text-[0.85rem] text-forest-soft">{product.kind}</p>
              <RatingSummary productId={product.id} size={12} className="mt-1.5" />
            </div>
            <PriceTag productId={product.id} className="shrink-0 text-[0.95rem]" />
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-forest-soft">
            {mainConcern && <span>{concernLabels[mainConcern]}</span>}
            <span>· {product.variants[0].size}</span>
          </div>
          
        </div>
      </Link>
      {/* Actions hors du lien (pas de bouton imbriqué dans un lien) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 aspect-[4/5]">
        <div className="pointer-events-auto absolute right-3 top-3 z-10"><FavoriteButton productId={product.id} /></div>
        <div className="pointer-events-auto absolute bottom-3 right-3 z-10 transition-all duration-500 md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:focus-within:translate-y-0 md:focus-within:opacity-100">
          <AddToCartButton productId={product.id} compact />
        </div>
      </div>
    </motion.div>
  );
}
