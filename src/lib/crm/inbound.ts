import "server-only";
import { ymdhm } from "@/lib/hub/dates";
import { baseProducts } from "@/data/products";
import { all, crmUid, save } from "./db";
import { ensureCrmSeeded } from "./repo";
import type { Order, OrderItem, Ticket } from "./types";

/**
 * Données entrantes depuis le site public vers le CRM local : questions du Glow Assistant (anonymes),
 * alertes de retour en stock, messages de contact. En ligne (Vercel), la base est temporaire : ces données peuvent disparaître.
 */
/** Questions du chatbot, alertes et messages : enregistrés aussi en ligne (base temporaire de la démo). */
export const crmInboundAvailable = () => true;
/** Le stock du site ne suit celui du CRM qu'en local (en ligne, chaque instance a sa propre base temporaire). */
export const crmStockLive = () => !process.env.VERCEL;
const clip = (v: unknown, n: number) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);

export async function logChat(b: Record<string, unknown>) {
  if (!crmInboundAvailable()) return false;
  const text = clip(b.text, 300);
  if (!text) return false;
  await ensureCrmSeeded();
  // On masque les adresses e-mail et numéros éventuellement tapés dans la question (journal anonyme)
  const safe = text.replace(/[^\s@]+@[^\s@]+/g, "[e-mail]").replace(/(\+?\d[\d .-]{7,}\d)/g, "[numéro]");
  save("chats", { id: crmUid("chat_"), source: "reel", at: ymdhm(new Date()), session: clip(b.session, 20) || "anonyme", text: safe, intent: clip(b.intent, 40) || "unknown", page: clip(b.page, 120) });
  return true;
}

export async function addStockAlert(b: Record<string, unknown>) {
  if (!crmInboundAvailable()) return false;
  await ensureCrmSeeded();
  const p = baseProducts.find((x) => x.id === b.productId);
  if (!p) throw new Error("Produit inconnu");
  const v = p.variants.find((x) => x.id === b.variantId);
  const email = clip(b.email, 200).toLowerCase();
  const dup = all("alerts").find((a) => a.email === email && a.productId === p.id && a.status === "en_attente");
  if (dup) return true;
  const customer = all("customers").find((c) => c.email === email);
  save("alerts", { id: crmUid("al_"), source: "reel", createdAt: ymdhm(new Date()), email, customerId: customer?.id, productId: p.id, variantId: v?.id, label: `${p.name}${v ? ` — ${v.size}` : ""}`, origin: b.origin === "chatbot" ? "chatbot" : "fiche_produit", status: "en_attente" });
  return true;
}

const CATEGORY: Record<string, Ticket["category"]> = { "Question produit": "produit", "Ma commande": "livraison", "Retour / remboursement": "retour", "SKINCLEAN Club": "compte" };
export async function addContactMessage(b: Record<string, unknown>) {
  if (!crmInboundAvailable()) return false;
  await ensureCrmSeeded();
  const email = clip(b.email, 200).toLowerCase();
  const customer = all("customers").find((c) => c.email === email);
  const order = b.order ? all("orders").find((o) => o.number.toLowerCase() === clip(b.order, 30).toLowerCase()) : undefined;
  const at = ymdhm(new Date());
  const n = all("tickets").length;
  save("tickets", {
    id: crmUid("tk_"), number: `MSG-${String(5000 + n)}`, source: "reel", customerId: customer?.id ?? "", customerName: clip(b.name, 80) || email.split("@")[0], email, orderId: order?.id,
    subject: clip(b.subject, 120) || "Message", category: CATEGORY[String(b.subject)] ?? "conseil", channel: b.origin === "chatbot" ? "chatbot" : "formulaire", priority: "normale", status: "ouvert",
    createdAt: at, messages: [{ at, from: "client", body: clip(b.message, 5000) }],
  });
  // Tri et réponse automatique immédiats (sans faire attendre le visiteur)
  void import("./automations").then((m) => m.runAutomations("sav_auto")).catch((e) => console.error("[SAV auto]", e));
  return true;
}

const PAYMENT: Record<string, Order["payment"]> = { card: "carte", "apple-pay": "apple_pay", "google-pay": "google_pay" };

/**
 * Commande passée sur la boutique en paiement simulé : elle arrive dans le CRM (commandes + fiche client)
 * et l'e-mail de confirmation est déposé dans la boîte de démo (/crm/boite-demo). Les prix viennent du catalogue.
 */
export async function addSiteOrder(b: Record<string, unknown>): Promise<{ number: string; mail: string } | false> {
  if (!crmInboundAvailable()) return false;
  await ensureCrmSeeded();
  const email = clip(b.email, 200).toLowerCase();
  const raw = Array.isArray(b.lines) ? (b.lines as Record<string, unknown>[]).slice(0, 40) : [];
  const stock = new Map(all("stock").map((s) => [s.id, s]));
  const items: OrderItem[] = [];
  for (const l of raw) {
    const p = baseProducts.find((x) => x.id === l.productId);
    const v = p?.variants.find((x) => x.id === l.variantId);
    if (!p || !v) continue;
    const s = stock.get(`${p.id}:${v.id}`);
    items.push({ productId: p.id, variantId: v.id, name: p.name, size: v.size, category: s?.category ?? "Soins", qty: Math.max(1, Math.min(10, Number(l.qty) || 1)), unit: v.price, cost: s?.cost ?? Math.round((v.price / 1.2) * 0.3 * 100) / 100 });
  }
  if (!items.length || !email.includes("@")) return false;
  const subtotal = Math.round(items.reduce((a, i) => a + i.unit * i.qty, 0) * 100) / 100;
  const num = (v: unknown, max: number) => Math.max(0, Math.min(max, Number(v) || 0));
  const shipping = num(b.shipping, 50);
  const discount = num(b.discount, subtotal);
  const total = Math.round(Math.max(0, subtotal - discount + shipping) * 100) / 100;
  const at = ymdhm(new Date());
  const address = (b.address ?? {}) as Record<string, unknown>;
  const [firstName, ...rest] = clip(address.name, 80).split(" ");
  let customer = all("customers").find((c) => c.email === email);
  if (!customer) {
    customer = { id: crmUid("cus_"), source: "reel", email, firstName: firstName || email.split("@")[0], lastName: rest.join(" "), city: clip(address.city, 60), region: "", zip: clip(address.zip, 10), createdAt: at, channel: "direct", skinType: "normale", concerns: [], birthYear: 0, optinEmail: false, optinSms: false, tags: ["Boutique en ligne", "Type de peau non renseigné"] };
    save("customers", customer);
  }
  const number = clip(b.id, 30) || `SC-${Date.now().toString(36).toUpperCase()}`;
  const firstOrder = !all("orders").some((o) => o.customerId === customer.id);
  save("orders", {
    id: crmUid("ord_"), number, source: "reel", customerId: customer.id, email, customerName: `${customer.firstName} ${customer.lastName}`.trim(), createdAt: at, status: "payee",
    channel: "direct", device: b.device === "mobile" ? "mobile" : "desktop", payment: PAYMENT[String(b.paymentMethod)] ?? "carte", items, subtotal, discount, promoCode: clip(b.code, 30) || undefined, shipping, total,
    city: customer.city, region: "", firstOrder, history: [{ at, status: "payee", note: "Paiement simulé sur la boutique (démo INSEEC)" }],
  });
  const euro = (n: number) => `${n.toFixed(2).replace(".", ",")} €`;
  const text = `Bonjour ${customer.firstName},\n\nMerci pour ta commande ${number} ! Voici son récapitulatif :\n${items.map((i) => `• ${i.name} (${i.size}) × ${i.qty} : ${euro(i.unit * i.qty)}`).join("\n")}\n\nLivraison : ${shipping ? euro(shipping) : "offerte"}${discount ? `\nRéduction : -${euro(discount)}` : ""}\nTotal TTC : ${euro(total)}\n\nPaiement simulé (projet étudiant INSEEC) : aucune somme n'a été débitée et la commande ne sera pas expédiée.`;
  const { deliver } = await import("./automations");
  const sent = await deliver(email, `Ta commande ${number} est confirmée`, text, { href: `${process.env.NEXT_PUBLIC_SITE_URL || "https://skinclean.vercel.app"}/compte/commandes`, label: "Suivre ma commande" }, "Boutique (commande)", "order");
  return { number, mail: sent.delivery };
}
