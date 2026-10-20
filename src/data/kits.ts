import type { Kit } from "@/lib/types";
import { applyKitOverrides } from "@/lib/site-overrides";

/**
 * Kits & routines. `discountPercent` est une valeur de démonstration (modifiable dans l'admin).
 * Le prix du kit est toujours calculé à partir des prix catalogue → jamais désynchronisé.
 */
const baseKits: Kit[] = [
  {
    id: "kit-summer-glow", slug: "summer-glow", name: "Summer Glow Kit", season: "ete", group: "saison",
    tagline: "Lumineuse, fraîche, protégée",
    description: "La routine de l'été : un teint qui capte la lumière, une hydratation légère et une protection solaire qu'on oublie qu'on porte.",
    items: [{ productId: "sc-sr-02" }, { productId: "sc-bm-01" }, { productId: "sc-sp-01" }, { productId: "sc-cr-01" }],
    discountPercent: 15,
    routine: ["Matin : Glow Shot pour l'éclat", "Cloud Cream pour hydrater léger", "Daily Shield SPF 50 en dernier geste", "Fresh Mist dans la journée pour rafraîchir"],
    color: "#EFEEEA", accent: "#5E7A68",
  },
  {
    id: "kit-winter-rescue", slug: "winter-rescue", name: "Winter Rescue Kit", season: "hiver", group: "saison",
    tagline: "Hydratation & confort grand froid",
    description: "Quand le froid tiraille : un démaquillage doux, une hydratation intense et une crème cocon qui restaure la barrière cutanée.",
    items: [{ productId: "sc-dm-02" }, { productId: "sc-sr-03" }, { productId: "sc-cr-02" }, { productId: "sc-ms-01" }],
    discountPercent: 15,
    routine: ["Soir : Silk Off pour démaquiller sans frotter", "Aqua Plump sur peau humide", "Velvet Barrier pour sceller", "1 à 2 fois par semaine : Hydra Bloom en masque de nuit"],
    color: "#EFEEEA", accent: "#5E7A68",
  },
  {
    id: "kit-spring-refresh", slug: "spring-refresh", name: "Spring Refresh Kit", season: "printemps", group: "saison",
    tagline: "Peau neuve, teint frais",
    description: "On réveille la peau après l'hiver : exfoliation douce, toner hydratant et crème légère pour un teint frais.",
    items: [{ productId: "sc-cl-01" }, { productId: "sc-ex-01" }, { productId: "sc-tn-01" }, { productId: "sc-cr-01" }],
    discountPercent: 15,
    routine: ["Cloud Gel matin et soir", "1 à 2 fois par semaine : Polish Me", "Dew Drop en 2 couches", "Cloud Cream pour finir"],
    color: "#EFEEEA", accent: "#5E7A68",
  },
  {
    id: "kit-autumn-reset", slug: "autumn-reset", name: "Autumn Reset Kit", season: "automne", group: "saison",
    tagline: "On répare l'été, on lisse le grain",
    description: "La rentrée de ta peau : lisser la texture, unifier le teint et préparer l'arrivée du froid.",
    items: [{ productId: "sc-dm-01" }, { productId: "sc-tn-02" }, { productId: "sc-tg-01" }, { productId: "sc-cr-02" }],
    discountPercent: 15,
    routine: ["Soir : Melt Away puis ton nettoyant", "Smooth Reset 2 à 3 soirs par semaine", "Even Out sur les zones à unifier", "Velvet Barrier pour nourrir"],
    color: "#EFEEEA", accent: "#5E7A68",
  },
  {
    id: "kit-acne-control", slug: "acne-control", name: "Acne Control", group: "routine",
    tagline: "La routine peau nette, sans agresser",
    description: "Un trio purifiant pensé pour les peaux à imperfections, avec une hydratation matifiante et le SOS patchs.",
    items: [{ productId: "sc-cl-02" }, { productId: "sc-sr-01" }, { productId: "sc-cr-03" }, { productId: "sc-pt-01" }],
    discountPercent: 12,
    routine: ["Clear Foam matin et soir", "Clear Skin sur tout le visage", "Matte Balance pour hydrater", "Spot Hero sur les imperfections la nuit"],
    color: "#EFEEEA", accent: "#5E7A68",
  },
  {
    id: "kit-hydration-boost", slug: "hydration-boost", name: "Hydration Boost", group: "routine",
    tagline: "3 couches d'hydratation",
    description: "La superposition idéale pour une peau gorgée d'eau : toner, sérum hyaluronique et crème légère.",
    items: [{ productId: "sc-tn-01" }, { productId: "sc-sr-03" }, { productId: "sc-cr-01" }],
    discountPercent: 12,
    routine: ["Dew Drop en 2 à 3 couches", "Aqua Plump sur peau encore humide", "Cloud Cream pour sceller"],
    color: "#EFEEEA", accent: "#5E7A68",
  },
  {
    id: "kit-glass-skin", slug: "glass-skin-routine", name: "Glass Skin Routine", group: "routine",
    tagline: "L'effet peau de verre, étape par étape",
    description: "Inspirée des routines coréennes en plusieurs couches : double nettoyage, hydratation superposée et éclat.",
    items: [{ productId: "sc-dm-01" }, { productId: "sc-cl-01" }, { productId: "sc-tn-01" }, { productId: "sc-sr-02" }, { productId: "sc-cr-01" }],
    discountPercent: 15,
    routine: ["Soir : Melt Away puis Cloud Gel", "Dew Drop en 3 couches fines", "Matin : Glow Shot", "Cloud Cream matin et soir"],
    color: "#EFEEEA", accent: "#5E7A68",
  },
  {
    id: "kit-travel", slug: "travel-essentials", name: "Travel Essentials", group: "voyage",
    tagline: "Ta routine en format cabine",
    description: "Les indispensables en mini-formats, conformes aux bagages cabine : nettoyer, hydrater, protéger.",
    items: [
      { productId: "sc-cl-01", variantId: "mini" },
      { productId: "sc-tn-01", variantId: "mini" },
      { productId: "sc-sr-03", variantId: "mini" },
      { productId: "sc-cr-01", variantId: "mini" },
      { productId: "sc-sp-01", variantId: "mini" },
    ],
    discountPercent: 10,
    routine: ["Cloud Gel mini matin et soir", "Dew Drop mini", "Aqua Plump mini", "Cloud Cream mini", "Daily Shield mini le matin"],
    color: "#EFEEEA", accent: "#5E7A68",
  },
];

/** Kits publiés = kits de base + kits saisonniers ajoutés depuis le Marketing Hub. */
export const kits: Kit[] = applyKitOverrides(baseKits);
export { baseKits };
