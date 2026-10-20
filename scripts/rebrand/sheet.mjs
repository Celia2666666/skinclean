// Planche contact des aperçus : node scripts/rebrand/sheet.mjs dossier sortie.jpg motif1,motif2…
import sharp from "sharp"; import fs from "node:fs";
const [, , dir, out, pats = ""] = process.argv;
const ps = pats.split(",");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".jpg") && !f.startsWith("_") && ps.some((p) => f.includes(p))).sort();
const H = 520, comps = []; let x = 0;
for (const f of files) { const b = await sharp(`${dir}/${f}`).resize({ height: H }).toBuffer(); const m = await sharp(b).metadata(); comps.push({ input: b, left: x, top: 0 }); x += m.width + 8; }
await sharp({ create: { width: x, height: H, channels: 3, background: "#fff" } }).composite(comps).jpeg({ quality: 88 }).toFile(out);
