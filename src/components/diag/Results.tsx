"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { complementsFor, type DiagResult, type RoutineItem } from "@/lib/diag";
import { getProduct, resolveVariant } from "@/lib/catalog";
import { stepLabels } from "@/data/categories";
import { euro } from "@/lib/format";
import { useAccount, useHydrated, useStore } from "@/lib/store";
import { useUI } from "@/lib/ui";
import { Packshot } from "@/components/product/Packshot";
import { CheckIcon, MoonIcon, SunIcon, PlusIcon, ArrowIcon } from "@/components/ui/Icons";

export function Results() {
  const search = useSearchParams();
  const h = useHydrated();
  const history = useStore((s) => s.diagHistory);
  const diag = h ? (history.find((d) => d.id === search.get("id")) ?? history[0]) : undefined;
  if (!h) return <div className="min-h-[80vh]" />;
  if (!diag) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-5 text-center">
        <p className="font-display text-4xl">Pas encore de diagnostic</p>
        <p className="mt-3 text-forest-soft">Fais ton Skin Diag pour obtenir ta routine personnalisée.</p>
        <Link href="/skin-diag" className="btn btn-primary mt-6">Faire mon Skin Diag</Link>
      </div>
    );
  }
  return <ResultView diag={diag} />;
}

function ResultView({ diag }: { diag: DiagResult }) {
  const update = useStore((s) => s.updateDiagItems);
  const addMany = useStore((s) => s.addMany);
  const saveRoutine = useStore((s) => s.saveRoutine);
  const overrides = useStore((s) => s.overrides);
  const toast = useUI((s) => s.toast);
  const acc = useAccount();
  const [tab, setTab] = useState<"matin" | "soir" | "semaine">("matin");
  const [replacing, setReplacing] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  const items = diag.items;
  const setItems = (next: RoutineItem[]) => update(diag.id, next);
  const selected = items.filter((i) => i.selected);
  const total = selected.reduce((s, i) => s + resolveVariant(getProduct(i.productId)!, i.variantId, overrides).price, 0);

  const isWeekly = (i: RoutineItem) => ["masque", "exfoliation"].includes(i.step);
  const shown = items.map((it, idx) => ({ it, idx })).filter(({ it }) => (tab === "semaine" ? isWeekly(it) : !isWeekly(it) && it.moments.includes(tab)));
  const complements = useMemo(() => complementsFor(diag).filter((p) => !items.some((i) => i.productId === p.id)), [diag, items]);

  const addAll = () => {
    addMany(selected.map((i) => ({ productId: i.productId, variantId: i.variantId })), { id: diag.id, name: "Ma routine Skin Diag" });
    toast({ title: "Routine ajoutée au panier", body: `${selected.length} produits`, icon: "" });
  };
  const save = () => {
    const r = saveRoutine({ name: `Routine du ${new Date(diag.createdAt).toLocaleDateString("fr-FR")}`, diagId: diag.id, items, summary: `${diag.skinTypeLabel} · ${diag.goal}` });
    if (r) { setSaved(true); toast({ title: "Routine enregistrée", body: "Retrouve-la dans ton compte", icon: "" }); }
  };

  return (
    <div className="pb-32">
      {/* En-tête */}
      <section className="relative overflow-hidden bg-[radial-gradient(120%_90%_at_20%_0%,#EFEEEA,#EFEEEA_50%,#EFEEEA)] px-4 pb-20 pt-14 md:px-8">
        <div className="relative mx-auto max-w-[1200px]">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="eyebrow text-forest/60">Résultats de ton Skin Diag</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} className="mt-3 font-display text-[clamp(2.8rem,7vw,6rem)] leading-[0.92]">
            Your Skin, Your Glow Routine
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-4 text-lg">Voici la routine SKINCLEAN imaginée pour ta peau.</motion.p>
          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              { l: "Type de peau", v: diag.skinTypeLabel },
              { l: "Préoccupations", v: diag.concerns.join(", ") || "—" },
              { l: "Objectif", v: diag.goal },
              { l: "Hydratation recherchée", v: diag.hydration },
              { l: "Sensibilité", v: diag.sensitivity },
            ].map((c, i) => (
              <motion.div key={c.l} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.4 + i * 0.08 }} className="rounded-none bg-ivory/80 p-4 backdrop-blur">
                <p className="eyebrow text-[0.6rem] text-forest/55">{c.l}</p>
                <p className="mt-1 font-semibold first-letter:uppercase">{c.v}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] px-4 md:px-8">
        {diag.notes.length > 0 && (
          <div className="-mt-8 space-y-2">
            {diag.notes.map((n) => <p key={n} className="relative rounded-[2px] bg-butter p-4 text-sm shadow-[var(--shadow-soft)]"> {n}</p>)}
          </div>
        )}

        {/* Onglets matin / soir / semaine */}
        <div className="mt-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-4xl">Ta routine en {selected.length} étapes</h2>
            <p className="text-sm text-forest-soft">Coche, retire ou remplace chaque soin. Le total se met à jour automatiquement.</p>
          </div>
          <div className="flex border border-line bg-ivory" role="tablist">
            {([["matin", "Matin", SunIcon], ["soir", "Soir", MoonIcon], ["semaine", "1-2×/sem.", PlusIcon]] as const).map(([k, l, I]) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className="relative flex items-center gap-1.5 px-4 py-2 text-sm font-semibold">
                {tab === k && <motion.span layoutId="routine-tab" className="absolute inset-0 bg-forest" />}
                <span className={`relative flex items-center gap-1.5 ${tab === k ? "text-ivory" : ""}`}><I size={16} /> {l}</span>
              </button>
            ))}
          </div>
        </div>

        <motion.ol layout className="mt-8 space-y-4">
          <AnimatePresence mode="popLayout">
            {shown.length === 0 && <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-none bg-ivory p-6 text-forest-soft">Aucun soin hebdomadaire dans cette routine — ajoute un masque ou un exfoliant ci-dessous si tu le souhaites.</motion.p>}
            {shown.map(({ it, idx }, n) => {
              const p = getProduct(it.productId)!;
              const v = resolveVariant(p, it.variantId, overrides);
              const mini = p.variants.find((x) => x.mini);
              return (
                <motion.li key={it.productId + it.step} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: n * 0.06 } }} exit={{ opacity: 0, x: -40 }} className={`grid gap-4 rounded-none p-4 transition md:grid-cols-[auto_120px_1fr_auto] md:items-center md:p-5 ${it.selected ? "bg-ivory shadow-[var(--shadow-soft)]" : "bg-ivory/50"}`}>
                  <button onClick={() => setItems(items.map((x, k) => (k === idx ? { ...x, selected: !x.selected } : x)))} aria-pressed={it.selected} aria-label={it.selected ? `Retirer ${p.name} de la sélection` : `Sélectionner ${p.name}`} className={`hidden h-8 w-8 place-items-center rounded-full border-2 transition md:grid ${it.selected ? "border-forest bg-forest text-ivory" : "border-forest/25"}`}>{it.selected && <CheckIcon size={16} />}</button>
                  <Link href={`/produits/${p.slug}`} className={`relative mx-auto aspect-square w-28 rounded-none p-2 transition md:w-full ${it.selected ? "" : "opacity-50 grayscale"}`} style={{ background: p.color.bg }}>
                    <Packshot product={p} className="h-full w-full" showTag={false} sizes="120px" />
                    <span className="absolute -left-2 -top-2 grid h-8 w-8 place-items-center rounded-full bg-forest font-display text-ivory">{n + 1}</span>
                  </Link>
                  <div className="min-w-0">
                    <p className="eyebrow text-[0.62rem] text-sage-deep">{stepLabels[it.step]} {it.optional && "· optionnel"}</p>
                    <p className="font-display text-2xl leading-tight">{p.name}</p>
                    <p className="text-sm text-forest-soft">{p.kind} · {v.size} · {it.frequency}</p>
                    <p className="mt-1 text-sm font-medium">{p.benefits[0]}</p>
                    <p className="mt-2 rounded-[2px] bg-sky-soft px-3 py-2 text-sm"><b>Pourquoi ce soin ?</b> {it.reason}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={() => setItems(items.map((x, k) => (k === idx ? { ...x, selected: !x.selected } : x)))} className="chip bg-cream px-3 py-1.5 md:hidden">{it.selected ? "Retirer" : "Ajouter"}</button>
                      {it.alternatives.length > 0 && <button onClick={() => setReplacing(replacing === idx ? null : idx)} className="chip bg-cream px-3 py-1.5 hover:bg-sage-soft">Remplacer</button>}
                      {mini && <button onClick={() => setItems(items.map((x, k) => (k === idx ? { ...x, variantId: x.variantId === mini.id ? p.variants[0].id : mini.id } : x)))} className={`chip px-3 py-1.5 ${it.variantId === mini.id ? "bg-forest text-ivory" : "bg-cream hover:bg-sage-soft"}`}>Petit format {mini.size}</button>}
                      <button onClick={() => setItems(items.filter((_, k) => k !== idx))} className="chip bg-cream px-3 py-1.5 hover:bg-blush">Supprimer</button>
                    </div>
                    <AnimatePresence>
                      {replacing === idx && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="mt-3 grid gap-2 sm:grid-cols-3">
                            {it.alternatives.map((id) => {
                              const a = getProduct(id)!;
                              return (
                                <button key={id} onClick={() => { setItems(items.map((x, k) => (k === idx ? { ...x, productId: a.id, variantId: a.variants[0].id, moments: a.moments, frequency: a.frequency, alternatives: [x.productId, ...x.alternatives.filter((y) => y !== a.id)], reason: `Alternative choisie : ${a.benefits[0].toLowerCase()}.` } : x))); setReplacing(null); }} className="flex items-center gap-2 rounded-[2px] bg-cream p-2 text-left text-sm transition hover:bg-sage-soft">
                                  <span className="relative h-12 w-10 shrink-0 rounded-[2px] p-0.5" style={{ background: a.color.bg }}><Packshot product={a} className="h-full w-full" showTag={false} sizes="40px" /></span>
                                  <span><b className="block leading-tight">{a.name}</b><span className="text-xs">{euro(a.variants[0].price)}</span></span>
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <p className="text-right font-display text-2xl">{euro(v.price)}</p>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </motion.ol>

        {complements.length > 0 && (
          <section className="mt-14">
            <h3 className="font-display text-3xl">Ajouter un soin complémentaire</h3>
            <div className="no-scrollbar mt-5 flex gap-3 overflow-x-auto pb-2">
              {complements.map((p) => (
                <button key={p.id} onClick={() => setItems([...items, { step: p.step, productId: p.id, variantId: p.variants[0].id, moments: p.moments, reason: `Soin complémentaire ajouté par toi : ${p.benefits[0].toLowerCase()}.`, alternatives: [], selected: true, optional: true, frequency: p.frequency }])} className="group flex w-60 shrink-0 items-center gap-3 rounded-none bg-ivory p-3 text-left transition hover:shadow-[var(--shadow-soft)]">
                  <span className="relative h-16 w-14 shrink-0 rounded-[2px] p-1" style={{ background: p.color.bg }}><Packshot product={p} className="h-full w-full" showTag={false} sizes="56px" /></span>
                  <span className="min-w-0 flex-1"><b className="block truncate">{p.name}</b><span className="block truncate text-xs text-forest-soft">{p.kind}</span><span className="text-xs">{euro(p.variants[0].price)}</span></span>
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-sage transition group-hover:rotate-90"><PlusIcon size={16} /></span>
                </button>
              ))}
            </div>
          </section>
        )}

        <EmailRoutine diag={diag} items={selected} />

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-none bg-blush-soft p-6">
            <p className="font-display text-2xl">Suis l&apos;évolution de ta peau </p>
            <p className="mt-2 text-sm text-forest-soft">Active ton Skin Journal : photos et observations à J0, J7, J14 et J30, en privé.</p>
            <Link href="/compte/journal" className="btn btn-primary mt-4">Activer mon Skin Journal</Link>
          </div>
          <div className="rounded-none bg-sage-soft p-6">
            <p className="font-display text-2xl">Pas tout à fait ça ?</p>
            <p className="mt-2 text-sm text-forest-soft">Tu peux refaire le diagnostic à tout moment, tes anciens résultats restent dans ton historique.</p>
            <Link href="/skin-diag" className="btn btn-ghost mt-4">Refaire le diagnostic</Link>
          </div>
        </section>
        <p className="mt-8 text-center text-xs text-forest-soft">Le Skin Diag est un outil de conseil cosmétique, pas un diagnostic médical. En cas de doute, demande conseil à un·e professionnel·le de santé.</p>
      </div>

      {/* Barre de total collante */}
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} transition={{ delay: 0.8, type: "spring", damping: 24 }} className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ivory/95 px-4 py-3 backdrop-blur-xl md:px-8">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-3 pr-16 md:pr-20">
          <div>
            <p className="text-xs text-forest-soft">{selected.length} soins sélectionnés</p>
            <motion.p key={total} initial={{ scale: 1.15 }} animate={{ scale: 1 }} className="font-display text-2xl">{euro(total)}</motion.p>
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            {acc ? (
              <button onClick={save} disabled={saved} className="btn btn-ghost px-4 py-2.5 text-sm">{saved ? "Enregistrée ✓" : "Enregistrer dans mon compte"}</button>
            ) : (
              <Link href="/compte/connexion?retour=/skin-diag/resultats" className="btn btn-ghost px-4 py-2.5 text-sm">Se connecter pour enregistrer</Link>
            )}
            <button onClick={addAll} disabled={!selected.length} className="btn btn-primary px-5 py-2.5 text-sm">Ajouter tout au panier <ArrowIcon size={16} /></button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function EmailRoutine({ diag, items }: { diag: DiagResult; items: RoutineItem[] }) {
  const acc = useAccount();
  const [email, setEmail] = useState(acc?.email ?? "");
  const [firstName, setFirstName] = useState(acc?.firstName ?? "");
  const [state, setState] = useState<"idle" | "loading" | "done" | "skipped" | "error">("idle");
  const [res, setRes] = useState<{ mode?: string; url?: string; previewUrl?: string; error?: string }>({});

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    const r = await fetch("/api/routine/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, firstName, items, profile: { skinType: diag.skinTypeLabel, concerns: diag.concerns, goal: diag.goal, hydration: diag.hydration } }),
    });
    const d = await r.json().catch(() => ({}));
    setRes(d);
    setState(r.ok ? "done" : "error");
  };

  if (state === "skipped") return null;
  return (
    <section className="mt-14 overflow-hidden rounded-none bg-sky p-6 md:p-10">
      <AnimatePresence mode="wait">
        {state === "done" ? (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <p className="font-display text-3xl">{res.mode === "sent" ? "C'est envoyé ! " : "Ta routine est prête "}</p>
            {res.mode === "sent" ? <p className="mt-2">Vérifie ta boîte mail : tu y trouveras ta routine et un lien sécurisé pour la retrouver (et préremplir ton panier) quand tu veux.</p> : (
              <p className="mt-2 text-sm"><b>Mode démo</b> : aucun service d&apos;e-mail n&apos;est configuré, rien n&apos;a été envoyé. <a href={res.previewUrl} target="_blank" className="underline">Prévisualiser l&apos;e-mail</a></p>
            )}
            {res.url && <p className="mt-3 break-all text-sm">Ton lien permanent : <Link href={new URL(res.url).pathname} className="underline">{res.url}</Link></p>}
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={send} className="grid gap-4 md:grid-cols-[1fr_1.4fr] md:items-end">
            <div>
              <p className="font-display text-3xl">Tu veux garder ta routine à portée de main ?</p>
              <p className="mt-2 text-sm text-forest-soft">Reçois-la par e-mail avec un lien sécurisé pour la retrouver plus tard. Ceci ne t&apos;inscrit pas à la newsletter.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[0.7fr_1fr_auto]">
              <input className="input" placeholder="Prénom (facultatif)" value={firstName} onChange={(e) => setFirstName(e.target.value)} aria-label="Prénom (facultatif)" />
              <input className="input" type="email" required placeholder="ton@email.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Adresse e-mail" />
              <button className="btn btn-primary" disabled={state === "loading" || !items.length}>{state === "loading" ? "Envoi…" : "Recevoir ma routine"}</button>
              <button type="button" onClick={() => setState("skipped")} className="text-left text-sm underline sm:col-span-3">Passer cette étape</button>
              {state === "error" && <p className="text-sm text-[#a14d5f] sm:col-span-3">{res.error ?? "Une erreur est survenue."}</p>}
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </section>
  );
}
