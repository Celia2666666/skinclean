"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { PlusIcon } from "./Icons";

export function Accordion({ items, defaultOpen = -1 }: { items: { title: string; content: React.ReactNode }[]; defaultOpen?: number }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((it, i) => (
        <div key={it.title}>
          <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-4 py-5 text-left font-display text-xl">
            {it.title}
            <motion.span animate={{ rotate: open === i ? 45 : 0 }} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ivory"><PlusIcon size={18} /></motion.span>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                <div className="pb-6 text-[0.95rem] leading-relaxed text-forest/85">{it.content}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
