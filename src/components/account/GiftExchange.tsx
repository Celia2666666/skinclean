"use client";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { loyalty } from "@/data/config";
import { getProduct } from "@/lib/catalog";
import { frDate } from "@/lib/format";
import { leavesBalance, useAccount, useHydrated, useStore } from "@/lib/store";
import { Packshot } from "@/components/product/Packshot";
import { GiftIcon, LeafIcon } from "@/components/ui/Icons";

type Gift = (typeof loyalty.giftRewards)[number];

/** Club : échange de feuilles contre un cadeau, joint automatiquement à la prochaine commande. */
export function GiftExchange() {
  const h = useHydrated();
  const account = useAccount();
  // Rendu identique serveur / client avant hydratation (compte lu dans le navigateur).
  const acc = h ? account : undefined;
  const claim = useStore((s) => s.claimGift);
  const balance = h ? leavesBalance(acc) : 0;
  const [confirm, setConfirm] = useState<Gift>();
  const [opened, setOpened] = useState<Gift>();
  const [error, setError] = useState<string>();
  const waiting = h ? (acc?.gifts ?? []).filter((g) => !g.orderId) : [];

  const doClaim = (g: Gift) => {
    const r = claim(g.id);
    setConfirm(undefined);
    if (!r.ok) { setError(r.error); return; }
    setError(undefined);
    setOpened(g);
  };

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-display text-5xl">Échange tes feuilles</h2>
        {acc && <p className="flex items-center gap-2 text-sm"><LeafIcon size={18} /> <b>{balance}</b> feuilles disponibles</p>}
      </div>
      <p className="mt-2 max-w-2xl text-forest-soft">Choisis un cadeau : il est ajouté gratuitement à ta prochaine commande, sans minimum d&apos;achat.</p>
      {error && <p role="alert" className="mt-4 text-sm text-[#a14d5f]">{error}</p>}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {loyalty.giftRewards.map((g) => {
          const p = getProduct(g.productId);
          const ok = !!acc && balance >= g.leaves;
          const already = waiting.some((w) => w.giftId === g.id);
          return (
            <motion.div key={g.id} whileHover={{ y: -6 }} className="flex flex-col bg-ivory">
              <div className="relative aspect-[4/3] p-[12%]" style={{ background: p?.color.bg ?? "#EFEEEA" }}>
                {p && <Packshot product={p} className="h-full w-full" showTag={false} sizes="(max-width: 640px) 90vw, 30vw" />}
                <span className="chip absolute left-3 top-3 bg-forest text-ivory"><LeafIcon size={13} /> {g.leaves}</span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="font-display text-2xl">{g.name}</p>
                <p className="mt-1 flex-1 text-sm text-forest-soft">{g.description}</p>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-sage-soft">
                  <motion.div className="h-full rounded-full bg-forest" initial={{ width: 0 }} whileInView={{ width: `${Math.min(100, (balance / g.leaves) * 100)}%` }} viewport={{ once: true }} transition={{ duration: 1.1 }} />
                </div>
                {!acc ? (
                  <Link href="/compte/connexion?retour=/club" className="btn btn-ghost mt-4 py-2.5 text-sm">Me connecter</Link>
                ) : already ? (
                  <p className="mt-4 text-center text-sm font-medium">Il t&apos;attend pour ta prochaine commande</p>
                ) : (
                  <button disabled={!ok} onClick={() => setConfirm(g)} className="btn btn-primary mt-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-40">
                    {ok ? "Échanger" : `Encore ${g.leaves - balance} feuilles`}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {waiting.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-3 bg-sage-soft p-4 text-sm">
          <GiftIcon size={18} />
          <span>En attente pour ta prochaine commande : {waiting.map((w) => `${w.name} (échangé le ${frDate(w.claimedAt)})`).join(", ")}.</span>
        </div>
      )}

      {/* Confirmation */}
      <AnimatePresence>
        {confirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] grid place-items-center bg-forest/30 p-4 backdrop-blur-sm" onClick={() => setConfirm(undefined)}>
            <motion.div role="dialog" aria-modal="true" aria-labelledby="gift-confirm" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-ivory p-7 text-center shadow-2xl">
              <p id="gift-confirm" className="font-display text-3xl">Échanger {confirm.leaves} feuilles ?</p>
              <p className="mt-2 text-sm text-forest-soft">Contre <b className="text-forest">{confirm.name}</b>, ajouté à ta prochaine commande. Il te restera {balance - confirm.leaves} feuilles.</p>
              <div className="mt-6 flex justify-center gap-3">
                <button onClick={() => setConfirm(undefined)} className="btn btn-ghost">Annuler</button>
                <button onClick={() => doClaim(confirm)} className="btn btn-primary">Confirmer l&apos;échange</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animation d'ouverture */}
      <AnimatePresence>{opened && <GiftReveal gift={opened} onClose={() => setOpened(undefined)} />}</AnimatePresence>
    </section>
  );
}

function GiftReveal({ gift, onClose }: { gift: Gift; onClose: () => void }) {
  const p = getProduct(gift.productId);
  const reduce = useReducedMotion();
  const leaves = Array.from({ length: 14 }, (_, i) => {
    const angle = (i / 14) * Math.PI * 2 + (i % 2 ? 0.2 : -0.1);
    const dist = 140 + (i % 4) * 30;
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist * 0.8 - 60, r: (i * 47) % 360, d: 0.55 + (i % 5) * 0.06 };
  });
  const lidDelay = reduce ? 0 : 0.5;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[85] grid place-items-center bg-forest/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div role="dialog" aria-modal="true" aria-labelledby="gift-title" onClick={(e) => e.stopPropagation()} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 18 }} className="relative w-full max-w-md overflow-hidden bg-ivory px-8 pb-8 pt-10 text-center shadow-2xl">
        <div className="relative mx-auto h-60 w-60">
          {/* Feuilles qui s'envolent */}
          {!reduce && leaves.map((l, i) => (
            <motion.span key={i} className="absolute left-1/2 top-[62%] text-sage-deep" initial={{ x: 0, y: 0, opacity: 0, scale: 0.3, rotate: 0 }} animate={{ x: l.x, y: l.y, opacity: [0, 1, 1, 0], scale: [0.3, 1, 1, 0.8], rotate: l.r }} transition={{ delay: lidDelay + 0.15, duration: 1.6 * l.d + 0.6, ease: "easeOut" }}>
              <LeafIcon size={18 + (i % 3) * 4} />
            </motion.span>
          ))}
          {/* Produit qui sort de la boîte */}
          {p && (
            <motion.div className="absolute left-1/2 top-[30%] h-32 w-28 -translate-x-1/2" initial={{ y: 70, opacity: 0, scale: 0.6 }} animate={{ y: -10, opacity: 1, scale: 1 }} transition={{ delay: lidDelay + 0.25, type: "spring", stiffness: 160, damping: 14 }}>
              <Packshot product={p} className="h-full w-full" showTag={false} sizes="112px" />
            </motion.div>
          )}
          {/* Boîte */}
          <div className="absolute bottom-2 left-1/2 h-24 w-40 -translate-x-1/2 bg-forest">
            <div className="absolute inset-y-0 left-1/2 w-5 -translate-x-1/2 bg-sage" />
          </div>
          {/* Couvercle */}
          <motion.div className="absolute bottom-[6.4rem] left-1/2 h-7 w-44 origin-bottom-left bg-forest" style={{ x: "-50%" }} initial={{ rotate: 0, y: 0 }} animate={{ rotate: reduce ? 0 : -24, y: reduce ? 0 : -26, x: "-58%" }} transition={{ delay: lidDelay, type: "spring", stiffness: 180, damping: 12 }}>
            <div className="absolute inset-y-0 left-1/2 w-5 -translate-x-1/2 bg-sage" />
            <div className="absolute -top-4 left-1/2 h-4 w-10 -translate-x-1/2 rounded-t-full border-4 border-b-0 border-sage" />
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: lidDelay + 0.6 }}>
          <p id="gift-title" className="mt-2 font-display text-3xl">{gift.name} est à toi !</p>
          <p className="mt-2 text-sm text-forest-soft">Il sera glissé gratuitement dans ta prochaine commande. -{gift.leaves} feuilles sur ton solde.</p>
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={onClose} className="btn btn-ghost">Fermer</button>
            <Link href="/soins-visage" className="btn btn-primary">Faire mes achats</Link>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
