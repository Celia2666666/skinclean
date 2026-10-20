/** Contenu et gabarits d'étiquettes SKINCLEAN (SVG, unités = px de l'image source). */
import { wordmarkTag, markTag } from "./brand.mjs";

export const INK = "#252523";
export const SAGE = "#5F7259";
const F = "Avenir Next";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
/** Largeur approx. d'un texte (Avenir Next) pour ajuster la taille. */
export const textW = (t, size, track = 0, caps = false) => t.length * size * (caps ? 0.66 : 0.54) + t.length * track;
export const fit = (t, size, maxW, track = 0, caps = false) => Math.min(size, size * (maxW / textW(t, size, track, caps)));

export function T(x, y, txt, { size = 12, weight = 400, fill = INK, track = 0, anchor = "start", family = F, style = "normal", opacity = 1, max, caps = false } = {}) {
  const s = max ? fit(txt, size, max, track, caps) : size;
  return `<text x="${x}" y="${y}" font-family="${family}" font-size="${s.toFixed(2)}" font-weight="${weight}" font-style="${style}" letter-spacing="${track}" text-anchor="${anchor}" fill="${fill}" fill-opacity="${opacity}">${esc(txt)}</text>`;
}
const R = (x, y, w, h, fill, extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;

/** Mélange une couleur hex avec du blanc (t=0 → blanc, 1 → couleur). */
export function tint(hex, t) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return "#" + c.map((v) => Math.round(255 - (255 - v) * t).toString(16).padStart(2, "0")).join("");
}

/* ─────────── Contenu des étiquettes (par slug du catalogue) ─────────── */
export const P = {
  // sérums — flacon pipette ambré
  "clear-skin-serum-niacinamide": { code: "S01", name: "Clear Skin", kind: "Sérum niacinamide 10 % + zinc", en: "Niacinamide 10% Serum", for: "Imperfections · pores · sébum", skin: "Peaux mixtes à grasses", size: "30 ml ℮ 1 fl.oz" },
  "glow-shot-serum-vitamine-c": { code: "S02", name: "Glow Shot", kind: "Sérum vitamine C 12 %", en: "Vitamin C 12% Serum", for: "Teint terne · éclat", skin: "Tous types de peau", size: "30 ml ℮ 1 fl.oz" },
  "aqua-plump-serum-acide-hyaluronique": { code: "S03", name: "Aqua Plump", kind: "Sérum acide hyaluronique + B5", en: "Hyaluronic Acid Serum", for: "Déshydratation · effet repulpé", skin: "Tous types de peau", size: "30 ml ℮ 1 fl.oz" },
  "calm-down-serum-centella": { code: "S04", name: "Calm Down", kind: "Sérum apaisant centella", en: "Soothing Centella Serum", for: "Rougeurs · sensibilité", skin: "Peaux sensibles & réactives", size: "30 ml ℮ 1 fl.oz" },
  "first-lines-serum-bakuchiol": { code: "S05", name: "First Lines", kind: "Sérum bakuchiol + peptides", en: "Bakuchiol & Peptide Serum", for: "Premières ridules · fermeté", skin: "Peaux normales à sèches", size: "30 ml ℮ 1 fl.oz" },
  "night-renew-serum-retinal": { code: "S06", name: "Night Renew", kind: "Sérum rétinal 0,05 %", en: "Retinal 0.05% Night Serum", for: "Ridules · grain de peau", skin: "Usage le soir uniquement", size: "30 ml ℮ 1 fl.oz" },
  // SPF — tube aluminium
  "daily-shield-spf50": { code: "P01", name: "Daily Shield", kind: "Fluide invisible SPF 50", en: "Invisible Fluid SPF 50", for: "Protection UVA/UVB · fini invisible", skin: "Peaux normales à grasses", size: "50 ml ℮ 1.7 fl.oz" },
  "mineral-calm-spf50": { code: "P02", name: "Mineral Calm", kind: "Crème solaire minérale SPF 50", en: "Mineral Sunscreen SPF 50", for: "Filtres minéraux · peaux réactives", skin: "Peaux sensibles & sèches", size: "50 ml ℮ 1.7 fl.oz" },
  // crèmes — pot blanc
  "cloud-cream-creme-hydratante": { code: "C01", name: "Cloud Cream", kind: "Crème hydratante légère", en: "Light Moisturising Cream", for: "Hydratation 24 h · confort", skin: "Peaux normales à mixtes", size: "50 ml ℮ 1.7 fl.oz" },
  "velvet-barrier-creme-riche": { code: "C02", name: "Velvet Barrier", kind: "Crème riche céramides", en: "Rich Ceramide Cream", for: "Sécheresse · barrière cutanée", skin: "Peaux sèches & sensibles", size: "50 ml ℮ 1.7 fl.oz" },
  // pot noir
  "smooth-gaze-creme-yeux-peptides": { code: "Y02", name: "Smooth Gaze", kind: "Crème contour des yeux peptides", en: "Peptide Eye Cream", for: "Ridules · cernes · fermeté", skin: "Contour des yeux", size: "15 ml ℮ 0.5 fl.oz" },
  "hydra-bloom-masque-hydratant": { code: "M01", name: "Hydra Bloom", kind: "Masque de nuit hydratant", en: "Overnight Hydrating Mask", for: "Déshydratation · teint fatigué", skin: "Tous types de peau", size: "75 ml ℮ 2.5 fl.oz" },
  // flacon pompe
  "clear-foam-nettoyant-purifiant": { code: "N02", name: "Clear Foam", kind: "Mousse nettoyante purifiante", en: "Purifying Foaming Cleanser", for: "Imperfections · points noirs · sébum", skin: "Peaux grasses & mixtes", size: "150 ml ℮ 5 fl.oz" },
  "silk-off-lait-demaquillant": { code: "D02", name: "Silk Off", kind: "Lait démaquillant nourrissant", en: "Nourishing Cleansing Milk", for: "Démaquille · nourrit · apaise", skin: "Peaux sèches & sensibles", size: "200 ml ℮ 6.7 fl.oz" },
  // flacon brume / tonique
  "fresh-mist-brume-hydratante": { code: "B01", name: "Fresh Mist", kind: "Brume visage hydratante", en: "Hydrating Face Mist", for: "Hydratation · fraîcheur", skin: "Tous types de peau", size: "100 ml ℮ 3.4 fl.oz" },
  "dew-drop-toner-hydratant": { code: "T01", name: "Dew Drop", kind: "Lotion tonique hydratante", en: "Hydrating Toner", for: "Déshydratation · éclat", skin: "Tous types de peau", size: "200 ml ℮ 6.7 fl.oz" },
  "smooth-reset-toner-exfoliant": { code: "T02", name: "Smooth Reset", kind: "Tonique exfoliant PHA + acide lactique", en: "Exfoliating Toner", for: "Grain de peau · teint terne", skin: "Peaux normales à mixtes", size: "150 ml ℮ 5 fl.oz" },
  "bha-clear-liquid-exfoliant": { code: "E02", name: "BHA Clear", kind: "Exfoliant liquide BHA 2 %", en: "2% BHA Liquid Exfoliant", for: "Points noirs · pores · imperfections", skin: "Peaux grasses & mixtes", size: "100 ml ℮ 3.4 fl.oz" },
  // tube yeux / soin ciblé
  "bright-eyes-contour-yeux-cafeine": { code: "Y01", name: "Bright Eyes", kind: "Contour des yeux caféine", en: "Caffeine Eye Gel", for: "Cernes · poches · regard fatigué", skin: "Tous types de peau", size: "15 ml ℮ 0.5 fl.oz" },
  "even-out-soin-acide-azelaique": { code: "K01", name: "Even Out", kind: "Soin ciblé acide azélaïque 10 %", en: "Azelaic Acid 10% Treatment", for: "Rougeurs · marques · imperfections", skin: "Peaux mixtes à grasses", size: "30 ml ℮ 1 fl.oz" },
  // tube souple
  "cloud-gel-nettoyant-doux": { code: "N01", name: "Cloud Gel", kind: "Gel nettoyant doux", en: "Gentle Gel Cleanser", for: "Nettoie sans tirailler", skin: "Tous types de peau", size: "150 ml ℮ 5 fl.oz" },
  "matte-balance-gel-creme": { code: "C03", name: "Matte Balance", kind: "Gel-crème matifiant", en: "Mattifying Gel Cream", for: "Brillance · pores · imperfections", skin: "Peaux grasses & mixtes", size: "50 ml ℮ 1.7 fl.oz" },
  "comfort-zone-creme-apaisante": { code: "C04", name: "Comfort Zone", kind: "Crème apaisante anti-rougeurs", en: "Soothing Anti-Redness Cream", for: "Rougeurs · sensibilité · inconfort", skin: "Peaux sensibles", size: "50 ml ℮ 1.7 fl.oz" },
  "pure-clay-masque-purifiant": { code: "M02", name: "Pure Clay", kind: "Masque purifiant aux argiles", en: "Purifying Clay Mask", for: "Pores · sébum · points noirs", skin: "Peaux grasses & mixtes", size: "75 ml ℮ 2.5 fl.oz" },
  // pot large
  "melt-away-baume-demaquillant": { code: "D01", name: "Melt Away", kind: "Baume démaquillant fondant", en: "Melting Cleansing Balm", for: "Maquillage · SPF · impuretés", skin: "Tous types de peau", size: "100 ml ℮ 3.4 fl.oz" },
  "glow-pads-toner-pads-eclat": { code: "T03", name: "Glow Pads", kind: "Disques tonifiants éclat PHA", en: "Glow Toner Pads", for: "Teint terne · grain de peau", skin: "Peaux normales à mixtes", size: "60 disques" },
  "calm-pads-pads-apaisants": { code: "T04", name: "Calm Pads", kind: "Disques tonifiants apaisants", en: "Soothing Toner Pads", for: "Rougeurs · échauffements", skin: "Peaux sensibles", size: "60 disques" },
  "polish-me-exfoliant-enzymatique": { code: "E01", name: "Polish Me", kind: "Poudre exfoliante enzymatique", en: "Enzyme Exfoliating Powder", for: "Grain de peau · éclat", skin: "Tous types de peau, même sensibles", size: "60 g ℮ 2.1 oz" },
};

/* ─────────── Gabarits ─────────── */

/** Étiquette verticale « apothicaire » (flacon pipette, pots, flacons). */
export async function labelClassic({ w, h, p, c, pad = 0.09, tintAmt = 0.95, scale = 1, wmColor = SAGE, ink = INK, showBg = true, compact = false }) {
  const x = w * pad, iw = w - 2 * x, u = (v) => v * scale;
  let s = "";
  if (showBg) s += R(0, 0, w, h, tint(c.bg, tintAmt));
  const top = h * 0.085;
  s += await wordmarkTag(x, top, iw * 0.42, wmColor);
  s += `<rect x="${w - x - u(46)}" y="${top - u(1)}" width="${u(46)}" height="${u(22)}" rx="${u(11)}" fill="${c.accent}"/>`;
  s += T(w - x - u(23), top + u(14.5), p.code, { size: u(11.5), weight: 600, track: u(1.2), anchor: "middle", fill: "#ffffff" });
  const ny = h * (compact ? 0.42 : 0.4);
  s += T(x, ny, p.name, { size: u(38), weight: 500, track: u(-0.3), max: iw, fill: ink });
  s += T(x, ny + u(26), p.kind.toUpperCase(), { size: u(12.5), weight: 500, track: u(1.6), max: iw, caps: true, fill: ink });
  s += T(x, ny + u(45), `(${p.en})`, { size: u(12), weight: 400, fill: ink, opacity: 0.75, max: iw });
  s += R(x, ny + u(64), u(34), u(3), c.accent);
  s += T(x, ny + u(92), p.for, { size: u(14.5), weight: 500, fill: ink, max: iw });
  s += T(x, ny + u(112), p.skin, { size: u(13), weight: 400, fill: ink, opacity: 0.78, max: iw });
  const by = h - h * 0.085;
  s += R(x, by - u(24), iw, u(0.8), ink, 'fill-opacity="0.55"');
  s += T(x, by, p.size, { size: u(12), weight: 500, fill: ink });
  s += T(w - x, by, "Dermatologie douce", { size: u(11), weight: 400, anchor: "end", fill: ink, opacity: 0.7 });
  return s;
}

/** Étiquette horizontale (pots larges, flacons cylindriques). */
export async function labelWide({ w, h, p, c, tintAmt = 0.5, scale = 1, ink = INK, wmColor = SAGE, showBg = true, padX = 0.08, sizeLine = true }) {
  const u = (v) => v * scale, x = w * padX, iw = w - 2 * x;
  let s = "";
  if (showBg) s += R(0, 0, w, h, tint(c.bg, tintAmt));
  const top = h * 0.11;
  s += await wordmarkTag(w / 2, top, Math.min(iw * 0.36, u(150)), wmColor, "middle");
  const ny = top + u(30) + h * 0.2;
  s += T(w / 2, ny, p.name, { size: u(40), weight: 500, track: u(-0.3), anchor: "middle", fill: ink, max: iw * 0.8 });
  s += T(w / 2, ny + u(26), p.kind.toUpperCase(), { size: u(12.5), weight: 500, track: u(1.8), anchor: "middle", fill: ink, max: iw * 0.8, caps: true });
  s += R(w / 2 - u(17), ny + u(40), u(34), u(3), c.accent);
  s += T(w / 2, ny + u(66), p.for, { size: u(14), weight: 500, anchor: "middle", fill: ink, max: iw * 0.8 });
  s += T(w / 2, ny + u(85), p.skin, { size: u(12.5), weight: 400, anchor: "middle", fill: ink, opacity: 0.78, max: iw * 0.8 });
  if (sizeLine) {
    const by = h - h * 0.1;
    s += T(w / 2 - iw * 0.32, by, p.code, { size: u(11.5), weight: 500, track: u(1.4), anchor: "middle", fill: ink, opacity: 0.8 });
    s += T(w / 2 + iw * 0.32, by, p.size, { size: u(11.5), weight: 500, anchor: "middle", fill: ink, opacity: 0.8 });
  }
  return s;
}

/** Tube vertical étroit : texte empilé, logo en bas comme sur les tubes de pharmacie. */
export async function labelTube({ w, h, p, c, scale = 1, ink = INK, wmColor = SAGE, padX = 0.12, topY = 0.06, band = true, align = "start" }) {
  const u = (v) => v * scale, x = align === "middle" ? w / 2 : w * padX, iw = w * (1 - 2 * padX);
  let s = "";
  let y = h * topY + u(28);
  s += T(x, y, p.name, { size: u(28), weight: 500, track: u(-0.2), max: iw, fill: ink, anchor: align });
  y += u(20);
  s += T(x, y, p.kind.toUpperCase(), { size: u(10), weight: 500, track: u(1.3), max: iw, caps: true, fill: ink, anchor: align });
  y += u(15);
  s += T(x, y, `(${p.en})`, { size: u(10), weight: 400, max: iw, fill: ink, opacity: 0.75, anchor: align });
  y += u(16);
  if (band) s += R(align === "middle" ? x - u(13) : x, y, u(26), u(2.5), c.accent);
  y += u(24);
  s += T(x, y, p.for, { size: u(11), weight: 500, max: iw, fill: ink, anchor: align });
  y += u(15);
  s += T(x, y, p.skin, { size: u(10), weight: 400, max: iw, fill: ink, opacity: 0.78, anchor: align });
  return s;
}

export { wordmarkTag, markTag, R };
