"use client";
import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";
import { Avatar, Button, Card } from "@/components/hub/ui";
import { ChevronLeftI, MailI, PlusI, XI } from "@/components/hub/icons";
import { PhoneI, TagI } from "../icons";
import { eur, HBars } from "../charts";
import { Kpi, ORDER_TONE, Pill, thead, trow, useCrmAction } from "../ui";
import { SEG_TONE } from "./CustomersView";
import { CHANNEL_LABEL, LIFECYCLE_LABEL, ORDER_STATUS_LABEL, RFM_ACTION, RFM_LABEL, SKIN_LABEL } from "@/lib/crm/types";
import type { customerPage } from "@/lib/crm/pages";
import { concernLabels } from "@/data/categories";
import type { Concern } from "@/lib/types";

type Data = NonNullable<Awaited<ReturnType<typeof customerPage>>>;
const fr = (s?: string) => (s ? s.slice(0, 10).split("-").reverse().join("/") : "—");
const KIND_DOT: Record<string, string> = { commande: "#2a78d6", panier: "#eda100", ticket: "#e87ba4", note: "#5C6862", appel: "#1baf7a", email: "#4a3aa7", relance: "#eb6834", statut: "#898781", sms: "#008300", creation: "#1F3329" };

export function CustomerView({ data: d }: { data: Data }) {
  const c = d.customer, s = d.stats;
  const { run, busy } = useCrmAction();
  const [note, setNote] = useState("");
  const [kind, setKind] = useState("note");
  const [tag, setTag] = useState("");
  const [task, setTask] = useState("");
  const daysTo = s.nextOrder ? Math.round((new Date(s.nextOrder).getTime() - Date.now()) / 864e5) : null;
  return (
    <>
      <Link href="/crm/clients" className="mb-4 inline-flex items-center gap-1 text-sm text-forest-soft hover:text-forest"><ChevronLeftI size={14} />Contacts</Link>
      <div className="hub-card mb-6 flex flex-wrap items-center gap-5 p-5">
        <Avatar name={s.name} size={64} color="#4A6354" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-semibold">{s.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-forest-soft">
            <span className="flex items-center gap-1"><MailI size={14} />{c.email}</span>
            {c.phone && <span className="flex items-center gap-1"><PhoneI size={14} />{c.phone}</span>}
            <span>{c.city}{c.zip ? ` (${c.zip})` : ""} · {c.region}</span>
            <span>Contact depuis le {fr(c.createdAt)}</span>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Pill tone={s.lifecycle === "vip" ? "dark" : "info"}>{LIFECYCLE_LABEL[s.lifecycle]}</Pill>
            {s.segment && <Pill tone={SEG_TONE[s.segment]}>RFM : {RFM_LABEL[s.segment]}</Pill>}
            {s.orders > 0 && <Pill tone="ok">Club : {s.tier}</Pill>}
            {c.source === "demo" && <Pill tone="warn">Contact de démonstration</Pill>}
            {c.tags.map((t) => (
              <span key={t} className="hub-badge border border-line bg-white"><TagI size={11} />{t}
                <button aria-label={`Retirer le tag ${t}`} onClick={() => run("customer/update", { id: c.id, patch: { tags: c.tags.filter((x) => x !== t) } })}><XI size={10} /></button>
              </span>
            ))}
            <form onSubmit={(e) => { e.preventDefault(); if (tag.trim()) run("customer/update", { id: c.id, patch: { tags: [...c.tags, tag.trim()] } }, "Tag ajouté").then(() => setTag("")); }} className="flex items-center">
              <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="+ tag" aria-label="Ajouter un tag" className="w-24 rounded-full border border-dashed border-line bg-transparent px-2 py-0.5 text-xs outline-none focus:border-forest" />
            </form>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Valeur client (LTV)" value={eur(s.revenue)} hint="CA TTC net" />
        <Kpi label="Commandes" value={s.orders} hint={s.first ? `1ʳᵉ le ${fr(s.first)}` : "aucune"} />
        <Kpi label="Panier moyen" value={eur(s.aov, 2)} />
        <Kpi label="Marge brute générée" value={eur(d.margin)} hint="HT" />
        <Kpi label="Dernier achat" value={s.recencyDays === null ? "—" : `il y a ${s.recencyDays} j`} hint={fr(s.last)} />
        <Kpi label="Prochain achat estimé" value={s.nextOrder ? (daysTo! < 0 ? "en retard" : `dans ${daysTo} j`) : "—"} hint={s.avgInterval ? `cycle moyen ${s.avgInterval} j` : "pas encore de réachat"} tone={daysTo !== null && daysTo < -30 ? "warn" : undefined} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Activité" subtitle="Commandes, paniers, demandes SAV, notes et appels — du plus récent au plus ancien">
            <form onSubmit={(e) => { e.preventDefault(); run("customer/note", { customerId: c.id, kind, body: note }, "Activité enregistrée").then((r) => r && setNote("")); }} className="mb-5 rounded-lg border border-line bg-[#FAF9F6] p-3">
              <div className="mb-2 flex gap-1">
                {[["note", "Note"], ["appel", "Appel"], ["email", "E-mail"], ["sms", "SMS"]].map(([k, l]) => <button type="button" key={k} onClick={() => setKind(k)} className={clsx("rounded-md px-2.5 py-1 text-xs", kind === k ? "bg-forest text-white" : "bg-white text-forest-soft")}>{l}</button>)}
              </div>
              <textarea className="hub-input min-h-[70px]" placeholder={kind === "appel" ? "Compte rendu de l'appel…" : kind === "note" ? "Ajouter une note interne…" : "Résumé du message envoyé…"} value={note} onChange={(e) => setNote(e.target.value)} />
              <div className="mt-2 flex justify-end"><Button size="sm" variant="primary" type="submit" disabled={busy || !note.trim()}>Enregistrer</Button></div>
            </form>
            <ol className="relative space-y-4 border-l border-line pl-5">
              {d.timeline.map((t, i) => (
                <li key={i}>
                  <span className="absolute -left-[6px] mt-1 h-3 w-3 rounded-full border-2 border-white" style={{ background: KIND_DOT[t.kind] ?? "#5C6862" }} />
                  <p className="text-sm font-medium">{t.href ? <Link href={t.href} className="hover:underline">{t.title}</Link> : t.title} <span className="ml-1 text-xs font-normal text-forest-soft">{fr(t.at)} {t.at.slice(11, 16)}</span></p>
                  {t.body && <p className="text-sm text-forest-soft">{t.body}</p>}
                </li>
              ))}
            </ol>
          </Card>
          <Card title="Commandes" pad={false}>
            <table className="w-full text-sm">
              <thead className={thead}><tr><th className="px-4 py-2">N°</th><th className="px-3">Date</th><th className="px-3">Statut</th><th className="px-3 text-right">Articles</th><th className="px-4 text-right">Total</th></tr></thead>
              <tbody>{d.orders.map((o) => <tr key={o.id} className={trow}><td className="px-4 py-2"><Link className="font-medium hover:underline" href={`/crm/ventes?id=${o.id}`}>{o.number}</Link></td><td className="px-3 text-forest-soft">{fr(o.at)}</td><td className="px-3"><Pill tone={ORDER_TONE[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Pill></td><td className="px-3 text-right">{o.items}</td><td className="px-4 text-right font-medium tabular-nums">{eur(o.total, 2)}</td></tr>)}</tbody>
            </table>
            {!d.orders.length && <p className="p-5 text-sm text-forest-soft">Aucune commande : contact au stade {LIFECYCLE_LABEL[s.lifecycle].toLowerCase()}.</p>}
          </Card>
        </div>
        <div className="space-y-6">
          {s.segment && (
            <Card title="Score RFM" subtitle="Récence · Fréquence · Montant (1 à 5)">
              <div className="grid grid-cols-3 gap-2 text-center">
                {[["R", s.r, "Récence"], ["F", s.f, "Fréquence"], ["M", s.m, "Montant"]].map(([k, v, l]) => (
                  <div key={k as string} className="rounded-lg bg-[#F6F5F1] p-2"><p className="font-display text-2xl font-semibold">{v}</p><p className="text-[0.65rem] uppercase tracking-wide text-forest-soft">{l}</p></div>
                ))}
              </div>
              <p className="mt-3 text-sm"><b>Action recommandée :</b> {RFM_ACTION[s.segment]}</p>
            </Card>
          )}
          <Card title="Profil peau & consentements">
            <dl className="grid grid-cols-2 gap-y-1.5 text-sm">
              <dt className="text-forest-soft">Type de peau</dt>
              <dd><select aria-label="Type de peau" className="rounded border border-line bg-white px-1 py-0.5 text-sm" value={c.skinType} onChange={(e) => run("customer/update", { id: c.id, patch: { skinType: e.target.value } }, "Profil mis à jour")}>{Object.entries(SKIN_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></dd>
              <dt className="text-forest-soft">Préoccupations</dt><dd>{c.concerns.map((x) => concernLabels[x as Concern] ?? x).join(", ") || "—"}</dd>
              <dt className="text-forest-soft">Acquisition</dt><dd>{CHANNEL_LABEL[c.channel]}</dd>
              {c.birthYear > 0 && <><dt className="text-forest-soft">Âge</dt><dd>{new Date().getFullYear() - c.birthYear} ans</dd></>}
            </dl>
            <div className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
              <label className="flex items-center justify-between">E-mails marketing <input type="checkbox" checked={c.optinEmail} onChange={(e) => run("customer/update", { id: c.id, patch: { optinEmail: e.target.checked } }, "Consentement mis à jour")} /></label>
              <label className="flex items-center justify-between">SMS marketing <input type="checkbox" checked={c.optinSms} onChange={(e) => run("customer/update", { id: c.id, patch: { optinSms: e.target.checked } }, "Consentement mis à jour")} /></label>
              <p className="text-[0.7rem] text-forest-soft">Consentements RGPD : toute modification est tracée dans l'activité de la fiche.</p>
            </div>
          </Card>
          {d.products.length > 0 && <Card title="Produits achetés"><HBars items={d.products.map(([n, q]) => ({ label: n, value: q }))} format={(n) => `${n} u.`} /></Card>}
          <Card title="Recommandations" subtitle="Best-sellers adaptés à son profil, jamais achetés">
            <ul className="space-y-2 text-sm">{d.recos.map((p) => <li key={p.id} className="flex justify-between gap-2"><span><b>{p.name}</b> <span className="text-forest-soft">{p.kind}</span></span><span className="tabular-nums">{eur(p.price)}</span></li>)}</ul>
          </Card>
          <Card title="Tâches liées">
            <ul className="mb-3 space-y-1.5 text-sm">
              {d.tasks.map((t) => <li key={t.id} className="flex items-start gap-2"><input type="checkbox" className="mt-1" checked={t.done} onChange={() => run("task/toggle", { id: t.id })} aria-label={t.title} /><span className={clsx(t.done && "text-forest-soft line-through")}>{t.title} <span className="text-xs text-forest-soft">· {fr(t.due)}</span></span></li>)}
              {!d.tasks.length && <li className="text-forest-soft">Aucune tâche.</li>}
            </ul>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); run("task/save", { task: { title: task, type: "email", related: { kind: "client", id: c.id, label: s.name } } }, "Tâche créée").then((r) => r && setTask("")); }}>
              <input className="hub-input" placeholder="Nouvelle tâche (ex. rappeler)…" value={task} onChange={(e) => setTask(e.target.value)} />
              <Button type="submit" size="sm" icon={<PlusI size={14} />} disabled={!task.trim() || busy} aria-label="Ajouter la tâche" />
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
