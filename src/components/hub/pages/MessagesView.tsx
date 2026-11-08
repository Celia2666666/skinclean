"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import type { Ticket } from "@/lib/hub/types";
import { Button, Card, Empty, Field, Modal, PageHeader, StatusBadge, uploadFiles, useAction, useCan, useToast, useUser } from "../ui";
import { ChatI, PaperclipI, PlusI, SendI } from "../icons";

export const TICKET_TYPES = ["Question", "Modification de publication", "Nouveau visuel", "Demande de campagne", "Modification du site", "Problème technique", "Nouvelle idée"];
const PRIORITY: Record<Ticket["priority"], string> = { basse: "bg-[#F1F0EC] text-[#5C6862]", normale: "bg-[#E2ECF8] text-[#1F4E86]", haute: "bg-[#FFF3D6] text-[#7A5B00]", urgente: "bg-[#F8E1E1] text-[#8A2B2B]" };

export function MessagesView({ tickets }: { tickets: Ticket[] }) {
  const sp = useSearchParams();
  const [sel, setSel] = useState<string | null>(sp.get("id") ?? tickets[0]?.id ?? null);
  const [filter, setFilter] = useState<"" | "ouverts" | "fermes">("ouverts");
  const [create, setCreate] = useState(false);
  const shown = tickets.filter((t) => !filter || (filter === "ouverts" ? !["resolu", "ferme"].includes(t.status) : ["resolu", "ferme"].includes(t.status)));
  const current = tickets.find((t) => t.id === sel) ?? null;
  return (
    <div>
      <PageHeader eyebrow="Équipe marketing" title="Messages & demandes" intro="Pose une question, demande une modification ou un nouveau visuel, propose une idée : chaque demande crée un ticket numéroté avec son historique d'échanges."
        actions={<Button variant="primary" icon={<PlusI size={15} />} onClick={() => setCreate(true)}>Nouvelle demande</Button>} />
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <div>
          <div className="mb-3 flex gap-1.5">{([["ouverts", "En cours"], ["fermes", "Résolues"], ["", "Toutes"]] as const).map(([v, l]) => <button key={v} onClick={() => setFilter(v)} className={clsx("hub-badge border py-1", filter === v ? "border-forest bg-forest text-white" : "border-line bg-white")}>{l}</button>)}</div>
          <div className="space-y-2">
            {!shown.length && <Empty title="Aucune demande" />}
            {shown.map((t) => (
              <button key={t.id} onClick={() => setSel(t.id)} className={clsx("hub-card block w-full p-3 text-left hover:border-forest", sel === t.id && "border-forest ring-1 ring-forest")}>
                <div className="flex items-center justify-between gap-2 text-xs"><span className="font-semibold text-forest-soft">#{t.number} · {t.type}</span><StatusBadge status={t.status} /></div>
                <p className="mt-1 text-sm font-medium">{t.subject}</p>
                <p className="mt-1 flex items-center justify-between text-xs text-forest-soft"><span>{t.messages.length} message(s) · {new Date(t.updatedAt).toLocaleDateString("fr-FR")}</span><span className={clsx("hub-badge", PRIORITY[t.priority])}>{t.priority}</span></p>
              </button>
            ))}
          </div>
        </div>
        {current ? <Thread key={current.id} ticket={current} /> : <Empty icon={<ChatI size={28} />} title="Sélectionne une demande" />}
      </div>
      <NewTicket open={create} onClose={() => setCreate(false)} onCreated={(id) => { setSel(id); setFilter("ouverts"); }} />
    </div>
  );
}

function Attach({ files, setFiles }: { files: { name: string; url: string; size: number }[]; setFiles: (f: { name: string; url: string; size: number }[]) => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className={clsx("hub-btn hub-btn-secondary hub-btn-sm cursor-pointer", busy && "opacity-50")}><PaperclipI size={14} />{busy ? "Envoi…" : "Joindre un fichier"}
        <input type="file" multiple className="sr-only" accept="image/*,video/*,application/pdf,text/plain" onChange={async (e) => { if (!e.target.files?.length) return; setBusy(true); try { const up = await uploadFiles(e.target.files, "demandes"); setFiles([...files, ...up]); } catch (err) { toast("err", (err as Error).message); } finally { setBusy(false); e.target.value = ""; } }} />
      </label>
      {files.map((f) => <span key={f.url} className="hub-badge border border-line bg-white">{f.name}<button type="button" aria-label="Retirer" onClick={() => setFiles(files.filter((x) => x.url !== f.url))}>×</button></span>)}
    </div>
  );
}

function NewTicket({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const [d, setD] = useState({ type: TICKET_TYPES[0], subject: "", description: "", priority: "normale" as Ticket["priority"] });
  const [files, setFiles] = useState<{ name: string; url: string; size: number }[]>([]);
  const { run, busy } = useAction();
  return (
    <Modal open={open} onClose={onClose} title="Nouvelle demande"
      footer={<><Button onClick={onClose}>Annuler</Button><Button variant="primary" disabled={busy || !d.subject || !d.description} onClick={async () => { const t = await run<Ticket>("tickets/create", { ...d, attachments: files }, (x) => `Demande #${x.number} envoyée à l'équipe marketing`); if (t) { onCreated(t.id); setD({ type: TICKET_TYPES[0], subject: "", description: "", priority: "normale" }); setFiles([]); onClose(); } }}>Envoyer la demande</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type de demande"><select className="hub-input" value={d.type} onChange={(e) => setD({ ...d, type: e.target.value })}>{TICKET_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Priorité"><select className="hub-input" value={d.priority} onChange={(e) => setD({ ...d, priority: e.target.value as Ticket["priority"] })}><option value="basse">Basse</option><option value="normale">Normale</option><option value="haute">Haute</option><option value="urgente">Urgente</option></select></Field>
        <Field label="Sujet" className="sm:col-span-2"><input className="hub-input" value={d.subject} onChange={(e) => setD({ ...d, subject: e.target.value })} /></Field>
        <Field label="Description" className="sm:col-span-2"><textarea className="hub-input min-h-32" value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} placeholder="Décris ta demande : contexte, contenu concerné, échéance souhaitée…" /></Field>
        <div className="sm:col-span-2"><p className="hub-label">Pièces jointes</p><Attach files={files} setFiles={setFiles} /></div>
      </div>
    </Modal>
  );
}

function Thread({ ticket: t }: { ticket: Ticket }) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<{ name: string; url: string; size: number }[]>([]);
  const { run, busy } = useAction();
  const allowed = useCan();
  const me = useUser();
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [t.messages.length]);
  const team = allowed("tickets.manage");
  return (
    <Card pad={false}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-5">
        <div>
          <p className="text-xs font-semibold text-forest-soft">Demande #{t.number} · {t.type} · ouverte le {new Date(t.createdAt).toLocaleDateString("fr-FR")}</p>
          <h2 className="mt-1 font-display text-xl font-semibold">{t.subject}</h2>
          {t.assignee && <p className="text-xs text-forest-soft">Suivie par {t.assignee}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={clsx("hub-badge", PRIORITY[t.priority])}>Priorité {t.priority}</span>
          {team ? (
            <select className="hub-input w-auto py-1" value={t.status} onChange={(e) => run("tickets/status", { id: t.id, status: e.target.value }, "Statut mis à jour")} aria-label="Statut">
              {[["ouvert", "Ouvert"], ["en_cours", "En cours"], ["en_attente", "En attente du client"], ["resolu", "Résolu"], ["ferme", "Fermé"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ) : (
            <>
              <StatusBadge status={t.status} />
              {!["resolu", "ferme"].includes(t.status) ? <Button size="sm" onClick={() => run("tickets/status", { id: t.id, status: "resolu" }, "Demande marquée comme résolue")}>Marquer comme résolue</Button> : <Button size="sm" onClick={() => run("tickets/status", { id: t.id, status: "ouvert" }, "Demande rouverte")}>Rouvrir</Button>}
            </>
          )}
        </div>
      </div>
      <div className="hub-scroll max-h-[560px] space-y-3 overflow-y-auto bg-cream p-5">
        {t.messages.map((m) => {
          const mine = m.author === me.name;
          return (
            <div key={m.id} className={clsx("flex", mine ? "justify-end" : "justify-start")}>
              <div className={clsx("max-w-[85%] rounded-xl px-4 py-3 text-sm", mine ? "bg-forest text-white" : m.role === "equipe" ? "border border-sage bg-sage-soft" : "border border-line bg-white")}>
                <p className={clsx("mb-1 text-[0.68rem]", mine ? "text-white/70" : "text-forest-soft")}>{m.author}{m.role === "equipe" ? " · équipe marketing" : ""} · {new Date(m.at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</p>
                <p className="whitespace-pre-line">{m.text}</p>
                {!!m.attachments?.length && <div className="mt-2 flex flex-wrap gap-1.5">{m.attachments.map((a) => <a key={a.url} href={a.url} target="_blank" rel="noreferrer" className={clsx("hub-badge border", mine ? "border-white/40 text-white" : "border-line bg-white")}><PaperclipI size={11} />{a.name}</a>)}</div>}
              </div>
            </div>
          );
        })}
        <div ref={end} />
      </div>
      {!!t.attachments.length && <div className="border-t border-line px-5 py-3"><p className="hub-label">Pièces jointes du dossier</p><div className="flex flex-wrap gap-1.5">{t.attachments.map((a) => <a key={a.url} href={a.url} target="_blank" rel="noreferrer" className="hub-badge border border-line bg-white"><PaperclipI size={11} />{a.name}</a>)}</div></div>}
      <form className="space-y-2 border-t border-line p-4" onSubmit={async (e) => { e.preventDefault(); if (!text.trim()) return; const r = await run("tickets/reply", { id: t.id, text, attachments: files }, "Message envoyé"); if (r) { setText(""); setFiles([]); } }}>
        <textarea className="hub-input min-h-20" placeholder={me.role === "marketing" ? "Répondre au client…" : "Écrire à l'équipe marketing…"} value={text} onChange={(e) => setText(e.target.value)} />
        <div className="flex items-center justify-between gap-2"><Attach files={files} setFiles={setFiles} /><Button type="submit" variant="primary" icon={<SendI size={14} />} disabled={busy || !text.trim()}>Envoyer</Button></div>
      </form>
    </Card>
  );
}
