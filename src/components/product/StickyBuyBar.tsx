"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/types";
import { Packshot } from "./Packshot";
import { PriceTag } from "./PriceTag";
import { AddToCartButton } from "./AddToCart";

/** Barre d'achat qui glisse depuis le bas quand le bloc d'achat de la fiche sort de l'écran (vers le haut). */
export function StickyBuyBar({ product, anchorId = "achat" }: { product: Product; anchorId?: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = document.getElementById(anchorId);
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, [anchorId]);

  // Signale la barre au reste de la page (le comparateur se décale au-dessus).
  useEffect(() => {
    if (show) document.body.dataset.stickyBuy = "on";
    else delete document.body.dataset.stickyBuy;
    return () => { delete document.body.dataset.stickyBuy; };
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: "110%" }} animate={{ y: 0 }} exit={{ y: "110%" }}
          transition={{ type: "spring", stiffness: 300, damping: 32 }}
          className="fixed inset-x-0 bottom-0 z-[54] border-t border-line bg-ivory/95 backdrop-blur"
          role="region" aria-label={`Acheter ${product.name}`}
        >
          <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-2.5 md:px-8">
            <motion.div initial={{ rotate: -12, scale: 0.6 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.1 }} className="h-12 w-10 shrink-0 p-0.5" style={{ background: product.color.bg }}>
              <Packshot product={product} className="h-full w-full" showTag={false} sizes="40px" />
            </motion.div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium leading-tight">{product.name}</p>
              <p className="truncate text-xs text-forest-soft">{product.kind} · <PriceTag productId={product.id} /></p>
            </div>
            <AddToCartButton productId={product.id} className="shrink-0 px-5 py-3 text-sm" label="Ajouter" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
