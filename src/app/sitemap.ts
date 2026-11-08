import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getKits, getProducts } from "@/lib/catalog";
import { allCategoryDefs } from "@/data/categories";
import { siteUrlPublic } from "@/lib/site";
import { publishedArticles } from "@/lib/hub/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection(); // généré à la demande : inclut les articles publiés depuis le Marketing Hub
  const u = siteUrlPublic();
  const statics = ["", "/conseils", "/soins-visage", "/best-sellers", "/kits", "/kits-de-saison", "/creer-mon-set", "/skin-diag", "/club", "/notre-histoire", "/nos-engagements", "/faq", "/livraison", "/legal/cgv", "/legal/mentions-legales", "/legal/confidentialite", "/legal/cookies", "/legal/conditions-offres"];
  return [
    ...statics.map((p) => ({ url: `${u}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...allCategoryDefs().map((c) => ({ url: `${u}/soins-visage/${c.slug}`, priority: 0.7 })),
    ...getProducts().map((p) => ({ url: `${u}/produits/${p.slug}`, priority: 0.9 })),
    ...getKits().map((k) => ({ url: `${u}/kits/${k.slug}`, priority: 0.8 })),
    // Articles publiés depuis le Marketing Hub
    ...(await publishedArticles()).map((a) => ({ url: `${u}/conseils/${a.slug}`, lastModified: a.updatedAt, priority: 0.6 })),
  ];
}
