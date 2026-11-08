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

export function textFont(l: TextLayer, size = l.size) {
  const f = fontFamilies();
  return `${l.weight} ${size}px ${l.font === "display" ? f.display : f.body}`;
}

/**
 * Mise en page d'un calque texte : retour à la ligne, réduction automatique de la taille si le texte
 * dépasse sa boîte (maxH) et position verticale (valign). Garantit qu'aucun texte ne déborde sur un autre élément.
 */
export function layoutText(ctx: CanvasRenderingContext2D, l: TextLayer) {
  const pad = l.pad ?? 0;
  const text = l.upper ? l.text.toUpperCase() : l.text;
  const lh = l.lineHeight ?? 1.15;
  let size = l.size;
  let lines: string[] = [];
  let height = 0;
  for (let i = 0; i < 40; i++) {
    ctx.font = textFont(l, size);
    if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${(l.letterSpacing ?? 0) * (size / l.size)}px`;
    lines = wrapText(ctx, text, l.w - pad * 2);
    // un mot plus large que la boîte force aussi la réduction
    const tooWide = lines.some((ln) => ctx.measureText(ln).width > l.w - pad * 2 + 1);
    height = lines.length * size * lh + pad * 2;
    if ((!l.maxH || height <= l.maxH) && !tooWide) break;
    if (size <= l.size * 0.45) break;
    size *= 0.94;
  }
  const box = l.maxH ?? height;
  const offset = l.valign === "middle" ? Math.max(0, (box - height) / 2) : l.valign === "bottom" ? Math.max(0, box - height) : 0;
  return { lines, height, size, lh, y: l.y + offset, boxHeight: Math.max(box, height) };
}

/** Hauteur occupée par un calque texte (pour la sélection dans le Studio). */
export function measureTextLayer(ctx: CanvasRenderingContext2D, l: TextLayer) {
  const r = layoutText(ctx, l);
  return { lines: r.lines, height: r.boxHeight };
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
  const t = layoutText(ctx, l);
  if (l.bg) {
    ctx.fillStyle = l.bg;
    roundRect(ctx, l.x, t.y, l.w, t.height, 8);
    ctx.fill();
  }
  ctx.font = textFont(l, t.size);
  ctx.fillStyle = l.color;
  ctx.textBaseline = "middle";
  ctx.textAlign = l.align;
  const pad = l.pad ?? 0;
  const ax = l.align === "left" ? l.x + pad : l.align === "right" ? l.x + l.w - pad : l.x + l.w / 2;
  const lineH = t.size * t.lh;
  // Chaque ligne est centrée verticalement dans sa hauteur de ligne (rendu identique quelle que soit la police)
  t.lines.forEach((line, i) => ctx.fillText(line, ax, t.y + pad + i * lineH + lineH / 2));
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
