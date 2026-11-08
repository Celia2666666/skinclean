import type { Campaign, Post, VideoScript, Visual } from "../types";
import { BRAND, tplBanner, tplCarousel, tplProductHero, tplRoutine, tplStoryPoll, tplVideoCover } from "../templates";

/**
 * Campagne exemple entièrement finalisée : « Sérum niacinamide ».
 * Chaque action du planning contient son contenu définitif (texte, hashtags, visuel ou vidéo, script),
 * repris tel quel lors de l'activation de la campagne.
 */

export const ROUTINE_VIDEO = "/media/videos/tiktok-routine-skinclean.mp4";
const SERUM = "/media/packshots/clear-skin-serum-niacinamide.png";
const pack = (slug: string) => `/media/packshots/${slug}.png`;
const design = (d: Visual["design"]): Visual => ({ kind: "design", design: d });

/** Script fidèle à la vidéo fournie (5 s) : flacon compte-gouttes, gouttes sur la joue, application de la crème. */
export const routineScript: VideoScript = {
  hook: "Le geste de 5 secondes qui change ma routine",
  duration: "5 s (boucle)",
  sound: "Son tendance calme / ASMR skincare",
  scenes: [
    { t: "0–1,5 s", shot: "Le flacon compte-gouttes présenté face caméra, dans la salle de bain.", onScreen: "Mon sérum du matin 💧", voice: "" },
    { t: "1,5–3 s", shot: "Deux gouttes déposées sur la joue, sourire.", onScreen: "2 gouttes, pas plus", voice: "" },
    { t: "3–4 s", shot: "Le sérum est tapoté du bout des doigts.", onScreen: "Je tapote, je ne frotte pas", voice: "" },
    { t: "4–5 s", shot: "Application de la crème sur tout le visage.", onScreen: "Puis la crème pour sceller l'hydratation", voice: "" },
  ],
};

const tiktokCaption = `Mon geste préféré le matin : 2 gouttes de sérum Clear Skin, je tapote, puis la crème. 5 secondes, et ma peau est prête pour la journée ✨

Niacinamide 10 % + zinc : pores moins visibles et brillances régulées, jour après jour (résultats variables selon les peaux).

Tu veux ta routine idéale ? Fais le Skin Diag, lien en bio.`;

const reelCaption = `5 secondes pour une routine qui tient ses promesses 💧

1. Deux gouttes de Clear Skin (niacinamide 10 % + zinc)
2. Je tapote du bout des doigts
3. Ma crème hydratante pour sceller le tout

Simple, régulier, efficace : c'est tout le principe.
👉 Enregistre ce Reel pour ta routine de demain matin.`;

export const niacinamidePlan: Campaign["plan"] = [
  {
    day: 0, platform: "tiktok", format: "video", hour: "18:00", title: "TikTok — Ma routine sérum en 5 secondes", idea: "Vidéo de la routine : gouttes de sérum puis crème.", cta: "Fais ton Skin Diag",
    content: {
      caption: tiktokCaption, hashtags: ["#niacinamide", "#skincaretok", "#routinematin", "#peaumixte", "#skinclean"],
      script: routineScript,
      visual: { kind: "video", src: ROUTINE_VIDEO, poster: tplVideoCover({ headline: "Le geste de 5 secondes qui change ma routine", packshot: SERUM }) },
    },
  },
  {
    day: 1, platform: "instagram", format: "carrousel", hour: "12:30", title: "Niacinamide : 5 questions, 5 réponses", idea: "FAQ actif en carrousel.", cta: "Enregistre le post",
    content: {
      caption: `Niacinamide : on répond aux 5 questions que vous nous posez le plus 👇

1. C'est quoi ? Une forme de vitamine B3, bien tolérée par la plupart des peaux.
2. Ça sert à quoi ? Elle aide à réguler les brillances et à affiner l'apparence des pores.
3. Matin ou soir ? Les deux : elle s'intègre partout.
4. Avec la vitamine C ? Oui, sans problème.
5. Quand voir les effets ? Comptez 4 à 8 semaines d'utilisation régulière.

Swipe pour tout retenir, et enregistre le post pour plus tard 📌`,
      hashtags: ["#niacinamide", "#skincare", "#peaugrasse", "#pores", "#skinclean"],
      slides: ["C'est quoi ? Une forme de vitamine B3", "Ça sert à quoi ? Brillances et pores", "Matin ou soir ? Les deux", "Avec la vitamine C ? Oui", "Les effets ? 4 à 8 semaines"],
      visual: design(tplCarousel({ headline: "Niacinamide : 5 questions, 5 réponses", eyebrow: "Skin School", packshot: SERUM, items: ["C'est quoi ? Une forme de vitamine B3, bien tolérée.", "Ça sert à quoi ? Réguler les brillances et affiner l'apparence des pores.", "Matin ou soir ? Les deux, elle s'intègre partout.", "Avec la vitamine C ? Oui, sans problème.", "Les effets ? Comptez 4 à 8 semaines d'utilisation."],
        packshots: [SERUM, SERUM, pack("cloud-cream-creme-hydratante"), pack("glow-shot-serum-vitamine-c"), SERUM],
        labels: ["Clear Skin · niacinamide 10 %", "Clear Skin · pores & brillances", "Cloud Cream · à associer", "Glow Shot · vitamine C", "Clear Skin · 4 à 8 semaines"] })),
    },
  },
  {
    day: 2, platform: "story", format: "story", hour: "12:00", title: "Story sondage — Tu connais la niacinamide ?", idea: "Sondage + renvoi vers le carrousel.", cta: "Réponds au sondage",
    content: {
      caption: "Ajouter le sticker sondage natif d'Instagram sur la zone prévue. Le lendemain, partager les résultats et le lien vers le carrousel « 5 questions, 5 réponses ».",
      hashtags: [],
      visual: design(tplStoryPoll({ eyebrow: "Quiz skincare", headline: "Tu as déjà testé la niacinamide ?", items: ["Oui, je l'adore", "Non, jamais testé"], packshot: SERUM })),
    },
  },
  {
    day: 3, platform: "pinterest", format: "epingle", hour: "20:30", title: "Avec quoi associer la niacinamide ?", idea: "Tableau des associations.", cta: "Découvrir la routine",
    content: {
      caption: "Niacinamide : les bonnes associations pour une routine simple et efficace. Acide hyaluronique pour l'hydratation, vitamine C pour l'éclat, SPF le matin, et un exfoliant doux deux fois par semaine.",
      hashtags: ["#niacinamide", "#routineskincare", "#skincaretips"],
      visual: design(tplRoutine({ format: "pinterest", eyebrow: "Les bonnes associations", headline: "Avec quoi associer la niacinamide ?", items: ["Acide hyaluronique : hydratation", "Vitamine C : éclat du teint", "SPF 50 : chaque matin", "BHA doux : 2 fois par semaine"], packshots: [pack("aqua-plump-serum-acide-hyaluronique"), pack("glow-shot-serum-vitamine-c"), pack("daily-shield-spf50"), pack("bha-clear-liquid-exfoliant")] })),
      productIds: ["sc-sr-01", "sc-sr-03", "sc-sr-02", "sc-sp-01"],
    },
  },
  {
    day: 4, platform: "blog", format: "article", hour: "08:00", title: "Niacinamide : bienfaits, utilisation et associations (le guide complet)", idea: "Article pilier SEO.", cta: "Lire l'article",
    content: {
      caption: "Mot-clé principal : niacinamide bienfaits\nCe que la niacinamide fait (et ne fait pas), comment l'intégrer à ta routine et avec quoi l'associer.",
      hashtags: [], articleId: "art-niacinamide",
      visual: design(tplBanner({ format: "newsletter", headline: "Niacinamide", eyebrow: "Blog SKINCLEAN", packshot: SERUM })),
    },
  },
  {
    day: 7, platform: "instagram", format: "post", hour: "18:00", title: "Clear Skin en majesté", idea: "Visuel produit.", cta: "Découvrir Clear Skin",
    content: {
      caption: `Clear Skin, notre sérum à la niacinamide 10 % + zinc 💚

✔︎ Aide à réguler l'excès de sébum
✔︎ Affine visiblement le grain de peau
✔︎ Texture légère, sans effet collant

Matin et soir, 2 à 3 gouttes avant ta crème. Disponible sur skinclean.fr`,
      hashtags: ["#niacinamide", "#serumvisage", "#peaumixte", "#skincare", "#skinclean"],
      visual: design(tplProductHero({ headline: "Clear Skin", eyebrow: "Niacinamide 10 % + zinc", sub: "Pores affinés, brillances régulées", packshot: SERUM, bg: BRAND.sageSoft })),
    },
  },
  {
    day: 8, platform: "newsletter", format: "newsletter", hour: "10:00", title: "Newsletter — Focus niacinamide", idea: "Newsletter éducative liée au guide.", cta: "Lire le guide",
    content: {
      caption: "Objet : Niacinamide : tout ce que tu dois savoir (en 2 minutes)\nNewsletter « Focus ingrédients » : ce qu'elle fait, avec quoi l'associer, comment l'utiliser.",
      hashtags: [],
      visual: design(tplBanner({ format: "newsletter", headline: "Niacinamide sans blabla", eyebrow: "Focus actif", packshot: SERUM })),
    },
  },
  {
    day: 10, platform: "instagram", format: "reel", hour: "18:30", title: "Reel — La routine Clear Skin", idea: "Reprise de la vidéo TikTok en Reel.", cta: "Enregistre le Reel",
    content: {
      caption: reelCaption, hashtags: ["#reelskincare", "#niacinamide", "#routinebeaute", "#skinclean"],
      script: routineScript,
      visual: { kind: "video", src: ROUTINE_VIDEO, poster: tplVideoCover({ headline: "Ma routine en 5 secondes", packshot: SERUM }) },
    },
  },
];

/** Vidéo TikTok de la routine, ajoutée à la bibliothèque prête à l'emploi. */
export function routineVideoLibraryPost(): Omit<Post, "id" | "createdAt" | "updatedAt"> {
  const step = niacinamidePlan[0];
  return {
    title: "Ma routine sérum en 5 secondes", date: "", platform: "tiktok", format: "video", objective: "Notoriété", pillar: "Routines",
    caption: step.content!.caption, hashtags: step.content!.hashtags, cta: step.cta!, productIds: ["sc-sr-01", "sc-cr-01"],
    script: routineScript, visual: step.content!.visual, status: "valide", comments: [], library: true, libraryCategory: "Routines",
  };
}
