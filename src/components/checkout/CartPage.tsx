"use client";
import { PaymentLogos } from "./PaymentMethods";
import Link from "next/link";
import { CartLines, CartSuggestions, FreeShippingBar, PromoAndRewards, TotalsBlock, useCartTotals } from "@/components/layout/CartContent";
import { useHydrated } from "@/lib/store";
import { useUI } from "@/lib/ui";
import { ChatIcon, LockIcon } from "@/components/ui/Icons";

export function CartPage() {
  const t = useCartTotals();
  const h = useHydrated();
  const openAssistant = useUI((s) => s.openAssistant);
  if (!h) return <div className="min-h-[60vh]" />;
  return (
    <div className="mx-auto max-w-[1300px] px-4 py-12 md:px-8">
      <h1 className="font-display text-5xl md:text-6xl">Mon panier</h1>
      {t.itemCount === 0 ? (
        <div className="mt-10 rounded-none bg-ivory p-10 text-center">
          <p className="font-display text-3xl">Ton panier est vide </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/skin-diag" className="btn btn-primary">Faire mon Skin Diag</Link>
            <Link href="/best-sellers" className="btn btn-ghost">Voir les best-sellers</Link>
          </div>
        </div>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            <FreeShippingBar />
            <div className="rounded-none bg-ivory/60 px-5"><CartLines /></div>
            <button onClick={() => openAssistant("cart-check")} className="flex w-full items-center gap-3 rounded-[2px] bg-sky-soft p-4 text-left transition hover:bg-sky"><ChatIcon /> Tu veux vérifier que tes produits fonctionnent bien ensemble ? Demande au Glow Assistant.</button>
            <CartSuggestions />
          </div>
          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="space-y-5 rounded-none bg-ivory p-6">
              <PromoAndRewards />
              <TotalsBlock />
              <Link href="/paiement" className="btn btn-primary w-full py-4 text-base"><LockIcon size={18} /> Passer commande</Link>
              <div className="space-y-2 text-center"><p className="text-xs text-forest-soft">Paiement sécurisé</p><PaymentLogos className="justify-center" /></div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
