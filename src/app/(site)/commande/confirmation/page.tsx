import type { Metadata } from "next";
import Link from "next/link";
import { stripe, stripeEnabled } from "@/lib/server/stripe";
import { OrderConfirmed } from "@/components/checkout/OrderConfirmed";

export const metadata: Metadata = { title: "Confirmation de commande", robots: { index: false } };

/** La commande n'est annoncée « payée » qu'après vérification de la session Stripe côté serveur. */
export default async function Page({ searchParams }: PageProps<"/commande/confirmation">) {
  const sp = await searchParams;
  const sessionId = typeof sp.session_id === "string" ? sp.session_id : undefined;
  const testId = typeof sp.test === "string" ? sp.test : undefined;

  if (sessionId && stripeEnabled()) {
    let paid = false;
    let email: string | undefined;
    try {
      const s = await stripe().checkout.sessions.retrieve(sessionId);
      paid = s.payment_status === "paid";
      email = s.customer_details?.email ?? undefined;
    } catch {
      paid = false;
    }
    if (!paid) {
      return (
        <div className="mx-auto max-w-xl px-5 py-24 text-center">
          <p className="font-display text-4xl">Paiement non validé</p>
          <p className="mt-3 text-forest-soft">Nous n&apos;avons pas pu confirmer ton paiement. Aucune commande n&apos;a été enregistrée. Si un débit apparaît, contacte-nous.</p>
          <Link href="/paiement" className="btn btn-primary mt-6">Réessayer</Link>
        </div>
      );
    }
    return <OrderConfirmed mode="stripe" sessionId={sessionId} email={email} />;
  }
  if (testId) return <OrderConfirmed mode="test" orderId={testId} />;
  return (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <p className="font-display text-4xl">Aucune commande à afficher</p>
      <Link href="/compte/commandes" className="btn btn-primary mt-6">Mes commandes</Link>
    </div>
  );
}
