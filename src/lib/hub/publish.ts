import "server-only";
import { connectorFor, publishToPlatform } from "./connectors";
import { readPublic } from "./files";
import { create, settings } from "./repo";
import { nowIso } from "./db";
import type { NewDoc, Platform, Post, SandboxPost } from "./types";
import { PLATFORM_LABEL } from "./types";
import { siteUrlPublic } from "@/lib/site";

/**
 * Publication d'un contenu :
 * 1. vrai compte connecté (API officielle) → statut « publié (confirmé) » ;
 * 2. sinon, simulation activée → le contenu apparaît sur le profil simulé du Hub (/hub/mes-comptes),
 *    statut « publié · simulé », aucune diffusion réelle ;
 * 3. sinon → publication manuelle nécessaire.
 */

export const SANDBOX_PLATFORMS: Platform[] = ["instagram", "story", "tiktok", "facebook", "pinterest"];

export type PostPublishOutcome =
  | { ok: true; mode: "api" | "sandbox"; externalId: string; url?: string; label: string }
  | { ok: false; reason: string; needsConnection?: boolean };

/** Destination utilisée pour une plateforme (pour l'afficher avant de programmer). */
export function destinationFor(platform: Platform): { mode: "api" | "sandbox" | "aucune"; label: string } {
  const c = connectorFor(platform);
  if (c?.connected) return { mode: "api", label: c.name };
  const s = settings();
  if (s.sandbox?.enabled && SANDBOX_PLATFORMS.includes(platform)) return { mode: "sandbox", label: `${PLATFORM_LABEL[platform === "story" ? "instagram" : platform]} @${s.sandbox.handle}` };
  return { mode: "aucune", label: PLATFORM_LABEL[platform] };
}

export async function publishPost(post: Post, media: { paths: string[] }, by: string, opts: { late?: boolean } = {}): Promise<PostPublishOutcome> {
  const dest = destinationFor(post.platform);
  if (dest.mode === "api") {
    let base64: string | undefined;
    try { if (media.paths[0]) base64 = readPublic(media.paths[0]).toString("base64"); } catch { /* visuel introuvable */ }
    const out = await publishToPlatform({
      platform: post.platform, caption: [post.caption, post.hashtags.join(" ")].filter(Boolean).join("\n\n"), title: post.title, link: `${siteUrlPublic()}/`,
      imagePublicPath: media.paths[0], imageBase64: base64, videoPath: post.visual?.kind === "video" ? post.visual.src : undefined,
    });
    if (!out.ok) return { ok: false, reason: out.reason, needsConnection: out.needsConnection };
    return { ok: true, mode: "api", externalId: out.externalId, url: out.url, label: dest.label };
  }
  if (dest.mode === "sandbox") {
    if (!media.paths.length && post.visual?.kind !== "video") return { ok: false, reason: "Visuel manquant : ouvre le contenu et clique sur Publier pour générer son visuel." };
    const doc = create("sandbox", {
      platform: post.platform, postId: post.id, title: post.title, caption: post.caption, hashtags: post.hashtags,
      images: media.paths, video: post.visual?.kind === "video" ? post.visual.src : undefined,
      publishedAt: nowIso(), scheduledFor: post.date, late: opts.late, by,
    } as NewDoc<SandboxPost>);
    const net = post.platform === "story" ? "instagram" : post.platform;
    return { ok: true, mode: "sandbox", externalId: doc.id, url: `/hub/mes-comptes?reseau=${net}&publication=${doc.id}`, label: dest.label };
  }
  return { ok: false, needsConnection: true, reason: `${PLATFORM_LABEL[post.platform]} n'est pas connecté et la simulation des comptes est désactivée : publication manuelle nécessaire.` };
}
