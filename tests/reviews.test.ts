import { describe, expect, it } from "vitest";
import { demoReviews } from "@/data/reviews";
import { products } from "@/data/products";
import { ratingStats, realRatingStats, reviewsOf } from "@/lib/reviews";
import { leavesBalance, useStore } from "@/lib/store";

const s = () => useStore.getState();

describe("avis clients (notation en feuilles)", () => {
  it("chaque avis de démonstration est marqué comme tel, noté de 1 à 5", () => {
    for (const p of products) for (const r of demoReviews[p.id]) {
      expect(r.demo).toBe(true);
      expect(r.verified).toBe(false);
      expect(r.rating).toBeGreaterThanOrEqual(1);
      expect(r.rating).toBeLessThanOrEqual(5);
    }
  });
  it("les avis de démonstration ne sont jamais déclarés aux moteurs de recherche", () => {
    for (const p of products) expect(realRatingStats(p.id).count).toBe(0);
  });
  it("moyenne et répartition cohérentes", () => {
    const st = ratingStats(reviewsOf("sc-sr-01"));
    expect(st.dist.reduce((a, d) => a + d.c, 0)).toBe(st.count);
    expect(st.avg).toBeGreaterThan(0);
  });
  it("publication réservée aux acheteurs, bonus de feuilles 1 fois par mois", async () => {
    expect(s().addReview({ productId: "sc-sr-01", rating: 5, text: "Très bon sérum, texture légère." }).ok).toBe(false);
    await s().register({ email: "avis@example.com", firstName: "Lou", lastName: "Martin", password: "motdepasse1", newsletter: false });
    expect(s().addReview({ productId: "sc-sr-01", rating: 5, text: "Très bon sérum, texture légère." }).error).toMatch(/commandé/);
    s().recordOrder({ email: "avis@example.com", lines: [{ productId: "sc-sr-01", variantId: "std", name: "Clear Skin", size: "30 ml", qty: 1, unit: 22 }, { productId: "sc-cl-01", variantId: "std", name: "Cloud Gel", size: "150 ml", qty: 1, unit: 14 }], subtotal: 36, discount: 0, shipping: 4.9, total: 40.9, leaves: 0, status: "test", paymentMode: "test" });
    const r1 = s().addReview({ productId: "sc-sr-01", rating: 5, title: "Top", text: "Très bon sérum, texture légère." });
    expect(r1.ok).toBe(true);
    expect(r1.leaves).toBe(20);
    expect(s().addReview({ productId: "sc-sr-01", rating: 4, text: "Deuxième avis sur le même produit." }).ok).toBe(false);
    const r2 = s().addReview({ productId: "sc-cl-01", rating: 4, text: "Nettoyant doux, ne tiraille pas." });
    expect(r2.ok).toBe(true);
    expect(r2.leaves).toBe(0);
    expect(leavesBalance(s().accounts["avis@example.com"])).toBe(20);
    const mine = reviewsOf("sc-sr-01", s().userReviews)[0];
    expect(mine.verified).toBe(true);
    expect(mine.author).toBe("Lou M.");
  });
});
