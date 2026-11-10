import { cookies } from "next/headers";
import { HttpError, SESSION_COOKIE, createResetToken, hubAvailable, login, logout, passwordProblem, requireApiUser, resetPasswordWithToken } from "@/lib/hub/auth";
import { rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DATA_DIR } from "@/lib/hub/db";
import { sendEmail } from "@/emails/send";
import { ensureSeeded, events, get, list, logActivity } from "@/lib/hub/repo";
import { getHandler } from "@/lib/hub/handlers";
import { saveBuffer, MAX_UPLOAD, readOnlineMedia } from "@/lib/hub/files";
import { hubOnline, ONLINE_NOTICE } from "@/lib/hub/online";
import { create } from "@/lib/hub/repo";
import type { NewDoc, Asset } from "@/lib/hub/types";
import { adsCsv, reportCsv } from "@/lib/hub/exports";
import { runSeoAudit, imageAudit, optimizeImage } from "@/lib/hub/seo-audit";
import { copilotChat, copilotApply } from "@/lib/hub/copilot";

/**
 * API du Marketing Hub — un seul point d'entrée : /api/hub/<module>/<action>.
 * Chaque action vérifie la session et la permission du rôle côté serveur.
 */

const json = (data: unknown, status = 200) => Response.json(data, { status });
const fail = (e: unknown) => {
  if (e instanceof HttpError) return json({ error: e.message }, e.status);
  console.error("[hub]", e);
  return json({ error: (e as Error)?.message || "Erreur interne." }, 500);
};

// Limitation simple des tentatives de connexion (par adresse IP, en mémoire)
const attempts = new Map<string, { n: number; until: number }>();

export async function POST(req: Request, ctx: RouteContext<"/api/hub/[...slug]">) {
  const { slug } = await ctx.params;
  const name = slug.join("/");
  if (!hubAvailable()) return json({ error: "Marketing Hub indisponible sur cet hébergement." }, 404);
  try {
    await ensureSeeded();
    // En ligne (démo) : session automatique, aucune connexion ni réinitialisation de mot de passe
    if (hubOnline() && name.startsWith("auth/")) {
      if (name === "auth/login" || name === "auth/logout") return json({ ok: true, user: await requireApiUser() });
      return json({ error: ONLINE_NOTICE.account }, 400);
    }
    if (hubOnline() && name === "seo/optimize-image") return json({ error: "Version en ligne de démonstration : l'optimisation d'image (réécriture du fichier) est disponible uniquement en local." }, 400);
    if (name === "auth/login") {
      const ip = req.headers.get("x-forwarded-for") ?? "local";
      const a = attempts.get(ip);
      if (a && a.n >= 8 && a.until > Date.now()) return json({ error: "Trop de tentatives. Réessaie dans quelques minutes." }, 429);
      const b = await req.json().catch(() => ({}));
      const r = login(String(b.email ?? ""), String(b.password ?? ""));
      if (!r) {
        attempts.set(ip, { n: (a?.n ?? 0) + 1, until: Date.now() + 5 * 60_000 });
        return json({ error: "E-mail ou mot de passe incorrect." }, 401);
      }
      attempts.delete(ip);
      (await cookies()).set(SESSION_COOKIE, r.token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 14 * 86400 });
      logActivity({ userId: r.user.id, userName: r.user.name, action: "connexion", entity: "user", entityId: r.user.id, label: "Connexion" });
      return json({ user: r.user });
    }
    if (name === "auth/forgot") {
      // Réponse identique que le compte existe ou non (on ne révèle pas les e-mails enregistrés)
      const ip = req.headers.get("x-forwarded-for") ?? "local";
      const a = attempts.get(`reset:${ip}`);
      if (a && a.n >= 5 && a.until > Date.now()) return json({ error: "Trop de demandes. Réessaie dans quelques minutes." }, 429);
      attempts.set(`reset:${ip}`, { n: (a?.n ?? 0) + 1, until: Date.now() + 15 * 60_000 });
      const b = await req.json().catch(() => ({}));
      const delivery = process.env.RESEND_API_KEY ? "email" : "fichier";
      const r = createResetToken(String(b.email ?? ""));
      if (r) {
        const link = `${new URL(req.url).origin}/hub/reinitialiser?token=${r.token}`;
        const until = new Date(r.expiresAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
        if (delivery === "email") {
          await sendEmail(r.user.email, "Réinitialise ton mot de passe — Marketing Hub SKINCLEAN", `<p>Bonjour ${r.user.name},</p><p>Pour choisir un nouveau mot de passe, clique sur ce lien (valable jusqu'à ${until}, utilisable une seule fois) :</p><p><a href="${link}">${link}</a></p><p>Si tu n'es pas à l'origine de cette demande, ignore cet e-mail.</p>`);
        } else {
          const file = path.join(DATA_DIR, "lien-reinitialisation.txt");
          writeFileSync(file, `Marketing Hub SKINCLEAN — réinitialisation du mot de passe\n\nCompte : ${r.user.email}\nLien (valable jusqu'à ${until}, utilisable une seule fois) :\n${link}\n`);
          console.log(`\n[Marketing Hub] Lien de réinitialisation du mot de passe (${r.user.email}) : ${link}\n`);
        }
        logActivity({ userId: r.user.id, userName: r.user.name, action: "securite", entity: "user", entityId: r.user.id, label: "Demande de réinitialisation du mot de passe" });
      }
      return json({ ok: true, delivery, file: delivery === "fichier" ? "data/hub/lien-reinitialisation.txt" : undefined });
    }
    if (name === "auth/reset") {
      const b = await req.json().catch(() => ({}));
      const pw = String(b.password ?? "");
      const problem = passwordProblem(pw);
      if (problem) return json({ error: problem }, 400);
      const u = resetPasswordWithToken(String(b.token ?? ""), pw);
      if (!u) return json({ error: "Ce lien est invalide, expiré ou déjà utilisé. Fais une nouvelle demande." }, 400);
      rmSync(path.join(DATA_DIR, "lien-reinitialisation.txt"), { force: true }); // le lien utilisé ne reste pas sur le disque
      logActivity({ userId: u.id, userName: u.name, action: "securite", entity: "user", entityId: u.id, label: "Mot de passe réinitialisé" });
      return json({ ok: true });
    }
    if (name === "auth/logout") {
      const c = await cookies();
      const t = c.get(SESSION_COOKIE)?.value;
      if (t) logout(t);
      c.delete(SESSION_COOKIE);
      return json({ ok: true });
    }
    if (name === "upload") {
      const u = await requireApiUser();
      const fd = await req.formData();
      const folder = String(fd.get("folder") ?? "bibliotheque");
      const out: { name: string; url: string; size: number; assetId?: string }[] = [];
      for (const f of fd.getAll("files")) {
        if (!(f instanceof File)) continue;
        if (f.size > MAX_UPLOAD) throw new HttpError(413, `${f.name} dépasse 60 Mo.`);
        const saved = saveBuffer(Buffer.from(await f.arrayBuffer()), f.name, folder, f.type);
        let assetId: string | undefined;
        if (fd.get("library") === "1") {
          const kind = f.type.startsWith("video") ? "video" : "image";
          const a = create("assets", { name: f.name, kind, folder: String(fd.get("libraryFolder") ?? "Imports"), tags: [], url: saved.url, size: saved.size, format: f.type.split("/")[1], source: "upload" } as NewDoc<Asset>);
          assetId = a.id;
        }
        out.push({ name: f.name, url: saved.url, size: saved.size, assetId });
      }
      logActivity({ userId: u.id, userName: u.name, action: "import", entity: "asset", entityId: out[0]?.assetId ?? "", label: `${out.length} fichier(s) importé(s)` });
      return json({ files: out });
    }
    if (name === "seo/audit") { await requireApiUser(); return json(await runSeoAudit(new URL(req.url).origin)); }
    if (name === "seo/optimize-image") { await requireApiUser("seo.edit"); const b = await req.json(); return json(await optimizeImage(String(b.path))); }
    if (name === "copilot/chat") { const u = await requireApiUser(); return json(await copilotChat(u, await req.json())); }
    if (name === "copilot/apply") { const u = await requireApiUser(); return json(await copilotApply(u, await req.json())); }

    const h = getHandler(name);
    if (!h) return json({ error: "Action inconnue." }, 404);
    const u = await requireApiUser(h.perm);
    const body = await req.json().catch(() => ({}));
    return json(await h.fn(u, body));
  } catch (e) {
    return fail(e);
  }
}

export async function GET(req: Request, ctx: RouteContext<"/api/hub/[...slug]">) {
  const { slug } = await ctx.params;
  const name = slug.join("/");
  const url = new URL(req.url);
  if (!hubAvailable()) return json({ error: "Marketing Hub indisponible sur cet hébergement." }, 404);
  try {
    // Fichiers importés dans la version en ligne (rangés dans /tmp)
    if (name.startsWith("fichier/")) {
      const f = readOnlineMedia(name.slice("fichier/".length));
      if (!f) return json({ error: "Fichier introuvable." }, 404);
      return new Response(new Uint8Array(f.buf), { headers: { "content-type": f.type, "cache-control": "private, max-age=3600" } });
    }
    await ensureSeeded();
    const u = await requireApiUser();
    if (name === "me") return json({ user: u });
    if (name === "notifications") return json(list("notifications").filter((n) => n.userId === u.id).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 50));
    if (name === "seo/images") return json(await imageAudit());
    if (name === "ads/export") {
      const id = url.searchParams.get("id");
      // Sans identifiant : export de toutes les campagnes publicitaires, l'une après l'autre
      if (!id) return new Response(list("ads").map((x) => `# ${x.name}\n${adsCsv(x)}`).join("\n\n"), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="skinclean-campagnes-publicitaires.csv"' } });
      const a = get("ads", id);
      if (!a) throw new HttpError(404, "Campagne introuvable.");
      return new Response(adsCsv(a), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${a.id}.csv"` } });
    }
    if (name === "report") {
      const source = url.searchParams.get("source") === "demo" ? "demo" : "reel";
      return new Response(reportCsv(source), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="skinclean-performances-${source}.csv"` } });
    }
    // Boîte d'envoi d'événements pour le futur CRM (lecture seule)
    if (name === "events") return json(events(url.searchParams.get("since") ?? undefined));
    if (name === "export") {
      const col = url.searchParams.get("collection") as Parameters<typeof list>[0];
      const allowed = ["campaigns", "posts", "ads", "emails", "articles", "keywords", "objectives", "roadmap", "personas"];
      if (!allowed.includes(col)) throw new HttpError(400, "Collection non exportable.");
      return json(list(col));
    }
    return json({ error: "Ressource inconnue." }, 404);
  } catch (e) {
    return fail(e);
  }
}
