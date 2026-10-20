"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useAccount, useHydrated, useStore, type Order } from "@/lib/store";
import { euro } from "@/lib/format";
import { CheckIcon } from "@/components/ui/Icons";

export function OrderConfirmed({ mode, sessionId, orderId, email }: { mode: "stripe" | "test"; sessionId?: string; orderId?: string; email?: string }) {
  const h = useHydrated();
  const acc = useAccount();
  const guest = useStore((s) => s.guestOrders);
  const recordOrder = useStore((s) => s.recordOrder);
  const clearCart = useStore((s) => s.clearCart);
  const once = useRef(false);
  const [order, setOrder] = useState<Order>();

  useEffect(() => {
    if (!h || once.current) return;
    once.current = true;
    const all = [...(acc?.orders ?? []), ...guest];
    if (mode === "test") { setOrder(all.find((o) => o.id === orderId)); return; }
    // Paiement Stripe vérifié côté serveur → enregistrement idempotent (par id de session)
    const existing = all.find((o) => o.stripeSessionId === sessionId);
    if (existing) { setOrder(existing); return; }
    try {
      const snap = JSON.parse(sessionStorage.getItem("sc-pending-order") ?? "null");
      if (snap) {
        const o = recordOrder({ ...snap, email: email ?? snap.email, status: "payee", paymentMode: "stripe", stripeSessionId: sessionId });
        sessionStorage.removeItem("sc-pending-order");
        clearCart();
        setOrder(o);
      }
    } catch {}
  }, [h, acc, guest, mode, orderId, sessionId, email, recordOrder, clearCart]);

  return (
    <div className="relative mx-auto max-w-3xl overflow-hidden px-5 py-20 text-center">
      <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 12 }} className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-sage text-forest"><CheckIcon size={40} /></motion.div>
      <h1 className="mt-6 font-display text-5xl">{mode === "test" ? "Commande de test enregistrée" : "Merci, ta commande est confirmée !"}</h1>
      {mode === "test" ? (
        <p className="mt-4 rounded-[2px] bg-butter p-4 text-sm">Cette commande est un <b>test</b> : <b>aucun paiement n&apos;a été effectué</b> et elle ne sera pas expédiée. Elle permet de tester l&apos;historique et la fidélité.</p>
      ) : (
        <p className="mt-4 text-forest-soft">Paiement validé par Stripe. Un e-mail récapitulatif t&apos;est envoyé{email ? ` à ${email}` : ""}.</p>
      )}
      {order && (
        <div className="mt-8 rounded-none bg-ivory p-6 text-left">
          <p className="font-semibold">Commande {order.id}</p>
          <ul className="mt-3 space-y-1 text-sm">{order.lines.map((l, i) => <li key={i} className="flex justify-between"><span>{l.qty} × {l.name} ({l.size})</span><span>{euro(l.unit * l.qty)}</span></li>)}</ul>
          {order.gift && <p className="mt-2 text-sm"> {order.gift}</p>}
          <p className="mt-3 flex justify-between border-t border-line pt-3 font-semibold"><span>Total</span><span>{euro(order.total)}</span></p>
          {order.leaves > 0 && <p className="mt-2 text-sm"> {order.leaves} feuilles {acc ? "en attente — créditées à l'expédition" : "à gagner en créant un compte la prochaine fois"}</p>}
        </div>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/compte/commandes" className="btn btn-primary">Suivre ma commande</Link>
        <Link href="/compte/journal" className="btn btn-ghost">Démarrer mon Skin Journal</Link>
      </div>
    </div>
  );
}
