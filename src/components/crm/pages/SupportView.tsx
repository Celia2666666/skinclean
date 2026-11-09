"use client";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { Button, Card, Drawer, PageHeader } from "@/components/hub/ui";
import { HBars, pctf } from "../charts";
import { AiBadge, AiPanel, initialDraft } from "../SupportAi";
import { Kpi, ORDER_TONE, Pill, thead, trow, useCrmAction, useParam } from "../ui";
import { ORDER_STATUS_LABEL, TICKET_CATEGORY_LABEL, TICKET_CHANNEL_LABEL, TICKET_STATUS_LABEL, type Ticket } from "@/lib/crm/types";
import type { supportData } from "@/lib/crm/pages";

type Data = Awaited<ReturnType<typeof supportData>>;
const dt = (s: string) => `${s.slice(8, 10)}/${s.slice(5, 7)} ${s.slice(11, 16)}`;
const ST: Record<Ticket["status"], string> = { ouvert: "warn", en_cours: "info", resolu: "ok" };
const PR: Record<Ticket["priority"], string> = { urgente: "bad", haute: "warn", normale: "neutral", basse: "neutral" };
const CH = TICKET_CHANNEL_LABEL;
const dur = (min: number | null) => (min === null ? "—" : min < 60 ? `${Math.round(min)} min` : `${(min / 60).toFixed(1).replace(".", ",")} h`);

export function SupportView({ data: d }: { data: Data }) {
  const set = useParam();
  const sp = useSearchParams();
  const status = sp.get("status") ?? "";
  const aiF = sp.get("ai") ?? "";
  const k = d.kpis;
  return (
    <>
      <PageHeader eyebrow="Clients" title="Service client" intro="Demandes reçues par e-mail, chat, Instagram et téléphone, liées à la commande concernée. Délais de réponse et satisfaction." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Demandes ouvertes" value={k.open} tone={k.open ? "warn" : undefined} hint={`${k.total} au total`} />
        <Kpi label="1ʳᵉ réponse (médiane)" value={dur(k.medianFirst)} />
        <Kpi label="Délai de résolution" value={k.resolution === null ? "—" : `${k.resolution.toFixed(0)} h`} hint="moyenne" />
        <Kpi label="CSAT" value={k.csat ? `${k.csat.toFixed(2).replace(".", ",")} / 5` : "—"} hint="note de satisfaction" />
        <Kpi label="Clients satisfaits" value={pctf(k.satisfied, 0)} hint="note ≥ 4" />
        <Kpi label="Motif n°1" value={d.categories[0] ? TICKET_CATEGORY_LABEL[d.categories[0][0] as Ticket["category"]] : "—"} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" pad={false}>
          <div className="flex flex-wrap gap-1.5 border-b border-line px-4 py-3">
            <button onClick={() => set({ status: null })} className={clsx("hub-badge border", !status ? "border-forest bg-forest text-white" : "border-line bg-white")}>Toutes</button>
            {(["ouvert", "en_cours", "resolu"] as const).map((s) => <button key={s} onClick={() => set({ status: s })} className={clsx("hub-badge border", status === s ? "border-forest bg-forest text-white" : "border-line bg-white")}>{TICKET_STATUS_LABEL[s]} <span className="opacity-70">{d.counts[s] ?? 0}</span></button>)}
          </div>
        <div className="flex flex-wrap gap-1.5 border-b border-line bg-[#FAF9F6] px-4 py-2.5">
          <span className="mr-1 self-center text-[0.68rem] font-semibold uppercase tracking-wide text-forest-soft">Assistant SAV</span>
          <button onClick={() => set({ ai: aiF === "humain" ? null : "humain" })} className={clsx("hub-badge border", aiF === "humain" ? "border-[#8A2B2B] bg-[#8A2B2B] text-white" : "border-[#E8C8C8] bg-[#FBF1F1] text-[#7A2B2B]")}>⚠ À toi de répondre <span className="opacity-70">{d.ai.humain}</span></button>
          <button onClick={() => set({ ai: aiF === "verifier" ? null : "verifier" })} className={clsx("hub-badge border", aiF === "verifier" ? "border-[#6A4E2C] bg-[#6A4E2C] text-white" : "border-[#E3D5BE] bg-[#F6F1E8] text-[#6A4E2C]")}>Réponses auto à vérifier <span className="opacity-70">{d.ai.verifier}</span></button>
          <span className="ml-auto self-center text-[0.68rem] text-forest-soft">{d.ai.auto} réponse(s) automatique(s) · {d.ai.ia ? "rédaction par l'IA (Claude)" : "réponses types (ajoute ANTHROPIC_API_KEY pour l'IA)"}</span>
        </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className={thead}><tr><th className="px-4 py-2.5">Demande</th><th className="px-3">Client</th><th className="px-3">Canal</th><th className="px-3">Priorité</th><th className="px-3">Statut</th><th className="px-4">Reçue</th></tr></thead>
              <tbody>{d.rows.map((t) => (
                <tr key={t.id} className={clsx(trow, "cursor-pointer")} onClick={() => set({ id: t.id }, false)}>
                  <td className="px-4 py-2"><span className="font-medium">{t.subject}</span> <AiBadge t={t} /><span className="block text-xs text-forest-soft">{t.number} · {TICKET_CATEGORY_LABEL[t.category]}</span></td>
                  <td className="px-3">{t.customerName}</td><td className="px-3 text-forest-soft">{CH[t.channel]}</td>
                  <td className="px-3"><Pill tone={PR[t.priority]}>{t.priority}</Pill></td><td className="px-3"><Pill tone={ST[t.status]}>{TICKET_STATUS_LABEL[t.status]}</Pill></td>
                  <td className="px-4 tabular-nums text-forest-soft">{dt(t.createdAt)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Card>
        <Card title="Motifs de contact" subtitle="Pour corriger la cause à la source (FAQ, fiches produit, emballage)">
          <HBars items={d.categories.map(([c, n]) => ({ label: TICKET_CATEGORY_LABEL[c as Ticket["category"]], value: n }))} format={(n) => `${n}`} />
        </Card>
      </div>
      {d.selected && <TicketDrawer key={d.selected.ticket.id} sel={d.selected} onClose={() => set({ id: null }, false)} />}
    </>
  );
}

function TicketDrawer({ sel, onClose }: { sel: NonNullable<Data["selected"]>; onClose: () => void }) {
  const t = sel.ticket;
  const { run, busy } = useCrmAction();
  const [reply, setReply] = useState(() => initialDraft(t));
  return (
    <Drawer open onClose={onClose} width="max-w-xl" title={<span className="flex items-center gap-2">{t.subject} <Pill tone={ST[t.status]}>{TICKET_STATUS_LABEL[t.status]}</Pill></span>}
      footer={t.status !== "resolu" || reply ? <><Button disabled={busy} onClick={() => run("ticket/status", { id: t.id, status: "resolu" }, "Demande résolue")}>Clore sans réponse</Button><Button disabled={busy || !reply.trim()} onClick={() => run<{ message: string }>("ticket/reply", { id: t.id, body: reply }, (r) => r.message).then((r) => r && setReply(""))}>Répondre</Button><Button variant="primary" disabled={busy || !reply.trim()} onClick={() => run<{ message: string }>("ticket/reply", { id: t.id, body: reply, resolve: true }, (r) => r.message).then((r) => r && setReply(""))}>Répondre et résoudre</Button></> : <Button onClick={() => run("ticket/status", { id: t.id, status: "ouvert" }, "Demande rouverte")}>Rouvrir</Button>}>
      <p className="text-sm text-forest-soft">{t.number} · {CH[t.channel]} · {t.customerId ? <Link className="underline" href={`/crm/clients/${t.customerId}`}>{t.customerName}</Link> : <span>{t.customerName}{t.email && ` (${t.email})`}</span>} · reçue le {dt(t.createdAt)}{t.firstResponseMin !== undefined && ` · 1ʳᵉ réponse en ${dur(t.firstResponseMin)}`}</p>
      {sel.order && <Link href={`/crm/ventes?id=${sel.order.id}`} className="hub-card mt-3 flex items-center justify-between gap-3 p-3 text-sm hover:border-forest"><span>Commande <b>{sel.order.number}</b>{sel.order.tracking && ` · suivi ${sel.order.tracking}`}</span><Pill tone={ORDER_TONE[sel.order.status]}>{ORDER_STATUS_LABEL[sel.order.status]}</Pill></Link>}
      <ol className="mt-4 space-y-3">
        {t.messages.map((m, i) => (
          <li key={i} className={clsx("max-w-[85%] rounded-xl px-4 py-2.5 text-sm", m.from === "client" ? "bg-white" : "ml-auto bg-forest text-white")}>
            <p className="whitespace-pre-line">{m.body}</p><p className={clsx("mt-1 text-[0.65rem]", m.from === "client" ? "text-forest-soft" : "text-white/60")}>{m.from === "client" ? t.customerName : m.auto ? "Réponse automatique" : "SKINCLEAN"} · {dt(m.at)}</p>
          </li>
        ))}
      </ol>
      <AiPanel t={t} busy={busy} onUseDraft={setReply} onCheck={() => run("ticket/check", { id: t.id }, "Réponse automatique vérifiée")} onRegenerate={() => run<{ ai: { draft: string }; message: string }>("ticket/ai", { id: t.id }, (r) => { setReply(r.ai.draft); return r.message; })} />
      {t.csat && <p className="mt-4 text-sm">Satisfaction : <b>{"★".repeat(t.csat)}{"☆".repeat(5 - t.csat)}</b></p>}
      {(t.status !== "resolu" || reply) && <textarea className="hub-input mt-4 min-h-[160px]" placeholder="Ta réponse… (enregistrée dans l'historique ; les contacts de démonstration ne reçoivent aucun e-mail)" value={reply} onChange={(e) => setReply(e.target.value)} />}
    </Drawer>
  );
}
