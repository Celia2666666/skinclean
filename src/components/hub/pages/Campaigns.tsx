"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { products } from "@/data/products";
import type { Campaign, Platform, Post, PostFormat } from "@/lib/hub/types";
import { AD_PLATFORM_LABEL, PLATFORM_LABEL } from "@/lib/hub/types";
import { addDays, frDay, todayYmd } from "@/lib/hub/dates";
import { tplBanner } from "@/lib/hub/templates";
import { Button, Card, Empty, Field, Modal, Notice, PageHeader, PlatformBadge, StatusBadge, Tabs, euro, useAction, useCan, useConfirm } from "../ui";
import { DesignPreview, VisualThumb } from "../design/DesignPreview";
import { downloadDesign, slug } from "../design/render";
import { PostDrawer, type HubRefs } from "../PostDrawer";
import { ArrowRightI, CheckI, CopyI, DownloadI, EditI, PauseI, PlayI, PlusI, TrashI } from "../icons";

type C = Campaign & { scheduled: number };
const total = (c: Campaign) => c.budget.reduce((s, b) => s + b.amount, 0);
const STATUS_ORDER: Campaign["status"][] = ["active", "planifiee", "bibliotheque", "en_pause", "terminee"];

export function CampaignsList({ campaigns }: { campaigns: C[] }) {
  const [filter, setFilter] = useState<Campaign["status"] | "">("");
  const [create, setCreate] = useState<null | { name: string; objective: string; startDate: string; color: string }>(null);
  const [activate, setActivate] = useState<C | null>(null);
  const [start, setStart] = useState(todayYmd());
  const { run, busy } = useAction();
  const allowed = useCan();
  const router = useRouter();
  const shown = campaigns.filter((c) => !filter || c.status === filter).sort((a, b) => Number(!!b.example) - Number(!!a.example) || STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || a.startDate.localeCompare(b.startDate));

  return (
    <div>
      <PageHeader eyebrow="Campagnes 360°" title="Campagnes marketing" intro="Des campagnes complètes prêtes à personnaliser : objectif, cible, concept, message, canaux, planning, budget, publications, visuels, scripts, newsletter, bannière, publicités et KPI. Activer une campagne ajoute ses actions au calendrier ; aucune publication ni dépense n'a lieu sans validation."
        actions={allowed("campaign.manage") && <Button variant="primary" icon={<PlusI size={15} />} onClick={() => setCreate({ name: "", objective: "", startDate: addDays(todayYmd(), 14), color: "#4A6354" })}>Nouvelle campagne</Button>} />
      <div className="mb-4 flex flex-wrap gap-1.5">
        <button onClick={() => setFilter("")} className={clsx("hub-badge border py-1", !filter ? "border-forest bg-forest text-white" : "border-line bg-white")}>Toutes ({campaigns.length})</button>
        {STATUS_ORDER.map((s) => { const n = campaigns.filter((c) => c.status === s).length; return n ? <button key={s} onClick={() => setFilter(s)} className={clsx("hub-badge border py-1", filter === s ? "border-forest bg-forest text-white" : "border-line bg-white")}><StatusLabel s={s} /> ({n})</button> : null; })}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((c) => (
          <div key={c.id} className="hub-card flex flex-col overflow-hidden">
            <div className="h-1.5" style={{ background: c.color }} />
            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-start justify-between gap-2"><h2 className="font-display text-lg font-semibold">{c.name}</h2><span className="flex shrink-0 gap-1">{c.example && <span className="hub-badge bg-forest text-white">Exemple complet</span>}<StatusBadge status={c.status} /></span></div>
              <p className="mt-1 text-xs text-forest-soft">{frDay(c.startDate)} → {frDay(c.endDate)} · {c.durationDays} jours{c.season ? ` · ${c.season}` : ""}</p>
              <p className="mt-3 line-clamp-3 text-sm">{c.objective}</p>
              <p className="mt-2 line-clamp-2 text-sm italic text-forest-soft">{c.concept}</p>
              <div className="mt-3 flex flex-wrap gap-1">{c.channels.slice(0, 6).map((ch) => <span key={ch} className="hub-badge bg-sage-soft">{ch}</span>)}</div>
              <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center text-xs">
                <div><dt className="text-forest-soft">Actions</dt><dd className="font-display text-lg font-semibold">{c.plan.length}</dd></div>
                <div><dt className="text-forest-soft">Au calendrier</dt><dd className="font-display text-lg font-semibold">{c.scheduled}</dd></div>
                <div><dt className="text-forest-soft">Budget prév.</dt><dd className="font-display text-lg font-semibold">{euro(total(c))}</dd></div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <Link href={`/hub/campagnes/${c.id}`} className="hub-btn hub-btn-secondary hub-btn-sm">Voir la campagne <ArrowRightI size={13} /></Link>
                {allowed("campaign.manage") && ["bibliotheque", "en_pause", "terminee"].includes(c.status) && <Button size="sm" variant="primary" icon={<PlayI size={13} />} onClick={() => { setStart(c.startDate < todayYmd() ? todayYmd() : c.startDate); setActivate(c); }}>Activer</Button>}
                {allowed("campaign.manage") && <Button size="sm" variant="ghost" icon={<CopyI size={13} />} onClick={() => run("campaigns/duplicate", { id: c.id }, "Campagne dupliquée")}>Dupliquer</Button>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <ActivateModal campaign={activate} start={start} setStart={setStart} onClose={() => setActivate(null)} onConfirm={async () => { const r = await run<{ created: number }>("campaigns/activate", { id: activate!.id, startDate: start }, (x) => `Campagne activée : ${x.created} actions ajoutées au calendrier (en brouillon).`); if (r) setActivate(null); }} busy={busy} />

      <Modal open={!!create} onClose={() => setCreate(null)} title="Nouvelle campagne"
        footer={<><Button onClick={() => setCreate(null)}>Annuler</Button><Button variant="primary" disabled={!create?.name || busy} onClick={async () => { const c = await run<Campaign>("campaigns/create", create, "Campagne créée"); if (c) router.push(`/hub/campagnes/${c.id}?tab=modifier`); }}>Créer</Button></>}>
        {create && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom" className="sm:col-span-2"><input className="hub-input" value={create.name} onChange={(e) => setCreate({ ...create, name: e.target.value })} /></Field>
            <Field label="Objectif" className="sm:col-span-2"><textarea className="hub-input" value={create.objective} onChange={(e) => setCreate({ ...create, objective: e.target.value })} /></Field>
            <Field label="Date de démarrage prévue"><input type="date" className="hub-input" value={create.startDate} onChange={(e) => setCreate({ ...create, startDate: e.target.value })} /></Field>
            <Field label="Couleur"><input type="color" className="hub-input h-10 p-1" value={create.color} onChange={(e) => setCreate({ ...create, color: e.target.value })} /></Field>
            <p className="text-xs text-forest-soft sm:col-span-2">Tu complèteras ensuite cible, concept, canaux, planning, budget et KPI. Astuce : le Copilot peut te proposer une campagne complète.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ActivateModal({ campaign, start, setStart, onClose, onConfirm, busy }: { campaign: Campaign | null; start: string; setStart: (s: string) => void; onClose: () => void; onConfirm: () => void; busy: boolean }) {
  return (
    <Modal open={!!campaign} onClose={onClose} title={`Activer « ${campaign?.name ?? ""} »`}
      footer={<><Button onClick={onClose}>Annuler</Button><Button variant="primary" disabled={busy} onClick={onConfirm}>Activer et remplir le calendrier</Button></>}>
      {campaign && (
        <div className="space-y-4">
          <Field label="Date de démarrage"><input type="date" className="hub-input" value={start} min={todayYmd()} onChange={(e) => setStart(e.target.value)} /></Field>
          <p className="text-sm">{campaign.plan.length} actions seront ajoutées au calendrier entre le {frDay(start)} et le {frDay(addDays(start, campaign.durationDays - 1))}, en <strong>brouillon</strong>.</p>
          <ul className="hub-scroll max-h-56 space-y-1 overflow-y-auto rounded-lg border border-line p-3 text-sm">
            {campaign.plan.map((p, i) => <li key={i} className="flex gap-2"><span className="w-24 shrink-0 text-forest-soft">{frDay(addDays(start, p.day)).split(" ").slice(0, 3).join(" ")}</span><span className="w-28 shrink-0">{PLATFORM_LABEL[p.platform]}</span><span>{p.title}</span></li>)}
          </ul>
          <Notice>L&apos;activation ne publie rien et n&apos;engage aucune dépense : chaque contenu devra être validé, et chaque budget publicitaire validé séparément.</Notice>
        </div>
      )}
    </Modal>
  );
}

const StatusLabel = ({ s }: { s: Campaign["status"] }) => <>{{ active: "Actives", planifiee: "Planifiées", bibliotheque: "Bibliothèque", en_pause: "En pause", terminee: "Terminées" }[s]}</>;

/* ───────── Fiche campagne ───────── */
type Tab = "apercu" | "planning" | "publications" | "visuels" | "scripts" | "newsletter" | "publicites" | "modifier";

export function CampaignDetail({ campaign: c, posts, emails, ads, personas, refs }: {
  campaign: Campaign; posts: Post[]; emails: { id: string; name: string; subject: string; status: string }[];
  ads: { id: string; name: string; platform: keyof typeof AD_PLATFORM_LABEL; status: string; totalBudget: number; budgetValidated: boolean }[];
  personas: { id: string; name: string }[]; refs: HubRefs;
}) {
  const sp = useSearchParams();
  const [tab, setTab] = useState<Tab>(sp.get("tab") === "modifier" ? "modifier" : "apercu");
  const [draft, setDraft] = useState<Campaign>(c);
  const [activate, setActivate] = useState(false);
  const [start, setStart] = useState(c.startDate < todayYmd() ? todayYmd() : c.startDate);
  const [open, setOpen] = useState<string | null>(null);
  const { run, busy } = useAction();
  const allowed = useCan();
  const router = useRouter();
  const { ask, dialog } = useConfirm();
  const banner = useMemo(() => tplBanner({ headline: c.banner?.title ?? c.name, sub: c.banner?.text ?? c.message, cta: c.banner?.cta ?? "Découvrir", eyebrow: c.name, packshot: products.find((p) => p.id === c.productIds[0])?.media.packshot }), [c]);
  const validated = posts.filter((p) => ["valide", "programme", "publie", "publie_manuel", "publie_test"].includes(p.status)).length;
  const canManage = allowed("campaign.manage");
  const set = <K extends keyof Campaign>(k: K, v: Campaign[K]) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <div>
      {dialog}
      <Link href="/hub/campagnes" className="text-sm text-forest-soft underline">← Toutes les campagnes</Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3"><span className="h-8 w-2 rounded-full" style={{ background: c.color }} /><h1 className="font-display text-3xl font-semibold">{c.name}</h1><StatusBadge status={c.status} /></div>
          <p className="mt-1 text-sm text-forest-soft">{frDay(c.startDate)} → {frDay(c.endDate)} · {c.durationDays} jours · budget prévisionnel {euro(total(c))}{c.budgetValidatedAt ? ` · validé par ${c.budgetValidatedBy}` : " · non validé"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManage && c.status !== "active" && <Button variant="primary" icon={<PlayI size={14} />} onClick={() => setActivate(true)}>{c.status === "planifiee" && c.activatedAt ? "Réactiver / compléter" : "Activer la campagne"}</Button>}
          {canManage && c.status === "active" && <Button icon={<PauseI size={14} />} onClick={() => run("campaigns/status", { id: c.id, status: "en_pause" }, "Campagne mise en pause")}>Mettre en pause</Button>}
          {canManage && ["active", "en_pause"].includes(c.status) && <Button onClick={() => run("campaigns/status", { id: c.id, status: "terminee" }, "Campagne terminée")}>Terminer</Button>}
          {allowed("budget.validate") && !c.budgetValidatedAt && total(c) > 0 && <Button icon={<CheckI size={14} />} onClick={async () => { if (await ask("Valider le budget prévisionnel ?", <>Tu valides une enveloppe de <strong>{euro(total(c))}</strong> pour cette campagne. Chaque campagne publicitaire devra encore être validée individuellement avant toute dépense.</>, "Valider")) run("campaigns/validate-budget", { id: c.id }, "Budget prévisionnel validé"); }}>Valider le budget</Button>}
          {canManage && <Button icon={<CopyI size={14} />} onClick={async () => { const r = await run<Campaign>("campaigns/duplicate", { id: c.id }, "Campagne dupliquée"); if (r) router.push(`/hub/campagnes/${r.id}`); }}>Dupliquer</Button>}
          {canManage && <Button variant="danger" icon={<TrashI size={14} />} aria-label="Supprimer" onClick={async () => { if (await ask("Supprimer cette campagne ?", "Les publications déjà créées restent dans le calendrier.", "Supprimer", true)) { const r = await run("campaigns/delete", { id: c.id }, "Campagne supprimée"); if (r) router.push("/hub/campagnes"); } }} />}
        </div>
      </div>

      <Tabs className="mt-5" value={tab} onChange={setTab} tabs={[
        { id: "apercu", label: "Vue d'ensemble" }, { id: "planning", label: "Planning", count: c.plan.length }, { id: "publications", label: "Publications", count: posts.length },
        { id: "visuels", label: "Visuels & bannière" }, { id: "scripts", label: "Vidéos & scripts", count: c.scripts.length }, { id: "newsletter", label: "Newsletter", count: emails.length },
        { id: "publicites", label: "Publicités", count: ads.length }, ...(canManage ? [{ id: "modifier" as const, label: "Modifier" }] : []),
      ]} />

      <div className="mt-5">
        {tab === "apercu" && (
          <div className="grid gap-5 lg:grid-cols-3">
            <Card title="Stratégie de la campagne" className="lg:col-span-2">
              <dl className="grid gap-4 sm:grid-cols-2">
                <Info l="Objectif" v={c.objective} /><Info l="Cible" v={c.target} />
                <Info l="Concept créatif" v={c.concept} /><Info l="Message" v={c.message} />
                <Info l="Personas" v={c.personaIds.map((id) => personas.find((p) => p.id === id)?.name).filter(Boolean).join(", ") || "—"} />
                <Info l="Canaux" v={c.channels.join(", ")} />
                <Info l="Produits" v={c.productIds.map((id) => products.find((p) => p.id === id)?.name).filter(Boolean).join(", ") || "—"} />
                <Info l="Planning" v={`${frDay(c.startDate)} → ${frDay(c.endDate)}`} />
              </dl>
            </Card>
            <div className="space-y-5">
              <Card title="Budget prévisionnel" subtitle="Enveloppes proposées, à valider avant toute dépense.">
                <ul className="space-y-1.5 text-sm">{c.budget.map((b) => <li key={b.label} className="flex justify-between"><span>{b.label}</span><span className="tabular-nums">{euro(b.amount)}</span></li>)}</ul>
                <p className="mt-2 flex justify-between border-t border-line pt-2 font-semibold"><span>Total</span><span>{euro(total(c))}</span></p>
              </Card>
              <Card title="KPI marketing">
                <ul className="space-y-1.5 text-sm">{c.kpis.map((k) => <li key={k.label} className="flex justify-between gap-3"><span>{k.label}</span><span className="text-right font-medium">{k.target}</span></li>)}</ul>
                <p className="mt-3 text-xs text-forest-soft">Contenus validés : {validated}/{posts.length}. Les résultats se suivent dans Performances marketing.</p>
              </Card>
            </div>
          </div>
        )}

        {tab === "planning" && (
          <Card title="Planning des actions" subtitle="Jours relatifs au démarrage de la campagne (J+0).">
            <div className="hub-scroll overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-forest-soft"><tr><th className="p-2">Jour</th><th className="p-2">Date prévue</th><th className="p-2">Heure</th><th className="p-2">Plateforme</th><th className="p-2">Format</th><th className="p-2">Action</th><th className="p-2">Idée</th></tr></thead>
                <tbody>{c.plan.map((p, i) => <tr key={i} className="border-t border-line align-top"><td className="p-2 font-medium">J+{p.day}</td><td className="p-2">{frDay(addDays(c.startDate, p.day))}</td><td className="p-2">{p.hour}</td><td className="p-2"><PlatformBadge platform={p.platform} /></td><td className="p-2">{p.format}</td><td className="p-2 font-medium">{p.title}</td><td className="p-2 text-forest-soft">{p.idea}</td></tr>)}</tbody>
              </table>
            </div>
          </Card>
        )}

        {tab === "publications" && (!posts.length ? <Empty title="Aucune publication au calendrier" text="Active la campagne pour ajouter ses actions au calendrier éditorial." action={canManage && <Button variant="primary" onClick={() => setActivate(true)}>Activer</Button>} /> : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {posts.map((p) => (
              <button key={p.id} onClick={() => setOpen(p.id)} className="hub-card overflow-hidden text-left hover:border-forest">
                <VisualThumb visual={p.visual} width={240} />
                <div className="p-3"><p className="text-xs text-forest-soft">{PLATFORM_LABEL[p.platform]} · {frDay(p.date)}</p><p className="line-clamp-2 text-sm font-medium">{p.title}</p><StatusBadge status={p.status} className="mt-2" /></div>
              </button>
            ))}
          </div>
        ))}

        {tab === "visuels" && (
          <div className="space-y-5">
            <Card title="Bannière de site" subtitle="Générée aux couleurs de la campagne ; personnalisable dans le Studio, publiable sur le site via Gestion du site."
              action={<Button size="sm" icon={<DownloadI size={14} />} onClick={() => downloadDesign(banner, `banniere-${slug(c.name)}`)}>Télécharger</Button>}>
              <DesignPreview design={banner} width={1000} rounded />
              <p className="mt-2 text-sm"><strong>{c.banner?.title}</strong> — {c.banner?.text} · CTA « {c.banner?.cta} »</p>
            </Card>
            <Card title="Visuels des publications">
              {!posts.length ? <p className="text-sm text-forest-soft">Les visuels apparaîtront une fois la campagne activée.</p> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">{posts.map((p) => <button key={p.id} onClick={() => setOpen(p.id)} className="overflow-hidden rounded-md border border-line"><VisualThumb visual={p.visual} width={180} /></button>)}</div>}
            </Card>
          </div>
        )}

        {tab === "scripts" && (
          <div className="grid gap-4 md:grid-cols-2">
            {!c.scripts.length && <Empty title="Aucun script pour cette campagne" />}
            {c.scripts.map((s) => (
              <Card key={s.title} title={s.title}>
                <p className="text-sm"><strong>Hook :</strong> « {s.hook} »</p>
                <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">{s.scenes.map((x, i) => <li key={i}>{x}</li>)}</ol>
              </Card>
            ))}
            {posts.filter((p) => p.script).map((p) => <Card key={p.id} title={p.title}><p className="text-sm"><strong>Hook :</strong> « {p.script!.hook} »</p><Button size="sm" className="mt-3" onClick={() => setOpen(p.id)}>Voir le script complet</Button></Card>)}
          </div>
        )}

        {tab === "newsletter" && (!emails.length ? <Empty title="Aucune newsletter liée" action={<Link className="hub-btn hub-btn-primary" href="/hub/emailing">Créer une newsletter</Link>} /> : (
          <div className="space-y-2">{emails.map((m) => <Link key={m.id} href={`/hub/emailing?id=${m.id}`} className="hub-card flex items-center gap-3 p-4 hover:border-forest"><span className="flex-1"><span className="block font-medium">{m.name}</span><span className="text-sm text-forest-soft">Objet : {m.subject}</span></span><StatusBadge status={m.status} /><ArrowRightI size={14} /></Link>)}</div>
        ))}

        {tab === "publicites" && (!ads.length ? <Empty title="Aucune publicité liée" action={<Link className="hub-btn hub-btn-primary" href="/hub/ads">Préparer une publicité</Link>} /> : (
          <div className="space-y-2">{ads.map((a) => <Link key={a.id} href={`/hub/ads?id=${a.id}`} className="hub-card flex items-center gap-3 p-4 hover:border-forest"><span className="hub-badge bg-sage-soft">{AD_PLATFORM_LABEL[a.platform]}</span><span className="flex-1 font-medium">{a.name}</span><span className="text-sm">{euro(a.totalBudget)} {a.budgetValidated ? "· budget validé" : "· budget à valider"}</span><StatusBadge status={a.status} /></Link>)}</div>
        ))}

        {tab === "modifier" && canManage && (
          <Card>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nom"><input className="hub-input" value={draft.name} onChange={(e) => set("name", e.target.value)} /></Field>
              <Field label="Couleur"><input type="color" className="hub-input h-10 p-1" value={draft.color} onChange={(e) => set("color", e.target.value)} /></Field>
              {(["objective", "target", "concept", "message"] as const).map((k) => <Field key={k} label={{ objective: "Objectif", target: "Cible", concept: "Concept créatif", message: "Message" }[k]}><textarea className="hub-input" value={draft[k]} onChange={(e) => set(k, e.target.value)} /></Field>)}
              <Field label="Date de démarrage"><input type="date" className="hub-input" value={draft.startDate} onChange={(e) => set("startDate", e.target.value)} /></Field>
              <Field label="Durée (jours)"><input type="number" min={1} className="hub-input" value={draft.durationDays} onChange={(e) => set("durationDays", Number(e.target.value))} /></Field>
              <Field label="Canaux (séparés par des virgules)" className="md:col-span-2"><input className="hub-input" value={draft.channels.join(", ")} onChange={(e) => set("channels", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} /></Field>
              <Field label="Personas" className="md:col-span-2"><div className="flex flex-wrap gap-1.5">{personas.map((p) => { const on = draft.personaIds.includes(p.id); return <button type="button" key={p.id} onClick={() => set("personaIds", on ? draft.personaIds.filter((x) => x !== p.id) : [...draft.personaIds, p.id])} className={clsx("rounded-full border px-3 py-1 text-xs", on ? "border-forest bg-forest text-white" : "border-line")}>{p.name}</button>; })}</div></Field>
              <Field label="Produits" className="md:col-span-2"><div className="hub-scroll flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">{products.map((p) => { const on = draft.productIds.includes(p.id); return <button type="button" key={p.id} onClick={() => set("productIds", on ? draft.productIds.filter((x) => x !== p.id) : [...draft.productIds, p.id])} className={clsx("rounded-full border px-2.5 py-1 text-xs", on ? "border-forest bg-forest text-white" : "border-line")}>{p.name}</button>; })}</div></Field>
              <Field label="Budget (une ligne : libellé ; montant)" className="md:col-span-1"><textarea className="hub-input min-h-28" value={draft.budget.map((b) => `${b.label} ; ${b.amount}`).join("\n")} onChange={(e) => set("budget", e.target.value.split("\n").map((l) => { const [label, amount] = l.split(";"); return { label: (label ?? "").trim(), amount: Number(amount) || 0 }; }).filter((b) => b.label))} /></Field>
              <Field label="KPI (une ligne : indicateur ; cible)"><textarea className="hub-input min-h-28" value={draft.kpis.map((k) => `${k.label} ; ${k.target}`).join("\n")} onChange={(e) => set("kpis", e.target.value.split("\n").map((l) => { const [label, target] = l.split(";"); return { label: (label ?? "").trim(), target: (target ?? "").trim() }; }).filter((k) => k.label))} /></Field>
              <Field label="Bannière — titre"><input className="hub-input" value={draft.banner?.title ?? ""} onChange={(e) => set("banner", { title: e.target.value, text: draft.banner?.text ?? "", cta: draft.banner?.cta ?? "Découvrir" })} /></Field>
              <Field label="Bannière — texte et CTA"><div className="flex gap-2"><input className="hub-input" value={draft.banner?.text ?? ""} onChange={(e) => set("banner", { title: draft.banner?.title ?? "", text: e.target.value, cta: draft.banner?.cta ?? "Découvrir" })} /><input className="hub-input w-36" value={draft.banner?.cta ?? ""} onChange={(e) => set("banner", { title: draft.banner?.title ?? "", text: draft.banner?.text ?? "", cta: e.target.value })} /></div></Field>
            </div>
            <PlanEditor plan={draft.plan} onChange={(plan) => set("plan", plan)} />
            <div className="mt-5 flex justify-end gap-2"><Button onClick={() => setDraft(c)}>Annuler</Button><Button variant="primary" icon={<EditI size={14} />} disabled={busy} onClick={() => run("campaigns/update", draft, "Campagne enregistrée")}>Enregistrer</Button></div>
          </Card>
        )}
      </div>

      <ActivateModal campaign={activate ? c : null} start={start} setStart={setStart} onClose={() => setActivate(false)} busy={busy}
        onConfirm={async () => { const r = await run<{ created: number }>("campaigns/activate", { id: c.id, startDate: start }, (x) => `Campagne activée : ${x.created} actions ajoutées au calendrier.`); if (r) { setActivate(false); setTab("publications"); } }} />
      <PostDrawer post={open ? posts.find((p) => p.id === open) ?? null : null} refs={refs} onClose={() => setOpen(null)} />
    </div>
  );
}

function PlanEditor({ plan, onChange }: { plan: Campaign["plan"]; onChange: (p: Campaign["plan"]) => void }) {
  const upd = (i: number, patch: Partial<Campaign["plan"][number]>) => onChange(plan.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  return (
    <div className="mt-6">
      <p className="hub-label">Planning des actions</p>
      <div className="space-y-2">
        {plan.map((p, i) => (
          <div key={i} className="grid grid-cols-[70px_90px_150px_120px_1fr_36px] gap-2">
            <input type="number" min={0} className="hub-input" value={p.day} onChange={(e) => upd(i, { day: Number(e.target.value) })} aria-label="Jour" />
            <input type="time" className="hub-input" value={p.hour} onChange={(e) => upd(i, { hour: e.target.value })} aria-label="Heure" />
            <select className="hub-input" value={p.platform} onChange={(e) => upd(i, { platform: e.target.value as Platform })} aria-label="Plateforme">{(Object.keys(PLATFORM_LABEL) as Platform[]).map((x) => <option key={x} value={x}>{PLATFORM_LABEL[x]}</option>)}</select>
            <select className="hub-input" value={p.format} onChange={(e) => upd(i, { format: e.target.value as PostFormat })} aria-label="Format">{["post", "carrousel", "reel", "story", "video", "epingle", "article", "newsletter"].map((x) => <option key={x}>{x}</option>)}</select>
            <input className="hub-input" value={p.title} onChange={(e) => upd(i, { title: e.target.value })} aria-label="Titre" />
            <Button variant="ghost" icon={<TrashI size={14} />} aria-label="Retirer" onClick={() => onChange(plan.filter((_, j) => j !== i))} />
          </div>
        ))}
      </div>
      <Button size="sm" className="mt-2" icon={<PlusI size={14} />} onClick={() => onChange([...plan, { day: plan.length ? plan[plan.length - 1].day + 1 : 0, hour: "18:00", platform: "instagram", format: "post", title: "Nouvelle action", idea: "" }])}>Ajouter une action</Button>
    </div>
  );
}

const Info = ({ l, v }: { l: string; v: React.ReactNode }) => <div><dt className="hub-label">{l}</dt><dd className="text-sm leading-relaxed">{v}</dd></div>;
