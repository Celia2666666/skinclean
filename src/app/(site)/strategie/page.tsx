import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/catalog/PageHero";
import { euro } from "@/lib/format";
import { businessModel, competitors, market, ourProduct, personas, pricing, problem, sources, src } from "@/data/strategy";
import { promise } from "@/data/offer";
import { hubSection } from "@/data/hub-public";
import { BlockExplorer, Funnel, KindLegend, ObjectiveCards, PersonaDeck, RoadmapTimeline, SwotGrid } from "@/components/strategy/HubSections";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Stratégie : pourquoi ce produit",
  description: "Le dossier stratégique de SKINCLEAN : problème, personas, marché du soin en France chiffré et sourcé, concurrents et prix, justification du prix et modèle économique à 12 mois.",
};

const sections = [
  { id: "probleme", label: "Problème" },
  { id: "cible", label: "Personas" },
  { id: "marche", label: "Marché" },
  { id: "concurrence", label: "Concurrence" },
  { id: "prix", label: "Prix" },
  { id: "modele", label: "Modèle économique" },
  { id: "tendances", label: "Tendances & cadre" },
  { id: "swot", label: "SWOT" },
  { id: "positionnement", label: "Positionnement" },
  { id: "audience", label: "4 profils" },
  { id: "objectifs", label: "Objectifs SMART" },
  { id: "plan", label: "Plan 12 mois" },
  { id: "sources", label: "Sources" },
];

/** Renvoi numéroté vers une source (s'ouvre dans un nouvel onglet). */
function Cite({ id }: { id: string }) {
  const s = src(id);
  const n = sources.findIndex((x) => x.id === id) + 1;
  return (
    <a href={s.url} target="_blank" rel="noopener noreferrer" title={`${s.publisher} — ${s.label}`} className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-sm bg-sage-soft px-1 align-text-top text-[0.65rem] font-semibold text-forest no-underline hover:bg-forest hover:text-ivory">
      {n}
    </a>
  );
}

const H2 = ({ id, kicker, children, intro }: { id: string; kicker: string; children: React.ReactNode; intro?: React.ReactNode }) => (
  <Reveal className="mb-8">
    <p className="eyebrow text-sage-deep">{kicker}</p>
    <h2 id={id} className="mt-2 scroll-mt-[calc(8rem+var(--demo-h))] font-display text-4xl md:text-5xl">{children}</h2>
    {intro && <p className="mt-3 max-w-3xl text-forest-soft">{intro}</p>}
  </Reveal>
);

export default function StrategyPage() {
  const rows = [...competitors, ourProduct];
  return (
    <>
      <PageHero eyebrow="Espace stratégie · pourquoi ce produit" title="Le dossier stratégique" intro={promise.sentence} bg="#EFEEEA" crumbs={[{ href: "/strategie", label: "Stratégie" }]}>
        <nav aria-label="Sommaire" className="mt-8 flex flex-wrap gap-2">
          {sections.map((s) => <a key={s.id} href={`#${s.id}`} className="chip bg-ivory px-3 py-1.5 text-xs hover:bg-forest hover:text-ivory">{s.label}</a>)}
          <Link href="/communication" className="chip bg-forest px-3 py-1.5 text-xs text-ivory">Plan de communication →</Link>
        </nav>
      </PageHero>

      <div className="mx-auto max-w-[1300px] space-y-24 px-4 py-16 md:px-8">
        {/* 1. Problème */}
        <section aria-labelledby="probleme">
          <H2 id="probleme" kicker="1 · Le problème">{problem.title}</H2>
          <div className="grid gap-4 md:grid-cols-3">
            {problem.who.map((w) => (
              <div key={w.figure} className="border border-line bg-ivory p-6">
                <p className="font-display text-5xl">{w.figure}<Cite id={w.source} /></p>
                <p className="mt-3 text-sm text-forest-soft">{w.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="bg-sage-soft p-6"><p className="font-medium">À quelle fréquence ?</p><p className="mt-2 text-sm text-forest-soft">{problem.frequency}</p></div>
            <div className="bg-sage-soft p-6"><p className="font-medium">Ce que ça coûte aujourd&apos;hui</p><p className="mt-2 text-sm text-forest-soft">{problem.cost.text}</p><p className="mt-3 border-l-2 border-forest pl-3 text-sm"><span className="chip mr-2 bg-ivory text-[0.6rem]">Estimation</span>{problem.cost.estimate}</p></div>
          </div>
        </section>

        {/* 2. Personas */}
        <section aria-labelledby="cible">
          <H2 id="cible" kicker="2 · La cible">Deux personas précis</H2>
          <div className="grid gap-6 md:grid-cols-2">
            {personas.map((p) => (
              <article key={p.name} className="border border-line bg-ivory p-6 md:p-8">
                <p className="font-display text-3xl">{p.name}</p>
                <p className="text-sm text-forest-soft">{p.role}</p>
                <dl className="mt-5 grid gap-3 text-sm">
                  {[["Peau", p.skin], ["Budget", p.budget], ["Où elle s'informe", p.channels], ["Ce qu'elle veut", p.goal], ["Sa frustration", p.pain], ["Notre réponse", p.offer]].map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[minmax(0,9rem)_1fr] gap-3 border-t border-line pt-3"><dt className="font-medium">{k}</dt><dd className="text-forest-soft">{v}</dd></div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
          <p className="mt-4 text-xs text-forest-soft">Les personas sont des profils types construits à partir des études citées (usages des 15-25 ans<Cite id="genz" />, peaux sensibles<Cite id="sensible" />) : ce ne sont pas de vraies personnes.</p>
        </section>

        {/* 3. Marché */}
        <section aria-labelledby="marche">
          <H2 id="marche" kicker="3 · Le marché">Taille, croissance et tendances</H2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {market.figures.map((f) => (
              <div key={f.figure} className="bg-forest p-6 text-ivory">
                <p className="font-display text-4xl">{f.figure}<Cite id={f.source} /></p>
                <p className="mt-3 text-sm text-ivory/80">{f.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {market.trends.map((t) => (
              <div key={t.t} className="border border-line bg-ivory p-6"><p className="font-medium">{t.t}<Cite id={t.source} /></p><p className="mt-2 text-sm text-forest-soft">{t.d}</p></div>
            ))}
          </div>
          <div className="mt-8 bg-sage-soft p-6 md:p-8">
            <p className="font-display text-2xl">{market.sizing.title}</p>
            <ol className="mt-4 space-y-2 text-sm">
              {market.sizing.steps.map((s, i) => <li key={s} className="flex gap-3"><span className="font-display text-forest/50">{i + 1}</span><span>{s}{i === 0 && <Cite id="marketline" />}</span></li>)}
            </ol>
            <p className="mt-4 text-xs text-forest-soft"><span className="chip mr-2 bg-ivory text-[0.6rem]">Estimation</span>{market.sizing.note}</p>
          </div>
        </section>

        {/* 4. Concurrence */}
        <section aria-labelledby="concurrence">
          <H2 id="concurrence" kicker="4 · La concurrence">Trois concurrents réels, un produit comparable</H2>
          <p className="-mt-4 mb-6 max-w-3xl text-forest-soft">Comparaison sur le produit phare de chacun pour les peaux à imperfections : un sérum à la niacinamide ou à l&apos;acide salicylique de 30 ml. Prix publics TTC relevés sur les sites officiels.</p>
          <div className="no-scrollbar -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
            <table className="w-full min-w-[820px] border-collapse text-left text-sm">
              <thead><tr className="border-b border-forest/20 text-xs uppercase tracking-[0.06em] text-forest-soft"><th className="py-3 pr-4 font-medium">Marque</th><th className="py-3 pr-4 font-medium">Produit comparé</th><th className="py-3 pr-4 text-right font-medium">Prix TTC</th><th className="py-3 pr-4 text-right font-medium">€ / 100 ml</th><th className="py-3 pr-4 font-medium">Positionnement</th><th className="py-3 font-medium">Ce qui nous distingue</th></tr></thead>
              <tbody>
                {rows.map((c) => {
                  const ours = c.brand === "SKINCLEAN";
                  return (
                    <tr key={c.brand} className={`border-b border-line align-top ${ours ? "bg-sage-soft" : ""}`}>
                      <td className="py-4 pr-4 font-medium">{c.brand}{"source" in c && <Cite id={c.source as string} />}</td>
                      <td className="py-4 pr-4 text-forest-soft">{c.product}</td>
                      <td className="py-4 pr-4 text-right font-semibold tabular-nums">{euro(c.price)}</td>
                      <td className="py-4 pr-4 text-right tabular-nums text-forest-soft">{euro(c.per100)}</td>
                      <td className="py-4 pr-4 text-forest-soft">{c.positioning}</td>
                      <td className="py-4 text-forest-soft">{ours ? <b className="font-medium text-forest">Notre limite : {c.limit}</b> : <>Leur limite : {c.limit}</>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-forest-soft">Marques citées comme concurrentes uniquement : aucune d&apos;entre elles ne travaille avec SKINCLEAN.</p>
        </section>

        {/* 5. Prix */}
        <section aria-labelledby="prix">
          <H2 id="prix" kicker="5 · Le prix">Comment nous avons fixé 22 € TTC</H2>
          <div className="grid gap-4 md:grid-cols-3">
            {pricing.method.map((m, i) => (
              <div key={m.t} className="border border-line bg-ivory p-6"><span className="font-display text-3xl text-forest/30">{i + 1}</span><p className="mt-2 font-medium">{m.t}{i === 0 && <><Cite id="ordinary" /><Cite id="typology" /><Cite id="lrp" /></>}</p><p className="mt-2 text-sm text-forest-soft">{m.d}</p></div>
            ))}
          </div>
          <p className="mt-6 max-w-3xl border-l-2 border-forest pl-4 text-forest-soft">{pricing.coherence}</p>
        </section>

        {/* 6. Modèle économique */}
        <section aria-labelledby="modele">
          <H2 id="modele" kicker="6 · Le modèle économique">Comment SKINCLEAN gagne de l&apos;argent</H2>
          <div className="grid gap-4 md:grid-cols-3">
            {businessModel.revenue.map((r) => <div key={r.t} className="bg-sage-soft p-6"><p className="font-medium">{r.t}</p><p className="mt-2 text-sm text-forest-soft">{r.d}</p></div>)}
          </div>
          <div className="mt-8 bg-forest p-6 text-ivory md:p-10">
            <p className="eyebrow text-sage">Objectif chiffré à 12 mois</p>
            <p className="mt-2 font-display text-3xl md:text-4xl">{businessModel.goal.headline}</p>
            <dl className="mt-6 grid gap-x-8 gap-y-3 text-sm md:grid-cols-2">
              {businessModel.goal.steps.map(([k, v]) => <div key={k} className="border-t border-ivory/15 pt-3"><dt className="text-ivory/60">{k}</dt><dd className="mt-0.5 font-medium">{v}</dd></div>)}
            </dl>
            <p className="mt-6 text-xs text-ivory/60">{businessModel.goal.note}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/crm" className="btn btn-light">Suivre les ventes dans le CRM</Link>
              <Link href="/communication" className="btn border-ivory/50 text-ivory hover:bg-ivory hover:text-forest">Voir le plan de communication</Link>
            </div>
          </div>
        </section>

        {/* Analyse détaillée : tendances, SWOT, positionnement, objectifs, plan */}
        <div className="relative overflow-hidden bg-forest px-6 py-12 text-ivory md:px-12 md:py-16">
          <span aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 animate-[spin_40s_linear_infinite] rounded-full border border-ivory/10" />
          <span aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 animate-[spin_25s_linear_infinite_reverse] rounded-full border border-dashed border-ivory/15" />
          <Reveal>
            <p className="eyebrow text-sage">Pour aller plus loin</p>
            <p className="mt-2 max-w-3xl font-display text-3xl md:text-5xl">L&apos;analyse stratégique complète</p>
            <p className="mt-4 max-w-2xl text-sm text-ivory/75">Les tendances, le cadre légal, le SWOT, le positionnement, les profils de la cible, les objectifs chiffrés et le plan marketing sur 12 mois.</p>
          </Reveal>
        </div>

        <section aria-labelledby="tendances">
          <H2 id="tendances" kicker="7 · Tendances et cadre légal" intro={hubSection("tendances").summary}>Ce qui change dans le soin</H2>
          <div className="mb-6"><KindLegend /></div>
          <BlockExplorer blocks={hubSection("tendances").blocks} />
          <p className="mb-4 mt-12 font-display text-2xl">Les règles que la marque doit respecter</p>
          <BlockExplorer blocks={hubSection("marche").blocks.filter((b) => b.kind === "fait")} dark />
          <p className="mb-4 mt-12 font-display text-2xl">Ce que font les autres marques</p>
          <BlockExplorer blocks={hubSection("benchmark").blocks} />
        </section>

        <section aria-labelledby="swot">
          <H2 id="swot" kicker="8 · SWOT" intro={hubSection("swot").summary}>Forces, faiblesses, opportunités, menaces</H2>
          <SwotGrid section={hubSection("swot")} />
        </section>

        <section aria-labelledby="positionnement">
          <H2 id="positionnement" kicker="9 · Positionnement" intro={hubSection("positionnement").summary}>Où se place SKINCLEAN</H2>
          <BlockExplorer blocks={hubSection("positionnement").blocks} dark />
          <p className="mb-4 mt-12 font-display text-2xl">{hubSection("valeur").title}</p>
          <BlockExplorer blocks={hubSection("valeur").blocks} />
          <p className="mb-6 mt-12 font-display text-2xl">{hubSection("parcours").title} : de la découverte à la recommandation</p>
          <Funnel section={hubSection("parcours")} />
        </section>

        <section aria-labelledby="audience">
          <H2 id="audience" kicker="10 · L'audience en détail" intro={"Les quatre profils qui guident l'écriture de nos contenus, dont Léa et Camille, nos deux personas principaux. Ce sont des profils types, pas de vraies personnes."}>Quatre profils, quatre façons de parler</H2>
          <PersonaDeck />
        </section>

        <section aria-labelledby="objectifs">
          <H2 id="objectifs" kicker="11 · Objectifs SMART" intro="Objectifs marketing chiffrés, datés et attribués : ce sont des cibles, pas des résultats.">Ce que l&apos;on vise d&apos;ici 2027</H2>
          <ObjectiveCards />
        </section>

        <section aria-labelledby="plan">
          <H2 id="plan" kicker="12 · Plan annuel" intro="Un thème par mois, avec les campagnes, les réseaux, le référencement, la publicité, les newsletters et le budget prévu.">Douze mois de marketing, d&apos;octobre 2026 à septembre 2027</H2>
          <RoadmapTimeline />
        </section>

        {/* Sources */}
        <section aria-labelledby="sources" className="border-t border-line pt-10">
          <H2 id="sources" kicker="Sources">Toutes les sources, consultées le 10 novembre 2026</H2>
          <ol className="space-y-3 text-sm">
            {sources.map((s, i) => (
              <li key={s.id} className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-sm bg-sage-soft text-xs font-semibold">{i + 1}</span>
                <span><a href={s.url} target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-4 hover:text-forest-soft">{s.label}</a><span className="text-forest-soft"> — {s.publisher}, {s.date}</span></span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
