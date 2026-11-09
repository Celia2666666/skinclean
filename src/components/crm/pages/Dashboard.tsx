"use client";
import Link from "next/link";
import clsx from "clsx";
import { Card, PageHeader } from "@/components/hub/ui";
import { AlertI, ArrowRightI, InfoI } from "@/components/hub/icons";
import { HBars, Heatmap, SERIES, TrendChart, eur, fmtN, pctf } from "../charts";
import { Kpi, PeriodTabs, Pill, ORDER_TONE, SourceNote } from "../ui";
import { CHANNEL_SHORT, DEVICE_LABEL, ORDER_STATUS_LABEL, PAYMENT_LABEL, type Channel, type Device, type OrderStatus, type Payment } from "@/lib/crm/types";
import type { DashboardData } from "@/lib/crm/pages";

const dt = (s: string) => `${s.slice(8, 10)}/${s.slice(5, 7)} ${s.slice(11, 16)}`;

export function Dashboard({ data: d, periods }: { data: DashboardData; periods: { id: string; label: string }[] }) {
  const k = d.kpis;
  const empty = k.orders === 0 && d.prev.orders === 0;
  const target = d.target;
  const projected = Math.max(d.forecast.mtd, d.forecast.months[0]?.value ?? 0);
  const mtd = d.forecast.mtd;
  return (
    <>
      <PageHeader eyebrow="CRM SKINCLEAN" title="Tableau de bord commercial"
        intro={<>Du {d.period.from.split("-").reverse().join("/")} au {d.period.to.split("-").reverse().join("/")}, comparé à la période précédente de même durée{d.period.key === "annee" ? " (an dernier)" : ""}.</>}
        actions={<PeriodTabs periods={periods} value={d.period.key} />} />
      <SourceNote source={d.source} />
      {empty && d.source === "reel" && (
        <div className="mb-6 rounded-xl border border-line bg-white p-6 text-sm leading-relaxed text-forest-soft">
          <p className="font-display text-lg font-semibold text-forest">Aucune commande réelle pour l'instant</p>
          <p className="mt-1">Les commandes payées sur le site via Stripe Checkout sont enregistrées ici automatiquement par le webhook (<code>/api/stripe/webhook</code>) dès que les clés Stripe sont configurées. En attendant, bascule sur « Démonstration » en haut de l'écran pour explorer le CRM.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <Kpi label="Chiffre d'affaires TTC" value={eur(k.revenue)} delta={d.deltas.revenue} hint={`${eur(k.ht)} HT`} spark={d.series.revenue} href="/crm/ventes" />
        <Kpi label="Commandes" value={fmtN(k.orders)} delta={d.deltas.orders} hint={`${k.units.toLocaleString("fr-FR")} articles`} spark={d.series.orders} href="/crm/ventes" />
        <Kpi label="Panier moyen" value={eur(k.aov, 2)} delta={d.deltas.aov} hint={`${k.upo.toFixed(1).replace(".", ",")} article(s) / commande`} spark={d.series.aov} />
        <Kpi label="Marge brute" value={pctf(k.grossRate)} delta={d.deltas.grossRate} points hint={`${eur(k.gross)} HT`} href="/crm/rentabilite" />
        <Kpi label="Marge de contribution" value={eur(k.contribution)} delta={d.deltas.contribution} hint="après logistique et frais de paiement" href="/crm/rentabilite" />
        <Kpi label="Nouveaux clients" value={fmtN(k.newCustomers)} delta={d.deltas.newCustomers} hint={`${pctf(k.returningShare, 0)} de commandes récurrentes`} href="/crm/analyses" />
        <Kpi label="Taux de conversion" value={d.conversion === null ? "—" : pctf(d.conversion, 2)} delta={d.deltas.conversion} hint="commandes / sessions" />
        <Kpi label="Abandon de panier" value={d.abandonment === null ? "—" : pctf(d.abandonment, 0)} delta={d.deltas.abandonment} invert points hint={`${eur(d.lostCarts)} non récupérés`} href="/crm/paniers" />
        <Kpi label="Taux de réachat" value={pctf(d.repeat)} hint={`${fmtN(d.buyers)} acheteurs au total`} href="/crm/analyses" />
        <Kpi label="Valeur client (LTV)" value={eur(d.ltv)} hint="CA moyen par acheteur" href="/crm/analyses" />
        <Kpi label="Ruptures de stock" value={d.stock.rupture} tone={d.stock.rupture ? "bad" : undefined} hint={`${d.stock.low} référence(s) à réassortir`} href="/crm/stock" />
        <Kpi label="Valeur du stock" value={eur(d.stock.value)} hint={`${fmtN(d.stock.units)} unités · ${d.stock.refs} réf.`} href="/crm/stock" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="Chiffre d'affaires TTC" subtitle={`Par ${d.period.grain === "day" ? "jour" : d.period.grain === "week" ? "semaine" : "mois"}, comparé à la période précédente`}>
          <TrendChart labels={d.series.labels} current={d.series.revenue} previous={d.series.prevRevenue} format={(n) => `${fmtN(n)} €`} />
          {d.campaigns.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3 text-xs text-forest-soft">
              <span className="font-semibold text-forest">Campagnes du Marketing Hub sur la période :</span>
              {d.campaigns.map((c) => <Link key={c.id} href={`/hub/campagnes/${c.id}`} className="hub-badge border border-line bg-white text-forest hover:border-forest"><span className="h-2 w-2 rounded-full" style={{ background: c.color }} />{c.name} · {c.startDate.slice(8, 10)}/{c.startDate.slice(5, 7)}–{c.endDate.slice(8, 10)}/{c.endDate.slice(5, 7)}</Link>)}
            </div>
          )}
        </Card>
        <div className="space-y-6">
          <Card title="Objectif du mois" subtitle="Objectif modifiable dans Paramètres">
            <div className="flex items-end justify-between">
              <div><p className="font-display text-2xl font-semibold tabular-nums">{eur(mtd)}</p><p className="text-xs text-forest-soft">réalisé sur {eur(target)}</p></div>
              <p className="text-right text-sm font-semibold tabular-nums">{pctf((mtd / (target || 1)) * 100, 0)}</p>
            </div>
            <div className="relative mt-3 h-3 rounded-full bg-[#F1F0EC]" role="meter" aria-valuenow={mtd} aria-valuemin={0} aria-valuemax={target} aria-label="Avancement de l'objectif">
              <div className="h-3 rounded-full" style={{ width: `${Math.min(100, (mtd / (target || 1)) * 100)}%`, background: SERIES[0] }} />
              <span className="absolute top-[-3px] h-[18px] w-0.5 bg-forest" style={{ left: `${Math.min(100, d.forecast.elapsed * 100)}%` }} title="Avancement du mois" />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-forest-soft">
              Le trait vertical marque le jour du mois ({pctf(d.forecast.elapsed * 100, 0)} écoulé). Prévision fin de mois : <b className="text-forest">{eur(projected)}</b>{" "}
              ({projected >= target ? <span className="text-[#2E5E3E]">objectif atteignable</span> : <span className="text-[#8A2B2B]">écart de {eur(target - projected)}</span>}).
            </p>
          </Card>
          <Card title="Alertes" subtitle="Ce qui demande une action" pad={false}>
            {d.alerts.length === 0 ? <p className="p-5 text-sm text-forest-soft">Rien d'urgent. 🎉</p> : (
              <ul>
                {d.alerts.map((a, i) => (
                  <li key={i} className="border-b border-line last:border-0">
                    <Link href={a.href} className="flex items-start gap-3 px-5 py-3 text-sm hover:bg-[#FAF9F6]">
                      <span className={clsx("mt-0.5 shrink-0", a.level === "bad" ? "text-[#B4443B]" : a.level === "warn" ? "text-[#B07D00]" : "text-[#6A4E2C]")}>{a.level === "info" ? <InfoI size={16} /> : <AlertI size={16} />}</span>
                      <span className="flex-1">{a.text}</span><ArrowRightI size={14} className="mt-1 shrink-0 text-forest-soft" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Meilleures ventes" subtitle="CA TTC sur la période" action={<Link href="/crm/produits" className="text-xs underline">Tout voir</Link>}>
          {d.best && (
            <div className="mb-4 rounded-lg bg-sage-soft p-3">
              <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-forest-soft">🏆 Meilleure vente</p>
              <p className="font-display text-lg font-semibold">{d.best.name}</p>
              <p className="text-xs text-forest-soft">{d.best.qty} unités · {eur(d.best.revenue)} · marge {pctf(d.best.marginRate, 0)}</p>
            </div>
          )}
          <HBars items={d.topProducts.slice(d.best ? 1 : 0).map((p) => ({ label: p.name, value: p.revenue, sub: `${p.qty} u. · ${p.category}` }))} format={(n) => eur(n)} />
        </Card>
        <Card title="Ventes par catégorie" subtitle="CA TTC (hors port)">
          <HBars items={d.categories.map(([c, v]) => ({ label: c, value: v }))} format={(n) => eur(n)} />
        </Card>
        <Card title="Canaux d'acquisition" subtitle="CA TTC attribué (dernier clic)">
          <HBars items={d.channels.map(([c, v]) => ({ label: CHANNEL_SHORT[c as Channel], value: v, sub: pctf((v / (k.revenue || 1)) * 100, 0) + " du CA" }))} format={(n) => eur(n)} />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="Quand les clients commandent-ils ?" subtitle="Commandes par jour et par heure — utile pour programmer newsletters et publications">
          <Heatmap grid={d.heat} />
        </Card>
        <Card title="Profil des achats">
          <p className="hub-label">Appareil</p>
          <SplitBar parts={d.devices.map(([x, n]) => ({ label: DEVICE_LABEL[x as Device], n }))} />
          <p className="hub-label mt-5">Paiement</p>
          <SplitBar parts={d.payments.map(([x, n]) => ({ label: PAYMENT_LABEL[x as Payment], n }))} />
          <p className="hub-label mt-5">Top régions</p>
          <HBars items={d.regions.slice(0, 5).map(([r, v]) => ({ label: r, value: v }))} format={(n) => eur(n)} />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Dernières commandes" pad={false} action={<Link href="/crm/ventes" className="text-xs underline">Toutes les commandes</Link>}>
          <ul>
            {d.latest.map((o) => (
              <li key={o.id} className="border-b border-line last:border-0">
                <Link href={`/crm/ventes?id=${o.id}`} className="flex items-center gap-3 px-5 py-2.5 text-sm hover:bg-[#FAF9F6]">
                  <span className="w-20 shrink-0 font-medium tabular-nums">{o.number}</span>
                  <span className="min-w-0 flex-1 truncate">{o.name}<span className="ml-2 text-xs text-forest-soft">{dt(o.at)} · {o.items} art.</span></span>
                  <Pill tone={ORDER_TONE[o.status]}>{ORDER_STATUS_LABEL[o.status as OrderStatus]}</Pill>
                  <span className="w-20 text-right font-semibold tabular-nums">{eur(o.total, 2)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Service client">
          <div className="grid grid-cols-2 gap-3">
            <Kpi label="Demandes ouvertes" value={d.tickets.open} href="/crm/sav" />
            <Kpi label="Satisfaction (CSAT)" value={d.tickets.csat ? `${d.tickets.csat.toFixed(1).replace(".", ",")} / 5` : "—"} href="/crm/sav" />
          </div>
          <p className="mt-4 text-xs leading-relaxed text-forest-soft">Taux de remboursement sur la période : <b className="text-forest">{pctf(k.refundRate)}</b> ({eur(k.refunds)}). Remises accordées : <b className="text-forest">{eur(k.discount)}</b>, soit {pctf(k.discountRate)} du chiffre d'affaires brut.</p>
        </Card>
      </div>
    </>
  );
}

function SplitBar({ parts }: { parts: { label: string; n: number }[] }) {
  const total = parts.reduce((a, p) => a + p.n, 0) || 1;
  return (
    <div>
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-full">
        {parts.map((p, i) => <span key={p.label} title={`${p.label} : ${pctf((p.n / total) * 100, 0)}`} style={{ width: `${(p.n / total) * 100}%`, background: SERIES[i] }} />)}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-forest-soft">
        {parts.map((p, i) => <span key={p.label} className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: SERIES[i] }} />{p.label} <b className="tabular-nums text-forest">{pctf((p.n / total) * 100, 0)}</b></span>)}
      </div>
    </div>
  );
}
