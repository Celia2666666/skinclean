import { verify } from "@/lib/sign";
import { routineEmail } from "@/emails/routine";
import type { RoutinePayload } from "@/lib/routine-link";

/** Prévisualisation de l'e-mail de routine (mode démo, sans service d'envoi configuré). */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const token = u.searchParams.get("token") ?? "";
  const payload = verify<RoutinePayload>(token);
  if (!payload) return new Response("Lien invalide", { status: 400 });
  const html = routineEmail(payload, token, u.searchParams.get("n")?.slice(0, 40).replace(/[<>]/g, "") || undefined);
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
