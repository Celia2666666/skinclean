import { siteOverrides } from "@/lib/site-overrides";
/**
 * CONFIGURATION COMMERCIALE SKINCLEAN
 * Toutes ces valeurs sont des paramètres de démonstration modifiables (fichier ou /admin).
 * Aucune n'a été copiée d'un concurrent : le programme Yepoda (« Yepoda Fam », monnaie « cœurs »)
 * ne publie pas ses seuils exacts. Seuls ses principes publics ont été repris :
 *  - niveau calculé sur 12 mois glissants,
 *  - solde qui expire après 12 mois sans utilisation,
 *  - points non cumulables avec d'autres promotions,
 *  - points crédités après expédition et retirés en cas de retour,
 *  - bonus avis client limité à 1 fois par mois.
 */

/** Avis clients. Les avis de démonstration sont des exemples fictifs, toujours étiquetés comme tels. */
export const reviewsConfig = {
  /** Mettre à false pour masquer tous les avis de démonstration (mise en ligne réelle). */
  showDemoReviews: true,
  /** Seuls les clients ayant commandé le produit peuvent publier un avis (badge « Achat vérifié »). */
  requirePurchase: true,
  perPage: 6,
};

export const shipping = {
  currency: "EUR",
  standardPrice: 10,
  freeFrom: 100,
  label: "Livraison Colissimo 48-72 h",
};

export const loyalty = {
  currencyName: "feuilles",
  /** Feuilles gagnées par euro dépensé (hors livraison, après remises). */
  leavesPerEuro: 1,
  tierWindowMonths: 12,
  expiryMonthsInactivity: 12,
  combinableWithPromos: false,
  creditedOn: "expédition de la commande",
  newsletterBonus: 100,
  reviewBonus: 20,
  reviewBonusMaxPerMonth: 1,
  birthdayBonus: 50,
  journalBonus: 0,
  /** Récompenses échangeables au panier. */
  rewards: [
    { id: "r5", leaves: 200, value: 5, label: "5 € de réduction" },
    { id: "r10", leaves: 400, value: 10, label: "10 € de réduction" },
    { id: "r20", leaves: 750, value: 20, label: "20 € de réduction" },
  ],
  /** Paliers sur feuilles gagnées en 12 mois glissants. */
  tiers: [
    { id: "pousse", name: "Pousse", min: 0, color: "#CDD6C9", perks: ["1  par euro dépensé", "Cadeau de bienvenue", "Bonus anniversaire"] },
    { id: "bourgeon", name: "Bourgeon", min: 300, color: "#E6E8E4", perks: ["Avant-premières nouveautés", "Échantillon offert à chaque commande", "Bonus anniversaire"] },
    { id: "fleur", name: "Fleur", min: 700, color: "#DDE3DA", perks: ["Livraison offerte sans minimum", "Accès ventes privées", "Échantillons au choix"] },
    { id: "canopee", name: "Canopée", min: 1200, color: "#E9EBE6", perks: ["Coffret surprise annuel", "Conseil skincare prioritaire", "Tous les avantages précédents"] },
  ],
};

export const welcomeOffer = {
  /** Réduction newsletter, sur la 1ʳᵉ commande éligible. */
  newsletterPercent: 20,
  validityDays: 30,
  minOrder: 0,
  /** Exclusions : les kits sont déjà remisés. */
  excludeKits: true,
  combinableWithOtherCodes: false,
  combinableWithLeaves: false,
  onePerEmail: true,
  conditionsHref: "/legal/conditions-offres",
};

export const firstOrderGift = {
  enabled: true,
  name: "Trio découverte de bienvenue",
  description: "3 échantillons offerts : Dew Drop, Aqua Plump et Cloud Cream",
  /** Le cadeau est ajouté automatiquement si aucun historique de commande n'existe pour ce compte / cet e-mail. */
  minOrder: 0,
};

/** Remise « Créer mon set » : -15 % sur le total du set dès 2 soins, 7 soins maximum. */
export const setDiscount = {
  enabled: true,
  /** Nombre maximum de soins dans un set « Créer mon set ». */
  maxItems: 7,
  tiers: [{ minItems: 2, percent: 15 }],
};

const baseAnnouncements = [
  "Un cadeau dans votre première commande ",
  "Découvrez votre routine personnalisée ",
  "Cruelty-free & glow-friendly ",
  "Rejoignez SKINCLEAN CLUB et gagnez des feuilles ",
  "-20 % sur ta 1ʳᵉ commande avec la newsletter ",
];

/** Bandeau d'annonces : modifiable depuis le Marketing Hub (Gestion du site). */
export const announcements: string[] = siteOverrides.announcements?.length ? siteOverrides.announcements : baseAnnouncements;

/** Rôles du back-office. */
export const adminRoles = {
  owner: { label: "Propriétaire", can: ["*"] },
  manager: { label: "Responsable e-shop", can: ["products", "kits", "promotions", "orders", "customers", "content", "loyalty", "diag", "newsletter"] },
  editor: { label: "Éditeur contenu", can: ["products", "kits", "content"] },
  support: { label: "Service client", can: ["orders", "customers", "loyalty"] },
} as const;
