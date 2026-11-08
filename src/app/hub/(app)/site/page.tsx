import type { Metadata } from "next";
import { requirePageUser } from "@/lib/hub/auth";
import { list } from "@/lib/hub/repo";
import { allProductsIncludingHidden, liveKits, readOverrides } from "@/lib/hub/site-sync";
import { homeMedia } from "@/data/home";
import { SiteView } from "@/components/hub/pages/SiteView";

export const metadata: Metadata = { title: "Gestion du site et des visuels" };

export default async function SitePage() {
  await requirePageUser();
  const o = readOverrides();
  const products = allProductsIncludingHidden();
  return (
    <SiteView
      overrides={o}
      products={products.map((p) => ({ id: p.id, slug: p.slug, name: p.name, kind: p.kind, tagline: p.tagline, description: p.description, benefits: p.benefits, tips: p.tips, textureLabel: p.textureLabel, isNew: !!p.isNew, hidden: p.hidden, media: p.media, price: p.variants[0]?.price ?? 0, size: p.variants[0]?.size ?? "", bestseller: p.bestseller, added: !!o.addedProducts?.some((x) => x.id === p.id), color: p.color.bg }))}
      kits={liveKits().map((k) => ({ id: k.id, slug: k.slug, name: k.name, group: k.group, season: k.season, tagline: k.tagline, items: k.items.map((i) => i.productId), discountPercent: k.discountPercent, added: !!o.addedKits?.some((x) => x.id === k.id) }))}
      assets={list("assets").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))}
      defaults={{ heroVideo: homeMedia.heroVideo, heroPoster: homeMedia.heroPoster, heroBackground: homeMedia.heroBackground }}
    />
  );
}
