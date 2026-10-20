/**
 * SKINCLEAN MARKETING HUB — types partagés (client + serveur).
 * Périmètre : stratégie, création, diffusion et pilotage marketing.
 * Aucune donnée commerciale (commandes, CA, panier moyen, fiches clients) : elles relèveront du futur CRM.
 */

export type Platform = "instagram" | "story" | "tiktok" | "facebook" | "pinterest" | "newsletter" | "blog";
export type AdPlatform = "google_ads" | "meta_ads" | "tiktok_ads";

export type PostStatus =
  | "brouillon"
  | "a_valider"
  | "modifications"
  | "valide"
  | "programme"
  | "publie" // confirmé par l'API de la plateforme
  | "publie_manuel" // publié à la main, déclaré par un utilisateur
  | "echec";

export type PostFormat = "post" | "carrousel" | "reel" | "story" | "video" | "epingle" | "article" | "newsletter";

export type Role = "admin" | "marketing" | "createur" | "validateur";

export interface Comment { id: string; author: string; role: Role; text: string; at: string; kind?: "commentaire" | "validation" | "refus" }

/* ───────── Studio : modèle de visuel ───────── */
export interface TextLayer {
  id: string; type: "text"; x: number; y: number; w: number;
  text: string; size: number; weight: 400 | 500 | 600 | 700; color: string;
  align: "left" | "center" | "right"; font: "display" | "body"; upper?: boolean; lineHeight?: number; letterSpacing?: number;
  bg?: string; pad?: number; opacity?: number;
}
export interface ImageLayer {
  id: string; type: "image"; x: number; y: number; w: number; h: number; src: string;
  fit: "contain" | "cover"; radius?: number; opacity?: number; shadow?: boolean;
  filter?: { brightness?: number; contrast?: number; saturate?: number; blur?: number };
}
export interface ShapeLayer { id: string; type: "shape"; x: number; y: number; w: number; h: number; color: string; radius?: number; opacity?: number; stroke?: string }
export interface LogoLayer { id: string; type: "logo"; x: number; y: number; w: number; variant: "wordmark" | "mark" | "full"; tint?: "dark" | "light" }
export type Layer = TextLayer | ImageLayer | ShapeLayer | LogoLayer;

export interface DesignPage {
  bg: { type: "color" | "gradient" | "image"; color: string; color2?: string; src?: string; filter?: ImageLayer["filter"]; overlay?: string };
  layers: Layer[];
}
export interface Design { w: number; h: number; pages: DesignPage[] }

export interface Visual {
  kind: "design" | "image" | "video";
  design?: Design;
  src?: string; // image ou vidéo
  poster?: Design; // couverture des vidéos
  assetId?: string;
  /** Mention affichée (ex. « vidéo de démonstration à remplacer »). */
  note?: string;
}

export interface VideoScript {
  hook: string;
  scenes: { t: string; shot: string; onScreen: string; voice?: string }[];
  sound?: string;
  duration?: string;
}

export interface PublishResult { mode: "api" | "manuel"; at: string; by: string; externalId?: string; url?: string; message?: string }

export interface Post {
  id: string;
  title: string;
  date: string; // AAAA-MM-JJTHH:mm (heure de Paris)
  platform: Platform;
  format: PostFormat;
  objective: string;
  pillar: string;
  personaId?: string;
  campaignId?: string;
  visual?: Visual;
  caption: string;
  hashtags: string[];
  cta: string;
  productIds: string[];
  status: PostStatus;
  comments: Comment[];
  script?: VideoScript;
  slides?: string[];
  emailId?: string;
  articleId?: string;
  publish?: PublishResult;
  /** Visuel rendu au moment de la programmation (publication automatique à l'heure prévue). */
  scheduledMedia?: string;
  reminderSent?: boolean;
  /** Modèle de la bibliothèque (non planifié dans le calendrier). */
  library?: boolean;
  libraryCategory?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Persona {
  id: string; name: string; age: string; avatar: string; color: string; summary: string;
  skin: string[]; motivations: string[]; frustrations: string[]; digital: string[]; channels: Platform[];
  messages: string[]; products: string[]; quote: string;
}

export interface Objective {
  id: string; axis: string; title: string; kpi: string; baseline: string; target: number; unit: string;
  current: number | null; deadline: string; owner: string; notes?: string; status: "en_cours" | "atteint" | "a_risque";
}

export interface StrategySection {
  id: string; group: string; order: number; title: string; summary: string;
  blocks: { kind: "fait" | "hypothese" | "proposition" | "texte"; title?: string; text: string; source?: string }[];
  table?: { head: string[]; rows: string[][] };
}

export interface Campaign {
  id: string; name: string; slug: string; status: "bibliotheque" | "planifiee" | "active" | "terminee" | "en_pause";
  color: string; season?: string; objective: string; target: string; personaIds: string[]; concept: string; message: string;
  channels: string[]; startDate: string; endDate: string; durationDays: number;
  budget: { label: string; amount: number }[];
  kpis: { label: string; target: string }[];
  productIds: string[];
  plan: { day: number; platform: Platform; format: PostFormat; title: string; hour: string; idea: string; cta?: string }[];
  emailIds: string[]; adIds: string[]; banner?: { title: string; text: string; cta: string };
  scripts: { title: string; hook: string; scenes: string[] }[];
  activatedAt?: string; activatedBy?: string; budgetValidatedAt?: string; budgetValidatedBy?: string;
  createdAt: string; updatedAt: string;
}

export interface AdCampaign {
  id: string; name: string; platform: AdPlatform; campaignId?: string;
  status: "brouillon" | "a_valider" | "prete" | "programmee" | "active" | "en_pause" | "terminee";
  objective: string; audience: { locations: string; age: string; gender: string; interests: string[]; exclusions?: string };
  messages: string[];
  ads: { id: string; headline: string; text: string; description?: string; cta: string; visual?: Visual }[];
  keywords: { text: string; match: "exact" | "expression" | "large" }[];
  negativeKeywords: string[];
  dailyBudget: number; totalBudget: number; startDate: string; endDate: string; url: string;
  utm: { source: string; medium: string; campaign: string; content?: string; term?: string };
  budgetValidated?: { by: string; at: string; amount: number };
  reviewDueAt?: string;
  externalId?: string;
  createdAt: string; updatedAt: string;
}

export type EmailBlock =
  | { id: string; type: "hero"; image?: string; design?: Design; alt?: string }
  | { id: string; type: "title"; text: string }
  | { id: string; type: "text"; text: string }
  | { id: string; type: "button"; text: string; href: string }
  | { id: string; type: "products"; productIds: string[] }
  | { id: string; type: "image"; src: string; alt?: string }
  | { id: string; type: "divider" }
  | { id: string; type: "code"; code: string; text: string };

export interface EmailCampaign {
  id: string; name: string; template: string; subject: string; preheader: string; blocks: EmailBlock[];
  status: "brouillon" | "a_valider" | "valide" | "programme" | "envoye" | "echec";
  scheduledAt?: string; sentAt?: string; campaignId?: string; personaId?: string; reviewDueAt?: string;
  send?: { mode: "api" | "test"; to?: string; id?: string; at: string; by: string; message?: string };
  createdAt: string; updatedAt: string;
}

export interface Article {
  id: string; slug: string; title: string; metaTitle: string; metaDescription: string; keyword: string;
  secondary: string[]; excerpt: string; cover?: string; content: string; // Markdown simplifié
  productIds: string[]; status: "brouillon" | "a_valider" | "publie"; publishedAt?: string; readingMinutes: number;
  author: string; createdAt: string; updatedAt: string;
}

export interface Keyword {
  id: string; keyword: string; intent: "informationnelle" | "commerciale" | "transactionnelle" | "navigationnelle";
  cluster: string; priority: 1 | 2 | 3; targetUrl: string; difficulty: "faible" | "moyenne" | "forte";
  /** Données mesurées uniquement (Search Console connectée ou saisie manuelle). Jamais inventées. */
  volume?: number | null; position?: number | null; history?: { date: string; position: number }[]; source?: "search_console" | "manuel";
}

export interface Ticket {
  id: string; number: number; type: string; subject: string; description: string; priority: "basse" | "normale" | "haute" | "urgente";
  status: "ouvert" | "en_cours" | "en_attente" | "resolu" | "ferme";
  attachments: { name: string; url: string; size: number }[];
  messages: { id: string; author: string; role: Role | "equipe"; text: string; at: string; attachments?: { name: string; url: string }[] }[];
  createdBy: string; assignee?: string; relatedId?: string; createdAt: string; updatedAt: string;
}

export interface Asset {
  id: string; name: string; kind: "image" | "video" | "design"; folder: string; tags: string[];
  url?: string; design?: Design; width?: number; height?: number; size?: number; format?: string; source: "upload" | "site" | "studio";
  createdAt: string; updatedAt: string;
}

export interface RoadmapMonth {
  id: string; month: string; // AAAA-MM
  theme: string; objective: string; campaigns: string[]; networks: string[]; posts: number;
  seo: string[]; sea: string[]; newsletters: string[]; budget: number; kpis: string[]; deliverables: string[];
  color: string; status: "a_venir" | "en_cours" | "termine";
}

export interface Metric {
  id: string; source: "demo" | "api" | "manuel"; channel: string; date: string; // AAAA-MM-JJ
  postId?: string; adId?: string; emailId?: string; values: Record<string, number>;
}

export interface Notification { id: string; userId: string; title: string; body: string; href?: string; read: boolean; at: string; kind: string }

export interface ActivityEntry { id: string; at: string; userId: string; userName: string; action: string; entity: string; entityId: string; label: string; detail?: string }

export interface Settings {
  frequencies: Record<string, { perWeek?: number; perMonth?: number; label: string }>;
  brand: { colors: { name: string; hex: string }[]; tone: string[] };
  demoMode: boolean;
  publishingRules: { requireValidation: boolean; validatorRoles: Role[] };
}

export interface HubUser { id: string; email: string; name: string; role: Role; title?: string; avatarColor: string; notifications: Record<string, boolean>; createdAt: string; lastLoginAt?: string }

export const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: "Instagram", story: "Story Instagram", tiktok: "TikTok", facebook: "Facebook", pinterest: "Pinterest", newsletter: "Newsletter", blog: "Blog SEO",
};
export const PLATFORM_COLOR: Record<Platform, string> = {
  instagram: "#C2477A", story: "#E07B53", tiktok: "#111111", facebook: "#3B5998", pinterest: "#C8232C", newsletter: "#4A6354", blog: "#8A6D3B",
};
export const STATUS_LABEL: Record<PostStatus, string> = {
  brouillon: "Brouillon", a_valider: "À valider", modifications: "Modifications demandées", valide: "Validé", programme: "Programmé",
  publie: "Publié (confirmé)", publie_manuel: "Publié manuellement", echec: "Échec",
};
export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrateur", marketing: "Responsable marketing", createur: "Créateur de contenu", validateur: "Client validateur",
};
export const AD_PLATFORM_LABEL: Record<AdPlatform, string> = { google_ads: "Google Ads", meta_ads: "Meta Ads", tiktok_ads: "TikTok Ads" };

/** Document à créer (identifiant et dates gérés par la base). */
export type NewDoc<T> = Omit<T, "id" | "createdAt" | "updatedAt"> & { id?: string; createdAt?: string };
