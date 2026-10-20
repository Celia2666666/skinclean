import type { Metadata } from "next";
import { getKits } from "@/lib/catalog";
import { PageHero } from "@/components/catalog/PageHero";
import { KitCard } from "@/components/catalog/KitCard";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = { title: "Kits & routines", description: "Coffrets de saison, routines ciblées et kits voyage SKINCLEAN." };

export default function KitsPage() {
  const groups = [
    { id: "saison", t: "Kits de saison", d: "Une routine pensée pour chaque saison." },
    { id: "routine", t: "Routines ciblées", d: "Les bons soins, dans le bon ordre, pour un objectif précis." },
    { id: "voyage", t: "Kits de voyage", d: "Ta routine en format cabine." },
  ] as const;
  return (
    <>
      <PageHero eyebrow="Kits & routines" title="Des routines prêtes à glow" intro="Chaque kit rassemble des soins compatibles, avec les étapes d'utilisation. Le prix du kit est calculé à partir des prix catalogue." bg="#EFEEEA" crumbs={[{ href: "/kits", label: "Kits & routines" }]} />
      <div className="mx-auto max-w-[1400px] space-y-20 px-4 py-16 md:px-8">
        {groups.map((g) => (
          <section key={g.id} id={g.id}>
            <h2 className="font-display text-4xl md:text-5xl">{g.t}</h2>
            <p className="mt-2 text-forest-soft">{g.d}</p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {getKits().filter((k) => k.group === g.id).map((k, i) => <Reveal key={k.id} delay={i * 0.06}><KitCard kit={k} /></Reveal>)}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
