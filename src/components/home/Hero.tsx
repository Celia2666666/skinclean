"use client";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { homeHub, homeMedia } from "@/data/home";
import { useHydrated, useStore } from "@/lib/store";
import { PauseIcon, PlayIcon } from "@/components/ui/Icons";

/**
 * SECTION 1 — Hero vidéo (vidéo verticale fournie par la marque).
 * - Ordinateur : texte à gauche sur la couleur du fond de la vidéo, vidéo en panneau vertical à droite.
 * - Mobile : vidéo plein écran (version allégée), texte en surimpression.
 * Lecture automatique sans son, en boucle ; image de secours ; pause si « réduire les animations ».
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();
  const [playing, setPlaying] = useState(true);
  const hero = useStore((s) => s.homeHero);
  const h = useHydrated();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const videoY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (reduce) { v.pause(); setPlaying(false); }
    else v.play().catch(() => setPlaying(false)); // autoplay bloqué → l'image de secours reste affichée
  }, [reduce]);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
  };

  // Le texte publié depuis le Marketing Hub est prioritaire sur la retouche locale du back-office démo
  const text = homeHub.hero ?? (h ? hero : { title: "Your skin. Your glow.", subtitle: "Une peau qui rayonne, une routine qui te ressemble.", cta: "Découvrir SKINCLEAN" });

  return (
    <section ref={ref} className="relative isolate overflow-hidden" style={{ background: homeMedia.heroBackground }}>
      <div className="relative mx-auto grid h-[calc(100svh-110px)] max-h-[880px] min-h-[560px] max-w-[1600px] md:grid-cols-[1fr_minmax(0,44%)]">
        {/* Vidéo : plein écran sur mobile, panneau vertical à droite sur ordinateur */}
        <div className="absolute inset-0 overflow-hidden md:relative md:order-2">
          <motion.div style={reduce ? undefined : { y: videoY }} className="h-full w-full">
            <video
              ref={videoRef}
              className="h-full w-full object-cover object-[50%_30%]"
              poster={homeMedia.heroPoster}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="Vidéo : application du Sérum Hydratant Progressif SKINCLEAN"
            >
              {homeMedia.heroVideoMobile && <source src={homeMedia.heroVideoMobile} type="video/mp4" media="(max-width: 767px)" />}
              {homeMedia.heroVideo && <source src={homeMedia.heroVideo} type="video/mp4" />}
            </video>
          </motion.div>
          {/* Voile pour la lisibilité du texte sur mobile uniquement */}
          <div className="absolute inset-0 bg-gradient-to-t from-forest/70 via-forest/10 to-transparent md:hidden" />
        </div>

        {/* Texte */}
        <div className="relative z-10 flex flex-col justify-end px-5 pb-12 text-ivory md:order-1 md:justify-center md:px-12 md:pb-0 md:text-forest lg:px-16">
          <p className="rise eyebrow mb-5" style={{ animationDelay: "0.1s" }}>Skincare naturelle · Routines personnalisées</p>
          <h1 className="font-display title-caps text-[clamp(2.6rem,6vw,5.4rem)]">
            {text.title.split(" ").map((w, i) => (
              <span key={i} className="inline-block overflow-hidden pb-1 align-bottom">
                <span className="rise-word" style={{ animationDelay: `${0.2 + i * 0.08}s` }}>{w}&nbsp;</span>
              </span>
            ))}
          </h1>
          <p className="rise mt-5 max-w-md text-base md:text-lg md:text-forest-soft" style={{ animationDelay: "0.6s" }}>{text.subtitle}</p>
          <div className="rise mt-8 flex flex-wrap gap-3" style={{ animationDelay: "0.8s" }}>
            <Link href={homeHub.hero?.ctaHref || "/soins-visage"} className="btn btn-light md:border-forest md:bg-forest md:text-ivory md:hover:bg-[#2E4A3C]">{text.cta}</Link>
            <Link href="/skin-diag" className="btn border-ivory text-ivory hover:bg-ivory hover:text-forest md:border-forest md:text-forest md:hover:bg-forest md:hover:text-ivory">Faire mon Skin Diag</Link>
          </div>
        </div>

        <button
          onClick={toggle}
          className="absolute bottom-4 right-4 z-20 grid h-10 w-10 place-items-center bg-ivory/85 text-forest backdrop-blur"
          aria-label={playing ? "Mettre la vidéo en pause" : "Lire la vidéo"}
        >
          {playing ? <PauseIcon size={14} /> : <PlayIcon size={14} />}
        </button>
      </div>
    </section>
  );
}
