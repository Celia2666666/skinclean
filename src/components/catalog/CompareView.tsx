"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { getProduct, getProducts, resolveVariant } from "@/lib/catalog";
import { ratingStats, reviewsOf } from "@/lib/reviews";
import { concernLabels, skinTypeLabels } from "@/data/categories";
import { euro } from "@/lib/format";
import { useHydrated, useStore } from "@/lib/store";
import type { Active, Product, SkinType } from "@/lib/types";
import { Packshot } from "@/components/product/Packshot";
import { AddToCartButton } from "@/components/product/AddToCart";
import { LeafRating } from "@/components/reviews/LeafRating";
import { COMPARE_MAX } from "@/components/product/CompareButton";
import { CheckIcon, CloseIcon } from "@/components/ui/Icons";

const activeLabels: Record<Active, string> = {
  aha: "AHA", bha: "BHA (acide salicylique)", pha: "PHA", retinoide: "Rétinoïde", "vitamine-c": "Vitamine C",
  niacinamide: "Niacinamide", "acide-azelaique": "Acide azélaïque", dha: "DHA", enzymes: "Enzymes", bakuchiol: "Bakuchiol",
};
const intensityLabels = ["Ultra doux", "Doux", "Actif", "Très actif"];
const momentLabel = (p: Product) => (p.moments.length === 2 ? "Matin et soir" : p.moments[0] === "matin" ? "Matin" : "Soir");

/** Comparateur côte à côte : jusqu'à 3 soins. */
export function CompareView() {
  const ids = useStore((s) => s.compare);
  const toggle = useStore((s) => s.toggleCompare);
  const clear = useStore((s) => s.clearCompare);
  const overrides = useStore((s) => s.overrides);
  const userReviews = useStore((s) => s.userReviews);
  const h = useHydrated();
  const list = (h ? ids : []).map((id) => getProduct(id)).filter(Boolean) as Product[];
  const free = COMPARE_MAX - list.length;

  const price = (p: Product) => resolveVariant(p, p.variants[0].id, overrides);
  const prices = list.map((p) => price(p).price);
  const cheapest = list.length > 1 ? Math.min(...prices) : undefined;
  const rating = (p: Product) => ratingStats(reviewsOf(p.id, userReviews));

  const rows: { label: string; render: (p: Product) => React.ReactNode }[] = [
    { label: "Prix", render: (p) => <span className="font-display text-2xl">{euro(price(p).price)}{cheapest !== undefined && price(p).price === cheapest && <span className="chip ml-2 bg-sage align-middle text-[0.62rem]">Petit prix</span>}</span> },
    { label: "Format", render: (p) => <>{p.variants.map((v) => v.size).join(" / ")}<span className="block text-xs text-forest-soft">soit {euro((price(p).price / (parseFloat(p.variants[0].size.replace(",", ".")) || 1)) * (/ml/.test(p.variants[0].size) ? 100 : 1))}{/ml/.test(p.variants[0].size) ? " / 100 ml" : " / unité"}</span></> },
    { label: "Note", render: (p) => { const r = rating(p); return r.count ? <span className="flex items-center gap-2"><LeafRating value={r.avg} size={14} /><span className="text-xs text-forest-soft">{r.avg.toFixed(1).replace(".", ",")} · {r.count} avis</span></span> : <span className="text-forest-soft">Pas encore d&apos;avis</span>; } },
    { label: "Ce qu'il cible", render: (p) => <div className="flex flex-wrap gap-1.5">{p.concerns.slice(0, 4).map((c) => <span key={c} className="chip bg-sage-soft">{concernLabels[c]}</span>)}</div> },
    { label: "Actifs", render: (p) => (p.actives.length ? p.actives.map((a) => activeLabels[a]).join(", ") : <span className="text-forest-soft">Sans actif exfoliant ni rétinoïde</span>) },
    { label: "Ingrédients clés", render: (p) => <ul className="space-y-1">{p.keyIngredients.slice(0, 3).map((k) => <li key={k.name}><b className="font-medium">{k.name}</b> <span className="text-forest-soft">· {k.role}</span></li>)}</ul> },
    { label: "Intensité", render: (p) => (
      <span className="flex items-center gap-2" aria-label={`Intensité : ${intensityLabels[p.intensity]}`}>
        <span className="flex gap-1">{[0, 1, 2, 3].map((i) => <span key={i} className={`h-2 w-5 rounded-full ${i <= p.intensity ? "bg-forest" : "bg-line"}`} />)}</span>
        <span className="text-xs">{intensityLabels[p.intensity]}</span>
      </span>
    ) },
    { label: "Quand", render: (p) => <>{momentLabel(p)}<span className="block text-xs text-forest-soft">{p.frequency}</span></> },
    { label: "Texture", render: (p) => p.textureLabel },
  ];
  const skinRows = Object.keys(skinTypeLabels) as SkinType[];

  return (
    <div className="mx-auto max-w-[1300px] px-4 py-12 md:px-8">
      <p className="eyebrow text-forest/60">Comparateur</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-[clamp(2.4rem,6vw,4.5rem)] leading-none">Compare tes soins</h1>
        {list.length > 0 && <button onClick={clear} className="text-sm underline underline-offset-4">Vider le comparateur</button>}
      </div>
      <p className="mt-3 max-w-2xl text-forest-soft">Jusqu&apos;à {COMPARE_MAX} soins côte à côte : actifs, types de peau, prix et utilisation. Ajoute un soin avec le bouton <b className="font-medium text-forest">Comparer</b> sur les fiches et les cartes produits.</p>

      {h && list.length === 0 ? (
        <div className="mt-10 bg-ivory p-8 text-center">
          <p className="font-display text-2xl">Ton comparateur est vide</p>
          <p className="mt-2 text-sm text-forest-soft">Choisis un premier soin ci-dessous pour commencer.</p>
          <div className="mx-auto mt-5 max-w-sm"><AddPicker exclude={[]} onPick={toggle} /></div>
        </div>
      ) : (
        <div className="no-scrollbar -mx-4 mt-10 overflow-x-auto px-4 md:mx-0 md:px-0">
          <table className="w-full min-w-[720px] table-fixed border-collapse text-left text-sm">
            <caption className="sr-only">Comparaison de {list.length} soins</caption>
            <colgroup><col className="w-[170px]" />{Array.from({ length: COMPARE_MAX }, (_, i) => <col key={i} />)}</colgroup>
            <thead>
              <tr>
                <th scope="col" className="sr-only">Critère</th>
                <AnimatePresence initial={false}>
                  {list.map((p) => (
                    <motion.th key={p.id} scope="col" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="px-3 pb-4 align-top font-normal">
                      <div className="relative">
                        <Link href={`/produits/${p.slug}`} className="block aspect-[4/5] p-[10%]" style={{ background: p.color.bg }}>
                          <Packshot product={p} className="h-full w-full" showTag={false} sizes="(max-width: 768px) 40vw, 300px" />
                        </Link>
                        <button onClick={() => toggle(p.id)} aria-label={`Retirer ${p.name} du comparateur`} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-ivory/90 transition hover:bg-forest hover:text-ivory"><CloseIcon size={14} /></button>
                      </div>
                      <Link href={`/produits/${p.slug}`} className="mt-3 block font-display text-xl leading-tight hover:underline">{p.name}</Link>
                      <p className="text-xs text-forest-soft">{p.kind}</p>
                      <AddToCartButton productId={p.id} className="mt-3 w-full py-2.5 text-sm" />
                    </motion.th>
                  ))}
                </AnimatePresence>
                {free > 0 && (
                  <th scope="col" colSpan={free} className="px-3 pb-4 align-top font-normal">
                    <div className="grid aspect-[4/5] max-h-[380px] place-items-center border border-dashed border-line p-5 text-center">
                      <div className="w-full">
                        <p className="font-display text-lg">Ajouter un soin</p>
                        <p className="mb-3 text-xs text-forest-soft">Encore {free} place{free > 1 ? "s" : ""}</p>
                        <AddPicker exclude={ids} onPick={toggle} />
                      </div>
                    </div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-t border-line">
                  <th scope="row" className="py-4 pr-3 align-top text-xs font-medium uppercase tracking-[0.06em] text-forest-soft">{r.label}</th>
                  {list.map((p) => <td key={p.id} className="px-3 py-4 align-top">{r.render(p)}</td>)}
                  {free > 0 && <td colSpan={free} />}
                </tr>
              ))}
              <tr className="border-t border-line">
                <th scope="rowgroup" colSpan={1 + COMPARE_MAX} className="pb-1 pt-6 text-xs font-medium uppercase tracking-[0.06em] text-forest-soft">Convient aux peaux</th>
              </tr>
              {skinRows.map((st) => (
                <tr key={st} className="border-t border-line/60">
                  <th scope="row" className="py-2.5 pr-3 font-normal">{skinTypeLabels[st]}</th>
                  {list.map((p) => (
                    <td key={p.id} className="px-3 py-2.5">
                      {p.skinTypes.includes(st)
                        ? <span className="inline-flex items-center gap-1.5 text-sage-deep"><CheckIcon size={16} /> <span className="sr-only">Oui</span></span>
                        : <span className="text-forest-soft/60" aria-label="Non recommandé">—</span>}
                    </td>
                  ))}
                  {free > 0 && <td colSpan={free} />}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-8 text-xs text-forest-soft">Tu hésites encore ? Le <Link href="/skin-diag" className="underline">Skin Diag</Link> choisit pour toi les soins adaptés à ta peau, en 2 minutes.</p>
    </div>
  );
}

function AddPicker({ exclude, onPick }: { exclude: string[]; onPick: (id: string) => void }) {
  const options = getProducts().filter((p) => !exclude.includes(p.id) && p.type !== "accessoire");
  return (
    <>
      <label htmlFor="compare-add" className="sr-only">Choisir un soin à comparer</label>
      <select id="compare-add" value="" onChange={(e) => e.target.value && onPick(e.target.value)} className="input py-2.5 text-sm">
        <option value="">Choisir un soin…</option>
        {options.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.kind}</option>)}
      </select>
    </>
  );
}
