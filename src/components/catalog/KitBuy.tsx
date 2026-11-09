"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import type { Kit } from "@/lib/types";
import { useStore } from "@/lib/store";
import { useUI } from "@/lib/ui";
import { euro } from "@/lib/format";
import { useKitPricing } from "./KitCard";
import { BagIcon, CheckIcon } from "@/components/ui/Icons";
import { loyalty } from "@/data/config";

export function KitBuy({ kit }: { kit: Kit }) {
  const pr = useKitPricing(kit);
  const kd = useStore((s) => s.kitDiscounts);
  const addMany = useStore((s) => s.addMany);
  const toast = useUI((s) => s.toast);
  const [done, setDone] = useState(false);
  const pct = kd[kit.id] ?? kit.discountPercent;
  const out = pr.lines.some((l) => l.variant.stock <= 0);
  return (
    <div className="rounded-none bg-ivory p-6">
      <div className="flex items-baseline gap-3">
        <span className="font-display text-5xl">{euro(pr.price)}</span>
        <span className="text-lg text-forest-soft line-through">{euro(pr.separate)}</span>
      </div>
      <p className="mt-1 text-sm">Prix des produits séparés : {euro(pr.separate)}</p>
      {pr.saving > 0 && (
        <motion.p initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.3 }} className="mt-3 inline-flex items-center gap-2 bg-sage-soft px-3 py-1.5 text-sm">
          <motion.span animate={{ rotate: [0, -12, 12, 0] }} transition={{ duration: 0.8, delay: 0.9 }}><CheckIcon size={15} /></motion.span>
          Tu économises <b>{euro(pr.saving)}</b> (-{pct} %)
        </motion.p>
      )}
      <p className="mt-3 text-xs text-forest-soft">+{Math.floor(pr.price * loyalty.leavesPerEuro)} feuilles · Remise kit non cumulable avec le code de bienvenue ni les feuilles.</p>
      <motion.button whileTap={{ scale: 0.97 }} disabled={out} onClick={() => { addMany(kit.items.map((i) => ({ productId: i.productId, variantId: i.variantId ?? "std" })), { id: kit.id, name: kit.name, discountPercent: pct }); toast({ title: `${kit.name} ajouté`, icon: "" }); setDone(true); setTimeout(() => setDone(false), 1800); }} className="btn btn-primary btn-shine mt-5 w-full py-4 text-base">
        {done ? <><CheckIcon size={18} /> Ajouté !</> : out ? "Un produit est en rupture" : <><BagIcon size={18} /> Ajouter le kit au panier</>}
      </motion.button>
    </div>
  );
}
