"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { leavesBalance, leavesEarned12m, useAccount, useStore, type Address, type Order } from "@/lib/store";
import { tierFor } from "@/lib/pricing";
import { getProduct } from "@/lib/catalog";
import { euro, frDate, uid } from "@/lib/format";
import { ProductCard } from "@/components/product/ProductCard";
import { Packshot } from "@/components/product/Packshot";
import { LeafGauge } from "./LeafGauge";
import { stepLabels } from "@/data/categories";
import { useUI } from "@/lib/ui";
import { paymentMethodLabel } from "@/components/checkout/PaymentMethods";

const statusLabel: Record<Order["status"], string> = { test: "Test — non payée", payee: "Payée · en préparation", expediee: "Expédiée", livree: "Livrée", remboursee: "Remboursée", "retour-demande": "Retour demandé" };
const H = ({ children }: { children: React.ReactNode }) => <h1 className="font-display text-4xl md:text-5xl">{children}</h1>;

export function Dashboard() {
  const acc = useAccount()!;
  const diags = useStore((s) => s.diagHistory);
  const { tier, next } = tierFor(leavesEarned12m(acc));
  const welcome = useStore((s) => s.welcomeCodes).filter((c) => c.email === acc.email && !c.used && c.expiresAt > Date.now());
  return (
    <div className="space-y-6">
      <H>Mon espace</H>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex items-center gap-4 rounded-none bg-butter p-5 md:col-span-2">
          <LeafGauge value={leavesBalance(acc)} max={next?.min ?? leavesBalance(acc)} size={150} label="feuilles" />
          <div>
            <p className="text-sm">Palier <b>{tier.name}</b></p>
            {next && <p className="text-xs text-forest-soft">Prochain palier : {next.name}</p>}
            <Link href="/club" className="btn btn-primary mt-3 px-4 py-2 text-sm">Mes récompenses</Link>
          </div>
        </div>
        <div className="rounded-none bg-sky p-5">
          <p className="font-display text-2xl">Dernier diag</p>
          {diags[0] ? <><p className="mt-1 text-sm">{diags[0].skinTypeLabel} · {diags[0].goal}</p><Link href={`/skin-diag/resultats?id=${diags[0].id}`} className="mt-3 inline-block text-sm underline">Voir ma routine</Link></> : <Link href="/skin-diag" className="btn btn-primary mt-3 px-4 py-2 text-sm">Faire mon Skin Diag</Link>}
        </div>
      </div>
      {welcome.length > 0 && <p className="rounded-[2px] bg-blush p-4 text-sm"> Ton code de bienvenue <b>{welcome[0].code}</b> (-{welcome[0].percent} %) est valable jusqu&apos;au {frDate(welcome[0].expiresAt)}.</p>}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { href: "/compte/commandes", t: "Commandes", v: `${acc.orders.length}`, bg: "#FFFEFB" },
          { href: "/compte/routines", t: "Routines sauvegardées", v: `${acc.routines.length}`, bg: "#FFFEFB" },
          { href: "/compte/journal", t: "Skin Journal", v: acc.journal.enabled ? `${acc.journal.entries.length} bilan(s)` : "À activer", bg: "#EFEEEA" },
        ].map((c, i) => (
          <motion.div key={c.href} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.08 } }}>
            <Link href={c.href} className="block rounded-none p-5 transition hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]" style={{ background: c.bg }}>
              <p className="text-sm text-forest-soft">{c.t}</p><p className="font-display text-3xl">{c.v}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function Orders() {
  const acc = useAccount()!;
  const setStatus = useStore((s) => s.setOrderStatus);
  const steps: Order["status"][] = ["payee", "expediee", "livree"];
  return (
    <div className="space-y-6">
      <H>Mes commandes</H>
      {acc.orders.length === 0 && <p className="rounded-none bg-ivory p-8 text-forest-soft">Aucune commande pour le moment. <Link href="/soins-visage" className="underline">Découvrir les soins</Link></p>}
      {acc.orders.map((o) => (
        <div key={o.id} className="rounded-none bg-ivory p-6">
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-display text-2xl">{o.id}</p>
            <span className={`chip ${o.status === "test" ? "bg-butter" : "bg-sage"}`}>{statusLabel[o.status]}</span>
            <span className="ml-auto text-sm text-forest-soft">{frDate(o.date)} · {euro(o.total)}{o.paymentMethod ? ` · ${paymentMethodLabel[o.paymentMethod]}` : ""}</span>
          </div>
          {o.status !== "test" && o.status !== "remboursee" && (
            <div className="mt-5 flex items-center">
              {steps.map((s, i) => {
                const reached = steps.indexOf(o.status as never) >= i || (o.status === "retour-demande" && i <= 2);
                return (
                  <div key={s} className="flex flex-1 items-center last:flex-none">
                    <span className={`grid h-8 w-8 place-items-center rounded-full text-xs ${reached ? "bg-forest text-ivory" : "bg-cream"}`}>{i + 1}</span>
                    <span className="ml-2 text-xs">{statusLabel[s].split(" ·")[0]}</span>
                    {i < steps.length - 1 && <span className={`mx-2 h-0.5 flex-1 ${reached ? "bg-forest" : "bg-line"}`} />}
                  </div>
                );
              })}
            </div>
          )}
          <ul className="mt-4 space-y-1 text-sm">{o.lines.map((l, i) => <li key={i}>{l.qty} × {l.name} ({l.size}) — {euro(l.unit * l.qty)}</li>)}</ul>
          {o.gift && <p className="mt-1 text-sm"> {o.gift}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            {o.status === "livree" && <button onClick={() => setStatus(acc.email, o.id, "retour-demande")} className="btn btn-ghost px-4 py-2 text-sm">Demander un retour</button>}
            {o.status === "retour-demande" && <p className="text-sm text-forest-soft">Retour demandé : tu recevras une étiquette par e-mail. Les feuilles de cette commande seront retirées au remboursement.</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Favorites() {
  const acc = useAccount()!;
  return (
    <div className="space-y-6">
      <H>Mes favoris</H>
      {acc.favorites.length === 0 ? <p className="rounded-none bg-ivory p-8 text-forest-soft">Clique sur le  d&apos;un produit pour le retrouver ici.</p> : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
          {acc.favorites.map((id) => getProduct(id)).filter(Boolean).map((p) => <ProductCard key={p!.id} product={p!} />)}
        </div>
      )}
    </div>
  );
}

export function Routines() {
  const acc = useAccount()!;
  const diags = useStore((s) => s.diagHistory);
  const del = useStore((s) => s.deleteRoutine);
  const addMany = useStore((s) => s.addMany);
  const toast = useUI((s) => s.toast);
  const [links, setLinks] = useState<Record<string, string>>({});
  const share = async (id: string) => {
    const r = acc.routines.find((x) => x.id === id)!;
    const res = await fetch("/api/routine/link", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: r.name, items: r.items.filter((i) => i.selected) }) });
    const d = await res.json();
    if (d.url) { setLinks({ ...links, [id]: d.url }); try { await navigator.clipboard.writeText(d.url); toast({ title: "Lien copié", icon: "" }); } catch {} }
  };
  return (
    <div className="space-y-10">
      <div>
        <H>Mes routines</H>
        <div className="mt-6 space-y-4">
          {acc.routines.length === 0 && <p className="rounded-none bg-ivory p-8 text-forest-soft">Enregistre une routine depuis les résultats de ton <Link href="/skin-diag" className="underline">Skin Diag</Link>.</p>}
          {acc.routines.map((r) => (
            <div key={r.id} className="rounded-none bg-ivory p-6">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display text-2xl">{r.name}</p>
                {r.summary && <span className="chip bg-sky">{r.summary}</span>}
              </div>
              <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto">
                {r.items.filter((i) => i.selected).map((i) => {
                  const p = getProduct(i.productId);
                  return p ? (
                    <Link key={i.productId + i.step} href={`/produits/${p.slug}`} className="w-28 shrink-0 text-center">
                      <div className="relative h-28 rounded-[2px] p-1.5" style={{ background: p.color.bg }}><Packshot product={p} className="h-full w-full" showTag={false} sizes="110px" /></div>
                      <p className="mt-1 text-[0.65rem] uppercase tracking-wider text-forest-soft">{stepLabels[i.step]}</p>
                      <p className="truncate text-sm font-semibold">{p.name}</p>
                    </Link>
                  ) : null;
                })}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="btn btn-primary px-4 py-2 text-sm" onClick={() => addMany(r.items.filter((i) => i.selected).map((i) => ({ productId: i.productId, variantId: i.variantId })), { id: r.id, name: r.name })}>Ajouter au panier</button>
                <button className="btn btn-ghost px-4 py-2 text-sm" onClick={() => share(r.id)}>Copier le lien sécurisé</button>
                <Link href="/compte/journal" className="btn btn-soft px-4 py-2 text-sm">Suivre dans mon Skin Journal</Link>
                <button className="px-3 text-sm underline" onClick={() => del(r.id)}>Supprimer</button>
              </div>
              {links[r.id] && <p className="mt-2 break-all text-xs">{links[r.id]}</p>}
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="font-display text-3xl">Mes diagnostics précédents</h2>
        <ul className="mt-4 divide-y divide-line rounded-none bg-ivory px-6">
          {diags.length === 0 && <li className="py-6 text-forest-soft">Aucun diagnostic.</li>}
          {diags.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-3 py-4 text-sm">
              <span className="text-forest-soft">{frDate(d.createdAt)}</span>
              <span className="flex-1">{d.skinTypeLabel} · {d.goal} · {d.items.length} soins</span>
              <Link href={`/skin-diag/resultats?id=${d.id}`} className="underline">Voir</Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Profile() {
  const acc = useAccount()!;
  const update = useStore((s) => s.updateAccount);
  const accounts = useStore((s) => s.accounts);
  const logout = useStore((s) => s.logout);
  const toast = useUI((s) => s.toast);
  const [info, setInfo] = useState({ firstName: acc.firstName, lastName: acc.lastName, phone: acc.phone ?? "", birthday: acc.birthday ?? "" });
  const [addr, setAddr] = useState<Omit<Address, "id">>({ name: `${acc.firstName} ${acc.lastName}`, line1: "", zip: "", city: "", country: "France" });

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ ...acc, passwordHash: undefined }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "mes-donnees-skinclean.json";
    a.click();
  };
  const deleteAccount = () => {
    if (!confirm("Supprimer définitivement ton compte, tes routines et ton Skin Journal ?")) return;
    const { [acc.email]: _gone, ...rest } = accounts;
    void _gone;
    useStore.setState({ accounts: rest });
    logout();
  };

  return (
    <div className="space-y-8">
      <H>Profil & préférences</H>
      <form className="grid gap-3 rounded-none bg-ivory p-6 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); update(info); toast({ title: "Informations mises à jour" }); }}>
        <p className="font-display text-2xl sm:col-span-2">Informations personnelles</p>
        <div><label className="label" htmlFor="pf">Prénom</label><input id="pf" className="input" value={info.firstName} onChange={(e) => setInfo({ ...info, firstName: e.target.value })} /></div>
        <div><label className="label" htmlFor="pl">Nom</label><input id="pl" className="input" value={info.lastName} onChange={(e) => setInfo({ ...info, lastName: e.target.value })} /></div>
        <div><label className="label" htmlFor="pp">Téléphone</label><input id="pp" className="input" value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} /></div>
        <div><label className="label" htmlFor="pb">Anniversaire (bonus feuilles)</label><input id="pb" type="date" className="input" value={info.birthday} onChange={(e) => setInfo({ ...info, birthday: e.target.value })} /></div>
        <p className="text-sm text-forest-soft sm:col-span-2">E-mail : {acc.email}</p>
        <button className="btn btn-primary sm:col-span-2 sm:justify-self-start">Enregistrer</button>
      </form>

      <div className="rounded-none bg-ivory p-6">
        <p className="font-display text-2xl">Adresses de livraison</p>
        <ul className="mt-3 space-y-2">
          {acc.addresses.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-3 rounded-[2px] bg-cream p-3 text-sm">
              <span className="flex-1">{a.name} — {a.line1}, {a.zip} {a.city}, {a.country}</span>
              {a.isDefault ? <span className="chip bg-sage">Par défaut</span> : <button className="underline" onClick={() => update({ addresses: acc.addresses.map((x) => ({ ...x, isDefault: x.id === a.id })) })}>Définir par défaut</button>}
              <button className="underline" onClick={() => update({ addresses: acc.addresses.filter((x) => x.id !== a.id) })}>Supprimer</button>
            </li>
          ))}
        </ul>
        <form className="mt-4 grid gap-3 sm:grid-cols-4" onSubmit={(e) => { e.preventDefault(); update({ addresses: [...acc.addresses, { ...addr, id: uid("ad_"), isDefault: acc.addresses.length === 0 }] }); setAddr({ ...addr, line1: "", zip: "", city: "" }); }}>
          <input required className="input sm:col-span-2" placeholder="Adresse" aria-label="Adresse" value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} />
          <input required className="input" placeholder="Code postal" aria-label="Code postal" value={addr.zip} onChange={(e) => setAddr({ ...addr, zip: e.target.value })} />
          <input required className="input" placeholder="Ville" aria-label="Ville" value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} />
          <button className="btn btn-soft sm:col-span-4 sm:justify-self-start">Ajouter l&apos;adresse</button>
        </form>
      </div>

      <div className="rounded-none bg-ivory p-6">
        <p className="font-display text-2xl">Préférences newsletter</p>
        <p className="mt-1 text-sm">Statut : {acc.newsletter.status === "confirmed" ? "inscrit·e ✓" : acc.newsletter.status === "pending" ? "en attente de confirmation par e-mail" : "non inscrit·e"}</p>
        <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={acc.newsletter.marketing} onChange={(e) => update({ newsletter: { ...acc.newsletter, marketing: e.target.checked, status: e.target.checked ? acc.newsletter.status : "none" } })} className="accent-[#24392F]" /> Recevoir les nouveautés et offres SKINCLEAN</label>
        {acc.newsletter.status === "none" && <p className="mt-2 text-xs text-forest-soft">Pour t&apos;inscrire et recevoir tes avantages de bienvenue, utilise le formulaire en bas de page (confirmation par e-mail requise).</p>}
      </div>

      <div className="rounded-none bg-blush-soft p-6 text-sm">
        <p className="font-display text-2xl">Mes données (RGPD)</p>
        <p className="mt-1">Tu peux télécharger ou supprimer toutes tes données à tout moment.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn btn-ghost px-4 py-2" onClick={exportData}>Exporter mes données</button>
          <button className="btn px-4 py-2 text-[#a14d5f] underline" onClick={deleteAccount}>Supprimer mon compte</button>
        </div>
      </div>
    </div>
  );
}
