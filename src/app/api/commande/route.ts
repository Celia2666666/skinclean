import { isEmail } from "@/emails/send";
import { addSiteOrder } from "@/lib/crm/inbound";

/** Commande en paiement simulé → CRM (commandes, client) + e-mail de confirmation dans la boîte de démo du CRM. */
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (!b || !isEmail(b.email) || !Array.isArray(b.lines) || !b.lines.length) return Response.json({ error: "Commande incomplète." }, { status: 400 });
  const r = await addSiteOrder(b).catch((e) => { console.error("[commande → CRM]", e); return false as const; });
  return Response.json({ crm: !!r, ...(r || {}) });
}
