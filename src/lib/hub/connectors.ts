import "server-only";
import { Resend } from "resend";
import { siteUrlPublic } from "@/lib/site";
import type { Platform } from "./types";

/**
 * Connecteurs officiels des plateformes.
 * Règle : une publication n'est marquée « publiée » que si l'API de la plateforme renvoie un identifiant.
 * Sans clés (variables d'environnement), le Hub fonctionne en mode démonstration : préparation, téléchargement,
 * copie des textes et déclaration manuelle de publication (statut distinct).
 */

export interface ConnectorInfo {
  id: string; name: string; scope: string; connected: boolean; env: string[]; capability: string; limits?: string;
}

const has = (...k: string[]) => k.every((x) => !!process.env[x]);
export const isPublicSite = () => !/localhost|127\.0\.0\.1/.test(siteUrlPublic());

export function connectors(): ConnectorInfo[] {
  return [
    { id: "facebook", name: "Facebook (Page)", scope: "Réseaux sociaux", connected: has("META_PAGE_ID", "META_PAGE_TOKEN"), env: ["META_PAGE_ID", "META_PAGE_TOKEN"], capability: "Publication de photos avec légende sur la Page (Graph API)." },
    { id: "instagram", name: "Instagram (compte professionnel)", scope: "Réseaux sociaux", connected: has("INSTAGRAM_ACCOUNT_ID", "META_PAGE_TOKEN"), env: ["INSTAGRAM_ACCOUNT_ID", "META_PAGE_TOKEN"], capability: "Publication d'images (Content Publishing API).", limits: "Instagram télécharge l'image depuis une URL publique : le site doit être en ligne (NEXT_PUBLIC_SITE_URL)." },
    { id: "pinterest", name: "Pinterest", scope: "Réseaux sociaux", connected: has("PINTEREST_TOKEN", "PINTEREST_BOARD_ID"), env: ["PINTEREST_TOKEN", "PINTEREST_BOARD_ID"], capability: "Création d'épingles avec image, titre, description et lien (API v5)." },
    { id: "tiktok", name: "TikTok", scope: "Réseaux sociaux", connected: has("TIKTOK_ACCESS_TOKEN"), env: ["TIKTOK_ACCESS_TOKEN"], capability: "Envoi de la vidéo dans les brouillons de l'app TikTok (Content Posting API, upload inbox).", limits: "La vidéo doit être accessible depuis un domaine vérifié chez TikTok ; la publication finale se fait dans l'app." },
    { id: "resend", name: "Resend (e-mailing)", scope: "E-mailing", connected: has("RESEND_API_KEY"), env: ["RESEND_API_KEY", "EMAIL_FROM", "RESEND_SEGMENT_ID"], capability: "Envoi d'e-mails de test ; envoi et programmation de newsletters (Broadcasts) vers le segment configuré.", limits: "Les listes de contacts seront gérées par le futur CRM, synchronisé avec le segment Resend." },
    { id: "search_console", name: "Google Search Console", scope: "SEO", connected: has("GSC_ACCESS_TOKEN", "GSC_SITE_URL"), env: ["GSC_SITE_URL", "GSC_ACCESS_TOKEN"], capability: "Lecture des clics, impressions, CTR et positions par requête (Search Analytics API).", limits: "Jeton OAuth à durée limitée (scope webmasters.readonly)." },
    { id: "google_ads", name: "Google Ads", scope: "Publicité", connected: false, env: ["GOOGLE_ADS_DEVELOPER_TOKEN", "GOOGLE_ADS_CUSTOMER_ID"], capability: "Export CSV au format Google Ads Editor. Activation via API : connecteur à brancher.", limits: "L'activation passe par Google Ads Editor ou l'interface Google Ads ; le Hub enregistre la déclaration et la validation du budget." },
    { id: "meta_ads", name: "Meta Ads", scope: "Publicité", connected: false, env: ["META_ADS_ACCOUNT_ID"], capability: "Export des campagnes (audience, annonces, budget, UTM). Activation via API : connecteur à brancher." },
    { id: "tiktok_ads", name: "TikTok Ads", scope: "Publicité", connected: false, env: ["TIKTOK_ADS_ADVERTISER_ID"], capability: "Export des campagnes. Activation via API : connecteur à brancher." },
    { id: "anthropic", name: "Claude (Assistant IA)", scope: "IA", connected: has("ANTHROPIC_API_KEY"), env: ["ANTHROPIC_API_KEY"], capability: "Marketing Copilot génératif (rédaction de brouillons à partir des données du Hub).", limits: "Sans clé : assistant guidé (règles + données du Hub), indiqué comme tel." },
  ];
}

export type PublishOutcome = { ok: true; externalId: string; url?: string } | { ok: false; reason: string; needsConnection?: boolean };

const platformConnector: Partial<Record<Platform, string>> = { facebook: "facebook", instagram: "instagram", pinterest: "pinterest", tiktok: "tiktok", story: "instagram" };
export const connectorFor = (p: Platform) => connectors().find((c) => c.id === platformConnector[p]);

/** Publie via l'API officielle. `imagePublicPath` = image rendue enregistrée dans /public. */
export async function publishToPlatform(input: {
  platform: Platform; caption: string; title: string; link?: string; imagePublicPath?: string; imageBase64?: string; videoPath?: string;
}): Promise<PublishOutcome> {
  const c = connectorFor(input.platform);
  if (!c?.connected) return { ok: false, needsConnection: true, reason: `${c?.name ?? input.platform} n'est pas connecté : publication automatique impossible.` };
  const site = siteUrlPublic();
  try {
    if (input.platform === "facebook") {
      if (!input.imageBase64) return { ok: false, reason: "Visuel manquant." };
      const fd = new FormData();
      fd.append("caption", input.caption);
      fd.append("access_token", process.env.META_PAGE_TOKEN!);
      fd.append("source", new Blob([Buffer.from(input.imageBase64, "base64")], { type: "image/png" }), "visuel.png");
      const r = await fetch(`https://graph.facebook.com/v21.0/${process.env.META_PAGE_ID}/photos`, { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok || !j.id) return { ok: false, reason: j.error?.message ?? "Refus de Facebook." };
      return { ok: true, externalId: j.post_id ?? j.id, url: `https://www.facebook.com/${j.post_id ?? j.id}` };
    }
    if (input.platform === "instagram" || input.platform === "story") {
      if (!isPublicSite()) return { ok: false, reason: "Instagram doit télécharger l'image depuis une URL publique : mettez le site en ligne et renseignez NEXT_PUBLIC_SITE_URL." };
      if (!input.imagePublicPath) return { ok: false, reason: "Visuel manquant." };
      const base = `https://graph.facebook.com/v21.0/${process.env.INSTAGRAM_ACCOUNT_ID}`;
      const token = process.env.META_PAGE_TOKEN!;
      const params = new URLSearchParams({ image_url: `${site}${input.imagePublicPath}`, access_token: token });
      if (input.platform === "story") params.set("media_type", "STORIES");
      else params.set("caption", input.caption);
      const c1 = await (await fetch(`${base}/media`, { method: "POST", body: params })).json();
      if (!c1.id) return { ok: false, reason: c1.error?.message ?? "Création du média refusée par Instagram." };
      const c2 = await (await fetch(`${base}/media_publish`, { method: "POST", body: new URLSearchParams({ creation_id: c1.id, access_token: token }) })).json();
      if (!c2.id) return { ok: false, reason: c2.error?.message ?? "Publication refusée par Instagram." };
      return { ok: true, externalId: c2.id };
    }
    if (input.platform === "pinterest") {
      if (!input.imageBase64) return { ok: false, reason: "Visuel manquant." };
      const r = await fetch("https://api.pinterest.com/v5/pins", {
        method: "POST",
        headers: { authorization: `Bearer ${process.env.PINTEREST_TOKEN}`, "content-type": "application/json" },
        body: JSON.stringify({ board_id: process.env.PINTEREST_BOARD_ID, title: input.title.slice(0, 100), description: input.caption.slice(0, 500), link: input.link, media_source: { source_type: "image_base64", content_type: "image/png", data: input.imageBase64 } }),
      });
      const j = await r.json();
      if (!r.ok || !j.id) return { ok: false, reason: j.message ?? "Refus de Pinterest." };
      return { ok: true, externalId: j.id, url: `https://www.pinterest.com/pin/${j.id}/` };
    }
    if (input.platform === "tiktok") {
      if (!isPublicSite() || !input.videoPath) return { ok: false, reason: "TikTok récupère la vidéo depuis un domaine public vérifié : mettez le site en ligne et vérifiez le domaine chez TikTok." };
      const r = await fetch("https://open.tiktokapis.com/v2/post/publish/inbox/video/init/", {
        method: "POST",
        headers: { authorization: `Bearer ${process.env.TIKTOK_ACCESS_TOKEN}`, "content-type": "application/json; charset=UTF-8" },
        body: JSON.stringify({ source_info: { source: "PULL_FROM_URL", video_url: `${site}${input.videoPath}` } }),
      });
      const j = await r.json();
      if (!r.ok || !j.data?.publish_id) return { ok: false, reason: j.error?.message ?? "Refus de TikTok." };
      return { ok: true, externalId: j.data.publish_id, url: undefined };
    }
    return { ok: false, reason: "Plateforme non prise en charge." };
  } catch (e) {
    return { ok: false, reason: `Plateforme injoignable : ${(e as Error).message}` };
  }
}

/* ───────── E-mailing (Resend) ───────── */
export async function sendTestEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) return { ok: false as const, reason: "Resend n'est pas configuré (RESEND_API_KEY)." };
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({ from: process.env.EMAIL_FROM || "SKINCLEAN <hello@skinclean.example>", to, subject: `[TEST] ${subject}`, html });
  if (error) return { ok: false as const, reason: error.message };
  return { ok: true as const, id: data?.id ?? "" };
}

export async function sendBroadcast(input: { name: string; subject: string; preheader: string; html: string; scheduledAt?: string }) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_SEGMENT_ID)
    return { ok: false as const, reason: "Envoi impossible : configure RESEND_API_KEY et RESEND_SEGMENT_ID (segment de contacts alimenté par le futur CRM)." };
  const resend = new Resend(process.env.RESEND_API_KEY);
  const created = await resend.broadcasts.create({
    segmentId: process.env.RESEND_SEGMENT_ID, from: process.env.EMAIL_FROM || "SKINCLEAN <hello@skinclean.example>",
    subject: input.subject, previewText: input.preheader, html: input.html, name: input.name,
  });
  if (created.error || !created.data) return { ok: false as const, reason: created.error?.message ?? "Création refusée par Resend." };
  const sent = await resend.broadcasts.send(created.data.id, input.scheduledAt ? { scheduledAt: input.scheduledAt } : undefined);
  if (sent.error) return { ok: false as const, reason: sent.error.message };
  return { ok: true as const, id: created.data.id };
}

/* ───────── Google Search Console ───────── */
export async function searchConsoleQuery(startDate: string, endDate: string, dimensions: string[] = ["query"]) {
  if (!process.env.GSC_ACCESS_TOKEN || !process.env.GSC_SITE_URL) return { ok: false as const, reason: "Search Console non connectée." };
  const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(process.env.GSC_SITE_URL)}/searchAnalytics/query`, {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.GSC_ACCESS_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({ startDate, endDate, dimensions, rowLimit: 500 }),
  });
  const j = await r.json();
  if (!r.ok) return { ok: false as const, reason: j.error?.message ?? "Erreur Search Console." };
  return { ok: true as const, rows: (j.rows ?? []) as { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[] };
}
