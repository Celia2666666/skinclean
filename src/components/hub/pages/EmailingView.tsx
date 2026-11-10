"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { products } from "@/data/products";
import type { EmailBlock, EmailCampaign } from "@/lib/hub/types";
import { renderEmailHtml } from "@/lib/hub/email-html";
import { tplBanner } from "@/lib/hub/templates";
import { frDay } from "@/lib/hub/dates";
import { Button, Card, Empty, Field, Modal, Notice, PageHeader, StatusBadge, hubApi, uploadFiles, useAction, useCan, useConfirm, useToast } from "../ui";
import { designToDataUrl } from "../design/render";
import { DesignPreview } from "../design/DesignPreview";
import { CheckI, ChevronDownI, ClockI, CopyI, MailI, PlusI, SendI, TrashI, UploadI } from "../icons";

const BLOCK_LABEL: Record<EmailBlock["type"], string> = { hero: "Visuel d'en-tête", title: "Titre", text: "Texte", button: "Bouton (CTA)", products: "Produits", image: "Image", divider: "Séparateur", code: "Code / offre" };
const newBlock = (type: EmailBlock["type"]): EmailBlock => {
  const id = `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  switch (type) {
    case "hero": return { id, type, design: tplBanner({ format: "newsletter", headline: "Ton titre", eyebrow: "Newsletter", sub: "Ton sous-titre" }), alt: "SKINCLEAN" };
    case "title": return { id, type, text: "Un titre" };
    case "text": return { id, type, text: "Ton texte." };
    case "button": return { id, type, text: "Découvrir", href: "/" };
    case "products": return { id, type, productIds: ["sc-sr-01"] };
    case "image": return { id, type, src: "/media/videos/hero-poster.webp", alt: "" };
    case "divider": return { id, type };
    case "code": return { id, type, code: "BIENVENUE", text: "Conditions de l'offre." };
  }
};

export function EmailingView({ emails, campaigns, provider, baseUrl, userEmail }: {
  emails: EmailCampaign[]; campaigns: { id: string; name: string }[]; provider: { resend: boolean; segment: boolean; from: string }; baseUrl: string; userEmail: string;
}) {
  const sp = useSearchParams();
  const [selId, setSelId] = useState<string | null>(sp.get("id") ?? emails[0]?.id ?? null);
  const [newOpen, setNewOpen] = useState(false);
  const { run, busy } = useAction();
  const allowed = useCan();
  const models = emails.filter((m) => m.template && m.template !== "Libre" && m.template !== "Copilot");
  const sel = emails.find((m) => m.id === selId) ?? null;

  return (
    <div>
      <PageHeader eyebrow="E-mailing" title="E-mailing & newsletters" intro="Des modèles SKINCLEAN prêts à l'emploi : objet, préheader, visuel, texte, CTA, aperçus mobile et ordinateur. Brouillon, validation, programmation et envoi via le fournisseur configuré."
        actions={allowed("content.edit") && <Button variant="primary" icon={<PlusI size={15} />} onClick={() => setNewOpen(true)}>Nouvel e-mail</Button>} />
      {provider.resend && <div className="mb-4">
        <Notice tone="ok">
          <>Fournisseur <strong>Resend</strong> connecté{provider.from ? ` (expéditeur ${provider.from})` : ""}. {provider.segment ? "Segment de diffusion configuré : l'envoi et la programmation sont réels." : "Aucun segment de diffusion (RESEND_SEGMENT_ID) : seuls les envois de test sont possibles."}</>
        </Notice>
      </div>}
      <div className="grid gap-5 xl:grid-cols-[300px_1fr]">
        <div className="space-y-2">
          {emails.map((m) => (
            <button key={m.id} onClick={() => setSelId(m.id)} className={clsx("hub-card flex w-full items-stretch overflow-hidden text-left hover:border-forest", selId === m.id && "border-forest ring-1 ring-forest")}>
              <span className="flex w-28 shrink-0 items-center bg-sage-soft">{(() => { const hero = m.blocks.find((b) => b.type === "hero") as Extract<EmailBlock, { type: "hero" }> | undefined; return hero?.design ? <DesignPreview design={hero.design} width={112} /> : <MailI className="mx-auto text-forest-soft" />; })()}</span>
              <div className="min-w-0 flex-1 p-3">
              <div className="flex items-center justify-between gap-2"><span className="text-[0.68rem] uppercase tracking-wider text-forest-soft">{m.template}</span><StatusBadge status={m.status} /></div>
              <p className="mt-1 text-sm font-medium">{m.name}</p>
              <p className="line-clamp-1 text-xs text-forest-soft">{m.subject}</p>
              {m.scheduledAt && <p className="mt-1 text-xs text-[#1F4E86]">Prévue le {frDay(m.scheduledAt)} à {m.scheduledAt.slice(11, 16)}</p>}
              </div>
            </button>
          ))}
        </div>
        {sel ? <EmailEditor key={sel.id + sel.updatedAt} email={sel} campaigns={campaigns} provider={provider} baseUrl={baseUrl} userEmail={userEmail} onDeleted={() => setSelId(null)} /> : <Empty icon={<MailI size={28} />} title="Sélectionne un e-mail" />}
      </div>
      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Nouvel e-mail" size="lg">
        <p className="mb-4 text-sm text-forest-soft">Pars d&apos;un modèle SKINCLEAN (copie modifiable) ou d&apos;une page vierge.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <button disabled={busy} onClick={async () => { const r = await run<EmailCampaign>("emails/create", { name: "Nouvel e-mail" }, "E-mail créé"); if (r) { setNewOpen(false); setSelId(r.id); } }} className="hub-card grid min-h-32 place-items-center p-4 text-sm font-medium hover:border-forest"><span className="flex items-center gap-2"><PlusI size={16} />Page vierge</span></button>
          {models.map((m) => {
            const hero = m.blocks.find((b) => b.type === "hero") as Extract<EmailBlock, { type: "hero" }> | undefined;
            return (
              <button key={m.id} disabled={busy} onClick={async () => { const r = await run<EmailCampaign>("emails/create", { name: `${m.name} (nouvelle version)`, fromId: m.id }, "E-mail créé à partir du modèle"); if (r) { setNewOpen(false); setSelId(r.id); } }} className="hub-card overflow-hidden text-left hover:border-forest">
                {hero?.design && <DesignPreview design={hero.design} width={260} />}
                <p className="p-3 text-sm font-medium">{m.name}<span className="block text-xs font-normal text-forest-soft">{m.template}</span></p>
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}

function EmailEditor({ email, campaigns, provider, baseUrl, userEmail, onDeleted }: { email: EmailCampaign; campaigns: { id: string; name: string }[]; provider: { resend: boolean; segment: boolean }; baseUrl: string; userEmail: string; onDeleted: () => void }) {
  const [d, setD] = useState<EmailCampaign>(email);
  const [device, setDevice] = useState<"mobile" | "desktop">("desktop");
  const [heroImgs, setHeroImgs] = useState<Record<string, string>>({});
  const [testOpen, setTestOpen] = useState(false);
  const [testTo, setTestTo] = useState(userEmail);
  const [planOpen, setPlanOpen] = useState(false);
  const [planDate, setPlanDate] = useState(email.scheduledAt ?? "");
  const [addOpen, setAddOpen] = useState(false);
  const { run, busy } = useAction();
  const allowed = useCan();
  const toast = useToast();
  const { ask, dialog } = useConfirm();
  const dirty = JSON.stringify(d) !== JSON.stringify(email);
  const editable = allowed("content.edit") && email.status !== "envoye";

  // Rendu des visuels d'en-tête en images (aperçu et envoi)
  useEffect(() => {
    let alive = true;
    (async () => {
      const out: Record<string, string> = {};
      for (const b of d.blocks) if (b.type === "hero" && b.design) out[b.id] = await designToDataUrl(b.design, 0, 600 / b.design.w * 2, "image/jpeg");
      if (alive) setHeroImgs(out);
    })();
    return () => { alive = false; };
  }, [d.blocks]);
  // Origine du navigateur pour charger les images de l'aperçu (fixée après hydratation pour éviter un écart serveur/client)
  const [origin, setOrigin] = useState<string | null>(null);
  useEffect(() => setOrigin(window.location.origin), []);
  const html = useMemo(() => (origin ? renderEmailHtml(d, { baseUrl: origin, images: heroImgs }) : ""), [d, heroImgs, origin]);

  const upd = (i: number, patch: Partial<EmailBlock>) => setD((x) => ({ ...x, blocks: x.blocks.map((b, j) => (j === i ? ({ ...b, ...patch } as EmailBlock) : b)) }));
  const move = (i: number, dir: -1 | 1) => setD((x) => { const bl = [...x.blocks]; const j = i + dir; if (j < 0 || j >= bl.length) return x; [bl[i], bl[j]] = [bl[j], bl[i]]; return { ...x, blocks: bl }; });

  const sendNow = async (scheduledAt?: string) => {
    if (!scheduledAt && !(await ask("Envoyer la newsletter maintenant ?", "Elle sera envoyée à tous les contacts du segment Resend configuré. Cette action est irréversible.", "Envoyer", true))) return;
    try {
      const r = await hubApi<{ sent: boolean; reason?: string }>("emails/send", { id: email.id, images: heroImgs, scheduledAt });
      toast(r.sent ? "ok" : "err", r.sent ? (scheduledAt ? "Envoi programmé chez Resend." : "Newsletter envoyée.") : r.reason ?? "Envoi impossible");
      if (r.sent) location.reload();
    } catch (e) { toast("err", (e as Error).message); }
  };

  return (
    <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {dialog}
      <Card title={d.name} subtitle={email.send ? `${email.send.mode === "test" ? "Dernier test" : "Envoi"} : ${new Date(email.send.at).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })} par ${email.send.by}${email.send.to ? ` → ${email.send.to}` : ""}` : undefined} action={<StatusBadge status={email.status} />}>
        <fieldset disabled={!editable} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nom interne"><input className="hub-input" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></Field>
            <Field label="Campagne"><select className="hub-input" value={d.campaignId ?? ""} onChange={(e) => setD({ ...d, campaignId: e.target.value || undefined })}><option value="">Aucune</option>{campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          </div>
          <Field label="Objet" hint={<span className={clsx(d.subject.length > 60 && "font-semibold text-[#8A3D1E]")}>{d.subject.length} caractères (idéal ≤ 50-60)</span>}><input className="hub-input" value={d.subject} onChange={(e) => setD({ ...d, subject: e.target.value })} /></Field>
          <Field label="Préheader" hint={`${d.preheader.length} caractères (idéal 40-100)`}><input className="hub-input" value={d.preheader} onChange={(e) => setD({ ...d, preheader: e.target.value })} /></Field>
          <div>
            <p className="hub-label">Contenu</p>
            <div className="space-y-2">
              {d.blocks.map((b, i) => (
                <div key={b.id} className="rounded-lg border border-line bg-white p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-forest-soft">
                    {BLOCK_LABEL[b.type]}
                    <span className="ml-auto flex gap-1">
                      <button type="button" onClick={() => move(i, -1)} aria-label="Monter" className="rotate-180 rounded p-1 hover:bg-sage-soft"><ChevronDownI size={14} /></button>
                      <button type="button" onClick={() => move(i, 1)} aria-label="Descendre" className="rounded p-1 hover:bg-sage-soft"><ChevronDownI size={14} /></button>
                      <button type="button" onClick={() => setD({ ...d, blocks: d.blocks.filter((_, j) => j !== i) })} aria-label="Supprimer le bloc" className="rounded p-1 hover:bg-sage-soft"><TrashI size={14} /></button>
                    </span>
                  </div>
                  {b.type === "hero" && <HeroEditor block={b} onChange={(design) => upd(i, { design })} />}
                  {(b.type === "title" || b.type === "text") && <textarea className={clsx("hub-input", b.type === "text" && "min-h-24")} value={b.text} onChange={(e) => upd(i, { text: e.target.value })} />}
                  {b.type === "button" && <div className="grid gap-2 sm:grid-cols-2"><input className="hub-input" value={b.text} onChange={(e) => upd(i, { text: e.target.value })} aria-label="Texte du bouton" /><input className="hub-input" value={b.href} onChange={(e) => upd(i, { href: e.target.value })} aria-label="Lien" /></div>}
                  {b.type === "code" && <div className="grid gap-2"><input className="hub-input" value={b.code} onChange={(e) => upd(i, { code: e.target.value })} aria-label="Code" /><input className="hub-input" value={b.text} onChange={(e) => upd(i, { text: e.target.value })} aria-label="Conditions" /></div>}
                  {b.type === "products" && <select multiple className="hub-input h-28" value={b.productIds} onChange={(e) => upd(i, { productIds: [...e.target.selectedOptions].map((o) => o.value).slice(0, 4) })}>{products.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.kind}</option>)}</select>}
                  {b.type === "image" && (
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.src} alt="" className="h-16 w-24 rounded bg-sage-soft object-cover" />
                      <label className="hub-btn hub-btn-secondary hub-btn-sm cursor-pointer"><UploadI size={13} />Remplacer<input type="file" accept="image/*" className="sr-only" onChange={async (e) => { if (!e.target.files?.length) return; const up = await uploadFiles(e.target.files, "emails", true, "Newsletters"); upd(i, { src: up[0].url }); }} /></label>
                      <input className="hub-input" placeholder="Texte alternatif" value={b.alt ?? ""} onChange={(e) => upd(i, { alt: e.target.value })} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {editable && (
              <div className="relative mt-2">
                <Button size="sm" icon={<PlusI size={13} />} onClick={() => setAddOpen((x) => !x)}>Ajouter un bloc</Button>
                {addOpen && <div className="absolute z-10 mt-1 grid w-64 gap-0.5 rounded-lg border border-line bg-white p-1.5 shadow-lg">{(Object.keys(BLOCK_LABEL) as EmailBlock["type"][]).map((t) => <button key={t} type="button" className="rounded px-2 py-1.5 text-left text-sm hover:bg-sage-soft" onClick={() => { setD({ ...d, blocks: [...d.blocks, newBlock(t)] }); setAddOpen(false); }}>{BLOCK_LABEL[t]}</button>)}</div>}
              </div>
            )}
          </div>
        </fieldset>
        <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-line pt-4">
          {allowed("content.edit") && <Button variant="ghost" icon={<CopyI size={14} />} onClick={() => run("emails/duplicate", { id: email.id }, "E-mail dupliqué")}>Dupliquer</Button>}
          {allowed("content.edit") && <Button variant="danger" icon={<TrashI size={14} />} onClick={async () => { if (await ask("Supprimer cet e-mail ?", email.name, "Supprimer", true)) { await run("emails/delete", { id: email.id }, "E-mail supprimé"); onDeleted(); } }}>Supprimer</Button>}
          {dirty && <Button variant="primary" disabled={busy} onClick={() => run("emails/update", d, "Brouillon enregistré")}>Enregistrer le brouillon</Button>}
          {!dirty && allowed("content.edit") && <Button icon={<SendI size={14} />} onClick={() => setTestOpen(true)}>Envoyer un test</Button>}
          {!dirty && allowed("content.edit") && email.status === "brouillon" && <Button onClick={() => run("emails/submit", { id: email.id }, "Envoyé en validation")}>Soumettre à validation</Button>}
          {!dirty && allowed("content.validate") && ["brouillon", "a_valider"].includes(email.status) && <Button variant="primary" icon={<CheckI size={14} />} onClick={() => run("emails/validate", { id: email.id }, "Newsletter validée")}>Valider</Button>}
          {!dirty && allowed("content.publish") && email.status === "valide" && <Button icon={<ClockI size={14} />} onClick={() => setPlanOpen(true)}>Programmer</Button>}
          {!dirty && allowed("content.publish") && email.status === "valide" && <Button variant="primary" icon={<SendI size={14} />} onClick={() => sendNow()}>Envoyer</Button>}
        </div>
      </Card>

      <Card title="Aperçu" action={<div className="flex rounded-md border border-line p-0.5">{(["mobile", "desktop"] as const).map((x) => <button key={x} onClick={() => setDevice(x)} className={clsx("rounded px-3 py-1 text-xs", device === x ? "bg-forest text-white" : "text-forest-soft")}>{x === "mobile" ? "Mobile" : "Ordinateur"}</button>)}</div>}>
        <div className="rounded-lg border border-line bg-white p-3 text-sm">
          <p className="font-semibold">SKINCLEAN</p>
          <p className="truncate">{d.subject || "(objet vide)"}</p>
          <p className="truncate text-forest-soft">{d.preheader}</p>
        </div>
        <div className="mt-3 flex justify-center rounded-lg bg-[#ECEBE6] p-4">
          {html && <iframe title="Aperçu de l'e-mail" srcDoc={html} sandbox="allow-same-origin" className={clsx("h-[720px] rounded-md border border-line bg-white shadow", device === "mobile" ? "w-[375px]" : "w-full max-w-[680px]")} />}
        </div>
      </Card>

      <Modal open={testOpen} onClose={() => setTestOpen(false)} title="Envoyer un e-mail de test" size="sm"
        footer={<><Button onClick={() => setTestOpen(false)}>Annuler</Button><Button variant="primary" disabled={!provider.resend} onClick={async () => { try { const r = await hubApi<{ sent: boolean; reason?: string }>("emails/test", { id: email.id, to: testTo, images: heroImgs }); toast(r.sent ? "ok" : "err", r.sent ? `Test envoyé à ${testTo}` : r.reason ?? "Échec"); if (r.sent) setTestOpen(false); } catch (e) { toast("err", (e as Error).message); } }}>Envoyer le test</Button></>}>
        <Field label="Destinataire"><input type="email" className="hub-input" value={testTo} onChange={(e) => setTestTo(e.target.value)} /></Field>
        {!provider.resend && <p className="mt-3 text-sm text-[#8A3D1E]">Configure RESEND_API_KEY pour envoyer des tests réels.</p>}
      </Modal>
      <Modal open={planOpen} onClose={() => setPlanOpen(false)} title="Programmer la newsletter" size="sm"
        footer={<><Button onClick={() => setPlanOpen(false)}>Annuler</Button>
          <Button disabled={!planDate} onClick={async () => { await run("emails/plan", { id: email.id, date: planDate }, "Date d'envoi ajoutée au calendrier"); setPlanOpen(false); }}>Planifier au calendrier</Button>
          {provider.resend && provider.segment && <Button variant="primary" disabled={!planDate} onClick={async () => { await sendNow(planDate); setPlanOpen(false); }}>Programmer chez Resend</Button>}</>}>
        <Field label="Date et heure d'envoi"><input type="datetime-local" className="hub-input" value={planDate} onChange={(e) => setPlanDate(e.target.value)} /></Field>
        <p className="mt-3 text-sm text-forest-soft">« Planifier au calendrier » réserve le créneau dans le calendrier éditorial. {provider.segment ? "« Programmer chez Resend » confie l'envoi au fournisseur à l'heure choisie." : "L'envoi automatique nécessite Resend et un segment de diffusion."}</p>
      </Modal>
    </div>
  );
}

function HeroEditor({ block, onChange }: { block: Extract<EmailBlock, { type: "hero" }>; onChange: (d: NonNullable<Extract<EmailBlock, { type: "hero" }>["design"]>) => void }) {
  const texts = block.design?.pages[0].layers.filter((l) => l.type === "text") ?? [];
  const img = block.design?.pages[0].layers.find((l) => l.type === "image");
  const [headline, setHeadline] = useState(texts[1]?.type === "text" ? texts[1].text : "");
  const [eyebrow, setEyebrow] = useState(texts[0]?.type === "text" ? texts[0].text : "");
  const [sub, setSub] = useState(texts[2]?.type === "text" ? texts[2].text : "");
  const [packshot, setPackshot] = useState(img?.type === "image" ? img.src : "");
  const [bg, setBg] = useState(block.design?.pages[0].bg.color ?? "#EFEEEA");
  const apply = (p: Partial<{ headline: string; eyebrow: string; sub: string; packshot: string; bg: string }>) => {
    const v = { headline, eyebrow, sub, packshot, bg, ...p };
    onChange(tplBanner({ format: "newsletter", headline: v.headline, eyebrow: v.eyebrow, sub: v.sub, packshot: v.packshot || undefined, bg: v.bg, cta: "Découvrir" }));
  };
  return (
    <div className="grid gap-2 sm:grid-cols-[200px_1fr]">
      {block.design && <DesignPreview design={block.design} width={200} rounded />}
      <div className="grid gap-2">
        <input className="hub-input" placeholder="Surtitre" value={eyebrow} onChange={(e) => { setEyebrow(e.target.value); apply({ eyebrow: e.target.value }); }} />
        <input className="hub-input" placeholder="Titre" value={headline} onChange={(e) => { setHeadline(e.target.value); apply({ headline: e.target.value }); }} />
        <input className="hub-input" placeholder="Sous-titre" value={sub} onChange={(e) => { setSub(e.target.value); apply({ sub: e.target.value }); }} />
        <div className="flex gap-2">
          <select className="hub-input" value={packshot} onChange={(e) => { setPackshot(e.target.value); apply({ packshot: e.target.value }); }} aria-label="Produit"><option value="">Sans produit</option>{products.filter((p) => p.media.packshot).map((p) => <option key={p.id} value={p.media.packshot}>{p.name}</option>)}</select>
          <input type="color" className="hub-input h-10 w-14 p-1" value={bg} onChange={(e) => { setBg(e.target.value); apply({ bg: e.target.value }); }} aria-label="Couleur de fond" />
        </div>
      </div>
    </div>
  );
}
