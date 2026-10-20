import { getKit, getProduct, resolveVariant } from "@/lib/catalog";
import { setDiscount, shipping, welcomeOffer } from "@/data/config";
import { sign, siteUrl, verify } from "@/lib/sign";
import { stripe, stripeEnabled } from "@/lib/server/stripe";
import { isEmail } from "@/emails/send";

/**
 * Création d'une session Stripe Checkout.
 * - Les prix sont TOUJOURS recalculés côté serveur depuis le catalogue (le client n'envoie que ids + quantités).
 * - Carte, Apple Pay et Google Pay sont proposés automatiquement par Stripe Checkout
 *   dès qu'ils sont activés dans le Dashboard (Paramètres → Moyens de paiement).
 * - Une commande n'est considérée payée qu'après vérification de la session (page de confirmation / webhook).
 */
export async function POST(req: Request) {
  if (!stripeEnabled()) return Response.json({ error: "Paiement non configuré (STRIPE_SECRET_KEY manquant)." }, { status: 503 });
  const body = await req.json().catch(() => null);
  const lines: { productId: string; variantId: string; qty: number; bundleId?: string }[] = Array.isArray(body?.lines) ? body.lines.slice(0, 40) : [];
  if (!lines.length) return Response.json({ error: "Panier vide" }, { status: 400 });
  const email = isEmail(body?.email) ? body.email : undefined;

  const items: { name: string; unit: number; qty: number; discountPct: number; isKit: boolean }[] = [];
  for (const l of lines) {
    const p = getProduct(String(l.productId));
    if (!p) continue;
    const v = resolveVariant(p, String(l.variantId));
    const qty = Math.max(1, Math.min(10, Number(l.qty) || 1));
    if (v.stock < qty) return Response.json({ error: `Stock insuffisant pour ${p.name}` }, { status: 409 });
    const kit = l.bundleId ? getKit(String(l.bundleId)) : undefined;
    let discountPct = kit ? kit.discountPercent : 0;
    if (!kit && String(l.bundleId ?? "").startsWith("set-") && setDiscount.enabled) {
      const setCount = lines.filter((x) => x.bundleId === l.bundleId).reduce((s, x) => s + (Number(x.qty) || 1), 0);
      discountPct = [...setDiscount.tiers].reverse().find((t) => setCount >= t.minItems)?.percent ?? 0;
    }
    items.push({ name: `${p.name} — ${v.size}`, unit: v.price, qty, discountPct, isKit: discountPct > 0 });
  }
  if (!items.length) return Response.json({ error: "Panier invalide" }, { status: 400 });

  // Bon de bienvenue signé par le serveur lors de la confirmation newsletter.
  let welcomePct = 0;
  if (typeof body?.voucher === "string") {
    const v = verify<{ kind: string; percent: number; exp: number; email: string }>(body.voucher);
    if (v?.kind === "welcome" && (!email || v.email === email.toLowerCase())) welcomePct = v.percent;
  }

  const lineItems = items.map((it) => {
    const unit = it.unit * (1 - it.discountPct / 100) * (1 - (welcomeOffer.excludeKits && it.isKit ? 0 : welcomePct) / 100);
    return {
      quantity: it.qty,
      price_data: { currency: "eur", unit_amount: Math.round(unit * 100), product_data: { name: it.name } },
    };
  });
  const goods = lineItems.reduce((s, l) => s + l.price_data.unit_amount * l.quantity, 0) / 100;
  const shipAmount = goods >= shipping.freeFrom ? 0 : shipping.standardPrice;

  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    customer_email: email,
    locale: "fr",
    shipping_address_collection: { allowed_countries: ["FR", "BE", "CH", "LU", "MC"] },
    shipping_options: [
      { shipping_rate_data: { type: "fixed_amount", display_name: shipping.label, fixed_amount: { amount: Math.round(shipAmount * 100), currency: "eur" } } },
    ],
    metadata: { source: "skinclean-web", welcome: welcomePct ? String(welcomePct) : "" },
    success_url: `${siteUrl()}/commande/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl()}/paiement?annule=1`,
  });
  return Response.json({ url: session.url, ref: sign({ s: session.id }) });
}
