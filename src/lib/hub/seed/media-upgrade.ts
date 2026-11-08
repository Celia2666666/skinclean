import "server-only";
import { products } from "@/data/products";
import { create, get, list, update } from "../repo";
import { BRAND, FORMATS, carouselJars, tplCarousel, type FormatKey } from "../templates";
import { DEMO_VIDEO_NOTE, videoPicker } from "../video-library";
import type { Campaign, Design, Post, TextLayer } from "../types";
import { lancementPlan, skinDiagPlan } from "./campaign-content";
import { niacinamidePlan } from "./example-campaign";

/**
 * Mise à niveau des visuels d'une base existante :
 * - vidéos TikTok / Reels variées selon le sujet (plus de répétition de la même vidéo) ;
 * - concepts TikTok sans vidéo → vidéo de démonstration avec leur couverture ;
 * - carrousels Instagram / Facebook : pots des produits ajoutés sur les pages conseils (textes conservés) ;
 * - deux carrousels photo TikTok avec les produits SKINCLEAN.
 * Les contenus déjà validés, programmés ou publiés ne sont jamais modifiés.
 */

const shot = (id: string) => products.find((p) => p.id === id)?.media.packshot;
const texts = (d: Design, page: number) => d.pages[page]?.layers.filter((l): l is TextLayer => l.type === "text").map((l) => l.text) ?? [];
const editable = (p: Post) => p.library || !["valide", "programme", "publie", "publie_test"].includes(p.status);
const formatOf = (d: Design): FormatKey => (Object.keys(FORMATS) as FormatKey[]).find((k) => FORMATS[k].w === d.w && FORMATS[k].h === d.h) ?? "instagram";

const label = (id: string) => { const x = products.find((p) => p.id === id); return x ? `${x.name} · ${x.kind.toLowerCase()}` : undefined; };

/** Reconstruit un carrousel du gabarit standard avec un produit mis en scène sur chaque page, en gardant tous ses textes. */
function withJars(p: Post, d: Design): Design | null {
  if (d.pages.length < 3 || !texts(d, 0).includes("Swipe →")) return null;
  const middle = d.pages.slice(1, -1);
  const [eyebrow, headline] = texts(d, 0);
  const coverShot = d.pages[0].layers.find((l) => l.type === "image")?.src;
  const items = middle.map((_, k) => texts(d, k + 1)[1] ?? "");
  const ids = p.productIds.filter((id) => shot(id));
  const prods = carouselJars(items.length, ids.length ? ids : [undefined]).map((id) => ({ src: shot(id) ?? coverShot, label: label(id) }));
  const fallback = !ids.length && coverShot ? items.map(() => ({ src: coverShot, label: undefined })) : prods;
  return tplCarousel({
    format: formatOf(d), headline, eyebrow, items, packshot: coverShot, bg: d.pages[0].bg.color,
    packshots: fallback.map((x) => x.src), labels: fallback.map((x) => x.label), cta: texts(d, d.pages.length - 1)[0],
  });
}

const photoCarousels = (): Omit<Post, "id" | "createdAt" | "updatedAt">[] => [
  {
    title: "Ma routine du soir en 4 produits", date: "", platform: "tiktok", format: "carrousel", objective: "Considération", pillar: "Routines",
    caption: "Ma routine du soir, version 3 minutes 🌙\n\n1. Melt Away pour tout démaquiller\n2. Cloud Gel pour nettoyer en douceur\n3. Night Renew, 2 à 3 soirs par semaine\n4. Velvet Barrier pour une peau confortable au réveil\n\nSwipe pour voir chaque étape ➡️",
    hashtags: ["#routinedusoir", "#skincaretok", "#nightroutine", "#skinclean"], cta: "Enregistre pour ce soir",
    productIds: ["sc-dm-01", "sc-cl-01", "sc-sr-06", "sc-cr-02"], status: "valide", comments: [], library: true, libraryCategory: "Carrousels photo",
    visual: { kind: "design", design: tplCarousel({ format: "tiktok", eyebrow: "Routine du soir", headline: "Ma routine du soir en 4 produits", packshot: shot("sc-sr-06"), bg: BRAND.sage,
      items: ["Je démaquille : Melt Away fond sur la peau, même le mascara", "Je nettoie en douceur avec Cloud Gel", "Night Renew au rétinal, 2 à 3 soirs par semaine", "Je termine par Velvet Barrier, riche et réconfortante"],
      packshots: ["sc-dm-01", "sc-cl-01", "sc-sr-06", "sc-cr-02"].map(shot), labels: ["sc-dm-01", "sc-cl-01", "sc-sr-06", "sc-cr-02"].map(label), cta: "Trouve ta routine avec le Skin Diag" }) },
  },
  {
    title: "Mes 3 essentiels peau mixte", date: "", platform: "tiktok", format: "carrousel", objective: "Considération", pillar: "Produits",
    caption: "Peau mixte, pores visibles, brillance en fin de journée ? Mes 3 essentiels 👇\n\n1. Clear Foam le matin et le soir\n2. Clear Skin, le sérum niacinamide 10 % + zinc\n3. Matte Balance, le gel-crème qui hydrate sans briller\n\nTu veux la routine adaptée à ta peau ? Skin Diag, lien en bio.",
    hashtags: ["#peaumixte", "#niacinamide", "#skincaretok", "#skinclean"], cta: "Fais ton Skin Diag",
    productIds: ["sc-cl-02", "sc-sr-01", "sc-cr-03"], status: "valide", comments: [], library: true, libraryCategory: "Carrousels photo",
    visual: { kind: "design", design: tplCarousel({ format: "tiktok", eyebrow: "Peau mixte", headline: "Mes 3 essentiels peau mixte", packshot: shot("sc-sr-01"), bg: BRAND.sageSoft,
      items: ["Clear Foam : nettoie sans dessécher", "Clear Skin : niacinamide 10 % + zinc pour les pores", "Matte Balance : hydrate sans faire briller"],
      packshots: ["sc-cl-02", "sc-sr-01", "sc-cr-03"].map(shot), labels: ["sc-cl-02", "sc-sr-01", "sc-cr-03"].map(label), cta: "Ta routine idéale avec le Skin Diag" }) },
  },
];

export function upgradeMedia(today: string) {
  const posts = list("posts").sort((a, b) => Number(!!b.library) - Number(!!a.library) || a.date.localeCompare(b.date));
  const pick = videoPicker();
  for (const p of posts) {
    if (!editable(p)) continue;
    const v = p.visual;
    const isVideo = (p.platform === "tiktok" && p.format === "video") || p.format === "reel";
    const topic = [p.title, p.script?.hook, p.caption.split("\n")[0], ...p.productIds.map((id) => products.find((x) => x.id === id)?.type)].join(" ");
    if (isVideo && v?.kind === "video" && v.src?.startsWith("/media/videos/demo/")) update("posts", p.id, { visual: { ...v, src: pick(topic), note: DEMO_VIDEO_NOTE } });
    else if (isVideo && v?.kind === "design" && v.design) update("posts", p.id, { visual: { kind: "video", src: pick(topic), poster: v.design, note: DEMO_VIDEO_NOTE } });
    else if (p.format === "carrousel" && ["instagram", "facebook", "tiktok"].includes(p.platform) && v?.kind === "design" && v.design) {
      const next = withJars(p, v.design);
      if (next) update("posts", p.id, { visual: { ...v, design: next } });
    }
  }
  const existing = new Set(posts.map((p) => p.title));
  const [soir, mixte] = photoCarousels();
  for (const c of [soir, mixte]) if (!existing.has(c.title)) create("posts", c);
  // Un des carrousels photo est aussi planifié dans le calendrier, à valider
  const cal = `TikTok — ${mixte.title}`;
  if (!existing.has(cal)) create("posts", { ...mixte, title: cal, library: false, libraryCategory: undefined, status: "a_valider", date: `${today}T18:00` });
}

/**
 * v5 : produits mis en scène sur toutes les pages des carrousels, contenus finalisés pour les campagnes
 * déjà activées (Lancement, Skin Diag, niacinamide) et vidéo de la marque en tête de la bibliothèque TikTok.
 * Un contenu validé ou programmé dont le visuel change repasse « à valider » (son image publiée doit être régénérée).
 */
export function upgradeVisualsV5() {
  const plans: Record<string, Campaign["plan"]> = { "camp-lancement": lancementPlan, "camp-skin-diag": skinDiagPlan, "camp-niacinamide": niacinamidePlan };
  for (const [id, plan] of Object.entries(plans)) if (get("campaigns", id)) update("campaigns", id, { plan });
  const camps = list("campaigns");
  const touch = (p: Post, patch: Partial<Post>) => {
    if (["publie", "publie_test"].includes(p.status)) return;
    const relock = ["valide", "programme"].includes(p.status) && !p.library;
    update("posts", p.id, { ...patch, ...(relock ? { status: "a_valider" as const, scheduledPages: undefined, scheduledMedia: undefined, publishClaimed: false } : {}) });
  };
  for (const p of list("posts")) {
    if (p.platform === "tiktok" && p.library && p.visual?.src === "/media/videos/tiktok-routine-skinclean.mp4") { update("posts", p.id, { featured: true }); continue; }
    const c = camps.find((x) => x.id === p.campaignId);
    const step = c?.plan.find((s) => s.title === p.title && s.content);
    const generic = c && c.plan.some((s) => p.caption === `${s.idea}\n\n${c.message}`);
    if (step?.content && (generic || p.campaignId === "camp-niacinamide")) {
      const x = step.content;
      touch(p, generic ? { caption: x.caption, hashtags: x.hashtags, visual: x.visual, script: x.script, slides: x.slides, productIds: x.productIds ?? p.productIds, articleId: x.articleId } : { visual: x.visual });
      continue;
    }
    if (p.format === "carrousel" && ["instagram", "facebook", "tiktok"].includes(p.platform) && p.visual?.kind === "design" && p.visual.design) {
      const next = withJars(p, p.visual.design);
      if (next) touch(p, { visual: { ...p.visual, design: next } });
    }
  }
}
