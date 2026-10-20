import sharp from "sharp";
const [, , inp, out, step = "50"] = process.argv;
const m = await sharp(inp).metadata();
const st = +step; let s = "";
for (let x = 0; x < m.width; x += st) s += `<line x1="${x}" y1="0" x2="${x}" y2="${m.height}" stroke="${x % (st*2) ? '#f0f' : '#f00'}" stroke-width="1" opacity=".55"/><text x="${x+2}" y="12" font-size="11" fill="#f00" font-family="Menlo">${x}</text>`;
for (let y = 0; y < m.height; y += st) s += `<line x1="0" y1="${y}" x2="${m.width}" y2="${y}" stroke="${y % (st*2) ? '#0aa' : '#00f'}" stroke-width="1" opacity=".55"/><text x="2" y="${y-2}" font-size="11" fill="#00f" font-family="Menlo">${y}</text>`;
await sharp(inp).composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${m.width}" height="${m.height}">${s}</svg>`) }]).png().toFile(out);
