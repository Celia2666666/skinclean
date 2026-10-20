/**
 * Découpe une planche de packshots (grille régulière) en fichiers individuels.
 * Usage : node scripts/crop-sheet.mjs planche.webp
 * Grille, noms et marges : à adapter ci-dessous si une nouvelle planche est fournie.
 */
import sharp from "sharp";

const [, , sheet] = process.argv;
const cols = [3, 253, 503, 753, 1003, 1253, 1503, 1753];
const rows = [3, 320, 636, 953, 1270];
const W = 244, H = 310;
const names = [
  ["bandeau-skinclean", "carres-demaquillants-lavables", "gua-sha-jade", "pince-cheveux", "aqua-plump", "bha-clear-liquid", "bright-eyes", "calm-down"],
  ["calm-pads", "clear-foam", "clear-skin", "cloud-cream", "cloud-gel", "comfort-zone", "daily-shield-spf50", "dew-drop"],
  ["even-out", "first-lines", "fresh-mist", "glow-pads", "glow-shot", "hydra-bloom", "matte-balance", "melt-away"],
  ["mineral-calm-spf50", "night-renew", "polish-me", "pure-clay", "calm-sheet-mask", "glow-sheet-mask", "hydra-sheet-mask", "trio-sheet-masks"],
  ["silk-off", "smooth-gaze", "smooth-reset", "spot-hero-night", "spot-hero-day", "velvet-barrier", null, null],
];
let n = 0;
for (let r = 0; r < rows.length; r++) {
  for (let c = 0; c < cols.length; c++) {
    const name = names[r][c];
    if (!name) continue;
    await sharp(sheet)
      .extract({ left: cols[c], top: rows[r], width: W, height: H })
      .resize({ width: W * 2, height: H * 2, kernel: "lanczos3" })
      .webp({ quality: 90 })
      .toFile(`public/media/packshots/${name}.webp`);
    n++;
  }
}
console.log(`${n} packshots découpés`);
