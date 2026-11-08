import "server-only";
import { cookies } from "next/headers";
import { all, crmDb, crmMeta, crmUid, one, save } from "./db";
import type { CrmSettings, Customer, DataSource, Order } from "./types";

export const SOURCE_COOKIE = "crm_source";

/** Génère le jeu de démonstration au premier accès (ou après suppression du fichier). */
let seeding: Promise<void> | null = null;
export async function ensureCrmSeeded() {
  crmDb();
  if (crmMeta("seeded") && crmMeta("seed-extras-v1")) return;
  // Un seul remplissage même si la mise en page et la page le demandent en parallèle ; mise à niveau des bases existantes
  seeding ??= import("./seed").then((m) => { if (!crmMeta("seeded")) m.seedCrm(); else if (!crmMeta("seed-extras-v1")) m.seedCrmExtras(); }).finally(() => { seeding = null; });
  await seeding;
}

/** Jeu de données affiché : démonstration ou réel (jamais mélangés). Par défaut : réel s'il existe, sinon démo. */
export async function currentSource(): Promise<DataSource> {
  await ensureCrmSeeded();
  if (process.env.VERCEL) return "demo"; // en ligne : démonstration uniquement
  const c = (await cookies()).get(SOURCE_COOKIE)?.value;
  if (c === "demo" || c === "reel") return c;
  return all("orders").some((o) => o.source === "reel") ? "reel" : "demo";
}

export function hasRealData() {
  return all("orders").some((o) => o.source === "reel") || all("tickets").some((t) => t.source === "reel") || all("chats").some((c) => c.source === "reel") || all("alerts").some((a) => a.source === "reel");
}

export const ordersOf = (s: DataSource) => all("orders").filter((o) => o.source === s);
export const customersOf = (s: DataSource) => all("customers").filter((c) => c.source === s);
export const cartsOf = (s: DataSource) => all("carts").filter((c) => c.source === s);
export const ticketsOf = (s: DataSource) => all("tickets").filter((t) => t.source === s);
/** Trafic et dépenses n'existent qu'en démonstration (aucun outil d'analytics ni régie connectés). */
export const trafficOf = (s: DataSource) => (s === "demo" ? all("traffic") : []);
export const spendOf = (s: DataSource) => (s === "demo" ? all("spend") : []);

export function settings(): CrmSettings {
  return one("settings", "settings") ?? { id: "settings", vatRate: 20, paymentFeePct: 1.5, paymentFeeFixed: 0.25, shippingCost: 6.9, packagingCost: 1.1, monthlyTarget: 15000, fixedCosts: [] };
}

/* ───────── Données réelles : commandes Stripe ───────── */
type StripeLine = { description?: string | null; quantity?: number | null; amount_total?: number | null };
type StripeSession = {
  id: string; created: number; amount_total?: number | null; amount_subtotal?: number | null; customer_details?: { email?: string | null; name?: string | null; address?: { city?: string | null; postal_code?: string | null; country?: string | null } | null } | null;
  total_details?: { amount_discount?: number | null; amount_shipping?: number | null } | null; payment_method_types?: string[];
};

/**
 * Enregistre une commande RÉELLE payée via Stripe Checkout (appelé par le webhook, en local uniquement).
 * Les lignes sont rapprochées du catalogue par leur libellé « Nom — format » ; le stock du CRM est décrémenté.
 */
export async function ingestStripeSession(s: StripeSession, lines: StripeLine[]) {
  await ensureCrmSeeded();
  if (all("orders").some((o) => o.id === `stripe_${s.id}`)) return;
  const { baseProducts } = await import("@/data/products");
  const { categoryOf } = await import("./seed");
  const email = (s.customer_details?.email ?? "inconnu@stripe").toLowerCase();
  const at = new Date(s.created * 1000);
  const local = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, "0")}-${String(at.getDate()).padStart(2, "0")}T${String(at.getHours()).padStart(2, "0")}:${String(at.getMinutes()).padStart(2, "0")}`;
  let customer = all("customers").find((c) => c.source === "reel" && c.email === email);
  const isNew = !customer;
  if (!customer) {
    const [firstName, ...rest] = (s.customer_details?.name ?? email.split("@")[0]).split(" ");
    customer = save("customers", {
      id: crmUid("cus_r"), source: "reel", email, firstName, lastName: rest.join(" "), city: s.customer_details?.address?.city ?? "", region: s.customer_details?.address?.country ?? "", zip: s.customer_details?.address?.postal_code ?? "",
      createdAt: local, channel: "direct", skinType: "normale", concerns: [], birthYear: 0, optinEmail: false, optinSms: false, tags: ["Client Stripe"],
    } satisfies Customer);
  }
  const items = lines.map((l) => {
    const [name, size] = String(l.description ?? "").split(" — ");
    const p = baseProducts.find((x) => x.name === name);
    const v = p?.variants.find((x) => x.size === size) ?? p?.variants[0];
    const stockItem = p && v ? one("stock", `${p.id}:${v.id}`) : undefined;
    const qty = l.quantity ?? 1;
    if (stockItem) save("stock", { ...stockItem, qty: Math.max(0, stockItem.qty - qty), updatedAt: local });
    return { productId: p?.id ?? "inconnu", variantId: v?.id ?? "std", name: name || "Article", size: size ?? "", category: p ? categoryOf(p) : "Autres", qty, unit: (l.amount_total ?? 0) / 100 / qty, cost: stockItem?.cost ?? 0 };
  });
  const order: Order = {
    id: `stripe_${s.id}`, number: `WEB-${String(all("orders").filter((o) => o.source === "reel").length + 1).padStart(5, "0")}`, source: "reel", customerId: customer.id, email, customerName: `${customer.firstName} ${customer.lastName}`.trim(),
    createdAt: local, status: "payee", channel: "direct", device: "desktop", payment: s.payment_method_types?.includes("paypal") ? "paypal" : "carte", items,
    subtotal: (s.amount_subtotal ?? 0) / 100, discount: (s.total_details?.amount_discount ?? 0) / 100, shipping: (s.total_details?.amount_shipping ?? 0) / 100, total: (s.amount_total ?? 0) / 100,
    city: customer.city, region: customer.region, firstOrder: isNew, history: [{ at: local, status: "payee", note: `Session Stripe ${s.id}` }],
  };
  save("orders", order);
}
