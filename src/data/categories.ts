import type { Concern, Product, ProductType } from "@/lib/types";

/** Colonne 1 du mega-menu — par type de produit. */
export const typeCategories: { slug: string; label: string; short: string; types: ProductType[]; bg: string; intro: string }[] = [
  { slug: "nettoyants", label: "Nettoyants visage", short: "Nettoyants", types: ["nettoyant"], bg: "#EFEEEA", intro: "Le premier geste de toute routine : une peau propre, sans jamais tirailler." },
  { slug: "demaquillants", label: "Démaquillants", short: "Démaquillants", types: ["demaquillant"], bg: "#EFEEEA", intro: "Baume, lait : on fait fondre le maquillage sans frotter." },
  { slug: "toners", label: "Toners / lotions toniques", short: "Toners", types: ["toner"], bg: "#EFEEEA", intro: "Hydrater, préparer, exfolier en douceur : la lotion qui change tout." },
  { slug: "serums", label: "Sérums", short: "Sérums", types: ["serum"], bg: "#EFEEEA", intro: "Concentrés d'actifs pour cibler chaque besoin de ta peau." },
  { slug: "cremes", label: "Crèmes hydratantes", short: "Crèmes", types: ["creme"], bg: "#EFEEEA", intro: "Gel-crème, crème légère ou riche : l'hydratation à ta mesure." },
  { slug: "brumes", label: "Brumes visage", short: "Brumes", types: ["brume"], bg: "#EFEEEA", intro: "Un nuage de fraîcheur à emporter partout." },
  { slug: "contours-yeux", label: "Contours des yeux", short: "Contour yeux", types: ["contour-yeux"], bg: "#EFEEEA", intro: "Cernes, poches, ridules : des soins pensés pour la zone la plus fine." },
  { slug: "patchs", label: "Patchs anti-imperfections", short: "Patchs", types: ["patchs"], bg: "#EFEEEA", intro: "Le SOS discret contre les imperfections." },
  { slug: "masques", label: "Masques visage", short: "Masques", types: ["masque"], bg: "#EFEEEA", intro: "Moments cocooning : hydratants ou purifiants." },
  { slug: "toner-pads", label: "Toner pads", short: "Toner pads", types: ["toner-pads"], bg: "#EFEEEA", intro: "La lotion déjà prête, en disques pratiques." },
  { slug: "exfoliants", label: "Exfoliants", short: "Exfoliants", types: ["exfoliant"], bg: "#EFEEEA", intro: "Pour un grain de peau plus lisse et un teint qui capte la lumière." },
  { slug: "soins-cibles", label: "Soins ciblés", short: "Soins ciblés", types: ["soin-cible", "patchs"], bg: "#EFEEEA", intro: "Des actions localisées, précises et douces." },
  { slug: "protections-solaires", label: "Protections solaires", short: "SPF", types: ["spf"], bg: "#EFEEEA", intro: "Le geste anti-âge n°1, chaque matin." },
  { slug: "accessoires", label: "Accessoires", short: "Accessoires", types: ["accessoire"], bg: "#EFEEEA", intro: "Bandeau, carrés lavables, gua sha : les petits plus de la salle de bain." },
];

/** Colonne 2 — par préoccupation. Un produit apparaît dans toutes les préoccupations qu'il cible. */
export const concernCategories: { slug: string; label: string; short: string; concerns: Concern[]; bg: string; intro: string }[] = [
  { slug: "acne-imperfections", label: "Acné & imperfections", short: "Imperfections", concerns: ["acne", "points-noirs"], bg: "#EFEEEA", intro: "Des soins purifiants mais respectueux pour une peau plus nette, sans l'agresser." },
  { slug: "peau-grasse", label: "Peau grasse", short: "Peau grasse", concerns: ["sebum"], bg: "#EFEEEA", intro: "Réguler la brillance tout en continuant d'hydrater." },
  { slug: "peau-seche", label: "Peau sèche", short: "Peau sèche", concerns: ["secheresse"], bg: "#EFEEEA", intro: "Nourrir, réparer et retrouver le confort." },
  { slug: "peau-deshydratee", label: "Peau déshydratée", short: "Hydratation", concerns: ["deshydratation"], bg: "#EFEEEA", intro: "Recharger la peau en eau pour la rendre souple et rebondie." },
  { slug: "rougeurs", label: "Rougeurs", short: "Rougeurs", concerns: ["rougeurs"], bg: "#EFEEEA", intro: "Apaiser et atténuer l'apparence des rougeurs." },
  { slug: "peau-sensible", label: "Peau sensible", short: "Peau sensible", concerns: ["sensibilite"], bg: "#EFEEEA", intro: "Des formules douces pour les peaux qui réagissent vite." },
  { slug: "teint-terne", label: "Teint terne", short: "Teint terne", concerns: ["terne"], bg: "#EFEEEA", intro: "Réveiller un teint fatigué et lui redonner de la lumière." },
  { slug: "glow-eclat", label: "Glow & éclat", short: "Glow", concerns: ["glow"], bg: "#EFEEEA", intro: "Le glow naturel, sans filtre." },
  { slug: "cernes", label: "Cernes", short: "Cernes", concerns: ["cernes"], bg: "#EFEEEA", intro: "Un regard défatigué, même après une nuit courte." },
  { slug: "rides-ridules", label: "Premières rides & ridules", short: "Premières ridules", concerns: ["ridules", "rebondi"], bg: "#EFEEEA", intro: "Prévenir et lisser les premières ridules, en douceur." },
  { slug: "pores-visibles", label: "Pores visibles", short: "Pores", concerns: ["pores"], bg: "#EFEEEA", intro: "Affiner visiblement le grain de peau." },
];

/** Colonne 3 — découvrir. Les filtres sont calculés dans lib/catalog.ts. */
export const discoverLinks: { href: string; label: string }[] = [
  { href: "/soins-visage", label: "Tous les produits" },
  { href: "/best-sellers", label: "Nos 7 best-sellers" },
  { href: "/soins-visage/nouveautes", label: "Nouveautés" },
  { href: "/soins-visage/mini-formats", label: "Mini-formats" },
  { href: "/kits/travel-essentials", label: "Kits de voyage" },
  { href: "/kits-de-saison", label: "Kits de saison" },
  { href: "/kits", label: "Routines complètes" },
];

export type CategoryDef = {
  slug: string;
  label: string;
  intro: string;
  bg: string;
  filter: (p: Product) => boolean;
  group: "type" | "concern" | "special";
};

export const specialCategories: CategoryDef[] = [
  { slug: "nouveautes", label: "Nouveautés", intro: "Les derniers-nés du labo SKINCLEAN.", bg: "#EFEEEA", group: "special", filter: (p) => !!p.isNew },
  { slug: "mini-formats", label: "Mini-formats", intro: "Pour tester, voyager ou glisser dans ton sac.", bg: "#EFEEEA", group: "special", filter: (p) => p.variants.some((v) => v.mini) },
];

export function allCategoryDefs(): CategoryDef[] {
  return [
    ...typeCategories.map((c) => ({ slug: c.slug, label: c.label, intro: c.intro, bg: c.bg, group: "type" as const, filter: (p: Product) => c.types.includes(p.type) })),
    ...concernCategories.map((c) => ({ slug: c.slug, label: c.label, intro: c.intro, bg: c.bg, group: "concern" as const, filter: (p: Product) => p.concerns.some((x) => c.concerns.includes(x)) })),
    ...specialCategories,
  ];
}

export const skinTypeLabels: Record<string, string> = {
  seche: "Peau sèche",
  grasse: "Peau grasse",
  mixte: "Peau mixte",
  normale: "Peau normale",
  sensible: "Peau sensible",
};

export const concernLabels: Record<Concern, string> = {
  acne: "Imperfections",
  "points-noirs": "Points noirs",
  sebum: "Excès de sébum",
  secheresse: "Sécheresse",
  deshydratation: "Déshydratation",
  rougeurs: "Rougeurs",
  sensibilite: "Sensibilité",
  terne: "Teint terne",
  glow: "Glow",
  cernes: "Cernes",
  ridules: "Premières ridules",
  rebondi: "Manque de rebondi",
  pores: "Pores visibles",
  texture: "Texture irrégulière",
};

export const stepLabels: Record<string, string> = {
  demaquillage: "Démaquillage",
  nettoyage: "Nettoyage",
  tonique: "Toner",
  serum: "Sérum",
  "contour-yeux": "Contour des yeux",
  hydratation: "Hydratation",
  protection: "Protection solaire",
  "soin-cible": "Soin ciblé",
  masque: "Masque",
  exfoliation: "Exfoliation",
  brume: "Brume",
  accessoire: "Accessoire",
};

/** Ordre d'application universel (du plus fluide au plus riche). */
export const stepOrder: string[] = [
  "demaquillage", "nettoyage", "exfoliation", "tonique", "brume", "serum", "soin-cible", "contour-yeux", "hydratation", "masque", "protection", "accessoire",
];
