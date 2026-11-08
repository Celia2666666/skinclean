import { HttpError } from "@/lib/hub/auth";
import { cookies } from "next/headers";
import { requireCrmApi } from "@/lib/crm/auth";
import { crmHandler } from "@/lib/crm/actions";
import { SOURCE_COOKIE, currentSource } from "@/lib/crm/repo";
import { crmExport } from "@/lib/crm/exports";
import { crmSearch } from "@/lib/crm/search";
import { accessToken } from "@/lib/crm/auth";
import { ACCESS_COOKIE, crmOnline } from "@/lib/crm/online";

/** API du CRM — POST /api/crm/<module>/<action>, GET /api/crm/export/<jeu>. Session du Marketing Hub obligatoire. */
const json = (data: unknown, status = 200) => Response.json(data, { status });
const fail = (e: unknown) => {
  if (e instanceof HttpError) return json({ error: e.message }, e.status);
  console.error("[crm]", e);
  return json({ error: (e as Error)?.message || "Erreur interne." }, 500);
};

export async function POST(req: Request, ctx: RouteContext<"/api/crm/[...slug]">) {
  const { slug } = await ctx.params;
  const name = slug.join("/");
  try {
    if (name === "access") {
      const b = await req.json().catch(() => ({}));
      const code = process.env.CRM_ACCESS_CODE;
      if (!crmOnline() || !code || String(b.code ?? "") !== code) return json({ error: "Code incorrect." }, 401);
      (await cookies()).set(ACCESS_COOKIE, accessToken(code), { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 30 * 86400 });
      return json({ ok: true });
    }
    const u = await requireCrmApi();
    const body = await req.json().catch(() => ({}));
    if (name === "source") {
      const v = body.source === "reel" ? "reel" : "demo";
      (await cookies()).set(SOURCE_COOKIE, v, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 365 * 86400 });
      return json({ source: v });
    }
    const h = crmHandler(name);
    if (!h) return json({ error: "Action inconnue." }, 404);
    return json(await h(u, body));
  } catch (e) {
    return fail(e);
  }
}

export async function GET(req: Request, ctx: RouteContext<"/api/crm/[...slug]">) {
  const { slug } = await ctx.params;
  try {
    await requireCrmApi();
    if (slug[0] === "search") return json(crmSearch(new URL(req.url).searchParams.get("q") ?? "", await currentSource()));
    if (slug[0] !== "export" || !slug[1]) return json({ error: "Ressource inconnue." }, 404);
    const source = await currentSource();
    const csv = crmExport(slug[1], source, new URL(req.url).searchParams);
    return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="skinclean-crm-${slug[1]}-${source}.csv"` } });
  } catch (e) {
    return fail(e);
  }
}
