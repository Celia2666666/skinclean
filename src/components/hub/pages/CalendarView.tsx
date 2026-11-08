"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import type { Platform, Post, PostFormat, PostStatus, Settings } from "@/lib/hub/types";
import { PLATFORM_COLOR, PLATFORM_LABEL, STATUS_LABEL } from "@/lib/hub/types";
import { addDays, frDay, mondayOf, monthLabel, parseLocal, todayYmd, ymd } from "@/lib/hub/dates";
import { Button, Card, Field, Modal, PLATFORM_ICON, PageHeader, StatusBadge, useAction, useCan } from "../ui";
import { VisualThumb } from "../design/DesignPreview";
import { PostDrawer, type HubRefs } from "../PostDrawer";
import { tplProductHero } from "@/lib/hub/templates";
import { ChevronLeftI, ChevronRightI, FilterI, PlusI } from "../icons";

type View = "jour" | "semaine" | "mois" | "reseau" | "campagne";
const PLATFORMS: Platform[] = ["instagram", "story", "tiktok", "facebook", "pinterest", "newsletter", "blog"];
const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
interface CampaignLite { id: string; name: string; color: string; startDate: string; endDate: string; status: string }

export function CalendarView({ posts, refs, campaigns, frequencies }: { posts: Post[]; refs: HubRefs; campaigns: CampaignLite[]; frequencies: Settings["frequencies"] }) {
  const sp = useSearchParams();
  const router = useRouter();
  const [view, setView] = useState<View>((sp.get("view") as View) || "semaine");
  const [anchor, setAnchor] = useState(sp.get("date") || todayYmd());
  const [platforms, setPlatforms] = useState<Platform[]>(sp.get("platform") ? [sp.get("platform") as Platform] : PLATFORMS);
  const [status, setStatus] = useState<PostStatus | "">((sp.get("status") as PostStatus) || "");
  const [campaign, setCampaign] = useState(sp.get("campaign") || "");
  const [openId, setOpenId] = useState<string | null>(sp.get("post"));
  const [dragId, setDragId] = useState<string | null>(null);
  const [overDay, setOverDay] = useState<string | null>(null);
  const [create, setCreate] = useState<null | { date: string; platform: Platform; format: PostFormat; title: string }>(null);
  const [freqOpen, setFreqOpen] = useState(false);
  const [freq, setFreq] = useState(frequencies);
  const { run, busy } = useAction();
  const allowed = useCan();

  useEffect(() => { const p = sp.get("post"); if (p) setOpenId(p); }, [sp]);

  const filtered = useMemo(
    () => posts.filter((p) => platforms.includes(p.platform) && (!status || p.status === status) && (!campaign || p.campaignId === campaign)),
    [posts, platforms, status, campaign]
  );
  const byDay = useMemo(() => {
    const m = new Map<string, Post[]>();
    for (const p of filtered) {
      const d = p.date.slice(0, 10);
      if (!m.has(d)) m.set(d, []);
      m.get(d)!.push(p);
    }
    for (const l of m.values()) l.sort((a, b) => a.date.localeCompare(b.date));
    return m;
  }, [filtered]);
  const current = openId ? posts.find((p) => p.id === openId) ?? null : null;

  const step = (dir: number) => {
    if (view === "jour") setAnchor(addDays(anchor, dir));
    else if (view === "mois" || view === "campagne") { const d = parseLocal(anchor); d.setMonth(d.getMonth() + dir, 1); setAnchor(ymd(d)); }
    else setAnchor(addDays(anchor, 7 * dir));
  };
  const title = view === "jour" ? frDay(anchor) : view === "mois" || view === "campagne" ? monthLabel(anchor.slice(0, 7)) : `Semaine du ${frDay(mondayOf(anchor))}`;

  const drop = (day: string) => {
    const p = posts.find((x) => x.id === dragId);
    setDragId(null);
    setOverDay(null);
    if (!p || p.date.slice(0, 10) === day) return;
    run("posts/move", { id: p.id, date: `${day}T${p.date.slice(11, 16) || "18:00"}` }, `Déplacé au ${frDay(day)}`);
  };
  const dnd = (day: string) => allowed("content.edit") ? {
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setOverDay(day); },
    onDragLeave: () => setOverDay((d) => (d === day ? null : d)),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); drop(day); },
  } : {};

  const Chip = ({ p, big }: { p: Post; big?: boolean }) => {
    const Icon = PLATFORM_ICON[p.platform];
    return (
      <button
        draggable={allowed("content.edit") && p.status !== "publie"}
        onDragStart={(e) => { setDragId(p.id); e.dataTransfer.effectAllowed = "move"; }}
        onDragEnd={() => setDragId(null)}
        onClick={() => setOpenId(p.id)}
        className={clsx("group flex w-full items-start gap-2 rounded-md border border-line bg-white p-1.5 text-left text-xs shadow-sm transition hover:border-forest", dragId === p.id && "opacity-40")}
        style={{ borderLeft: `3px solid ${PLATFORM_COLOR[p.platform]}` }}
        title={`${PLATFORM_LABEL[p.platform]} — ${p.title} (${STATUS_LABEL[p.status]})`}
      >
        {big && <span className="w-12 shrink-0 overflow-hidden rounded"><VisualThumb visual={p.visual} width={60} /></span>}
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1 text-[0.68rem] text-forest-soft"><Icon size={11} />{p.date.slice(11, 16)}<StatusDot s={p.status} /></span>
          <span className={clsx("block font-medium leading-snug", big ? "line-clamp-2" : "line-clamp-3")}>{p.title}</span>
        </span>
      </button>
    );
  };

  // Couverture des fréquences de la semaine affichée
  const weekStart = mondayOf(anchor);
  const weekPosts = posts.filter((p) => p.date >= weekStart && p.date < addDays(weekStart, 7) + "T99");
  const monthKey = anchor.slice(0, 7);
  const monthPosts = posts.filter((p) => p.date.startsWith(monthKey));

  return (
    <div>
      <PageHeader eyebrow="Calendrier éditorial" title="Calendrier éditorial" intro="Ta stratégie éditoriale planifiée sur 12 mois. Glisse-dépose une publication pour la déplacer, clique pour la voir, la modifier, la valider ou la publier."
        actions={<>
          {allowed("settings.manage") && <Button onClick={() => setFreqOpen(true)}>Fréquences</Button>}
          {allowed("content.edit") && <Button variant="primary" icon={<PlusI size={15} />} onClick={() => setCreate({ date: `${anchor}T18:00`, platform: "instagram", format: "post", title: "" })}>Nouvelle publication</Button>}
        </>} />

      <div className="hub-card mb-4 flex flex-wrap items-center gap-3 p-3">
        <div className="flex rounded-md border border-line p-0.5">
          {(["jour", "semaine", "mois", "reseau", "campagne"] as View[]).map((v) => (
            <button key={v} onClick={() => setView(v)} className={clsx("rounded px-3 py-1.5 text-sm", view === v ? "bg-forest text-white" : "text-forest-soft hover:text-forest")}>
              {{ jour: "Jour", semaine: "Semaine", mois: "Mois", reseau: "Par réseau", campagne: "Par campagne" }[v]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" icon={<ChevronLeftI size={16} />} aria-label="Précédent" onClick={() => step(-1)} />
          <Button size="sm" onClick={() => setAnchor(todayYmd())}>Aujourd&apos;hui</Button>
          <Button size="sm" variant="ghost" icon={<ChevronRightI size={16} />} aria-label="Suivant" onClick={() => step(1)} />
          <span className="ml-2 inline-block font-display font-semibold first-letter:uppercase">{title}</span>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <FilterI size={15} className="text-forest-soft" />
          <select className="hub-input w-auto py-1.5" value={status} onChange={(e) => setStatus(e.target.value as PostStatus | "")} aria-label="Filtrer par statut">
            <option value="">Tous les statuts</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className="hub-input w-auto py-1.5" value={campaign} onChange={(e) => setCampaign(e.target.value)} aria-label="Filtrer par campagne">
            <option value="">Toutes les campagnes</option>
            {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex w-full flex-wrap gap-1.5">
          {PLATFORMS.map((p) => {
            const on = platforms.includes(p);
            const Icon = PLATFORM_ICON[p];
            return (
              <button key={p} onClick={() => setPlatforms((x) => (on ? x.filter((y) => y !== p) : [...x, p]))} aria-pressed={on}
                className={clsx("hub-badge border py-1", on ? "border-forest bg-white text-forest" : "border-line bg-transparent text-forest-soft line-through")}>
                <span className="h-2 w-2 rounded-full" style={{ background: PLATFORM_COLOR[p] }} /><Icon size={12} />{PLATFORM_LABEL[p]}
              </button>
            );
          })}
          {platforms.length < PLATFORMS.length && <button className="text-xs underline" onClick={() => setPlatforms(PLATFORMS)}>Tout afficher</button>}
        </div>
      </div>

      {view === "semaine" && (
        <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
          <div className="hub-scroll overflow-x-auto">
            <div className="grid min-w-[900px] grid-cols-7 gap-2">
              {Array.from({ length: 7 }, (_, i) => {
                const d = addDays(weekStart, i);
                const items = byDay.get(d) ?? [];
                const isToday = d === todayYmd();
                return (
                  <div key={d} {...dnd(d)} className={clsx("min-h-[480px] rounded-lg border p-2 transition", overDay === d ? "border-forest bg-sage-soft" : "border-line bg-white/60", isToday && "ring-2 ring-sage-deep/40")}>
                    <button onClick={() => { setAnchor(d); setView("jour"); }} className="mb-2 flex w-full items-baseline justify-between text-left">
                      <span className="text-xs font-semibold uppercase tracking-wider text-forest-soft">{DAYS[i]}</span>
                      <span className={clsx("font-display text-lg font-semibold", isToday && "rounded-full bg-forest px-2 text-white")}>{parseLocal(d).getDate()}</span>
                    </button>
                    <div className="space-y-1.5">{items.map((p) => <Chip key={p.id} p={p} />)}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <Coverage posts={weekPosts} frequencies={frequencies} />
        </div>
      )}

      {view === "jour" && (
        <div {...dnd(anchor)} className="space-y-3">
          {!(byDay.get(anchor) ?? []).length && <Card><p className="text-sm text-forest-soft">Aucune publication ce jour avec ces filtres.</p></Card>}
          {(byDay.get(anchor) ?? []).map((p) => (
            <button key={p.id} onClick={() => setOpenId(p.id)} className="hub-card flex w-full items-center gap-4 p-4 text-left hover:border-forest">
              <span className="w-16 font-display text-xl font-semibold tabular-nums">{p.date.slice(11, 16)}</span>
              <span className="w-24 shrink-0 overflow-hidden rounded-md"><VisualThumb visual={p.visual} width={120} /></span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-xs text-forest-soft">{PLATFORM_LABEL[p.platform]} · {p.objective} · {p.pillar}</span>
                <span className="block font-medium">{p.title}</span>
                <span className="mt-1 line-clamp-2 block text-sm text-forest-soft">{p.caption}</span>
              </span>
              <StatusBadge status={p.status} />
            </button>
          ))}
        </div>
      )}

      {view === "mois" && (
        <div>
          <div className="hub-scroll overflow-x-auto">
            <div className="grid min-w-[900px] grid-cols-7 gap-1.5">
              {DAYS.map((d) => <div key={d} className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-forest-soft">{d}</div>)}
              {(() => {
                const first = `${monthKey}-01`;
                const start = mondayOf(first);
                const cells: string[] = [];
                for (let d = start; cells.length < 42; d = addDays(d, 1)) cells.push(d);
                return cells.map((d) => {
                  const items = byDay.get(d) ?? [];
                  const inMonth = d.startsWith(monthKey);
                  return (
                    <div key={d} {...dnd(d)} className={clsx("min-h-[128px] rounded-md border p-1.5", overDay === d ? "border-forest bg-sage-soft" : "border-line", inMonth ? "bg-white" : "bg-transparent opacity-50", d === todayYmd() && "ring-2 ring-sage-deep/40")}>
                      <button onClick={() => { setAnchor(d); setView("jour"); }} className="mb-1 text-xs font-semibold">{parseLocal(d).getDate()}</button>
                      <div className="space-y-1">
                        {items.slice(0, 4).map((p) => <Chip key={p.id} p={p} />)}
                        {items.length > 4 && <button onClick={() => { setAnchor(d); setView("jour"); }} className="text-[0.7rem] font-medium underline">+ {items.length - 4} autres</button>}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
          <p className="mt-3 text-sm text-forest-soft">{monthPosts.length} contenus prévus en {monthLabel(monthKey)} · {monthPosts.filter((p) => p.status === "a_valider").length} à valider · {monthPosts.filter((p) => ["publie", "publie_manuel", "publie_test"].includes(p.status)).length} publiés.</p>
        </div>
      )}

      {view === "reseau" && (
        <div className="hub-scroll overflow-x-auto">
          <table className="w-full min-w-[1000px] border-separate border-spacing-1.5">
            <thead><tr><th className="w-40" />{Array.from({ length: 7 }, (_, i) => { const d = addDays(weekStart, i); return <th key={d} className="text-left text-xs font-semibold uppercase tracking-wider text-forest-soft">{DAYS[i]} {parseLocal(d).getDate()}</th>; })}</tr></thead>
            <tbody>
              {PLATFORMS.filter((p) => platforms.includes(p)).map((pl) => {
                const Icon = PLATFORM_ICON[pl];
                const n = weekPosts.filter((p) => p.platform === pl).length;
                const target = frequencies[pl]?.perWeek;
                return (
                  <tr key={pl}>
                    <th className="rounded-md bg-white p-2 text-left align-top text-sm font-medium"><span className="flex items-center gap-2"><Icon size={15} />{PLATFORM_LABEL[pl]}</span><span className={clsx("mt-1 block text-xs font-normal", target && n < target ? "text-[#8A3D1E]" : "text-forest-soft")}>{n}{target ? ` / ${target}` : ""} cette semaine</span></th>
                    {Array.from({ length: 7 }, (_, i) => {
                      const d = addDays(weekStart, i);
                      const items = (byDay.get(d) ?? []).filter((p) => p.platform === pl);
                      return <td key={d} {...dnd(d)} className={clsx("min-w-[120px] rounded-md border p-1 align-top", overDay === d ? "border-forest bg-sage-soft" : "border-line bg-white/60")}><div className="space-y-1">{items.map((p) => <Chip key={p.id} p={p} />)}</div></td>;
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {view === "campagne" && (
        <div className="space-y-3">
          {campaigns.filter((c) => !campaign || c.id === campaign).map((c) => {
            const cp = filtered.filter((p) => p.campaignId === c.id).sort((a, b) => a.date.localeCompare(b.date));
            const monthItems = cp.filter((p) => p.date.startsWith(monthKey));
            return (
              <Card key={c.id} title={<span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: c.color }} />{c.name}</span>} subtitle={`${frDay(c.startDate)} → ${frDay(c.endDate)} · ${cp.length} contenus au total, ${monthItems.length} en ${monthLabel(monthKey)}`} action={<StatusBadge status={c.status} />}>
                {monthItems.length ? <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{monthItems.map((p) => <Chip key={p.id} p={p} big />)}</div> : <p className="text-sm text-forest-soft">Aucun contenu de cette campagne ce mois-ci{cp.length ? " (navigue avec les flèches)" : c.status === "bibliotheque" ? " : active-la depuis le module Campagnes pour remplir le calendrier." : "."}</p>}
              </Card>
            );
          })}
          <Card title="Contenus hors campagne" subtitle={`${filtered.filter((p) => !p.campaignId && p.date.startsWith(monthKey)).length} en ${monthLabel(monthKey)}`}>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{filtered.filter((p) => !p.campaignId && p.date.startsWith(monthKey)).slice(0, 40).map((p) => <Chip key={p.id} p={p} />)}</div>
          </Card>
        </div>
      )}

      <PostDrawer post={current} refs={refs} onClose={() => { setOpenId(null); if (sp.get("post")) router.replace("/hub/calendrier"); }} />

      <Modal open={!!create} onClose={() => setCreate(null)} title="Nouvelle publication"
        footer={<><Button onClick={() => setCreate(null)}>Annuler</Button><Button variant="primary" disabled={!create?.title || busy} onClick={async () => {
          const fmt = create!.platform === "pinterest" ? "pinterest" : create!.platform === "story" || create!.platform === "tiktok" ? "story" : create!.platform === "facebook" ? "facebook" : "instagram";
          const r = await run<Post>("posts/create", { ...create, visual: { kind: "design", design: tplProductHero({ format: fmt, headline: create!.title }) } }, "Brouillon créé");
          if (r) { setCreate(null); setOpenId(r.id); }
        }}>Créer le brouillon</Button></>}>
        {create && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Titre" className="sm:col-span-2"><input className="hub-input" autoFocus value={create.title} onChange={(e) => setCreate({ ...create, title: e.target.value })} placeholder="Ex. : Routine du soir en 3 gestes" /></Field>
            <Field label="Plateforme"><select className="hub-input" value={create.platform} onChange={(e) => setCreate({ ...create, platform: e.target.value as Platform })}>{PLATFORMS.map((p) => <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>)}</select></Field>
            <Field label="Format"><select className="hub-input" value={create.format} onChange={(e) => setCreate({ ...create, format: e.target.value as PostFormat })}>{["post", "carrousel", "reel", "story", "video", "epingle"].map((f) => <option key={f}>{f}</option>)}</select></Field>
            <Field label="Date et heure" className="sm:col-span-2"><input type="datetime-local" className="hub-input" value={create.date} onChange={(e) => setCreate({ ...create, date: e.target.value })} /></Field>
            <p className="text-xs text-forest-soft sm:col-span-2">Un visuel aux couleurs SKINCLEAN est généré automatiquement ; tu pourras le personnaliser dans le Studio créatif et compléter la légende juste après.</p>
          </div>
        )}
      </Modal>

      <Modal open={freqOpen} onClose={() => setFreqOpen(false)} title="Fréquences de publication"
        footer={<><Button onClick={() => setFreqOpen(false)}>Annuler</Button><Button variant="primary" onClick={async () => { await run("settings/update", { frequencies: freq }, "Fréquences mises à jour"); setFreqOpen(false); }}>Enregistrer</Button></>}>
        <p className="mb-4 text-sm text-forest-soft">Ces cibles servent au suivi de couverture (calendrier, recommandations, Copilot). Elles ne suppriment aucun contenu existant.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(freq).map(([k, v]) => (
            <Field key={k} label={v.label}>
              <input type="number" min={0} max={31} className="hub-input" value={v.perWeek ?? v.perMonth ?? 0} onChange={(e) => setFreq({ ...freq, [k]: { ...v, ...(v.perWeek !== undefined ? { perWeek: Number(e.target.value) } : { perMonth: Number(e.target.value) }) } })} />
            </Field>
          ))}
        </div>
      </Modal>
    </div>
  );
}

function StatusDot({ s }: { s: PostStatus }) {
  const c = { brouillon: "#B8B5AD", a_valider: "#E0A800", modifications: "#D2693C", valide: "#3E8E5A", programme: "#2F6FB5", publie: "#1F3329", publie_manuel: "#5E7A68", publie_test: "#7A62C9", echec: "#B33" }[s];
  return <span className="ml-auto h-2 w-2 shrink-0 rounded-full" style={{ background: c }} title={STATUS_LABEL[s]} />;
}

function Coverage({ posts, frequencies }: { posts: Post[]; frequencies: Settings["frequencies"] }) {
  return (
    <Card title="Fréquences de la semaine" subtitle="Prévu / cible">
      <ul className="space-y-3">
        {(["instagram", "story", "tiktok", "facebook", "pinterest"] as Platform[]).map((p) => {
          const n = posts.filter((x) => x.platform === p).length;
          const t = frequencies[p]?.perWeek ?? 0;
          const pct = t ? Math.min(100, (n / t) * 100) : 100;
          return (
            <li key={p}>
              <div className="flex justify-between text-xs"><span>{PLATFORM_LABEL[p]}</span><span className={clsx("tabular-nums", n < t ? "font-semibold text-[#8A3D1E]" : "text-forest-soft")}>{n} / {t}</span></div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sage-soft"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: n < t ? "#D2693C" : "#4A6354" }} /></div>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 space-y-1 border-t border-line pt-3 text-xs text-forest-soft">
        {(["brouillon", "a_valider", "valide", "programme"] as PostStatus[]).map((s) => <p key={s} className="flex justify-between"><span>{STATUS_LABEL[s]}</span><span>{posts.filter((p) => p.status === s).length}</span></p>)}
      </div>
    </Card>
  );
}
