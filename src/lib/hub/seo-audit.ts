import "server-only";
import { readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { list } from "./repo";
import { liveKits, liveProducts, patchOverrides, readOverrides } from "./site-sync";

/**
 * Audit SEO réel des pages du site : chaque page est chargée et analysée (balises title, meta description, H1,
 * attributs alt, canonical, volume de texte, liens internes). Aucune donnée n'est estimée.
 */

export interface PageAudit {
  url: string; status: number; title: string; titleLength: number; description: string; descriptionLength: number;
  h1: number; imagesWithoutAlt: number; images: number; words: number; internalLinks: number; canonical: boolean; ogImage: boolean;
  score: number; issues: { level: "erreur" | "alerte" | "conseil"; text: string }[]; productId?: string;
}

const strip = (s: string) => s.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
const attr = (tag: string, name: string) => new RegExp(`${name}=["']([^"']*)["']`, "i").exec(tag)?.[1];
const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");

function analyse(url: string, status: number, html: string, productId?: string): PageAudit {
  const title = decode(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.trim() ?? "");
  const metaTags = html.match(/<meta[^>]+>/gi) ?? [];
  const description = decode(metaTags.map((m) => (/name=["']description["']/i.test(m) ? attr(m, "content") : undefined)).find(Boolean) ?? "");
  const ogImage = metaTags.some((m) => /property=["']og:image["']/i.test(m));
  const canonical = /<link[^>]+rel=["']canonical["']/i.test(html);
  const main = /<main[\s\S]*?<\/main>/i.exec(html)?.[0] ?? html;
  const h1 = (main.match(/<h1[\s>]/gi) ?? []).length;
  const imgs = main.match(/<img[^>]*>/gi) ?? [];
  const imagesWithoutAlt = imgs.filter((t) => !/\salt=/.test(t)).length;
  const words = strip(main).split(" ").filter((w) => w.length > 1).length;
  const internalLinks = (main.match(/<a[^>]+href=["']\/[^"']*["']/gi) ?? []).length;
  const issues: PageAudit["issues"] = [];
  if (status !== 200) issues.push({ level: "erreur", text: `La page répond ${status}.` });
  if (!title) issues.push({ level: "erreur", text: "Balise title absente." });
  else if (title.length > 65) issues.push({ level: "alerte", text: `Title trop long (${title.length} caractères, viser 50-60).` });
  else if (title.length < 30) issues.push({ level: "conseil", text: `Title court (${title.length} caractères) : ajoute le mot-clé principal.` });
  if (!description) issues.push({ level: "erreur", text: "Meta description absente." });
  else if (description.length > 160) issues.push({ level: "alerte", text: `Meta description trop longue (${description.length} caractères, viser 140-155).` });
  else if (description.length < 110) issues.push({ level: "conseil", text: `Meta description courte (${description.length} caractères).` });
  if (h1 === 0) issues.push({ level: "erreur", text: "Aucun titre H1." });
  if (h1 > 1) issues.push({ level: "alerte", text: `${h1} titres H1 (un seul recommandé).` });
  if (imagesWithoutAlt) issues.push({ level: "alerte", text: `${imagesWithoutAlt} image(s) sans attribut alt.` });
  if (words < 250) issues.push({ level: "conseil", text: `Contenu court (${words} mots) : enrichir le texte utile.` });
  if (!canonical && productId) issues.push({ level: "conseil", text: "Pas d'URL canonique déclarée." });
  if (internalLinks < 3) issues.push({ level: "conseil", text: "Peu de liens internes dans le contenu." });
  const score = Math.max(0, 100 - issues.reduce((s, i) => s + (i.level === "erreur" ? 25 : i.level === "alerte" ? 10 : 4), 0));
  return { url, status, title, titleLength: title.length, description, descriptionLength: description.length, h1, imagesWithoutAlt, images: imgs.length, words, internalLinks, canonical, ogImage, score, issues, productId };
}

export async function runSeoAudit(origin: string) {
  const pages: { path: string; productId?: string }[] = [
    { path: "/" }, { path: "/soins-visage" }, { path: "/best-sellers" }, { path: "/kits" }, { path: "/skin-diag" }, { path: "/club" }, { path: "/conseils" },
    ...liveProducts().map((p) => ({ path: `/produits/${p.slug}`, productId: p.id })),
    ...liveKits().slice(0, 4).map((k) => ({ path: `/kits/${k.slug}` })),
    ...list("articles").filter((a) => a.status === "publie").map((a) => ({ path: `/conseils/${a.slug}` })),
  ];
  const out: PageAudit[] = [];
  const queue = [...pages];
  const worker = async () => {
    while (queue.length) {
      const p = queue.shift()!;
      try {
        const r = await fetch(`${origin}${p.path}`, { headers: { "x-hub-audit": "1" }, cache: "no-store" });
        out.push(analyse(p.path, r.status, await r.text(), p.productId));
      } catch (e) {
        out.push({ ...analyse(p.path, 0, "", p.productId), issues: [{ level: "erreur", text: `Page injoignable : ${(e as Error).message}` }], score: 0 });
      }
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  out.sort((a, b) => a.score - b.score);
  return { at: new Date().toISOString(), pages: out, average: Math.round(out.reduce((s, p) => s + p.score, 0) / Math.max(out.length, 1)) };
}

/* ───────── Images ───────── */
const MEDIA = path.join(process.cwd(), "public", "media");
function walk(dir: string, acc: string[] = []) {
  for (const f of readdirSync(dir)) {
    const full = path.join(dir, f);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (/\.(png|jpe?g|webp|avif|gif)$/i.test(f)) acc.push(full);
  }
  return acc;
}

export async function imageAudit() {
  const sharp = (await import("sharp")).default;
  const files = existsSync(MEDIA) ? walk(MEDIA) : [];
  const used = new Set(liveProducts().flatMap((p) => [p.media.packshot, p.media.hover, ...(p.media.gallery ?? [])]).filter(Boolean) as string[]);
  const rows = await Promise.all(
    files.map(async (f) => {
      const rel = "/" + path.relative(path.join(process.cwd(), "public"), f).split(path.sep).join("/");
      const size = statSync(f).size;
      let width = 0, height = 0, format = path.extname(f).slice(1);
      try { const m = await sharp(f).metadata(); width = m.width ?? 0; height = m.height ?? 0; format = m.format ?? format; } catch { /* fichier illisible */ }
      const issues: string[] = [];
      if (size > 500_000) issues.push(`Poids élevé (${Math.round(size / 1024)} Ko)`);
      if (["png", "jpeg", "jpg"].includes(format) && size > 200_000) issues.push("Convertir en WebP");
      if (width > 2400) issues.push(`Très grande largeur (${width} px)`);
      return { path: rel, size, width, height, format, usedByProduct: used.has(rel), issues, webpExists: existsSync(f.replace(/\.(png|jpe?g)$/i, ".webp")) };
    })
  );
  rows.sort((a, b) => b.size - a.size);
  return { total: rows.length, totalSize: rows.reduce((s, r) => s + r.size, 0), toOptimize: rows.filter((r) => r.issues.length).length, images: rows.slice(0, 200) };
}

/** Crée une version WebP optimisée (qualité 82, largeur ≤ 1600 px) et met à jour les fiches produits qui l'utilisent. */
export async function optimizeImage(rel: string) {
  if (!rel.startsWith("/media/") || rel.includes("..") || !/\.(png|jpe?g)$/i.test(rel)) throw new Error("Image non optimisable.");
  const sharp = (await import("sharp")).default;
  const src = path.join(process.cwd(), "public", rel);
  const destRel = rel.replace(/\.(png|jpe?g)$/i, ".webp");
  const dest = path.join(process.cwd(), "public", destRel);
  await sharp(src).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82, alphaQuality: 90 }).toFile(dest);
  const before = statSync(src).size;
  const after = statSync(dest).size;
  const products = liveProducts().filter((p) => p.media.packshot === rel);
  if (products.length) {
    const o = readOverrides();
    patchOverrides(() => ({ ...o, products: { ...(o.products ?? {}), ...Object.fromEntries(products.map((p) => [p.id, { ...(o.products?.[p.id] ?? {}), media: { ...(o.products?.[p.id]?.media ?? {}), packshot: destRel } }])) } }), "Optimisation SEO");
  }
  return { path: destRel, before, after, saved: before - after, updatedProducts: products.map((p) => p.name) };
}
