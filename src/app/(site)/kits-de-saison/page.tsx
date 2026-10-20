import type { Metadata } from "next";
import { getKits } from "@/lib/catalog";
import { PageHero } from "@/components/catalog/PageHero";
import { KitCard } from "@/components/catalog/KitCard";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = { title: "Kits de saison", description: "Summer Glow, Winter Rescue, Spring Refresh, Autumn Reset : une routine SKINCLEAN pour chaque saison." };

export default function SeasonKits() {
  return (
    <>
      <PageHero eyebrow="Kits de saison" title="Ta peau change avec les saisons" intro="Soleil, froid, pollen, rentrée : on adapte la routine pour que ta peau reste confortable toute l'année." bg="#EFEEEA" crumbs={[{ href: "/kits", label: "Kits & routines" }, { href: "/kits-de-saison", label: "Kits de saison" }]} />
      <div className="mx-auto grid max-w-[1400px] gap-5 px-4 py-16 sm:grid-cols-2 md:px-8 lg:grid-cols-4">
        {getKits().filter((k) => k.group === "saison").map((k, i) => <Reveal key={k.id} delay={i * 0.08}><KitCard kit={k} /></Reveal>)}
      </div>
    </>
  );
}
