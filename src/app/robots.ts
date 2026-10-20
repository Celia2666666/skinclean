import type { MetadataRoute } from "next";
import { siteUrlPublic } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/compte", "/panier", "/paiement", "/routine/", "/api/"] },
    sitemap: `${siteUrlPublic()}/sitemap.xml`,
  };
}
