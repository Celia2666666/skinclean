import type { Article } from "../types";

/**
 * Articles complets issus des briefs du calendrier SEO : rédigés, relus et prêts à publier sur /conseils.
 * Allégations cosmétiques uniquement (aucune promesse médicale), liens internes vers les fiches produits et le Skin Diag.
 */

const now = new Date().toISOString();
type Ax = Omit<Article, "createdAt" | "updatedAt" | "author" | "readingMinutes" | "status">;
const art = (x: Ax): Article => ({ ...x, status: "a_valider", author: "Équipe SKINCLEAN", readingMinutes: Math.max(2, Math.round(x.content.split(/\s+/).length / 200)), createdAt: now, updatedAt: now });

export const briefArticles: Article[] = [
  art({
    id: "art-retinal-bakuchiol", slug: "retinal-ou-bakuchiol", keyword: "rétinal ou rétinol", secondary: ["bakuchiol", "premières ridules", "rétinal peau sensible"],
    title: "Rétinal ou bakuchiol : lequel choisir pour tes premières ridules ?",
    metaTitle: "Rétinal ou bakuchiol : lequel choisir ?", metaDescription: "Rétinal, rétinol ou bakuchiol : différences, tolérance, fréquence d'application et précautions. Le guide simple pour choisir ton actif anti-âge.",
    excerpt: "Deux actifs très populaires contre les premières ridules, deux philosophies. On t'aide à choisir celui qui convient à ta peau.",
    cover: "/media/packshots/night-renew-serum-retinal.png", productIds: ["sc-sr-06", "sc-sr-05", "sc-sp-01"],
    content: `Ridules au coin des yeux, grain de peau moins lisse, teint un peu fatigué : c'est souvent le moment où l'on se pose la question des actifs « anti-âge ». Deux noms reviennent sans cesse : le **rétinal** et le **bakuchiol**. Voici comment les départager.

## Rétinol, rétinal : quelle différence ?

Le rétinol et le rétinal font partie de la famille des rétinoïdes, des dérivés de la vitamine A. Dans la peau, ils sont convertis par étapes en acide rétinoïque, la forme active. Le **rétinal** se situe une étape plus près de cette forme que le rétinol : il agit donc plus directement, à concentration égale.

En cosmétique, les rétinoïdes sont appréciés pour lisser le grain de peau, atténuer l'apparence des ridules et unifier le teint. Leur revers : ils peuvent provoquer des tiraillements, des rougeurs ou une légère desquamation les premières semaines.

## Le bakuchiol, l'alternative végétale

Le **bakuchiol** est extrait des graines d'une plante, le babchi. Ce n'est pas un rétinoïde, mais il est souvent présenté comme une alternative douce : il contribue à une peau plus lisse et plus uniforme, avec en général moins d'inconfort. Il peut s'utiliser matin et soir.

## Comment choisir ?

- **Ta peau tolère bien les actifs** et tu cherches un effet visible sur le grain de peau : le rétinal, par exemple notre sérum [Night Renew](/produits/night-renew-serum-retinal), le soir uniquement.
- **Ta peau est sensible, réactive** ou c'est ton tout premier actif : commence par le bakuchiol avec [First Lines](/produits/first-lines-serum-bakuchiol).
- **Tu es enceinte ou tu allaites** : les rétinoïdes sont à éviter. Demande l'avis d'un professionnel de santé avant d'introduire un nouvel actif.

## Bien introduire un rétinoïde

1. Commence **2 soirs par semaine**, puis augmente progressivement sur 3 à 4 semaines.
2. Applique-le sur une peau **bien sèche**, en petite quantité (une noisette pour tout le visage).
3. Termine par une crème nourrissante, comme [Velvet Barrier](/produits/velvet-barrier-creme-riche), pour limiter les tiraillements.
4. Évite de le combiner le même soir avec des exfoliants acides.

## Le SPF, non négociable

Les rétinoïdes rendent la peau plus sensible au soleil. Une protection solaire chaque matin est indispensable, même en hiver : [Daily Shield SPF 50](/produits/daily-shield-spf50) se glisse facilement sous le maquillage.

## En résumé

Rétinal pour les peaux qui tolèrent bien les actifs et veulent un effet plus marqué, bakuchiol pour une approche douce et quotidienne. Dans les deux cas, la régularité compte plus que la concentration. Pas sûre de ton type de peau ? Fais le [Skin Diag](/skin-diag) : il te propose une routine adaptée en deux minutes.`,
  }),

  art({
    id: "art-double-nettoyage", slug: "double-nettoyage-guide", keyword: "double nettoyage", secondary: ["baume démaquillant", "nettoyant doux", "démaquiller son visage"],
    title: "Le double nettoyage : pourquoi et comment ?",
    metaTitle: "Double nettoyage : pourquoi et comment le faire", metaDescription: "Le double nettoyage en 2 étapes : baume ou huile puis nettoyant doux. Pour qui, quand le faire et les erreurs à éviter pour ne pas décaper ta peau.",
    excerpt: "Une étape huileuse, une étape aqueuse : la méthode coréenne pour une peau vraiment propre, sans la dessécher.",
    cover: "/media/packshots/melt-away-baume-demaquillant.png", productIds: ["sc-dm-01", "sc-cl-01", "sc-cl-02"],
    content: `Le double nettoyage vient de la routine coréenne et s'est imposé partout. Le principe est simple : nettoyer en **deux étapes** pour retirer tout ce que la peau accumule dans la journée, sans la décaper.

## Pourquoi deux étapes ?

Maquillage, crème solaire et sébum sont des corps **gras**. Ils se dissolvent mieux dans un corps gras que dans l'eau. La première étape, huileuse, les fait fondre. La seconde, aqueuse, élimine les résidus, la transpiration et les impuretés.

## Étape 1 : le baume ou l'huile démaquillante

Applique le produit sur **peau sèche**, avec des mains sèches. Masse 30 secondes à une minute, en insistant sur les zones maquillées. Ajoute ensuite un peu d'eau : la texture s'émulsionne et devient laiteuse. Rince abondamment.

Notre baume [Melt Away](/produits/melt-away-baume-demaquillant) fond au contact de la peau et retire même le mascara, sans frotter.

## Étape 2 : le nettoyant doux

Sur peau humide, fais mousser une petite quantité de nettoyant, masse puis rince à l'eau tiède. Choisis-le selon ta peau :

- Peau normale, sèche ou sensible : [Cloud Gel](/produits/cloud-gel-nettoyant-doux), sans parfum ajouté.
- Peau mixte à grasse : [Clear Foam](/produits/clear-foam-nettoyant-purifiant), qui purifie sans assécher.

## Faut-il le faire matin et soir ?

Non. Le double nettoyage est utile **le soir**, surtout si tu portes du maquillage ou de la crème solaire. Le matin, un seul nettoyage doux, voire un simple rinçage pour les peaux très sèches, suffit largement.

## Les erreurs à éviter

- Frotter fort ou utiliser de l'eau très chaude.
- Choisir deux produits décapants : la peau doit rester confortable après le rinçage.
- Oublier d'émulsionner le baume, ce qui laisse un film gras.

## Et ensuite ?

Une fois la peau propre, enchaîne avec ton sérum puis ta crème. Si tu veux une routine complète déjà composée, regarde nos [kits routine](/kits). Et pour savoir quel nettoyant correspond à ta peau, le [Skin Diag](/skin-diag) te répond en deux minutes.`,
  }),

  art({
    id: "art-spf-hiver", slug: "spf-en-hiver", keyword: "spf 50 visage quotidien", secondary: ["crème solaire hiver", "protection solaire quotidienne", "uva uvb"],
    title: "SPF en hiver : vraiment indispensable ?",
    metaTitle: "SPF en hiver : vraiment indispensable ?", metaDescription: "Les UVA traversent les nuages et les vitres, même en hiver. Pourquoi garder un SPF au quotidien, quelle texture choisir et comment l'appliquer.",
    excerpt: "Moins de soleil ne veut pas dire moins d'UV. Voici pourquoi la protection solaire reste le dernier geste de ta routine du matin, toute l'année.",
    cover: "/media/packshots/daily-shield-spf50.png", productIds: ["sc-sp-01", "sc-sp-02", "sc-cr-02"],
    content: `En hiver, on range souvent la crème solaire avec les maillots de bain. Pourtant, une partie des rayons UV reste bien présente, même quand le ciel est gris.

## UVA et UVB : ce qui change en hiver

Les **UVB**, responsables des coups de soleil, sont moins intenses en hiver. Les **UVA**, eux, restent présents toute l'année. Ils traversent les nuages et une partie des vitres, et contribuent au vieillissement cutané visible : taches, perte d'éclat, ridules.

À la montagne, la neige réfléchit une grande partie des UV : la protection devient alors indispensable.

## Le SPF au quotidien, surtout si…

- tu utilises des actifs comme le rétinal, la vitamine C ou les acides exfoliants ;
- tu as des taches pigmentaires que tu veux éviter de foncer ;
- tu passes du temps dehors, près d'une fenêtre ou en voiture.

## Quelle texture choisir en hiver ?

L'hiver, la peau est souvent plus sèche. Choisis une texture confortable :

- [Daily Shield SPF 50](/produits/daily-shield-spf50) : fluide, invisible, il se porte seul ou sous le maquillage.
- [Mineral Calm SPF 50](/produits/mineral-calm-spf50) : filtres minéraux, pensé pour les peaux sensibles et réactives.

Si ta peau tiraille, applique d'abord une crème nourrissante comme [Velvet Barrier](/produits/velvet-barrier-creme-riche), laisse pénétrer une minute, puis ton SPF.

## Comment bien l'appliquer

1. Dernière étape de la routine du matin, avant le maquillage.
2. Environ **deux longueurs de doigt** pour le visage et le cou.
3. N'oublie pas les oreilles, le cou et le dessus des mains.
4. Réapplique si tu restes longtemps dehors.

## En résumé

En hiver, le SPF n'est pas un luxe : c'est le geste le plus simple pour préserver l'éclat et l'uniformité de ta peau. Pour construire une routine du matin complète, découvre nos [best-sellers](/best-sellers) ou fais le [Skin Diag](/skin-diag).`,
  }),

  art({
    id: "art-type-de-peau", slug: "quel-est-mon-type-de-peau", keyword: "quel est mon type de peau", secondary: ["test type de peau", "peau mixte", "diagnostic de peau en ligne"],
    title: "Quel est mon type de peau ? Le test en 5 questions",
    metaTitle: "Quel est mon type de peau ? Le test simple", metaDescription: "Sèche, grasse, mixte, normale ou sensible : 5 questions pour identifier ton type de peau, et la routine de base qui lui convient vraiment.",
    excerpt: "Avant de choisir un sérum, il faut connaître sa peau. Cinq questions simples pour t'y retrouver.",
    cover: "/media/packshots/cloud-cream-creme-hydratante.png", productIds: ["sc-cl-01", "sc-cr-01", "sc-cr-03", "sc-cr-04"],
    content: `Choisir ses soins sans connaître son type de peau, c'est un peu comme acheter des chaussures sans connaître sa pointure. Voici un test simple, à faire chez toi.

## Le test du matin

Le soir, nettoie ton visage avec un nettoyant doux et n'applique **aucun soin**. Le lendemain matin, observe ta peau avant de la toucher, puis réponds à ces cinq questions.

## Les 5 questions

1. **Ta peau tiraille-t-elle au réveil ?** Oui, sur tout le visage : tendance sèche.
2. **Ton front, ton nez et ton menton brillent-ils ?** Oui, seulement la zone T : tendance mixte. Oui, tout le visage : tendance grasse.
3. **Tes pores sont-ils visibles ?** Surtout sur le nez et les joues : tendance grasse ou mixte.
4. **Ta peau rougit-elle facilement** (nouveau produit, froid, frottement) ? Oui : peau sensible, quel que soit ton type.
5. **Ta peau est-elle confortable, ni brillante ni tiraillée ?** Oui : peau normale.

## Les grands types de peau

- **Sèche** : manque de lipides, tiraillements, aspect parfois rugueux.
- **Grasse** : excès de sébum, brillances, pores visibles, imperfections possibles.
- **Mixte** : zone T grasse, joues normales à sèches.
- **Normale** : équilibrée et confortable.
- **Sensible** : ce n'est pas un type mais un état, qui peut toucher toutes les peaux.

À ne pas confondre : une peau **déshydratée** manque d'eau, pas de gras. Même une peau grasse peut être déshydratée.

## La routine de base selon ton type

- Peau sèche : nettoyant doux [Cloud Gel](/produits/cloud-gel-nettoyant-doux) et crème riche [Velvet Barrier](/produits/velvet-barrier-creme-riche).
- Peau mixte à grasse : [Matte Balance](/produits/matte-balance-gel-creme), une texture gel légère qui hydrate sans briller.
- Peau sensible : [Comfort Zone](/produits/comfort-zone-creme-apaisante), formulée pour apaiser.
- Peau normale : [Cloud Cream](/produits/cloud-cream-creme-hydratante), l'hydratation simple du quotidien.

## Aller plus loin

Ce test donne une bonne première idée, mais ta peau évolue avec les saisons, le stress ou les hormones. Le [Skin Diag](/skin-diag) affine le résultat en tenant compte de tes préoccupations (imperfections, éclat, sensibilité) et compose une routine complète. Tu peux aussi parcourir tous nos [soins visage](/soins-visage).`,
  }),

  art({
    id: "art-exfolier", slug: "exfolier-sans-agresser", keyword: "bha peau grasse", secondary: ["aha bha pha", "exfoliant enzymatique", "exfolier son visage"],
    title: "Exfolier sans agresser : AHA, BHA, PHA, enzymes",
    metaTitle: "Exfolier sans agresser : AHA, BHA, PHA", metaDescription: "AHA, BHA, PHA ou enzymes : quel exfoliant choisir selon ta peau, à quelle fréquence l'utiliser et comment éviter les irritations. Le guide clair.",
    excerpt: "L'exfoliation donne de l'éclat et affine le grain de peau, à condition de choisir le bon actif et la bonne fréquence.",
    cover: "/media/packshots/bha-clear-liquid-exfoliant.png", productIds: ["sc-ex-02", "sc-ex-01", "sc-tn-02"],
    content: `Exfolier, c'est aider la peau à éliminer les cellules mortes qui s'accumulent à sa surface. Résultat : un teint plus lumineux, un grain plus lisse, des pores moins marqués. Mais trop exfolier abîme la barrière cutanée. Voici comment bien faire.

## Exfoliation mécanique ou chimique ?

Les gommages à grains frottent la peau : ils peuvent être irritants, surtout sur les peaux sensibles. Les exfoliants **chimiques** (acides) et **enzymatiques** dissolvent les liens entre les cellules mortes, sans frotter. Ce sont eux que l'on privilégie pour le visage.

## Les différents exfoliants

- **AHA** (acide glycolique, lactique) : solubles dans l'eau, ils agissent en surface. Idéals pour l'éclat et le grain de peau des peaux normales à sèches.
- **BHA** (acide salicylique) : soluble dans les corps gras, il pénètre dans les pores. Le meilleur allié des peaux grasses à imperfections. C'est l'actif de [BHA Clear Liquid](/produits/bha-clear-liquid-exfoliant).
- **PHA** : grosses molécules qui pénètrent lentement, donc plus douces. Parfaits pour débuter.
- **Enzymes** (papaïne, bromélaïne) : exfoliation très douce, adaptée aux peaux sensibles, comme [Polish Me](/produits/polish-me-exfoliant-enzymatique).

## À quelle fréquence ?

Commence par **1 à 2 fois par semaine**, le soir. Si ta peau reste confortable après deux à trois semaines, tu peux passer à 3 fois. Un toner exfoliant doux comme [Smooth Reset](/produits/smooth-reset-toner-exfoliant) peut s'utiliser plus souvent, en observant les réactions de ta peau.

## Les signes d'une sur-exfoliation

Rougeurs, picotements à l'application de la crème, peau brillante mais qui tiraille, apparition de petites irritations : fais une pause d'une semaine, avec une routine minimaliste (nettoyant doux, crème réparatrice, SPF).

## Les règles d'or

1. Un seul exfoliant par soir.
2. Pas d'exfoliant le même soir qu'un rétinoïde.
3. Toujours un SPF le lendemain matin.
4. Jamais sur une peau irritée ou après un rasage.

## En résumé

Peau grasse : BHA. Peau terne ou sèche : AHA doux. Peau sensible : PHA ou enzymes. Pour savoir lequel convient à ta peau, fais le [Skin Diag](/skin-diag), ou découvre la routine complète du [kit Acne Control](/kits/acne-control).`,
  }),

  art({
    id: "art-contour-yeux", slug: "contour-des-yeux-guide", keyword: "contour des yeux caféine", secondary: ["crème contour des yeux", "cernes et poches", "à quel âge contour des yeux"],
    title: "Contour des yeux : à quel âge commencer ?",
    metaTitle: "Contour des yeux : à quel âge commencer ?", metaDescription: "Cernes, poches, ridules : à quel âge utiliser un contour des yeux, quel actif choisir (caféine, peptides) et comment l'appliquer sans tirer la peau.",
    excerpt: "La peau du contour de l'œil est fine et fragile. On fait le point sur le bon âge, les bons actifs et les bons gestes.",
    cover: "/media/packshots/bright-eyes-contour-yeux-cafeine.png", productIds: ["sc-ey-01", "sc-ey-02"],
    content: `Le contour des yeux est la zone du visage où la peau est la plus fine. Elle contient peu de glandes sébacées et bouge sans cesse (clignements, sourires). C'est souvent là que les premiers signes de fatigue apparaissent.

## À quel âge commencer ?

Il n'y a pas d'âge officiel. On peut commencer dès que l'on ressent un besoin :

- **Dès 20 ans**, si tu as des poches ou des cernes le matin : un soin léger et décongestionnant.
- **Vers 25 à 30 ans**, quand les premières ridules apparaissent : un soin plus nourrissant.

Si ta crème visage est douce et bien tolérée, elle peut aussi s'utiliser autour des yeux. Le soin dédié apporte une texture et des actifs pensés pour cette zone.

## Quel actif pour quel besoin ?

- **Poches et cernes du matin** : la **caféine** aide à défroisser et réveiller le regard. C'est l'actif de [Bright Eyes](/produits/bright-eyes-contour-yeux-cafeine), avec un embout froid agréable le matin.
- **Ridules et manque de confort** : les **peptides** et les agents nourrissants contribuent à lisser l'apparence de la peau. C'est le rôle de [Smooth Gaze](/produits/smooth-gaze-creme-yeux-peptides), à utiliser plutôt le soir.

## Comment l'appliquer

1. Prélève l'équivalent d'un **grain de riz** pour les deux yeux.
2. Dépose de petits points sur l'os orbitaire, sous l'œil et sous le sourcil.
3. Fais pénétrer en **tapotant** avec l'annulaire, le doigt qui appuie le moins.
4. Ne t'approche pas trop des cils et ne tire jamais la peau.

## Les bons réflexes

- Garde ton contour des yeux au réfrigérateur pour un effet frais le matin.
- Démaquille-toi sans frotter, avec un baume comme [Melt Away](/produits/melt-away-baume-demaquillant).
- Dors suffisamment et bois de l'eau : aucun soin ne remplace le sommeil.

## En résumé

Commence quand tu en ressens le besoin : caféine le matin pour le coup de fatigue, peptides le soir pour le confort et les ridules. Pour une routine complète adaptée à ta peau, fais le [Skin Diag](/skin-diag) ou découvre nos [best-sellers](/best-sellers).`,
  }),

  art({
    id: "art-glass-skin", slug: "glass-skin-methode", keyword: "glass skin routine", secondary: ["routine coréenne", "peau lumineuse", "layering skincare"],
    title: "Glass skin : la méthode coréenne en version simple",
    metaTitle: "Glass skin : la routine coréenne simplifiée", metaDescription: "La glass skin, c'est une peau lisse, hydratée et lumineuse. La méthode coréenne en 5 étapes simples, sans dix produits ni promesses impossibles.",
    excerpt: "Une peau lisse et lumineuse comme du verre : la tendance coréenne repose surtout sur l'hydratation. Voici la version simple.",
    cover: "/media/packshots/aqua-plump-serum-acide-hyaluronique.png", productIds: ["sc-tn-01", "sc-sr-03", "sc-cr-01", "sc-sp-01"],
    content: `La « glass skin » désigne une peau si lisse, hydratée et lumineuse qu'elle semble refléter la lumière comme du verre. Bonne nouvelle : pas besoin d'une routine en dix étapes. Le secret, c'est **l'hydratation en couches**.

## Le principe : superposer l'hydratation

Plutôt qu'une seule crème épaisse, la méthode coréenne superpose plusieurs textures légères, de la plus fluide à la plus riche. Chaque couche apporte de l'eau et aide la suivante à mieux pénétrer.

## La routine en 5 étapes

1. **Nettoyer en douceur** : le soir, un double nettoyage si tu es maquillée ; le matin, un nettoyant doux comme [Cloud Gel](/produits/cloud-gel-nettoyant-doux).
2. **Le toner hydratant** : tapote [Dew Drop](/produits/dew-drop-toner-hydratant) avec les mains. Tu peux en appliquer deux ou trois fines couches : c'est la fameuse méthode des « 7 skins », en version raisonnable.
3. **Le sérum à l'acide hyaluronique** : sur peau encore humide, [Aqua Plump](/produits/aqua-plump-serum-acide-hyaluronique) aide à repulper visiblement.
4. **La crème** : [Cloud Cream](/produits/cloud-cream-creme-hydratante) scelle l'hydratation sans alourdir.
5. **Le SPF le matin** : [Daily Shield SPF 50](/produits/daily-shield-spf50), indispensable pour préserver l'éclat.

## Les gestes qui font la différence

- Applique tes soins sur une peau **légèrement humide**.
- Exfolie en douceur une à deux fois par semaine pour lisser le grain de peau.
- Ajoute un masque hydratant comme [Hydra Bloom](/produits/hydra-bloom-masque-hydratant) une fois par semaine.

## Soyons honnêtes

L'effet glass skin des photos est souvent accentué par la lumière et les filtres. L'objectif réaliste : une peau confortable, rebondie et lumineuse. Avec une routine régulière, les premiers résultats se voient en général après quelques semaines.

## La routine déjà composée

Le [kit Glass Skin Routine](/kits/glass-skin-routine) réunit les étapes essentielles. Et si tu veux l'adapter à ton type de peau, fais le [Skin Diag](/skin-diag).`,
  }),

  art({
    id: "art-cadeaux", slug: "idees-cadeaux-skincare", keyword: "coffret soin visage", secondary: ["idée cadeau skincare", "coffret skincare", "cadeau beauté noël"],
    title: "Idées cadeaux skincare par type de peau",
    metaTitle: "Idées cadeaux skincare par type de peau", metaDescription: "Peau sèche, grasse, sensible ou terne : nos idées de cadeaux skincare et de coffrets soin visage pour faire plaisir sans se tromper, à tous les prix.",
    excerpt: "Offrir un soin, c'est offrir un moment pour soi. Nos idées pour viser juste, selon la peau de la personne.",
    cover: "/media/packshots/sheet-mask-trio.png", productIds: ["sc-dm-01", "sc-sr-02", "sc-cr-02", "sc-ms-01"],
    content: `Offrir de la skincare peut sembler risqué : et si le produit ne convenait pas ? Avec quelques repères simples, tu peux faire un cadeau utile, qui sera vraiment utilisé.

## La règle d'or : connaître (un peu) sa peau

Inutile d'être experte. Pose-toi une question : la personne se plaint-elle plutôt de **tiraillements**, de **brillances**, de **rougeurs** ou d'un **teint fatigué** ? La réponse oriente déjà le choix.

## Pour une peau sèche

Un soin réconfortant fait toujours plaisir en hiver : la crème riche [Velvet Barrier](/produits/velvet-barrier-creme-riche), associée au masque [Hydra Bloom](/produits/hydra-bloom-masque-hydratant) pour un moment cocooning.

## Pour une peau grasse ou à imperfections

Le duo sérum [Clear Skin](/produits/clear-skin-serum-niacinamide) et patchs [Spot Hero](/produits/spot-hero-patchs-anti-imperfections) : pratique, efficace, et souvent adopté par les ados comme par les adultes. Le [kit Acne Control](/kits/acne-control) réunit une routine complète.

## Pour une peau sensible

Mise sur des formules douces et apaisantes : le sérum [Calm Down](/produits/calm-down-serum-centella) et la crème [Comfort Zone](/produits/comfort-zone-creme-apaisante). Évite les soins très parfumés ou les exfoliants si tu n'es pas sûre.

## Pour un teint terne

Le sérum à la vitamine C [Glow Shot](/produits/glow-shot-serum-vitamine-c) est un classique pour l'éclat. Accompagné des [Glow Pads](/produits/glow-pads-toner-pads-eclat), c'est un vrai coup d'éclat à offrir.

## Le cadeau universel

Si tu ne connais pas du tout sa peau, choisis un produit que tout le monde utilise :

- un baume démaquillant comme [Melt Away](/produits/melt-away-baume-demaquillant) ;
- une brume hydratante comme [Fresh Mist](/produits/fresh-mist-brume-hydratante) ;
- un coffret de masques en tissu.

## Le coffret tout prêt

Nos [kits et coffrets](/kits) sont composés par type de peau et par saison, avec une routine complète déjà pensée. Et pour un cadeau vraiment personnalisé, propose à la personne de faire le [Skin Diag](/skin-diag) : elle découvrira la routine faite pour elle.`,
  }),

  art({
    id: "art-patchs", slug: "patchs-anti-boutons", keyword: "patch bouton", secondary: ["patch hydrocolloïde", "patch anti imperfection", "bouton qui perce"],
    title: "Patchs anti-boutons : comment ça marche ?",
    metaTitle: "Patchs anti-boutons : comment ça marche ?", metaDescription: "Patch hydrocolloïde, patch de nuit : comment fonctionnent les patchs anti-boutons, quand les poser et pourquoi ils évitent de toucher tes imperfections.",
    excerpt: "Petits, discrets et étonnamment efficaces : on t'explique ce que font vraiment les patchs anti-imperfections.",
    cover: "/media/packshots/spot-hero-patchs-anti-imperfections.png", productIds: ["sc-pt-01", "sc-pt-02", "sc-sr-01"],
    content: `Ils ont envahi les salles de bain : les patchs anti-boutons sont devenus le réflexe SOS des peaux à imperfections. Mais comment fonctionnent-ils, et quand les utiliser ?

## Le principe de l'hydrocolloïde

La plupart des patchs sont faits d'**hydrocolloïde**, un matériau utilisé depuis longtemps pour les pansements. Il absorbe les fluides tout en maintenant un milieu humide. Posé sur un bouton mûr, il aide à absorber son contenu et à protéger la zone.

## Le vrai super-pouvoir : ne plus toucher

Le patch forme une **barrière physique**. Impossible de gratter, de percer ou de toucher le bouton avec les doigts. C'est souvent ce qui fait la plus grande différence : on évite d'aggraver l'inflammation et de laisser une marque.

## Jour ou nuit ?

- **Le jour** : un patch fin et transparent, discret même sous le maquillage, comme [Spot Hero Day](/produits/spot-hero-patchs-anti-imperfections).
- **La nuit** : un patch plus épais, qui reste en place pendant le sommeil, comme [Spot Hero Night](/produits/spot-hero-night-patchs-nuit).

## Comment bien les poser

1. Nettoie et **sèche parfaitement** la zone : le patch n'adhère pas sur une peau grasse ou humide.
2. Pose le patch avant tes autres soins.
3. Laisse agir plusieurs heures, idéalement toute la nuit.
4. Retire-le quand il devient blanc et opaque, puis applique un patch neuf si besoin.

## Ce que les patchs ne font pas

Ils sont efficaces sur les boutons **ponctuels et superficiels**. Ils n'agissent pas sur les points noirs ni sur les imperfections profondes et douloureuses. Si tes imperfections sont nombreuses, persistantes ou douloureuses, demande conseil à un professionnel de santé.

## Pour aller plus loin

Le patch est un geste SOS. Pour limiter l'apparition des imperfections, mise sur une routine régulière : un sérum comme [Clear Skin](/produits/clear-skin-serum-niacinamide) à la niacinamide, et un exfoliant doux au BHA. Lis aussi notre guide de la [routine anti-imperfections](/conseils/routine-peau-a-imperfections) ou fais le [Skin Diag](/skin-diag).`,
  }),

  art({
    id: "art-routine-soir", slug: "routine-du-soir-3-minutes", keyword: "routine du soir", secondary: ["routine skincare soir", "routine simple", "soin de nuit"],
    title: "Routine du soir en 3 minutes",
    metaTitle: "Routine du soir en 3 minutes : la méthode", metaDescription: "Démaquiller, traiter, nourrir : la routine du soir efficace en 3 minutes chrono, pour les soirs où tu n'as pas le courage, sans sacrifier ta peau.",
    excerpt: "Pas besoin d'y passer vingt minutes : trois gestes bien choisis suffisent pour prendre soin de ta peau le soir.",
    cover: "/media/packshots/velvet-barrier-creme-riche.png", productIds: ["sc-dm-01", "sc-sr-06", "sc-cr-02", "sc-cl-01"],
    content: `Le soir, on est fatigué et la routine passe souvent à la trappe. Pourtant, c'est le moment où la peau se régénère. Voici une routine efficace en **3 minutes chrono**.

## Minute 1 : démaquiller et nettoyer

Si tu es maquillée ou que tu as porté un SPF, masse ton visage avec le baume [Melt Away](/produits/melt-away-baume-demaquillant), émulsionne avec un peu d'eau puis rince. Sans maquillage, un nettoyant doux comme [Cloud Gel](/produits/cloud-gel-nettoyant-doux) suffit.

Sèche en tamponnant avec une serviette propre, sans frotter.

## Minute 2 : le soin ciblé

C'est le moment du sérum, choisi selon ta préoccupation principale :

- grain de peau et premières ridules : [Night Renew](/produits/night-renew-serum-retinal) au rétinal, 2 à 3 soirs par semaine pour commencer ;
- imperfections : [Clear Skin](/produits/clear-skin-serum-niacinamide) à la niacinamide ;
- peau sensible : [Calm Down](/produits/calm-down-serum-centella) à la centella.

Trois à quatre gouttes suffisent pour tout le visage.

## Minute 3 : nourrir

Termine par une crème pour sceller l'hydratation pendant la nuit. Pour les peaux sèches ou sous rétinoïde, une texture riche comme [Velvet Barrier](/produits/velvet-barrier-creme-riche). Pour les peaux mixtes, une texture gel.

## Le bonus de 30 secondes

Une fois par semaine, remplace le sérum par un masque ou un exfoliant doux. Et si tu as un bouton, pose un patch de nuit avant d'aller dormir.

## Les erreurs qui ruinent la routine du soir

- Dormir maquillée, même « juste un peu ».
- Empiler plusieurs actifs forts le même soir.
- Oublier le cou.

## En résumé

Nettoyer, traiter, nourrir : trois gestes, trois minutes, et une peau qui te remercie le matin. Pour savoir quel sérum choisir, fais le [Skin Diag](/skin-diag), ou découvre nos [kits routine](/kits) déjà composés.`,
  }),
];
