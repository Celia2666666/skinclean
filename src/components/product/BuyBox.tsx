"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { AddToCartButton, FavoriteButton } from "./AddToCart";
import { PriceTag, StockBadge } from "./PriceTag";
import { MinusIcon, PlusIcon, TruckIcon, GiftIcon, LeafIcon } from "@/components/ui/Icons";
import { loyalty, shipping, firstOrderGift } from "@/data/config";
import { euro } from "@/lib/format";
import { resolveVariant } from "@/lib/catalog";
import { useHydrated, useStore } from "@/lib/store";

export function BuyBox({ product }: { product: Product }) {
  const [variantId, setVariantId] = useState(product.variants[0].id);
  const [qty, setQty] = useState(1);
  const overrides = useStore((s) => s.overrides);
  const h = useHydrated();
  const v = resolveVariant(product, variantId, h ? overrides : undefined);
  const leaves = Math.floor(v.price * qty * loyalty.leavesPerEuro);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <PriceTag productId={product.id} variantId={variantId} className="font-display text-4xl" />
        <span className="text-sm text-forest-soft">{v.size}</span>
        <span className="ml-auto"><StockBadge productId={product.id} variantId={variantId} /></span>
      </div>

      {product.variants.length > 1 && (
        <div role="radiogroup" aria-label="Format" className="flex flex-wrap gap-2">
          {product.variants.map((x) => (
            <button key={x.id} role="radio" aria-checked={variantId === x.id} onClick={() => setVariantId(x.id)} className={`relative rounded-[2px] border-2 px-4 py-2.5 text-left text-sm transition ${variantId === x.id ? "border-forest bg-ivory" : "border-transparent bg-ivory/60 hover:bg-ivory"}`}>
              {variantId === x.id && <motion.span layoutId={`v-${product.id}`} className="absolute inset-0 -z-10 rounded-[2px] bg-sage-soft" />}
              <span className="block font-semibold">{x.label}</span>
              <span className="text-xs text-forest-soft">{x.size} · {euro(resolveVariant(product, x.id, h ? overrides : undefined).price)}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <div className="flex items-center border border-line bg-ivory">
          <button className="grid h-12 w-12 place-items-center" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Diminuer"><MinusIcon size={18} /></button>
          <span className="w-6 text-center font-semibold" aria-live="polite">{qty}</span>
          <button className="grid h-12 w-12 place-items-center" onClick={() => setQty(Math.min(10, qty + 1))} aria-label="Augmenter"><PlusIcon size={18} /></button>
        </div>
        <AddToCartButton productId={product.id} variantId={variantId} qty={qty} className="flex-1 py-4" />
        <FavoriteButton productId={product.id} className="h-[52px] w-[52px] bg-ivory" />
      </div>

      <div className="grid gap-2 text-sm">
        <p className="flex items-center gap-2 rounded-[2px] bg-sage-soft px-4 py-3"><LeafIcon size={18} /> Tu gagnes <b>{leaves} feuilles</b> SKINCLEAN CLUB avec cet achat</p>
        <p className="flex items-center gap-2 px-4"><TruckIcon size={18} /> Livraison offerte dès {euro(shipping.freeFrom)} · {shipping.label}</p>
        {firstOrderGift.enabled && <p className="flex items-center gap-2 px-4"><GiftIcon size={18} /> {firstOrderGift.name} offert pour ta 1ʳᵉ commande</p>}
      </div>
    </div>
  );
}
