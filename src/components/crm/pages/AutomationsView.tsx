"use client";
import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";
import { Button, Card, Field, Modal, PageHeader, Tabs } from "@/components/hub/ui";
import { EditI, PlayI } from "@/components/hub/icons";
import { eur, pctf } from "../charts";
import { Kpi, Pill, thead, trow, useCrmAction, Empty } from "../ui";
import { DELIVERY_LABEL, type Automation } from "@/lib/crm/types";
import type { automationsData } from "@/lib/crm/pages";

type Data = Awaited<ReturnType<typeof automationsData>>;
type Row = Data["list"][number];
const dt = (s?: string) => (s ? `${s.slice(8, 10)}/${s.slice(5, 7)} ${s.slice(11, 16)}` : "—");
const delayLabel = (h: number) => (h === 0 ? "immédiat" : h < 24 ? `${h} h` : `${Math.round(h / 24)} j`);
const DTONE = { envoye: "ok", simule: "neutral", echec: "bad" } as const;

export function AutomationsView({ data: d }: { data: Data }) {
  const { run, busy } = useCrmAction();
  const [tab, setTab] = useState<"scenarios" | "alertes" | "journal">("scenarios");
  const [edit, setEdit] = useState<Row | null>(null);
  const k = d.kpis;
  return (
    <>
      <PageHeader eyebrow="Automatisation" title="Automatisations" intro="Scénarios qui s'exécutent tout seuls : alerte de retour en stock, relances de paniers abandonnés, bienvenue, demande d'avis, rappel de réapprovisionnement, réactivation. Exécution automatique toutes les 10 minutes et à chaque réception de stock."
        actions={<Button variant="primary" icon={<PlayI size={14} />} disabled={busy} onClick={() => run<{ message: string }>("automation/run", {}, (r) => r.message)}>Exécuter maintenant</Button>} />
      <div className={clsx("mb-5 rounded-lg border px-4 py-2.5 text-xs leading-relaxed", k.resend ? "border-sage bg-sage-soft text-forest" : "border-line bg-white text-forest-soft")}>
        {k.resend ? "Resend est configuré : les e-mails aux vraies adresses partent réellement. " : "Resend n'est pas configuré (RESEND_API_KEY) : aucun e-mail ne part, les envois sont marqués « Simulé ». "}
        Les e-mails des contacts de démonstration (@example.com) arrivent dans la <Link href="/crm/boite-demo" className="underline">Boîte mail de démo</Link>. Un client ne reçoit jamais deux fois le même message.
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi label="Scénarios actifs" value={`${k.active} / ${d.list.length}`} />
        <Kpi label="Envois (30 j)" value={k.runs30.toLocaleString("fr-FR")} />
        <Kpi label="CA attribué (30 j)" value={eur(k.revenue)} hint="commande ou panier récupéré après l'envoi" />
        <Kpi label="Alertes stock en attente" value={k.pending} tone={k.pending ? "warn" : undefined} />
        <Kpi label="Conversion alertes stock" value={k.alertRate === null ? "—" : pctf(k.alertRate, 0)} hint="achat après l'alerte" />
      </div>

      <Tabs className="mt-6" value={tab} onChange={setTab} tabs={[{ id: "scenarios", label: "Scénarios", count: d.list.length }, { id: "alertes", label: "Alertes retour en stock", count: k.pending }, { id: "journal", label: "Journal des envois" }]} />

      {tab === "scenarios" && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {d.list.map((a) => (
            <Card key={a.id} title={<span className="flex items-center gap-2">{a.name} <Pill tone={a.enabled ? "ok" : "neutral"}>{a.enabled ? "Actif" : "En pause"}</Pill></span>} subtitle={a.description}
              action={<label className="flex cursor-pointer items-center gap-2 text-xs"><span className="sr-only">Activer {a.name}</span><input type="checkbox" className="peer sr-only" checked={a.enabled} disabled={busy} onChange={(e) => run("automation/save", { id: a.id, enabled: e.target.checked }, e.target.checked ? "Scénario activé" : "Scénario mis en pause")} /><span className="relative h-5 w-9 rounded-full bg-[#D9D7D1] transition after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:bg-forest peer-checked:after:translate-x-4" /></label>}>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-forest-soft">
                <span><b className="text-forest">Déclencheur :</b> {a.trigger}</span>
                <span><b className="text-forest">Délai :</b> {delayLabel(a.delayHours)}</span>
                <span><b className="text-forest">Dernière exécution :</b> {dt(a.lastRunAt)}</span>
              </div>
              <div className="mt-3 rounded-md bg-[#F6F5F1] p-3 text-sm"><p className="font-semibold">{a.subject}</p><p className="mt-0.5 text-forest-soft">{a.body}</p></div>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                {[["Envois 30 j", a.runs30.toLocaleString("fr-FR")], ["Conversions", a.converted.toLocaleString("fr-FR")], ["Taux", pctf(a.rate, 0)], ["CA généré", eur(a.revenue)]].map(([l, v]) => <div key={l} className="rounded-md border border-line p-2"><p className="font-display text-lg font-semibold tabular-nums">{v}</p><p className="text-[0.62rem] uppercase tracking-wide text-forest-soft">{l}</p></div>)}
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <Button size="sm" icon={<EditI size={13} />} onClick={() => setEdit(a)}>Modifier</Button>
                <Button size="sm" icon={<PlayI size={13} />} disabled={busy} onClick={() => run<{ message: string }>("automation/run", { id: a.id }, (r) => r.message)}>Exécuter</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === "alertes" && (
        <div className="mt-4 space-y-6">
          <Card title="Produits attendus" subtitle="Personnes inscrites à « Me prévenir du retour en stock » (fiche produit et Glow Assistant)" pad={false}>
            <table className="w-full text-sm">
              <thead className={thead}><tr><th className="px-4 py-2">Produit</th><th className="px-3 text-right">Inscrits</th><th className="px-3 text-right">dont chatbot</th><th className="px-3 text-right">Stock</th><th className="px-3 text-right">En commande</th><th className="px-3 text-right">CA potentiel</th><th className="px-4" /></tr></thead>
              <tbody>
                {d.byProduct.map((p) => (
                  <tr key={p.productId} className={trow}>
                    <td className="px-4 py-2 font-medium">{p.name}</td>
                    <td className="px-3 text-right font-semibold tabular-nums">{p.n}</td>
                    <td className="px-3 text-right tabular-nums">{p.fromChat}</td>
                    <td className="px-3 text-right tabular-nums">{p.qty === 0 ? <Pill tone="bad">Rupture</Pill> : p.qty}</td>
                    <td className="px-3 text-right tabular-nums">{p.incoming || "—"}</td>
                    <td className="px-3 text-right tabular-nums">{eur(p.value)}</td>
                    <td className="px-4 text-right">{p.qty === 0 ? <Link className="hub-btn hub-btn-secondary hub-btn-sm" href={`/crm/stock?tab=${p.incoming ? "commandes" : "reassort"}`}>{p.incoming ? "Voir le réassort" : "Commander"}</Link> : <Button size="sm" variant="primary" disabled={busy} onClick={() => run<{ message: string }>("automation/run", { id: "back_in_stock" }, (r) => r.message)}>Prévenir maintenant</Button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!d.byProduct.length && <div className="p-5"><Empty>Aucune alerte en attente.</Empty></div>}
            <p className="px-4 py-3 text-xs text-forest-soft">Dès qu'un bon de commande est réceptionné (ou le stock ajusté à la hausse), les inscrits reçoivent automatiquement l'e-mail « {d.list.find((a) => a.id === "back_in_stock")?.subject} ».</p>
          </Card>
          <Card title="Inscriptions en attente" pad={false}>
            <table className="w-full text-sm">
              <thead className={thead}><tr><th className="px-4 py-2">Date</th><th className="px-3">E-mail</th><th className="px-3">Produit</th><th className="px-3">Origine</th><th className="px-4" /></tr></thead>
              <tbody>{d.pendingAlerts.map((a) => <tr key={a.id} className={trow}><td className="px-4 py-2 tabular-nums text-forest-soft">{dt(a.createdAt)}</td><td className="px-3">{a.customerId ? <Link className="hover:underline" href={`/crm/clients/${a.customerId}`}>{a.email}</Link> : a.email}</td><td className="px-3">{a.label}</td><td className="px-3"><Pill tone={a.origin === "chatbot" ? "violet" : "neutral"}>{a.origin === "chatbot" ? "Glow Assistant" : "Fiche produit"}</Pill></td><td className="px-4 text-right"><button className="text-xs underline" disabled={busy} onClick={() => run("alert/cancel", { id: a.id }, "Alerte annulée")}>Annuler</button></td></tr>)}</tbody>
            </table>
          </Card>
        </div>
      )}

      {tab === "journal" && (
        <Card className="mt-4" pad={false} subtitle="80 derniers envois">
          <table className="w-full text-sm">
            <thead className={thead}><tr><th className="px-4 py-2">Date</th><th className="px-3">Scénario</th><th className="px-3">Destinataire</th><th className="px-3">Objet</th><th className="px-3">Envoi</th><th className="px-4">Résultat</th></tr></thead>
            <tbody>{d.log.map((r) => <tr key={r.id} className={trow}><td className="px-4 py-2 tabular-nums text-forest-soft">{dt(r.at)}</td><td className="px-3">{d.list.find((a) => a.id === r.automationId)?.name}</td><td className="px-3">{r.name}<span className="block text-xs text-forest-soft">{r.email}</span></td><td className="px-3 text-xs">{r.label}</td><td className="px-3"><Pill tone={DTONE[r.delivery]}>{DELIVERY_LABEL[r.delivery]}</Pill></td><td className="px-4">{r.converted ? <Pill tone="ok">Converti</Pill> : <span className="text-xs text-forest-soft">—</span>}</td></tr>)}</tbody>
          </table>
        </Card>
      )}

      {edit && <EditModal a={edit} busy={busy} onClose={() => setEdit(null)} save={(x) => run("automation/save", { id: edit.id, ...x }, "Scénario enregistré").then((r) => r && setEdit(null))} />}
    </>
  );
}

function EditModal({ a, onClose, save, busy }: { a: Automation; onClose: () => void; save: (x: Partial<Automation>) => void; busy: boolean }) {
  const [x, setX] = useState({ subject: a.subject, body: a.body, delayHours: a.delayHours });
  return (
    <Modal open onClose={onClose} title={a.name} footer={<><Button onClick={onClose}>Annuler</Button><Button variant="primary" disabled={busy} onClick={() => save(x)}>Enregistrer</Button></>}>
      <div className="space-y-3">
        <Field label="Délai avant envoi (heures)" hint="0 = immédiat · 24 = un jour · 168 = une semaine"><input className="hub-input" type="number" min={0} value={x.delayHours} onChange={(e) => setX({ ...x, delayHours: Number(e.target.value) })} /></Field>
        <Field label="Objet de l'e-mail"><input className="hub-input" value={x.subject} onChange={(e) => setX({ ...x, subject: e.target.value })} /></Field>
        <Field label="Message" hint="Variables : {prenom}, {produit}. Le bouton (commander, finaliser le panier, donner un avis…) est ajouté automatiquement."><textarea className="hub-input min-h-[120px]" value={x.body} onChange={(e) => setX({ ...x, body: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}
