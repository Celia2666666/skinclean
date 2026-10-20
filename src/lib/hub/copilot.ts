import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { products } from "@/data/products";
import type { Product } from "@/lib/types";
import { HttpError } from "./auth";
import { get, list, logActivity, create } from "./repo";
import { can } from "./permissions";
import { getHandler } from "./handlers";
import { planPeriod, THEME_TITLES } from "./seed/social";
import { addDays, frDay, mondayOf, monthLabel, todayYmd } from "./dates";
import { tplCarousel, tplProductHero, tplBanner } from "./templates";
import type { EmailBlock, HubUser, NewDoc, Post, Platform, EmailCampaign, Campaign } from "./types";
import { PLATFORM_LABEL, STATUS_LABEL } from "./types";

/**
 * SKINCLEAN MARKETING COPILOT
 * - Mode IA (ANTHROPIC_API_KEY défini) : Claude reçoit un instantané des données du Hub et répond en JSON structuré.
 * - Mode guidé (sans clé) : moteur de règles qui lit réellement la base et prépare de vrais brouillons.
 * Dans les deux cas, les actions proposées ne sont appliquées qu'après confirmation explicite de l'utilisateur.
 */

export interface CopilotAction {
  id: string;
  kind: "create_post" | "create_email" | "create_campaign" | "plan_posts";
  label: string;
  summary: string;
  payload: Record<string, unknown>;
}
export interface CopilotReply { reply: string; mode: "ia" | "guide"; actions: CopilotAction[]; links: { label: string; href: string }[] }

type Msg = { role: "user" | "assistant"; content: string };
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const MONTHS = ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre"];
let n = 0;
const aid = () => `act_${Date.now().toString(36)}_${n++}`;

function findProduct(q: string): Product | undefined {
  const s = norm(q);
  const direct = products.find((p) => s.includes(norm(p.name)));
  if (direct) return direct;
  const map: [RegExp, string][] = [
    [/niacinamide|pores|imperfection|bouton/, "sc-sr-01"], [/vitamine c|eclat|glow|terne/, "sc-sr-02"], [/hydrat|hyaluron|repulp/, "sc-sr-03"],
    [/apais|sensible|rougeur|centella/, "sc-sr-04"], [/retin|ride|anti-age|nuit/, "sc-sr-06"], [/bakuchiol/, "sc-sr-05"], [/spf|solaire|soleil/, "sc-sp-01"],
    [/creme riche|ceramide|barriere|hiver/, "sc-cr-02"], [/demaquill|baume/, "sc-dm-01"], [/patch/, "sc-pt-01"], [/yeux|cerne/, "sc-ey-01"], [/masque/, "sc-ms-01"], [/autobronz|dha|hale/, "sc-sr-07"],
  ];
  const hit = map.find(([re]) => re.test(s));
  return hit ? products.find((p) => p.id === hit[1]) : undefined;
}

const postLine = (p: Post) => `• ${p.date.slice(11, 16) || "—"} · ${PLATFORM_LABEL[p.platform]} — ${p.title} (${STATUS_LABEL[p.status]})`;

/* ───────── Mode guidé ───────── */
function guided(u: HubUser, q: string): CopilotReply {
  const s = norm(q);
  const t = todayYmd();
  const posts = list("posts").filter((p) => !p.library);
  const links: CopilotReply["links"] = [];

  // 1. Programme du jour
  if (/(aujourd|du jour|publie.*(ce jour|today)|quoi publier|qu.est-ce que je publie)/.test(s)) {
    const today = posts.filter((p) => p.date.startsWith(t)).sort((a, b) => a.date.localeCompare(b.date));
    const dueAds = list("ads").filter((a) => a.reviewDueAt?.startsWith(t) && a.status === "a_valider");
    const dueMails = list("emails").filter((m) => m.reviewDueAt?.startsWith(t) && m.status === "a_valider");
    const lines = [...today.map(postLine), ...dueAds.map((a) => `• ${a.reviewDueAt!.slice(11, 16)} · Validation ${a.name} (budget ${a.totalBudget} €)`), ...dueMails.map((m) => `• ${m.reviewDueAt!.slice(11, 16)} · Validation newsletter « ${m.name} »`)];
    return { mode: "guide", actions: [], links: [{ label: "Voir le calendrier du jour", href: "/hub/calendrier?view=jour" }], reply: lines.length ? `Voici ton programme du ${frDay(t)} :\n\n${lines.join("\n")}\n\nCommence par valider les contenus marqués « À valider » : ils sont prêts.` : `Rien n'est prévu aujourd'hui (${frDay(t)}). Tu peux piocher un contenu prêt dans la bibliothèque Réseaux sociaux.` };
  }

  // 2. Contenus à valider
  if (/valider|validation|en attente/.test(s)) {
    const toValidate = posts.filter((p) => p.status === "a_valider").sort((a, b) => a.date.localeCompare(b.date));
    const mails = list("emails").filter((m) => m.status === "a_valider");
    const ads = list("ads").filter((a) => a.status === "a_valider");
    const arts = list("articles").filter((a) => a.status === "a_valider");
    return {
      mode: "guide", actions: [], links: [{ label: "Ouvrir les contenus à valider", href: "/hub/calendrier?status=a_valider" }],
      reply: `Tu as ${toValidate.length} publication(s), ${mails.length} newsletter(s), ${ads.length} campagne(s) publicitaire(s) et ${arts.length} article(s) à valider.\n\nLes plus urgentes :\n${toValidate.slice(0, 6).map((p) => `• ${frDay(p.date)} — ${PLATFORM_LABEL[p.platform]} : ${p.title}`).join("\n")}${ads.length ? `\n\nBudgets à valider : ${ads.map((a) => `${a.name} (${a.totalBudget} €)`).join(", ")}.` : ""}`,
    };
  }

  // 3. Calendrier d'un mois
  const monthIdx = MONTHS.findIndex((m) => s.includes(m));
  if (/calendrier|planning|planifi/.test(s) && monthIdx >= 0) {
    const y = Number(t.slice(0, 4)) + (monthIdx + 1 < Number(t.slice(5, 7)) ? 1 : 0);
    const key = `${y}-${String(monthIdx + 1).padStart(2, "0")}`;
    const start = key + "-01";
    const end = addDays(addDays(start, 32).slice(0, 8) + "01", -1);
    const existing = posts.filter((p) => p.date.startsWith(key));
    const plan = planPeriod(start < t ? t : start, end).filter((p) => !existing.some((e) => e.date === p.date && e.platform === p.platform));
    const by = (pl: Platform) => plan.filter((p) => p.platform === pl).length;
    const themes = [...new Set(plan.map((p) => p.pillar))];
    return {
      mode: "guide", links: [{ label: `Voir ${monthLabel(key)}`, href: `/hub/calendrier?view=mois&date=${start}` }],
      reply: existing.length >= plan.length && existing.length > 40
        ? `Le calendrier de ${monthLabel(key)} est déjà préparé : ${existing.length} contenus planifiés. Je peux néanmoins compléter les créneaux libres (${plan.length} propositions).`
        : `Je te propose ${plan.length} contenus pour ${monthLabel(key)}, aux fréquences de ta stratégie : ${by("instagram")} posts Instagram, ${by("story")} stories, ${by("tiktok")} TikTok, ${by("facebook")} Facebook et ${by("pinterest")} épingles. Piliers couverts : ${themes.join(", ")}.\n\nIls seront créés en brouillon : rien n'est publié sans ta validation.`,
      actions: plan.length ? [{ id: aid(), kind: "plan_posts", label: `Créer ${plan.length} brouillons pour ${monthLabel(key)}`, summary: plan.slice(0, 5).map((p) => `${p.date.slice(0, 10)} · ${PLATFORM_LABEL[p.platform]} · ${p.title}`).join("\n") + (plan.length > 5 ? `\n… et ${plan.length - 5} autres` : ""), payload: { start: start < t ? t : start, end } }] : [],
    };
  }

  // 4. Stratégie TikTok de la semaine
  if (/tiktok/.test(s) && /semaine|strategie|cette/.test(s)) {
    const mon = mondayOf(t);
    const week = posts.filter((p) => p.platform === "tiktok" && p.date >= mon && p.date < addDays(mon, 7) + "T99").sort((a, b) => a.date.localeCompare(b.date));
    return {
      mode: "guide", actions: [], links: [{ label: "Voir les TikTok de la semaine", href: "/hub/reseaux-sociaux?platform=tiktok" }],
      reply: `Cette semaine, ${week.length} vidéo(s) TikTok sont prévues :\n\n${week.map((p) => `• ${frDay(p.date)} 19 h — ${p.title}\n   Hook : « ${p.script?.hook ?? p.title} »`).join("\n")}\n\nLogique : un hook pédagogique, un tuto produit, un « mythe ou réalité » et un format texture (ASMR). Objectif : découverte et visites du Skin Diag.`,
    };
  }

  // 5. Performances
  if (/fonctionne|performan|meilleur|statisti|marche le mieux/.test(s)) {
    const real = list("metrics").filter((m) => m.source !== "demo");
    const ms = real.length ? real : list("metrics").filter((m) => m.source === "demo");
    const social = ["instagram", "tiktok", "facebook", "pinterest"].map((ch) => {
      const rows = ms.filter((m) => m.channel === ch);
      const reach = rows.reduce((a, m) => a + (m.values.reach ?? 0), 0);
      const eng = rows.reduce((a, m) => a + (m.values.likes ?? 0) + (m.values.comments ?? 0) + (m.values.shares ?? 0) + (m.values.saves ?? 0), 0);
      return { ch, reach, rate: reach ? (eng / reach) * 100 : 0 };
    }).sort((a, b) => b.rate - a.rate);
    return {
      mode: "guide", actions: [], links: [{ label: "Ouvrir les performances", href: "/hub/performances" }],
      reply: `${real.length ? "D'après tes données réelles" : "⚠️ Aucune donnée réelle n'est encore connectée : l'analyse ci-dessous porte sur les DONNÉES DE DÉMONSTRATION"} :\n\n${social.map((x) => `• ${PLATFORM_LABEL[x.ch as Platform]} : taux d'engagement ${x.rate.toFixed(1)} % · portée ${x.reach.toLocaleString("fr-FR")}`).join("\n")}\n\nRecommandation : renforce le format qui engage le plus (${PLATFORM_LABEL[social[0].ch as Platform]}) et transforme les carrousels les plus enregistrés en épingles Pinterest.${real.length ? "" : "\n\nPour des recommandations fiables, saisis tes statistiques ou connecte tes comptes (Mon compte → Intégrations)."}`,
    };
  }

  // 6. SEO
  if (/seo|referencement|google|mot.?cle/.test(s)) {
    const kws = list("keywords");
    const arts = list("articles");
    const unpublished = arts.filter((a) => a.status !== "publie");
    const p1 = kws.filter((k) => k.priority === 1);
    return {
      mode: "guide", actions: [], links: [{ label: "Lancer l'audit SEO", href: "/hub/seo" }, { label: "Articles", href: "/hub/seo?tab=articles" }],
      reply: `Pour améliorer ton SEO, voici les 4 priorités :\n\n1. Lance l'audit des pages (module SEO) et corrige d'abord les erreurs : titres trop longs, meta descriptions manquantes, H1.\n2. Publie les ${unpublished.length} article(s) prêts, en commençant par « ${unpublished[0]?.title ?? "—"} ».\n3. Cible les ${p1.length} mots-clés prioritaires : ${p1.slice(0, 5).map((k) => `« ${k.keyword} »`).join(", ")}…\n4. Ajoute des liens internes des articles vers les fiches produits (suggestions dans l'onglet Maillage).\n\n${kws.some((k) => k.position != null) ? "" : "Les positions ne sont pas encore mesurées : connecte Google Search Console pour suivre l'évolution réelle."}`,
    };
  }

  const product = findProduct(q);
  const canEdit = can(u.role, "content.edit");

  // 7. Newsletter
  if (/newsletter|e-?mail/.test(s)) {
    const isWinter = /hiver|froid/.test(s);
    const p = product ?? products.find((x) => x.id === (isWinter ? "sc-cr-02" : "sc-sr-03"))!;
    const name = isWinter ? "Newsletter collection hiver" : `Newsletter — ${p.name}`;
    const blocks: Omit<EmailBlock, "id">[] = isWinter
      ? [
          { type: "hero", design: tplBanner({ format: "newsletter", headline: "Cocon d'hiver", eyebrow: "Collection hiver", sub: "Le confort retrouvé, même par grand froid.", packshot: p.media.packshot }) } as Omit<EmailBlock, "id">,
          { type: "title", text: "Ta peau a froid ? On s'occupe d'elle." } as Omit<EmailBlock, "id">,
          { type: "text", text: "Tiraillements, rougeurs, zones sèches : l'hiver met la barrière cutanée à rude épreuve. Notre routine cocon du soir en 4 gestes : Silk Off pour démaquiller sans frotter, Aqua Plump sur peau humide, Velvet Barrier pour nourrir et protéger, Hydra Bloom 1 à 2 fois par semaine." } as Omit<EmailBlock, "id">,
          { type: "products", productIds: ["sc-dm-02", "sc-sr-03", "sc-cr-02", "sc-ms-01"] } as Omit<EmailBlock, "id">,
          { type: "button", text: "Découvrir le Winter Rescue Kit", href: "/kits/winter-rescue" } as Omit<EmailBlock, "id">,
          { type: "text", text: "Astuce : applique ta crème sur peau encore légèrement humide pour un confort durable." } as Omit<EmailBlock, "id">,
        ]
      : [
          { type: "hero", design: tplBanner({ format: "newsletter", headline: p.name, eyebrow: p.kind, sub: p.tagline, packshot: p.media.packshot }) } as Omit<EmailBlock, "id">,
          { type: "title", text: p.tagline } as Omit<EmailBlock, "id">,
          { type: "text", text: `${p.description}\n\nComment l'utiliser : ${p.usage}` } as Omit<EmailBlock, "id">,
          { type: "products", productIds: [p.id] } as Omit<EmailBlock, "id">,
          { type: "button", text: `Découvrir ${p.name}`, href: `/produits/${p.slug}` } as Omit<EmailBlock, "id">,
        ];
    return {
      mode: "guide", links: [{ label: "Module E-mailing", href: "/hub/emailing" }],
      reply: `J'ai préparé une newsletter « ${name} » :\n\nObjet : ${isWinter ? "Cocon d'hiver : la routine qui répare ta barrière ❄️" : `${p.name} : ${p.tagline.toLowerCase()}`}\nPréheader : ${isWinter ? "4 gestes pour une peau confortable tout l'hiver." : p.benefits.join(" · ")}\n\nElle contient un visuel d'en-tête, un texte pédagogique, les produits et un bouton vers ${isWinter ? "le Winter Rescue Kit" : "la fiche produit"}.${canEdit ? "" : "\n\n(Ton rôle ne permet pas de créer le brouillon : demande à l'équipe marketing.)"}`,
      actions: canEdit ? [{ id: aid(), kind: "create_email", label: "Créer ce brouillon de newsletter", summary: name, payload: { name, subject: isWinter ? "Cocon d'hiver : la routine qui répare ta barrière ❄️" : `${p.name} : ${p.tagline.toLowerCase()}`, preheader: isWinter ? "4 gestes pour une peau confortable tout l'hiver." : p.benefits.join(" · "), blocks, campaignId: isWinter ? "camp-hiver" : undefined } }] : [],
    };
  }

  // 8. Campagne
  if (/campagne/.test(s)) {
    const p = product ?? products.find((x) => x.id === "sc-sr-03")!;
    const start = addDays(t, 14);
    const plan: Campaign["plan"] = [
      { day: 0, platform: "instagram", format: "reel", hour: "18:00", title: `${p.name} : la révélation`, idea: `Reel de lancement : texture, geste, bénéfice « ${p.tagline} ».` },
      { day: 1, platform: "tiktok", format: "video", hour: "19:00", title: `J'ai testé ${p.name} pendant 2 semaines`, idea: "Créatrice, résultat réel, mention collaboration commerciale." },
      { day: 2, platform: "instagram", format: "carrousel", hour: "12:30", title: `${p.name} : mode d'emploi`, idea: p.usage },
      { day: 3, platform: "story", format: "story", hour: "12:00", title: `Quiz : ${p.name} est-il fait pour toi ?`, idea: "Story quiz + lien Skin Diag." },
      { day: 4, platform: "pinterest", format: "epingle", hour: "20:30", title: `Routine avec ${p.name}`, idea: "Épingle routine." },
      { day: 5, platform: "facebook", format: "post", hour: "13:00", title: `Pourquoi on aime ${p.name}`, idea: p.benefits.join(", ") },
      { day: 7, platform: "newsletter", format: "newsletter", hour: "09:00", title: `Newsletter ${p.name}`, idea: "Focus produit + conseils." },
      { day: 9, platform: "tiktok", format: "video", hour: "19:00", title: `ASMR texture ${p.name}`, idea: p.textureLabel },
      { day: 12, platform: "instagram", format: "post", hour: "18:00", title: `${p.name} en majesté`, idea: "Visuel produit." },
    ];
    const payload = {
      name: `Campagne ${p.name}`, objective: `Faire connaître ${p.name} (${p.kind.toLowerCase()}) et générer du trafic vers sa fiche.`, target: `Personnes concernées par : ${p.concerns.join(", ")}`,
      concept: `« ${p.tagline} » : montrer la texture, le geste et un bénéfice réaliste.`, message: `${p.name} — ${p.tagline}. ${p.benefits[0]}.`,
      channels: ["Instagram", "TikTok", "Pinterest", "Facebook", "Newsletter", "Meta Ads"], startDate: start, durationDays: 14, productIds: [p.id], plan,
      budget: [{ label: "Meta Ads", amount: 500 }, { label: "Micro-influence", amount: 300 }], kpis: [{ label: "Portée", target: "80 000" }, { label: "Clics fiche produit", target: "1 500" }],
      banner: { title: p.name, text: p.tagline, cta: "Découvrir" },
    };
    return {
      mode: "guide", links: [{ label: "Bibliothèque de campagnes", href: "/hub/campagnes" }],
      reply: `Voici une campagne 360° pour ${p.name} (${p.kind}) :\n\nObjectif : ${payload.objective}\nConcept : ${payload.concept}\nMessage : ${payload.message}\nCanaux : ${payload.channels.join(", ")}\nDurée : 14 jours à partir du ${frDay(start)}\nBudget prévisionnel : 800 € (à valider avant toute dépense)\n\nPlanning :\n${plan.map((x) => `• J+${x.day} · ${PLATFORM_LABEL[x.platform]} — ${x.title}`).join("\n")}`,
      actions: can(u.role, "campaign.manage") ? [{ id: aid(), kind: "create_campaign", label: "Ajouter cette campagne à la bibliothèque", summary: payload.name, payload }] : [],
    };
  }

  // 9. Publication (Instagram par défaut)
  if (/publication|post|prepare|redige|ecris|carrousel|instagram|facebook|pinterest|reel/.test(s)) {
    const p = product ?? products.find((x) => x.id === "sc-sr-02")!;
    const platform: Platform = /facebook/.test(s) ? "facebook" : /pinterest/.test(s) ? "pinterest" : "instagram";
    const tips = [p.usage.split(".")[0], ...p.tips].filter(Boolean).slice(0, 4);
    const caption = `${p.tagline} ✨\n\n${p.name}, ${p.kind.toLowerCase()} :\n${p.benefits.map((b) => `✔︎ ${b}`).join("\n")}\n\nComment l'utiliser : ${p.usage}\n\nEnregistre ce post pour ta prochaine routine 📌\nRésultats variables selon les peaux.`;
    const date = `${addDays(t, 1)}T18:00`;
    const payload = {
      title: `${p.name} — ${platform === "instagram" ? "carrousel" : "publication"} conseil`, platform, format: platform === "instagram" ? "carrousel" : platform === "pinterest" ? "epingle" : "post", date, caption,
      hashtags: ["#skinclean", "#skincare", `#${norm(p.name).replace(/[^a-z0-9]/g, "")}`, "#routineskincare"], cta: "Découvre-le sur skinclean.fr", productIds: [p.id], slides: tips,
      visual: { kind: "design", design: platform === "instagram" ? tplCarousel({ headline: `${p.name} : le mode d'emploi`, items: tips, packshot: p.media.packshot, eyebrow: p.kind }) : tplProductHero({ format: platform === "pinterest" ? "pinterest" : "facebook", headline: p.tagline, eyebrow: p.name, sub: p.benefits[0], packshot: p.media.packshot, bg: p.color.bg }) },
    };
    return {
      mode: "guide", links: [{ label: "Calendrier", href: "/hub/calendrier" }],
      reply: `Voici une publication ${PLATFORM_LABEL[platform]} pour ${p.name} :\n\n${caption}\n\n${payload.hashtags.join(" ")}\n\nVisuel : ${platform === "instagram" ? `carrousel de ${tips.length + 2} slides aux couleurs SKINCLEAN` : "visuel produit"}. Date proposée : ${frDay(date)} à 18 h.`,
      actions: canEdit ? [{ id: aid(), kind: "create_post", label: "Créer ce brouillon dans le calendrier", summary: payload.title, payload }] : [],
    };
  }

  links.push({ label: "Mon accueil", href: "/hub" });
  return {
    mode: "guide", actions: [], links,
    reply: `Je suis ton Marketing Copilot. Je lis ton calendrier, tes campagnes, tes contenus et tes statistiques pour t'aider. Essaie par exemple :\n\n• « Qu'est-ce que je publie aujourd'hui ? »\n• « Prépare une publication Instagram sur Glow Shot »\n• « Quelles publications dois-je valider ? »\n• « Propose-moi une campagne pour le sérum hydratant »\n• « Quelle est ma stratégie TikTok cette semaine ? »\n• « Prépare-moi un calendrier pour novembre »\n• « Quels contenus fonctionnent le mieux ? »\n• « Comment améliorer mon SEO ? »\n• « Prépare une newsletter pour la collection hiver »\n\nThèmes éditoriaux disponibles : ${THEME_TITLES.map((x) => x.title).join(", ")}.`,
  };
}

/* ───────── Mode IA (Claude) ───────── */
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["reply", "actions"],
  properties: {
    reply: { type: "string", description: "Réponse en français, ton complice et professionnel, texte brut avec retours à la ligne et puces « • »." },
    actions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["kind", "label", "title", "platform", "format", "date", "caption", "hashtags", "cta", "productIds", "subject", "preheader", "body"],
        properties: {
          kind: { type: "string", enum: ["create_post", "create_email"] },
          label: { type: "string" },
          title: { type: "string" },
          platform: { type: "string", enum: ["instagram", "story", "tiktok", "facebook", "pinterest", "newsletter", "blog", ""] },
          format: { type: "string", enum: ["post", "carrousel", "reel", "story", "video", "epingle", ""] },
          date: { type: "string", description: "AAAA-MM-JJTHH:mm ou vide" },
          caption: { type: "string" },
          hashtags: { type: "array", items: { type: "string" } },
          cta: { type: "string" },
          productIds: { type: "array", items: { type: "string" } },
          subject: { type: "string", description: "Objet (e-mail uniquement)" },
          preheader: { type: "string" },
          body: { type: "string", description: "Corps de l'e-mail en paragraphes (e-mail uniquement)" },
        },
      },
    },
  },
} as const;

function snapshot() {
  const t = todayYmd();
  const posts = list("posts").filter((p) => !p.library);
  const week = posts.filter((p) => p.date >= t && p.date <= addDays(t, 7) + "T99");
  const real = list("metrics").filter((m) => m.source !== "demo");
  const strategy = list("strategy").filter((s) => ["positionnement", "ligne-editoriale", "messages", "canaux"].includes(s.id)).map((s) => `${s.title} : ${s.blocks.map((b) => b.text).join(" ")}`).join("\n");
  return [
    `Date du jour : ${t}.`,
    `STRATÉGIE :\n${strategy}`,
    `PERSONAS : ${list("personas").map((p) => `${p.name} (${p.age}) — ${p.summary}`).join(" | ")}`,
    `PRODUITS (id · nom · type · accroche) :\n${products.map((p) => `${p.id} · ${p.name} · ${p.kind} · ${p.tagline}`).join("\n")}`,
    `CAMPAGNES : ${list("campaigns").map((c) => `${c.name} [${c.status}] ${c.startDate}→${c.endDate}`).join(" | ")}`,
    `CALENDRIER 7 JOURS :\n${week.map((p) => `${p.date} ${p.platform} « ${p.title} » (${p.status})`).join("\n")}`,
    `À VALIDER : ${posts.filter((p) => p.status === "a_valider").length} publications, ${list("emails").filter((m) => m.status === "a_valider").length} e-mails, ${list("ads").filter((a) => a.status === "a_valider").length} publicités.`,
    `STATISTIQUES RÉELLES : ${real.length ? JSON.stringify(real.slice(-20).map((m) => ({ c: m.channel, d: m.date, v: m.values }))) : "aucune (seules des données de démonstration existent : ne jamais les présenter comme réelles)"}.`,
  ].join("\n\n");
}

async function withClaude(u: HubUser, messages: Msg[]): Promise<CopilotReply | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const client = new Anthropic();
  const system = `Tu es SKINCLEAN Marketing Copilot, l'assistant marketing de la marque de skincare SKINCLEAN (« Your skin. Your glow. »).
Tu aides le client à exécuter sa stratégie : contenus du jour, validations, publications, campagnes, newsletters, SEO, analyse des performances de communication.
Règles impératives :
- Périmètre marketing uniquement : jamais de données de ventes, commandes, chiffre d'affaires ou fiches clients (elles relèveront du CRM).
- Aucune allégation non justifiable (pas de promesse médicale, pas de « résultats cliniques », pas de faux avis). Ajoute « Résultats variables selon les peaux » si tu parles d'efficacité.
- Ne présente jamais des données de démonstration comme réelles.
- Tu peux proposer des brouillons (actions create_post / create_email) : ils ne seront créés qu'après confirmation de l'utilisateur. Utilise uniquement des identifiants produits existants.
- Ton : tutoiement, complice, pédagogue, concis.
L'utilisateur est ${u.name} (rôle : ${u.role}).

DONNÉES DU MARKETING HUB :
${snapshot()}`;
  try {
    const res = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA as unknown as Record<string, unknown> } },
      system,
      messages: messages.slice(-12).map((m) => ({ role: m.role, content: m.content })),
    });
    if (res.stop_reason === "refusal") return { mode: "ia", actions: [], links: [], reply: "Je ne peux pas répondre à cette demande. Reformule-la autour de ta stratégie marketing." };
    const text = res.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") return null;
    const parsed = JSON.parse(text.text) as { reply: string; actions: (Record<string, unknown> & { kind: string; label: string })[] };
    const valid = new Set(products.map((p) => p.id));
    const actions: CopilotAction[] = parsed.actions
      .filter((a) => (a.kind === "create_post" && can(u.role, "content.edit")) || (a.kind === "create_email" && can(u.role, "content.edit")))
      .map((a) => {
        const productIds = (a.productIds as string[]).filter((id) => valid.has(id));
        if (a.kind === "create_email") {
          const blocks = [
            { type: "title", text: String(a.title || a.subject) },
            ...String(a.body).split(/\n{2,}/).filter(Boolean).map((t) => ({ type: "text", text: t })),
            ...(productIds.length ? [{ type: "products", productIds }] : []),
            { type: "button", text: String(a.cta || "Découvrir"), href: "/" },
          ];
          return { id: aid(), kind: "create_email" as const, label: a.label, summary: String(a.subject), payload: { name: String(a.title || a.subject), subject: a.subject, preheader: a.preheader, blocks } };
        }
        const p = products.find((x) => x.id === productIds[0]);
        const platform = (a.platform || "instagram") as Platform;
        return {
          id: aid(), kind: "create_post" as const, label: a.label, summary: String(a.title),
          payload: { title: a.title, platform, format: a.format || "post", date: a.date || `${addDays(todayYmd(), 1)}T18:00`, caption: a.caption, hashtags: a.hashtags, cta: a.cta, productIds,
            visual: { kind: "design", design: tplProductHero({ format: platform === "pinterest" ? "pinterest" : platform === "story" || platform === "tiktok" ? "story" : platform === "facebook" ? "facebook" : "instagram", headline: String(a.title), eyebrow: p?.name ?? "SKINCLEAN", packshot: p?.media.packshot, bg: p?.color.bg }) } },
        };
      });
    return { mode: "ia", reply: parsed.reply, actions, links: [] };
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return { mode: "ia", actions: [], links: [], reply: "La clé ANTHROPIC_API_KEY est invalide : je repasse en mode guidé pour la suite." };
    if (e instanceof Anthropic.RateLimitError) return { mode: "ia", actions: [], links: [], reply: "L'IA est momentanément saturée. Réessaie dans un instant." };
    console.error("[copilot]", e);
    return null; // repli sur le mode guidé
  }
}

export async function copilotChat(u: HubUser, body: { messages?: Msg[] }): Promise<CopilotReply> {
  const messages = (body.messages ?? []).filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string").slice(-20);
  const last = [...messages].reverse().find((m) => m.role === "user");
  if (!last) throw new HttpError(400, "Message vide.");
  const ai = await withClaude(u, messages);
  logActivity({ userId: u.id, userName: u.name, action: "copilot", entity: "copilot", entityId: "", label: last.content.slice(0, 120) });
  return ai ?? guided(u, last.content);
}

/** Applique une action proposée, après confirmation dans l'interface. */
export async function copilotApply(u: HubUser, body: { action?: CopilotAction }) {
  const a = body.action;
  if (!a) throw new HttpError(400, "Action manquante.");
  if (a.kind === "create_post") {
    if (!can(u.role, "content.edit")) throw new HttpError(403, "Action non autorisée.");
    const r = (await getHandler("posts/create").fn(u, a.payload)) as Post;
    return { ok: true, message: `Brouillon créé : « ${r.title} » le ${frDay(r.date)}.`, href: `/hub/calendrier?post=${r.id}` };
  }
  if (a.kind === "create_email") {
    if (!can(u.role, "content.edit")) throw new HttpError(403, "Action non autorisée.");
    const blocks = ((a.payload.blocks as Omit<EmailBlock, "id">[]) ?? []).map((b, i) => ({ ...b, id: `b${Date.now().toString(36)}${i}` })) as EmailBlock[];
    const m = create("emails", { name: String(a.payload.name), template: "Copilot", subject: String(a.payload.subject ?? ""), preheader: String(a.payload.preheader ?? ""), blocks, status: "brouillon", campaignId: a.payload.campaignId as string | undefined } as NewDoc<EmailCampaign>);
    logActivity({ userId: u.id, userName: u.name, action: "creation", entity: "email", entityId: m.id, label: `${m.name} (Copilot)` });
    return { ok: true, message: `Brouillon de newsletter créé : « ${m.name} ».`, href: `/hub/emailing?id=${m.id}` };
  }
  if (a.kind === "create_campaign") {
    if (!can(u.role, "campaign.manage")) throw new HttpError(403, "Action non autorisée.");
    const p = a.payload as unknown as Campaign;
    const c = create("campaigns", { ...p, slug: `copilot-${Date.now().toString(36)}`, status: "bibliotheque", color: "#4A6354", personaIds: [], endDate: addDays(p.startDate, (p.durationDays ?? 14) - 1), emailIds: [], adIds: [], scripts: [] } as NewDoc<Campaign>);
    logActivity({ userId: u.id, userName: u.name, action: "creation", entity: "campaign", entityId: c.id, label: `${c.name} (Copilot)` });
    return { ok: true, message: `Campagne « ${c.name} » ajoutée à la bibliothèque. Active-la pour remplir le calendrier.`, href: `/hub/campagnes/${c.id}` };
  }
  if (a.kind === "plan_posts") {
    if (!can(u.role, "content.edit")) throw new HttpError(403, "Action non autorisée.");
    const plan = planPeriod(String(a.payload.start), String(a.payload.end));
    const existing = list("posts").filter((p) => !p.library);
    let k = 0;
    for (const p of plan) {
      if (existing.some((e) => e.date === p.date && e.platform === p.platform)) continue;
      const { id: _i, createdAt: _c, updatedAt: _u, ...rest } = p;
      create("posts", { ...rest, status: "brouillon", comments: [] } as NewDoc<Post>);
      k++;
    }
    logActivity({ userId: u.id, userName: u.name, action: "planification", entity: "post", entityId: "", label: `${k} brouillons créés par le Copilot` });
    return { ok: true, message: `${k} brouillons ajoutés au calendrier.`, href: `/hub/calendrier?view=mois&date=${a.payload.start}` };
  }
  void get;
  throw new HttpError(400, "Action inconnue.");
}
