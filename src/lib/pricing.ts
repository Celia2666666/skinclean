import { firstOrderGift, loyalty, setDiscount, shipping, welcomeOffer } from "@/data/config";
import { getProduct, resolveVariant, type PriceOverrides } from "./catalog";
import type { CartLine } from "./types";

export interface PromoState {
  /** Code saisi au panier (ex. GLOW20-XXXX). */
  code?: string;
  /** Codes de bienvenue valides pour ce client (non utilisés, non expirés). */
  welcomeCodes: { code: string; percent: number; expiresAt: number; used: boolean }[];
  /** Récompense fidélité choisie (id de config.loyalty.rewards). */
  rewardId?: string;
  leavesBalance: number;
  isFirstOrder: boolean;
}

export interface Totals {
  lines: { line: CartLine; name: string; unit: number; total: number; size: string; discount: number }[];
  subtotal: number;
  bundleDiscount: number;
  codeDiscount: number;
  codeError?: string;
  rewardDiscount: number;
  rewardError?: string;
  shipping: number;
  total: number;
  leavesEarned: number;
  gift?: { name: string; description: string };
  freeShippingRemaining: number;
  itemCount: number;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export function computeTotals(cart: CartLine[], promo: PromoState, overrides?: PriceOverrides): Totals {
  const lines = cart
    .filter((l) => !l.gift)
    .map((line) => {
      const p = getProduct(line.productId);
      if (!p) return null;
      const v = resolveVariant(p, line.variantId, overrides);
      const total = r2(v.price * line.qty);
      const discount = line.bundle?.discountPercent ? r2((total * line.bundle.discountPercent) / 100) : 0;
      return { line, name: p.name, unit: v.price, total, size: v.size, discount };
    })
    .filter(Boolean) as Totals["lines"];

  const subtotal = r2(lines.reduce((s, l) => s + l.total, 0));
  const bundleDiscount = r2(lines.reduce((s, l) => s + l.discount, 0));
  const itemCount = cart.filter((l) => !l.gift).reduce((s, l) => s + l.qty, 0);

  // Code promo (bienvenue newsletter) — non cumulable avec les remises kits si configuré.
  let codeDiscount = 0;
  let codeError: string | undefined;
  if (promo.code) {
    const wc = promo.welcomeCodes.find((c) => c.code.toUpperCase() === promo.code!.toUpperCase());
    if (!wc) codeError = "Ce code n'est pas valide.";
    else if (wc.used) codeError = "Ce code a déjà été utilisé.";
    else if (Date.now() > wc.expiresAt) codeError = "Ce code a expiré.";
    else if (!promo.isFirstOrder) codeError = "Ce code est réservé à la première commande.";
    else {
      const eligible = lines.filter((l) => !(welcomeOffer.excludeKits && l.line.bundle?.discountPercent)).reduce((s, l) => s + l.total, 0);
      if (eligible <= 0) codeError = "Aucun article éligible (les kits déjà remisés sont exclus).";
      else if (eligible < welcomeOffer.minOrder) codeError = `Minimum d'achat : ${welcomeOffer.minOrder} €.`;
      else codeDiscount = r2((eligible * wc.percent) / 100);
    }
  }

  // Récompense fidélité.
  let rewardDiscount = 0;
  let rewardError: string | undefined;
  if (promo.rewardId) {
    const rw = loyalty.rewards.find((r) => r.id === promo.rewardId);
    if (!rw) rewardError = "Récompense inconnue.";
    else if (promo.leavesBalance < rw.leaves) rewardError = `Il te faut ${rw.leaves} feuilles.`;
    else if (!loyalty.combinableWithPromos && (codeDiscount > 0 || bundleDiscount > 0))
      rewardError = "Les feuilles ne sont pas cumulables avec un code promo ou un kit remisé.";
    else rewardDiscount = Math.min(rw.value, subtotal - bundleDiscount - codeDiscount);
  }

  const afterDiscounts = r2(Math.max(0, subtotal - bundleDiscount - codeDiscount - rewardDiscount));
  const ship = itemCount === 0 || afterDiscounts >= shipping.freeFrom ? 0 : shipping.standardPrice;
  const total = r2(afterDiscounts + ship);

  return {
    lines,
    subtotal,
    bundleDiscount,
    codeDiscount,
    codeError,
    rewardDiscount,
    rewardError,
    shipping: ship,
    total,
    leavesEarned: Math.floor(afterDiscounts * loyalty.leavesPerEuro),
    gift: firstOrderGift.enabled && promo.isFirstOrder && itemCount > 0 && afterDiscounts >= firstOrderGift.minOrder
      ? { name: firstOrderGift.name, description: firstOrderGift.description }
      : undefined,
    freeShippingRemaining: r2(Math.max(0, shipping.freeFrom - afterDiscounts)),
    itemCount,
  };
}

export function setDiscountPercent(itemCount: number) {
  if (!setDiscount.enabled) return 0;
  return [...setDiscount.tiers].reverse().find((t) => itemCount >= t.minItems)?.percent ?? 0;
}

export function tierFor(leaves12m: number) {
  const tiers = loyalty.tiers;
  let idx = 0;
  tiers.forEach((t, i) => { if (leaves12m >= t.min) idx = i; });
  return { tier: tiers[idx], next: tiers[idx + 1], index: idx };
}
