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
  /** Carrousel : packshot affiché sur chaque page conseil (même index que items, vide = page texte seule). */
  packshots?: (string | undefined)[];
  /** Carrousel : nom du produit affiché sous chaque mise en scène (même index que packshots). */
  labels?: (string | undefined)[];
}

const fmt = (f: FormatKey = "instagram") => FORMATS[f];
/** Ratios hauteur/largeur des fichiers de logo (pour réserver leur place exacte). */
const LOGO_RATIO = { wordmark: 159 / 700, mark: 400 / 320, full: 187 / 700 };

/*
 * Mise en page : chaque gabarit découpe le visuel en zones qui ne se chevauchent pas.
 * Chaque texte a sa boîte (maxH) : le moteur de rendu réduit la taille si besoin et centre verticalement.
 */

/** Produit en majesté : surtitre, titre, packshot, sous-titre et logo, sans chevauchement. */
export function tplProductHero(i: TplInput): Design {
  const { w, h } = fmt(i.format);
  const pad = w * 0.08;
  const ratio = h / w;
  const titleSize = w * (ratio > 1.4 ? 0.085 : ratio < 1.1 ? 0.07 : 0.078);
  const logoW = w * 0.24, logoH = logoW * LOGO_RATIO.wordmark;
  const eyebrowH = w * 0.04;
  const titleY = pad + eyebrowH + w * 0.025;
  const titleH = h * (ratio > 1.4 ? 0.2 : 0.22);
  const footerH = Math.max(logoH, w * 0.09);
  const footerY = h - pad - footerH;
  const imgY = titleY + titleH + h * 0.02;
  const imgH = Math.max(h * 0.2, footerY - imgY - h * 0.03);
  const layers: Layer[] = [
    text((i.eyebrow ?? "SKINCLEAN").toUpperCase(), pad, pad, w - pad * 2, w * 0.026, { font: "body", weight: 600, letterSpacing: 3, color: i.accent ?? BRAND.sageDeep, maxH: eyebrowH, valign: "middle" }),
    text(i.headline ?? "Your skin. Your glow.", pad, titleY, w - pad * 2, titleSize, { upper: true, maxH: titleH, valign: "top" }),
  ];
  if (i.packshot) layers.push(img(i.packshot, pad, imgY, w - pad * 2, imgH, { shadow: true }));
  if (i.sub) layers.push(text(i.sub, pad, footerY, w - pad * 3 - logoW, w * 0.03, { font: "body", weight: 400, lineHeight: 1.3, color: BRAND.forestSoft, maxH: footerH, valign: "middle" }));
  layers.push(logo(w - pad - logoW, footerY + (footerH - logoH) / 2, logoW));
  return { w, h, pages: [{ bg: { type: "color", color: i.bg ?? BRAND.sand }, layers }] };
}

/** Focus ingrédient : badge, nom de l'actif, rôle à gauche, packshot à droite. */
export function tplIngredient(i: TplInput): Design {
  const { w, h } = fmt(i.format);
  const pad = w * 0.08;
  const badgeW = w * 0.26, badgeH = w * 0.06;
  const logoW = w * 0.22, logoH = logoW * LOGO_RATIO.wordmark;
  const titleY = pad + badgeH + h * 0.05;
  const titleH = h * 0.22;
  const bodyY = titleY + titleH + h * 0.03;
  const bodyW = i.packshot ? w * 0.46 : w - pad * 2;
  const layers: Layer[] = [
    shape(pad, pad, badgeW, badgeH, BRAND.forest, { radius: badgeH / 2 }),
    text("FOCUS ACTIF", pad, pad, badgeW, w * 0.024, { font: "body", weight: 600, align: "center", color: BRAND.white, letterSpacing: 2, maxH: badgeH, valign: "middle" }),
    text(i.headline ?? "Niacinamide", pad, titleY, w - pad * 2, w * 0.12, { upper: true, lineHeight: 0.98, maxH: titleH, valign: "bottom" }),
    text(i.sub ?? "", pad, bodyY, bodyW, w * 0.034, { font: "body", weight: 400, lineHeight: 1.4, color: BRAND.forestSoft, maxH: h - pad - logoH - h * 0.04 - bodyY }),
  ];
  if (i.packshot) layers.push(img(i.packshot, w * 0.56, bodyY, w * 0.4, h - pad - bodyY));
  layers.push(logo(pad, h - pad - logoH, logoW));
  return { w, h, pages: [{ bg: { type: "color", color: i.bg ?? BRAND.sageSoft }, layers }] };
}

/** Palettes des mises en scène produit (fond décoratif, socle). */
const SCENES = [
  { back: BRAND.blush, base: "#D9C3B6" },
  { back: BRAND.sage, base: "#B9C6B3" },
  { back: BRAND.butter, base: "#DDCFA8" },
  { back: BRAND.sageSoft, base: "#C9D3C4" },
];

/**
 * Mise en scène d'un produit dans une zone : arche, soleil ou podium, socle, ombre portée et étiquette.
 * Trois compositions qui alternent d'une page à l'autre pour un carrousel vivant.
 */
export function productScene(x: number, y: number, sw: number, sh: number, src: string, label: string | undefined, variant: number): Layer[] {
  const c = SCENES[variant % SCENES.length];
  const v = variant % 3;
  const labelH = label ? sh * 0.09 : 0;
  const h = sh - labelH - (label ? sh * 0.03 : 0);
  const cx = x + sw / 2;
  const out: Layer[] = [];
  if (v === 0) {
    // Arche haute derrière le produit, posé sur un socle
    const aw = Math.min(sw * 0.62, h * 0.62);
    out.push(shape(cx - aw / 2, y, aw, h * 0.9, c.back, { radius: aw / 2 }));
    out.push(shape(cx - aw * 0.62, y + h * 0.86, aw * 1.24, h * 0.1, c.base, { radius: h * 0.05 }));
    out.push(img(src, cx - aw * 0.48, y + h * 0.1, aw * 0.96, h * 0.8, { shadow: true }));
  } else if (v === 1) {
    // Grand soleil, anneau fin et petite bulle décorative
    const d = Math.min(sw * 0.8, h * 0.86);
    const cy = y + h * 0.47;
    out.push(shape(cx - d * 0.56, cy - d * 0.56, d * 1.12, d * 1.12, "rgba(0,0,0,0)", { radius: d * 0.56, stroke: BRAND.accent, opacity: 0.35 }));
    out.push(shape(cx - d / 2, cy - d / 2, d, d, c.back, { radius: d / 2 }));
    out.push(shape(cx + d * 0.3, cy - d * 0.5, d * 0.16, d * 0.16, BRAND.white, { radius: d * 0.08, opacity: 0.85 }));
    out.push(img(src, cx - d * 0.36, cy - d * 0.44, d * 0.72, d * 0.9, { shadow: true }));
  } else {
    // Podium à deux marches, produit en majesté
    const pw = Math.min(sw * 0.78, h * 0.9);
    out.push(shape(x + sw * 0.04, y + h * 0.08, sw * 0.92, h * 0.72, c.back, { radius: sw * 0.05, opacity: 0.7 }));
    out.push(shape(cx - pw / 2, y + h * 0.82, pw, h * 0.1, c.base, { radius: h * 0.03 }));
    out.push(shape(cx - pw * 0.36, y + h * 0.74, pw * 0.72, h * 0.1, BRAND.white, { radius: h * 0.03 }));
    out.push(img(src, cx - pw * 0.34, y + h * 0.02, pw * 0.68, h * 0.74, { shadow: true }));
  }
  if (label) {
    const lw = Math.min(sw * 0.86, Math.max(sw * 0.4, label.length * sh * 0.032));
    out.push(shape(cx - lw / 2, y + sh - labelH, lw, labelH, BRAND.forest, { radius: labelH / 2 }));
    out.push(text(label, cx - lw / 2, y + sh - labelH, lw, labelH * 0.42, { font: "body", weight: 600, align: "center", color: BRAND.white, maxH: labelH, valign: "middle" }));
  }
  return out;
}

/** Carrousel éducatif : couverture + une page par conseil + page CTA. */
export function tplCarousel(i: TplInput): Design {
  const { w, h } = fmt(i.format ?? "instagram");
  const pad = w * 0.09;
  const items = i.items?.length ? i.items : ["Conseil 1", "Conseil 2", "Conseil 3"];
  const logoW = w * 0.22, logoH = logoW * LOGO_RATIO.wordmark;
  const total = items.length + 2;
  const eyebrowY = pad + logoH + h * 0.06;
  const coverTitleY = eyebrowY + w * 0.06;
  const coverTitleH = h * 0.26;
  const imgY = coverTitleY + coverTitleH + h * 0.03;
  const cover: DesignPage = {
    bg: { type: "color", color: i.bg ?? BRAND.sage },
    layers: [
      logo(pad, pad, logoW),
      text((i.eyebrow ?? "Skin school").toUpperCase(), pad, eyebrowY, w - pad * 2, w * 0.026, { font: "body", weight: 600, letterSpacing: 3, color: BRAND.sageDeep, maxH: w * 0.045, valign: "middle" }),
      text(i.headline ?? "Le guide", pad, coverTitleY, w - pad * 2, w * 0.095, { upper: true, lineHeight: 1, maxH: coverTitleH, valign: "top" }),
      ...(i.packshot ? [img(i.packshot, w * 0.46, imgY, w * 0.46, h - pad - imgY)] : []),
      text("Swipe →", pad, h - pad - w * 0.06, w * 0.36, w * 0.032, { font: "body", weight: 500, maxH: w * 0.06, valign: "middle" }),
    ],
  };
  const pages: DesignPage[] = items.map((t, k) => {
    const shotK = i.packshots?.[k];
    // Format vertical (TikTok / Story) : on reste dans la zone sûre, hors colonne d'icônes à droite et légende en bas
    const tall = h / w > 1.6;
    const textW = tall ? w - pad - w * 0.2 : w - pad * 2;
    const sceneY = tall ? h * 0.36 : h * 0.37, sceneBottom = tall ? h * 0.7 : h - pad - logoH - h * 0.025;
    return {
    bg: { type: "color", color: k % 2 ? BRAND.cream : BRAND.sand },
    layers: [
      text(String(k + 1).padStart(2, "0"), pad, pad, w * 0.4, w * 0.14, { color: BRAND.accent, weight: 400, lineHeight: 1, maxH: w * 0.16 }),
      ...(shotK
        ? [text(t, pad, tall ? h * 0.15 : h * 0.14, textW, w * 0.058, { lineHeight: 1.16, maxH: tall ? h * 0.19 : h * 0.21, valign: "middle" }),
          ...productScene(pad, sceneY, textW, sceneBottom - sceneY, shotK, i.labels?.[k], k)]
        : [text(t, pad, h * 0.28, w - pad * 2, w * 0.062, { lineHeight: 1.18, maxH: h * 0.46, valign: "middle" })]),
      logo(pad, h - pad - logoH, logoW),
      text(`${k + 2} / ${total}`, w - pad - w * 0.25, h - pad - logoH, w * 0.25, w * 0.026, { font: "body", align: "right", color: BRAND.forestSoft, maxH: logoH, valign: "middle" }),
    ],
  };
  });
  const last: DesignPage = {
    bg: { type: "color", color: BRAND.forest },
    layers: [
      text(i.cta ?? "Trouve ta routine avec le Skin Diag", pad, h * 0.26, w - pad * 2, w * 0.075, { color: BRAND.white, upper: true, lineHeight: 1.05, maxH: h * 0.3, valign: "bottom" }),
      text("skinclean.fr", pad, h * 0.6, w - pad * 2, w * 0.035, { color: BRAND.sage, font: "body", maxH: w * 0.06 }),
      logo(pad, h - pad - w * 0.26 * LOGO_RATIO.wordmark, w * 0.26, "light"),
    ],
  };
  return { w, h, pages: [cover, ...pages, last] };
}

/** Répartit des produits sur toutes les pages d'un carrousel (en boucle) : chaque page a sa mise en scène. */
export function carouselJars<T>(count: number, items: (T | undefined)[]): T[] {
  const list = items.filter((x): x is T => !!x);
  if (!list.length) return [];
  return Array.from({ length: count }, (_, k) => list[k % list.length]);
}

/** Citation / manifeste typographique. */
export function tplQuote(i: TplInput): Design {
  const { w, h } = fmt(i.format);
  const pad = w * 0.1;
  const logoW = w * 0.24, logoH = logoW * LOGO_RATIO.wordmark;
  const quoteY = pad;
  const titleY = quoteY + w * 0.2;
  const subH = i.sub ? w * 0.07 : 0;
  const titleH = h - pad - logoH - h * 0.05 - subH - titleY;
  return {
    w, h,
    pages: [{
      bg: { type: "color", color: i.bg ?? BRAND.forest },
      layers: [
        text("“", pad, quoteY, w * 0.3, w * 0.24, { color: BRAND.sage, weight: 400, lineHeight: 1, maxH: w * 0.2 }),
        text(i.headline ?? "Une routine simple, faite pour durer.", pad, titleY, w - pad * 2, w * 0.075, { color: BRAND.white, lineHeight: 1.15, maxH: titleH, valign: "middle" }),
        ...(i.sub ? [text(i.sub, pad, titleY + titleH, w - pad * 2, w * 0.03, { color: BRAND.sage, font: "body", weight: 400, maxH: subH, valign: "middle" })] : []),
        logo(pad, h - pad - logoH, logoW, "light"),
      ],
    }],
  };
}

/** Story interactive (sondage / quiz) : la zone de réponse est à placer avec l'autocollant natif d'Instagram. */
export function tplStoryPoll(i: TplInput): Design {
  const { w, h } = FORMATS.story;
  const pad = w * 0.09;
  const opts = i.items?.length ? i.items : ["Oui", "Non"];
  const logoW = w * 0.28;
  const boxY = h * 0.75, boxH = w * 0.28;
  return {
    w, h,
    pages: [{
      bg: { type: "color", color: i.bg ?? BRAND.sageSoft },
      layers: [
        logo((w - logoW) / 2, pad * 1.4, logoW),
        text((i.eyebrow ?? "Quiz skincare").toUpperCase(), pad, h * 0.15, w - pad * 2, w * 0.03, { font: "body", weight: 600, letterSpacing: 3, color: BRAND.sageDeep, align: "center", maxH: w * 0.05, valign: "middle" }),
        text(i.headline ?? "Ta peau tiraille après le nettoyage ?", pad, h * 0.19, w - pad * 2, w * 0.085, { align: "center", lineHeight: 1.08, maxH: h * 0.21, valign: "middle" }),
        ...(i.packshot ? [img(i.packshot, w * 0.2, h * 0.42, w * 0.6, h * 0.3)] : []),
        shape(pad, boxY, w - pad * 2, boxH, BRAND.white, { radius: 32, opacity: 0.95 }),
        text("Zone du sticker sondage", pad, boxY + boxH * 0.06, w - pad * 2, w * 0.026, { font: "body", align: "center", color: BRAND.forestSoft, maxH: boxH * 0.26, valign: "middle" }),
        text(opts.join("   ·   "), pad + w * 0.04, boxY + boxH * 0.36, w - pad * 2 - w * 0.08, w * 0.05, { align: "center", weight: 600, maxH: boxH * 0.52, valign: "middle" }),
      ],
    }],
  };
}

/** Offre promotionnelle (code, pourcentage). */
export function tplPromo(i: TplInput): Design {
  const { w, h } = fmt(i.format);
  const pad = w * 0.08;
  const btnW = w * 0.4, btnH = w * 0.1;
  const headlineY = pad + w * 0.07;
  const headlineH = w * 0.26;
  const subY = headlineY + headlineH + h * 0.015;
  const subH = h * 0.15;
  const imgY = subY + subH + h * 0.02;
  const footerY = h - pad - btnH;
  return {
    w, h,
    pages: [{
      bg: { type: "color", color: i.bg ?? BRAND.forest },
      layers: [
        text((i.eyebrow ?? "Offre de bienvenue").toUpperCase(), pad, pad, w - pad * 2, w * 0.028, { font: "body", weight: 600, letterSpacing: 3, color: BRAND.sage, maxH: w * 0.05, valign: "middle" }),
        text(i.headline ?? "-20 %", pad, headlineY, w - pad * 2, w * 0.24, { color: BRAND.white, weight: 400, lineHeight: 1, maxH: headlineH, valign: "middle" }),
        text(i.sub ?? "sur ta première commande en t'inscrivant à la newsletter", pad, subY, w * 0.72, w * 0.042, { color: BRAND.white, font: "body", weight: 400, lineHeight: 1.35, maxH: subH }),
        ...(i.packshot ? [img(i.packshot, w * 0.46, imgY, w * 0.46, footerY - imgY - h * 0.03)] : []),
        shape(pad, footerY, btnW, btnH, BRAND.white, { radius: btnH / 2 }),
        text((i.cta ?? "Je m'inscris").toUpperCase(), pad, footerY, btnW, w * 0.03, { font: "body", weight: 600, align: "center", letterSpacing: 2, maxH: btnH, valign: "middle" }),
        text("Conditions sur skinclean.fr", w - pad - w * 0.4, footerY, w * 0.4, w * 0.022, { font: "body", align: "right", color: BRAND.sage, maxH: btnH, valign: "middle" }),
      ],
    }],
  };
}

/** Routine en étapes numérotées (Pinterest, Facebook) : titre, lignes d'étapes alignées, logo en pied. */
export function tplRoutine(i: TplInput & { packshots?: string[] }): Design {
  const { w, h } = fmt(i.format ?? "pinterest");
  const pad = w * 0.08;
  const steps = (i.items ?? []).slice(0, 6);
  const shots = i.packshots ?? [];
  const logoW = w * 0.26, logoH = logoW * LOGO_RATIO.wordmark;
  const titleY = pad + w * 0.065;
  const titleH = h * (h / w > 1.2 ? 0.14 : 0.15);
  const listY = titleY + titleH + h * 0.03;
  const listBottom = h - pad - logoH - h * 0.035;
  const gap = w * 0.02;
  const rowH = (listBottom - listY - gap * Math.max(steps.length - 1, 0)) / Math.max(steps.length, 1);
  const layers: Layer[] = [
    text((i.eyebrow ?? "Routine").toUpperCase(), pad, pad, w - pad * 2, w * 0.03, { font: "body", weight: 600, letterSpacing: 3, color: BRAND.sageDeep, maxH: w * 0.05, valign: "middle" }),
    text(i.headline ?? "Ma routine", pad, titleY, w - pad * 2, w * 0.075, { upper: true, lineHeight: 1.02, maxH: titleH, valign: "middle" }),
  ];
  steps.forEach((s, k) => {
    const y = listY + k * (rowH + gap);
    const hasImg = !!shots[k];
    const thumb = Math.min(rowH * 0.84, w * 0.18);
    const textX = pad + w * 0.04 + (hasImg ? thumb + w * 0.02 : 0);
    layers.push(shape(pad, y, w - pad * 2, rowH, k % 2 ? BRAND.white : BRAND.cream, { radius: w * 0.015 }));
    if (hasImg) layers.push(img(shots[k], pad + w * 0.025, y + (rowH - thumb) / 2, thumb, thumb));
    layers.push(text(`${k + 1}. ${s}`, textX, y, w - pad - w * 0.03 - textX, Math.min(w * 0.042, rowH * 0.34), { font: "body", weight: 500, lineHeight: 1.2, maxH: rowH, valign: "middle" }));
  });
  layers.push(logo(pad, h - pad - logoH, logoW));
  return { w, h, pages: [{ bg: { type: "color", color: i.bg ?? BRAND.sageSoft }, layers }] };
}

/** Couverture de vidéo (Reel / TikTok) : logo centré, hook centré dans un cartouche, packshot centré. */
export function tplVideoCover(i: TplInput): Design {
  const { w, h } = FORMATS.tiktok;
  const pad = w * 0.08;
  const logoW = w * 0.34, logoH = logoW * LOGO_RATIO.wordmark;
  const logoY = h * 0.13;
  const boxY = logoY + logoH + h * 0.06, boxH = h * 0.22;
  const imgY = boxY + boxH + h * 0.04;
  return {
    w, h,
    pages: [{
      bg: i.image ? { type: "image", color: BRAND.forest, src: i.image, overlay: "rgba(0,0,0,0.22)" } : { type: "color", color: i.bg ?? BRAND.sage },
      layers: [
        logo((w - logoW) / 2, logoY, logoW, i.image ? "light" : "dark"),
        shape(pad, boxY, w - pad * 2, boxH, BRAND.white, { radius: 40, opacity: 0.95 }),
        text(i.headline ?? "POV : ta routine en 3 gestes", pad + w * 0.07, boxY, w - pad * 2 - w * 0.14, w * 0.072, { align: "center", lineHeight: 1.12, maxH: boxH, valign: "middle" }),
        ...(i.packshot ? [img(i.packshot, w * 0.22, imgY, w * 0.56, h * 0.82 - imgY)] : []),
      ],
    }],
  };
}

/** Bannière large (site, newsletter, publicité paysage) : texte à gauche, produit à droite. */
export function tplBanner(i: TplInput): Design {
  const { w, h } = fmt(i.format ?? "banner");
  const pad = h * 0.12;
  const colW = w * 0.52;
  const logoW = w * 0.12, logoH = logoW * LOGO_RATIO.wordmark;
  const btnW = Math.max(w * 0.16, h * 0.5), btnH = h * 0.13;
  const titleY = pad + h * 0.09;
  const btnY = h - pad - btnH;
  const subH = i.sub ? h * 0.15 : 0;
  const titleH = btnY - h * 0.05 - subH - titleY;
  return {
    w, h,
    pages: [{
      bg: { type: "color", color: i.bg ?? BRAND.sand },
      layers: [
        text((i.eyebrow ?? "Nouveau").toUpperCase(), pad, pad, colW, h * 0.042, { font: "body", weight: 600, letterSpacing: 3, color: BRAND.sageDeep, maxH: h * 0.07, valign: "middle" }),
        text(i.headline ?? "Your skin. Your glow.", pad, titleY, colW, h * 0.13, { upper: true, lineHeight: 1.02, maxH: titleH, valign: "middle" }),
        ...(i.sub ? [text(i.sub, pad, titleY + titleH, colW * 0.92, h * 0.048, { font: "body", weight: 400, color: BRAND.forestSoft, lineHeight: 1.3, maxH: subH, valign: "middle" })] : []),
        shape(pad, btnY, btnW, btnH, BRAND.forest, { radius: btnH / 2 }),
        text((i.cta ?? "Découvrir").toUpperCase(), pad, btnY, btnW, h * 0.04, { font: "body", weight: 600, align: "center", color: BRAND.white, letterSpacing: 2, maxH: btnH, valign: "middle" }),
        ...(i.packshot ? [img(i.packshot, w * 0.6, h * 0.1, w * 0.26, h * 0.8)] : []),
        logo(w - pad - logoW, pad, logoW),
      ],
    }],
  };
}

/** Photo produit sur fond uni (pour les fiches du site) : packshot centré, sans texte. */
export function tplProductShot(i: TplInput): Design {
  const { w, h } = fmt(i.format ?? "instagram_square");
  const m = w * 0.1;
  return { w, h, pages: [{ bg: { type: "color", color: i.bg ?? BRAND.sand }, layers: i.packshot ? [img(i.packshot, m, m, w - m * 2, h - m * 2, { shadow: true })] : [] }] };
}

/** Produit et ses bénéfices : packshot à droite, trois bénéfices numérotés à gauche. */
export function tplProductBenefits(i: TplInput): Design {
  const { w, h } = fmt(i.format ?? "instagram");
  const pad = w * 0.08;
  const logoW = w * 0.22, logoH = logoW * LOGO_RATIO.wordmark;
  const items = (i.items ?? []).filter(Boolean).slice(0, 3);
  const titleY = pad + w * 0.06;
  const titleH = h * 0.18;
  const listY = titleY + titleH + h * 0.04;
  const listBottom = h - pad - logoH - h * 0.04;
  const rowH = (listBottom - listY) / Math.max(items.length, 1);
  const colW = i.packshot ? w * 0.5 : w - pad * 2;
  const layers: Layer[] = [
    text((i.eyebrow ?? "SKINCLEAN").toUpperCase(), pad, pad, w - pad * 2, w * 0.026, { font: "body", weight: 600, letterSpacing: 3, color: BRAND.sageDeep, maxH: w * 0.045, valign: "middle" }),
    text(i.headline ?? "Le produit", pad, titleY, w - pad * 2, w * 0.08, { upper: true, lineHeight: 1.02, maxH: titleH, valign: "middle" }),
  ];
  items.forEach((t, k) => {
    const y = listY + k * rowH;
    layers.push(text(String(k + 1).padStart(2, "0"), pad, y, w * 0.12, w * 0.05, { color: BRAND.accent, weight: 400, maxH: rowH * 0.9, valign: "middle" }));
    layers.push(text(t, pad + w * 0.12, y, colW - w * 0.12, w * 0.036, { font: "body", weight: 500, lineHeight: 1.25, maxH: rowH * 0.9, valign: "middle" }));
  });
  if (i.packshot) layers.push(img(i.packshot, w * 0.6, listY, w * 0.34, listBottom - listY, { shadow: true }));
  layers.push(logo(pad, h - pad - logoH, logoW));
  return { w, h, pages: [{ bg: { type: "color", color: i.bg ?? BRAND.sageSoft }, layers }] };
}

export const TEMPLATE_GALLERY: { id: string; name: string; category: string; format: FormatKey; build: (i: TplInput) => Design; sample: TplInput }[] = [
  { id: "product-new", name: "Annonce nouveau produit", category: "Produit", format: "instagram", build: tplProductHero, sample: { headline: "Nouveau : Spot Hero Night", eyebrow: "Nouveauté", sub: "Il travaille pendant que tu dors.", packshot: "/media/packshots/spot-hero-night-patchs-nuit.png" } },
  { id: "product-shot", name: "Photo produit (fond uni)", category: "Produit", format: "instagram_square", build: tplProductShot, sample: { packshot: "/media/packshots/cloud-cream-creme-hydratante.png" } },
  { id: "product-benefits", name: "Produit et bénéfices", category: "Produit", format: "instagram", build: tplProductBenefits, sample: { headline: "Clear Skin", eyebrow: "Sérum niacinamide 10 %", items: ["Aide à réduire l'apparence des imperfections", "Pores visiblement resserrés", "Fini mat sans dessécher"], packshot: "/media/packshots/clear-skin-serum-niacinamide.png" } },
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
