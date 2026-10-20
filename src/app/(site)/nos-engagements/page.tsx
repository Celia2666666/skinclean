import type { Metadata } from "next";
import { PageHero } from "@/components/catalog/PageHero";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = { title: "Nos engagements", description: "Cruelty-free, ingrédients d'origine naturelle, transparence, routines adaptées et beauté accessible." };

export default function Page() {
  const items = [
    { e: "", t: "Cruelty-free", d: "SKINCLEAN s'engage à ne pas tester ses produits finis ni ses ingrédients sur les animaux. Cette allégation sera documentée auprès de nos fournisseurs et validée avant commercialisation ; aucun label n'est revendiqué tant qu'il n'est pas obtenu." },
    { e: "", t: "Ingrédients d'origine naturelle", d: "Nous privilégions une forte proportion d'ingrédients d'origine naturelle. Le pourcentage exact (calculé selon la norme ISO 16128) sera affiché sur chaque fiche produit dès validation des formules." },
    { e: "", t: "Transparence totale", d: "Liste INCI complète, rôle de chaque ingrédient clé, précautions d'emploi et mode d'utilisation sur chaque fiche. Pas de résultats inventés, pas de faux avis." },
    { e: "", t: "Des routines adaptées", d: "Le Skin Diag recommande uniquement des produits compatibles entre eux, en écartant les actifs puissants pour les peaux réactives. C'est un outil de conseil cosmétique, pas un diagnostic médical." },
    { e: "", t: "Une beauté accessible", d: "Des soins entre 7 € et 36 €, des mini-formats pour tester, et zéro injonction à la peau parfaite : les imperfections, les rougeurs et les ridules font partie de la vie." },
    { e: "", t: "Respect de tes données", d: "Consentement explicite pour les cookies et le Skin Journal, données sensibles accessibles à toi seul·e, suppression en un clic." },
  ];
  return (
    <>
      <PageHero eyebrow="Notre univers" title="Nos engagements" intro="Ce que nous promettons, et la façon dont nous le prouvons." bg="#EFEEEA" crumbs={[{ href: "/nos-engagements", label: "Nos engagements" }]} />
      <div className="mx-auto grid max-w-[1200px] gap-5 px-4 py-20 md:grid-cols-2 md:px-8">
        {items.map((x, i) => (
          <Reveal key={x.t} delay={i * 0.06}>
            <div className="h-full rounded-none bg-ivory p-8">
              <span className="text-xs font-semibold tracking-[0.2em] text-forest/50">{String(i + 1).padStart(2, "0")}</span>
              <h2 className="mt-4 font-display text-3xl">{x.t}</h2>
              <p className="mt-3 text-forest-soft">{x.d}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </>
  );
}
