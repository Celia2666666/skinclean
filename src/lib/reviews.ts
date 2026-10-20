import { demoReviews } from "@/data/reviews";
import { reviewsConfig } from "@/data/config";
import { getProduct } from "./catalog";
import type { Review } from "./types";

/** Avis d'un produit : vrais avis (catalogue + clients) puis, si activés, avis de démonstration. */
export function reviewsOf(productId: string, extra: Review[] = []): Review[] {
  const p = getProduct(productId);
  const real = [...(p?.reviews ?? []), ...extra.filter((r) => r.productId === productId)];
  const demo = reviewsConfig.showDemoReviews ? demoReviews[productId] ?? [] : [];
  return [...real.sort((a, b) => b.date.localeCompare(a.date)), ...demo];
}

export function ratingStats(list: Review[]) {
  const count = list.length;
  const avg = count ? list.reduce((s, r) => s + r.rating, 0) / count : 0;
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: list.filter((r) => r.rating === n).length }));
  return { count, avg: Math.round(avg * 10) / 10, dist };
}

/** Pour les données structurées : uniquement les vrais avis (jamais les avis de démonstration). */
export function realRatingStats(productId: string) {
  const p = getProduct(productId);
  return ratingStats((p?.reviews ?? []).filter((r) => !r.demo));
}
