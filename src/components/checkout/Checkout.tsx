"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CartLines, PromoAndRewards, TotalsBlock, useCartTotals } from "@/components/layout/CartContent";
import { useAccount, useHydrated, useStore } from "@/lib/store";
import { LockIcon } from "@/components/ui/Icons";
import { AppleLogo, GoogleLogo, PayButton, PaymentMethodPicker, paymentMethodLabel, type PaymentMethod } from "./PaymentMethods";

type Status = { stripe: boolean; stripeTest: boolean; email: boolean };

/**
 * Paiement.
 * - Stripe configuré → redirection vers Stripe Checkout (CB, Apple Pay, Google Pay selon activation du compte).
 * - Sinon → aucune simulation de paiement : seule une « commande de test » explicitement non payée est possible.
 */
export function Checkout() {
  const router = useRouter();
  const search = useSearchParams();
  const h = useHydrated();
  const t = useCartTotals();
  const acc = useAccount();
  const cart = useStore((s) => s.cart);
  const promoCode = useStore((s) => s.promoCode);
  const welcomeCodes = useStore((s) => s.welcomeCodes);
  const recordOrder = useStore((s) => s.recordOrder);
  const clearCart = useStore((s) => s.clearCart);
  const [status, setStatus] = useState<Status>();
  const [form, setForm] = useState({ email: "", firstName: "", lastName: "", line1: "", zip: "", city: "", country: "France", phone: "", cgv: false });
  const [method, setMethod] = useState<PaymentMethod>("card");
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => { fetch("/api/status").then((r) => r.json()).then(setStatus).catch(() => setStatus({ stripe: false, stripeTest: false, email: false })); }, []);
  useEffect(() => {
    if (acc) {
      const a = acc.addresses.find((x) => x.isDefault) ?? acc.addresses[0];
      setForm((f) => ({ ...f, email: acc.email, firstName: acc.firstName, lastName: acc.lastName, ...(a ? { line1: a.line1, zip: a.zip, city: a.city, country: a.country, phone: a.phone ?? "" } : {}) }));
    }
  }, [acc]);

  if (!h) return <div className="min-h-[60vh]" />;
  if (t.itemCount === 0) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <p className="font-display text-4xl">Ton panier est vide</p>
        <Link href="/soins-visage" className="btn btn-primary mt-6">Découvrir les soins</Link>
      </div>
    );
  }

  const voucher = promoCode ? welcomeCodes.find((c) => c.code === promoCode)?.voucher : undefined;
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const snapshot = () => ({
    email: form.email,
    lines: t.lines.map((l) => ({ productId: l.line.productId, variantId: l.line.variantId, name: l.name, size: l.size, qty: l.line.qty, unit: l.unit, bundle: l.line.bundle?.name })),
    subtotal: t.subtotal, discount: t.bundleDiscount + t.codeDiscount + t.rewardDiscount, shipping: t.shipping, total: t.total, leaves: t.leavesEarned,
    paymentMethod: method, gift: t.gift?.name, code: t.codeDiscount > 0 ? promoCode : undefined,
    address: { id: "a", name: `${form.firstName} ${form.lastName}`, line1: form.line1, zip: form.zip, city: form.city, country: form.country, phone: form.phone },
  });

  const payStripe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (t.rewardDiscount > 0) {
      // Le solde de feuilles n'est vérifiable côté serveur qu'avec la base de données.
      setError("L'échange de feuilles lors d'un paiement réel sera actif une fois la base de données branchée (voir README). Retire la récompense pour continuer.");
      return;
    }
    setLoading(true);
    setError(undefined);
    try { sessionStorage.setItem("sc-pending-order", JSON.stringify(snapshot())); } catch {}
    const r = await fetch("/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: form.email, voucher, lines: cart.filter((l) => !l.gift).map((l) => ({ productId: l.productId, variantId: l.variantId, qty: l.qty, bundleId: l.bundle?.id })) }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.url) { setError(d.error ?? "Le paiement n'a pas pu démarrer."); setLoading(false); return; }
    window.location.href = d.url;
  };

  const testOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const o = recordOrder({ ...snapshot(), status: "test", paymentMode: "test" });
    clearCart();
    router.push(`/commande/confirmation?test=${o.id}`);
  };

  return (
    <div className="mx-auto max-w-[1300px] px-4 py-12 md:px-8">
      <h1 className="flex items-center gap-3 font-display text-5xl"><LockIcon size={34} /> Paiement sécurisé</h1>
      {search.get("annule") && <p className="mt-4 rounded-[2px] bg-butter p-4 text-sm">Le paiement a été annulé : aucune somme n&apos;a été débitée. Ton panier est intact.</p>}
      <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <form ref={formRef} onSubmit={status?.stripe ? payStripe : testOrder} className="space-y-8">
          <div className="rounded-none bg-ivory p-6">
            <p className="text-center text-xs font-medium uppercase tracking-[0.08em] text-forest-soft">Paiement express</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => { setMethod("apple-pay"); formRef.current?.requestSubmit(); }} aria-label="Payer avec Apple Pay" className="flex h-12 items-center justify-center rounded-[6px] bg-black text-xl font-semibold text-white transition hover:bg-[#1d1d1f]">
                <AppleLogo className="mr-[2px] h-6 w-6" />Pay
              </button>
              <button type="button" onClick={() => { setMethod("google-pay"); formRef.current?.requestSubmit(); }} aria-label="Payer avec Google Pay" className="flex h-12 items-center justify-center gap-1.5 rounded-[6px] bg-black text-xl font-medium text-white transition hover:bg-[#202124]">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white"><GoogleLogo className="h-[18px] w-[18px]" /></span>Pay
              </button>
            </div>
            <p className="mt-3 flex items-center gap-3 text-xs text-forest-soft before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">ou remplis tes informations</p>
          </div>
          <fieldset className="space-y-3 rounded-none bg-ivory p-6">
            <legend className="mb-2 font-display text-2xl">1. Coordonnées</legend>
            {!acc && <p className="text-sm text-forest-soft">Déjà client·e ? <Link href="/compte/connexion?retour=/paiement" className="underline">Connecte-toi</Link> pour cumuler tes feuilles.</p>}
            <div><label className="label" htmlFor="email">E-mail</label><input id="email" type="email" required className="input" value={form.email} onChange={set("email")} autoComplete="email" /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="label" htmlFor="fn">Prénom</label><input id="fn" required className="input" value={form.firstName} onChange={set("firstName")} autoComplete="given-name" /></div>
              <div><label className="label" htmlFor="ln">Nom</label><input id="ln" required className="input" value={form.lastName} onChange={set("lastName")} autoComplete="family-name" /></div>
            </div>
          </fieldset>
          <fieldset className="space-y-3 rounded-none bg-ivory p-6">
            <legend className="mb-2 font-display text-2xl">2. Livraison</legend>
            <div><label className="label" htmlFor="a1">Adresse</label><input id="a1" required className="input" value={form.line1} onChange={set("line1")} autoComplete="address-line1" /></div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div><label className="label" htmlFor="zip">Code postal</label><input id="zip" required className="input" value={form.zip} onChange={set("zip")} autoComplete="postal-code" /></div>
              <div><label className="label" htmlFor="city">Ville</label><input id="city" required className="input" value={form.city} onChange={set("city")} autoComplete="address-level2" /></div>
              <div><label className="label" htmlFor="country">Pays</label><input id="country" required className="input" value={form.country} onChange={set("country")} autoComplete="country-name" /></div>
            </div>
            <div><label className="label" htmlFor="tel">Téléphone (suivi colis)</label><input id="tel" className="input" value={form.phone} onChange={set("phone")} autoComplete="tel" /></div>
          </fieldset>
          <fieldset className="space-y-4 rounded-none bg-ivory p-6">
            <legend className="mb-2 font-display text-2xl">3. Paiement</legend>
            <PaymentMethodPicker value={method} onChange={setMethod} />
            {status === undefined ? <p className="text-sm">Vérification du moyen de paiement…</p> : status.stripe ? (
              <p className="flex items-start gap-2 text-sm text-forest-soft"><LockIcon size={16} />
                {method === "card"
                  ? "Tu saisiras ta carte sur la page de paiement sécurisée Stripe (authentification 3D Secure par ta banque)."
                  : `La fenêtre ${paymentMethodLabel[method]} s'ouvrira sur la page de paiement sécurisée Stripe, sur les appareils compatibles.`}
                {status.stripeTest && <b> Mode test Stripe : utilise une carte de test, aucun débit réel.</b>}
              </p>
            ) : (
              <div className="rounded-[2px] bg-sage-soft p-4 text-sm">
                <p><b>Site de démonstration :</b> aucun paiement réel n&apos;est effectué. Le bouton ci-dessous passe une <b>commande de test</b> ({paymentMethodLabel[method]}) pour tester le parcours (fidélité, historique). Elle sera marquée « non payée ».</p>
              </div>
            )}
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" required checked={form.cgv} onChange={set("cgv")} className="mt-1 accent-[#24392F]" />
              <span>J&apos;accepte les <Link href="/legal/cgv" className="underline" target="_blank">conditions générales de vente</Link> et j&apos;ai lu la <Link href="/legal/confidentialite" className="underline" target="_blank">politique de confidentialité</Link>.</span>
            </label>
            {error && <p className="text-sm text-[#a14d5f]">{error}</p>}
            <PayButton method={method} amount={`${t.total.toFixed(2).replace(".", ",")} €`} loading={loading} disabled={!status} test={status ? !status.stripe : false} />
          </fieldset>
        </form>
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-none bg-ivory p-6">
            <p className="font-display text-2xl">Récapitulatif</p>
            <CartLines editable={false} />
            <div className="mt-4 space-y-4"><PromoAndRewards /><TotalsBlock /></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
