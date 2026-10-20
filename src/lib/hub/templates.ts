import type { Design, DesignPage, Layer } from "./types";

/**
 * Gabarits de visuels aux couleurs SKINCLEAN.
 * Fonctions pures → utilisées par le Studio (galerie de templates), la génération des contenus initiaux et les e-mails.
 */

export const BRAND = {
  forest: "#1F3329", forestSoft: "#5C6862", sage: "#D8DFD4", sageSoft: "#EDF0EA", sageDeep: "#4A6354",
  cream: "#FAF9F6", sand: "#EFEEEA", accent: "#5E7A68", white: "#FFFFFF", blush: "#EBDDD5", butter: "#F1E9D2",
};
export const BRAND_SWATCHES = [
  { name: "Forest", hex: BRAND.forest }, { name: "Sage", hex: BRAND.sage }, { name: "Sage doux", hex: BRAND.sageSoft },
  { name: "Sage profond", hex: BRAND.sageDeep }, { name: "Crème", hex: BRAND.cream }, { name: "Sable", hex: BRAND.sand },
  { name: "Feuille", hex: BRAND.accent }, { name: "Blush", hex: BRAND.blush }, { name: "Beurre", hex: BRAND.butter }, { name: "Blanc", hex: BRAND.white },
];

export const FORMATS = {
  instagram: { w: 1080, h: 1350, label: "Instagram — post 4:5" },
  instagram_square: { w: 1080, h: 1080, label: "Instagram — carré" },
  story: { w: 1080, h: 1920, label: "Story / Reel 9:16" },
  tiktok: { w: 1080, h: 1920, label: "TikTok 9:16" },
  facebook: { w: 1200, h: 1200, label: "Facebook — post" },
  pinterest: { w: 1000, h: 1500, label: "Pinterest — épingle 2:3" },
  newsletter: { w: 1200, h: 600, label: "Newsletter — en-tête" },
  banner: { w: 1920, h: 720, label: "Bannière de site" },
  ad_square: { w: 1080, h: 1080, label: "Publicité — carré" },
  ad_landscape: { w: 1200, h: 628, label: "Publicité — paysage" },
} as const;
export type FormatKey = keyof typeof FORMATS;

let n = 0;
const id = () => `l${Date.now().toString(36)}${(n++).toString(36)}`;

const text = (t: string, x: number, y: number, w: number, size: number, o: Partial<Extract<Layer, { type: "text" }>> = {}): Layer => ({
  id: id(), type: "text", x, y, w, text: t, size, weight: 500, color: BRAND.forest, align: "left", font: "display", lineHeight: 1.08, ...o,
});
const img = (src: string, x: number, y: number, w: number, h: number, o: Partial<Extract<Layer, { type: "image" }>> = {}): Layer => ({
  id: id(), type: "image", x, y, w, h, src, fit: "contain", ...o,
});
const shape = (x: number, y: number, w: number, h: number, color: string, o: Partial<Extract<Layer, { type: "shape" }>> = {}): Layer => ({ id: id(), type: "shape", x, y, w, h, color, ...o });
const logo = (x: number, y: number, w: number, tint: "dark" | "light" = "dark", variant: "wordmark" | "mark" | "full" = "wordmark"): Layer => ({ id: id(), type: "logo", x, y, w, variant, tint });

export interface TplInput {
  format?: FormatKey;
  headline?: string;
  sub?: string;
  eyebrow?: string;
  packshot?: string;
  bg?: string;
  accent?: string;
  cta?: string;
  items?: string[];
  image?: string;
}

const fmt = (f: FormatKey = "instagram") => FORMATS[f];

/** Produit en majesté : packshot centré, titre en capitales, logo. */
export function tplProductHero(i: TplInput): Design {
  const { w, h } = fmt(i.format);
  const tall = h / w > 1.4;
  const pad = w * 0.08;
  const layers: Layer[] = [
    text((i.eyebrow ?? "SKINCLEAN").toUpperCase(), pad, pad, w - pad * 2, w * 0.026, { font: "body", weight: 600, letterSpacing: 3, color: i.accent ?? BRAND.sageDeep }),
    text(i.headline ?? "Your skin. Your glow.", pad, pad + w * 0.06, w - pad * 2, w * (tall ? 0.085 : 0.075), { upper: true }),
  ];
  if (i.packshot) layers.push(img(i.packshot, w * 0.18, h * (tall ? 0.34 : 0.3), w * 0.64, h * (tall ? 0.46 : 0.5), { shadow: true }));
  if (i.sub) layers.push(text(i.sub, pad, h - pad - w * 0.13, w * 0.62, w * 0.032, { font: "body", weight: 400, lineHeight: 1.35, color: BRAND.forestSoft }));
  layers.push(logo(w - pad - w * 0.26, h - pad - w * 0.06, w * 0.26));
  return { w, h, pages: [{ bg: { type: "color", color: i.bg ?? BRAND.sand }, layers }] };
}

/** Focus ingrédient : grand nom d'actif, rôle, packshot en bas à droite. */
export function tplIngredient(i: TplInput): Design {
  const { w, h } = fmt(i.format);
  const pad = w * 0.08;
  const layers: Layer[] = [
    shape(pad, pad, w * 0.22, w * 0.05, BRAND.forest, { radius: w * 0.025 }),
    text("FOCUS ACTIF", pad, pad + w * 0.012, w * 0.22, w * 0.022, { font: "body", weight: 600, align: "center", color: BRAND.white, letterSpacing: 2 }),
    text(i.headline ?? "Niacinamide", pad, h * 0.2, w - pad * 2, w * 0.13, { upper: true, lineHeight: 0.95 }),
    text(i.sub ?? "", pad, h * 0.2 + w * 0.32, w * 0.55, w * 0.036, { font: "body", weight: 400, lineHeight: 1.4, color: BRAND.forestSoft }),
  ];
  if (i.packshot) layers.push(img(i.packshot, w * 0.52, h * 0.48, w * 0.44, h * 0.45));
  layers.push(logo(pad, h - pad - w * 0.05, w * 0.22));
  return { w, h, pages: [{ bg: { type: "color", color: i.bg ?? BRAND.sageSoft }, layers }] };
}

/** Carrousel éducatif : couverture + une page par conseil + page CTA. */
export function tplCarousel(i: TplInput): Design {
  const { w, h } = fmt(i.format ?? "instagram");
  const pad = w * 0.09;
  const items = i.items?.length ? i.items : ["Conseil 1", "Conseil 2", "Conseil 3"];
  const cover: DesignPage = {
    bg: { type: "color", color: i.bg ?? BRAND.sage },
    layers: [
      text((i.eyebrow ?? "Skin school").toUpperCase(), pad, pad, w - pad * 2, w * 0.026, { font: "body", weight: 600, letterSpacing: 3, color: BRAND.sageDeep }),
      text(i.headline ?? "Le guide", pad, h * 0.28, w - pad * 2, w * 0.1, { upper: true, lineHeight: 0.98 }),
      ...(i.packshot ? [img(i.packshot, w * 0.5, h * 0.55, w * 0.42, h * 0.38)] : []),
      text("Swipe →", pad, h - pad - w * 0.04, w * 0.4, w * 0.032, { font: "body", weight: 500 }),
      logo(pad, pad + w * 0.06, w * 0.2),
    ],
  };
  const pages: DesignPage[] = items.map((t, k) => ({
    bg: { type: "color", color: k % 2 ? BRAND.cream : BRAND.sand },
    layers: [
      text(String(k + 1).padStart(2, "0"), pad, pad, w * 0.3, w * 0.14, { color: BRAND.accent, weight: 400 }),
      text(t, pad, h * 0.32, w - pad * 2, w * 0.058, { lineHeight: 1.15 }),
      text(`${k + 2} / ${items.length + 2}`, w - pad - w * 0.2, h - pad - w * 0.035, w * 0.2, w * 0.026, { font: "body", align: "right", color: BRAND.forestSoft }),
    ],
  }));
  const last: DesignPage = {
    bg: { type: "color", color: BRAND.forest },
    layers: [
      text(i.cta ?? "Trouve ta routine avec le Skin Diag", pad, h * 0.34, w - pad * 2, w * 0.07, { color: BRAND.white, upper: true }),
      text("skinclean.fr", pad, h * 0.62, w - pad * 2, w * 0.035, { color: BRAND.sage, font: "body" }),
      logo(pad, h - pad - w * 0.06, w * 0.26, "light"),
    ],
  };
  return { w, h, pages: [cover, ...pages, last] };
}

/** Citation / manifeste typographique. */
export function tplQuote(i: TplInput): Design {
  const { w, h } = fmt(i.format);
  const pad = w * 0.1;
  return {
    w, h,
    pages: [{
      bg: { type: "color", color: i.bg ?? BRAND.forest },
      layers: [
        text("“", pad, h * 0.16, w * 0.3, w * 0.25, { color: BRAND.sage, weight: 400 }),
        text(i.headline ?? "Une routine simple, faite pour durer.", pad, h * 0.36, w - pad * 2, w * 0.07, { color: BRAND.white, lineHeight: 1.12 }),
        ...(i.sub ? [text(i.sub, pad, h * 0.72, w - pad * 2, w * 0.03, { color: BRAND.sage, font: "body", weight: 400 })] : []),
        logo(pad, h - pad - w * 0.05, w * 0.24, "light"),
      ],
    }],
  };
}

/** Story interactive (sondage / quiz) : la zone de réponse est à placer avec l'autocollant natif d'Instagram. */
export function tplStoryPoll(i: TplInput): Design {
  const { w, h } = FORMATS.story;
  const pad = w * 0.09;
  const opts = i.items?.length ? i.items : ["Oui", "Non"];
  return {
    w, h,
    pages: [{
      bg: { type: "color", color: i.bg ?? BRAND.sageSoft },
      layers: [
        logo(pad, pad * 1.4, w * 0.28),
        text((i.eyebrow ?? "Quiz skincare").toUpperCase(), pad, h * 0.18, w - pad * 2, w * 0.03, { font: "body", weight: 600, letterSpacing: 3, color: BRAND.sageDeep, align: "center" }),
        text(i.headline ?? "Ta peau tiraille après le nettoyage ?", pad, h * 0.22, w - pad * 2, w * 0.085, { align: "center", lineHeight: 1.05 }),
        ...(i.packshot ? [img(i.packshot, w * 0.25, h * 0.42, w * 0.5, h * 0.28)] : []),
        shape(pad, h * 0.74, w - pad * 2, w * 0.27, BRAND.white, { radius: 28, opacity: 0.92 }),
        text("Zone sticker sondage", pad, h * 0.74 + w * 0.03, w - pad * 2, w * 0.026, { font: "body", align: "center", color: BRAND.forestSoft }),
        text(opts.join("   ·   "), pad, h * 0.74 + w * 0.11, w - pad * 2, w * 0.05, { align: "center", weight: 600 }),
      ],
    }],
  };
}

/** Offre promotionnelle (code, pourcentage). */
export function tplPromo(i: TplInput): Design {
  const { w, h } = fmt(i.format);
  const pad = w * 0.08;
  return {
    w, h,
    pages: [{
      bg: { type: "color", color: i.bg ?? BRAND.forest },
      layers: [
        text((i.eyebrow ?? "Offre de bienvenue").toUpperCase(), pad, pad, w - pad * 2, w * 0.028, { font: "body", weight: 600, letterSpacing: 3, color: BRAND.sage }),
        text(i.headline ?? "-20 %", pad, h * 0.16, w - pad * 2, w * 0.24, { color: BRAND.white, weight: 400 }),
        text(i.sub ?? "sur ta première commande en t'inscrivant à la newsletter", pad, h * 0.16 + w * 0.3, w * 0.7, w * 0.04, { color: BRAND.white, font: "body", weight: 400, lineHeight: 1.35 }),
        ...(i.packshot ? [img(i.packshot, w * 0.48, h * 0.48, w * 0.48, h * 0.44)] : []),
        shape(pad, h - pad - w * 0.1, w * 0.36, w * 0.09, BRAND.white),
        text((i.cta ?? "Je m'inscris").toUpperCase(), pad, h - pad - w * 0.1 + w * 0.03, w * 0.36, w * 0.028, { font: "body", weight: 600, align: "center", letterSpacing: 2 }),
        text("Conditions sur skinclean.fr", w - pad - w * 0.4, h - pad - w * 0.03, w * 0.4, w * 0.02, { font: "body", align: "right", color: BRAND.sage }),
      ],
    }],
  };
}

/** Épingle routine : étapes numérotées. */
export function tplRoutine(i: TplInput & { packshots?: string[] }): Design {
  const { w, h } = fmt(i.format ?? "pinterest");
  const pad = w * 0.08;
  const steps = i.items ?? [];
  const shots = i.packshots ?? [];
  const rowH = (h * 0.62) / Math.max(steps.length, 1);
  const layers: Layer[] = [
    text((i.eyebrow ?? "Routine").toUpperCase(), pad, pad, w - pad * 2, w * 0.03, { font: "body", weight: 600, letterSpacing: 3, color: BRAND.sageDeep }),
    text(i.headline ?? "Ma routine", pad, pad + w * 0.06, w - pad * 2, w * 0.085, { upper: true }),
  ];
  steps.forEach((s, k) => {
    const y = h * 0.28 + k * rowH;
    layers.push(shape(pad, y, w - pad * 2, rowH - w * 0.025, k % 2 ? BRAND.white : BRAND.cream));
    if (shots[k]) layers.push(img(shots[k], pad + w * 0.02, y + w * 0.01, rowH * 0.8, rowH - w * 0.045));
    layers.push(text(`${k + 1}. ${s}`, pad + rowH * 0.9 + w * 0.03, y + rowH / 2 - w * 0.035, w - pad * 2 - rowH, w * 0.04, { font: "body", weight: 500, lineHeight: 1.2 }));
  });
  layers.push(logo(pad, h - pad - w * 0.06, w * 0.28));
  return { w, h, pages: [{ bg: { type: "color", color: i.bg ?? BRAND.sageSoft }, layers }] };
}

/** Couverture de vidéo (Reel / TikTok) : texte du hook en grand sur image ou couleur. */
export function tplVideoCover(i: TplInput): Design {
  const { w, h } = FORMATS.tiktok;
  const pad = w * 0.08;
  return {
    w, h,
    pages: [{
      bg: i.image ? { type: "image", color: BRAND.forest, src: i.image, overlay: "rgba(0,0,0,0.22)" } : { type: "color", color: i.bg ?? BRAND.sage },
      layers: [
        shape(pad, h * 0.38, w - pad * 2, w * 0.36, BRAND.white, { radius: 24, opacity: 0.94 }),
        text(i.headline ?? "POV : ta routine en 3 gestes", pad + w * 0.04, h * 0.38 + w * 0.05, w - pad * 2 - w * 0.08, w * 0.07, { align: "center", lineHeight: 1.05 }),
        ...(i.packshot ? [img(i.packshot, w * 0.3, h * 0.62, w * 0.4, h * 0.26)] : []),
        logo(w / 2 - w * 0.15, pad * 1.6, w * 0.3, i.image ? "light" : "dark"),
      ],
    }],
  };
}

/** Bannière large (site, newsletter, publicité paysage). */
export function tplBanner(i: TplInput): Design {
  const { w, h } = fmt(i.format ?? "banner");
  const pad = h * 0.14;
  return {
    w, h,
    pages: [{
      bg: { type: "color", color: i.bg ?? BRAND.sand },
      layers: [
        text((i.eyebrow ?? "Nouveau").toUpperCase(), pad, pad, w * 0.5, h * 0.045, { font: "body", weight: 600, letterSpacing: 3, color: BRAND.sageDeep }),
        text(i.headline ?? "Your skin. Your glow.", pad, pad + h * 0.1, w * 0.5, h * 0.13, { upper: true }),
        text(i.sub ?? "", pad, h * 0.58, w * 0.42, h * 0.05, { font: "body", weight: 400, color: BRAND.forestSoft, lineHeight: 1.35 }),
        shape(pad, h - pad - h * 0.13, w * 0.16, h * 0.13, BRAND.forest),
        text((i.cta ?? "Découvrir").toUpperCase(), pad, h - pad - h * 0.13 + h * 0.045, w * 0.16, h * 0.04, { font: "body", weight: 600, align: "center", color: BRAND.white, letterSpacing: 2 }),
        ...(i.packshot ? [img(i.packshot, w * 0.58, h * 0.08, w * 0.36, h * 0.84)] : []),
        logo(w - pad - w * 0.12, pad * 0.7, w * 0.12),
      ],
    }],
  };
}

export const TEMPLATE_GALLERY: { id: string; name: string; category: string; format: FormatKey; build: (i: TplInput) => Design; sample: TplInput }[] = [
  { id: "ig-product", name: "Produit en majesté", category: "Instagram", format: "instagram", build: tplProductHero, sample: { headline: "Un shot d'éclat chaque matin", eyebrow: "Glow Shot · Vitamine C 12 %", sub: "Le sérum qui réveille les teints ternes.", packshot: "/media/packshots/glow-shot-serum-vitamine-c.png" } },
  { id: "ig-ingredient", name: "Focus ingrédient", category: "Instagram", format: "instagram", build: tplIngredient, sample: { headline: "Niacinamide", sub: "Aide à réduire l'apparence des pores et à réguler l'aspect brillant.", packshot: "/media/packshots/clear-skin-serum-niacinamide.png" } },
  { id: "ig-carousel", name: "Carrousel éducatif", category: "Instagram", format: "instagram", build: tplCarousel, sample: { headline: "5 erreurs qui ternissent ton teint", items: ["Sauter le SPF quand il fait gris", "Frotter au lieu de tapoter", "Multiplier les actifs le même soir", "Oublier le cou", "Changer de routine chaque semaine"], packshot: "/media/packshots/daily-shield-spf50.png" } },
  { id: "ig-quote", name: "Citation de marque", category: "Instagram", format: "instagram_square", build: tplQuote, sample: { headline: "Moins de gestes, plus de constance.", sub: "La philosophie SKINCLEAN" } },
  { id: "story-poll", name: "Story sondage / quiz", category: "Story", format: "story", build: tplStoryPoll, sample: { headline: "Ta peau brille en fin de journée ?", items: ["Oui, la zone T", "Non, jamais"], packshot: "/media/packshots/matte-balance-gel-creme.png" } },
  { id: "story-promo", name: "Story offre", category: "Story", format: "story", build: tplPromo, sample: { headline: "-20 %", packshot: "/media/packshots/aqua-plump-serum-acide-hyaluronique.png" } },
  { id: "tiktok-cover", name: "Couverture TikTok / Reel", category: "TikTok", format: "tiktok", build: tplVideoCover, sample: { headline: "POV : ta peau arrête de briller à midi", packshot: "/media/packshots/clear-skin-serum-niacinamide.png" } },
  { id: "fb-product", name: "Post Facebook produit", category: "Facebook", format: "facebook", build: tplProductHero, sample: { headline: "La légèreté d'un nuage", eyebrow: "Cloud Cream", sub: "Hydratation légère pour peaux normales à mixtes.", packshot: "/media/packshots/cloud-cream-creme-hydratante.png" } },
  { id: "pin-routine", name: "Épingle routine", category: "Pinterest", format: "pinterest", build: tplRoutine as (i: TplInput) => Design, sample: { headline: "Routine glow du matin", items: ["Dew Drop", "Glow Shot", "Cloud Cream", "Daily Shield SPF 50"] } },
  { id: "news-header", name: "En-tête newsletter", category: "Newsletter", format: "newsletter", build: tplBanner, sample: { format: "newsletter", headline: "Ta routine hiver", eyebrow: "Newsletter", sub: "Confort, barrière cutanée et glow.", packshot: "/media/packshots/velvet-barrier-creme-riche.png" } },
  { id: "site-banner", name: "Bannière de site", category: "Bannière de site", format: "banner", build: tplBanner, sample: { headline: "Your skin. Your glow.", eyebrow: "Nouvelle collection", sub: "Des formules courtes et efficaces.", packshot: "/media/packshots/aqua-plump-serum-acide-hyaluronique.png", cta: "Découvrir" } },
  { id: "ad-square", name: "Publicité carrée", category: "Publicité", format: "ad_square", build: tplProductHero, sample: { format: "ad_square", headline: "Pores resserrés, peau nette", eyebrow: "Clear Skin · Niacinamide 10 %", sub: "Fais ton Skin Diag gratuit.", packshot: "/media/packshots/clear-skin-serum-niacinamide.png" } },
  { id: "ad-landscape", name: "Publicité paysage", category: "Publicité", format: "ad_landscape", build: tplBanner, sample: { format: "ad_landscape", headline: "Ta routine en 2 minutes", eyebrow: "Skin Diag", sub: "Gratuit, sans inscription.", cta: "Faire le test", packshot: "/media/packshots/dew-drop-toner-hydratant.png" } },
];
