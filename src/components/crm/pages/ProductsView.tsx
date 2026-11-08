"use client";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { Card, PageHeader } from "@/components/hub/ui";
import { HBars, SERIES, Scatter, eur, fmtN, pctf } from "../charts";
import { Kpi, PeriodTabs, Pill, SourceNote, thead, trow } from "../ui";
import type { productsData } from "@/lib/crm/pages";

type Data = Awaited<ReturnType<typeof productsData>>;
type Key = "revenue" | "qty" | "margin" | "marginRate" | "trend";

export function ProductsView({ data: d, periods }: { data: Data; periods: { id: string; label: string }[] }) {
  const [sort, setSort] = useState<Key>("revenue");
  const rows = useMemo(() => d.rows.slice().sort((a, b) => ((b[sort] ?? -999) as number) - ((a[sort] ?? -999) as number)), [d.rows, sort]);
  const QUAD_COLOR: Record<string, string> = { Star: SERIES[0], Locomotive: SERIES[1], Pépite: SERIES[2], "À revoir": SERIES[3] };
  const top = d.rows[0];
  const medianRev = d.rows.length ? d.rows.map((r) => r.revenue).sort((a, b) => a - b)[Math.floor(d.rows.length / 2)] : 0;
  const quadrant = (r: Data["rows"][number]) => (r.revenue >= medianRev ? (r.marginRate >= d.avgMargin ? "Star" : "Locomotive") : r.marginRate >= d.avgMargin ? "Pépite" : "À revoir");
  const th = (id: Key, label: string) => <th className="px-3 text-right"><button onClick={() => setSort(id)} aria-pressed={sort === id} className={clsx("font-semibold", sort === id && "text-forest underline")}>{label}</button></th>;
  return (
    <>
      <PageHeader eyebrow="Ventes" title="Produits & best-sellers" intro="Classement des produits, matrice volume × marge, ventes croisées et efficacité des codes promo." actions={<PeriodTabs periods={periods} value={d.period.key} />} />
      <SourceNote source={d.source} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Meilleure vente" value={top ? top.name : "—"} hint={top ? `${eur(top.revenue)} · ${top.qty} u.` : undefined} />
        <Kpi label="Références vendues" value={d.rows.length} hint={`${fmtN(d.rows.reduce((a, r) => a + r.qty, 0))} unités`} />
        <Kpi label="Marge brute moyenne" value={pctf(d.avgMargin)} hint="pondérée par le CA HT" />
        <Kpi label="Coffrets vendus" value={d.kits.reduce((a, k) => a + k.n, 0)} hint={d.kits[0] ? `n°1 : ${d.kits[0].name}` : undefined} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="Matrice produits : volume × rentabilité" subtitle="CA TTC (horizontal) et taux de marge brute (vertical) ; taille = unités vendues ; tirets = médiane du CA et marge moyenne">
          <Scatter points={d.rows.map((r) => ({ label: r.name, x: r.revenue, y: r.marginRate, size: r.qty, color: QUAD_COLOR[quadrant(r)] }))} xLabel="CA TTC" yLabel="Marge brute" xFormat={(n) => `${fmtN(n)} €`} yFormat={(n) => `${Math.round(n)} %`} xRef={medianRev} yRef={d.avgMargin} />
          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-4">
            {[["Star", "Fort CA, forte marge : à protéger (stock, mise en avant)."], ["Locomotive", "Fort CA, marge plus faible : produit d'appel, à associer en coffret."], ["Pépite", "Forte marge, CA encore faible : à pousser en marketing."], ["À revoir", "CA et marge faibles : prix, format ou arrêt."]].map(([t, x]) => <p key={t} className="rounded-md bg-[#F6F5F1] p-2"><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: QUAD_COLOR[t] }} /><b>{t}</b> — {x}</p>)}
          </div>
        </Card>
        <Card title="Ventes par catégorie">
          <HBars items={d.categories.map(([c, v]) => ({ label: c, value: v }))} format={(n) => eur(n)} />
        </Card>
      </div>

      <Card className="mt-6" title="Classement des produits" subtitle="Clique sur un en-tête pour trier" pad={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead className={thead}><tr><th className="px-4 py-2.5">#</th><th className="px-3">Produit</th><th className="px-3">Quadrant</th>{th("qty", "Unités")}{th("revenue", "CA TTC")}<th className="px-3 text-right">Part du CA</th>{th("margin", "Marge brute")}{th("marginRate", "Taux")}{th("trend", "Évolution")}<th className="px-4 text-right">Stock</th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.productId} className={trow}>
                  <td className="px-4 py-2 tabular-nums text-forest-soft">{i + 1}</td>
                  <td className="px-3"><span className="font-medium">{r.name}</span><span className="ml-2 text-xs text-forest-soft">{r.category}</span></td>
                  <td className="px-3"><Pill tone={{ Star: "dark", Locomotive: "info", Pépite: "ok", "À revoir": "warn" }[quadrant(r)]}>{quadrant(r)}</Pill></td>
                  <td className="px-3 text-right tabular-nums">{r.qty}</td>
                  <td className="px-3 text-right font-medium tabular-nums">{eur(r.revenue)}</td>
                  <td className="px-3 text-right tabular-nums text-forest-soft">{pctf(r.share)}</td>
                  <td className="px-3 text-right tabular-nums">{eur(r.margin)}</td>
                  <td className="px-3 text-right tabular-nums">{pctf(r.marginRate, 0)}</td>
                  <td className={clsx("px-3 text-right tabular-nums", r.trend === null ? "text-forest-soft" : r.trend >= 0 ? "text-[#2E5E3E]" : "text-[#8A2B2B]")}>{r.trend === null ? "nouveau" : `${r.trend > 0 ? "▲" : "▼"} ${pctf(Math.abs(r.trend), 0)}`}</td>
                  <td className={clsx("px-4 text-right tabular-nums", r.stock === 0 && "font-semibold text-[#8A2B2B]")}>{r.stock === 0 ? "Rupture" : r.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Ventes croisées" subtitle="Produits souvent achetés ensemble (analyse du panier) — base des coffrets et des suggestions « complète ta routine »" pad={false}>
          <table className="w-full text-sm">
            <thead className={thead}><tr><th className="px-4 py-2">Quand ce produit est acheté…</th><th className="px-3">… on trouve aussi</th><th className="px-3 text-right">Paniers</th><th className="px-3 text-right" title="Part des acheteurs du 1er produit qui prennent aussi le 2nd">Confiance</th><th className="px-4 text-right" title="> 1 : association plus fréquente que le hasard">Lift</th></tr></thead>
            <tbody>{d.basket.map((b, i) => <tr key={i} className={trow}><td className="px-4 py-2 font-medium">{b.a}</td><td className="px-3">{b.b}</td><td className="px-3 text-right tabular-nums">{b.count}</td><td className="px-3 text-right tabular-nums">{pctf(b.confidence, 0)}</td><td className="px-4 text-right font-semibold tabular-nums">{b.lift.toFixed(2).replace(".", ",")}</td></tr>)}</tbody>
          </table>
        </Card>
        <Card title="Codes promo" subtitle="Utilisations, CA généré et coût de la remise" pad={false}>
          <table className="w-full text-sm">
            <thead className={thead}><tr><th className="px-4 py-2">Code</th><th className="px-3 text-right">Utilisations</th><th className="px-3 text-right">Nouveaux clients</th><th className="px-3 text-right">CA TTC</th><th className="px-3 text-right">Remise</th><th className="px-4 text-right">Coût / CA</th></tr></thead>
            <tbody>{d.promos.map((p) => <tr key={p.code} className={trow}><td className="px-4 py-2"><Pill tone="violet">{p.code}</Pill></td><td className="px-3 text-right tabular-nums">{p.uses}</td><td className="px-3 text-right tabular-nums">{p.newCustomers}</td><td className="px-3 text-right tabular-nums">{eur(p.revenue)}</td><td className="px-3 text-right tabular-nums">{eur(p.discount)}</td><td className="px-4 text-right tabular-nums">{pctf((p.discount / (p.revenue || 1)) * 100)}</td></tr>)}</tbody>
          </table>
          {!d.promos.length && <p className="p-5 text-sm text-forest-soft">Aucun code utilisé sur la période.</p>}
        </Card>
      </div>
    </>
  );
}
