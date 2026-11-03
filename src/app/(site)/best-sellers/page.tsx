import type { Metadata } from "next";
import { SeoBlock } from "@/components/catalog/SeoBlock";
import { getBestsellers } from "@/lib/catalog";
import { PageHero } from "@/components/catalog/PageHero";
import { ProductCard } from "@/components/product/ProductCard";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Best-sellers skincare : les 7 soins favoris",
  description: "The Glow Favorites : les 7 soins SKINCLEAN préférés de notre communauté, du sérum niacinamide à la vitamine C, pour bâtir une routine simple.",
};

export default function Bestsellers() {
  const items = getBestsellers();
  return (
    <>
      <PageHero eyebrow="Nos 7 best-sellers" title="The Glow Favorites" intro="Sept soins devenus les essentiels de notre communauté. Une base idéale pour construire ta routine." bg="#EFEEEA" crumbs={[{ href: "/best-sellers", label: "Best-sellers" }]} />
      <h2 className="sr-only">Les 7 best-sellers</h2>
      <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-x-4 gap-y-12 px-4 py-14 md:grid-cols-3 md:gap-x-6 md:px-8 lg:grid-cols-4">
        {items.map((p, i) => (
          <Reveal key={p.id} delay={i * 0.06}>
            <p className="mb-2 font-display text-4xl text-forest/20">{String(i + 1).padStart(2, "0")}</p>
            <ProductCard product={p} priority={i < 4} />
          </Reveal>
        ))}
      </div>
      <SeoBlock title="Les essentiels de la communauté SKINCLEAN" links={[{ href: "/skin-diag", label: "Faire mon Skin Diag" }, { href: "/soins-visage", label: "Tous les soins visage" }, { href: "/kits", label: "Kits & routines" }]}>
        <p>Nos best-sellers couvrent les grandes étapes d&apos;une routine efficace : un nettoyage qui respecte la peau, un sérum ciblé selon ta préoccupation, une hydratation adaptée et une protection solaire au quotidien.</p>
        <p>Ce sont souvent les premiers soins choisis pour démarrer avec SKINCLEAN : ils se combinent facilement entre eux et conviennent à de nombreux types de peau. Pour savoir lesquels t&apos;iront le mieux, fais le Skin Diag : en deux minutes, il compose ta routine du matin et du soir.</p>
      </SeoBlock>
    </>
  );
}
