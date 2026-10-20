import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PageHero } from "@/components/catalog/PageHero";
import { Reveal, Parallax } from "@/components/ui/Reveal";
import { Packshot } from "@/components/product/Packshot";
import { getProduct } from "@/lib/catalog";

export const metadata: Metadata = { title: "Notre histoire", description: "SKINCLEAN : une skincare douce, efficace et transparente, pensée pour que chacun·e trouve son glow." };

export default function Page() {
  const chapters = [
    { t: "Une idée simple", d: "Prendre soin de sa peau devrait être un moment agréable, pas une course à la perfection. SKINCLEAN est né de l'envie de rendre la skincare plus simple, plus lisible et plus douce.", bg: "#EFEEEA" },
    { t: "Des routines, pas des injonctions", d: "Chaque peau change : avec les saisons, le stress, les hormones. Plutôt que des promesses miracles, nous proposons des routines adaptées, que tu peux ajuster à tout moment.", bg: "#EFEEEA" },
    { t: "La transparence comme réflexe", d: "Listes INCI complètes, rôle des ingrédients, précautions d'usage : on te donne toutes les cartes pour choisir en confiance.", bg: "#EFEEEA" },
    { t: "Une communauté qui grandit", d: "Le SKINCLEAN Club, ses feuilles et son Skin Journal : on avance ensemble, à ton rythme.", bg: "#EFEEEA" },
  ];
  return (
    <>
      <PageHero eyebrow="Notre univers" title="Your skin. Your glow." intro="L'histoire d'une marque qui croit qu'une belle peau, c'est surtout une peau bien comprise." crumbs={[{ href: "/notre-histoire", label: "Notre histoire" }]} bg="#F4F3EF" />
      <div className="mx-auto max-w-[1200px] space-y-24 px-4 py-20 md:px-8">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <Reveal><Image src="/media/brand/logo-full.webp" alt="Logo SKINCLEAN" width={600} height={600} className="mx-auto w-full max-w-md rounded-none" /></Reveal>
          <Reveal delay={0.1}>
            <p className="font-display text-3xl leading-snug md:text-4xl">Le « S » de SKINCLEAN dessine une goutte, une feuille et une vague : l&apos;eau, la nature et le mouvement. Trois éléments qui guident chacune de nos formules.</p>
          </Reveal>
        </div>
        {chapters.map((c, i) => (
          <div key={c.t} className={`grid items-center gap-10 md:grid-cols-2 ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}>
            <Parallax amount={40}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-none" style={{ background: c.bg }}>
                <div className="absolute inset-[15%] animate-float"><Packshot product={getProduct(["sc-sr-07", "sc-sr-03", "sc-cr-02", "sc-sr-02"][i])!} className="h-full w-full" showTag={false} /></div>
              </div>
            </Parallax>
            <Reveal>
              <p className="eyebrow text-sage-deep">Chapitre {i + 1}</p>
              <h2 className="mt-2 font-display text-5xl">{c.t}</h2>
              <p className="mt-4 text-lg text-forest-soft">{c.d}</p>
            </Reveal>
          </div>
        ))}
        <div className="text-center">
          <Link href="/skin-diag" className="btn btn-primary">Trouver ma routine</Link>
        </div>
      </div>
    </>
  );
}
