/**
 * Détourage simple d'un packshot sur fond clair uni.
 * Usage : node scripts/remove-bg.mjs entree.(png|jpg|webp) sortie.png [tolérance=42]
 * Remplit depuis les bords toutes les zones proches de la couleur du fond (le fond des étiquettes,
 * entouré par le flacon, est donc préservé), avec un bord adouci.
 */
import sharp from "sharp";

const [, , input, output, tolArg] = process.argv;
if (!input || !output) {
  console.error("Usage : node scripts/remove-bg.mjs entree sortie.png [tolérance]");
  process.exit(1);
}
const T = Number(tolArg ?? 42);
const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const px = (x, y) => (y * W + x) * 4;

// Couleur de fond = moyenne des coins
let bg = [0, 0, 0];
const corners = [[2, 2], [W - 3, 2], [2, H - 3], [W - 3, H - 3]];
for (const [x, y] of corners) for (let k = 0; k < 3; k++) bg[k] += data[px(x, y) + k] / 4;
const dist = (i) => Math.hypot(data[i] - bg[0], data[i + 1] - bg[1], data[i + 2] - bg[2]);

const seen = new Uint8Array(W * H);
const stack = [];
for (let x = 0; x < W; x++) { stack.push(x, 0, x, H - 1); }
for (let y = 0; y < H; y++) { stack.push(0, y, W - 1, y); }
while (stack.length) {
  const y = stack.pop(), x = stack.pop();
  if (x < 0 || y < 0 || x >= W || y >= H) continue;
  const n = y * W + x;
  if (seen[n]) continue;
  const i = n * 4;
  const d = dist(i);
  if (d > T) continue;
  seen[n] = 1;
  // alpha progressif : fond pur → transparent, proche du seuil → semi-opaque
  const a = Math.max(0, Math.min(1, (d - T * 0.35) / (T * 0.65)));
  data[i + 3] = Math.round(a * 255);
  stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
}
await sharp(data, { raw: { width: W, height: H, channels: 4 } }).png().toFile(output);
console.log(`OK → ${output} (${W}×${H}, fond ≈ rgb(${bg.map(Math.round).join(",")}))`);
