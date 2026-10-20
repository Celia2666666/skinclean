"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useHydrated, useStore } from "@/lib/store";

/** Consentement cookies RGPD : refuser est aussi simple qu'accepter ; rien n'est déposé avant choix. */
export function CookieBanner() {
  const consent = useStore((s) => s.consent);
  const setConsent = useStore((s) => s.setConsent);
  const h = useHydrated();
  const [custom, setCustom] = useState(false);
  const [a, setA] = useState(false);
  const [m, setM] = useState(false);
  return (
    <AnimatePresence>
      {h && !consent && (
        <motion.div initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 120, opacity: 0 }} transition={{ delay: 1 }} className="fixed bottom-4 left-4 z-[55] w-[min(92vw,420px)] rounded-none bg-ivory p-5 shadow-[var(--shadow-lift)]" role="dialog" aria-label="Gestion des cookies">
          <p className="font-display text-xl">Gestion des cookies</p>
          <p className="mt-1 text-sm text-forest-soft">Nous utilisons des cookies nécessaires au fonctionnement du site (panier, compte). Avec ton accord, nous pourrions aussi mesurer l&apos;audience et personnaliser nos offres. <Link href="/legal/cookies" className="underline">En savoir plus</Link></p>
          {custom && (
            <div className="mt-3 space-y-2 text-sm">
              <label className="flex items-center justify-between rounded-[2px] bg-cream p-3"><span>Nécessaires</span><span className="text-xs">Toujours actifs</span></label>
              <label className="flex items-center justify-between rounded-[2px] bg-cream p-3"><span>Mesure d&apos;audience</span><input type="checkbox" checked={a} onChange={(e) => setA(e.target.checked)} className="accent-[#24392F]" /></label>
              <label className="flex items-center justify-between rounded-[2px] bg-cream p-3"><span>Marketing</span><input type="checkbox" checked={m} onChange={(e) => setM(e.target.checked)} className="accent-[#24392F]" /></label>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn btn-ghost flex-1 px-4 py-2" onClick={() => setConsent({ analytics: false, marketing: false })}>Tout refuser</button>
            <button className="btn btn-primary flex-1 px-4 py-2" onClick={() => setConsent({ analytics: true, marketing: true })}>Tout accepter</button>
            {custom ? (
              <button className="w-full text-sm underline" onClick={() => setConsent({ analytics: a, marketing: m })}>Enregistrer mes choix</button>
            ) : (
              <button className="w-full text-sm underline" onClick={() => setCustom(true)}>Personnaliser</button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
