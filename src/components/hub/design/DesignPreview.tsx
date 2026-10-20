"use client";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import type { Design, Visual } from "@/lib/hub/types";
import { renderPage } from "./render";
import { PlayI, VideoI } from "../icons";

/** Aperçu d'un visuel (rendu canvas, chargé à l'affichage). `width` = largeur affichée en px (pour la résolution). */
export function DesignPreview({ design, page = 0, width = 320, className, rounded }: { design: Design; page?: number; width?: number; className?: string; rounded?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!visible || !ref.current) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderPage(ref.current, design, page, Math.min(1, (width * dpr) / design.w));
  }, [visible, design, page, width]);
  return (
    <canvas
      ref={ref}
      className={clsx("block h-auto w-full bg-sage-soft", rounded && "rounded-md", className)}
      style={{ aspectRatio: `${design.w} / ${design.h}` }}
      role="img"
      aria-label="Aperçu du visuel"
    />
  );
}

/** Miniature d'un visuel de publication (design, image ou vidéo). */
export function VisualThumb({ visual, width = 160, className, page = 0, playable }: { visual?: Visual; width?: number; className?: string; page?: number; playable?: boolean }) {
  if (!visual) return <div className={clsx("grid aspect-square place-items-center bg-sage-soft text-xs text-forest-soft", className)}>Sans visuel</div>;
  if (visual.kind === "video" && visual.src) {
    if (playable) return <video src={visual.src} className={clsx("block w-full bg-black object-cover", className)} controls playsInline muted loop autoPlay />;
    return (
      <div className={clsx("relative", className)}>
        {visual.poster ? <DesignPreview design={visual.poster} width={width} /> : <video src={visual.src} className="block w-full object-cover" muted playsInline preload="metadata" />}
        <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"><PlayI size={12} /></span>
      </div>
    );
  }
  if (visual.kind === "image" && visual.src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={visual.src} alt="" className={clsx("block w-full object-cover", className)} loading="lazy" />;
  }
  if (visual.design) return <div className={className}><DesignPreview design={visual.design} page={page} width={width} /></div>;
  return <div className={clsx("grid aspect-square place-items-center bg-sage-soft text-forest-soft", className)}><VideoI /></div>;
}
