import type { AdCampaign } from "../types";
import { addDays, blackFriday, nextOccurrence, todayYmd } from "../dates";
import { tplBanner, tplProductHero, tplVideoCover } from "../templates";

/** Campagnes SEA & Social Ads préconfigurées. Aucune n'est active : l'activation exige une connexion officielle et un budget validé. */

const now = new Date().toISOString();
type A = Omit<AdCampaign, "createdAt" | "updatedAt">;
const a = (x: A): AdCampaign => ({ ...x, createdAt: now, updatedAt: now });
const site = "https://www.skinclean.fr";

export function ads(): AdCampaign[] {
  const t = todayYmd();
  const bf = blackFriday(t);
  return [
    a({
      id: "ad-google-marque", name: "Search — Marque SKINCLEAN", platform: "google_ads", campaignId: "camp-lancement", status: "a_valider", reviewDueAt: `${t}T15:00`,
      objective: "Trafic qualifié — protéger les recherches sur la marque", audience: { locations: "France", age: "18-44", gender: "Tous", interests: ["Requêtes marque"] },
      messages: ["Site officiel SKINCLEAN", "Skin Diag gratuit en 2 minutes"],
      ads: [
        { id: "g1", headline: "SKINCLEAN — Site officiel | Skincare efficace & simple | Skin Diag gratuit", text: "Des soins aux formules lisibles et une routine personnalisée en 2 minutes. -20 % sur ta 1ʳᵉ commande avec la newsletter.", description: "Livraison 48-72 h. Programme de fidélité SKINCLEAN Club.", cta: "Découvrir" },
      ],
      keywords: [{ text: "skinclean", match: "exact" }, { text: "skin clean soin", match: "expression" }, { text: "skinclean avis", match: "expression" }],
      negativeKeywords: ["gratuit échantillon", "emploi", "recrutement"], dailyBudget: 10, totalBudget: 300, startDate: t, endDate: addDays(t, 29),
      url: `${site}/`, utm: { source: "google", medium: "cpc", campaign: "marque", content: "rsa-1" },
    }),
    a({
      id: "ad-google-niacinamide", name: "Search — Sérum niacinamide", platform: "google_ads", campaignId: "camp-niacinamide", status: "brouillon",
      objective: "Trafic qualifié sur les requêtes actif / problème", audience: { locations: "France", age: "18-34", gender: "Tous", interests: ["Requêtes génériques skincare"] },
      messages: ["Niacinamide 10 % + zinc", "Pores et brillances"],
      ads: [{ id: "g2", headline: "Sérum Niacinamide 10 % + Zinc | Pores & Brillances | SKINCLEAN", text: "Clear Skin aide à réduire l'apparence des pores et des imperfections. Formule lisible, conseils d'utilisation inclus.", description: "Fais ton Skin Diag gratuit pour vérifier qu'il convient à ta peau.", cta: "Découvrir Clear Skin" }],
      keywords: [{ text: "sérum niacinamide", match: "expression" }, { text: "niacinamide peau grasse", match: "expression" }, { text: "sérum pores dilatés", match: "large" }, { text: "niacinamide 10 zinc", match: "exact" }],
      negativeKeywords: ["the ordinary", "dupe", "diy", "maison"], dailyBudget: 20, totalBudget: 500, startDate: addDays(t, 50), endDate: addDays(t, 75),
      url: `${site}/produits/clear-skin-serum-niacinamide`, utm: { source: "google", medium: "cpc", campaign: "serum-niacinamide", term: "{keyword}" },
    }),
    a({
      id: "ad-google-noel", name: "Search — Idées cadeaux skincare", platform: "google_ads", campaignId: "camp-noel", status: "brouillon",
      objective: "Trafic sur le guide cadeaux", audience: { locations: "France", age: "18-54", gender: "Tous", interests: ["Requêtes cadeaux beauté"] },
      messages: ["Le cadeau qu'on utilise vraiment"],
      ads: [{ id: "g3", headline: "Coffret Skincare Cadeau | Kits par Type de Peau | SKINCLEAN", text: "Offre une routine adaptée : peau grasse, sèche, terne… Nos kits sont pensés pour un besoin précis.", description: "Guide cadeaux et dates de livraison avant Noël.", cta: "Voir le guide" }],
      keywords: [{ text: "coffret soin visage", match: "expression" }, { text: "idée cadeau skincare", match: "expression" }, { text: "coffret skincare femme", match: "large" }],
      negativeKeywords: ["homme rasage", "gratuit"], dailyBudget: 25, totalBudget: 400, startDate: nextOccurrence(12, 1, t), endDate: nextOccurrence(12, 18, t),
      url: `${site}/kits`, utm: { source: "google", medium: "cpc", campaign: "noel-cadeaux" },
    }),
    a({
      id: "ad-meta-lancement", name: "Meta — Notoriété lancement", platform: "meta_ads", campaignId: "camp-lancement", status: "a_valider", reviewDueAt: `${addDays(t, 1)}T11:00`,
      objective: "Notoriété — portée maximale", audience: { locations: "France", age: "18-34", gender: "Femmes et hommes", interests: ["Soins de la peau", "Cosmétiques", "Beauté naturelle", "K-beauty"], exclusions: "Abonnés actuels de la page" },
      messages: ["Ta peau a son histoire", "Des formules lisibles, une routine faite pour toi"],
      ads: [
        { id: "m1", headline: "Your skin. Your glow.", text: "SKINCLEAN arrive : des soins efficaces, des routines simples et un Skin Diag gratuit pour trouver la tienne.", cta: "En savoir plus", visual: { kind: "design", design: tplProductHero({ format: "ad_square", headline: "Your skin. Your glow.", eyebrow: "Nouveau · SKINCLEAN", sub: "Des formules lisibles, une routine faite pour toi.", packshot: "/media/packshots/aqua-plump-serum-acide-hyaluronique.png" }) } },
        { id: "m2", headline: "Ta routine en 2 minutes", text: "Réponds à 8 questions, reçois ta routine personnalisée.", cta: "Faire le test", visual: { kind: "design", design: tplVideoCover({ headline: "Ta routine en 2 minutes", packshot: "/media/packshots/dew-drop-toner-hydratant.png" }) } },
      ],
      keywords: [], negativeKeywords: [], dailyBudget: 40, totalBudget: 1200, startDate: t, endDate: addDays(t, 29),
      url: `${site}/`, utm: { source: "meta", medium: "paid_social", campaign: "lancement", content: "manifeste" },
    }),
    a({
      id: "ad-meta-diag", name: "Meta — Skin Diag", platform: "meta_ads", campaignId: "camp-skin-diag", status: "brouillon",
      objective: "Trafic — diagnostics complétés", audience: { locations: "France", age: "18-30", gender: "Tous", interests: ["Soins de la peau", "Acné", "Routine beauté"] },
      messages: ["2 minutes pour comprendre ta peau"],
      ads: [{ id: "m3", headline: "Ta peau, enfin expliquée", text: "8 questions, 2 minutes, une routine adaptée envoyée par e-mail. Gratuit et sans engagement.", cta: "Faire mon Skin Diag", visual: { kind: "design", design: tplBanner({ format: "ad_landscape", headline: "Ta routine en 2 minutes", eyebrow: "Skin Diag gratuit", sub: "Sans inscription obligatoire.", cta: "Faire le test", packshot: "/media/packshots/calm-down-serum-centella.png" }) } }],
      keywords: [], negativeKeywords: [], dailyBudget: 30, totalBudget: 900, startDate: addDays(t, 12), endDate: addDays(t, 41),
      url: `${site}/skin-diag`, utm: { source: "meta", medium: "paid_social", campaign: "skin-diag" },
    }),
    a({
      id: "ad-tiktok-diag", name: "TikTok — Skin Diag", platform: "tiktok_ads", campaignId: "camp-skin-diag", status: "brouillon",
      objective: "Vues vidéo + trafic Skin Diag", audience: { locations: "France", age: "18-24", gender: "Tous", interests: ["Beauty & Personal Care", "Skincare"] },
      messages: ["J'ai enfin compris ma peau"],
      ads: [{ id: "t1", headline: "J'ai enfin compris pourquoi ma peau brille", text: "Le Skin Diag SKINCLEAN : 2 minutes, une routine faite pour toi. #skincaretok", cta: "En savoir plus", visual: { kind: "video", src: "/media/videos/demo/pexels-8131891.mp4", poster: tplVideoCover({ headline: "J'ai enfin compris ma peau", packshot: "/media/packshots/clear-skin-serum-niacinamide.png" }), note: "Vidéo de démonstration — à remplacer par une création UGC." } }],
      keywords: [], negativeKeywords: [], dailyBudget: 25, totalBudget: 700, startDate: addDays(t, 12), endDate: addDays(t, 39),
      url: `${site}/skin-diag`, utm: { source: "tiktok", medium: "paid_social", campaign: "skin-diag" },
    }),
    a({
      id: "ad-tiktok-niacinamide", name: "TikTok — Clear Skin niacinamide", platform: "tiktok_ads", campaignId: "camp-niacinamide", status: "brouillon",
      objective: "Vues vidéo", audience: { locations: "France", age: "16-24", gender: "Tous", interests: ["Skincare", "Acne"] },
      messages: ["La niacinamide sans blabla"],
      ads: [{ id: "t2", headline: "La niacinamide ne fait pas de miracle. Mais elle fait ça.", text: "Clear Skin — niacinamide 10 % + zinc. Résultats variables selon les peaux.", cta: "Découvrir", visual: { kind: "video", src: "/media/videos/demo/pexels-8131891.mp4", poster: tplVideoCover({ headline: "La niacinamide sans blabla", packshot: "/media/packshots/clear-skin-serum-niacinamide.png" }), note: "Vidéo de démonstration — à remplacer." } }],
      keywords: [], negativeKeywords: [], dailyBudget: 20, totalBudget: 500, startDate: addDays(t, 50), endDate: addDays(t, 74),
      url: `${site}/produits/clear-skin-serum-niacinamide`, utm: { source: "tiktok", medium: "paid_social", campaign: "serum-niacinamide" },
    }),
    a({
      id: "ad-meta-black-friday", name: "Meta — Glow Friday kits", platform: "meta_ads", campaignId: "camp-black-friday", status: "brouillon",
      objective: "Trafic vers les kits", audience: { locations: "France", age: "18-44", gender: "Tous", interests: ["Soins de la peau", "Shopping beauté"], exclusions: "—" },
      messages: ["Choisir mieux plutôt que plus"],
      ads: [{ id: "m4", headline: "Glow Friday : nos kits routine", text: "Une routine complète, pensée pour ta peau. Choisir mieux plutôt que plus.", cta: "Voir les kits", visual: { kind: "design", design: tplProductHero({ format: "ad_square", headline: "Choisir mieux plutôt que plus", eyebrow: "Glow Friday", sub: "Nos kits routine à prix doux.", packshot: "/media/packshots/velvet-barrier-creme-riche.png", bg: "#EFEEEA" }) } }],
      keywords: [], negativeKeywords: [], dailyBudget: 120, totalBudget: 1000, startDate: addDays(bf, -2), endDate: addDays(bf, 3),
      url: `${site}/kits`, utm: { source: "meta", medium: "paid_social", campaign: "glow-friday" },
    }),
  ];
}
