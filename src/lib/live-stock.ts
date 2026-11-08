/**
 * STOCK EN DIRECT (site ↔ CRM)
 * En local, le stock affiché par le site (ruptures, « plus que X en stock », boutons d'achat) est celui du CRM,
 * chargé par <LiveStockSync /> depuis /api/stock. En ligne (Vercel, pas de CRM), la table reste vide
 * et le site utilise le stock du catalogue (src/data/products.ts).
 * Priorité : surcharge manuelle de /admin > stock du CRM > stock du catalogue.
 */
let live: Record<string, number> = {};
let source: "crm" | "catalogue" = "catalogue";

export const liveStockOf = (productId: string, variantId: string): number | undefined => live[`${productId}:${variantId}`];
export const liveStockSource = () => source;
export function setLiveStock(map: Record<string, number>, from: "crm" | "catalogue") {
  live = map;
  source = from;
}
