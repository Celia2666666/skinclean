/**
 * Exporte une copie publique (lecture seule) du travail du Marketing Hub, pour les espaces Stratégie et Communication en ligne.
 * Le Hub reste local : ce script lit sa base SQLite et écrit src/data/hub-public.json (aucun compte, aucun secret exporté).
 * Usage : git ls-files public | node scripts/export-hub-public.mjs
 */
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";

const db = new DatabaseSync("data/hub/marketing-hub.sqlite", { readOnly: true });
const all = (c) => db.prepare("select data from docs where collection = ?").all(c).map((r) => JSON.parse(r.data));

// Textes provisoires du Hub remplacés pour la version publique
const FIX = { "Dernières dates de commande pour une livraison avant Noël : à compléter selon le transporteur.": "Pense à commander tôt pour recevoir tes cadeaux avant Noël : la livraison est offerte dès 100 € d'achat." };
// Le Skin Diag compte 10 questions partout sur le site
const FIX_RE = [[/\b8 questions\b/g, "10 questions"]];
const fix = (v) => JSON.parse(JSON.stringify(v), (_, x) => (typeof x === "string" ? FIX_RE.reduce((t, [re, to]) => t.replace(re, to), FIX[x] ?? x) : x));

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
const posts = fix(all("posts"))
  .filter((p) => ["tiktok", "instagram", "pinterest", "facebook", "story"].includes(p.platform) && READY.includes(p.status) && mediaOk(p.visual))
  .map(({ id, title, date, platform, format, objective, pillar, campaignId, visual, caption, hashtags, cta, status }) => ({ id, title, date: date ?? null, platform, format, objective, pillar, campaignId, visual, caption, hashtags, cta, status, comments: [], productIds: [] }));
// Vidéos vérifiées image par image : chaque publication reçoit une vidéo qui montre ce que dit sa légende.
// « poster » : aucune vidéo ne correspond (ex. patchs anti-boutons), on affiche le visuel produit de couverture.
const VIDEO = {
  lib_005: "pexels-8131891", // vitamine C le matin : pipette de sérum sur le visage (remplace la vidéo de plage, hors charte)
  lib_006: "pexels-8131887", // acide hyaluronique : gouttes de sérum sur la main
  lib_025: "pexels-8371244", // Skin Journal jour 1 : elle se filme au téléphone
  lib_032: "poster", lib_033: "poster", // patchs Spot Hero : pas de vidéo de patch
  lib_036: "pexels-5927790", // SPF : crème appliquée sur la joue
  lib_029: "pexels-8131886", // vitamine C : pipette et goutte de sérum
  lib_037: "pexels-6925816", // SPF en hiver : application du soin sur le visage
  post_0316: "pexels-7305465", // niacinamide : flacon pipette
  post_0011: "pexels-12322647", // Dew Drop : brume pulvérisée sur le visage
  post_0030: "pexels-5468875", // Matte Balance : gel-crème massé sur le visage
};
const HASHTAGS = { post_0011: ["#toner", "#hydratation"] };
const DROP = new Set(["post_0010", "post_0031"]); // doublons des mythes vitamine C et concentration
for (const p of posts) {
  const v = VIDEO[p.id];
  if (v === "poster") { if (p.visual?.kind === "video" && p.visual.poster) p.visual = { kind: "design", design: p.visual.poster }; }
  else if (v && p.visual?.kind === "video") p.visual = { ...p.visual, src: `/media/videos/demo/${v}.mp4` };
  if (HASHTAGS[p.id]) p.hashtags = HASHTAGS[p.id];
}
for (let i = posts.length - 1; i >= 0; i--) if (DROP.has(posts[i].id) || posts[i].visual?.src?.includes("7467138")) posts.splice(i, 1);

// Un même sujet décliné sur deux réseaux n'est montré qu'une fois
const base = (t, p) => `${p.platform === "tiktok" || p.platform === "instagram" ? "ti" : p.platform}:${t.replace(/^(Reel|TikTok) — /, "").replace(/^Mythe( ou réalité)? : /, "mythe ").replace(/ — (carrousel|le guide)$/, "").toLowerCase()}`;
const seen = new Set();
// Les publications validées passent avant celles en cours de validation
posts.sort((a, b) => READY.indexOf(a.status) - READY.indexOf(b.status));
const unique = posts.filter((p) => !seen.has(base(p.title, p)) && seen.add(base(p.title, p)));
posts.length = 0;
posts.push(...unique);
// La vidéo tournée par l'équipe (TikTok « routine sérum ») en premier
posts.sort((a, b) => Number(b.visual?.src?.includes("tiktok-routine") ?? 0) - Number(a.visual?.src?.includes("tiktok-routine") ?? 0));

const ads = fix(all("ads")).map(({ id, name, platform, campaignId, status, objective, audience, messages, ads: creatives, keywords, negativeKeywords, dailyBudget, totalBudget, startDate, endDate, url }) => ({ id, name, platform, campaignId, status, objective, audience, messages: messages ?? [], creatives: creatives ?? [], keywords: keywords ?? [], negativeKeywords: negativeKeywords ?? [], dailyBudget: dailyBudget ?? null, totalBudget: totalBudget ?? null, startDate: startDate ?? null, endDate: endDate ?? null, url: url ?? null }));

// Le blog /conseils n'est pas publié en ligne : les liens vers d'autres articles deviennent du texte simple
const unlinkBlog = (md) => md.replace(/\[([^\]]+)\]\(\/conseils[^)]*\)/g, "$1");
const articles = fix(all("articles")).filter((a) => mediaOk(a)).map(({ id, slug, status, keyword, secondary, title, metaTitle, metaDescription, excerpt, cover, content, author, readingMinutes }) => ({ id, slug, status, keyword, secondary, title, metaTitle, metaDescription, excerpt, cover, content: unlinkBlog(content), author, readingMinutes }));
const keywords = all("keywords").sort((a, b) => a.priority - b.priority).map(({ id, keyword, cluster, intent, priority, targetUrl, difficulty }) => ({ id, keyword, cluster, intent, priority, targetUrl, difficulty }));
const emails = fix(all("emails")).filter((e) => mediaOk(e)).map(({ id, name, status, subject, preheader, blocks, campaignId }) => ({ id, name, status, subject, preheader, blocks, campaignId }));

const out = { exportedAt: new Date().toISOString().slice(0, 10), strategy, personas, objectives, roadmap, campaigns, posts, ads, articles, keywords, emails };
const txt = JSON.stringify(out);
if (/lorem|à compléter|password/i.test(txt)) console.warn("Attention : texte interdit trouvé dans l'export");
fs.writeFileSync("src/data/hub-public.json", JSON.stringify(out, null, 1));
console.log(`Export : ${strategy.length} sections, ${personas.length} personas, ${objectives.length} objectifs, ${roadmap.length} mois, ${campaigns.length} campagnes, ${posts.length} publications, ${ads.length} publicités, ${articles.length} articles, ${keywords.length} mots-clés, ${emails.length} e-mails — ${(txt.length / 1024).toFixed(0)} Ko`);
