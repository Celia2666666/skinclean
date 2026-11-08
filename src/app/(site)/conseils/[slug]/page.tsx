import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { publishedArticles } from "@/lib/hub/blog";
import { getProduct } from "@/lib/catalog";
import { Markdown } from "@/components/hub/Markdown";
import { ProductCard } from "@/components/product/ProductCard";
import { siteUrlPublic } from "@/lib/site";

async function find(slug: string) {
  return (await publishedArticles()).find((a) => a.slug === slug);
}

export async function generateMetadata({ params }: PageProps<"/conseils/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const a = await find(slug);
  if (!a) return {};
  return { title: a.metaTitle || a.title, description: a.metaDescription, alternates: { canonical: `/conseils/${a.slug}` }, openGraph: { type: "article", images: a.cover ? [a.cover] : undefined } };
}

export default async function ArticlePage({ params }: PageProps<"/conseils/[slug]">) {
  await connection();
  const { slug } = await params;
  const a = await find(slug);
  if (!a) notFound();
  const products = a.productIds.map((id) => getProduct(id)).filter((p): p is NonNullable<typeof p> => !!p).slice(0, 4);
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Article", headline: a.title, description: a.metaDescription,
    datePublished: a.publishedAt, dateModified: a.updatedAt, author: { "@type": "Organization", name: "SKINCLEAN" },
    mainEntityOfPage: `${siteUrlPublic()}/conseils/${a.slug}`, image: a.cover ? [`${siteUrlPublic()}${a.cover}`] : undefined,
  };
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 md:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Link href="/conseils" className="text-sm text-forest-soft underline">← Tous les conseils</Link>
      <p className="eyebrow mt-8 text-forest-soft">{a.readingMinutes} min de lecture · {a.author}</p>
      <h1 className="mt-3 font-display text-4xl leading-tight md:text-5xl">{a.title}</h1>
      <p className="mt-4 text-lg text-forest-soft">{a.excerpt}</p>
      <div className="hub-prose mt-8 text-[1.02rem]"><Markdown source={a.content} /></div>
      <p className="mt-10 text-sm text-forest-soft">Conseils cosmétiques à visée informative : ils ne remplacent pas l&apos;avis d&apos;un professionnel de santé. Résultats variables selon les peaux.</p>
      {!!products.length && (
        <section className="mt-12 border-t border-line pt-10">
          <h2 className="font-display text-2xl">Les soins de cet article</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">{products.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </section>
      )}
      <div className="mt-12 bg-sage-soft p-8 text-center">
        <p className="font-display text-2xl">Quelle routine pour ta peau ?</p>
        <Link href="/skin-diag" className="btn btn-primary mt-4">Faire mon Skin Diag</Link>
      </div>
    </article>
  );
}
