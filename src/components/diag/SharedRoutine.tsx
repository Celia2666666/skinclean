"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { RoutinePayload } from "@/lib/routine-link";
import { getProduct, resolveVariant } from "@/lib/catalog";
import { stepLabels } from "@/data/categories";
import { euro, frDate } from "@/lib/format";
import { useAccount, useHydrated, useStore } from "@/lib/store";
import { Packshot } from "@/components/product/Packshot";
import type { RoutineStep } from "@/lib/types";

export function SharedRoutine({ payload }: { payload: RoutinePayload }) {
  const search = useSearchParams();
  const h = useHydrated();
  const addMany = useStore((s) => s.addMany);
  const saveRoutine = useStore((s) => s.saveRoutine);
  const overrides = useStore((s) => s.overrides);
  const acc = useAccount();
  const done = useRef(false);
  const [saved, setSaved] = useState(false);
  const items = payload.i.map(([pid, vid, step, m]) => ({ p: getProduct(pid), vid, step, m })).filter((x) => x.p) as { p: NonNullable<ReturnType<typeof getProduct>>; vid: string; step: string; m: string }[];
  const total = items.reduce((s, x) => s + resolveVariant(x.p, x.vid, h ? overrides : undefined).price, 0);
  const addAll = () => addMany(items.filter((x) => resolveVariant(x.p, x.vid).stock > 0).map((x) => ({ productId: x.p.id, variantId: x.vid })), { id: "routine-link", name: "Ma routine" });

  // ?panier=1 → panier prérempli automatiquement (une seule fois)
  useEffect(() => {
    if (h && search.get("panier") === "1" && !done.current) { done.current = true; addAll(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [h]);

  return (
    <div className="pb-24">
      <section className="relative overflow-hidden bg-sage px-4 py-16 md:px-8">
        <div className="relative mx-auto max-w-[1100px]">
          <p className="eyebrow text-forest/60">Routine enregistrée le {frDate(payload.t)}</p>
          <h1 className="mt-3 font-display text-[clamp(2.6rem,6vw,5rem)] leading-[0.95]">{payload.n ?? "Ta Glow Routine"}</h1>
          {payload.p && <p className="mt-4">{payload.p.st} · {payload.p.g}{payload.p.c.length ? ` · ${payload.p.c.join(", ")}` : ""}</p>}
        </div>
      </section>
      <div className="mx-auto max-w-[1100px] px-4 md:px-8">
        <ol className="mt-10 space-y-3">
          {items.map((x, i) => {
            const v = resolveVariant(x.p, x.vid, h ? overrides : undefined);
            return (
              <motion.li key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.07 } }} className="flex items-center gap-4 rounded-none bg-ivory p-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-forest font-display text-ivory">{i + 1}</span>
                <Link href={`/produits/${x.p.slug}`} className="relative h-20 w-16 shrink-0 rounded-[2px] p-1" style={{ background: x.p.color.bg }}><Packshot product={x.p} className="h-full w-full" showTag={false} sizes="64px" /></Link>
                <div className="min-w-0 flex-1">
                  <p className="eyebrow text-[0.6rem] text-sage-deep">{stepLabels[x.step as RoutineStep] ?? x.step} · {x.m === "ms" ? "Matin & soir" : x.m === "m" ? "Matin" : "Soir"}</p>
                  <p className="font-display text-xl">{x.p.name}</p>
                  <p className="text-xs text-forest-soft">{x.p.kind} · {v.size} {v.stock <= 0 && <b className="text-[#a14d5f]">· Rupture de stock</b>}</p>
                </div>
                <p className="font-semibold">{euro(v.price)}</p>
              </motion.li>
            );
          })}
        </ol>
        <div className="mt-8 flex flex-wrap items-center gap-3 rounded-none bg-ivory p-5">
          <p className="font-display text-2xl">Total : {euro(total)}</p>
          <p className="text-xs text-forest-soft">Prix et disponibilités à jour.</p>
          <div className="ml-auto flex flex-wrap gap-2">
            {acc && <button className="btn btn-ghost" disabled={saved} onClick={() => { saveRoutine({ name: payload.n ?? "Routine reçue par e-mail", items: items.map((x) => ({ step: x.step as RoutineStep, productId: x.p.id, variantId: x.vid, moments: x.m === "ms" ? ["matin", "soir"] : x.m === "m" ? ["matin"] : ["soir"], reason: "", alternatives: [], selected: true, frequency: x.p.frequency })) }); setSaved(true); }}>{saved ? "Enregistrée ✓" : "Enregistrer dans mon compte"}</button>}
            <button className="btn btn-primary" onClick={addAll}>Ajouter ma routine au panier</button>
          </div>
        </div>
        <p className="mt-6 text-center text-sm"><Link href="/skin-diag" className="underline">Refaire mon Skin Diag</Link></p>
      </div>
    </div>
  );
}
