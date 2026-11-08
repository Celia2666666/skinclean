"use client";
import { Card, Notice, PageHeader } from "../ui";
import { CopilotChat } from "../Copilot";
import { SparkI } from "../icons";

const CAPABILITIES = [
  ["Programme du jour", "Liste tes publications et validations du jour."],
  ["Validations", "Résume ce qui attend ta validation (publications, newsletters, budgets, articles)."],
  ["Rédaction", "Prépare de vraies publications et newsletters à partir des fiches produits."],
  ["Campagnes", "Propose une campagne 360° complète pour un produit."],
  ["Calendrier", "Génère un mois de contenus aux fréquences de ta stratégie."],
  ["Analyse", "Identifie les formats qui fonctionnent (données réelles en priorité)."],
  ["SEO", "Donne les priorités de référencement à partir de tes mots-clés et articles."],
];

export function AssistantView({ ai, initial }: { ai: boolean; initial?: string }) {
  return (
    <div>
      <PageHeader eyebrow="Assistant marketing IA" title="SKINCLEAN Marketing Copilot" intro="Ton assistant marketing consulte les données du Hub (calendrier, campagnes, contenus, statistiques) et prépare de véritables brouillons. Il propose, tu confirmes : rien n'est créé, publié ou dépensé sans ton accord." />
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="h-[calc(100vh-240px)] min-h-[520px]"><CopilotChat initial={initial} /></div>
        <div className="space-y-4">
          <Notice tone={ai ? "ok" : "info"}>
            {ai ? <>Mode <strong>IA générative</strong> actif (Claude, via ANTHROPIC_API_KEY). Les réponses s&apos;appuient sur un instantané des données du Hub.</> : <>Mode <strong>guidé</strong> : l&apos;assistant répond à partir de règles et des données réelles du Hub. Ajoute ANTHROPIC_API_KEY dans .env.local pour activer la rédaction libre par IA.</>}
          </Notice>
          <Card title={<span className="flex items-center gap-2"><SparkI size={16} />Ce que je sais faire</span>}>
            <ul className="space-y-2.5 text-sm">{CAPABILITIES.map(([t, d]) => <li key={t}><p className="font-medium">{t}</p><p className="text-forest-soft">{d}</p></li>)}</ul>
          </Card>
          <Card title="Garde-fous">
            <ul className="list-disc space-y-1 pl-4 text-sm text-forest-soft">
              <li>Confirmation obligatoire avant toute création.</li>
              <li>Brouillons uniquement : validation et publication restent manuelles.</li>
              <li>Aucune promesse médicale ni allégation non justifiée.</li>
              <li>Données de démonstration toujours signalées.</li>
              <li>Pas de données clients ni de ventes (futur CRM).</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
