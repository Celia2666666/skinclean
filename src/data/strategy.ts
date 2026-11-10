/**
 * Dossier stratégique SKINCLEAN : pourquoi ce produit.
 * Règle : chaque chiffre de marché porte un lien vers sa source (consultée le 10 novembre 2026).
 * Un chiffre sans source est présenté comme une estimation, avec le calcul qui y mène.
 */
export interface Source { id: string; label: string; publisher: string; date: string; url: string }

export const sources: Source[] = [
  { id: "circana", label: "Marché de la beauté en France 2024 (données Circana)", publisher: "Premium Beauty News", date: "17 mars 2025", url: "https://www.premiumbeautynews.com/fr/france-un-marche-de-la-beaute,25436" },
  { id: "marketline", label: "Skincare in France — rapport MarketLine", publisher: "Research and Markets", date: "mai 2025", url: "https://www.researchandmarkets.com/reports/5992738/skincare-in-france" },
  { id: "febea", label: "Commerce extérieur 2024 de la filière cosmétique", publisher: "FEBEA (communiqué de presse)", date: "7 février 2025", url: "https://www.febea.fr/sites/default/files/2025-02/CP%20FEBEA%20EXPORT%202024%20VDEF.pdf" },
  { id: "acne", label: "Cinq millions de Français concernés par l'acné (enquête CSA, 10 000 personnes de 15 à 69 ans)", publisher: "Le Quotidien du Médecin", date: "19 décembre 2013", url: "https://cardiologie.lequotidiendumedecin.fr/specialites/dermatologie/cinq-millions-de-francais-concernes-par-lacne" },
  { id: "sensible", label: "Sensitive skin in France: updated epidemiological data (Taieb C., Misery L., 5 000 personnes)", publisher: "ISPOR, 20ᵉ congrès européen", date: "2017", url: "https://www.ispor.org/heor-resources/presentations-database/presentation/ispor-20th-annual-european-congress/sensitive-skin-in-france-updated-epidemiological-data" },
  { id: "genz", label: "IA et réseaux sociaux s'imposent dans les parcours d'achat de la Gen Z (étude OpinionWay pour Orisha, 804 jeunes de 15 à 25 ans en France)", publisher: "The Media Leader", date: "10 avril 2026", url: "https://fr.themedialeader.com/ia-et-reseaux-sociaux-simposent-dans-les-parcours-dachat-de-la-gen-z/" },
  { id: "ordinary", label: "Niacinamide 10% + Zinc 1% — page produit officielle", publisher: "The Ordinary", date: "prix relevé le 10 novembre 2026", url: "https://theordinary.com/fr-fr/niacinamide-10-zinc-1-serum-100436.html" },
  { id: "typology", label: "Soins boutons et imperfections — boutique officielle", publisher: "Typology", date: "prix relevé le 10 novembre 2026", url: "https://www.typology.com/collections/boutons-imperfections" },
  { id: "lrp", label: "Effaclar Sérum à l'acide salicylique ultra concentré — page produit officielle", publisher: "La Roche-Posay", date: "prix relevé le 10 novembre 2026", url: "https://www.laroche-posay.fr/gammes/visage/effaclar/effaclar%C2%A0serum-a-l-acide-salicylique-ultra-concentre/LRP_060.html" },
];
export const src = (id: string) => sources.find((s) => s.id === id)!;

export const problem = {
  title: "Trop de produits, trop d'avis, et une peau qui réagit",
  who: [
    { figure: "5 millions", text: "de Français ont de l'acné au moment de l'enquête (12 % des 15-69 ans), et 73 % des 15-34 ans en ont déjà eu.", source: "acne" },
    { figure: "66 %", text: "des femmes et 51,9 % des hommes en France déclarent avoir la peau « sensible » ou « très sensible ».", source: "sensible" },
    { figure: "82 %", text: "des 15-25 ans s'informent d'abord sur les réseaux sociaux avant un achat, où les conseils se contredisent.", source: "genz" },
  ],
  frequency: "Tous les jours : la routine se fait matin et soir, et un nouveau soin s'achète en moyenne tous les 1 à 2 mois (un sérum de 30 ml dure 4 à 6 semaines, voir la durée d'utilisation affichée dans le compte client).",
  cost: {
    text: "Aujourd'hui, la personne achète au hasard, garde ce qui ne lui convient pas ou associe des actifs incompatibles (rétinoïde + acide le même soir), ce qui irrite la peau et fait racheter.",
    estimate: "Estimation : 3 soins inadaptés par an × 20 € en moyenne = 60 € perdus par an, et 15 minutes de recherche par semaine × 52 semaines ≈ 13 heures par an.",
  },
};

export const personas = [
  {
    name: "Inès, 22 ans",
    role: "Étudiante en alternance (communication), Lyon",
    skin: "Peau mixte à imperfections, poussées avant les examens",
    budget: "20 à 30 € par mois pour ses soins",
    channels: "TikTok (tutos, avis), Instagram, recommandations d'amies ; achète en ligne le soir",
    goal: "Une peau plus nette sans y passer 30 minutes ni se ruiner",
    pain: "Elle a essayé 6 sérums en un an sur les conseils de vidéos qui se contredisent.",
    offer: "Skin Diag → routine Acne Control ou set de 3 soins à -15 %",
  },
  {
    name: "Camille, 31 ans",
    role: "Cheffe de projet marketing, Paris",
    skin: "Peau sensible avec rougeurs, tiraillements l'hiver",
    budget: "40 à 60 € par mois, prête à payer pour des soins fiables",
    channels: "Conseil en pharmacie, Instagram, newsletters de marques, avis clients détaillés",
    goal: "Des soins doux et des listes d'ingrédients lisibles, sans tester au hasard",
    pain: "Les marques de pharmacie la rassurent mais coûtent cher ; les marques en ligne la perdent dans les actifs.",
    offer: "Calm Down + Comfort Zone + Mineral Calm SPF 50, suivi dans le Skin Journal, SKINCLEAN Club",
  },
];

export const market = {
  figures: [
    { figure: "9 Md€", text: "de ventes de beauté en France en 2024 : +3 % en valeur, mais −2 % en volume.", source: "circana" },
    { figure: "4,71 Md$", text: "pour le marché du soin de la peau en France en 2024, en croissance de 4,3 % par an (TCAC 2019-2024).", source: "marketline" },
    { figure: "+10 %", text: "de ventes de beauté en pharmacie en 2024 (+7 % en volume) : le circuit le plus dynamique, porté par la dermocosmétique.", source: "circana" },
    { figure: "11 Md€", text: "d'exportations françaises de maquillage et soins du visage en 2024 (+2,3 %), première catégorie exportée.", source: "febea" },
  ],
  trends: [
    { t: "Moins de produits, mieux choisis", d: "Les volumes baissent (−2 %) quand la valeur monte (+3 %) : on achète moins mais plus ciblé. Une routine courte et justifiée répond à ce mouvement.", source: "circana" },
    { t: "La confiance « dermatologique »", d: "La pharmacie progresse de +10 % : les consommateurs cherchent des soins doux, testés et expliqués. SKINCLEAN affiche INCI, précautions et compatibilités.", source: "circana" },
    { t: "La décision se prend sur les réseaux", d: "TikTok est la 1ʳᵉ source d'information produit des 15-25 ans (66 %), devant Instagram (44 %) et YouTube (38 %).", source: "genz" },
  ],
  sizing: {
    title: "Notre marché adressable",
    steps: [
      "Marché du soin de la peau en France : 4,71 Md$ (source MarketLine), soit environ 4,3 Md€ (hypothèse : 1 $ ≈ 0,92 €).",
      "Part des 18-35 ans : 30 % (hypothèse) → environ 1,3 Md€.",
      "Part achetée en ligne : 20 % (hypothèse) → environ 260 M€ de marché adressable.",
      "Objectif à 12 mois : 150 000 € TTC, soit environ 0,06 % de ce marché adressable.",
    ],
    note: "Les trois dernières lignes sont des estimations : seul le premier chiffre est sourcé.",
  },
};

export const competitors = [
  { brand: "The Ordinary", product: "Niacinamide 10% + Zinc 1% (30 ml)", price: 6.0, per100: 20.0, positioning: "Actifs purs à très petit prix, vendus en ligne et chez Sephora.", limit: "Peu d'accompagnement : c'est au client de construire sa routine et d'éviter les incompatibilités.", source: "ordinary" },
  { brand: "Typology", product: "Sérum Unifiant L36, Niacinamide 12 % (30 ml)", price: 18.5, per100: 61.67, positioning: "Soins minimalistes et naturels, marque française née en ligne.", limit: "Large catalogue d'actifs : le choix reste difficile pour une peau qui réagit.", source: "typology" },
  { brand: "La Roche-Posay", product: "Effaclar Sérum ultra concentré (30 ml)", price: 34.3, per100: 114.33, positioning: "Dermocosmétique de pharmacie, forte caution médicale.", limit: "Prix élevé pour un jeune public, peu de personnalisation en ligne.", source: "lrp" },
];
export const ourProduct = { brand: "SKINCLEAN", product: "Clear Skin, sérum niacinamide 10 % + zinc (30 ml)", price: 22.0, per100: 73.33, positioning: "Routine courte choisie par le Skin Diag, actifs compatibles, suivi dans le Skin Journal.", limit: "Marque jeune, sans notoriété : la confiance se gagne par la transparence et les avis vérifiés." };

export const pricing = {
  method: [
    { t: "Prix des concurrents", d: "Sur un sérum niacinamide de 30 ml, le marché va de 6 € (The Ordinary) à 34,30 € (La Roche-Posay), avec Typology à 18,50 €. Clear Skin à 22 € TTC se place au-dessus des marques d'actifs purs et nettement sous la dermocosmétique (−36 %)." },
    { t: "Coûts", d: "Prix HT : 22 € ÷ 1,2 = 18,33 €. Coût de revient estimé à 24 % du prix HT (formule, flacon, étui, remplissage), soit environ 4,40 € : marge brute d'environ 76 %, qui finance la livraison offerte dès 100 €, l'acquisition et le Club. Hypothèse identique dans le CRM (onglet Rentabilité)." },
    { t: "Valeur pour le client", d: "Le Skin Diag évite les achats inadaptés (60 € par an estimés). Une routine anti-imperfections de 3 soins (Clear Foam, Clear Skin, Matte Balance) coûte 60 € à l'unité, ou 51 € en set à -15 %, et dure environ 6 semaines." },
  ],
  coherence: "Le prix reste cohérent avec le marché : il paie l'accompagnement (diagnostic, compatibilités, suivi) que les marques à petit prix n'offrent pas, tout en restant accessible au persona étudiant grâce aux mini-formats, aux sets et au Club.",
};

export const businessModel = {
  revenue: [
    { t: "Vente en ligne directe (D2C)", d: "Soins à l'unité, sets et kits, payés en ligne. C'est 90 % du chiffre d'affaires visé." },
    { t: "Ventes aux professionnels (B2B)", d: "Instituts, concept stores et pharmacies indépendantes qui revendent les kits, suivis dans le pipeline du CRM. Environ 10 % du chiffre d'affaires visé." },
    { t: "Fidélisation", d: "Le SKINCLEAN Club (1 feuille par euro) et le rappel de réapprovisionnement font revenir les clientes : la récurrence se fait sans abonnement imposé." },
  ],
  goal: {
    headline: "150 000 € TTC de chiffre d'affaires en 12 mois",
    steps: [
      ["Chiffre d'affaires visé", "150 000 € TTC (125 000 € HT)"],
      ["Panier moyen (hypothèse)", "50 € TTC"],
      ["Commandes nécessaires", "150 000 ÷ 50 = 3 000 commandes, soit 250 par mois"],
      ["Clients nécessaires", "3 000 ÷ 1,5 commande par client et par an = 2 000 clients"],
      ["Trafic nécessaire", "3 000 ÷ 2 % de taux de conversion = 150 000 visites, soit 12 500 par mois"],
      ["Part B2B", "10 comptes professionnels × 1 500 € = 15 000 € (inclus dans l'objectif)"],
    ] as [string, string][],
    note: "Panier moyen, fréquence d'achat et taux de conversion sont des hypothèses de travail, suivies chaque mois dans le tableau de bord du CRM.",
  },
};
