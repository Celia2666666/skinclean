"use client";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { Button, Card, Drawer, Field, Modal, PageHeader } from "@/components/hub/ui";
import { MailI, PlusI } from "@/components/hub/icons";
import { Kpi, Pill, trow, useCrmAction, useParam, Empty } from "../ui";
import { AiBadge, AiPanel, initialDraft } from "../SupportAi";
import { TICKET_CHANNEL_LABEL, TICKET_STATUS_LABEL, type Ticket } from "@/lib/crm/types";
import type { supportData } from "@/lib/crm/pages";

type Data = Awaited<ReturnType<typeof supportData>>;
const dt = (s: string) => `${s.slice(8, 10)}/${s.slice(5, 7)} ${s.slice(11, 16)}`;
const ST: Record<Ticket["status"], string> = { ouvert: "warn", en_cours: "info", resolu: "ok" };

export function MessagesView({ data: d }: { data: Data }) {
  const set = useParam();
  const sp = useSearchParams();
  const status = sp.get("status") ?? "";
  const aiF = sp.get("ai") ?? "";
  const { run, busy } = useCrmAction();
  const [compose, setCompose] = useState<{ to: string; subject: string; body: string } | null>(null);
  const sel = d.selected?.ticket;
  return (
    <>
      <PageHeader eyebrow="Clients" title="Messages & contact" intro={<>Boîte de réception des messages envoyés depuis le formulaire « Nous contacter » du site (<Link href="/contact" target="_blank" className="underline">page Contact</Link>) et depuis le Glow Assistant (« Parler à l'équipe »). Réponds directement d'ici ou écris à n'importe quel contact.</>}
        actions={<Button variant="primary" icon={<PlusI size={15} />} onClick={() => setCompose({ to: "", subject: "", body: "" })}>Nouveau message</Button>} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Non lus / ouverts" value={d.counts.ouvert ?? 0} tone={(d.counts.ouvert ?? 0) ? "warn" : undefined} />
        <Kpi label="En cours" value={d.counts.en_cours ?? 0} />
        <Kpi label="Délai de 1ʳᵉ réponse" value={d.kpis.medianFirst === null ? "—" : d.kpis.medianFirst < 60 ? `${d.kpis.medianFirst} min` : `${(d.kpis.medianFirst / 60).toFixed(1).replace(".", ",")} h`} hint="médiane" />
        <Kpi label="Messages reçus" value={d.kpis.total} hint="formulaire + chatbot" />
      </div>
      <Card className="mt-6" pad={false}>
        <div className="flex flex-wrap gap-1.5 border-b border-line px-4 py-3">
          <button onClick={() => set({ status: null })} className={clsx("hub-badge border", !status ? "border-forest bg-forest text-white" : "border-line bg-white")}>Tous</button>
          {(["ouvert", "en_cours", "resolu"] as const).map((s) => <button key={s} onClick={() => set({ status: s })} className={clsx("hub-badge border", status === s ? "border-forest bg-forest text-white" : "border-line bg-white")}>{TICKET_STATUS_LABEL[s]} <span className="opacity-70">{d.counts[s] ?? 0}</span></button>)}
        </div>
        <div className="flex flex-wrap gap-1.5 border-b border-line bg-[#FAF9F6] px-4 py-2.5">
          <span className="mr-1 self-center text-[0.68rem] font-semibold uppercase tracking-wide text-forest-soft">Assistant SAV</span>
          <button onClick={() => set({ ai: aiF === "humain" ? null : "humain" })} className={clsx("hub-badge border", aiF === "humain" ? "border-[#8A2B2B] bg-[#8A2B2B] text-white" : "border-[#E8C8C8] bg-[#FBF1F1] text-[#7A2B2B]")}>⚠ À toi de répondre <span className="opacity-70">{d.ai.humain}</span></button>
          <button onClick={() => set({ ai: aiF === "verifier" ? null : "verifier" })} className={clsx("hub-badge border", aiF === "verifier" ? "border-[#6A4E2C] bg-[#6A4E2C] text-white" : "border-[#E3D5BE] bg-[#F6F1E8] text-[#6A4E2C]")}>Réponses auto à vérifier <span className="opacity-70">{d.ai.verifier}</span></button>
          <span className="ml-auto self-center text-[0.68rem] text-forest-soft">{d.ai.auto} réponse(s) automatique(s) · {d.ai.ia ? "rédaction par l'IA (Claude)" : "réponses types (ajoute ANTHROPIC_API_KEY pour l'IA)"}</span>
        </div>
        <ul>
          {d.rows.map((t) => (
            <li key={t.id} className={clsx(trow, "cursor-pointer")} onClick={() => set({ id: t.id }, false)}>
              <div className="flex items-start gap-3 px-5 py-3">
                <span className={clsx("mt-1.5 h-2 w-2 shrink-0 rounded-full", t.status === "ouvert" ? "bg-[#C2477A]" : "bg-transparent")} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm"><b>{t.customerName}</b><span className="text-xs text-forest-soft">{t.email}</span><Pill tone={t.channel === "chatbot" ? "violet" : "neutral"}>{TICKET_CHANNEL_LABEL[t.channel]}</Pill><AiBadge t={t} /></p>
                  <p className="text-sm font-medium">{t.subject}</p>
                  <p className="truncate text-sm text-forest-soft">{t.messages.at(-1)?.body}</p>
                </div>
                <div className="shrink-0 text-right"><Pill tone={ST[t.status]}>{TICKET_STATUS_LABEL[t.status]}</Pill><p className="mt-1 text-xs tabular-nums text-forest-soft">{dt(t.createdAt)}</p></div>
              </div>
            </li>
          ))}
        </ul>
        {!d.rows.length && <div className="p-5"><Empty>Aucun message.</Empty></div>}
      </Card>

      {sel && (
        <Thread key={sel.id} t={sel} order={d.selected?.order ?? null} busy={busy} onClose={() => set({ id: null }, false)}
          reply={(body, resolve) => run<{ message: string }>("ticket/reply", { id: sel.id, body, resolve }, (r) => r.message)}
          check={() => run("ticket/check", { id: sel.id }, "Réponse automatique vérifiée")}
          regenerate={(set) => run<{ ai: { draft: string }; message: string }>("ticket/ai", { id: sel.id }, (r) => { set(r.ai.draft); return r.message; })}
          setStatus={(s) => run("ticket/status", { id: sel.id, status: s }, "Statut mis à jour")} />
      )}
      {compose && (
        <Modal open onClose={() => setCompose(null)} title="Nouveau message" footer={<><Button onClick={() => setCompose(null)}>Annuler</Button><Button variant="primary" icon={<MailI size={14} />} disabled={busy || !compose.to || !compose.subject || !compose.body} onClick={() => run<{ message: string }>("message/compose", compose, (r) => r.message).then((r) => r && setCompose(null))}>Envoyer</Button></>}>
          <div className="space-y-3">
            <Field label="Destinataire (e-mail)"><input className="hub-input" type="email" value={compose.to} onChange={(e) => setCompose({ ...compose, to: e.target.value })} placeholder="client@exemple.fr" /></Field>
            <Field label="Objet"><input className="hub-input" value={compose.subject} onChange={(e) => setCompose({ ...compose, subject: e.target.value })} /></Field>
            <Field label="Message" hint="Envoyé avec le gabarit SKINCLEAN si Resend est configuré ; sinon enregistré sans envoi. Les adresses @example.com ne reçoivent jamais rien."><textarea className="hub-input min-h-[140px]" value={compose.body} onChange={(e) => setCompose({ ...compose, body: e.target.value })} /></Field>
          </div>
        </Modal>
      )}
    </>
  );
}

function Thread({ t, order, busy, onClose, reply, setStatus, check, regenerate }: { t: Ticket; order: { id: string; number: string } | null; busy: boolean; onClose: () => void; reply: (b: string, resolve: boolean) => Promise<unknown>; setStatus: (s: Ticket["status"]) => void; check: () => void; regenerate: (set: (s: string) => void) => void }) {
  const [body, setBody] = useState(() => initialDraft(t));
  const TEMPLATES = ["Bonjour, merci pour ton message ! ", "Bonjour, ta commande est bien partie : tu recevras le suivi par e-mail. ", "Bonjour, désolés pour ce désagrément : nous t'envoyons un nouveau produit sans frais. "];
  return (
    <Drawer open onClose={onClose} width="max-w-xl" title={<span className="flex items-center gap-2">{t.subject} <Pill tone={ST[t.status]}>{TICKET_STATUS_LABEL[t.status]}</Pill></span>}
      footer={<>{t.status !== "resolu" ? <Button className="mr-auto" disabled={busy} onClick={() => setStatus("resolu")}>Marquer résolu</Button> : <Button className="mr-auto" onClick={() => setStatus("ouvert")}>Rouvrir</Button>}<Button disabled={busy || !body.trim()} onClick={() => reply(body, false).then((r) => r && setBody(""))}>Répondre</Button><Button variant="primary" disabled={busy || !body.trim()} onClick={() => reply(body, true).then((r) => r && setBody(""))}>Répondre et clore</Button></>}>
      <p className="text-sm text-forest-soft">{t.number} · {TICKET_CHANNEL_LABEL[t.channel]} · {t.customerId ? <Link className="underline" href={`/crm/clients/${t.customerId}`}>{t.customerName}</Link> : t.customerName} · {t.email}{order && <> · <Link className="underline" href={`/crm/ventes?id=${order.id}`}>commande {order.number}</Link></>}</p>
      <ol className="mt-4 space-y-3">
        {t.messages.map((m, i) => <li key={i} className={clsx("max-w-[85%] rounded-xl px-4 py-2.5 text-sm", m.from === "client" ? "bg-white" : "ml-auto bg-forest text-white")}><p className="whitespace-pre-line">{m.body}</p><p className={clsx("mt-1 text-[0.65rem]", m.from === "client" ? "text-forest-soft" : "text-white/60")}>{m.from === "client" ? t.customerName : m.auto ? "Réponse automatique" : "SKINCLEAN"} · {dt(m.at)}</p></li>)}
      </ol>
      <AiPanel t={t} busy={busy} onUseDraft={setBody} onCheck={check} onRegenerate={() => regenerate(setBody)} />
      <div className="mt-4 flex flex-wrap gap-1.5">{TEMPLATES.map((x) => <button key={x} onClick={() => setBody((b) => b + x)} className="hub-badge border border-line bg-white hover:border-forest">{x.slice(0, 38)}…</button>)}</div>
      <textarea className="hub-input mt-2 min-h-[160px]" placeholder="Ta réponse (envoyée par e-mail au client)…" value={body} onChange={(e) => setBody(e.target.value)} />
    </Drawer>
  );
}
