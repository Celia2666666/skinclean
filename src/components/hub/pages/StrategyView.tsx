"use client";
import { useState } from "react";
import clsx from "clsx";
import { products } from "@/data/products";
import type { Objective, Persona, StrategySection } from "@/lib/hub/types";
import { PLATFORM_LABEL } from "@/lib/hub/types";
import { frDay, diffDays, todayYmd } from "@/lib/hub/dates";
import { Button, Card, Field, Modal, PageHeader, Tabs, num, useAction, useCan, useConfirm } from "../ui";
import { EditI, PlusI, TrashI } from "../icons";

const KIND = {
  fait: { label: "Fait vérifié", cls: "bg-[#E3EFE6] text-[#2E5E3E] border-[#BFD8C6]" },
  hypothese: { label: "Hypothèse à valider", cls: "bg-[#FFF3D6] text-[#7A5B00] border-[#F0DDA6]" },
  proposition: { label: "Proposition stratégique", cls: "bg-[#E2ECF8] text-[#1F4E86] border-[#C3D6EE]" },
  texte: { label: "Note", cls: "bg-white text-forest-soft border-line" },
} as const;

type TabId = "analyse" | "positionnement" | "communication" | "strategies" | "objectifs" | "personas";
const GROUPS: Record<string, TabId> = { "Analyse stratégique": "analyse", Positionnement: "positionnement", Communication: "communication", Stratégies: "strategies" };

export function StrategyView({ sections, personas, objectives, calendarRespect }: { sections: StrategySection[]; personas: Persona[]; objectives: Objective[]; calendarRespect: number | null }) {
  const [tab, setTab] = useState<TabId>("analyse");
  const [editing, setEditing] = useState<StrategySection | null>(null);
  const [obj, setObj] = useState<Partial<Objective> | null>(null);
  const [persona, setPersona] = useState<Persona | null>(null);
  const { run, busy } = useAction();
  const allowed = useCan();
  const { ask, dialog } = useConfirm();
  const canEdit = allowed("strategy.edit");

  const shown = sections.filter((s) => GROUPS[s.group] === tab);

  return (
    <div>
      {dialog}
      <PageHeader eyebrow="Stratégie" title="Ma stratégie marketing" intro={<>La stratégie de SKINCLEAN, détaillée et exploitable. Chaque information est qualifiée : <Legend kind="fait" />, <Legend kind="hypothese" /> ou <Legend kind="proposition" />.</>} />
      <Tabs value={tab} onChange={setTab} tabs={[
        { id: "analyse", label: "Analyse stratégique" }, { id: "positionnement", label: "Positionnement" }, { id: "communication", label: "Communication" },
        { id: "strategies", label: "Stratégies (contenu, acquisition, influence, notoriété)" }, { id: "objectifs", label: "Objectifs SMART", count: objectives.length }, { id: "personas", label: "Personas", count: personas.length },
      ]} />

      <div className="mt-6">
        {GROUPS && ["analyse", "positionnement", "communication", "strategies"].includes(tab) && (
          <div className="space-y-6">
            {shown.map((s) => (
              <Card key={s.id} title={s.title} subtitle={s.summary} action={canEdit && <Button size="sm" icon={<EditI size={14} />} onClick={() => setEditing(structuredClone(s))}>Modifier</Button>}>
                <div className="grid gap-3 md:grid-cols-2">
                  {s.blocks.map((b, i) => (
                    <div key={i} className={clsx("rounded-lg border p-4", KIND[b.kind].cls.split(" ").filter((c) => c.startsWith("border")).join(" "), "bg-white")}>
                      <span className={clsx("hub-badge border", KIND[b.kind].cls)}>{KIND[b.kind].label}</span>
                      {b.title && <p className="mt-2 font-semibold">{b.title}</p>}
                      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-forest-soft">{b.text}</p>
                      {b.source && <p className="mt-2 text-xs text-forest-soft">Source : {b.source}</p>}
                    </div>
                  ))}
                </div>
                {s.table && (
                  <div className="hub-scroll mt-4 overflow-x-auto rounded-lg border border-line">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead className="bg-sage-soft text-left text-xs uppercase tracking-wider text-forest-soft"><tr>{s.table.head.map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
                      <tbody>{s.table.rows.map((r, i) => <tr key={i} className="border-t border-line">{r.map((c, j) => <td key={j} className={clsx("p-3 align-top", j === 0 && "font-medium")}>{c}</td>)}</tr>)}</tbody>
                    </table>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {tab === "objectifs" && (
          <Card title="Objectifs marketing SMART" subtitle="Spécifiques, mesurables, atteignables, réalistes et datés. Les valeurs actuelles restent vides tant qu'elles ne sont pas mesurées." pad={false}
            action={canEdit && <Button size="sm" variant="primary" icon={<PlusI size={14} />} onClick={() => setObj({ axis: "Notoriété", title: "", kpi: "", baseline: "À mesurer", target: 0, unit: "", deadline: todayYmd(), owner: "" })}>Ajouter un objectif</Button>}>
            <div className="hub-scroll overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-sage-soft text-left text-xs uppercase tracking-wider text-forest-soft"><tr><th className="p-3">Axe</th><th className="p-3">Objectif</th><th className="p-3">Indicateur</th><th className="p-3">Cible</th><th className="p-3">Actuel</th><th className="p-3">Échéance</th><th className="p-3">Statut</th><th className="p-3" /></tr></thead>
                <tbody>
                  {objectives.map((o) => {
                    const current = o.id === "obj-contenus" && calendarRespect !== null ? calendarRespect : o.current;
                    const pct = current !== null && o.target ? Math.min(100, Math.round((current / o.target) * 100)) : null;
                    const days = diffDays(o.deadline, todayYmd());
                    return (
                      <tr key={o.id} className="border-t border-line align-top">
                        <td className="p-3"><span className="hub-badge bg-sage-soft">{o.axis}</span></td>
                        <td className="p-3 font-medium">{o.title}<p className="mt-0.5 text-xs font-normal text-forest-soft">Responsable : {o.owner} · Point de départ : {o.baseline}</p></td>
                        <td className="p-3 text-forest-soft">{o.kpi}</td>
                        <td className="p-3 tabular-nums">{num(o.target)} {o.unit}</td>
                        <td className="p-3 tabular-nums">
                          {current === null ? <span className="text-forest-soft">Non mesuré</span> : <>{num(current)} {o.unit}<div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-sage-soft"><div className="h-full bg-sage-deep" style={{ width: `${pct}%` }} /></div></>}
                          {o.id === "obj-contenus" && calendarRespect !== null && <p className="text-[0.65rem] text-forest-soft">calculé automatiquement</p>}
                        </td>
                        <td className="p-3">{frDay(o.deadline)}<p className="text-xs text-forest-soft">{days >= 0 ? `dans ${days} j` : "échue"}</p></td>
                        <td className="p-3"><span className={clsx("hub-badge", o.status === "atteint" ? "bg-[#E3EFE6] text-[#2E5E3E]" : o.status === "a_risque" ? "bg-[#FBE7DF] text-[#8A3D1E]" : "bg-[#E2ECF8] text-[#1F4E86]")}>{o.status === "atteint" ? "Atteint" : o.status === "a_risque" ? "À risque" : "En cours"}</span></td>
                        <td className="p-3 text-right">{canEdit && <div className="flex justify-end gap-1"><Button size="sm" variant="ghost" icon={<EditI size={14} />} aria-label="Modifier" onClick={() => setObj(o)} /><Button size="sm" variant="ghost" icon={<TrashI size={14} />} aria-label="Supprimer" onClick={async () => { if (await ask("Supprimer cet objectif ?", o.title, "Supprimer", true)) run("objectives/delete", { id: o.id }, "Objectif supprimé"); }} /></div>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {tab === "personas" && (
          <div className="grid gap-5 lg:grid-cols-2">
            {personas.map((p) => (
              <Card key={p.id} title={<span className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full font-display text-lg font-semibold" style={{ background: p.color }}>{p.avatar}</span><span>{p.name}<span className="block text-xs font-normal text-forest-soft">{p.age}</span></span></span>}
                action={canEdit && <Button size="sm" icon={<EditI size={14} />} onClick={() => setPersona(structuredClone(p))}>Modifier</Button>}>
                <p className="text-sm">{p.summary}</p>
                <blockquote className="mt-3 border-l-2 border-sage-deep pl-3 text-sm italic text-forest-soft">« {p.quote} »</blockquote>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <List title="Problématiques de peau" items={p.skin} />
                  <List title="Motivations" items={p.motivations} />
                  <List title="Freins" items={p.frustrations} />
                  <List title="Habitudes digitales" items={p.digital} />
                </div>
                <div className="mt-4"><p className="hub-label">Messages les plus pertinents</p><ul className="space-y-1 text-sm">{p.messages.map((m) => <li key={m} className="rounded bg-sage-soft px-3 py-1.5">{m}</li>)}</ul></div>
                <div className="mt-4 flex flex-wrap gap-1.5"><span className="hub-label w-full">Canaux & produits phares</span>{p.channels.map((c) => <span key={c} className="hub-badge border border-line">{PLATFORM_LABEL[c]}</span>)}{p.products.map((id) => <span key={id} className="hub-badge bg-forest text-white">{products.find((x) => x.id === id)?.name ?? id}</span>)}</div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Modifier — ${editing?.title ?? ""}`} size="lg"
        footer={<><Button onClick={() => setEditing(null)}>Annuler</Button><Button variant="primary" disabled={busy} onClick={async () => { await run("strategy/update", editing, "Stratégie mise à jour"); setEditing(null); }}>Enregistrer</Button></>}>
        {editing && (
          <div className="space-y-4">
            <Field label="Titre"><input className="hub-input" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
            <Field label="Résumé"><textarea className="hub-input" value={editing.summary} onChange={(e) => setEditing({ ...editing, summary: e.target.value })} /></Field>
            {editing.blocks.map((b, i) => (
              <div key={i} className="rounded-lg border border-line p-3">
                <div className="flex flex-wrap gap-2">
                  <select className="hub-input w-auto" value={b.kind} onChange={(e) => setEditing({ ...editing, blocks: editing.blocks.map((x, j) => (j === i ? { ...x, kind: e.target.value as typeof b.kind } : x)) })}>
                    {Object.entries(KIND).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <input className="hub-input flex-1" placeholder="Intitulé" value={b.title ?? ""} onChange={(e) => setEditing({ ...editing, blocks: editing.blocks.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} />
                  <Button variant="ghost" icon={<TrashI size={14} />} aria-label="Retirer" onClick={() => setEditing({ ...editing, blocks: editing.blocks.filter((_, j) => j !== i) })} />
                </div>
                <textarea className="hub-input mt-2 min-h-24" value={b.text} onChange={(e) => setEditing({ ...editing, blocks: editing.blocks.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} />
                <input className="hub-input mt-2" placeholder="Source (pour un fait vérifié)" value={b.source ?? ""} onChange={(e) => setEditing({ ...editing, blocks: editing.blocks.map((x, j) => (j === i ? { ...x, source: e.target.value || undefined } : x)) })} />
              </div>
            ))}
            <Button icon={<PlusI size={14} />} onClick={() => setEditing({ ...editing, blocks: [...editing.blocks, { kind: "proposition", title: "", text: "" }] })}>Ajouter un bloc</Button>
          </div>
        )}
      </Modal>

      <Modal open={!!obj} onClose={() => setObj(null)} title={obj?.id ? "Modifier l'objectif" : "Nouvel objectif"}
        footer={<><Button onClick={() => setObj(null)}>Annuler</Button><Button variant="primary" disabled={busy || !obj?.title} onClick={async () => { await run(obj?.id ? "objectives/update" : "objectives/create", obj, "Objectif enregistré"); setObj(null); }}>Enregistrer</Button></>}>
        {obj && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Axe"><select className="hub-input" value={obj.axis} onChange={(e) => setObj({ ...obj, axis: e.target.value })}>{["Notoriété", "Visibilité", "Communautés", "Engagement", "Trafic campagnes", "Inscriptions", "Skin Diag", "SEO", "Performance des contenus"].map((a) => <option key={a}>{a}</option>)}</select></Field>
            <Field label="Responsable"><input className="hub-input" value={obj.owner ?? ""} onChange={(e) => setObj({ ...obj, owner: e.target.value })} /></Field>
            <Field label="Objectif (formulation SMART)" className="sm:col-span-2"><input className="hub-input" value={obj.title ?? ""} onChange={(e) => setObj({ ...obj, title: e.target.value })} /></Field>
            <Field label="Indicateur associé" className="sm:col-span-2"><input className="hub-input" value={obj.kpi ?? ""} onChange={(e) => setObj({ ...obj, kpi: e.target.value })} /></Field>
            <Field label="Cible"><input type="number" className="hub-input" value={obj.target ?? 0} onChange={(e) => setObj({ ...obj, target: Number(e.target.value) })} /></Field>
            <Field label="Unité"><input className="hub-input" value={obj.unit ?? ""} onChange={(e) => setObj({ ...obj, unit: e.target.value })} /></Field>
            <Field label="Valeur actuelle mesurée" hint="Laisser vide si non mesurée."><input type="number" className="hub-input" value={obj.current ?? ""} onChange={(e) => setObj({ ...obj, current: e.target.value === "" ? null : Number(e.target.value) })} /></Field>
            <Field label="Échéance"><input type="date" className="hub-input" value={obj.deadline ?? ""} onChange={(e) => setObj({ ...obj, deadline: e.target.value })} /></Field>
            <Field label="Point de départ"><input className="hub-input" value={obj.baseline ?? ""} onChange={(e) => setObj({ ...obj, baseline: e.target.value })} /></Field>
            <Field label="Statut"><select className="hub-input" value={obj.status ?? "en_cours"} onChange={(e) => setObj({ ...obj, status: e.target.value as Objective["status"] })}><option value="en_cours">En cours</option><option value="a_risque">À risque</option><option value="atteint">Atteint</option></select></Field>
          </div>
        )}
      </Modal>

      <Modal open={!!persona} onClose={() => setPersona(null)} title={`Modifier ${persona?.name ?? ""}`} size="lg"
        footer={<><Button onClick={() => setPersona(null)}>Annuler</Button><Button variant="primary" disabled={busy} onClick={async () => { await run("personas/update", persona, "Persona mis à jour"); setPersona(null); }}>Enregistrer</Button></>}>
        {persona && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prénom"><input className="hub-input" value={persona.name} onChange={(e) => setPersona({ ...persona, name: e.target.value })} /></Field>
            <Field label="Âge · situation"><input className="hub-input" value={persona.age} onChange={(e) => setPersona({ ...persona, age: e.target.value })} /></Field>
            <Field label="Résumé" className="sm:col-span-2"><textarea className="hub-input" value={persona.summary} onChange={(e) => setPersona({ ...persona, summary: e.target.value })} /></Field>
            <Field label="Citation" className="sm:col-span-2"><input className="hub-input" value={persona.quote} onChange={(e) => setPersona({ ...persona, quote: e.target.value })} /></Field>
            {(["skin", "motivations", "frustrations", "digital", "messages"] as const).map((k) => (
              <Field key={k} label={{ skin: "Problématiques de peau", motivations: "Motivations", frustrations: "Freins", digital: "Habitudes digitales", messages: "Messages clés" }[k] + " (une par ligne)"} className={k === "messages" ? "sm:col-span-2" : ""}>
                <textarea className="hub-input min-h-24" value={persona[k].join("\n")} onChange={(e) => setPersona({ ...persona, [k]: e.target.value.split("\n") })} />
              </Field>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

const Legend = ({ kind }: { kind: keyof typeof KIND }) => <span className={clsx("hub-badge border align-middle", KIND[kind].cls)}>{KIND[kind].label}</span>;
const List = ({ title, items }: { title: string; items: string[] }) => (
  <div><p className="hub-label">{title}</p><ul className="list-disc space-y-0.5 pl-4 text-sm text-forest-soft">{items.filter(Boolean).map((x) => <li key={x}>{x}</li>)}</ul></div>
);
