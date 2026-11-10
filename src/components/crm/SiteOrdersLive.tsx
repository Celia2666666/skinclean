"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/hub/ui";

interface SiteOrder { id: string; date: number; email: string; total: number; status: string; paymentMethod?: string; lines: { name: string; qty: number }[]; customer: string }

const STATUS: Record<string, string> = { test: "Paiement simulé", payee: "Payée", expediee: "Expédiée", livree: "Livrée", remboursee: "Remboursée", "retour-demande": "Retour demandé" };
const PAY: Record<string, string> = { card: "Carte", "apple-pay": "Apple Pay", "google-pay": "Google Pay" };
const eur = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

/** Lit les commandes passées sur la boutique dans ce navigateur (mode démo : stockage local du site, même adresse). */
function readSiteOrders(): SiteOrder[] {
  try {
    const raw = localStorage.getItem("skinclean-v1");
    if (!raw) return [];
    const st = JSON.parse(raw).state ?? {};
    const fromAccounts = Object.values((st.accounts ?? {}) as Record<string, { firstName: string; lastName: string; orders: SiteOrder[] }>)
      .flatMap((a) => (a.orders ?? []).map((o) => ({ ...o, customer: `${a.firstName} ${a.lastName}` })));
    const guests = ((st.guestOrders ?? []) as SiteOrder[]).map((o) => ({ ...o, customer: o.email || "Invité" }));
    // Les commandes fictives d'historique des comptes de démonstration sont exclues (« SC-DEMO-… »)
    return [...fromAccounts, ...guests].filter((o) => !o.id.startsWith("SC-DEMO")).sort((a, b) => b.date - a.date);
  } catch {
    return [];
  }
}

/**
 * Bonus de la consigne : une commande passée dans l'espace de vente apparaît dans le CRM.
 * Se met à jour automatiquement quand une commande est passée dans un autre onglet.
 */
export function SiteOrdersLive({ compact = false }: { compact?: boolean }) {
  const [orders, setOrders] = useState<SiteOrder[] | null>(null);
  useEffect(() => {
    const load = () => setOrders(readSiteOrders());
    load();
    const onStorage = (e: StorageEvent) => { if (e.key === "skinclean-v1") load(); };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", load);
    return () => { window.removeEventListener("storage", onStorage); window.removeEventListener("focus", load); };
  }, []);
  if (orders === null) return null;
  const list = compact ? orders.slice(0, 5) : orders;
  const total = orders.reduce((a, o) => a + o.total, 0);

  return (
    <Card
      title={<span className="flex items-center gap-2"><span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4A6354] opacity-60" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#4A6354]" /></span>Commandes reçues depuis la boutique</span>}
      subtitle={orders.length ? `${orders.length} commande${orders.length > 1 ? "s" : ""} · ${eur(total)} TTC · paiement simulé` : "Passe une commande sur la boutique : elle s'affiche ici aussitôt."}
      action={<Link href="/" className="hub-btn hub-btn-ghost hub-btn-sm">Ouvrir la boutique</Link>}
    >
      {orders.length === 0 ? (
        <p className="text-sm text-forest-soft">Aucune commande passée depuis ce navigateur pour l&apos;instant. Ajoute un soin au panier sur la boutique, puis valide le paiement simulé : la commande, le client et le montant apparaissent ici.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead><tr className="border-b border-line text-xs text-forest-soft"><th className="py-2 pr-3 font-medium">Commande</th><th className="py-2 pr-3 font-medium">Date</th><th className="py-2 pr-3 font-medium">Client</th><th className="py-2 pr-3 font-medium">Articles</th><th className="py-2 pr-3 text-right font-medium">Total TTC</th><th className="py-2 font-medium">Statut</th></tr></thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id} className="border-b border-line/70">
                  <td className="py-2 pr-3 font-medium">{o.id}</td>
                  <td className="py-2 pr-3 text-forest-soft">{new Date(o.date).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</td>
                  <td className="py-2 pr-3">{o.customer}</td>
                  <td className="py-2 pr-3 text-forest-soft">{o.lines.reduce((a, l) => a + l.qty, 0)} · {o.lines.slice(0, 2).map((l) => l.name).join(", ")}{o.lines.length > 2 ? "…" : ""}</td>
                  <td className="py-2 pr-3 text-right font-semibold tabular-nums">{eur(o.total)}</td>
                  <td className="py-2 text-xs">{STATUS[o.status] ?? o.status}{o.paymentMethod ? ` · ${PAY[o.paymentMethod] ?? o.paymentMethod}` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {compact && orders.length > 5 && <Link href="/crm/ventes" className="mt-3 inline-block text-xs underline">Voir les {orders.length} commandes</Link>}
        </div>
      )}
    </Card>
  );
}
