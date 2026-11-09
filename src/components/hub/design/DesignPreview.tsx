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

/** Vidéo d'aperçu : lecture automatique muette en boucle, pause au clic (pas de barre de contrôle par-dessus les textes). */
function PreviewVideo({ src, poster, className }: { src: string; poster?: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  return (
    <div className={clsx("relative", className)}>
      <video ref={ref} src={src} poster={poster} className="block h-full w-full object-cover" muted loop playsInline autoPlay preload="metadata"
        onClick={() => { const v = ref.current; if (!v) return; if (v.paused) { v.play(); setPaused(false); } else { v.pause(); setPaused(true); } }} />
      {paused && <span className="pointer-events-none absolute inset-0 grid place-items-center"><span className="grid h-12 w-12 place-items-center rounded-full bg-black/45 text-white"><PlayI size={20} /></span></span>}
    </div>
  );
}

/**
 * Miniature d'un visuel de publication (design, image ou vidéo).
 * `fill` : remplit entièrement le conteneur (aperçus plein cadre type Story / TikTok).
 */
const frameCache = new Map<string, Promise<string>>();
const queue: (() => void)[] = [];
let running = 0;
/** File d'attente : 3 vidéos décodées à la fois, sinon le navigateur abandonne certaines vignettes (restées noires). */
function enqueue<T>(job: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const start = () => { running++; job().then(resolve, reject).finally(() => { running--; queue.shift()?.(); }); };
    if (running < 3) start(); else queue.push(start);
  });
}
/** Image extraite d'une vidéo (vers 1 s), mise en cache. Échec ou délai dépassé → la couverture est affichée à la place. */
function grabFrame(src: string): Promise<string> {
  if (!frameCache.has(src)) {
    const p = enqueue(() => new Promise<string>((resolve, reject) => {
      const v = document.createElement("video");
      const done = (fn: () => void) => { clearTimeout(timer); fn(); v.removeAttribute("src"); v.load(); };
      const timer = setTimeout(() => done(() => reject(new Error("Délai dépassé"))), 12000);
      v.muted = true; v.playsInline = true; v.preload = "auto"; v.src = src;
      v.onloadedmetadata = () => { v.currentTime = Math.min(1, v.duration / 3); };
      v.onseeked = () => done(() => {
        const c = document.createElement("canvas");
        c.width = 360; c.height = Math.round((360 * v.videoHeight) / v.videoWidth);
        c.getContext("2d")!.drawImage(v, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.72));
      });
      v.onerror = () => done(() => reject(new Error("Vidéo illisible")));
    }));
    p.catch(() => frameCache.delete(src)); // nouvel essai au prochain affichage
    frameCache.set(src, p);
  }
  return frameCache.get(src)!;
}

function VideoFrame({ src, className, fallback }: { src: string; className?: string; fallback?: React.ReactNode }) {
  const [frame, setFrame] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let live = true;
    const el = ref.current;
    // On ne charge la vidéo que lorsque la vignette approche de l'écran
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      grabFrame(src).then((f) => live && setFrame(f)).catch(() => live && setFailed(true));
    }, { rootMargin: "300px" });
    if (el) io.observe(el);
    return () => { live = false; io.disconnect(); };
  }, [src]);
  if (frame) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={frame} alt="" className={className} />;
  }
  if (failed && fallback) return <>{fallback}</>;
  return <span ref={ref} className={clsx(className, "animate-pulse bg-sage-soft")} />;
}

export function VisualThumb({ visual, width = 160, className, page = 0, playable, fill }: { visual?: Visual; width?: number; className?: string; page?: number; playable?: boolean; fill?: boolean }) {
  const box = fill ? "h-full w-full" : "";
  if (!visual) return <div className={clsx("grid aspect-square place-items-center bg-sage-soft text-xs text-forest-soft", box, className)}>Sans visuel</div>;
  if (visual.kind === "video" && visual.src) {
    if (playable) return <PreviewVideo src={visual.src} className={clsx(fill ? "h-full w-full" : "aspect-[9/16] w-full bg-black", className)} />;
    // Vignette comme dans l'application : une image de la vidéo, avec le hook de la couverture en texte incrusté
    const hook = visual.poster?.pages[0]?.layers.filter((l) => l.type === "text").sort((a, b) => (b.type === "text" ? b.size : 0) - (a.type === "text" ? a.size : 0))[0];
    return (
      <div className={clsx("relative overflow-hidden bg-black", fill ? box : "aspect-[9/16] w-full", className)}>
        <VideoFrame src={visual.src} className="absolute inset-0 block h-full w-full object-cover" fallback={visual.poster ? <DesignPreview design={visual.poster} width={width} className="absolute inset-0 h-full w-full object-cover" /> : undefined} />
        {hook?.type === "text" && <span className="absolute inset-x-[8%] top-[28%] line-clamp-4 rounded-md bg-white/90 px-2 py-1.5 text-center text-[0.72rem] font-semibold leading-snug text-forest shadow">{hook.text}</span>}
        <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"><PlayI size={12} /></span>
      </div>
    );
  }
  if (visual.kind === "image" && visual.src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={visual.src} alt="" className={clsx("block w-full object-cover", box, className)} loading="lazy" />;
  }
  if (visual.design) return <div className={clsx(box, className)}><DesignPreview design={visual.design} page={page} width={width} className={fill ? "h-full object-cover" : undefined} /></div>;
  return <div className={clsx("grid aspect-square place-items-center bg-sage-soft text-forest-soft", box, className)}><VideoI /></div>;
}
