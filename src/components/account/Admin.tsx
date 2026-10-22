"use client";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { getKits, getProduct, getProducts, kitPricing, resolveVariant } from "@/lib/catalog";
import { adminRoles, loyalty, setDiscount, welcomeOffer, shipping, firstOrderGift } from "@/data/config";
import { euro, frDate } from "@/lib/format";
import { leavesBalance, useHydrated, useStore, type Order } from "@/lib/store";

const tabs = ["Produits", "Kits & promos", "Commandes", "Clients", "Fidélité", "Accueil", "Diagnostics", "Newsletter", "Rôles"] as const;

/**
 * Back-office de DÉMONSTRATION : les modifications sont enregistrées dans ce navigateur.
 * En production : routes protégées côté serveur (proxy + session + rôles) et écriture en base (Prisma).
 */
export function Admin() {
  const h = useHydrated();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Produits");
  const [entered, setEntered] = useState(false);
  if (!h) return null;
  if (!entered) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="font-display text-5xl">Back-office</h1>
        <p className="mt-4 text-forest-soft">Ce back-office de démonstration enregistre les modifications dans ce navigateur uniquement. Il n&apos;est pas sécurisé : en production, l&apos;accès passe par une authentification serveur avec rôles (voir README).</p>
        <button className="btn btn-primary mt-6" onClick={() => setEntered(true)}>Entrer en mode démo</button>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl">Back-office SKINCLEAN</h1>
        <span className="chip bg-butter">Mode démo — stockage local</span>
      </div>
      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-2">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className="relative shrink-0 px-4 py-2 text-sm font-semibold">
            {tab === t && <motion.span layoutId="admin-tab" className="absolute inset-0 bg-forest" />}
            <span className={`relative ${tab === t ? "text-ivory" : ""}`}>{t}</span>
          </button>
        ))}
      </div>
      <div className="mt-6">
        {tab === "Produits" && <ProductsAdmin />}
        {tab === "Kits & promos" && <KitsAdmin />}
        {tab === "Commandes" && <OrdersAdmin />}
        {tab === "Clients" && <CustomersAdmin />}
        {tab === "Fidélité" && <LoyaltyAdmin />}
        {tab === "Accueil" && <HomeAdmin />}
        {tab === "Diagnostics" && <DiagAdmin />}
        {tab === "Newsletter" && <NewsletterAdmin />}
        {tab === "Rôles" && <RolesAdmin />}
      </div>
    </div>
  );
}

const Box = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <div className={`rounded-none bg-ivory p-6 ${className}`}>{children}</div>;

function ProductsAdmin() {
  const ov = useStore((s) => s.overrides);
  const set = useStore((s) => s.setOverride);
  const [q, setQ] = useState("");
  const list = getProducts().filter((p) => (p.name + p.kind).toLowerCase().includes(q.toLowerCase()));
  return (
    <Box>
      <div className="flex flex-wrap items-center gap-3">
        <input className="input max-w-xs" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher un produit" />
        <p className="text-xs text-forest-soft">Prix et stocks modifiés ici se répercutent partout sur le site (cartes, fiches, panier, diag). Pour ajouter un produit ou un média : <code>src/data/products.ts</code> et <code>public/media/</code> (voir README).</p>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead><tr className="text-left text-forest-soft"><th className="py-2">Produit</th><th>Format</th><th>Prix (€)</th><th>Stock</th><th>Catégories</th></tr></thead>
          <tbody>
            {list.flatMap((p) => p.variants.map((v, i) => {
              const r = resolveVariant(p, v.id, ov);
              return (
                <tr key={p.id + v.id} className="border-t border-line">
                  <td className="py-2">{i === 0 && <><b>{p.name}</b><br /><span className="text-xs text-forest-soft">{p.id}</span></>}</td>
                  <td>{v.size}</td>
                  <td><input type="number" step="0.5" min="0" className="input w-24 py-1.5" value={r.price} onChange={(e) => set(p.id, v.id, { price: Number(e.target.value) })} aria-label={`Prix ${p.name} ${v.size}`} /></td>
                  <td><input type="number" min="0" className={`input w-24 py-1.5 ${r.stock < 15 ? "border-[#7E9A86]" : ""}`} value={r.stock} onChange={(e) => set(p.id, v.id, { stock: Number(e.target.value) })} aria-label={`Stock ${p.name} ${v.size}`} /></td>
                  <td className="text-xs">{i === 0 && `${p.type} · ${p.concerns.slice(0, 3).join(", ")}`}</td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>
    </Box>
  );
}

function KitsAdmin() {
  const kd = useStore((s) => s.kitDiscounts);
  const setKd = useStore((s) => s.setKitDiscount);
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Box>
        <p className="font-display text-2xl">Remises des kits</p>
        <ul className="mt-3 divide-y divide-line">
          {getKits().map((k) => {
            const pct = kd[k.id] ?? k.discountPercent;
            const pr = kitPricing({ ...k, discountPercent: pct });
            return (
              <li key={k.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="flex-1"><b>{k.name}</b> — {euro(pr.price)} <span className="text-forest-soft">(séparés {euro(pr.separate)})</span></span>
                <input type="number" min={0} max={50} className="input w-20 py-1.5" value={pct} onChange={(e) => setKd(k.id, Number(e.target.value))} aria-label={`Remise ${k.name}`} /> %
              </li>
            );
          })}
        </ul>
      </Box>
      <Box>
        <p className="font-display text-2xl">Promotions</p>
        <div className="mt-3 space-y-1 text-sm">
          <p><b>Créer mon set :</b> {setDiscount.tiers.map((t) => `-${t.percent} % dès ${t.minItems} soins`).join(", ")}, {setDiscount.maxItems} soins maximum</p>
          <p><b>Offre newsletter :</b> -{welcomeOffer.newsletterPercent} %, {welcomeOffer.validityDays} jours, kits exclus : {welcomeOffer.excludeKits ? "oui" : "non"}, cumul feuilles : {welcomeOffer.combinableWithLeaves ? "oui" : "non"}</p>
          <p><b>Cadeau 1ʳᵉ commande :</b> {firstOrderGift.enabled ? firstOrderGift.name : "désactivé"}</p>
          <p><b>Livraison :</b> {euro(shipping.standardPrice)}, offerte dès {euro(shipping.freeFrom)}</p>
          <p className="text-xs text-forest-soft">Paramètres modifiables dans <code>src/data/config.ts</code> (ou en base en production).</p>
        </div>
      </Box>
    </div>
  );
}

function OrdersAdmin() {
  const accounts = useStore((s) => s.accounts);
  const guest = useStore((s) => s.guestOrders);
  const setStatus = useStore((s) => s.setOrderStatus);
  const all: (Order & { owner: string })[] = [...Object.values(accounts).flatMap((a) => a.orders.map((o) => ({ ...o, owner: a.email }))), ...guest.map((o) => ({ ...o, owner: "" }))].sort((a, b) => b.date - a.date);
  return (
    <Box>
      <p className="font-display text-2xl">Commandes ({all.length})</p>
      <p className="text-xs text-forest-soft">« Marquer expédiée » crédite les feuilles en attente ; « Rembourser » les annule. Les commandes Stripe réelles sont aussi visibles dans le Dashboard Stripe.</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead><tr className="text-left text-forest-soft"><th className="py-2">Commande</th><th>Date</th><th>Client</th><th>Total</th><th>Statut</th><th>Actions</th></tr></thead>
          <tbody>
            {all.map((o) => (
              <tr key={o.id} className="border-t border-line">
                <td className="py-2 font-semibold">{o.id}</td><td>{frDate(o.date)}</td><td>{o.email}</td><td>{euro(o.total)}</td>
                <td><span className={`chip ${o.status === "test" ? "bg-butter" : "bg-sage-soft"}`}>{o.status}</span></td>
                <td className="space-x-2">
                  {(["expediee", "livree", "remboursee"] as const).map((s) => <button key={s} className="underline" onClick={() => setStatus(o.owner, o.id, s)}>{s === "expediee" ? "Expédiée" : s === "livree" ? "Livrée" : "Rembourser"}</button>)}
                </td>
              </tr>
            ))}
            {all.length === 0 && <tr><td colSpan={6} className="py-6 text-forest-soft">Aucune commande.</td></tr>}
          </tbody>
        </table>
      </div>
    </Box>
  );
}

function CustomersAdmin() {
  const accounts = Object.values(useStore((s) => s.accounts));
  return (
    <Box>
      <p className="font-display text-2xl">Clients ({accounts.length})</p>
      <table className="mt-4 w-full text-sm">
        <thead><tr className="text-left text-forest-soft"><th className="py-2">Client</th><th>Inscription</th><th>Commandes</th><th>Feuilles</th><th>Newsletter</th></tr></thead>
        <tbody>{accounts.map((a) => <tr key={a.id} className="border-t border-line"><td className="py-2">{a.firstName} {a.lastName}<br /><span className="text-xs">{a.email}</span></td><td>{frDate(a.createdAt)}</td><td>{a.orders.length}</td><td>{leavesBalance(a)} </td><td>{a.newsletter.status}</td></tr>)}</tbody>
      </table>
    </Box>
  );
}

function LoyaltyAdmin() {
  return (
    <Box>
      <p className="font-display text-2xl">Règles de fidélité</p>
      <pre className="mt-4 overflow-x-auto rounded-[2px] bg-cream p-4 text-xs">{JSON.stringify(loyalty, null, 2)}</pre>
      <p className="mt-3 text-xs text-forest-soft">Modifiables dans <code>src/data/config.ts</code> → <code>loyalty</code>. Les seuils exacts du programme Yepoda n&apos;étant pas publiés, ces valeurs sont des propositions à valider.</p>
    </Box>
  );
}

function HomeAdmin() {
  const hero = useStore((s) => s.homeHero);
  const set = useStore((s) => s.setHomeHero);
  return (
    <Box className="max-w-2xl space-y-3">
      <p className="font-display text-2xl">Contenu du hero d&apos;accueil</p>
      {(["title", "subtitle", "cta"] as const).map((k) => (
        <div key={k}><label className="label" htmlFor={`h-${k}`}>{{ title: "Titre", subtitle: "Sous-titre", cta: "Bouton" }[k]}</label><input id={`h-${k}`} className="input" value={hero[k]} onChange={(e) => set({ ...hero, [k]: e.target.value })} /></div>
      ))}
      <p className="text-xs text-forest-soft">Vidéos et visuels de l&apos;accueil : <code>src/data/home.ts</code>.</p>
    </Box>
  );
}

function Bars({ title, data }: { title: string; data: [string, number][] }) {
  const max = Math.max(1, ...data.map((d) => d[1]));
  return (
    <Box>
      <p className="font-display text-xl">{title}</p>
      <ul className="mt-3 space-y-2">
        {data.map(([k, v]) => (
          <li key={k} className="grid grid-cols-[130px_1fr_32px] items-center gap-2 text-sm" title={`${k} : ${v}`}>
            <span className="truncate">{k}</span>
            <span className="h-3 rounded-r-[4px] bg-forest" style={{ width: `${(v / max) * 100}%` }} />
            <span className="text-right">{v}</span>
          </li>
        ))}
        {data.length === 0 && <li className="text-sm text-forest-soft">Pas encore de données.</li>}
      </ul>
    </Box>
  );
}

function DiagAdmin() {
  const diags = useStore((s) => s.diagHistory);
  const agg = useMemo(() => {
    const count = (f: (d: (typeof diags)[number]) => string[]) => {
      const m = new Map<string, number>();
      diags.forEach((d) => f(d).forEach((k) => m.set(k, (m.get(k) ?? 0) + 1)));
      return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    };
    return {
      skin: count((d) => [d.skinTypeLabel]),
      goal: count((d) => [d.goal]),
      concerns: count((d) => d.concerns),
      products: count((d) => d.items.map((i) => getProduct(i.productId)?.name ?? i.productId)),
    };
  }, [diags]);
  return (
    <div>
      <p className="mb-4 text-sm text-forest-soft">{diags.length} diagnostic(s) sur cet appareil. En production : agrégats anonymisés calculés en base.</p>
      <div className="grid gap-4 md:grid-cols-2">
        <Bars title="Types de peau" data={agg.skin} />
        <Bars title="Objectifs" data={agg.goal} />
        <Bars title="Préoccupations" data={agg.concerns} />
        <Bars title="Produits les plus recommandés" data={agg.products} />
      </div>
    </div>
  );
}

function NewsletterAdmin() {
  const claimed = useStore((s) => s.newsletterClaimed);
  const codes = useStore((s) => s.welcomeCodes);
  return (
    <Box>
      <p className="font-display text-2xl">Abonnés confirmés ({claimed.length})</p>
      <ul className="mt-3 space-y-1 text-sm">{codes.map((c) => <li key={c.code}>{c.email} — {c.code} — {c.used ? "utilisé" : c.expiresAt < Date.now() ? "expiré" : "actif"}</li>)}</ul>
      <p className="mt-3 text-xs text-forest-soft">Envoi des campagnes : à connecter à Resend Audiences / Broadcasts (voir README).</p>
    </Box>
  );
}

function RolesAdmin() {
  const perms = ["products", "kits", "promotions", "orders", "customers", "content", "loyalty", "diag", "newsletter"];
  return (
    <Box>
      <p className="font-display text-2xl">Rôles & permissions</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead><tr className="text-left text-forest-soft"><th className="py-2">Rôle</th>{perms.map((p) => <th key={p}>{p}</th>)}</tr></thead>
          <tbody>{Object.entries(adminRoles).map(([k, r]) => <tr key={k} className="border-t border-line"><td className="py-2 font-semibold">{r.label}</td>{perms.map((p) => <td key={p}>{(r.can as readonly string[]).includes("*") || (r.can as readonly string[]).includes(p) ? "✓" : "—"}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </Box>
  );
}
