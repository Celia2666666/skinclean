"use client";
import { useState } from "react";

export function ContactForm() {
  const [f, setF] = useState({ name: "", email: "", subject: "Question produit", order: "", message: "" });
  const [state, setState] = useState<"idle" | "sending" | "ok" | "demo" | "error">("idle");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    const r = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
    const d = await r.json().catch(() => ({}));
    setState(!r.ok ? "error" : d.mode === "demo" ? "demo" : "ok");
  };
  if (state === "ok" || state === "demo") return <p className="rounded-[2px] bg-sage-soft p-5">Merci ! {state === "demo" ? "Mode démo : le service e-mail n'est pas configuré, le message n'a pas été transmis." : "Nous te répondons sous 48 h ouvrées."}</p>;
  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <div><label className="label" htmlFor="cn">Nom</label><input id="cn" className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
      <div><label className="label" htmlFor="ce">E-mail</label><input id="ce" type="email" required className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
      <div><label className="label" htmlFor="cs">Sujet</label><select id="cs" className="input" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })}>{["Question produit", "Ma commande", "Retour / remboursement", "SKINCLEAN Club", "Autre"].map((x) => <option key={x}>{x}</option>)}</select></div>
      <div><label className="label" htmlFor="co">N° de commande (facultatif)</label><input id="co" className="input" value={f.order} onChange={(e) => setF({ ...f, order: e.target.value })} /></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="cm">Message</label><textarea id="cm" required rows={5} className="input" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></div>
      {state === "error" && <p className="text-sm text-[#a14d5f] sm:col-span-2">Merci de vérifier les champs.</p>}
      <button disabled={state === "sending"} className="btn btn-primary sm:justify-self-start">{state === "sending" ? "Envoi…" : "Envoyer"}</button>
    </form>
  );
}
