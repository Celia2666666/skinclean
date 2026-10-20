"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Button, hubApi, useToast, useConfirm } from "./ui";
import { ArrowRightI, CheckI, SendI, SparkI } from "./icons";

interface Action { id: string; kind: string; label: string; summary: string; payload: Record<string, unknown> }
interface Msg { role: "user" | "assistant"; content: string; actions?: Action[]; links?: { label: string; href: string }[]; mode?: "ia" | "guide"; applied?: string[] }

export const COPILOT_SUGGESTIONS = [
  "Qu'est-ce que je publie aujourd'hui ?",
  "Quelles publications dois-je valider ?",
  "Prépare une publication Instagram sur Glow Shot",
  "Propose-moi une campagne pour le sérum hydratant",
  "Quelle est ma stratégie TikTok cette semaine ?",
  "Prépare-moi un calendrier pour novembre",
  "Quels contenus fonctionnent le mieux ?",
  "Comment améliorer mon SEO ?",
  "Prépare une newsletter pour la collection hiver",
];

const KEY = "hub-copilot-conversation";

/** Conversation avec le Marketing Copilot. Les actions proposées ne sont appliquées qu'après confirmation. */
export function CopilotChat({ compact = false, initial }: { compact?: boolean; initial?: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const router = useRouter();
  const { ask, dialog } = useConfirm();
  const sentInitial = useRef(false);

  useEffect(() => {
    try { const s = sessionStorage.getItem(KEY); if (s) setMsgs(JSON.parse(s)); } catch { /* stockage indisponible */ }
  }, []);
  useEffect(() => {
    try { sessionStorage.setItem(KEY, JSON.stringify(msgs.slice(-30))); } catch { /* stockage indisponible */ }
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    const next = [...msgs, { role: "user" as const, content: q }];
    setMsgs(next);
    setInput("");
    setLoading(true);
    try {
      const r = await hubApi<{ reply: string; actions: Action[]; links: Msg["links"]; mode: "ia" | "guide" }>("copilot/chat", { messages: next.map((m) => ({ role: m.role, content: m.content })) });
      setMsgs((m) => [...m, { role: "assistant", content: r.reply, actions: r.actions, links: r.links, mode: r.mode }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: "assistant", content: `Je n'ai pas pu répondre : ${(e as Error).message}` }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initial && !sentInitial.current) { sentInitial.current = true; send(initial); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  const apply = async (msgIndex: number, a: Action) => {
    const ok = await ask("Appliquer cette proposition ?", <><p className="font-medium text-forest">{a.label}</p><p className="mt-2 whitespace-pre-line">{a.summary}</p><p className="mt-3">Les contenus seront créés en <strong>brouillon</strong> : rien n'est publié ni dépensé.</p></>, "Oui, créer");
    if (!ok) return;
    try {
      const r = await hubApi<{ message: string; href?: string }>("copilot/apply", { action: a });
      toast("ok", r.message);
      setMsgs((m) => m.map((x, i) => (i === msgIndex ? { ...x, applied: [...(x.applied ?? []), a.id] } : x)));
      router.refresh();
      if (r.href) setMsgs((m) => [...m, { role: "assistant", content: r.message, links: [{ label: "Ouvrir", href: r.href! }] }]);
    } catch (e) {
      toast("err", (e as Error).message);
    }
  };

  return (
    <div className={clsx("flex h-full min-h-0 flex-col", !compact && "hub-card")}>
      {dialog}
      <div className="hub-scroll min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {!msgs.length && (
          <div>
            <div className="flex items-center gap-2 text-sm text-forest-soft"><SparkI size={16} /> Je lis ton calendrier, tes campagnes et tes statistiques pour t'aider.</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {COPILOT_SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border border-line bg-white px-3 py-1.5 text-left text-xs transition hover:border-forest">{s}</button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={clsx("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div className={clsx("max-w-[92%] rounded-xl px-4 py-3 text-sm leading-relaxed", m.role === "user" ? "bg-forest text-white" : "border border-line bg-white")}>
              {m.role === "assistant" && m.mode && <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-wider text-forest-soft">{m.mode === "ia" ? "Copilot · IA (Claude)" : "Copilot · mode guidé"}</p>}
              <div className="whitespace-pre-line">{m.content}</div>
              {!!m.actions?.length && (
                <div className="mt-3 space-y-2">
                  {m.actions.map((a) => {
                    const done = m.applied?.includes(a.id);
                    return (
                      <div key={a.id} className="rounded-lg border border-sage bg-sage-soft p-3">
                        <p className="text-xs font-semibold">{a.label}</p>
                        <p className="mt-1 line-clamp-4 whitespace-pre-line text-xs text-forest-soft">{a.summary}</p>
                        <Button size="sm" variant={done ? "soft" : "primary"} disabled={done} className="mt-2" icon={done ? <CheckI size={14} /> : undefined} onClick={() => apply(i, a)}>{done ? "Appliqué" : "Appliquer (avec confirmation)"}</Button>
                      </div>
                    );
                  })}
                </div>
              )}
              {!!m.links?.length && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {m.links.map((l) => <Link key={l.href + l.label} href={l.href} className="inline-flex items-center gap-1 text-xs font-medium underline underline-offset-2">{l.label} <ArrowRightI size={12} /></Link>)}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && <div className="text-sm text-forest-soft">Le Copilot prépare sa réponse…</div>}
        <div ref={end} />
      </div>
      <form className="flex gap-2 border-t border-line bg-white p-3" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Demande-moi une publication, une campagne, un calendrier…" className="hub-input" aria-label="Message au Copilot" />
        <Button type="submit" variant="primary" disabled={loading || !input.trim()} icon={<SendI size={15} />} aria-label="Envoyer" />
        {msgs.length > 0 && <Button variant="ghost" onClick={() => setMsgs([])} title="Nouvelle conversation">Effacer</Button>}
      </form>
    </div>
  );
}
