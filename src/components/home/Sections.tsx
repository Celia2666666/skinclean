"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRef } from "react";
import { typeCategories, concernCategories } from "@/data/categories";
import { getBestsellers, getKits, getProduct, getProducts, kitPricing } from "@/lib/catalog";
import { Packshot } from "@/components/product/Packshot";
import { ProductCard } from "@/components/product/ProductCard";
import { BeforeAfter } from "@/components/product/BeforeAfter";
import { NewsletterForm } from "@/components/layout/NewsletterForm";
import { Reveal, Parallax, Stagger, staggerItem } from "@/components/ui/Reveal";
import { ArrowIcon, ChevronIcon, DropIcon } from "@/components/ui/Icons";
import { SectionTitle } from "./SectionTitle";
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
  const pastel = ["#EFEEEA", "#EFEEEA", "#EFEEEA", "#EFEEEA", "#EFEEEA", "#EFEEEA", "#EFEEEA", "#EFEEEA"];
  return (
    <section className={`${wrap} py-24 md:py-32`}>
      <SectionTitle eyebrow="Shop by category" title="Trouve le soin qui te ressemble" />
      <Stagger className="no-scrollbar -mx-4 mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 md:mx-0 md:grid md:grid-cols-4 md:gap-5 md:overflow-visible md:px-0">
        {cats.map((c, i) => {
          const p = all.find((x) => c.types.includes(x.type) && x.bestseller) ?? all.find((x) => c.types.includes(x.type))!;
          const count = all.filter((x) => c.types.includes(x.type)).length;
          return (
            <motion.div key={c.slug} variants={staggerItem} className="w-[62vw] shrink-0 snap-start sm:w-[40vw] md:w-auto">
              <Link href={`/soins-visage/${c.slug}`} className="group relative block aspect-square overflow-hidden rounded-[var(--radius-card)] p-4" style={{ background: pastel[i] }}>
                <div className="absolute inset-x-[18%] bottom-[16%] top-[10%] transition-transform duration-700 ease-[var(--ease-glow)] group-hover:-translate-y-3 group-hover:rotate-[-4deg] group-hover:scale-110">
                  <Packshot product={p} className="h-full w-full" showTag={false} sizes="(max-width:768px) 50vw, 20vw" />
                </div>
                <div className="absolute inset-x-4 bottom-4 flex items-end justify-between">
                  <div>
                    <p className="font-display text-2xl">{c.short}</p>
                    <p className="text-xs text-forest-soft">{count} soin{count > 1 ? "s" : ""}</p>
                  </div>
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-ivory transition-all duration-500 group-hover:bg-forest group-hover:text-ivory"><ArrowIcon size={18} /></span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </Stagger>
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
      <div ref={track} className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-6 md:px-[max(2rem,calc((100vw-1400px)/2+2rem))]">
        {items.map((p, i) => (
          <Reveal key={p.id} delay={i * 0.06} className="w-[72vw] shrink-0 snap-start sm:w-[44vw] md:w-[30vw] lg:w-[23vw]">
            <p className="mb-3 border-b border-forest/15 pb-2 text-xs font-semibold tracking-[0.2em] text-forest/50">{String(i + 1).padStart(2, "0")}</p>
            <ProductCard product={p} priority={i < 2} />
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
    { slug: "acne-imperfections", title: "Imperfections" },
    { slug: "peau-deshydratee", title: "Hydratation" },
    { slug: "glow-eclat", title: "Glow" },
    { slug: "rougeurs", title: "Rougeurs" },
    { slug: "peau-grasse", title: "Peau grasse" },
    { slug: "cernes", title: "Cernes" },
    { slug: "rides-ridules", title: "Premières ridules" },
  ].map((x) => ({ ...x, c: concernCategories.find((c) => c.slug === x.slug)! }));
  const all = getProducts();
  return (
    <section className={`${wrap} py-24 md:py-32`}>
      <SectionTitle eyebrow="Shop by skin concern" title="Ta peau, tes besoins" intro="Chaque peau est unique. Choisis ta préoccupation, on s'occupe du reste." />
      <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
        {pick.map((x, i) => {
          const prods = all.filter((p) => p.concerns.some((c) => x.c.concerns.includes(c)));
          const hero = prods.find((p) => p.bestseller) ?? prods[0];
          return (
            <Reveal key={x.slug} delay={i * 0.05} className={i === 0 ? "col-span-2 row-span-2" : ""}>
              <Link href={`/soins-visage/${x.slug}`} className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-[var(--radius-card)] p-5 transition-all duration-500 hover:shadow-[var(--shadow-lift)] ${i === 0 ? "min-h-[360px] md:min-h-[480px]" : "min-h-[200px] md:min-h-[230px]"}`} style={{ background: x.c.bg }}>
                <div className={`absolute bottom-0 right-2 ${i === 0 ? "h-[70%] w-[55%]" : "h-[62%] w-[46%]"} transition-transform duration-700 group-hover:-translate-y-2 group-hover:rotate-3`}>
                  {hero && <Packshot product={hero} className="h-full w-full" showTag={false} sizes="25vw" />}
                </div>
                <span className="relative eyebrow text-forest/50">{String(i + 1).padStart(2, "0")}</span>
                <div className="relative">
                  <p className={`font-display leading-none ${i === 0 ? "text-5xl md:text-6xl" : "text-2xl md:text-3xl"}`}>{x.title}</p>
                  <p className="mt-2 text-xs text-forest-soft">{prods.length} soins adaptés</p>
                  {i === 0 && <p className="mt-3 max-w-[50%] text-sm">{x.c.intro}</p>}
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ───────── SECTION 6 — Philosophie ───────── */
export function Philosophy() {
  const vals = [
    { t: "Cruelty-free", d: "Un engagement de la marque : aucun test sur les animaux. Allégation à faire valider avant commercialisation.", bg: "#EFEEEA" },
    { t: "Ingrédients d'origine naturelle", d: "Une forte proportion d'ingrédients d'origine naturelle — le pourcentage exact est indiqué produit par produit dès validation.", bg: "#EFEEEA" },
    { t: "Transparence", d: "Listes INCI complètes, rôle de chaque ingrédient clé, précautions : tout est sur la fiche.", bg: "#EFEEEA" },
    { t: "Des routines pour chacun·e", d: "Le Skin Diag construit une routine adaptée à ta peau, ton temps et ton budget.", bg: "#EFEEEA" },
    { t: "Beauté accessible", d: "Des soins entre 7 et 36 €, et zéro injonction à la peau parfaite.", bg: "#F4F3EF" },
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
                <span className="text-xs font-medium tracking-[0.12em] text-forest-soft">{String(i + 1).padStart(2, "0")}</span>
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
              <BeforeAfter demo={b.demo} before={b.before} after={b.after} caption={b.caption} illustrative={b.illustrative} simulated={"simulated" in b && !!b.simulated} />
              <Link href={`/produits/${p.slug}`} className="mt-2 inline-flex items-center gap-2 text-sm font-semibold hover:underline">Avec {p.name} <ArrowIcon size={16} /></Link>
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
                        <Packshot product={l.product} className="h-full w-full" showTag={false} sizes="15vw" />
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
  return (
    <section className="px-4 py-12 md:px-8">
      <div className="relative mx-auto max-w-[1400px] overflow-hidden rounded-none bg-sky px-6 py-20 text-center md:py-32">
        <div className="relative">
          <Reveal><p className="eyebrow text-sage-deep">Skin Diag</p></Reveal>
          <Reveal delay={0.1}><h2 className="mx-auto mt-4 max-w-3xl font-display text-[clamp(2.4rem,6vw,5rem)] leading-[0.95]">2 minutes pour découvrir ta routine idéale</h2></Reveal>
          <Reveal delay={0.2}><p className="mx-auto mt-5 max-w-lg text-forest-soft">10 questions, une routine matin & soir pensée pour ta peau, ton temps et ton budget. Sans inscription obligatoire.</p></Reveal>
          <Reveal delay={0.3}><Link href="/skin-diag" className="btn btn-primary mt-8 px-8 py-4 text-base">Faire mon Skin Diag <ArrowIcon size={18} /></Link></Reveal>
          <div className="mt-10 flex flex-wrap justify-center gap-3 text-sm">
            {["Type de peau", "Préoccupations", "Sensibilité", "Objectifs", "Temps", "Budget"].map((t, i) => (
              <motion.span key={t} className="chip bg-ivory/80 px-4 py-2" initial={{ opacity: 0, scale: 0.6 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 + i * 0.07, type: "spring" }}>{t}</motion.span>
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
    <section className="px-4 pb-28 md:px-8">
      <div className="relative mx-auto grid max-w-[1400px] items-center gap-10 overflow-hidden rounded-none bg-blush px-6 py-14 md:grid-cols-2 md:px-14 md:py-20">
        <div className="relative">
          <p className="eyebrow text-sage-deep">Newsletter</p>
          <h2 className="mt-3 font-display text-[clamp(2.4rem,5vw,4.2rem)] leading-[0.95]">Join the Glow Club</h2>
          <p className="mt-4 max-w-md text-forest-soft">Inscris-toi à notre newsletter et reçois {loyalty.newsletterBonus} feuilles pour commencer ton aventure SKINCLEAN, plus <b>-{welcomeOffer.newsletterPercent} %</b> sur ta première commande éligible.</p>
          <p className="mt-2 text-xs text-forest-soft">Avantages accordés une seule fois, après confirmation de ton adresse. Les feuilles sont créditées sur ton compte fidélité.</p>
        </div>
        <div className="relative"><NewsletterForm /></div>
        <DropIcon className="absolute -right-6 -top-6 h-40 w-40 rotate-12 text-ivory/50" />
      </div>
    </section>
  );
}

