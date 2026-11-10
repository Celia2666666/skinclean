"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import clsx from "clsx";
import type { Metric, Platform } from "@/lib/hub/types";
import { PLATFORM_LABEL } from "@/lib/hub/types";
import { frDay, todayYmd, addDays } from "@/lib/hub/dates";
import { Button, Card, DemoBanner, Empty, Field, Modal, PageHeader, StatusBadge, euro, num, useAction, useCan } from "../ui";
import { BarChart, ENTITY_COLOR, LineChart } from "../charts";
import { DownloadI, PlusI, TrashI } from "../icons";

interface Editorial {
  planned: number; done: number; doneApi: number; pending: number; respect: number | null;
  late: { id: string; title: string; date: string; platform: Platform; status: string }[]; byPlatform: [string, number][];
}
const SOCIAL: Platform[] = ["instagram", "tiktok", "facebook", "pinterest"];
const pct = (a: number, b: number) => (b ? (a / b) * 100 : 0);
const fr = (n: number, d = 1) => n.toLocaleString("fr-FR", { maximumFractionDigits: d, minimumFractionDigits: d });

export function PerformanceView({ metrics, editorial, initialSource, keywords }: { metrics: Metric[]; editorial: Editorial; initialSource?: "demo"; keywords: { keyword: string; position: number; history: { date: string; position: number }[] }[] }) {
  const realCount = metrics.filter((m) => m.source !== "demo").length;
  const [source, setSource] = useState<"reel" | "demo">(initialSource ?? (realCount ? "reel" : "demo"));
  const [weeks, setWeeks] = useState(8);
  const [entry, setEntry] = useState<null | { channel: string; date: string; values: Record<string, string> }>(null);
  const { run } = useAction();
  const allowed = useCan();
  const since = addDays(todayYmd(), -7 * weeks);
  const ms = useMemo(() => metrics.filter((m) => (source === "demo" ? m.source === "demo" : m.source !== "demo") && m.date >= since).sort((a, b) => a.date.localeCompare(b.date)), [metrics, source, since]);
  const by = (ch: string) => ms.filter((m) => m.channel === ch);
  const sum = (rows: Metric[], k: string) => rows.reduce((s, m) => s + (m.values[k] ?? 0), 0);
  const dates = [...new Set(ms.filter((m) => SOCIAL.includes(m.channel as Platform)).map((m) => m.date))].sort();
  const label = (d: string) => frDay(d).split(" ").slice(1, 3).join(" ");

  const social = SOCIAL.map((p) => {
    const r = by(p);
    const reach = sum(r, "reach"), likes = sum(r, "likes"), comments = sum(r, "comments"), shares = sum(r, "shares"), saves = sum(r, "saves");
    return { p, posts: sum(r, "posts"), reach, impressions: sum(r, "impressions"), likes, comments, shares, saves, engagement: pct(likes + comments + shares + saves, reach), followers: sum(r, "followers") };
  });
  const tot = social.reduce((a, s) => ({ posts: a.posts + s.posts, reach: a.reach + s.reach, impressions: a.impressions + s.impressions, likes: a.likes + s.likes, comments: a.comments + s.comments, shares: a.shares + s.shares, saves: a.saves + s.saves, followers: a.followers + s.followers }), { posts: 0, reach: 0, impressions: 0, likes: 0, comments: 0, shares: 0, saves: 0, followers: 0 });
  const ads = by("ads"); const adI = sum(ads, "impressions"), adC = sum(ads, "clicks"), adS = sum(ads, "spend");
  const seo = by("seo");
  const mail = by("email"); const del = sum(mail, "delivered");

  return (
    <div>
      <PageHeader eyebrow="Pilotage" title="Performances marketing" intro="Uniquement les performances de communication : réseaux sociaux, publicité, SEO, e-mailing et gestion éditoriale. Les données de démonstration ne sont jamais mélangées aux données réelles."
        actions={<>
          <a href={`/api/hub/report?source=${source === "demo" ? "demo" : "reel"}`} className="hub-btn hub-btn-secondary"><DownloadI size={15} />Rapport CSV</a>
          <Button icon={<DownloadI size={15} />} onClick={() => window.print()}>Rapport PDF (impression)</Button>
          {allowed("content.edit") && <Button variant="primary" icon={<PlusI size={15} />} onClick={() => setEntry({ channel: "instagram", date: todayYmd(), values: {} })}>Saisir des statistiques</Button>}
        </>} />

      <div className="hub-card mb-4 flex flex-wrap items-center gap-3 p-3 print:hidden">
        <div className="flex rounded-md border border-line p-0.5">
          <button onClick={() => setSource("reel")} className={clsx("rounded px-3 py-1.5 text-sm", source === "reel" ? "bg-forest text-white" : "text-forest-soft")}>Données réelles ({realCount})</button>
          <button onClick={() => setSource("demo")} className={clsx("rounded px-3 py-1.5 text-sm", source === "demo" ? "bg-forest text-white" : "text-forest-soft")}>Données d&apos;exemple</button>
        </div>
        <select className="hub-input w-auto py-1.5" value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} aria-label="Période"><option value={4}>4 dernières semaines</option><option value={8}>8 dernières semaines</option><option value={13}>3 derniers mois</option><option value={52}>12 derniers mois</option></select>
      </div>
      {source === "demo" ? <DemoBanner>Exemple de tableau de bord : chiffres fictifs, remplacés par tes vrais résultats dès que tes comptes sont connectés ou que tu saisis tes statistiques.</DemoBanner> : null}

      <div className="space-y-6">
        <Section title="Réseaux sociaux">
          {!by("instagram").length && !by("tiktok").length && !by("facebook").length && !by("pinterest").length ? <Empty title="Pas de statistiques sociales sur la période" /> : (
            <>
              <Tiles items={[["Publications", num(tot.posts)], ["Portée", num(tot.reach)], ["Impressions", num(tot.impressions)], ["Likes", num(tot.likes)], ["Commentaires", num(tot.comments)], ["Partages", num(tot.shares)], ["Enregistrements", num(tot.saves)], ["Taux d'engagement", `${fr(pct(tot.likes + tot.comments + tot.shares + tot.saves, tot.reach))} %`], ["Nouveaux abonnés", `+${num(tot.followers)}`]]} />
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <Card title="Portée par réseau" subtitle="Comptes uniques touchés par semaine">
                  <LineChart labels={dates.map(label)} series={SOCIAL.filter((p) => by(p).length).map((p) => ({ name: PLATFORM_LABEL[p], color: ENTITY_COLOR[p], values: dates.map((d) => by(p).find((m) => m.date === d)?.values.reach ?? 0) }))} />
                </Card>
                <Card title="Taux d'engagement par réseau" subtitle="(likes + commentaires + partages + enregistrements) / portée">
                  <BarChart items={social.filter((s) => s.reach).map((s) => ({ label: PLATFORM_LABEL[s.p], value: Math.round(s.engagement * 100) / 100, color: ENTITY_COLOR[s.p] }))} unit=" %" />
                </Card>
                <Card title="Croissance des abonnés" subtitle="Nouveaux abonnés par semaine">
                  <LineChart labels={dates.map(label)} series={SOCIAL.filter((p) => by(p).length).map((p) => ({ name: PLATFORM_LABEL[p], color: ENTITY_COLOR[p], values: dates.map((d) => by(p).find((m) => m.date === d)?.values.followers ?? 0) }))} />
                </Card>
                <Card title="Détail par réseau" pad={false}>
                  <table className="w-full text-sm"><thead className="bg-sage-soft text-left text-xs uppercase text-forest-soft"><tr><th className="p-2.5">Réseau</th><th className="p-2.5">Publi.</th><th className="p-2.5">Portée</th><th className="p-2.5">Impr.</th><th className="p-2.5">Engag.</th><th className="p-2.5">Abonnés</th></tr></thead>
                    <tbody>{social.map((s) => <tr key={s.p} className="border-t border-line"><td className="p-2.5"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: ENTITY_COLOR[s.p] }} />{PLATFORM_LABEL[s.p]}</span></td><td className="p-2.5 tabular-nums">{s.posts}</td><td className="p-2.5 tabular-nums">{num(s.reach)}</td><td className="p-2.5 tabular-nums">{num(s.impressions)}</td><td className="p-2.5 tabular-nums">{fr(s.engagement)} %</td><td className="p-2.5 tabular-nums">+{num(s.followers)}</td></tr>)}</tbody></table>
                </Card>
              </div>
            </>
          )}
        </Section>

        <Section title="Publicité" link={{ href: "/hub/ads", label: "Détail par campagne" }}>
          {!ads.length ? <Empty title="Pas de statistiques publicitaires sur la période" /> : (
            <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
              <Tiles items={[["Budget consommé", euro(adS)], ["Impressions", num(adI)], ["Clics", num(adC)], ["CTR", `${fr(pct(adC, adI), 2)} %`], ["CPC", `${fr(adC ? adS / adC : 0, 2)} €`], ["CPM", `${fr(adI ? (adS / adI) * 1000 : 0, 2)} €`]]} cols="grid-cols-2 sm:grid-cols-3" />
              <Card title="Budget consommé par semaine"><BarChart items={ads.map((m) => ({ label: label(m.date), value: m.values.spend ?? 0, color: "#2a78d6" }))} unit=" €" /></Card>
            </div>
          )}
        </Section>

        <Section title="SEO" link={{ href: "/hub/seo?tab=indicateurs", label: "Module SEO" }}>
          {!seo.length ? <Empty title="Pas de données de visibilité organique sur la période" text="Connecte Google Search Console pour suivre clics, impressions et positions." /> : (
            <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
              <Tiles items={[["Clics organiques", num(sum(seo, "clicks"))], ["Impressions", num(sum(seo, "impressions"))], ["CTR organique", `${fr(pct(sum(seo, "clicks"), sum(seo, "impressions")), 2)} %`], ["Position moyenne", fr(seo.at(-1)?.values.position ?? 0)]]} cols="grid-cols-2" />
              <Card title="Visibilité organique">
                <LineChart labels={seo.map((m) => label(m.date))} series={[{ name: "Impressions", color: "#2a78d6", values: seo.map((m) => m.values.impressions ?? 0) }]} height={160} />
                <div className="mt-3"><LineChart labels={seo.map((m) => label(m.date))} series={[{ name: "Position moyenne (plus bas = mieux)", color: "#eb6834", values: seo.map((m) => m.values.position ?? 0) }]} height={140} invert /></div>
              </Card>
            </div>
          )}
          {source === "reel" && keywords.length > 0 && <Card title="Évolution des mots-clés" className="mt-4"><ul className="grid gap-2 text-sm sm:grid-cols-2">{keywords.map((k) => { const h = k.history; const d = h.length > 1 ? h[h.length - 2].position - h[h.length - 1].position : 0; return <li key={k.keyword} className="flex justify-between gap-3 rounded border border-line px-3 py-2"><span>{k.keyword}</span><span className="tabular-nums">{k.position} {d ? <span className={d > 0 ? "text-[#2E5E3E]" : "text-[#8A3D1E]"}>{d > 0 ? "▲" : "▼"}{fr(Math.abs(d))}</span> : null}</span></li>; })}</ul></Card>}
        </Section>

        <Section title="E-mailing" link={{ href: "/hub/emailing", label: "Module E-mailing" }}>
          {!mail.length ? <Empty title="Pas de statistiques d'e-mailing sur la période" /> : (
            <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
              <Tiles items={[["E-mails délivrés", num(del)], ["Taux d'ouverture estimé", `${fr(pct(sum(mail, "opens"), del))} %`], ["Taux de clic", `${fr(pct(sum(mail, "clicks"), del), 2)} %`], ["Désabonnements", num(sum(mail, "unsubscribes"))]]} cols="grid-cols-2" />
              <Card title="Ouvertures et clics par envoi">
                <LineChart labels={mail.map((m) => label(m.date))} series={[{ name: "Ouvertures", color: "#2a78d6", values: mail.map((m) => m.values.opens ?? 0) }, { name: "Clics", color: "#eb6834", values: mail.map((m) => m.values.clicks ?? 0) }]} height={180} />
                <p className="mt-2 text-xs text-forest-soft">Le taux d&apos;ouverture est une estimation (blocage des pixels par certains clients mail, comme la protection de la confidentialité d&apos;Apple Mail).</p>
              </Card>
            </div>
          )}
        </Section>

        <Section title="Gestion éditoriale" note="Toujours calculée sur les données réelles du calendrier.">
          <Tiles items={[["Publications prévues", num(editorial.planned)], ["Publications réalisées", `${num(editorial.done)}`], ["Dont confirmées par API", num(editorial.doneApi)], ["En retard", num(editorial.late.length)], ["En attente de validation", num(editorial.pending)], ["Respect du calendrier", editorial.respect === null ? "—" : `${editorial.respect} %`]]} cols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6" />
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card title="Contenus prévus par plateforme"><BarChart items={editorial.byPlatform.map(([p, n]) => ({ label: PLATFORM_LABEL[p as Platform], value: n, color: "#4A6354" }))} /></Card>
            <Card title="Publications en retard" subtitle="Date passée, non publiées">
              {!editorial.late.length ? <p className="text-sm text-forest-soft">Aucun retard 🎉</p> : <ul className="hub-scroll max-h-64 divide-y divide-line overflow-y-auto">{editorial.late.map((p) => <li key={p.id}><Link href={`/hub/calendrier?post=${p.id}`} className="flex items-center gap-3 py-2 text-sm hover:underline"><span className="w-32 shrink-0 text-forest-soft">{frDay(p.date)}</span><span className="flex-1 truncate">{PLATFORM_LABEL[p.platform]} — {p.title}</span><StatusBadge status={p.status} /></Link></li>)}</ul>}
            </Card>
          </div>
        </Section>

        {source === "reel" && realCount > 0 && <ManualList metrics={metrics.filter((m) => m.source === "manuel")} />}
      </div>

      <Modal open={!!entry} onClose={() => setEntry(null)} title="Saisir des statistiques (données réelles)"
        footer={<><Button onClick={() => setEntry(null)}>Annuler</Button><Button variant="primary" onClick={async () => { await run("metrics/create", { channel: entry!.channel, date: entry!.date, values: Object.fromEntries(Object.entries(entry!.values).filter(([, v]) => v !== "")) }, "Statistiques enregistrées (saisie manuelle)"); setEntry(null); setSource("reel"); }}>Enregistrer</Button></>}>
        {entry && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Canal"><select className="hub-input" value={entry.channel} onChange={(e) => setEntry({ ...entry, channel: e.target.value, values: {} })}>{[...SOCIAL.map((p) => [p, PLATFORM_LABEL[p]]), ["ads", "Publicité"], ["seo", "SEO"], ["email", "E-mailing"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
            <Field label="Semaine se terminant le"><input type="date" className="hub-input" value={entry.date} onChange={(e) => setEntry({ ...entry, date: e.target.value })} /></Field>
            {(entry.channel === "ads" ? [["impressions", "Impressions"], ["reach", "Portée"], ["clicks", "Clics"], ["spend", "Dépenses (€)"], ["videoViews", "Visionnages vidéo"]] : entry.channel === "seo" ? [["clicks", "Clics"], ["impressions", "Impressions"], ["position", "Position moyenne"]] : entry.channel === "email" ? [["delivered", "Délivrés"], ["opens", "Ouvertures"], ["clicks", "Clics"], ["unsubscribes", "Désabonnements"]] : [["posts", "Publications"], ["reach", "Portée"], ["impressions", "Impressions"], ["likes", "Likes"], ["comments", "Commentaires"], ["shares", "Partages"], ["saves", "Enregistrements"], ["followers", "Nouveaux abonnés"], ["views", "Vues vidéo"]]).map(([k, l]) => (
              <Field key={k} label={l}><input type="number" min={0} step="any" className="hub-input" value={entry.values[k] ?? ""} onChange={(e) => setEntry({ ...entry, values: { ...entry.values, [k]: e.target.value } })} /></Field>
            ))}
            <p className="text-xs text-forest-soft sm:col-span-2">Relève ces chiffres dans les statistiques natives de la plateforme (Meta Business Suite, TikTok Studio, Pinterest Analytics…). Ils seront marqués « saisie manuelle ».</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ManualList({ metrics }: { metrics: Metric[] }) {
  const { run } = useAction();
  if (!metrics.length) return null;
  return (
    <Card title="Saisies manuelles" subtitle="Historique des statistiques saisies (supprimables en cas d'erreur)." pad={false}>
      <ul className="divide-y divide-line">{metrics.sort((a, b) => b.date.localeCompare(a.date)).map((m) => <li key={m.id} className="flex items-center gap-3 px-5 py-2 text-sm"><span className="w-40 text-forest-soft">{frDay(m.date)}</span><span className="w-28 font-medium">{m.channel}</span><span className="flex-1 truncate text-xs text-forest-soft">{Object.entries(m.values).map(([k, v]) => `${k} ${v}`).join(" · ")}</span><Button size="sm" variant="ghost" icon={<TrashI size={13} />} aria-label="Supprimer" onClick={() => run("metrics/delete", { id: m.id }, "Saisie supprimée")} /></li>)}</ul>
    </Card>
  );
}

function Section({ title, children, link, note }: { title: string; children: React.ReactNode; link?: { href: string; label: string }; note?: string }) {
  return (
    <section className="break-inside-avoid">
      <div className="mb-3 flex items-baseline justify-between gap-3"><h2 className="font-display text-xl font-semibold">{title}</h2>{note && <span className="text-xs text-forest-soft">{note}</span>}{link && <Link href={link.href} className="text-xs underline print:hidden">{link.label}</Link>}</div>
      {children}
    </section>
  );
}

function Tiles({ items, cols = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9" }: { items: [string, string][]; cols?: string }) {
  return <div className={clsx("grid gap-3", cols)}>{items.map(([l, v]) => <div key={l} className="hub-card px-4 py-3"><p className="text-xs text-forest-soft">{l}</p><p className="mt-0.5 font-display text-xl font-semibold tabular-nums">{v}</p></div>)}</div>;
}
