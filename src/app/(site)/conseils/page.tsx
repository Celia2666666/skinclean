import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { publishedArticles } from "@/lib/hub/blog";
import { SeoBlock } from "@/components/catalog/SeoBlock";

export const metadata: Metadata = {
  title: "Conseils skincare : guides, routines et actifs",
  description: "Guides, routines et décryptages d'actifs par SKINCLEAN : niacinamide, vitamine C, peau sensible, barrière cutanée, SPF… Des conseils simples et honnêtes.",
  alternates: { canonical: "/conseils" },
};

export default async function BlogIndex() {
  await connection();
  const articles = await publishedArticles();
  return (
    <>
    <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-8">
      <p className="eyebrow text-forest-soft">Le journal SKINCLEAN</p>
      <h1 className="title-caps mt-3 font-display text-4xl md:text-6xl">Conseils skincare</h1>
      <p className="mt-4 max-w-2xl text-forest-soft">Comprendre sa peau, choisir ses actifs, construire une routine simple : nos guides, sans promesses miracles.</p>
      {!articles.length ? (
        <p className="mt-12 text-forest-soft">Les premiers articles arrivent très bientôt. En attendant, fais ton <Link href="/skin-diag" className="underline">Skin Diag</Link>.</p>
      ) : (
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <Link key={a.id} href={`/conseils/${a.slug}`} className="group block">
              <div className="aspect-[4/3] overflow-hidden bg-sage-soft">
                {a.cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.cover} alt="" className="h-full w-full object-contain p-8 transition duration-500 group-hover:scale-105" />
                )}
              </div>
              <p className="mt-4 text-xs uppercase tracking-wider text-forest-soft">{a.readingMinutes} min de lecture</p>
              <h2 className="mt-1 font-display text-xl font-medium group-hover:underline">{a.title}</h2>
              <p className="mt-2 text-sm text-forest-soft">{a.excerpt}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
    <SeoBlock title="Des conseils skincare simples et honnêtes" links={[{ href: "/skin-diag", label: "Faire mon Skin Diag" }, { href: "/soins-visage", label: "Tous les soins visage" }, { href: "/kits", label: "Kits & routines" }, { href: "/best-sellers", label: "Nos best-sellers" }]}>
      <p>Comprendre sa peau est la première étape d&apos;une routine efficace. Dans nos guides, on explique ce que font vraiment les actifs (niacinamide, vitamine C, acide hyaluronique, rétinal, céramides), avec quoi les associer et les erreurs à éviter.</p>
      <p>Tu ne sais pas par où commencer ? Le <Link href="/skin-diag" className="underline">Skin Diag</Link> identifie ton type de peau en deux minutes et te propose une routine adaptée. Pour une peau grasse ou à imperfections, commence par un nettoyant doux et un sérum à la niacinamide ; pour une peau sèche ou sensible, privilégie les textures riches en céramides. Retrouve tous nos <Link href="/soins-visage" className="underline">soins visage</Link>, nos <Link href="/kits" className="underline">kits routine</Link> déjà composés et les <Link href="/best-sellers" className="underline">best-sellers</Link> plébiscités par la communauté.</p>
      <p>Les bons réflexes restent les mêmes pour toutes les peaux : nettoyer sans décaper, hydrater chaque jour, introduire un nouvel actif à la fois et appliquer une protection solaire le matin, même en hiver.</p>
      <p>Chaque article propose une routine concrète, matin et soir, et renvoie vers les soins adaptés. Nos conseils sont cosmétiques : ils ne remplacent pas l&apos;avis d&apos;un professionnel de santé, et les résultats varient selon les peaux.</p>
    </SeoBlock>
    </>
  );
}
