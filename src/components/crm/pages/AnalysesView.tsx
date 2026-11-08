"use client";
import Link from "next/link";
import { useState } from "react";
import { Card, PageHeader } from "@/components/hub/ui";
import { BarChart } from "@/components/hub/charts";
import { HBars, SERIES, StackedBars, eur, fmtN, pctf, seq } from "../charts";
import { Kpi, SourceNote, thead, trow } from "../ui";
import { CHANNEL_SHORT, RFM_ACTION, RFM_LABEL, SKIN_LABEL, type RfmSegment, type Customer } from "@/lib/crm/types";
import type { analysesData } from "@/lib/crm/pages";

type Data = Awaited<ReturnType<typeof analysesData>>;
const R_LABEL = ["> 240 j", "121–240 j", "61–120 j", "31–60 j", "≤ 30 j"];
const F_LABEL = ["6+", "4–5", "3", "2", "1"];
/** Segment dominant de chaque case de la grille (mêmes règles que le moteur RFM). */
const cellSeg = (r: number, f: number): RfmSegment => (r >= 5 && f >= 4) || (r >= 4 && f >= 5) ? "champions" : r >= 3 && f >= 3 ? "fideles" : r >= 4 && f >= 2 ? "potentiels" : r >= 5 ? "nouveaux" : r === 4 ? "prometteurs" : r === 3 ? "attention" : f >= 5 ? "a_ne_pas_perdre" : f >= 3 ? "a_risque" : r === 2 ? "hibernants" : "perdus";

export function AnalysesView({ data: d }: { data: Data }) {
  const [hover, setHover] = useState<{ seg: RfmSegment; n: number } | null>(null);
  const maxCell = Math.max(...d.grid.flat(), 1);
  const k = d.kpis;
  return (
    <>
      <PageHeader eyebrow="Clients" title="Segments, cohortes & valeur client" intro="Qui sont les meilleurs clients, combien reviennent, combien ils rapportent et combien ils coûtent à acquérir." />
      <SourceNote source={d.source} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <Kpi label="Acheteurs" value={fmtN(k.buyers)} />
        <Kpi label="Taux de réachat" value={pctf(k.repeat)} hint="≥ 2 commandes" />
        <Kpi label="LTV moyenne" value={eur(k.ltv)} hint="CA TTC par acheteur" />
        <Kpi label="Commandes / client" value={k.ordersPerCustomer.toFixed(2).replace(".", ",")} />
        <Kpi label="Délai de réachat" value={k.interval ? `${k.interval} j` : "—"} hint="médiane entre 2 commandes" />
        <Kpi label="Clients inactifs" value={pctf(k.churn)} hint="sans achat depuis 6 mois" />
        <Kpi label="Poids du top 10 %" value={pctf(k.top10, 0)} hint="part du CA total" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-2" title="Matrice RFM" subtitle="Nombre de clients par récence (colonnes) et fréquence d'achat (lignes)">
          <div className="grid gap-[3px]" style={{ gridTemplateColumns: "44px repeat(5, minmax(0,1fr))" }} onPointerLeave={() => setHover(null)}>
            {d.grid.map((row, fi) => [
              <span key={`f${fi}`} className="flex items-center justify-end pr-2 text-[0.68rem] text-forest-soft">{F_LABEL[fi]}</span>,
              ...row.map((n, ri) => {
                const seg = cellSeg(ri + 1, 5 - fi);
                return (
                  <Link key={`${fi}-${ri}`} href={`/crm/clients?segment=${seg}`} onPointerEnter={() => setHover({ seg, n })} className="flex aspect-[1.25] flex-col items-center justify-center rounded-md text-xs transition hover:ring-2 hover:ring-forest" style={{ background: seq(0.08 + (n / maxCell) * 0.92), color: n / maxCell > 0.45 ? "#fff" : "#1F3329" }}>
                    <b className="tabular-nums">{n}</b>
                  </Link>
                );
              }),
            ])}
            <span />
            {R_LABEL.map((l) => <span key={l} className="pt-1 text-center text-[0.62rem] text-forest-soft">{l}</span>)}
          </div>
          <p className="mt-1 text-center text-[0.65rem] text-forest-soft">← moins récent · dernier achat · plus récent →</p>
          <p className="mt-3 min-h-[40px] rounded-md bg-[#F6F5F1] p-2 text-xs">{hover ? <><b>{RFM_LABEL[hover.seg]}</b> · {hover.n} client(s) — {RFM_ACTION[hover.seg]}</> : "Survole une case pour voir le segment et l'action marketing recommandée ; clique pour ouvrir la liste."}</p>
        </Card>
        <Card className="xl:col-span-3" title="Segments RFM" subtitle="Taille, valeur et action recommandée" pad={false}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className={thead}><tr><th className="px-4 py-2">Segment</th><th className="px-3 text-right">Clients</th><th className="px-3 text-right">CA cumulé</th><th className="px-3 text-right">Panier moyen</th><th className="px-3 text-right">Récence moy.</th><th className="px-4">Action</th></tr></thead>
              <tbody>
                {d.segs.map((s) => (
                  <tr key={s.seg} className={trow}>
                    <td className="px-4 py-2"><Link href={`/crm/clients?segment=${s.seg}`} className="font-medium hover:underline">{RFM_LABEL[s.seg as RfmSegment]}</Link></td>
                    <td className="px-3 text-right tabular-nums">{s.n}</td>
                    <td className="px-3 text-right tabular-nums">{eur(s.revenue)}</td>
                    <td className="px-3 text-right tabular-nums">{eur(s.aov, 2)}</td>
                    <td className="px-3 text-right tabular-nums">{s.recency} j</td>
                    <td className="max-w-[260px] px-4 py-2 text-xs text-forest-soft">{RFM_ACTION[s.seg as RfmSegment]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card className="mt-6" title="Rétention par cohorte" subtitle="Part des clients d'un mois d'acquisition qui recommandent M+1, M+2… (au moins une commande dans le mois)">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-separate border-spacing-[3px] text-xs">
            <thead><tr><th className="text-left font-semibold text-forest-soft">Cohorte</th><th className="text-right font-semibold text-forest-soft">Clients</th>{Array.from({ length: 12 }, (_, i) => <th key={i} className="font-semibold text-forest-soft">M+{i + 1}</th>)}</tr></thead>
            <tbody>
              {d.cohorts.map((c) => (
                <tr key={c.month}>
                  <td className="whitespace-nowrap pr-2 font-medium">{c.label}</td>
                  <td className="pr-2 text-right tabular-nums">{c.size}</td>
                  {c.retention.map((v, i) => <td key={i} title={v === null ? "Pas encore observable" : `${c.label} · M+${i + 1} : ${pctf(v)}`} className="h-8 rounded text-center tabular-nums" style={{ background: v === null ? "transparent" : seq(Math.min(1, v / 30)), color: v !== null && v > 14 ? "#fff" : "#1F3329" }}>{v === null ? "" : `${Math.round(v)} %`}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-forest-soft">Lecture : une teinte plus foncée = plus de clients revenus. Les cases vides ne sont pas encore observables. Échelle saturée à 30 %.</p>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="CA : nouveaux clients vs clients récurrents" subtitle="12 derniers mois, CA TTC">
          <StackedBars labels={d.newVsReturning.map((m) => m.month)} series={[{ name: "Nouveaux clients", color: SERIES[0], values: d.newVsReturning.map((m) => m.nouveaux) }, { name: "Clients récurrents", color: SERIES[2], values: d.newVsReturning.map((m) => m.recurrents) }]} format={(n) => `${fmtN(n)} €`} />
        </Card>
        <Card title="Nombre de commandes par client" subtitle="Répartition des acheteurs">
          <BarChart items={d.freq.map((f) => ({ label: `${f.label} cmd`, value: f.value, color: SERIES[0] }))} unit=" clients" />
        </Card>
      </div>

      <Card className="mt-6" title="Rentabilité de l'acquisition par canal" subtitle="12 derniers mois — LTV (CA moyen par client acquis) vs coût d'acquisition (CAC) ; un ratio LTV / CAC ≥ 3 est la référence e-commerce" pad={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className={thead}><tr><th className="px-4 py-2">Canal</th><th className="px-3 text-right">Clients acquis</th><th className="px-3 text-right">LTV</th><th className="px-3 text-right">Dépenses</th><th className="px-3 text-right">CAC</th><th className="px-3 text-right">LTV / CAC</th><th className="px-3 text-right">ROAS</th><th className="px-4 text-right">CA attribué</th></tr></thead>
            <tbody>
              {d.channels.map((c) => {
                const ratio = c.cac ? c.ltv / c.cac : null;
                return (
                  <tr key={c.channel} className={trow}>
                    <td className="px-4 py-2 font-medium">{CHANNEL_SHORT[c.channel]}</td>
                    <td className="px-3 text-right tabular-nums">{c.newCustomers}</td>
                    <td className="px-3 text-right tabular-nums">{eur(c.ltv)}</td>
                    <td className="px-3 text-right tabular-nums">{c.spend ? eur(c.spend) : "—"}</td>
                    <td className="px-3 text-right tabular-nums">{c.cac ? eur(c.cac, 2) : "organique"}</td>
                    <td className="px-3 text-right font-semibold tabular-nums">{ratio ? <span className={ratio >= 3 ? "text-[#2E5E3E]" : ratio >= 1.5 ? "text-[#7A5B00]" : "text-[#8A2B2B]"}>{ratio.toFixed(1).replace(".", ",")} ×</span> : "—"}</td>
                    <td className="px-3 text-right tabular-nums">{c.roas ? `${c.roas.toFixed(1).replace(".", ",")} ×` : "—"}</td>
                    <td className="px-4 text-right tabular-nums">{eur(c.revenue)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="px-4 py-3 text-xs text-forest-soft">Dépenses marketing de démonstration. En réel, elles se saisissent depuis les régies (Meta, Google, TikTok) ou le module SEA & Social Ads du Marketing Hub.</p>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Niveaux du Club SKINCLEAN" subtitle="Feuilles gagnées sur 12 mois glissants">
          <HBars items={d.tiers.map(([t, n]) => ({ label: t, value: n }))} format={(n) => `${n} clients`} />
        </Card>
        <Card title="CA par type de peau" subtitle="Déclaré au Skin Diag ou sur le compte">
          <HBars items={d.skin.map(([t, v]) => ({ label: SKIN_LABEL[t as Customer["skinType"]], value: v }))} format={(n) => eur(n)} />
        </Card>
      </div>
    </>
  );
}
