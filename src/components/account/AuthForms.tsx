"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { loyalty, welcomeOffer } from "@/data/config";
import { demoAccounts } from "@/data/demo-accounts";

export function AuthForms({ mode }: { mode: "login" | "register" | "forgot" }) {
  const router = useRouter();
  const search = useSearchParams();
  const login = useStore((s) => s.login);
  const register = useStore((s) => s.register);
  const [f, setF] = useState({ email: "", password: "", firstName: "", lastName: "", newsletter: false, consent: false });
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const back = search?.get("retour") || "/compte";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    if (mode === "forgot") { setSent(true); return; }
    if (mode === "register" && f.password.length < 8) { setError("Le mot de passe doit contenir au moins 8 caractères."); return; }
    setLoading(true);
    const err = mode === "login" ? await login(f.email, f.password) : await register(f);
    setLoading(false);
    if (err) setError(err);
    else {
      if (mode === "register" && f.newsletter) {
        // Double opt-in : l'inscription newsletter n'est effective qu'après confirmation par e-mail
        fetch("/api/newsletter", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: f.email, consent: true }) });
      }
      router.push(back);
    }
  };
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  return (
    <div className="relative grid min-h-[80vh] place-items-center overflow-hidden bg-[radial-gradient(120%_90%_at_10%_0%,#EFEEEA,#F4F3EF_55%,#EFEEEA)] px-4 py-16">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md rounded-none bg-ivory p-7 shadow-[var(--shadow-lift)] md:p-9">
        <h1 className="font-display text-4xl">{mode === "login" ? "Bon retour" : mode === "register" ? "Rejoins SKINCLEAN" : "Mot de passe oublié"}</h1>
        <p className="mt-2 text-sm text-forest-soft">
          {mode === "login" ? "Connecte-toi pour retrouver tes routines, tes commandes et tes feuilles." : mode === "register" ? "Crée ton compte : tes routines, ton Skin Journal et le SKINCLEAN Club au même endroit." : "Saisis ton e-mail, nous t'enverrons un lien de réinitialisation."}
        </p>
        {sent ? (
          <p className="mt-6 rounded-[2px] bg-sage-soft p-4 text-sm">Si un compte existe pour cette adresse, un lien de réinitialisation vient d&apos;être envoyé. <b>Mode démo</b> : l&apos;envoi réel nécessite la base de données et le service e-mail (voir README).</p>
        ) : (
          <>
          {mode === "login" && (
            <div className="mt-6 border border-dashed border-sage-deep/40 bg-sage-soft/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-forest-soft">Comptes de test</p>
              <div className="mt-2 grid gap-2">
                {demoAccounts.map((d) => (
                  <button key={d.email} type="button" onClick={() => setF({ ...f, email: d.email, password: d.password })} className="border border-line bg-ivory px-3 py-2 text-left text-sm transition hover:border-forest">
                    <span className="block font-medium">{d.label}</span>
                    <span className="block text-xs text-forest-soft">{d.description}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[0.7rem] text-forest-soft">Clique sur un compte pour remplir le formulaire, puis sur « Se connecter ».</p>
            </div>
          )}
          <form onSubmit={submit} className="mt-6 space-y-3">
            {mode === "register" && (
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label" htmlFor="fn">Prénom</label><input id="fn" required className="input" value={f.firstName} onChange={set("firstName")} autoComplete="given-name" /></div>
                <div><label className="label" htmlFor="ln">Nom</label><input id="ln" required className="input" value={f.lastName} onChange={set("lastName")} autoComplete="family-name" /></div>
              </div>
            )}
            <div><label className="label" htmlFor="em">E-mail</label><input id="em" type="email" required className="input" value={f.email} onChange={set("email")} autoComplete="email" /></div>
            {mode !== "forgot" && <div><label className="label" htmlFor="pw">Mot de passe</label><input id="pw" type="password" required className="input" value={f.password} onChange={set("password")} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "register" ? 8 : undefined} /></div>}
            {mode === "register" && (
              <>
                <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={f.newsletter} onChange={set("newsletter")} className="mt-1 accent-[#24392F]" /><span>Je souhaite recevoir la newsletter (-{welcomeOffer.newsletterPercent} % sur ma 1ʳᵉ commande + {loyalty.newsletterBonus} feuilles après confirmation de mon e-mail).</span></label>
                <label className="flex items-start gap-2 text-sm"><input type="checkbox" required checked={f.consent} onChange={set("consent")} className="mt-1 accent-[#24392F]" /><span>J&apos;accepte la <Link href="/legal/confidentialite" className="underline">politique de confidentialité</Link>.</span></label>
              </>
            )}
            {error && <p className="text-sm text-[#a14d5f]" role="alert">{error}</p>}
            <button disabled={loading} className="btn btn-primary w-full py-3.5">{loading ? "…" : mode === "login" ? "Se connecter" : mode === "register" ? "Créer mon compte" : "Envoyer le lien"}</button>
          </form>
          </>
        )}
        <div className="mt-6 space-y-1 text-center text-sm">
          {mode === "login" && <><p>Pas encore de compte ? <Link href={`/compte/inscription${back !== "/compte" ? `?retour=${back}` : ""}`} className="font-semibold underline">Créer un compte</Link></p><p><Link href="/compte/mot-de-passe-oublie" className="underline">Mot de passe oublié ?</Link></p></>}
          {mode !== "login" && <p>Déjà inscrit·e ? <Link href="/compte/connexion" className="font-semibold underline">Se connecter</Link></p>}
        </div>
        <p className="mt-6 text-center text-[0.7rem] text-forest-soft">Mode démo : compte stocké localement sur cet appareil (mot de passe haché). L&apos;authentification serveur sécurisée est prête à brancher (voir README).</p>
      </motion.div>
    </div>
  );
}
