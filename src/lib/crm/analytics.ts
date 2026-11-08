import { addDays, diffDays, mondayOf, parseLocal, todayYmd } from "@/lib/hub/dates";
import type { Cart, Channel, CrmSettings, Customer, Lifecycle, Order, RfmSegment, Spend, StockItem, PurchaseOrder, Traffic } from "./types";

/**
 * Moteur d'indicateurs du CRM (fonctions pures, testables) : ventes, marges, clients (RFM, cohortes, LTV),
 * paniers abandonnés, stock (couverture, ABC, réassort), ventes croisées, compte de résultat et prévisions.
 * Conventions : CA TTC = montant encaissé moins remboursements ; les commandes annulées sont exclues.
 */

export const r2 = (n: number) => Math.round(n * 100) / 100;
const sum = <T,>(a: T[], f: (x: T) => number) => a.reduce((s, x) => s + f(x), 0);
export const pct = (a: number, b: number) => (b ? (a / b) * 100 : 0);
export const delta = (cur: number, prev: number) => (prev ? ((cur - prev) / Math.abs(prev)) * 100 : null);

/* ───────── Périodes ───────── */
export type PeriodKey = "7j" | "30j" | "90j" | "12m" | "mois" | "annee";
export const PERIODS: { id: PeriodKey; label: string }[] = [
  { id: "7j", label: "7 jours" }, { id: "30j", label: "30 jours" }, { id: "mois", label: "Mois en cours" }, { id: "90j", label: "90 jours" }, { id: "annee", label: "Année en cours" }, { id: "12m", label: "12 mois" },
];
export interface Period { key: PeriodKey; label: string; from: string; to: string; prevFrom: string; prevTo: string; days: number; grain: "day" | "week" | "month" }
export function resolvePeriod(key?: string, today = todayYmd()): Period {
  const k = (PERIODS.some((p) => p.id === key) ? key : "30j") as PeriodKey;
  let from: string;
  if (k === "mois") from = `${today.slice(0, 7)}-01`;
  else if (k === "annee") from = `${today.slice(0, 4)}-01-01`;
  else from = addDays(today, -({ "7j": 7, "30j": 30, "90j": 90, "12m": 365 } as Record<string, number>)[k] + 1);
  const days = diffDays(today, from) + 1;
  // Période de comparaison : même durée juste avant (ou même période l'an dernier pour l'année en cours)
  const prevTo = k === "annee" || k === "mois" ? (k === "annee" ? addDays(today, -365) : lastMonthSameDay(today)) : addDays(from, -1);
  const prevFrom = k === "annee" ? addDays(from, -365) : k === "mois" ? addDays(`${prevTo.slice(0, 7)}-01`, 0) : addDays(prevTo, -days + 1);
  return { key: k, label: PERIODS.find((p) => p.id === k)!.label, from, to: today, prevFrom, prevTo, days, grain: days <= 31 ? "day" : days <= 120 ? "week" : "month" };
}
function lastMonthSameDay(today: string) {
  const d = parseLocal(today);
  const target = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  const last = new Date(d.getFullYear(), d.getMonth(), 0).getDate();
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(Math.min(d.getDate(), last)).padStart(2, "0")}`;
}
export const inRange = (at: string, from: string, to: string) => at.slice(0, 10) >= from && at.slice(0, 10) <= to;

/* ───────── Économie d'une commande ───────── */
export const valid = (o: Order) => o.status !== "annulee";
export const netTtc = (o: Order) => (valid(o) ? o.total - (o.refunded ?? 0) : 0);
export function economics(o: Order, s: CrmSettings) {
  if (!valid(o)) return { ttc: 0, ht: 0, cogs: 0, fees: 0, logistics: 0, gross: 0, contribution: 0 };
  const refunded = (o.refunded ?? 0) >= o.total;
  const ttc = netTtc(o);
  const ht = ttc / (1 + s.vatRate / 100);
  const cogs = refunded ? 0 : sum(o.items, (i) => i.cost * i.qty);
  const fees = (o.total * s.paymentFeePct) / 100 + s.paymentFeeFixed; // non remboursés par le prestataire
  const logistics = s.shippingCost + s.packagingCost + (refunded ? s.shippingCost : 0);
  const gross = ht - cogs;
  return { ttc, ht, cogs, fees, logistics, gross, contribution: gross - fees - logistics };
}

export function salesKpis(orders: Order[], s: CrmSettings) {
  const v = orders.filter(valid);
  const e = v.map((o) => economics(o, s));
  const revenue = sum(e, (x) => x.ttc);
  const ht = sum(e, (x) => x.ht);
  const gross = sum(e, (x) => x.gross);
  const units = sum(v, (o) => sum(o.items, (i) => i.qty));
  return {
    revenue, ht, orders: v.length, aov: v.length ? revenue / v.length : 0, units, upo: v.length ? units / v.length : 0,
    newCustomers: v.filter((o) => o.firstOrder).length, returningShare: pct(v.filter((o) => !o.firstOrder).length, v.length),
    discount: sum(v, (o) => o.discount), discountRate: pct(sum(v, (o) => o.discount), sum(v, (o) => o.subtotal)),
    refunds: sum(v, (o) => o.refunded ?? 0), refundRate: pct(v.filter((o) => o.refunded).length, v.length),
    gross, grossRate: pct(gross, ht), cogs: sum(e, (x) => x.cogs), contribution: sum(e, (x) => x.contribution), fees: sum(e, (x) => x.fees), logistics: sum(e, (x) => x.logistics),
    cancelled: orders.length - v.length,
  };
}
export type SalesKpis = ReturnType<typeof salesKpis>;

/* ───────── Séries temporelles ───────── */
export function bucketKey(day: string, grain: Period["grain"]) {
  return grain === "day" ? day.slice(0, 10) : grain === "week" ? mondayOf(day.slice(0, 10)) : day.slice(0, 7);
}
export function buckets(from: string, to: string, grain: Period["grain"]) {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const k = bucketKey(d, grain);
    if (out.at(-1) !== k) out.push(k);
  }
  return out;
}
export function revenueSeries(orders: Order[], p: Period) {
  const keys = buckets(p.from, p.to, p.grain);
  const prevKeys = buckets(p.prevFrom, p.prevTo, p.grain);
  const cur = new Map<string, { rev: number; n: number }>();
  const prev = new Map<string, { rev: number; n: number }>();
  for (const o of orders) {
    if (!valid(o)) continue;
    const day = o.createdAt.slice(0, 10);
    const target = inRange(day, p.from, p.to) ? cur : inRange(day, p.prevFrom, p.prevTo) ? prev : null;
    if (!target) continue;
    const k = bucketKey(day, p.grain);
    const b = target.get(k) ?? { rev: 0, n: 0 };
    b.rev += netTtc(o);
    b.n++;
    target.set(k, b);
  }
  return {
    keys,
    revenue: keys.map((k) => r2(cur.get(k)?.rev ?? 0)),
    orders: keys.map((k) => cur.get(k)?.n ?? 0),
    prevRevenue: keys.map((_, i) => r2(prev.get(prevKeys[i])?.rev ?? 0)),
    prevOrders: keys.map((_, i) => prev.get(prevKeys[i])?.n ?? 0),
  };
}

/* ───────── Répartitions ───────── */
export function groupBy<T>(a: T[], key: (x: T) => string, val: (x: T) => number) {
  const m = new Map<string, number>();
  for (const x of a) m.set(key(x), (m.get(key(x)) ?? 0) + val(x));
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

export interface ProductPerf { productId: string; name: string; category: string; qty: number; revenue: number; ht: number; cogs: number; margin: number; marginRate: number; orders: number }
export function productPerformance(orders: Order[], s: CrmSettings): ProductPerf[] {
  const m = new Map<string, ProductPerf>();
  for (const o of orders) {
    if (!valid(o) || (o.refunded ?? 0) >= o.total) continue;
    const ratio = o.subtotal ? (o.subtotal - o.discount) / o.subtotal : 1;
    for (const i of o.items) {
      const p = m.get(i.productId) ?? { productId: i.productId, name: i.name, category: i.category, qty: 0, revenue: 0, ht: 0, cogs: 0, margin: 0, marginRate: 0, orders: 0 };
      const rev = i.unit * i.qty * ratio;
      p.qty += i.qty;
      p.revenue += rev;
      p.ht += rev / (1 + s.vatRate / 100);
      p.cogs += i.cost * i.qty;
      p.orders++;
      m.set(i.productId, p);
    }
  }
  return [...m.values()].map((p) => ({ ...p, revenue: r2(p.revenue), ht: r2(p.ht), cogs: r2(p.cogs), margin: r2(p.ht - p.cogs), marginRate: pct(p.ht - p.cogs, p.ht) })).sort((a, b) => b.revenue - a.revenue);
}

/** Commandes par jour de semaine (lundi = 0) × heure. */
export function heatmap(orders: Order[]) {
  const g = Array.from({ length: 7 }, () => Array(24).fill(0) as number[]);
  for (const o of orders) {
    if (!valid(o)) continue;
    const d = parseLocal(o.createdAt);
    g[(d.getDay() + 6) % 7][d.getHours()]++;
  }
  return g;
}

export function promoPerformance(orders: Order[]) {
  const m = new Map<string, { code: string; uses: number; revenue: number; discount: number; newCustomers: number }>();
  for (const o of orders) {
    if (!valid(o) || !o.promoCode) continue;
    const p = m.get(o.promoCode) ?? { code: o.promoCode, uses: 0, revenue: 0, discount: 0, newCustomers: 0 };
    p.uses++;
    p.revenue += netTtc(o);
    p.discount += o.discount;
    if (o.firstOrder) p.newCustomers++;
    m.set(o.promoCode, p);
  }
  return [...m.values()].sort((a, b) => b.revenue - a.revenue);
}

/** Ventes croisées : paires de produits achetés ensemble (support, confiance, lift). */
export function marketBasket(orders: Order[], names: Map<string, string>, top = 10) {
  const v = orders.filter((o) => valid(o) && !o.items.every((i) => i.kitId));
  const single = new Map<string, number>();
  const pairs = new Map<string, number>();
  for (const o of v) {
    const ids = [...new Set(o.items.filter((i) => !i.kitId).map((i) => i.productId))].sort();
    for (const a of ids) single.set(a, (single.get(a) ?? 0) + 1);
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) pairs.set(`${ids[i]}|${ids[j]}`, (pairs.get(`${ids[i]}|${ids[j]}`) ?? 0) + 1);
  }
  const n = v.length || 1;
  return [...pairs.entries()]
    .filter(([, c]) => c >= 5)
    .map(([k, c]) => {
      const [a, b] = k.split("|");
      const ca = single.get(a)!, cb = single.get(b)!;
      const [x, y] = ca >= cb ? [b, a] : [a, b]; // règle « produit le moins vendu → le plus vendu »
      return { a: names.get(x) ?? x, b: names.get(y) ?? y, count: c, support: pct(c, n), confidence: pct(c, single.get(x)!), lift: (c / n) / ((ca / n) * (cb / n)) };
    })
    .sort((p, q) => q.count * q.lift - p.count * p.lift)
    .slice(0, top);
}

/* ───────── Clients ───────── */
export interface CustomerStats {
  id: string; name: string; email: string; city: string; channel: Channel; createdAt: string; tags: string[];
  orders: number; revenue: number; aov: number; first?: string; last?: string; recencyDays: number | null; avgInterval: number | null; nextOrder?: string;
  r: number; f: number; m: number; segment: RfmSegment | null; lifecycle: Lifecycle; optinEmail: boolean; skinType: Customer["skinType"]; tier: string;
}
const SEGMENT_OF = (r: number, f: number): RfmSegment => {
  if (r >= 5 && f >= 4) return "champions";
  if (r >= 4 && f >= 5) return "champions";
  if (r >= 3 && f >= 3) return "fideles";
  if (r >= 4 && f >= 2) return "potentiels";
  if (r >= 5 && f === 1) return "nouveaux";
  if (r === 4 && f === 1) return "prometteurs";
  if (r === 3) return "attention";
  if (r <= 2 && f >= 5) return "a_ne_pas_perdre";
  if (r <= 2 && f >= 3) return "a_risque";
  if (r === 2) return "hibernants";
  return "perdus";
};
export const TIERS = [{ name: "Pousse", min: 0 }, { name: "Bourgeon", min: 300 }, { name: "Fleur", min: 700 }, { name: "Canopée", min: 1200 }];
export function customerStats(customers: Customer[], orders: Order[], today = todayYmd()): CustomerStats[] {
  const by = new Map<string, Order[]>();
  for (const o of orders) if (valid(o)) (by.get(o.customerId) ?? by.set(o.customerId, []).get(o.customerId)!).push(o);
  const year = addDays(today, -365);
  const rows = customers.map((c) => {
    const os = (by.get(c.id) ?? []).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const revenue = r2(sum(os, netTtc));
    const first = os[0]?.createdAt, last = os.at(-1)?.createdAt;
    const recencyDays = last ? diffDays(today, last) : null;
    const avgInterval = os.length > 1 ? diffDays(last!, first!) / (os.length - 1) : null;
    const leaves = Math.floor(sum(os.filter((o) => o.createdAt >= year), (o) => o.total - o.shipping));
    const r = recencyDays === null ? 0 : recencyDays <= 30 ? 5 : recencyDays <= 60 ? 4 : recencyDays <= 120 ? 3 : recencyDays <= 240 ? 2 : 1;
    const f = os.length === 0 ? 0 : os.length === 1 ? 1 : os.length === 2 ? 2 : os.length === 3 ? 3 : os.length <= 5 ? 4 : 5;
    return {
      id: c.id, name: `${c.firstName} ${c.lastName}`.trim(), email: c.email, city: c.city, channel: c.channel, createdAt: c.createdAt, tags: c.tags,
      orders: os.length, revenue, aov: os.length ? revenue / os.length : 0, first, last, recencyDays, avgInterval: avgInterval === null ? null : Math.round(avgInterval),
      nextOrder: avgInterval && last ? addDays(last.slice(0, 10), Math.round(Math.max(avgInterval, 20))) : undefined,
      r, f, m: 0, segment: os.length ? SEGMENT_OF(r, f) : null,
      lifecycle: (os.length === 0 ? (c.tags.some((t) => t.includes("Skin Diag")) ? "lead" : "abonne") : revenue >= 400 || os.length >= 6 ? "vip" : os.length >= 2 ? "fidele" : "client") as Lifecycle,
      optinEmail: c.optinEmail, skinType: c.skinType, tier: [...TIERS].reverse().find((t) => leaves >= t.min)!.name,
    };
  });
  // Score M par quintiles de montant (clients ayant commandé)
  const buyers = rows.filter((x) => x.orders).sort((a, b) => a.revenue - b.revenue);
  buyers.forEach((x, i) => (x.m = Math.min(5, Math.floor((i / buyers.length) * 5) + 1)));
  return rows;
}

export function cohorts(stats: CustomerStats[], orders: Order[], months = 12, today = todayYmd()) {
  const firstMonth = new Map<string, string>();
  for (const s of stats) if (s.first) firstMonth.set(s.id, s.first.slice(0, 7));
  const monthIndex = (m: string) => Number(m.slice(0, 4)) * 12 + Number(m.slice(5, 7)) - 1;
  const cur = monthIndex(today.slice(0, 7));
  const active = new Map<string, Set<string>>();
  for (const o of orders) {
    if (!valid(o)) continue;
    const fm = firstMonth.get(o.customerId);
    if (!fm) continue;
    const k = monthIndex(o.createdAt.slice(0, 7)) - monthIndex(fm);
    if (k <= 0) continue;
    const key = `${fm}|${k}`;
    (active.get(key) ?? active.set(key, new Set()).get(key)!).add(o.customerId);
  }
  const groups = groupBy([...firstMonth.values()], (m) => m, () => 1).sort((a, b) => a[0].localeCompare(b[0])).slice(-months);
  return groups.map(([m, size]) => ({
    month: m, size,
    retention: Array.from({ length: months }, (_, i) => (monthIndex(m) + i + 1 > cur ? null : pct(active.get(`${m}|${i + 1}`)?.size ?? 0, size))),
  }));
}

/** LTV, CAC et ROAS par canal d'acquisition. */
export function channelEconomics(stats: CustomerStats[], orders: Order[], spend: Spend[], from: string, to: string) {
  const chans = new Map<Channel, { channel: Channel; customers: number; ltv: number; revenue: number; orders: number; newCustomers: number; spend: number; firstRevenue: number }>();
  const get = (c: Channel) => chans.get(c) ?? chans.set(c, { channel: c, customers: 0, ltv: 0, revenue: 0, orders: 0, newCustomers: 0, spend: 0, firstRevenue: 0 }).get(c)!;
  for (const s of stats) if (s.orders) { const c = get(s.channel); c.customers++; c.ltv += s.revenue; }
  for (const o of orders) {
    if (!valid(o) || !inRange(o.createdAt, from, to)) continue;
    const c = get(o.channel);
    c.revenue += netTtc(o);
    c.orders++;
    if (o.firstOrder) { c.newCustomers++; c.firstRevenue += netTtc(o); }
  }
  for (const sp of spend) if (sp.month >= from.slice(0, 7) && sp.month <= to.slice(0, 7)) get(sp.channel).spend += sp.amount;
  return [...chans.values()].map((c) => ({ ...c, ltv: c.customers ? c.ltv / c.customers : 0, cac: c.spend && c.newCustomers ? c.spend / c.newCustomers : null, roas: c.spend ? c.revenue / c.spend : null })).sort((a, b) => b.revenue - a.revenue);
}

/* ───────── Paniers abandonnés et tunnel ───────── */
export function cartKpis(carts: Cart[], orders: Order[], traffic: Traffic[], from: string, to: string) {
  const c = carts.filter((x) => inRange(x.createdAt, from, to));
  const recovered = c.filter((x) => x.status === "recupere");
  const t = traffic.filter((x) => inRange(x.day, from, to));
  const o = orders.filter((x) => valid(x) && inRange(x.createdAt, from, to)).length;
  const addToCart = sum(t, (x) => x.addToCart);
  return {
    count: c.length, value: sum(c, (x) => x.value), lost: sum(c.filter((x) => x.status !== "recupere"), (x) => x.value), recovered: recovered.length, recoveredValue: sum(recovered, (x) => x.value),
    recoveryRate: pct(recovered.length, c.length), relaunched: c.filter((x) => x.relaunches.length).length,
    abandonmentRate: addToCart ? 100 - pct(o, addToCart) : null, avgValue: c.length ? sum(c, (x) => x.value) / c.length : 0,
    funnel: t.length ? [
      { label: "Sessions", value: sum(t, (x) => x.sessions) }, { label: "Fiches produit vues", value: sum(t, (x) => x.productViews) }, { label: "Ajouts au panier", value: addToCart },
      { label: "Paiement commencé", value: sum(t, (x) => x.checkouts) }, { label: "Commandes", value: o },
    ] : [],
    conversion: t.length ? pct(o, sum(t, (x) => x.sessions)) : null,
    byStep: groupBy(c, (x) => x.step, () => 1), byDevice: groupBy(c, (x) => x.device, () => 1),
  };
}

/* ───────── Stock ───────── */
export interface StockRow extends StockItem { sold30: number; sold90: number; rate: number; coverDays: number | null; stockoutDate?: string; status: "rupture" | "critique" | "bas" | "ok" | "dormant"; value: number; incoming: number; suggested: number; abc: "A" | "B" | "C"; revenue12m: number }
export function stockRows(stock: StockItem[], orders: Order[], pos: PurchaseOrder[], today = todayYmd()): StockRow[] {
  const d30 = addDays(today, -30), d90 = addDays(today, -90), d365 = addDays(today, -365);
  const s30 = new Map<string, number>(), s90 = new Map<string, number>(), rev = new Map<string, number>();
  for (const o of orders) {
    if (!valid(o) || o.createdAt < d365) continue;
    for (const i of o.items) {
      const k = `${i.productId}:${i.variantId}`;
      rev.set(k, (rev.get(k) ?? 0) + i.unit * i.qty);
      if (o.createdAt >= d90) s90.set(k, (s90.get(k) ?? 0) + i.qty);
      if (o.createdAt >= d30) s30.set(k, (s30.get(k) ?? 0) + i.qty);
    }
  }
  const incoming = new Map<string, number>();
  for (const p of pos) if (p.status === "envoyee") for (const l of p.lines) incoming.set(l.stockId, (incoming.get(l.stockId) ?? 0) + l.qty);
  // Analyse ABC (Pareto) sur le CA 12 mois
  const total = sum([...rev.values()], (x) => x) || 1;
  const order = stock.map((s) => s.id).sort((a, b) => (rev.get(b) ?? 0) - (rev.get(a) ?? 0));
  const abc = new Map<string, "A" | "B" | "C">();
  let acc = 0;
  for (const id of order) { abc.set(id, acc / total < 0.8 ? "A" : acc / total < 0.95 ? "B" : "C"); acc += rev.get(id) ?? 0; }
  return stock.map((s) => {
    const sold30 = s30.get(s.id) ?? 0, sold90 = s90.get(s.id) ?? 0;
    const rate = Math.max(sold30 / 30, sold90 / 90);
    const coverDays = rate ? Math.floor(s.qty / rate) : null;
    const inc = incoming.get(s.id) ?? 0;
    const status: StockRow["status"] = s.qty <= 0 ? "rupture" : s.qty <= s.safetyStock ? "critique" : s.qty <= s.reorderPoint ? "bas" : coverDays !== null && coverDays > 180 ? "dormant" : coverDays === null && s.qty > 0 ? "dormant" : "ok";
    const target = Math.ceil(rate * (s.leadDays + 45));
    const suggested = s.qty + inc <= s.reorderPoint ? Math.max(12, Math.ceil((target - s.qty - inc) / 12) * 12) : 0;
    return { ...s, sold30, sold90, rate, coverDays, stockoutDate: coverDays !== null && s.qty > 0 ? addDays(today, coverDays) : undefined, status, value: r2(s.qty * s.cost), incoming: inc, suggested, abc: abc.get(s.id) ?? "C", revenue12m: r2(rev.get(s.id) ?? 0) };
  });
}

/* ───────── Compte de résultat mensuel ───────── */
export interface PnlMonth { month: string; revenue: number; ht: number; vat: number; discounts: number; cogs: number; gross: number; logistics: number; fees: number; marketing: number; contribution: number; fixed: number; ebitda: number; orders: number; partial: boolean }
export function pnl(orders: Order[], spend: Spend[], s: CrmSettings, months: string[], today = todayYmd()): PnlMonth[] {
  const fixed = sum(s.fixedCosts, (f) => f.amount);
  return months.map((m) => {
    const os = orders.filter((o) => o.createdAt.startsWith(m));
    const k = salesKpis(os, s);
    const marketing = sum(spend.filter((x) => x.month === m), (x) => x.amount);
    const partial = m === today.slice(0, 7);
    const fx = partial ? (fixed * Number(today.slice(8, 10))) / new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)), 0).getDate() : fixed;
    const contribution = k.contribution - marketing;
    return { month: m, revenue: k.revenue, ht: k.ht, vat: k.revenue - k.ht, discounts: k.discount, cogs: k.cogs, gross: k.gross, logistics: k.logistics, fees: k.fees, marketing, contribution, fixed: fx, ebitda: contribution - fx, orders: k.orders, partial };
  });
}

export function lastMonths(n: number, today = todayYmd()) {
  const out: string[] = [];
  const d = parseLocal(today);
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

/**
 * Prévision du CA mensuel : même mois de l'an dernier × croissance observée sur les mois comparables récents
 * (saisonnalité + tendance). Sans historique d'un an : moyenne des 3 derniers mois complets.
 */
export function forecast(orders: Order[], horizon = 3, today = todayYmd()) {
  const byMonth = new Map<string, number>();
  for (const o of orders) if (valid(o)) byMonth.set(o.createdAt.slice(0, 7), (byMonth.get(o.createdAt.slice(0, 7)) ?? 0) + netTtc(o));
  const shift = (m: string, k: number) => { const [y, mo] = m.split("-").map(Number); const d = new Date(y, mo - 1 + k, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };
  const cur = today.slice(0, 7);
  const recent = [1, 2, 3].map((k) => shift(cur, -k));
  const comparable = recent.filter((m) => byMonth.has(shift(m, -12)) && (byMonth.get(shift(m, -12)) ?? 0) > 0);
  const rawGrowth = comparable.length ? sum(comparable, (m) => byMonth.get(m) ?? 0) / sum(comparable, (m) => byMonth.get(shift(m, -12)) ?? 0) : null;
  // Croissance bornée : une jeune marque qui part de très bas ne doit pas extrapoler un ×4 indéfiniment
  const growth = rawGrowth === null ? null : Math.min(2.5, Math.max(0.4, rawGrowth));
  const avg3 = sum(recent, (m) => byMonth.get(m) ?? 0) / 3;
  const out = Array.from({ length: horizon }, (_, i) => {
    const m = shift(cur, i);
    const ly = byMonth.get(shift(m, -12));
    const value = growth && ly ? ly * growth : avg3;
    return { month: m, value: r2(value), low: r2(value * 0.88), high: r2(value * 1.12), method: growth && ly ? "saisonnalite" : "moyenne" };
  });
  const daysIn = new Date(Number(cur.slice(0, 4)), Number(cur.slice(5, 7)), 0).getDate();
  return { months: out, growth, mtd: byMonth.get(cur) ?? 0, elapsed: Number(today.slice(8, 10)) / daysIn };
}
