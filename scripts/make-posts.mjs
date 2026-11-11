/**
 * Génère les 9 visuels du plan de communication (public/media/posts/post-N.webp).
 * Sources des images : packshots SKINCLEAN et photos Pexels déjà présentes dans le projet (licence Pexels).
 * Usage : node scripts/make-posts.mjs
 */
import sharp from "sharp";
import fs from "node:fs";

sharp.cache(false);
const OUT = "public/media/posts";
fs.mkdirSync(OUT, { recursive: true });

const C = { forest: "#1F3329", sage: "#D8DFD4", sageDeep: "#4A6354", cream: "#FAF9F6", ivory: "#FFFFFF", sand: "#EFEEEA" };
const FONT = "Helvetica Neue, Helvetica, Arial, sans-serif";
const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const packshot = (f) => `public/media/packshots/${f}.png`;
const photo = (id) => `public/media/reviews/avis-${id}.webp`;

/** Calque texte : titre sur plusieurs lignes, sous-titre, puces, étiquette réseau, signature. */
function textLayer({ w, h, lines, size, color, y0, sub, subColor, bullets, bulletColor, tag, tagBg = C.ivory, tagColor = C.forest, footer, footerColor }) {
  let y = y0;
  const parts = [];
  for (const [i, l] of lines.entries()) {
    parts.push(`<text x="80" y="${y}" font-family="${FONT}" font-weight="${i === 0 ? 600 : 500}" font-size="${size}" fill="${color}">${esc(l)}</text>`);
    y += size * 1.08;
  }
  if (sub) { y += 24; parts.push(`<text x="80" y="${y}" font-family="${FONT}" font-size="${Math.round(size * 0.36)}" fill="${subColor}">${esc(sub)}</text>`); y += size * 0.5; }
  if (bullets) {
    y += 30;
    for (const b of bullets) {
      parts.push(`<rect x="80" y="${y - 26}" width="14" height="14" rx="7" fill="${bulletColor}"/><text x="112" y="${y - 12}" font-family="${FONT}" font-size="38" fill="${bulletColor}">${esc(b)}</text>`);
      y += 66;
    }
  }
  if (tag) parts.push(`<rect x="80" y="70" width="${tag.length * 23 + 60}" height="56" rx="28" fill="${tagBg}"/><text x="104" y="108" font-family="${FONT}" font-weight="600" font-size="28" letter-spacing="3" fill="${tagColor}">${esc(tag.toUpperCase())}</text>`);
  if (footer) parts.push(`<text x="80" y="${h - 70}" font-family="${FONT}" font-size="28" letter-spacing="2" fill="${footerColor}">${esc(footer)}</text>`);
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${parts.join("")}</svg>`);
}

const gradient = (w, h, from = 0.0, to = 0.82) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16241D" stop-opacity="${to}"/><stop offset="0.55" stop-color="#16241D" stop-opacity="${from}"/><stop offset="1" stop-color="#16241D" stop-opacity="${to}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`);

async function product({ file, w, h, bg, items, scale = 0.62, bottom = 0.08, ...text }) {
  const comps = [];
  const n = items.length;
  // Plusieurs produits : chacun dans une case de même largeur, centré, posés sur la même ligne de sol
  const margin = w * 0.07, gap = w * 0.03;
  const cell = n === 1 ? w : (w - 2 * margin - gap * (n - 1)) / n;
  for (const [i, it] of items.entries()) {
    const ph = Math.round(h * scale * (n > 1 ? 0.78 : 1));
    const trimmed = await sharp(packshot(it)).trim().toBuffer();
    const img = await sharp(trimmed).resize({ height: ph, width: n === 1 ? undefined : Math.round(cell), fit: "inside" }).toBuffer();
    const meta = await sharp(img).metadata();
    const cx = n === 1 ? w / 2 : margin + cell * i + gap * i + cell / 2;
    comps.push({ input: img, left: Math.round(cx - meta.width / 2), top: Math.round(h * (1 - bottom) - meta.height) });
  }
  comps.push({ input: textLayer({ w, h, ...text }), left: 0, top: 0 });
  await sharp({ create: { width: w, height: h, channels: 3, background: bg } }).composite(comps).webp({ quality: 80 }).toFile(`${OUT}/${file}`);
}

async function picture({ file, w, h, src, ...text }) {
  const base = await sharp(src).resize(w, h, { fit: "cover", position: "attention" }).toBuffer();
  await sharp(base).composite([{ input: gradient(w, h), left: 0, top: 0 }, { input: textLayer({ w, h, ...text }), left: 0, top: 0 }]).webp({ quality: 80 }).toFile(`${OUT}/${file}`);
}

async function tips({ file, w, h, bg, ...text }) {
  await sharp({ create: { width: w, height: h, channels: 3, background: bg } }).composite([{ input: textLayer({ w, h, ...text }), left: 0, top: 0 }]).webp({ quality: 82 }).toFile(`${OUT}/${file}`);
}

async function beforeAfter({ file, w, h, ...text }) {
  const half = Math.round(w / 2);
  const ih = Math.round(h * 0.62);
  const a = await sharp("public/media/journal/camille-j0.webp").resize(half - 6, ih, { fit: "cover" }).toBuffer();
  const b = await sharp("public/media/journal/camille-j30.webp").resize(half - 6, ih, { fit: "cover" }).toBuffer();
  const labels = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect x="40" y="${h - ih - 20}" width="120" height="56" rx="28" fill="${C.ivory}"/><text x="76" y="${h - ih + 18}" font-family="${FONT}" font-weight="600" font-size="30" fill="${C.forest}">J0</text><rect x="${half + 40}" y="${h - ih - 20}" width="130" height="56" rx="28" fill="${C.forest}"/><text x="${half + 70}" y="${h - ih + 18}" font-family="${FONT}" font-weight="600" font-size="30" fill="${C.ivory}">J30</text></svg>`);
  await sharp({ create: { width: w, height: h, channels: 3, background: C.cream } })
    .composite([{ input: a, left: 0, top: h - ih }, { input: b, left: half + 6, top: h - ih }, { input: labels, left: 0, top: 0 }, { input: textLayer({ w, h: h - ih, ...text }), left: 0, top: 0 }])
    .webp({ quality: 80 }).toFile(`${OUT}/${file}`);
}

const SQ = { w: 1080, h: 1350 }; // Instagram 4:5
const VT = { w: 1080, h: 1920 }; // TikTok 9:16
const PIN = { w: 1000, h: 1500 }; // Pinterest 2:3
const sign = "skinclean · projet étudiant, démo";

await product({ file: "post-1.webp", ...SQ, bg: C.sage, items: ["clear-skin-serum-niacinamide"], scale: 0.5, tag: "Instagram", lines: ["La bonne routine,", "sans empiler", "les produits."], size: 92, color: C.forest, y0: 250, sub: "Skin Diag : 10 questions, 2 minutes.", subColor: C.sageDeep, footer: sign, footerColor: C.sageDeep });
await tips({ file: "post-2.webp", ...SQ, bg: C.forest, tag: "Instagram", tagBg: C.sage, lines: ["Niacinamide +", "vitamine C :", "on peut ?"], size: 104, color: C.ivory, y0: 300, bullets: ["Oui, mais pas au même moment", "Vitamine C le matin", "Niacinamide le soir", "SPF chaque matin, toute l'année"], bulletColor: C.sage, footer: "Carrousel 1/5 · " + sign, footerColor: C.sage });
await beforeAfter({ file: "post-3.webp", ...SQ, tag: "Instagram", lines: ["30 jours de", "Skin Journal"], size: 92, color: C.forest, y0: 250, sub: "Photos et témoignage de démonstration.", subColor: C.sageDeep });
// Carrousels Instagram : pages suivantes des posts 1 et 2 (la page 1 est post-1.webp / post-2.webp)
await tips({ file: "post-1-2.webp", ...SQ, bg: C.forest, tag: "Étape 1", tagBg: C.sage, lines: ["Fais ton", "Skin Diag"], size: 112, color: C.ivory, y0: 320, bullets: ["10 questions sur ta peau", "2 minutes, c'est gratuit", "Ton temps et ton budget comptent"], bulletColor: C.sage, footer: "2/4 · " + sign, footerColor: C.sage });
await product({ file: "post-1-3.webp", ...SQ, bg: C.sand, items: ["clear-foam-nettoyant-purifiant", "clear-skin-serum-niacinamide", "cloud-cream-creme-hydratante"], scale: 0.5, bottom: 0.13, tag: "Étape 2", lines: ["Reçois une", "routine courte"], size: 92, color: C.forest, y0: 250, sub: "3 à 6 soins qui vont ensemble.", subColor: C.sageDeep, footer: "3/4 · " + sign, footerColor: C.sageDeep });
await beforeAfter({ file: "post-1-4.webp", ...SQ, tag: "Étape 3", lines: ["Suis tes progrès", "sur 30 jours"], size: 84, color: C.forest, y0: 250, sub: "Skin Journal · photos de démonstration", subColor: C.sageDeep });
await product({ file: "post-2-2.webp", ...SQ, bg: C.sand, items: ["glow-shot-serum-vitamine-c"], scale: 0.5, tag: "Le matin", lines: ["Vitamine C"], size: 110, color: C.forest, y0: 260, sub: "Glow Shot sur peau propre, pour l'éclat.", subColor: C.sageDeep, footer: "2/5 · " + sign, footerColor: C.sageDeep });
await product({ file: "post-2-3.webp", ...SQ, bg: C.sage, items: ["clear-skin-serum-niacinamide"], scale: 0.5, tag: "Le soir", lines: ["Niacinamide"], size: 110, color: C.forest, y0: 260, sub: "Clear Skin, pour les pores et les imperfections.", subColor: C.sageDeep, footer: "3/5 · " + sign, footerColor: C.sageDeep });
await tips({ file: "post-2-4.webp", ...SQ, bg: C.cream, tag: "Peau sensible", tagBg: C.forest, tagColor: C.ivory, lines: ["Les deux le", "même jour ?"], size: 104, color: C.forest, y0: 300, bullets: ["Oui, à des moments différents", "Un nouvel actif à la fois", "Ça picote ? On espace"], bulletColor: C.forest, footer: "4/5 · " + sign, footerColor: C.sageDeep });
await product({ file: "post-2-5.webp", ...SQ, bg: C.forest, items: ["daily-shield-spf50"], scale: 0.48, tag: "Chaque matin", tagBg: C.sage, lines: ["Et le SPF,", "toujours."], size: 104, color: C.ivory, y0: 260, sub: "Ta routine sur mesure : Skin Diag, lien en bio.", subColor: C.sage, footer: "5/5 · " + sign, footerColor: C.sage });

// TikTok : couvertures tirées des vidéos publiées (scripts/post-frames)
await picture({ file: "post-4.webp", ...VT, src: "scripts/post-frames/tiktok-routine.jpg", tag: "TikTok", lines: ["Ma routine", "sérum en", "5 secondes"], size: 112, color: C.ivory, y0: 320, sub: "Clear Skin, je tapote, puis la crème.", subColor: C.sage, footer: sign, footerColor: C.sage });
await picture({ file: "post-5.webp", ...VT, src: "scripts/post-frames/rincage-7597957.jpg", tag: "TikTok", lines: ["3 erreurs qui", "donnent des", "boutons"], size: 112, color: C.ivory, y0: 320, bullets: ["Changer de sérum chaque semaine", "Frotter pour nettoyer", "Oublier le SPF"], bulletColor: C.ivory, footer: sign, footerColor: C.sage });
await picture({ file: "post-6.webp", ...VT, src: "scripts/post-frames/texture-8131887.jpg", tag: "TikTok", lines: ["Test texture :", "le trio offert", "à ta 1re commande"], size: 104, color: C.ivory, y0: 320, sub: "Dew Drop · Aqua Plump · Cloud Cream", subColor: C.sage, footer: sign, footerColor: C.sage });
await picture({ file: "post-7.webp", ...PIN, src: photo("8996171"), tag: "Pinterest", lines: ["Routine du soir", "peau mixte", "en 3 gestes"], size: 96, color: C.ivory, y0: 280, bullets: ["Melt Away pour démaquiller", "Cloud Gel pour nettoyer", "Clear Skin, puis Cloud Cream"], bulletColor: C.ivory, footer: sign, footerColor: C.sage });
await product({ file: "post-8.webp", ...PIN, bg: C.cream, items: ["clear-skin-serum-niacinamide"], scale: 0.3, bottom: 0.1, tag: "Pinterest", tagBg: C.forest, tagColor: C.ivory, lines: ["Lire une liste", "INCI en", "30 secondes"], size: 104, color: C.forest, y0: 300, bullets: ["Les ingrédients sont classés par dose", "Les 5 premiers = l'essentiel", "Parfum : « parfum » ou « aroma »", "On cherche l'actif annoncé"], bulletColor: C.forest, footer: sign, footerColor: C.sageDeep });
await product({ file: "post-9.webp", ...PIN, bg: C.sage, items: ["dew-drop-toner-hydratant"], scale: 0.46, tag: "Pinterest", tagBg: C.forest, tagColor: C.ivory, lines: ["La méthode", "« 7 skin »", "avec Dew Drop"], size: 96, color: C.forest, y0: 280, sub: "3 couches fines, une peau gorgée d'eau.", subColor: C.sageDeep, footer: sign, footerColor: C.sageDeep });
console.log("9 visuels générés dans", OUT);
