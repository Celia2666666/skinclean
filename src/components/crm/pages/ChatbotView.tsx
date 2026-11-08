"use client";
import Link from "next/link";
import { Button, Card, PageHeader } from "@/components/hub/ui";
import { PlusI } from "@/components/hub/icons";
import { HBars, SERIES, TrendChart, fmtN, pctf } from "../charts";
import { Kpi, PeriodTabs, Pill, SourceNote, thead, trow, useCrmAction, Empty } from "../ui";
import { INTENT_LABEL } from "@/lib/crm/types";
import { delta } from "@/lib/crm/analytics";
import type { chatbotData } from "@/lib/crm/pages";

type Data = Awaited<ReturnType<typeof chatbotData>>;
const dt = (s: string) => `${s.slice(8, 10)}/${s.slice(5, 7)} ${s.slice(11, 16)}`;
const label = (i: string) => INTENT_LABEL[i]?.label ?? i;

export function ChatbotView({ data: d, periods }: { data: Data; periods: { id: string; label: string }[] }) {
  const k = d.kpis;
  const { run, busy } = useCrmAction();
  return (
    <>
      <PageHeader eyebrow="Automatisation" title="Chatbot — Glow Assistant" intro="Ce que les visiteurs demandent à l'assistant du site, les réponses qui reviennent le plus, les questions auxquelles il ne sait pas encore répondre et les actions déclenchées (alertes de retour en stock, messages à l'équipe)."
        actions={<PeriodTabs periods={periods} value={d.period.key} />} />
      <SourceNote source={d.source} what="Ces conversations" />
      {d.source === "reel" && !k.questions && <div className="mb-5"><Empty>Aucune question réelle sur la période. Chaque question posée au Glow Assistant du site apparaît ici, de façon anonyme : ouvre le site, pose une question à l'assistant, puis reviens sur cette page.</Empty></div>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <Kpi label="Questions posées" value={fmtN(k.questions)} delta={delta(k.questions, k.prevQuestions)} />
        <Kpi label="Conversations" value={fmtN(k.conversations)} delta={delta(k.conversations, k.prevConversations)} hint={`${k.perConv.toFixed(1).replace(".", ",")} question(s) / conversation`} />
        <Kpi label="Taux de compréhension" value={k.questions ? pctf(k.understood, 0) : "—"} delta={k.prevQuestions ? k.understood - k.prevUnderstood : undefined} points hint="questions reconnues" />
        <Kpi label="Produits introuvables" value={k.stock} hint="« je ne trouve plus… »" href="/crm/automatisations" />
        <Kpi label="Alertes stock créées" value={k.alerts} hint="via le chatbot" href="/crm/automatisations" />
        <Kpi label="Transferts à l'équipe" value={k.handoffs} hint="messages envoyés" href="/crm/messages" />
        <Kpi label="Sans réponse" value={k.questions ? pctf(100 - k.understood, 0) : "—"} tone={k.questions && 100 - k.understood > 15 ? "warn" : undefined} hint="à enrichir" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="Questions posées" subtitle="Par jour sur la période">
          <TrendChart labels={d.series.labels} current={d.series.values} names={["Questions", ""]} />
        </Card>
        <Card title="Pages d'où l'on pose des questions">
          <HBars items={d.pages.map(([p, n]) => ({ label: p, value: n }))} format={(n) => `${n}`} />
        </Card>
      </div>

      <Card className="mt-6" title="Les réponses qui reviennent le plus" subtitle="Sujets détectés et réponse donnée automatiquement par l'assistant" pad={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className={thead}><tr><th className="px-4 py-2.5">#</th><th className="px-3">Sujet</th><th className="px-3">Réponse donnée</th><th className="px-3 text-right">Questions</th><th className="px-3">Part</th><th className="px-4 text-right">Évolution</th></tr></thead>
            <tbody>
              {d.intents.map((x, i) => (
                <tr key={x.intent} className={trow}>
                  <td className="px-4 py-2 tabular-nums text-forest-soft">{i + 1}</td>
                  <td className="px-3 font-medium">{label(x.intent)}{x.intent === "unknown" && <Pill tone="warn" className="ml-2">à traiter</Pill>}{x.intent === "stock" && <Pill tone="info" className="ml-2">alerte stock</Pill>}</td>
                  <td className="max-w-[360px] px-3 text-xs text-forest-soft">{INTENT_LABEL[x.intent]?.answer ?? "—"}</td>
                  <td className="px-3 text-right font-semibold tabular-nums">{x.n}</td>
                  <td className="w-40 px-3"><div className="flex items-center gap-2"><div className="h-2 flex-1 rounded-full bg-[#F1F0EC]"><div className="h-2 rounded-full" style={{ width: `${x.share}%`, background: x.intent === "unknown" ? SERIES[3] : SERIES[0] }} /></div><span className="w-10 text-right text-xs tabular-nums">{pctf(x.share, 0)}</span></div></td>
                  <td className="px-4 text-right text-xs tabular-nums">{x.delta === null ? "nouveau" : `${x.delta > 0 ? "▲" : "▼"} ${pctf(Math.abs(x.delta), 0)}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Questions sans réponse" subtitle="À ajouter aux scénarios de l'assistant (ou à la FAQ du site)" pad={false}>
          <ul>
            {d.unknown.map(([text, n]) => (
              <li key={text} className="flex items-center gap-3 border-b border-line px-5 py-2.5 text-sm last:border-0">
                <span className="w-8 shrink-0 text-right font-semibold tabular-nums">{n}×</span>
                <span className="flex-1">« {text} »</span>
                <Button size="sm" icon={<PlusI size={13} />} disabled={busy} onClick={() => run("chat/task", { text }, "Tâche créée")}>Tâche</Button>
              </li>
            ))}
            {!d.unknown.length && <li className="p-5 text-sm text-forest-soft">Toutes les questions ont été comprises.</li>}
          </ul>
        </Card>
        <Card title="Produits demandés introuvables" subtitle="Cités dans les questions « je ne trouve plus… » — croisés avec le stock" action={<Link href="/crm/stock?status=rupture" className="text-xs underline">Voir les ruptures</Link>}>
          {d.asked.length ? <HBars items={d.asked.map(([n, c]) => ({ label: n, value: c }))} format={(n) => `${n} demande(s)`} color={SERIES[3]} /> : <p className="text-sm text-forest-soft">Aucun produit cité.</p>}
          <p className="mt-4 text-xs text-forest-soft">Pour ces demandes, l'assistant vérifie la disponibilité et propose l'alerte « Me prévenir du retour en stock » : l'e-mail part tout seul à la réception du réassort (voir Automatisations).</p>
        </Card>
      </div>

      <Card className="mt-6" title="Dernières questions" subtitle="Journal anonyme : aucune adresse ni numéro n'est conservé" pad={false}>
        <table className="w-full text-sm">
          <thead className={thead}><tr><th className="px-4 py-2">Date</th><th className="px-3">Question</th><th className="px-3">Sujet détecté</th><th className="px-4">Page</th></tr></thead>
          <tbody>{d.recent.map((c) => <tr key={c.id} className={trow}><td className="px-4 py-2 tabular-nums text-forest-soft">{dt(c.at)}</td><td className="px-3">{c.text}</td><td className="px-3"><Pill tone={c.intent === "unknown" ? "warn" : "neutral"}>{label(c.intent)}</Pill></td><td className="px-4 text-xs text-forest-soft">{c.page}</td></tr>)}</tbody>
        </table>
      </Card>
    </>
  );
}
