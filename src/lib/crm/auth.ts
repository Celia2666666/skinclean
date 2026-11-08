import "server-only";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createHash } from "node:crypto";
import { HttpError, currentUser, hubAvailable } from "@/lib/hub/auth";
import type { HubUser } from "@/lib/hub/types";
import { ensureCrmSeeded } from "./repo";
import { ACCESS_COOKIE, crmOnline } from "./online";

/**
 * Accès au CRM.
 * - En local : compte et session du Marketing Hub (compte universel SKINCLEAN).
 * - En ligne : démo publique sur données fictives (« Visiteur »), protégée par CRM_ACCESS_CODE si défini.
 */
const VISITOR = { id: "visiteur", name: "Visiteur (démo)", email: "", role: "admin", avatarColor: "#2A4A6B", notifications: {}, createdAt: "" } as unknown as HubUser;
export const accessToken = (code: string) => createHash("sha256").update(`skinclean-crm:${code}`).digest("hex");

async function onlineAllowed() {
  const code = process.env.CRM_ACCESS_CODE;
  if (!code) return true;
  return (await cookies()).get(ACCESS_COOKIE)?.value === accessToken(code);
}

export async function requireCrmPage() {
  if (crmOnline()) {
    if (!(await onlineAllowed())) redirect("/crm/acces");
    await ensureCrmSeeded();
    return VISITOR;
  }
  if (!hubAvailable()) notFound();
  const u = await currentUser();
  if (!u) redirect("/hub/connexion?next=/crm");
  await ensureCrmSeeded();
  return u;
}

export async function requireCrmApi() {
  if (crmOnline()) {
    if (!(await onlineAllowed())) throw new HttpError(401, "Code d'accès requis.");
    await ensureCrmSeeded();
    return VISITOR;
  }
  if (!hubAvailable()) throw new HttpError(404, "CRM indisponible sur cet hébergement.");
  const u = await currentUser();
  if (!u) throw new HttpError(401, "Session expirée : reconnecte-toi.");
  await ensureCrmSeeded();
  return u;
}
