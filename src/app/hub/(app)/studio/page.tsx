import type { Metadata } from "next";
import { requirePageUser } from "@/lib/hub/auth";
import { get, list } from "@/lib/hub/repo";
import { Studio } from "@/components/hub/studio/Studio";
import { liveProducts } from "@/lib/hub/site-sync";
import { tplProductHero } from "@/lib/hub/templates";

export const metadata: Metadata = { title: "Studio créatif" };

export default async function StudioPage({ searchParams }: PageProps<"/hub/studio">) {
  await requirePageUser();
  const sp = await searchParams;
  const postId = typeof sp.post === "string" ? sp.post : undefined;
  const assetId = typeof sp.asset === "string" ? sp.asset : undefined;
  const post = postId ? get("posts", postId) : undefined;
  const asset = assetId ? get("assets", assetId) : undefined;
  const products = liveProducts().map((p) => ({ id: p.id, name: p.name, kind: p.kind, tagline: p.tagline, description: p.description, benefits: p.benefits, packshot: p.media.packshot, gallery: p.media.gallery ?? [] }));
  const productId = typeof sp.product === "string" ? sp.product : undefined;
  const product = productId ? products.find((p) => p.id === productId) : undefined;
  // Depuis la gestion du site : visuel produit prérempli avec le nom, l'accroche et le packshot
  const productDesign = product ? tplProductHero({ headline: product.tagline || product.name, eyebrow: `${product.name} · ${product.kind}`, sub: product.benefits[0], packshot: product.packshot }) : undefined;
  const design = asset?.design ?? (post?.visual?.kind === "design" ? post.visual.design : post?.visual?.poster) ?? productDesign;
  return (
    <Studio
      key={postId ?? assetId ?? productId ?? "new"}
      assets={list("assets").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))}
      products={products}
      productId={product?.id ?? post?.productIds[0]}
      initial={design ? { design, name: asset?.name ?? post?.title ?? (product ? `Visuel — ${product.name}` : "Visuel"), assetId: asset?.id ?? (post?.visual?.assetId), postId: post?.id, postTitle: post?.title } : undefined}
    />
  );
}
