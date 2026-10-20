import type { Metadata } from "next";
import { PageHero } from "@/components/catalog/PageHero";
import { SetBuilder } from "@/components/catalog/SetBuilder";

export const metadata: Metadata = { title: "Créer mon set", description: "Compose ton propre ensemble de soins SKINCLEAN." };

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Créer mon set" title="Compose ta trousse idéale" intro="Choisis tes soins, ajuste les quantités et les formats : ton set prend forme sous tes yeux." bg="#EFEEEA" crumbs={[{ href: "/creer-mon-set", label: "Créer mon set" }]} />
      <SetBuilder />
    </>
  );
}
