import "server-only";
import { ymdhm } from "@/lib/hub/dates";
import { baseProducts } from "@/data/products";
import { all, crmUid, save } from "./db";
import { ensureCrmSeeded } from "./repo";
import type { Ticket } from "./types";

/**
 * Données entrantes depuis le site public vers le CRM local : questions du Glow Assistant (anonymes),
 * alertes de retour en stock, messages de contact. Le CRM n'existe qu'en local : sur Vercel, rien n'est stocké.
 */
export const crmInboundAvailable = () => !process.env.VERCEL;
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
