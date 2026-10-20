import { describe, expect, it } from "vitest";
import { products } from "@/data/products";
import { kits } from "@/data/kits";
import { allCategoryDefs } from "@/data/categories";
import { getBestsellers, getCategoryProducts, kitPricing } from "@/lib/catalog";

describe("catalogue", () => {
  it("ids et slugs uniques (une seule fiche par produit)", () => {
    expect(new Set(products.map((p) => p.id)).size).toBe(products.length);
    expect(new Set(products.map((p) => p.slug)).size).toBe(products.length);
  });
  it("prix des formats classiques entre 10 et 40 €", () => {
    for (const p of products) for (const v of p.variants.filter((x) => !x.mini)) expect(v.price).toBeGreaterThanOrEqual(10), expect(v.price).toBeLessThanOrEqual(40);
  });
  it("exactement 7 best-sellers", () => expect(getBestsellers()).toHaveLength(7));
  it("un produit apparaît dans plusieurs catégories sans doublon", () => {
    const serum = getCategoryProducts("serums").map((p) => p.id);
    const acne = getCategoryProducts("acne-imperfections").map((p) => p.id);
    expect(serum).toContain("sc-sr-01");
    expect(acne).toContain("sc-sr-01");
  });
  it("aucune catégorie vide", () => {
    for (const c of allCategoryDefs()) expect(getCategoryProducts(c.slug).length, c.slug).toBeGreaterThan(0);
  });
  it("les kits ne référencent que des produits existants et sont moins chers que les produits séparés", () => {
    for (const k of kits) {
      const pr = kitPricing(k);
      expect(pr.lines).toHaveLength(k.items.length);
      expect(pr.price).toBeLessThanOrEqual(pr.separate);
    }
  });
});
