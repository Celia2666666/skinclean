"use client";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { getProducts, resolveVariant } from "@/lib/catalog";
import { typeCategories } from "@/data/categories";
import { setDiscount } from "@/data/config";
import { euro } from "@/lib/format";
import { useHydrated, useStore } from "@/lib/store";
import { useUI } from "@/lib/ui";
import { Packshot } from "@/components/product/Packshot";
import { CheckIcon, MinusIcon, PlusIcon, TrashIcon } from "@/components/ui/Icons";

/** Configurateur « Créer mon set » : les produits choisis rejoignent une composition graphique animée. */
export function SetBuilder() {
  const all = getProducts();
  const [filter, setFilter] = useState<string>("tous");
  const [sel, setSel] = useState<{ productId: string; variantId: string; qty: number }[]>([]);
  const addMany = useStore((s) => s.addMany);
  const enabled = useStore((s) => s.setDiscountEnabled);
  const overrides = useStore((s) => s.overrides);
  const toast = useUI((s) => s.toast);
  const h = useHydrated();

  const list = filter === "tous" ? all : all.filter((p) => typeCategories.find((c) => c.slug === filter)?.types.includes(p.type));
  const count = sel.reduce((s, x) => s + x.qty, 0);
  const subtotal = sel.reduce((s, x) => s + resolveVariant(all.find((p) => p.id === x.productId)!, x.variantId, h ? overrides : undefined).price * x.qty, 0);
  const tiers = setDiscount.tiers;
  const pct = h && enabled ? ([...tiers].reverse().find((t) => count >= t.minItems)?.percent ?? 0) : 0;
  const nextTier = h && enabled ? tiers.find((t) => count < t.minItems) : undefined;
  const total = subtotal * (1 - pct / 100);

  const toggle = (id: string) => setSel((s) => (s.some((x) => x.productId === id) ? s.filter((x) => x.productId !== id) : [...s, { productId: id, variantId: "std", qty: 1 }]));
  const qty = (id: string, d: number) => setSel((s) => s.map((x) => (x.productId === id ? { ...x, qty: Math.max(1, Math.min(5, x.qty + d)) } : x)));

  const stage = useMemo(() => sel.flatMap((x) => Array.from({ length: x.qty }, (_, k) => ({ ...x, k }))).slice(0, 12), [sel]);

  return (
    <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-10 md:px-8 lg:grid-cols-[1.25fr_1fr]">
      <div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-3 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
          {[{ slug: "tous", short: "Tous" }, ...typeCategories].map((c) => (
            <button key={c.slug} onClick={() => setFilter(c.slug)} className={`chip shrink-0 px-4 py-2 text-sm transition ${filter === c.slug ? "bg-forest text-ivory" : "bg-ivory hover:bg-sage-soft"}`}>{c.short}</button>
          ))}
        </div>
        <motion.div layout className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {list.map((p) => {
              const on = sel.some((x) => x.productId === p.id);
              return (
                <motion.button key={p.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} whileHover={{ y: -4 }} whileTap={{ scale: 0.96 }} onClick={() => toggle(p.id)} aria-pressed={on} className={`relative rounded-none border-2 p-3 text-left transition ${on ? "border-forest bg-ivory" : "border-transparent bg-ivory/70"}`}>
                  <div className="relative aspect-square rounded-[2px] p-2" style={{ background: p.color.bg }}>
                    <Packshot product={p} className="h-full w-full" showTag={false} sizes="200px" />
                    <span className={`absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full transition ${on ? "bg-forest text-ivory" : "bg-ivory"}`}>{on ? <CheckIcon size={14} /> : <PlusIcon size={14} />}</span>
                  </div>
                  <p className="mt-2 truncate font-semibold">{p.name}</p>
                  <p className="truncate text-xs text-forest-soft">{p.kind}</p>
                  <p className="text-sm">{euro(resolveVariant(p, "std", h ? overrides : undefined).price)}</p>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="lg:sticky lg:top-24 lg:flex lg:max-h-[calc(100vh-11rem)] lg:flex-col lg:self-start">
        <div className="relative aspect-[5/4] shrink-0 overflow-hidden rounded-none lg:aspect-auto lg:h-[min(36vh,320px)] bg-[radial-gradient(120%_100%_at_30%_10%,#FFFEFB,#EFEEEA_60%,#EFEEEA)]">
          <div className="absolute inset-x-6 bottom-6 h-6 rounded-[50%] bg-forest/10 blur-md" />
          <LayoutGroup>
            <div className="absolute inset-0 flex flex-wrap content-end items-end justify-center gap-1 p-8 pb-10">
              <AnimatePresence>
                {stage.map((x, i) => {
                  const p = all.find((y) => y.id === x.productId)!;
                  return (
                    <motion.div key={`${x.productId}-${x.k}`} layout initial={{ y: -260, opacity: 0, rotate: -20 }} animate={{ y: 0, opacity: 1, rotate: ((i % 3) - 1) * 6 }} exit={{ y: 80, opacity: 0, scale: 0.5 }} transition={{ type: "spring", stiffness: 220, damping: 16 }} className="h-[38%] w-[17%] min-w-[54px]">
                      <Packshot product={p} className="h-full w-full" showTag={false} sizes="90px" />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </LayoutGroup>
          {sel.length === 0 && <p className="absolute inset-0 grid place-items-center p-10 text-center font-display text-2xl text-forest/60">Choisis tes soins, ils apparaîtront ici </p>}
          <p className="absolute left-5 top-5 chip bg-ivory/90">Mon set · {count} soin{count > 1 ? "s" : ""}</p>
        </div>

        <div className="mt-4 rounded-none bg-ivory p-5 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
          {sel.length > 0 && <p className="mb-1 text-xs font-medium uppercase tracking-[0.08em] text-forest-soft">Soins choisis ({sel.length})</p>}
          <ul className="divide-y divide-line lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
            <AnimatePresence initial={false}>
              {sel.map((x) => {
                const p = all.find((y) => y.id === x.productId)!;
                const mini = p.variants.find((v) => v.mini);
                return (
                  <motion.li key={x.productId} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{p.name}</p>
                      {mini ? (
                        <select value={x.variantId} onChange={(e) => setSel((s) => s.map((y) => (y.productId === x.productId ? { ...y, variantId: e.target.value } : y)))} className="text-xs text-forest-soft" aria-label={`Format de ${p.name}`}>
                          {p.variants.map((v) => <option key={v.id} value={v.id}>{v.size} — {euro(v.price)}</option>)}
                        </select>
                      ) : <p className="text-xs text-forest-soft">{p.variants[0].size}</p>}
                    </div>
                    <div className="flex items-center border border-line bg-cream">
                      <button className="grid h-8 w-8 place-items-center" onClick={() => qty(x.productId, -1)} aria-label="Moins"><MinusIcon size={14} /></button>
                      <span className="w-5 text-center text-sm">{x.qty}</span>
                      <button className="grid h-8 w-8 place-items-center" onClick={() => qty(x.productId, 1)} aria-label="Plus"><PlusIcon size={14} /></button>
                    </div>
                    <button onClick={() => toggle(x.productId)} aria-label={`Retirer ${p.name}`}><TrashIcon size={18} /></button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
          {pct > 0 && <p className="mt-3 rounded-[2px] bg-sage-soft px-3 py-2 text-sm">Remise set : -{pct} % appliquée</p>}
          {nextTier && <p className="mt-3 text-xs text-forest-soft">Encore {nextTier.minItems - count} soin(s) pour -{nextTier.percent} %</p>}
          <div className="mt-4 flex shrink-0 items-end justify-between border-t border-line pt-4">
            <div>
              <p className="text-xs text-forest-soft">Total du set</p>
              <motion.p key={total} initial={{ scale: 1.15 }} animate={{ scale: 1 }} className="font-display text-3xl">{euro(total)}</motion.p>
              {pct > 0 && <p className="text-xs line-through">{euro(subtotal)}</p>}
            </div>
            <button disabled={!sel.length} onClick={() => { addMany(sel, { id: "set-" + Date.now().toString(36), name: "Mon set", discountPercent: pct || undefined }); toast({ title: "Ton set est dans le panier", icon: "" }); setSel([]); }} className="btn btn-primary">Ajouter le set au panier</button>
          </div>
        </div>
      </div>
    </div>
  );
}
