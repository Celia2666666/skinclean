import "server-only";
import { all } from "./db";
import { customersOf, ordersOf } from "./repo";
import { ORDER_STATUS_LABEL, type DataSource } from "./types";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Recherche globale (⌘K) : clients, commandes, produits, opportunités B2B. */
export function crmSearch(q: string, source: DataSource) {
  const n = norm(q.trim());
  if (n.length < 2) return [];
  const eur = (x: number) => x.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
  const customers = customersOf(source).filter((c) => norm(`${c.firstName} ${c.lastName} ${c.email} ${c.city}`).includes(n)).slice(0, 6)
    .map((c) => ({ kind: "Client", label: `${c.firstName} ${c.lastName}`, sub: `${c.email} · ${c.city}`, href: `/crm/clients/${c.id}` }));
  const orders = ordersOf(source).filter((o) => norm(`${o.number} ${o.email} ${o.customerName}`).includes(n)).slice(-6).reverse()
    .map((o) => ({ kind: "Commande", label: `${o.number} — ${eur(o.total)}`, sub: `${o.customerName} · ${o.createdAt.slice(0, 10).split("-").reverse().join("/")} · ${ORDER_STATUS_LABEL[o.status]}`, href: `/crm/ventes?id=${o.id}` }));
  const products = all("stock").filter((s) => norm(`${s.name} ${s.category}`).includes(n)).slice(0, 5)
    .map((s) => ({ kind: "Produit", label: `${s.name} — ${s.size}`, sub: `${s.qty} en stock · ${s.category}`, href: `/crm/stock?id=${encodeURIComponent(s.id)}` }));
  const deals = all("deals").filter((d) => norm(`${d.company} ${d.contact} ${d.city}`).includes(n)).slice(0, 4)
    .map((d) => ({ kind: "B2B", label: d.company, sub: `${d.contact} · ${eur(d.amount)}`, href: `/crm/pipeline?id=${d.id}` }));
  return [...orders.filter(() => /\d/.test(n)), ...customers, ...products, ...deals, ...orders.filter(() => !/\d/.test(n))].slice(0, 14);
}
