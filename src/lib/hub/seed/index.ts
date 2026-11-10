import "server-only";
import { randomBytes } from "node:crypto";
import { getMeta, nowIso, setMeta, tx } from "../db";
import { create, list, put, update } from "../repo";
import { createUser, listUsers } from "../auth";
import type { Metric, Post, Settings } from "../types";
import { addDays, diffDays, parseLocal, todayYmd, ymd } from "../dates";
import { tplBanner } from "../templates";
import { objectives, personas, strategySections } from "./strategy";
import { campaigns } from "./campaigns";
import { buildCalendar, buildLibrary } from "./social";
import { emails } from "./emails";
import { ads } from "./ads";
import { articleBriefs, articles as baseArticles, keywords } from "./seo";
import { briefArticles } from "./seo-articles";
import { niacinamidePlan, routineVideoLibraryPost } from "./example-campaign";
import { upgradeMedia, upgradeVideosV6, upgradeVisualsV5 } from "./media-upgrade";

const articles = [...baseArticles, ...briefArticles];
import { roadmap } from "./roadmap";

/** Compte universel unique : une seule personne gère tout le marketing (tous les droits). */
export const SEED_USERS = [
  { email: "skinclean@skinclean.local", name: "SKINCLEAN", role: "admin" as const, title: "Compte universel — accès complet" },
];
/**
 * Mot de passe des comptes créés au premier lancement : HUB_SEED_PASSWORD si défini,
 * sinon un mot de passe aléatoire affiché une seule fois dans le terminal (aucun secret écrit dans le code).
 */
let generatedSeedPassword: string | undefined;
export const seedPassword = () => {
  if (process.env.HUB_SEED_PASSWORD) return process.env.HUB_SEED_PASSWORD;
  if (!generatedSeedPassword) {
    generatedSeedPassword = randomBytes(9).toString("base64url");
    console.info(`[Marketing Hub] Mot de passe initial des comptes : ${generatedSeedPassword} (définis HUB_SEED_PASSWORD pour le choisir, ou npm run hub:mot-de-passe pour le changer).`);
  }
  return generatedSeedPassword;
};

export const DEFAULT_SETTINGS: Settings = {
  frequencies: {
    instagram: { perWeek: 4, label: "Instagram — publications / semaine" },
    story: { perWeek: 5, label: "Stories Instagram — jours / semaine" },
    tiktok: { perWeek: 4, label: "TikTok — vidéos / semaine" },
    facebook: { perWeek: 3, label: "Facebook — publications / semaine" },
    pinterest: { perWeek: 5, label: "Pinterest — épingles / semaine" },
    newsletter: { perMonth: 2, label: "Newsletter — envois / mois" },
    blog: { perMonth: 4, label: "Articles de blog SEO — / mois" },
  },
  brand: {
    colors: [{ name: "Forest", hex: "#1F3329" }, { name: "Sage", hex: "#D8DFD4" }, { name: "Sage profond", hex: "#4A6354" }, { name: "Crème", hex: "#FAF9F6" }, { name: "Sable", hex: "#EFEEEA" }],
    tone: ["Complice (tutoiement)", "Pédagogue", "Lucide : jamais de promesse miracle", "Lumineux"],
  },
  demoMode: true,
  publishingRules: { requireValidation: true, validatorRoles: ["validateur", "marketing", "admin"] },
};

/** Petit générateur pseudo-aléatoire déterministe (données de démonstration reproductibles). */
function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

/** Données de DÉMONSTRATION : 8 semaines passées, étiquetées source = "demo", jamais mélangées aux données réelles. */
function demoMetrics(): Omit<Metric, "id">[] {
  const r = rng(42);
  const out: Omit<Metric, "id">[] = [];
  const t = todayYmd();
  for (let w = 8; w >= 1; w--) {
    const date = addDays(t, -7 * w);
    const g = (9 - w) / 8; // croissance progressive
    const social = (channel: string, base: number) => {
      const reach = Math.round(base * (0.6 + g) * (0.85 + r() * 0.3));
      const impressions = Math.round(reach * (1.4 + r() * 0.4));
      const likes = Math.round(reach * (0.025 + r() * 0.015));
      out.push({ source: "demo", channel, date, values: {
        posts: channel === "pinterest" ? 5 : channel === "tiktok" || channel === "instagram" ? 4 : 3,
        reach, impressions, likes, comments: Math.round(likes * 0.08), shares: Math.round(likes * 0.12), saves: Math.round(likes * 0.18),
        followers: Math.round(base * 0.03 * (0.5 + g) * (0.8 + r() * 0.4)), views: channel === "tiktok" || channel === "instagram" ? Math.round(reach * 1.6) : 0,
      } });
    };
    social("instagram", 9000);
    social("tiktok", 16000);
    social("facebook", 2500);
    social("pinterest", 6000);
    const spend = Math.round((180 + r() * 90) * (0.7 + g * 0.5));
    const impressions = Math.round(spend * (95 + r() * 30));
    const clicks = Math.round(impressions * (0.011 + r() * 0.006));
    out.push({ source: "demo", channel: "ads", date, values: { spend, impressions, reach: Math.round(impressions * 0.62), clicks, videoViews: Math.round(impressions * 0.21) } });
    const seoImpr = Math.round(1200 * (0.4 + g * 1.4) * (0.9 + r() * 0.2));
    out.push({ source: "demo", channel: "seo", date, values: { impressions: seoImpr, clicks: Math.round(seoImpr * (0.025 + r() * 0.01)), position: Math.round((38 - g * 14 + r() * 3) * 10) / 10 } });
    if (w % 2 === 0) {
      const delivered = Math.round(600 * (0.5 + g) * (0.9 + r() * 0.2));
      out.push({ source: "demo", channel: "email", date, values: { delivered, opens: Math.round(delivered * (0.32 + r() * 0.08)), clicks: Math.round(delivered * (0.035 + r() * 0.02)), unsubscribes: Math.round(delivered * 0.003) } });
    }
  }
  return out;
}

export async function seedAll() {
  if (getMeta("seeded")) return;
  const t0 = todayYmd();
  tx(() => {
    if (!listUsers().length) for (const u of SEED_USERS) createUser({ ...u, password: seedPassword() });

    put("settings", { id: "main", ...DEFAULT_SETTINGS });
    strategySections.forEach((x) => put("strategy", x));
    personas.forEach((x) => put("personas", x));
    objectives().forEach((x) => put("objectives", { ...x }));
    campaigns().forEach((x) => put("campaigns", x));
    emails().forEach((x) => put("emails", x));
    ads().forEach((x) => put("ads", x));
    keywords.forEach((x) => put("keywords", x));
    articles.forEach((x) => put("articles", x));
    roadmap().forEach((x) => put("roadmap", x));

    // Calendrier social
    const { posts } = buildCalendar(15);
    posts.forEach((p) => put("posts", p));
    buildLibrary().forEach((p, i) => put("posts", { ...p, id: `lib_${String(i + 1).padStart(3, "0")}` }));
    create("posts", routineVideoLibraryPost());

    // Newsletters : 2 par mois (1er et 3e jeudi), reliées aux modèles d'e-mails
    const mailOrder = ["mail-glow", "mail-20", "mail-ingredients", "mail-nouveautes", "mail-collection", "mail-saison", "mail-anti-imperfections", "mail-fidelite"];
    const extra: Post[] = [];
    const end = addDays(t0, 15 * 7);
    let mi = 0;
    for (let d = t0; d <= end; d = addDays(d, 1)) {
      const dt = parseLocal(d);
      const nth = Math.ceil(dt.getDate() / 7);
      if (dt.getDay() === 4 && (nth === 1 || nth === 3)) {
        const mail = emails().find((m) => m.id === mailOrder[mi % mailOrder.length])!;
        mi++;
        extra.push(calendarItem(d + "T09:00", "newsletter", mail.name, `Objet : ${mail.subject}\nPréheader : ${mail.preheader}`, { emailId: mail.id, campaignId: mail.campaignId, visual: { kind: "design", design: (mail.blocks.find((b) => b.type === "hero") as { design?: never })?.design } }, t0));
      }
      // Articles SEO : 4 par mois (chaque mardi, max 4)
      if (dt.getDay() === 2 && Math.ceil(dt.getDate() / 7) <= 4) extra.push(blogSlot(d, extra.filter((x) => x.platform === "blog").length, t0));
    }
    extra.forEach((p, i) => put("posts", { ...p, id: `cal_${String(i + 1).padStart(3, "0")}` }));

    demoMetrics().forEach((m) => create("metrics", m as Metric));

    // Ticket d'accueil de l'équipe marketing
    const team = { name: "Équipe marketing" };
    put("tickets", {
      id: "tkt_welcome", number: 1001, type: "Question", subject: "Bienvenue sur ton Marketing Hub", priority: "normale", status: "en_attente",
      description: "Ta stratégie, ton calendrier des 3 prochains mois et tes 12 campagnes sont prêts. Les contenus des 10 prochains jours t'attendent dans « Mes contenus à valider ».",
      attachments: [], createdBy: "equipe", assignee: team.name, createdAt: nowIso(), updatedAt: nowIso(),
      messages: [{ id: "m1", author: team.name, role: "equipe", at: nowIso(), text: "Bonjour ! Nous avons préparé l'ensemble de ta stratégie marketing. Commence par l'accueil : tes actions du jour y sont listées. Une question ? Réponds simplement à ce message." }],
    });
    setMeta("seeded", nowIso());
    setMeta("seed-articles-v2", nowIso());
    setMeta("seed-example-v3", nowIso());
  });
}

function calendarItem(date: string, platform: "newsletter" | "blog", title: string, caption: string, extra: Partial<Post>, t0: string): Post {
  return {
    id: "", title, date, platform, format: platform === "blog" ? "article" : "newsletter", objective: platform === "blog" ? "SEO" : "Engagement",
    pillar: platform === "blog" ? "Skin School" : "Communauté", caption, hashtags: [], cta: platform === "blog" ? "Lire l'article" : "Ouvrir la newsletter",
    productIds: [], status: diffDays(date, t0) <= 10 ? "a_valider" : "brouillon", comments: [], createdAt: nowIso(), updatedAt: nowIso(), ...extra,
  };
}

const articleSlot = (full: (typeof articles)[number]): Partial<Post> => ({
  caption: `Mot-clé principal : ${full.keyword}\n${full.excerpt}`, articleId: full.id, productIds: full.productIds,
  visual: { kind: "design", design: tplBanner({ format: "newsletter", headline: full.title.split(":")[0], eyebrow: "Blog SKINCLEAN", packshot: full.cover }) },
});

function blogSlot(d: string, k: number, t0: string): Post {
  const full = articles[k];
  if (full) return calendarItem(d + "T08:00", "blog", full.title, "", articleSlot(full), t0);
  const b = articleBriefs[(k - articles.length) % articleBriefs.length];
  return calendarItem(d + "T08:00", "blog", b.title, `Brief SEO — mot-clé principal : ${b.keyword}\nURL prévue : /conseils/${b.slug}\nPlan : introduction, 3 à 5 parties pratiques, routine SKINCLEAN, appel au Skin Diag.`, { productIds: b.productIds, status: "brouillon" }, t0);
}

/**
 * Mise à niveau d'une base déjà remplie : ajoute les articles rédigés à partir des briefs
 * (sans toucher à ceux qui existent) et relie les créneaux « Brief SEO » du calendrier à leur article.
 */
export function upgradeSeed() {
  if (!getMeta("seed-media-v4")) tx(() => { upgradeMedia(addDays(todayYmd(), 6)); setMeta("seed-media-v4", nowIso()); });
  if (!getMeta("seed-visuals-v5")) tx(() => { upgradeVisualsV5(); setMeta("seed-visuals-v5", nowIso()); });
  if (!getMeta("seed-videos-v6")) tx(() => { upgradeVideosV6(); setMeta("seed-videos-v6", nowIso()); });
  if (!getMeta("seed-example-v3")) tx(() => {
    // Campagne exemple « Sérum niacinamide » finalisée + vidéo routine dans la bibliothèque TikTok
    const c = list("campaigns").find((x) => x.id === "camp-niacinamide");
    if (c && !c.activatedAt) update("campaigns", c.id, { plan: niacinamidePlan });
    const lib = routineVideoLibraryPost();
    if (!list("posts").some((p) => p.library && p.title === lib.title)) create("posts", lib);
    setMeta("seed-example-v3", nowIso());
  });
  if (getMeta("seed-articles-v2")) return;
  tx(() => {
    const existing = list("articles");
    for (const a of briefArticles) if (!existing.some((x) => x.id === a.id || x.slug === a.slug)) put("articles", a);
    const all = list("articles");
    for (const p of list("posts")) {
      if (p.platform !== "blog" || p.articleId || !p.caption.startsWith("Brief SEO")) continue;
      const a = all.find((x) => p.caption.includes(`/conseils/${x.slug}`));
      if (a) update("posts", p.id, { ...articleSlot(a), title: a.title });
    }
    setMeta("seed-articles-v2", nowIso());
  });
}

export const _test = { ymd };
