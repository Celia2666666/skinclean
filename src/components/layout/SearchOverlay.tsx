"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useUI } from "@/lib/ui";
import { searchProducts } from "@/lib/catalog";
import { concernCategories } from "@/data/categories";
import { Packshot } from "@/components/product/Packshot";
import { CloseIcon, SearchIcon } from "@/components/ui/Icons";
import { euro } from "@/lib/format";

export function SearchOverlay() {
  const open = useUI((s) => s.searchOpen);
  const setOpen = useUI((s) => s.setSearch);
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const results = useMemo(() => searchProducts(q).slice(0, 8), [q]);

  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen(true); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[65]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label="Recherche">
          <div className="absolute inset-0 bg-forest/30 backdrop-blur-md" onClick={() => setOpen(false)} />
          <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }} className="relative mx-auto mt-4 w-[min(94vw,760px)] rounded-none bg-cream p-4 shadow-2xl md:mt-16 md:p-6">
            <div className="flex items-center gap-3 border-b border-forest bg-ivory px-4">
              <SearchIcon />
              <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Sérum, niacinamide, rougeurs…" className="h-14 flex-1 bg-transparent outline-none" aria-label="Rechercher un produit" />
              <button onClick={() => setOpen(false)} aria-label="Fermer la recherche"><CloseIcon /></button>
            </div>
            {q ? (
              <div className="mt-4 max-h-[60vh] overflow-y-auto">
                {results.length === 0 && <p className="p-4 text-sm text-forest-soft">Aucun résultat pour « {q} ». Essaie un ingrédient ou une préoccupation.</p>}
                <ul className="grid gap-2 sm:grid-cols-2">
                  {results.map((p, i) => (
                    <motion.li key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                      <Link href={`/produits/${p.slug}`} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-[2px] p-2 transition hover:bg-ivory">
                        <div className="relative h-16 w-14 rounded-[2px] p-1" style={{ background: p.color.bg }}><Packshot product={p} className="h-full w-full" showTag={false} sizes="56px" /></div>
                        <div className="min-w-0"><p className="font-semibold">{p.name}</p><p className="truncate text-xs text-forest-soft">{p.kind}</p><p className="text-xs">{euro(p.variants[0].price)}</p></div>
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="mt-5">
                <p className="eyebrow mb-3 text-forest/60">Recherches populaires</p>
                <div className="flex flex-wrap gap-2">
                  {concernCategories.slice(0, 8).map((c) => (
                    <Link key={c.slug} href={`/soins-visage/${c.slug}`} onClick={() => setOpen(false)} className="chip bg-ivory px-3 py-2 text-sm transition hover:bg-sage">{c.label}</Link>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
