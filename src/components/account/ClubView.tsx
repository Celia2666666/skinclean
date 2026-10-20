"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { loyalty, welcomeOffer, firstOrderGift } from "@/data/config";
import { tierFor } from "@/lib/pricing";
import { leavesBalance, leavesEarned12m, pendingLeavesOf, useAccount, useHydrated } from "@/lib/store";
import { frDate } from "@/lib/format";
import { LeafGauge } from "./LeafGauge";
import { Reveal } from "@/components/ui/Reveal";
import { NewsletterForm } from "@/components/layout/NewsletterForm";

export function ClubView() {
  const acc = useAccount();
  const h = useHydrated();
  const balance = h ? leavesBalance(acc) : 0;
  const earned = h ? leavesEarned12m(acc) : 0;
  const pending = h ? pendingLeavesOf(acc) : 0;
  const { tier, next, index } = tierFor(earned);
  const [celebrate, setCelebrate] = useState(false);

  // Animation lorsqu'un nouveau palier est atteint
  useEffect(() => {
    if (!h || !acc) return;
    try {
      const k = `sc-tier-${acc.id}`;
      const prev = Number(localStorage.getItem(k) ?? "0");
      if (index > prev) { setCelebrate(true); setTimeout(() => setCelebrate(false), 4200); }
      localStorage.setItem(k, String(index));
    } catch {}
  }, [h, acc, index]);

  const earn = [
    { t: `${loyalty.leavesPerEuro} feuille / €`, d: `Sur chaque commande, créditées à l'${loyalty.creditedOn}.` },
    { t: `+${loyalty.newsletterBonus} feuilles`, d: "À la confirmation de ton inscription newsletter (une seule fois)." },
    { t: `+${loyalty.reviewBonus} feuilles`, d: `Pour un avis produit après achat (${loyalty.reviewBonusMaxPerMonth}× par mois).` },
    { t: `+${loyalty.birthdayBonus} feuilles`, d: "Le mois de ton anniversaire." },
  ];

  return (
    <>
      <section className="relative overflow-hidden bg-butter px-4 py-16 md:px-8 md:py-24">
        <div className="relative mx-auto grid max-w-[1300px] items-center gap-12 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="eyebrow text-forest/60">Programme de fidélité</p>
            <h1 className="mt-3 font-display text-[clamp(3rem,8vw,6.5rem)] leading-[0.9]">SKINCLEAN Club</h1>
            <p className="mt-5 max-w-lg text-lg">Chaque soin te fait gagner des feuilles  à échanger contre des réductions. Plus tu prends soin de toi, plus ton arbre grandit.</p>
            {!acc && h && (
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/compte/inscription" className="btn btn-primary">Rejoindre le Club gratuitement</Link>
                <Link href="/compte/connexion" className="btn btn-light">J&apos;ai déjà un compte</Link>
              </div>
            )}
          </div>
          <div className="flex flex-col items-center">
            <LeafGauge value={balance} max={next ? next.min : Math.max(balance, 1)} label="feuilles disponibles" size={260} />
            {acc ? (
              <div className="mt-6 w-full max-w-sm rounded-none bg-ivory/80 p-5 text-center backdrop-blur">
                <p className="text-sm">Palier actuel : <b className="font-display text-xl">{tier.name}</b></p>
                {next ? (
                  <>
                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-cream">
                      <motion.div className="h-full rounded-full bg-forest" initial={{ width: 0 }} animate={{ width: `${Math.min(100, ((earned - tier.min) / (next.min - tier.min)) * 100)}%` }} transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }} />
                    </div>
                    <p className="mt-2 text-xs text-forest-soft">Encore {next.min - earned} feuilles gagnées (sur {loyalty.tierWindowMonths} mois) pour devenir <b>{next.name}</b></p>
                  </>
                ) : <p className="mt-2 text-xs">Tu as atteint le palier ultime </p>}
                {pending > 0 && <p className="mt-2 text-xs">⏳ {pending} feuilles en attente (créditées à l&apos;expédition)</p>}
              </div>
            ) : <p className="mt-4 text-sm text-forest-soft">Connecte-toi pour voir ton solde.</p>}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1300px] space-y-24 px-4 py-20 md:px-8">
        <section>
          <h2 className="font-display text-5xl">Comment gagner des feuilles</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {earn.map((x, i) => (
              <Reveal key={x.t} delay={i * 0.08}>
                <motion.div whileHover={{ y: -6, rotate: -1 }} className="h-full rounded-none bg-ivory p-6">
                  <span className="text-xs font-semibold tracking-[0.2em] text-forest/50">{String(i + 1).padStart(2, "0")}</span>
                  <p className="mt-4 font-display text-2xl">{x.t}</p>
                  <p className="mt-1 text-sm text-forest-soft">{x.d}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-none bg-blush-soft p-6">
              <p className="font-display text-2xl">Offre de bienvenue</p>
              <p className="mt-2 text-sm">Newsletter : <b>-{welcomeOffer.newsletterPercent} %</b> sur ta 1ʳᵉ commande éligible (code valable {welcomeOffer.validityDays} jours, une seule fois par personne) + <b>{loyalty.newsletterBonus} feuilles</b>. {firstOrderGift.enabled && <>Et pour ta 1ʳᵉ commande : {firstOrderGift.description.toLowerCase()}.</>}</p>
              <div className="mt-4"><NewsletterForm /></div>
            </div>
            <div className="rounded-none bg-sky-soft p-6 text-sm">
              <p className="font-display text-2xl">Les règles, simplement</p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5">
                <li>Feuilles créditées à l&apos;{loyalty.creditedOn}, retirées en cas de retour ou remboursement.</li>
                <li>Ton palier dépend des feuilles gagnées sur {loyalty.tierWindowMonths} mois glissants.</li>
                <li>Tes feuilles expirent si tu ne les utilises pas pendant {loyalty.expiryMonthsInactivity} mois.</li>
                <li>Non cumulables avec un code promo ou un kit déjà remisé.</li>
                <li>Un compte connecté est nécessaire pour gagner et utiliser des feuilles.</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-display text-5xl">Tes récompenses</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {loyalty.rewards.map((r, i) => {
              const ok = balance >= r.leaves;
              return (
                <Reveal key={r.id} delay={i * 0.08}>
                  <div className={`relative overflow-hidden rounded-none p-6 ${ok ? "bg-sage" : "bg-ivory"}`}>
                    <p className="font-display text-5xl">-{r.value} €</p>
                    <p className="mt-2 text-sm">{r.leaves} </p>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-cream"><motion.div className="h-full bg-forest" initial={{ width: 0 }} whileInView={{ width: `${Math.min(100, (balance / r.leaves) * 100)}%` }} viewport={{ once: true }} transition={{ duration: 1.2 }} /></div>
                    <p className="mt-2 text-xs">{ok ? "Disponible au panier ✓" : `Encore ${r.leaves - balance} feuilles`}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="font-display text-5xl">Les paliers</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {loyalty.tiers.map((t, i) => (
              <Reveal key={t.id} delay={i * 0.1}>
                <div className={`relative h-full rounded-none p-6 ${acc && t.id === tier.id ? "ring-2 ring-forest ring-offset-4 ring-offset-cream" : ""}`} style={{ background: t.color }}>
                  <p className="mt-3 font-display text-3xl">{t.name}</p>
                  <p className="text-xs text-forest-soft">{t.min === 0 ? "Dès l'inscription" : `Dès ${t.min} feuilles gagnées / ${loyalty.tierWindowMonths} mois`}</p>
                  <ul className="mt-4 space-y-1.5 text-sm">{t.perks.map((p) => <li key={p}>✓ {p}</li>)}</ul>
                  {acc && t.id === tier.id && <span className="chip absolute right-4 top-4 bg-forest text-ivory">Ton palier</span>}
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-4 text-xs text-forest-soft">Seuils et avantages configurables par la marque (fichier de configuration ou back-office).</p>
        </section>

        {acc && (
          <section>
            <h2 className="font-display text-5xl">Historique</h2>
            <ul className="mt-6 divide-y divide-line rounded-none bg-ivory px-6">
              {acc.ledger.length === 0 && <li className="py-6 text-forest-soft">Pas encore de mouvement. Ta première commande te fera gagner tes premières feuilles !</li>}
              {[...acc.ledger].reverse().map((l) => (
                <li key={l.id} className="flex items-center gap-4 py-4 text-sm">
                  <span className="text-forest-soft">{frDate(l.date)}</span>
                  <span className="flex-1">{l.label}</span>
                  <span className="chip bg-cream">{({ credited: "Créditées", pending: "En attente", used: "Utilisées", cancelled: "Annulées" } as const)[l.status]}</span>
                  <span className={`w-16 text-right font-semibold ${l.delta < 0 ? "text-[#a14d5f]" : ""}`}>{l.delta > 0 ? "+" : ""}{l.delta} </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <AnimatePresence>
        {celebrate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] grid place-items-center bg-forest/30 backdrop-blur-sm" onClick={() => setCelebrate(false)}>
            <motion.div initial={{ scale: 0.5, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 12 }} className="relative rounded-none bg-ivory p-10 text-center shadow-2xl">
              <p className="mt-4 font-display text-4xl">Nouveau palier : {tier.name} !</p>
              <p className="mt-2 text-forest-soft">De nouveaux avantages t&apos;attendent.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
