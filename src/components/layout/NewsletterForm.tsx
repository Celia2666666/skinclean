"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { welcomeOffer, loyalty } from "@/data/config";

/**
 * Inscription newsletter en double opt-in.
 * Avantages cohérents partout : -20 % sur la 1ʳᵉ commande éligible + 100 feuilles, après confirmation.
 */
export function NewsletterForm({ variant = "light", cta = "Je m'inscris" }: { variant?: "light" | "dark" | "compact"; cta?: string }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [demoLink, setDemoLink] = useState<string>();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    const r = await fetch("/api/newsletter", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, consent }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setState("error"); setMsg(d.error ?? "Une erreur est survenue."); return; }
    setState("sent");
    setDemoLink(d.confirmUrl);
  };

  const dark = variant === "dark";
  return (
    <div>
      <AnimatePresence mode="wait">
        {state === "sent" ? (
          <motion.div key="ok" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-none p-5 ${dark ? "bg-ivory/10" : "bg-ivory"}`} role="status">
            <p className="font-display text-xl">Vérifie ta boîte mail </p>
            <p className="mt-1 text-sm opacity-80">Clique sur le lien de confirmation pour recevoir ton code -{welcomeOffer.newsletterPercent} % et tes {loyalty.newsletterBonus} feuilles.</p>
            {demoLink && (
              <p className="mt-3 rounded-[2px] bg-butter p-3 text-xs text-forest">
                <b>Mode démo</b> (aucun service d&apos;e-mail configuré) : <Link href={demoLink} className="underline">ouvrir le lien de confirmation</Link>
              </p>
            )}
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={submit} className="space-y-3" exit={{ opacity: 0 }}>
            <div className={`flex gap-0 border ${dark ? "border-ivory/30 bg-transparent" : "border-forest/25 bg-ivory"}`}>
              <label htmlFor={`nl-${variant}`} className="sr-only">Adresse e-mail</label>
              <input id={`nl-${variant}`} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ton@email.com" className={`min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none ${dark ? "placeholder:text-ivory/60" : ""}`} />
              <button disabled={state === "loading"} className={`btn ${dark ? "btn-light" : "btn-primary"} px-5`}>{state === "loading" ? "…" : cta}</button>
            </div>
            <label className="flex items-start gap-2 text-xs opacity-80">
              <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-[#24392F]" />
              <span>J&apos;accepte de recevoir la newsletter SKINCLEAN. Désinscription en 1 clic. <Link href={welcomeOffer.conditionsHref} className="underline">Conditions de l&apos;offre</Link> · <Link href="/legal/confidentialite" className="underline">Confidentialité</Link></span>
            </label>
            {state === "error" && <p className="text-xs text-[#a14d5f]">{msg}</p>}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
