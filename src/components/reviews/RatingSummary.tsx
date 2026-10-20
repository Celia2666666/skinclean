"use client";
import { useMemo } from "react";
import { ratingStats, reviewsOf } from "@/lib/reviews";
import { useHydrated, useStore } from "@/lib/store";
import { LeafRating } from "./LeafRating";

/** Note moyenne compacte (cartes produit, en-tête de fiche). */
export function RatingSummary({ productId, size = 13, link = false, className = "" }: { productId: string; size?: number; link?: boolean; className?: string }) {
  const userReviews = useStore((s) => s.userReviews);
  const h = useHydrated();
  const { avg, count } = useMemo(() => ratingStats(reviewsOf(productId, h ? userReviews : [])), [productId, userReviews, h]);
  if (!count) return <span className={`text-xs text-forest-soft ${className}`}>Pas encore d&apos;avis</span>;
  const inner = (
    <>
      <LeafRating value={avg} size={size} />
      <span className="text-xs text-forest-soft">{avg.toFixed(1).replace(".", ",")} ({count})</span>
    </>
  );
  return link ? <a href="#avis" className={`inline-flex items-center gap-1.5 hover:underline ${className}`}>{inner}</a> : <span className={`inline-flex items-center gap-1.5 ${className}`}>{inner}</span>;
}
