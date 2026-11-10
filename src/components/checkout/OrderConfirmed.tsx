"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useAccount, useHydrated, useStore, type Order } from "@/lib/store";
import { euro } from "@/lib/format";
import { CheckIcon } from "@/components/ui/Icons";
import { OrderEmailPreview } from "./OrderEmailPreview";

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
      <h1 className="mt-6 font-display text-5xl">{mode === "test" ? "Merci, ta commande est enregistrée !" : "Merci, ta commande est confirmée !"}</h1>
      {mode === "test" ? (
        <p className="mt-4 rounded-[2px] bg-sage-soft p-4 text-sm"><b>Paiement simulé</b> (projet étudiant INSEEC) : aucune somme n&apos;a été débitée et la commande ne sera pas expédiée. Elle apparaît dans ton compte client et dans le <Link href="/crm/ventes" className="underline">CRM de l&apos;entreprise</Link>, et l&apos;e-mail de confirmation (simulé, aucun envoi réel) s&apos;affiche ci-dessous et dans la <Link href="/crm/boite-demo" className="underline">boîte mail de démo du CRM</Link>.</p>
      ) : (
        <p className="mt-4 text-forest-soft">Paiement validé par Stripe. Un e-mail récapitulatif t&apos;est envoyé{email ? ` à ${email}` : ""}.</p>
      )}
      {order && (
        <div className="mt-8 rounded-none bg-ivory p-6 text-left">
          <p className="font-semibold">Commande {order.id}</p>
          <ul className="mt-3 space-y-1 text-sm">{order.lines.map((l, i) => <li key={i} className="flex justify-between"><span>{l.qty} × {l.name} ({l.size})</span><span>{euro(l.unit * l.qty)}</span></li>)}</ul>
          {order.gift && <p className="mt-2 text-sm">Cadeau offert : {order.gift}</p>}
          <p className="mt-3 flex justify-between border-t border-line pt-3 font-semibold"><span>Total TTC</span><span>{euro(order.total)}</span></p>
          {order.leaves > 0 && <p className="mt-2 text-sm">{order.leaves} feuilles {acc ? "en attente — créditées à l'expédition" : "à gagner en créant un compte la prochaine fois"}</p>}
        </div>
      )}
      {order && mode === "test" && (
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="mt-10">
          <p className="mb-3 flex items-center justify-center gap-2 text-sm font-medium"><motion.span initial={{ y: -12, rotate: -12, opacity: 0 }} animate={{ y: 0, rotate: 0, opacity: 1 }} transition={{ delay: 0.9, type: "spring", stiffness: 260, damping: 14 }} aria-hidden>✉</motion.span>L&apos;e-mail de confirmation reçu par le client</p>
          <OrderEmailPreview order={order} firstName={acc?.firstName ?? order.address?.name?.split(" ")[0]} />
          <p className="mt-2 text-xs text-forest-soft">Démo : aucun e-mail ne part réellement. Il est aussi visible dans le CRM, rubrique « Boîte mail de démo ».</p>
        </motion.div>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/compte/commandes" className="btn btn-primary">Suivre ma commande</Link>
        {mode === "test" && <Link href="/crm/boite-demo?cat=order" className="btn btn-ghost">Voir l&apos;e-mail dans le CRM</Link>}
        <Link href="/compte/journal" className="btn btn-ghost">Démarrer mon Skin Journal</Link>
      </div>
    </div>
  );
}
