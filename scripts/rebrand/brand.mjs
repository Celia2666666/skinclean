/** Logo SKINCLEAN → calques recolorables (data URI PNG transparents) pour les étiquettes SVG. */
import sharp from "sharp";

const SRC = new URL("../../public/media/brand/logo-full.webp", import.meta.url).pathname;
const cache = new Map();

async function alphaCrop([x0, y0, x1, y1], keepColor, color) {
  const key = [x0, y0, keepColor, color].join();
  if (cache.has(key)) return cache.get(key);
  const w = x1 - x0, h = y1 - y0;
  const { data } = await sharp(SRC).extract({ left: x0, top: y0, width: w, height: h }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const bg = [252, 251, 247];
  const [cr, cg, cb] = color ? [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16)) : [0, 0, 0];
  for (let i = 0; i < data.length; i += 4) {
    const d = Math.hypot(data[i] - bg[0], data[i + 1] - bg[1], data[i + 2] - bg[2]);
    // encre du wordmark ≈ rgb(110,124,104) → distance ≈ 230
    const a = Math.max(0, Math.min(1, (d - 12) / (keepColor ? 70 : 150)));
    if (!keepColor) { data[i] = cr; data[i + 1] = cg; data[i + 2] = cb; }
    data[i + 3] = Math.round(a * 255);
  }
  const png = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
  const out = { uri: `data:image/png;base64,${png.toString("base64")}`, ratio: w / h };
  cache.set(key, out);
  return out;
}

/** Wordmark « skinclean » d'une couleur unie. */
export const wordmark = (color = "#5F7259") => alphaCrop([135, 775, 1122, 972], false, color);
/** Symbole S monochrome (impression une couleur). */
export const markMono = (color = "#5F7259") => alphaCrop([398, 216, 862, 754], false, color);
/** Symbole S en couleurs d'origine. */
export const markColor = () => alphaCrop([398, 216, 862, 754], true);

/** <image> SVG du wordmark, largeur w, ancré en (x,y) haut-gauche ; anchor "middle" possible. */
export async function wordmarkTag(x, y, w, color, anchor = "start") {
  const wm = await wordmark(color);
  const h = w / wm.ratio;
  const xx = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
  return `<image href="${wm.uri}" x="${xx}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"/>`;
}
export async function markTag(x, y, h, color, anchor = "start") {
  const m = color ? await markMono(color) : await markColor();
  const w = h * m.ratio;
  const xx = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
  return `<image href="${m.uri}" x="${xx}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"/>`;
}
