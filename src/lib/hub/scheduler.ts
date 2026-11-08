import "server-only";
import { listUsers } from "./auth";
import { claim, ensureSeeded, list, notify, update } from "./repo";
import { can } from "./permissions";
import { nowIso } from "./db";
import { ymdhm } from "./dates";
import { PLATFORM_LABEL } from "./types";
import { destinationFor, publishPost } from "./publish";
import { applyPublishOutcome } from "./handlers";

/**
 * Planificateur local (toutes les minutes, lancé par src/instrumentation.ts au démarrage du serveur).
 * Les contenus « Programmés » arrivés à leur date et heure sont publiés automatiquement :
 * vrai compte s'il est connecté, sinon compte de test local. Aucune connexion de l'utilisateur n'est nécessaire,
 * il suffit que le serveur local tourne. Si le serveur était éteint à l'heure prévue, le contenu part au redémarrage
 * (signalé « avec retard »).
 */
type G = typeof globalThis & { __hubScheduler?: NodeJS.Timeout; __hubTickRunning?: boolean };

export async function tick() {
  const g = globalThis as G;
  if (g.__hubTickRunning) return;
  g.__hubTickRunning = true;
  try {
    await ensureSeeded();
    const now = ymdhm(new Date());
    const publishers = listUsers().filter((u) => can(u.role, "content.publish")).map((u) => u.id);
    const due = list("posts").filter((x) => x.status === "programme" && !x.publishClaimed && x.date <= now && !x.library);
    for (const p of due) {
      if (!claim("posts", p.id, "publishClaimed")) continue; // déjà pris en charge par un autre serveur
      const late = (Date.now() - new Date(p.date).getTime()) / 60000 > 15;
      if (destinationFor(p.platform).mode === "aucune") {
        notify(publishers, { title: `À publier maintenant sur ${PLATFORM_LABEL[p.platform]}`, body: `${p.title} — visuel et légende prêts à copier.`, href: `/hub/calendrier?post=${p.id}`, kind: "publication" });
        continue;
      }
      const out = await publishPost(p, { paths: p.scheduledPages ?? (p.scheduledMedia ? [p.scheduledMedia] : []) }, "Publication automatique", { late });
      if (out.ok) {
        applyPublishOutcome(p, out, "Publication automatique", late);
        notify(publishers, { title: out.mode === "sandbox" ? `Publié sur ${out.label}` : "Publication effectuée", body: `${PLATFORM_LABEL[p.platform]} — ${p.title}${late ? " (avec retard)" : ""}`, href: out.url ?? `/hub/calendrier?post=${p.id}`, kind: "publication" });
      } else {
        update("posts", p.id, { status: "echec", reminderSent: true, publish: { mode: "api", at: nowIso(), by: "Publication automatique", message: out.reason } });
        notify(publishers, { title: "Échec de publication", body: `${p.title} : ${out.reason}`, href: `/hub/calendrier?post=${p.id}`, kind: "publication" });
      }
    }
  } finally {
    g.__hubTickRunning = false;
  }
}

export function startScheduler() {
  const g = globalThis as G;
  if (g.__hubScheduler) return;
  // Premier passage peu après le démarrage (rattrape les publications prévues pendant que le serveur était éteint)
  setTimeout(() => { tick().catch((e) => console.error("[hub scheduler]", e)); }, 8000);
  g.__hubScheduler = setInterval(() => { tick().catch((e) => console.error("[hub scheduler]", e)); }, 60_000);
}
