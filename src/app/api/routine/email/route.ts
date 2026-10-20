import { sign, siteUrl } from "@/lib/sign";
import { sanitizeRoutine } from "@/lib/server/routine";
import { routineEmail } from "@/emails/routine";
import { isEmail, sendEmail } from "@/emails/send";

/** Envoie la routine par e-mail. N'inscrit JAMAIS à la newsletter. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!isEmail(body?.email)) return Response.json({ error: "Adresse e-mail invalide" }, { status: 400 });
  const payload = sanitizeRoutine(body);
  if (!payload) return Response.json({ error: "Routine invalide" }, { status: 400 });
  const token = sign(payload);
  const firstName = typeof body.firstName === "string" ? body.firstName.slice(0, 40).replace(/[<>]/g, "") : undefined;
  const html = routineEmail(payload, token, firstName);
  const res = await sendEmail(body.email, "Ta routine SKINCLEAN personnalisée ", html);
  if (res.error) return Response.json({ error: "L'envoi a échoué, réessaie plus tard." }, { status: 502 });
  return Response.json({
    mode: res.mode,
    url: `${siteUrl()}/routine/${token}`,
    previewUrl: res.mode === "demo" ? `/api/routine/preview?token=${encodeURIComponent(token)}${firstName ? `&n=${encodeURIComponent(firstName)}` : ""}` : undefined,
  });
}
