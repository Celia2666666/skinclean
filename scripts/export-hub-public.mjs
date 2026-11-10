/**
 * Exporte une copie publique (lecture seule) du travail du Marketing Hub, pour les espaces Stratégie et Communication en ligne.
 * Le Hub reste local : ce script lit sa base SQLite et écrit src/data/hub-public.json (aucun compte, aucun secret exporté).
 * Usage : git ls-files public | node scripts/export-hub-public.mjs
 */
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";

const db = new DatabaseSync("data/hub/marketing-hub.sqlite", { readOnly: true });
const all = (c) => db.prepare("select data from docs where collection = ?").all(c).map((r) => JSON.parse(r.data));

// Seuls les fichiers versionnés dans le dépôt sont disponibles en ligne
const tracked = new Set(fs.readFileSync(0, "utf8").split("\n").filter(Boolean).map((f) => f.replace(/^public/, "")));
const mediaOk = (v) => [...JSON.stringify(v).matchAll(/"(\/media\/[^"]+)"/g)].every(([, m]) => tracked.has(m));

const clean = (blocks) => blocks.filter((b) => !/à compléter/i.test(`${b.text} ${b.source ?? ""}`));

const strategy = all("strategy").sort((a, b) => a.order - b.order).map(({ id, group, title, summary, blocks }) => ({ id, group, title, summary, blocks: clean(blocks) }));
const personas = all("personas").map(({ id, name, age, color, avatar, summary, skin, motivations, frustrations, digital, messages }) => ({ id, name, age, color, avatar, summary, skin, motivations, frustrations, digital, messages }));
const objectives = all("objectives").map(({ id, axis, title, kpi, baseline, target, unit, deadline, owner }) => ({ id, axis, title, kpi, baseline, target, unit, deadline, owner }));
const roadmap = all("roadmap").sort((a, b) => a.month.localeCompare(b.month)).map(({ month, theme, objective, campaigns, networks, posts, seo, sea, newsletters, budget, kpis, deliverables, color }) => ({ month, theme, objective, campaigns, networks, posts, seo, sea, newsletters, budget, kpis, deliverables, color }));
const campaigns = all("campaigns").map(({ id, name, status, color, objective, target, concept, message, channels, budget, kpis, startDate, durationDays, plan }) => ({ id, name, status, color, objective, target, concept, message, channels, budget: (budget ?? []).reduce((a, b) => a + b.amount, 0), kpis, startDate: startDate ?? null, durationDays: durationDays ?? null, plan: plan ?? [] }));

const READY = ["valide", "publie_test", "a_valider"];
const posts = all("posts")
  .filter((p) => ["tiktok", "instagram", "pinterest", "facebook", "story"].includes(p.platform) && READY.includes(p.status) && mediaOk(p.visual))
  .map(({ id, title, date, platform, format, objective, pillar, campaignId, visual, caption, hashtags, cta, status }) => ({ id, title, date: date ?? null, platform, format, objective, pillar, campaignId, visual, caption, hashtags, cta, status, comments: [], productIds: [] }));
// Un même sujet décliné sur deux réseaux n'est montré qu'une fois
const base = (t, p) => `${p.platform === "tiktok" || p.platform === "instagram" ? "ti" : p.platform}:${t.replace(/^(Reel|TikTok) — /, "").replace(/ — (carrousel|le guide)$/, "").toLowerCase()}`;
const seen = new Set();
// Les publications validées passent avant celles en cours de validation
posts.sort((a, b) => READY.indexOf(a.status) - READY.indexOf(b.status));
const unique = posts.filter((p) => !seen.has(base(p.title, p)) && seen.add(base(p.title, p)));
posts.length = 0;
posts.push(...unique);
// La vidéo tournée par l'équipe (TikTok « routine sérum ») en premier
posts.sort((a, b) => Number(b.visual?.src?.includes("tiktok-routine") ?? 0) - Number(a.visual?.src?.includes("tiktok-routine") ?? 0));

const ads = all("ads").map(({ id, name, platform, status, objective, audience, ads: creatives, budget }) => ({ id, name, platform, status, objective, audience, creatives: (creatives ?? []).slice(0, 1), budget: budget ?? null }));

// Le blog /conseils n'est pas publié en ligne : les liens vers d'autres articles deviennent du texte simple
const unlinkBlog = (md) => md.replace(/\[([^\]]+)\]\(\/conseils[^)]*\)/g, "$1");
const articles = all("articles").filter((a) => mediaOk(a)).map(({ id, slug, status, keyword, secondary, title, metaTitle, metaDescription, excerpt, cover, content, author, readingMinutes }) => ({ id, slug, status, keyword, secondary, title, metaTitle, metaDescription, excerpt, cover, content: unlinkBlog(content), author, readingMinutes }));
const keywords = all("keywords").sort((a, b) => a.priority - b.priority).map(({ id, keyword, cluster, intent, priority, targetUrl, difficulty }) => ({ id, keyword, cluster, intent, priority, targetUrl, difficulty }));
// Textes provisoires du Hub remplacés pour la version publique
const FIX = { "Dernières dates de commande pour une livraison avant Noël : à compléter selon le transporteur.": "Pense à commander tôt pour recevoir tes cadeaux avant Noël : la livraison est offerte dès 100 € d'achat." };
const fix = (v) => JSON.parse(JSON.stringify(v), (_, x) => (typeof x === "string" && FIX[x] ? FIX[x] : x));
const emails = fix(all("emails")).filter((e) => mediaOk(e)).map(({ id, name, status, subject, preheader, blocks, campaignId }) => ({ id, name, status, subject, preheader, blocks, campaignId }));

const out = { exportedAt: new Date().toISOString().slice(0, 10), strategy, personas, objectives, roadmap, campaigns, posts, ads, articles, keywords, emails };
const txt = JSON.stringify(out);
if (/lorem|à compléter|password/i.test(txt)) console.warn("Attention : texte interdit trouvé dans l'export");
fs.writeFileSync("src/data/hub-public.json", JSON.stringify(out, null, 1));
console.log(`Export : ${strategy.length} sections, ${personas.length} personas, ${objectives.length} objectifs, ${roadmap.length} mois, ${campaigns.length} campagnes, ${posts.length} publications, ${ads.length} publicités, ${articles.length} articles, ${keywords.length} mots-clés, ${emails.length} e-mails — ${(txt.length / 1024).toFixed(0)} Ko`);
