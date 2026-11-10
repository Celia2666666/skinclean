"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { ratingStats, reviewsOf } from "@/lib/reviews";
import { reviewsConfig, loyalty } from "@/data/config";
import { skinTypeLabels } from "@/data/categories";
import { frDate } from "@/lib/format";
import { useAccount, useHydrated, useStore } from "@/lib/store";
import { useUI } from "@/lib/ui";
import type { SkinType } from "@/lib/types";
import { LeafInput, LeafRating } from "./LeafRating";
import { CheckIcon } from "@/components/ui/Icons";

type Sort = "recent" | "best" | "worst" | "helpful";

export function ReviewsSection({ productId, productName, isAccessory = false }: { productId: string; productName: string; isAccessory?: boolean }) {
  const h = useHydrated();
  const userReviews = useStore((s) => s.userReviews);
  const votes = useStore((s) => s.helpfulVotes);
  const vote = useStore((s) => s.voteHelpful);
  const all = useMemo(() => reviewsOf(productId, h ? userReviews : []), [productId, userReviews, h]);
  const stats = ratingStats(all);
  const [rating, setRating] = useState<number | null>(null);
  const [skin, setSkin] = useState<SkinType | "">("");
  const [sort, setSort] = useState<Sort>("recent");
  const [withPhotos, setWithPhotos] = useState(false);
  const [zoom, setZoom] = useState<string>();
  const [shown, setShown] = useState(reviewsConfig.perPage);
  const [writing, setWriting] = useState(false);

  const list = useMemo(() => {
    const l = all.filter((r) => (rating ? r.rating === rating : true) && (skin ? r.skinType === skin : true) && (withPhotos ? !!r.photos?.length : true));
    const k = [...l];
    if (sort === "best") k.sort((a, b) => b.rating - a.rating);
    if (sort === "worst") k.sort((a, b) => a.rating - b.rating);
    if (sort === "helpful") k.sort((a, b) => (b.helpful ?? 0) - (a.helpful ?? 0));
    if (sort === "recent") k.sort((a, b) => Number(!!a.demo) - Number(!!b.demo) || b.date.localeCompare(a.date));
    return k;
  }, [all, rating, skin, sort, withPhotos]);
  const photoCount = all.filter((r) => r.photos?.length).length;

  const hasDemo = all.some((r) => r.demo);

  return (
    <section id="avis" className="mx-auto max-w-[1400px] scroll-mt-28 px-4 pb-24 md:px-8">
      <div className="border-t border-line pt-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display title-caps text-[clamp(1.8rem,3.4vw,2.8rem)]">Avis clients</h2>
          <button onClick={() => setWriting((w) => !w)} className="btn btn-ghost">{writing ? "Fermer" : "Donner mon avis"}</button>
        </div>

        <AnimatePresence>{writing && <ReviewForm productId={productId} productName={productName} isAccessory={isAccessory} onDone={() => setWriting(false)} />}</AnimatePresence>

        {stats.count === 0 ? (
          <p className="mt-6 max-w-xl text-forest-soft">Aucun avis pour l&apos;instant. Seuls les clients ayant commandé ce produit peuvent publier un avis, sans filtre ni sélection.</p>
        ) : (
          <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[320px_1fr]">
            {/* Synthèse */}
            <aside className="lg:sticky lg:top-[calc(7rem+var(--demo-h))] lg:self-start">
              <p className="font-display text-6xl">{stats.avg.toFixed(1).replace(".", ",")}<span className="text-2xl text-forest-soft"> / 5</span></p>
              <LeafRating value={stats.avg} size={24} className="mt-2" />
              <p className="mt-2 text-sm text-forest-soft">{stats.count} avis</p>
              <ul className="mt-6 space-y-2">
                {stats.dist.map(({ n, c }) => (
                  <li key={n}>
                    <button onClick={() => { setRating(rating === n ? null : n); setShown(reviewsConfig.perPage); }} aria-pressed={rating === n} className={`grid w-full grid-cols-[64px_1fr_28px] items-center gap-3 text-sm transition ${rating && rating !== n ? "opacity-40" : ""}`}>
                      <span className="flex items-center gap-1">{n} <LeafRating value={1} size={12} label={false} className="[&>svg:nth-child(n+2)]:hidden" /></span>
                      <span className="h-1.5 bg-line"><motion.span className="block h-full bg-sage-deep" initial={{ width: 0 }} whileInView={{ width: `${stats.count ? (c / stats.count) * 100 : 0}%` }} viewport={{ once: true }} transition={{ duration: 0.8 }} /></span>
                      <span className="text-right text-forest-soft">{c}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {rating && <button onClick={() => setRating(null)} className="mt-3 text-sm underline">Voir toutes les notes</button>}
              {hasDemo && (
                <p className="mt-6 border-l-2 border-sage-deep pl-3 text-xs text-forest-soft">
                  SKINCLEAN est une marque fictive : les avis marqués « Avis de démonstration » sont des exemples, pas de vrais témoignages. Ils sont exclus des données envoyées aux moteurs de recherche.
                </p>
              )}
            </aside>

            {/* Liste */}
            <div>
              <div className="flex flex-wrap items-center gap-2 border-b border-line pb-4">
                {!isAccessory && (
                  <>
                    <label htmlFor={`skin-${productId}`} className="sr-only">Type de peau</label>
                    <select id={`skin-${productId}`} value={skin} onChange={(e) => { setSkin(e.target.value as SkinType | ""); setShown(reviewsConfig.perPage); }} className="border border-line bg-ivory px-3 py-2 text-sm">
                      <option value="">Tous les types de peau</option>
                      {(Object.keys(skinTypeLabels) as SkinType[]).map((s) => <option key={s} value={s}>{skinTypeLabels[s]}</option>)}
                    </select>
                  </>
                )}
                {photoCount > 0 && (
                  <button onClick={() => { setWithPhotos(!withPhotos); setShown(reviewsConfig.perPage); }} aria-pressed={withPhotos} className={`chip px-3 py-2 text-sm transition ${withPhotos ? "bg-forest text-ivory" : "bg-ivory hover:bg-sage-soft"}`}>Avec photos ({photoCount})</button>
                )}
                <label htmlFor={`sort-${productId}`} className="sr-only">Trier</label>
                <select id={`sort-${productId}`} value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="ml-auto border border-line bg-ivory px-3 py-2 text-sm">
                  <option value="recent">Les plus récents</option>
                  <option value="helpful">Les plus utiles</option>
                  <option value="best">Meilleures notes</option>
                  <option value="worst">Notes les plus basses</option>
                </select>
              </div>
              <p className="mt-4 text-sm text-forest-soft" aria-live="polite">{list.length} avis{rating ? ` à ${rating} feuille${rating > 1 ? "s" : ""}` : ""}{skin ? ` · ${skinTypeLabels[skin]}` : ""}</p>
              <ul className="divide-y divide-line">
                <AnimatePresence initial={false}>
                  {list.slice(0, shown).map((r) => {
                    const voted = votes.includes(r.id);
                    return (
                      <motion.li key={r.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid gap-3 py-7 md:grid-cols-[180px_1fr]">
                        <div className="text-sm">
                          <p className="font-medium">{r.author}</p>
                          {r.skinType && <p className="text-forest-soft">{skinTypeLabels[r.skinType]}</p>}
                          {r.verified && <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-sage-deep"><CheckIcon size={13} /> Achat vérifié</p>}
                          {r.demo && <p className="mt-1 inline-block bg-sky px-1.5 py-0.5 text-[0.62rem] uppercase tracking-[0.06em] text-forest-soft">Avis de démonstration</p>}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <LeafRating value={r.rating} size={15} />
                            <span className="text-xs text-forest-soft">{frDate(r.date)}</span>
                          </div>
                          {r.title && <p className="mt-2 font-medium">{r.title}</p>}
                          <p className="mt-1 leading-relaxed text-forest/85">{r.text}</p>
                          {r.photos?.length ? (
                            <div className="mt-3 flex gap-2">
                              {r.photos.map((src) => (
                                <button key={src} onClick={() => setZoom(src)} className="h-20 w-20 overflow-hidden bg-sky" aria-label="Agrandir la photo">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={src} alt={`Photo de ${r.author}`} loading="lazy" className="h-full w-full object-cover transition hover:scale-105" />
                                </button>
                              ))}
                            </div>
                          ) : null}
                          <button onClick={() => vote(r.id)} aria-pressed={voted} className={`mt-3 text-xs underline-offset-4 hover:underline ${voted ? "text-forest" : "text-forest-soft"}`}>
                            {voted ? "Merci !" : "Cet avis t'a été utile ?"} ({(r.helpful ?? 0) + (voted ? 1 : 0)})
                          </button>
                        </div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
              {list.length > shown && <button onClick={() => setShown(shown + reviewsConfig.perPage)} className="btn btn-ghost mt-4 w-full">Voir plus d&apos;avis ({list.length - shown})</button>}
              {list.length === 0 && <p className="py-10 text-forest-soft">Aucun avis ne correspond à ces filtres.</p>}
            </div>
          </div>
        )}
      </div>
      <AnimatePresence>
        {zoom && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setZoom(undefined)} className="fixed inset-0 z-[90] grid place-items-center bg-forest/70 p-6 backdrop-blur-sm" role="dialog" aria-label="Photo de l'avis">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }} src={zoom} alt="Photo de l'avis agrandie" className="max-h-[85vh] max-w-full object-contain" />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function ReviewForm({ productId, productName, isAccessory, onDone }: { productId: string; productName: string; isAccessory: boolean; onDone: () => void }) {
  const acc = useAccount();
  const addReview = useStore((s) => s.addReview);
  const toast = useUI((s) => s.toast);
  const [f, setF] = useState({ rating: 0, title: "", text: "", skinType: "" as SkinType | "", consent: false });
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    const next = [...photos];
    for (const file of Array.from(files)) {
      if (next.length >= MAX_PHOTOS) break;
      if (!file.type.startsWith("image/")) continue;
      try { next.push(await compressImage(file)); } catch { setError("Cette image n'a pas pu être lue."); }
    }
    setPhotos(next);
    setBusy(false);
  };
  const [error, setError] = useState<string>();
  const hasOrdered = !!acc?.orders.some((o) => o.lines.some((l) => l.productId === productId));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.rating) { setError("Choisis une note en feuilles."); return; }
    if (f.text.trim().length < 20) { setError("Ton avis doit faire au moins 20 caractères."); return; }
    const res = addReview({ productId, rating: f.rating, title: f.title.trim() || undefined, text: f.text.trim(), skinType: f.skinType || undefined, photos: photos.length ? photos : undefined });
    if (!res.ok) { setError(res.error); return; }
    toast({ title: "Merci pour ton avis !", body: res.leaves ? `+${res.leaves} feuilles SKINCLEAN Club` : undefined });
    onDone();
  };

  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
      <div className="mt-8 border border-line bg-ivory p-6 md:p-8">
        <p className="font-medium">Ton avis sur {productName}</p>
        {!acc ? (
          <p className="mt-3 text-sm text-forest-soft"><Link href="/compte/connexion" className="underline">Connecte-toi</Link> pour publier un avis. Seuls les clients ayant commandé ce produit peuvent le noter.</p>
        ) : reviewsConfig.requirePurchase && !hasOrdered ? (
          <p className="mt-3 text-sm text-forest-soft">Les avis sont réservés aux clients ayant commandé ce produit, pour garantir qu&apos;ils sont authentiques. Tu pourras le noter après ta commande.</p>
        ) : (
          <form onSubmit={submit} className="mt-5 grid gap-4">
            <LeafInput value={f.rating} onChange={(n) => setF({ ...f, rating: n })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="label" htmlFor="rv-title">Titre (facultatif)</label><input id="rv-title" className="input" maxLength={60} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
              {!isAccessory && (
                <div><label className="label" htmlFor="rv-skin">Ton type de peau</label>
                  <select id="rv-skin" className="input" value={f.skinType} onChange={(e) => setF({ ...f, skinType: e.target.value as SkinType | "" })}>
                    <option value="">Je préfère ne pas le dire</option>
                    {(Object.keys(skinTypeLabels) as SkinType[]).map((s) => <option key={s} value={s}>{skinTypeLabels[s]}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div><label className="label" htmlFor="rv-text">Ton avis</label><textarea id="rv-text" rows={4} className="input" maxLength={1200} value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} placeholder="Texture, ressenti, résultats observés sur ta peau…" /></div>
            <div>
              <p className="label">Photos (facultatif, {MAX_PHOTOS} maximum)</p>
              <div className="flex flex-wrap gap-2">
                {photos.map((src, i) => (
                  <div key={i} className="relative h-20 w-20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Photo ${i + 1} de ton avis`} className="h-full w-full object-cover" />
                    <button type="button" onClick={() => setPhotos(photos.filter((_, k) => k !== i))} aria-label={`Retirer la photo ${i + 1}`} className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-forest text-xs text-ivory">×</button>
                  </div>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <label className="grid h-20 w-20 cursor-pointer place-items-center border border-dashed border-line text-center text-xs text-forest-soft transition hover:bg-cream">
                    {busy ? "…" : <span>+ Ajouter<br />une photo</span>}
                    <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} />
                  </label>
                )}
              </div>
              <p className="mt-1 text-xs text-forest-soft">Texture, flacon, résultat : pas de visage d&apos;une autre personne sans son accord.</p>
            </div>
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" required checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} className="mt-1 accent-[#1F3329]" /><span>Je certifie que cet avis reflète ma propre expérience. Mon prénom et l&apos;initiale de mon nom seront affichés.</span></label>
            {error && <p className="text-sm text-[#a14d5f]" role="alert">{error}</p>}
            <div className="flex flex-wrap items-center gap-4">
              <button className="btn btn-primary">Publier mon avis</button>
              <span className="text-xs text-forest-soft">+{loyalty.reviewBonus} feuilles offertes (1 fois par mois)</span>
            </div>
          </form>
        )}
      </div>
    </motion.div>
  );
}

const MAX_PHOTOS = 3;

/** Réduit une photo (640 px, JPEG) avant de l'enregistrer : avis stockés dans le navigateur en mode démo. */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 640 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image")); };
    img.src = url;
  });
}
