import "server-only";
import { siteUrlPublic } from "@/lib/site";
import { HttpError, checkPassword, createUser, deleteUser, getUser, listUsers, setPassword, updateUser } from "./auth";
import { nowIso, uid } from "./db";
import { activity, create, emitEvent, get, list, logActivity, nextTicketNumber, notify, put, remove, settings, update, type CollectionName, type Collections } from "./repo";
import { can, type Permission } from "./permissions";
import { connectorFor, publishToPlatform, searchConsoleQuery, sendBroadcast, sendTestEmail } from "./connectors";
import { saveDataUrl } from "./files";
import { patchOverrides } from "./site-sync";
import { renderEmailHtml } from "./email-html";
import { addDays, todayYmd, ymdhm } from "./dates";
import { tplVideoCover, tplProductHero } from "./templates";
import type { NewDoc, AdCampaign, Article, Asset, Campaign, Comment, EmailCampaign, HubUser, Keyword, Metric, Objective, Persona, Post, RoadmapMonth, Role, Settings, StrategySection, Ticket } from "./types";
import { PLATFORM_LABEL, ROLE_LABEL } from "./types";
import type { Product, Kit } from "@/lib/types";

type Body = Record<string, unknown>;
type Handler = { perm?: Permission; fn: (u: HubUser, b: Body) => Promise<unknown> | unknown };

const must = <T>(v: T | undefined, what = "Élément"): T => {
  if (v === undefined || v === null) throw new HttpError(404, `${what} introuvable.`);
  return v;
};
const str = (v: unknown, name: string, max = 20000) => {
  if (typeof v !== "string" || !v.trim()) throw new HttpError(400, `Champ « ${name} » manquant.`);
  return v.slice(0, max);
};
const log = (u: HubUser, action: string, entity: string, entityId: string, label: string, detail?: string) =>
  logActivity({ userId: u.id, userName: u.name, action, entity, entityId, label, detail });
const usersWith = (p: Permission) => listUsers().filter((x) => can(x.role, p)).map((x) => x.id);
const comment = (u: HubUser, text: string, kind: Comment["kind"] = "commentaire"): Comment => ({ id: uid("c_"), author: u.name, role: u.role, text, at: nowIso(), kind });

/** Champs modifiables (liste blanche) par collection pour les mises à jour génériques. */
const EDITABLE: Partial<Record<CollectionName, string[]>> = {
  posts: ["title", "date", "platform", "format", "objective", "pillar", "personaId", "campaignId", "visual", "caption", "hashtags", "cta", "productIds", "script", "slides"],
  campaigns: ["name", "objective", "target", "personaIds", "concept", "message", "channels", "startDate", "endDate", "durationDays", "budget", "kpis", "productIds", "plan", "banner", "scripts", "color"],
  ads: ["name", "objective", "audience", "messages", "ads", "keywords", "negativeKeywords", "dailyBudget", "totalBudget", "startDate", "endDate", "url", "utm", "campaignId"],
  emails: ["name", "subject", "preheader", "blocks", "campaignId", "personaId", "template"],
  articles: ["title", "slug", "metaTitle", "metaDescription", "keyword", "secondary", "excerpt", "cover", "content", "productIds"],
  keywords: ["keyword", "intent", "cluster", "priority", "targetUrl", "difficulty", "volume", "position", "source"],
  objectives: ["axis", "title", "kpi", "baseline", "target", "unit", "current", "deadline", "owner", "notes", "status"],
  personas: ["name", "age", "summary", "skin", "motivations", "frustrations", "digital", "channels", "messages", "products", "quote"],
  strategy: ["title", "summary", "blocks", "table"],
  roadmap: ["theme", "objective", "campaigns", "networks", "posts", "seo", "sea", "newsletters", "budget", "kpis", "deliverables", "status", "color"],
  assets: ["name", "folder", "tags", "design"],
};
const pick = (c: CollectionName, b: Body) => {
  const allowed = EDITABLE[c] ?? [];
  return Object.fromEntries(Object.entries(b).filter(([k]) => allowed.includes(k)));
};

/* ───────── Publications ───────── */
function postOr404(id: unknown) { return must(get("posts", String(id)), "Publication"); }

function savePostImage(post: Post, dataUrl: unknown, folder: string) {
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) return undefined;
  return saveDataUrl(dataUrl, `${post.id}.png`, folder);
}

async function doPublish(u: HubUser, post: Post, imageDataUrl?: unknown) {
  const s = settings();
  if (s.publishingRules.requireValidation && !["valide", "programme"].includes(post.status))
    throw new HttpError(409, "Ce contenu doit d'abord être validé.");
  if (post.platform === "newsletter" || post.platform === "blog")
    throw new HttpError(400, post.platform === "blog" ? "Les articles se publient depuis le module SEO." : "Les newsletters s'envoient depuis le module E-mailing.");
  const img = savePostImage(post, imageDataUrl, "publications");
  const out = await publishToPlatform({
    platform: post.platform, caption: [post.caption, post.hashtags.join(" ")].filter(Boolean).join("\n\n"), title: post.title,
    link: `${siteUrlPublic()}/`, imagePublicPath: img?.url ?? post.scheduledMedia, imageBase64: img?.base64,
    videoPath: post.visual?.kind === "video" ? post.visual.src : undefined,
  });
  if (!out.ok) return { published: false, reason: out.reason, needsConnection: out.needsConnection };
  const next = update("posts", post.id, { status: "publie", publish: { mode: "api", at: nowIso(), by: u.name, externalId: out.externalId, url: out.url } })!;
  log(u, "publication", "post", post.id, post.title, `Publié via l'API ${PLATFORM_LABEL[post.platform]} (id ${out.externalId})`);
  emitEvent("post.published", { postId: post.id, platform: post.platform, externalId: out.externalId, campaignId: post.campaignId });
  return { published: true, post: next };
}

const H: Record<string, Handler> = {
  /* Compte */
  "account/profile": { fn: (u, b) => {
    const patch: Partial<HubUser> = {};
    if (typeof b.name === "string" && b.name.trim()) patch.name = b.name.trim().slice(0, 80);
    if (typeof b.title === "string") patch.title = b.title.slice(0, 120);
    if (typeof b.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)) patch.email = b.email;
    if (b.notifications && typeof b.notifications === "object") patch.notifications = b.notifications as HubUser["notifications"];
    return updateUser(u.id, patch);
  } },
  "account/password": { fn: (u, b) => {
    if (!checkPassword(u.id, String(b.current ?? ""))) throw new HttpError(400, "Mot de passe actuel incorrect.");
    const pw = String(b.next ?? "");
    if (pw.length < 10 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) throw new HttpError(400, "Le nouveau mot de passe doit contenir au moins 10 caractères, dont des lettres et des chiffres.");
    setPassword(u.id, pw);
    log(u, "securite", "user", u.id, "Mot de passe modifié");
    return { ok: true, relogin: true };
  } },
  "users/create": { perm: "users.manage", fn: (u, b) => {
    const role = String(b.role) as Role;
    if (!ROLE_LABEL[role]) throw new HttpError(400, "Rôle inconnu.");
    const pw = str(b.password, "mot de passe");
    if (pw.length < 10) throw new HttpError(400, "Mot de passe : 10 caractères minimum.");
    try {
      const nu = createUser({ email: str(b.email, "e-mail"), name: str(b.name, "nom"), role, title: String(b.title ?? ""), password: pw });
      log(u, "utilisateur", "user", nu.id, `Création du compte ${nu.email} (${ROLE_LABEL[role]})`);
      return nu;
    } catch {
      throw new HttpError(409, "Un compte existe déjà avec cet e-mail.");
    }
  } },
  "users/update": { perm: "users.manage", fn: (u, b) => {
    const id = String(b.id);
    const role = b.role as Role | undefined;
    if (role && !ROLE_LABEL[role]) throw new HttpError(400, "Rôle inconnu.");
    if (id === u.id && role && role !== "admin") throw new HttpError(400, "Tu ne peux pas retirer ton propre rôle administrateur.");
    const r = updateUser(id, { ...(role ? { role } : {}), ...(typeof b.title === "string" ? { title: b.title } : {}) });
    log(u, "utilisateur", "user", id, `Rôle mis à jour : ${role ? ROLE_LABEL[role] : "—"}`);
    return r;
  } },
  "users/reset-password": { perm: "users.manage", fn: (u, b) => {
    const pw = str(b.password, "mot de passe");
    if (pw.length < 10) throw new HttpError(400, "Mot de passe : 10 caractères minimum.");
    setPassword(String(b.id), pw);
    log(u, "securite", "user", String(b.id), "Mot de passe réinitialisé par un administrateur");
    return { ok: true };
  } },
  "users/delete": { perm: "users.manage", fn: (u, b) => {
    if (String(b.id) === u.id) throw new HttpError(400, "Tu ne peux pas supprimer ton propre compte.");
    const t = must(getUser(String(b.id)), "Utilisateur");
    deleteUser(t.id);
    log(u, "utilisateur", "user", t.id, `Suppression du compte ${t.email}`);
    return { ok: true };
  } },

  /* Publications */
  "posts/create": { perm: "content.edit", fn: (u, b) => {
    const p = create("posts", {
      title: str(b.title, "titre", 200), date: String(b.date ?? `${todayYmd()}T18:00`), platform: (b.platform as Post["platform"]) ?? "instagram",
      format: (b.format as Post["format"]) ?? "post", objective: String(b.objective ?? "Engagement"), pillar: String(b.pillar ?? "Skin School"),
      personaId: b.personaId as string | undefined, campaignId: b.campaignId as string | undefined, caption: String(b.caption ?? ""), hashtags: (b.hashtags as string[]) ?? [],
      cta: String(b.cta ?? ""), productIds: (b.productIds as string[]) ?? [], status: "brouillon", comments: [], visual: b.visual as Post["visual"], script: b.script as Post["script"], slides: b.slides as string[] | undefined,
    } as NewDoc<Post>);
    log(u, "creation", "post", p.id, p.title);
    return p;
  } },
  "posts/update": { perm: "content.edit", fn: (u, b) => {
    const p = postOr404(b.id);
    if (p.status === "publie") throw new HttpError(409, "Ce contenu est déjà publié sur la plateforme : duplique-le pour le modifier.");
    const patch = pick("posts", b) as Partial<Post>;
    // Toute modification d'un contenu validé le renvoie en validation
    const status: Post["status"] = ["valide", "programme"].includes(p.status) && Object.keys(patch).some((k) => k !== "date") ? "a_valider" : p.status;
    const next = update("posts", p.id, { ...patch, status })!;
    log(u, "modification", "post", p.id, next.title, status !== p.status ? "Modifié après validation : renvoyé en validation" : undefined);
    return next;
  } },
  "posts/move": { perm: "content.edit", fn: (u, b) => {
    const p = postOr404(b.id);
    if (p.status === "publie") throw new HttpError(409, "Contenu déjà publié.");
    const date = str(b.date, "date");
    const next = update("posts", p.id, { date, reminderSent: false })!;
    log(u, "deplacement", "post", p.id, p.title, `${p.date} → ${date}`);
    return next;
  } },
  "posts/postpone": { perm: "content.edit", fn: (u, b) => {
    const p = postOr404(b.id);
    const date = typeof b.date === "string" ? b.date : addDays(p.date, Number(b.days ?? 1));
    const next = update("posts", p.id, { date, reminderSent: false })!;
    log(u, "report", "post", p.id, p.title, `Reporté au ${date.replace("T", " à ")}`);
    return next;
  } },
  "posts/duplicate": { perm: "content.edit", fn: (u, b) => {
    const p = postOr404(b.id);
    const { id: _i, createdAt: _c, updatedAt: _u, publish: _p, scheduledMedia: _s, ...rest } = p;
    const copy = create("posts", { ...rest, title: `${p.title} (copie)`, status: "brouillon", comments: [], library: false, date: typeof b.date === "string" ? b.date : p.date || `${addDays(todayYmd(), 1)}T18:00` } as NewDoc<Post>);
    log(u, "duplication", "post", copy.id, copy.title);
    return copy;
  } },
  "posts/from-library": { perm: "content.edit", fn: (u, b) => {
    const p = postOr404(b.id);
    const { id: _i, createdAt: _c, updatedAt: _u, library: _l, libraryCategory: _lc, ...rest } = p;
    const copy = create("posts", { ...rest, status: "brouillon", comments: [], date: str(b.date, "date") } as NewDoc<Post>);
    log(u, "planification", "post", copy.id, copy.title, "Ajouté au calendrier depuis la bibliothèque");
    return copy;
  } },
  "posts/delete": { perm: "content.edit", fn: (u, b) => {
    const p = postOr404(b.id);
    remove("posts", p.id);
    log(u, "suppression", "post", p.id, p.title);
    return { ok: true };
  } },
  "posts/submit": { perm: "content.edit", fn: (u, b) => {
    const p = postOr404(b.id);
    const next = update("posts", p.id, { status: "a_valider", comments: b.comment ? [...p.comments, comment(u, String(b.comment))] : p.comments })!;
    log(u, "soumission", "post", p.id, p.title, "Envoyé en validation");
    notify(usersWith("content.validate").filter((x) => x !== u.id), { title: "Contenu à valider", body: p.title, href: `/hub/calendrier?post=${p.id}`, kind: "validation" });
    return next;
  } },
  "posts/validate": { perm: "content.validate", fn: (u, b) => {
    const ids = Array.isArray(b.ids) ? (b.ids as string[]) : [String(b.id)];
    const out = ids.map((id) => {
      const p = postOr404(id);
      if (["publie", "publie_manuel"].includes(p.status)) return p;
      const next = update("posts", p.id, { status: "valide", comments: [...p.comments, comment(u, String(b.comment || "Contenu validé."), "validation")] })!;
      log(u, "validation", "post", p.id, p.title, b.comment ? String(b.comment) : undefined);
      emitEvent("post.validated", { postId: p.id, by: u.id });
      return next;
    });
    notify(usersWith("content.edit").filter((x) => x !== u.id), { title: ids.length > 1 ? `${ids.length} contenus validés` : "Contenu validé", body: out[0]?.title ?? "", href: "/hub/calendrier", kind: "validation" });
    return ids.length > 1 ? out : out[0];
  } },
  "posts/request-changes": { perm: "content.validate", fn: (u, b) => {
    const p = postOr404(b.id);
    const text = str(b.comment, "commentaire", 2000);
    const next = update("posts", p.id, { status: "modifications", comments: [...p.comments, comment(u, text, "refus")] })!;
    log(u, "refus", "post", p.id, p.title, text);
    notify(usersWith("content.edit").filter((x) => x !== u.id), { title: "Modifications demandées", body: `${p.title} — ${text}`, href: `/hub/calendrier?post=${p.id}`, kind: "validation" });
    return next;
  } },
  "posts/comment": { fn: (u, b) => {
    const p = postOr404(b.id);
    return update("posts", p.id, { comments: [...p.comments, comment(u, str(b.text, "commentaire", 2000))] });
  } },
  "posts/schedule": { perm: "content.publish", fn: (u, b) => {
    const p = postOr404(b.id);
    if (settings().publishingRules.requireValidation && p.status !== "valide" && p.status !== "programme") throw new HttpError(409, "Ce contenu doit d'abord être validé.");
    const date = typeof b.date === "string" ? b.date : p.date;
    if (date < ymdhm(new Date())) throw new HttpError(400, "La date de programmation est passée.");
    const img = savePostImage(p, b.imageDataUrl, "programmes");
    const next = update("posts", p.id, { status: "programme", date, scheduledMedia: img?.url ?? p.scheduledMedia, reminderSent: false })!;
    const c = connectorFor(p.platform);
    log(u, "programmation", "post", p.id, p.title, `Programmé le ${date.replace("T", " à ")}`);
    return { post: next, automatic: !!c?.connected, message: c?.connected ? `Publication automatique via ${c.name} à l'heure prévue.` : `${c?.name ?? PLATFORM_LABEL[p.platform]} n'est pas connecté : tu recevras un rappel à l'heure prévue pour publier manuellement.` };
  } },
  "posts/unschedule": { perm: "content.publish", fn: (u, b) => {
    const p = postOr404(b.id);
    const next = update("posts", p.id, { status: "valide" })!;
    log(u, "deprogrammation", "post", p.id, p.title);
    return next;
  } },
  "posts/publish": { perm: "content.publish", fn: async (u, b) => doPublish(u, postOr404(b.id), b.imageDataUrl) },
  "posts/declare-published": { perm: "content.publish", fn: (u, b) => {
    const p = postOr404(b.id);
    if (p.status === "publie") throw new HttpError(409, "Déjà publié via l'API.");
    const url = typeof b.url === "string" && /^https:\/\//.test(b.url) ? b.url : undefined;
    const next = update("posts", p.id, { status: "publie_manuel", publish: { mode: "manuel", at: nowIso(), by: u.name, url, message: "Publication manuelle déclarée par l'utilisateur (non confirmée par la plateforme)." } })!;
    log(u, "publication_manuelle", "post", p.id, p.title, url ? `Lien : ${url}` : "Sans lien");
    emitEvent("post.published_manual", { postId: p.id, platform: p.platform, url, campaignId: p.campaignId });
    return next;
  } },

  /* Campagnes */
  "campaigns/update": { perm: "campaign.manage", fn: (u, b) => {
    const c = must(get("campaigns", String(b.id)), "Campagne");
    const patch = pick("campaigns", b) as Partial<Campaign>;
    if (patch.startDate && patch.durationDays) patch.endDate = addDays(patch.startDate, patch.durationDays - 1);
    const next = update("campaigns", c.id, patch)!;
    log(u, "modification", "campaign", c.id, c.name);
    return next;
  } },
  "campaigns/create": { perm: "campaign.manage", fn: (u, b) => {
    const start = String(b.startDate ?? addDays(todayYmd(), 7));
    const c = create("campaigns", {
      name: str(b.name, "nom", 120), slug: uid("c-"), status: "bibliotheque", color: String(b.color ?? "#4A6354"), objective: String(b.objective ?? ""), target: String(b.target ?? ""),
      personaIds: [], concept: String(b.concept ?? ""), message: String(b.message ?? ""), channels: (b.channels as string[]) ?? [], startDate: start, endDate: addDays(start, 13), durationDays: 14,
      budget: [], kpis: [], productIds: [], plan: [], emailIds: [], adIds: [], scripts: [],
    } as NewDoc<Campaign>);
    log(u, "creation", "campaign", c.id, c.name);
    return c;
  } },
  "campaigns/duplicate": { perm: "campaign.manage", fn: (u, b) => {
    const c = must(get("campaigns", String(b.id)), "Campagne");
    const { id: _i, createdAt: _c, updatedAt: _u, activatedAt: _a, activatedBy: _b, budgetValidatedAt: _bv, budgetValidatedBy: _bb, ...rest } = c;
    const copy = create("campaigns", { ...rest, name: `${c.name} (copie)`, slug: uid("c-"), status: "bibliotheque" } as NewDoc<Campaign>);
    log(u, "duplication", "campaign", copy.id, copy.name);
    return copy;
  } },
  "campaigns/validate-budget": { perm: "budget.validate", fn: (u, b) => {
    const c = must(get("campaigns", String(b.id)), "Campagne");
    const total = c.budget.reduce((s, x) => s + x.amount, 0);
    const next = update("campaigns", c.id, { budgetValidatedAt: nowIso(), budgetValidatedBy: u.name })!;
    log(u, "validation_budget", "campaign", c.id, c.name, `Budget prévisionnel validé : ${total} €`);
    emitEvent("campaign.budget_validated", { campaignId: c.id, amount: total, by: u.id });
    return next;
  } },
  "campaigns/activate": { perm: "campaign.manage", fn: (u, b) => {
    const c = must(get("campaigns", String(b.id)), "Campagne");
    const start = typeof b.startDate === "string" ? b.startDate : c.startDate < todayYmd() ? todayYmd() : c.startDate;
    const existing = list("posts").filter((p) => p.campaignId === c.id && !p.library);
    const created: Post[] = [];
    const products = c.productIds;
    for (const step of c.plan) {
      const date = `${addDays(start, step.day)}T${step.hour}`;
      if (existing.some((p) => p.title === step.title && p.date.slice(0, 10) === date.slice(0, 10))) continue;
      const visual: Post["visual"] = step.format === "video" || step.format === "reel"
        ? { kind: "design", design: tplVideoCover({ headline: step.title, packshot: undefined }) }
        : { kind: "design", design: tplProductHero({ format: step.platform === "pinterest" ? "pinterest" : step.platform === "story" ? "story" : step.platform === "facebook" ? "facebook" : "instagram", headline: step.title, eyebrow: c.name, sub: c.message }) };
      created.push(create("posts", {
        title: step.title, date, platform: step.platform, format: step.format, objective: c.objective.split(/[—.]/)[0].slice(0, 60), pillar: "Campagne",
        personaId: c.personaIds[0], campaignId: c.id, caption: `${step.idea}\n\n${c.message}`, hashtags: ["#skinclean"], cta: step.cta ?? c.banner?.cta ?? "Découvrir",
        productIds: products, status: "brouillon", comments: [], visual,
        emailId: step.platform === "newsletter" ? c.emailIds[0] : undefined,
      } as NewDoc<Post>));
    }
    const endDate = addDays(start, c.durationDays - 1);
    const next = update("campaigns", c.id, { status: start <= todayYmd() ? "active" : "planifiee", startDate: start, endDate, activatedAt: nowIso(), activatedBy: u.name })!;
    log(u, "activation", "campaign", c.id, c.name, `${created.length} actions ajoutées au calendrier à partir du ${start}`);
    emitEvent("campaign.activated", { campaignId: c.id, startDate: start, endDate, actions: created.length });
    notify(usersWith("content.edit").filter((x) => x !== u.id), { title: "Campagne activée", body: `${c.name} : ${created.length} contenus à préparer`, href: `/hub/campagnes/${c.id}`, kind: "campagne" });
    return { campaign: next, created: created.length };
  } },
  "campaigns/status": { perm: "campaign.manage", fn: (u, b) => {
    const c = must(get("campaigns", String(b.id)), "Campagne");
    const status = String(b.status) as Campaign["status"];
    if (!["en_pause", "terminee", "active", "bibliotheque", "planifiee"].includes(status)) throw new HttpError(400, "Statut inconnu.");
    const next = update("campaigns", c.id, { status })!;
    log(u, "statut", "campaign", c.id, c.name, `Statut : ${status}`);
    return next;
  } },
  "campaigns/delete": { perm: "campaign.manage", fn: (u, b) => {
    const c = must(get("campaigns", String(b.id)), "Campagne");
    remove("campaigns", c.id);
    log(u, "suppression", "campaign", c.id, c.name);
    return { ok: true };
  } },

  /* Publicités */
  "ads/create": { perm: "campaign.manage", fn: (u, b) => {
    const t = todayYmd();
    const a = create("ads", {
      name: str(b.name, "nom", 120), platform: (b.platform as AdCampaign["platform"]) ?? "meta_ads", status: "brouillon", objective: String(b.objective ?? "Trafic"),
      audience: { locations: "France", age: "18-34", gender: "Tous", interests: [] }, messages: [], ads: [{ id: uid("ad"), headline: "", text: "", cta: "En savoir plus" }],
      keywords: [], negativeKeywords: [], dailyBudget: 10, totalBudget: 300, startDate: addDays(t, 7), endDate: addDays(t, 36), url: `${siteUrlPublic()}/`,
      utm: { source: b.platform === "google_ads" ? "google" : b.platform === "tiktok_ads" ? "tiktok" : "meta", medium: b.platform === "google_ads" ? "cpc" : "paid_social", campaign: "nouvelle-campagne" },
    } as NewDoc<AdCampaign>);
    log(u, "creation", "ad", a.id, a.name);
    return a;
  } },
  "ads/update": { perm: "content.edit", fn: (u, b) => {
    const a = must(get("ads", String(b.id)), "Campagne publicitaire");
    if (a.status === "active") throw new HttpError(409, "Mets la campagne en pause avant de la modifier.");
    const patch = pick("ads", b) as Partial<AdCampaign>;
    const budgetChanged = (patch.totalBudget !== undefined && patch.totalBudget !== a.totalBudget) || (patch.dailyBudget !== undefined && patch.dailyBudget !== a.dailyBudget);
    const next = update("ads", a.id, { ...patch, ...(budgetChanged ? { budgetValidated: undefined, status: a.status === "prete" || a.status === "programmee" ? "a_valider" : a.status } : {}) })!;
    log(u, "modification", "ad", a.id, a.name, budgetChanged ? "Budget modifié : nouvelle validation nécessaire" : undefined);
    return next;
  } },
  "ads/duplicate": { perm: "campaign.manage", fn: (u, b) => {
    const a = must(get("ads", String(b.id)), "Campagne publicitaire");
    const { id: _i, createdAt: _c, updatedAt: _u, budgetValidated: _b, externalId: _e, ...rest } = a;
    const copy = create("ads", { ...rest, name: `${a.name} (copie)`, status: "brouillon" } as NewDoc<AdCampaign>);
    log(u, "duplication", "ad", copy.id, copy.name);
    return copy;
  } },
  "ads/delete": { perm: "campaign.manage", fn: (u, b) => {
    const a = must(get("ads", String(b.id)), "Campagne publicitaire");
    if (a.status === "active") throw new HttpError(409, "Mets la campagne en pause avant de la supprimer.");
    remove("ads", a.id);
    log(u, "suppression", "ad", a.id, a.name);
    return { ok: true };
  } },
  "ads/submit": { perm: "content.edit", fn: (u, b) => {
    const a = must(get("ads", String(b.id)), "Campagne publicitaire");
    const next = update("ads", a.id, { status: "a_valider" })!;
    notify(usersWith("budget.validate").filter((x) => x !== u.id), { title: "Budget publicitaire à valider", body: `${a.name} — ${a.totalBudget} €`, href: "/hub/ads", kind: "validation" });
    log(u, "soumission", "ad", a.id, a.name);
    return next;
  } },
  "ads/validate-budget": { perm: "budget.validate", fn: (u, b) => {
    const a = must(get("ads", String(b.id)), "Campagne publicitaire");
    if (Number(b.amount) !== a.totalBudget) throw new HttpError(409, "Le montant confirmé ne correspond pas au budget total de la campagne.");
    const next = update("ads", a.id, { status: "prete", budgetValidated: { by: u.name, at: nowIso(), amount: a.totalBudget } })!;
    log(u, "validation_budget", "ad", a.id, a.name, `Budget validé : ${a.totalBudget} € (${a.dailyBudget} €/jour)`);
    emitEvent("ad.budget_validated", { adId: a.id, amount: a.totalBudget, by: u.id });
    return next;
  } },
  "ads/schedule": { perm: "content.publish", fn: (u, b) => {
    const a = must(get("ads", String(b.id)), "Campagne publicitaire");
    if (!a.budgetValidated) throw new HttpError(409, "Le budget doit être validé avant toute programmation.");
    const next = update("ads", a.id, { status: "programmee" })!;
    log(u, "programmation", "ad", a.id, a.name, `Diffusion prévue du ${a.startDate} au ${a.endDate}`);
    return next;
  } },
  "ads/activate": { perm: "content.publish", fn: (u, b) => {
    const a = must(get("ads", String(b.id)), "Campagne publicitaire");
    if (!a.budgetValidated) throw new HttpError(409, "Budget non validé : aucune dépense ne peut être engagée.");
    // Aucun connecteur publicitaire n'est branché dans cette version : on ne simule pas l'activation.
    return { activated: false, needsConnection: true, reason: "Activation via API indisponible : connecte le compte publicitaire, ou exporte la campagne et active-la dans le gestionnaire de la plateforme, puis déclare-la active." };
  } },
  "ads/declare-active": { perm: "content.publish", fn: (u, b) => {
    const a = must(get("ads", String(b.id)), "Campagne publicitaire");
    if (!a.budgetValidated) throw new HttpError(409, "Budget non validé.");
    const next = update("ads", a.id, { status: "active", externalId: typeof b.externalId === "string" ? b.externalId.slice(0, 80) : a.externalId })!;
    log(u, "activation_manuelle", "ad", a.id, a.name, "Activée dans le gestionnaire de la plateforme (déclaration)");
    emitEvent("ad.activated_manual", { adId: a.id, platform: a.platform, utm: a.utm });
    return next;
  } },
  "ads/pause": { perm: "content.publish", fn: (u, b) => {
    const a = must(get("ads", String(b.id)), "Campagne publicitaire");
    const next = update("ads", a.id, { status: "en_pause" })!;
    log(u, "pause", "ad", a.id, a.name, a.status === "active" ? "Pense à la mettre aussi en pause dans le gestionnaire de la plateforme." : undefined);
    return next;
  } },

  /* E-mailing */
  "emails/create": { perm: "content.edit", fn: (u, b) => {
    const src = typeof b.fromId === "string" ? get("emails", b.fromId) : undefined;
    const m = create("emails", {
      name: str(b.name ?? src?.name, "nom", 120), template: src?.template ?? "Libre", subject: src?.subject ?? "", preheader: src?.preheader ?? "",
      blocks: src?.blocks ?? [{ id: uid("b"), type: "title", text: "Titre" }, { id: uid("b"), type: "text", text: "Ton texte ici." }, { id: uid("b"), type: "button", text: "Découvrir", href: "/" }],
      status: "brouillon", campaignId: src?.campaignId,
    } as NewDoc<EmailCampaign>);
    log(u, "creation", "email", m.id, m.name);
    return m;
  } },
  "emails/update": { perm: "content.edit", fn: (u, b) => {
    const m = must(get("emails", String(b.id)), "E-mail");
    if (m.status === "envoye") throw new HttpError(409, "E-mail déjà envoyé : duplique-le pour le réutiliser.");
    const next = update("emails", m.id, { ...(pick("emails", b) as Partial<EmailCampaign>), status: m.status === "valide" || m.status === "programme" ? "a_valider" : m.status })!;
    log(u, "modification", "email", m.id, m.name);
    return next;
  } },
  "emails/duplicate": { perm: "content.edit", fn: (u, b) => {
    const m = must(get("emails", String(b.id)), "E-mail");
    const { id: _i, createdAt: _c, updatedAt: _u, send: _s, sentAt: _sa, scheduledAt: _sc, ...rest } = m;
    const copy = create("emails", { ...rest, name: `${m.name} (copie)`, status: "brouillon" } as NewDoc<EmailCampaign>);
    log(u, "duplication", "email", copy.id, copy.name);
    return copy;
  } },
  "emails/delete": { perm: "content.edit", fn: (u, b) => {
    const m = must(get("emails", String(b.id)), "E-mail");
    remove("emails", m.id);
    log(u, "suppression", "email", m.id, m.name);
    return { ok: true };
  } },
  "emails/submit": { perm: "content.edit", fn: (u, b) => {
    const m = must(get("emails", String(b.id)), "E-mail");
    const next = update("emails", m.id, { status: "a_valider" })!;
    notify(usersWith("content.validate").filter((x) => x !== u.id), { title: "Newsletter à valider", body: m.name, href: `/hub/emailing?id=${m.id}`, kind: "validation" });
    log(u, "soumission", "email", m.id, m.name);
    return next;
  } },
  "emails/validate": { perm: "content.validate", fn: (u, b) => {
    const m = must(get("emails", String(b.id)), "E-mail");
    if (!m.subject.trim()) throw new HttpError(400, "L'objet de l'e-mail est vide.");
    const next = update("emails", m.id, { status: "valide" })!;
    log(u, "validation", "email", m.id, m.name);
    return next;
  } },
  "emails/test": { perm: "content.edit", fn: async (u, b) => {
    const m = must(get("emails", String(b.id)), "E-mail");
    const to = str(b.to, "destinataire", 200);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) throw new HttpError(400, "Adresse e-mail invalide.");
    const images = saveEmailImages(m, b.images);
    const r = await sendTestEmail(to, m.subject, renderEmailHtml(m, { baseUrl: siteUrlPublic(), images }));
    if (!r.ok) return { sent: false, reason: r.reason };
    update("emails", m.id, { send: { mode: "test", to, id: r.id, at: nowIso(), by: u.name } });
    log(u, "envoi_test", "email", m.id, m.name, `Test envoyé à ${to}`);
    return { sent: true };
  } },
  "emails/send": { perm: "content.publish", fn: async (u, b) => {
    const m = must(get("emails", String(b.id)), "E-mail");
    if (!["valide", "programme"].includes(m.status)) throw new HttpError(409, "La newsletter doit d'abord être validée.");
    const scheduledAt = typeof b.scheduledAt === "string" && b.scheduledAt ? new Date(b.scheduledAt).toISOString() : undefined;
    const images = saveEmailImages(m, b.images);
    const r = await sendBroadcast({ name: m.name, subject: m.subject, preheader: m.preheader, html: renderEmailHtml(m, { baseUrl: siteUrlPublic(), images }), scheduledAt });
    if (!r.ok) return { sent: false, reason: r.reason };
    const next = update("emails", m.id, scheduledAt ? { status: "programme", scheduledAt: b.scheduledAt as string, send: { mode: "api", id: r.id, at: nowIso(), by: u.name } } : { status: "envoye", sentAt: nowIso(), send: { mode: "api", id: r.id, at: nowIso(), by: u.name } })!;
    log(u, scheduledAt ? "programmation" : "envoi", "email", m.id, m.name, `Resend broadcast ${r.id}`);
    emitEvent(scheduledAt ? "email.scheduled" : "email.sent", { emailId: m.id, broadcastId: r.id, campaignId: m.campaignId });
    return { sent: true, email: next };
  } },
  "emails/plan": { perm: "content.publish", fn: (u, b) => {
    // Programmation interne (sans fournisseur) : la date est enregistrée et apparaît au calendrier.
    const m = must(get("emails", String(b.id)), "E-mail");
    const date = str(b.date, "date");
    const next = update("emails", m.id, { scheduledAt: date })!;
    const existing = list("posts").find((p) => p.emailId === m.id && !p.library);
    if (existing) update("posts", existing.id, { date });
    else create("posts", { title: m.name, date, platform: "newsletter", format: "newsletter", objective: "Engagement", pillar: "Communauté", caption: `Objet : ${m.subject}\nPréheader : ${m.preheader}`, hashtags: [], cta: "Ouvrir la newsletter", productIds: [], status: m.status === "valide" ? "valide" : "a_valider", comments: [], emailId: m.id } as NewDoc<Post>);
    log(u, "planification", "email", m.id, m.name, `Prévue le ${date.replace("T", " à ")}`);
    return next;
  } },

  /* SEO & articles */
  "articles/create": { perm: "seo.edit", fn: (u, b) => {
    const title = str(b.title, "titre", 200);
    const slug = slugify(String(b.slug || title));
    if (list("articles").some((a) => a.slug === slug)) throw new HttpError(409, "Un article utilise déjà cette URL.");
    const a = create("articles", { slug, title, metaTitle: title.slice(0, 60), metaDescription: "", keyword: String(b.keyword ?? ""), secondary: [], excerpt: "", content: String(b.content ?? `## Introduction\n\nTon texte ici.`), productIds: [], status: "brouillon", readingMinutes: 2, author: u.name } as NewDoc<Article>);
    log(u, "creation", "article", a.id, a.title);
    return a;
  } },
  "articles/update": { perm: "seo.edit", fn: (u, b) => {
    const a = must(get("articles", String(b.id)), "Article");
    const patch = pick("articles", b) as Partial<Article>;
    if (patch.slug) {
      patch.slug = slugify(patch.slug);
      if (list("articles").some((x) => x.slug === patch.slug && x.id !== a.id)) throw new HttpError(409, "URL déjà utilisée.");
    }
    if (patch.content) patch.readingMinutes = Math.max(2, Math.round(patch.content.split(/\s+/).length / 200));
    const next = update("articles", a.id, patch)!;
    log(u, "modification", "article", a.id, next.title);
    return next;
  } },
  "articles/submit": { perm: "seo.edit", fn: (u, b) => {
    const a = must(get("articles", String(b.id)), "Article");
    const next = update("articles", a.id, { status: "a_valider" })!;
    notify(usersWith("content.validate").filter((x) => x !== u.id), { title: "Article à valider", body: a.title, href: `/hub/seo?tab=articles&id=${a.id}`, kind: "validation" });
    return next;
  } },
  "articles/publish": { perm: "content.publish", fn: (u, b) => {
    const a = must(get("articles", String(b.id)), "Article");
    if (!a.metaDescription.trim()) throw new HttpError(400, "Ajoute une meta description avant de publier.");
    const next = update("articles", a.id, { status: "publie", publishedAt: a.publishedAt ?? nowIso() })!;
    const cal = list("posts").find((p) => p.articleId === a.id);
    if (cal) update("posts", cal.id, { status: "publie", publish: { mode: "api", at: nowIso(), by: u.name, url: `/conseils/${a.slug}`, message: "Publié sur le site SKINCLEAN" } });
    log(u, "publication", "article", a.id, a.title, `En ligne sur /conseils/${a.slug}`);
    emitEvent("article.published", { articleId: a.id, url: `/conseils/${a.slug}` });
    return next;
  } },
  "articles/unpublish": { perm: "content.publish", fn: (u, b) => {
    const a = must(get("articles", String(b.id)), "Article");
    const next = update("articles", a.id, { status: "brouillon" })!;
    log(u, "depublication", "article", a.id, a.title);
    return next;
  } },
  "articles/delete": { perm: "seo.edit", fn: (u, b) => {
    const a = must(get("articles", String(b.id)), "Article");
    remove("articles", a.id);
    log(u, "suppression", "article", a.id, a.title);
    return { ok: true };
  } },
  "keywords/create": { perm: "seo.edit", fn: (u, b) => {
    const k = create("keywords", { keyword: str(b.keyword, "mot-clé", 120), intent: (b.intent as Keyword["intent"]) ?? "informationnelle", cluster: String(b.cluster ?? "Divers"), priority: (Number(b.priority) as 1 | 2 | 3) || 2, targetUrl: String(b.targetUrl ?? "/"), difficulty: (b.difficulty as Keyword["difficulty"]) ?? "moyenne", volume: null, position: null, history: [] } as NewDoc<Keyword>);
    log(u, "creation", "keyword", k.id, k.keyword);
    return k;
  } },
  "keywords/update": { perm: "seo.edit", fn: (u, b) => {
    const k = must(get("keywords", String(b.id)), "Mot-clé");
    const patch = pick("keywords", b) as Partial<Keyword>;
    if (patch.position != null && patch.position !== k.position) {
      patch.history = [...(k.history ?? []), { date: todayYmd(), position: Number(patch.position) }];
      patch.source = "manuel";
    }
    return update("keywords", k.id, patch);
  } },
  "keywords/delete": { perm: "seo.edit", fn: (u, b) => { remove("keywords", String(b.id)); return { ok: true }; } },
  "seo/product-meta": { perm: "seo.edit", fn: (u, b) => {
    const id = str(b.productId, "produit");
    const title = String(b.seoTitle ?? "").slice(0, 120);
    const desc = String(b.seoDescription ?? "").slice(0, 320);
    patchOverrides((o) => ({ ...o, products: { ...(o.products ?? {}), [id]: { ...(o.products?.[id] ?? {}), seoTitle: title || undefined, seoDescription: desc || undefined } } }), u.name);
    log(u, "seo", "product", id, "Titre / meta description mis à jour sur le site");
    return { ok: true };
  } },
  "seo/gsc-sync": { perm: "seo.edit", fn: async (u) => {
    const end = addDays(todayYmd(), -2);
    const start = addDays(end, -27);
    const r = await searchConsoleQuery(start, end, ["query"]);
    if (!r.ok) return { synced: false, reason: r.reason };
    let n = 0;
    for (const k of list("keywords")) {
      const row = r.rows.find((x) => x.keys[0]?.toLowerCase() === k.keyword.toLowerCase());
      if (!row) continue;
      n++;
      update("keywords", k.id, { position: Math.round(row.position * 10) / 10, volume: row.impressions, source: "search_console", history: [...(k.history ?? []), { date: end, position: Math.round(row.position * 10) / 10 }] });
    }
    const totals = r.rows.reduce((s, x) => ({ clicks: s.clicks + x.clicks, impressions: s.impressions + x.impressions }), { clicks: 0, impressions: 0 });
    create("metrics", { source: "api", channel: "seo", date: end, values: { clicks: totals.clicks, impressions: totals.impressions, position: r.rows.length ? Math.round((r.rows.reduce((s, x) => s + x.position, 0) / r.rows.length) * 10) / 10 : 0 } } as NewDoc<Metric>);
    log(u, "synchronisation", "seo", "gsc", `Search Console : ${n} mots-clés mis à jour`);
    return { synced: true, updated: n, totals };
  } },

  /* Site e-commerce */
  "site/home": { perm: "site.edit", fn: (u, b) => {
    const home = b.home as NonNullable<import("@/lib/site-overrides").SiteOverrides["home"]>;
    const data = patchOverrides((o) => ({ ...o, home: { ...(o.home ?? {}), ...home } }), u.name);
    log(u, "site", "site", "home", "Accueil du site mis à jour", Object.keys(home).join(", "));
    emitEvent("site.updated", { section: "home" });
    return data;
  } },
  "site/announcements": { perm: "site.edit", fn: (u, b) => {
    const items = (b.items as string[]).map((x) => String(x).slice(0, 140)).filter(Boolean).slice(0, 10);
    const data = patchOverrides((o) => ({ ...o, announcements: items }), u.name);
    log(u, "site", "site", "announcements", "Textes promotionnels du bandeau mis à jour");
    return data;
  } },
  "site/bestsellers": { perm: "site.edit", fn: (u, b) => {
    const ids = (b.ids as string[]).slice(0, 7);
    const data = patchOverrides((o) => ({ ...o, bestsellers: ids }), u.name);
    log(u, "site", "site", "bestsellers", "Best-sellers mis à jour", ids.join(", "));
    return data;
  } },
  "site/product": { perm: "site.edit", fn: (u, b) => {
    const id = str(b.id, "produit");
    const patch = b.patch as Record<string, unknown>;
    const allowed = ["name", "kind", "tagline", "description", "benefits", "tips", "isNew", "media", "textureLabel", "hidden"];
    const clean = Object.fromEntries(Object.entries(patch).filter(([k]) => allowed.includes(k)));
    const data = patchOverrides((o) => {
      const added = o.addedProducts?.find((p) => p.id === id);
      if (added) return { ...o, addedProducts: o.addedProducts!.map((p) => (p.id === id ? { ...p, ...clean, media: { ...p.media, ...((clean.media as object) ?? {}) } } as Product : p)) };
      return { ...o, products: { ...(o.products ?? {}), [id]: { ...(o.products?.[id] ?? {}), ...clean } } };
    }, u.name);
    log(u, "site", "product", id, "Fiche produit modifiée", Object.keys(clean).join(", "));
    emitEvent("product.updated", { productId: id, fields: Object.keys(clean) });
    return data;
  } },
  "site/product-create": { perm: "site.edit", fn: (u, b) => {
    const name = str(b.name, "nom", 80);
    const price = Number(b.price);
    if (!(price > 0)) throw new HttpError(400, "Prix invalide.");
    const slug = slugify(`${name} ${b.kind ?? ""}`);
    const id = `sc-hub-${uid().slice(0, 6)}`;
    const p: Product = {
      id, slug, name, kind: String(b.kind ?? "Soin"), tagline: String(b.tagline ?? ""), type: (b.type as Product["type"]) ?? "serum", concerns: (b.concerns as Product["concerns"]) ?? [], skinTypes: (b.skinTypes as Product["skinTypes"]) ?? ["normale", "mixte", "seche", "grasse", "sensible"],
      description: String(b.description ?? ""), benefits: (b.benefits as string[]) ?? [], variants: [{ id: "std", label: "Format classique", size: String(b.size ?? "30 ml"), price, stock: Number(b.stock ?? 0) }],
      keyIngredients: [], inci: String(b.inci ?? "À compléter (liste INCI validée)."), usage: String(b.usage ?? ""), tips: [], moments: ["matin", "soir"], frequency: String(b.frequency ?? "Matin et soir"), step: (b.step as Product["step"]) ?? "serum",
      actives: [], intensity: 1, naturalOrigin: null, routineRole: "addon", isNew: true, color: { bg: "#EFEEEA", accent: "#5E7A68", liquid: "#EEF2EC" }, pack: "dropper", texture: "drops", textureLabel: String(b.textureLabel ?? ""),
      media: { packshot: typeof b.packshot === "string" ? b.packshot : undefined }, faq: [], reviews: [],
    };
    patchOverrides((o) => ({ ...o, addedProducts: [...(o.addedProducts ?? []), p] }), u.name);
    log(u, "site", "product", id, `Produit ajouté : ${name}`);
    emitEvent("product.created", { productId: id, slug });
    return p;
  } },
  "site/kit-create": { perm: "site.edit", fn: (u, b) => {
    const name = str(b.name, "nom", 80);
    const items = (b.productIds as string[]).slice(0, 6).map((productId) => ({ productId }));
    if (items.length < 2) throw new HttpError(400, "Un kit contient au moins 2 produits.");
    const k: Kit = {
      id: `kit-hub-${uid().slice(0, 6)}`, slug: slugify(name), name, season: (b.season as Kit["season"]) || undefined, group: "saison", tagline: String(b.tagline ?? ""), description: String(b.description ?? ""),
      items, discountPercent: Math.min(30, Math.max(0, Number(b.discountPercent ?? 10))), routine: (b.routine as string[]) ?? [], color: "#EFEEEA", accent: "#5E7A68",
    };
    patchOverrides((o) => ({ ...o, addedKits: [...(o.addedKits ?? []), k] }), u.name);
    log(u, "site", "kit", k.id, `Kit saisonnier ajouté : ${name}`);
    return k;
  } },

  /* Bibliothèque / Studio */
  "assets/save-design": { perm: "content.edit", fn: (u, b) => {
    const thumb = typeof b.thumbnail === "string" ? saveDataUrl(b.thumbnail, `${slugify(String(b.name ?? "visuel"))}.png`, "studio") : undefined;
    const base = { name: str(b.name, "nom", 120), kind: "design" as const, folder: String(b.folder ?? "Studio"), tags: (b.tags as string[]) ?? [], design: b.design as Asset["design"], url: thumb?.url, width: (b.design as { w: number })?.w, height: (b.design as { h: number })?.h, format: "png", source: "studio" as const };
    const existing = typeof b.id === "string" ? get("assets", b.id) : undefined;
    const a = existing ? update("assets", existing.id, base)! : create("assets", base as NewDoc<Asset>);
    log(u, existing ? "modification" : "creation", "asset", a.id, a.name);
    if (typeof b.postId === "string") {
      const p = get("posts", b.postId);
      if (p) update("posts", p.id, { visual: { kind: "design", design: a.design, assetId: a.id }, status: ["valide", "programme"].includes(p.status) ? "a_valider" : p.status });
    }
    return a;
  } },
  "assets/update": { perm: "content.edit", fn: (u, b) => update("assets", String(b.id), pick("assets", b) as Partial<Asset>) },
  "assets/delete": { perm: "content.edit", fn: (u, b) => {
    const a = must(get("assets", String(b.id)), "Média");
    remove("assets", a.id);
    log(u, "suppression", "asset", a.id, a.name);
    return { ok: true };
  } },

  /* Demandes */
  "tickets/create": { fn: (u, b) => {
    const t = create("tickets", {
      number: nextTicketNumber(), type: str(b.type, "type", 60), subject: str(b.subject, "sujet", 200), description: str(b.description, "description", 8000),
      priority: (["basse", "normale", "haute", "urgente"].includes(String(b.priority)) ? b.priority : "normale") as Ticket["priority"], status: "ouvert",
      attachments: (b.attachments as Ticket["attachments"]) ?? [], messages: [{ id: uid("m"), author: u.name, role: u.role, text: String(b.description), at: nowIso(), attachments: (b.attachments as Ticket["attachments"]) ?? [] }],
      createdBy: u.id, relatedId: typeof b.relatedId === "string" ? b.relatedId : undefined,
    } as NewDoc<Ticket>);
    log(u, "ticket", "ticket", t.id, `#${t.number} ${t.subject}`);
    notify(usersWith("tickets.manage").filter((x) => x !== u.id), { title: `Nouvelle demande #${t.number}`, body: t.subject, href: `/hub/messages?id=${t.id}`, kind: "ticket" });
    emitEvent("ticket.created", { ticketId: t.id, type: t.type, priority: t.priority });
    return t;
  } },
  "tickets/reply": { fn: (u, b) => {
    const t = must(get("tickets", String(b.id)), "Demande");
    const isTeam = can(u.role, "tickets.manage");
    const msg = { id: uid("m"), author: u.name, role: isTeam ? ("equipe" as const) : u.role, text: str(b.text, "message", 8000), at: nowIso(), attachments: (b.attachments as { name: string; url: string }[]) ?? [] };
    const next = update("tickets", t.id, { messages: [...t.messages, msg], attachments: [...t.attachments, ...((b.attachments as Ticket["attachments"]) ?? [])], status: isTeam ? (t.status === "ouvert" ? "en_cours" : t.status) : t.status === "en_attente" || t.status === "resolu" ? "en_cours" : t.status })!;
    const owner = t.createdBy !== "equipe" ? [t.createdBy] : listUsers().filter((x) => x.role === "validateur").map((x) => x.id);
    notify((isTeam ? owner : usersWith("tickets.manage")).filter((x) => x !== u.id), { title: `Réponse sur la demande #${t.number}`, body: msg.text.slice(0, 120), href: `/hub/messages?id=${t.id}`, kind: "ticket" });
    return next;
  } },
  "tickets/status": { fn: (u, b) => {
    const t = must(get("tickets", String(b.id)), "Demande");
    const status = String(b.status) as Ticket["status"];
    if (!["ouvert", "en_cours", "en_attente", "resolu", "ferme"].includes(status)) throw new HttpError(400, "Statut inconnu.");
    if (!can(u.role, "tickets.manage") && !["resolu", "ferme", "ouvert"].includes(status)) throw new HttpError(403, "Seule l'équipe peut changer ce statut.");
    const next = update("tickets", t.id, { status, ...(typeof b.priority === "string" && can(u.role, "tickets.manage") ? { priority: b.priority as Ticket["priority"] } : {}) })!;
    log(u, "ticket", "ticket", t.id, `#${t.number} → ${status}`);
    return next;
  } },

  /* Stratégie & pilotage */
  "strategy/update": { perm: "strategy.edit", fn: (u, b) => { const s = update("strategy", String(b.id), pick("strategy", b) as Partial<StrategySection>); log(u, "strategie", "strategy", String(b.id), s?.title ?? ""); return s; } },
  "personas/update": { perm: "strategy.edit", fn: (u, b) => { const p = update("personas", String(b.id), pick("personas", b) as Partial<Persona>); log(u, "strategie", "persona", String(b.id), p?.name ?? ""); return p; } },
  "objectives/create": { perm: "strategy.edit", fn: (u, b) => {
    const o = create("objectives", { axis: String(b.axis ?? "Notoriété"), title: str(b.title, "intitulé", 200), kpi: String(b.kpi ?? ""), baseline: String(b.baseline ?? "À mesurer"), target: Number(b.target ?? 0), unit: String(b.unit ?? ""), current: null, deadline: String(b.deadline ?? addDays(todayYmd(), 90)), owner: String(b.owner ?? u.name), status: "en_cours" } as NewDoc<Objective>);
    log(u, "strategie", "objective", o.id, o.title);
    return o;
  } },
  "objectives/update": { perm: "strategy.edit", fn: (u, b) => { const o = update("objectives", String(b.id), pick("objectives", b) as Partial<Objective>); log(u, "strategie", "objective", String(b.id), o?.title ?? ""); return o; } },
  "objectives/delete": { perm: "strategy.edit", fn: (u, b) => { remove("objectives", String(b.id)); log(u, "suppression", "objective", String(b.id), "Objectif supprimé"); return { ok: true }; } },
  "roadmap/update": { perm: "strategy.edit", fn: (u, b) => { const r = update("roadmap", String(b.id), pick("roadmap", b) as Partial<RoadmapMonth>); log(u, "strategie", "roadmap", String(b.id), r?.theme ?? ""); return r; } },
  "settings/update": { perm: "settings.manage", fn: (u, b) => {
    const cur = settings();
    const next = { ...cur, ...(b.frequencies ? { frequencies: b.frequencies as Settings["frequencies"] } : {}), ...(b.publishingRules ? { publishingRules: b.publishingRules as Settings["publishingRules"] } : {}) };
    put("settings", { id: "main", ...next });
    log(u, "parametres", "settings", "main", "Paramètres mis à jour");
    return next;
  } },
  "notifications/read": { fn: (u, b) => {
    const all = list("notifications").filter((n) => n.userId === u.id && !n.read && (b.all || n.id === b.id));
    all.forEach((n) => update("notifications", n.id, { read: true }));
    return { ok: true, count: all.length };
  } },
  "metrics/create": { perm: "content.edit", fn: (u, b) => {
    const values = Object.fromEntries(Object.entries((b.values as Record<string, unknown>) ?? {}).map(([k, v]) => [k, Number(v)]).filter(([, v]) => Number.isFinite(v as number)));
    if (!Object.keys(values).length) throw new HttpError(400, "Aucune valeur saisie.");
    const m = create("metrics", { source: "manuel", channel: str(b.channel, "canal", 40), date: String(b.date ?? todayYmd()), postId: b.postId as string | undefined, adId: b.adId as string | undefined, emailId: b.emailId as string | undefined, values } as NewDoc<Metric>);
    log(u, "statistiques", "metric", m.id, `Statistiques saisies (${m.channel})`);
    return m;
  } },
  "metrics/delete": { perm: "content.edit", fn: (u, b) => {
    const m = must(get("metrics", String(b.id)), "Mesure");
    if (m.source === "demo") throw new HttpError(400, "Les données de démonstration ne se modifient pas.");
    remove("metrics", m.id);
    return { ok: true };
  } },
  "activity/list": { fn: (_u, b) => activity({ limit: Number(b.limit ?? 100), actions: b.actions as string[] | undefined, entityId: b.entityId as string | undefined }) },
};

function saveEmailImages(m: EmailCampaign, images: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!images || typeof images !== "object") return out;
  for (const [blockId, dataUrl] of Object.entries(images as Record<string, string>)) {
    if (!m.blocks.some((x) => x.id === blockId) || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) continue;
    out[blockId] = saveDataUrl(dataUrl, `${m.id}-${blockId}.png`, "emails").url;
  }
  return out;
}

export const slugify = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

export function getHandler(name: string) { return H[name]; }
export type HandlerName = keyof typeof H;
export const _collections = {} as Collections;
