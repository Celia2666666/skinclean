import { stripe, stripeEnabled } from "@/lib/server/stripe";

/**
 * Webhook Stripe : source de vérité du statut de paiement.
 * À brancher sur la base (Prisma) : créer la commande « payée », créditer les feuilles en « en attente »,
 * envoyer l'e-mail récapitulatif, décrémenter les stocks. Remboursement → statut « remboursée » + retrait des feuilles.
 */
export async function POST(req: Request) {
  if (!stripeEnabled() || !process.env.STRIPE_WEBHOOK_SECRET) return new Response("Webhook non configuré", { status: 503 });
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Signature manquante", { status: 400 });
  let event;
  try {
    event = stripe().webhooks.constructEvent(await req.text(), sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return new Response("Signature invalide", { status: 400 });
  }
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      console.info("[stripe] paiement confirmé", event.data.object.id);
      // CRM local (jamais sur Vercel) : la commande réelle et la fiche client sont créées, le stock décrémenté
      if (!process.env.VERCEL && event.data.object.payment_status === "paid") {
        try {
          const { ingestStripeSession } = await import("@/lib/crm/repo");
          const lines = await stripe().checkout.sessions.listLineItems(event.data.object.id, { limit: 100 });
          await ingestStripeSession(event.data.object, lines.data);
        } catch (e) {
          console.error("[stripe → CRM]", e);
        }
      }
      // TODO(base de données) : persister aussi la commande pour l'espace client — voir README « Activer les paiements ».
      break;
    case "checkout.session.async_payment_failed":
      console.warn("[stripe] paiement échoué", event.data.object.id);
      break;
    case "charge.refunded":
      console.info("[stripe] remboursement", event.data.object.id);
      break;
  }
  return Response.json({ received: true });
}
