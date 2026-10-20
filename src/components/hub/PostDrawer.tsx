"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { products } from "@/data/products";
import type { Comment, Platform, Post, PostFormat } from "@/lib/hub/types";
import { PLATFORM_LABEL, ROLE_LABEL } from "@/lib/hub/types";
import { addDays, frDay } from "@/lib/hub/dates";
import { Button, Drawer, Field, Modal, Notice, PlatformBadge, StatusBadge, Tabs, copyText, hubApi, useAction, useCan, useConfirm, useToast } from "./ui";
import { PostPreview } from "./PostPreview";
import { designToDataUrl, downloadDesign, slug } from "./design/render";
import { CheckI, ClockI, CopyI, DownloadI, EditI, PaletteI, SendI, TrashI, UndoI, XI, CommentI, LinkI } from "./icons";

export interface HubRefs { personas: { id: string; name: string }[]; campaigns: { id: string; name: string; color: string }[] }

const LIMITS: Partial<Record<Platform, number>> = { instagram: 2200, story: 2200, tiktok: 2200, facebook: 63206, pinterest: 500 };
const FORMATS: { id: PostFormat; label: string }[] = [
  { id: "post", label: "Post" }, { id: "carrousel", label: "Carrousel" }, { id: "reel", label: "Reel" }, { id: "story", label: "Story" }, { id: "video", label: "Vidéo" }, { id: "epingle", label: "Épingle" }, { id: "article", label: "Article" }, { id: "newsletter", label: "Newsletter" },
];

async function renderVisual(post: Post): Promise<string | undefined> {
  const d = post.visual?.kind === "design" ? post.visual.design : post.visual?.poster;
  return d ? designToDataUrl(d, 0) : undefined;
}

export async function downloadPostVisual(post: Post) {
  const name = slug(post.title);
  if (post.visual?.kind === "design" && post.visual.design) return downloadDesign(post.visual.design, name);
  if (post.visual?.src) {
    const a = document.createElement("a");
    a.href = post.visual.src;
    a.download = `${name}.${post.visual.src.split(".").pop()}`;
    a.click();
  }
  if (post.visual?.poster) await downloadDesign(post.visual.poster, `${name}-couverture`);
}

/** Fiche complète d'une publication : aperçu, édition, validation, programmation, publication. */
export function PostDrawer({ post, refs, onClose, initialTab }: { post: Post | null; refs: HubRefs; onClose: () => void; initialTab?: "apercu" | "contenu" }) {
  const [tab, setTab] = useState<"apercu" | "contenu" | "script" | "echanges">(initialTab ?? "apercu");
  const [draft, setDraft] = useState<Post | null>(post);
  const [dirty, setDirty] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState<null | string>(null);
  const [refuseOpen, setRefuseOpen] = useState(false);
  const [refuseText, setRefuseText] = useState("");
  const [comment, setComment] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [postponeOpen, setPostponeOpen] = useState(false);
  const { run, busy, refresh } = useAction();
  const toast = useToast();
  const allowed = useCan();
  const { ask, dialog } = useConfirm();

  useEffect(() => {
    setDraft(post);
    setDirty(false);
    if (post && post.id !== draft?.id) setTab(initialTab ?? "apercu");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post]);
  const set = <K extends keyof Post>(k: K, v: Post[K]) => { setDraft((d) => (d ? { ...d, [k]: v } : d)); setDirty(true); };

  const fullCaption = useMemo(() => (draft ? [draft.caption, draft.hashtags.join(" ")].filter(Boolean).join("\n\n") : ""), [draft]);
  if (!post || !draft) return <Drawer open={false} onClose={onClose} title="">{null}</Drawer>;

  const editable = allowed("content.edit") && post.status !== "publie";
  const save = async () => {
    const r = await run<Post>("posts/update", { ...draft, id: post.id }, "Modifications enregistrées");
    if (r) setDirty(false);
  };
  const publish = async () => {
    if (dirty) return toast("err", "Enregistre d'abord tes modifications.");
    try {
      const imageDataUrl = await renderVisual(post);
      const r = await hubApi<{ published: boolean; reason?: string; needsConnection?: boolean }>("posts/publish", { id: post.id, imageDataUrl });
      if (r.published) { toast("ok", `Publié sur ${PLATFORM_LABEL[post.platform]} (confirmé par la plateforme).`); refresh(); }
      else setManualOpen(r.reason ?? "Publication automatique impossible.");
    } catch (e) { toast("err", (e as Error).message); }
  };
  const schedule = async () => {
    const imageDataUrl = await renderVisual(post);
    const r = await run<{ message: string }>("posts/schedule", { id: post.id, date: scheduleDate || post.date, imageDataUrl }, (x) => x.message);
    if (r) setScheduleOpen(false);
  };
  const remove = async () => {
    if (await ask("Supprimer cette publication ?", "Elle sera retirée du calendrier. Cette action est définitive.", "Supprimer", true)) {
      const r = await run("posts/delete", { id: post.id }, "Publication supprimée");
      if (r) onClose();
    }
  };

  const status = post.status;
  const footer = (
    <>
      <div className="mr-auto flex flex-wrap gap-1.5">
        <Button size="sm" variant="ghost" icon={<DownloadI size={15} />} onClick={() => downloadPostVisual(post)}>Télécharger</Button>
        <Button size="sm" variant="ghost" icon={<CopyI size={15} />} onClick={() => copyText(post.caption, toast, "Légende copiée")}>Légende</Button>
        <Button size="sm" variant="ghost" icon={<CopyI size={15} />} onClick={() => copyText(post.hashtags.join(" "), toast, "Hashtags copiés")} disabled={!post.hashtags.length}>Hashtags</Button>
      </div>
      {dirty && <Button variant="primary" onClick={save} disabled={busy}>Enregistrer</Button>}
      {!dirty && editable && ["brouillon", "modifications"].includes(status) && <Button variant="soft" icon={<SendI size={15} />} disabled={busy} onClick={() => run("posts/submit", { id: post.id }, "Envoyé en validation")}>Soumettre à validation</Button>}
      {!dirty && allowed("content.validate") && ["a_valider", "brouillon", "modifications"].includes(status) && (
        <>
          <Button icon={<XI size={15} />} disabled={busy} onClick={() => setRefuseOpen(true)}>Demander des modifications</Button>
          <Button variant="primary" icon={<CheckI size={15} />} disabled={busy} onClick={() => run("posts/validate", { id: post.id }, "Contenu validé ✔︎")}>Valider</Button>
        </>
      )}
      {!dirty && allowed("content.publish") && ["valide", "programme"].includes(status) && !["newsletter", "blog"].includes(post.platform) && (
        <>
          {status === "valide" ? <Button icon={<ClockI size={15} />} onClick={() => { setScheduleDate(post.date); setScheduleOpen(true); }}>Programmer</Button> : <Button icon={<UndoI size={15} />} onClick={() => run("posts/unschedule", { id: post.id }, "Programmation annulée")}>Déprogrammer</Button>}
          <Button variant="primary" icon={<SendI size={15} />} disabled={busy} onClick={publish}>Publier</Button>
        </>
      )}
      {post.platform === "newsletter" && post.emailId && <Link className="hub-btn hub-btn-primary" href={`/hub/emailing?id=${post.emailId}`}>Ouvrir la newsletter</Link>}
      {post.platform === "blog" && <Link className="hub-btn hub-btn-primary" href={post.articleId ? `/hub/seo?tab=articles&id=${post.articleId}` : "/hub/seo?tab=articles"}>Ouvrir l'article</Link>}
    </>
  );

  return (
    <Drawer open onClose={onClose} width="max-w-5xl" footer={footer}
      title={<span className="flex min-w-0 items-center gap-2"><PlatformBadge platform={post.platform} compact /><span className="truncate">{post.title}</span></span>}>
      {dialog}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <StatusBadge status={post.status} />
        <span className="text-forest-soft">{post.date ? `${frDay(post.date)} à ${post.date.slice(11, 16)}` : "Bibliothèque (non planifié)"}</span>
        {post.campaignId && <span className="hub-badge bg-sage-soft">{refs.campaigns.find((c) => c.id === post.campaignId)?.name ?? "Campagne"}</span>}
        <div className="ml-auto flex flex-wrap gap-1.5">
          {editable && post.date && (
            <div className="relative">
              <Button size="sm" icon={<ClockI size={14} />} onClick={() => setPostponeOpen((x) => !x)}>Reporter</Button>
              {postponeOpen && (
                <div className="absolute right-0 top-9 z-10 w-56 rounded-lg border border-line bg-white p-2 shadow-lg">
                  {[[1, "Demain, même heure"], [2, "Dans 2 jours"], [7, "La semaine prochaine"]].map(([d, l]) => (
                    <button key={d} className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-sage-soft" onClick={() => { setPostponeOpen(false); run("posts/postpone", { id: post.id, days: d }, `Reporté au ${frDay(addDays(post.date, Number(d)))}`); }}>{l}</button>
                  ))}
                  <label className="mt-1 block border-t border-line px-2 pt-2 text-xs text-forest-soft">Autre date
                    <input type="datetime-local" className="hub-input mt-1" defaultValue={post.date} onChange={(e) => e.target.value && run("posts/postpone", { id: post.id, date: e.target.value }, "Publication reportée").then(() => setPostponeOpen(false))} />
                  </label>
                </div>
              )}
            </div>
          )}
          {allowed("content.edit") && <Button size="sm" onClick={() => run<Post>("posts/duplicate", { id: post.id }, "Publication dupliquée (brouillon)")}>Dupliquer</Button>}
          {allowed("content.edit") && post.visual?.kind !== "video" && <Link href={`/hub/studio?post=${post.id}`} className="hub-btn hub-btn-secondary hub-btn-sm"><PaletteI size={14} />Modifier le visuel</Link>}
          {allowed("content.edit") && <Button size="sm" variant="danger" icon={<TrashI size={14} />} onClick={remove} aria-label="Supprimer" />}
        </div>
      </div>

      {post.publish && (
        <Notice tone={post.publish.mode === "api" ? "ok" : "warn"}>
          {post.publish.mode === "api" ? `Publication confirmée par ${PLATFORM_LABEL[post.platform]} le ${new Date(post.publish.at).toLocaleString("fr-FR")}${post.publish.externalId ? ` (identifiant ${post.publish.externalId})` : ""}.` : post.publish.message ?? `Déclarée publiée manuellement par ${post.publish.by}.`}
          {post.publish.url && <> <a href={post.publish.url} target="_blank" rel="noreferrer" className="underline">Voir la publication</a></>}
        </Notice>
      )}
      {post.visual?.note && <div className="mt-2"><Notice tone="warn">{post.visual.note}</Notice></div>}

      <Tabs className="mt-4" value={tab} onChange={setTab} tabs={[
        { id: "apercu", label: "Aperçu" },
        { id: "contenu", label: editable ? "Modifier le contenu" : "Contenu" },
        ...(post.script ? [{ id: "script" as const, label: "Script vidéo" }] : []),
        { id: "echanges", label: "Commentaires de validation", count: post.comments.length },
      ]} />

      <div className="pt-5">
        {tab === "apercu" && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
            <div className="rounded-xl bg-[#ECEBE6] p-5"><PostPreview post={draft} /></div>
            <dl className="grid content-start gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <Info label="Plateforme" value={PLATFORM_LABEL[post.platform]} />
              <Info label="Format" value={FORMATS.find((f) => f.id === post.format)?.label ?? post.format} />
              <Info label="Objectif" value={post.objective} />
              <Info label="Pilier éditorial" value={post.pillar} />
              <Info label="Persona" value={refs.personas.find((p) => p.id === post.personaId)?.name ?? "—"} />
              <Info label="CTA" value={post.cta || "—"} />
              <div className="sm:col-span-2"><dt className="hub-label">Produits associés</dt><dd className="flex flex-wrap gap-1.5">{post.productIds.length ? post.productIds.map((id) => { const p = products.find((x) => x.id === id); return p ? <Link key={id} href={`/produits/${p.slug}`} target="_blank" className="hub-badge border border-line bg-white">{p.name}</Link> : null; }) : "—"}</dd></div>
              <div className="sm:col-span-2"><dt className="hub-label">Texte de publication</dt><dd className="whitespace-pre-line rounded-lg border border-line bg-white p-3 leading-relaxed">{post.caption || "—"}</dd></div>
              <div className="sm:col-span-2"><dt className="hub-label">Hashtags</dt><dd>{post.hashtags.join(" ") || "—"}</dd></div>
              {post.slides && <div className="sm:col-span-2"><dt className="hub-label">Textes du carrousel</dt><dd><ol className="list-decimal space-y-1 pl-5">{post.slides.map((s, i) => <li key={i}>{s}</li>)}</ol></dd></div>}
              <div className="sm:col-span-2 flex flex-wrap gap-2 pt-1">
                <Button size="sm" icon={<CopyI size={14} />} onClick={() => copyText(fullCaption, toast, "Légende + hashtags copiés")}>Copier légende + hashtags</Button>
              </div>
            </dl>
          </div>
        )}

        {tab === "contenu" && (
          <fieldset disabled={!editable} className="grid gap-4 md:grid-cols-2">
            <Field label="Titre" className="md:col-span-2"><input className="hub-input" value={draft.title} onChange={(e) => set("title", e.target.value)} /></Field>
            <Field label="Date et heure"><input type="datetime-local" className="hub-input" value={draft.date} onChange={(e) => set("date", e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Plateforme">
                <select className="hub-input" value={draft.platform} onChange={(e) => set("platform", e.target.value as Platform)}>
                  {(Object.keys(PLATFORM_LABEL) as Platform[]).map((p) => <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>)}
                </select>
              </Field>
              <Field label="Format">
                <select className="hub-input" value={draft.format} onChange={(e) => set("format", e.target.value as PostFormat)}>
                  {FORMATS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Objectif">
              <select className="hub-input" value={draft.objective} onChange={(e) => set("objective", e.target.value)}>
                {[...new Set(["Notoriété", "Engagement", "Trafic", "Inscriptions", "Skin Diag", "SEO", draft.objective])].map((o) => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Persona">
              <select className="hub-input" value={draft.personaId ?? ""} onChange={(e) => set("personaId", e.target.value || undefined)}>
                <option value="">—</option>
                {refs.personas.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Campagne">
              <select className="hub-input" value={draft.campaignId ?? ""} onChange={(e) => set("campaignId", e.target.value || undefined)}>
                <option value="">Aucune</option>
                {refs.campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Pilier éditorial">
              <select className="hub-input" value={draft.pillar} onChange={(e) => set("pillar", e.target.value)}>
                {[...new Set(["Skin School", "Routines", "Produits", "Communauté", "Offres & temps forts", "Campagne", draft.pillar])].map((o) => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Texte de publication" className="md:col-span-2" hint={LIMITS[draft.platform] ? <span className={clsx(draft.caption.length > LIMITS[draft.platform]! && "font-semibold text-[#A63A3A]")}>{draft.caption.length} / {LIMITS[draft.platform]} caractères</span> : undefined}>
              <textarea className="hub-input min-h-48" value={draft.caption} onChange={(e) => set("caption", e.target.value)} />
            </Field>
            <Field label="Hashtags (séparés par des espaces)"><input className="hub-input" value={draft.hashtags.join(" ")} onChange={(e) => set("hashtags", e.target.value.split(/[\s,]+/).filter(Boolean).map((h) => (h.startsWith("#") ? h : `#${h}`)))} /></Field>
            <Field label="Appel à l'action (CTA)"><input className="hub-input" value={draft.cta} onChange={(e) => set("cta", e.target.value)} /></Field>
            <Field label="Produits associés" className="md:col-span-2">
              <div className="hub-scroll flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-line bg-white p-2">
                {products.map((p) => {
                  const on = draft.productIds.includes(p.id);
                  return <button type="button" key={p.id} onClick={() => set("productIds", on ? draft.productIds.filter((x) => x !== p.id) : [...draft.productIds, p.id])} className={clsx("rounded-full border px-2.5 py-1 text-xs", on ? "border-forest bg-forest text-white" : "border-line hover:border-forest")}>{p.name}</button>;
                })}
              </div>
            </Field>
            {draft.slides && (
              <Field label="Textes du carrousel (un par ligne)" className="md:col-span-2" hint="Pour modifier les slides du visuel lui-même, ouvre le Studio créatif.">
                <textarea className="hub-input min-h-28" value={draft.slides.join("\n")} onChange={(e) => set("slides", e.target.value.split("\n"))} />
              </Field>
            )}
            {editable && <div className="md:col-span-2 flex justify-end gap-2"><Button onClick={() => { setDraft(post); setDirty(false); }} disabled={!dirty}>Annuler</Button><Button variant="primary" icon={<EditI size={15} />} onClick={save} disabled={!dirty || busy}>Enregistrer</Button></div>}
            {["valide", "programme"].includes(post.status) && <p className="md:col-span-2 text-xs text-forest-soft">Ce contenu est validé : toute modification (hors date) le renverra en validation.</p>}
          </fieldset>
        )}

        {tab === "script" && post.script && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Info label="Hook (3 premières secondes)" value={post.script.hook} />
              <Info label="Durée" value={post.script.duration ?? "—"} />
              <Info label="Son" value={post.script.sound ?? "—"} />
            </div>
            <div className="overflow-x-auto rounded-lg border border-line bg-white">
              <table className="w-full text-sm">
                <thead className="bg-sage-soft text-left text-xs uppercase tracking-wider text-forest-soft"><tr><th className="p-3">Temps</th><th className="p-3">Plan / scène</th><th className="p-3">Texte à l&apos;écran</th><th className="p-3">Voix</th></tr></thead>
                <tbody>{post.script.scenes.map((s, i) => <tr key={i} className="border-t border-line align-top"><td className="p-3 font-medium tabular-nums">{s.t}</td><td className="p-3">{s.shot}</td><td className="p-3">{s.onScreen}</td><td className="p-3 text-forest-soft">{s.voice || "—"}</td></tr>)}</tbody>
              </table>
            </div>
            <Button size="sm" icon={<CopyI size={14} />} onClick={() => copyText([`HOOK : ${post.script!.hook}`, ...post.script!.scenes.map((s) => `${s.t} — ${s.shot} | Écran : ${s.onScreen}${s.voice ? ` | Voix : ${s.voice}` : ""}`)].join("\n"), toast, "Script copié")}>Copier le script</Button>
          </div>
        )}

        {tab === "echanges" && (
          <div className="max-w-2xl space-y-3">
            {!post.comments.length && <p className="text-sm text-forest-soft">Aucun commentaire pour l&apos;instant.</p>}
            {post.comments.map((c: Comment) => (
              <div key={c.id} className={clsx("rounded-lg border p-3 text-sm", c.kind === "refus" ? "border-[#F0C9B8] bg-[#FDF3EE]" : c.kind === "validation" ? "border-sage bg-sage-soft" : "border-line bg-white")}>
                <p className="text-xs text-forest-soft"><strong className="text-forest">{c.author}</strong> · {ROLE_LABEL[c.role]} · {new Date(c.at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}{c.kind === "refus" ? " · modifications demandées" : c.kind === "validation" ? " · validation" : ""}</p>
                <p className="mt-1 whitespace-pre-line">{c.text}</p>
              </div>
            ))}
            <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (comment.trim()) { await run("posts/comment", { id: post.id, text: comment }, "Commentaire ajouté"); setComment(""); } }}>
              <input className="hub-input" placeholder="Ajouter un commentaire…" value={comment} onChange={(e) => setComment(e.target.value)} />
              <Button type="submit" variant="primary" icon={<CommentI size={15} />} disabled={!comment.trim()}>Envoyer</Button>
            </form>
          </div>
        )}
      </div>

      <Modal open={refuseOpen} onClose={() => setRefuseOpen(false)} title="Demander des modifications" size="sm"
        footer={<><Button onClick={() => setRefuseOpen(false)}>Annuler</Button><Button variant="primary" disabled={!refuseText.trim()} onClick={async () => { await run("posts/request-changes", { id: post.id, comment: refuseText }, "Demande envoyée à l'équipe"); setRefuseOpen(false); setRefuseText(""); }}>Envoyer</Button></>}>
        <Field label="Qu'est-ce qui doit changer ?"><textarea className="hub-input min-h-28" value={refuseText} onChange={(e) => setRefuseText(e.target.value)} placeholder="Ex. : remplacer le visuel par la version claire, raccourcir la légende…" /></Field>
      </Modal>

      <Modal open={scheduleOpen} onClose={() => setScheduleOpen(false)} title="Programmer la publication" size="sm"
        footer={<><Button onClick={() => setScheduleOpen(false)}>Annuler</Button><Button variant="primary" onClick={schedule} disabled={busy}>Programmer</Button></>}>
        <Field label="Date et heure de publication"><input type="datetime-local" className="hub-input" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} /></Field>
        <p className="mt-3 text-sm text-forest-soft">Si {PLATFORM_LABEL[post.platform]} est connecté, la publication partira automatiquement. Sinon, tu recevras un rappel à l&apos;heure prévue avec le visuel et la légende prêts à copier.</p>
      </Modal>

      <Modal open={!!manualOpen} onClose={() => setManualOpen(null)} title="Publier manuellement" size="md"
        footer={<><Button onClick={() => setManualOpen(null)}>Plus tard</Button><Button variant="primary" icon={<CheckI size={15} />} onClick={async () => { await run("posts/declare-published", { id: post.id, url: manualUrl }, "Publication déclarée (manuelle)"); setManualOpen(null); setManualUrl(""); }}>J&apos;ai publié ce contenu</Button></>}>
        <Notice tone="warn">{manualOpen}</Notice>
        <ol className="mt-4 space-y-3 text-sm">
          <li className="flex items-center justify-between gap-3"><span>1. Télécharge le visuel</span><Button size="sm" icon={<DownloadI size={14} />} onClick={() => downloadPostVisual(post)}>Télécharger</Button></li>
          <li className="flex items-center justify-between gap-3"><span>2. Copie la légende et les hashtags</span><Button size="sm" icon={<CopyI size={14} />} onClick={() => copyText(fullCaption, toast, "Légende + hashtags copiés")}>Copier</Button></li>
          <li>3. Publie depuis l&apos;application {PLATFORM_LABEL[post.platform]}.</li>
          <li>4. Colle ici le lien de la publication (facultatif) puis confirme.</li>
        </ol>
        <Field label="Lien de la publication (https://…)" className="mt-3"><div className="flex items-center gap-2"><LinkI size={16} /><input className="hub-input" value={manualUrl} onChange={(e) => setManualUrl(e.target.value)} placeholder="https://www.instagram.com/p/…" /></div></Field>
        <p className="mt-3 text-xs text-forest-soft">Le statut sera « Publié manuellement » : il n&apos;est pas présenté comme confirmé par la plateforme.</p>
      </Modal>
    </Drawer>
  );
}

const Info = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div><dt className="hub-label">{label}</dt><dd>{value}</dd></div>
);
