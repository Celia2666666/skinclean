import type { Metadata } from "next";
import { getProducts } from "@/lib/catalog";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";
import { PageHero } from "@/components/catalog/PageHero";
import Link from "next/link";
import { concernCategories, typeCategories } from "@/data/categories";

export const metadata: Metadata = { title: "Tous les soins visage", description: "Nettoyants, sérums, crèmes, masques, SPF : tous les soins visage SKINCLEAN, à filtrer par type de peau et préoccupation." };

export default function AllProducts() {
  return (
    <>
      <PageHero eyebrow="Soins visage" title="Tous nos soins" intro="Chaque soin a une seule fiche, reliée à toutes les préoccupations qu'il cible. Filtre par type de peau, préoccupation ou budget." crumbs={[{ href: "/soins-visage", label: "Soins visage" }]}>
        <div className="no-scrollbar mt-8 flex gap-2 overflow-x-auto pb-2">
          {typeCategories.map((c) => <Link key={c.slug} href={`/soins-visage/${c.slug}`} className="chip shrink-0 bg-ivory/80 px-4 py-2 text-sm transition hover:bg-ivory">{c.short}</Link>)}
        </div>
        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-2">
          {concernCategories.map((c) => <Link key={c.slug} href={`/soins-visage/${c.slug}`} className="chip shrink-0 bg-ivory/50 px-4 py-2 text-sm transition hover:bg-ivory">{c.short}</Link>)}
        </div>
      </PageHero>
      <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-8"><CatalogGrid products={getProducts()} /></div>
    </>
  );
}
