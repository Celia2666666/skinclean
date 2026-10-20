import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { categoryOfType, complementary, getProduct, getProducts } from "@/lib/catalog";
import { concernCategories, concernLabels, skinTypeLabels, stepLabels } from "@/data/categories";
import { ProductGallery } from "@/components/product/ProductGallery";
import { BuyBox } from "@/components/product/BuyBox";
import { ProductCard } from "@/components/product/ProductCard";
import { BeforeAfter } from "@/components/product/BeforeAfter";
import { Packshot } from "@/components/product/Packshot";
import { Accordion } from "@/components/ui/Accordion";
import { Reveal } from "@/components/ui/Reveal";
import { MoonIcon, SunIcon } from "@/components/ui/Icons";
import { siteUrlPublic } from "@/lib/site";
import { productSeo } from "@/lib/site-overrides";
import { realRatingStats } from "@/lib/reviews";
import { RatingSummary } from "@/components/reviews/RatingSummary";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";

export function generateStaticParams() {
  return getProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/produits/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) return {};
  const seo = productSeo(p.id); // titre / meta description optimisés depuis le Marketing Hub (module SEO)
  return {
    title: seo.seoTitle || `${p.name} — ${p.kind}`,
    description: seo.seoDescription || `${p.tagline}. ${p.description.slice(0, 140)}`,
    openGraph: { images: p.media.packshot ? [p.media.packshot] : ["/media/brand/logo-full.webp"] },
    alternates: { canonical: `/produits/${p.slug}` },
  };
}

export default async function ProductPage({ params }: PageProps<"/produits/[slug]">) {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) notFound();
  const cat = categoryOfType(p);
  const comp = complementary(p, 4);
  const concernCats = concernCategories.filter((c) => p.concerns.some((x) => c.concerns.includes(x)));
  const isAccessory = p.type === "accessoire";

  const real = realRatingStats(p.id);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `SKINCLEAN ${p.name}`,
    description: p.description,
    sku: p.id,
    brand: { "@type": "Brand", name: "SKINCLEAN" },
    // Avis de démonstration exclus : seule une note issue de vrais avis est déclarée
    ...(real.count ? { aggregateRating: { "@type": "AggregateRating", ratingValue: real.avg, reviewCount: real.count, bestRating: 5 } } : {}),
    image: p.media.packshot ? [`${siteUrlPublic()}${p.media.packshot}`] : undefined,
    offers: p.variants.map((v) => ({
      "@type": "Offer",
      sku: `${p.id}-${v.id}`,
      price: v.price.toFixed(2),
      priceCurrency: "EUR",
      availability: v.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${siteUrlPublic()}/produits/${p.slug}`,
    })),
  };

  const howSteps = [
    { t: "Prépare", d: p.step === "nettoyage" || p.step === "demaquillage" ? "Mouille ton visage (ou garde-le sec pour un baume)." : "Pars d'une peau propre, nettoyée en douceur." },
    { t: "Applique", d: p.usage },
    { t: "Sublime", d: p.tips[0] ?? "Poursuis ta routine, du plus fluide au plus épais." },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="mx-auto max-w-[1400px] px-4 pb-10 pt-6 md:px-8">
        <nav aria-label="Fil d'Ariane" className="mb-6 text-xs text-forest-soft">
          <ol className="flex flex-wrap gap-1.5">
            <li><Link href="/" className="hover:underline">Accueil</Link> /</li>
            <li><Link href="/soins-visage" className="hover:underline">Soins visage</Link> /</li>
            {cat && <li><Link href={`/soins-visage/${cat.slug}`} className="hover:underline">{cat.short}</Link> /</li>}
            <li aria-current="page">{p.name}</li>
          </ol>
        </nav>
        <div className="grid gap-10 md:grid-cols-2 md:gap-14">
          <ProductGallery product={p} />
          <div>
            <div className="flex flex-wrap gap-2">
              {p.bestseller && <span className="chip bg-forest text-ivory">Best-seller</span>}
              {p.isNew && <span className="chip bg-blush">Nouveau</span>}
              <span className="chip bg-ivory">{stepLabels[p.step]}</span>
            </div>
            <h1 className="mt-4 font-display text-[clamp(2.6rem,5vw,4.2rem)] leading-[0.95]">{p.name}</h1>
            <p className="mt-2 text-lg text-forest-soft">{p.kind}</p>
            <div className="mt-2"><RatingSummary productId={p.id} size={16} link /></div>
            <p className="mt-5 text-lg text-forest/80">{p.tagline}</p>
            {p.benefits.length > 0 && <ul className="mt-5 space-y-2">
              {p.benefits.map((b) => <li key={b} className="flex items-start gap-2"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sage-deep" />{b}</li>)}
            </ul>}
            {!isAccessory && <div className="mt-6 flex flex-wrap gap-2 text-xs">
              {p.skinTypes.map((s) => <span key={s} className="chip bg-sky">{skinTypeLabels[s]}</span>)}
            </div>}
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {concernCats.map((c) => <Link key={c.slug} href={`/soins-visage/${c.slug}`} className="chip bg-blush-soft hover:bg-blush">{c.short}</Link>)}
            </div>
            <div className="mt-4 flex gap-3 text-sm">
              {p.moments.includes("matin") && <span className="flex items-center gap-1.5 border border-line px-3 py-1.5"><SunIcon size={16} /> Matin</span>}
              {p.moments.includes("soir") && <span className="flex items-center gap-1.5 border border-line px-3 py-1.5"><MoonIcon size={16} /> Soir</span>}
              <span className="border border-line px-3 py-1.5">{p.frequency}</span>
            </div>
            <div className="mt-8"><BuyBox product={p} /></div>

            {p.keyIngredients.length > 0 && <div className="mt-10">
              <p className="eyebrow mb-4 text-forest/60">{isAccessory ? "Matière" : "Ingrédients clés"}</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {p.keyIngredients.map((k, i) => (
                  <Reveal key={k.name} delay={i * 0.08}>
                    <div className="h-full rounded-none p-4" style={{ background: i % 2 ? "#EFEEEA" : p.color.bg }}>
                      <p className="font-semibold leading-tight">{k.name}</p>
                      <p className="mt-1 text-xs text-forest-soft">{k.role}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>}

            <div className="mt-10">
              <Accordion
                defaultOpen={0}
                items={[
                  { title: "Description", content: <p>{p.description}</p> },
                  ...(p.usage ? [{ title: isAccessory ? "Utilisation & entretien" : "Conseils d'application", content: <><p>{p.usage}</p>{p.tips.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5">{p.tips.map((t) => <li key={t}>{t}</li>)}</ul>}</> }] : []),
                  ...(isAccessory ? [] : [{ title: "Composition (INCI)", content: <><p className="text-sm">{p.inci}</p><p className="mt-2 text-xs text-forest-soft">Liste de démonstration modifiable — à remplacer par la liste INCI validée. {p.naturalOrigin != null ? `${p.naturalOrigin} % d'ingrédients d'origine naturelle.` : "Pourcentage d'ingrédients d'origine naturelle communiqué après validation de la formule."}</p></> }]),
                  ...(p.precautions?.length ? [{ title: "Précautions", content: <ul className="list-disc space-y-1 pl-5">{p.precautions.map((t) => <li key={t}>{t}</li>)}</ul> }] : []),
                  ...(p.faq.length ? [{ title: "Questions fréquentes", content: <div className="space-y-4">{p.faq.map((f) => <div key={f.q}><p className="font-semibold">{f.q}</p><p>{f.a}</p></div>)}</div> }] : []),
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Comment l'utiliser ? */}
      {!isAccessory && <section className="mt-16 bg-sky-soft py-20">
        <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-4 md:grid-cols-2 md:px-8">
          <Reveal>
            <div className="relative aspect-[4/5] overflow-hidden rounded-none">
              {p.media.howToVideo ? <video src={p.media.howToVideo} controls playsInline preload="none" className="h-full w-full object-cover" /> : <div className="h-full w-full p-[12%]" style={{ background: p.color.bg }}><Packshot product={p} className="h-full w-full" showTag={false} /></div>}
            </div>
          </Reveal>
          <div>
            <p className="eyebrow text-sage-deep">Tutoriel</p>
            <h2 className="mt-3 font-display text-5xl">Comment l&apos;utiliser ?</h2>
            <ol className="mt-8 space-y-6">
              {howSteps.map((s, i) => (
                <Reveal key={s.t} delay={i * 0.1}>
                  <li className="flex gap-5">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ivory font-display text-xl">{i + 1}</span>
                    <div><p className="font-display text-2xl">{s.t}</p><p className="mt-1 text-forest-soft">{s.d}</p></div>
                  </li>
                </Reveal>
              ))}
            </ol>
            <p className="mt-6 text-sm text-forest-soft">Fréquence : {p.frequency} · Étape de routine : {stepLabels[p.step]}</p>
          </div>
        </div>
      </section>}

      {p.media.beforeAfter?.length ? (
        <section className="mx-auto max-w-[1400px] px-4 py-20 md:px-8">
          <h2 className="font-display text-5xl">Avant / après</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {p.media.beforeAfter.map((b) => <BeforeAfter key={b.before} before={b.before} after={b.after} caption={b.caption} />)}
          </div>
        </section>
      ) : null}

      {/* Complète ta routine */}
      <section className="mx-auto max-w-[1400px] px-4 py-20 md:px-8">
        <p className="eyebrow text-sage-deep">Complète ta routine</p>
        <h2 className="mt-3 font-display text-5xl">Ils s&apos;accordent parfaitement</h2>
        <p className="mt-3 max-w-xl text-forest-soft">{isAccessory ? "Les soins à associer à ton rituel." : <>Sélectionnés parce qu&apos;ils ciblent aussi {p.concerns.slice(0, 2).map((c) => concernLabels[c].toLowerCase()).join(" et ")}, à une autre étape de la routine.</>}</p>
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
          {comp.map((c, i) => <Reveal key={c.id} delay={i * 0.06}><ProductCard product={c} /></Reveal>)}
        </div>
      </section>

      <ReviewsSection productId={p.id} productName={p.name} isAccessory={isAccessory} />
    </>
  );
}
