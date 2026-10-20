"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import type { Product, SkinType } from "@/lib/types";
import { ProductCard } from "@/components/product/ProductCard";
import { concernCategories, skinTypeLabels, typeCategories } from "@/data/categories";

type Sort = "pertinence" | "prix-asc" | "prix-desc" | "nom";

/** Grille filtrable : filtres cumulables (type, préoccupation, type de peau, prix) + tri. */
export function CatalogGrid({ products, hideType = false, hideConcern = false }: { products: Product[]; hideType?: boolean; hideConcern?: boolean }) {
  const [types, setTypes] = useState<string[]>([]);
  const [concerns, setConcerns] = useState<string[]>([]);
  const [skin, setSkin] = useState<SkinType | "">("");
  const [maxPrice, setMaxPrice] = useState(40);
  const [sort, setSort] = useState<Sort>("pertinence");
  const [open, setOpen] = useState(false);

  const list = useMemo(() => {
    const r = products.filter((p) => {
      if (types.length && !typeCategories.filter((c) => types.includes(c.slug)).some((c) => c.types.includes(p.type))) return false;
      if (concerns.length && !concernCategories.filter((c) => concerns.includes(c.slug)).some((c) => p.concerns.some((x) => c.concerns.includes(x)))) return false;
      if (skin && !p.skinTypes.includes(skin)) return false;
      if (Math.min(...p.variants.map((v) => v.price)) > maxPrice) return false;
      return true;
    });
    if (sort === "prix-asc") r.sort((a, b) => a.variants[0].price - b.variants[0].price);
    if (sort === "prix-desc") r.sort((a, b) => b.variants[0].price - a.variants[0].price);
    if (sort === "nom") r.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "pertinence") r.sort((a, b) => (a.bestseller ?? 99) - (b.bestseller ?? 99));
    return r;
  }, [products, types, concerns, skin, maxPrice, sort]);

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const active = types.length + concerns.length + (skin ? 1 : 0) + (maxPrice < 40 ? 1 : 0);
  const availableTypes = typeCategories.filter((c) => products.some((p) => c.types.includes(p.type)));
  const availableConcerns = concernCategories.filter((c) => products.some((p) => p.concerns.some((x) => c.concerns.includes(x))));

  return (
    <div>
      <div className="sticky top-[68px] z-20 -mx-4 mb-8 flex items-center gap-2 bg-cream/90 px-4 py-3 backdrop-blur-xl md:mx-0 md:px-0">
        <button onClick={() => setOpen((o) => !o)} className="btn btn-soft px-4 py-2 text-sm" aria-expanded={open}>
          Filtres {active > 0 && <span className="grid h-5 w-5 place-items-center rounded-full bg-forest text-[0.65rem] text-ivory">{active}</span>}
        </button>
        <div className="no-scrollbar flex flex-1 gap-2 overflow-x-auto">
          {(["seche", "grasse", "mixte", "normale", "sensible"] as SkinType[]).map((s) => (
            <button key={s} onClick={() => setSkin(skin === s ? "" : s)} className={`chip shrink-0 px-3 py-2 text-xs transition ${skin === s ? "bg-forest text-ivory" : "bg-ivory hover:bg-sage-soft"}`}>{skinTypeLabels[s]}</button>
          ))}
        </div>
        <label className="sr-only" htmlFor="sort">Trier</label>
        <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="border border-line bg-ivory px-3 py-2 text-sm">
          <option value="pertinence">Best-sellers d&apos;abord</option>
          <option value="prix-asc">Prix croissant</option>
          <option value="prix-desc">Prix décroissant</option>
          <option value="nom">Nom A → Z</option>
        </select>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-8 overflow-hidden">
            <div className="grid gap-6 rounded-[var(--radius-card)] bg-ivory p-6 md:grid-cols-3">
              {!hideType && availableTypes.length > 1 && (
                <fieldset>
                  <legend className="eyebrow mb-3 text-forest/60">Type de produit</legend>
                  <div className="flex flex-wrap gap-2">{availableTypes.map((c) => <Chip key={c.slug} on={types.includes(c.slug)} onClick={() => toggle(types, setTypes, c.slug)}>{c.short}</Chip>)}</div>
                </fieldset>
              )}
              {!hideConcern && (
                <fieldset>
                  <legend className="eyebrow mb-3 text-forest/60">Préoccupation</legend>
                  <div className="flex flex-wrap gap-2">{availableConcerns.map((c) => <Chip key={c.slug} on={concerns.includes(c.slug)} onClick={() => toggle(concerns, setConcerns, c.slug)}>{c.short}</Chip>)}</div>
                </fieldset>
              )}
              <fieldset>
                <legend className="eyebrow mb-3 text-forest/60">Prix maximum : {maxPrice} €</legend>
                <input type="range" min={7} max={40} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-[#24392F]" aria-label="Prix maximum" />
                {active > 0 && <button onClick={() => { setTypes([]); setConcerns([]); setSkin(""); setMaxPrice(40); }} className="mt-4 text-sm underline">Réinitialiser les filtres</button>}
              </fieldset>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mb-6 text-sm text-forest-soft" aria-live="polite">{list.length} soin{list.length > 1 ? "s" : ""}</p>
      <motion.div layout className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {list.map((p, i) => (
            <motion.div key={p.id} layout initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 8) * 0.04 } }} exit={{ opacity: 0, scale: 0.9 }}>
              <ProductCard product={p} priority={i < 4} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      {list.length === 0 && <p className="py-20 text-center text-forest-soft">Aucun soin ne correspond à ces filtres. Essaie d&apos;en retirer un ou fais ton Skin Diag </p>}
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} aria-pressed={on} className={`chip px-3 py-2 text-xs transition ${on ? "bg-forest text-ivory" : "bg-cream hover:bg-sage-soft"}`}>{children}</button>;
}
