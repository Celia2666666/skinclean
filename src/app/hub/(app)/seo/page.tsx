import type { Metadata } from "next";
import { requirePageUser } from "@/lib/hub/auth";
import { list } from "@/lib/hub/repo";
import { connectors } from "@/lib/hub/connectors";
import { liveProducts, readOverrides } from "@/lib/hub/site-sync";
import { SeoView } from "@/components/hub/pages/SeoView";
import { markdownLinks } from "@/components/hub/Markdown";

export const metadata: Metadata = { title: "SEO" };

export default async function SeoPage() {
  await requirePageUser();
  const o = readOverrides();
  const products = liveProducts().map((p) => ({
    id: p.id, slug: p.slug, name: p.name, kind: p.kind, tagline: p.tagline, benefits: p.benefits, description: p.description,
    seoTitle: o.products?.[p.id]?.seoTitle ?? "", seoDescription: o.products?.[p.id]?.seoDescription ?? "", packshot: p.media.packshot,
  }));
  const articles = list("articles");
  // Suggestions de maillage interne : produits cités dans un article sans lien vers leur fiche
  const linking = articles.flatMap((a) => {
    const links = markdownLinks(a.content);
    return liveProducts()
      .filter((p) => a.content.includes(p.name) && !links.includes(`/produits/${p.slug}`))
      .map((p) => ({ articleId: a.id, article: a.title, product: p.name, url: `/produits/${p.slug}`, reason: `« ${p.name} » est cité sans lien vers sa fiche.` }));
  });
  const linkedProducts = new Set(articles.flatMap((a) => markdownLinks(a.content)).filter((l) => l.startsWith("/produits/")));
  const orphanProducts = liveProducts().filter((p) => !linkedProducts.has(`/produits/${p.slug}`)).map((p) => ({ name: p.name, url: `/produits/${p.slug}`, concerns: p.concerns.slice(0, 3).join(", ") }));
  return (
    <SeoView
      keywords={list("keywords")}
      articles={articles}
      blogSlots={list("posts").filter((p) => p.platform === "blog" && !p.library).sort((a, b) => a.date.localeCompare(b.date))}
      products={products}
      linking={linking}
      orphanProducts={orphanProducts}
      gsc={connectors().find((c) => c.id === "search_console")!.connected}
      seoMetrics={list("metrics").filter((m) => m.channel === "seo" && m.source !== "demo").sort((a, b) => a.date.localeCompare(b.date))}
    />
  );
}
