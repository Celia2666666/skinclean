"use client";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { Button, Card, Drawer, PageHeader } from "@/components/hub/ui";
import { DownloadI } from "@/components/hub/icons";
import { TruckI } from "../icons";
import { eur, pctf } from "../charts";
import { Kpi, ORDER_TONE, Pager, PeriodTabs, Pill, SearchBox, Select, SortTh, thead, trow, useCrmAction, useParam, Empty } from "../ui";
import { CHANNELS, CHANNEL_SHORT, DEVICE_LABEL, ORDER_STATUS_LABEL, PAYMENT_LABEL, type OrderStatus } from "@/lib/crm/types";
import type { ordersPage } from "@/lib/crm/pages";

type Data = Awaited<ReturnType<typeof ordersPage>>;
const dt = (s: string) => `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(2, 4)} ${s.slice(11, 16)}`;
const STATUSES: OrderStatus[] = ["payee", "en_preparation", "expediee", "livree", "remboursee", "annulee"];
const NEXT: Record<OrderStatus, { to: OrderStatus; label: string; danger?: boolean }[]> = {
  payee: [{ to: "en_preparation", label: "Lancer la préparation" }, { to: "annulee", label: "Annuler", danger: true }],
  en_preparation: [{ to: "expediee", label: "Marquer expédiée" }, { to: "annulee", label: "Annuler", danger: true }],
  expediee: [{ to: "livree", label: "Marquer livrée" }, { to: "remboursee", label: "Rembourser", danger: true }],
  livree: [{ to: "remboursee", label: "Rembourser (retour)", danger: true }],
  annulee: [], remboursee: [],
};

export function OrdersView({ data: d, periods }: { data: Data; periods: { id: string; label: string }[] }) {
  const set = useParam();
  const sp = useSearchParams();
  const status = sp.get("status") ?? "";
  return (
    <>
      <PageHeader eyebrow="Ventes" title="Commandes" intro="Suivi des commandes, de la préparation au remboursement. Clique sur une commande pour voir sa marge et changer son statut."
        actions={<><PeriodTabs periods={periods} value={d.period.key} /><a className="hub-btn hub-btn-secondary" href={`/api/crm/export/commandes?from=${d.period.from}&to=${d.period.to}`}><DownloadI size={15} />Export CSV</a></>} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="CA TTC (filtre)" value={eur(d.kpis.revenue)} />
        <Kpi label="Commandes" value={d.kpis.orders.toLocaleString("fr-FR")} />
        <Kpi label="Panier moyen" value={eur(d.kpis.aov, 2)} />
        <Kpi label="Marge brute" value={pctf(d.kpis.grossRate)} />
        <Kpi label="Taux de remise" value={pctf(d.kpis.discountRate)} />
        <Kpi label="Taux de retour" value={pctf(d.kpis.refundRate)} />
      </div>
      <Card className="mt-6" pad={false}>
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-4">
          <SearchBox placeholder="N° de commande, client, e-mail, ville, code promo…" className="min-w-[240px] flex-1" />
          <Select label="Canal" value={sp.get("channel") ?? ""} onChange={(v) => set({ channel: v })} options={[{ id: "", label: "Tous les canaux" }, ...CHANNELS.map((c) => ({ id: c, label: CHANNEL_SHORT[c] }))]} />
        </div>
        <div className="flex flex-wrap gap-1.5 border-b border-line px-4 py-2.5">
          <button onClick={() => set({ status: null })} className={clsx("hub-badge border", !status ? "border-forest bg-forest text-white" : "border-line bg-white")}>Toutes</button>
          {STATUSES.map((s) => <button key={s} onClick={() => set({ status: s })} className={clsx("hub-badge border", status === s ? "border-forest bg-forest text-white" : "border-line bg-white")}>{ORDER_STATUS_LABEL[s]} <span className="tabular-nums opacity-70">{d.counts[s] ?? 0}</span></button>)}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className={thead}><tr><th className="px-4 py-2.5">N°</th><SortTh id="date" sort={d.sort}>Date</SortTh><SortTh id="client" sort={d.sort}>Client</SortTh><th className="px-3">Statut</th><th className="px-3">Canal</th><th className="px-3 text-right">Articles</th><th className="px-3">Code</th><SortTh id="total" sort={d.sort} className="text-right">Total TTC</SortTh></tr></thead>
            <tbody>
              {d.rows.map((o) => (
                <tr key={o.id} className={clsx(trow, "cursor-pointer")} onClick={() => set({ id: o.id }, false)}>
                  <td className="px-4 py-2.5 font-medium tabular-nums">{o.number}</td>
                  <td className="px-3 tabular-nums text-forest-soft">{dt(o.at)}</td>
                  <td className="px-3"><span className="font-medium">{o.name}</span>{o.first && <Pill tone="info" className="ml-2">1ʳᵉ commande</Pill>}<span className="block text-xs text-forest-soft">{o.city}</span></td>
                  <td className="px-3"><Pill tone={ORDER_TONE[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Pill></td>
                  <td className="px-3 text-forest-soft">{CHANNEL_SHORT[o.channel]}</td>
                  <td className="px-3 text-right tabular-nums">{o.items}</td>
                  <td className="px-3 text-xs">{o.promo ?? "—"}</td>
                  <td className="px-3 text-right font-semibold tabular-nums">{eur(o.total, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!d.rows.length && <div className="p-5"><Empty>Aucune commande ne correspond à ces filtres.</Empty></div>}
        </div>
        <Pager page={d.page} pages={d.pages} total={d.total} label="commande(s)" />
      </Card>
      <OrderDrawer sel={d.selected} onClose={() => set({ id: null }, false)} />
    </>
  );
}

function OrderDrawer({ sel, onClose }: { sel: Data["selected"]; onClose: () => void }) {
  const { run, busy } = useCrmAction();
  const [restock, setRestock] = useState(true);
  const [tracking, setTracking] = useState("");
  if (!sel) return null;
  const o = sel.order, e = sel.eco;
  return (
    <Drawer open onClose={onClose} width="max-w-2xl" title={<span className="flex items-center gap-3">Commande {o.number} <Pill tone={ORDER_TONE[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Pill></span>}
      footer={NEXT[o.status].length ? (
        <>
          {o.status === "en_preparation" && <input className="hub-input mr-auto max-w-[220px]" placeholder="N° de suivi (facultatif)" value={tracking} onChange={(x) => setTracking(x.target.value)} />}
          {(o.status === "expediee" || o.status === "livree") && <label className="mr-auto flex items-center gap-2 text-xs"><input type="checkbox" checked={restock} onChange={(x) => setRestock(x.target.checked)} />Remettre les articles en stock</label>}
          {NEXT[o.status].map((n) => <Button key={n.to} variant={n.danger ? "danger" : "primary"} disabled={busy} onClick={() => run("order/status", { id: o.id, status: n.to, restock, tracking }, `Commande ${o.number} : ${ORDER_STATUS_LABEL[n.to].toLowerCase()}`)}>{n.label}</Button>)}
        </>
      ) : <p className="mr-auto text-xs text-forest-soft">Commande clôturée : aucune action possible.</p>}>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Client">
          <Link href={`/crm/clients/${o.customerId}`} className="font-semibold underline underline-offset-2">{o.customerName}</Link>
          <p className="text-sm text-forest-soft">{o.email}</p>
          <p className="text-sm text-forest-soft">{o.city} · {o.region}</p>
          <p className="mt-2 text-xs">{o.firstOrder ? "Première commande" : `${sel.customerOrders} commande(s) au total`}</p>
        </Card>
        <Card title="Paiement & origine">
          <dl className="grid grid-cols-2 gap-y-1 text-sm">
            <dt className="text-forest-soft">Date</dt><dd>{dt(o.createdAt)}</dd>
            <dt className="text-forest-soft">Paiement</dt><dd>{PAYMENT_LABEL[o.payment]}</dd>
            <dt className="text-forest-soft">Canal</dt><dd>{CHANNEL_SHORT[o.channel]}</dd>
            <dt className="text-forest-soft">Appareil</dt><dd>{DEVICE_LABEL[o.device]}</dd>
            {o.tracking && <><dt className="text-forest-soft">Suivi</dt><dd className="flex items-center gap-1 tabular-nums"><TruckI size={14} />{o.tracking}</dd></>}
          </dl>
        </Card>
      </div>
      <Card className="mt-4" title="Articles" pad={false}>
        <table className="w-full text-sm">
          <thead className={thead}><tr><th className="px-4 py-2">Produit</th><th className="px-3 text-right">Qté</th><th className="px-3 text-right">Prix TTC</th><th className="px-3 text-right">Coût HT</th><th className="px-4 text-right">Marge</th></tr></thead>
          <tbody>
            {o.items.map((i, k) => {
              const ht = (i.unit * i.qty) / 1.2;
              return (
                <tr key={k} className={trow}>
                  <td className="px-4 py-2"><span className="font-medium">{i.name}</span> <span className="text-xs text-forest-soft">{i.size}{i.kitId ? " · dans un coffret" : ""}</span></td>
                  <td className="px-3 text-right tabular-nums">{i.qty}</td>
                  <td className="px-3 text-right tabular-nums">{eur(i.unit * i.qty, 2)}</td>
                  <td className="px-3 text-right tabular-nums text-forest-soft">{eur(i.cost * i.qty, 2)}</td>
                  <td className="px-4 text-right tabular-nums">{pctf(((ht - i.cost * i.qty) / ht) * 100, 0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <dl className="grid grid-cols-2 gap-y-1 border-t border-line px-4 py-3 text-sm">
          <dt className="text-forest-soft">Sous-total</dt><dd className="text-right tabular-nums">{eur(o.subtotal, 2)}</dd>
          {o.discount > 0 && <><dt className="text-forest-soft">Remise {o.promoCode && <Pill tone="violet">{o.promoCode}</Pill>}</dt><dd className="text-right tabular-nums">− {eur(o.discount, 2)}</dd></>}
          <dt className="text-forest-soft">Livraison</dt><dd className="text-right tabular-nums">{o.shipping ? eur(o.shipping, 2) : "Offerte"}</dd>
          <dt className="font-semibold">Total TTC</dt><dd className="text-right font-semibold tabular-nums">{eur(o.total, 2)}</dd>
          {o.refunded ? <><dt className="text-[#8A2B2B]">Remboursé</dt><dd className="text-right tabular-nums text-[#8A2B2B]">− {eur(o.refunded, 2)}</dd></> : null}
        </dl>
      </Card>
      <Card className="mt-4" title="Rentabilité de la commande" subtitle="Hypothèses modifiables dans Paramètres">
        <dl className="grid grid-cols-2 gap-y-1.5 text-sm">
          <dt className="text-forest-soft">CA HT encaissé</dt><dd className="text-right tabular-nums">{eur(e.ht, 2)}</dd>
          <dt className="text-forest-soft">Coût des marchandises</dt><dd className="text-right tabular-nums">− {eur(e.cogs, 2)}</dd>
          <dt className="font-medium">Marge brute</dt><dd className="text-right font-medium tabular-nums">{eur(e.gross, 2)} <span className="text-xs text-forest-soft">({pctf(e.ht ? (e.gross / e.ht) * 100 : 0, 0)})</span></dd>
          <dt className="text-forest-soft">Expédition + emballage</dt><dd className="text-right tabular-nums">− {eur(e.logistics, 2)}</dd>
          <dt className="text-forest-soft">Frais de paiement</dt><dd className="text-right tabular-nums">− {eur(e.fees, 2)}</dd>
          <dt className="font-semibold">Marge de contribution</dt><dd className={clsx("text-right font-semibold tabular-nums", e.contribution < 0 && "text-[#8A2B2B]")}>{eur(e.contribution, 2)}</dd>
        </dl>
      </Card>
      <Card className="mt-4" title="Historique">
        <ol className="relative space-y-3 border-l border-line pl-4">
          {o.history.slice().reverse().map((h, i) => (
            <li key={i} className="text-sm"><span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-forest" /><b>{ORDER_STATUS_LABEL[h.status]}</b> <span className="text-xs text-forest-soft">{dt(h.at)}</span>{h.note && <p className="text-xs text-forest-soft">{h.note}</p>}</li>
          ))}
        </ol>
      </Card>
    </Drawer>
  );
}
