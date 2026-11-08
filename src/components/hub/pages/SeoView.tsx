"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { products as catalog } from "@/data/products";
import type { Article, Keyword, Metric, Post } from "@/lib/hub/types";
import { frDay } from "@/lib/hub/dates";
import { Button, Card, Empty, Field, Modal, Notice, PageHeader, StatusBadge, Tabs, hubApi, num, useAction, useCan, useConfirm, useToast } from "../ui";
import { Markdown } from "../Markdown";
import { LineChart } from "../charts";
import { AlertI, ArrowRightI, CheckI, EditI, EyeI, ImageI, PlusI, RefreshI, SearchI, TrashI, SendI } from "../icons";

type Tab = "audit" | "motscles" | "metas" | "maillage" | "images" | "calendrier" | "articles" | "indicateurs";
interface ProductSeo { id: string; slug: string; name: string; kind: string; tagline: string; benefits: string[]; description: string; seoTitle: string; seoDescription: string; packshot?: string }
interface Audit { at: string; average: number; pages: { url: string; status: number; title: string; titleLength: number; description: string; descriptionLength: number; h1: number; imagesWithoutAlt: number; words: number; internalLinks: number; score: number; issues: { level: string; text: string }[]; productId?: string }[] }

const BRAND_SUFFIX = " · SKINCLEAN"; // ajouté automatiquement par le gabarit de titre du site
const suggestTitle = (p: ProductSeo) => { const t = `${p.name} — ${p.kind}`; return t.length + BRAND_SUFFIX.length <= 60 ? t : p.name.slice(0, 60 - BRAND_SUFFIX.length); };
/** Minuscule initiale (sauf sigles comme « SPF » ou « BHA ») pour enchaîner les bénéfices dans une phrase. */
const lowerFirst = (b: string) => (/^[A-ZÀ-Ý]{2,}/.test(b) ? b : b.charAt(0).toLowerCase() + b.slice(1));
const suggestDesc = (p: ProductSeo) => { const d = `${p.tagline}. ${p.benefits.slice(0, 2).map((b, i) => (i ? lowerFirst(b) : b)).join(", ")}. Formule lisible, conseils d'utilisation et routine avec le Skin Diag.`; return d.length <= 155 ? d : d.slice(0, 152).replace(/\s+\S*$/, "") + "…"; };

export function SeoView({ keywords, articles, blogSlots, products, linking, orphanProducts, gsc, seoMetrics }: {
  keywords: Keyword[]; articles: Article[]; blogSlots: Post[]; products: ProductSeo[];
  linking: { articleId: string; article: string; product: string; url: string; reason: string }[]; orphanProducts: { name: string; url: string; concerns: string }[];
  gsc: boolean; seoMetrics: Metric[];
}) {
  const sp = useSearchParams();
  const [tab, setTab] = useState<Tab>((sp.get("tab") as Tab) || "audit");
  const [articleId, setArticleId] = useState<string | null>(sp.get("id"));
  const allowed = useCan();
  const { run, busy } = useAction();
  const toast = useToast();

  return (
    <div>
      <PageHeader eyebrow="Référencement naturel" title="SEO — visibilité organique" intro="Audit réel des pages du site, mots-clés cibles, titres et meta descriptions, maillage interne, optimisation des images et articles de blog publiables sur le site."
        actions={allowed("seo.edit") && <Button icon={<RefreshI size={15} />} disabled={busy} onClick={async () => { const r = await run<{ synced: boolean; reason?: string; updated?: number }>("seo/gsc-sync", {}); if (r) toast(r.synced ? "ok" : "err", r.synced ? `Search Console : ${r.updated} mots-clés mis à jour` : r.reason ?? "Synchronisation impossible"); }}>Synchroniser Search Console</Button>} />
      <Tabs value={tab} onChange={setTab} tabs={[
        { id: "audit", label: "Audit des pages" }, { id: "motscles", label: "Mots-clés", count: keywords.length }, { id: "metas", label: "Titres & metas" },
        { id: "maillage", label: "Maillage interne", count: linking.length }, { id: "images", label: "Images" }, { id: "calendrier", label: "Calendrier SEO", count: blogSlots.length },
        { id: "articles", label: "Articles", count: articles.length }, { id: "indicateurs", label: "Indicateurs" },
      ]} />
      <div className="mt-5">
        {tab === "audit" && <AuditTab products={products} />}
        {tab === "motscles" && <KeywordsTab keywords={keywords} gsc={gsc} />}
        {tab === "metas" && <MetasTab products={products} />}
        {tab === "maillage" && (
          <div className="grid gap-5 lg:grid-cols-2">
            <Card title="Liens à ajouter dans les articles" subtitle="Produits cités sans lien vers leur fiche.">
              {!linking.length ? <p className="text-sm text-forest-soft">Aucun lien manquant détecté.</p> : (
                <ul className="divide-y divide-line">{linking.map((l, i) => <li key={i} className="flex items-center gap-3 py-2.5 text-sm"><span className="flex-1"><span className="block font-medium">{l.article}</span><span className="text-forest-soft">{l.reason} Ajouter <code className="rounded bg-sage-soft px-1">[{l.product}]({l.url})</code></span></span><Button size="sm" onClick={() => { setArticleId(l.articleId); setTab("articles"); }}>Ouvrir</Button></li>)}</ul>
              )}
            </Card>
            <Card title="Fiches produits sans lien depuis le blog" subtitle="Pages à soutenir par un article ou un lien contextuel.">
              <ul className="hub-scroll max-h-[480px] divide-y divide-line overflow-y-auto">{orphanProducts.map((p) => <li key={p.url} className="flex items-center justify-between gap-3 py-2 text-sm"><span><span className="font-medium">{p.name}</span><span className="block text-xs text-forest-soft">Thèmes : {p.concerns || "—"}</span></span><Link href={p.url} target="_blank" className="text-xs underline">Voir la fiche</Link></li>)}</ul>
            </Card>
          </div>
        )}
        {tab === "images" && <ImagesTab />}
        {tab === "calendrier" && (
          <Card title="Calendrier des contenus SEO" subtitle="4 articles par mois, chaque mardi (fréquence ajustable).">
            <ul className="divide-y divide-line">
              {blogSlots.map((p) => {
                const a = articles.find((x) => x.id === p.articleId);
                return (
                  <li key={p.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                    <span className="w-44 shrink-0 text-forest-soft">{frDay(p.date)}</span>
                    <span className="min-w-0 flex-1"><span className="block font-medium">{p.title}</span><span className="text-xs text-forest-soft">{a ? `Mot-clé : ${a.keyword}` : p.caption.split("\n")[0]}</span></span>
                    {a ? <><StatusBadge status={a.status} /><Button size="sm" onClick={() => { setArticleId(a.id); setTab("articles"); }}>Ouvrir l&apos;article</Button></> : <span className="hub-badge bg-[#F1F0EC]">Brief à rédiger</span>}
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
        {tab === "articles" && <ArticlesTab articles={articles} selected={articleId} onSelect={setArticleId} keywords={keywords} />}
        {tab === "indicateurs" && (
          <div className="space-y-5">
            {seoMetrics.length ? (
              <Card title="Visibilité organique (données réelles)">
                <LineChart labels={seoMetrics.map((m) => frDay(m.date).split(" ").slice(1, 3).join(" "))} series={[{ name: "Clics organiques", color: "#2a78d6", values: seoMetrics.map((m) => m.values.clicks ?? 0) }, { name: "Impressions", color: "#eb6834", values: seoMetrics.map((m) => m.values.impressions ?? 0) }]} />
              </Card>
            ) : <Empty title="Pas encore de données de visibilité réelles" text="Les données de démonstration restent disponibles, clairement étiquetées, dans Performances marketing." action={<Link href="/hub/performances?source=demo" className="hub-btn hub-btn-secondary">Voir la démonstration</Link>} />}
            <Card title="Évolution des positions" subtitle="Mots-clés mesurés (Search Console ou saisie manuelle).">
              {keywords.filter((k) => k.history?.length).length ? (
                <table className="w-full text-sm"><thead className="text-left text-xs uppercase text-forest-soft"><tr><th className="p-2">Mot-clé</th><th className="p-2">Position</th><th className="p-2">Évolution</th><th className="p-2">Source</th></tr></thead>
                  <tbody>{keywords.filter((k) => k.history?.length).map((k) => { const h = k.history!; const d = h.length > 1 ? h[h.length - 2].position - h[h.length - 1].position : 0; return <tr key={k.id} className="border-t border-line"><td className="p-2">{k.keyword}</td><td className="p-2 tabular-nums">{k.position}</td><td className={clsx("p-2 tabular-nums", d > 0 ? "text-[#2E5E3E]" : d < 0 ? "text-[#8A3D1E]" : "")}>{d > 0 ? `▲ ${d.toFixed(1)}` : d < 0 ? `▼ ${Math.abs(d).toFixed(1)}` : "="}</td><td className="p-2 text-forest-soft">{k.source === "search_console" ? "Search Console" : "Saisie manuelle"}</td></tr>; })}</tbody></table>
              ) : <p className="text-sm text-forest-soft">Aucune position mesurée pour l&apos;instant.</p>}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function AuditTab({ products }: { products: ProductSeo[] }) {
  const [audit, setAudit] = useState<Audit | null>(null);
  const [loading, setLoading] = useState(false);
  const [edit, setEdit] = useState<ProductSeo | null>(null);
  const toast = useToast();
  const runAudit = async () => {
    setLoading(true);
    try { setAudit(await hubApi<Audit>("seo/audit")); } catch (e) { toast("err", (e as Error).message); } finally { setLoading(false); }
  };
  return (
    <div className="space-y-4">
      <Card title="Audit technique et éditorial" subtitle="Chaque page du site est réellement chargée et analysée (title, meta description, H1, attributs alt, volume de texte, liens internes)."
        action={<Button variant="primary" icon={<SearchI size={15} />} disabled={loading} onClick={runAudit}>{loading ? "Analyse en cours… (≈ 30 s)" : audit ? "Relancer l'audit" : "Lancer l'audit"}</Button>}>
        {!audit ? <p className="text-sm text-forest-soft">Lance l&apos;audit pour analyser l&apos;accueil, les catégories, les {products.length} fiches produits, les kits et les articles publiés.</p> : (
          <div className="flex flex-wrap gap-6 text-sm">
            <p><span className="block text-xs text-forest-soft">Score moyen</span><span className="font-display text-3xl font-semibold">{audit.average}/100</span></p>
            <p><span className="block text-xs text-forest-soft">Pages analysées</span><span className="font-display text-3xl font-semibold">{audit.pages.length}</span></p>
            <p><span className="block text-xs text-forest-soft">Erreurs</span><span className="font-display text-3xl font-semibold text-[#8A2B2B]">{audit.pages.reduce((s, p) => s + p.issues.filter((i) => i.level === "erreur").length, 0)}</span></p>
            <p><span className="block text-xs text-forest-soft">Alertes</span><span className="font-display text-3xl font-semibold text-[#8A3D1E]">{audit.pages.reduce((s, p) => s + p.issues.filter((i) => i.level === "alerte").length, 0)}</span></p>
            <p className="self-end text-xs text-forest-soft">Analyse du {new Date(audit.at).toLocaleString("fr-FR")}</p>
          </div>
        )}
      </Card>
      {audit && (
        <div className="hub-card hub-scroll overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-sage-soft text-left text-xs uppercase tracking-wider text-forest-soft"><tr><th className="p-3">Page</th><th className="p-3">Score</th><th className="p-3">Title</th><th className="p-3">Meta</th><th className="p-3">H1</th><th className="p-3">Mots</th><th className="p-3">Points à corriger</th><th className="p-3" /></tr></thead>
            <tbody>
              {audit.pages.map((p) => (
                <tr key={p.url} className="border-t border-line align-top">
                  <td className="p-3"><Link href={p.url} target="_blank" className="font-medium underline-offset-2 hover:underline">{p.url}</Link><p className="line-clamp-1 text-xs text-forest-soft">{p.title}</p></td>
                  <td className="p-3"><span className={clsx("hub-badge font-semibold", p.score >= 80 ? "bg-[#E3EFE6] text-[#2E5E3E]" : p.score >= 60 ? "bg-[#FFF3D6] text-[#7A5B00]" : "bg-[#F8E1E1] text-[#8A2B2B]")}>{p.score}</span></td>
                  <td className="p-3 tabular-nums">{p.titleLength}</td><td className="p-3 tabular-nums">{p.descriptionLength}</td><td className="p-3">{p.h1}</td><td className="p-3 tabular-nums">{p.words}</td>
                  <td className="p-3"><ul className="space-y-0.5">{p.issues.map((i, k) => <li key={k} className={clsx("flex gap-1.5 text-xs", i.level === "erreur" ? "text-[#8A2B2B]" : i.level === "alerte" ? "text-[#8A3D1E]" : "text-forest-soft")}><AlertI size={12} className="mt-0.5 shrink-0" />{i.text}</li>)}{!p.issues.length && <li className="flex items-center gap-1 text-xs text-[#2E5E3E]"><CheckI size={12} />RAS</li>}</ul></td>
                  <td className="p-3">{p.productId && <Button size="sm" icon={<EditI size={13} />} onClick={() => setEdit(products.find((x) => x.id === p.productId) ?? null)}>Optimiser</Button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <MetaModal product={edit} onClose={() => setEdit(null)} />
    </div>
  );
}

function MetaModal({ product, onClose }: { product: ProductSeo | null; onClose: () => void }) {
  const [t, setT] = useState("");
  const [d, setD] = useState("");
  const { run, busy } = useAction();
  useEffect(() => { if (product) { setT(product.seoTitle || suggestTitle(product)); setD(product.seoDescription || suggestDesc(product)); } }, [product]);
  if (!product) return null;
  return (
    <Modal open onClose={onClose} title={`Titre & meta — ${product.name}`}
      footer={<><Button onClick={onClose}>Annuler</Button><Button variant="primary" disabled={busy} onClick={async () => { await run("seo/product-meta", { productId: product.id, seoTitle: t, seoDescription: d }, "Publié sur la fiche produit du site"); onClose(); }}>Enregistrer sur le site</Button></>}>
      <div className="space-y-4">
        <Field label="Balise title (sans la marque)" hint={<span className={clsx(t.length + BRAND_SUFFIX.length > 60 && "font-semibold text-[#8A3D1E]")}>{t.length + BRAND_SUFFIX.length} / 60 caractères avec « · SKINCLEAN » ajouté automatiquement</span>}><input className="hub-input" value={t} onChange={(e) => setT(e.target.value)} /></Field>
        <Field label="Meta description" hint={<span className={clsx((d.length > 155 || d.length < 110) && "font-semibold text-[#8A3D1E]")}>{d.length} caractères (idéal 120-155)</span>}><textarea className="hub-input min-h-24" value={d} onChange={(e) => setD(e.target.value)} /></Field>
        <div className="rounded-lg border border-line bg-white p-4">
          <p className="text-xs text-forest-soft">Aperçu Google (indicatif)</p>
          <p className="mt-1 text-xs text-[#202124]">skinclean.fr › produits › {product.slug}</p>
          <p className="text-lg leading-snug text-[#1a0dab]">{(t + BRAND_SUFFIX).length > 60 ? (t + BRAND_SUFFIX).slice(0, 58) + "…" : t + BRAND_SUFFIX}</p>
          <p className="text-sm text-[#4d5156]">{d.length > 158 ? d.slice(0, 155) + "…" : d}</p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => { setT(suggestTitle(product)); setD(suggestDesc(product)); }}>Réappliquer la suggestion</Button>
      </div>
    </Modal>
  );
}

function MetasTab({ products }: { products: ProductSeo[] }) {
  const [edit, setEdit] = useState<ProductSeo | null>(null);
  const allowed = useCan();
  return (
    <div className="hub-card hub-scroll overflow-x-auto">
      <table className="w-full min-w-[900px] text-sm">
        <thead className="bg-sage-soft text-left text-xs uppercase tracking-wider text-forest-soft"><tr><th className="p-3">Fiche produit</th><th className="p-3">Title publié</th><th className="p-3">Meta description publiée</th><th className="p-3" /></tr></thead>
        <tbody>
          {products.map((p) => {
            const title = `${p.seoTitle || `${p.name} — ${p.kind}`}${BRAND_SUFFIX}`;
            const desc = p.seoDescription || `${p.tagline}. ${p.description.slice(0, 140)}`;
            return (
              <tr key={p.id} className="border-t border-line align-top">
                <td className="p-3 font-medium">{p.name}<span className="block text-xs font-normal text-forest-soft">{p.seoTitle ? "Optimisé depuis le Hub" : "Valeur par défaut du site"}</span></td>
                <td className="p-3">{title}<span className={clsx("block text-xs", title.length > 60 ? "text-[#8A3D1E]" : "text-forest-soft")}>{title.length} car.</span></td>
                <td className="p-3 text-forest-soft">{desc.slice(0, 160)}<span className={clsx("block text-xs", desc.length > 160 ? "text-[#8A3D1E]" : "")}>{desc.length} car.</span></td>
                <td className="p-3">{allowed("seo.edit") && <Button size="sm" icon={<EditI size={13} />} onClick={() => setEdit(p)}>Optimiser</Button>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <MetaModal product={edit} onClose={() => setEdit(null)} />
    </div>
  );
}

function KeywordsTab({ keywords, gsc }: { keywords: Keyword[]; gsc: boolean }) {
  const [edit, setEdit] = useState<Partial<Keyword> | null>(null);
  const [cluster, setCluster] = useState("");
  const { run, busy } = useAction();
  const allowed = useCan();
  const { ask, dialog } = useConfirm();
  const clusters = [...new Set(keywords.map((k) => k.cluster))];
  const shown = keywords.filter((k) => !cluster || k.cluster === cluster).sort((a, b) => a.priority - b.priority || a.cluster.localeCompare(b.cluster));
  return (
    <div className="space-y-4">
      {dialog}
      <Notice>Classement par priorité (1 = prioritaire). La difficulté est une <strong>estimation qualitative (hypothèse)</strong>. Volumes et positions ne s&apos;affichent que s&apos;ils sont mesurés ({gsc ? "Search Console connectée" : "connecte Search Console ou saisis une position relevée manuellement"}).</Notice>
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setCluster("")} className={clsx("hub-badge border py-1", !cluster ? "border-forest bg-forest text-white" : "border-line bg-white")}>Tous</button>
        {clusters.map((c) => <button key={c} onClick={() => setCluster(c)} className={clsx("hub-badge border py-1", cluster === c ? "border-forest bg-forest text-white" : "border-line bg-white")}>{c}</button>)}
        {allowed("seo.edit") && <Button size="sm" variant="primary" className="ml-auto" icon={<PlusI size={14} />} onClick={() => setEdit({ keyword: "", cluster: cluster || "Divers", intent: "informationnelle", priority: 2, targetUrl: "/", difficulty: "moyenne" })}>Ajouter un mot-clé</Button>}
      </div>
      <div className="hub-card hub-scroll overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-sage-soft text-left text-xs uppercase tracking-wider text-forest-soft"><tr><th className="p-3">Mot-clé</th><th className="p-3">Thème</th><th className="p-3">Intention</th><th className="p-3">Priorité</th><th className="p-3">Page cible</th><th className="p-3">Difficulté (estim.)</th><th className="p-3">Impressions</th><th className="p-3">Position</th><th className="p-3" /></tr></thead>
          <tbody>
            {shown.map((k) => (
              <tr key={k.id} className="border-t border-line">
                <td className="p-3 font-medium">{k.keyword}</td><td className="p-3">{k.cluster}</td><td className="p-3 text-forest-soft">{k.intent}</td>
                <td className="p-3"><span className={clsx("hub-badge", k.priority === 1 ? "bg-forest text-white" : "bg-sage-soft")}>P{k.priority}</span></td>
                <td className="p-3"><Link href={k.targetUrl} target="_blank" className="text-xs underline">{k.targetUrl}</Link></td>
                <td className="p-3 text-forest-soft">{k.difficulty}</td>
                <td className="p-3 tabular-nums">{k.volume != null ? num(k.volume) : "—"}</td>
                <td className="p-3 tabular-nums">{k.position != null ? k.position : "—"}</td>
                <td className="p-3">{allowed("seo.edit") && <div className="flex gap-1"><Button size="sm" variant="ghost" icon={<EditI size={13} />} aria-label="Modifier" onClick={() => setEdit(k)} /><Button size="sm" variant="ghost" icon={<TrashI size={13} />} aria-label="Supprimer" onClick={async () => { if (await ask("Supprimer ce mot-clé ?", k.keyword, "Supprimer", true)) run("keywords/delete", { id: k.id }, "Mot-clé supprimé"); }} /></div>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "Modifier le mot-clé" : "Nouveau mot-clé"}
        footer={<><Button onClick={() => setEdit(null)}>Annuler</Button><Button variant="primary" disabled={busy || !edit?.keyword} onClick={async () => { await run(edit?.id ? "keywords/update" : "keywords/create", edit, "Mot-clé enregistré"); setEdit(null); }}>Enregistrer</Button></>}>
        {edit && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mot-clé" className="sm:col-span-2"><input className="hub-input" value={edit.keyword} onChange={(e) => setEdit({ ...edit, keyword: e.target.value })} /></Field>
            <Field label="Thème"><input className="hub-input" value={edit.cluster} onChange={(e) => setEdit({ ...edit, cluster: e.target.value })} /></Field>
            <Field label="Intention"><select className="hub-input" value={edit.intent} onChange={(e) => setEdit({ ...edit, intent: e.target.value as Keyword["intent"] })}>{["informationnelle", "commerciale", "transactionnelle", "navigationnelle"].map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Priorité"><select className="hub-input" value={edit.priority} onChange={(e) => setEdit({ ...edit, priority: Number(e.target.value) as 1 })}><option value={1}>1 — prioritaire</option><option value={2}>2</option><option value={3}>3</option></select></Field>
            <Field label="Difficulté estimée"><select className="hub-input" value={edit.difficulty} onChange={(e) => setEdit({ ...edit, difficulty: e.target.value as Keyword["difficulty"] })}>{["faible", "moyenne", "forte"].map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Page cible" className="sm:col-span-2"><input className="hub-input" value={edit.targetUrl} onChange={(e) => setEdit({ ...edit, targetUrl: e.target.value })} /></Field>
            {edit.id && <Field label="Position relevée (manuelle)" hint="Ajoute un point à l'historique, daté d'aujourd'hui."><input type="number" step={0.1} className="hub-input" value={edit.position ?? ""} onChange={(e) => setEdit({ ...edit, position: e.target.value === "" ? null : Number(e.target.value) })} /></Field>}
          </div>
        )}
      </Modal>
    </div>
  );
}

function ImagesTab() {
  const [data, setData] = useState<{ total: number; totalSize: number; toOptimize: number; images: { path: string; size: number; width: number; height: number; format: string; usedByProduct: boolean; issues: string[]; webpExists: boolean }[] } | null>(null);
  const [only, setOnly] = useState(true);
  const toast = useToast();
  const allowed = useCan();
  const load = async () => { try { const r = await fetch("/api/hub/seo/images"); setData(await r.json()); } catch (e) { toast("err", (e as Error).message); } };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const optimize = async (path: string) => {
    try {
      const r = await hubApi<{ path: string; before: number; after: number; updatedProducts: string[] }>("seo/optimize-image", { path });
      toast("ok", `WebP créé : ${Math.round(r.before / 1024)} Ko → ${Math.round(r.after / 1024)} Ko${r.updatedProducts.length ? `. Fiche(s) mise(s) à jour : ${r.updatedProducts.join(", ")}` : ""}`);
      load();
    } catch (e) { toast("err", (e as Error).message); }
  };
  if (!data) return <p className="text-sm text-forest-soft">Analyse des images…</p>;
  const rows = data.images.filter((i) => !only || i.issues.length);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card><p className="text-xs text-forest-soft">Images analysées</p><p className="font-display text-2xl font-semibold">{data.total}</p></Card>
        <Card><p className="text-xs text-forest-soft">Poids total</p><p className="font-display text-2xl font-semibold">{(data.totalSize / 1048576).toFixed(1)} Mo</p></Card>
        <Card><p className="text-xs text-forest-soft">À optimiser</p><p className="font-display text-2xl font-semibold">{data.toOptimize}</p></Card>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-forest" checked={only} onChange={(e) => setOnly(e.target.checked)} />Afficher uniquement les images à optimiser</label>
      <div className="hub-card hub-scroll overflow-x-auto">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-sage-soft text-left text-xs uppercase text-forest-soft"><tr><th className="p-3">Image</th><th className="p-3">Poids</th><th className="p-3">Dimensions</th><th className="p-3">Format</th><th className="p-3">Diagnostic</th><th className="p-3" /></tr></thead>
          <tbody>{rows.map((i) => (
            <tr key={i.path} className="border-t border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <td className="p-3"><span className="flex items-center gap-2"><img src={i.path} alt="" className="h-10 w-10 rounded bg-sage-soft object-contain" loading="lazy" /><span className="max-w-[260px] truncate text-xs">{i.path}</span>{i.usedByProduct && <span className="hub-badge bg-sage-soft">fiche produit</span>}</span></td>
              <td className="p-3 tabular-nums">{Math.round(i.size / 1024)} Ko</td><td className="p-3 tabular-nums">{i.width}×{i.height}</td><td className="p-3">{i.format}</td>
              <td className="p-3 text-xs text-[#8A3D1E]">{i.issues.join(" · ") || <span className="text-[#2E5E3E]">OK</span>}</td>
              <td className="p-3">{allowed("seo.edit") && /\.(png|jpe?g)$/i.test(i.path) && !i.webpExists && <Button size="sm" icon={<ImageI size={13} />} onClick={() => optimize(i.path)}>Convertir en WebP</Button>}{i.webpExists && <span className="text-xs text-forest-soft">WebP disponible</span>}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <p className="text-xs text-forest-soft">Les images affichées via le composant Image de Next.js sont déjà servies en AVIF/WebP redimensionné ; la conversion réduit en plus le poids des fichiers sources et des visuels utilisés hors du site (e-mails, réseaux).</p>
    </div>
  );
}

function ArticlesTab({ articles, selected, onSelect, keywords }: { articles: Article[]; selected: string | null; onSelect: (id: string | null) => void; keywords: Keyword[] }) {
  const current = articles.find((a) => a.id === selected) ?? null;
  const [draft, setDraft] = useState<Article | null>(current);
  const [preview, setPreview] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newKw, setNewKw] = useState("");
  const { run, busy } = useAction();
  const allowed = useCan();
  const { ask, dialog } = useConfirm();
  const editorRef = useRef<HTMLDivElement>(null);
  useEffect(() => { setDraft(current); }, [current]);
  // Un clic sur un article l'affiche immédiatement, mis en page comme sur le site, et fait défiler jusqu'à lui
  useEffect(() => {
    if (!selected) return;
    setPreview(true); // eslint-disable-line react-hooks/set-state-in-effect
    requestAnimationFrame(() => {
      const el = editorRef.current;
      if (el && (el.getBoundingClientRect().top < 0 || el.getBoundingClientRect().top > window.innerHeight * 0.4)) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [selected]);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(current), [draft, current]);
  const kwCount = draft ? (draft.content.toLowerCase().match(new RegExp(draft.keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? []).length : 0;
  const prods = draft ? catalog.filter((p) => draft.productIds.includes(p.id)) : [];

  return (
    <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
      {dialog}
      <div className="hub-scroll space-y-2 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:self-start lg:overflow-y-auto lg:pr-1">
        {allowed("seo.edit") && <Button variant="primary" className="w-full" icon={<PlusI size={15} />} onClick={() => setNewOpen(true)}>Nouvel article</Button>}
        {articles.map((a) => (
          <button key={a.id} onClick={() => onSelect(a.id)} className={clsx("hub-card block w-full p-3 text-left hover:border-forest", selected === a.id && "border-forest")}>
            <p className="line-clamp-2 text-sm font-medium">{a.title}</p>
            <p className="mt-1 flex items-center justify-between text-xs text-forest-soft"><span>{a.keyword}</span><StatusBadge status={a.status === "publie" ? "publie" : a.status} /></p>
          </button>
        ))}
      </div>
      <div ref={editorRef} className="min-w-0 scroll-mt-4">
      {!draft ? <Empty title="Sélectionne un article" text="Clique sur un article pour le lire tel qu'il apparaîtra sur le site, le modifier puis le publier dans la rubrique Conseils (/conseils)." /> : (
        <Card title={draft.title} subtitle={draft.status === "publie" ? `En ligne sur /conseils/${draft.slug}` : "Non publié"}
          action={<>
            <Button size="sm" icon={<EyeI size={14} />} onClick={() => setPreview((x) => !x)}>{preview ? "Éditer" : "Prévisualiser"}</Button>
            {draft.status === "publie" && <Link href={`/conseils/${draft.slug}`} target="_blank" className="hub-btn hub-btn-secondary hub-btn-sm">Voir sur le site <ArrowRightI size={13} /></Link>}
          </>}>
          {preview ? (
            <article className="hub-prose mx-auto max-w-2xl">
              <p className="eyebrow text-forest-soft">Conseils SKINCLEAN · {draft.readingMinutes} min</p>
              <h1 className="mt-2 font-display text-3xl font-semibold">{draft.title}</h1>
              <p className="mt-2 text-forest-soft">{draft.excerpt}</p>
              {draft.cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.cover} alt="" className="my-6 aspect-[16/9] w-full rounded-lg bg-sage-soft object-contain p-6" />
              )}
              <Markdown source={draft.content} />
              {!!prods.length && <p className="mt-6 text-sm">Produits mis en avant : {prods.map((p) => p.name).join(", ")}</p>}
            </article>
          ) : (
            <fieldset disabled={!allowed("seo.edit")} className="grid gap-4 md:grid-cols-2">
              <Field label="Titre (H1)" className="md:col-span-2"><input className="hub-input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field>
              <Field label="URL" hint={`/conseils/${draft.slug}`}><input className="hub-input" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} /></Field>
              <Field label="Mot-clé principal" hint={`Présent ${kwCount} fois dans le texte`}><input className="hub-input" list="kw-list" value={draft.keyword} onChange={(e) => setDraft({ ...draft, keyword: e.target.value })} /><datalist id="kw-list">{keywords.map((k) => <option key={k.id} value={k.keyword} />)}</datalist></Field>
              <Field label="Balise title" hint={`${draft.metaTitle.length} / 60`}><input className="hub-input" value={draft.metaTitle} onChange={(e) => setDraft({ ...draft, metaTitle: e.target.value })} /></Field>
              <Field label="Meta description" hint={`${draft.metaDescription.length} / 155`}><input className="hub-input" value={draft.metaDescription} onChange={(e) => setDraft({ ...draft, metaDescription: e.target.value })} /></Field>
              <Field label="Chapô" className="md:col-span-2"><textarea className="hub-input" value={draft.excerpt} onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })} /></Field>
              <Field label="Image de couverture (URL)"><input className="hub-input" value={draft.cover ?? ""} onChange={(e) => setDraft({ ...draft, cover: e.target.value })} /></Field>
              <Field label="Produits associés"><select multiple className="hub-input h-24" value={draft.productIds} onChange={(e) => setDraft({ ...draft, productIds: [...e.target.selectedOptions].map((o) => o.value) })}>{catalog.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
              <Field label="Contenu (Markdown : ## titre, - liste, **gras**, [lien](/produits/…))" className="md:col-span-2"><textarea className="hub-input min-h-[420px] font-mono text-[13px]" value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} /></Field>
            </fieldset>
          )}
          <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-line pt-4">
            {allowed("seo.edit") && <Button variant="danger" icon={<TrashI size={14} />} onClick={async () => { if (await ask("Supprimer cet article ?", draft.title, "Supprimer", true)) { await run("articles/delete", { id: draft.id }, "Article supprimé"); onSelect(null); } }}>Supprimer</Button>}
            {dirty && <Button variant="primary" disabled={busy} onClick={() => run("articles/update", draft, "Article enregistré")}>Enregistrer</Button>}
            {!dirty && allowed("seo.edit") && draft.status === "brouillon" && <Button icon={<SendI size={14} />} onClick={() => run("articles/submit", { id: draft.id }, "Article envoyé en validation")}>Soumettre à validation</Button>}
            {!dirty && allowed("content.publish") && draft.status !== "publie" && <Button variant="primary" icon={<CheckI size={14} />} disabled={busy} onClick={() => run("articles/publish", { id: draft.id }, `Article publié sur /conseils/${draft.slug}`)}>Publier sur le site</Button>}
            {!dirty && allowed("content.publish") && draft.status === "publie" && <Button onClick={() => run("articles/unpublish", { id: draft.id }, "Article retiré du site")}>Dépublier</Button>}
          </div>
        </Card>
      )}
      </div>
      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Nouvel article" size="sm"
        footer={<><Button onClick={() => setNewOpen(false)}>Annuler</Button><Button variant="primary" disabled={!newTitle || busy} onClick={async () => { const a = await run<Article>("articles/create", { title: newTitle, keyword: newKw }, "Article créé"); if (a) { setNewOpen(false); setNewTitle(""); onSelect(a.id); } }}>Créer</Button></>}>
        <div className="space-y-3"><Field label="Titre"><input className="hub-input" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} /></Field><Field label="Mot-clé principal"><input className="hub-input" list="kw-list2" value={newKw} onChange={(e) => setNewKw(e.target.value)} /><datalist id="kw-list2">{keywords.map((k) => <option key={k.id} value={k.keyword} />)}</datalist></Field></div>
      </Modal>
    </div>
  );
}
