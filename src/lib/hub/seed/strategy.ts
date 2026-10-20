import type { Objective, Persona, StrategySection } from "../types";

/**
 * STRATÉGIE MARKETING SKINCLEAN — contenu initial.
 * Convention : « fait » = vérifiable (données du site SKINCLEAN, textes réglementaires, informations publiques des marques),
 * « hypothèse » = à valider par une étude ou des mesures, « proposition » = recommandation stratégique de l'équipe marketing.
 * Aucun chiffre de marché n'est inventé : les tailles de marché sont à compléter à partir des sources citées.
 */

type S = Omit<StrategySection, "id">;
const s = (id: string, x: S): StrategySection => ({ id, ...x });

export const strategySections: StrategySection[] = [
  s("marche", {
    group: "Analyse stratégique", order: 1, title: "Analyse du marché skincare",
    summary: "Un marché du soin visage très concurrentiel, porté par le digital, où la transparence des formules et la pédagogie font la différence.",
    blocks: [
      { kind: "fait", title: "Cadre réglementaire", text: "En Europe, les cosmétiques relèvent du règlement (CE) n° 1223/2009 : sécurité évaluée avant mise sur le marché, liste INCI obligatoire, et allégations encadrées par le règlement (UE) n° 655/2013 (une allégation doit être justifiée par des preuves adéquates). Toute promesse SKINCLEAN (« pores resserrés », « éclat ») doit donc s'appuyer sur un dossier de preuves.", source: "EUR-Lex — Règlements 1223/2009 et 655/2013" },
      { kind: "fait", title: "Communication d'influence", text: "En France, la loi n° 2023-451 du 9 juin 2023 encadre l'influence commerciale : mention explicite « publicité » ou « collaboration commerciale », mentions obligatoires pour les images retouchées ou virtuelles, et contrat écrit au-delà d'un certain seuil de rémunération.", source: "Légifrance — Loi n° 2023-451" },
      { kind: "fait", title: "Prospection par e-mail", text: "L'envoi de newsletters commerciales à des particuliers nécessite leur consentement préalable (article L34-5 du Code des postes et des communications électroniques), avec un lien de désinscription dans chaque envoi.", source: "CNIL — prospection commerciale par courrier électronique" },
      { kind: "hypothese", title: "Dynamique du marché", text: "Le soin visage reste le premier segment de la cosmétique en valeur et l'e-commerce y progresse plus vite que la distribution physique. Taille et croissance du marché français à documenter avant toute présentation chiffrée.", source: "À compléter : FEBEA (chiffres annuels), Circana, Euromonitor, Mintel" },
      { kind: "hypothese", title: "Pression concurrentielle", text: "Les marques digital-native (DNVB) ont rendu la prise de parole sur les ingrédients standard ; la différenciation se joue désormais sur l'expérience (diagnostic, accompagnement, communauté) plus que sur la formule seule." },
      { kind: "proposition", title: "Conséquence pour SKINCLEAN", text: "Faire du Skin Diag et du Skin Journal le cœur de la communication : la marque ne vend pas seulement des soins, elle accompagne une routine dans le temps. C'est un territoire différenciant face aux marques « ingrédients » pures." },
    ],
  }),
  s("tendances", {
    group: "Analyse stratégique", order: 2, title: "Tendances skincare & Génération Z",
    summary: "Routines courtes, culture des ingrédients, découverte par la vidéo courte et exigence d'authenticité.",
    blocks: [
      { kind: "hypothese", title: "Skin minimalism", text: "Retour à des routines de 3 à 5 étapes, plus faciles à tenir. Cohérent avec la promesse SKINCLEAN de routines personnalisées et simples." },
      { kind: "hypothese", title: "Culture des actifs", text: "Les 16-30 ans recherchent les produits par actif (niacinamide, acide hyaluronique, vitamine C, rétinal) et comparent les concentrations. Les contenus « focus ingrédient » et les associations à éviter sont très recherchés." },
      { kind: "hypothese", title: "Barrière cutanée & peaux sensibles", text: "Forte demande de contenus sur la barrière cutanée, la sur-exfoliation et les peaux réactives : opportunité pour Calm Down, Comfort Zone, Velvet Barrier." },
      { kind: "hypothese", title: "Découverte par la vidéo courte", text: "TikTok et les Reels sont devenus des moteurs de découverte de marques beauté pour la Gen Z ; les formats « get ready with me », « POV », avant/après honnêtes et tests de texture performent. À vérifier sur nos propres statistiques dès les 8 premières semaines." },
      { kind: "hypothese", title: "Exigence d'authenticité", text: "Défiance envers les promesses miracles et les filtres : les contenus non retouchés, les vraies peaux et les explications sourcées renforcent la crédibilité." },
      { kind: "proposition", title: "Traduction éditoriale", text: "Ton pédagogue et complice (tutoiement), contenus sans retouche de peau, mention systématique « résultats variables selon les peaux », aucun avant/après non réel (règle déjà appliquée sur le site)." },
    ],
  }),
  s("benchmark", {
    group: "Analyse stratégique", order: 3, title: "Benchmark concurrentiel",
    summary: "Typology, Yepoda, The Ordinary, La Roche-Posay et CeraVe : forces à retenir, angles à éviter.",
    blocks: [
      { kind: "fait", title: "Typology", text: "Marque française digital-native fondée en 2019, positionnée sur des formules courtes et une esthétique minimaliste ; propose un diagnostic de peau en ligne et des routines.", source: "typology.com" },
      { kind: "fait", title: "The Ordinary", text: "Marque du groupe DECIEM, dont l'actionnaire majoritaire est The Estée Lauder Companies ; produits nommés par actif et concentration (ex. « Niacinamide 10 % + Zinc 1 % »), prix d'entrée bas.", source: "theordinary.com, communiqués Estée Lauder" },
      { kind: "fait", title: "Yepoda", text: "Marque berlinoise de K-beauty, formulée et fabriquée en Corée du Sud, à l'univers coloré et ludique ; programme de fidélité « Yepoda Fam ».", source: "yepoda.fr" },
      { kind: "fait", title: "La Roche-Posay & CeraVe", text: "Marques dermatologiques du groupe L'Oréal, distribuées notamment en pharmacie ; forte caution « recommandé par les dermatologues ».", source: "Sites des marques" },
      { kind: "hypothese", title: "Lecture concurrentielle", text: "Typology occupe le minimalisme premium, The Ordinary l'expertise actif à bas prix, Yepoda le fun Gen Z, les marques dermo la caution médicale. L'espace « accompagnement personnalisé + ton complice + prix accessibles » semble moins occupé." },
      { kind: "proposition", title: "Ce que SKINCLEAN reprend / évite", text: "Reprendre : la pédagogie par actif (The Ordinary), la sobriété visuelle (Typology), l'énergie communautaire (Yepoda). Éviter : la surenchère de concentrations, les codes médicaux non justifiés, la dépendance aux promotions permanentes." },
    ],
    table: {
      head: ["Marque", "Positionnement", "Force", "Canal phare", "Opportunité SKINCLEAN"],
      rows: [
        ["Typology", "Minimalisme premium", "Esthétique, diagnostic", "Instagram, site", "Ton plus chaleureux, suivi dans le temps (Skin Journal)"],
        ["The Ordinary", "Expert actifs, prix bas", "Crédibilité ingrédients", "Bouche-à-oreille, TikTok", "Routines guidées plutôt que produits isolés"],
        ["Yepoda", "K-beauty fun Gen Z", "Univers, communauté", "TikTok, Instagram", "Pédagogie et sobriété en plus de l'énergie"],
        ["La Roche-Posay", "Dermatologique", "Caution médicale", "Pharmacie, Instagram", "Accessibilité, ton complice"],
        ["CeraVe", "Barrière cutanée", "Viralité TikTok", "TikTok", "Diagnostic personnalisé et fidélité"],
      ],
    },
  }),
  s("swot", {
    group: "Analyse stratégique", order: 4, title: "SWOT SKINCLEAN",
    summary: "Une expérience digitale forte à faire connaître ; une notoriété à construire de zéro.",
    blocks: [
      { kind: "fait", title: "Forces", text: "Gamme complète de plus de 30 soins couvrant les principaux besoins · Skin Diag gratuit avec routine envoyée par e-mail · Skin Journal de suivi photo sur 30 jours · Programme de fidélité SKINCLEAN Club · Offre de bienvenue -20 % · Kits saisonniers · Règles d'honnêteté (pas de faux avis, pas d'avant/après fictif)." },
      { kind: "hypothese", title: "Faiblesses", text: "Notoriété nulle au lancement · Pas encore d'avis clients vérifiés · Certifications et engagements (cruelty-free, % naturel) à valider avant communication · Budget média limité · Visuels produits encore partiellement provisoires." },
      { kind: "hypothese", title: "Opportunités", text: "Appétence Gen Z pour les contenus éducatifs · Formats courts à fort reach organique · Recherche Google sur les actifs et les problématiques de peau (SEO) · Saisonnalité (hiver = barrière, été = SPF) · Partenariats micro-influence." },
      { kind: "hypothese", title: "Menaces", text: "Concurrence intense et budgets publicitaires élevés · Dépendance aux algorithmes · Risque réglementaire sur les allégations · Lassitude face aux promotions." },
    ],
  }),
  s("positionnement", {
    group: "Positionnement", order: 5, title: "Positionnement de marque",
    summary: "La skincare qui t'accompagne : des formules efficaces et des routines simples, adaptées à ta peau.",
    blocks: [
      { kind: "proposition", title: "Territoire", text: "« Your skin. Your glow. » — SKINCLEAN est la marque qui aide chaque peau à trouver sa routine, la suit dans le temps et célèbre les progrès réels plutôt que la perfection." },
      { kind: "proposition", title: "Promesse", text: "Des soins efficaces aux formules lisibles, une routine personnalisée en 2 minutes avec le Skin Diag, et un accompagnement sur 30 jours avec le Skin Journal." },
      { kind: "proposition", title: "Personnalité", text: "Complice, pédagogue, lucide, lumineuse. On tutoie, on explique, on ne promet jamais l'impossible." },
      { kind: "proposition", title: "Preuves à mettre en avant", text: "Skin Diag (fonctionnel sur le site), Skin Journal, transparence INCI, programme Club. Les preuves d'efficacité (tests d'usage) seront ajoutées uniquement une fois disponibles." },
    ],
  }),
  s("valeur", {
    group: "Positionnement", order: 6, title: "Proposition de valeur",
    summary: "Gain de temps, confiance et résultats suivis.",
    blocks: [
      { kind: "proposition", title: "Pour qui", text: "Les 18-35 ans qui veulent une peau plus nette, plus lumineuse ou plus apaisée, sans passer des heures à décrypter les actifs." },
      { kind: "proposition", title: "Bénéfices fonctionnels", text: "Routine adaptée à son type de peau et ses préoccupations · Associations d'actifs sécurisées par le moteur du diag · Mini-formats pour tester." },
      { kind: "proposition", title: "Bénéfices émotionnels", text: "Se sentir guidée, voir ses progrès, appartenir à une communauté bienveillante." },
      { kind: "proposition", title: "Pourquoi nous croire", text: "Formules et INCI publiés, Skin Diag gratuit et sans engagement, aucun faux avis, conseils cosmétiques prudents (orientation vers un professionnel pour les cas sévères)." },
    ],
  }),
  s("parcours", {
    group: "Positionnement", order: 7, title: "Parcours de découverte de la marque",
    summary: "Découvrir → comprendre → tester le Skin Diag → s'inscrire → s'engager.",
    blocks: [
      { kind: "proposition", title: "1. Découverte", text: "TikTok, Reels et Pinterest (contenus éducatifs, textures, routines). Publicités Meta/TikTok sur le Skin Diag." },
      { kind: "proposition", title: "2. Considération", text: "Profil Instagram, articles de blog SEO, carrousels ingrédients. Le bénéfice clé : comprendre sa peau." },
      { kind: "proposition", title: "3. Activation", text: "Skin Diag gratuit → routine reçue par e-mail → inscription newsletter (-20 % sur la 1ʳᵉ commande)." },
      { kind: "proposition", title: "4. Engagement", text: "Skin Journal 30 jours, contenus de suivi, SKINCLEAN Club, invitations à partager sa routine." },
      { kind: "proposition", title: "5. Recommandation", text: "UGC, parrainage (à étudier dans le CRM), avis vérifiés une fois la boutique en ligne active." },
    ],
  }),
  s("objectifs-com", {
    group: "Communication", order: 8, title: "Objectifs de communication",
    summary: "Faire connaître, faire comprendre, faire essayer le Skin Diag.",
    blocks: [
      { kind: "proposition", title: "Cognitif", text: "Faire connaître SKINCLEAN et son Skin Diag auprès des 18-35 ans en France." },
      { kind: "proposition", title: "Affectif", text: "Installer une image de marque experte mais accessible, honnête et bienveillante." },
      { kind: "proposition", title: "Conatif", text: "Générer des diagnostics, des inscriptions newsletter et des participations au Skin Journal." },
    ],
  }),
  s("canaux", {
    group: "Communication", order: 9, title: "Choix des canaux",
    summary: "TikTok et Instagram pour la découverte, Pinterest et SEO pour la recherche, newsletter pour l'engagement.",
    blocks: [{ kind: "proposition", text: "Chaque canal a un rôle précis dans le parcours ; les fréquences sont ajustables dans les paramètres du calendrier." }],
    table: {
      head: ["Canal", "Rôle", "Fréquence proposée", "Formats", "Persona principale"],
      rows: [
        ["Instagram", "Image de marque, pédagogie", "4 posts / semaine", "Carrousels, Reels, produits", "Inès, Camille"],
        ["Stories Instagram", "Proximité, interaction", "5 jours / semaine", "Quiz, sondages, coulisses", "Toutes"],
        ["TikTok", "Découverte, viralité", "4 vidéos / semaine", "POV, tutos, textures", "Léa, Inès"],
        ["Facebook", "Réassurance, 30+", "3 posts / semaine", "Produits, conseils, articles", "Sarah"],
        ["Pinterest", "Inspiration, trafic durable", "5 épingles / semaine", "Routines, infographies", "Inès, Sarah"],
        ["Newsletter", "Engagement, conversion", "2 / mois", "Conseils, nouveautés, offres", "Toutes"],
        ["Blog SEO", "Visibilité organique", "4 articles / mois", "Guides, comparatifs", "Camille, Sarah"],
        ["SEA & Social Ads", "Accélération ciblée", "Selon budget validé", "Search, Meta, TikTok Ads", "Selon campagne"],
      ],
    },
  }),
  s("ligne-editoriale", {
    group: "Communication", order: 10, title: "Ligne éditoriale",
    summary: "5 piliers de contenu, un ton complice et pédagogue.",
    blocks: [
      { kind: "proposition", title: "Pilier 1 — Skin School (35 %)", text: "Comprendre sa peau et les actifs : focus ingrédients, associations, erreurs à éviter." },
      { kind: "proposition", title: "Pilier 2 — Routines (25 %)", text: "Routines matin/soir par type de peau, ordre d'application, gestes." },
      { kind: "proposition", title: "Pilier 3 — Produits (20 %)", text: "Textures, usages, kits, nouveautés — toujours avec un bénéfice concret." },
      { kind: "proposition", title: "Pilier 4 — Communauté (15 %)", text: "Skin Journal, UGC, questions de la communauté, coulisses." },
      { kind: "proposition", title: "Pilier 5 — Offres & temps forts (5 %)", text: "Newsletter -20 %, Club, temps forts commerciaux (Black Friday, Noël) — sans excès de promotions." },
      { kind: "proposition", title: "Règles de ton", text: "Tutoiement · phrases courtes · un emoji maximum par phrase · jamais de promesse médicale · « résultats variables selon les peaux » · mention « collaboration commerciale » pour toute influence rémunérée." },
    ],
  }),
  s("messages", {
    group: "Communication", order: 11, title: "Messages clés",
    summary: "Ce que chaque contenu doit faire passer.",
    blocks: [
      { kind: "proposition", title: "Message signature", text: "Your skin. Your glow. — Ta peau est unique, ta routine aussi." },
      { kind: "proposition", title: "Skin Diag", text: "2 minutes pour connaître ta peau et recevoir ta routine, gratuitement." },
      { kind: "proposition", title: "Efficacité honnête", text: "Des actifs bien dosés, des formules lisibles, des résultats qu'on suit vraiment." },
      { kind: "proposition", title: "Simplicité", text: "3 à 5 gestes suffisent quand ce sont les bons." },
      { kind: "proposition", title: "Communauté", text: "Rejoins le SKINCLEAN Club : chaque routine compte (et rapporte des feuilles)." },
    ],
  }),
  s("contenu", {
    group: "Stratégies", order: 12, title: "Stratégie de contenu",
    summary: "Créer une fois, décliner partout : une idée pilier par semaine déclinée en 6 formats.",
    blocks: [
      { kind: "proposition", title: "Méthode « 1 idée → 6 formats »", text: "Chaque semaine, un thème pilier (ex. « la niacinamide ») devient : 1 carrousel Instagram, 1 Reel/TikTok, 1 épingle, 1 story quiz, 1 post Facebook et, deux fois par mois, une rubrique de newsletter ou un article SEO." },
      { kind: "proposition", title: "Production", text: "Tournage groupé 2 demi-journées par mois (textures, gestes, face cam) ; visuels produits issus du Studio créatif avec les templates de marque." },
      { kind: "proposition", title: "Validation", text: "Tout contenu passe par le statut « À valider » avant publication ; le client valide en un clic depuis l'accueil du Hub." },
    ],
  }),
  s("acquisition", {
    group: "Stratégies", order: 13, title: "Stratégie d'acquisition",
    summary: "SEO et contenus organiques comme socle, publicité ciblée sur le Skin Diag pour accélérer.",
    blocks: [
      { kind: "proposition", title: "Organique", text: "SEO sur les requêtes problème/actif (« sérum niacinamide peau grasse », « routine peau sensible »), Pinterest pour le trafic durable, vidéos courtes." },
      { kind: "proposition", title: "Payant", text: "Google Ads Search sur la marque et les requêtes à forte intention ; Meta et TikTok Ads avec le Skin Diag comme porte d'entrée (pas de promotion produit agressive). Tout budget est validé avant dépense réelle." },
      { kind: "proposition", title: "Captation", text: "Inscription newsletter et routine par e-mail : chaque campagne renvoie vers un parcours qui capte une adresse avec consentement." },
      { kind: "proposition", title: "Mesure", text: "Paramètres UTM systématiques (générés dans le module SEA) pour attribuer le trafic par campagne ; l'attribution aux ventes sera faite dans le CRM." },
    ],
  }),
  s("influence", {
    group: "Stratégies", order: 14, title: "Stratégie d'influence",
    summary: "Micro et nano-influence skincare, crédibilité avant audience.",
    blocks: [
      { kind: "proposition", title: "Profils", text: "15 à 25 micro-créateurs (5 k – 50 k abonnés) skincare/lifestyle, dont 2-3 profils « peau à imperfections » et 2-3 « peau sensible » ; sélection sur la qualité de l'engagement et l'honnêteté du discours." },
      { kind: "proposition", title: "Dispositif", text: "Envoi de routine personnalisée après Skin Diag du créateur, challenge Skin Journal 30 jours, codes affiliés suivis par UTM." },
      { kind: "fait", title: "Conformité", text: "Mention « collaboration commerciale » ou « publicité » obligatoire, contrat écrit, interdiction des filtres de retouche non signalés (loi n° 2023-451)." },
    ],
  }),
  s("notoriete", {
    group: "Stratégies", order: 15, title: "Stratégie de notoriété",
    summary: "Lancement en 3 vagues : révéler, faire essayer, fédérer.",
    blocks: [
      { kind: "proposition", title: "Vague 1 — Révéler (S1-S4)", text: "Campagne de lancement : manifeste, présentation des gammes, teasing du Skin Diag, première vague influence." },
      { kind: "proposition", title: "Vague 2 — Faire essayer (S5-S10)", text: "Campagne Skin Diag + offre newsletter, contenus routines par type de peau, publicités ciblées." },
      { kind: "proposition", title: "Vague 3 — Fédérer (S11+)", text: "Skin Journal 30 jours, UGC, Club, temps forts saisonniers." },
      { kind: "proposition", title: "Relations presse", text: "Kit presse digital (communiqué, visuels du Studio, fiches produits) envoyé aux médias beauté en ligne au lancement et pour l'édition hiver." },
    ],
  }),
];

export const personas: Persona[] = [
  {
    id: "persona-lea", name: "Léa", age: "19 ans · étudiante", avatar: "L", color: "#C7D3C2",
    summary: "Peau mixte à grasse avec imperfections. Découvre ses produits sur TikTok, petit budget, veut des résultats visibles et des explications simples.",
    skin: ["Peau mixte à grasse", "Imperfections et points noirs", "Brillances zone T", "Marques post-imperfections"],
    motivations: ["Avoir une peau plus nette pour se sentir à l'aise sans maquillage", "Comprendre quoi utiliser sans se ruiner", "Suivre les conseils de créatrices qu'elle trouve sincères"],
    frustrations: ["A déjà agressé sa peau avec trop d'actifs", "Méfiance envers les promesses miracles", "Routines trop longues"],
    digital: ["TikTok 2 h / jour (#skincaretok)", "Instagram Stories", "Recherche Google ponctuelle « bouton menton que faire »", "Achète sur mobile"],
    channels: ["tiktok", "story", "instagram"],
    messages: ["Une routine anti-imperfections en 3 gestes, sans décaper", "La niacinamide, ce qu'elle fait vraiment (et ce qu'elle ne fait pas)", "Spot Hero : ton SOS bouton invisible"],
    products: ["sc-cl-02", "sc-sr-01", "sc-cr-03", "sc-pt-01", "sc-ex-02"],
    quote: "Je veux juste une routine qui marche et que je comprends.",
  },
  {
    id: "persona-ines", name: "Inès", age: "24 ans · jeune active", avatar: "I", color: "#EBDDD5",
    summary: "Peau normale à déshydratée, teint terne avec le rythme de travail. Adore l'esthétique, les routines glow et les jolies salles de bain.",
    skin: ["Peau normale à déshydratée", "Teint terne", "Manque d'éclat en hiver", "Légers cernes"],
    motivations: ["Un teint lumineux « glass skin » au naturel", "Un moment de soin pour soi", "Des produits beaux et efficaces"],
    frustrations: ["Manque de temps le matin", "Produits qui ne tiennent pas leurs promesses d'éclat", "Trop de choix"],
    digital: ["Instagram (Reels, carrousels enregistrés)", "Pinterest pour les routines et la déco", "Newsletter des marques qu'elle aime", "TikTok le soir"],
    channels: ["instagram", "pinterest", "tiktok", "newsletter"],
    messages: ["La routine glow du matin en 4 gestes", "Vitamine C : comment l'utiliser sans irriter", "Superposer l'hydratation : la méthode des 3 couches"],
    products: ["sc-tn-01", "sc-sr-02", "sc-sr-03", "sc-cr-01", "sc-pd-01", "sc-ey-01"],
    quote: "Je veux une peau qui rayonne, même après une semaine chargée.",
  },
  {
    id: "persona-camille", name: "Camille", age: "29 ans · cadre", avatar: "C", color: "#D8DFD4",
    summary: "Peau sensible et réactive, rougeurs. Lit les listes INCI, compare, recherche beaucoup sur Google avant d'acheter.",
    skin: ["Peau sensible", "Rougeurs diffuses", "Tiraillements", "Réagit aux parfums et aux exfoliants forts"],
    motivations: ["Apaiser durablement sa peau", "Des formules courtes et transparentes", "Être conseillée avec sérieux"],
    frustrations: ["Réactions après des produits « naturels »", "Discours marketing flous", "Peu de marques assument leurs limites"],
    digital: ["Google (articles, comparatifs)", "Blogs et forums skincare", "Newsletter", "Instagram éducatif"],
    channels: ["blog", "newsletter", "instagram", "facebook"],
    messages: ["Peau sensible : la routine minimaliste qui apaise", "Barrière cutanée : la reconnaître, la réparer", "Pourquoi nos formules sont courtes"],
    products: ["sc-cl-01", "sc-sr-04", "sc-cr-04", "sc-sp-02", "sc-pd-02"],
    quote: "Je lis tout avant d'acheter. Si c'est flou, je passe mon chemin.",
  },
  {
    id: "persona-sarah", name: "Sarah", age: "34 ans · maman active", avatar: "S", color: "#F1E9D2",
    summary: "Premières ridules et fatigue visible. Veut une routine efficace et rapide, fait confiance aux recommandations et aux marques transparentes.",
    skin: ["Peau normale à sèche", "Premières ridules", "Regard fatigué", "Taches pigmentaires légères"],
    motivations: ["Prévenir les signes de l'âge sans routine compliquée", "Gagner du temps", "Des actifs efficaces mais tolérés"],
    frustrations: ["Rétinol qui irrite", "Produits anti-âge trop chers", "Manque de temps"],
    digital: ["Facebook et Instagram", "Pinterest (routines, organisation)", "Newsletter lue le soir", "Google pour comparer"],
    channels: ["facebook", "instagram", "pinterest", "newsletter"],
    messages: ["Rétinal ou bakuchiol : lequel choisir ?", "La routine du soir en 3 minutes", "Contour des yeux : le geste qu'on oublie"],
    products: ["sc-sr-05", "sc-sr-06", "sc-ey-02", "sc-cr-02", "sc-sp-01", "sc-tg-01"],
    quote: "Je veux des soins qui marchent, pas une routine en 10 étapes.",
  },
];

const deadline = (monthsAhead: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsAhead);
  d.setDate(0);
  return d.toISOString().slice(0, 10);
};

/** Objectifs SMART : cibles proposées, valeurs actuelles vides tant qu'elles ne sont pas mesurées. */
export const objectives = (): Objective[] => [
  { id: "obj-notoriete", axis: "Notoriété", title: "Atteindre 400 000 comptes uniques touchés sur Instagram et TikTok", kpi: "Portée cumulée (comptes uniques)", baseline: "0 — lancement", target: 400000, unit: "comptes", current: null, deadline: deadline(6), owner: "Responsable marketing", status: "en_cours" },
  { id: "obj-visibilite", axis: "Visibilité", title: "Obtenir 1,5 million d'impressions organiques et payantes", kpi: "Impressions toutes plateformes", baseline: "0", target: 1500000, unit: "impressions", current: null, deadline: deadline(6), owner: "Responsable marketing", status: "en_cours" },
  { id: "obj-communaute-ig", axis: "Communautés", title: "Rassembler 5 000 abonnés Instagram", kpi: "Abonnés Instagram", baseline: "0", target: 5000, unit: "abonnés", current: null, deadline: deadline(6), owner: "Community manager", status: "en_cours" },
  { id: "obj-communaute-tt", axis: "Communautés", title: "Rassembler 8 000 abonnés TikTok", kpi: "Abonnés TikTok", baseline: "0", target: 8000, unit: "abonnés", current: null, deadline: deadline(6), owner: "Community manager", status: "en_cours" },
  { id: "obj-engagement", axis: "Engagement", title: "Maintenir un taux d'engagement moyen de 4 % sur Instagram", kpi: "(likes + commentaires + partages + enregistrements) / portée", baseline: "À mesurer", target: 4, unit: "%", current: null, deadline: deadline(3), owner: "Community manager", status: "en_cours" },
  { id: "obj-trafic", axis: "Trafic campagnes", title: "Générer 20 000 visites sur le site depuis les campagnes marketing", kpi: "Sessions avec UTM SKINCLEAN", baseline: "0", target: 20000, unit: "visites", current: null, deadline: deadline(6), owner: "Responsable acquisition", status: "en_cours" },
  { id: "obj-inscriptions", axis: "Inscriptions", title: "Recueillir 2 500 inscriptions newsletter issues des actions marketing", kpi: "Inscriptions confirmées (source campagne)", baseline: "0", target: 2500, unit: "inscriptions", current: null, deadline: deadline(6), owner: "Responsable CRM / e-mailing", status: "en_cours" },
  { id: "obj-diag", axis: "Skin Diag", title: "Atteindre 6 000 Skin Diag complétés", kpi: "Diagnostics terminés", baseline: "0", target: 6000, unit: "diagnostics", current: null, deadline: deadline(6), owner: "Responsable marketing", status: "en_cours" },
  { id: "obj-seo", axis: "SEO", title: "Positionner 15 mots-clés prioritaires dans le top 10 Google", kpi: "Mots-clés prioritaires en position ≤ 10", baseline: "0", target: 15, unit: "mots-clés", current: null, deadline: deadline(9), owner: "Responsable SEO", status: "en_cours" },
  { id: "obj-contenus", axis: "Performance des contenus", title: "Publier 95 % des contenus prévus à la date planifiée", kpi: "Taux de respect du calendrier", baseline: "—", target: 95, unit: "%", current: null, deadline: deadline(3), owner: "Responsable marketing", status: "en_cours" },
];
