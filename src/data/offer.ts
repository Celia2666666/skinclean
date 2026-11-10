/**
 * Offre SKINCLEAN : promesse, formules, inclus / non inclus.
 * Source unique utilisée par l'accueil, la page « Offre & prix », la stratégie et la communication.
 */
export const promise = {
  /** La promesse en une phrase : pour qui, quel problème, quel résultat. */
  sentence:
    "SKINCLEAN aide les 18-35 ans à la peau mixte, sensible ou à imperfections à arrêter d'empiler des soins au hasard : en 2 minutes, le Skin Diag compose une routine courte et compatible pour une peau plus nette et plus confortable en 4 à 8 semaines.",
  short: "La bonne routine, sans empiler les produits.",
  proofs: ["Soins de 7 € à 36 € TTC", "Skin Diag gratuit en 2 minutes", "Livraison offerte dès 100 €"],
};

export const VAT_RATE = 0.2;
export const ht = (ttc: number) => Math.round((ttc / (1 + VAT_RATE)) * 100) / 100;

export const included = [
  "Le Skin Diag gratuit et la routine personnalisée envoyée par e-mail",
  "Les conseils du Glow Assistant et du service client (téléphone, e-mail, formulaire)",
  "Le Trio découverte offert avec la 1ʳᵉ commande (3 échantillons)",
  "La livraison Colissimo 48-72 h offerte dès 100 € d'achat",
  "14 jours pour retourner un produit non ouvert",
  "Les feuilles du SKINCLEAN Club : 1 feuille par euro dépensé, échangeables contre des réductions ou des cadeaux",
];

export const notIncluded = [
  "Aucun diagnostic médical ni consultation dermatologique : le Skin Diag est un conseil cosmétique",
  "Aucun abonnement ni engagement : chaque commande est ponctuelle",
  "Livraison payante (10 €) sous 100 € d'achat",
  "Livraison limitée à la France, la Belgique, la Suisse, le Luxembourg et Monaco",
  "Pas de traitement pour l'acné sévère ou persistante (avis médical recommandé)",
];
