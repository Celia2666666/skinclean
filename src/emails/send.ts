import "server-only";
import { Resend } from "resend";

/**
 * Envoi d'e-mails transactionnels via Resend.
 * Sans RESEND_API_KEY → mode démonstration : rien n'est envoyé, le HTML est renvoyé pour prévisualisation.
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<{ mode: "sent" | "demo"; id?: string; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { mode: "demo" };
  const resend = new Resend(key);
  const from = process.env.EMAIL_FROM || "SKINCLEAN <hello@skinclean.example>";
  const { data, error } = await resend.emails.send({ from, to, subject, html });
  if (error) return { mode: "sent", error: error.message };
  return { mode: "sent", id: data?.id };
}

export const isEmail = (s: unknown): s is string => typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) && s.length < 200;
