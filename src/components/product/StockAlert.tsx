"use client";
import { useState } from "react";
import { getProducts } from "@/lib/catalog";

/**
 * « Me prévenir du retour en stock » : enregistre l'e-mail dans le CRM (automatisation « Retour en stock »).
 * Utilisé sur la fiche produit (produit en rupture) et dans le Glow Assistant.
 */
export function StockAlertForm({ productId, variantId, origin, compact = false }: { productId?: string; variantId?: string; origin: "fiche_produit" | "chatbot"; compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [pid, setPid] = useState(productId ?? "");
  const [state, setState] = useState<"idle" | "sending" | "ok" | "off" | "error">("idle");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    const r = await fetch("/api/alerte-stock", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, productId: pid, variantId, origin }) }).catch(() => null);
    const d = await r?.json().catch(() => ({}));
    setState(!r?.ok ? "error" : d?.mode === "saved" ? "ok" : "off");
  };
  if (state === "ok") return <p className="rounded-[2px] bg-sage-soft p-3 text-sm">C’est noté ! Tu recevras un e-mail dès que le produit sera de retour.</p>;
  if (state === "off") return <p className="rounded-[2px] bg-sage-soft p-3 text-sm">Mode démo : les alertes de retour en stock ne sont pas encore actives sur cette version du site.</p>;
  return (
    <form onSubmit={submit} className={compact ? "space-y-2" : "space-y-2 rounded-[2px] bg-sage-soft p-4"}>
      {!compact && <p className="text-sm font-semibold">Me prévenir du retour en stock</p>}
      {!productId && (
        <select required className="input py-2 text-sm" value={pid} onChange={(e) => setPid(e.target.value)} aria-label="Produit recherché">
          <option value="">Quel produit cherches-tu ?</option>
          {getProducts().map((p) => <option key={p.id} value={p.id}>{p.name} — {p.kind}</option>)}
        </select>
      )}
      <div className="flex gap-2">
        <input type="email" required className="input py-2 text-sm" placeholder="Ton e-mail" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="E-mail pour l'alerte" />
        <button disabled={state === "sending"} className="btn btn-primary shrink-0 px-4 py-2 text-xs">{state === "sending" ? "…" : "Me prévenir"}</button>
      </div>
      {state === "error" && <p className="text-xs text-[#a14d5f]">Vérifie ton e-mail et réessaie.</p>}
      <p className="text-[0.68rem] text-forest-soft">Un seul e-mail, au retour du produit. Ton adresse n’est utilisée que pour cette alerte.</p>
    </form>
  );
}
