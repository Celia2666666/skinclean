"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { typeCategories, concernCategories } from "@/data/categories";
import { getBestsellers, getKits, getProduct, getProducts, kitPricing } from "@/lib/catalog";
import { Packshot } from "@/components/product/Packshot";
import { ProductCard } from "@/components/product/ProductCard";
import { BeforeAfter } from "@/components/product/BeforeAfter";
import { NewsletterForm } from "@/components/layout/NewsletterForm";
import { Reveal, Parallax } from "@/components/ui/Reveal";
import { ArrowIcon, ChevronIcon } from "@/components/ui/Icons";
import { SectionTitle } from "./SectionTitle";
import { LineIcon } from "@/components/ui/LineIcons";
import { ProductOrbit } from "./ProductOrbit";
import { homeMedia } from "@/data/home";
import { euro } from "@/lib/format";
import { useStore } from "@/lib/store";
import { loyalty, welcomeOffer } from "@/data/config";

const wrap = "mx-auto max-w-[1400px] px-4 md:px-8";

/* ───────── SECTION 3 — Shop by category ───────── */
export function ShopByCategory() {
  const slugs = ["nettoyants", "toners", "serums", "cremes", "masques", "patchs", "contours-yeux", "brumes"];
  const cats = slugs.map((s) => typeCategories.find((c) => c.slug === s)!);
  const all = getProducts();
  const reduce = useReducedMotion();
  const pastel = ["#EFEEEA", "#EFEEEA", "#EFEEEA", "#EFEEEA", "#EFEEEA", "#EFEEEA", "#EFEEEA", "#EFEEEA"];
  return (
    <section className={`${wrap} py-24 md:py-32`}>
      <SectionTitle eyebrow="Nos catégories" title="Trouve le soin qui te ressemble" />
      <ProductOrbit
        items={cats.map((c) => ({
          product: all.find((x) => c.types.includes(x.type) && x.bestseller) ?? all.find((x) => c.types.includes(x.type))!,
          category: c.short,
          href: `/soins-visage/${c.slug}`,
        }))}
      />
      {/* Grille en quinconce : les cartes se déroulent de bas en haut, puis le produit surgit ; au survol il sort du cadre. */}
      <div className="no-scrollbar -mx-4 mt-16 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-10 pt-10 md:mx-0 md:grid md:grid-cols-4 md:gap-x-5 md:gap-y-14 md:overflow-visible md:px-0 md:pb-12">
        {cats.map((c, i) => {
          const p = all.find((x) => c.types.includes(x.type) && x.bestseller) ?? all.find((x) => c.types.includes(x.type))!;
          const count = all.filter((x) => c.types.includes(x.type)).length;
          const col = i % 4;
          return (
            <motion.div
              key={c.slug}
              className={`w-[62vw] shrink-0 snap-start sm:w-[40vw] md:w-auto ${col % 2 ? "md:translate-y-12" : ""}`}
              initial={reduce ? false : "hidden"}
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
            >
              <Link href={`/soins-visage/${c.slug}`} className="group relative block aspect-[4/5] focus-visible:outline-none">
                {/* Fond qui se déroule */}
                <motion.div
                  className="absolute inset-0 rounded-[var(--radius-card)]"
                  style={{ background: pastel[i] }}
                  variants={{ hidden: { clipPath: "inset(100% 0% 0% 0%)" }, show: { clipPath: "inset(0% 0% 0% 0%)", transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: col * 0.09 + Math.floor(i / 4) * 0.12 } } }}
                />
                {/* Cercle qui s'élargit au survol */}
                <span aria-hidden className="absolute left-1/2 top-[42%] h-[46%] w-[58%] -translate-x-1/2 -translate-y-1/2 scale-75 rounded-full bg-ivory/70 opacity-0 transition-all duration-700 ease-[var(--ease-glow)] group-hover:scale-110 group-hover:opacity-100" />
                {/* Produit qui surgit puis sort du cadre au survol */}
                <motion.div
                  className="absolute inset-x-[20%] bottom-[22%] top-[6%]"
                  variants={{ hidden: { y: 70, opacity: 0, rotate: col % 2 ? 8 : -8 }, show: { y: 0, opacity: 1, rotate: 0, transition: { type: "spring", stiffness: 140, damping: 13, delay: 0.35 + col * 0.09 + Math.floor(i / 4) * 0.12 } } }}
                >
                  <div className="h-full w-full transition-transform duration-700 ease-[var(--ease-glow)] group-hover:-translate-y-[16%] group-hover:scale-[1.14] group-hover:rotate-[-3deg]">
                    <Packshot product={p} className="h-full w-full drop-shadow-[0_14px_16px_rgba(31,51,41,0.14)]" showTag={false} sizes="(max-width:768px) 50vw, 20vw" />
                  </div>
                </motion.div>
                <motion.div
                  className="absolute inset-x-4 bottom-4 flex items-end justify-between"
                  variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.55 + col * 0.09 + Math.floor(i / 4) * 0.12 } } }}
                >
                  <div>
                    <p className="font-display text-2xl">{c.short}</p>
                    <p className="text-xs text-forest-soft">{count} soin{count > 1 ? "s" : ""}</p>
                  </div>
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-ivory transition-all duration-500 group-hover:rotate-[-45deg] group-hover:bg-forest group-hover:text-ivory"><ArrowIcon size={18} /></span>
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

/* ───────── SECTION 4 — 7 best-sellers ───────── */
export function Bestsellers() {
  const items = getBestsellers();
  const track = useRef<HTMLDivElement>(null);
  const scroll = (d: number) => track.current?.scrollBy({ left: d * track.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <section className="relative overflow-hidden bg-blush-soft py-24 md:py-32">
      <div className={wrap}>
        <div className="flex items-end justify-between gap-6">
          <SectionTitle eyebrow="Nos 7 best-sellers" title="The Glow Favorites" intro="Les soins que notre communauté rachète encore et encore." />
          <div className="hidden gap-2 md:flex">
            <button onClick={() => scroll(-1)} className="grid h-12 w-12 rotate-180 place-items-center rounded-full bg-ivory transition hover:bg-forest hover:text-ivory" aria-label="Précédent"><ChevronIcon /></button>
            <button onClick={() => scroll(1)} className="grid h-12 w-12 place-items-center rounded-full bg-ivory transition hover:bg-forest hover:text-ivory" aria-label="Suivant"><ChevronIcon /></button>
          </div>
        </div>
      </div>
      <div ref={track} className="no-scrollbar mt-12 flex snap-x snap-mandatory scroll-px-4 gap-5 overflow-x-auto px-4 pb-6 md:scroll-px-[max(2rem,calc((100vw-1400px)/2+2rem))] md:px-[max(2rem,calc((100vw-1400px)/2+2rem))]">
        {items.map((p, i) => (
          <Reveal key={p.id} delay={i * 0.06} className="w-[72vw] shrink-0 snap-start sm:w-[44vw] md:w-[30vw] lg:w-[23vw]">
            <p className="mb-3 border-b border-forest/15 pb-2 text-xs font-semibold tracking-[0.2em] text-forest/50">{String(i + 1).padStart(2, "0")}</p>
            <Parallax amount={i % 2 ? 22 : -10} className="will-change-transform">
              <ProductCard product={p} priority={i < 2} />
            </Parallax>
          </Reveal>
        ))}
        <Link href="/best-sellers" className="group grid w-[60vw] shrink-0 snap-start place-items-center rounded-[var(--radius-card)] bg-forest p-8 text-center text-ivory sm:w-[30vw] lg:w-[18vw]">
          <span>
            <span className="font-display text-3xl">Voir tous les best-sellers</span>
            <span className="mx-auto mt-4 grid h-12 w-12 place-items-center rounded-full bg-ivory text-forest transition group-hover:translate-x-2"><ArrowIcon /></span>
          </span>
        </Link>
      </div>
    </section>
  );
}

/* ───────── SECTION 5 — Shop by skin concern ───────── */
export function ShopByConcern() {
  const pick = [
    { slug: "acne-imperfections", title: "Imperfections", heroId: "sc-sr-01" },
    { slug: "peau-deshydratee", title: "Hydratation", heroId: "sc-sr-03" },
    { slug: "glow-eclat", title: "Glow", heroId: "sc-sr-02" },
    { slug: "rougeurs", title: "Rougeurs", heroId: "sc-sr-04" },
    { slug: "peau-grasse", title: "Peau grasse", heroId: "sc-cr-03" },
    { slug: "cernes", title: "Cernes", heroId: "sc-ey-01" },
    { slug: "rides-ridules", title: "Premières ridules", heroId: "sc-sr-05" },
  ].map((x) => ({ ...x, c: concernCategories.find((c) => c.slug === x.slug)! }));
  const all = getProducts();
  // Un produit différent par carte : en priorité un soin dont la préoccupation principale correspond.
  const used = new Set<string>();
  const tiles = pick.map((x) => {
    const prods = all.filter((p) => p.concerns.some((c) => x.c.concerns.includes(c)));
    const ranked = [...prods].sort((a, b) => Number(x.c.concerns.includes(b.concerns[0])) - Number(x.c.concerns.includes(a.concerns[0])) || Number(!!b.bestseller) - Number(!!a.bestseller));
    const hero = prods.find((p) => p.id === x.heroId) ?? ranked.find((p) => !used.has(p.id) && p.type !== "accessoire") ?? ranked[0];
    if (hero) used.add(hero.id);
    return { ...x, prods, hero };
  });
  return (
    <section className={`${wrap} py-24 md:py-32`}>
      <SectionTitle eyebrow="Par préoccupation" title="Ta peau, tes besoins" intro="Chaque peau est unique. Choisis ta préoccupation, on s'occupe du reste." />
      <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
        {tiles.map((x, i) => (
          <Reveal key={x.slug} delay={i * 0.05} className={i === 0 ? "col-span-2 row-span-2" : ""}>
            <Link href={`/soins-visage/${x.slug}`} className={`@container group relative flex h-full flex-col justify-between overflow-hidden rounded-[var(--radius-card)] p-5 transition-all duration-500 hover:shadow-[var(--shadow-lift)] ${i === 0 ? "min-h-[360px] md:min-h-[480px]" : "min-h-[200px] md:min-h-[230px]"}`} style={{ background: x.c.bg }}>
              <div className={`absolute right-2 ${i === 0 ? "bottom-0 h-[70%] w-[44%]" : "top-2 h-[50%] w-[44%] md:bottom-0 md:top-auto md:h-[58%] md:w-[38%]"} transition-transform duration-700 group-hover:-translate-y-2 group-hover:rotate-3`}>
                {x.hero && (
                  <Parallax amount={i === 0 ? 34 : 18} rotate={i % 2 ? 5 : -4} className="h-full w-full">
                    <Packshot product={x.hero} className="h-full w-full" showTag={false} sizes="25vw" />
                  </Parallax>
                )}
              </div>
              <span className="relative eyebrow text-forest/50">{String(i + 1).padStart(2, "0")}</span>
              {/* Le texte reste à gauche du flacon */}
              <div className={`relative ${i === 0 ? "max-w-[56%]" : "md:max-w-[60%]"}`}>
                <p className={`font-display leading-[0.95] ${i === 0 ? "text-[clamp(1.75rem,8cqw,3.75rem)]" : "text-[clamp(1.15rem,10.5cqw,1.875rem)] md:text-[clamp(1.15rem,8.5cqw,1.875rem)]"}`}>{x.title}</p>
                <p className="mt-2 text-xs text-forest-soft">{x.prods.length} soins adaptés</p>
                {i === 0 && <p className="mt-3 text-sm">{x.c.intro}</p>}
              </div>
            </Link>
          </Reveal>
        ))}
        {/* Dernière ligne complétée : accès au Skin Diag */}
        <Reveal delay={tiles.length * 0.05} className="col-span-2">
          <Link href="/skin-diag" className="group flex h-full min-h-[200px] flex-col justify-between bg-forest p-5 text-ivory transition-all duration-500 hover:shadow-[var(--shadow-lift)] md:min-h-[230px] md:p-7">
            <span className="eyebrow text-ivory/60">Skin Diag</span>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-display text-2xl leading-[0.95] md:text-4xl">Pas sûr·e de ta préoccupation ?</p>
                <p className="mt-2 max-w-sm text-sm text-ivory/75">10 questions, 2 minutes : on identifie ton type de peau et on compose ta routine.</p>
              </div>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ivory text-forest transition group-hover:translate-x-1"><ArrowIcon /></span>
            </div>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────── SECTION 6 — Philosophie ───────── */
export function Philosophy() {
  const vals = [
    { icon: "rabbit", t: "Cruelty-free", d: "Aucun test sur les animaux, ni sur nos produits finis ni sur nos ingrédients.", bg: "#EFEEEA" },
    { icon: "sprout", t: "Ingrédients d'origine naturelle", d: "Une forte proportion d'ingrédients d'origine naturelle — le pourcentage exact est indiqué produit par produit dès validation.", bg: "#EFEEEA" },
    { icon: "list", t: "Transparence", d: "Listes INCI complètes, rôle de chaque ingrédient clé, précautions : tout est sur la fiche.", bg: "#EFEEEA" },
    { icon: "people", t: "Des routines pour chacun·e", d: "Le Skin Diag construit une routine adaptée à ta peau, ton temps et ton budget.", bg: "#EFEEEA" },
    { icon: "tag", t: "Beauté accessible", d: "Des soins entre 7 et 36 €, et zéro injonction à la peau parfaite.", bg: "#F4F3EF" },
  ];
  return (
    <section className="relative overflow-hidden bg-sage-soft py-24 md:py-32">
      <div className={`${wrap} relative grid gap-14 lg:grid-cols-[1fr_1.2fr] lg:items-center`}>
        <div>
          <SectionTitle eyebrow="Notre philosophie" title="Douce avec ta peau, exigeante avec nos formules." />
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-lg text-forest-soft">SKINCLEAN est né d&apos;une idée simple : prendre soin de sa peau devrait être un moment agréable, pas une course à la perfection. On formule des soins efficaces, sensoriels et transparents, pour que chacun·e trouve son glow.</p>
            <Link href="/nos-engagements" className="btn btn-primary mt-8">Nos engagements</Link>
          </Reveal>
          <Parallax amount={40} className="relative mt-12 hidden h-64 lg:block">
            <div className="absolute left-0 top-0 h-56 w-44 animate-float"><Packshot product={getProduct("sc-sr-07")!} className="h-full w-full" showTag={false} /></div>
            <div className="absolute left-40 top-10 h-48 w-40 animate-float-slow"><Packshot product={getProduct("sc-sr-04")!} className="h-full w-full" showTag={false} /></div>
          </Parallax>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {vals.map((v, i) => (
            <Reveal key={v.t} delay={i * 0.08} className={i === 4 ? "sm:col-span-2" : ""}>
              <motion.div className="h-full border-t border-forest/20 rounded-[var(--radius-card)] p-6" style={{ background: v.bg }}>
                <div className="flex items-center justify-between">
                  <motion.span whileHover={{ rotate: -8, scale: 1.08 }} className="grid h-11 w-11 place-items-center rounded-full border border-forest/25 text-forest"><LineIcon name={v.icon} size={22} /></motion.span>
                  <span className="text-xs font-medium tracking-[0.12em] text-forest-soft">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <p className="mt-4 font-display text-2xl">{v.t}</p>
                <p className="mt-2 text-sm text-forest-soft">{v.d}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── SECTION 7 — Avant / Après ───────── */
export function BeforeAfterSection() {
  return (
    <section className={`${wrap} py-24 md:py-32`}>
      <SectionTitle eyebrow="Résultats visuels" title="Avant / après" intro="Fais glisser le curseur pour comparer." center />
      <div className="mx-auto mt-12 grid max-w-4xl gap-8 md:grid-cols-2">
        {homeMedia.beforeAfter.slice(0, 2).map((b, i) => {
          const p = getProduct(b.productId)!;
          return (
            <Reveal key={i} delay={i * 0.1}>
              <BeforeAfter demo={b.demo} before={b.before} after={b.after} labelAfter={`Après ${b.duration}`} caption={b.caption} illustrative={b.illustrative} simulated={"simulated" in b && !!b.simulated} />
              <p className="mt-2 text-sm text-forest-soft"><b className="font-medium text-forest">{b.duration}</b> avec {p.name}, {b.usage}</p>
              <Link href={`/produits/${p.slug}`} className="mt-1 inline-flex items-center gap-2 text-sm font-semibold hover:underline">Découvrir {p.name} <ArrowIcon size={16} /></Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ───────── SECTION 8 — Kits de saison ───────── */
export function SeasonalKits() {
  const kits = getKits().filter((k) => k.group === "saison");
  const kd = useStore((s) => s.kitDiscounts);
  const season: Record<string, string> = { ete: "Été", hiver: "Hiver", printemps: "Printemps", automne: "Automne" };
  return (
    <section className="bg-butter-soft py-24 md:py-32">
      <div className={wrap}>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionTitle eyebrow="Kits de saison" title="Une routine pour chaque saison" />
          <Link href="/kits-de-saison" className="btn btn-ghost">Tous les kits de saison</Link>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {kits.map((k, i) => {
            const pr = kitPricing({ ...k, discountPercent: kd[k.id] ?? k.discountPercent });
            return (
              <Reveal key={k.id} delay={i * 0.08}>
                <Link href={`/kits/${k.slug}`} className="group block h-full overflow-hidden rounded-[var(--radius-card)] bg-ivory transition-shadow hover:shadow-[var(--shadow-lift)]">
                  <div className="relative aspect-[5/4] overflow-hidden" style={{ background: k.color }}>
                    <span className="absolute left-4 top-4 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-forest/60">{k.season ? season[k.season] : ""}</span>
                    {pr.lines.slice(0, 4).map((l, j) => (
                      <div key={l.product.id} className="absolute bottom-[8%] h-[62%] w-[30%] transition-transform duration-700 group-hover:-translate-y-3" style={{ left: `${6 + j * 21}%`, transform: `rotate(${(j - 1.5) * 6}deg)`, transitionDelay: `${j * 50}ms`, zIndex: j === 1 || j === 2 ? 2 : 1 }}>
                        <Parallax amount={10 + j * 8} rotate={(j - 1.5) * 3} className="h-full w-full">
                          <Packshot product={l.product} className="h-full w-full" showTag={false} sizes="15vw" />
                        </Parallax>
                      </div>
                    ))}
                  </div>
                  <div className="p-5">
                    <p className="font-display text-2xl">{k.name}</p>
                    <p className="text-sm text-forest-soft">{k.tagline}</p>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-lg font-semibold">{euro(pr.price)}</span>
                      <span className="text-sm text-forest-soft line-through">{euro(pr.separate)}</span>
                      {pr.saving > 0 && <span className="chip ml-auto bg-sage">-{euro(pr.saving)}</span>}
                    </div>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ───────── SECTION 9 — Trouve ta routine ───────── */
export function RoutineCTA() {
  const reduce = useReducedMotion();
  const video = useRef<HTMLVideoElement>(null);
  const box = useRef<HTMLDivElement>(null);

  // La vidéo ne joue que lorsque l'encart est visible (économise batterie et données).
  useEffect(() => {
    const v = video.current, el = box.current;
    if (!v || !el || reduce) return;
    v.playbackRate = 0.8;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  return (
    <section className="px-4 py-12 md:px-8">
      <div ref={box} className="relative mx-auto max-w-[1400px] overflow-hidden rounded-none bg-forest px-6 py-20 text-center text-ivory md:py-32">
        {/* Vidéo d'ambiance : zoomée depuis le haut pour sortir du cadre la mention de l'outil de génération (coin inférieur droit). */}
        <div aria-hidden className="absolute inset-0">
          {reduce ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={homeMedia.skinDiagPoster} alt="" className="h-full w-full object-cover object-[40%_center]" />
          ) : (
            <video
              ref={video}
              src={homeMedia.skinDiagVideo}
              poster={homeMedia.skinDiagPoster}
              muted loop playsInline preload="none"
              className="h-full w-full origin-top scale-[1.16] object-cover object-[40%_center]"
            />
          )}
          <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_50%,rgba(31,51,41,0.78),rgba(31,51,41,0.55))]" />
        </div>
        <div className="relative">
          <Reveal><p className="eyebrow text-sage">Skin Diag</p></Reveal>
          <Reveal delay={0.1}><h2 className="mx-auto mt-4 max-w-3xl font-display text-[clamp(2.4rem,6vw,5rem)] leading-[0.95]">2 minutes pour découvrir ta routine idéale</h2></Reveal>
          <Reveal delay={0.2}><p className="mx-auto mt-5 max-w-lg text-ivory/80">10 questions, une routine matin & soir pensée pour ta peau, ton temps et ton budget. Sans inscription obligatoire.</p></Reveal>
          <Reveal delay={0.3}><Link href="/skin-diag" className="btn btn-light mt-8 px-8 py-4 text-base">Faire mon Skin Diag <ArrowIcon size={18} /></Link></Reveal>
          <div className="mt-10 flex flex-wrap justify-center gap-3 text-sm">
            {["Type de peau", "Préoccupations", "Sensibilité", "Objectifs", "Temps", "Budget"].map((t, i) => (
              <motion.span key={t} className="chip border border-ivory/25 bg-ivory/10 px-4 py-2 text-ivory backdrop-blur-sm" initial={{ opacity: 0, scale: 0.6 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 + i * 0.07, type: "spring" }}>{t}</motion.span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── SECTION 11 — Newsletter ───────── */
export function NewsletterSection() {
  return (
    <section className="px-4 pb-28 pt-20 md:px-8 md:pt-28">
      <Reveal>
        <div className="relative mx-auto grid max-w-[1400px] items-center gap-10 overflow-hidden border border-line bg-ivory px-6 py-14 shadow-[var(--shadow-lift)] md:grid-cols-2 md:px-14 md:py-20">
          {/* Liseré vert : délimite nettement l'encart */}
          <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-forest" />
          <div className="relative">
            <p className="eyebrow text-sage-deep">Newsletter</p>
            <h2 className="mt-3 font-display text-[clamp(2.4rem,5vw,4.2rem)] leading-[0.95]">Join the Glow Club</h2>
            <p className="mt-4 max-w-md text-forest-soft">Inscris-toi à notre newsletter et reçois {loyalty.newsletterBonus} feuilles pour commencer ton aventure SKINCLEAN, plus <b>-{welcomeOffer.newsletterPercent} %</b> sur ta première commande éligible.</p>
            <p className="mt-2 text-xs text-forest-soft">Avantages accordés une seule fois, après confirmation de ton adresse. Les feuilles sont créditées sur ton compte fidélité.</p>
          </div>
          <div className="relative"><NewsletterForm /></div>
          <Parallax amount={20} rotate={8} className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 text-sage">
            <LineIcon name="leaf" size={176} strokeWidth={0.8} />
          </Parallax>
        </div>
      </Reveal>
    </section>
  );
}

