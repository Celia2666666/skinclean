"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { Button, Card, Drawer, Field, PageHeader } from "@/components/hub/ui";
import { PlusI } from "@/components/hub/icons";
import { eur, pctf } from "../charts";
import { Kpi, Pill, useCrmAction, useParam } from "../ui";
import { DEAL_ORIGIN_LABEL, DEAL_STAGES, DEAL_TYPE_LABEL, type Activity, type Deal, type DealOrigin, type DealStage } from "@/lib/crm/types";

const fr = (s?: string) => (s ? s.slice(0, 10).split("-").reverse().join("/") : "—");
const prob = (s: DealStage) => DEAL_STAGES.find((x) => x.id === s)!.probability;
const EMPTY: Partial<Deal> = { company: "", contact: "", email: "", city: "", type: "institut", stage: "prospect", amount: 0, closeDate: "" };

export function PipelineView({ deals, activities }: { deals: Deal[]; activities: Activity[] }) {
  const sp = useSearchParams();
  const set = useParam();
  const { run, busy } = useCrmAction();
  const [items, setItems] = useState(deals);
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<DealStage | null>(null);
  const [edit, setEdit] = useState<Partial<Deal> | null>(null);
  const [q, setQ] = useState("");
  const [origin, setOrigin] = useState<DealOrigin | "">("");
  useEffect(() => setItems(deals), [deals]);
  useEffect(() => { const id = sp.get("id"); if (id) setEdit(deals.find((d) => d.id === id) ?? null); }, [sp, deals]);

  const norm = (t: string) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const shown = items.filter((d) => (!origin || d.origin === origin) && (!q || norm(`${d.company} ${d.contact} ${d.city} ${d.email}`).includes(norm(q))));
  const nextOf = (s: DealStage): DealStage | null => (s === "prospect" ? "qualifie" : s === "qualifie" ? "proposition" : s === "proposition" || s === "negociation" ? "gagne" : null);
  const open = items.filter((d) => d.stage !== "gagne" && d.stage !== "perdu");
  const won = items.filter((d) => d.stage === "gagne"), lost = items.filter((d) => d.stage === "perdu");
  const weighted = open.reduce((a, d) => a + (d.amount * prob(d.stage)) / 100, 0);
  const cycle = won.length ? won.reduce((a, d) => a + (new Date(d.closeDate).getTime() - new Date(d.createdAt).getTime()) / 864e5, 0) / won.length : null;

  const move = (id: string, stage: DealStage) => {
    const d = items.find((x) => x.id === id);
    if (!d || d.stage === stage) return;
    setItems((x) => x.map((y) => (y.id === id ? { ...y, stage } : y))); // affichage immédiat
    run("deal/stage", { id, stage }, `${d.company} → ${DEAL_STAGES.find((s) => s.id === stage)!.label}`);
  };
  const close = () => { setEdit(null); if (sp.get("id")) set({ id: null }); };

  return (
    <>
      <PageHeader eyebrow="Opérations" title="Pipeline B2B" intro="Ventes aux professionnels : instituts, spas, concept stores, pharmacies, cadeaux d'entreprise. Glisse une carte d'une colonne à l'autre pour changer son étape."
        actions={<Button variant="primary" icon={<PlusI size={15} />} onClick={() => setEdit({ ...EMPTY })}>Nouvelle opportunité</Button>} />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi label="Pipeline ouvert" value={eur(open.reduce((a, d) => a + d.amount, 0))} hint={`${open.length} opportunités`} />
        <Kpi label="Prévision pondérée" value={eur(weighted)} hint="montant × probabilité de l'étape" />
        <Kpi label="Gagné" value={eur(won.reduce((a, d) => a + d.amount, 0))} hint={`${won.length} contrat(s)`} />
        <Kpi label="Taux de transformation" value={pctf((won.length / (won.length + lost.length || 1)) * 100, 0)} hint="gagnés / clôturés" />
        <Kpi label="Cycle de vente" value={cycle ? `${Math.round(cycle)} j` : "—"} hint="création → signature" />
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label htmlFor="deal-q" className="sr-only">Rechercher un contact</label>
        <input id="deal-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Rechercher parmi ${items.length} contacts (nom, entreprise, ville)…`} className="hub-input min-w-0 flex-1 md:max-w-md" />
        <label htmlFor="deal-origin" className="sr-only">Filtrer par source</label>
        <select id="deal-origin" value={origin} onChange={(e) => setOrigin(e.target.value as DealOrigin | "")} className="hub-input w-auto">
          <option value="">Toutes les sources</option>
          {Object.entries(DEAL_ORIGIN_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        {(q || origin) && <span className="text-xs text-forest-soft">{shown.length} résultat{shown.length > 1 ? "s" : ""}</span>}
      </div>
      <div className="hub-scroll -mx-4 flex gap-3 overflow-x-auto px-4 pb-4 md:-mx-8 md:px-8">
        {DEAL_STAGES.map((s) => {
          const col = shown.filter((d) => d.stage === s.id || (s.id === "proposition" && d.stage === "negociation"));
          return (
            <section key={s.id} onDragOver={(e) => { e.preventDefault(); setOver(s.id); }} onDragLeave={() => setOver(null)} onDrop={() => { if (drag) move(drag, s.id); setDrag(null); setOver(null); }}
              className={clsx("flex w-[270px] shrink-0 flex-col rounded-xl border bg-[#EFEEEA]/70 transition", over === s.id ? "border-forest bg-sage-soft" : "border-transparent")} aria-label={s.label}>
              <header className="px-3 pb-2 pt-3">
                <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">{s.label}</h2><span className="rounded-full bg-white px-2 text-xs tabular-nums">{col.length}</span></div>
                <p className="text-xs text-forest-soft">{eur(col.reduce((a, d) => a + d.amount, 0))} · proba. {s.probability} %</p>
              </header>
              <div className="flex min-h-[120px] flex-1 flex-col gap-2 px-2 pb-3">
                {col.map((d) => (
                  <article key={d.id} draggable onDragStart={() => setDrag(d.id)} onDragEnd={() => setDrag(null)} onClick={() => setEdit(d)}
                    className={clsx("cursor-grab rounded-lg border border-line bg-white p-3 text-sm shadow-sm transition hover:border-forest active:cursor-grabbing", drag === d.id && "opacity-40")}>
                    <p className="font-semibold leading-snug">{d.company}</p>
                    <p className="text-xs text-forest-soft">{d.contact} · {d.city}</p>
                    {d.origin && <p className="mt-1 text-[0.68rem] uppercase tracking-[0.05em] text-sage-deep">Source : {DEAL_ORIGIN_LABEL[d.origin]}</p>}
                    <div className="mt-2 flex items-center justify-between"><span className="font-semibold tabular-nums">{eur(d.amount)}</span><Pill>{DEAL_TYPE_LABEL[d.type].split(" ")[0]}</Pill></div>
                    {d.nextStep && <p className="mt-2 border-t border-line pt-2 text-xs text-forest-soft">→ {d.nextStep}</p>}
                    {d.stage === "perdu" && d.lostReason && <p className="mt-2 border-t border-line pt-2 text-xs text-[#8A2B2B]">{d.lostReason}</p>}
                    <p className="mt-1 text-[0.68rem] text-forest-soft">{d.stage === "gagne" || d.stage === "perdu" ? "Clôturé" : "Signature visée"} le {fr(d.closeDate)}</p>
                    {nextOf(d.stage) && (
                      <button type="button" disabled={busy} onClick={(e) => { e.stopPropagation(); move(d.id, nextOf(d.stage)!); }} className="mt-2 w-full rounded-md border border-line px-2 py-1 text-xs font-medium transition hover:border-forest hover:bg-sage-soft">
                        Faire avancer → {DEAL_STAGES.find((x) => x.id === nextOf(d.stage))!.label}
                      </button>
                    )}
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      {edit && <DealDrawer deal={edit} onClose={close} busy={busy} activities={activities.filter((a) => a.dealId === edit.id)} save={(d) => run("deal/save", { deal: d }, "Opportunité enregistrée").then((r) => r && close())} remove={(id) => run("deal/delete", { id }, "Opportunité supprimée").then(() => close())} />}
    </>
  );
}

function DealDrawer({ deal, onClose, save, remove, busy, activities }: { deal: Partial<Deal>; onClose: () => void; save: (d: Partial<Deal>) => void; remove: (id: string) => void; busy: boolean; activities: Activity[] }) {
  const [d, setD] = useState(deal);
  const f = (k: keyof Deal) => ({ value: (d[k] as string | number | undefined) ?? "", onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setD((x) => ({ ...x, [k]: e.target.value })) });
  return (
    <Drawer open onClose={onClose} width="max-w-lg" title={deal.id ? deal.company : "Nouvelle opportunité"}
      footer={<>{deal.id && <Button variant="danger" className="mr-auto" disabled={busy} onClick={() => remove(deal.id!)}>Supprimer</Button>}<Button onClick={onClose}>Annuler</Button><Button variant="primary" disabled={busy || !d.company} onClick={() => save(d)}>Enregistrer</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Entreprise" className="sm:col-span-2"><input className="hub-input" {...f("company")} required /></Field>
        <Field label="Contact"><input className="hub-input" {...f("contact")} /></Field>
        <Field label="E-mail"><input className="hub-input" type="email" {...f("email")} /></Field>
        <Field label="Téléphone (fictif)"><input className="hub-input" {...f("phone")} /></Field>
        <Field label="Source"><select className="hub-input" {...f("origin")}><option value="">—</option>{Object.entries(DEAL_ORIGIN_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
        <Field label="Ville"><input className="hub-input" {...f("city")} /></Field>
        <Field label="Type"><select className="hub-input" {...f("type")}>{Object.entries(DEAL_TYPE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
        <Field label="Montant estimé (€ HT / an)"><input className="hub-input" type="number" min={0} {...f("amount")} /></Field>
        <Field label="Signature visée"><input className="hub-input" type="date" {...f("closeDate")} /></Field>
        <Field label="Étape" className="sm:col-span-2"><select className="hub-input" {...f("stage")}>{DEAL_STAGES.map((s) => <option key={s.id} value={s.id}>{s.label} ({s.probability} %)</option>)}</select></Field>
        <Field label="Prochaine action" className="sm:col-span-2"><input className="hub-input" {...f("nextStep")} placeholder="ex. Envoyer les échantillons" /></Field>
        {d.stage === "perdu" && <Field label="Raison de la perte" className="sm:col-span-2"><input className="hub-input" {...f("lostReason")} /></Field>}
      </div>
      {deal.stageHistory && (
        <Card className="mt-5" title="Historique des échanges">
          {activities.length > 0 ? (
            <ul className="space-y-2 text-sm">{[...activities].sort((a, b) => b.at.localeCompare(a.at)).map((a) => <li key={a.id} className="border-l-2 border-sage pl-3"><span className="text-xs text-forest-soft">{fr(a.at)} · {a.kind === "appel" ? "Appel" : a.kind === "email" ? "E-mail" : a.kind === "statut" ? "Étape" : "Note"}</span><br />{a.body}</li>)}</ul>
          ) : <p className="text-sm text-forest-soft">Aucun échange pour l&apos;instant.</p>}
          <p className="mt-4 border-t border-line pt-3 text-xs font-medium uppercase tracking-[0.05em] text-forest-soft">Étapes</p>
          <ol className="mt-1 space-y-1 text-sm">{[...deal.stageHistory].reverse().map((h, i) => <li key={i}><b>{DEAL_STAGES.find((s) => s.id === h.stage)?.label ?? "Proposition envoyée"}</b> <span className="text-xs text-forest-soft">{fr(h.at)}</span></li>)}</ol>
        </Card>
      )}
    </Drawer>
  );
}
