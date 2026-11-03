import type { Metadata } from "next";
import { Suspense } from "react";
import { SkinDiag } from "@/components/diag/SkinDiag";
import { SeoBlock } from "@/components/catalog/SeoBlock";

export const metadata: Metadata = {
  title: "Skin Diag — diagnostic de peau gratuit",
  description: "2 minutes pour découvrir ta routine SKINCLEAN idéale, matin et soir, adaptée à ta peau, ton temps et ton budget. Gratuit, résultat envoyé par e-mail.",
};

export default function Page() {
  return (
    <>
      {/* Titre principal rendu côté serveur : le questionnaire s'affiche ensuite dans le navigateur */}
      <h1 className="sr-only">Skin Diag : ton diagnostic de peau gratuit et ta routine SKINCLEAN</h1>
      <Suspense><SkinDiag /></Suspense>
      <SeoBlock title="Comment fonctionne le Skin Diag ?" links={[{ href: "/soins-visage", label: "Tous les soins visage" }, { href: "/kits", label: "Kits & routines complètes" }, { href: "/best-sellers", label: "Nos 7 best-sellers" }]}>
        <p>Le Skin Diag est un questionnaire gratuit qui t&apos;aide à identifier ton type de peau (sèche, grasse, mixte, normale ou sensible) et tes préoccupations principales : imperfections, déshydratation, rougeurs, teint terne ou premières ridules.</p>
        <p>À partir de tes réponses, il compose une routine du matin et du soir avec des soins compatibles entre eux. Le moteur écarte les associations d&apos;actifs déconseillées, par exemple un rétinoïde et un acide exfoliant le même soir, et évite les actifs puissants si ta peau est réactive.</p>
        <p>Le questionnaire prend en compte ta sensibilité, tes imperfections, la déshydratation et ton mode de vie, puis te propose une routine progressive : pas besoin de dix produits pour avoir une belle peau.</p>
        <p>Tu peux recevoir ta routine par e-mail, la partager grâce à un lien et l&apos;ajouter à ton panier en un clic. Pour suivre tes progrès sur 30 jours, utilise ensuite le Skin Journal depuis ton compte.</p>
        <p>Le Skin Diag donne un conseil cosmétique : il ne remplace pas l&apos;avis d&apos;un professionnel de santé. En cas d&apos;imperfections nombreuses, douloureuses ou persistantes, parles-en à un médecin ou à un dermatologue.</p>
      </SeoBlock>
    </>
  );
}
