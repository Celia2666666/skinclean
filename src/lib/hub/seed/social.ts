import { products } from "@/data/products";
import type { Product } from "@/lib/types";
import type { Design, Platform, Post, PostFormat, PostStatus, VideoScript, Visual } from "../types";
import { addDays, blackFriday, diffDays, parseLocal, todayYmd } from "../dates";
import { BRAND, tplCarousel, tplIngredient, tplProductHero, tplPromo, tplQuote, tplRoutine, tplStoryPoll, tplVideoCover } from "../templates";

/**
 * Générateur du calendrier éditorial initial (≈ 15 semaines à partir d'aujourd'hui) et de la bibliothèque réseaux sociaux.
 * Chaque semaine suit un thème pilier décliné sur tous les réseaux (méthode « 1 idée → 6 formats »),
 * avec des textes construits à partir des vraies fiches produits du site.
 */

const P = (id: string): Product => {
  const p = products.find((x) => x.id === id);
  if (!p) throw new Error(`Produit inconnu ${id}`);
  return p;
};
const shot = (p: Product) => p.media.packshot;
const video = (p: Product) => p.media.hoverVideo;

interface Theme {
  key: string; title: string; pillar: string; personaId: string; objective: string;
  main: string; others: string[]; ingredient: string; ingredientRole: string;
  tips: string[]; hook: string; myth: [string, string]; question: [string, string, string]; hashtags: string[];
  campaignId?: string; quote: string; fbQuestion: string; routine: { label: string; steps: string[] };
}

const THEMES: Theme[] = [
  {
    key: "glow", title: "Routine Glow", pillar: "Routines", personaId: "persona-ines", objective: "Engagement", campaignId: "camp-glow",
    main: "sc-sr-02", others: ["sc-tn-01", "sc-cr-01", "sc-sp-01"], ingredient: "Vitamine C", ingredientRole: "Antioxydant qui aide à raviver l'éclat et à unifier l'apparence du teint.",
    tips: ["Applique la vitamine C le matin, sur peau propre et sèche", "3 gouttes suffisent pour tout le visage", "Termine toujours par un SPF : il protège ton glow", "Garde ton flacon à l'abri de la lumière", "Si ta peau picote, commence un jour sur deux"],
    hook: "Le secret d'un teint lumineux le matin tient en 4 gestes.", myth: ["« La vitamine C, ça ne se met pas avant le soleil »", "Au contraire : le matin, avec un SPF par-dessus, c'est le duo idéal."],
    question: ["Ton teint au réveil, c'est plutôt…", "Lumineux", "Terne"], hashtags: ["#routineglow", "#vitaminec", "#glowskin", "#teintlumineux"],
    quote: "Le glow, c'est une routine, pas un filtre.", fbQuestion: "Quelle est ta routine du matin en 3 mots ?", routine: { label: "Routine glow du matin", steps: ["Dew Drop — toner hydratant", "Glow Shot — vitamine C", "Cloud Cream — hydratation légère", "Daily Shield SPF 50"] },
  },
  {
    key: "niacinamide", title: "La niacinamide sans blabla", pillar: "Skin School", personaId: "persona-lea", objective: "Notoriété",
    main: "sc-sr-01", others: ["sc-cl-02", "sc-cr-03"], ingredient: "Niacinamide", ingredientRole: "Vitamine B3 qui aide à réduire l'apparence des pores et à réguler l'aspect brillant.",
    tips: ["Matin et/ou soir, après le nettoyage", "Compatible avec la plupart des actifs, y compris l'acide hyaluronique", "Les résultats s'observent sur plusieurs semaines d'utilisation régulière", "Une couche fine suffit", "Associe-la à une crème non comédogène"],
    hook: "La niacinamide ne fait pas de miracle. Mais elle fait ça.", myth: ["« Plus c'est concentré, mieux c'est »", "Faux : une concentration adaptée et une utilisation régulière comptent plus que les chiffres."],
    question: ["Tu as déjà utilisé de la niacinamide ?", "Oui, j'adore", "Jamais testé"], hashtags: ["#niacinamide", "#peaugrasse", "#imperfections", "#skincaretips"],
    quote: "Moins de produits, plus de constance.", fbQuestion: "Pores visibles : ta zone la plus concernée ?", routine: { label: "Routine peau mixte", steps: ["Clear Foam — nettoyant", "Clear Skin — niacinamide 10 %", "Matte Balance — gel-crème", "Daily Shield SPF 50 (matin)"] },
  },
  {
    key: "hydratation", title: "Hydratation en 3 couches", pillar: "Routines", personaId: "persona-ines", objective: "Engagement",
    main: "sc-sr-03", others: ["sc-tn-01", "sc-cr-01"], ingredient: "Acide hyaluronique", ingredientRole: "Retient l'eau à la surface de la peau pour un effet repulpé et confortable.",
    tips: ["Applique l'acide hyaluronique sur peau encore humide", "Scelle toujours avec une crème", "Superpose : toner, sérum, crème", "Bois de l'eau, mais n'oublie pas l'hydratation topique", "En hiver, préfère une crème plus riche le soir"],
    hook: "Ta peau est déshydratée même si elle brille ? C'est possible.", myth: ["« Peau grasse = pas besoin d'hydrater »", "Faux : une peau grasse peut manquer d'eau. Choisis juste une texture légère."],
    question: ["Ta peau tiraille après la douche ?", "Souvent", "Jamais"], hashtags: ["#hydratation", "#acidehyaluronique", "#peaudeshydratee", "#glassskin"],
    quote: "Une peau hydratée est une peau qui rayonne.", fbQuestion: "Plutôt crème légère ou crème riche ?", routine: { label: "La méthode des 3 couches", steps: ["Dew Drop en 2 couches", "Aqua Plump sur peau humide", "Cloud Cream pour sceller"] },
  },
  {
    key: "sensible", title: "Peau sensible : la routine qui apaise", pillar: "Skin School", personaId: "persona-camille", objective: "Notoriété",
    main: "sc-sr-04", others: ["sc-cl-01", "sc-cr-04", "sc-sp-02"], ingredient: "Centella asiatica", ingredientRole: "Plante traditionnellement utilisée pour apaiser et réconforter les peaux réactives.",
    tips: ["Moins de produits = moins de risques de réaction", "Introduis un seul nouveau produit à la fois", "Fais un test dans le cou pendant 48 h", "Évite l'eau trop chaude", "Choisis un SPF minéral si ta peau réagit"],
    hook: "Ta peau rougit pour un rien ? Commence par retirer des produits.", myth: ["« Naturel = forcément doux »", "Faux : certains extraits naturels peuvent irriter. Une formule courte est souvent plus sûre."],
    question: ["Ta peau réagit aux nouveaux produits ?", "Très souvent", "Rarement"], hashtags: ["#peausensible", "#rougeurs", "#centella", "#barrierecutanee"],
    quote: "Une peau apaisée n'a pas besoin de dix produits.", fbQuestion: "Quel est ton pire souvenir de réaction cutanée ?", routine: { label: "Routine peau sensible", steps: ["Cloud Gel — nettoyant doux", "Calm Down — sérum centella", "Comfort Zone — crème apaisante", "Mineral Calm SPF 50"] },
  },
  {
    key: "kits", title: "Glow Friday : choisir mieux", pillar: "Offres & temps forts", personaId: "persona-ines", objective: "Trafic", campaignId: "camp-black-friday",
    main: "sc-cr-02", others: ["sc-sr-01", "sc-sr-02"], ingredient: "Routine complète", ingredientRole: "Un kit pensé pour un besoin précis, plutôt que des produits achetés au hasard.",
    tips: ["Fais ton Skin Diag avant d'acheter", "Un kit = une routine cohérente", "Évite d'accumuler des actifs similaires", "Pense aux mini-formats pour tester", "Achète ce que tu utiliseras vraiment"],
    hook: "Black Friday : ne prends pas tout. Prends ce qu'il faut à ta peau.", myth: ["« Plus j'achète, plus j'économise »", "Seulement si tu utilises tout. Une routine adaptée vaut mieux qu'une salle de bain pleine."],
    question: ["Tu prépares ta liste Glow Friday ?", "Déjà faite", "Pas encore"], hashtags: ["#glowfriday", "#blackfriday", "#routineskincare", "#kitskincare"],
    quote: "Choisir mieux plutôt que plus.", fbQuestion: "Quel kit irait le mieux à ta peau ?", routine: { label: "Quel kit pour ta peau ?", steps: ["Peau à imperfections : Acne Control", "Peau sèche : Winter Rescue", "Teint terne : Glass Skin Routine", "Peau déshydratée : Hydration Boost"] },
  },
  {
    key: "barriere", title: "Barrière cutanée", pillar: "Skin School", personaId: "persona-camille", objective: "Notoriété", campaignId: "camp-hiver",
    main: "sc-cr-02", others: ["sc-dm-02", "sc-sr-03", "sc-ms-01"], ingredient: "Céramides", ingredientRole: "Lipides présents naturellement dans la peau, essentiels au confort et à la protection de la barrière cutanée.",
    tips: ["Pause sur les exfoliants quand ta peau pique", "Nettoie avec des textures douces", "Applique ta crème sur peau légèrement humide", "Protège ton visage du vent et du froid", "Sois patiente : une barrière se répare en quelques semaines"],
    hook: "Ta peau pique, tiraille et rougit ? Ta barrière cutanée crie au secours.", myth: ["« Ça picote, donc ça agit »", "Non : un picotement persistant est souvent un signe d'irritation."],
    question: ["Ta peau tiraille avec le froid ?", "Oui, trop", "Pas du tout"], hashtags: ["#barrierecutanee", "#ceramides", "#peauseche", "#routinehiver"],
    quote: "Prendre soin de sa barrière, c'est prendre soin de tout le reste.", fbQuestion: "Ton geste réconfort préféré en hiver ?", routine: { label: "Routine cocon du soir", steps: ["Silk Off — lait démaquillant", "Aqua Plump — acide hyaluronique", "Velvet Barrier — crème céramides", "Hydra Bloom 1 à 2 fois / semaine"] },
  },
  {
    key: "exfoliation", title: "Exfolier sans agresser", pillar: "Skin School", personaId: "persona-lea", objective: "Engagement",
    main: "sc-ex-01", others: ["sc-tn-02", "sc-ex-02"], ingredient: "Enzymes & PHA", ingredientRole: "Exfoliants doux qui aident à lisser le grain de peau sans frotter.",
    tips: ["1 à 3 fois par semaine suffit", "Jamais le même soir qu'un rétinoïde", "Toujours un SPF le lendemain", "Arrête si ta peau devient sensible", "Commence par l'exfoliant le plus doux"],
    hook: "Tu exfolies tous les jours ? On doit parler.", myth: ["« Il faut sentir les grains pour que ça marche »", "Faux : les exfoliants enzymatiques et les acides doux agissent sans frotter."],
    question: ["Tu exfolies combien de fois par semaine ?", "1 à 2 fois", "Tous les jours"], hashtags: ["#exfoliation", "#grainsdepeau", "#bha", "#peaunette"],
    quote: "Exfolier, c'est révéler. Pas décaper.", fbQuestion: "Gommage à grains ou exfoliant doux : team quoi ?", routine: { label: "Semaine d'exfoliation douce", steps: ["Lundi : Polish Me", "Mercredi : Smooth Reset", "Vendredi : BHA Clear Liquid (zone T)", "Chaque matin : SPF 50"] },
  },
  {
    key: "yeux", title: "Le contour des yeux", pillar: "Produits", personaId: "persona-sarah", objective: "Engagement",
    main: "sc-ey-01", others: ["sc-ey-02"], ingredient: "Caféine", ingredientRole: "Actif qui aide à défatiguer le regard et à atténuer l'apparence des poches.",
    tips: ["Une noisette de la taille d'un grain de riz par œil", "Tapote avec l'annulaire, sans frotter", "Applique le soin sur l'os orbital", "Garde ton contour au frais pour un effet défatigant", "Le matin caféine, le soir peptides"],
    hook: "Tu appliques ton contour des yeux trop près de l'œil.", myth: ["« La crème visage suffit pour les yeux »", "Pas toujours : la peau du contour est plus fine et apprécie des textures dédiées."],
    question: ["Tu utilises un contour des yeux ?", "Tous les jours", "Jamais"], hashtags: ["#contourdesyeux", "#cernes", "#cafeine", "#regard"],
    quote: "Un regard reposé, en un geste.", fbQuestion: "Cernes ou poches : ton ennemi du matin ?", routine: { label: "Routine regard", steps: ["Matin : Bright Eyes caféine", "Tapoter avec l'annulaire", "Soir : Smooth Gaze peptides", "SPF jusqu'au bord de l'os orbital"] },
  },
  {
    key: "cadeaux", title: "Guide cadeaux Noël", pillar: "Offres & temps forts", personaId: "persona-sarah", objective: "Trafic", campaignId: "camp-noel",
    main: "sc-ms-01", others: ["sc-sr-02", "sc-cr-02"], ingredient: "Cadeau utile", ingredientRole: "Un soin adapté à la peau de la personne : un cadeau qu'on utilise vraiment.",
    tips: ["Peau grasse : un kit purifiant", "Peau sèche : une crème cocon", "Fan de glow : la vitamine C", "Indécis·e : un mini-format", "Pense au Skin Diag cadeau à faire ensemble"],
    hook: "Le cadeau que ta sœur va vraiment utiliser.", myth: ["« Un cadeau beauté, c'est impersonnel »", "Pas quand il est choisi pour sa peau."],
    question: ["Tu offres de la skincare à Noël ?", "Évidemment", "Jamais pensé"], hashtags: ["#ideecadeau", "#noel", "#cadeaubeaute", "#skincare"],
    quote: "Offre un glow.", fbQuestion: "Pour qui cherches-tu encore un cadeau ?", routine: { label: "Guide cadeaux par peau", steps: ["Peau grasse → Acne Control", "Peau sèche → Winter Rescue", "Teint terne → Glass Skin Routine", "Voyageuse → Travel Essentials"] },
  },
  {
    key: "masques", title: "Self-care & masques", pillar: "Communauté", personaId: "persona-ines", objective: "Engagement",
    main: "sc-ms-02", others: ["sc-ms-01"], ingredient: "Argiles", ingredientRole: "Absorbent l'excès de sébum et aident à désincruster les pores.",
    tips: ["Masque purifiant sur la zone T, hydratant sur les joues", "Ne laisse pas l'argile sécher complètement", "Rince à l'eau tiède", "1 à 2 fois par semaine", "Profites-en pour une pause sans écran"],
    hook: "Le multimasking, c'est la meilleure idée de ton dimanche.", myth: ["« Il faut laisser sécher l'argile pour qu'elle agisse »", "Non : quand elle craquelle, elle commence à assécher ta peau."],
    question: ["Ton moment self-care préféré ?", "Dimanche soir", "Après le sport"], hashtags: ["#selfcare", "#masquevisage", "#multimasking", "#sundayroutine"],
    quote: "Prendre 10 minutes pour soi n'est pas un luxe.", fbQuestion: "Masque du dimanche : quel est ton rituel ?", routine: { label: "Le multimasking du dimanche", steps: ["Pure Clay sur la zone T", "Hydra Bloom sur les joues", "10 minutes de pause", "Rinçage tiède + Cloud Cream"] },
  },
  {
    key: "nuit", title: "La routine du soir", pillar: "Routines", personaId: "persona-sarah", objective: "Notoriété",
    main: "sc-sr-06", others: ["sc-sr-05", "sc-cr-02"], ingredient: "Rétinal", ingredientRole: "Dérivé de la vitamine A qui accompagne le renouvellement de la peau pendant la nuit.",
    tips: ["Commence 2 soirs par semaine", "Une goutte de la taille d'un petit pois", "Jamais avec un acide exfoliant le même soir", "SPF obligatoire le matin", "Déconseillé pendant la grossesse : demande conseil à un professionnel"],
    hook: "Rétinal ou bakuchiol : lequel est fait pour toi ?", myth: ["« Le rétinol, c'est pour les peaux matures »", "Les dérivés de vitamine A conviennent dès les premières ridules, à introduire progressivement."],
    question: ["Tu utilises un rétinoïde ?", "Oui", "Ça me fait peur"], hashtags: ["#retinal", "#routinedusoir", "#premieresrides", "#nightroutine"],
    quote: "Ta peau travaille pendant que tu dors.", fbQuestion: "Ta routine du soir prend combien de minutes ?", routine: { label: "Routine du soir en 3 minutes", steps: ["Melt Away puis Cloud Gel", "Night Renew (2 soirs / semaine)", "First Lines les autres soirs", "Velvet Barrier pour finir"] },
  },
  {
    key: "journal", title: "Nouvelle année, Skin Journal", pillar: "Communauté", personaId: "persona-camille", objective: "Inscriptions", campaignId: "camp-skin-journal",
    main: "sc-tn-01", others: ["sc-cr-01"], ingredient: "Régularité", ingredientRole: "L'actif le plus sous-estimé : appliquer sa routine chaque jour pendant plusieurs semaines.",
    tips: ["Prends une photo à la même lumière chaque semaine", "Note ce que tu changes", "Ne change qu'un produit à la fois", "Compare à J30, pas à J2", "Sois bienveillante avec ta peau"],
    hook: "Jour 1. Pas de filtre. On se retrouve dans 30 jours.", myth: ["« Un bon produit agit en 3 jours »", "La peau se renouvelle en plusieurs semaines : la patience fait partie de la routine."],
    question: ["Tu relèves le défi 30 jours ?", "Je participe", "Je regarde"], hashtags: ["#skinjournal", "#30jourschallenge", "#vraiepeau", "#skincarejourney"],
    quote: "Les vrais progrès se voient sur 30 jours, pas sur 30 secondes.", fbQuestion: "Ta résolution skincare pour cette année ?", routine: { label: "Le défi Skin Journal", steps: ["J1 : photo + routine", "J7 : premier check-in", "J14 : on ajuste", "J30 : bilan honnête"] },
  },
  {
    key: "spf", title: "SPF même en hiver", pillar: "Skin School", personaId: "persona-sarah", objective: "Notoriété",
    main: "sc-sp-01", others: ["sc-sp-02"], ingredient: "Filtres UV", ingredientRole: "Protègent des UVA et UVB, présents même par temps gris.",
    tips: ["Les UVA traversent les nuages et les vitres", "La règle des 2 doigts pour le visage et le cou", "Dernière étape de la routine du matin", "Renouvelle si tu es en extérieur", "Indispensable avec les rétinoïdes et les acides"],
    hook: "Il fait gris, donc pas de SPF ? Mauvaise idée.", myth: ["« En hiver, le soleil ne compte pas »", "Les UVA sont présents toute l'année, même par temps couvert."],
    question: ["Tu mets un SPF en hiver ?", "Tous les jours", "Seulement l'été"], hashtags: ["#spf", "#protectionsolaire", "#spfeveryday", "#skincareroutine"],
    quote: "Le meilleur anti-âge, c'est le SPF.", fbQuestion: "SPF chimique ou minéral : tu préfères quoi ?", routine: { label: "Le SPF en 4 règles", steps: ["Dernière étape du matin", "2 doigts pour visage + cou", "Toute l'année", "Renouveler en extérieur"] },
  },
  {
    key: "demaquillage", title: "Le double nettoyage", pillar: "Routines", personaId: "persona-ines", objective: "Engagement",
    main: "sc-dm-01", others: ["sc-cl-01", "sc-dm-02"], ingredient: "Huiles végétales", ingredientRole: "Dissolvent le maquillage et le SPF sans frotter.",
    tips: ["Baume sur peau sèche, puis émulsionne avec un peu d'eau", "Masse 1 minute pour tout dissoudre", "Puis nettoyant doux", "Le soir uniquement", "Utile même sans maquillage si tu portes un SPF"],
    hook: "Ton nettoyant ne retire pas ton SPF. Voilà pourquoi.", myth: ["« Le double nettoyage assèche »", "Pas avec des textures douces : c'est même plus respectueux que frotter."],
    question: ["Tu pratiques le double nettoyage ?", "Oui, tous les soirs", "C'est quoi ?"], hashtags: ["#doublenettoyage", "#demaquillage", "#cleansingbalm", "#routinedusoir"],
    quote: "Une peau propre est une peau prête.", fbQuestion: "Lingettes, eau micellaire ou baume ?", routine: { label: "Le double nettoyage", steps: ["Melt Away sur peau sèche", "Émulsionner avec de l'eau", "Cloud Gel pour nettoyer", "Rincer et tapoter"] },
  },
  {
    key: "imperfections", title: "SOS imperfections", pillar: "Produits", personaId: "persona-lea", objective: "Notoriété", campaignId: "camp-anti-imperfections",
    main: "sc-pt-01", others: ["sc-pt-02", "sc-ex-02", "sc-sr-01"], ingredient: "Hydrocolloïde", ingredientRole: "Matière des patchs qui isole l'imperfection et limite la tentation d'y toucher.",
    tips: ["Pose le patch sur peau propre et sèche", "Ne perce pas : protège", "Spot Hero Day le jour, Night la nuit", "Change le patch quand il blanchit", "Si les imperfections sont nombreuses et persistantes, consulte un professionnel"],
    hook: "Le bouton de la veille d'un rendez-vous : le plan d'urgence.", myth: ["« Le dentifrice sèche les boutons »", "Il peut surtout irriter. Un patch dédié est bien plus doux."],
    question: ["Tu touches tes boutons ?", "Je résiste", "Je craque"], hashtags: ["#imperfections", "#patchbouton", "#acne", "#peaunette"],
    quote: "On protège, on ne perce pas.", fbQuestion: "Ton astuce anti-bouton de dernière minute ?", routine: { label: "Le plan SOS bouton", steps: ["Nettoyer en douceur", "Patch Spot Hero", "Ne pas toucher", "Clear Skin pour prévenir"] },
  },
  {
    key: "ridules", title: "Premières ridules", pillar: "Skin School", personaId: "persona-sarah", objective: "Engagement",
    main: "sc-sr-05", others: ["sc-ey-02", "sc-sr-06"], ingredient: "Bakuchiol", ingredientRole: "Actif d'origine végétale souvent choisi comme alternative douce au rétinol.",
    tips: ["Commence par la prévention : SPF quotidien", "Le bakuchiol se tolère bien, matin et soir", "Hydrate toujours après", "Les peptides complètent bien la routine", "Patience : on juge sur 8 semaines"],
    hook: "Tes premières ridules ? Pas de panique, juste les bons gestes.", myth: ["« Il faut un anti-âge dès 20 ans »", "Le premier anti-âge, c'est le SPF. Le reste vient quand tu en ressens le besoin."],
    question: ["Tu as commencé une routine anti-âge ?", "Oui", "Pas encore"], hashtags: ["#premieresrides", "#bakuchiol", "#antiage", "#peptides"],
    quote: "Bien vieillir commence par bien prendre soin.", fbQuestion: "À quel âge as-tu commencé ta routine ?", routine: { label: "Routine premières ridules", steps: ["Matin : First Lines + SPF", "Soir : Night Renew (progressif)", "Contour : Smooth Gaze", "Velvet Barrier si peau sèche"] },
  },
];

/* ───────── Textes ───────── */
const tag = (t: Theme) => [...t.hashtags, "#skinclean", "#yourskinyourglow"];
const SKIN_DIAG_CTA = "Fais ton Skin Diag gratuit (lien en bio)";

const igCarouselCaption = (t: Theme, p: Product) =>
  `${t.title} : le guide à enregistrer 📌\n\n${t.tips.map((x, i) => `${i + 1}. ${x}`).join("\n")}\n\nTon allié de la semaine : ${p.name}, ${p.kind.toLowerCase()} — ${p.tagline.toLowerCase()}.\n\nEnregistre ce post pour ta prochaine routine et partage-le à la personne qui en a besoin.\n\nRésultats variables selon les peaux.`;
const productCaption = (p: Product) =>
  `${p.name} — ${p.kind}\n${p.tagline}.\n\n${p.description}\n\n✔︎ ${p.benefits.join("\n✔︎ ")}\n\nComment l'utiliser : ${p.usage}\n\n${p.variants[0].size} · ${p.variants[0].price.toFixed(2).replace(".", ",")} €`;
const ingredientCaption = (t: Theme, p: Product) =>
  `Focus actif : ${t.ingredient}\n\n${t.ingredientRole}\n\nOù le trouver chez SKINCLEAN ? Dans ${p.name} (${p.kind.toLowerCase()}).\n\nTon conseil : ${t.tips[0].toLowerCase()}.\n\nUne question sur cet actif ? Pose-la en commentaire, on répond à tout 💬`;
const reelCaption = (t: Theme, p: Product) =>
  `${t.hook}\n\nDans cette vidéo : ${p.name} en action et nos conseils pour l'intégrer à ta routine.\n\n${t.tips.slice(0, 3).map((x) => `→ ${x}`).join("\n")}\n\n${SKIN_DIAG_CTA}.`;
const tiktokScript = (t: Theme, p: Product, kind: "hook" | "tuto" | "mythe" | "texture"): VideoScript => {
  if (kind === "mythe")
    return { hook: t.myth[0], duration: "20-25 s", sound: "Son tendance calme", scenes: [
      { t: "0-3 s", shot: "Face cam, texte « MYTHE » en rouge", onScreen: t.myth[0], voice: `On entend souvent : ${t.myth[0]}` },
      { t: "3-12 s", shot: "Plan rapproché produit, mains", onScreen: "VRAI OU FAUX ?", voice: t.myth[1] },
      { t: "12-20 s", shot: `Application de ${p.name}`, onScreen: t.tips[0], voice: `Le bon réflexe : ${t.tips[0].toLowerCase()}.` },
      { t: "20-25 s", shot: "Face cam + packshot", onScreen: "Ton Skin Diag gratuit → lien en bio", voice: "Et pour savoir ce qu'il faut à ta peau, fais le Skin Diag." },
    ] };
  if (kind === "tuto")
    return { hook: `Comment bien utiliser ${p.name} (la plupart des gens se trompent)`, duration: "30 s", sound: "Voix off + musique douce", scenes: [
      { t: "0-3 s", shot: "Gros plan flacon", onScreen: `${p.name} : le mode d'emploi`, voice: `Tu utilises ${p.name} ? Voilà comment en tirer le meilleur.` },
      { t: "3-15 s", shot: "Démonstration du geste", onScreen: p.usage.split(".")[0], voice: p.usage },
      { t: "15-25 s", shot: "Texture sur la peau", onScreen: p.tips[0] ?? t.tips[1], voice: p.tips[0] ?? t.tips[1] },
      { t: "25-30 s", shot: "Résultat lumière naturelle (sans filtre)", onScreen: "Enregistre pour plus tard", voice: "Enregistre la vidéo pour ta prochaine routine." },
    ] };
  if (kind === "texture")
    return { hook: `ASMR : la texture de ${p.name}`, duration: "15 s", sound: "Son ASMR naturel, pas de musique", scenes: [
      { t: "0-3 s", shot: "Ouverture du flacon, gros plan", onScreen: p.textureLabel, voice: "" },
      { t: "3-10 s", shot: "Texture étalée sur le dos de la main", onScreen: p.tagline, voice: "" },
      { t: "10-15 s", shot: "Application visage", onScreen: `${p.name} · ${p.kind}`, voice: "" },
    ] };
  return { hook: t.hook, duration: "20-30 s", sound: "Son tendance du moment (vérifier les droits d'usage commercial)", scenes: [
    { t: "0-3 s", shot: "Face cam, regard caméra", onScreen: t.hook, voice: t.hook },
    { t: "3-10 s", shot: "Plan mains + produit", onScreen: t.ingredient, voice: t.ingredientRole },
    { t: "10-22 s", shot: "Routine étape par étape", onScreen: t.routine.steps.slice(0, 3).join(" → "), voice: `Ma routine : ${t.routine.steps.join(", ")}.` },
    { t: "22-30 s", shot: "Résultat + logo", onScreen: "Skin Diag gratuit → lien en bio", voice: "Fais ton Skin Diag pour trouver la tienne." },
  ] };
};
const tiktokCaption = (t: Theme, p: Product, s: VideoScript) => `${s.hook} ${t.hashtags.slice(0, 2).join(" ")}\n\n${p.name} · ${p.kind}. ${SKIN_DIAG_CTA}.`;

/* ───────── Construction des posts ───────── */
let seq = 0;
const now = new Date().toISOString();
interface MakeInput {
  date: string; platform: Platform; format: PostFormat; title: string; theme: Theme; caption: string; hashtags: string[]; cta: string;
  productIds: string[]; visual?: Visual; script?: VideoScript; slides?: string[]; objective?: string; status: PostStatus; emailId?: string; articleId?: string;
}
const make = (m: MakeInput): Post => ({
  id: `post_${(++seq).toString().padStart(4, "0")}`,
  title: m.title, date: m.date, platform: m.platform, format: m.format, objective: m.objective ?? m.theme.objective, pillar: m.theme.pillar,
  personaId: m.theme.personaId, campaignId: m.theme.campaignId, visual: m.visual, caption: m.caption, hashtags: m.hashtags, cta: m.cta,
  productIds: m.productIds, status: m.status, comments: [], script: m.script, slides: m.slides, emailId: m.emailId, articleId: m.articleId,
  createdAt: now, updatedAt: now,
});
const design = (d: Design): Visual => ({ kind: "design", design: d });
const videoVisual = (p: Product, cover: Design): Visual =>
  video(p) ? { kind: "video", src: video(p), poster: cover, note: "Vidéo de démonstration libre de droits (Pexels) — à remplacer par le tournage SKINCLEAN." } : design(cover);

/** Statut initial selon l'éloignement : contenus proches à valider, contenus lointains en brouillon préparé. */
const statusFor = (date: string, t0: string): PostStatus => (diffDays(date, t0) <= 10 ? "a_valider" : "brouillon");

/** Fréquences hebdomadaires (jours 0 = lundi). Ajustables ensuite dans les paramètres. */
const SLOTS: { platform: Platform; days: number[]; hour: string }[] = [
  { platform: "instagram", days: [0, 2, 4, 6], hour: "18:00" },
  { platform: "story", days: [0, 1, 2, 3, 4], hour: "12:00" },
  { platform: "tiktok", days: [1, 3, 5, 6], hour: "19:00" },
  { platform: "facebook", days: [0, 2, 4], hour: "13:00" },
  { platform: "pinterest", days: [0, 1, 2, 3, 4], hour: "20:30" },
];

function weekPosts(t: Theme, monday: string, t0: string): Post[] {
  const main = P(t.main);
  const others = t.others.map(P);
  const out: Post[] = [];
  const at = (dayIdx: number, hour: string) => `${addDays(monday, dayIdx)}T${hour}`;
  const keep = (d: string) => d.slice(0, 10) >= t0;

  // Instagram ×4
  const ig = SLOTS[0].days;
  const igList: (() => Post)[] = [
    () => make({ date: at(ig[0], "12:30"), platform: "instagram", format: "carrousel", title: `${t.title} — le guide`, theme: t, caption: igCarouselCaption(t, main), hashtags: tag(t), cta: "Enregistre le post", productIds: [main.id, ...t.others], slides: t.tips,
      visual: design(tplCarousel({ headline: t.title, items: t.tips, packshot: shot(main), eyebrow: t.pillar, cta: "Trouve ta routine avec le Skin Diag" })), status: statusFor(at(ig[0], "12:30"), t0) }),
    () => make({ date: at(ig[1], "18:00"), platform: "instagram", format: "reel", title: `Reel — ${t.hook.slice(0, 60)}`, theme: t, caption: reelCaption(t, main), hashtags: tag(t), cta: SKIN_DIAG_CTA, productIds: [main.id],
      visual: videoVisual(main, tplVideoCover({ headline: t.hook, packshot: shot(main) })), script: tiktokScript(t, main, "hook"), status: statusFor(at(ig[1], "18:00"), t0) }),
    () => make({ date: at(ig[2], "18:00"), platform: "instagram", format: "post", title: `${main.name} en majesté`, theme: t, caption: productCaption(main), hashtags: tag(t), cta: "Découvre-le sur skinclean.fr", productIds: [main.id],
      visual: design(tplProductHero({ headline: main.tagline, eyebrow: `${main.name} · ${main.kind}`, sub: main.benefits[0], packshot: shot(main), bg: main.color.bg })), status: statusFor(at(ig[2], "18:00"), t0) }),
    () => make({ date: at(ig[3], "11:00"), platform: "instagram", format: "post", title: `Focus actif : ${t.ingredient}`, theme: t, caption: ingredientCaption(t, main), hashtags: tag(t), cta: "Pose ta question en commentaire", productIds: [main.id],
      visual: design(tplIngredient({ headline: t.ingredient, sub: t.ingredientRole, packshot: shot(main) })), status: statusFor(at(ig[3], "11:00"), t0) }),
  ];
  igList.forEach((f) => { const p = f(); if (keep(p.date)) out.push(p); });

  // Stories ×5
  const st = SLOTS[1].days;
  const stories: (() => Post)[] = [
    () => make({ date: at(st[0], "12:00"), platform: "story", format: "story", title: `Story sondage — ${t.question[0]}`, theme: t, caption: `Sticker sondage : « ${t.question[0]} » (${t.question[1]} / ${t.question[2]}). Le lendemain, partager les résultats et un conseil.`, hashtags: [], cta: "Réponds au sondage", productIds: [main.id],
      visual: design(tplStoryPoll({ headline: t.question[0], items: [t.question[1], t.question[2]], packshot: shot(main) })), status: statusFor(at(st[0], "12:00"), t0) }),
    () => make({ date: at(st[1], "12:00"), platform: "story", format: "story", title: "Story — Découverte du Skin Diag", theme: t, caption: "Story en 3 écrans : 1. « Tu sais vraiment quel est ton type de peau ? » 2. Capture du Skin Diag. 3. Sticker lien vers skinclean.fr/skin-diag.", hashtags: [], cta: "Fais ton Skin Diag", productIds: [],
      visual: design(tplStoryPoll({ eyebrow: "Skin Diag", headline: "Ta routine idéale en 2 minutes ?", items: ["Je teste", "Plus tard"] })), objective: "Skin Diag", status: statusFor(at(st[1], "12:00"), t0) }),
    () => make({ date: at(st[2], "12:00"), platform: "story", format: "story", title: `Story conseil — ${t.tips[1]}`, theme: t, caption: `Conseil express : ${t.tips[1]}. Ajouter un sticker question « Une question sur ta routine ? ».`, hashtags: [], cta: "Pose ta question", productIds: [main.id],
      visual: design(tplProductHero({ format: "story", headline: t.tips[1], eyebrow: "Conseil express", packshot: shot(main), bg: BRAND.sageSoft })), status: statusFor(at(st[2], "12:00"), t0) }),
    () => make({ date: at(st[3], "12:00"), platform: "story", format: "story", title: "Story coulisses — préparation des commandes", theme: { ...t, pillar: "Communauté" }, caption: "Coulisses : préparation des colis, petit mot manuscrit, emballage recyclable (à confirmer avant publication).", hashtags: [], cta: "Envoie-nous un cœur", productIds: [],
      visual: design(tplQuote({ format: "story", headline: "Dans les coulisses de SKINCLEAN", sub: "Préparation des colis de la semaine", bg: BRAND.sage })), status: statusFor(at(st[3], "12:00"), t0) }),
    () => make({ date: at(st[4], "12:00"), platform: "story", format: "story", title: "Story — -20 % avec la newsletter", theme: { ...t, campaignId: "camp-newsletter20" }, caption: "Story offre : -20 % sur la première commande avec l'inscription newsletter. Sticker lien vers l'inscription. Mention : conditions sur skinclean.fr.", hashtags: [], cta: "Je m'inscris", productIds: [],
      visual: design(tplPromo({ format: "story", packshot: shot(others[0] ?? main) })), objective: "Inscriptions", status: statusFor(at(st[4], "12:00"), t0) }),
  ];
  stories.forEach((f) => { const p = f(); if (keep(p.date)) out.push(p); });

  // TikTok ×4
  const tt = SLOTS[2].days;
  const kinds: ("hook" | "tuto" | "mythe" | "texture")[] = ["hook", "tuto", "mythe", "texture"];
  kinds.forEach((k, i) => {
    const prod = k === "tuto" || k === "texture" ? (others[i % Math.max(others.length, 1)] ?? main) : main;
    const s = tiktokScript(t, prod, k);
    const date = at(tt[i], "19:00");
    if (!keep(date)) return;
    out.push(make({ date, platform: "tiktok", format: "video", title: k === "hook" ? t.hook : k === "tuto" ? `Tuto ${prod.name}` : k === "mythe" ? `Mythe ou réalité : ${t.myth[0].replace(/[«»]/g, "").trim()}` : `ASMR texture ${prod.name}`,
      theme: t, caption: tiktokCaption(t, prod, s), hashtags: [...t.hashtags.slice(0, 3), "#skincaretok", "#skinclean"], cta: SKIN_DIAG_CTA, productIds: [prod.id], script: s,
      visual: videoVisual(prod, tplVideoCover({ headline: s.hook, packshot: shot(prod) })), status: statusFor(date, t0) }));
  });

  // Facebook ×3
  const fb = SLOTS[3].days;
  const fbList: (() => Post)[] = [
    () => make({ date: at(fb[0], "13:00"), platform: "facebook", format: "post", title: `${main.name} : pour qui, comment ?`, theme: t, caption: `${productCaption(main)}\n\nPour quelles peaux ? ${main.skinTypes.length >= 4 ? "Toutes les peaux" : main.skinTypes.join(", ")}.\n\nDes questions ? Notre équipe répond en commentaire.`, hashtags: ["#skinclean"], cta: "Découvrir le produit", productIds: [main.id],
      visual: design(tplProductHero({ format: "facebook", headline: main.tagline, eyebrow: main.name, sub: main.benefits[0], packshot: shot(main), bg: main.color.bg })), status: statusFor(at(fb[0], "13:00"), t0) }),
    () => make({ date: at(fb[1], "13:00"), platform: "facebook", format: "carrousel", title: `${t.routine.label}`, theme: t, caption: `${t.routine.label} ✨\n\n${t.routine.steps.map((x, i) => `${i + 1}. ${x}`).join("\n")}\n\nEt toi, quelle étape tu ne sautes jamais ?`, hashtags: ["#routine", "#skinclean"], cta: "Partage ta routine", productIds: [main.id, ...t.others],
      visual: design(tplRoutine({ format: "facebook", headline: t.routine.label, items: t.routine.steps, packshots: [main, ...others].map(shot).filter(Boolean) as string[] })), status: statusFor(at(fb[1], "13:00"), t0) }),
    () => make({ date: at(fb[2], "13:00"), platform: "facebook", format: "post", title: `Question communauté — ${t.fbQuestion}`, theme: { ...t, pillar: "Communauté" }, caption: `${t.fbQuestion}\n\nOn lit toutes vos réponses (et on prépare un post avec vos meilleures astuces) 💬`, hashtags: ["#skinclean"], cta: "Réponds en commentaire", productIds: [],
      visual: design(tplQuote({ format: "facebook", headline: t.fbQuestion, sub: "Dis-nous tout en commentaire", bg: BRAND.sageDeep })), status: statusFor(at(fb[2], "13:00"), t0) }),
  ];
  fbList.forEach((f) => { const p = f(); if (keep(p.date)) out.push(p); });

  // Pinterest ×5
  const pi = SLOTS[4].days;
  const pins: (() => Post)[] = [
    () => make({ date: at(pi[0], "20:30"), platform: "pinterest", format: "epingle", title: t.routine.label, theme: t, caption: `${t.routine.label} — ${t.routine.steps.join(" · ")}. Routine skincare simple et efficace par SKINCLEAN.`, hashtags: [], cta: "Voir la routine", productIds: [main.id, ...t.others],
      visual: design(tplRoutine({ headline: t.routine.label, items: t.routine.steps, packshots: [main, ...others].map(shot).filter(Boolean) as string[] })), status: statusFor(at(pi[0], "20:30"), t0) }),
    () => make({ date: at(pi[1], "20:30"), platform: "pinterest", format: "epingle", title: `${t.ingredient} : bienfaits et utilisation`, theme: t, caption: `${t.ingredient} : ${t.ingredientRole} Conseils d'utilisation et routine adaptée.`, hashtags: [], cta: "Lire le guide", productIds: [main.id],
      visual: design(tplIngredient({ format: "pinterest", headline: t.ingredient, sub: t.ingredientRole, packshot: shot(main) })), status: statusFor(at(pi[1], "20:30"), t0) }),
    () => make({ date: at(pi[2], "20:30"), platform: "pinterest", format: "epingle", title: `${t.tips.length} conseils — ${t.title}`, theme: t, caption: `${t.title} : ${t.tips.join(". ")}.`, hashtags: [], cta: "Enregistrer", productIds: [main.id],
      visual: design(tplRoutine({ headline: t.title, eyebrow: "Conseils", items: t.tips.slice(0, 5), bg: BRAND.cream })), status: statusFor(at(pi[2], "20:30"), t0) }),
    () => make({ date: at(pi[3], "20:30"), platform: "pinterest", format: "epingle", title: `${main.name} — ${main.kind}`, theme: t, caption: `${main.name}, ${main.kind.toLowerCase()} : ${main.tagline}. ${main.benefits.join(", ")}.`, hashtags: [], cta: "Découvrir", productIds: [main.id],
      visual: design(tplProductHero({ format: "pinterest", headline: main.tagline, eyebrow: main.name, sub: main.kind, packshot: shot(main), bg: main.color.bg })), status: statusFor(at(pi[3], "20:30"), t0) }),
    () => make({ date: at(pi[4], "20:30"), platform: "pinterest", format: "epingle", title: `Inspiration — ${t.quote}`, theme: t, caption: `${t.quote} — Inspiration skincare et self-care par SKINCLEAN.`, hashtags: [], cta: "Enregistrer", productIds: [],
      visual: design(tplQuote({ format: "pinterest", headline: t.quote, bg: BRAND.forest })), status: statusFor(at(pi[4], "20:30"), t0) }),
  ];
  pins.forEach((f) => { const p = f(); if (keep(p.date)) out.push(p); });
  return out;
}

/** Thème de la semaine : les temps forts (Black Friday, Noël, Nouvel An) sont placés à leur date. */
function themeForWeek(monday: string, index: number): Theme {
  const sunday = addDays(monday, 6);
  const bf = blackFriday(monday);
  const byKey = (k: string) => THEMES.find((x) => x.key === k)!;
  if (bf >= monday && bf <= sunday) return byKey("kits");
  const m = parseLocal(monday);
  if (m.getMonth() === 11 && m.getDate() >= 7 && m.getDate() <= 20) return byKey("cadeaux");
  if ((m.getMonth() === 11 && m.getDate() >= 29) || (m.getMonth() === 0 && m.getDate() <= 4)) return byKey("journal");
  const rotation = THEMES.filter((x) => !["kits", "cadeaux", "journal"].includes(x.key));
  return rotation[index % rotation.length];
}

export interface CalendarSeed { posts: Post[]; weeks: { monday: string; theme: string }[] }

export function buildCalendar(weeks = 15): CalendarSeed {
  const t0 = todayYmd();
  const firstMonday = addDays(t0, -((parseLocal(t0).getDay() + 6) % 7));
  const posts: Post[] = [];
  const meta: CalendarSeed["weeks"] = [];
  for (let w = 0; w < weeks; w++) {
    const monday = addDays(firstMonday, w * 7);
    const theme = themeForWeek(monday, w);
    meta.push({ monday, theme: theme.title });
    posts.push(...weekPosts(theme, monday, t0));
  }
  // Programme du jour (exemple du cahier des charges) : on remplace les créneaux du jour par les 3 actions phares.
  const glow = THEMES[0];
  const nia = THEMES[1];
  const today = posts.filter((p) => p.date.slice(0, 10) !== t0 || !["instagram", "story", "tiktok"].includes(p.platform));
  const gs = P("sc-sr-02");
  const cs = P("sc-sr-01");
  const s = tiktokScript(nia, cs, "hook");
  today.push(
    make({ date: `${t0}T10:00`, platform: "instagram", format: "carrousel", title: "Routine Glow — 4 gestes pour un teint lumineux", theme: glow, caption: igCarouselCaption(glow, gs), hashtags: tag(glow), cta: "Enregistre le post", productIds: ["sc-tn-01", "sc-sr-02", "sc-cr-01", "sc-sp-01"], slides: glow.routine.steps,
      visual: design(tplCarousel({ headline: "Routine Glow", eyebrow: "Routine du matin", items: glow.routine.steps, packshot: shot(gs) })), status: "valide" }),
    make({ date: `${t0}T12:00`, platform: "story", format: "story", title: "Story — Découverte du Skin Diag", theme: glow, caption: "Story en 3 écrans : 1. « Tu sais vraiment quel est ton type de peau ? » 2. Capture du Skin Diag. 3. Sticker lien vers skinclean.fr/skin-diag.", hashtags: [], cta: "Fais ton Skin Diag", productIds: [],
      visual: design(tplStoryPoll({ eyebrow: "Skin Diag", headline: "Ta routine idéale en 2 minutes ?", items: ["Je teste", "Plus tard"] })), objective: "Skin Diag", status: "a_valider" }),
    make({ date: `${t0}T18:00`, platform: "tiktok", format: "video", title: "Sérum niacinamide : ce qu'il fait vraiment", theme: nia, caption: tiktokCaption(nia, cs, s), hashtags: ["#niacinamide", "#peaugrasse", "#skincaretok", "#skinclean"], cta: SKIN_DIAG_CTA, productIds: ["sc-sr-01"], script: s,
      visual: videoVisual(cs, tplVideoCover({ headline: "La niacinamide sans blabla", packshot: shot(cs) })), status: "a_valider" }),
  );
  return { posts: today.sort((a, b) => a.date.localeCompare(b.date)), weeks: meta };
}

/** Bibliothèque de contenus prêts à l'emploi (non planifiés), par réseau et catégorie. */
export function buildLibrary(): Post[] {
  const t = THEMES;
  const lib: Post[] = [];
  const add = (cat: string, p: Post) => lib.push({ ...p, library: true, libraryCategory: cat, status: "valide", date: "" });
  const d = "";
  const th = (k: string) => t.find((x) => x.key === k)!;

  // Instagram
  for (const k of ["niacinamide", "sensible", "exfoliation", "spf"]) {
    const x = th(k); const p = P(x.main);
    add("Carrousels éducatifs", make({ date: d, platform: "instagram", format: "carrousel", title: `${x.title} — carrousel`, theme: x, caption: igCarouselCaption(x, p), hashtags: tag(x), cta: "Enregistre le post", productIds: [p.id], slides: x.tips, visual: design(tplCarousel({ headline: x.title, items: x.tips, packshot: shot(p) })), status: "valide" }));
  }
  for (const k of ["glow", "hydratation", "demaquillage"]) {
    const x = th(k); const p = P(x.main);
    add("Reels skincare", make({ date: d, platform: "instagram", format: "reel", title: `Reel — ${x.hook}`, theme: x, caption: reelCaption(x, p), hashtags: tag(x), cta: SKIN_DIAG_CTA, productIds: [p.id], script: tiktokScript(x, p, "hook"), visual: videoVisual(p, tplVideoCover({ headline: x.hook, packshot: shot(p) })), status: "valide" }));
  }
  for (const id of ["sc-sr-03", "sc-cr-01", "sc-sp-01", "sc-ms-01"]) {
    const p = P(id); const x = th("glow");
    add("Présentations produits", make({ date: d, platform: "instagram", format: "post", title: `${p.name} — présentation`, theme: { ...x, pillar: "Produits" }, caption: productCaption(p), hashtags: ["#skinclean", "#skincare"], cta: "Découvre-le sur skinclean.fr", productIds: [p.id], visual: design(tplProductHero({ headline: p.tagline, eyebrow: `${p.name} · ${p.kind}`, sub: p.benefits[0], packshot: shot(p), bg: p.color.bg })), status: "valide" }));
  }
  add("Stories promotionnelles", make({ date: d, platform: "story", format: "story", title: "Story -20 % newsletter", theme: th("glow"), caption: "Story offre de bienvenue avec sticker lien.", hashtags: [], cta: "Je m'inscris", productIds: [], visual: design(tplPromo({ format: "story", packshot: shot(P("sc-sr-03")) })), status: "valide" }));
  add("Stories promotionnelles", make({ date: d, platform: "story", format: "story", title: "Story Glow Friday", theme: th("kits"), caption: "Story temps fort, compte à rebours.", hashtags: [], cta: "Voir les kits", productIds: [], visual: design(tplPromo({ format: "story", eyebrow: "Glow Friday", headline: "Kits", sub: "Nos routines complètes à prix doux, pour choisir mieux plutôt que plus.", cta: "Voir les kits" })), status: "valide" }));
  for (const id of ["sc-sr-02", "sc-sr-06", "sc-dm-01"]) {
    const p = P(id); const x = th("nuit");
    add("Conseils d'application", make({ date: d, platform: "instagram", format: "carrousel", title: `Comment appliquer ${p.name}`, theme: x, caption: `Comment appliquer ${p.name} ?\n\n${p.usage}\n\n${p.tips.map((y) => `→ ${y}`).join("\n")}`, hashtags: ["#skinclean", "#tutoskincare"], cta: "Enregistre le tuto", productIds: [p.id], slides: [p.usage, ...p.tips], visual: design(tplCarousel({ headline: `Appliquer ${p.name}`, eyebrow: "Tuto", items: [p.usage, ...p.tips].slice(0, 4), packshot: shot(p) })), status: "valide" }));
  }
  for (const k of ["sensible", "niacinamide", "exfoliation"]) {
    const x = th(k);
    add("Quiz interactifs", make({ date: d, platform: "story", format: "story", title: `Quiz — ${x.question[0]}`, theme: x, caption: `Sticker quiz : ${x.question[0]} Réponses : ${x.question[1]} / ${x.question[2]}.`, hashtags: [], cta: "Réponds au quiz", productIds: [x.main], visual: design(tplStoryPoll({ headline: x.question[0], items: [x.question[1], x.question[2]], packshot: shot(P(x.main)) })), status: "valide" }));
  }
  for (const k of ["barriere", "ridules", "imperfections", "yeux"]) {
    const x = th(k); const p = P(x.main);
    add("Publications ingrédients", make({ date: d, platform: "instagram", format: "post", title: `Focus actif : ${x.ingredient}`, theme: x, caption: ingredientCaption(x, p), hashtags: tag(x), cta: "Pose ta question", productIds: [p.id], visual: design(tplIngredient({ headline: x.ingredient, sub: x.ingredientRole, packshot: shot(p) })), status: "valide" }));
  }
  const j = th("journal");
  add("Skin Journal", make({ date: d, platform: "instagram", format: "carrousel", title: "Le Skin Journal en 5 slides", theme: j, caption: "Le Skin Journal, c'est ton carnet de suivi sur 30 jours : photos privées, notes, routine, rappels J7/J14/J30.\n\nTes photos restent privées et tu peux tout supprimer à tout moment.\n\nDisponible dans ton compte SKINCLEAN.", hashtags: tag(j), cta: "Commencer mon Skin Journal", productIds: [], slides: j.tips, visual: design(tplCarousel({ headline: "Le Skin Journal", eyebrow: "30 jours", items: j.tips, cta: "Commence ton Skin Journal" })), status: "valide" }));
  add("Skin Journal", make({ date: d, platform: "instagram", format: "reel", title: "Skin Journal — Jour 1", theme: j, caption: `${j.hook}\n\nRejoins le défi 30 jours avec le Skin Journal.`, hashtags: tag(j), cta: "Commencer", productIds: [], script: tiktokScript(j, P("sc-tn-01"), "hook"), visual: design(tplVideoCover({ headline: j.hook })), status: "valide" }));

  // TikTok — concepts complets
  for (const k of ["niacinamide", "glow", "sensible", "imperfections", "demaquillage", "spf"]) {
    const x = th(k); const p = P(x.main);
    for (const kind of ["hook", "mythe"] as const) {
      const s = tiktokScript(x, p, kind);
      add("Concepts TikTok", make({ date: d, platform: "tiktok", format: "video", title: kind === "hook" ? x.hook : `Mythe : ${x.myth[0].replace(/[«»]/g, "").trim()}`, theme: x, caption: tiktokCaption(x, p, s), hashtags: [...x.hashtags.slice(0, 3), "#skincaretok"], cta: SKIN_DIAG_CTA, productIds: [p.id], script: s, visual: videoVisual(p, tplVideoCover({ headline: s.hook, packshot: shot(p) })), status: "valide" }));
    }
  }
  // Facebook
  for (const k of ["barriere", "nuit", "masques"]) {
    const x = th(k); const p = P(x.main);
    add("Posts Facebook", make({ date: d, platform: "facebook", format: "post", title: x.routine.label, theme: x, caption: `${x.routine.label}\n\n${x.routine.steps.map((y, i) => `${i + 1}. ${y}`).join("\n")}`, hashtags: ["#skinclean"], cta: "Découvrir", productIds: [p.id], visual: design(tplRoutine({ format: "facebook", headline: x.routine.label, items: x.routine.steps, packshots: [shot(p)].filter(Boolean) as string[] })), status: "valide" }));
  }
  // Pinterest
  for (const k of ["glow", "hydratation", "barriere", "ridules", "demaquillage"]) {
    const x = th(k);
    add("Épingles Pinterest", make({ date: d, platform: "pinterest", format: "epingle", title: x.routine.label, theme: x, caption: `${x.routine.label} — ${x.routine.steps.join(" · ")}`, hashtags: [], cta: "Voir la routine", productIds: [x.main, ...x.others], visual: design(tplRoutine({ headline: x.routine.label, items: x.routine.steps, packshots: [x.main, ...x.others].map((i) => shot(P(i))).filter(Boolean) as string[] })), status: "valide" }));
  }
  return lib;
}

/** Propose un calendrier complet pour une période (utilisé par le Marketing Copilot). Rien n'est enregistré ici. */
export function planPeriod(start: string, end: string): Post[] {
  const firstMonday = addDays(start, -((parseLocal(start).getDay() + 6) % 7));
  const out: Post[] = [];
  for (let w = 0, monday = firstMonday; monday <= end; w++, monday = addDays(firstMonday, w * 7)) {
    const weekIndex = Math.round((parseLocal(monday).getTime() - parseLocal("2026-01-05").getTime()) / (7 * 864e5));
    out.push(...weekPosts(themeForWeek(monday, Math.abs(weekIndex)), monday, start).filter((p) => p.date.slice(0, 10) <= end));
  }
  return out.map((p) => ({ ...p, status: "brouillon" as const }));
}

export const THEME_TITLES = THEMES.map((t) => ({ key: t.key, title: t.title, main: t.main, hook: t.hook }));
