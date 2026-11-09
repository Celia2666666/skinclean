"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { Button, Card, Drawer, PageHeader } from "@/components/hub/ui";
import { DownloadI, MailI } from "@/components/hub/icons";
import { Funnel, HBars, SERIES, StackedBars, eur, fmtN, pctf } from "../charts";
import { Kpi, Pager, PeriodTabs, Pill, thead, trow, useCrmAction, useParam, Empty } from "../ui";
import { CART_STATUS_LABEL, CART_STEP_LABEL, DEVICE_LABEL, type CartStatus } from "@/lib/crm/types";
import { delta } from "@/lib/crm/analytics";
import type { cartsData } from "@/lib/crm/pages";

type Data = Awaited<ReturnType<typeof cartsData>>;
const TONE: Record<CartStatus, string> = { abandonne: "warn", relance: "info", recupere: "ok", perdu: "neutral" };
const dt = (s: string) => `${s.slice(8, 10)}/${s.slice(5, 7)} ${s.slice(11, 16)}`;

export function CartsView({ data: d, periods }: { data: Data; periods: { id: string; label: string }[] }) {
  const set = useParam();
  const sp = useSearchParams();
  const status = sp.get("status") ?? "";
  const { run, busy } = useCrmAction();
  const k = d.kpis, p = d.prev;
  return (
    <>
      <PageHeader eyebrow="Ventes" title="Paniers abandonnés" intro="Paniers dont l'e-mail est connu (client connecté ou e-mail saisi au paiement), relances automatiques (1 h puis 24 h) et paniers récupérés."
        actions={<><PeriodTabs periods={periods} value={d.period.key} /><a className="hub-btn hub-btn-secondary" href="/api/crm/export/paniers"><DownloadI size={15} />Export CSV</a></>} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Taux d'abandon" value={k.abandonmentRate === null ? "—" : pctf(k.abandonmentRate, 0)} invert points delta={k.abandonmentRate !== null && p.abandonmentRate !== null ? k.abandonmentRate - p.abandonmentRate : undefined} hint="ajouts au panier non convertis" />
        <Kpi label="Paniers identifiés" value={fmtN(k.count)} delta={delta(k.count, p.count)} invert hint={`valeur moyenne ${eur(k.avgValue)}`} />
        <Kpi label="Valeur abandonnée" value={eur(k.lost)} tone="warn" hint="non récupérée" />
        <Kpi label="Paniers récupérés" value={k.recovered} delta={delta(k.recovered, p.recovered)} hint={pctf(k.recoveryRate) + " de récupération"} />
        <Kpi label="CA récupéré" value={eur(k.recoveredValue)} delta={delta(k.recoveredValue, p.recoveredValue)} />
        <Kpi label="Relancés" value={pctf((k.relaunched / (k.count || 1)) * 100, 0)} hint={`${k.relaunched} paniers`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3" title="Tunnel de conversion" subtitle="De la visite à la commande, sur la période">
          {k.funnel.length ? <Funnel steps={k.funnel} /> : <Empty>Aucune donnée de trafic : branche un outil d'analytics (GA4, Plausible) pour alimenter le tunnel.</Empty>}
        </Card>
        <div className="space-y-6 xl:col-span-2">
          <Card title="Où abandonnent-ils ?">
            <HBars items={k.byStep.map(([s, n]) => ({ label: CART_STEP_LABEL[s as keyof typeof CART_STEP_LABEL], value: n, sub: pctf((n / (k.count || 1)) * 100, 0) }))} format={(n) => `${n}`} />
          </Card>
          <Card title="Produits les plus abandonnés">
            <HBars items={d.items.map(([n, q]) => ({ label: n, value: q }))} format={(n) => `${n} u.`} color={SERIES[3]} />
          </Card>
        </div>
      </div>

      <Card className="mt-6" title="Valeur des paniers, 30 derniers jours" subtitle="Abandonnés vs récupérés (TTC)">
        <StackedBars labels={d.series.map((s) => s.label)} series={[{ name: "Récupérés", color: SERIES[2], values: d.series.map((s) => s.recovered) }, { name: "Non récupérés", color: SERIES[3], values: d.series.map((s) => s.abandoned) }]} format={(n) => `${fmtN(n)} €`} />
      </Card>

      <Card className="mt-6" pad={false}>
        <div className="flex flex-wrap gap-1.5 border-b border-line px-4 py-3">
          <button onClick={() => set({ status: null })} className={clsx("hub-badge border", !status ? "border-forest bg-forest text-white" : "border-line bg-white")}>Tous</button>
          {(Object.keys(CART_STATUS_LABEL) as CartStatus[]).map((s) => <button key={s} onClick={() => set({ status: s })} className={clsx("hub-badge border", status === s ? "border-forest bg-forest text-white" : "border-line bg-white")}>{CART_STATUS_LABEL[s]}</button>)}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className={thead}><tr><th className="px-4 py-2.5">Date</th><th className="px-3">Contact</th><th className="px-3">Articles</th><th className="px-3">Étape</th><th className="px-3">Statut</th><th className="px-3 text-right">Relances</th><th className="px-3 text-right">Valeur</th><th className="px-4" /></tr></thead>
            <tbody>
              {d.rows.map((c) => (
                <tr key={c.id} className={clsx(trow, "cursor-pointer")} onClick={() => set({ id: c.id }, false)}>
                  <td className="px-4 py-2 tabular-nums text-forest-soft">{dt(c.createdAt)}</td>
                  <td className="px-3"><span className="font-medium">{c.name}</span><span className="block text-xs text-forest-soft">{c.email}</span></td>
                  <td className="max-w-[240px] truncate px-3 text-forest-soft">{c.items.map((i) => i.name).join(", ")}</td>
                  <td className="px-3">{CART_STEP_LABEL[c.step]}</td>
                  <td className="px-3"><Pill tone={TONE[c.status]}>{CART_STATUS_LABEL[c.status]}</Pill></td>
                  <td className="px-3 text-right tabular-nums">{c.relaunches.length}</td>
                  <td className="px-3 text-right font-semibold tabular-nums">{eur(c.value, 2)}</td>
                  <td className="px-4 text-right" onClick={(e) => e.stopPropagation()}>{c.status !== "recupere" && <Button size="sm" disabled={busy} icon={<MailI size={13} />} onClick={() => run<{ message: string }>("cart/relaunch", { id: c.id }, (r) => r.message)}>Relancer</Button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!d.rows.length && <div className="p-5"><Empty>Aucun panier sur ces critères.</Empty></div>}
        </div>
        <Pager page={d.page} pages={d.pages} total={d.total} label="panier(s)" />
      </Card>

      {d.selected && (
        <Drawer open onClose={() => set({ id: null }, false)} width="max-w-lg" title={<span className="flex items-center gap-2">Panier de {d.selected.name} <Pill tone={TONE[d.selected.status]}>{CART_STATUS_LABEL[d.selected.status]}</Pill></span>}
          footer={d.selected.status !== "recupere" ? <><Button disabled={busy} onClick={() => run<{ message: string }>("cart/relaunch", { id: d.selected!.id, channel: "sms" }, (r) => r.message)}>Relancer par SMS</Button><Button variant="primary" disabled={busy} onClick={() => run<{ message: string }>("cart/relaunch", { id: d.selected!.id }, (r) => r.message)}>Relancer par e-mail</Button></> : undefined}>
          <p className="text-sm text-forest-soft">{d.selected.email} · {DEVICE_LABEL[d.selected.device]} · abandonné à l'étape « {CART_STEP_LABEL[d.selected.step]} » le {dt(d.selected.createdAt)}</p>
          {d.selected.customerId && <Link className="mt-1 inline-block text-sm underline" href={`/crm/clients/${d.selected.customerId}`}>Voir la fiche client</Link>}
          <Card className="mt-4" title="Contenu" pad={false}>
            <ul>{d.selected.items.map((i, k) => <li key={k} className="flex justify-between border-b border-line px-4 py-2 text-sm last:border-0"><span>{i.qty}× {i.name} <span className="text-forest-soft">{i.size}</span></span><span className="tabular-nums">{eur(i.unit * i.qty, 2)}</span></li>)}</ul>
            <p className="border-t border-line px-4 py-2 text-right font-semibold tabular-nums">{eur(d.selected.value, 2)}</p>
          </Card>
          <Card className="mt-4" title="Relances">
            {d.selected.relaunches.length ? <ul className="space-y-1 text-sm">{d.selected.relaunches.map((r, i) => <li key={i}>{dt(r.at)} · {r.channel === "sms" ? "SMS" : "E-mail"} {r.auto ? "automatique" : "manuel"}</li>)}</ul> : <p className="text-sm text-forest-soft">Aucune relance.</p>}
            {d.selected.recoveredAt && <p className="mt-2 text-sm font-medium text-[#2E5E3E]">Récupéré le {dt(d.selected.recoveredAt)}{d.selected.recoveredOrderId && <> — <Link className="underline" href={`/crm/ventes?id=${d.selected.recoveredOrderId}`}>voir la commande</Link></>}</p>}
            <p className="mt-3 text-xs text-forest-soft">Scénario recommandé : e-mail après 1 h (rappel du panier), puis 24 h (avis clients et conseils), puis 72 h (livraison offerte) — sans remise systématique pour préserver la marge.</p>
          </Card>
        </Drawer>
      )}
    </>
  );
}
