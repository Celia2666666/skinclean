/**
 * Plan de communication SKINCLEAN : comment vendre.
 * Les chiffres d'audience des réseaux renvoient aux sources du dossier stratégique (src/data/strategy.ts).
 * Les objectifs chiffrés (KPI) sont des cibles fixées par l'équipe, présentées comme telles.
 */
export const brandPlatform = {
  name: "SKINCLEAN",
  tagline: "Your skin. Your glow.",
  promise: "La bonne routine, sans empiler les produits : un diagnostic en 2 minutes, des soins compatibles et un suivi honnête des résultats.",
  tone: [
    { t: "Bienveillant", d: "On tutoie, on rassure, on ne culpabilise jamais : les imperfections font partie de la peau." },
    { t: "Clair", d: "Zéro jargon sans explication : chaque actif est traduit en bénéfice et en précaution." },
    { t: "Honnête", d: "Pas de promesse miracle ni d'avant/après retouché : des délais réalistes (4 à 8 semaines) et des avis vérifiés." },
  ],
  messages: [
    { t: "La bonne routine en 2 minutes", d: "Le Skin Diag choisit 3 à 6 soins adaptés à ta peau, ton temps et ton budget." },
    { t: "Des actifs qui vont ensemble", d: "Nos routines écartent les associations irritantes et affichent toutes les listes INCI." },
    { t: "Prendre soin, pas viser la perfection", d: "Des soins de 7 € à 36 € et un suivi en 30 jours dans le Skin Journal, sans injonction." },
  ],
};

export const channels = [
  { name: "TikTok", why: "1ʳᵉ source d'information produit des 15-25 ans (66 %) : le canal du persona Léa, idéal pour les tutos et les avis courts.", role: "Notoriété et preuve en vidéo", rhythm: "3 vidéos par semaine, 1 live par mois", source: "genz" },
  { name: "Instagram", why: "Utilisé par 44 % des 15-25 ans pour s'informer, et par le persona Camille qui y suit marques et pharmaciens.", role: "Image de marque, carrousels pédagogiques, avis", rhythm: "3 posts et stories quotidiennes", source: "genz" },
  { name: "Pinterest", why: "Un moteur de recherche visuel : on y cherche « routine peau mixte » ou « glass skin » avant d'acheter. Une épingle continue d'amener des visites sur le site des mois après sa publication, ce qui convient aux deux personas qui préparent leurs achats.", role: "Routines en images, trafic durable vers le site", rhythm: "5 épingles par semaine", source: null },
  { name: "Newsletter et site", why: "Canaux que l'on possède : on y convertit l'audience des réseaux (code -20 %, routine envoyée par e-mail).", role: "Conversion et fidélisation", rhythm: "1 newsletter par semaine", source: null },
];

export type Network = "Instagram" | "TikTok" | "Pinterest";
export interface Post { id: number; network: Network; format: string; /** Vidéo jouée dans l'aperçu TikTok. */ video?: string; /** Pages suivantes d'un carrousel (la 1re est image). */ slides?: string[]; date: string; dateISO: string; goal: "Notoriété" | "Considération" | "Conversion" | "Fidélisation"; title: string; image: string; alt: string; text: string; hashtags: string }

export const posts: Post[] = [
  { id: 1, network: "Instagram", slides: ["/media/posts/post-1-2.webp", "/media/posts/post-1-3.webp", "/media/posts/post-1-4.webp"], format: "Carrousel 4:5, 4 visuels", date: "lundi 23 novembre 2026, 18 h", dateISO: "2026-11-23", goal: "Notoriété", title: "La bonne routine, sans empiler les produits", image: "/media/posts/post-1.webp", alt: "Sérum Clear Skin sur fond vert sauge, titre « La bonne routine, sans empiler les produits »",
    text: "Tu as déjà acheté 3 sérums en un mois parce qu'une vidéo t'a dit que c'était LE bon ?\nChez SKINCLEAN, on fait l'inverse : 10 questions, 2 minutes, et le Skin Diag te propose une routine courte (3 à 6 soins) qui va avec ta peau, ton temps et ton budget.\nSwipe pour voir les 3 étapes\nLe Skin Diag est gratuit, lien en bio.", hashtags: "#skincare #routinevisage #peaumixte #skindiag #skinclean" },
  { id: 2, network: "Instagram", slides: ["/media/posts/post-2-2.webp", "/media/posts/post-2-3.webp", "/media/posts/post-2-4.webp", "/media/posts/post-2-5.webp"], format: "Carrousel 4:5, 5 visuels", date: "mardi 1ᵉʳ décembre 2026, 12 h 30", dateISO: "2026-12-01", goal: "Considération", title: "Niacinamide + vitamine C : on peut ?", image: "/media/posts/post-2.webp", alt: "Visuel vert foncé : « Niacinamide + vitamine C : on peut ? » avec quatre conseils",
    text: "« Niacinamide et vitamine C, ça s'annule ? » C'est la question qu'on reçoit le plus.\nRéponse courte : oui tu peux les utiliser, mais pas au même moment si ta peau est sensible.\n Vitamine C le matin (Glow Shot), pour l'éclat\n Niacinamide le soir (Clear Skin), pour les imperfections\n SPF tous les matins, même en hiver\nEnregistre ce post pour ta prochaine routine.", hashtags: "#niacinamide #vitaminec #actifs #skincaretips #skinclean" },
  { id: 3, network: "Instagram", format: "Post 4:5 + 3 stories sondage", date: "jeudi 10 décembre 2026, 18 h", dateISO: "2026-12-10", goal: "Conversion", title: "30 jours de Skin Journal", image: "/media/posts/post-3.webp", alt: "Deux photos de peau côte à côte, J0 et J30, mention « photos et témoignage de démonstration »",
    text: "30 jours, une routine de 5 soins, et des photos prises à la même lumière : c'est le principe du Skin Journal, gratuit dans ton compte.\nTu notes hydratation, imperfections, rougeurs et éclat, et tu compares J0 et J30 avec le curseur. Aucune retouche, aucune promesse miracle : juste ton suivi.\n(Photos et témoignage de démonstration.)\n-20 % sur ta 1ʳᵉ commande avec la newsletter, lien en bio.", hashtags: "#skinjournal #avantapres #routine30jours #peauaimperfections #skinclean" },
  { id: 4, network: "TikTok", video: "/media/videos/tiktok-routine-skinclean.mp4", format: "Vidéo verticale 9:16, 10 s", date: "mercredi 25 novembre 2026, 19 h", dateISO: "2026-11-25", goal: "Notoriété", title: "Ma routine sérum en 5 secondes", image: "/media/posts/post-4.webp", alt: "Gros plan d'un visage, une pipette de sérum près de la joue, titre « Ma routine sérum en 5 secondes »",
    text: "Accroche (0-2 s) : « Le geste de 5 secondes qui change ma routine. »\nDéroulé : 2 gouttes de sérum Clear Skin sur la joue, on tapote, puis la crème Cloud Cream, pot en main face caméra.\nTexte de la vidéo : « 2 gouttes, je tapote, puis la crème. »\nLégende : Mon geste préféré le matin : 2 gouttes de sérum Clear Skin, je tapote, puis la crème. 5 secondes, et ma peau est prête pour la journée. Niacinamide 10 % + zinc : pores moins visibles et brillances régulées (résultats variables selon les peaux). Tu veux ta routine idéale ? Fais le Skin Diag, lien en bio.", hashtags: "#skintok #routinematin #niacinamide #skincareroutine #skinclean" },
  { id: 5, network: "TikTok", video: "/media/videos/demo/pexels-7597957.mp4", format: "Vidéo verticale 9:16, 30 s, voix off", date: "jeudi 3 décembre 2026, 19 h", dateISO: "2026-12-03", goal: "Considération", title: "3 erreurs qui donnent des boutons", image: "/media/posts/post-5.webp", alt: "Jeune femme qui se rince le visage au lavabo, titre « 3 erreurs qui donnent des boutons »",
    text: "Accroche : « Si tu fais ça, arrête tout de suite. »\nDéroulé : rinçage du visage au lavabo, les 3 erreurs s'affichent à l'écran une par une.\n1. Changer de sérum chaque semaine : la peau n'a pas le temps de s'adapter, il faut 4 à 8 semaines.\n2. Frotter pour nettoyer : on masse 30 secondes, on rince à l'eau tiède.\n3. Oublier le SPF : les marques de boutons restent plus longtemps.\nLégende : Laquelle tu faisais ? Notre Skin Diag t'aide à garder une routine simple, lien en bio.", hashtags: "#acne #boutons #skincaretips #erreursskincare #skinclean" },
  { id: 6, network: "TikTok", video: "/media/videos/demo/pexels-8131887.mp4", format: "Vidéo verticale 9:16, 20 s, son tendance", date: "mardi 8 décembre 2026, 19 h", dateISO: "2026-12-08", goal: "Conversion", title: "Test texture : le trio offert à ta 1ʳᵉ commande", image: "/media/posts/post-6.webp", alt: "Gouttes de soin sur la paume d'une main, titre « Test texture : le trio offert à ta 1re commande »",
    text: "Accroche : « Le test texture avant de commander. »\nDéroulé : une goutte de chaque soin du Trio découverte (Dew Drop, Aqua Plump, Cloud Cream) déposée sur la main, en gros plan, puis étalée pour montrer le fini.\nTexte de la vidéo : « Léger, frais, fondant : les 3 soins offerts. »\nLégende : Le Trio découverte est offert avec ta 1ʳᵉ commande, et avec la newsletter tu as -20 % en plus. Lien en bio.", hashtags: "#testtexture #skincare #cadeau #routinehydratante #skinclean" },
  { id: 7, network: "Pinterest", format: "Épingle verticale 2:3, lien vers la routine", date: "vendredi 27 novembre 2026, 20 h 30", dateISO: "2026-11-27", goal: "Considération", title: "Routine du soir peau mixte en 3 gestes", image: "/media/posts/post-7.webp", alt: "Visage en train d'être nettoyé, titre « Routine du soir peau mixte en 3 gestes »",
    text: "Titre de l'épingle : Routine du soir peau mixte : 3 gestes, 3 minutes\nDescription : Démaquiller sans frotter avec Melt Away, nettoyer avec Cloud Gel, puis Clear Skin (niacinamide 10 %) et Cloud Cream pour hydrater sans briller. Enregistre l'épingle pour ce soir, et fais ton Skin Diag gratuit sur le site SKINCLEAN pour adapter la routine à ta peau.\nLien : la routine Acne Control sur skinclean.vercel.app", hashtags: "#routinedusoir #peaumixte #skincare #routinevisage" },
  { id: 8, network: "Pinterest", format: "Épingle infographie 2:3", date: "samedi 5 décembre 2026, 11 h", dateISO: "2026-12-05", goal: "Considération", title: "Lire une liste INCI en 30 secondes", image: "/media/posts/post-8.webp", alt: "Fond crème, titre « Lire une liste INCI en 30 secondes » et quatre astuces",
    text: "Titre de l'épingle : Comment lire une liste INCI en 30 secondes\nDescription : Les ingrédients sont classés du plus dosé au moins dosé, les 5 premiers forment l'essentiel de la formule, le parfum apparaît sous « parfum » ou « aroma », et l'actif annoncé doit figurer dans la liste. Sur le site SKINCLEAN, chaque fiche affiche sa liste INCI complète et le rôle de chaque ingrédient clé.\nLien : la fiche Clear Skin, avec sa liste INCI", hashtags: "#inci #ingredients #skincaretips #cosmetiques" },
  { id: 9, network: "Pinterest", format: "Épingle produit 2:3", date: "dimanche 13 décembre 2026, 18 h", dateISO: "2026-12-13", goal: "Fidélisation", title: "La méthode « 7 skin » avec Dew Drop", image: "/media/posts/post-9.webp", alt: "Toner Dew Drop sur fond vert sauge, titre « La méthode 7 skin avec Dew Drop »",
    text: "Titre de l'épingle : La méthode « 7 skin » en version simple\nDescription : Trois couches fines de toner hydratant, en tapotant entre chaque passage, pour une peau gorgée d'eau avant la crème. Démonstration avec Dew Drop (3 à 4 pschits à 20 cm du visage). Les membres du SKINCLEAN Club gagnent 20 feuilles pour chaque avis publié après achat.\nLien : la fiche Dew Drop", hashtags: "#7skin #glassskin #toner #kbeauty" },
];

/** Calendrier éditorial : 4 semaines, du 23 novembre au 20 décembre 2026. */
export const calendar: { week: string; theme: string; items: { day: string; channel: string; action: string; postId?: number }[] }[] = [
  { week: "Semaine 1 · 23-29 nov.", theme: "Faire connaître le Skin Diag", items: [
    { day: "Lun. 23", channel: "Instagram", action: "Carrousel « La bonne routine »", postId: 1 },
    { day: "Mer. 25", channel: "TikTok", action: "Ma routine sérum en 5 secondes", postId: 4 },
    { day: "Jeu. 26", channel: "Newsletter", action: "Bienvenue + code -20 % pour les inscrits" },
    { day: "Ven. 27", channel: "Pinterest", action: "Épingle routine du soir peau mixte", postId: 7 },
  ] },
  { week: "Semaine 2 · 30 nov.-6 déc.", theme: "Expliquer les actifs", items: [
    { day: "Mar. 1ᵉʳ", channel: "Instagram", action: "Carrousel niacinamide + vitamine C", postId: 2 },
    { day: "Jeu. 3", channel: "TikTok", action: "3 erreurs qui donnent des boutons", postId: 5 },
    { day: "Sam. 5", channel: "Pinterest", action: "Infographie : lire une liste INCI", postId: 8 },
    { day: "Dim. 6", channel: "Partenariat", action: "Envoi des 10 colis aux créatrices de contenu" },
  ] },
  { week: "Semaine 3 · 7-13 déc.", theme: "Prouver et convertir", items: [
    { day: "Mar. 8", channel: "TikTok", action: "Test texture du Trio offert", postId: 6 },
    { day: "Jeu. 10", channel: "Instagram", action: "30 jours de Skin Journal + sondage en story", postId: 3 },
    { day: "Ven. 11", channel: "Newsletter", action: "Kits de saison : Winter Rescue" },
    { day: "Dim. 13", channel: "Pinterest", action: "Épingle méthode « 7 skin »", postId: 9 },
  ] },
  { week: "Semaine 4 · 14-20 déc.", theme: "Fidéliser avant les fêtes", items: [
    { day: "Mar. 15", channel: "TikTok", action: "Live de 30 min : questions-réponses sur les routines d'hiver" },
    { day: "Mer. 16", channel: "Instagram", action: "Repost des avis et vidéos des créatrices (avec leur accord)" },
    { day: "Jeu. 17", channel: "Newsletter", action: "Idées cadeaux + rappel des feuilles du Club" },
    { day: "Ven. 18", channel: "Bilan", action: "Lecture des indicateurs et choix des 3 meilleurs formats pour janvier" },
  ] },
];

/** Partenaires possibles : aucun accord n'existe à ce jour. */
export const partnerships = [
  { who: "Créatrices de contenu skincare (10 000 à 50 000 abonnés sur TikTok et Instagram)", type: "Créateurs de contenu", offer: "Un Trio découverte + la routine de leur Skin Diag, un code personnel -15 % et 15 % de commission sur les ventes.", gain: "Une rémunération à la performance et un produit adapté à leur peau à montrer à leur communauté.", first: "Sélection de 10 profils peau mixte ou sensible, envoi des colis la semaine 2.", example: { label: "Repérer les créatrices sous #skincaretok sur TikTok", url: "https://www.tiktok.com/tag/skincaretok" } },
  { who: "Pharmacies indépendantes de Lyon", type: "Lieux de vente", offer: "Un présentoir de 3 kits, 35 % de marge revendeur et un QR code vers le Skin Diag pour conseiller au comptoir.", gain: "Une gamme accessible pour la clientèle 18-35 ans et un outil de conseil prêt à l'emploi.", first: "5 officines démarchées, suivies dans le pipeline du CRM.", example: { label: "La Grande Pharmacie de la Part-Dieu (Lyon 3e)", url: "https://www.westfield.com/fr/france/lapartdieu/boutiques/la-grande-pharmacie-de-la-part-dieu/63882" } },
  { who: "Bureaux des élèves et associations étudiantes (ex. BDE d'écoles de commerce)", type: "Associations", offer: "-20 % pour les membres, des kits voyage pour les week-ends d'intégration et un atelier « routine en 5 minutes ».", gain: "Un avantage concret pour leurs adhérents et un atelier clé en main pour leur programme.", first: "Contact de 3 BDE lyonnais, atelier test en décembre.", example: { label: "Les BDE du campus INSEEC de Lyon", url: "https://www.inseec.com/association/" } },
  { who: "Média lifestyle jeune (newsletter ou podcast beauté)", type: "Médias", offer: "Un guide « routine peau à imperfections » rédigé avec leur équipe, sponsorisé, avec un code lecteur.", gain: "Un contenu utile et financé pour leur audience, et un revenu publicitaire.", first: "Proposition à 3 médias, objectif : 1 guide publié en janvier.", example: { label: "Le Bonbon Lyon, média lifestyle local", url: "https://www.lebonbon.fr/lyon/" } },
  { who: "Salles de sport et de yoga de quartier", type: "Lieux", offer: "Des minis Clear Foam et Fresh Mist dans les vestiaires, avec une carte « -10 % » et le Skin Diag.", gain: "Un service gratuit pour leurs membres et une image « bien-être ».", first: "2 salles test pendant 1 mois, codes de réduction suivis séparément.", example: { label: "Yoga Korner, studio de yoga (Lyon 1er)", url: "https://www.lebonbon.fr/lyon/healthy/yoga-korner-lyon-studio-coffee-shop/" } },
];

/** Les dix premiers clients : un plan concret, mesuré dans le CRM (champ « source »). */
export const firstTen = [
  { n: "2 clients", how: "Réseau proche et campus : partage du Skin Diag dans les groupes de promo avec le code -20 %.", when: "Semaine 1", source: "Bouche-à-oreille" },
  { n: "3 clients", how: "Créatrices de contenu : 10 colis envoyés, 3 commandes attendues via leurs codes personnels (taux de 30 % visé).", when: "Semaines 2-3", source: "Réseau social" },
  { n: "2 clients", how: "Pharmacies indépendantes : 5 officines démarchées en visite, 2 commandes de présentoir de 3 kits.", when: "Semaines 2-4", source: "Partenaire" },
  { n: "2 clients", how: "Stand Skin Diag lors d'un salon étudiant ou d'un marché de Noël : diagnostic sur tablette, envoi de la routine par e-mail.", when: "Semaine 3", source: "Salon" },
  { n: "1 client", how: "Parrainage : chaque premier client reçoit 150 feuilles s'il fait commander une amie.", when: "Semaine 4", source: "Parrainage" },
];

export const kpis = [
  { family: "Notoriété", items: [["Portée totale des 9 posts", "50 000 personnes en 4 semaines"], ["Abonnés gagnés", "+600 (TikTok + Instagram)"], ["Enregistrements des épingles", "≥ 400"]] },
  { family: "Engagement", items: [["Taux d'engagement moyen", "≥ 5 % (likes, commentaires, partages ÷ portée)"], ["Enregistrements des carrousels", "≥ 300"]] },
  { family: "Trafic et intérêt", items: [["Clics vers le site", "2 000"], ["Skin Diag terminés", "600 (30 % des visiteurs venus des réseaux)"]] },
  { family: "Conversion", items: [["Taux de conversion du site", "2 %"], ["Panier moyen", "50 € TTC"], ["Coût d'acquisition client", "< 15 €"]] },
  { family: "Fidélisation", items: [["Réachat à 90 jours", "≥ 30 %"], ["Inscrits newsletter", "+400"]] },
];
