/**
 * Mini-moteur de « rebranding » de packshots (exercice SKINCLEAN).
 * - efface le texte d'origine d'une étiquette en conservant reflets et ombres (fermeture morphologique) ;
 * - imprime une nouvelle étiquette SVG en mode « multiply » (l'encre suit l'éclairage du flacon) ;
 * - courbe l'étiquette sur les pots / flacons cylindriques ;
 * - détoure le fond clair et recadre.
 * Toutes les coordonnées des configs sont exprimées sur l'image source d'origine (avant agrandissement).
 */
import sharp from "sharp";

export async function load(path, scale = 2) {
  const meta = await sharp(path).metadata();
  const w = Math.round(meta.width * scale), h = Math.round(meta.height * scale);
  const { data } = await sharp(path).resize(w, h, { kernel: "lanczos3" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { w, h, data: new Uint8ClampedArray(data), scale };
}

export const clone = (img) => ({ ...img, data: new Uint8ClampedArray(img.data) });

/** Rend un SVG (chaîne) en RGBA flottant [0..1] de taille w×h. */
export async function renderSvg(svg, w, h) {
  const buf = await sharp(Buffer.from(svg), { density: 72 }).resize(w, h, { fit: "fill" }).ensureAlpha().raw().toBuffer();
  return buf;
}

/** Masque (Float32 0..1) depuis un fragment SVG dessiné en blanc, coordonnées source. */
export async function maskFrom(img, shapes, blur = 0) {
  const s = img.scale;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${img.w}" height="${img.h}"><g transform="scale(${s})" fill="#fff">${shapes}</g></svg>`;
  let p = sharp(Buffer.from(svg)).ensureAlpha();
  const raw = await p.raw().toBuffer();
  let m = new Float32Array(img.w * img.h);
  for (let i = 0; i < m.length; i++) m[i] = raw[i * 4 + 3] / 255;
  if (blur) m = blurMask(m, img.w, img.h, Math.round(blur * s));
  return m;
}

function blurMask(m, w, h, r) {
  const t = new Float32Array(m.length), o = new Float32Array(m.length);
  for (let pass = 0; pass < 2; pass++) {
    const src = pass ? t : m, dst = pass ? o : t;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let s = 0, n = 0;
      for (let k = -r; k <= r; k++) {
        const xx = pass ? x : x + k, yy = pass ? y + k : y;
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        s += src[yy * w + xx]; n++;
      }
      dst[y * w + x] = s / n;
    }
  }
  return o;
}

/** Filtre min/max séparable sur une zone rectangulaire (coord. image travail). */
function morph(data, w, rect, k, op) {
  const [x0, y0, x1, y1] = rect, rw = x1 - x0, rh = y1 - y0;
  const out = new Float32Array(rw * rh * 3), tmp = new Float32Array(rw * rh * 3);
  const better = op === "max" ? (a, b) => a > b : (a, b) => a < b;
  for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) for (let c = 0; c < 3; c++) {
    let v = op === "max" ? -1 : 999;
    for (let d = -k; d <= k; d++) {
      const xx = Math.min(rw - 1, Math.max(0, x + d));
      const s = data[((y0 + y) * w + x0 + xx) * 4 + c];
      if (better(s, v)) v = s;
    }
    tmp[(y * rw + x) * 3 + c] = v;
  }
  for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) for (let c = 0; c < 3; c++) {
    let v = op === "max" ? -1 : 999;
    for (let d = -k; d <= k; d++) {
      const yy = Math.min(rh - 1, Math.max(0, y + d));
      const s = tmp[(yy * rw + x) * 3 + c];
      if (better(s, v)) v = s;
    }
    out[(y * rw + x) * 3 + c] = v;
  }
  return out;
}

function morphF(buf, rw, rh, k, op) {
  // même chose mais sur un buffer Float32 rw×rh×3
  const fake = new Float32Array(rw * rh * 4);
  for (let i = 0; i < rw * rh; i++) for (let c = 0; c < 3; c++) fake[i * 4 + c] = buf[i * 3 + c];
  return morph(fake, rw, [0, 0, rw, rh], k, op);
}

function boxBlur3(buf, rw, rh, r) {
  if (r <= 0) return buf;
  let src = buf;
  for (let pass = 0; pass < 2; pass++) {
    const dst = new Float32Array(src.length);
    for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) for (let c = 0; c < 3; c++) {
      let s = 0, n = 0;
      for (let d = -r; d <= r; d++) {
        const xx = pass ? x : x + d, yy = pass ? y + d : y;
        if (xx < 0 || yy < 0 || xx >= rw || yy >= rh) continue;
        s += src[(yy * rw + xx) * 3 + c]; n++;
      }
      dst[(y * rw + x) * 3 + c] = s / n;
    }
    src = dst;
  }
  return src;
}

/**
 * Efface le texte dans `rect` (coord. source) limité au masque `shapes`.
 * mode "dark" : texte plus foncé que le support (fermeture) ; "light" : texte clair sur fond foncé (ouverture).
 * full=true : remplace toute la zone par le fond estimé (lissé) — utile quand on recouvre ensuite.
 */
export async function eraseText(img, { rect, shapes, k = 8, mode = "dark", thr = 10, full = false, smooth = 2, grain = 0, feather = 0 }) {
  const s = img.scale;
  const R = rect.map((v) => Math.round(v * s));
  const [x0, y0, x1, y1] = R, rw = x1 - x0, rh = y1 - y0;
  const K = Math.round(k * s);
  const first = mode === "dark" ? "max" : "min", second = mode === "dark" ? "min" : "max";
  let bg = morphF(morph(img.data, img.w, R, K, first), rw, rh, K, second);
  bg = boxBlur3(bg, rw, rh, Math.round(smooth * s));
  const mask = await maskFrom(img, shapes ?? `<rect x="${rect[0]}" y="${rect[1]}" width="${rect[2] - rect[0]}" height="${rect[3] - rect[1]}"/>`, feather);
  // masque « texte » : pixels qui s'écartent du fond, dilaté un peu
  const tm = new Float32Array(rw * rh);
  for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) {
    const i = ((y0 + y) * img.w + x0 + x) * 4, j = (y * rw + x) * 3;
    let d = 0;
    for (let c = 0; c < 3; c++) d = Math.max(d, mode === "dark" ? bg[j + c] - img.data[i + c] : img.data[i + c] - bg[j + c]);
    tm[y * rw + x] = full ? 1 : Math.max(0, Math.min(1, (d - thr * 0.4) / (thr * 0.6)));
  }
  const dil = full ? tm : dilate1(dilate1(tm, rw, rh), rw, rh);
  for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) {
    const n = (y0 + y) * img.w + x0 + x, i = n * 4, j = (y * rw + x) * 3;
    const a = dil[y * rw + x] * mask[n];
    if (!a) continue;
    const g = grain ? (Math.random() - 0.5) * grain : 0;
    for (let c = 0; c < 3; c++) img.data[i + c] = img.data[i + c] * (1 - a) + (bg[j + c] + g) * a;
  }
}

function dilate1(m, w, h) {
  const o = new Float32Array(m.length);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let v = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < w && yy < h) v = Math.max(v, m[yy * w + xx]);
    }
    o[y * w + x] = v;
  }
  return o;
}

/**
 * Applique un calque SVG (dessiné à plat en `fw`×`fh` unités) sur la zone `rect` (coord. source).
 * blend : "multiply" | "screen" | "normal". cyl : { cx, r } (coord. source) pour l'enroulement cylindrique ;
 * bow : flèche verticale (px source) des lignes au centre (vue plongeante) ; clip : fragment SVG (coord. source).
 * rotate : angle (deg) autour du centre de rect (pour les sachets inclinés) → passer quad à la place.
 */
export async function printLabel(img, { rect, svgInner, fw, fh, blend = "multiply", cyl, bow = 0, clip, opacity = 1, quad, shade = 0 }) {
  const s = img.scale;
  const [rx0, ry0, rx1, ry1] = rect;
  const W = Math.round((rx1 - rx0) * s), H = Math.round((ry1 - ry0) * s);
  // largeur « déroulée » nécessaire
  let theta0 = 0, theta1 = 0, flatW = W;
  if (cyl) {
    const t = (x) => Math.asin(Math.max(-0.999, Math.min(0.999, (x - cyl.cx) / cyl.r)));
    theta0 = t(rx0); theta1 = t(rx1);
    flatW = Math.round(cyl.r * (theta1 - theta0) * s);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${flatW}" height="${H}" viewBox="0 0 ${fw} ${fh}" preserveAspectRatio="none">${svgInner}</svg>`;
  const ov = await renderSvg(svg, flatW, H);
  const clipM = clip ? await maskFrom(img, clip, 0.6) : null;
  const sample = (u, v, c) => {
    // bilinéaire
    if (u < 0 || v < 0 || u > flatW - 1 || v > H - 1) return c === 3 ? 0 : 0;
    const x0 = Math.floor(u), y0 = Math.floor(v), x1 = Math.min(flatW - 1, x0 + 1), y1 = Math.min(H - 1, y0 + 1);
    const fx = u - x0, fy = v - y0;
    const g = (x, y) => ov[(y * flatW + x) * 4 + c];
    return (g(x0, y0) * (1 - fx) + g(x1, y0) * fx) * (1 - fy) + (g(x0, y1) * (1 - fx) + g(x1, y1) * fx) * fy;
  };
  const X0 = Math.round(rx0 * s), Y0 = Math.round(ry0 * s);
  const pad = Math.ceil(Math.abs(bow) * s) + 2;
  for (let y = Y0 - pad; y < Y0 + H + pad; y++) for (let x = X0; x < X0 + W; x++) {
    if (x < 0 || y < 0 || x >= img.w || y >= img.h) continue;
    const xs = x / s;
    let u = x - X0, cosT = 1;
    if (cyl) {
      const th = Math.asin(Math.max(-0.999, Math.min(0.999, (xs - cyl.cx) / cyl.r)));
      u = (th - theta0) * cyl.r * s;
      cosT = Math.cos(th);
    }
    const v = y - Y0 - bow * s * cosT;
    const a = (sample(u, v, 3) / 255) * opacity * (clipM ? clipM[y * img.w + x] : 1);
    if (a <= 0.002) continue;
    const i = (y * img.w + x) * 4;
    const lum = (img.data[i] * 0.3 + img.data[i + 1] * 0.59 + img.data[i + 2] * 0.11) / 255;
    for (let c = 0; c < 3; c++) {
      const o = sample(u, v, c) / 255, b = img.data[i + c] / 255;
      let r;
      if (blend === "multiply") r = b * o;
      else if (blend === "screen") r = 1 - (1 - b) * (1 - o);
      else r = shade ? o * (1 - shade + shade * lum * 1.15) : o;
      img.data[i + c] = (b * (1 - a) + r * a) * 255;
    }
  }
}

/** Copie miroir horizontale d'une bande (réparer une zone masquée par une bulle d'interface). */
export function mirrorFix(img, { axis, x0, x1, y0, y1 }) {
  const s = img.scale;
  for (let y = Math.round(y0 * s); y < Math.round(y1 * s); y++) for (let x = Math.round(x0 * s); x < Math.round(x1 * s); x++) {
    const mx = Math.round(2 * axis * s - x);
    if (mx < 0 || mx >= img.w) continue;
    const i = (y * img.w + x) * 4, j = (y * img.w + mx) * 4;
    for (let c = 0; c < 4; c++) img.data[i + c] = img.data[j + c];
  }
}

/** Peint une forme avec une couleur unie (effacer bulles/flèches d'interface). */
export async function paint(img, shapes, rgb, blur = 0) {
  const m = await maskFrom(img, shapes, blur);
  for (let n = 0; n < m.length; n++) if (m[n]) for (let c = 0; c < 3; c++) img.data[n * 4 + c] = img.data[n * 4 + c] * (1 - m[n]) + rgb[c] * m[n];
}

/** Teinte d'une zone : conserve la luminance, remplace la teinte (recoloration de capot/rabat). */
export async function recolor(img, shapes, rgb, { keep = 0, gain = 1 } = {}) {
  const m = await maskFrom(img, shapes, 0.8);
  const tl = (rgb[0] * 0.3 + rgb[1] * 0.59 + rgb[2] * 0.11);
  // luminance moyenne de la zone pour normaliser
  let sum = 0, n = 0;
  for (let k = 0; k < m.length; k++) if (m[k] > 0.5) { const i = k * 4; sum += img.data[i] * 0.3 + img.data[i + 1] * 0.59 + img.data[i + 2] * 0.11; n++; }
  const mean = sum / Math.max(1, n);
  for (let k = 0; k < m.length; k++) {
    if (!m[k]) continue;
    const i = k * 4;
    const l = img.data[i] * 0.3 + img.data[i + 1] * 0.59 + img.data[i + 2] * 0.11;
    const f = Math.pow(l / mean, gain);
    for (let c = 0; c < 3; c++) {
      const t = Math.min(255, rgb[c] * f);
      img.data[i + c] = img.data[i + c] * (1 - m[k] * (1 - keep)) + t * m[k] * (1 - keep);
    }
  }
}

/** Détoure le fond clair (remplissage depuis les bords) puis recadre avec une marge. */
export async function exportPackshot(img, out, { crop, tol = 22, margin = 0.04, maxH = 1400, keepBg = false, feather = 0.55 } = {}) {
  const s = img.scale;
  let { w, h, data } = img;
  if (crop) {
    const [cx0, cy0, cx1, cy1] = crop.map((v) => Math.round(v * s));
    const nw = cx1 - cx0, nh = cy1 - cy0, nd = new Uint8ClampedArray(nw * nh * 4);
    for (let y = 0; y < nh; y++) nd.set(data.subarray(((cy0 + y) * w + cx0) * 4, ((cy0 + y) * w + cx0 + nw) * 4), y * nw * 4);
    w = nw; h = nh; data = nd;
  }
  if (!keepBg) {
    const px = (x, y) => (y * w + x) * 4;
    let bg = [0, 0, 0];
    const corners = [[3, 3], [w - 4, 3], [3, h - 4], [w - 4, h - 4]];
    for (const [x, y] of corners) for (let k = 0; k < 3; k++) bg[k] += data[px(x, y) + k] / 4;
    const dist = (i) => Math.hypot(data[i] - bg[0], data[i + 1] - bg[1], data[i + 2] - bg[2]);
    const seen = new Uint8Array(w * h), stack = [];
    for (let x = 0; x < w; x++) stack.push(x, 0, x, h - 1);
    for (let y = 0; y < h; y++) stack.push(0, y, w - 1, y);
    while (stack.length) {
      const y = stack.pop(), x = stack.pop();
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const n = y * w + x;
      if (seen[n]) continue;
      const i = n * 4, d = dist(i);
      if (d > tol) continue;
      seen[n] = 1;
      const a = Math.max(0, Math.min(1, (d - tol * feather) / (tol * (1 - feather))));
      data[i + 3] = Math.round(a * 255);
      stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
    }
  }
  // bbox opaque
  let bx0 = w, by0 = h, bx1 = 0, by1 = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] > 40) {
    if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y;
  }
  const m = Math.round(Math.max(bx1 - bx0, by1 - by0) * margin);
  bx0 = Math.max(0, bx0 - m); by0 = Math.max(0, by0 - m); bx1 = Math.min(w - 1, bx1 + m); by1 = Math.min(h - 1, by1 + m);
  let pipe = sharp(Buffer.from(data.buffer, data.byteOffset, data.byteLength), { raw: { width: w, height: h, channels: 4 } })
    .extract({ left: bx0, top: by0, width: bx1 - bx0 + 1, height: by1 - by0 + 1 });
  const buf = await pipe.png().toBuffer();
  const meta = await sharp(buf).metadata();
  let p2 = sharp(buf);
  if (meta.height > maxH) p2 = p2.resize({ height: maxH, kernel: "lanczos3" });
  await p2.png({ compressionLevel: 9, palette: false }).toFile(out);
  return out;
}

/** Aperçu sur fond coloré (contrôle visuel). */
export async function preview(pngPath, out, bg = "#EFEBE3") {
  const m = await sharp(pngPath).metadata();
  await sharp({ create: { width: m.width, height: m.height, channels: 4, background: bg } }).composite([{ input: pngPath }]).jpeg({ quality: 85 }).toFile(out);
}

/** Recolore les pixels d'une zone qui satisfont `pred(r,g,b)` (ex. rabat bleu → sauge), en gardant le modelé. */
export function recolorWhere(img, rect, pred, rgb, ref) {
  const s = img.scale, [x0, y0, x1, y1] = rect.map((v) => Math.round(v * s));
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const i = (y * img.w + x) * 4, r = img.data[i], g = img.data[i + 1], b = img.data[i + 2];
    const a = pred(r, g, b);
    if (a <= 0) continue;
    const l = (r * 0.3 + g * 0.59 + b * 0.11) / ref;
    for (let c = 0; c < 3; c++) img.data[i + c] = img.data[i + c] * (1 - a) + Math.min(255, rgb[c] * l) * a;
  }
}
