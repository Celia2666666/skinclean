"use client";
import Image from "next/image";
import { useState } from "react";
import { LockI } from "@/components/hub/icons";

export function AccessForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await fetch("/api/crm/access", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) });
    if (r.ok) window.location.assign("/crm");
    else setError("Code incorrect.");
  };
  return (
    <div className="grid min-h-screen place-items-center bg-[#F6F5F1] p-6 text-forest">
      <form onSubmit={submit} className="w-full max-w-sm">
        <Image src="/media/brand/transparent/logo-mark.png" alt="" width={44} height={55} className="h-12 w-auto" />
        <h1 className="mt-6 font-display text-3xl font-semibold">CRM SKINCLEAN</h1>
        <p className="mt-1 text-sm text-forest-soft">Démo en ligne sur données fictives. Saisis le code d'accès communiqué.</p>
        <input className="hub-input mt-6" type="password" autoComplete="off" required value={code} onChange={(e) => setCode(e.target.value)} aria-label="Code d'accès" />
        {error && <p role="alert" className="mt-2 text-sm text-[#A63A3A]">{error}</p>}
        <button className="hub-btn hub-btn-primary mt-4 w-full"><LockI size={15} />Entrer</button>
      </form>
    </div>
  );
}
