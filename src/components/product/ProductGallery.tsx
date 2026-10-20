"use client";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { Packshot } from "./Packshot";

type Slide = { kind: "packshot" } | { kind: "image"; src: string } | { kind: "video"; src: string };

/** Galerie produit : packshot, zoom texture animé, photos, vidéo — transitions douces + loupe au survol. */
export function ProductGallery({ product }: { product: Product }) {
  const slides: Slide[] = [
    { kind: "packshot" },
    ...(product.media.hoverVideo ? [{ kind: "video" as const, src: product.media.hoverVideo }] : []),
    ...(product.media.gallery ?? []).map((src) => ({ kind: "image" as const, src })),
  ];
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const s = slides[i];

  return (
    <div className="md:sticky md:top-28">
      <div
        className="relative aspect-square overflow-hidden rounded-none"
        style={{ background: product.color.bg }}
        onMouseMove={(e) => {
          if (s.kind !== "packshot" && s.kind !== "image") return;
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onMouseLeave={() => setZoom(null)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.04, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.98, filter: "blur(8px)" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            style={zoom ? { transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          >
            <div className={`h-full w-full transition-transform duration-300 ${zoom ? "scale-[1.8]" : ""}`} style={zoom ? { transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}>
              {s.kind === "packshot" && <div className="absolute inset-[10%] animate-float-slow"><Packshot product={product} className="h-full w-full" priority sizes="(max-width:768px) 90vw, 45vw" /></div>}
              {s.kind === "image" && <Image src={s.src} alt={product.name} fill className="object-cover" sizes="(max-width:768px) 90vw, 45vw" />}
              {s.kind === "video" && <video src={s.src} autoPlay muted loop playsInline className="h-full w-full object-cover" />}
            </div>
          </motion.div>
        </AnimatePresence>
        {(s.kind === "packshot" || s.kind === "image") && <span className="absolute bottom-4 right-4 hidden chip bg-ivory/80 md:inline-flex">Survole pour zoomer</span>}
      </div>
      <div className="mt-4 flex gap-3">
        {slides.map((sl, k) => (
          <button key={k} onClick={() => setI(k)} aria-label={`Visuel ${k + 1}`} aria-current={i === k} className={`relative h-20 w-20 overflow-hidden rounded-[2px] transition ${i === k ? "ring-2 ring-forest ring-offset-2 ring-offset-cream" : "opacity-70 hover:opacity-100"}`} style={{ background: product.color.bg }}>
            {sl.kind === "packshot" && <div className="absolute inset-1.5"><Packshot product={product} className="h-full w-full" showTag={false} sizes="80px" /></div>}
            {sl.kind === "image" && <Image src={sl.src} alt="" fill className="object-cover" sizes="80px" />}
            {sl.kind === "video" && <div className="absolute inset-0 grid place-items-center text-xs">▶</div>}
          </button>
        ))}
      </div>
    </div>
  );
}
