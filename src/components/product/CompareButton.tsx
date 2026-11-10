"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { getProduct } from "@/lib/catalog";
import { useHydrated, useStore } from "@/lib/store";
import { useUI } from "@/lib/ui";
import { CheckIcon, CloseIcon, CompareIcon } from "@/components/ui/Icons";
import { Packshot } from "./Packshot";

export const COMPARE_MAX = 3;

/** Ajoute / retire un soin du comparateur (3 soins maximum). */
export function CompareButton({ productId, variant = "icon", className = "" }: { productId: string; variant?: "icon" | "text"; className?: string }) {
  const compare = useStore((s) => s.compare);
  const toggle = useStore((s) => s.toggleCompare);
  const toast = useUI((s) => s.toast);
  const h = useHydrated();
  const on = h && compare.includes(productId);

  const click = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!toggle(productId)) toast({ title: `Tu compares déjà ${COMPARE_MAX} soins`, body: "Retires-en un pour en ajouter un autre." });
  };

  if (variant === "text") {
    return (
      <button onClick={click} aria-pressed={on} className={`flex items-center gap-2 text-sm underline-offset-4 hover:underline ${className}`}>
        {on ? <CheckIcon size={16} /> : <CompareIcon size={16} />}
        {on ? "Dans le comparateur" : "Comparer avec d'autres soins"}
      </button>
    );
  }
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={click}
      aria-pressed={on}
      aria-label={on ? "Retirer du comparateur" : "Ajouter au comparateur"}
      title={on ? "Retirer du comparateur" : "Comparer"}
      className={`grid h-10 w-10 place-items-center rounded-full backdrop-blur transition hover:scale-110 ${on ? "bg-forest text-ivory" : "bg-ivory/90 text-forest"} ${className}`}
    >
      {on ? <CheckIcon size={16} /> : <CompareIcon size={18} />}
    </motion.button>
  );
}

/** Barre flottante : soins sélectionnés + accès au comparateur. */
export function CompareBar() {
  const compare = useStore((s) => s.compare);
  const toggle = useStore((s) => s.toggleCompare);
  const clear = useStore((s) => s.clearCompare);
  const path = usePathname();
  const h = useHydrated();
  const show = h && compare.length > 0 && path !== "/comparer" && !path.startsWith("/paiement") && !path.startsWith("/panier") && path !== "/skin-diag" && !path.startsWith("/strategie") && !path.startsWith("/communication") && !path.startsWith("/admin");

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className="fixed bottom-4 left-1/2 z-[55] transition-[bottom] duration-300 in-data-[sticky-buy=on]:bottom-24 flex w-[min(560px,calc(100vw-6.5rem))] -translate-x-1/2 items-center gap-3 border border-line bg-ivory/95 p-2.5 shadow-[var(--shadow-lift)] backdrop-blur max-sm:left-4 max-sm:translate-x-0"
          role="region" aria-label="Comparateur"
        >
          <div className="flex min-w-0 flex-1 gap-2">
            {Array.from({ length: COMPARE_MAX }, (_, i) => {
              const p = compare[i] ? getProduct(compare[i]) : undefined;
              return p ? (
                <div key={p.id} className="group relative h-12 w-11 shrink-0 p-1" style={{ background: p.color.bg }} title={p.name}>
                  <Packshot product={p} className="h-full w-full" showTag={false} sizes="44px" />
                  <button onClick={() => toggle(p.id)} aria-label={`Retirer ${p.name} du comparateur`} className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-forest text-ivory"><CloseIcon size={11} /></button>
                </div>
              ) : <div key={i} className="hidden h-12 w-11 shrink-0 border border-dashed border-line sm:block" aria-hidden />;
            })}
          </div>
          <button onClick={clear} className="hidden text-xs text-forest-soft underline-offset-4 hover:underline sm:block">Vider</button>
          <Link href="/comparer" className={`btn btn-primary shrink-0 px-4 py-2.5 text-sm ${compare.length < 2 ? "opacity-60" : ""}`}>
            Comparer ({compare.length})
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
