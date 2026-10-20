import type { Metadata } from "next";
import { getBestsellers } from "@/lib/catalog";
import { PageHero } from "@/components/catalog/PageHero";
import { ProductCard } from "@/components/product/ProductCard";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = { title: "Nos 7 best-sellers", description: "The Glow Favorites : les 7 soins SKINCLEAN préférés de notre communauté." };

export default function Bestsellers() {
  const items = getBestsellers();
  return (
    <>
      <PageHero eyebrow="Nos 7 best-sellers" title="The Glow Favorites" intro="Sept soins devenus les essentiels de notre communauté. Une base idéale pour construire ta routine." bg="#EFEEEA" crumbs={[{ href: "/best-sellers", label: "Best-sellers" }]} />
      <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-x-4 gap-y-12 px-4 py-14 md:grid-cols-3 md:gap-x-6 md:px-8 lg:grid-cols-4">
        {items.map((p, i) => (
          <Reveal key={p.id} delay={i * 0.06}>
            <p className="mb-2 font-display text-4xl text-forest/20">{String(i + 1).padStart(2, "0")}</p>
            <ProductCard product={p} priority={i < 4} />
          </Reveal>
        ))}
      </div>
    </>
  );
}
