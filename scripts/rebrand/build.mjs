/**
 * Génère les packshots SKINCLEAN à partir des photos de référence (exercice — visuels fictifs).
 * Usage : node scripts/rebrand/build.mjs [filtre]   → public/media/packshots/<slug>.png
 */
import { mkdirSync } from "node:fs";
import { load, clone, eraseText, printLabel, mirrorFix, paint, recolor, recolorWhere, exportPackshot, preview } from "./lib.mjs";
import { P, labelClassic, labelWide, labelTube, T, R, tint, INK, SAGE, wordmarkTag } from "./labels.mjs";
import { products } from "../../src/data/products.ts";

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const SRC = (f) => new URL(`./sources/${f}`, import.meta.url).pathname;
const OUT = new URL("../../public/media/packshots/", import.meta.url).pathname;
const PREV = process.env.PREVIEW_DIR;
const filter = process.argv[2];
mkdirSync(OUT, { recursive: true });

/* Palette d'étiquettes figée (indépendante des couleurs d'interface du catalogue). */
const LABEL_COLORS = {
  "cloud-gel-nettoyant-doux": ["#E1E6E8", "#7FA9C2"], "clear-foam-nettoyant-purifiant": ["#D5DDD3", "#5E8A72"],
  "melt-away-baume-demaquillant": ["#EDE2DD", "#C98A9A"], "silk-off-lait-demaquillant": ["#F7F5F0", "#B9A88A"],
  "dew-drop-toner-hydratant": ["#E1E6E8", "#6E9FBF"], "smooth-reset-toner-exfoliant": ["#EAE2CF", "#C4A752"],
  "clear-skin-serum-niacinamide": ["#D5DDD3", "#4F7D63"], "glow-shot-serum-vitamine-c": ["#EAE2CF", "#D19A3B"],
  "aqua-plump-serum-acide-hyaluronique": ["#E1E6E8", "#4F86AE"], "calm-down-serum-centella": ["#D5DDD3", "#6B9A7E"],
  "first-lines-serum-bakuchiol": ["#EDE2DD", "#B6738A"], "night-renew-serum-retinal": ["#E6E3E6", "#8B77A6"],
  "cloud-cream-creme-hydratante": ["#FFFEFB", "#9CB8A6"], "velvet-barrier-creme-riche": ["#EDE2DD", "#B98194"],
  "matte-balance-gel-creme": ["#D5DDD3", "#4F7D63"], "comfort-zone-creme-apaisante": ["#E1E6E8", "#6C9D8C"],
  "bright-eyes-contour-yeux-cafeine": ["#E1E6E8", "#5B87A6"], "smooth-gaze-creme-yeux-peptides": ["#EDE2DD", "#B37A8C"],
  "hydra-bloom-masque-hydratant": ["#EDE2DD", "#C0798F"], "pure-clay-masque-purifiant": ["#D5DDD3", "#6F8F68"],
  "glow-pads-toner-pads-eclat": ["#EAE2CF", "#C79E3E"], "calm-pads-pads-apaisants": ["#D5DDD3", "#5F8F75"],
  "fresh-mist-brume-hydratante": ["#E1E6E8", "#6EA2C4"], "polish-me-exfoliant-enzymatique": ["#F7F5F0", "#BFA67A"],
  "bha-clear-liquid-exfoliant": ["#E1E6E8", "#4F7C9A"], "even-out-soin-acide-azelaique": ["#EDE2DD", "#A86E80"],
  "daily-shield-spf50": ["#EAE2CF", "#C9A043"], "mineral-calm-spf50": ["#F7F5F0", "#B49B78"],
};
const bySlug = Object.fromEntries(products.map((p) => [p.slug, p]));

/* Chaque base : prépare l'image (nettoyage) une fois, puis imprime une étiquette par produit. */
export const BASES = {
  l31: {
    src: "l31.png",
    slugs: ["clear-skin-serum-niacinamide", "glow-shot-serum-vitamine-c", "aqua-plump-serum-acide-hyaluronique", "calm-down-serum-centella", "first-lines-serum-bakuchiol", "night-renew-serum-retinal"],
    async prep(img) {
      await eraseText(img, { rect: [424, 446, 826, 872], k: 22, thr: 8, smooth: 14, full: true, grain: 3 });
    },
    async label(img, slug, c) {
      const p = P[slug];
      await printLabel(img, { rect: [423, 445, 827, 873], fw: 404, fh: 428, svgInner: await labelClassic({ w: 404, h: 428, p, c }) });
    },
    crop: [380, 0, 870, 1012],
  },

  // Tube aluminium froissé → protections solaires
  a51: {
    src: "a51.png",
    slugs: ["daily-shield-spf50", "mineral-calm-spf50"],
    async prep(img) {
      await eraseText(img, { rect: [515, 75, 730, 250], k: 3, thr: 22, smooth: 2.5 });
      await eraseText(img, { rect: [530, 725, 712, 825], k: 6, thr: 22, smooth: 3 });
    },
    async label(img, slug, c) {
      const p = P[slug];
      const w = 180, h = 760;
      let s = "";
      s += T(8, 34, p.name.toUpperCase(), { size: 17, weight: 600, track: 1.2, caps: true, max: 170 });
      s += T(8, 54, p.kind.toUpperCase(), { size: 10.5, weight: 500, track: 1, caps: true, max: 170 });
      s += T(8, 70, `(${p.en})`, { size: 10, opacity: 0.8, max: 170 });
      s += T(8, 100, p.for, { size: 10.5, weight: 500, max: 170 });
      s += T(8, 115, p.skin, { size: 10, opacity: 0.8, max: 170 });
      s += T(8, 150, "SPF", { size: 15, weight: 600, fill: c.accent, track: 1 });
      s += T(42, 150, "50", { size: 30, weight: 600, fill: c.accent });
      s += T(8, 166, "UVA · UVB", { size: 9.5, weight: 600, track: 1.4, fill: c.accent });
      s += await wordmarkTag(w / 2, 690, 150, "#2f3a2c", "middle");
      s += T(w / 2, 668, p.code, { size: 13, weight: 500, track: 2, anchor: "middle" });
      s += T(w / 2, 740, p.size, { size: 9.5, weight: 500, anchor: "middle", opacity: 0.85 });
      await printLabel(img, { rect: [522, 60, 702, 820], fw: w, fh: h, svgInner: s, cyl: { cx: 622, r: 120 } });
    },
    crop: [470, 0, 790, 1010],
  },

  // Pot blanc couvercle métal → crèmes
  "jar-white": {
    src: "jar-white.webp",
    slugs: ["cloud-cream-creme-hydratante", "velvet-barrier-creme-riche"],
    async prep(img) {
      await paint(img, `<rect x="262" y="985" width="280" height="70" rx="8"/>`, [241, 238, 228]);
      mirrorFix(img, { axis: 586.5, x0: 330, x1: 545, y0: 980, y1: 1012 });
      await eraseText(img, { rect: [348, 660, 826, 960], k: 12, thr: 10, smooth: 6, full: true, grain: 2.5 });
    },
    async label(img, slug, c) {
      const p = P[slug];
      const w = 600, h = 300;
      await printLabel(img, { rect: [346, 660, 828, 962], fw: w, fh: h, svgInner: await labelWide({ w, h, p, c, tintAmt: 0.9, scale: 1.05 }), cyl: { cx: 586.5, r: 245 }, bow: 4 });
    },
    crop: [300, 440, 1000, 1030],
  },

  // Pot ambré foncé → contour des yeux riche / masque de nuit
  "jar-dark": {
    src: "jar-dark.webp",
    slugs: ["smooth-gaze-creme-yeux-peptides", "hydra-bloom-masque-hydratant"],
    async prep(img) {
      await eraseText(img, { rect: [368, 805, 828, 1078], k: 12, mode: "light", thr: 10, smooth: 6, full: true, grain: 2 });
    },
    async label(img, slug, c) {
      const p = P[slug];
      const w = 560, h = 270;
      const ink = tint(c.bg, 0.55);
      let s = "";
      s += await wordmarkTag(w / 2, 26, 150, "#E9E4DA", "middle");
      s += T(w / 2, 108, p.name, { size: 42, weight: 500, anchor: "middle", fill: "#F3EFE8", max: 440 });
      s += T(w / 2, 134, p.kind.toUpperCase(), { size: 12.5, weight: 500, track: 1.8, anchor: "middle", fill: "#E9E4DA", caps: true, max: 440 });
      s += R(w / 2 - 17, 148, 34, 3, ink);
      s += T(w / 2, 175, p.for, { size: 14, weight: 500, anchor: "middle", fill: "#E9E4DA", max: 440 });
      s += T(w / 2, 194, p.skin, { size: 12.5, anchor: "middle", fill: "#CFC9BF", max: 440 });
      s += T(w / 2 - 150, 246, p.code, { size: 11.5, weight: 500, track: 1.4, anchor: "middle", fill: "#CFC9BF" });
      s += T(w / 2 + 150, 246, p.size, { size: 11.5, weight: 500, anchor: "middle", fill: "#CFC9BF" });
      await printLabel(img, { rect: [364, 802, 832, 1080], fw: w, fh: h, svgInner: s, blend: "screen", cyl: { cx: 597, r: 240 }, bow: 3 });
    },
    crop: [330, 600, 1020, 1160],
  },

  // Flacon pompe → nettoyant mousse, lait démaquillant
  pump: {
    src: "pump.webp",
    slugs: ["clear-foam-nettoyant-purifiant", "silk-off-lait-demaquillant"],
    async prep(img) {
      mirrorFix(img, { axis: 591, x0: 300, x1: 590, y0: 993, y1: 1150 });
      mirrorFix(img, { axis: 580, x0: 581, x1: 608, y0: 980, y1: 1040 });
      await paint(img, `<rect x="0" y="993" width="380" height="150"/><rect x="262" y="1160" width="280" height="70" rx="8"/>`, [240, 237, 227]);
      await eraseText(img, { rect: [392, 590, 792, 968], k: 12, thr: 9, smooth: 6, full: true, grain: 2.5 });
    },
    async label(img, slug, c) {
      const p = P[slug];
      const w = 420, h = 380;
      await printLabel(img, { rect: [389, 588, 795, 970], fw: w, fh: h, svgInner: await labelClassic({ w, h, p, c, tintAmt: 0.85, scale: 0.98 }), cyl: { cx: 591, r: 212 } });
    },
    crop: [330, 20, 860, 1150],
  },

  // Flacon brume → brume + toniques + exfoliant liquide
  mist: {
    src: "mist.webp",
    slugs: ["fresh-mist-brume-hydratante", "dew-drop-toner-hydratant", "smooth-reset-toner-exfoliant", "bha-clear-liquid-exfoliant"],
    async prep(img) {
      await paint(img, `<rect x="225" y="1195" width="280" height="40"/>`, [240, 237, 227]);
      await eraseText(img, { rect: [376, 636, 738, 996], k: 12, thr: 9, smooth: 6, full: true, grain: 2.5 });
    },
    async label(img, slug, c) {
      const p = P[slug];
      const w = 400, h = 370;
      await printLabel(img, { rect: [372, 632, 742, 1000], fw: w, fh: h, svgInner: await labelClassic({ w, h, p, c, tintAmt: 0.85, scale: 0.95 }), cyl: { cx: 557, r: 192 } });
    },
    crop: [330, 20, 790, 1160],
  },

  // Tube canule → contour des yeux, soin ciblé
  "eye-tube": {
    src: "eye-tube.png",
    slugs: ["bright-eyes-contour-yeux-cafeine", "even-out-soin-acide-azelaique"],
    async prep(img) {
      await paint(img, `<rect x="225" y="1195" width="280" height="40"/>`, [240, 237, 227]);
      await eraseText(img, { rect: [466, 390, 622, 840], k: 6, thr: 10, smooth: 2 });
    },
    async label(img, slug, c) {
      const p = P[slug];
      const w = 150, h = 470;
      let s = await labelTube({ w, h, p, c, scale: 0.95, padX: 0.06, topY: 0.0 });
      s += await wordmarkTag(6, 385, 100, SAGE);
      s += T(6, 440, `${p.code}   ${p.size}`, { size: 8.5, weight: 500, opacity: 0.8 });
      await printLabel(img, { rect: [470, 380, 622, 850], fw: w, fh: h, svgInner: s, cyl: { cx: 546, r: 100 } });
    },
    crop: [400, 160, 720, 1190],
  },

  // Tube souple → nettoyant gel, crèmes en tube, masque argile
  miror: {
    src: "miror.png",
    scale: 3,
    slugs: ["cloud-gel-nettoyant-doux", "matte-balance-gel-creme", "comfort-zone-creme-apaisante", "pure-clay-masque-purifiant"],
    async prep(img) {
      await eraseText(img, { rect: [192, 170, 335, 485], k: 5, thr: 10, smooth: 1.5 });
    },
    async label(img, slug, c) {
      const p = P[slug];
      const w = 130, h = 320;
      let s = await labelTube({ w, h, p, c, scale: 0.8, padX: 0.04, topY: 0.0 });
      s += await wordmarkTag(5, 262, 78, SAGE);
      s += T(5, 305, `${p.code}   ${p.size}`, { size: 7.5, weight: 500, opacity: 0.8 });
      await printLabel(img, { rect: [196, 168, 330, 490], fw: w, fh: h, svgInner: s, cyl: { cx: 262, r: 90 } });
    },
    crop: [140, 30, 400, 680],
  },

  // Pot large givré → baume démaquillant, disques, poudre
  "balm-jar": {
    src: "balm-jar.png",
    slugs: ["melt-away-baume-demaquillant", "glow-pads-toner-pads-eclat", "calm-pads-pads-apaisants", "polish-me-exfoliant-enzymatique"],
    async prep(img) {
      await eraseText(img, { rect: [212, 515, 782, 925], k: 26, thr: 8, smooth: 12, full: true, grain: 2.5 });
      await eraseText(img, { rect: [208, 515, 786, 925], k: 14, mode: "light", thr: 6, smooth: 8 });
    },
    async label(img, slug, c) {
      const p = P[slug];
      await recolor(img, `<rect x="210" y="492" width="575" height="450" rx="20"/>`, hex(tint(c.accent, 0.62)), { keep: 0.25 });
      const w = 600, h = 400;
      await printLabel(img, { rect: [222, 520, 772, 920], fw: w, fh: h, svgInner: await labelWide({ w, h, p, c, tintAmt: 0.0, showBg: false, scale: 1.2, ink: "#2E3329", wmColor: "#3F4E3A" }), cyl: { cx: 497, r: 288 }, bow: 2 });
    },
    crop: [180, 270, 964, 1020],
  },

  // Patchs : boîte → jour / nuit
  "patch-box": {
    src: "patch-box.webp",
    slugs: ["spot-hero-patchs-anti-imperfections", "spot-hero-night-patchs-nuit"],
    color: () => ({ bg: "#E6E3E6", accent: "#2F3D55" }),
    async prep(img) {
      await eraseText(img, { rect: [140, 85, 280, 132], k: 14, mode: "light", full: true, smooth: 4 });
      await eraseText(img, { rect: [100, 530, 690, 1045], shapes: `<rect x="135" y="560" width="520" height="475"/>`, k: 32, full: true, smooth: 40, grain: 1.5, feather: 12 });
      await eraseText(img, { rect: [470, 200, 680, 420], shapes: `<rect x="490" y="225" width="165" height="170"/>`, k: 20, full: true, smooth: 20, grain: 1.5, feather: 10 });
    },
    async label(img, slug, c) {
      const night = slug.includes("night");
      const tab = night ? [52, 66, 92] : [118, 140, 112];
      recolorWhere(img, [70, 25, 500, 520], (r, g, b) => Math.max(0, Math.min(1, (b - r - 25) / 40)), tab, 130);
      const ink = night ? "#2F3D55" : "#3F4E3A";
      let s = "";
      s += await wordmarkTag(150, 82, 150, "#FFFFFF");
      s += T(150, 650, "SPOT HERO", { size: 82, weight: 700, track: -1, fill: "#1F1F1E" });
      s += T(150, 745, night ? "NIGHT" : "DAY", { size: 82, weight: 300, track: 2, fill: "#1F1F1E" });
      s += T(150, 812, night ? "Patch de nuit réparateur" : "Patch invisible de jour", { size: 30, weight: 600, fill: ink });
      const lines = night
        ? ["Patch hydrocolloïde épais + acide salicylique.", "Absorbe les impuretés et apaise pendant la nuit.", "", "Overnight hydrocolloid patch with salicylic acid.", "", "Testé sous contrôle dermatologique."]
        : ["Patch ultra-fin, invisible sous le maquillage.", "Absorbe les impuretés du bouton en 6 à 8 h.", "", "Ultra-thin daytime hydrocolloid patch.", "", "Sans parfum · testé sous contrôle dermatologique."];
      lines.forEach((l, i) => (s += T(150, 870 + i * 21, l, { size: 15, fill: "#3a3a38" })));
      s += T(578, 910, night ? "24" : "36", { size: 60, weight: 700, anchor: "middle", fill: "#1F1F1E" });
      ["PATCHS", "HYDROCOLLOÏDES", night ? "Ø 14 mm" : "Ø 10 / 12 mm"].forEach((l, i) => (s += T(578, 942 + i * 19, l, { size: 13.5, weight: 500, track: 1, anchor: "middle", fill: "#3a3a38" })));
      s += T(530, 262, night ? "WORK WHILE" : "YOUR SPOT", { size: 21, weight: 700, track: 0.5, fill: ink });
      s += T(530, 292, night ? "YOU SLEEP" : "RESCUE", { size: 21, weight: 700, track: 0.5, fill: ink });
      s += `<path d="M 535 340 C 538 370, 525 382, 500 380" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M 508 370 L 498 380 L 510 388" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      await printLabel(img, { rect: [0, 0, 964, 1088], fw: 964, fh: 1088, svgInner: s, blend: "normal" });
    },
    crop: [40, 10, 740, 1078],
    keepBg: true,
  },

  // Masques tissu : trio + chaque sachet seul
  sheetmasks: {
    src: "sheetmasks.webp",
    slugs: ["sheet-mask-trio", "sheet-mask-hydra", "sheet-mask-calm", "sheet-mask-glow"],
    color: () => ({ bg: "#E1E6E8", accent: "#4F86AE" }),
    async label(img, slug) {
      const M = {
        hydra: { name: "Hydra", sub: "MASQUE TISSU HYDRATANT", line: "Acide hyaluronique · aloe vera", g: ["#CFE3F1", "#EEF4F3"], acc: "#4F86AE" },
        calm: { name: "Calm", sub: "MASQUE TISSU APAISANT", line: "Centella asiatica · panthénol", g: ["#CFE0D2", "#F2F3EA"], acc: "#5F8F75" },
        glow: { name: "Glow", sub: "MASQUE TISSU ÉCLAT", line: "Vitamine C · niacinamide", g: ["#F3D3B4", "#F7EEDF"], acc: "#C98A4A" },
      };
      const pouch = async (k, [tl, tr, bl]) => {
        const m = M[k], W = 400, H = 565;
        const a = (tr[0] - tl[0]) / W, b = (tr[1] - tl[1]) / W, cc = (bl[0] - tl[0]) / H, d = (bl[1] - tl[1]) / H;
        let s = `<defs><linearGradient id="g${k}" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="${m.g[0]}"/><stop offset="1" stop-color="${m.g[1]}"/></linearGradient></defs>`;
        s += `<g transform="matrix(${a} ${b} ${cc} ${d} ${tl[0]} ${tl[1]})">`;
        s += `<rect x="0" y="0" width="${W}" height="${H}" fill="#F4F2EE"/>`;
        s += `<rect x="12" y="12" width="${W - 24}" height="${H - 24}" fill="url(#g${k})"/>`;
        s += `<rect x="12" y="12" width="${W - 24}" height="${H - 24}" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1.5"/>`;
        s += await wordmarkTag(40, 48, 120, "#3F4E3A");
        s += T(W - 40, 64, "1 × 25 ml", { size: 12, weight: 500, anchor: "end", fill: "#3F4E3A" });
        s += T(40, 300, m.name, { size: 78, weight: 500, track: -1.5, fill: "#2A2D28" });
        s += T(40, 352, "Sheet Mask", { size: 34, weight: 400, fill: "#2A2D28" });
        s += R(40, 380, 40, 4, m.acc);
        s += T(40, 415, m.sub, { size: 14, weight: 600, track: 1.6, fill: "#2A2D28", caps: true, max: 320 });
        s += T(40, 438, m.line, { size: 14, fill: "#2A2D28", opacity: 0.8 });
        s += T(40, 515, "Fibres 100 % lyocell · 15 à 20 min", { size: 12, fill: "#2A2D28", opacity: 0.7 });
        return s + "</g>";
      };
      const Q = { glow: [[110, 318], [497, 205], [262, 866]], calm: [[336, 258], [742, 256], [340, 834]], hydra: [[548, 268], [960, 378], [410, 818]] };
      let s = "";
      if (slug === "sheet-mask-trio") for (const k of ["glow", "calm", "hydra"]) s += await pouch(k, Q[k]);
      else s += await pouch(slug.split("-").pop(), Q.hydra);
      await printLabel(img, { rect: [0, 0, 964, 1088], fw: 964, fh: 1088, svgInner: s, blend: "normal" });
      if (slug !== "sheet-mask-trio") {
        const [tl, tr, bl] = Q.hydra, br = [tr[0] + bl[0] - tl[0], tr[1] + bl[1] - tl[1]];
        await paint(img, `<path fill-rule="evenodd" d="M0 0H964V1088H0Z M${tl} L${tr} L${br} L${bl} Z"/>`, [253, 251, 248]);
      }
    },
    crop: [60, 150, 964, 990],
    tol: 8,
  },

  // Accessoires
  cloths: {
    src: "cloths.webp",
    slugs: ["accessoire-carres-demaquillants"],
    color: () => ({ bg: "#F7F5F0" }),
    async prep(img) {
      for (const x of [585, 795, 1025]) await eraseText(img, { rect: [x, 530, x + 110, 700], k: 8, thr: 8, smooth: 2, grain: 4 });
    },
    async label(img) {
      let s = "";
      for (const [x, y] of [[640, 640], [852, 632], [1078, 628]]) s += `<g transform="translate(${x} ${y}) rotate(-58)">${await wordmarkTag(-48, -10, 96, "#C9A08A")}</g>`;
      await printLabel(img, { rect: [0, 0, 1270, 1230], fw: 1270, fh: 1230, svgInner: s, opacity: 0.95 });
    },
    crop: [0, 0, 1270, 1230],
    tol: 10,
  },
  headband: {
    src: "headband.webp",
    slugs: ["accessoire-bandeau-eponge"],
    color: () => ({ bg: "#EDE2DD" }),
    async prep(img) {
      await eraseText(img, { rect: [700, 180, 1005, 515], shapes: `<polygon points="705,445 748,512 990,300 1000,215 958,186"/>`, k: 13, thr: 10, smooth: 3, grain: 14 });
    },
    async label(img) {
      // étiquette tissée cousue sur l'oreille (recouvre l'ancien marquage)
      let s = `<defs><filter id="sh" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
        <linearGradient id="sat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7F3EA"/><stop offset=".5" stop-color="#EFE9DC"/><stop offset="1" stop-color="#E4DCCB"/></linearGradient></defs>`;
      s += `<g transform="translate(850 338) rotate(-46)">`;
      s += `<rect x="-188" y="-36" width="376" height="80" rx="4" fill="#7a3a12" fill-opacity=".35" filter="url(#sh)" transform="translate(4 7)"/>`;
      s += `<rect x="-188" y="-40" width="376" height="80" rx="4" fill="url(#sat)"/>`;
      s += `<rect x="-180" y="-32" width="360" height="64" rx="2" fill="none" stroke="#C9BFA9" stroke-width="1.5" stroke-dasharray="5 4"/>`;
      s += await wordmarkTag(-100, -20, 200, "#5F7259");
      s += `</g>`;
      await printLabel(img, { rect: [0, 0, 1270, 1346], fw: 1270, fh: 1346, svgInner: s, blend: "normal" });
    },
    crop: [0, 0, 1270, 1346],
    tol: 10,
  },
  claw: { src: "claw.webp", slugs: ["accessoire-pince-cheveux"], color: () => ({ bg: "#EAE2CF" }), async label() {}, crop: [0, 0, 1270, 1230], tol: 10 },
  guasha: { src: "guasha.webp", slugs: ["accessoire-gua-sha-jade"], color: () => ({ bg: "#D5DDD3" }), async label() {}, crop: [0, 0, 964, 1088], tol: 14 },
};

async function run() {
  for (const [key, base] of Object.entries(BASES)) {
    if (filter && !key.includes(filter) && !base.slugs.some((s) => s.includes(filter))) continue;
    const img0 = await load(SRC(base.src), base.scale ?? 2);
    if (base.prep) await base.prep(img0);
    for (const slug of base.slugs) {
      if (filter && !key.includes(filter) && !slug.includes(filter)) continue;
      const img = clone(img0);
      const prod = bySlug[slug];
      const lc = LABEL_COLORS[slug];
      await base.label(img, slug, lc ? { bg: lc[0], accent: lc[1] } : base.color?.(slug) ?? prod?.color);
      const out = `${OUT}${slug}.png`;
      await exportPackshot(img, out, { crop: base.crop, tol: base.tol ?? 20, keepBg: base.keepBg });
      if (PREV) await preview(out, `${PREV}/${slug}.jpg`, "#EFEBE3");
      console.log("✓", slug);
    }
  }
}
run();
