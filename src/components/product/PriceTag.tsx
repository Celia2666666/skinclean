"use client";
import { getProduct, resolveVariant } from "@/lib/catalog";
import { euro } from "@/lib/format";
import { useHydrated, useStore } from "@/lib/store";

/** Prix toujours synchronisé avec le catalogue (+ surcharges admin). */
export function PriceTag({ productId, variantId, className = "" }: { productId: string; variantId?: string; className?: string }) {
  const overrides = useStore((s) => s.overrides);
  const h = useHydrated();
  const p = getProduct(productId);
  if (!p) return null;
  const v = resolveVariant(p, variantId, h ? overrides : undefined);
  return <span className={className}>{euro(v.price)}</span>;
}

export function StockBadge({ productId, variantId }: { productId: string; variantId?: string }) {
  const overrides = useStore((s) => s.overrides);
  const h = useHydrated();
  const p = getProduct(productId);
  if (!p) return null;
  const v = resolveVariant(p, variantId, h ? overrides : undefined);
  if (v.stock <= 0) return <span className="chip bg-blush">Rupture de stock</span>;
  if (v.stock < 15) return <span className="chip bg-butter">Plus que {v.stock} en stock</span>;
  return <span className="chip bg-sage-soft">✓ En stock</span>;
}
