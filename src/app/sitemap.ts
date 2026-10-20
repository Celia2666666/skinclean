import type { MetadataRoute } from "next";
import { getKits, getProducts } from "@/lib/catalog";
import { allCategoryDefs } from "@/data/categories";
import { siteUrlPublic } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const u = siteUrlPublic();
  const statics = ["", "/soins-visage", "/best-sellers", "/kits", "/kits-de-saison", "/creer-mon-set", "/skin-diag", "/club", "/notre-histoire", "/nos-engagements", "/faq", "/livraison", "/legal/cgv", "/legal/mentions-legales", "/legal/confidentialite", "/legal/cookies", "/legal/conditions-offres"];
  return [
    ...statics.map((p) => ({ url: `${u}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...allCategoryDefs().map((c) => ({ url: `${u}/soins-visage/${c.slug}`, priority: 0.7 })),
    ...getProducts().map((p) => ({ url: `${u}/produits/${p.slug}`, priority: 0.9 })),
    ...getKits().map((k) => ({ url: `${u}/kits/${k.slug}`, priority: 0.8 })),
  ];
}
