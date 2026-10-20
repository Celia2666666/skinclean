import { products } from "@/data/products";
import { kits } from "@/data/kits";
import { allCategoryDefs, typeCategories } from "@/data/categories";
import type { Kit, Product, Variant } from "./types";

export type PriceOverrides = Record<string, Record<string, { price?: number; stock?: number }>>;

export const getProducts = () => products;
export const getProduct = (idOrSlug: string) => products.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
export const getBestsellers = () =>
  products.filter((p) => p.bestseller).sort((a, b) => (a.bestseller ?? 0) - (b.bestseller ?? 0));
export const getCategory = (slug: string) => allCategoryDefs().find((c) => c.slug === slug);
export const getCategoryProducts = (slug: string) => {
  const c = getCategory(slug);
  return c ? products.filter(c.filter) : [];
};
export const categoryOfType = (p: Product) => typeCategories.find((c) => c.types.includes(p.type));

/** Variante avec surcharges admin éventuelles (prix/stock). */
export function resolveVariant(p: Product, variantId?: string, overrides?: PriceOverrides): Variant {
  const base = p.variants.find((v) => v.id === variantId) ?? p.variants[0];
  const o = overrides?.[p.id]?.[base.id];
  return { ...base, price: o?.price ?? base.price, stock: o?.stock ?? base.stock };
}

export const getKits = () => kits;
export const getKit = (slug: string) => kits.find((k) => k.slug === slug || k.id === slug);

export function kitPricing(k: Kit, overrides?: PriceOverrides) {
  const lines = k.items
    .map((it) => {
      const p = getProduct(it.productId);
      if (!p) return null;
      return { product: p, variant: resolveVariant(p, it.variantId, overrides) };
    })
    .filter(Boolean) as { product: Product; variant: Variant }[];
  const separate = lines.reduce((s, l) => s + l.variant.price, 0);
  const price = Math.round(separate * (1 - k.discountPercent / 100) * 100) / 100;
  return { lines, separate, price, saving: Math.round((separate - price) * 100) / 100 };
}

/** Produits complémentaires : même préoccupation, étape différente. */
export function complementary(p: Product, n = 4) {
  return products
    .filter((x) => x.id !== p.id && x.step !== p.step)
    .map((x) => ({ x, s: x.concerns.filter((c) => p.concerns.includes(c)).length + x.skinTypes.filter((t) => p.skinTypes.includes(t)).length * 0.2 + (x.bestseller ? 0.3 : 0) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map((r) => r.x);
}

export function searchProducts(q: string) {
  const s = q.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (!s) return [];
  const norm = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return products.filter((p) =>
    norm([p.name, p.kind, p.tagline, p.description, p.keyIngredients.map((k) => k.name).join(" "), p.concerns.join(" ")].join(" ")).includes(s)
  );
}

export const leavesFor = (amount: number, perEuro: number) => Math.floor(amount * perEuro);
