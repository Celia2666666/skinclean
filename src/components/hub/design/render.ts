"use client";
import type { Design, DesignPage, ImageLayer, Layer, TextLayer } from "@/lib/hub/types";

/**
 * Moteur de rendu des visuels SKINCLEAN sur <canvas>.
 * Un seul rendu pour l'aperçu, le Studio et l'export PNG : ce qui est vu est exactement ce qui est téléchargé.
 */

const LOGOS = {
  wordmark: "/media/brand/transparent/logo-wordmark.png",
  mark: "/media/brand/transparent/logo-mark.png",
  full: "/media/brand/transparent/logo-wordmark-tagline.png",
};

const cache = new Map<string, Promise<HTMLImageElement | null>>();
export function loadImage(src: string): Promise<HTMLImageElement | null> {
  if (!cache.has(src)) {
    cache.set(src, new Promise((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    }));
  }
  return cache.get(src)!;
}

let fonts: { display: string; body: string } | null = null;
function fontFamilies() {
  if (fonts) return fonts;
  const cs = getComputedStyle(document.documentElement);
  fonts = {
    display: cs.getPropertyValue("--font-display-face").trim() || "Helvetica Neue, Arial, sans-serif",
    body: cs.getPropertyValue("--font-body-face").trim() || "system-ui, sans-serif",
  };
  return fonts;
}

const filterCss = (f?: ImageLayer["filter"]) =>
  f ? `brightness(${f.brightness ?? 100}%) contrast(${f.contrast ?? 100}%) saturate(${f.saturate ?? 100}%) blur(${f.blur ?? 0}px)` : "none";

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** Découpe un texte en lignes (respecte les retours à la ligne). */
export function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    const words = para.split(" ");
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxWidth && line) {
        out.push(line);
        line = w;
      } else line = test;
    }
    out.push(line);
  }
  return out;
}

export function textFont(l: TextLayer) {
  const f = fontFamilies();
  return `${l.weight} ${l.size}px ${l.font === "display" ? f.display : f.body}`;
}

/** Hauteur occupée par un calque texte (pour la sélection dans le Studio). */
export function measureTextLayer(ctx: CanvasRenderingContext2D, l: TextLayer) {
  ctx.font = textFont(l);
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${l.letterSpacing ?? 0}px`;
  const lines = wrapText(ctx, l.upper ? l.text.toUpperCase() : l.text, l.w - (l.pad ?? 0) * 2);
  return { lines, height: lines.length * l.size * (l.lineHeight ?? 1.15) + (l.pad ?? 0) * 2 };
}

async function drawImageFit(ctx: CanvasRenderingContext2D, src: string, x: number, y: number, w: number, h: number, fit: "contain" | "cover", filter?: ImageLayer["filter"]) {
  const img = await loadImage(src);
  if (!img) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.06)";
    ctx.fillRect(x, y, w, h);
    ctx.restore();
    return;
  }
  const r = img.width / img.height;
  let dw = w, dh = h;
  if ((fit === "contain" && w / h > r) || (fit === "cover" && w / h < r)) { dh = h; dw = h * r; } else { dw = w; dh = w / r; }
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.filter = filterCss(filter);
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

async function drawLayer(ctx: CanvasRenderingContext2D, l: Layer) {
  if (l.type === "shape") {
    ctx.save();
    ctx.globalAlpha = l.opacity ?? 1;
    roundRect(ctx, l.x, l.y, l.w, l.h, l.radius ?? 0);
    ctx.fillStyle = l.color;
    ctx.fill();
    if (l.stroke) { ctx.strokeStyle = l.stroke; ctx.lineWidth = 3; ctx.stroke(); }
    ctx.restore();
    return;
  }
  if (l.type === "image") {
    ctx.save();
    ctx.globalAlpha = l.opacity ?? 1;
    if (l.shadow) { ctx.shadowColor = "rgba(0,0,0,0.18)"; ctx.shadowBlur = l.w * 0.06; ctx.shadowOffsetY = l.w * 0.03; }
    if (l.radius) { roundRect(ctx, l.x, l.y, l.w, l.h, l.radius); ctx.clip(); }
    await drawImageFit(ctx, l.src, l.x, l.y, l.w, l.h, l.fit, l.filter);
    ctx.restore();
    return;
  }
  if (l.type === "logo") {
    const img = await loadImage(LOGOS[l.variant]);
    if (!img) return;
    const h = (l.w * img.height) / img.width;
    if (l.tint === "light") {
      const off = document.createElement("canvas");
      off.width = Math.ceil(l.w);
      off.height = Math.ceil(h);
      const o = off.getContext("2d")!;
      o.drawImage(img, 0, 0, l.w, h);
      o.globalCompositeOperation = "source-in";
      o.fillStyle = "#FFFFFF";
      o.fillRect(0, 0, l.w, h);
      ctx.drawImage(off, l.x, l.y);
    } else ctx.drawImage(img, l.x, l.y, l.w, h);
    return;
  }
  // texte
  ctx.save();
  ctx.globalAlpha = l.opacity ?? 1;
  const { lines, height } = measureTextLayer(ctx, l);
  if (l.bg) {
    ctx.fillStyle = l.bg;
    roundRect(ctx, l.x, l.y, l.w, height, 8);
    ctx.fill();
  }
  ctx.fillStyle = l.color;
  ctx.textBaseline = "top";
  ctx.textAlign = l.align;
  const pad = l.pad ?? 0;
  const ax = l.align === "left" ? l.x + pad : l.align === "right" ? l.x + l.w - pad : l.x + l.w / 2;
  const lh = l.size * (l.lineHeight ?? 1.15);
  lines.forEach((line, i) => ctx.fillText(line, ax, l.y + pad + i * lh + (lh - l.size) / 2));
  ctx.restore();
}

export async function renderPage(canvas: HTMLCanvasElement, design: Design, pageIndex = 0, scale = 1) {
  const page: DesignPage | undefined = design.pages[pageIndex] ?? design.pages[0];
  canvas.width = Math.round(design.w * scale);
  canvas.height = Math.round(design.h * scale);
  const ctx = canvas.getContext("2d")!;
  await document.fonts?.ready;
  // Pré-chargement pour éviter les rendus partiels
  const srcs = [page?.bg.type === "image" ? page.bg.src : undefined, ...(page?.layers ?? []).map((l) => (l.type === "image" ? l.src : l.type === "logo" ? LOGOS[l.variant] : undefined))].filter(Boolean) as string[];
  await Promise.all(srcs.map(loadImage));
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, design.w, design.h);
  if (!page) return;
  const bg = page.bg;
  if (bg.type === "gradient") {
    const g = ctx.createLinearGradient(0, 0, design.w, design.h);
    g.addColorStop(0, bg.color);
    g.addColorStop(1, bg.color2 ?? bg.color);
    ctx.fillStyle = g;
  } else ctx.fillStyle = bg.color;
  ctx.fillRect(0, 0, design.w, design.h);
  if (bg.type === "image" && bg.src) {
    await drawImageFit(ctx, bg.src, 0, 0, design.w, design.h, "cover", bg.filter);
    if (bg.overlay) { ctx.fillStyle = bg.overlay; ctx.fillRect(0, 0, design.w, design.h); }
  }
  for (const l of page.layers) await drawLayer(ctx, l);
}

export async function designToDataUrl(design: Design, pageIndex = 0, scale = 1, type = "image/png") {
  const c = document.createElement("canvas");
  await renderPage(c, design, pageIndex, scale);
  return c.toDataURL(type, 0.92);
}

export async function downloadDesign(design: Design, name: string) {
  for (let i = 0; i < design.pages.length; i++) {
    const url = await designToDataUrl(design, i);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}${design.pages.length > 1 ? `-${i + 1}` : ""}.png`;
    a.click();
    await new Promise((r) => setTimeout(r, 250));
  }
}

export const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "visuel";
