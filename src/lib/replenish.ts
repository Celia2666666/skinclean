import { getProduct } from "./catalog";
import type { ProductType } from "./types";
import type { Account } from "./store";

/**
 * Durée d'utilisation estimée d'un format standard, utilisé selon le mode d'emploi (en jours).
 * Valeurs indicatives de démonstration, ajustables par la marque.
 */
export const usageDays: Partial<Record<ProductType, number>> = {
  nettoyant: 60, demaquillant: 60, toner: 60, serum: 45, creme: 60, brume: 45,
  "contour-yeux": 75, patchs: 30, masque: 60, "toner-pads": 60, exfoliant: 90, "soin-cible": 60, spf: 45,
};

/** Fenêtre d'alerte : à partir de combien de jours avant la fin le rappel apparaît. */
export const REMIND_BEFORE_DAYS = 14;
/** Au-delà de ce retard, on considère que le soin a été remplacé ou abandonné. */
const FORGET_AFTER_DAYS = 45;
const DAY = 864e5;

export interface RefillItem {
  productId: string;
  variantId: string;
  name: string;
  boughtAt: number;
  runsOutAt: number;
  /** Jours restants (négatif = déjà vide). */
  daysLeft: number;
  /** Part déjà utilisée, de 0 à 1. */
  used: number;
}

/**
 * Soins bientôt vides, d'après la date de la dernière commande de chaque soin.
 * Les commandes remboursées sont ignorées ; la quantité commandée allonge la durée.
 */
export function refillsFor(acc: Account | undefined, now = Date.now()): RefillItem[] {
  if (!acc) return [];
  const last = new Map<string, { at: number; qty: number; variantId: string; name: string }>();
  for (const o of acc.orders) {
    if (o.status === "remboursee") continue;
    for (const l of o.lines) {
      const prev = last.get(l.productId);
      if (!prev || o.date > prev.at) last.set(l.productId, { at: o.date, qty: l.qty, variantId: l.variantId, name: l.name });
    }
  }
  const out: RefillItem[] = [];
  for (const [productId, x] of last) {
    const p = getProduct(productId);
    const days = p ? usageDays[p.type] : undefined;
    if (!p || !days) continue;
    // Mini-format : environ un tiers de la durée.
    const variant = p.variants.find((v) => v.id === x.variantId);
    const total = days * x.qty * (variant?.mini ? 0.35 : 1);
    const runsOutAt = x.at + total * DAY;
    const daysLeft = Math.round((runsOutAt - now) / DAY);
    if (daysLeft > REMIND_BEFORE_DAYS || daysLeft < -FORGET_AFTER_DAYS) continue;
    out.push({ productId, variantId: x.variantId, name: x.name, boughtAt: x.at, runsOutAt, daysLeft, used: Math.min(1, (now - x.at) / (total * DAY)) });
  }
  return out.sort((a, b) => a.daysLeft - b.daysLeft);
}

/** Libellé court : « Bientôt vide dans 5 jours » / « Sans doute vide depuis 3 jours ». */
export function refillLabel(daysLeft: number) {
  if (daysLeft > 1) return `Bientôt vide, encore ${daysLeft} jours environ`;
  if (daysLeft >= -1) return "Sans doute vide en ce moment";
  return `Sans doute vide depuis ${-daysLeft} jours`;
}
