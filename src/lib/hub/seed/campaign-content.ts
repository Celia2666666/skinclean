import type { Campaign, Visual } from "../types";
import { BRAND, tplBanner, tplCarousel, tplProductHero, tplQuote, tplRoutine, tplStoryPoll, tplVideoCover } from "../templates";
import { DEMO_VIDEO_NOTE } from "../video-library";

/**
 * Contenus finalisés des campagnes « Lancement SKINCLEAN » et « Découverte du Skin Diag » :
 * texte, hashtags, visuel mis en scène ou vidéo et script, repris tels quels à l'activation.
 */

const pack = (slug: string) => `/media/packshots/${slug}.png`;
const vid = (id: string) => `/media/videos/demo/pexels-${id}.mp4`;
const design = (d: Visual["design"]): Visual => ({ kind: "design", design: d });
const video = (id: string, hook: string, packshot?: string): Visual => ({ kind: "video", src: vid(id), poster: tplVideoCover({ headline: hook, packshot }), note: DEMO_VIDEO_NOTE });

const P = {
  clearSkin: { src: pack("clear-skin-serum-niacinamide"), label: "Clear Skin · sérum niacinamide" },
  glowShot: { src: pack("glow-shot-serum-vitamine-c"), label: "Glow Shot · sérum vitamine C" },
  aquaPlump: { src: pack("aqua-plump-serum-acide-hyaluronique"), label: "Aqua Plump · acide hyaluronique" },
  cloudCream: { src: pack("cloud-cream-creme-hydratante"), label: "Cloud Cream · crème hydratante" },
  dewDrop: { src: pack("dew-drop-toner-hydratant"), label: "Dew Drop · toner hydratant" },
  calmDown: { src: pack("calm-down-serum-centella"), label: "Calm Down · sérum apaisant" },
  cloudGel: { src: pack("cloud-gel-nettoyant-doux"), label: "Cloud Gel · nettoyant doux" },
  dailyShield: { src: pack("daily-shield-spf50"), label: "Daily Shield · SPF 50" },
};
const scenes = (...xs: { src: string; label: string }[]) => ({ packshots: xs.map((x) => x.src), labels: xs.map((x) => x.label) });

export const lancementPlan: Campaign["plan"] = [
  {
    day: 0, platform: "instagram", format: "reel", hour: "18:30", title: "Manifeste « Ta peau a son histoire »", idea: "Vidéo manifeste : vraies peaux, textures, logo final.", cta: "Découvre SKINCLEAN",
    content: {
      caption: "Ta peau a son histoire. Des matins pressés, des soirs de fatigue, des boutons qui arrivent au mauvais moment, des jours où elle rayonne.\n\nSKINCLEAN est née pour l'accompagner, telle qu'elle est : des soins efficaces, des routines simples, et un diagnostic pour trouver la tienne.\n\nBienvenue 🌿",
      hashtags: ["#skinclean", "#tapeauasonhistoire", "#skincare", "#routinesimple"],
      script: { hook: "Ta peau a son histoire", duration: "15 s", sound: "Piano doux", scenes: [
        { t: "0–3 s", shot: "Gros plan d'un visage au réveil, lumière naturelle.", onScreen: "Ta peau a son histoire" },
        { t: "3–8 s", shot: "Application d'un soin, mains et texture.", onScreen: "Elle mérite une routine simple" },
        { t: "8–12 s", shot: "Sourire face au miroir.", onScreen: "Des soins efficaces, sans promesses miracles" },
        { t: "12–15 s", shot: "Logo SKINCLEAN sur fond sauge.", onScreen: "SKINCLEAN · skinclean.fr" },
      ] },
      visual: video("12322612", "Ta peau a son histoire", P.cloudCream.src),
    },
  },
  {
    day: 1, platform: "tiktok", format: "video", hour: "18:00", title: "Qui est SKINCLEAN ? en 20 secondes", idea: "Face cam fondatrice + 3 promesses.", cta: "Fais ton Skin Diag",
    content: {
      caption: "SKINCLEAN en 20 secondes 👇\n\n1. Des formules lisibles : tu sais ce que tu mets sur ta peau\n2. Des routines courtes, qui tiennent dans ton quotidien\n3. Un Skin Diag gratuit pour trouver la tienne\n\nOn se présente, à toi de nous dire ce que tu veux voir ici 💬",
      hashtags: ["#skinclean", "#skincaretok", "#marquefrancaise", "#routinesimple"],
      script: { hook: "On est SKINCLEAN, et voilà nos 3 promesses", duration: "20 s", sound: "Son tendance doux", scenes: [
        { t: "0–3 s", shot: "Face caméra, sourire.", onScreen: "Qui est SKINCLEAN ?", voice: "Salut, on est SKINCLEAN." },
        { t: "3–9 s", shot: "Application d'un sérum.", onScreen: "1. Des formules lisibles", voice: "Des formules que tu comprends." },
        { t: "9–14 s", shot: "Routine du matin rapide.", onScreen: "2. Des routines courtes", voice: "Des routines qui tiennent en trois gestes." },
        { t: "14–20 s", shot: "Écran du Skin Diag.", onScreen: "3. Ton Skin Diag gratuit", voice: "Et un diagnostic pour trouver la tienne." },
      ] },
      visual: video("8371244", "Qui est SKINCLEAN ? en 20 secondes", P.glowShot.src),
    },
  },
  {
    day: 2, platform: "instagram", format: "carrousel", hour: "12:30", title: "Nos 5 engagements", idea: "Formules lisibles, pas de faux avis, conseils honnêtes, routines courtes, Club.", cta: "Enregistre le post",
    content: {
      caption: "Nos 5 engagements, noir sur blanc 🤍\n\n1. Des formules lisibles\n2. Aucun faux avis, jamais\n3. Des conseils honnêtes, même si ça veut dire acheter moins\n4. Des routines courtes\n5. Un Club qui récompense ta fidélité\n\nSwipe pour les découvrir, et dis-nous lequel compte le plus pour toi 👇",
      hashtags: ["#skinclean", "#skincare", "#engagements", "#cosmetiquehonnete"],
      slides: ["Des formules lisibles", "Aucun faux avis, jamais", "Des conseils honnêtes", "Des routines courtes", "Un Club qui récompense"],
      visual: design(tplCarousel({ headline: "Nos 5 engagements", eyebrow: "SKINCLEAN", packshot: P.glowShot.src, bg: BRAND.sage,
        items: ["Des formules lisibles : chaque actif est expliqué", "Aucun faux avis, jamais", "Des conseils honnêtes, même si tu achètes moins", "Des routines courtes, en 3 gestes", "Un Club qui récompense ta fidélité"],
        ...scenes(P.clearSkin, P.glowShot, P.aquaPlump, P.cloudCream, P.dailyShield), cta: "Trouve ta routine avec le Skin Diag" })),
    },
  },
  {
    day: 3, platform: "facebook", format: "post", hour: "13:00", title: "Bienvenue dans la famille SKINCLEAN", idea: "Présentation des gammes et du Skin Diag.", cta: "Découvrir les soins",
    content: {
      caption: "Bienvenue dans la famille SKINCLEAN 🌿\n\nNettoyants, sérums, crèmes et protection solaire : des soins pensés pour toutes les peaux, avec des formules lisibles et des routines simples.\n\nTu ne sais pas par où commencer ? Le Skin Diag te propose ta routine en 2 minutes, gratuitement : skinclean.fr/skin-diag",
      hashtags: ["#skinclean", "#skincare", "#soinsvisage"],
      visual: design(tplProductHero({ format: "facebook", headline: "Bienvenue dans la famille", eyebrow: "SKINCLEAN", sub: "Des soins efficaces, des routines simples", packshot: P.cloudCream.src, bg: BRAND.sageSoft })),
    },
  },
  {
    day: 4, platform: "pinterest", format: "epingle", hour: "20:30", title: "Les essentiels SKINCLEAN", idea: "Épingle gamme complète.", cta: "Découvrir la gamme",
    content: {
      caption: "Les essentiels SKINCLEAN pour une routine complète et simple : nettoyer, hydrater, traiter, protéger. Des soins visage aux formules lisibles, pour toutes les peaux.",
      hashtags: ["#routineskincare", "#soinsvisage", "#skincareroutine"],
      productIds: ["sc-cl-01", "sc-sr-03", "sc-cr-01", "sc-sp-01"],
      visual: design(tplRoutine({ format: "pinterest", eyebrow: "La routine essentielle", headline: "Les essentiels SKINCLEAN", items: ["Nettoyer : Cloud Gel", "Hydrater : Aqua Plump", "Nourrir : Cloud Cream", "Protéger : Daily Shield SPF 50"], packshots: [P.cloudGel.src, P.aquaPlump.src, P.cloudCream.src, P.dailyShield.src] })),
    },
  },
  {
    day: 6, platform: "newsletter", format: "newsletter", hour: "10:00", title: "Newsletter de lancement", idea: "E-mail de bienvenue — présentation de la marque.", cta: "Découvrir SKINCLEAN",
    content: {
      caption: "Objet : Bienvenue chez SKINCLEAN 🌿\nPréheader : Des soins efficaces, des routines simples et ton Skin Diag offert.\nPrésentation de la marque, des 5 engagements et du Skin Diag.",
      hashtags: [],
      visual: design(tplBanner({ format: "newsletter", headline: "Bienvenue chez SKINCLEAN", eyebrow: "Lancement", packshot: P.glowShot.src })),
    },
  },
  {
    day: 8, platform: "story", format: "story", hour: "12:00", title: "Quiz : quel est ton type de peau ?", idea: "Story quiz renvoyant vers le Skin Diag.", cta: "Fais le Skin Diag",
    content: {
      caption: "Ajouter le sticker sondage natif sur la zone prévue, puis une seconde story avec le sticker lien vers skinclean.fr/skin-diag.",
      hashtags: [],
      visual: design(tplStoryPoll({ eyebrow: "Quiz skincare", headline: "En fin de journée, ta peau…", items: ["Elle brille", "Elle tiraille"], packshot: P.clearSkin.src })),
    },
  },
  {
    day: 10, platform: "tiktok", format: "video", hour: "18:00", title: "Unboxing du kit de lancement", idea: "Déballage ASMR, textures.", cta: "Découvre les kits",
    content: {
      caption: "Unboxing ASMR de notre kit de lancement 📦✨\n\nLe colis, le petit mot, et surtout les textures : gel, sérum, crème. Tu veux le même ? Il est sur skinclean.fr, rubrique Kits.",
      hashtags: ["#unboxing", "#asmrskincare", "#skincaretok", "#skinclean"],
      script: { hook: "Ouvre le colis avec moi", duration: "15 s", sound: "ASMR, sans musique", scenes: [
        { t: "0–4 s", shot: "Mains qui ouvrent le colis.", onScreen: "Ouvre le colis avec moi 📦" },
        { t: "4–9 s", shot: "Ouverture d'un pot de crème, texture.", onScreen: "La texture 🤍" },
        { t: "9–15 s", shot: "Application sur le dos de la main.", onScreen: "Kit dispo sur skinclean.fr" },
      ] },
      visual: video("4351114", "Ouvre le colis avec moi", P.cloudCream.src),
    },
  },
  {
    day: 14, platform: "instagram", format: "post", hour: "18:00", title: "Merci pour ces 2 premières semaines", idea: "Post communauté, chiffres réels uniquement.", cta: "Dis-nous tout en commentaire",
    content: {
      caption: "Merci 🤍\n\nDeux semaines que SKINCLEAN existe, et vos messages, vos questions et vos premières routines nous touchent énormément.\n\nDites-nous en commentaire : quel soin voulez-vous qu'on vous présente la semaine prochaine ?",
      hashtags: ["#skinclean", "#merci", "#communaute"],
      visual: design(tplQuote({ headline: "Merci pour ces deux premières semaines", sub: "L'équipe SKINCLEAN", bg: BRAND.blush })),
    },
  },
];

export const skinDiagPlan: Campaign["plan"] = [
  {
    day: 0, platform: "tiktok", format: "video", hour: "18:00", title: "Je fais le Skin Diag en direct", idea: "Écran partagé : réponses + résultat.", cta: "Fais ton Skin Diag",
    content: {
      caption: "Je fais le Skin Diag SKINCLEAN en direct 👀\n\n2 minutes, quelques questions sur ma peau… et ma routine matin et soir arrive. Résultat : peau mixte, légèrement déshydratée. Et toi ?\n\nLe Skin Diag est gratuit, lien en bio.",
      hashtags: ["#skindiag", "#typedepeau", "#skincaretok", "#skinclean"],
      script: { hook: "Je teste un diagnostic de peau en 2 minutes", duration: "25 s", sound: "Son tendance", scenes: [
        { t: "0–3 s", shot: "Face caméra, téléphone en main.", onScreen: "Je fais le Skin Diag en direct" },
        { t: "3–15 s", shot: "Écran partagé : les questions du Skin Diag.", onScreen: "Ma peau tiraille ? Un peu…" },
        { t: "15–22 s", shot: "Révélation du résultat.", onScreen: "Peau mixte, un peu déshydratée" },
        { t: "22–25 s", shot: "Application du soin conseillé.", onScreen: "À ton tour : lien en bio" },
      ] },
      visual: video("5936529", "Je fais le Skin Diag en direct", P.dewDrop.src),
    },
  },
  {
    day: 1, platform: "story", format: "story", hour: "12:00", title: "Story : ton résultat Skin Diag ?", idea: "Sondage + lien vers le diag.", cta: "Fais le Skin Diag",
    content: {
      caption: "Sticker sondage natif sur la zone prévue, puis story suivante avec le sticker lien vers skinclean.fr/skin-diag.",
      hashtags: [],
      visual: design(tplStoryPoll({ eyebrow: "Skin Diag", headline: "Ton résultat Skin Diag ?", items: ["Peau mixte", "Sèche ou sensible"], packshot: P.dewDrop.src })),
    },
  },
  {
    day: 2, platform: "instagram", format: "carrousel", hour: "12:30", title: "Comment fonctionne le Skin Diag", idea: "5 slides : questions, moteur, routine, e-mail, suivi.", cta: "Enregistre le post",
    content: {
      caption: "Comment fonctionne le Skin Diag ? 🔍\n\n1. Tu réponds à quelques questions sur ta peau\n2. On analyse ton type de peau et tes priorités\n3. Tu reçois ta routine du matin et du soir\n4. On te l'envoie par e-mail\n5. Tu suis ta peau au fil des semaines\n\nC'est gratuit et ça prend 2 minutes : lien en bio.",
      hashtags: ["#skindiag", "#routinepersonnalisee", "#skincare", "#skinclean"],
      slides: ["Tu réponds à quelques questions", "On analyse ta peau", "Tu reçois ta routine", "Par e-mail", "Tu suis ta peau"],
      visual: design(tplCarousel({ headline: "Comment fonctionne le Skin Diag", eyebrow: "2 minutes chrono", packshot: P.dewDrop.src, bg: BRAND.sageSoft,
        items: ["Tu réponds à quelques questions sur ta peau", "On analyse ton type de peau et tes priorités", "Tu reçois ta routine du matin et du soir", "On te l'envoie par e-mail, pour la garder", "Tu suis l'évolution de ta peau"],
        ...scenes(P.cloudGel, P.dewDrop, P.clearSkin, P.calmDown, P.cloudCream), cta: "Fais ton Skin Diag gratuit" })),
    },
  },
  {
    day: 4, platform: "tiktok", format: "video", hour: "18:00", title: "3 profils, 3 routines", idea: "Même question, 3 résultats différents.", cta: "Fais ton Skin Diag",
    content: {
      caption: "Même diagnostic, 3 peaux, 3 routines différentes 👇\n\nPeau mixte : nettoyant doux + niacinamide\nPeau sèche : toner hydratant + crème riche\nPeau sensible : centella + SPF minéral\n\nPas de routine universelle : la tienne t'attend dans le Skin Diag.",
      hashtags: ["#skindiag", "#peaumixte", "#peausensible", "#skincaretok"],
      script: { hook: "On a fait le Skin Diag à 3 : résultats très différents", duration: "20 s", sound: "Son tendance", scenes: [
        { t: "0–3 s", shot: "Trois mains tiennent trois téléphones.", onScreen: "1 diagnostic, 3 peaux" },
        { t: "3–9 s", shot: "Peau mixte, application d'un sérum.", onScreen: "Mixte : niacinamide" },
        { t: "9–15 s", shot: "Peau sèche, application d'une crème.", onScreen: "Sèche : crème riche" },
        { t: "15–20 s", shot: "Peau sensible, geste doux.", onScreen: "Sensible : centella" },
      ] },
      visual: video("5927936", "3 profils, 3 routines", P.calmDown.src),
    },
  },
  {
    day: 5, platform: "pinterest", format: "epingle", hour: "20:30", title: "Trouve ta routine en 2 minutes", idea: "Épingle infographie du parcours.", cta: "Faire le Skin Diag",
    content: {
      caption: "Trouve ta routine skincare en 2 minutes avec le Skin Diag SKINCLEAN : quelques questions, ton type de peau, ta routine matin et soir. Gratuit.",
      hashtags: ["#routineskincare", "#typedepeau", "#skincaretips"],
      visual: design(tplRoutine({ format: "pinterest", eyebrow: "Skin Diag", headline: "Trouve ta routine en 2 minutes", items: ["Réponds à quelques questions", "Découvre ton type de peau", "Reçois ta routine matin et soir", "Suis ta peau semaine après semaine"], packshots: [P.cloudGel.src, P.dewDrop.src, P.clearSkin.src, P.cloudCream.src] })),
    },
  },
  {
    day: 7, platform: "newsletter", format: "newsletter", hour: "10:00", title: "As-tu fait ton Skin Diag ?", idea: "Relance pédagogique.", cta: "Faire mon Skin Diag",
    content: {
      caption: "Objet : 2 minutes pour enfin comprendre ta peau\nPréheader : Ton Skin Diag gratuit t'attend, avec ta routine personnalisée.\nRelance pédagogique : comment fonctionne le diagnostic et ce qu'il t'apporte.",
      hashtags: [],
      visual: design(tplBanner({ format: "newsletter", headline: "As-tu fait ton Skin Diag ?", eyebrow: "2 minutes", packshot: P.dewDrop.src })),
    },
  },
  {
    day: 9, platform: "instagram", format: "reel", hour: "18:30", title: "Ce que ton Skin Diag sait de ta peau", idea: "Reel explicatif.", cta: "Fais ton Skin Diag",
    content: {
      caption: "Ce que ton Skin Diag sait (vraiment) de ta peau 👇\n\nTon type de peau, ses besoins du moment, ta sensibilité, et le temps que tu veux passer sur ta routine. Rien de plus : pas besoin de photo, pas de compte obligatoire.\n\nEnregistre ce Reel et fais-le ce soir 🌙",
      hashtags: ["#skindiag", "#reelskincare", "#skinclean"],
      script: { hook: "Ce que ton Skin Diag sait de ta peau", duration: "15 s", sound: "Son doux", scenes: [
        { t: "0–3 s", shot: "Regard face caméra.", onScreen: "Ce que ton Skin Diag sait de ta peau" },
        { t: "3–10 s", shot: "Gestes de soin, routine du soir.", onScreen: "Ton type de peau · tes besoins · ta sensibilité" },
        { t: "10–15 s", shot: "Sourire.", onScreen: "Sans photo, sans compte : skinclean.fr" },
      ] },
      visual: video("6925816", "Ce que ton Skin Diag sait de ta peau", P.calmDown.src),
    },
  },
  {
    day: 12, platform: "facebook", format: "post", hour: "13:00", title: "Le Skin Diag expliqué aux parents (et aux autres)", idea: "Post pédagogique.", cta: "Faire le Skin Diag",
    content: {
      caption: "Le Skin Diag expliqué simplement 👨‍👩‍👧\n\nC'est un questionnaire gratuit de 2 minutes. Il aide à identifier le type de peau (grasse, sèche, mixte, sensible) et propose une routine simple, matin et soir.\n\nPratique pour les ados qui débutent, et pour tous ceux qui ne savent plus quoi choisir. Nos conseils sont cosmétiques et ne remplacent pas l'avis d'un professionnel de santé.",
      hashtags: ["#skindiag", "#skincareado", "#skinclean"],
      visual: design(tplProductHero({ format: "facebook", headline: "Le Skin Diag, expliqué simplement", eyebrow: "2 minutes, gratuit", sub: "Le bon type de peau, la bonne routine", packshot: P.dewDrop.src, bg: BRAND.butter })),
    },
  },
];
