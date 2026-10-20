/**
 * Retouche « simulation après » : estompe boutons et rougeurs d'une photo de peau.
 * ⚠️ Produit une SIMULATION (retouche numérique) — à toujours étiqueter comme telle, jamais comme un résultat réel.
 * Usage : node scripts/retouch-blemishes.mjs entree sortie ["x,y,l,h;x,y,l,h" zones exclues (ex. lèvres, narines)] [intensité rougeurs 0-1, défaut 0.7]
 */
import sharp from "sharp";
sharp.cache(false);
const [, , input, output, excl, strengthArg] = process.argv;
const zones = excl ? excl.split(";").map((z) => z.split(",").map(Number)) : [];
const strength = strengthArg ? Number(strengthArg) : 0.7;

const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, N = W * H;
const blur = async (sigma) => (await sharp(data, { raw: { width: W, height: H, channels: 3 } }).blur(sigma).raw().toBuffer());
const small = await blur(1.6);   // détail fin
const mid = await blur(9);       // teinte locale (sans les boutons)
const near = await blur(20);     // voisinage de comparaison
const big = await blur(45);      // rougeur diffuse

const red = (b, i) => b[i] - (b[i + 1] + b[i + 2]) / 2;
const skin = (b, i) => b[i] > b[i + 1] && b[i + 1] >= b[i + 2] - 4 && b[i] - b[i + 2] > 28;

// Rougeur de référence = médiane de la peau sur l'image floue
const vals = [];
for (let i = 0; i < N * 3; i += 3 * 7) if (skin(big, i)) vals.push(red(big, i));
vals.sort((a, b) => a - b);
const ref = vals[Math.floor(vals.length * 0.4)] ?? 30;

const lum = (b, i) => 0.3 * b[i] + 0.59 * b[i + 1] + 0.11 * b[i + 2];
const inExcl = (x, y) => zones.some((e) => x >= e[0] && x < e[0] + e[2] && y >= e[1] && y < e[1] + e[3]);
// Protection progressive des zones exclues (fondu de FEATHER px) : évite les arêtes rectangulaires visibles
const FEATHER = 40;
const protect = (x, y) => {
  let w = 0;
  for (const e of zones) {
    const dx = Math.max(e[0] - x, 0, x - (e[0] + e[2])), dy = Math.max(e[1] - y, 0, y - (e[1] + e[3]));
    w = Math.max(w, 1 - Math.min(1, Math.hypot(dx, dy) / FEATHER));
  }
  return w;
};

// Masque des imperfections : plus rouge OU plus foncé que le voisinage, puis élargi et adouci
const mask = Buffer.alloc(N);
for (let p = 0, i = 0; p < N; p++, i += 3) {
  const x = p % W, y = (p / W) | 0;
  if (!skin(mid, i) || inExcl(x, y)) continue;
  // Taches : nettement plus rouges que le voisinage (petite et moyenne échelle)
  const r = Math.max((red(small, i) - red(mid, i) - 3) / 8, (red(small, i) - red(near, i) - 9) / 9);
  // Points sombres : uniquement à petite échelle (les ombres du visage sont larges et restent intactes)
  const d = (lum(mid, i) - lum(small, i) - 5) / 9 * (red(small, i) > red(near, i) ? 1 : 0.3);
  mask[p] = Math.round(255 * Math.max(0, Math.min(1, Math.max(r, d))));
}
const soft = await sharp(mask, { raw: { width: W, height: H, channels: 1 } }).blur(2.2).extractChannel(0).raw().toBuffer();
// Teinte de remplacement : flou large calculé en ignorant les imperfections (moyenne pondérée)
const clean = Buffer.from(data);
for (let p = 0, i = 0; p < N; p++, i += 3) if (soft[p] > 20) for (let c = 0; c < 3; c++) clean[i + c] = mid[i + c];
const fill = await sharp(clean, { raw: { width: W, height: H, channels: 3 } }).blur(14).raw().toBuffer();

const out = Buffer.from(data);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const p = y * W + x, i = p * 3;
  if (!skin(mid, i)) continue;
  const keep = protect(x, y);
  if (keep >= 1) continue;
  const spot = Math.min(1, (soft[p] / 255) * 1.8) * (1 - keep);
  // rougeur diffuse : moitié locale (épouse le contour des plaques), moitié large (transition douce)
  const diffuse = Math.max(0, red(near, i) - ref) * 0.6 + Math.max(0, red(big, i) - ref) * 0.4;
  for (let c = 0; c < 3; c++) {
    const detail = data[i + c] - small[i + c];
    let v = data[i + c] * (1 - spot) + (fill[i + c] + detail * 0.6) * spot;
    const k = (diffuse * strength) * (1 - keep) + spot * Math.max(0, red(fill, i) - ref) * 0.6;
    v += k * [-0.55, 0.3, 0.12][c]; // neutralise la rougeur sans griser la peau
    out[i + c] = Math.max(0, Math.min(255, Math.round(v)));
  }
}
await sharp(out, { raw: { width: W, height: H, channels: 3 } }).webp({ quality: 88 }).toFile(output);
console.log(`OK → ${output} (référence rougeur ${ref.toFixed(1)})`);
