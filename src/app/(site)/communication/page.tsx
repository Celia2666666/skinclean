import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/catalog/PageHero";
import { brandPlatform, calendar, channels, firstTen, kpis, partnerships, posts } from "@/data/communication";
import { sources, src } from "@/data/strategy";
import { hubData, hubSection } from "@/data/hub-public";
import { AdsGrid, BlockExplorer, CampaignStrip, PillarBars, StrategyTabs } from "@/components/strategy/HubSections";
import { EditorialCalendar, FeedLibrary, NewsletterShelf, PlanPosts, SeoStudio } from "@/components/strategy/HubStudio";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Communication : comment vendre",
  description: "Le plan de communication de SKINCLEAN : plateforme de marque, canaux, 9 posts prêts à publier sur Instagram, TikTok et Pinterest, calendrier sur 4 semaines, partenariats, 10 premiers clients et indicateurs.",
};

const sections = [
  { id: "marque", label: "Plateforme de marque" },
  { id: "canaux", label: "Canaux" },
  { id: "ligne", label: "Ligne éditoriale" },
  { id: "posts", label: "9 posts" },
  { id: "bibliotheque", label: "Publications prêtes" },
  { id: "campagnes", label: "Campagnes" },
  { id: "calendrier", label: "Calendrier" },
  { id: "dispositif", label: "Influence, SEO, pub" },
  { id: "partenariats", label: "Partenariats" },
  { id: "clients", label: "10 premiers clients" },
  { id: "indicateurs", label: "Indicateurs" },
];

function Cite({ id }: { id: string }) {
  const s = src(id);
  const n = sources.findIndex((x) => x.id === id) + 1;
  return <a href={s.url} target="_blank" rel="noopener noreferrer" title={`${s.publisher} — ${s.label}`} className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-sm bg-sage-soft px-1 align-text-top text-[0.65rem] font-semibold text-forest hover:bg-forest hover:text-ivory">{n}</a>;
}

const H2 = ({ id, kicker, children, intro }: { id: string; kicker: string; children: React.ReactNode; intro?: React.ReactNode }) => (
  <Reveal className="mb-8">
    <p className="eyebrow text-sage-deep">{kicker}</p>
    <h2 id={id} className="mt-2 scroll-mt-[calc(8rem+var(--demo-h))] font-display text-4xl md:text-5xl">{children}</h2>
    {intro && <p className="mt-3 max-w-3xl text-forest-soft">{intro}</p>}
  </Reveal>
);


export default function CommunicationPage() {
  return (
    <>
      <PageHero eyebrow="Espace communication · comment le vendre" title="Le plan de communication" intro={brandPlatform.promise} bg="#EFEEEA" crumbs={[{ href: "/communication", label: "Communication" }]}>
        <nav aria-label="Sommaire" className="mt-8 flex flex-wrap gap-2">
          {sections.map((s) => <a key={s.id} href={`#${s.id}`} className="chip bg-ivory px-3 py-1.5 text-xs hover:bg-forest hover:text-ivory">{s.label}</a>)}
          <Link href="/strategie" className="chip bg-forest px-3 py-1.5 text-xs text-ivory">← Dossier stratégique</Link>
        </nav>
      </PageHero>

      <div className="mx-auto max-w-[1300px] space-y-24 px-4 py-16 md:px-8">
        {/* Plateforme de marque */}
        <section aria-labelledby="marque">
          <H2 id="marque" kicker="1 · Plateforme de marque">{brandPlatform.name} · {brandPlatform.tagline}</H2>
          <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
            <div className="bg-forest p-6 text-ivory md:p-8">
              <p className="eyebrow text-sage">La promesse</p>
              <p className="mt-3 font-display text-2xl leading-snug md:text-3xl">{brandPlatform.promise}</p>
              <p className="eyebrow mt-8 text-sage">Le ton</p>
              <ul className="mt-3 space-y-3 text-sm">
                {brandPlatform.tone.map((t) => <li key={t.t}><b className="font-medium">{t.t}.</b> <span className="text-ivory/75">{t.d}</span></li>)}
              </ul>
            </div>
            <div className="grid gap-4">
              {brandPlatform.messages.map((m, i) => (
                <div key={m.t} className="flex gap-5 border border-line bg-ivory p-6">
                  <span className="font-display text-4xl text-forest/25">{i + 1}</span>
                  <div><p className="eyebrow text-forest-soft">Message clé</p><p className="mt-1 font-display text-2xl">{m.t}</p><p className="mt-1 text-sm text-forest-soft">{m.d}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Canaux */}
        <section aria-labelledby="canaux">
          <H2 id="canaux" kicker="2 · Les canaux">Là où la cible s&apos;informe</H2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {channels.map((c) => (
              <div key={c.name} className="flex flex-col border border-line bg-ivory p-6">
                <p className="font-display text-2xl">{c.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.06em] text-sage-deep">{c.role}</p>
                <p className="mt-3 flex-1 text-sm text-forest-soft">{c.why}{c.source && <Cite id={c.source} />}</p>
                <p className="mt-4 border-t border-line pt-3 text-xs"><b className="font-medium">Rythme :</b> {c.rhythm}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Ligne éditoriale */}
        <section aria-labelledby="ligne">
          <H2 id="ligne" kicker="3 · Ligne éditoriale" intro={hubSection("ligne-editoriale").summary}>Cinq piliers de contenu</H2>
          <PillarBars section={hubSection("ligne-editoriale")} />
          <p className="mb-4 mt-12 font-display text-2xl">Messages clés déclinés dans les contenus</p>
          <BlockExplorer blocks={hubSection("messages").blocks} dark />
        </section>

        {/* Posts */}
        <section aria-labelledby="posts">
          <H2 id="posts" kicker="4 · Posts prêts à publier" intro="Clique sur un visuel pour voir le post tel qu'il apparaîtra sur le réseau, avec sa légende complète, puis le valider.">9 posts sur 3 réseaux</H2>
          <PlanPosts posts={posts} />
        </section>

        {/* Bibliothèque de contenus */}
        <section aria-labelledby="bibliotheque">
          <H2 id="bibliotheque" kicker="5 · Publications prêtes" intro={<>{hubData.posts.length} publications TikTok, Instagram, Pinterest, Facebook et Stories prêtes à publier. Clique sur une vignette : elle s&apos;affiche dans le téléphone comme sur le réseau, avec sa légende complète, et tu peux la modifier ou la valider. Les carrousels se feuillettent avec les flèches.</>}>La bibliothèque de contenus</H2>
          <FeedLibrary />
          <p className="mt-6 text-xs text-forest-soft">Aperçus sans aucun compteur inventé (ni likes, ni vues). « Publié sur le compte de test » : publication faite sur un compte d&apos;essai, pas sur un vrai compte. Notre vidéo « Ma routine sérum en 5 secondes » a été créée avec un outil d&apos;IA ; les autres vidéos sont des vidéos de démonstration libres de droits (Pexels), à remplacer par nos tournages.</p>
        </section>

        {/* Campagnes */}
        <section aria-labelledby="campagnes">
          <H2 id="campagnes" kicker="6 · Campagnes" intro={"Les douze campagnes préparées pour l'année. Fais défiler pour toutes les voir."}>Une campagne, un message</H2>
          <CampaignStrip />
        </section>

        {/* Calendrier */}
        <section aria-labelledby="calendrier">
          <H2 id="calendrier" kicker="7 · Calendrier éditorial">Quatre semaines, du 23 novembre au 20 décembre 2026</H2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {calendar.map((w) => (
              <div key={w.week} className="border border-line bg-ivory">
                <div className="bg-forest px-5 py-4 text-ivory"><p className="font-medium">{w.week}</p><p className="text-xs text-ivory/70">{w.theme}</p></div>
                <ul className="divide-y divide-line">
                  {w.items.map((it) => (
                    <li key={it.day + it.action} className="grid grid-cols-[4.5rem_1fr] gap-2 px-5 py-3 text-sm">
                      <span className="font-medium">{it.day}</span>
                      <span><span className="block text-[0.7rem] uppercase tracking-[0.06em] text-sage-deep">{it.channel}</span>{it.action}{it.postId && <span className="ml-1 text-xs text-forest-soft">(post {it.postId})</span>}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mb-2 mt-14 font-display text-3xl">Le calendrier, mois par mois</p>
          <p className="mb-6 max-w-3xl text-sm text-forest-soft">Choisis le plan des 4 semaines ou une campagne : son rétroplanning (préparation à rebours depuis le lancement) et chacune de ses actions s&apos;affichent dans le calendrier. Clique sur une action pour l&apos;ouvrir.</p>
          <EditorialCalendar />
        </section>

        {/* Dispositif */}
        <section aria-labelledby="dispositif">
          <H2 id="dispositif" kicker="8 · Le dispositif" intro="Comment les contenus sont produits, puis comment la marque se fait connaître : organique, influence, référencement, newsletters, publicité et relations presse.">Contenu, influence, SEO, newsletters, publicité</H2>
          <div className="space-y-16">
            <StrategyTabs sections={["contenu", "notoriete", "influence", "acquisition"].map(hubSection)} />
            <div id="seo" className="scroll-mt-[calc(8rem+var(--demo-h))]">
              <p className="mb-1 font-display text-2xl">Référencement naturel (SEO)</p>
              <p className="mb-6 text-sm text-forest-soft">Être trouvé sur Google quand la cible cherche une solution à son problème de peau. Clique sur un article pour le lire, voir son aperçu dans Google et le valider.</p>
              <SeoStudio />
            </div>
            <div id="newsletters" className="scroll-mt-[calc(8rem+var(--demo-h))]">
              <p className="mb-1 font-display text-2xl">Les newsletters</p>
              <p className="mb-6 text-sm text-forest-soft">{hubData.emails.length} e-mails prêts à envoyer, de la bienvenue au programme de fidélité. Clique pour voir l&apos;e-mail tel qu&apos;il arrivera dans la boîte de réception.</p>
              <NewsletterShelf />
            </div>
            <div>
              <p className="mb-1 font-display text-2xl">Publicité payante (SEA) : les annonces préparées</p>
              <p className="mb-4 text-sm text-forest-soft">Annonces prêtes à être programmées. Aucune n&apos;a été diffusée et aucun budget n&apos;a été dépensé : chaque dépense doit d&apos;abord être validée.</p>
              <AdsGrid />
            </div>
          </div>
        </section>

        {/* Partenariats */}
        <section aria-labelledby="partenariats">
          <H2 id="partenariats" kicker="9 · Partenariats">Cinq partenaires possibles</H2>
          <p className="-mt-4 mb-6 text-sm text-forest-soft">Pistes de partenariat à proposer : aucun accord n&apos;est signé à ce jour.</p>
          <div className="no-scrollbar -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
              <thead><tr className="border-b border-forest/20 text-xs uppercase tracking-[0.06em] text-forest-soft"><th className="py-3 pr-4 font-medium">Partenaire</th><th className="py-3 pr-4 font-medium">Ce que nous proposons</th><th className="py-3 pr-4 font-medium">Ce qu&apos;ils y gagnent</th><th className="py-3 font-medium">Première action</th></tr></thead>
              <tbody>
                {partnerships.map((p) => (
                  <tr key={p.who} className="border-b border-line align-top">
                    <td className="py-4 pr-4"><span className="block font-medium">{p.who}</span><span className="text-xs text-sage-deep">{p.type}</span></td>
                    <td className="py-4 pr-4 text-forest-soft">{p.offer}</td>
                    <td className="py-4 pr-4 text-forest-soft">{p.gain}</td>
                    <td className="py-4 text-forest-soft">{p.first}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 10 premiers clients */}
        <section aria-labelledby="clients">
          <H2 id="clients" kicker="10 · Acquisition">Trouver les 10 premiers clients</H2>
          <ol className="grid gap-4 md:grid-cols-5">
            {firstTen.map((f, i) => (
              <li key={f.how} className="flex flex-col bg-sage-soft p-5">
                <span className="font-display text-3xl">{f.n}</span>
                <p className="mt-2 flex-1 text-sm text-forest-soft">{f.how}</p>
                <p className="mt-3 text-xs"><b className="font-medium">{f.when}</b> · source CRM : {f.source}</p>
                <span className="sr-only">Étape {i + 1}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-forest-soft">Chaque contact est saisi dans le <Link href="/crm" className="underline">CRM</Link> avec sa source (réseau social, partenaire, salon), puis suivi dans le pipeline jusqu&apos;à la commande.</p>
        </section>

        {/* Indicateurs */}
        <section aria-labelledby="indicateurs">
          <H2 id="indicateurs" kicker="11 · Indicateurs">Ce que l&apos;on mesure</H2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {kpis.map((k) => (
              <div key={k.family} className="border border-line bg-ivory p-5">
                <p className="font-display text-xl">{k.family}</p>
                <dl className="mt-3 space-y-3 text-sm">
                  {k.items.map(([a, b]) => <div key={a}><dt className="text-forest-soft">{a}</dt><dd className="font-medium">{b}</dd></div>)}
                </dl>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-forest-soft">Ces valeurs sont des objectifs fixés pour les 4 premières semaines, pas des résultats : ils sont relevés chaque vendredi (statistiques des réseaux, tableau de bord du CRM).</p>
        </section>
      </div>
    </>
  );
}
