"use client";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { Card } from "@/components/hub/ui";
import type { Order } from "@/lib/store";
import { OrderEmailPreview } from "@/components/checkout/OrderEmailPreview";

type Row = { order: Order; firstName?: string };

/** Commandes de la boutique enregistrées dans ce navigateur (hors historiques fictifs des comptes de démo). */
function readOrders(): Row[] {
  try {
    const st = JSON.parse(localStorage.getItem("skinclean-v1") ?? "{}").state ?? {};
    const fromAccounts = Object.values((st.accounts ?? {}) as Record<string, { firstName: string; orders: Order[] }>).flatMap((a) => (a.orders ?? []).map((order) => ({ order, firstName: a.firstName })));
    const guests = ((st.guestOrders ?? []) as Order[]).map((order) => ({ order, firstName: order.address?.name?.split(" ")[0] }));
    return [...fromAccounts, ...guests].filter((r) => !r.order.id.startsWith("SC-DEMO")).sort((a, b) => b.order.date - a.order.date);
  } catch {
    return [];
  }
}

/** Bonus : l'e-mail de confirmation de chaque commande passée sur la boutique, dans la boîte mail de démo. */
export function SiteOrderMails() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    const load = () => setRows(readOrders());
    load();
    const onStorage = (e: StorageEvent) => { if (e.key === "skinclean-v1") load(); };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", load);
    return () => { window.removeEventListener("storage", onStorage); window.removeEventListener("focus", load); };
  }, []);
  if (rows === null) return null;
  const current = rows.find((r) => r.order.id === id) ?? rows[0];
  return (
    <Card className="mb-5" title="Confirmations des commandes de la boutique" subtitle={rows.length ? `${rows.length} commande${rows.length > 1 ? "s" : ""} passée${rows.length > 1 ? "s" : ""} depuis ce navigateur · e-mail simulé, aucun envoi réel` : "Passe une commande sur la boutique : son e-mail de confirmation s'affiche ici aussitôt."}>
      {!rows.length ? (
        <p className="text-sm text-forest-soft">Aucune commande depuis ce navigateur pour l&apos;instant. Ajoute un soin au panier, valide le paiement simulé, puis reviens ici : l&apos;e-mail de confirmation envoyé au client apparaît avec son récapitulatif.</p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
          <ul className="max-h-[70vh] overflow-y-auto rounded-md border border-line">
            {rows.map(({ order: o }) => (
              <li key={o.id}>
                <button type="button" onClick={() => setId(o.id)} className={clsx("block w-full border-b border-line px-4 py-3 text-left text-sm hover:bg-[#FAF9F6]", current?.order.id === o.id && "bg-sage-soft")}>
                  <p className="flex justify-between gap-2 text-xs text-forest-soft"><span className="truncate">À : {o.email || "client invité"}</span><span className="shrink-0">{new Date(o.date).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</span></p>
                  <p className="truncate font-semibold">Ta commande {o.id} est confirmée</p>
                  <p className="text-xs text-forest-soft">{o.lines.reduce((a, l) => a + l.qty, 0)} article{o.lines.length > 1 ? "s" : ""} · {o.total.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })} TTC</p>
                </button>
              </li>
            ))}
          </ul>
          {current && <OrderEmailPreview key={current.order.id} order={current.order} firstName={current.firstName} />}
        </div>
      )}
    </Card>
  );
}
