import { isEmail } from "@/emails/send";
import { addStockAlert } from "@/lib/crm/inbound";

/** « Me prévenir du retour en stock » → automatisation « Alerte retour en stock » du CRM. */
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (!isEmail(b?.email) || typeof b?.productId !== "string") return Response.json({ error: "Merci d'indiquer un e-mail et un produit." }, { status: 400 });
  try {
    const saved = await addStockAlert(b);
    return Response.json({ mode: saved ? "saved" : "demo" });
  } catch {
    return Response.json({ error: "Produit inconnu." }, { status: 400 });
  }
}
