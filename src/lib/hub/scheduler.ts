import "server-only";
import { listUsers } from "./auth";
import { connectorFor, publishToPlatform } from "./connectors";
import { readPublic } from "./files";
import { emitEvent, ensureSeeded, list, logActivity, notify, update } from "./repo";
import { can } from "./permissions";
import { nowIso } from "./db";
import { ymdhm } from "./dates";
import { PLATFORM_LABEL } from "./types";
import { siteUrlPublic } from "@/lib/site";

/**
 * Planificateur local (toutes les minutes, lancé par src/instrumentation.ts) :
 * - contenus programmés arrivés à échéance → publication via l'API si la plateforme est connectée,
 *   sinon rappel de publication manuelle (jamais de faux statut « publié ») ;
 */
type G = typeof globalThis & { __hubScheduler?: NodeJS.Timeout };

export async function tick() {
  await ensureSeeded();
  const now = ymdhm(new Date());
  const publishers = listUsers().filter((u) => can(u.role, "content.publish")).map((u) => u.id);
  for (const p of list("posts").filter((x) => x.status === "programme" && !x.reminderSent && x.date <= now)) {
    const c = connectorFor(p.platform);
    if (c?.connected) {
      let base64: string | undefined;
      try { if (p.scheduledMedia) base64 = readPublic(p.scheduledMedia).toString("base64"); } catch { /* visuel absent */ }
      const out = await publishToPlatform({ platform: p.platform, caption: [p.caption, p.hashtags.join(" ")].join("\n\n"), title: p.title, link: siteUrlPublic(), imagePublicPath: p.scheduledMedia, imageBase64: base64, videoPath: p.visual?.kind === "video" ? p.visual.src : undefined });
      if (out.ok) {
        update("posts", p.id, { status: "publie", reminderSent: true, publish: { mode: "api", at: nowIso(), by: "Programmation automatique", externalId: out.externalId, url: out.url } });
        logActivity({ userId: "system", userName: "Programmation", action: "publication", entity: "post", entityId: p.id, label: p.title, detail: `Publié automatiquement (${out.externalId})` });
        emitEvent("post.published", { postId: p.id, platform: p.platform, externalId: out.externalId });
        notify(publishers, { title: "Publication effectuée", body: `${PLATFORM_LABEL[p.platform]} — ${p.title}`, href: `/hub/calendrier?post=${p.id}`, kind: "publication" });
        continue;
      }
      update("posts", p.id, { status: "echec", reminderSent: true, publish: { mode: "api", at: nowIso(), by: "Programmation automatique", message: out.reason } });
      notify(publishers, { title: "Échec de publication", body: `${p.title} : ${out.reason}`, href: `/hub/calendrier?post=${p.id}`, kind: "publication" });
      continue;
    }
    update("posts", p.id, { reminderSent: true });
    notify(publishers, { title: `À publier maintenant sur ${PLATFORM_LABEL[p.platform]}`, body: `${p.title} — visuel et légende prêts à copier.`, href: `/hub/calendrier?post=${p.id}`, kind: "publication" });
  }
}

export function startScheduler() {
  const g = globalThis as G;
  if (g.__hubScheduler) return;
  g.__hubScheduler = setInterval(() => { tick().catch((e) => console.error("[hub scheduler]", e)); }, 60_000);
}
