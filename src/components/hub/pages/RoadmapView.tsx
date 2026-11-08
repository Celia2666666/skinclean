"use client";
import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";
import type { RoadmapMonth } from "@/lib/hub/types";
import { monthLabel, parseLocal, todayYmd } from "@/lib/hub/dates";
import { Button, Card, Drawer, Field, PageHeader, StatusBadge, euro, useAction, useCan } from "../ui";
import { EditI } from "../icons";

interface CampaignLite { id: string; name: string; color: string; startDate: string; endDate: string; status: string }
const LIST_FIELDS: { k: keyof RoadmapMonth; l: string }[] = [
  { k: "campaigns", l: "Campagnes" }, { k: "networks", l: "Réseaux sociaux mobilisés" }, { k: "seo", l: "Actions SEO" }, { k: "sea", l: "Actions SEA" },
  { k: "newsletters", l: "Newsletters" }, { k: "kpis", l: "KPI marketing" }, { k: "deliverables", l: "Livrables" },
];

export function RoadmapView({ months, campaigns, plannedByMonth }: { months: RoadmapMonth[]; campaigns: CampaignLite[]; plannedByMonth: Record<string, number> }) {
  const [open, setOpen] = useState<RoadmapMonth | null>(null);
  const [edit, setEdit] = useState(false);
  const { run, busy } = useAction();
  const allowed = useCan();
  const total = months.reduce((s, m) => s + m.budget, 0);
  const maxBudget = Math.max(...months.map((m) => m.budget), 1);
  const first = months[0]?.month ?? todayYmd().slice(0, 7);
  const startTs = parseLocal(`${first}-01`).getTime();
  const last = months.at(-1)?.month ?? first;
  const endD = parseLocal(`${last}-01`); endD.setMonth(endD.getMonth() + 1);
  const span = endD.getTime() - startTs;
  const pos = (d: string) => Math.max(0, Math.min(100, ((parseLocal(d).getTime() - startTs) / span) * 100));
  const cur = todayYmd().slice(0, 7);

  return (
    <div>
      <PageHeader eyebrow="Roadmap" title="Plan marketing annuel" intro={`12 mois de pilotage : thématique, objectif, campagnes, réseaux, publications, SEO, SEA, newsletters, budget, KPI et livrables. Budget annuel prévisionnel : ${euro(total)} (enveloppes à valider).`} />

      <Card title="Vue chronologique" subtitle="Clique sur un mois pour voir et modifier son détail. Les barres représentent les campagnes réellement planifiées." pad={false}>
        <div className="hub-scroll overflow-x-auto">
          <div className="min-w-[1100px] p-5">
            <div className="grid grid-cols-12 gap-1.5">
              {months.map((m) => (
                <button key={m.id} onClick={() => { setOpen(m); setEdit(false); }} className={clsx("group rounded-lg border p-2.5 text-left transition hover:-translate-y-0.5 hover:shadow-md", m.month === cur ? "border-forest ring-2 ring-forest/20" : "border-line")} style={{ background: `${m.color}14` }}>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-forest-soft first-letter:uppercase">{monthLabel(m.month)}</p>
                  <span className="mt-1 block h-1 rounded-full" style={{ background: m.color }} />
                  <p className="mt-2 line-clamp-3 text-xs font-semibold leading-snug">{m.theme}</p>
                  <p className="mt-2 text-[0.68rem] text-forest-soft">{plannedByMonth[m.month] ?? 0} / {m.posts} publi.</p>
                  <div className="mt-2 h-10 rounded bg-white/70 p-1"><div className="h-full rounded-sm" style={{ width: `${(m.budget / maxBudget) * 100}%`, background: m.color, opacity: 0.8 }} /></div>
                  <p className="mt-1 text-[0.68rem] tabular-nums">{euro(m.budget)}</p>
                </button>
              ))}
            </div>
            <div className="relative mt-5 border-t border-line pt-4">
              <p className="hub-label">Campagnes</p>
              <div className="relative space-y-1.5">
                {campaigns.filter((c) => c.endDate >= `${first}-01`).sort((a, b) => a.startDate.localeCompare(b.startDate)).map((c) => (
                  <div key={c.id} className="relative h-7">
                    <Link href={`/hub/campagnes/${c.id}`} title={`${c.name} : ${c.startDate} → ${c.endDate}`} className={clsx("absolute top-0 flex h-7 items-center truncate rounded px-2 text-[0.7rem] font-medium text-white hover:opacity-90", c.status === "bibliotheque" && "opacity-50")}
                      style={{ left: `${pos(c.startDate)}%`, width: `${Math.max(4, pos(c.endDate) - pos(c.startDate))}%`, background: c.color }}>{c.name}</Link>
                  </div>
                ))}
                <div className="pointer-events-none absolute inset-y-0 w-px bg-[#C2477A]" style={{ left: `${pos(todayYmd())}%` }} title="Aujourd'hui" />
              </div>
              <p className="mt-2 text-xs text-forest-soft">Barres pâles : campagnes en bibliothèque (non activées). Trait rose : aujourd&apos;hui.</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {months.map((m) => (
          <button key={m.id} onClick={() => { setOpen(m); setEdit(false); }} className="hub-card p-4 text-left hover:border-forest">
            <div className="flex items-center justify-between"><p className="font-display font-semibold first-letter:uppercase">{monthLabel(m.month)}</p><StatusBadge status={m.status === "en_cours" ? "en_cours" : m.status === "termine" ? "terminee" : "planifiee"} /></div>
            <p className="mt-1 text-sm font-medium" style={{ color: m.color === "#D8DFD4" ? "#4A6354" : m.color }}>{m.theme}</p>
            <p className="mt-1 line-clamp-2 text-sm text-forest-soft">{m.objective}</p>
            <p className="mt-2 text-xs text-forest-soft">{m.campaigns.join(" · ")}</p>
          </button>
        ))}
      </div>

      <Drawer open={!!open} onClose={() => setOpen(null)} title={open ? <span className="first-letter:uppercase">{monthLabel(open.month)} — {open.theme}</span> : ""}
        footer={open && allowed("strategy.edit") && (edit ? <><Button onClick={() => setEdit(false)}>Annuler</Button><Button variant="primary" disabled={busy} onClick={async () => { await run("roadmap/update", open, "Mois mis à jour"); setEdit(false); }}>Enregistrer</Button></> : <Button icon={<EditI size={14} />} onClick={() => setEdit(true)}>Modifier</Button>)}>
        {open && (edit ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Thématique"><input className="hub-input" value={open.theme} onChange={(e) => setOpen({ ...open, theme: e.target.value })} /></Field>
            <Field label="Statut"><select className="hub-input" value={open.status} onChange={(e) => setOpen({ ...open, status: e.target.value as RoadmapMonth["status"] })}><option value="a_venir">À venir</option><option value="en_cours">En cours</option><option value="termine">Terminé</option></select></Field>
            <Field label="Objectif" className="md:col-span-2"><textarea className="hub-input" value={open.objective} onChange={(e) => setOpen({ ...open, objective: e.target.value })} /></Field>
            <Field label="Publications prévues"><input type="number" className="hub-input" value={open.posts} onChange={(e) => setOpen({ ...open, posts: Number(e.target.value) })} /></Field>
            <Field label="Budget (€)"><input type="number" className="hub-input" value={open.budget} onChange={(e) => setOpen({ ...open, budget: Number(e.target.value) })} /></Field>
            {LIST_FIELDS.map((f) => <Field key={f.k} label={`${f.l} (une par ligne)`}><textarea className="hub-input min-h-24" value={(open[f.k] as string[]).join("\n")} onChange={(e) => setOpen({ ...open, [f.k]: e.target.value.split("\n") })} /></Field>)}
            <Field label="Couleur"><input type="color" className="hub-input h-10 w-20 p-1" value={open.color} onChange={(e) => setOpen({ ...open, color: e.target.value })} /></Field>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <Card><p className="text-xs text-forest-soft">Publications prévues</p><p className="font-display text-2xl font-semibold">{open.posts}</p><p className="text-xs text-forest-soft">{plannedByMonth[open.month] ?? 0} déjà au calendrier</p></Card>
              <Card><p className="text-xs text-forest-soft">Budget prévisionnel</p><p className="font-display text-2xl font-semibold">{euro(open.budget)}</p></Card>
              <Card><p className="text-xs text-forest-soft">Statut</p><p className="font-display text-lg font-semibold">{open.status === "en_cours" ? "En cours" : open.status === "termine" ? "Terminé" : "À venir"}</p></Card>
            </div>
            <div><p className="hub-label">Objectif</p><p>{open.objective}</p></div>
            <div className="grid gap-4 md:grid-cols-2">
              {LIST_FIELDS.map((f) => <div key={f.k}><p className="hub-label">{f.l}</p><ul className="list-disc space-y-0.5 pl-5 text-sm">{(open[f.k] as string[]).filter(Boolean).map((x) => <li key={x}>{x}</li>)}</ul></div>)}
            </div>
            <Link href={`/hub/calendrier?view=mois&date=${open.month}-01`} className="hub-btn hub-btn-secondary">Voir le calendrier du mois</Link>
          </div>
        ))}
      </Drawer>
    </div>
  );
}
