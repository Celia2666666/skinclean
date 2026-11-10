"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import clsx from "clsx";
import type { Design } from "@/lib/hub/types";
import { BRAND_SWATCHES, FORMATS, TEMPLATE_GALLERY, tplProductBenefits, tplProductHero, tplProductShot, type FormatKey, type TplInput } from "@/lib/hub/templates";
import { DesignPreview } from "@/components/hub/design/DesignPreview";
import { downloadDesign, slug } from "@/components/hub/design/render";
import { getProducts, resolveVariant } from "@/lib/catalog";
import { euro } from "@/lib/format";
import { useHydrated, useStore } from "@/lib/store";
import { VAT_RATE } from "@/data/offer";
import { CustomersAdmin, DiagAdmin, HomeAdmin, KitsAdmin, LoyaltyAdmin, NewsletterAdmin, OrdersAdmin, ProductsAdmin, RolesAdmin } from "@/components/account/Admin";
import { StatusPill, ValidationBar, usePendingContent, useStatuses, type Status } from "@/components/strategy/HubStudio";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ───────── Petit stockage local (brouillons de produits, demandes envoyées) ───────── */

function localList<T>(key: string) {
  const listeners = new Set<() => void>();
  let cache: T[] | null = null;
  const read = () => { if (cache) return cache; try { cache = JSON.parse(localStorage.getItem(key) ?? "[]"); } catch { cache = []; } return cache!; };
  const write = (v: T[]) => { cache = v; try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* stockage indisponible */ } listeners.forEach((l) => l()); };
  const EMPTY: T[] = [];
  const use = () => useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, read, () => EMPTY);
  return { use, add: (x: T) => write([x, ...read()]), remove: (pred: (x: T) => boolean) => write(read().filter((x) => !pred(x))) };
}

interface Draft { id: string; name: string; kind: string; active: string; size: string; price: number; description: string; benefits: string[]; packshot: string; bg: string; createdAt: number }
interface Request { id: string; type: string; subject: string; message: string; priority: string; name: string; email: string; at: number; crm: boolean }
const drafts = localList<Draft>("skinclean-admin-drafts-v1");
const requests = localList<Request>("skinclean-admin-requests-v1");

const TABS = [
  { id: "accueil", label: "Vue d'ensemble" },
  { id: "produits", label: "Produits & stock" },
  { id: "nouveau", label: "Créer un produit" },
  { id: "studio", label: "Studio créatif" },
  { id: "demandes", label: "Demandes à l'équipe" },
  { id: "kits", label: "Kits & promos" },
  { id: "commandes", label: "Commandes" },
  { id: "clients", label: "Clients" },
  { id: "site", label: "Page d'accueil" },
  { id: "fidelite", label: "Fidélité" },
  { id: "diag", label: "Skin Diag" },
  { id: "newsletter", label: "Newsletter" },
  { id: "roles", label: "Rôles" },
] as const;
type Tab = (typeof TABS)[number]["id"];

export function AdminSpace() {
  const [tab, setTab] = useState<Tab>("accueil");
  const hydrated = useHydrated();
  // Change d'onglet ; si on est descendu plus bas, on remonte au début du nouvel onglet
  const go = (t: Tab) => {
    setTab(t);
    const bar = document.getElementById("admin-tabs");
    if (bar && bar.getBoundingClientRect().top <= 0.5 + bar.offsetHeight * 2) bar.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <>
      <section className="relative overflow-hidden bg-forest text-ivory">
        <span aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 animate-[spin_45s_linear_infinite] rounded-full border border-ivory/10" />
        <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 animate-[spin_28s_linear_infinite_reverse] rounded-full border border-dashed border-ivory/15" />
        <div className="relative mx-auto max-w-[1300px] px-4 py-14 md:px-8 md:py-20">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="eyebrow text-sage">Espace admin · gérer la boutique</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }} className="mt-3 font-display text-5xl md:text-7xl">Le back-office SKINCLEAN</motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-4 max-w-2xl text-ivory/75">Les outils de l&apos;équipe qui ne sont ni de la stratégie ni de la communication : prix et stocks, création d&apos;un produit et de ses visuels, Studio créatif, demandes à l&apos;équipe, commandes, kits et promotions.</motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="mt-6 inline-flex max-w-2xl items-start gap-2 rounded-md bg-ivory/10 px-4 py-3 text-xs text-ivory/85">
            <span className="mt-0.5 rounded-sm bg-sage px-1.5 text-[0.6rem] font-semibold uppercase text-forest">Démo</span>
            Ouvert sans compte pour la démonstration. Tes modifications sont enregistrées dans ce navigateur : elles s&apos;appliquent à la boutique sur cet appareil, sans changer le site des autres visiteurs.
          </motion.p>
        </div>
      </section>

      <div id="admin-tabs" className="sticky top-[calc(4rem+var(--demo-h))] z-30 scroll-mt-[calc(4rem+var(--demo-h))] border-b border-line bg-cream/95 backdrop-blur">
        <div className="no-scrollbar mx-auto flex max-w-[1300px] gap-1 overflow-x-auto px-4 py-2 md:px-8">
          {TABS.map((t) => (
            <button key={t.id} type="button" onClick={() => go(t.id)} aria-pressed={tab === t.id} className="relative shrink-0 rounded-full px-4 py-2 text-sm">
              {tab === t.id && <motion.span layoutId="admin-pill" className="absolute inset-0 rounded-full bg-forest" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
              <span className={clsx("relative", tab === t.id ? "text-ivory" : "text-forest")}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto min-h-[60vh] max-w-[1300px] px-4 py-10 md:px-8">
        {!hydrated ? <div className="h-64 animate-pulse bg-sage-soft/60" aria-label="Chargement" /> : (
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            {tab === "accueil" && <Overview go={go} />}
            {tab === "produits" && <ProductsAdmin />}
            {tab === "nouveau" && <ProductCreator />}
            {tab === "studio" && <Studio />}
            {tab === "demandes" && <Requests />}
            {tab === "kits" && <KitsAdmin />}
            {tab === "commandes" && <OrdersAdmin />}
            {tab === "clients" && <CustomersAdmin />}
            {tab === "site" && <HomeAdmin />}
            {tab === "fidelite" && <LoyaltyAdmin />}
            {tab === "diag" && <DiagAdmin />}
            {tab === "newsletter" && <NewsletterAdmin />}
            {tab === "roles" && <RolesAdmin />}
          </motion.div>
        </AnimatePresence>
        )}
      </div>
    </>
  );
}

/* ───────── Vue d'ensemble ───────── */

function Overview({ go }: { go: (t: Tab) => void }) {
  const pending = usePendingContent();
  const ov = useStore((s) => s.overrides);
  const accounts = useStore((s) => s.accounts);
  const guest = useStore((s) => s.guestOrders);
  const myDrafts = drafts.use();
  const myRequests = requests.use();
  const low = getProducts().flatMap((p) => p.variants.map((v) => ({ p, v: resolveVariant(p, v.id, ov) }))).filter((x) => x.v.stock < 15);
  const orders = [...Object.values(accounts).flatMap((a) => a.orders), ...guest].filter((o) => !o.id.startsWith("SC-DEMO"));
  const cards: { n: number; label: string; hint: string; tab?: Tab; href?: string; dark?: boolean }[] = [
    { n: pending.posts + pending.articles + pending.emails, label: "contenus à valider", hint: `${pending.posts} publications · ${pending.articles} articles · ${pending.emails} newsletters`, href: "/communication#bibliotheque", dark: true },
    { n: low.length, label: "formats en stock bas", hint: "moins de 15 unités", tab: "produits" },
    { n: orders.length, label: "commandes passées ici", hint: "depuis ce navigateur", tab: "commandes" },
    { n: myDrafts.length, label: "produits en préparation", hint: "fiches créées dans l'admin", tab: "nouveau" },
    { n: myRequests.length, label: "demandes envoyées", hint: "visibles dans le CRM", tab: "demandes" },
  ];
  const shortcuts: { t: string; d: string; tab: Tab }[] = [
    { t: "Changer un prix ou un stock", d: "Le changement s'affiche aussitôt sur la boutique, le panier et le Skin Diag.", tab: "produits" },
    { t: "Préparer un nouveau produit", d: "Fiche, prix HT et TTC, bénéfices et 3 visuels générés automatiquement.", tab: "nouveau" },
    { t: "Créer un visuel", d: "16 modèles de la charte : post, story, TikTok, épingle, bannière, publicité.", tab: "studio" },
    { t: "Demander quelque chose à l'équipe", d: "Une modification, un visuel, une question : la demande arrive dans le CRM.", tab: "demandes" },
  ];
  return (
    <div className="space-y-10">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c, i) => {
          const inner = (
            <>
              <p className="font-display text-5xl tabular-nums">{c.n}</p>
              <p className="mt-1 text-sm font-medium">{c.label}</p>
              <p className={clsx("mt-1 text-xs", c.dark ? "text-ivory/60" : "text-forest-soft")}>{c.hint}</p>
            </>
          );
          const cls = clsx("block h-full p-5 text-left transition hover:-translate-y-1", c.dark ? "bg-forest text-ivory" : "border border-line bg-ivory");
          return (
            <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, ease: EASE }}>
              {c.href ? <Link href={c.href} className={cls}>{inner}</Link> : <button type="button" onClick={() => go(c.tab!)} className={clsx(cls, "w-full")}>{inner}</button>}
            </motion.div>
          );
        })}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {shortcuts.map((s, i) => (
          <motion.button key={s.t} type="button" onClick={() => go(s.tab)} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.06 }}
            className="group flex items-center justify-between gap-4 border border-line bg-ivory p-6 text-left transition hover:bg-sage-soft">
            <span><span className="block font-display text-2xl">{s.t}</span><span className="mt-1 block text-sm text-forest-soft">{s.d}</span></span>
            <span className="text-2xl transition group-hover:translate-x-1">→</span>
          </motion.button>
        ))}
      </div>
      {low.length > 0 && (
        <div className="border border-line bg-ivory p-6">
          <p className="font-display text-2xl">Stocks à surveiller</p>
          <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">{low.slice(0, 9).map(({ p, v }) => <li key={p.id + v.id} className="flex justify-between gap-3 border-b border-line py-2"><span>{p.name} · {v.size}</span><b className={v.stock === 0 ? "text-[#8A2F2C]" : ""}>{v.stock === 0 ? "rupture" : `${v.stock} restants`}</b></li>)}</ul>
        </div>
      )}
      <p className="text-xs text-forest-soft">Les autres outils internes sont dans le <Link href="/crm" className="underline">CRM</Link> (clients, ventes, service client, stock, pipeline) et dans les espaces <Link href="/strategie" className="underline">Stratégie</Link> et <Link href="/communication" className="underline">Communication</Link> (contenus à valider, SEO, campagnes).</p>
    </div>
  );
}

/* ───────── Créer un produit ───────── */

const KINDS = ["Sérum", "Crème", "Nettoyant", "Démaquillant", "Toner", "Masque", "Exfoliant", "Contour des yeux", "Protection solaire", "Patchs", "Brume"];
const packshots = () => [...new Map(getProducts().filter((p) => p.media.packshot).map((p) => [p.media.packshot!, p.name])).entries()];

function ProductCreator() {
  const list = drafts.use();
  const statuses = useStatuses();
  const shots = useMemo(() => packshots(), []);
  const empty: Omit<Draft, "id" | "createdAt"> = { name: "", kind: "Sérum", active: "", size: "30 ml", price: 24, description: "", benefits: ["", "", ""], packshot: shots[0]?.[0] ?? "", bg: BRAND_SWATCHES[1].hex };
  const [f, setF] = useState(empty);
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => { setF((x) => ({ ...x, [k]: v })); setSaved(false); };
  const name = f.name.trim() || "Nouveau soin";
  const input: TplInput = { headline: name, eyebrow: [f.kind, f.active].filter(Boolean).join(" · "), sub: f.description || "Une formule courte, pensée pour ta routine.", packshot: f.packshot, bg: f.bg, items: f.benefits.filter(Boolean).length ? f.benefits.filter(Boolean) : ["Bénéfice 1", "Bénéfice 2", "Bénéfice 3"] };
  const visuals: { label: string; design: Design }[] = [
    { label: "Annonce Instagram", design: tplProductHero({ ...input, eyebrow: "Nouveauté" }) },
    { label: "Produit et bénéfices", design: tplProductBenefits(input) },
    { label: "Photo fond uni", design: tplProductShot(input) },
  ];
  const ht = f.price / (1 + VAT_RATE);
  const valid = f.name.trim().length > 1 && f.price > 0;
  const save = () => { drafts.add({ ...f, name, id: `draft-${Date.now().toString(36)}`, createdAt: Date.now() }); setSaved(true); setF(empty); };

  return (
    <div className="space-y-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <form className="space-y-4 border border-line bg-ivory p-6" onSubmit={(e) => { e.preventDefault(); if (valid) save(); }}>
          <p className="font-display text-2xl">La fiche produit</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm"><span className="label">Nom du produit</span><input className="input" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex. Pore Reset" maxLength={40} required /></label>
            <label className="block text-sm"><span className="label">Type de soin</span><select className="input" value={f.kind} onChange={(e) => set("kind", e.target.value)}>{KINDS.map((k) => <option key={k}>{k}</option>)}</select></label>
            <label className="block text-sm"><span className="label">Actif clé</span><input className="input" value={f.active} onChange={(e) => set("active", e.target.value)} placeholder="Ex. Acide azélaïque 10 %" maxLength={40} /></label>
            <label className="block text-sm"><span className="label">Contenance</span><input className="input" value={f.size} onChange={(e) => set("size", e.target.value)} maxLength={12} /></label>
            <label className="block text-sm"><span className="label">Prix de vente TTC (€)</span><input className="input" type="number" min={1} step={0.5} value={f.price} onChange={(e) => set("price", Number(e.target.value))} /></label>
            <div className="text-sm"><span className="label">Prix HT</span><p className="input bg-cream">{euro(ht)} <span className="text-xs text-forest-soft">(TVA {Math.round(VAT_RATE * 100)} %)</span></p></div>
          </div>
          <label className="block text-sm"><span className="label">Description courte</span><textarea className="input min-h-20" value={f.description} onChange={(e) => set("description", e.target.value)} maxLength={120} placeholder="Ce que fait le soin, pour qui." /></label>
          <div className="text-sm"><span className="label">Trois bénéfices</span>
            <div className="space-y-2">{f.benefits.map((b, i) => <input key={i} className="input" value={b} maxLength={50} placeholder={`Bénéfice ${i + 1}`} onChange={(e) => set("benefits", f.benefits.map((x, j) => (j === i ? e.target.value : x)))} />)}</div>
          </div>
          <label className="block text-sm"><span className="label">Flacon de départ (en attendant la photo du vrai produit)</span><select className="input" value={f.packshot} onChange={(e) => set("packshot", e.target.value)}>{shots.map(([src, n]) => <option key={src} value={src}>{n}</option>)}</select></label>
          <div className="text-sm"><span className="label">Couleur de fond</span>
            <div className="flex flex-wrap gap-2">{BRAND_SWATCHES.map((s) => <button key={s.hex} type="button" title={s.name} aria-label={s.name} aria-pressed={f.bg === s.hex} onClick={() => set("bg", s.hex)} className={clsx("h-8 w-8 rounded-full border border-line", f.bg === s.hex && "ring-2 ring-forest ring-offset-2")} style={{ background: s.hex }} />)}</div>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button type="submit" disabled={!valid} className="btn btn-primary disabled:opacity-40">Enregistrer la fiche</button>
            <AnimatePresence>{saved && <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="text-sm font-medium text-[#2E5E3E]">✓ Fiche enregistrée, à valider ci-dessous</motion.span>}</AnimatePresence>
          </div>
        </form>

        <div>
          <p className="mb-3 font-display text-2xl">Aperçu en direct</p>
          <motion.div layout className="space-y-4">
            <div className="mx-auto max-w-[16rem] border border-line bg-ivory sm:mx-0">
              <div className="relative aspect-square overflow-hidden" style={{ background: f.bg }}>
                <span className="absolute left-2 top-2 z-10 rounded-full bg-forest px-2 py-0.5 text-[0.65rem] font-medium text-ivory">Nouveau</span>
                {f.packshot && <motion.img key={f.packshot} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} src={f.packshot} alt="" className="absolute inset-0 h-full w-full object-contain p-6" />}
              </div>
              <div className="p-3">
                <p className="text-[0.65rem] uppercase tracking-[0.08em] text-forest-soft">{f.kind}{f.active && ` · ${f.active}`}</p>
                <p className="mt-0.5 font-display text-lg leading-tight">{name}</p>
                <p className="mt-1 line-clamp-2 text-xs text-forest-soft">{f.description || "Description courte du soin."}</p>
                <p className="mt-2 text-sm font-semibold">{euro(f.price)} <span className="text-xs font-normal text-forest-soft">TTC · {f.size}</span></p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {visuals.map((v) => (
                <div key={v.label}>
                  <DesignPreview design={v.design} width={260} rounded />
                  <button type="button" onClick={() => downloadDesign(v.design, `${slug(name)}-${slug(v.label)}`)} className="mt-1 block w-full text-center text-[0.65rem] underline">{v.label} · télécharger</button>
                </div>
              ))}
            </div>
          </motion.div>
          <p className="mt-4 text-xs text-forest-soft">Les trois visuels sont générés avec les modèles de la charte SKINCLEAN et se mettent à jour à chaque frappe. La fiche n&apos;est pas mise en vente : un nouveau produit n&apos;arrive sur la boutique qu&apos;après validation, avec sa vraie photo, sa liste INCI et ses tests de tolérance.</p>
        </div>
      </div>

      <div>
        <p className="mb-4 font-display text-2xl">Produits en préparation ({list.length})</p>
        {list.length === 0 ? <p className="text-sm text-forest-soft">Aucune fiche pour l&apos;instant : remplis le formulaire ci-dessus puis enregistre-la.</p> : (
          <div className="grid gap-4 md:grid-cols-2">
            <AnimatePresence>
              {list.map((d) => (
                <motion.div key={d.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="grid gap-4 border border-line bg-ivory p-5 sm:grid-cols-[7rem_1fr]">
                  <div className="aspect-square" style={{ background: d.bg }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={d.packshot} alt="" className="h-full w-full object-contain p-3" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-display text-xl">{d.name}</p><StatusPill status={(statuses[d.id] ?? "a_valider") as Status} /></div>
                    <p className="text-xs text-forest-soft">{d.kind}{d.active && ` · ${d.active}`} · {d.size} · {euro(d.price)} TTC ({euro(d.price / (1 + VAT_RATE))} HT)</p>
                    {d.description && <p className="mt-2 text-sm">{d.description}</p>}
                    <div className="mt-3"><ValidationBar id={d.id} initial="a_valider" /></div>
                    <button type="button" onClick={() => drafts.remove((x) => x.id === d.id)} className="mt-2 text-xs text-forest-soft underline">Supprimer la fiche</button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────── Studio créatif ───────── */

function Studio() {
  const reduce = useReducedMotion();
  const products = useMemo(() => getProducts().filter((p) => p.media.packshot), []);
  const [tplId, setTplId] = useState(TEMPLATE_GALLERY[0].id);
  const tpl = TEMPLATE_GALLERY.find((t) => t.id === tplId)!;
  const [edits, setEdits] = useState<Record<string, TplInput>>({});
  const input: TplInput = { ...tpl.sample, ...edits[tplId] };
  const edit = (patch: TplInput) => setEdits((e) => ({ ...e, [tplId]: { ...e[tplId], ...patch } }));
  const design = tpl.build(input);
  const [page, setPage] = useState(0);
  const p = Math.min(page, design.pages.length - 1);
  const fields = (["eyebrow", "headline", "sub", "cta"] as const).filter((k) => k in tpl.sample || (k === "eyebrow" && "sub" in tpl.sample));
  const labels: Record<string, string> = { eyebrow: "Surtitre", headline: "Titre", sub: "Texte", cta: "Bouton" };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <p className="font-display text-2xl">Choisis un modèle</p>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {TEMPLATE_GALLERY.map((t, i) => (
            <motion.button key={t.id} type="button" onClick={() => { setTplId(t.id); setPage(0); }} aria-pressed={t.id === tplId} initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className={clsx("group text-left", t.id === tplId && "rounded ring-2 ring-forest ring-offset-2")}>
              <span className="grid aspect-square place-items-center overflow-hidden bg-sage-soft p-1.5"><DesignPreview design={t.build(t.sample)} width={120} className="max-h-full !w-auto max-w-full transition group-hover:scale-105" /></span>
              <span className="mt-1 block text-[0.65rem] leading-tight">{t.name}</span>
            </motion.button>
          ))}
        </div>
        <div className="mt-6 space-y-3 border border-line bg-ivory p-5">
          <p className="font-medium">{tpl.name} <span className="text-xs font-normal text-forest-soft">· {FORMATS[(input.format ?? tpl.format) as FormatKey].label}</span></p>
          {"packshot" in tpl.sample && (
            <label className="block text-sm"><span className="label">Produit</span>
              <select className="input" value={input.packshot} onChange={(e) => edit({ packshot: e.target.value })}>{products.map((pr) => <option key={pr.id} value={pr.media.packshot}>{pr.name}</option>)}</select>
            </label>
          )}
          {fields.map((k) => <label key={k} className="block text-sm"><span className="label">{labels[k]}</span><input className="input" value={input[k] ?? ""} maxLength={90} onChange={(e) => edit({ [k]: e.target.value })} /></label>)}
          {tpl.sample.items && <label className="block text-sm"><span className="label">Éléments (un par ligne)</span><textarea className="input min-h-24" value={(input.items ?? []).join("\n")} onChange={(e) => edit({ items: e.target.value.split("\n") })} /></label>}
          <div className="text-sm"><span className="label">Fond</span>
            <div className="flex flex-wrap gap-2">{BRAND_SWATCHES.map((s) => <button key={s.hex} type="button" title={s.name} aria-label={s.name} onClick={() => edit({ bg: s.hex })} className={clsx("h-7 w-7 rounded-full border border-line", input.bg === s.hex && "ring-2 ring-forest ring-offset-2")} style={{ background: s.hex }} />)}</div>
          </div>
          <button type="button" onClick={() => setEdits((e) => ({ ...e, [tplId]: {} }))} className="text-xs underline">Revenir au modèle d&apos;origine</button>
        </div>
      </div>
      <div className="lg:sticky lg:top-[calc(8rem+var(--demo-h))] lg:self-start">
        <div className="bg-[radial-gradient(closest-side,#D8DFD4,#EFEEEA)] p-6 md:p-10">
          <AnimatePresence mode="wait">
            <motion.div key={tplId + p} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="mx-auto" style={{ maxWidth: design.h > design.w ? 360 : 560 }}>
              <DesignPreview design={design} page={p} width={560} className="shadow-xl" />
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          {design.pages.length > 1 ? (
            <div className="flex items-center gap-2 text-sm">
              <button type="button" onClick={() => setPage(Math.max(0, p - 1))} disabled={p === 0} className="btn btn-ghost !px-3 !py-1.5 text-xs disabled:opacity-30">←</button>
              <span>Page {p + 1} / {design.pages.length}</span>
              <button type="button" onClick={() => setPage(Math.min(design.pages.length - 1, p + 1))} disabled={p === design.pages.length - 1} className="btn btn-ghost !px-3 !py-1.5 text-xs disabled:opacity-30">→</button>
            </div>
          ) : <span />}
          <button type="button" onClick={() => downloadDesign(design, slug(input.headline ?? tpl.name))} className="btn btn-primary">Télécharger en PNG</button>
        </div>
        <p className="mt-3 text-xs text-forest-soft">Les modèles du Studio SKINCLEAN, avec les couleurs, les polices et le logo de la marque. Le visuel est créé dans ton navigateur, en haute définition.</p>
      </div>
    </div>
  );
}

/* ───────── Demandes à l'équipe ───────── */

const REQUEST_TYPES = ["Modifier un produit", "Nouveau visuel", "Publication à programmer", "Question sur une commande", "Problème sur le site", "Autre demande"];

function Requests() {
  const list = requests.use();
  const [f, setF] = useState({ type: REQUEST_TYPES[0], subject: "", message: "", priority: "Normale", name: "", email: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    const body = { name: f.name, email: f.email, subject: `[Admin · ${f.type}] ${f.subject}`, message: `${f.message}\n\nPriorité : ${f.priority}`, origin: "admin" };
    const r = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    if (!r?.ok) { setState("error"); return; }
    requests.add({ ...f, id: `req-${Date.now().toString(36)}`, at: Date.now(), crm: !!j.crm });
    setF((x) => ({ ...x, subject: "", message: "" }));
    setState("sent");
  };
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
      <form onSubmit={send} className="space-y-4 border border-line bg-ivory p-6">
        <p className="font-display text-2xl">Envoyer une demande</p>
        <p className="text-sm text-forest-soft">Pour l&apos;équipe SKINCLEAN : modifier une fiche, demander un visuel, signaler un problème. La demande arrive dans le CRM, rubrique « Messages &amp; contact ».</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm"><span className="label">Type de demande</span><select className="input" value={f.type} onChange={(e) => set("type", e.target.value)}>{REQUEST_TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
          <label className="block text-sm"><span className="label">Priorité</span><select className="input" value={f.priority} onChange={(e) => set("priority", e.target.value)}>{["Basse", "Normale", "Urgente"].map((t) => <option key={t}>{t}</option>)}</select></label>
          <label className="block text-sm"><span className="label">Ton nom</span><input className="input" value={f.name} onChange={(e) => set("name", e.target.value)} required maxLength={60} /></label>
          <label className="block text-sm"><span className="label">Ton e-mail</span><input className="input" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} required placeholder="prenom@exemple.fr" /></label>
        </div>
        <label className="block text-sm"><span className="label">Objet</span><input className="input" value={f.subject} onChange={(e) => set("subject", e.target.value)} required maxLength={90} placeholder="Ex. Passer Clear Skin à 23 €" /></label>
        <label className="block text-sm"><span className="label">Message</span><textarea className="input min-h-32" value={f.message} onChange={(e) => set("message", e.target.value)} required minLength={5} maxLength={2000} /></label>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={state === "sending"} className="btn btn-primary">{state === "sending" ? "Envoi…" : "Envoyer la demande"}</button>
          <AnimatePresence>
            {state === "sent" && <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="text-sm font-medium text-[#2E5E3E]">✓ Demande envoyée</motion.span>}
            {state === "error" && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-[#8A2F2C]">L&apos;envoi n&apos;a pas abouti, réessaie dans un instant.</motion.span>}
          </AnimatePresence>
        </div>
        <p className="text-[0.7rem] text-forest-soft">Démo : utilise une adresse fictive. Aucun e-mail réel n&apos;est envoyé.</p>
      </form>
      <div>
        <div className="flex items-center justify-between gap-3"><p className="font-display text-2xl">Demandes envoyées ({list.length})</p><Link href="/crm/messages" className="text-sm underline">Voir dans le CRM →</Link></div>
        {list.length === 0 ? <p className="mt-3 text-sm text-forest-soft">Aucune demande envoyée depuis ce navigateur.</p> : (
          <ul className="mt-4 space-y-3">
            <AnimatePresence>
              {list.map((r) => (
                <motion.li key={r.id} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="border border-line bg-ivory p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><span className="chip bg-cream">{r.type}</span><span className="text-forest-soft">{new Date(r.at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })} · priorité {r.priority.toLowerCase()}</span></div>
                  <p className="mt-2 font-medium">{r.subject}</p>
                  <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-forest-soft">{r.message}</p>
                  <p className="mt-2 text-xs">{r.crm ? "✓ Reçue dans le CRM (Messages & contact)" : "Enregistrée ; le CRM n'était pas joignable"}</p>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
}
