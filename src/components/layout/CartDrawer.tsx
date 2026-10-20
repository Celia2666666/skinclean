"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useHydrated, useStore } from "@/lib/store";
import { useUI } from "@/lib/ui";
import { BagIcon, CloseIcon, ChatIcon } from "@/components/ui/Icons";
import { CartLines, CartSuggestions, FreeShippingBar, TotalsBlock, useCartTotals } from "./CartContent";

export function CartDrawer() {
  const open = useStore((s) => s.drawerOpen);
  const setDrawer = useStore((s) => s.setDrawer);
  const openAssistant = useUI((s) => s.openAssistant);
  const t = useCartTotals();
  const h = useHydrated();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, setDrawer]);

  return (
    <AnimatePresence>
      {open && h && (
        <motion.div className="fixed inset-0 z-[60]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-forest/30 backdrop-blur-[3px]" onClick={() => setDrawer(false)} />
          <motion.aside
            role="dialog" aria-modal="true" aria-label="Mon panier"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 32, stiffness: 300 }}
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-cream shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <p className="font-display text-2xl">Mon panier <span className="text-base text-forest-soft">({t.itemCount})</span></p>
              <button onClick={() => setDrawer(false)} className="grid h-10 w-10 place-items-center rounded-full bg-ivory transition hover:rotate-90" aria-label="Fermer le panier"><CloseIcon /></button>
            </div>
            {t.itemCount === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="text-sage-deep"><BagIcon size={48} /></motion.div>
                <p className="font-display text-2xl">Ton panier est vide</p>
                <p className="text-sm text-forest-soft">Laisse-toi guider : 2 minutes suffisent pour trouver ta routine.</p>
                <Link href="/skin-diag" onClick={() => setDrawer(false)} className="btn btn-primary">Faire mon Skin Diag</Link>
                <Link href="/best-sellers" onClick={() => setDrawer(false)} className="text-sm underline">Voir les best-sellers</Link>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
                  <FreeShippingBar />
                  <CartLines />
                  <button onClick={() => openAssistant("cart-check")} className="flex w-full items-center gap-2 rounded-[2px] bg-sky-soft p-3 text-left text-sm transition hover:bg-sky">
                    <ChatIcon size={18} /> Tu veux vérifier que tes produits fonctionnent bien ensemble ?
                  </button>
                  <CartSuggestions />
                </div>
                <div className="space-y-3 border-t border-line bg-ivory/60 px-5 py-4">
                  <TotalsBlock />
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/panier" onClick={() => setDrawer(false)} className="btn btn-ghost">Voir le panier</Link>
                    <Link href="/paiement" onClick={() => setDrawer(false)} className="btn btn-primary">Commander</Link>
                  </div>
                </div>
              </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
