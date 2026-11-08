"use client";
import Link from "next/link";
import { useState } from "react";
import { PasswordInput } from "./PasswordInput";
import { CheckI, LockI, MailI } from "./icons";

function Shell({ title, intro, children }: { title: string; intro: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F5F1] p-6">
      <div className="w-full max-w-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/brand/transparent/logo-mark.png" alt="" className="h-12 w-auto" />
        <h1 className="mt-6 font-display text-3xl font-semibold">{title}</h1>
        <div className="mt-1 text-sm text-forest-soft">{intro}</div>
        <div className="mt-8">{children}</div>
        <Link href="/hub/connexion" className="mt-6 inline-block text-sm underline underline-offset-2">← Retour à la connexion</Link>
      </div>
    </div>
  );
}

/** Étape 1 : demande d'un lien de réinitialisation. */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState<null | { delivery: "email" | "fichier"; file?: string }>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const r = await fetch("/api/hub/auth/forgot", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
    const j = await r.json().catch(() => ({}));
    setLoading(false);
    if (!r.ok) return setError(j.error || "Demande impossible.");
    setSent(j);
  };
  if (sent) {
    return (
      <Shell title="Demande enregistrée" intro="Si cet e-mail correspond à un compte du Marketing Hub, un lien de réinitialisation vient d'être créé (valable 30 minutes, utilisable une seule fois).">
        {sent.delivery === "email" ? (
          <p className="flex items-start gap-2 rounded-lg border border-sage bg-sage-soft p-4 text-sm"><MailI size={18} className="mt-0.5 shrink-0" />Ouvre l&apos;e-mail reçu et clique sur le lien pour choisir un nouveau mot de passe.</p>
        ) : (
          <div className="space-y-3 rounded-lg border border-line bg-white p-4 text-sm">
            <p className="font-medium">Où trouver le lien ?</p>
            <p className="text-forest-soft">Aucun service d&apos;envoi d&apos;e-mails n&apos;est configuré : le Hub fonctionnant en local, le lien est déposé sur ton ordinateur, dans le dossier du projet SKINCLEAN :</p>
            <p className="rounded bg-sage-soft px-3 py-2 font-mono text-xs">{sent.file}</p>
            <p className="text-forest-soft">Ouvre ce fichier, copie le lien et colle-le dans ton navigateur. Il est aussi affiché dans le terminal où tourne le serveur.</p>
          </div>
        )}
      </Shell>
    );
  }
  return (
    <Shell title="Mot de passe oublié" intro="Indique l'e-mail de ton compte : on te prépare un lien pour choisir un nouveau mot de passe.">
      <form onSubmit={submit}>
        <label className="block"><span className="hub-label">E-mail</span><input type="email" autoComplete="username" required className="hub-input" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        {error && <p role="alert" className="mt-3 text-sm text-[#A63A3A]">{error}</p>}
        <button type="submit" disabled={loading} className="hub-btn hub-btn-primary mt-6 w-full"><MailI size={15} />{loading ? "Envoi…" : "Recevoir un lien de réinitialisation"}</button>
      </form>
    </Shell>
  );
}

/** Étape 2 : choix du nouveau mot de passe depuis le lien. */
export function ResetPasswordForm({ token, email }: { token: string; email: string | null }) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  if (!email) {
    return (
      <Shell title="Lien invalide" intro="Ce lien de réinitialisation est invalide, expiré (30 minutes) ou déjà utilisé.">
        <Link href="/hub/mot-de-passe-oublie" className="hub-btn hub-btn-primary w-full">Faire une nouvelle demande</Link>
      </Shell>
    );
  }
  if (done) {
    return (
      <Shell title="Mot de passe modifié" intro="Ton nouveau mot de passe est enregistré. Toutes les sessions ouvertes ont été fermées par sécurité.">
        <Link href="/hub/connexion" className="hub-btn hub-btn-primary w-full"><CheckI size={15} />Me connecter</Link>
      </Shell>
    );
  }
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (pw !== confirm) return setError("Les deux mots de passe ne correspondent pas.");
    setLoading(true);
    const r = await fetch("/api/hub/auth/reset", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, password: pw }) });
    const j = await r.json().catch(() => ({}));
    setLoading(false);
    if (!r.ok) return setError(j.error || "Réinitialisation impossible.");
    setDone(true);
  };
  return (
    <Shell title="Nouveau mot de passe" intro={<>Pour le compte <strong className="text-forest">{email}</strong>.</>}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block"><span className="hub-label">Nouveau mot de passe</span><PasswordInput autoComplete="new-password" required className="hub-input" value={pw} onChange={(e) => setPw(e.target.value)} /><span className="mt-1 block text-xs text-forest-soft">10 caractères minimum, avec des lettres et des chiffres.</span></label>
        <label className="block"><span className="hub-label">Confirmer</span><PasswordInput autoComplete="new-password" required className="hub-input" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></label>
        {error && <p role="alert" className="text-sm text-[#A63A3A]">{error}</p>}
        <button type="submit" disabled={loading} className="hub-btn hub-btn-primary w-full"><LockI size={15} />{loading ? "Enregistrement…" : "Enregistrer le nouveau mot de passe"}</button>
      </form>
    </Shell>
  );
}
