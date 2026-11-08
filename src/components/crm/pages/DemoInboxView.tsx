"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { Button, Card, PageHeader } from "@/components/hub/ui";
import { MailI, TrashI } from "@/components/hub/icons";
import { Pill, useCrmAction, useParam, Empty } from "../ui";
import { DELIVERY_LABEL, MAIL_KIND, type MailDoc, type MailKind } from "@/lib/crm/types";

const dt = (s: string) => `${s.slice(8, 10)}/${s.slice(5, 7)} ${s.slice(11, 16)}`;
const TONE = { envoye: "ok", simule: "neutral", echec: "bad" } as const;

const KIND_TONE: Record<MailKind, string> = { sav: "info", cart: "warn", back_in_stock: "ok", new_product: "violet", welcome: "dark", review: "neutral", replenish: "ok", winback: "bad", message: "neutral" };
const kindLabel = (k?: MailKind) => MAIL_KIND.find((x) => x.id === k)?.label ?? "Autre";

export function DemoInboxView({ mails, selected, inbox, redirect, resend, siteOrigin, counts, total, cat }: { mails: Omit<MailDoc, "html">[]; selected: MailDoc | null; inbox: string; redirect: boolean; resend: boolean; siteOrigin: string; counts: Partial<Record<MailKind, number>>; total: number; cat: string }) {
  const set = useParam();
  const { run, busy } = useCrmAction();
  // Les images de l'e-mail pointent vers l'adresse publique du site : on les sert depuis ce serveur local pour l'aperçu
  const [origin, setOrigin] = useState<string | null>(null);
  useEffect(() => setOrigin(window.location.origin), []);
  return (
    <>
      <PageHeader eyebrow="Automatisation" title="Boîte mail de démo" intro={<>Tous les e-mails produits par le CRM (automatisations, relances de paniers, alertes de retour en stock, réponses aux messages) arrivent ici, exactement tels que le client les recevrait. Adresse de démonstration : <b className="text-forest">{inbox}</b>{redirect && resend ? " — copie réellement envoyée à cette adresse." : "."} <Link href="/crm/parametres" className="underline">Modifier</Link></>}
        actions={<><Button icon={<MailI size={15} />} variant="primary" disabled={busy} onClick={() => run<{ message: string }>("mail/test", {}, (r) => r.message)}>Générer des e-mails de test</Button><Button icon={<TrashI size={15} />} disabled={busy || !mails.length} onClick={() => run("mail/clear", {}, "Boîte vidée")}>Vider</Button></>} />
      {!resend && <p className="mb-5 rounded-lg border border-line bg-white px-4 py-2.5 text-xs text-forest-soft">Resend n'est pas configuré : les e-mails sont générés et visibles ici, mais aucun ne quitte l'ordinateur. Pour les recevoir dans une vraie boîte, ajoute <code>RESEND_API_KEY</code> puis indique ton adresse comme adresse de démo dans Paramètres.</p>}
      <div className="mb-4 flex flex-wrap gap-1.5" role="tablist" aria-label="Catégories d'e-mails">
        <button role="tab" aria-selected={!cat} onClick={() => set({ cat: null, id: null })} className={clsx("hub-badge border px-3 py-1", !cat ? "border-forest bg-forest text-white" : "border-line bg-white")}>Tous <span className="opacity-70">{total}</span></button>
        {MAIL_KIND.map((k) => (
          <button key={k.id} role="tab" aria-selected={cat === k.id} onClick={() => set({ cat: k.id, id: null })} className={clsx("hub-badge border px-3 py-1", cat === k.id ? "border-forest bg-forest text-white" : "border-line bg-white", !counts[k.id] && "opacity-50")}>{k.label} <span className="opacity-70">{counts[k.id] ?? 0}</span></button>
        ))}
      </div>
      {!mails.length ? <Empty>Aucun e-mail pour l'instant. Clique sur « Générer des e-mails de test », réceptionne un réassort (alertes de retour en stock) ou relance un panier abandonné.</Empty> : (
        <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
          <Card pad={false} className="max-h-[75vh] overflow-y-auto">
            <ul>
              {mails.map((m) => (
                <li key={m.id}>
                  <button onClick={() => set({ id: m.id })} className={clsx("block w-full border-b border-line px-4 py-3 text-left hover:bg-[#FAF9F6]", selected?.id === m.id && "bg-sage-soft")}>
                    <p className="flex items-center justify-between gap-2 text-xs text-forest-soft"><span className="truncate">À : {m.to}</span><span className="shrink-0 tabular-nums">{dt(m.at)}</span></p>
                    <p className="truncate text-sm font-semibold">{m.subject}</p>
                    <p className="flex items-center gap-2 text-xs text-forest-soft"><Pill tone={KIND_TONE[m.kind ?? "message"]}>{kindLabel(m.kind)}</Pill><span className="truncate">{m.origin}</span><Pill tone={TONE[m.delivery]}>{DELIVERY_LABEL[m.delivery]}</Pill></p>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
          {selected && (
            <Card title={selected.subject} subtitle={<>À : {selected.to}{selected.deliveredTo && selected.deliveredTo !== selected.to ? ` · livré dans ${selected.deliveredTo}` : ""} · {dt(selected.at)} · {selected.origin} · {selected.detail}</>} pad={false}>
              <iframe title={`Aperçu : ${selected.subject}`} srcDoc={origin ? selected.html.split(siteOrigin).join(origin) : selected.html} sandbox="allow-same-origin" className="h-[70vh] w-full rounded-b-[10px] bg-[#F4F3EF]" />
            </Card>
          )}
        </div>
      )}
    </>
  );
}
