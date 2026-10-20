"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useUI } from "@/lib/ui";
import { getProduct } from "@/lib/catalog";
import { Packshot } from "@/components/product/Packshot";
import { CheckIcon } from "@/components/ui/Icons";

export function Toasts() {
  const toasts = useUI((s) => s.toasts);
  const dismiss = useUI((s) => s.dismiss);
  return (
    <div className="pointer-events-none fixed left-1/2 top-24 z-[70] flex w-[min(92vw,380px)] -translate-x-1/2 flex-col gap-2" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => {
          const p = t.productId ? getProduct(t.productId) : undefined;
          return (
            <motion.div
              key={t.id} layout
              initial={{ opacity: 0, y: -20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="pointer-events-auto flex items-center gap-3 rounded-none bg-ivory p-2.5 pr-4 shadow-[var(--shadow-lift)]"
              onClick={() => dismiss(t.id)}
            >
              {p ? (
                <motion.div initial={{ rotate: -20, scale: 0.4 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 14 }} className="relative h-14 w-12 shrink-0 rounded-[2px] p-1" style={{ background: p.color.bg }}>
                  <Packshot product={p} className="h-full w-full" showTag={false} sizes="48px" />
                </motion.div>
              ) : (
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[2px] bg-sage text-xl">{t.icon || <CheckIcon />}</div>
              )}
              <div className="min-w-0">
                <p className="flex items-center gap-1 text-sm font-semibold"><CheckIcon size={16} /> {t.title}</p>
                {t.body && <p className="truncate text-xs text-forest-soft">{t.body}</p>}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
