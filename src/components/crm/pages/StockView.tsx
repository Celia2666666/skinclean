"use client";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { Button, Card, Drawer, Field, Modal, PageHeader, Tabs } from "@/components/hub/ui";
import { DownloadI, PlusI } from "@/components/hub/icons";
import { eur, fmtN, pctf } from "../charts";
import { Kpi, Pill, STOCK_LABEL, STOCK_TONE, thead, trow, useCrmAction, useParam } from "../ui";
import { MOVE_LABEL, PO_STATUS_LABEL, type PoStatus } from "@/lib/crm/types";
import type { stockData } from "@/lib/crm/pages";

type Data = Awaited<ReturnType<typeof stockData>>;
type Row = Data["rows"][number];
const fr = (s?: string) => (s ? s.slice(0, 10).split("-").reverse().join("/") : "—");
const PO_TONE: Record<PoStatus, string> = { brouillon: "neutral", envoyee: "info", recue: "ok", annulee: "neutral" };

export function StockView({ data: d }: { data: Data }) {
  const sp = useSearchParams();
  const set = useParam();
  const tab = (sp.get("tab") ?? "inventaire") as "inventaire" | "reassort" | "commandes" | "mouvements" | "abc";
  const status = sp.get("status") ?? "";
  const [q, setQ] = useState("");
  const { run, busy } = useCrmAction();
  const rows = useMemo(() => d.rows.filter((r) => (!status || (status === "bas" ? ["bas", "critique"].includes(r.status) : r.status === status)) && `${r.name} ${r.category} ${r.supplier}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => ["rupture", "critique", "bas", "ok", "dormant"].indexOf(a.status) - ["rupture", "critique", "bas", "ok", "dormant"].indexOf(b.status) || (a.coverDays ?? 9999) - (b.coverDays ?? 9999)), [d.rows, status, q]);
  const selected = d.rows.find((r) => r.id === sp.get("id"));
  const suggestions = d.rows.filter((r) => r.suggested > 0);
  const value = d.rows.reduce((a, r) => a + r.value, 0);
  const retail = d.rows.reduce((a, r) => a + r.qty * r.price, 0);
  const counts = Object.fromEntries(["rupture", "critique", "bas", "ok", "dormant"].map((s) => [s, d.rows.filter((r) => r.status === s).length]));
  const incoming = d.pos.filter((p) => p.status === "envoyee");
  const dormantValue = d.rows.filter((r) => r.status === "dormant").reduce((a, r) => a + r.value, 0);
  const sold30 = d.rows.reduce((a, r) => a + r.sold30 * r.cost, 0);

  return (
    <>
      <PageHeader eyebrow="Opérations" title="Stock & réassort" intro="Inventaire par format, couverture en jours, alertes de rupture, réassort suggéré et bons de commande fournisseurs. Les ventes et retours mettent le stock à jour."
        actions={<a className="hub-btn hub-btn-secondary" href="/api/crm/export/stock"><DownloadI size={15} />Export CSV</a>} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Valeur du stock (coût)" value={eur(value)} hint={`${eur(retail)} au prix de vente`} />
        <Kpi label="Unités en stock" value={fmtN(d.rows.reduce((a, r) => a + r.qty, 0))} hint={`${d.rows.length} références`} />
        <Kpi label="Ruptures" value={counts.rupture} tone={counts.rupture ? "bad" : undefined} hint="références à 0" />
        <Kpi label="À réassortir" value={counts.bas + counts.critique} tone={counts.bas + counts.critique ? "warn" : undefined} hint="sous le point de commande" />
        <Kpi label="Rotation du stock" value={sold30 ? `${(value / (sold30 / 30)).toFixed(0)} j` : "—"} hint="jours de ventes couverts" />
        <Kpi label="Stock dormant" value={eur(dormantValue)} hint={`${counts.dormant} réf. > 6 mois de stock`} />
      </div>

      <Tabs className="mt-6" value={tab} onChange={(t) => set({ tab: t, status: null })} tabs={[
        { id: "inventaire", label: "Inventaire", count: d.rows.length },
        { id: "reassort", label: "Réassort suggéré", count: suggestions.length },
        { id: "commandes", label: "Bons de commande", count: incoming.length },
        { id: "mouvements", label: "Mouvements" },
        { id: "abc", label: "Analyse ABC" },
      ]} />

      {tab === "inventaire" && (
        <Card className="mt-4" pad={false}>
          <div className="flex flex-wrap items-center gap-2 border-b border-line p-4">
            <input className="hub-input min-w-[220px] flex-1" placeholder="Filtrer : produit, catégorie, fournisseur…" value={q} onChange={(e) => setQ(e.target.value)} />
            {[["", "Tous"], ["rupture", "Ruptures"], ["bas", "À réassortir"], ["ok", "OK"], ["dormant", "Dormant"]].map(([id, l]) => <button key={id} onClick={() => set({ status: id || null })} className={clsx("hub-badge border", status === id ? "border-forest bg-forest text-white" : "border-line bg-white")}>{l}</button>)}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-sm">
              <thead className={thead}><tr><th className="px-4 py-2.5">Produit</th><th className="px-3">Statut</th><th className="px-3 text-right">Stock</th><th className="px-3">Niveau</th><th className="px-3 text-right">Ventes 30 j</th><th className="px-3 text-right">Couverture</th><th className="px-3">Rupture estimée</th><th className="px-3 text-right">En commande</th><th className="px-3">ABC</th><th className="px-4 text-right">Valeur</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className={clsx(trow, "cursor-pointer")} onClick={() => set({ id: r.id }, false)}>
                    <td className="px-4 py-2"><span className="font-medium">{r.name}</span> <span className="text-xs text-forest-soft">{r.size}</span><span className="block text-xs text-forest-soft">{r.category} · {r.location}</span></td>
                    <td className="px-3"><Pill tone={STOCK_TONE[r.status]}>{STOCK_LABEL[r.status]}</Pill></td>
                    <td className={clsx("px-3 text-right font-semibold tabular-nums", r.qty === 0 && "text-[#8A2B2B]")}>{r.qty}</td>
                    <td className="w-36 px-3"><Level r={r} /></td>
                    <td className="px-3 text-right tabular-nums">{r.sold30}</td>
                    <td className="px-3 text-right tabular-nums">{r.coverDays === null ? "∞" : `${r.coverDays} j`}</td>
                    <td className="px-3 tabular-nums text-forest-soft">{r.qty === 0 ? "—" : fr(r.stockoutDate)}</td>
                    <td className="px-3 text-right tabular-nums">{r.incoming || "—"}</td>
                    <td className="px-3"><Pill tone={r.abc === "A" ? "dark" : r.abc === "B" ? "info" : "neutral"}>{r.abc}</Pill></td>
                    <td className="px-4 text-right tabular-nums">{eur(r.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "reassort" && <Reorder suggestions={suggestions} suppliers={d.suppliers} busy={busy} run={run} />}

      {tab === "commandes" && (
        <div className="mt-4 space-y-4">
          {d.pos.map((p) => (
            <Card key={p.id} title={<span className="flex flex-wrap items-center gap-2">{p.number} <Pill tone={PO_TONE[p.status]}>{PO_STATUS_LABEL[p.status]}</Pill></span>} subtitle={`${p.supplier} · créé le ${fr(p.createdAt)} · ${p.status === "recue" ? `reçu le ${fr(p.receivedAt)}` : `livraison prévue le ${fr(p.expectedAt)}`}`}
              action={<>
                {p.status === "brouillon" && <Button size="sm" variant="primary" disabled={busy} onClick={() => run("po/status", { id: p.id, status: "envoyee" }, "Bon de commande marqué comme envoyé")}>Marquer envoyé</Button>}
                {p.status === "envoyee" && <Button size="sm" variant="primary" disabled={busy} onClick={() => run<{ alertsSent: number }>("po/status", { id: p.id, status: "recue" }, (r) => `Réception enregistrée : stock mis à jour${r.alertsSent ? ` · ${r.alertsSent} alerte(s) « retour en stock » déclenchée(s)` : ""}`)}>Réceptionner</Button>}
                {(p.status === "brouillon" || p.status === "envoyee") && <Button size="sm" variant="ghost" disabled={busy} onClick={() => run("po/status", { id: p.id, status: "annulee" }, "Bon de commande annulé")}>Annuler</Button>}
              </>}>
              <ul className="grid gap-x-6 gap-y-1 text-sm md:grid-cols-2">{p.lines.map((l) => <li key={l.stockId} className="flex justify-between gap-3"><span>{l.label}</span><span className="tabular-nums text-forest-soft">{l.qty} × {eur(l.cost, 2)}</span></li>)}</ul>
              <p className="mt-2 border-t border-line pt-2 text-right text-sm font-semibold tabular-nums">Total HT : {eur(p.lines.reduce((a, l) => a + l.qty * l.cost, 0), 2)}</p>
            </Card>
          ))}
        </div>
      )}

      {tab === "mouvements" && (
        <Card className="mt-4" pad={false} subtitle="120 derniers mouvements (hors ventes, visibles dans Commandes)">
          <table className="w-full text-sm">
            <thead className={thead}><tr><th className="px-4 py-2">Date</th><th className="px-3">Produit</th><th className="px-3">Motif</th><th className="px-3">Référence</th><th className="px-3 text-right">Quantité</th><th className="px-4">Par</th></tr></thead>
            <tbody>{d.moves.map((m) => <tr key={m.id} className={trow}><td className="px-4 py-2 tabular-nums text-forest-soft">{fr(m.at)} {m.at.slice(11, 16)}</td><td className="px-3">{m.label}</td><td className="px-3">{MOVE_LABEL[m.reason]}{m.note && <span className="block text-xs text-forest-soft">{m.note}</span>}</td><td className="px-3 text-xs">{m.ref ?? "—"}</td><td className={clsx("px-3 text-right font-semibold tabular-nums", m.delta < 0 ? "text-[#8A2B2B]" : "text-[#2E5E3E]")}>{m.delta > 0 ? "+" : ""}{m.delta}</td><td className="px-4 text-xs text-forest-soft">{m.by}</td></tr>)}</tbody>
          </table>
        </Card>
      )}

      {tab === "abc" && (
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {d.abc.map((c) => (
            <Card key={c.cls} title={`Classe ${c.cls}`} subtitle={{ A: "~80 % du CA : jamais en rupture, réassort serré", B: "~15 % du CA : suivi mensuel", C: "~5 % du CA : réduire les quantités commandées" }[c.cls]}>
              <p className="font-display text-3xl font-semibold">{c.refs} <span className="text-base font-normal text-forest-soft">références</span></p>
              <p className="mt-2 text-sm">CA 12 mois : <b>{eur(c.revenue)}</b> ({pctf((c.revenue / (d.abc.reduce((a, x) => a + x.revenue, 0) || 1)) * 100, 0)})</p>
              <p className="text-sm">Stock immobilisé : <b>{eur(c.value)}</b> ({pctf((c.value / (value || 1)) * 100, 0)})</p>
            </Card>
          ))}
          <p className="text-xs text-forest-soft md:col-span-3">Analyse de Pareto : les références sont classées par chiffre d'affaires TTC des 12 derniers mois et cumulées jusqu'à 80 % (A), 95 % (B) puis 100 % (C).</p>
        </div>
      )}

      <StockDrawer row={selected} onClose={() => set({ id: null }, false)} busy={busy} run={run} moves={d.moves.filter((m) => m.stockId === selected?.id)} />
    </>
  );
}

function Level({ r }: { r: Row }) {
  const max = Math.max(r.reorderPoint * 2.5, r.qty, 1);
  return (
    <div className="relative h-2 rounded-full bg-[#F1F0EC]" title={`Stock ${r.qty} · point de commande ${r.reorderPoint} · sécurité ${r.safetyStock}`}>
      <div className="h-2 rounded-full" style={{ width: `${(r.qty / max) * 100}%`, background: r.status === "rupture" || r.status === "critique" ? "#B4443B" : r.status === "bas" ? "#eda100" : r.status === "dormant" ? "#A9A6A0" : "#1baf7a" }} />
      <span className="absolute -top-0.5 h-3 w-0.5 bg-forest" style={{ left: `${(r.reorderPoint / max) * 100}%` }} />
    </div>
  );
}

function Reorder({ suggestions, suppliers, busy, run }: { suggestions: Row[]; suppliers: string[]; busy: boolean; run: ReturnType<typeof useCrmAction>["run"] }) {
  const [qty, setQty] = useState<Record<string, number>>(() => Object.fromEntries(suggestions.map((s) => [s.id, s.suggested])));
  return (
    <div className="mt-4 space-y-4">
      <p className="text-sm text-forest-soft">Quantité suggérée = ventes journalières × (délai fournisseur + 45 jours) − stock − quantités déjà commandées, arrondie au carton de 12. Ajuste puis génère le bon de commande par fournisseur.</p>
      {suppliers.map((sup) => {
        const lines = suggestions.filter((s) => s.supplier === sup);
        if (!lines.length) return null;
        const total = lines.reduce((a, l) => a + (qty[l.id] ?? 0) * l.cost, 0);
        return (
          <Card key={sup} title={sup} subtitle={`Délai de livraison : ${lines[0].leadDays} jours`} pad={false}
            action={<Button variant="primary" size="sm" disabled={busy || !lines.some((l) => qty[l.id] > 0)} onClick={() => run("po/create", { send: true, lines: lines.filter((l) => qty[l.id] > 0).map((l) => ({ stockId: l.id, qty: qty[l.id] })) }, "Bon de commande créé et marqué envoyé")}>Générer le bon de commande · {eur(total)}</Button>}>
            <table className="w-full text-sm">
              <thead className={thead}><tr><th className="px-4 py-2">Produit</th><th className="px-3">Statut</th><th className="px-3 text-right">Stock</th><th className="px-3 text-right">Ventes / jour</th><th className="px-3 text-right">En commande</th><th className="px-4 text-right">À commander</th></tr></thead>
              <tbody>{lines.map((l) => <tr key={l.id} className={trow}><td className="px-4 py-2 font-medium">{l.name} <span className="text-xs font-normal text-forest-soft">{l.size}</span></td><td className="px-3"><Pill tone={STOCK_TONE[l.status]}>{STOCK_LABEL[l.status]}</Pill></td><td className="px-3 text-right tabular-nums">{l.qty}</td><td className="px-3 text-right tabular-nums">{l.rate.toFixed(1).replace(".", ",")}</td><td className="px-3 text-right tabular-nums">{l.incoming || "—"}</td><td className="px-4 text-right"><input type="number" min={0} step={12} className="hub-input w-24 text-right" value={qty[l.id] ?? 0} onChange={(e) => setQty((x) => ({ ...x, [l.id]: Math.max(0, Number(e.target.value)) }))} aria-label={`Quantité à commander pour ${l.name}`} /></td></tr>)}</tbody>
            </table>
          </Card>
        );
      })}
      {!suggestions.length && <p className="rounded-lg border border-dashed border-line p-8 text-center text-sm text-forest-soft">Aucun réassort nécessaire : toutes les références sont au-dessus de leur point de commande.</p>}
    </div>
  );
}

function StockDrawer({ row: r, onClose, busy, run, moves }: { row?: Row; onClose: () => void; busy: boolean; run: ReturnType<typeof useCrmAction>["run"]; moves: Data["moves"] }) {
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("ajustement");
  const [note, setNote] = useState("");
  const [cfg, setCfg] = useState<{ reorderPoint?: string; safetyStock?: string; cost?: string; leadDays?: string }>({});
  const [po, setPo] = useState(false);
  const [poQty, setPoQty] = useState("");
  if (!r) return null;
  return (
    <Drawer open onClose={onClose} width="max-w-xl" title={<span>{r.name} <span className="text-base font-normal text-forest-soft">{r.size}</span></span>}>
      <div className="grid grid-cols-3 gap-3">
        <Kpi label="En stock" value={r.qty} tone={r.qty === 0 ? "bad" : undefined} />
        <Kpi label="Couverture" value={r.coverDays === null ? "∞" : `${r.coverDays} j`} />
        <Kpi label="Ventes 90 j" value={r.sold90} />
      </div>
      <p className="mt-3 text-sm text-forest-soft">{r.supplier} · délai {r.leadDays} j · {r.location} · prix de vente {eur(r.price, 2)} · marge unitaire {pctf(((r.price / 1.2 - r.cost) / (r.price / 1.2)) * 100, 0)}</p>
      <Card className="mt-4" title="Mouvement de stock">
        <form className="grid gap-3 sm:grid-cols-3" onSubmit={(e) => { e.preventDefault(); run("stock/adjust", { id: r.id, delta: Number(delta), reason, note }, "Stock mis à jour").then((x) => x && (setDelta(""), setNote(""))); }}>
          <Field label="Quantité (+/−)"><input className="hub-input" type="number" required value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="ex. −2" /></Field>
          <Field label="Motif"><select className="hub-input" value={reason} onChange={(e) => setReason(e.target.value)}><option value="ajustement">Ajustement d'inventaire</option><option value="casse">Casse / périmé</option><option value="retour">Retour client</option><option value="reception">Réception hors bon</option></select></Field>
          <Field label="Note"><input className="hub-input" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          <div className="sm:col-span-3 flex justify-between gap-2"><Button size="sm" icon={<PlusI size={14} />} onClick={() => setPo(true)}>Commander au fournisseur</Button><Button size="sm" variant="primary" type="submit" disabled={busy || !Number(delta)}>Enregistrer</Button></div>
        </form>
      </Card>
      <Card className="mt-4" title="Paramètres de réapprovisionnement">
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); run("stock/settings", { id: r.id, ...cfg }, "Paramètres enregistrés"); }}>
          <Field label="Point de commande" hint="Alerte « à réassortir » sous ce seuil"><input className="hub-input" type="number" min={0} defaultValue={r.reorderPoint} onChange={(e) => setCfg((c) => ({ ...c, reorderPoint: e.target.value }))} /></Field>
          <Field label="Stock de sécurité" hint="Alerte « critique » sous ce seuil"><input className="hub-input" type="number" min={0} defaultValue={r.safetyStock} onChange={(e) => setCfg((c) => ({ ...c, safetyStock: e.target.value }))} /></Field>
          <Field label="Coût de revient HT (€)"><input className="hub-input" type="number" min={0} step={0.01} defaultValue={r.cost} onChange={(e) => setCfg((c) => ({ ...c, cost: e.target.value }))} /></Field>
          <Field label="Délai fournisseur (jours)"><input className="hub-input" type="number" min={1} defaultValue={r.leadDays} onChange={(e) => setCfg((c) => ({ ...c, leadDays: e.target.value }))} /></Field>
          <div className="sm:col-span-2 flex justify-end"><Button size="sm" variant="primary" type="submit" disabled={busy}>Enregistrer</Button></div>
        </form>
      </Card>
      {moves.length > 0 && <Card className="mt-4" title="Derniers mouvements"><ul className="space-y-1 text-sm">{moves.slice(0, 10).map((m) => <li key={m.id} className="flex justify-between"><span>{fr(m.at)} · {MOVE_LABEL[m.reason]}</span><b className="tabular-nums">{m.delta > 0 ? "+" : ""}{m.delta}</b></li>)}</ul></Card>}
      <Modal open={po} onClose={() => setPo(false)} title={`Commander ${r.name}`} size="sm" footer={<><Button onClick={() => setPo(false)}>Annuler</Button><Button variant="primary" disabled={busy || !(Number(poQty) > 0)} onClick={() => run("po/create", { lines: [{ stockId: r.id, qty: Number(poQty) }] }, "Bon de commande créé (brouillon)").then((x) => x && setPo(false))}>Créer le brouillon</Button></>}>
        <Field label="Quantité" hint={`Suggestion : ${r.suggested || Math.max(12, Math.ceil((r.rate * (r.leadDays + 45)) / 12) * 12)} unités`}><input className="hub-input" type="number" min={1} value={poQty} onChange={(e) => setPoQty(e.target.value)} /></Field>
      </Modal>
    </Drawer>
  );
}
