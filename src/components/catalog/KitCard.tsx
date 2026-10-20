"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Kit } from "@/lib/types";
import { kitPricing } from "@/lib/catalog";
import { euro } from "@/lib/format";
import { useHydrated, useStore } from "@/lib/store";
import { Packshot } from "@/components/product/Packshot";

export function useKitPricing(kit: Kit) {
  const kd = useStore((s) => s.kitDiscounts);
  const ov = useStore((s) => s.overrides);
  const h = useHydrated();
  return kitPricing({ ...kit, discountPercent: h ? kd[kit.id] ?? kit.discountPercent : kit.discountPercent }, h ? ov : undefined);
}

export function KitCard({ kit }: { kit: Kit }) {
  const pr = useKitPricing(kit);
  return (
    <motion.div whileHover={{ y: -6 }} className="h-full">
      <Link href={`/kits/${kit.slug}`} className="group block h-full overflow-hidden rounded-[var(--radius-card)] bg-ivory transition-shadow hover:shadow-[var(--shadow-lift)]">
        <div className="relative aspect-[5/4] overflow-hidden" style={{ background: kit.color }}>
          {pr.lines.slice(0, 5).map((l, j, arr) => (
            <div key={l.product.id + j} className="absolute bottom-[8%] h-[60%] transition-transform duration-700 group-hover:-translate-y-3" style={{ width: `${70 / arr.length + 8}%`, left: `${6 + j * (84 / arr.length)}%`, transform: `rotate(${(j - (arr.length - 1) / 2) * 5}deg)`, transitionDelay: `${j * 50}ms` }}>
              <Packshot product={l.product} className="h-full w-full" showTag={false} sizes="15vw" />
            </div>
          ))}
          {pr.saving > 0 && <span className="chip absolute left-4 top-4 bg-forest text-ivory">Économise {euro(pr.saving)}</span>}
        </div>
        <div className="p-5">
          <p className="font-display text-2xl">{kit.name}</p>
          <p className="text-sm text-forest-soft">{kit.tagline} · {pr.lines.length} soins</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-lg font-semibold">{euro(pr.price)}</span>
            <span className="text-sm text-forest-soft line-through">{euro(pr.separate)}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
