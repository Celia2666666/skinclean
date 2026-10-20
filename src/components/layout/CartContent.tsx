"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { getKits, getProduct, complementary } from "@/lib/catalog";
import { computeTotals } from "@/lib/pricing";
import { euro } from "@/lib/format";
import { leavesBalance, useAccount, useHydrated, useIsFirstOrder, useStore } from "@/lib/store";
import { loyalty, shipping } from "@/data/config";
import { Packshot } from "@/components/product/Packshot";
import { AddToCartButton } from "@/components/product/AddToCart";
import { GiftIcon, MinusIcon, PlusIcon, TrashIcon, TruckIcon } from "@/components/ui/Icons";

export function useCartTotals() {
  const cart = useStore((s) => s.cart);
  const promoCode = useStore((s) => s.promoCode);
  const rewardId = useStore((s) => s.rewardId);
  const welcomeCodes = useStore((s) => s.welcomeCodes);
  const overrides = useStore((s) => s.overrides);
  const kitDiscounts = useStore((s) => s.kitDiscounts);
  const acc = useAccount();
  const first = useIsFirstOrder();
  const h = useHydrated();
  return useMemo(() => {
    // Remise kits synchronisée avec la config (et les surcharges admin)
    const lines = (h ? cart : []).map((l) => {
      if (!l.bundle) return l;
      const kit = getKits().find((k) => k.id === l.bundle!.id);
      if (!kit) return l;
      return { ...l, bundle: { ...l.bundle, discountPercent: kitDiscounts[kit.id] ?? kit.discountPercent } };
    });
    return computeTotals(lines, { code: promoCode, rewardId, welcomeCodes, leavesBalance: leavesBalance(acc), isFirstOrder: first }, overrides);
  }, [h, cart, promoCode, rewardId, welcomeCodes, acc, first, overrides, kitDiscounts]);
}

export function CartLines({ editable = true }: { editable?: boolean }) {
  const cart = useStore((s) => s.cart);
  const setQty = useStore((s) => s.setQty);
  const removeLine = useStore((s) => s.removeLine);
  const totals = useCartTotals();
  const h = useHydrated();
  if (!h) return null;

  return (
    <ul className="divide-y divide-line">
      <AnimatePresence initial={false}>
        {totals.lines.map(({ line, name, unit, total, size, discount }) => {
          const p = getProduct(line.productId)!;
          return (
            <motion.li key={line.key} layout initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30, height: 0 }} className="flex gap-4 py-4">
              <Link href={`/produits/${p.slug}`} className="relative h-24 w-20 shrink-0 overflow-hidden rounded-[2px] p-1.5" style={{ background: p.color.bg }}>
                <Packshot product={p} className="h-full w-full" showTag={false} sizes="80px" />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/produits/${p.slug}`} className="font-display text-lg leading-tight hover:underline">{name}</Link>
                    <p className="text-xs text-forest-soft">{p.kind} · {size}</p>
                    {line.bundle && <span className="chip mt-1 bg-sage-soft">{line.bundle.name}{discount > 0 ? ` · -${line.bundle.discountPercent}%` : ""}</span>}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{euro(total - discount)}</p>
                    {discount > 0 && <p className="text-xs text-forest-soft line-through">{euro(total)}</p>}
                  </div>
                </div>
                {editable && (
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center border border-line bg-ivory">
                      <button className="grid h-8 w-8 place-items-center" onClick={() => line.qty > 1 ? setQty(line.key, line.qty - 1) : removeLine(line.key)} aria-label="Diminuer la quantité"><MinusIcon size={16} /></button>
                      <motion.span key={line.qty} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-6 text-center text-sm font-semibold" aria-live="polite">{line.qty}</motion.span>
                      <button className="grid h-8 w-8 place-items-center" onClick={() => setQty(line.key, line.qty + 1)} aria-label="Augmenter la quantité"><PlusIcon size={16} /></button>
                    </div>
                    <span className="text-xs text-forest-soft">{euro(unit)} / unité</span>
                    <button onClick={() => removeLine(line.key)} className="ml-auto text-forest-soft hover:text-forest" aria-label={`Retirer ${name}`}><TrashIcon size={18} /></button>
                  </div>
                )}
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
      {totals.gift && (
        <motion.li initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-4 py-4">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-[2px] bg-butter text-forest"><GiftIcon size={30} /></div>
          <div className="flex-1">
            <p className="font-display text-lg">{totals.gift.name}</p>
            <p className="text-xs text-forest-soft">{totals.gift.description}</p>
            <span className="chip mt-1 bg-butter">Cadeau 1ʳᵉ commande</span>
          </div>
          <p className="font-semibold">Offert</p>
        </motion.li>
      )}
      {cart.length === 0 && null}
    </ul>
  );
}

export function FreeShippingBar() {
  const t = useCartTotals();
  if (t.itemCount === 0) return null;
  const pct = Math.min(100, ((shipping.freeFrom - t.freeShippingRemaining) / shipping.freeFrom) * 100);
  return (
    <div className="rounded-[2px] bg-ivory p-3 text-sm">
      <p className="flex items-center gap-2">
        <TruckIcon size={18} />
        {t.freeShippingRemaining > 0 ? <>Plus que <b>{euro(t.freeShippingRemaining)}</b> pour la livraison offerte</> : <b>Livraison offerte débloquée </b>}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sage-soft">
        <motion.div className="h-full rounded-full bg-forest" initial={false} animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
      </div>
    </div>
  );
}

export function PromoAndRewards() {
  const promoCode = useStore((s) => s.promoCode);
  const setPromo = useStore((s) => s.setPromo);
  const rewardId = useStore((s) => s.rewardId);
  const setReward = useStore((s) => s.setReward);
  const acc = useAccount();
  const t = useCartTotals();
  const [code, setCode] = useState(promoCode ?? "");
  const balance = leavesBalance(acc);
  return (
    <div className="space-y-3">
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setPromo(code); }}>
        <label htmlFor="promo" className="sr-only">Code promo</label>
        <input id="promo" className="input py-2.5" placeholder="Code promo" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
        {promoCode ? (
          <button type="button" className="btn btn-ghost px-4 py-2" onClick={() => { setPromo(undefined); setCode(""); }}>Retirer</button>
        ) : (
          <button className="btn btn-soft px-4 py-2">Appliquer</button>
        )}
      </form>
      {promoCode && (t.codeError ? <p className="text-xs text-[#a14d5f]">{t.codeError}</p> : <p className="text-xs text-forest">Code {promoCode} appliqué ✓</p>)}
      {acc ? (
        <div className="rounded-[2px] bg-sage-soft p-3 text-sm">
          <p className="font-semibold"> {balance} feuilles disponibles</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {loyalty.rewards.map((r) => (
              <button
                key={r.id}
                disabled={balance < r.leaves}
                onClick={() => setReward(rewardId === r.id ? undefined : r.id)}
                className={`chip transition ${rewardId === r.id ? "bg-forest text-ivory" : "bg-ivory"} disabled:opacity-40`}
              >
                {r.leaves}  = -{r.value} €
              </button>
            ))}
          </div>
          {t.rewardError && <p className="mt-1 text-xs text-[#a14d5f]">{t.rewardError}</p>}
        </div>
      ) : (
        <p className="text-xs text-forest-soft"><Link href="/compte/connexion" className="underline">Connecte-toi</Link> pour utiliser tes feuilles  et les cumuler.</p>
      )}
    </div>
  );
}

export function TotalsBlock() {
  const t = useCartTotals();
  const row = (l: string, v: string, strong = false) => (
    <div className={`flex justify-between ${strong ? "text-lg font-semibold" : "text-sm"}`}><span>{l}</span><span>{v}</span></div>
  );
  return (
    <div className="space-y-1.5">
      {row("Sous-total", euro(t.subtotal))}
      {t.bundleDiscount > 0 && row("Remise kits & sets", `-${euro(t.bundleDiscount)}`)}
      {t.codeDiscount > 0 && row("Code de bienvenue", `-${euro(t.codeDiscount)}`)}
      {t.rewardDiscount > 0 && row("Récompense feuilles", `-${euro(t.rewardDiscount)}`)}
      {row("Livraison", t.shipping === 0 ? "Offerte" : euro(t.shipping))}
      <div className="my-2 h-px bg-line" />
      {row("Total TTC", euro(t.total), true)}
      <p className="text-right text-xs text-forest-soft">Tu gagnes <b>{t.leavesEarned} </b> avec cette commande (créditées à l&apos;{loyalty.creditedOn}).</p>
    </div>
  );
}

export function CartSuggestions() {
  const cart = useStore((s) => s.cart);
  const h = useHydrated();
  if (!h || cart.length === 0) return null;
  const inCart = new Set(cart.map((l) => l.productId));
  const first = getProduct(cart[cart.length - 1].productId);
  if (!first) return null;
  const sugg = complementary(first, 6).filter((p) => !inCart.has(p.id)).slice(0, 3);
  if (!sugg.length) return null;
  return (
    <div>
      <p className="eyebrow mb-3 text-forest/60">Complète ta routine</p>
      <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
        {sugg.map((p) => (
          <div key={p.id} className="w-36 shrink-0 rounded-[2px] bg-ivory p-2">
            <Link href={`/produits/${p.slug}`} className="block">
              <div className="relative h-24 rounded-[2px] p-1" style={{ background: p.color.bg }}><Packshot product={p} className="h-full w-full" showTag={false} sizes="140px" /></div>
              <p className="mt-2 truncate text-sm font-semibold">{p.name}</p>
              <p className="text-xs text-forest-soft">{euro(p.variants[0].price)}</p>
            </Link>
            <AddToCartButton productId={p.id} label="Ajouter" openDrawer={false} className="mt-2 w-full px-3 py-2 text-xs" />
          </div>
        ))}
      </div>
    </div>
  );
}
