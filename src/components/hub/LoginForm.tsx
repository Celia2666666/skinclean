"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { LockI } from "./icons";
import { BrandVideo } from "./BrandVideo";
import { PasswordInput } from "./PasswordInput";

export function LoginForm({ demo, next }: { demo: boolean; next?: string }) {
  const crm = next?.startsWith("/crm");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const r = await fetch("/api/hub/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
    const j = await r.json().catch(() => ({}));
    setLoading(false);
    if (!r.ok) return setError(j.error || "Connexion impossible.");
    window.location.href = next || "/hub";
  };
  return (
    <div className="grid min-h-screen bg-[#F6F5F1] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-forest lg:block">
        <BrandVideo className="absolute inset-0 h-full w-full object-cover opacity-50" />
        <div className="absolute inset-0 flex flex-col justify-between p-12 text-white">
          <Image src="/media/brand/transparent/logo-wordmark.png" alt="skinclean" width={180} height={41} className="h-9 w-auto brightness-0 invert" />
          <div>
            <p className="eyebrow text-sage">{crm ? "CRM" : "Marketing Hub"}</p>
            <h1 className="mt-3 max-w-md font-display text-5xl font-medium leading-[1.05]">{crm ? "Tes clients, tes ventes, ton stock." : "Ta stratégie marketing, prête à publier."}</h1>
            <p className="mt-4 max-w-md text-white/80">{crm ? "Chiffre d'affaires, rentabilité, fiches clients, paniers abandonnés et réassort : tout le pilotage commercial SKINCLEAN au même endroit." : "Programme du jour, contenus à valider, campagnes, SEO et performances : tout ton marketing SKINCLEAN au même endroit."}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm">
          <Image src="/media/brand/transparent/logo-mark.png" alt="" width={44} height={55} className="h-12 w-auto" />
          <h2 className="mt-6 font-display text-3xl font-semibold">Connexion</h2>
          <p className="mt-1 text-sm text-forest-soft">{crm ? "Accède au CRM SKINCLEAN (même compte que le Marketing Hub)." : "Accède à ton Marketing Hub SKINCLEAN."}</p>
          <label className="mt-8 block">
            <span className="hub-label">E-mail</span>
            <input className="hub-input" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="mt-4 block">
            <span className="flex items-center justify-between"><span className="hub-label">Mot de passe</span><Link href="/hub/mot-de-passe-oublie" className="mb-1 text-xs underline underline-offset-2">Mot de passe oublié ?</Link></span>
            <PasswordInput className="hub-input" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error && <p role="alert" className="mt-3 text-sm text-[#A63A3A]">{error}</p>}
          <button type="submit" disabled={loading} className="hub-btn hub-btn-primary mt-6 w-full"><LockI size={15} />{loading ? "Connexion…" : "Se connecter"}</button>
          {demo && (
            <p className="mt-6 rounded-lg border border-line bg-white p-3 text-xs leading-relaxed text-forest-soft">
              Environnement local : l'identifiant du compte universel est indiqué dans le fichier <code>README.md</code> (section Marketing Hub). Change le mot de passe depuis « Mon compte ».
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
