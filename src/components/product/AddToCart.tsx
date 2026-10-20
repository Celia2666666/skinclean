"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { getProduct, resolveVariant } from "@/lib/catalog";
import { useHydrated, useStore } from "@/lib/store";
import { useUI } from "@/lib/ui";
import { BagIcon, CheckIcon, HeartIcon, PlusIcon } from "@/components/ui/Icons";
import { useFavorites } from "@/lib/store";

/** Bouton d'ajout au panier avec micro-animation, toast et ouverture du mini-panier. */
export function AddToCartButton({
  productId, variantId = "std", qty = 1, className = "", label = "Ajouter au panier", compact = false, openDrawer = true,
}: { productId: string; variantId?: string; qty?: number; className?: string; label?: string; compact?: boolean; openDrawer?: boolean }) {
  const add = useStore((s) => s.addToCart);
  const setDrawer = useStore((s) => s.setDrawer);
  const overrides = useStore((s) => s.overrides);
  const toast = useUI((s) => s.toast);
  const [done, setDone] = useState(false);
  const h = useHydrated();
  const p = getProduct(productId);
  if (!p) return null;
  const v = resolveVariant(p, variantId, h ? overrides : undefined);
  const out = v.stock <= 0;

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (out) return;
    add(productId, v.id, qty);
    setDone(true);
    setTimeout(() => setDone(false), 1600);
    toast({ title: "Ajouté au panier", body: `${p.name} — ${v.size}`, productId });
    if (openDrawer) setTimeout(() => setDrawer(true), 450);
  };

  if (compact) {
    return (
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={onClick}
        disabled={out}
        aria-label={`Ajouter ${p.name} au panier`}
        className={`grid h-11 w-11 place-items-center rounded-full bg-forest text-ivory shadow-lg transition hover:scale-110 disabled:opacity-40 ${className}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {done ? (
            <motion.span key="ok" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}><CheckIcon size={20} /></motion.span>
          ) : (
            <motion.span key="plus" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><PlusIcon size={20} /></motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    );
  }

  return (
    <motion.button whileTap={{ scale: 0.96 }} onClick={onClick} disabled={out} className={`btn btn-primary ${className}`}>
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.span key="ok" className="flex items-center gap-2" initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }}>
            <CheckIcon size={18} /> Ajouté !
          </motion.span>
        ) : (
          <motion.span key="add" className="flex items-center gap-2" initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }}>
            <BagIcon size={18} /> {out ? "Rupture de stock" : label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export function FavoriteButton({ productId, className = "" }: { productId: string; className?: string }) {
  const toggle = useStore((s) => s.toggleFavorite);
  const favs = useFavorites();
  const h = useHydrated();
  const on = h && favs.includes(productId);
  return (
    <motion.button
      whileTap={{ scale: 0.8 }}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(productId); }}
      aria-pressed={on}
      aria-label={on ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={`grid h-10 w-10 place-items-center rounded-full bg-ivory/90 backdrop-blur transition hover:scale-110 ${on ? "text-forest" : "text-forest"} ${className}`}
    >
      <motion.span key={String(on)} initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }}>
        <HeartIcon size={19} filled={on} />
      </motion.span>
    </motion.button>
  );
}
