"use client";
import { useEffect, useRef } from "react";
import { homeMedia } from "@/data/home";

/** Vidéo de marque du site (même fichier que le hero de l'accueil SKINCLEAN), muette et en boucle. */
export function BrandVideo({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) v.pause();
    else v.play().catch(() => {}); // lecture automatique bloquée : l'image de secours reste affichée
  }, []);
  if (!homeMedia.heroVideo) return null;
  return (
    <video ref={ref} className={className} poster={homeMedia.heroPoster} autoPlay muted loop playsInline preload="metadata" aria-hidden>
      {homeMedia.heroVideoMobile && <source src={homeMedia.heroVideoMobile} type="video/mp4" media="(max-width: 767px)" />}
      <source src={homeMedia.heroVideo} type="video/mp4" />
    </video>
  );
}
