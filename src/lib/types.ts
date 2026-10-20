/**
 * SKINCLEAN — types métier partagés.
 * Un produit = une seule fiche, reliée à plusieurs catégories via `type`, `concerns` et `skinTypes`.
 */

export type SkinType = "seche" | "grasse" | "mixte" | "normale" | "sensible";

export type Concern =
  | "acne" | "points-noirs" | "sebum" | "secheresse" | "deshydratation" | "rougeurs"
  | "sensibilite" | "terne" | "glow" | "cernes" | "ridules" | "rebondi" | "pores" | "texture";

export type ProductType =
  | "nettoyant" | "demaquillant" | "toner" | "serum" | "creme" | "brume" | "contour-yeux"
  | "patchs" | "masque" | "toner-pads" | "exfoliant" | "soin-cible" | "spf" | "accessoire";

export type RoutineStep =
  | "demaquillage" | "nettoyage" | "tonique" | "serum" | "contour-yeux" | "hydratation"
  | "protection" | "soin-cible" | "masque" | "exfoliation" | "brume" | "accessoire";

export type Moment = "matin" | "soir";

/** Actifs utilisés par le moteur de compatibilité (évite les associations irritantes). */
export type Active =
  | "aha" | "bha" | "pha" | "retinoide" | "vitamine-c" | "niacinamide"
  | "acide-azelaique" | "dha" | "enzymes" | "bakuchiol";

/** Forme du flacon pour les packshots provisoires générés. */
export type PackShape = "dropper" | "tube" | "jar" | "pump" | "mist" | "pads" | "patch" | "bottle";

/** Mise en scène de texture / application au survol. */
export type TextureKind =
  | "drops" | "aqueous" | "cream" | "foam" | "mask" | "liquid" | "balm" | "mist"
  | "pads" | "patch" | "gel" | "powder" | "none";

export interface Variant {
  id: string;
  label: string;
  size: string;
  price: number;
  stock: number;
  mini?: boolean;
}

export interface ProductMedia {
  /** Packshot principal (/public/media/packshots). Absent = visuel SVG provisoire. */
  packshot?: string;
  /** Visuel secondaire affiché au survol (lifestyle / texture). */
  hover?: string;
  /** Vidéo courte d'application jouée au survol (/public/media/videos). */
  hoverVideo?: string;
  /** Vidéo tutoriel « Comment l'utiliser ? ». */
  howToVideo?: string;
  gallery?: string[];
  /** Vrais visuels avant / après fournis par la marque uniquement. */
  beforeAfter?: { before: string; after: string; caption: string }[];
}

export interface Review {
  id: string;
  productId: string;
  author: string;
  /** Note en feuilles, de 1 à 5. */
  rating: number;
  /** Date ISO (AAAA-MM-JJ). */
  date: string;
  title?: string;
  text: string;
  skinType?: SkinType;
  /** Achat vérifié (avis lié à une commande). */
  verified: boolean;
  /** Avis fictif de démonstration — jamais présenté comme un vrai avis. */
  demo?: boolean;
  helpful?: number;
  /** Interne : auteur d'un avis publié depuis le site (jamais affiché). */
  authorEmail?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  /** Nature du soin, ex. « Sérum niacinamide 10 % ». */
  kind: string;
  tagline: string;
  type: ProductType;
  concerns: Concern[];
  skinTypes: SkinType[];
  description: string;
  benefits: string[];
  variants: Variant[];
  keyIngredients: { name: string; role: string }[];
  /** Liste INCI de démonstration — à remplacer par la liste validée. */
  inci: string;
  usage: string;
  tips: string[];
  moments: Moment[];
  frequency: string;
  step: RoutineStep;
  precautions?: string[];
  actives: Active[];
  /** 0 = ultra doux … 3 = actif puissant. Les peaux réactives sont limitées à ≤ 1. */
  intensity: 0 | 1 | 2 | 3;
  /** % d'ingrédients d'origine naturelle — null tant que la valeur n'est pas validée. */
  naturalOrigin: number | null;
  /** "core" = peut composer une routine du diag ; "addon" = soin complémentaire uniquement. */
  routineRole: "core" | "addon";
  /** Rang dans les 7 best-sellers (1 à 7). */
  bestseller?: number;
  isNew?: boolean;
  color: { bg: string; accent: string; liquid: string };
  pack: PackShape;
  texture: TextureKind;
  textureLabel: string;
  media: ProductMedia;
  faq: { q: string; a: string }[];
  /** Uniquement de vrais avis clients (vide tant qu'aucun n'est collecté). */
  reviews: Review[];
}

export interface Kit {
  id: string;
  slug: string;
  name: string;
  season?: "ete" | "hiver" | "printemps" | "automne";
  group: "saison" | "routine" | "voyage";
  tagline: string;
  description: string;
  items: { productId: string; variantId?: string }[];
  /** Remise du coffret en % vs produits séparés — valeur de démonstration modifiable. */
  discountPercent: number;
  routine: string[];
  color: string;
  accent: string;
}

export interface CartLine {
  key: string;
  productId: string;
  variantId: string;
  qty: number;
  /** Ligne issue d'un kit, d'un set ou d'une routine : regroupement visuel. */
  bundle?: { id: string; name: string; discountPercent?: number };
  gift?: boolean;
}
