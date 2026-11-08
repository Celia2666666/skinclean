import "server-only";
import { HttpError } from "@/lib/hub/auth";
import { all } from "./db";
import { cartsOf, customersOf, ordersOf, settings, spendOf } from "./repo";
import { customerStats, economics, lastMonths, pnl, stockRows } from "./analytics";
import { CHANNEL_SHORT, ORDER_STATUS_LABEL, RFM_LABEL, type DataSource } from "./types";

/** Exports CSV (séparateur « ; », BOM UTF-8 : s'ouvrent directement dans Excel en français). */
const cell = (v: unknown) => {
  const s = v === undefined || v === null ? "" : typeof v === "number" ? String(Math.round(v * 100) / 100).replace(".", ",") : String(v);
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (head: string[], rows: unknown[][]) => "﻿" + [head, ...rows].map((r) => r.map(cell).join(";")).join("\n");

export function crmExport(kind: string, source: DataSource, q: URLSearchParams) {
  const s = settings();
  const from = q.get("from") ?? "0000", to = q.get("to") ?? "9999";
  if (kind === "commandes") {
    const os = ordersOf(source).filter((o) => o.createdAt.slice(0, 10) >= from && o.createdAt.slice(0, 10) <= to);
    return csv(["Numéro", "Date", "Client", "E-mail", "Statut", "Canal", "Articles", "Sous-total TTC", "Remise", "Code promo", "Livraison", "Total TTC", "Remboursé", "CA HT", "Coût marchandises", "Marge brute", "Marge de contribution", "Ville"],
      os.map((o) => { const e = economics(o, s); return [o.number, o.createdAt.replace("T", " "), o.customerName, o.email, ORDER_STATUS_LABEL[o.status], CHANNEL_SHORT[o.channel], o.items.reduce((n, i) => n + i.qty, 0), o.subtotal, o.discount, o.promoCode, o.shipping, o.total, o.refunded ?? 0, e.ht, e.cogs, e.gross, e.contribution, o.city]; }));
  }
  if (kind === "clients") {
    const st = customerStats(customersOf(source), ordersOf(source));
    return csv(["Nom", "E-mail", "Ville", "Canal d'acquisition", "Inscription", "Commandes", "CA TTC", "Panier moyen", "Dernière commande", "Segment RFM", "Score R", "Score F", "Score M", "Niveau Club", "Opt-in e-mail", "Tags"],
      st.map((c) => [c.name, c.email, c.city, CHANNEL_SHORT[c.channel], c.createdAt.slice(0, 10), c.orders, c.revenue, c.aov, c.last?.slice(0, 10), c.segment ? RFM_LABEL[c.segment] : "Prospect", c.r, c.f, c.m, c.tier, c.optinEmail ? "oui" : "non", c.tags.join(", ")]));
  }
  if (kind === "stock") {
    const rows = stockRows(all("stock"), ordersOf(source), all("purchaseOrders"));
    return csv(["Produit", "Format", "Catégorie", "Stock", "Point de commande", "Stock de sécurité", "Ventes 30 j", "Couverture (jours)", "Rupture estimée", "Statut", "Classe ABC", "Coût unitaire HT", "Valeur du stock", "En commande", "Réassort suggéré", "Fournisseur"],
      rows.map((r) => [r.name, r.size, r.category, r.qty, r.reorderPoint, r.safetyStock, r.sold30, r.coverDays, r.stockoutDate, r.status, r.abc, r.cost, r.value, r.incoming, r.suggested, r.supplier]));
  }
  if (kind === "rentabilite") {
    const p = pnl(ordersOf(source), spendOf(source), s, lastMonths(12));
    return csv(["Mois", "CA TTC", "TVA", "CA HT", "Remises", "Coût des marchandises", "Marge brute", "Logistique", "Frais de paiement", "Marketing", "Marge de contribution", "Charges fixes", "Résultat (EBITDA)", "Commandes"],
      p.map((m) => [m.month, m.revenue, m.vat, m.ht, m.discounts, m.cogs, m.gross, m.logistics, m.fees, m.marketing, m.contribution, m.fixed, m.ebitda, m.orders]));
  }
  if (kind === "paniers") {
    return csv(["Date", "Contact", "E-mail", "Étape", "Valeur", "Statut", "Relances", "Articles"],
      cartsOf(source).map((c) => [c.createdAt.replace("T", " "), c.name, c.email, c.step, c.value, c.status, c.relaunches.length, c.items.map((i) => `${i.qty}× ${i.name}`).join(" + ")]));
  }
  throw new HttpError(404, "Export inconnu.");
}
