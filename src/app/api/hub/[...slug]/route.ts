import { cookies } from "next/headers";
import { HttpError, SESSION_COOKIE, login, logout, requireApiUser } from "@/lib/hub/auth";
import { ensureSeeded, events, get, list, logActivity } from "@/lib/hub/repo";
import { getHandler } from "@/lib/hub/handlers";
import { saveBuffer, MAX_UPLOAD } from "@/lib/hub/files";
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
  try {
    await ensureSeeded();
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
  try {
    await ensureSeeded();
    const u = await requireApiUser();
    if (name === "me") return json({ user: u });
    if (name === "notifications") return json(list("notifications").filter((n) => n.userId === u.id).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 50));
    if (name === "seo/images") return json(await imageAudit());
    if (name === "ads/export") {
      const a = get("ads", url.searchParams.get("id") ?? "");
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
