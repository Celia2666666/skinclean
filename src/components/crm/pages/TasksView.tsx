"use client";
import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";
import { Button, Card, PageHeader } from "@/components/hub/ui";
import { PlusI, TrashI } from "@/components/hub/icons";
import { Kpi, Pill, useCrmAction } from "../ui";
import type { Task } from "@/lib/crm/types";

const today = () => new Date().toLocaleDateString("sv-SE");
const fr = (s: string) => s.split("-").reverse().join("/");
const TYPE: Record<Task["type"], string> = { appel: "Appel", email: "E-mail", relance: "Relance", stock: "Stock", admin: "Administratif" };
const HREF: Record<string, (id: string) => string> = { client: (id) => `/crm/clients/${id}`, commande: (id) => `/crm/ventes?id=${id}`, deal: (id) => `/crm/pipeline?id=${id}`, produit: (id) => `/crm/stock?id=${encodeURIComponent(id)}` };

export function TasksView({ tasks }: { tasks: Task[] }) {
  const { run, busy } = useCrmAction();
  const [t, setT] = useState<Partial<Task>>({ title: "", due: today(), priority: "normale", type: "appel" });
  const [showDone, setShowDone] = useState(false);
  const d = today();
  const open = tasks.filter((x) => !x.done);
  const groups: [string, Task[]][] = [
    ["En retard", open.filter((x) => x.due < d)],
    ["Aujourd'hui", open.filter((x) => x.due === d)],
    ["À venir", open.filter((x) => x.due > d)],
    ...(showDone ? [["Terminées", tasks.filter((x) => x.done)] as [string, Task[]]] : []),
  ];
  return (
    <>
      <PageHeader eyebrow="Opérations" title="Tâches" intro="Les relances, appels et actions de stock à faire, liés aux clients, commandes, produits ou opportunités B2B." />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="À faire" value={open.length} />
        <Kpi label="En retard" value={groups[0][1].length} tone={groups[0][1].length ? "bad" : undefined} />
        <Kpi label="Aujourd'hui" value={groups[1][1].length} />
        <Kpi label="Terminées" value={tasks.length - open.length} />
      </div>
      <Card title="Nouvelle tâche">
        <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); run("task/save", { task: t }, "Tâche créée").then((r) => r && setT((x) => ({ ...x, title: "" }))); }}>
          <input className="hub-input min-w-[240px] flex-1" placeholder="ex. Rappeler l'institut Lumière de Peau" value={t.title} onChange={(e) => setT({ ...t, title: e.target.value })} required aria-label="Titre de la tâche" />
          <input className="hub-input w-auto" type="date" value={t.due} onChange={(e) => setT({ ...t, due: e.target.value })} aria-label="Échéance" />
          <select className="hub-input w-auto" value={t.type} onChange={(e) => setT({ ...t, type: e.target.value as Task["type"] })} aria-label="Type">{Object.entries(TYPE).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <select className="hub-input w-auto" value={t.priority} onChange={(e) => setT({ ...t, priority: e.target.value as Task["priority"] })} aria-label="Priorité"><option value="haute">Priorité haute</option><option value="normale">Normale</option><option value="basse">Basse</option></select>
          <Button type="submit" variant="primary" icon={<PlusI size={15} />} disabled={busy}>Ajouter</Button>
        </form>
      </Card>
      <div className="mt-6 space-y-6">
        {groups.map(([label, list]) => list.length > 0 && (
          <Card key={label} title={`${label} (${list.length})`} pad={false}>
            <ul>
              {list.map((x) => (
                <li key={x.id} className="flex items-center gap-3 border-b border-line px-5 py-3 last:border-0">
                  <input type="checkbox" checked={x.done} onChange={() => run("task/toggle", { id: x.id }, x.done ? undefined : "Tâche terminée")} aria-label={`Terminer : ${x.title}`} className="h-4 w-4" />
                  <div className="min-w-0 flex-1">
                    <p className={clsx("text-sm font-medium", x.done && "text-forest-soft line-through")}>{x.title}</p>
                    <p className="text-xs text-forest-soft">{TYPE[x.type]} · échéance {fr(x.due)}{x.related && <> · <Link className="underline" href={HREF[x.related.kind](x.related.id)}>{x.related.label}</Link></>}</p>
                  </div>
                  {x.priority === "haute" && !x.done && <Pill tone="bad">Haute</Pill>}
                  <button onClick={() => run("task/delete", { id: x.id }, "Tâche supprimée")} className="hub-btn hub-btn-ghost hub-btn-sm" aria-label="Supprimer"><TrashI size={14} /></button>
                </li>
              ))}
            </ul>
          </Card>
        ))}
        <button className="text-sm underline" onClick={() => setShowDone((x) => !x)}>{showDone ? "Masquer" : "Afficher"} les tâches terminées</button>
      </div>
    </>
  );
}
