"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { getProduct } from "@/lib/catalog";
import { refillLabel, refillsFor } from "@/lib/replenish";
import { frDate } from "@/lib/format";
import { useAccount, useHydrated, useStore } from "@/lib/store";
import { useUI } from "@/lib/ui";
import { Packshot } from "@/components/product/Packshot";
import { RefillIcon } from "@/components/ui/Icons";

/** Tableau de bord : soins bientôt vides, calculés à partir de la date d'achat. */
export function RefillReminders() {
  const acc = useAccount();
  const h = useHydrated();
  const addToCart = useStore((s) => s.addToCart);
  const setDrawer = useStore((s) => s.setDrawer);
  const toast = useUI((s) => s.toast);
  const items = h ? refillsFor(acc) : [];
  if (!items.length) return null;

  const reorderAll = () => {
    items.forEach((x) => addToCart(x.productId, x.variantId, 1));
    setDrawer(true);
  };

  return (
    <section className="rounded-none bg-ivory p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sage-soft"><RefillIcon size={20} /></span>
          <div>
            <p className="font-display text-2xl">{items.length > 1 ? "Tes soins sont bientôt vides" : `${items[0].name} sera bientôt vide`}</p>
            <p className="text-sm text-forest-soft">On te les renvoie ? Estimation d&apos;après la date de ta dernière commande et une utilisation selon le mode d&apos;emploi.</p>
          </div>
        </div>
        {items.length > 1 && <button onClick={reorderAll} className="btn btn-primary px-4 py-2 text-sm">Tout ajouter au panier</button>}
      </div>
      <ul className="mt-4 divide-y divide-line">
        {items.map((x) => {
          const p = getProduct(x.productId)!;
          return (
            <li key={x.productId} className="flex items-center gap-4 py-3">
              <Link href={`/produits/${p.slug}`} className="h-16 w-14 shrink-0 p-1" style={{ background: p.color.bg }}>
                <Packshot product={p} className="h-full w-full" showTag={false} sizes="56px" />
              </Link>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{p.name} <span className="text-sm font-normal text-forest-soft">· commandé le {frDate(x.boughtAt)}</span></p>
                <div className="mt-1.5 h-1.5 max-w-xs overflow-hidden rounded-full bg-sage-soft">
                  <motion.div className="h-full rounded-full bg-forest" initial={{ width: 0 }} animate={{ width: `${Math.round(x.used * 100)}%` }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} />
                </div>
                <p className="mt-1 text-xs text-forest-soft">{refillLabel(x.daysLeft)}</p>
              </div>
              <button
                onClick={() => { addToCart(x.productId, x.variantId, 1); toast({ title: `${p.name} ajouté au panier` }); }}
                className="btn btn-soft shrink-0 px-4 py-2 text-sm"
              >
                Le racheter
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Fiche produit : rappel discret si ce soin a été acheté et arrive en fin de flacon. */
export function RefillNote({ productId }: { productId: string }) {
  const acc = useAccount();
  const h = useHydrated();
  const item = h ? refillsFor(acc).find((x) => x.productId === productId) : undefined;
  if (!item) return null;
  return (
    <p className="flex items-center gap-2 rounded-[2px] border border-line bg-ivory px-4 py-3 text-sm">
      <RefillIcon size={18} />
      <span>Tu l&apos;as commandé le {frDate(item.boughtAt)} : {refillLabel(item.daysLeft).toLowerCase()}.</span>
    </p>
  );
}
