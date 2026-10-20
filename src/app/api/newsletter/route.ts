import { sign, siteUrl } from "@/lib/sign";
import { isEmail, sendEmail } from "@/emails/send";
import { newsletterConfirmEmail } from "@/emails/newsletter";

/**
 * Inscription newsletter en double opt-in.
 * Les avantages (-20 % + 100 feuilles) ne sont accordés qu'après clic sur le lien de confirmation.
 * En production : enregistrer l'abonné (email unique) en base pour empêcher toute double attribution.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!isEmail(email)) return Response.json({ error: "Adresse e-mail invalide" }, { status: 400 });
  if (body?.consent !== true) return Response.json({ error: "Merci d'accepter de recevoir nos e-mails." }, { status: 400 });
  const token = sign({ email, kind: "newsletter", exp: Date.now() + 7 * 864e5 });
  const confirmUrl = `${siteUrl()}/newsletter/confirmation?token=${token}`;
  const res = await sendEmail(email, "Confirme ton inscription au Glow Club ", newsletterConfirmEmail(confirmUrl));
  if (res.error) return Response.json({ error: "L'envoi a échoué, réessaie plus tard." }, { status: 502 });
  return Response.json({ mode: res.mode, confirmUrl: res.mode === "demo" ? `/newsletter/confirmation?token=${token}` : undefined });
}
