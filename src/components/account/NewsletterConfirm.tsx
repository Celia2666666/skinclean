"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useHydrated, useStore } from "@/lib/store";
import { loyalty, welcomeOffer } from "@/data/config";
import { frDate } from "@/lib/format";

export function NewsletterConfirm({ email, issued, error }: { email?: string; issued?: { code: string; voucher: string; expiresAt: number }; error?: string }) {
  const h = useHydrated();
  const confirm = useStore((s) => s.confirmNewsletter);
  const once = useRef(false);
  const [res, setRes] = useState<{ status: "ok" | "already"; code?: string; leavesCredited: boolean }>();

  useEffect(() => {
    if (!h || !email || !issued || once.current) return;
    once.current = true;
    setRes(confirm(email, issued));
  }, [h, email, issued, confirm]);

  return (
    <div className="relative mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center overflow-hidden px-5 py-16 text-center">
      {error ? (
        <>
          <p className="font-display text-4xl">Oups…</p>
          <p className="mt-3 text-forest-soft">{error}</p>
          <Link href="/" className="btn btn-primary mt-6">Retour à l&apos;accueil</Link>
        </>
      ) : res?.status === "already" ? (
        <>
          <p className="font-display text-4xl">Tu es déjà inscrit·e</p>
          <p className="mt-3 text-forest-soft">Les avantages de bienvenue ne peuvent être attribués qu&apos;une seule fois par adresse.{res.code && <> Ton code reste : <b>{res.code}</b></>}</p>
          <Link href="/soins-visage" className="btn btn-primary mt-6">Découvrir les soins</Link>
        </>
      ) : res ? (
        <>
          <h1 className="mt-4 font-display text-5xl">Bienvenue dans le Glow Club !</h1>
          <p className="mt-4">Ton code de bienvenue (-{welcomeOffer.newsletterPercent} % sur ta 1ʳᵉ commande éligible) :</p>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-3 rounded-[2px] border-2 border-dashed border-forest bg-ivory px-6 py-4 font-display text-3xl tracking-widest">{res.code}</motion.p>
          <p className="mt-2 text-xs text-forest-soft">Valable jusqu&apos;au {issued && frDate(issued.expiresAt)} · une seule utilisation · <Link href={welcomeOffer.conditionsHref} className="underline">conditions</Link></p>
          <p className="mt-6">{res.leavesCredited ? `${loyalty.newsletterBonus} feuilles  ont été créditées sur ton compte !` : `Crée ton compte avec ${email} pour recevoir tes ${loyalty.newsletterBonus} feuilles  — elles t'attendent.`}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {!res.leavesCredited && <Link href="/compte/inscription" className="btn btn-primary">Créer mon compte</Link>}
            <Link href="/soins-visage" className="btn btn-ghost">Utiliser mon code</Link>
          </div>
        </>
      ) : (
        <p className="font-display text-3xl">Confirmation en cours…</p>
      )}
    </div>
  );
}
