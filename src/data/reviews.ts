import { products } from "./products";
import type { Product, Review, SkinType } from "@/lib/types";

/**
 * AVIS DE DÉMONSTRATION — entièrement fictifs.
 * SKINCLEAN est une marque fictive (projet académique) : ces avis servent uniquement à montrer
 * le rendu du système de notation en feuilles. Ils sont toujours affichés avec la mention
 * « Avis de démonstration », exclus des données structurées SEO, et se masquent d'un réglage
 * (config.ts → reviewsConfig.showDemoReviews).
 * Générés de façon déterministe (même résultat à chaque build).
 */

// Générateur pseudo-aléatoire déterministe
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const hash = (t: string) => t.split("").reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

const firstNames = ["Camille", "Léa", "Inès", "Manon", "Chloé", "Sarah", "Emma", "Jade", "Lina", "Zoé", "Yasmine", "Clara", "Louise", "Maëlys", "Nora", "Anaïs", "Julie", "Margaux", "Salomé", "Aya", "Lucie", "Elsa", "Mathilde", "Océane", "Rose", "Thomas", "Hugo", "Nathan", "Maya", "Alice"];
const initials = "ABCDEFGHJKLMNPRSTV";

const titles: Record<number, string[]> = {
  5: ["Coup de cœur", "Adopté !", "Je ne m'en passe plus", "Parfait pour ma peau", "Ma nouvelle routine", "Vraiment top"],
  4: ["Très bon produit", "Je recommande", "Bonne surprise", "Agréable au quotidien", "Efficace et doux"],
  3: ["Correct", "Bien mais pas magique", "Mitigée", "À voir sur la durée"],
  2: ["Pas pour moi", "Déçue"],
};

// Phrases par type de produit : [ressenti positif, détail, nuance]
const byType: Record<string, { pos: string[]; detail: string[]; meh: string[] }> = {
  nettoyant: {
    pos: ["Ma peau est propre sans tiraillement.", "Il nettoie en douceur, même le soir après une longue journée.", "La mousse est agréable et se rince très facilement."],
    detail: ["Je l'utilise matin et soir depuis un mois.", "Un tube dure longtemps, il en faut très peu.", "L'odeur est très discrète."],
    meh: ["Il ne retire pas tout le maquillage, je passe d'abord un démaquillant.", "J'aurais aimé un format plus grand."],
  },
  demaquillant: {
    pos: ["Le maquillage fond en quelques secondes.", "Même le mascara part sans frotter.", "Ma peau reste douce après le rinçage."],
    detail: ["Je fais toujours suivre d'un nettoyant, comme conseillé.", "La texture est vraiment fondante.", "Pratique aussi pour retirer la crème solaire."],
    meh: ["Il laisse un léger film si on rince mal.", "Le pot n'est pas idéal sous la douche."],
  },
  toner: {
    pos: ["Ma peau boit littéralement la lotion.", "Je sens la différence sur l'éclat de mon teint.", "Il prépare bien la peau pour la suite."],
    detail: ["J'en mets deux couches le soir.", "Je l'applique avec les mains, en tapotant.", "Il se marie bien avec mon sérum."],
    meh: ["Les premiers jours ça picotait un peu.", "Le flacon part assez vite."],
  },
  serum: {
    pos: ["Texture légère qui pénètre tout de suite.", "Ma peau est plus confortable depuis que je l'utilise.", "Je vois une différence sur mon grain de peau après quelques semaines."],
    detail: ["Trois gouttes suffisent pour tout le visage.", "La pipette est pratique pour doser.", "Il s'intègre facilement à ma routine."],
    meh: ["Il faut être patiente pour voir un effet.", "Un peu collant si on en met trop."],
  },
  creme: {
    pos: ["Ma peau reste hydratée toute la journée.", "Elle pénètre vite, pas d'effet gras.", "Parfaite sous le maquillage."],
    detail: ["Une noisette suffit pour le visage et le cou.", "Le pot est joli dans la salle de bain.", "Je l'utilise matin et soir."],
    meh: ["Il m'a fallu quelques jours pour m'habituer à la texture.", "J'aurais aimé une version sans pot, avec pompe."],
  },
  "contour-yeux": {
    pos: ["Mon regard a l'air moins fatigué le matin.", "La texture est très agréable.", "Il ne pique pas les yeux."],
    detail: ["Je le garde au frigo.", "Une petite quantité suffit pour les deux yeux.", "Je l'applique en tapotant."],
    meh: ["Effet surtout immédiat, pas miraculeux sur les cernes.", "Le tube est petit."],
  },
  patchs: {
    pos: ["Le bouton est beaucoup moins visible le lendemain.", "Ça m'empêche enfin d'y toucher.", "Ils tiennent bien plusieurs heures."],
    detail: ["Je les pose sur peau bien sèche.", "Les deux tailles sont pratiques.", "Presque invisibles en journée."],
    meh: ["Sur les zones qui bougent, ils se décollent un peu.", "Moins efficaces sur les boutons pas encore sortis."],
  },
  masque: {
    pos: ["Un vrai moment de détente.", "Ma peau est toute douce après.", "Effet bonne mine immédiat."],
    detail: ["Je l'utilise le dimanche soir.", "Le temps de pose est facile à respecter.", "Agréable à garder au frais."],
    meh: ["L'effet ne dure pas plusieurs jours.", "J'aurais aimé un peu plus de produit."],
  },
  "toner-pads": {
    pos: ["Super pratique, surtout le matin.", "Ma peau est plus lisse au toucher.", "Idéal en voyage."],
    detail: ["Je les utilise trois fois par semaine.", "Les disques sont bien imbibés jusqu'au bout.", "Le pot ferme bien."],
    meh: ["Une petite pince fournie serait un plus.", "Un peu chers au disque."],
  },
  brume: {
    pos: ["Fraîcheur instantanée, j'adore en été.", "La brume est vraiment fine.", "Elle ne fait pas couler le maquillage."],
    detail: ["Elle tient dans mon sac.", "Je l'utilise aussi avant mon sérum.", "Parfaite au bureau."],
    meh: ["Le spray bloque parfois un peu.", "Effet surtout rafraîchissant."],
  },
  exfoliant: {
    pos: ["Peau plus lisse dès la première utilisation.", "Exfoliation douce, aucune irritation.", "Mes pores sont plus nets."],
    detail: ["Je l'utilise deux fois par semaine.", "Je mets toujours un SPF le lendemain.", "Il se rince facilement."],
    meh: ["Il faut y aller doucement au début.", "Picotements les premières fois."],
  },
  "soin-cible": {
    pos: ["Mon teint est plus uniforme.", "Les marques s'estompent petit à petit.", "Texture agréable, non grasse."],
    detail: ["Je l'applique uniquement sur les zones concernées.", "Un léger picotement au début, puis plus rien.", "Je l'utilise le soir."],
    meh: ["Résultat assez lent.", "Il faut être régulière."],
  },
  spf: {
    pos: ["Enfin un SPF sans traces blanches.", "Texture légère, aucun effet gras.", "Je le mets tous les jours sans y penser."],
    detail: ["Il passe bien sous le maquillage.", "Le format est pratique à emporter.", "Je renouvelle l'application l'été."],
    meh: ["Un peu brillant sur ma zone T.", "Il faut bien l'étaler."],
  },
  accessoire: {
    pos: ["Joli et pratique.", "Exactement ce qu'il me fallait pour ma routine.", "Bonne qualité, ça se voit."],
    detail: ["Je l'utilise tous les jours.", "Livré rapidement et bien emballé.", "Idée cadeau sympa."],
    meh: ["La couleur est un peu différente de la photo.", "Un peu plus petit que ce que j'imaginais."],
  },
};

const skinTypes: SkinType[] = ["seche", "grasse", "mixte", "normale", "sensible"];

/** Photos d'avis de démonstration (images Pexels, licence Pexels — voir mentions légales), par type de soin. */
const photo = (id: string) => `/media/reviews/avis-${id}.webp`;
const photosByType: Record<string, string[]> = {
  nettoyant: ["5927790", "8298623", "8996171"],
  demaquillant: ["8141578", "7250822", "8996171"],
  toner: ["8141578", "7250822", "8131891"],
  serum: ["6925815", "8131886", "8131891", "12322647"],
  creme: ["6975305", "5524950", "8131887"],
  brume: ["7019499", "8131891"],
  "contour-yeux": ["6925816", "8131887"],
  masque: ["5937888", "7467138"],
  "toner-pads": ["7250822", "8141578"],
  exfoliant: ["8131886", "8131891"],
  "soin-cible": ["12322647", "8131891"],
  spf: ["6975305", "5927885"],
  patchs: ["12322647", "6925816"],
  accessoire: ["7019513"],
}
const REF = new Date("2026-10-01T12:00:00Z").getTime();

function reviewsFor(p: Product): Review[] {
  const r = rng(hash(p.id));
  const count = p.bestseller ? 12 + Math.floor(r() * 9) : p.isNew ? 2 + Math.floor(r() * 4) : 4 + Math.floor(r() * 7);
  const pool = byType[p.type] ?? byType.serum;
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const out: Review[] = [];
  for (let i = 0; i < count; i++) {
    const x = r();
    const rating = x < 0.55 ? 5 : x < 0.85 ? 4 : x < 0.96 ? 3 : 2;
    const parts = rating >= 4 ? [pick(pool.pos), pick(pool.detail)] : rating === 3 ? [pick(pool.pos), pick(pool.meh)] : [pick(pool.meh), p.type === "accessoire" ? "Pas tout à fait ce que j'attendais, mais le service client a été réactif." : "Ça ne convient pas à ma peau, mais le service client a été réactif."];
    if (rating === 5 && r() > 0.5) parts.push(`Je rachèterai ${p.name}.`);
    const st = p.type === "accessoire" ? undefined : p.skinTypes.length ? (r() > 0.25 ? pick(p.skinTypes) : pick(skinTypes)) : undefined;
    const daysAgo = Math.floor(r() * 300) + 3;
    const pics = photosByType[p.type] ?? [];
    const withPhoto = rating >= 4 && pics.length > 0 && r() < 0.3;
    const photos = withPhoto ? [photo(pick(pics)), ...(r() > 0.6 ? [photo(pick(pics))] : [])].filter((x, k, a) => a.indexOf(x) === k) : undefined;
    out.push({
      id: `${p.id}-demo-${i}`,
      productId: p.id,
      author: `${pick(firstNames)} ${initials[Math.floor(r() * initials.length)]}.`,
      rating,
      date: new Date(REF - daysAgo * 864e5).toISOString().slice(0, 10),
      title: pick(titles[rating]),
      text: parts.join(" "),
      skinType: st,
      verified: false,
      demo: true,
      helpful: Math.floor(r() * 14),
      photos,
    });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

export const demoReviews: Record<string, Review[]> = Object.fromEntries(products.map((p) => [p.id, reviewsFor(p)]));
