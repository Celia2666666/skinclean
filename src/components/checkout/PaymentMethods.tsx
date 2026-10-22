"use client";
import { motion } from "framer-motion";
import { LockIcon } from "@/components/ui/Icons";

export type PaymentMethod = "card" | "apple-pay" | "google-pay";

export const paymentMethodLabel: Record<PaymentMethod, string> = {
  card: "Carte bancaire",
  "apple-pay": "Apple Pay",
  "google-pay": "Google Pay",
};

/* Logos des moyens de paiement (marques de leurs propriétaires, affichées comme sur toute boutique qui les accepte). */

export const AppleLogo = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
  </svg>
);

export const GoogleLogo = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const Badge = ({ children, label }: { children: React.ReactNode; label: string }) => (
  <span title={label} aria-label={label} className="inline-flex h-7 min-w-[44px] items-center justify-center rounded-[4px] border border-line bg-white px-1.5">{children}</span>
);

export const VisaBadge = () => <Badge label="Visa"><span className="text-[0.8rem] font-black italic tracking-tight text-[#1A1F71]">VISA</span></Badge>;
export const MastercardBadge = () => (
  <Badge label="Mastercard">
    <svg viewBox="0 0 32 20" className="h-4 w-7" aria-hidden><circle cx="12" cy="10" r="8" fill="#EB001B" /><circle cx="20" cy="10" r="8" fill="#F79E1B" /><path d="M16 3.8a8 8 0 0 1 0 12.4 8 8 0 0 1 0-12.4z" fill="#FF5F00" /></svg>
  </Badge>
);
export const CBBadge = () => (
  <Badge label="Carte Bancaire"><span className="rounded-[2px] bg-gradient-to-br from-[#1B9AD6] to-[#0E6E3A] px-1.5 text-[0.7rem] font-bold leading-[1.4] text-white">CB</span></Badge>
);
export const ApplePayBadge = () => <Badge label="Apple Pay"><span className="flex items-center gap-[1px] text-[0.78rem] font-semibold text-black"><AppleLogo className="h-3.5 w-3.5" />Pay</span></Badge>;
export const GooglePayBadge = () => <Badge label="Google Pay"><span className="flex items-center gap-[2px] text-[0.78rem] font-medium text-[#5F6368]"><GoogleLogo className="h-3.5 w-3.5" />Pay</span></Badge>;

/** Rangée de logos « moyens de paiement acceptés ». */
export function PaymentLogos({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <CBBadge /><VisaBadge /><MastercardBadge /><ApplePayBadge /><GooglePayBadge />
    </div>
  );
}

/** Sélecteur du moyen de paiement (cases radio présentées en tuiles). */
export function PaymentMethodPicker({ value, onChange }: { value: PaymentMethod; onChange: (m: PaymentMethod) => void }) {
  const options: { id: PaymentMethod; title: string; hint: string; logos: React.ReactNode }[] = [
    { id: "card", title: "Carte bancaire", hint: "CB, Visa, Mastercard", logos: <><CBBadge /><VisaBadge /><MastercardBadge /></> },
    { id: "apple-pay", title: "Apple Pay", hint: "iPhone, iPad, Mac avec Safari", logos: <ApplePayBadge /> },
    { id: "google-pay", title: "Google Pay", hint: "Android, Chrome", logos: <GooglePayBadge /> },
  ];
  return (
    <div role="radiogroup" aria-label="Moyen de paiement" className="divide-y divide-line overflow-hidden rounded-[2px] border border-line bg-cream">
      {options.map((o) => {
        const on = value === o.id;
        return (
          <label key={o.id} className={`flex cursor-pointer items-center gap-3 px-4 py-3.5 transition ${on ? "bg-white" : "hover:bg-white/60"}`}>
            <input type="radio" name="payment-method" value={o.id} checked={on} onChange={() => onChange(o.id)} className="h-4 w-4 accent-[#24392F]" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{o.title}</span>
              <span className="block text-xs text-forest-soft">{o.hint}</span>
            </span>
            <span className="flex shrink-0 gap-1">{o.logos}</span>
          </label>
        );
      })}
    </div>
  );
}

/** Bouton de validation, au style de chaque moyen de paiement (comme les boutons officiels Apple Pay / Google Pay). */
export function PayButton({ method, amount, loading, disabled, test }: { method: PaymentMethod; amount: string; loading?: boolean; disabled?: boolean; test?: boolean }) {
  const base = "flex w-full items-center justify-center gap-2 rounded-[6px] py-4 text-base font-medium transition disabled:opacity-50";
  const suffix = test ? <span className="ml-1 text-xs font-normal opacity-70">(commande de test)</span> : null;
  if (loading) return <button disabled className={`${base} bg-forest text-ivory`}>Redirection…</button>;
  if (method === "apple-pay")
    return (
      <motion.button whileTap={{ scale: 0.98 }} disabled={disabled} aria-label={`Payer ${amount} avec Apple Pay`} className={`${base} bg-black text-white hover:bg-[#1d1d1f]`}>
        Payer avec <span className="flex items-center text-lg font-semibold"><AppleLogo className="mr-[1px] h-5 w-5" />Pay</span>{suffix}
      </motion.button>
    );
  if (method === "google-pay")
    return (
      <motion.button whileTap={{ scale: 0.98 }} disabled={disabled} aria-label={`Payer ${amount} avec Google Pay`} className={`${base} bg-black text-white hover:bg-[#202124]`}>
        Payer avec <span className="flex items-center gap-1 text-lg font-medium"><span className="grid h-6 w-6 place-items-center rounded-full bg-white"><GoogleLogo className="h-4 w-4" /></span>Pay</span>{suffix}
      </motion.button>
    );
  return (
    <motion.button whileTap={{ scale: 0.98 }} disabled={disabled} className={`${base} bg-forest text-ivory hover:bg-forest/90`}>
      <LockIcon size={18} /> Payer {amount}{suffix}
    </motion.button>
  );
}
