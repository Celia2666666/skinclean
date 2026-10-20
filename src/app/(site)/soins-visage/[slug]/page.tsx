import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { allCategoryDefs } from "@/data/categories";
import { getCategory, getCategoryProducts } from "@/lib/catalog";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";
import { PageHero } from "@/components/catalog/PageHero";

export function generateStaticParams() {
  return allCategoryDefs().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/soins-visage/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const c = getCategory(slug);
  return c ? { title: c.label, description: c.intro } : {};
}

export default async function CategoryPage({ params }: PageProps<"/soins-visage/[slug]">) {
  const { slug } = await params;
  const c = getCategory(slug);
  if (!c) notFound();
  const products = getCategoryProducts(slug);
  return (
    <>
      <PageHero eyebrow={c.group === "type" ? "Par type de produit" : c.group === "concern" ? "Par préoccupation" : "Découvrir"} title={c.label} intro={c.intro} bg={c.bg} crumbs={[{ href: "/soins-visage", label: "Soins visage" }, { href: `/soins-visage/${slug}`, label: c.label }]}>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/skin-diag" className="btn btn-primary">Pas sûr·e ? Fais ton Skin Diag</Link>
        </div>
      </PageHero>
      <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-8">
        <CatalogGrid products={products} hideType={c.group === "type"} hideConcern={c.group === "concern"} />
      </div>
    </>
  );
}
