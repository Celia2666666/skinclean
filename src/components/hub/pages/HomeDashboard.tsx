"use client";
import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";
import type { Post } from "@/lib/hub/types";
import { PLATFORM_LABEL } from "@/lib/hub/types";
import { frDay, todayYmd } from "@/lib/hub/dates";
import { Button, Card, Empty, Modal, Field, PLATFORM_ICON, PlatformBadge, StatusBadge, useAction, useCan, hubApi, useToast } from "../ui";
import { VisualThumb } from "../design/DesignPreview";
import { PostDrawer, type HubRefs } from "../PostDrawer";
import { CopilotChat } from "../Copilot";
import { designToDataUrl } from "../design/render";
import { AdsI, ArrowRightI, CheckI, ClockI, EditI, EyeI, MailI, SendI, SparkI } from "../icons";

export type DayAction =
  | { kind: "post"; time: string; id: string; post: Post }
  | { kind: "ad"; time: string; id: string; title: string; sub: string; href: string; amount: number }
  | { kind: "email"; time: string; id: string; title: string; sub: string; href: string };
export interface Reco { title: string; text: string; cta: string; href: string }
interface Running { id: string; name: string; color: string; status: string; startDate: string; endDate: string; channels: string[]; total: number; validated: number; published: number }

export function HomeDashboard(props: {
  userName: string; actions: DayAction[]; upcoming: Post[]; toValidate: Post[]; others: { id: string; type: string; title: string; href: string }[];
  running: Running[]; recos: Reco[]; stats: { toValidate: number; week: number; active: number; connected: number }; refs: HubRefs;
}) {
  const { actions, upcoming, toValidate, others, running, recos, stats, refs } = props;
  const [open, setOpen] = useState<{ id: string; tab: "apercu" | "contenu" } | null>(null);
  const [budget, setBudget] = useState<{ id: string; amount: number; title: string } | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const { run, busy, refresh } = useAction();
  const allowed = useCan();
  const toast = useToast();
  const all = [...actions.flatMap((a) => (a.kind === "post" ? [a.post] : [])), ...upcoming, ...toValidate];
  const current = open ? all.find((p) => p.id === open.id) ?? null : null;

  const publish = async (p: Post) => {
    try {
      const d = p.visual?.kind === "design" ? p.visual.design : p.visual?.poster;
      const r = await hubApi<{ published: boolean; reason?: string }>("posts/publish", { id: p.id, imageDataUrl: d ? await designToDataUrl(d) : undefined });
      if (r.published) { toast("ok", "Publié (confirmé par la plateforme)."); refresh(); }
      else { toast("info", `${r.reason}\nOuvre le contenu pour le publier manuellement.`); setOpen({ id: p.id, tab: "apercu" }); }
    } catch (e) { toast("err", (e as Error).message); }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-forest-soft">{frDay(todayYmd())}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold md:text-4xl">Hello SKINCLEAN ! Voici ton programme marketing du jour 🌿</h1>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Contenus à valider" value={stats.toValidate} href="/hub/calendrier?status=a_valider" tone={stats.toValidate ? "warn" : undefined} />
        <Stat label="Publications sur 7 jours" value={stats.week} href="/hub/calendrier?view=semaine" />
        <Stat label="Campagnes actives" value={stats.active} href="/hub/campagnes" />
        <Stat label="Plateformes connectées" value={`${stats.connected}`} href="/hub/compte?tab=integrations" sub={stats.connected ? undefined : "Mode démonstration"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card title="Mes actions du jour" subtitle="Voir, modifier, valider, publier ou reporter en un clic." pad={false} action={<Link href="/hub/calendrier?view=jour" className="text-xs font-medium underline">Vue jour</Link>}>
            {!actions.length ? <div className="p-5"><Empty title="Aucune action prévue aujourd'hui" text="Profites-en pour préparer la suite ou piocher dans la bibliothèque." /></div> : (
              <ul className="divide-y divide-line">
                {actions.map((a) => (
                  <li key={a.kind + a.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                    <span className="w-14 shrink-0 font-display text-lg font-semibold tabular-nums">{a.time.replace(":", " h ").replace(" h 00", " h")}</span>
                    {a.kind === "post" ? (
                      <>
                        <button onClick={() => setOpen({ id: a.id, tab: "apercu" })} className="w-12 shrink-0 overflow-hidden rounded"><VisualThumb visual={a.post.visual} width={60} /></button>
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-2 text-xs text-forest-soft"><PlatformIcon p={a.post.platform} /> {a.post.platform === "story" ? "Story Instagram" : `Publication ${PLATFORM_LABEL[a.post.platform]}`}</p>
                          <p className="truncate font-medium">{a.post.title}</p>
                          <StatusBadge status={a.post.status} className="mt-1" />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <Button size="sm" icon={<EyeI size={14} />} onClick={() => setOpen({ id: a.id, tab: "apercu" })}>Voir le contenu</Button>
                          {allowed("content.edit") && <Button size="sm" icon={<EditI size={14} />} onClick={() => setOpen({ id: a.id, tab: "contenu" })}>Modifier</Button>}
                          {allowed("content.validate") && ["a_valider", "brouillon", "modifications"].includes(a.post.status) && <Button size="sm" variant="primary" icon={<CheckI size={14} />} disabled={busy} onClick={() => run("posts/validate", { id: a.id }, "Contenu validé")}>Valider</Button>}
                          {allowed("content.publish") && ["valide", "programme"].includes(a.post.status) && <Button size="sm" variant="primary" icon={<SendI size={14} />} onClick={() => publish(a.post)}>Publier</Button>}
                          {allowed("content.edit") && !["publie", "publie_manuel"].includes(a.post.status) && <Button size="sm" icon={<ClockI size={14} />} disabled={busy} onClick={() => run("posts/postpone", { id: a.id, days: 1 }, "Reporté à demain")}>Reporter</Button>}
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded bg-sage-soft">{a.kind === "ad" ? <AdsI /> : <MailI />}</span>
                        <div className="min-w-0 flex-1"><p className="text-xs text-forest-soft">{a.kind === "ad" ? "Validation budget publicitaire" : "Validation newsletter"}</p><p className="truncate font-medium">{a.title}</p><p className="truncate text-xs text-forest-soft">{a.sub}</p></div>
                        <div className="flex flex-wrap gap-1.5">
                          <Link href={a.href} className="hub-btn hub-btn-secondary hub-btn-sm"><EyeI size={14} />Voir le contenu</Link>
                          <Link href={a.href} className="hub-btn hub-btn-secondary hub-btn-sm"><EditI size={14} />Modifier</Link>
                          {a.kind === "ad" && allowed("budget.validate") && <Button size="sm" variant="primary" icon={<CheckI size={14} />} onClick={() => setBudget({ id: a.id, amount: a.amount, title: a.sub })}>Valider</Button>}
                          {a.kind === "email" && allowed("content.validate") && <Button size="sm" variant="primary" icon={<CheckI size={14} />} onClick={() => run("emails/validate", { id: a.id }, "Newsletter validée")}>Valider</Button>}
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Mes contenus à valider" subtitle={`${toValidate.length + others.length} élément(s) en attente`} pad={false}
            action={allowed("content.validate") && selected.length > 0 ? <Button size="sm" variant="primary" icon={<CheckI size={14} />} disabled={busy} onClick={async () => { await run("posts/validate", { ids: selected }, `${selected.length} contenus validés`); setSelected([]); }}>Valider la sélection ({selected.length})</Button> : <Link href="/hub/calendrier?status=a_valider" className="text-xs font-medium underline">Tout voir</Link>}>
            {!toValidate.length && !others.length ? <div className="p-5"><Empty title="Tout est validé 🎉" /></div> : (
              <ul className="divide-y divide-line">
                {toValidate.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                    {allowed("content.validate") && <input type="checkbox" aria-label={`Sélectionner ${p.title}`} checked={selected.includes(p.id)} onChange={(e) => setSelected((s) => (e.target.checked ? [...s, p.id] : s.filter((x) => x !== p.id)))} className="h-4 w-4 accent-forest" />}
                    <button onClick={() => setOpen({ id: p.id, tab: "apercu" })} className="w-10 shrink-0 overflow-hidden rounded"><VisualThumb visual={p.visual} width={50} /></button>
                    <button onClick={() => setOpen({ id: p.id, tab: "apercu" })} className="min-w-0 flex-1 text-left">
                      <p className="truncate text-sm font-medium">{p.title}</p>
                      <p className="text-xs text-forest-soft">{PLATFORM_LABEL[p.platform]} · {frDay(p.date)} {p.date.slice(11, 16)}</p>
                    </button>
                    <StatusBadge status={p.status} />
                  </li>
                ))}
                {others.map((o) => (
                  <li key={o.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="hub-badge bg-sage-soft">{o.type}</span>
                    <Link href={o.href} className="min-w-0 flex-1 truncate text-sm font-medium hover:underline">{o.title}</Link>
                    <ArrowRightI size={14} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Mes campagnes en cours" pad={false} action={<Link href="/hub/campagnes" className="text-xs font-medium underline">Toutes les campagnes</Link>}>
            {!running.length ? <div className="p-5"><Empty title="Aucune campagne active" action={<Link href="/hub/campagnes" className="hub-btn hub-btn-primary">Activer une campagne</Link>} /></div> : (
              <ul className="divide-y divide-line">
                {running.map((c) => {
                  const pct = c.total ? Math.round((c.validated / c.total) * 100) : 0;
                  return (
                    <li key={c.id}>
                      <Link href={`/hub/campagnes/${c.id}`} className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-sage-soft/50">
                        <span className="h-10 w-1.5 rounded-full" style={{ background: c.color }} />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{c.name}</p>
                          <p className="text-xs text-forest-soft">{frDay(c.startDate)} → {frDay(c.endDate)} · {c.channels.slice(0, 4).join(", ")}</p>
                        </div>
                        <div className="w-40">
                          <div className="flex justify-between text-[0.7rem] text-forest-soft"><span>{c.validated}/{c.total} validés</span><span>{c.published} publiés</span></div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sage-soft"><div className="h-full rounded-full bg-sage-deep" style={{ width: `${pct}%` }} /></div>
                        </div>
                        <StatusBadge status={c.status} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title={<span className="flex items-center gap-2"><SparkI size={16} /> Recommandations IA</span>} subtitle="Calculées à partir de ton calendrier, de tes campagnes et de tes données.">
            <ol className="space-y-4">
              {recos.map((r, i) => (
                <li key={i} className="flex gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-forest text-xs font-semibold text-white">{i + 1}</span>
                  <div>
                    <p className="font-medium">{r.title}</p>
                    <p className="mt-0.5 text-sm text-forest-soft">{r.text}</p>
                    <Link href={r.href} className="mt-1.5 inline-flex items-center gap-1 text-sm font-medium underline underline-offset-2">{r.cta} <ArrowRightI size={13} /></Link>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card title="Mes publications à venir" pad={false} action={<Link href="/hub/calendrier" className="text-xs font-medium underline">Calendrier</Link>}>
            <ul className="divide-y divide-line">
              {upcoming.map((p) => (
                <li key={p.id}>
                  <button onClick={() => setOpen({ id: p.id, tab: "apercu" })} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-sage-soft/50">
                    <span className="w-14 shrink-0 overflow-hidden rounded"><VisualThumb visual={p.visual} width={70} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{p.title}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-forest-soft"><PlatformBadge platform={p.platform} compact />{frDay(p.date)} · {p.date.slice(11, 16)}</span>
                    </span>
                    <StatusBadge status={p.status} />
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card title={<span className="flex items-center gap-2"><SparkI size={16} /> SKINCLEAN Marketing Copilot</span>} pad={false} subtitle="Aussi disponible partout avec le bouton Copilot (Ctrl/⌘ K).">
            <div className="h-[420px]"><CopilotChat compact /></div>
          </Card>
        </div>
      </div>

      <PostDrawer post={current} refs={refs} initialTab={open?.tab} onClose={() => setOpen(null)} />

      <Modal open={!!budget} onClose={() => setBudget(null)} title="Valider le budget publicitaire" size="sm"
        footer={<><Button onClick={() => setBudget(null)}>Annuler</Button><Button variant="primary" onClick={async () => { await run("ads/validate-budget", { id: budget!.id, amount: budget!.amount }, "Budget validé : la campagne peut être programmée."); setBudget(null); }}>Je valide {budget?.amount} €</Button></>}>
        <p className="text-sm">{budget?.title}</p>
        <Field label="Montant engagé" className="mt-4"><input className="hub-input" readOnly value={`${budget?.amount ?? 0} € (budget total maximum)`} /></Field>
        <p className="mt-3 text-xs text-forest-soft">Valider le budget autorise la diffusion. L&apos;activation réelle se fait ensuite via le compte publicitaire connecté ou le gestionnaire de la plateforme.</p>
      </Modal>
    </div>
  );
}

function PlatformIcon({ p }: { p: Post["platform"] }) {
  const I = PLATFORM_ICON[p];
  return <I size={13} />;
}

function Stat({ label, value, href, sub, tone }: { label: string; value: React.ReactNode; href: string; sub?: string; tone?: "warn" }) {
  return (
    <Link href={href} className={clsx("hub-card block px-4 py-3.5 transition hover:border-forest", tone === "warn" && "border-[#F0DDA6] bg-[#FFFBEF]")}>
      <p className="text-xs text-forest-soft">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="text-[0.7rem] text-forest-soft">{sub}</p>}
    </Link>
  );
}
