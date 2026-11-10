"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import type { AdCampaign, AdPlatform, Metric } from "@/lib/hub/types";
import { AD_PLATFORM_LABEL } from "@/lib/hub/types";
import { frDay, todayYmd } from "@/lib/hub/dates";
import { Button, Card, DemoBanner, Empty, Field, Modal, Notice, PageHeader, StatusBadge, Tabs, copyText, euro, hubApi, num, useAction, useCan, useConfirm, useToast } from "../ui";
import { VisualThumb } from "../design/DesignPreview";
import { LineChart } from "../charts";
import { BrandAvatar } from "../PostPreview";
import { CheckI, ClockI, CopyI, DownloadI, EditI, PauseI, PlayI, PlusI, SendI, TrashI } from "../icons";

const utmUrl = (a: AdCampaign) => {
  try {
    const u = new URL(a.url);
    u.searchParams.set("utm_source", a.utm.source);
    u.searchParams.set("utm_medium", a.utm.medium);
    u.searchParams.set("utm_campaign", a.utm.campaign);
    if (a.utm.content) u.searchParams.set("utm_content", a.utm.content);
    if (a.utm.term) u.searchParams.set("utm_term", a.utm.term);
    return u.toString();
  } catch {
    return "URL invalide";
  }
};

type Filter = "" | AdPlatform | "performances";

export function AdsView({ ads, campaigns, metrics }: { ads: AdCampaign[]; campaigns: { id: string; name: string }[]; metrics: Metric[] }) {
  const sp = useSearchParams();
  const [filter, setFilter] = useState<Filter>("");
  const [selId, setSelId] = useState<string | null>(sp.get("id") ?? ads[0]?.id ?? null);
  const [create, setCreate] = useState<null | { name: string; platform: AdPlatform }>(null);
  const { run, busy } = useAction();
  const allowed = useCan();
  const shown = ads.filter((a) => !filter || filter === "performances" || a.platform === filter);
  const sel = ads.find((a) => a.id === selId) ?? null;

  return (
    <div>
      <PageHeader eyebrow="Publicité" title="SEA & Social Ads" intro="Prépare et pilote tes campagnes Google Ads, Meta Ads et TikTok Ads : audience, annonces, budget, dates, URL et paramètres UTM. L'activation réelle exige une connexion officielle et un budget validé."
        actions={allowed("campaign.manage") && <Button variant="primary" icon={<PlusI size={15} />} onClick={() => setCreate({ name: "", platform: "meta_ads" })}>Nouvelle campagne publicitaire</Button>} />
      <Tabs value={filter} onChange={setFilter} tabs={[
        { id: "", label: "Toutes", count: ads.length },
        ...(["google_ads", "meta_ads", "tiktok_ads"] as AdPlatform[]).map((p) => ({ id: p as Filter, label: AD_PLATFORM_LABEL[p], count: ads.filter((a) => a.platform === p).length })),
        { id: "performances", label: "Performances publicitaires" },
      ]} />
      <div className="mt-5">
        {filter === "performances" ? <AdPerformance ads={ads} metrics={metrics} /> : (
          <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
            <div className="space-y-2">
              {shown.map((a) => (
                <button key={a.id} onClick={() => setSelId(a.id)} className={clsx("hub-card block w-full p-3 text-left hover:border-forest", selId === a.id && "border-forest ring-1 ring-forest")}>
                  <div className="flex items-center justify-between gap-2"><span className="hub-badge bg-sage-soft">{AD_PLATFORM_LABEL[a.platform]}</span><StatusBadge status={a.status} /></div>
                  <p className="mt-2 text-sm font-medium">{a.name}</p>
                  <p className="mt-0.5 text-xs text-forest-soft">{frDay(a.startDate)} → {frDay(a.endDate)} · {euro(a.totalBudget)}{a.budgetValidated ? " · budget validé" : ""}</p>
                </button>
              ))}
              {!shown.length && <Empty title="Aucune campagne" />}
            </div>
            {sel ? <AdDetail key={sel.id + sel.updatedAt} ad={sel} campaigns={campaigns} onDeleted={() => setSelId(null)} /> : <Empty title="Sélectionne une campagne publicitaire" />}
          </div>
        )}
      </div>
      <Modal open={!!create} onClose={() => setCreate(null)} title="Nouvelle campagne publicitaire" size="sm"
        footer={<><Button onClick={() => setCreate(null)}>Annuler</Button><Button variant="primary" disabled={!create?.name || busy} onClick={async () => { const r = await run<AdCampaign>("ads/create", create, "Campagne créée (brouillon)"); if (r) { setCreate(null); setSelId(r.id); } }}>Créer</Button></>}>
        {create && <div className="space-y-3"><Field label="Nom"><input className="hub-input" value={create.name} onChange={(e) => setCreate({ ...create, name: e.target.value })} /></Field><Field label="Plateforme"><select className="hub-input" value={create.platform} onChange={(e) => setCreate({ ...create, platform: e.target.value as AdPlatform })}>{Object.entries(AD_PLATFORM_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field></div>}
      </Modal>
    </div>
  );
}

function AdDetail({ ad, campaigns, onDeleted }: { ad: AdCampaign; campaigns: { id: string; name: string }[]; onDeleted: () => void }) {
  const [tab, setTab] = useState<"apercu" | "modifier">("apercu");
  const [d, setD] = useState<AdCampaign>(ad);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [activation, setActivation] = useState<string | null>(null);
  const [externalId, setExternalId] = useState("");
  const { run, busy } = useAction();
  const allowed = useCan();
  const toast = useToast();
  const { ask, dialog } = useConfirm();
  const dirty = JSON.stringify(d) !== JSON.stringify(ad);
  const days = Math.max(1, Math.round((new Date(ad.endDate).getTime() - new Date(ad.startDate).getTime()) / 864e5) + 1);
  const set = <K extends keyof AdCampaign>(k: K, v: AdCampaign[K]) => setD((x) => ({ ...x, [k]: v }));

  return (
    <Card pad={false}>
      {dialog}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-5">
        <div>
          <p className="text-xs text-forest-soft">{AD_PLATFORM_LABEL[ad.platform]} · {campaigns.find((c) => c.id === ad.campaignId)?.name ?? "Hors campagne"}</p>
          <h2 className="font-display text-xl font-semibold">{ad.name}</h2>
          <p className="mt-1 text-sm text-forest-soft">{ad.objective}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge status={ad.status} />
          <a href={`/api/hub/ads/export?id=${ad.id}`} className="hub-btn hub-btn-secondary hub-btn-sm"><DownloadI size={13} />Exporter{ad.platform === "google_ads" ? " (Google Ads Editor)" : " CSV"}</a>
          {allowed("campaign.manage") && <Button size="sm" icon={<CopyI size={13} />} onClick={() => run("ads/duplicate", { id: ad.id }, "Campagne dupliquée")}>Dupliquer</Button>}
          {allowed("campaign.manage") && ad.status !== "active" && <Button size="sm" variant="danger" icon={<TrashI size={13} />} aria-label="Supprimer" onClick={async () => { if (await ask("Supprimer cette campagne ?", ad.name, "Supprimer", true)) { await run("ads/delete", { id: ad.id }, "Supprimée"); onDeleted(); } }} />}
        </div>
      </div>

      <div className="grid gap-px bg-line sm:grid-cols-4">
        {[["Budget / jour", euro(ad.dailyBudget)], ["Budget total", euro(ad.totalBudget)], ["Durée", `${days} jours`], ["Budget", ad.budgetValidated ? `Validé par ${ad.budgetValidated.by}` : "À valider"]].map(([l, v]) => <div key={l} className="bg-white p-4"><p className="text-xs text-forest-soft">{l}</p><p className="font-medium">{v}</p></div>)}
      </div>

      <div className="p-5">
        <Tabs value={tab} onChange={setTab} tabs={[{ id: "apercu", label: "Prévisualiser" }, { id: "modifier", label: "Modifier" }]} />
        {tab === "apercu" && (
          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              {ad.ads.map((x) => <AdPreview key={x.id} platform={ad.platform} ad={x} url={ad.url} />)}
            </div>
            <dl className="space-y-3 text-sm">
              <div><dt className="hub-label">Audience</dt><dd>{ad.audience.locations} · {ad.audience.age} ans · {ad.audience.gender}<br /><span className="text-forest-soft">Intérêts : {ad.audience.interests.join(", ") || "—"}{ad.audience.exclusions ? ` · Exclusions : ${ad.audience.exclusions}` : ""}</span></dd></div>
              <div><dt className="hub-label">Messages</dt><dd>{ad.messages.join(" · ") || "—"}</dd></div>
              <div><dt className="hub-label">Dates</dt><dd>{frDay(ad.startDate)} → {frDay(ad.endDate)}</dd></div>
              {ad.platform === "google_ads" && <div><dt className="hub-label">Mots-clés</dt><dd className="flex flex-wrap gap-1">{ad.keywords.map((k) => <span key={k.text} className="hub-badge bg-sage-soft">{k.match === "exact" ? `[${k.text}]` : k.match === "expression" ? `"${k.text}"` : k.text}</span>)}</dd>{!!ad.negativeKeywords.length && <dd className="mt-1 text-xs text-forest-soft">Exclus : {ad.negativeKeywords.join(", ")}</dd>}</div>}
              <div><dt className="hub-label">URL de destination avec UTM</dt><dd className="break-all rounded bg-sage-soft p-2 font-mono text-xs">{utmUrl(ad)}</dd><Button size="sm" className="mt-1.5" icon={<CopyI size={13} />} onClick={() => copyText(utmUrl(ad), toast, "URL copiée")}>Copier l&apos;URL</Button></div>
              {ad.externalId && <div><dt className="hub-label">Identifiant plateforme</dt><dd>{ad.externalId}</dd></div>}
            </dl>
          </div>
        )}
        {tab === "modifier" && (
          <fieldset disabled={!allowed("content.edit") || ad.status === "active"} className="mt-5 grid gap-4 md:grid-cols-2">
            {ad.status === "active" && <div className="md:col-span-2"><Notice tone="warn">Mets la campagne en pause pour la modifier.</Notice></div>}
            <Field label="Nom"><input className="hub-input" value={d.name} onChange={(e) => set("name", e.target.value)} /></Field>
            <Field label="Objectif publicitaire"><select className="hub-input" value={d.objective} onChange={(e) => set("objective", e.target.value)}>{[...new Set(["Notoriété — portée maximale", "Trafic qualifié — protéger les recherches sur la marque", "Trafic — diagnostics complétés", "Trafic vers les kits", "Vues vidéo", "Vues vidéo + trafic Skin Diag", "Trafic qualifié sur les requêtes actif / problème", "Trafic sur le guide cadeaux", d.objective])].map((o) => <option key={o}>{o}</option>)}</select></Field>
            <Field label="Campagne marketing liée"><select className="hub-input" value={d.campaignId ?? ""} onChange={(e) => set("campaignId", e.target.value || undefined)}><option value="">Aucune</option>{campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            <Field label="Lieux"><input className="hub-input" value={d.audience.locations} onChange={(e) => set("audience", { ...d.audience, locations: e.target.value })} /></Field>
            <Field label="Âge"><input className="hub-input" value={d.audience.age} onChange={(e) => set("audience", { ...d.audience, age: e.target.value })} /></Field>
            <Field label="Genre"><input className="hub-input" value={d.audience.gender} onChange={(e) => set("audience", { ...d.audience, gender: e.target.value })} /></Field>
            <Field label="Centres d'intérêt (virgules)" className="md:col-span-2"><input className="hub-input" value={d.audience.interests.join(", ")} onChange={(e) => set("audience", { ...d.audience, interests: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} /></Field>
            <Field label="Messages (une ligne par message)" className="md:col-span-2"><textarea className="hub-input" value={d.messages.join("\n")} onChange={(e) => set("messages", e.target.value.split("\n"))} /></Field>
            {d.ads.map((x, i) => (
              <div key={x.id} className="rounded-lg border border-line p-3 md:col-span-2">
                <p className="hub-label">Annonce {i + 1}</p>
                <div className="grid gap-2 md:grid-cols-2">
                  <Field label={d.platform === "google_ads" ? "Titres (séparés par |, 30 car. chacun)" : "Titre"}><input className="hub-input" value={x.headline} onChange={(e) => set("ads", d.ads.map((y, j) => (j === i ? { ...y, headline: e.target.value } : y)))} /></Field>
                  <Field label="Bouton (CTA)"><input className="hub-input" value={x.cta} onChange={(e) => set("ads", d.ads.map((y, j) => (j === i ? { ...y, cta: e.target.value } : y)))} /></Field>
                  <Field label={d.platform === "google_ads" ? "Description 1 (90 car.)" : "Texte principal"} className="md:col-span-2" hint={`${x.text.length} caractères`}><textarea className="hub-input" value={x.text} onChange={(e) => set("ads", d.ads.map((y, j) => (j === i ? { ...y, text: e.target.value } : y)))} /></Field>
                  {d.platform === "google_ads" && <Field label="Description 2" className="md:col-span-2"><input className="hub-input" value={x.description ?? ""} onChange={(e) => set("ads", d.ads.map((y, j) => (j === i ? { ...y, description: e.target.value } : y)))} /></Field>}
                </div>
                {d.ads.length > 1 && <Button size="sm" variant="ghost" icon={<TrashI size={13} />} onClick={() => set("ads", d.ads.filter((_, j) => j !== i))}>Retirer l&apos;annonce</Button>}
              </div>
            ))}
            <div className="md:col-span-2"><Button size="sm" icon={<PlusI size={13} />} onClick={() => set("ads", [...d.ads, { id: `ad${Date.now()}`, headline: "", text: "", cta: "En savoir plus", visual: d.ads[0]?.visual }])}>Ajouter une annonce</Button></div>
            <Field label="Budget / jour (€)"><input type="number" min={1} className="hub-input" value={d.dailyBudget} onChange={(e) => set("dailyBudget", Number(e.target.value))} /></Field>
            <Field label="Budget total maximum (€)" hint="Toute modification du budget annule la validation."><input type="number" min={1} className="hub-input" value={d.totalBudget} onChange={(e) => set("totalBudget", Number(e.target.value))} /></Field>
            <Field label="Début"><input type="date" className="hub-input" value={d.startDate} onChange={(e) => set("startDate", e.target.value)} /></Field>
            <Field label="Fin"><input type="date" className="hub-input" value={d.endDate} onChange={(e) => set("endDate", e.target.value)} /></Field>
            <Field label="URL de destination" className="md:col-span-2"><input className="hub-input" value={d.url} onChange={(e) => set("url", e.target.value)} /></Field>
            {(["source", "medium", "campaign", "content", "term"] as const).map((k) => <Field key={k} label={`utm_${k}`}><input className="hub-input" value={d.utm[k] ?? ""} onChange={(e) => set("utm", { ...d.utm, [k]: e.target.value || undefined })} /></Field>)}
            {d.platform === "google_ads" && (
              <>
                <Field label="Mots-clés (une ligne : [exact], &quot;expression&quot; ou large)" className="md:col-span-1"><textarea className="hub-input min-h-28" value={d.keywords.map((k) => (k.match === "exact" ? `[${k.text}]` : k.match === "expression" ? `"${k.text}"` : k.text)).join("\n")} onChange={(e) => set("keywords", e.target.value.split("\n").filter((l) => l.trim()).map((l) => { const t = l.trim(); return t.startsWith("[") ? { text: t.replace(/[[\]]/g, ""), match: "exact" as const } : t.startsWith('"') ? { text: t.replace(/"/g, ""), match: "expression" as const } : { text: t, match: "large" as const }; }))} /></Field>
                <Field label="Mots-clés à exclure (une ligne)"><textarea className="hub-input min-h-28" value={d.negativeKeywords.join("\n")} onChange={(e) => set("negativeKeywords", e.target.value.split("\n").filter((l) => l.trim()))} /></Field>
              </>
            )}
            <div className="flex justify-end gap-2 md:col-span-2"><Button onClick={() => setD(ad)} disabled={!dirty}>Annuler</Button><Button variant="primary" icon={<EditI size={14} />} disabled={!dirty || busy} onClick={() => run("ads/update", d, "Campagne enregistrée")}>Enregistrer</Button></div>
          </fieldset>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-cream p-4">
        {allowed("content.edit") && ad.status === "brouillon" && <Button icon={<SendI size={14} />} onClick={() => run("ads/submit", { id: ad.id }, "Envoyée pour validation du budget")}>Soumettre à validation</Button>}
        {allowed("budget.validate") && !ad.budgetValidated && <Button variant="primary" icon={<CheckI size={14} />} onClick={() => setBudgetOpen(true)}>Valider le budget</Button>}
        {allowed("content.publish") && ad.budgetValidated && ad.status === "prete" && <Button icon={<ClockI size={14} />} onClick={() => run("ads/schedule", { id: ad.id }, "Diffusion programmée (à activer sur la plateforme)")}>Programmer</Button>}
        {allowed("content.publish") && ad.budgetValidated && !["active"].includes(ad.status) && <Button variant="primary" icon={<PlayI size={14} />} onClick={async () => { const r = await hubApi<{ activated: boolean; reason?: string }>("ads/activate", { id: ad.id }).catch((e) => { toast("err", e.message); return null; }); if (r && !r.activated) setActivation(r.reason ?? ""); }}>Activer</Button>}
        {allowed("content.publish") && ["active", "programmee"].includes(ad.status) && <Button icon={<PauseI size={14} />} onClick={() => run("ads/pause", { id: ad.id }, ad.status === "active" ? "En pause dans le Hub — pense à la mettre en pause sur la plateforme." : "Mise en pause")}>Mettre en pause</Button>}
      </div>

      <Modal open={budgetOpen} onClose={() => setBudgetOpen(false)} title="Valider le budget publicitaire" size="sm"
        footer={<><Button onClick={() => setBudgetOpen(false)}>Annuler</Button><Button variant="primary" onClick={async () => { await run("ads/validate-budget", { id: ad.id, amount: ad.totalBudget }, "Budget validé"); setBudgetOpen(false); }}>Je valide {euro(ad.totalBudget)}</Button></>}>
        <p className="text-sm">Tu autorises une dépense maximale de <strong>{euro(ad.totalBudget)}</strong> ({euro(ad.dailyBudget)}/jour) du {frDay(ad.startDate)} au {frDay(ad.endDate)} sur {AD_PLATFORM_LABEL[ad.platform]}.</p>
        <p className="mt-3 text-xs text-forest-soft">La validation est enregistrée dans l&apos;historique (nom, date, montant). Toute modification ultérieure du budget nécessitera une nouvelle validation.</p>
      </Modal>
      <Modal open={activation !== null} onClose={() => setActivation(null)} title="Activer la campagne"
        footer={<><Button onClick={() => setActivation(null)}>Fermer</Button><Button variant="primary" onClick={async () => { await run("ads/declare-active", { id: ad.id, externalId }, "Campagne déclarée active (activation faite sur la plateforme)"); setActivation(null); }}>Je l&apos;ai activée sur la plateforme</Button></>}>
        <Notice tone="warn">{activation}</Notice>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
          <li><a className="underline" href={`/api/hub/ads/export?id=${ad.id}`}>Télécharge l&apos;export</a>{ad.platform === "google_ads" ? " et importe-le dans Google Ads Editor." : " et reprends ses paramètres dans le gestionnaire de publicités."}</li>
          <li>Vérifie le budget ({euro(ad.totalBudget)}) et les dates, puis active la campagne sur {AD_PLATFORM_LABEL[ad.platform]}.</li>
          <li>Reviens ici pour déclarer l&apos;activation (identifiant facultatif).</li>
        </ol>
        <Field label="Identifiant de la campagne sur la plateforme (facultatif)" className="mt-3"><input className="hub-input" value={externalId} onChange={(e) => setExternalId(e.target.value)} /></Field>
      </Modal>
    </Card>
  );
}

function AdPreview({ platform, ad, url }: { platform: AdPlatform; ad: AdCampaign["ads"][number]; url: string }) {
  const host = (() => { try { return new URL(url).host; } catch { return "skinclean.fr"; } })();
  if (platform === "google_ads") {
    const heads = ad.headline.split("|").map((h) => h.trim()).filter(Boolean);
    return (
      <div className="rounded-lg border border-line bg-white p-4 font-sans">
        <p className="text-xs text-[#202124]"><strong>Sponsorisé</strong></p>
        <p className="mt-1 flex items-center gap-2 text-xs text-[#202124]"><BrandAvatar size={22} />SKINCLEAN · {host}</p>
        <p className="mt-1 text-lg leading-snug text-[#1a0dab]">{heads.slice(0, 3).join(" | ") || "Titre de l'annonce"}</p>
        <p className="text-sm text-[#4d5156]">{ad.text} {ad.description}</p>
      </div>
    );
  }
  return (
    <div className={clsx("mx-auto overflow-hidden rounded-xl border border-line bg-white font-sans shadow-sm", platform === "tiktok_ads" ? "max-w-[260px]" : "max-w-[380px]")}>
      <div className="flex items-center gap-2 p-3"><BrandAvatar size={32} /><div className="text-[13px] leading-tight"><p className="font-semibold">skinclean</p><p className="text-[11px] text-[#737373]">Sponsorisé</p></div></div>
      {platform === "meta_ads" && <p className="px-3 pb-2 text-[13px]">{ad.text}</p>}
      <div className={platform === "tiktok_ads" ? "aspect-[9/16]" : undefined}><VisualThumb visual={ad.visual} width={380} playable={platform === "tiktok_ads"} fill={platform === "tiktok_ads"} /></div>
      <div className="flex items-center justify-between gap-2 bg-[#F0F2F5] px-3 py-2.5"><div className="min-w-0"><p className="text-[11px] uppercase text-[#65676B]">{host}</p><p className="truncate text-[13px] font-semibold">{ad.headline}</p></div><span className="shrink-0 rounded-md bg-[#E4E6EB] px-3 py-1.5 text-[13px] font-semibold">{ad.cta}</span></div>
      {platform === "tiktok_ads" && <p className="p-3 text-[12px]">{ad.text}</p>}
    </div>
  );
}

function AdPerformance({ ads, metrics }: { ads: AdCampaign[]; metrics: Metric[] }) {
  const real = metrics.filter((m) => m.source !== "demo");
  const [source, setSource] = useState<"reel" | "demo">(real.length ? "reel" : "demo");
  const [entry, setEntry] = useState<null | Record<string, string>>(null);
  const { run } = useAction();
  const allowed = useCan();
  const rows = source === "reel" ? real : metrics.filter((m) => m.source === "demo");
  const t = useMemo(() => {
    const s = (k: string) => rows.reduce((a, m) => a + (m.values[k] ?? 0), 0);
    const impressions = s("impressions"), clicks = s("clicks"), spend = s("spend"), reach = s("reach"), views = s("videoViews");
    return { impressions, clicks, spend, reach, views, ctr: impressions ? (clicks / impressions) * 100 : 0, cpc: clicks ? spend / clicks : 0, cpm: impressions ? (spend / impressions) * 1000 : 0, freq: reach ? impressions / reach : 0 };
  }, [rows]);
  useEffect(() => { if (!real.length) setSource("demo"); }, [real.length]);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-md border border-line p-0.5">
          <button onClick={() => setSource("reel")} className={clsx("rounded px-3 py-1.5 text-sm", source === "reel" ? "bg-forest text-white" : "text-forest-soft")}>Données réelles ({real.length})</button>
          <button onClick={() => setSource("demo")} className={clsx("rounded px-3 py-1.5 text-sm", source === "demo" ? "bg-forest text-white" : "text-forest-soft")}>Données d&apos;exemple</button>
        </div>
        {allowed("content.edit") && <Button size="sm" className="ml-auto" icon={<PlusI size={13} />} onClick={() => setEntry({ adId: ads[0]?.id ?? "", date: todayYmd(), impressions: "", reach: "", clicks: "", spend: "", videoViews: "" })}>Saisir des statistiques</Button>}
      </div>
      {source === "demo" && <DemoBanner>Données de <strong>démonstration</strong> générées pour illustrer le tableau de bord : elles ne correspondent à aucune diffusion réelle et ne sont jamais additionnées aux données réelles.</DemoBanner>}
      {source === "reel" && !real.length ? <Empty title="Aucune statistique publicitaire réelle" text="Saisis les chiffres relevés dans tes gestionnaires de publicités (ou connecte les comptes) pour suivre la diffusion." /> : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {[["Impressions", num(t.impressions)], ["Portée", num(t.reach)], ["Clics", num(t.clicks)], ["CTR", `${t.ctr.toFixed(2).replace(".", ",")} %`], ["CPC", `${t.cpc.toFixed(2).replace(".", ",")} €`], ["CPM", `${t.cpm.toFixed(2).replace(".", ",")} €`], ["Dépenses", euro(t.spend)], ["Fréquence", t.freq.toFixed(2).replace(".", ",")], ["Visionnages vidéo", num(t.views)]].map(([l, v]) => <Card key={l}><p className="text-xs text-forest-soft">{l}</p><p className="font-display text-xl font-semibold tabular-nums">{v}</p></Card>)}
          </div>
          <Card title="Diffusion dans le temps" subtitle="Impressions et clics (deux graphiques séparés : échelles différentes)">
            <LineChart labels={rows.map((m) => frDay(m.date).split(" ").slice(1, 3).join(" "))} series={[{ name: "Impressions", color: "#2a78d6", values: rows.map((m) => m.values.impressions ?? 0) }]} height={180} />
            <div className="mt-4"><LineChart labels={rows.map((m) => frDay(m.date).split(" ").slice(1, 3).join(" "))} series={[{ name: "Clics", color: "#eb6834", values: rows.map((m) => m.values.clicks ?? 0) }]} height={180} /></div>
          </Card>
        </>
      )}
      <p className="text-xs text-forest-soft">Ce tableau ne mesure que la diffusion publicitaire. Les ventes, le chiffre d&apos;affaires et le panier moyen relèveront du CRM.</p>
      <Modal open={!!entry} onClose={() => setEntry(null)} title="Saisir des statistiques publicitaires" size="sm"
        footer={<><Button onClick={() => setEntry(null)}>Annuler</Button><Button variant="primary" onClick={async () => { const { adId, date, ...v } = entry!; await run("metrics/create", { channel: "ads", adId, date, values: Object.fromEntries(Object.entries(v).filter(([, x]) => x !== "")) }, "Statistiques enregistrées (source : saisie manuelle)"); setEntry(null); }}>Enregistrer</Button></>}>
        {entry && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Campagne" className="sm:col-span-2"><select className="hub-input" value={entry.adId} onChange={(e) => setEntry({ ...entry, adId: e.target.value })}>{ads.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
            <Field label="Date (fin de période)" className="sm:col-span-2"><input type="date" className="hub-input" value={entry.date} onChange={(e) => setEntry({ ...entry, date: e.target.value })} /></Field>
            {[["impressions", "Impressions"], ["reach", "Portée"], ["clicks", "Clics"], ["spend", "Dépenses (€)"], ["videoViews", "Visionnages vidéo"]].map(([k, l]) => <Field key={k} label={l}><input type="number" min={0} className="hub-input" value={entry[k]} onChange={(e) => setEntry({ ...entry, [k]: e.target.value })} /></Field>)}
          </div>
        )}
      </Modal>
    </div>
  );
}
