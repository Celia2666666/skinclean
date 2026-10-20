"use client";
import Image from "next/image";
import { useState } from "react";
import { LockI } from "./icons";

export function LoginForm({ demo }: { demo: boolean }) {
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
    window.location.href = "/hub";
  };
  return (
    <div className="grid min-h-screen bg-[#F6F5F1] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-forest lg:block">
        <Image src="/media/videos/hero-poster.webp" alt="" fill className="object-cover opacity-40" priority />
        <div className="absolute inset-0 flex flex-col justify-between p-12 text-white">
          <Image src="/media/brand/transparent/logo-wordmark.png" alt="skinclean" width={180} height={41} className="h-9 w-auto brightness-0 invert" />
          <div>
            <p className="eyebrow text-sage">Marketing Hub</p>
            <h1 className="mt-3 max-w-md font-display text-5xl font-medium leading-[1.05]">Ta stratégie marketing, prête à publier.</h1>
            <p className="mt-4 max-w-md text-white/80">Programme du jour, contenus à valider, campagnes, SEO et performances : tout ton marketing SKINCLEAN au même endroit.</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm">
          <Image src="/media/brand/transparent/logo-mark.png" alt="" width={44} height={55} className="h-12 w-auto" />
          <h2 className="mt-6 font-display text-3xl font-semibold">Connexion</h2>
          <p className="mt-1 text-sm text-forest-soft">Accède à ton Marketing Hub SKINCLEAN.</p>
          <label className="mt-8 block">
            <span className="hub-label">E-mail</span>
            <input className="hub-input" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="mt-4 block">
            <span className="hub-label">Mot de passe</span>
            <input className="hub-input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error && <p role="alert" className="mt-3 text-sm text-[#A63A3A]">{error}</p>}
          <button type="submit" disabled={loading} className="hub-btn hub-btn-primary mt-6 w-full"><LockI size={15} />{loading ? "Connexion…" : "Se connecter"}</button>
          {demo && (
            <p className="mt-6 rounded-lg border border-line bg-white p-3 text-xs leading-relaxed text-forest-soft">
              Environnement local : les comptes de démonstration (administrateur, responsable marketing, créateur, client validateur) et leur mot de passe sont décrits dans le fichier <code>README.md</code> (section Marketing Hub). Change-les depuis « Mon compte ».
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
