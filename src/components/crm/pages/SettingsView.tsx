"use client";
import { useState } from "react";
import { Button, Card, Field, PageHeader, useConfirm } from "@/components/hub/ui";
import { DownloadI, PlusI, TrashI } from "@/components/hub/icons";
import { eur } from "../charts";
import { Pill, useCrmAction } from "../ui";
import type { CrmSettings } from "@/lib/crm/types";

export function SettingsView({ settings, source, hasReal, stripe, webhook }: { settings: CrmSettings; source: "demo" | "reel"; hasReal: boolean; stripe: boolean; webhook: boolean }) {
  const [s, setS] = useState(settings);
  const { run, busy } = useCrmAction();
  const { ask, dialog } = useConfirm();
  const num = (k: keyof CrmSettings) => ({ value: String(s[k] ?? ""), onChange: (e: React.ChangeEvent<HTMLInputElement>) => setS({ ...s, [k]: e.target.value as unknown as number }) });
  const fixed = s.fixedCosts.reduce((a, f) => a + (Number(f.amount) || 0), 0);
  return (
    <>
      <PageHeader eyebrow="CRM" title="Paramètres & exports" intro="Hypothèses de calcul de la rentabilité, objectif commercial, connexion des données réelles et exports." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Hypothèses de rentabilité" subtitle="Utilisées par le tableau de bord, la fiche commande et le compte de résultat"
          action={<Button variant="primary" size="sm" disabled={busy} onClick={() => run("settings/save", { settings: s }, "Paramètres enregistrés")}>Enregistrer</Button>}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Objectif de CA mensuel (€ TTC)"><input className="hub-input" type="number" min={0} {...num("monthlyTarget")} /></Field>
            <Field label="TVA (%)"><input className="hub-input" type="number" min={0} step={0.1} {...num("vatRate")} /></Field>
            <Field label="Frais de paiement (%)" hint="Stripe : 1,5 % + 0,25 € (cartes européennes)"><input className="hub-input" type="number" min={0} step={0.01} {...num("paymentFeePct")} /></Field>
            <Field label="Frais fixes par paiement (€)"><input className="hub-input" type="number" min={0} step={0.01} {...num("paymentFeeFixed")} /></Field>
            <Field label="Coût d'expédition réel (€ / colis)"><input className="hub-input" type="number" min={0} step={0.01} {...num("shippingCost")} /></Field>
            <Field label="Emballage (€ / colis)"><input className="hub-input" type="number" min={0} step={0.01} {...num("packagingCost")} /></Field>
          </div>
          <p className="hub-label mt-5">Charges fixes mensuelles · {eur(fixed)}</p>
          <ul className="space-y-2">
            {s.fixedCosts.map((f, i) => (
              <li key={i} className="flex gap-2">
                <input className="hub-input flex-1" value={f.label} aria-label="Libellé" onChange={(e) => setS({ ...s, fixedCosts: s.fixedCosts.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                <input className="hub-input w-28 text-right" type="number" min={0} value={f.amount} aria-label="Montant" onChange={(e) => setS({ ...s, fixedCosts: s.fixedCosts.map((x, j) => (j === i ? { ...x, amount: Number(e.target.value) } : x)) })} />
                <button className="hub-btn hub-btn-ghost" aria-label="Supprimer" onClick={() => setS({ ...s, fixedCosts: s.fixedCosts.filter((_, j) => j !== i) })}><TrashI size={15} /></button>
              </li>
            ))}
          </ul>
          <Button size="sm" className="mt-2" icon={<PlusI size={14} />} onClick={() => setS({ ...s, fixedCosts: [...s.fixedCosts, { label: "Nouvelle charge", amount: 0 }] })}>Ajouter une charge</Button>
          <p className="mt-3 text-xs text-forest-soft">Les coûts de revient par produit se règlent dans Stock & réassort (fiche de chaque référence).</p>
        </Card>
        <div className="space-y-6">
          <Card title="Données réelles (Stripe)">
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">Clé Stripe (STRIPE_SECRET_KEY) <Pill tone={stripe ? "ok" : "neutral"}>{stripe ? "configurée" : "absente"}</Pill></li>
              <li className="flex justify-between">Webhook (STRIPE_WEBHOOK_SECRET) <Pill tone={webhook ? "ok" : "neutral"}>{webhook ? "configuré" : "absent"}</Pill></li>
              <li className="flex justify-between">Commandes réelles enregistrées <Pill tone={hasReal ? "ok" : "neutral"}>{hasReal ? "oui" : "aucune"}</Pill></li>
              <li className="flex justify-between">Jeu affiché <Pill tone={source === "demo" ? "warn" : "dark"}>{source === "demo" ? "Démonstration" : "Données réelles"}</Pill></li>
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-forest-soft">Chaque paiement confirmé par le webhook Stripe (<code>checkout.session.completed</code>) crée la commande et la fiche client réelles dans le CRM et décrémente le stock. Pour tester en local : <code>stripe listen --forward-to localhost:3200/api/stripe/webhook</code>. Les données réelles et de démonstration ne sont jamais additionnées.</p>
          </Card>
          <Card title="Adresse de démonstration" subtitle="Où arrivent les e-mails envoyés aux contacts fictifs (@example.com)"
            action={<Button variant="primary" size="sm" disabled={busy} onClick={() => run("settings/save", { settings: { demoInbox: s.demoInbox ?? "", redirectDemo: !!s.redirectDemo } }, "Adresse de démo enregistrée")}>Enregistrer</Button>}>
            <Field label="Adresse de démo" hint="Par défaut demo@skinclean.example (fictive). Mets ta propre adresse pour recevoir les e-mails de démo."><input className="hub-input" type="email" placeholder="demo@skinclean.example" value={s.demoInbox ?? ""} onChange={(e) => setS({ ...s, demoInbox: e.target.value })} /></Field>
            <label className="mt-3 flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={!!s.redirectDemo} onChange={(e) => setS({ ...s, redirectDemo: e.target.checked })} /><span>Envoyer réellement une copie à cette adresse <span className="block text-xs text-forest-soft">Nécessite RESEND_API_KEY. L'objet est préfixé « [Démo → destinataire] ». Sinon les e-mails restent visibles uniquement dans la Boîte mail de démo.</span></span></label>
            <a href="/crm/boite-demo" className="mt-3 inline-block text-sm underline">Ouvrir la boîte mail de démo</a>
          </Card>
          <Card title="Exports CSV" subtitle="Séparateur « ; », s'ouvrent directement dans Excel">
            <div className="flex flex-wrap gap-2">
              {[["commandes", "Commandes"], ["clients", "Clients + segments RFM"], ["stock", "Stock & réassort"], ["rentabilite", "Compte de résultat"], ["paniers", "Paniers abandonnés"]].map(([k, l]) => <a key={k} className="hub-btn hub-btn-secondary hub-btn-sm" href={`/api/crm/export/${k}`}><DownloadI size={14} />{l}</a>)}
            </div>
          </Card>
          <Card title="Jeu de démonstration">
            <p className="text-sm text-forest-soft">Régénère les ~14 mois de données fictives à partir du catalogue actuel (dates recalées sur aujourd'hui). Les modifications faites sur les données de démonstration (statuts, notes, tâches, opportunités) sont perdues ; les commandes réelles sont conservées.</p>
            <Button className="mt-3" variant="danger" disabled={busy} onClick={async () => { if (await ask("Régénérer la démonstration ?", "Toutes les données fictives seront recréées. Les données réelles ne sont pas touchées.", "Régénérer", true)) run("demo/reset", {}, "Jeu de démonstration régénéré"); }}>Régénérer la démonstration</Button>
          </Card>
        </div>
      </div>
      {dialog}
    </>
  );
}
