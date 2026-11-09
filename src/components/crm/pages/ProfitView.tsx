"use client";
import Link from "next/link";
import clsx from "clsx";
import { Card, PageHeader } from "@/components/hub/ui";
import { DownloadI } from "@/components/hub/icons";
import { HBars, PosNegBars, SERIES, Waterfall, eur, pctf } from "../charts";
import { Kpi, thead } from "../ui";
import { CHANNEL_SHORT, PAID_CHANNELS } from "@/lib/crm/types";
import type { profitData } from "@/lib/crm/pages";

type Data = Awaited<ReturnType<typeof profitData>>;
type M = Data["months"][number];
const LINES: { key: keyof M; label: string; sign?: -1; strong?: boolean; rate?: boolean }[] = [
  { key: "revenue", label: "Chiffre d'affaires TTC" },
  { key: "vat", label: "TVA collectée", sign: -1 },
  { key: "ht", label: "Chiffre d'affaires HT", strong: true },
  { key: "cogs", label: "Coût des marchandises vendues", sign: -1 },
  { key: "gross", label: "Marge brute", strong: true, rate: true },
  { key: "logistics", label: "Expédition & emballage", sign: -1 },
  { key: "fees", label: "Frais de paiement", sign: -1 },
  { key: "marketing", label: "Dépenses marketing", sign: -1 },
  { key: "contribution", label: "Marge de contribution", strong: true, rate: true },
  { key: "fixed", label: "Charges fixes", sign: -1 },
  { key: "ebitda", label: "Résultat d'exploitation (EBITDA)", strong: true, rate: true },
];

export function ProfitView({ data: d }: { data: Data }) {
  const l3 = d.last3;
  const u = d.unit;
  const fc = d.forecast;
  const hist = d.months.filter((m) => !m.partial).slice(-6);
  return (
    <>
      <PageHeader eyebrow="Pilotage" title="Rentabilité & prévisions" intro={<>Compte de résultat simplifié, économie unitaire d'une commande, seuil de rentabilité et prévision des ventes. Les hypothèses (TVA, logistique, frais de paiement, charges fixes) se règlent dans <Link href="/crm/parametres" className="underline">Paramètres</Link>.</>}
        actions={<a className="hub-btn hub-btn-secondary" href="/api/crm/export/rentabilite"><DownloadI size={15} />Export CSV</a>} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label={`CA TTC ${new Date().getFullYear()}`} value={eur(d.ytd.revenue)} hint={`${eur(d.ytd.ht)} HT`} />
        <Kpi label="Marge brute (année)" value={eur(d.ytd.gross)} hint={pctf((d.ytd.gross / (d.ytd.ht || 1)) * 100)} />
        <Kpi label="Marge de contribution" value={pctf(d.contributionRate)} hint="du CA HT, 3 derniers mois" />
        <Kpi label="Résultat (année)" value={eur(d.ytd.ebitda)} tone={d.ytd.ebitda < 0 ? "bad" : undefined} hint={d.profitableSince ? `rentable depuis ${d.profitableSince}` : "pas encore rentable"} />
        <Kpi label="Seuil de rentabilité" value={d.breakEvenHt ? eur(d.breakEvenHt) : "—"} hint="CA HT mensuel nécessaire" />
        <Kpi label="Charges fixes" value={eur(d.fixed)} hint="par mois" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3" title="Du chiffre d'affaires au résultat" subtitle="Cumul des 3 derniers mois complets, HT">
          <Waterfall steps={[
            { label: "CA HT", value: l3.ht, total: true }, { label: "Marchandises", value: -l3.cogs }, { label: "Marge brute", value: l3.gross, total: true },
            { label: "Logistique", value: -l3.logistics }, { label: "Paiement", value: -l3.fees }, { label: "Marketing", value: -l3.marketing }, { label: "Charges fixes", value: -l3.fixed }, { label: "Résultat", value: l3.ebitda, total: true },
          ]} />
        </Card>
        <Card className="xl:col-span-2" title="Économie d'une commande moyenne" subtitle="90 derniers jours — où vont les euros d'un panier">
          <dl className="space-y-1.5 text-sm">
            {[["Panier moyen TTC", u.aov, true], ["dont TVA", -(u.aov - u.ht)], ["CA HT", u.ht, true], ["Produits (coût de revient)", -u.cogs], ["Expédition & emballage", -u.logistics], ["Frais de paiement", -u.fees], ["Marketing (coût par commande)", -u.marketing], ["Contribution par commande", u.contribution, true]].map(([l, v, strong]) => (
              <div key={l as string} className={clsx("flex justify-between", strong && "border-t border-line pt-1.5 font-semibold")}><dt className={strong ? "" : "text-forest-soft"}>{l}</dt><dd className={clsx("tabular-nums", (v as number) < 0 && !strong && "text-forest-soft")}>{eur(v as number, 2)}</dd></div>
            ))}
          </dl>
          <div className="mt-4 flex h-4 gap-[2px] overflow-hidden rounded-full" title="Répartition du CA HT">
            {[["Produits", u.cogs, SERIES[0]], ["Logistique", u.logistics, SERIES[1]], ["Paiement", u.fees, SERIES[3]], ["Marketing", u.marketing, SERIES[4]], ["Contribution", Math.max(0, u.contribution), SERIES[2]]].map(([l, v, c]) => <span key={l as string} title={`${l} : ${pctf(((v as number) / (u.ht || 1)) * 100, 0)}`} style={{ width: `${((v as number) / (u.ht || 1)) * 100}%`, background: c as string }} />)}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-3 text-[0.7rem] text-forest-soft">{[["Produits", SERIES[0]], ["Logistique", SERIES[1]], ["Paiement", SERIES[3]], ["Marketing", SERIES[4]], ["Contribution", SERIES[2]]].map(([l, c]) => <span key={l} className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: c }} />{l}</span>)}</div>
          <p className="mt-3 text-xs text-forest-soft">La livraison facturée (10 € sous 100 €) est incluse dans le CA ; le coût réel d'expédition est déduit en logistique.</p>
        </Card>
      </div>

      <Card className="mt-6" title="Compte de résultat mensuel" subtitle="12 derniers mois (le mois en cours est partiel, charges fixes au prorata)" pad={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-xs">
            <thead className={thead}><tr><th className="sticky left-0 bg-[#FAF9F6] px-4 py-2">En euros</th>{d.months.map((m) => <th key={m.month} className="px-2 text-right">{m.label}{m.partial && "*"}</th>)}<th className="px-4 text-right">Total</th></tr></thead>
            <tbody>
              {LINES.map((l) => {
                const total = d.months.reduce((a, m) => a + (m[l.key] as number), 0);
                const totalHt = d.months.reduce((a, m) => a + m.ht, 0);
                return (
                  <tr key={l.key} className={clsx("border-b border-line", l.strong && "bg-[#FAF9F6] font-semibold")}>
                    <td className="sticky left-0 whitespace-nowrap bg-inherit px-4 py-1.5" style={{ background: l.strong ? "#FAF9F6" : "#fff" }}>{l.sign ? "− " : ""}{l.label}</td>
                    {d.months.map((m) => { const v = m[l.key] as number; return <td key={m.month} className={clsx("px-2 text-right tabular-nums", l.key === "ebitda" && v < 0 && "text-[#8A2B2B]")}>{Math.round(v).toLocaleString("fr-FR")}{l.rate && m.ht ? <span className="block text-[0.62rem] font-normal text-forest-soft">{pctf((v / m.ht) * 100, 0)}</span> : null}</td>; })}
                    <td className={clsx("px-4 text-right tabular-nums", l.key === "ebitda" && total < 0 && "text-[#8A2B2B]")}>{Math.round(total).toLocaleString("fr-FR")}{l.rate && <span className="block text-[0.62rem] font-normal text-forest-soft">{pctf((total / (totalHt || 1)) * 100, 0)}</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Résultat mensuel" subtitle="EBITDA par mois — vert : bénéficiaire, orange : déficitaire">
          <PosNegBars items={d.months.map((m) => ({ label: m.label.split(" ")[0], value: Math.round(m.ebitda) }))} />
        </Card>
        <Card title="Prévision du chiffre d'affaires" subtitle={fc.months[0]?.method === "saisonnalite" ? `Même mois l'an dernier × croissance récente (${fc.growth ? `×${fc.growth.toFixed(2).replace(".", ",")}` : "—"}), fourchette ± 12 %` : "Moyenne des 3 derniers mois, fourchette ± 12 %"}>
          <ForecastBars hist={hist.map((m) => ({ label: m.label, value: m.revenue }))} fc={fc.months} />
          <p className="mt-3 text-sm">Mois en cours : <b>{eur(fc.mtd)}</b> encaissés ({pctf(fc.elapsed * 100, 0)} du mois écoulé), prévision <b>{eur(Math.max(fc.mtd, fc.months[0]?.value ?? 0))}</b> pour un objectif de <b>{eur(d.settings.monthlyTarget)}</b>.</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Retour sur dépenses publicitaires" subtitle="90 derniers jours — ROAS = CA attribué / dépense" pad={false}>
          <table className="w-full text-sm">
            <thead className={thead}><tr><th className="px-4 py-2">Canal payant</th><th className="px-3 text-right">Dépense</th><th className="px-3 text-right">CA attribué</th><th className="px-3 text-right">ROAS</th><th className="px-4 text-right">CAC</th></tr></thead>
            <tbody>{d.channels.filter((c) => PAID_CHANNELS.includes(c.channel)).map((c) => <tr key={c.channel} className="border-b border-line last:border-0"><td className="px-4 py-2 font-medium">{CHANNEL_SHORT[c.channel]}</td><td className="px-3 text-right tabular-nums">{eur(c.spend)}</td><td className="px-3 text-right tabular-nums">{eur(c.revenue)}</td><td className={clsx("px-3 text-right font-semibold tabular-nums", (c.roas ?? 0) >= 3 ? "text-[#2E5E3E]" : "text-[#7A5B00]")}>{c.roas ? `${c.roas.toFixed(1).replace(".", ",")} ×` : "—"}</td><td className="px-4 text-right tabular-nums">{c.cac ? eur(c.cac, 2) : "—"}</td></tr>)}</tbody>
          </table>
        </Card>
        <Card title="Marge brute par catégorie" subtitle="90 derniers jours, HT">
          <HBars items={d.catMargin.map(([c, v]) => ({ label: c, value: v }))} format={(n) => eur(n)} color={SERIES[2]} />
        </Card>
      </div>
    </>
  );
}

function ForecastBars({ hist, fc }: { hist: { label: string; value: number }[]; fc: { label: string; value: number; low: number; high: number }[] }) {
  const all = [...hist.map((h) => ({ ...h, low: h.value, high: h.value, f: false })), ...fc.map((f) => ({ ...f, f: true }))];
  const max = Math.max(...all.map((b) => b.high), 1) * 1.08;
  const W = 640, H = 220, L = 8, B = 22, T = 8;
  const bw = (W - L * 2) / all.length;
  const y = (v: number) => H - B - (v / max) * (H - B - T);
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="CA mensuel réalisé et prévu">
        <defs><pattern id="crm-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill={`${SERIES[0]}22`} /><line x1="0" y1="0" x2="0" y2="6" stroke={SERIES[0]} strokeWidth="2" strokeOpacity="0.55" /></pattern></defs>
        <line x1={L} x2={W - L} y1={H - B} y2={H - B} stroke="#E3E1DC" />
        {all.map((b, i) => {
          const x = L + i * bw + bw * 0.18, w = bw * 0.64;
          return (
            <g key={i}>
              <title>{b.f ? `${b.label} (prévision) : ${eur(b.value)} — entre ${eur(b.low)} et ${eur(b.high)}` : `${b.label} : ${eur(b.value)}`}</title>
              <rect x={x} y={y(b.value)} width={w} height={H - B - y(b.value)} rx={4} fill={b.f ? "url(#crm-hatch)" : SERIES[0]} stroke={b.f ? SERIES[0] : "none"} strokeDasharray={b.f ? "4 3" : undefined} />
              {b.f && <g stroke="#1F3329" strokeWidth={1.5}><line x1={x + w / 2} x2={x + w / 2} y1={y(b.high)} y2={y(b.low)} /><line x1={x + w / 2 - 6} x2={x + w / 2 + 6} y1={y(b.high)} y2={y(b.high)} /><line x1={x + w / 2 - 6} x2={x + w / 2 + 6} y1={y(b.low)} y2={y(b.low)} /></g>}
              <text x={x + w / 2} y={y(b.high) - 5} textAnchor="middle" fontSize={10} fill="#5C6862">{(b.value / 1000).toFixed(1).replace(".", ",")} k</text>
              <text x={x + w / 2} y={H - 6} textAnchor="middle" fontSize={10} fill="#898781">{b.label}</text>
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex gap-4 text-[0.7rem] text-forest-soft"><span className="flex items-center gap-1"><span className="h-2.5 w-3 rounded-sm" style={{ background: SERIES[0] }} />Réalisé</span><span className="flex items-center gap-1"><span className="h-2.5 w-3 rounded-sm border border-dashed" style={{ borderColor: SERIES[0], background: `${SERIES[0]}33` }} />Prévision</span><span className="flex items-center gap-1"><span className="h-3 w-0.5 bg-forest" />Fourchette ± 12 %</span></div>
    </div>
  );
}
