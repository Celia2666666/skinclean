import { isEmail, sendEmail } from "@/emails/send";
import { addContactMessage } from "@/lib/crm/inbound";

/** Formulaire de contact (site et Glow Assistant) → e-mail au service client (CONTACT_EMAIL) + CRM local. Mode démo sans clé Resend. */
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (!isEmail(b?.email) || typeof b?.message !== "string" || b.message.length < 5) return Response.json({ error: "Merci de renseigner un e-mail et un message." }, { status: 400 });
  // Le message arrive aussi dans « Messages & contact » du CRM local
  const crm = await addContactMessage(b).catch((e) => { console.error("[contact → CRM]", e); return false; });
  const to = process.env.CONTACT_EMAIL;
  if (!to) return Response.json({ mode: "demo", crm });
  const esc = (s: string) => s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);
  const r = await sendEmail(to, `[Contact] ${esc(String(b.subject ?? "Message")).slice(0, 80)}`, `<p>De : ${esc(b.email)} (${esc(String(b.name ?? ""))})</p><p>${esc(b.message).slice(0, 5000).replace(/\n/g, "<br>")}</p>`);
  return Response.json({ mode: r.mode, crm });
}
