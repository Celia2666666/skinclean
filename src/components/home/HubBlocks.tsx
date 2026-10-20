"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { homeHub } from "@/data/home";
import { getProduct } from "@/lib/catalog";
import { ProductCard } from "@/components/product/ProductCard";
import { ArrowIcon, ChevronIcon } from "@/components/ui/Icons";

/**
 * Blocs d'accueil pilotés depuis le Marketing Hub (/hub/site) :
 * bannière promotionnelle, slider de visuels et collection mise en avant.
 * Rien ne s'affiche tant que le Hub ne les a pas activés.
 */

export function PromoBanner() {
  const b = homeHub.promoBanner;
  if (!b?.enabled || !b.text) return null;
  const inner = (
    <span className="flex items-center justify-center gap-3 px-4 py-4 text-center text-sm font-medium tracking-wide md:text-base">
      {b.text}
      {b.href && <ArrowIcon size={18} />}
    </span>
  );
  return (
    <section
      aria-label="Offre du moment"
      className="relative overflow-hidden"
      style={{ background: b.bg || "#1F3329", color: b.color || "#FFFFFF", backgroundImage: b.image ? `linear-gradient(rgb(0 0 0 / .25), rgb(0 0 0 / .25)), url(${b.image})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      {b.href ? <Link href={b.href} className="block hover:opacity-90">{inner}</Link> : inner}
    </section>
  );
}

export function HomeSlider() {
  const slides = homeHub.slides;
  const [i, setI] = useState(0);
  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);
  if (!slides.length) return null;
  const s = slides[i];
  return (
    <section aria-roledescription="carrousel" aria-label="À la une" className="relative mx-auto max-w-[1400px] px-4 pt-10 md:px-8">
      <div className="relative aspect-[16/9] overflow-hidden bg-sage-soft md:aspect-[21/8]">
        {slides.map((x, k) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={x.id} src={x.image} alt="" className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${k === i ? "opacity-100" : "opacity-0"}`} />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 max-w-xl p-6 text-ivory md:p-12">
          <h2 className="font-display text-3xl md:text-5xl">{s.title}</h2>
          {s.text && <p className="mt-3 text-sm md:text-base">{s.text}</p>}
          {s.cta && s.href && <Link href={s.href} className="btn btn-light mt-6">{s.cta}</Link>}
        </div>
        {slides.length > 1 && (
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button aria-label="Visuel précédent" onClick={() => setI((i - 1 + slides.length) % slides.length)} className="grid h-10 w-10 rotate-180 place-items-center bg-ivory/90 text-forest"><ChevronIcon size={18} /></button>
            <button aria-label="Visuel suivant" onClick={() => setI((i + 1) % slides.length)} className="grid h-10 w-10 place-items-center bg-ivory/90 text-forest"><ChevronIcon size={18} /></button>
          </div>
        )}
      </div>
    </section>
  );
}

export function FeaturedCollection() {
  const f = homeHub.featured;
  if (!f?.enabled) return null;
  const items = f.productIds.map((id) => getProduct(id)).filter((p): p is NonNullable<typeof p> => !!p).slice(0, 4);
  return (
    <section className="bg-sage-soft py-20 md:py-28">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 md:px-8 lg:grid-cols-[1fr_2fr]">
        <div className="flex flex-col justify-center">
          <p className="eyebrow text-forest-soft">{f.eyebrow}</p>
          <h2 className="title-caps mt-3 font-display text-4xl md:text-5xl">{f.title}</h2>
          <p className="mt-4 text-forest-soft">{f.text}</p>
          {f.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={f.image} alt="" className="mt-6 aspect-[4/3] w-full object-cover" />
          )}
          <Link href={f.href || "/soins-visage"} className="btn btn-primary mt-6 self-start">Découvrir la collection</Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          {items.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </section>
  );
}
