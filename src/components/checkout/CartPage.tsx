"use client";
import { PaymentLogos } from "./PaymentMethods";
import Link from "next/link";
import { CartLines, CartSuggestions, ClearCartButton, FreeShippingBar, PromoAndRewards, TotalsBlock, useCartTotals } from "@/components/layout/CartContent";
import { useHydrated } from "@/lib/store";
import { useUI } from "@/lib/ui";
import { BagIcon, ChatIcon, LockIcon } from "@/components/ui/Icons";
import { motion } from "framer-motion";

export function CartPage() {
  const t = useCartTotals();
  const h = useHydrated();
  const openAssistant = useUI((s) => s.openAssistant);
  if (!h) return <div className="min-h-[60vh]" />;
  return (
    <div className="mx-auto max-w-[1300px] px-4 py-12 md:px-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-end gap-4">
        <h1 className="font-display text-5xl md:text-6xl">Mon panier</h1>
        {t.itemCount > 0 && (
          <motion.span key={t.itemCount} initial={{ scale: 0.4, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 400, damping: 14 }} className="mb-2 grid h-9 min-w-9 place-items-center rounded-full bg-forest px-2 text-sm font-semibold text-ivory">
            {t.itemCount}
          </motion.span>
        )}
      </motion.div>
      {t.itemCount === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-10 rounded-none bg-ivory p-10 text-center">
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} className="mx-auto mb-4 w-fit text-sage-deep"><BagIcon size={48} /></motion.div>
          <p className="font-display text-3xl">Ton panier est vide</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/skin-diag" className="btn btn-primary">Faire mon Skin Diag</Link>
            <Link href="/best-sellers" className="btn btn-ghost">Voir les best-sellers</Link>
          </div>
        </motion.div>
      ) : (
        <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[1.5fr_1fr]">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }} className="space-y-6">
            <FreeShippingBar />
            <div className="rounded-none bg-ivory/60 px-5"><CartLines /><ClearCartButton className="border-t border-line py-3" /></div>
            <button onClick={() => openAssistant("cart-check")} className="flex w-full items-center gap-3 rounded-[2px] bg-sky-soft p-4 text-left transition hover:bg-sky"><ChatIcon /> Tu veux vérifier que tes produits fonctionnent bien ensemble ? Demande au Glow Assistant.</button>
            <CartSuggestions />
          </motion.div>
          <motion.aside initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.25 }} className="space-y-5 lg:sticky lg:top-[calc(6rem+var(--demo-h))] lg:self-start">
            <div className="space-y-5 rounded-none bg-ivory p-6">
              <PromoAndRewards />
              <TotalsBlock />
              <Link href="/paiement" className="btn btn-primary btn-shine w-full py-4 text-base"><LockIcon size={18} /> Passer commande</Link>
              <div className="space-y-2 text-center"><p className="text-xs text-forest-soft">Paiement sécurisé</p><PaymentLogos className="justify-center" /></div>
            </div>
          </motion.aside>
        </div>
      )}
    </div>
  );
}
