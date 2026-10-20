import type { Article, Keyword } from "../types";

/**
 * SEO : mots-clés cibles et articles de blog.
 * Volumes et positions laissés vides : ils ne sont renseignés que par Google Search Console (connectée) ou une saisie manuelle.
 * La difficulté est une estimation qualitative de l'équipe (hypothèse), pas une donnée d'outil.
 */

let i = 0;
const kw = (keyword: string, cluster: string, intent: Keyword["intent"], priority: 1 | 2 | 3, targetUrl: string, difficulty: Keyword["difficulty"]): Keyword =>
  ({ id: `kw_${++i}`, keyword, cluster, intent, priority, targetUrl, difficulty, volume: null, position: null, history: [] });

export const keywords: Keyword[] = [
  kw("sérum niacinamide", "Niacinamide", "commerciale", 1, "/produits/clear-skin-serum-niacinamide", "forte"),
  kw("niacinamide bienfaits", "Niacinamide", "informationnelle", 1, "/conseils/niacinamide-guide-complet", "moyenne"),
  kw("niacinamide peau grasse", "Niacinamide", "informationnelle", 1, "/conseils/niacinamide-guide-complet", "moyenne"),
  kw("niacinamide et vitamine c", "Niacinamide", "informationnelle", 2, "/conseils/niacinamide-guide-complet", "faible"),
  kw("routine peau grasse", "Imperfections", "informationnelle", 1, "/conseils/routine-peau-a-imperfections", "forte"),
  kw("routine anti imperfections", "Imperfections", "informationnelle", 1, "/conseils/routine-peau-a-imperfections", "moyenne"),
  kw("patch bouton", "Imperfections", "transactionnelle", 2, "/produits/spot-hero-patchs-anti-imperfections", "moyenne"),
  kw("bha peau grasse", "Imperfections", "informationnelle", 2, "/produits/bha-clear-liquid-exfoliant", "moyenne"),
  kw("routine peau sensible", "Peau sensible", "informationnelle", 1, "/conseils/routine-peau-sensible", "moyenne"),
  kw("sérum apaisant peau sensible", "Peau sensible", "commerciale", 2, "/produits/calm-down-serum-centella", "moyenne"),
  kw("centella asiatica bienfaits", "Peau sensible", "informationnelle", 2, "/conseils/routine-peau-sensible", "faible"),
  kw("barrière cutanée abîmée", "Barrière cutanée", "informationnelle", 1, "/conseils/reparer-barriere-cutanee", "moyenne"),
  kw("crème céramides", "Barrière cutanée", "commerciale", 2, "/produits/velvet-barrier-creme-riche", "moyenne"),
  kw("routine peau sèche hiver", "Barrière cutanée", "informationnelle", 2, "/conseils/reparer-barriere-cutanee", "moyenne"),
  kw("sérum vitamine c", "Éclat", "commerciale", 1, "/produits/glow-shot-serum-vitamine-c", "forte"),
  kw("comment utiliser la vitamine c visage", "Éclat", "informationnelle", 1, "/conseils/routine-glow-vitamine-c", "faible"),
  kw("routine teint terne", "Éclat", "informationnelle", 2, "/conseils/routine-glow-vitamine-c", "faible"),
  kw("glass skin routine", "Éclat", "informationnelle", 2, "/kits/glass-skin-routine", "moyenne"),
  kw("sérum acide hyaluronique", "Hydratation", "commerciale", 1, "/produits/aqua-plump-serum-acide-hyaluronique", "forte"),
  kw("peau déshydratée que faire", "Hydratation", "informationnelle", 2, "/conseils/peau-deshydratee-ou-seche", "faible"),
  kw("peau sèche ou déshydratée", "Hydratation", "informationnelle", 2, "/conseils/peau-deshydratee-ou-seche", "faible"),
  kw("rétinal ou rétinol", "Anti-âge", "informationnelle", 2, "/conseils/retinal-ou-bakuchiol", "moyenne"),
  kw("bakuchiol", "Anti-âge", "informationnelle", 3, "/produits/first-lines-serum-bakuchiol", "faible"),
  kw("contour des yeux caféine", "Regard", "commerciale", 3, "/produits/bright-eyes-contour-yeux-cafeine", "moyenne"),
  kw("spf 50 visage quotidien", "Protection solaire", "commerciale", 1, "/produits/daily-shield-spf50", "forte"),
  kw("crème solaire minérale peau sensible", "Protection solaire", "commerciale", 2, "/produits/mineral-calm-spf50", "moyenne"),
  kw("diagnostic de peau en ligne", "Skin Diag", "commerciale", 1, "/skin-diag", "moyenne"),
  kw("quel est mon type de peau", "Skin Diag", "informationnelle", 1, "/skin-diag", "moyenne"),
  kw("double nettoyage", "Démaquillage", "informationnelle", 2, "/produits/melt-away-baume-demaquillant", "faible"),
  kw("coffret soin visage", "Kits", "transactionnelle", 2, "/kits", "forte"),
];

const now = new Date().toISOString();
type Ax = Omit<Article, "createdAt" | "updatedAt" | "author" | "readingMinutes">;
const art = (x: Ax): Article => ({ ...x, author: "Équipe SKINCLEAN", readingMinutes: Math.max(2, Math.round(x.content.split(/\s+/).length / 200)), createdAt: now, updatedAt: now });

export const articles: Article[] = [
  art({
    id: "art-niacinamide", slug: "niacinamide-guide-complet", status: "a_valider", keyword: "niacinamide bienfaits", secondary: ["niacinamide peau grasse", "sérum niacinamide", "niacinamide et vitamine c"],
    title: "Niacinamide : bienfaits, utilisation et associations (le guide complet)",
    metaTitle: "Niacinamide : bienfaits, utilisation, associations | SKINCLEAN", metaDescription: "Pores, brillances, imperfections : ce que la niacinamide fait vraiment, comment l'utiliser et avec quels actifs l'associer. Le guide simple de SKINCLEAN.",
    excerpt: "Ce que la niacinamide fait (et ne fait pas), comment l'intégrer à ta routine et avec quoi l'associer.", cover: "/media/packshots/clear-skin-serum-niacinamide.png", productIds: ["sc-sr-01", "sc-cl-02", "sc-cr-03"],
    content: `La niacinamide est devenue l'un des actifs les plus recherchés en skincare. Bonne nouvelle : c'est aussi l'un des plus faciles à utiliser. Voici l'essentiel, sans jargon.

## La niacinamide, c'est quoi ?

La niacinamide (ou nicotinamide) est une forme de **vitamine B3**. En cosmétique, elle est appréciée pour sa polyvalence et sa bonne tolérance par la plupart des peaux.

## Ses bienfaits

- Elle aide à **réduire l'apparence des pores** dilatés.
- Elle contribue à **réguler l'aspect brillant** des peaux mixtes à grasses.
- Elle aide à **unifier l'apparence du teint** et à atténuer les marques laissées par les imperfections.
- Elle accompagne le **confort de la barrière cutanée**.

Comme pour tout actif, les résultats varient selon les peaux et s'observent sur plusieurs semaines d'utilisation régulière.

## Comment l'utiliser ?

Applique quelques gouttes de sérum **matin et/ou soir**, après le nettoyage et avant ta crème. Une couche fine suffit. Si ta peau est sensible, commence une fois par jour.

Notre sérum [Clear Skin](/produits/clear-skin-serum-niacinamide) associe niacinamide 10 % et zinc, pour les peaux qui veulent moins d'imperfections visibles et des pores resserrés.

## Avec quoi l'associer ?

- **Acide hyaluronique** : duo parfait pour hydrater et équilibrer.
- **Vitamine C** : l'association est possible. Si ta peau tiraille, utilise la vitamine C le matin et la niacinamide le soir.
- **Rétinoïdes** : la niacinamide peut accompagner une routine rétinoïde ; introduis toujours un actif à la fois.
- **Acides exfoliants** : possible, mais évite de multiplier les actifs le même soir.

## Les erreurs à éviter

1. Croire que plus la concentration est élevée, plus c'est efficace.
2. Superposer trois sérums « anti-imperfections ».
3. Oublier l'hydratation : une peau grasse a aussi besoin d'eau.

## Notre routine conseillée pour peau mixte

Le matin : [Clear Foam](/produits/clear-foam-nettoyant-purifiant), Clear Skin, [Matte Balance](/produits/matte-balance-gel-creme) et un SPF. Le soir : même routine, sans le SPF.

Tu hésites ? Fais ton [Skin Diag](/skin-diag) : en 2 minutes, il vérifie les associations d'actifs et te propose une routine adaptée.`,
  }),
  art({
    id: "art-imperfections", slug: "routine-peau-a-imperfections", status: "brouillon", keyword: "routine anti imperfections", secondary: ["routine peau grasse", "patch bouton", "bha peau grasse"],
    title: "Routine peau à imperfections : les 3 gestes qui changent tout",
    metaTitle: "Routine anti-imperfections en 3 gestes | SKINCLEAN", metaDescription: "Nettoyer sans décaper, réguler, hydrater : la routine anti-imperfections simple et douce, et les erreurs qui aggravent les boutons.",
    excerpt: "Nettoyer sans décaper, réguler, hydrater : la méthode douce pour une peau plus nette.", cover: "/media/packshots/clear-foam-nettoyant-purifiant.png", productIds: ["sc-cl-02", "sc-sr-01", "sc-cr-03", "sc-pt-01", "sc-ex-02"],
    content: `Quand on a des imperfections, le réflexe est souvent d'attaquer : nettoyants agressifs, gommages quotidiens, produits asséchants. Résultat : une peau irritée… qui produit encore plus de sébum.

## Geste 1 : nettoyer sans décaper

Matin et soir, un nettoyant purifiant doux comme [Clear Foam](/produits/clear-foam-nettoyant-purifiant). Masse 20 secondes en insistant sur la zone T, puis rince à l'eau tiède.

## Geste 2 : réguler

Un sérum à la niacinamide comme [Clear Skin](/produits/clear-skin-serum-niacinamide) aide à réduire l'apparence des imperfections et des pores. 2 à 3 fois par semaine, le soir, un exfoliant au BHA comme [BHA Clear Liquid](/produits/bha-clear-liquid-exfoliant) aide à désencombrer les pores (jamais le même soir qu'un rétinoïde).

## Geste 3 : hydrater

Un gel-crème léger et non gras comme [Matte Balance](/produits/matte-balance-gel-creme). Le matin, termine par un SPF.

## Et le bouton de dernière minute ?

On ne perce pas : on protège. Un patch hydrocolloïde comme [Spot Hero](/produits/spot-hero-patchs-anti-imperfections) isole l'imperfection et limite la tentation d'y toucher.

## Quand consulter ?

Si tes imperfections sont nombreuses, douloureuses, laissent des cicatrices ou persistent malgré une routine adaptée, parles-en à un médecin ou à un dermatologue. Les soins cosmétiques ne remplacent pas un traitement.`,
  }),
  art({
    id: "art-sensible", slug: "routine-peau-sensible", status: "brouillon", keyword: "routine peau sensible", secondary: ["sérum apaisant peau sensible", "centella asiatica bienfaits"],
    title: "Peau sensible : la routine minimaliste qui apaise",
    metaTitle: "Routine peau sensible et rougeurs : la méthode douce | SKINCLEAN", metaDescription: "Rougeurs, tiraillements, réactions : comment construire une routine courte et apaisante pour peau sensible, étape par étape.",
    excerpt: "Moins de produits, des formules courtes et les bons réflexes pour apaiser une peau réactive.", cover: "/media/packshots/calm-down-serum-centella.png", productIds: ["sc-cl-01", "sc-sr-04", "sc-cr-04", "sc-sp-02"],
    content: `Une peau sensible réagit vite : rougeurs, picotements, tiraillements. La meilleure stratégie est souvent de **faire moins**, mais mieux.

## Les règles d'or

- Introduis **un seul nouveau produit à la fois**, et attends deux semaines avant le suivant.
- Fais un **test dans le cou** pendant 48 heures.
- Évite l'eau trop chaude et les frottements.
- Méfie-toi des promesses « naturel = doux » : certains extraits peuvent irriter.

## La routine en 4 gestes

1. **Nettoyer** avec un gel doux comme [Cloud Gel](/produits/cloud-gel-nettoyant-doux).
2. **Apaiser** avec un sérum à la centella comme [Calm Down](/produits/calm-down-serum-centella).
3. **Réconforter** avec une crème dédiée comme [Comfort Zone](/produits/comfort-zone-creme-apaisante).
4. **Protéger** le matin avec un SPF minéral comme [Mineral Calm SPF 50](/produits/mineral-calm-spf50).

## La centella asiatica, c'est quoi ?

Une plante traditionnellement utilisée pour apaiser et réconforter les peaux réactives. Elle s'intègre facilement dans une routine minimaliste.

## Quand consulter ?

Des rougeurs persistantes, des sensations de brûlure ou des boutons sur les joues peuvent relever d'une affection de la peau : un dermatologue saura poser un diagnostic.`,
  }),
  art({
    id: "art-barriere", slug: "reparer-barriere-cutanee", status: "brouillon", keyword: "barrière cutanée abîmée", secondary: ["crème céramides", "routine peau sèche hiver"],
    title: "Barrière cutanée abîmée : la reconnaître et la réparer",
    metaTitle: "Barrière cutanée abîmée : signes et routine pour la réparer | SKINCLEAN", metaDescription: "Tiraillements, picotements, rougeurs : les signes d'une barrière cutanée fragilisée et la routine cocon pour la réparer, surtout en hiver.",
    excerpt: "Les signes qui ne trompent pas et la routine cocon pour retrouver une peau confortable.", cover: "/media/packshots/velvet-barrier-creme-riche.png", productIds: ["sc-dm-02", "sc-sr-03", "sc-cr-02", "sc-ms-01"],
    content: `La barrière cutanée, c'est la couche la plus superficielle de la peau. Quand elle est fragilisée, tout devient inconfortable.

## Les signes

- La peau **tiraille** après le nettoyage.
- Les produits habituels **piquent**.
- Des **rougeurs** et des zones sèches apparaissent.
- La peau paraît terne et rugueuse.

## Les causes fréquentes

Froid et vent, exfoliation trop fréquente, nettoyants décapants, superposition d'actifs, douches très chaudes.

## La routine cocon

1. **Pause sur les exfoliants** et les rétinoïdes pendant quelques semaines.
2. **Démaquiller en douceur** avec un lait comme [Silk Off](/produits/silk-off-lait-demaquillant).
3. **Hydrater** sur peau humide avec [Aqua Plump](/produits/aqua-plump-serum-acide-hyaluronique).
4. **Nourrir et protéger** avec une crème aux céramides comme [Velvet Barrier](/produits/velvet-barrier-creme-riche).
5. Une à deux fois par semaine, un masque de nuit comme [Hydra Bloom](/produits/hydra-bloom-masque-hydratant).

Le [Winter Rescue Kit](/kits/winter-rescue) réunit ces étapes.

## Combien de temps ?

Sois patiente : une barrière se répare en quelques semaines de routine douce et régulière.`,
  }),
  art({
    id: "art-glow", slug: "routine-glow-vitamine-c", status: "brouillon", keyword: "comment utiliser la vitamine c visage", secondary: ["sérum vitamine c", "routine teint terne"],
    title: "Vitamine C : comment l'utiliser pour un teint lumineux",
    metaTitle: "Comment utiliser la vitamine C sur le visage | SKINCLEAN", metaDescription: "Matin ou soir, avec quoi l'associer, comment la conserver : le mode d'emploi de la vitamine C pour un teint plus lumineux.",
    excerpt: "Le mode d'emploi de la vitamine C, et la routine glow du matin en 4 gestes.", cover: "/media/packshots/glow-shot-serum-vitamine-c.png", productIds: ["sc-tn-01", "sc-sr-02", "sc-cr-01", "sc-sp-01"],
    content: `La vitamine C est l'actif star des routines éclat. Bien utilisée, elle aide à raviver un teint terne.

## Matin ou soir ?

Plutôt **le matin** : antioxydante, elle complète idéalement la protection solaire. Applique-la sur peau propre et sèche, avant ta crème, puis termine par un SPF.

## Combien ?

Trois gouttes suffisent pour tout le visage. Si ta peau picote, commence un jour sur deux.

## Avec quoi l'associer ?

- **SPF** : le duo indispensable du matin.
- **Acide hyaluronique** : pour hydrater en même temps.
- **Niacinamide** : possible ; en cas d'inconfort, sépare-les (vitamine C le matin, niacinamide le soir).

## La conserver

À l'abri de la lumière et de la chaleur, flacon bien fermé. Une couleur qui fonce nettement est le signe d'une oxydation.

## La routine glow du matin

1. [Dew Drop](/produits/dew-drop-toner-hydratant) en deux couches tapotées.
2. [Glow Shot](/produits/glow-shot-serum-vitamine-c), 3 gouttes.
3. [Cloud Cream](/produits/cloud-cream-creme-hydratante).
4. [Daily Shield SPF 50](/produits/daily-shield-spf50).`,
  }),
  art({
    id: "art-deshydratee", slug: "peau-deshydratee-ou-seche", status: "brouillon", keyword: "peau sèche ou déshydratée", secondary: ["peau déshydratée que faire", "sérum acide hyaluronique"],
    title: "Peau sèche ou déshydratée : comment faire la différence ?",
    metaTitle: "Peau sèche ou déshydratée : les différences et les bons soins | SKINCLEAN", metaDescription: "Manque de lipides ou manque d'eau ? Apprends à distinguer peau sèche et peau déshydratée et à choisir les bons soins.",
    excerpt: "Manque de lipides ou manque d'eau : deux besoins différents, deux routines différentes.", cover: "/media/packshots/aqua-plump-serum-acide-hyaluronique.png", productIds: ["sc-sr-03", "sc-tn-01", "sc-cr-02", "sc-cr-01"],
    content: `On les confond souvent, mais ce n'est pas la même chose.

## Peau sèche : un type de peau

Elle manque de **lipides**. Elle est souvent fine, peut desquamer et paraît rêche. Elle a besoin de textures **nourrissantes** (céramides, beurres, huiles).

## Peau déshydratée : un état passager

Elle manque d'**eau**. Tous les types de peau peuvent l'être, même les peaux grasses. Elle tiraille, marque les ridules de déshydratation et paraît terne. Elle a besoin d'**actifs hydratants** comme l'acide hyaluronique et la glycérine.

## Le test simple

Pince légèrement ta joue : si de fines ridules apparaissent, ta peau manque probablement d'eau.

## Les routines

- **Peau déshydratée** : [Dew Drop](/produits/dew-drop-toner-hydratant), [Aqua Plump](/produits/aqua-plump-serum-acide-hyaluronique) sur peau humide, [Cloud Cream](/produits/cloud-cream-creme-hydratante).
- **Peau sèche** : même base, avec [Velvet Barrier](/produits/velvet-barrier-creme-riche) pour nourrir.

Pas sûre de ton type de peau ? Le [Skin Diag](/skin-diag) t'aide à le déterminer.`,
  }),
];

/** Sujets d'articles planifiés (briefs) pour compléter le calendrier SEO à 4 articles par mois. */
export const articleBriefs: { title: string; keyword: string; slug: string; productIds: string[] }[] = [
  { title: "Rétinal ou bakuchiol : lequel choisir pour tes premières ridules ?", keyword: "rétinal ou rétinol", slug: "retinal-ou-bakuchiol", productIds: ["sc-sr-06", "sc-sr-05"] },
  { title: "Le double nettoyage : pourquoi et comment ?", keyword: "double nettoyage", slug: "double-nettoyage-guide", productIds: ["sc-dm-01", "sc-cl-01"] },
  { title: "SPF en hiver : vraiment indispensable ?", keyword: "spf 50 visage quotidien", slug: "spf-en-hiver", productIds: ["sc-sp-01", "sc-sp-02"] },
  { title: "Quel est mon type de peau ? Le test en 5 questions", keyword: "quel est mon type de peau", slug: "quel-est-mon-type-de-peau", productIds: [] },
  { title: "Exfolier sans agresser : AHA, BHA, PHA, enzymes", keyword: "bha peau grasse", slug: "exfolier-sans-agresser", productIds: ["sc-ex-01", "sc-ex-02", "sc-tn-02"] },
  { title: "Contour des yeux : à quel âge commencer ?", keyword: "contour des yeux caféine", slug: "contour-des-yeux-guide", productIds: ["sc-ey-01", "sc-ey-02"] },
  { title: "Glass skin : la méthode coréenne en version simple", keyword: "glass skin routine", slug: "glass-skin-methode", productIds: ["sc-tn-01", "sc-sr-03", "sc-cr-01"] },
  { title: "Idées cadeaux skincare par type de peau", keyword: "coffret soin visage", slug: "idees-cadeaux-skincare", productIds: [] },
  { title: "Patchs anti-boutons : comment ça marche ?", keyword: "patch bouton", slug: "patchs-anti-boutons", productIds: ["sc-pt-01", "sc-pt-02"] },
  { title: "Routine du soir en 3 minutes", keyword: "routine du soir", slug: "routine-du-soir-3-minutes", productIds: ["sc-dm-01", "sc-sr-06", "sc-cr-02"] },
];
