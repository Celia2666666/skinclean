import "server-only";
import { addDays, diffDays, todayYmd } from "@/lib/hub/dates";
import { all } from "./db";
import { cartsOf, currentSource, customersOf, hasRealData, ordersOf, settings, spendOf, ticketsOf, trafficOf } from "./repo";
import {
  bucketKey, buckets, cartKpis, channelEconomics, cohorts, customerStats, delta, economics, forecast, groupBy, heatmap, inRange, lastMonths, marketBasket, netTtc, pnl, productPerformance, promoPerformance,
  resolvePeriod, revenueSeries, salesKpis, stockRows, valid, type Period,
} from "./analytics";
import type { DataSource, Order } from "./types";

/** Assemblage des données de chaque page du CRM (calculs côté serveur, props sérialisables). */

const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
export const monthShort = (m: string) => `${MONTHS[Number(m.slice(5, 7)) - 1]} ${m.slice(2, 4)}`;
export function bucketLabel(k: string, grain: Period["grain"]) {
  if (grain === "month") return monthShort(k);
  const [, m, d] = k.split("-");
  return grain === "week" ? `sem. ${d}/${m}` : `${d}/${m}`;
}

// Cache des statistiques clients : recalculées seulement si les commandes ou les clients changent
let statsMemo: { orders: unknown; customers: unknown; key: string; value: ReturnType<typeof customerStats> }[] = [];
export function statsFor(source: DataSource) {
  const orders = all("orders"), customers = all("customers"), key = `${source}|${todayYmd()}`;
  const hit = statsMemo.find((m) => m.orders === orders && m.customers === customers && m.key === key);
  if (hit) return hit.value;
  const value = customerStats(customersOf(source), ordersOf(source));
  statsMemo = [...statsMemo.filter((m) => m.orders === orders && m.customers === customers), { orders, customers, key, value }].slice(-2);
  return value;
}

export async function shellData() {
  const source = await currentSource();
  const { maybeRunAutomations } = await import("./automations");
  await maybeRunAutomations();
  const today = todayYmd();
  const rows = stockRows(all("stock"), ordersOf(source), all("purchaseOrders"));
  return {
    source, hasReal: hasRealData(),
    badges: {
      "/crm/stock": rows.filter((r) => r.status === "rupture" || r.status === "critique").length,
      "/crm/sav": ticketsOf(source).filter((t) => t.channel !== "formulaire" && t.channel !== "chatbot" && ((t.ai?.triage === "humain" && t.status !== "resolu") || (t.ai?.autoSent && !t.ai.checked))).length,
      "/crm/messages": ticketsOf(source).filter((t) => (t.channel === "formulaire" || t.channel === "chatbot") && ((t.ai?.triage === "humain" && t.status !== "resolu") || (t.ai?.autoSent && !t.ai.checked) || (t.status === "ouvert" && !t.ai))).length,
      "/crm/taches": all("tasks").filter((t) => !t.done && t.due <= today).length,
    },
  };
}

export async function dashboardData(p?: string) {
  const source = await currentSource();
  const s = settings();
  const period = resolvePeriod(p);
  const orders = ordersOf(source);
  const cur = orders.filter((o) => inRange(o.createdAt, period.from, period.to));
  const prev = orders.filter((o) => inRange(o.createdAt, period.prevFrom, period.prevTo));
  const k = salesKpis(cur, s), kp = salesKpis(prev, s);
  const series = revenueSeries(orders, period);
  const traffic = trafficOf(source);
  const carts = cartsOf(source);
  const ck = cartKpis(carts, orders, traffic, period.from, period.to), ckp = cartKpis(carts, orders, traffic, period.prevFrom, period.prevTo);
  const stats = statsFor(source);
  const buyers = stats.filter((x) => x.orders);
  const repeat = buyers.length ? (buyers.filter((x) => x.orders >= 2).length / buyers.length) * 100 : 0;
  const products = productPerformance(cur, s);
  const rows = stockRows(all("stock"), orders, all("purchaseOrders"));
  const f = forecast(orders);
  const tickets = ticketsOf(source);
  const today = todayYmd();
  const aovSeries = series.keys.map((_, i) => (series.orders[i] ? series.revenue[i] / series.orders[i] : 0));

  const alerts: { level: "bad" | "warn" | "info"; text: string; href: string }[] = [];
  for (const r of rows.filter((x) => x.status === "rupture")) alerts.push({ level: "bad", text: `Rupture : ${r.name} (${r.size})${r.incoming ? ` — ${r.incoming} u. en commande` : " — aucun réassort en cours"}`, href: `/crm/stock?status=rupture` });
  const crit = rows.filter((x) => x.status === "critique" || (x.status === "bas" && !x.incoming));
  if (crit.length) alerts.push({ level: "warn", text: `${crit.length} référence(s) sous le point de commande sans réassort en cours`, href: "/crm/stock?status=bas" });
  const openOld = tickets.filter((t) => t.status === "ouvert" && diffDays(today, t.createdAt) >= 1);
  if (openOld.length) alerts.push({ level: "warn", text: `${openOld.length} demande(s) client sans réponse depuis plus de 24 h`, href: "/crm/sav?status=ouvert" });
  const bigCarts = carts.filter((c) => c.status === "abandonne" && c.value >= 120);
  if (bigCarts.length) alerts.push({ level: "info", text: `${bigCarts.length} panier(s) abandonné(s) de plus de 120 € jamais relancé(s)`, href: "/crm/paniers?status=abandonne" });
  const atRisk = stats.filter((x) => x.segment === "a_ne_pas_perdre" || x.segment === "a_risque");
  if (atRisk.length) alerts.push({ level: "info", text: `${atRisk.length} bon(ne)s client(e)s « à risque » : sans commande depuis plus de 4 mois`, href: "/crm/clients?segment=a_risque" });
  const late = all("tasks").filter((t) => !t.done && t.due < today);
  if (late.length) alerts.push({ level: "warn", text: `${late.length} tâche(s) en retard`, href: "/crm/taches" });

  // Campagnes du Marketing Hub actives sur la période (même application, base distincte)
  let campaigns: { id: string; name: string; color: string; startDate: string; endDate: string; status: string }[] = [];
  if (!process.env.VERCEL) try {
    const { list } = await import("@/lib/hub/repo");
    campaigns = list("campaigns").filter((c) => c.startDate <= period.to && c.endDate >= period.from && c.status !== "bibliotheque").map((c) => ({ id: c.id, name: c.name, color: c.color, startDate: c.startDate, endDate: c.endDate, status: c.status }));
  } catch { /* Hub indisponible : on ignore */ }

  return {
    source, period, kpis: k, prev: kp, target: s.monthlyTarget,
    deltas: { revenue: delta(k.revenue, kp.revenue), orders: delta(k.orders, kp.orders), aov: delta(k.aov, kp.aov), grossRate: k.grossRate - kp.grossRate, newCustomers: delta(k.newCustomers, kp.newCustomers), conversion: ck.conversion !== null && ckp.conversion !== null ? delta(ck.conversion, ckp.conversion) : null, abandonment: ck.abandonmentRate !== null && ckp.abandonmentRate !== null ? ck.abandonmentRate - ckp.abandonmentRate : null, contribution: delta(k.contribution, kp.contribution) },
    series: { labels: series.keys.map((x) => bucketLabel(x, period.grain)), revenue: series.revenue, prevRevenue: series.prevRevenue, orders: series.orders, aov: aovSeries },
    conversion: ck.conversion, abandonment: ck.abandonmentRate, lostCarts: ck.lost, cartCount: ck.count,
    repeat, customers: stats.length, buyers: buyers.length, ltv: buyers.length ? buyers.reduce((a, b) => a + b.revenue, 0) / buyers.length : 0,
    best: products[0] ?? null,
    topProducts: products.slice(0, 8).map((x) => ({ name: x.name, category: x.category, revenue: x.revenue, qty: x.qty, marginRate: x.marginRate })),
    categories: groupBy(products, (x) => x.category, (x) => x.revenue).slice(0, 8),
    channels: groupBy(cur.filter(valid), (o) => o.channel, netTtc),
    regions: groupBy(cur.filter(valid), (o) => o.region, netTtc).slice(0, 8),
    devices: groupBy(cur.filter(valid), (o) => o.device, () => 1),
    payments: groupBy(cur.filter(valid), (o) => o.payment, () => 1),
    heat: heatmap(cur),
    stock: { rupture: rows.filter((r) => r.status === "rupture").length, low: rows.filter((r) => r.status === "bas" || r.status === "critique").length, value: rows.reduce((a, r) => a + r.value, 0), units: rows.reduce((a, r) => a + r.qty, 0), refs: rows.length },
    forecast: f,
    latest: orders.slice(-8).reverse().map((o) => ({ id: o.id, number: o.number, name: o.customerName, at: o.createdAt, total: o.total, status: o.status, items: o.items.reduce((a, i) => a + i.qty, 0) })),
    alerts: alerts.slice(0, 8), campaigns,
    tickets: { open: tickets.filter((t) => t.status !== "resolu").length, csat: (() => { const r = tickets.filter((t) => t.csat); return r.length ? r.reduce((a, t) => a + t.csat!, 0) / r.length : null; })() },
  };
}
export type DashboardData = Awaited<ReturnType<typeof dashboardData>>;

/* ───────── Commandes ───────── */
export async function ordersPage(sp: Record<string, string | string[] | undefined>) {
  const source = await currentSource();
  const s = settings();
  const q = String(sp.q ?? "").toLowerCase().trim();
  const status = String(sp.status ?? "");
  const channel = String(sp.channel ?? "");
  const period = resolvePeriod(String(sp.p ?? "90j"));
  const sort = String(sp.sort ?? "date:desc");
  const all_ = ordersOf(source);
  let os = all_.filter((o) => inRange(o.createdAt, period.from, period.to));
  if (status) os = os.filter((o) => o.status === status);
  if (channel) os = os.filter((o) => o.channel === channel);
  if (q) os = os.filter((o) => `${o.number} ${o.customerName} ${o.email} ${o.city} ${o.promoCode ?? ""}`.toLowerCase().includes(q));
  const [key, dir] = sort.split(":");
  const val = (o: Order) => (key === "total" ? o.total : key === "client" ? o.customerName : o.createdAt);
  os = os.slice().sort((a, b) => (val(a) < val(b) ? -1 : val(a) > val(b) ? 1 : 0) * (dir === "asc" ? 1 : -1));
  const page = Math.max(1, Number(sp.page) || 1), per = 25;
  const k = salesKpis(os, s);
  const counts = groupBy(all_.filter((o) => inRange(o.createdAt, period.from, period.to)), (o) => o.status, () => 1);
  const sel = sp.id ? all_.find((o) => o.id === sp.id) : undefined;
  return {
    source, period, sort, total: os.length, page, pages: Math.max(1, Math.ceil(os.length / per)), kpis: { revenue: k.revenue, orders: k.orders, aov: k.aov, grossRate: k.grossRate, refundRate: k.refundRate, discountRate: k.discountRate },
    counts: Object.fromEntries(counts),
    rows: os.slice((page - 1) * per, page * per).map((o) => ({ id: o.id, number: o.number, at: o.createdAt, name: o.customerName, email: o.email, status: o.status, channel: o.channel, items: o.items.reduce((a, i) => a + i.qty, 0), total: o.total, promo: o.promoCode, first: o.firstOrder, city: o.city })),
    selected: sel ? { order: sel, eco: economics(sel, s), customerOrders: all_.filter((o) => o.customerId === sel.customerId).length } : null,
  };
}

/* ───────── Clients ───────── */
export async function customersPage(sp: Record<string, string | string[] | undefined>) {
  const source = await currentSource();
  const stats = statsFor(source);
  const q = String(sp.q ?? "").toLowerCase().trim();
  const segment = String(sp.segment ?? "");
  const lifecycle = String(sp.lifecycle ?? "");
  const sort = String(sp.sort ?? "revenue:desc");
  let rows = stats;
  if (segment) rows = rows.filter((c) => (segment === "a_risque" ? c.segment === "a_risque" || c.segment === "a_ne_pas_perdre" : c.segment === segment));
  if (lifecycle) rows = rows.filter((c) => c.lifecycle === lifecycle);
  if (q) rows = rows.filter((c) => `${c.name} ${c.email} ${c.city} ${c.tags.join(" ")}`.toLowerCase().includes(q));
  const [key, dir] = sort.split(":");
  const v = (c: (typeof rows)[number]) => (key === "orders" ? c.orders : key === "last" ? c.last ?? "" : key === "name" ? c.name : key === "created" ? c.createdAt : c.revenue);
  rows = rows.slice().sort((a, b) => (v(a) < v(b) ? -1 : v(a) > v(b) ? 1 : 0) * (dir === "asc" ? 1 : -1));
  const page = Math.max(1, Number(sp.page) || 1), per = 30;
  return {
    source, sort, total: rows.length, page, pages: Math.max(1, Math.ceil(rows.length / per)),
    segments: groupBy(stats.filter((c) => c.segment), (c) => c.segment!, () => 1),
    lifecycles: groupBy(stats, (c) => c.lifecycle, () => 1),
    rows: rows.slice((page - 1) * per, page * per),
    totals: { all: stats.length, buyers: stats.filter((c) => c.orders).length, optin: stats.filter((c) => c.optinEmail).length },
  };
}

export async function customerPage(id: string) {
  const source = await currentSource();
  const c = customersOf(source).find((x) => x.id === id) ?? all("customers").find((x) => x.id === id);
  if (!c) return null;
  const s = settings();
  const st = statsFor(c.source).find((x) => x.id === id)!;
  const orders = ordersOf(c.source).filter((o) => o.customerId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const carts = cartsOf(c.source).filter((x) => x.customerId === id);
  const tickets = ticketsOf(c.source).filter((t) => t.customerId === id);
  const acts = all("activities").filter((a) => a.customerId === id);
  const tasks = all("tasks").filter((t) => t.related?.kind === "client" && t.related.id === id);
  const products = groupBy(orders.filter(valid).flatMap((o) => o.items), (i) => i.name, (i) => i.qty);
  const margin = orders.reduce((a, o) => a + economics(o, s).gross, 0);
  // Recommandations : best-sellers non encore achetés, proches de ses préoccupations
  const bought = new Set(orders.flatMap((o) => o.items.map((i) => i.productId)));
  const { baseProducts } = await import("@/data/products");
  const recos = baseProducts.filter((p) => !bought.has(p.id) && (p.concerns.some((x) => c.concerns.includes(x)) || p.skinTypes.includes(c.skinType))).sort((a, b) => (a.bestseller ?? 99) - (b.bestseller ?? 99)).slice(0, 4).map((p) => ({ id: p.id, name: p.name, kind: p.kind, price: p.variants[0].price }));
  const timeline = [
    ...orders.map((o) => ({ at: o.createdAt, kind: "commande" as const, title: `Commande ${o.number} — ${o.total.toFixed(2).replace(".", ",")} €`, body: o.items.map((i) => `${i.qty}× ${i.name}`).join(", "), href: `/crm/ventes?id=${o.id}` })),
    ...carts.map((x) => ({ at: x.createdAt, kind: "panier" as const, title: `Panier abandonné — ${x.value.toFixed(2).replace(".", ",")} €`, body: `${x.items.map((i) => i.name).join(", ")} · ${x.status === "recupere" ? "récupéré" : `${x.relaunches.length} relance(s)`}`, href: `/crm/paniers?id=${x.id}` })),
    ...tickets.map((t) => ({ at: t.createdAt, kind: "ticket" as const, title: `Demande SAV ${t.number} — ${t.subject}`, body: t.messages[0]?.body ?? "", href: `/crm/sav?id=${t.id}` })),
    ...acts.map((a) => ({ at: a.at, kind: a.kind, title: { note: "Note", appel: "Appel", email: "E-mail", relance: "Relance", statut: "Mise à jour", sms: "SMS" }[a.kind], body: a.body, href: undefined })),
    { at: c.createdAt, kind: "creation" as const, title: "Création du contact", body: `Source : ${c.channel}`, href: undefined },
  ].sort((a, b) => b.at.localeCompare(a.at));
  return { customer: c, stats: st, orders: orders.map((o) => ({ id: o.id, number: o.number, at: o.createdAt, total: o.total, status: o.status, items: o.items.length })), products: products.slice(0, 8), margin, timeline, tasks, recos, tickets: tickets.length };
}

/* ───────── Analyses clients ───────── */
export async function analysesData() {
  const source = await currentSource();
  const today = todayYmd();
  const orders = ordersOf(source);
  const stats = statsFor(source);
  const buyers = stats.filter((c) => c.orders);
  const from = addDays(today, -364);
  const months = lastMonths(12);
  const newVsReturning = months.map((m) => {
    const os = orders.filter((o) => valid(o) && o.createdAt.startsWith(m));
    return { month: monthShort(m), nouveaux: os.filter((o) => o.firstOrder).reduce((a, o) => a + netTtc(o), 0), recurrents: os.filter((o) => !o.firstOrder).reduce((a, o) => a + netTtc(o), 0) };
  });
  // Grille RFM 5×5 (récence × fréquence)
  const grid = Array.from({ length: 5 }, (_, f) => Array.from({ length: 5 }, (_, r) => buyers.filter((c) => c.f === 5 - f && c.r === r + 1).length));
  const segs = groupBy(buyers, (c) => c.segment!, () => 1).map(([seg, n]) => {
    const g = buyers.filter((c) => c.segment === seg);
    return { seg, n, revenue: g.reduce((a, c) => a + c.revenue, 0), aov: g.reduce((a, c) => a + c.aov, 0) / g.length, recency: Math.round(g.reduce((a, c) => a + (c.recencyDays ?? 0), 0) / g.length) };
  });
  const intervals = buyers.filter((c) => c.avgInterval !== null).map((c) => c.avgInterval!);
  const freq = [1, 2, 3, 4, 5].map((n) => ({ label: n === 5 ? "5 et +" : String(n), value: buyers.filter((c) => (n === 5 ? c.orders >= 5 : c.orders === n)).length }));
  const churned = buyers.filter((c) => (c.recencyDays ?? 0) > 180).length;
  return {
    source, cohorts: cohorts(stats, orders, 12).map((c) => ({ ...c, label: monthShort(c.month) })),
    channels: channelEconomics(stats, orders, spendOf(source), from, today),
    newVsReturning, grid, segs, freq,
    kpis: {
      buyers: buyers.length, repeat: buyers.length ? (buyers.filter((c) => c.orders >= 2).length / buyers.length) * 100 : 0,
      ltv: buyers.length ? buyers.reduce((a, c) => a + c.revenue, 0) / buyers.length : 0, interval: intervals.length ? intervals.sort((a, b) => a - b)[Math.floor(intervals.length / 2)] : null,
      churn: buyers.length ? (churned / buyers.length) * 100 : 0, ordersPerCustomer: buyers.length ? buyers.reduce((a, c) => a + c.orders, 0) / buyers.length : 0,
      top10: (() => { const sorted = buyers.slice().sort((a, b) => b.revenue - a.revenue); const t = sorted.slice(0, Math.ceil(sorted.length / 10)); const tot = sorted.reduce((a, c) => a + c.revenue, 0) || 1; return (t.reduce((a, c) => a + c.revenue, 0) / tot) * 100; })(),
    },
    tiers: groupBy(buyers, (c) => c.tier, () => 1),
    skin: groupBy(buyers, (c) => c.skinType, (c) => c.revenue),
  };
}

/* ───────── Produits ───────── */
export async function productsData(p?: string) {
  const source = await currentSource();
  const s = settings();
  const period = resolvePeriod(p ?? "90j");
  const orders = ordersOf(source);
  const cur = orders.filter((o) => inRange(o.createdAt, period.from, period.to));
  const prev = orders.filter((o) => inRange(o.createdAt, period.prevFrom, period.prevTo));
  const perf = productPerformance(cur, s);
  const prevMap = new Map(productPerformance(prev, s).map((x) => [x.productId, x]));
  const names = new Map(all("stock").map((x) => [x.productId, x.name]));
  const rows = stockRows(all("stock"), orders, all("purchaseOrders"));
  const stockBy = new Map<string, number>();
  for (const r of rows) stockBy.set(r.productId, (stockBy.get(r.productId) ?? 0) + r.qty);
  const kits = groupBy(cur.filter(valid).flatMap((o) => [...new Set(o.items.filter((i) => i.kitId).map((i) => i.kitId!))]), (x) => x, () => 1);
  const { baseKits } = await import("@/data/kits");
  const totalRev = perf.reduce((a, x) => a + x.revenue, 0) || 1;
  return {
    source, period,
    rows: perf.map((x) => ({ ...x, share: (x.revenue / totalRev) * 100, trend: delta(x.revenue, prevMap.get(x.productId)?.revenue ?? 0), stock: stockBy.get(x.productId) ?? 0 })),
    basket: marketBasket(cur.length > 200 ? cur : orders.filter((o) => inRange(o.createdAt, addDays(todayYmd(), -180), todayYmd())), names),
    promos: promoPerformance(cur),
    kits: kits.map(([id, n]) => ({ name: baseKits.find((k) => k.id === id)?.name ?? id, n })),
    avgMargin: perf.length ? (perf.reduce((a, x) => a + x.margin, 0) / (perf.reduce((a, x) => a + x.ht, 0) || 1)) * 100 : 0,
    categories: groupBy(perf, (x) => x.category, (x) => x.revenue),
  };
}

/* ───────── Stock ───────── */
export async function stockData() {
  const source = await currentSource();
  const rows = stockRows(all("stock"), ordersOf(source), all("purchaseOrders"));
  const moves = all("moves").slice().sort((a, b) => b.at.localeCompare(a.at)).slice(0, 120);
  const pos = all("purchaseOrders").slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const abc = (["A", "B", "C"] as const).map((c) => ({ cls: c, refs: rows.filter((r) => r.abc === c).length, revenue: rows.filter((r) => r.abc === c).reduce((a, r) => a + r.revenue12m, 0), value: rows.filter((r) => r.abc === c).reduce((a, r) => a + r.value, 0) }));
  return { source, rows, moves, pos, abc, suppliers: [...new Set(rows.map((r) => r.supplier))] };
}

/* ───────── Paniers abandonnés ───────── */
export async function cartsData(sp: Record<string, string | string[] | undefined>) {
  const source = await currentSource();
  const period = resolvePeriod(String(sp.p ?? "30j"));
  const orders = ordersOf(source);
  const carts = cartsOf(source);
  const k = cartKpis(carts, orders, trafficOf(source), period.from, period.to);
  const kp = cartKpis(carts, orders, trafficOf(source), period.prevFrom, period.prevTo);
  const status = String(sp.status ?? "");
  let list = carts.filter((c) => inRange(c.createdAt, period.from, period.to));
  if (status) list = list.filter((c) => c.status === status);
  list = list.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const page = Math.max(1, Number(sp.page) || 1), per = 25;
  const items = groupBy(carts.filter((c) => inRange(c.createdAt, period.from, period.to) && c.status !== "recupere").flatMap((c) => c.items), (i) => i.name, (i) => i.qty).slice(0, 8);
  const daily = resolvePeriod("30j");
  const series = [] as { label: string; abandoned: number; recovered: number }[];
  for (let d = daily.from; d <= daily.to; d = addDays(d, 1)) {
    const cs = carts.filter((c) => c.createdAt.startsWith(d));
    series.push({ label: bucketLabel(d, "day"), abandoned: cs.filter((c) => c.status !== "recupere").reduce((a, c) => a + c.value, 0), recovered: cs.filter((c) => c.status === "recupere").reduce((a, c) => a + c.value, 0) });
  }
  const sel = sp.id ? carts.find((c) => c.id === sp.id) : undefined;
  return { source, period, kpis: k, prev: kp, total: list.length, page, pages: Math.max(1, Math.ceil(list.length / per)), rows: list.slice((page - 1) * per, page * per), items, series, selected: sel ?? null };
}

/* ───────── Rentabilité ───────── */
export async function profitData() {
  const source = await currentSource();
  const s = settings();
  const orders = ordersOf(source);
  const months = lastMonths(12);
  const p = pnl(orders, spendOf(source), s, months);
  const full = p.filter((m) => !m.partial);
  const last3 = full.slice(-3);
  const sumK = <K extends keyof (typeof p)[number]>(arr: typeof p, k: K) => arr.reduce((a, m) => a + (m[k] as number), 0);
  const ytd = p.filter((m) => m.month.startsWith(todayYmd().slice(0, 4)));
  const fixed = s.fixedCosts.reduce((a, f) => a + f.amount, 0);
  const contributionRate = sumK(last3, "ht") ? sumK(last3, "contribution") / sumK(last3, "ht") : 0;
  const breakEvenHt = contributionRate > 0 ? fixed / contributionRate : null;
  const channels = channelEconomics(statsFor(source), orders, spendOf(source), addDays(todayYmd(), -89), todayYmd());
  const f = forecast(orders, 4);
  const catMargin = groupBy(productPerformance(orders.filter((o) => inRange(o.createdAt, addDays(todayYmd(), -89), todayYmd())), s), (x) => x.category, (x) => x.margin);
  const firstPositive = p.findIndex((m, i) => m.ebitda > 0 && p.slice(i).filter((x) => !x.partial).every((x) => x.ebitda > 0));
  return {
    source, settings: s, months: p.map((m) => ({ ...m, label: monthShort(m.month) })),
    ytd: { revenue: sumK(ytd, "revenue"), ht: sumK(ytd, "ht"), gross: sumK(ytd, "gross"), contribution: sumK(ytd, "contribution"), ebitda: sumK(ytd, "ebitda"), marketing: sumK(ytd, "marketing") },
    last3: { ht: sumK(last3, "ht"), cogs: sumK(last3, "cogs"), logistics: sumK(last3, "logistics"), fees: sumK(last3, "fees"), marketing: sumK(last3, "marketing"), fixed: sumK(last3, "fixed"), ebitda: sumK(last3, "ebitda"), gross: sumK(last3, "gross") },
    contributionRate: contributionRate * 100, breakEvenHt, fixed, channels, forecast: { ...f, months: f.months.map((m) => ({ ...m, label: monthShort(m.month) })) },
    catMargin, profitableSince: firstPositive >= 0 ? monthShort(p[firstPositive].month) : null,
    unit: (() => { const k = salesKpis(orders.filter((o) => inRange(o.createdAt, addDays(todayYmd(), -89), todayYmd())), s); const n = k.orders || 1; const mk = sumK(last3, "marketing") / Math.max(1, last3.reduce((a, m) => a + m.orders, 0)); return { aov: k.aov, ht: k.ht / n, cogs: k.cogs / n, logistics: k.logistics / n, fees: k.fees / n, marketing: mk, contribution: k.contribution / n - mk }; })(),
  };
}

/* ───────── SAV ───────── */
export async function supportData(sp: Record<string, string | string[] | undefined>) {
  const source = await currentSource();
  const contactChannels = ["formulaire", "chatbot"];
  const tickets = ticketsOf(source).filter((t) => (sp.inbox === "contact" ? contactChannels.includes(t.channel) : !contactChannels.includes(t.channel))).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const status = String(sp.status ?? "");
  const aiFilter = String(sp.ai ?? "");
  const toAnswer = (t: (typeof tickets)[number]) => t.ai?.triage === "humain" && t.status !== "resolu";
  const toCheck = (t: (typeof tickets)[number]) => !!t.ai?.autoSent && !t.ai.checked;
  let list = status ? tickets.filter((t) => t.status === status) : tickets;
  if (aiFilter === "humain") list = list.filter(toAnswer);
  if (aiFilter === "verifier") list = list.filter(toCheck);
  const responded = tickets.filter((t) => t.firstResponseMin !== undefined).map((t) => t.firstResponseMin!).sort((a, b) => a - b);
  const resolved = tickets.filter((t) => t.resolvedAt);
  const csat = tickets.filter((t) => t.csat);
  const sel = sp.id ? tickets.find((t) => t.id === sp.id) : undefined;
  const order = sel?.orderId ? ordersOf(source).find((o) => o.id === sel.orderId) : undefined;
  return {
    source, rows: list, counts: Object.fromEntries(groupBy(tickets, (t) => t.status, () => 1)),
    ai: { humain: tickets.filter(toAnswer).length, verifier: tickets.filter(toCheck).length, auto: tickets.filter((t) => t.ai?.autoSent).length, ia: !!process.env.ANTHROPIC_API_KEY },
    kpis: {
      open: tickets.filter((t) => t.status !== "resolu").length, medianFirst: responded.length ? responded[Math.floor(responded.length / 2)] : null,
      resolution: resolved.length ? resolved.reduce((a, t) => a + (new Date(t.resolvedAt!).getTime() - new Date(t.createdAt).getTime()) / 36e5, 0) / resolved.length : null,
      csat: csat.length ? csat.reduce((a, t) => a + t.csat!, 0) / csat.length : null, satisfied: csat.length ? (csat.filter((t) => t.csat! >= 4).length / csat.length) * 100 : null, total: tickets.length,
    },
    categories: groupBy(tickets, (t) => t.category, () => 1),
    selected: sel ? { ticket: sel, order: order ? { id: order.id, number: order.number, status: order.status, total: order.total, tracking: order.tracking } : null } : null,
  };
}

/* ───────── Chatbot (Glow Assistant) ───────── */
export async function chatbotData(p?: string) {
  const source = await currentSource();
  const period = resolvePeriod(p ?? "30j");
  const chats = all("chats").filter((c) => c.source === source);
  const cur = chats.filter((c) => inRange(c.at, period.from, period.to));
  const prev = chats.filter((c) => inRange(c.at, period.prevFrom, period.prevTo));
  const sessions = (a: typeof cur) => new Set(a.map((c) => c.session)).size;
  const understood = (a: typeof cur) => (a.length ? (a.filter((c) => c.intent !== "unknown").length / a.length) * 100 : 0);
  const prevBy = new Map(groupBy(prev, (c) => c.intent, () => 1));
  const intents = groupBy(cur, (c) => c.intent, () => 1).map(([intent, n]) => ({ intent, n, share: (n / (cur.length || 1)) * 100, delta: delta(n, prevBy.get(intent) ?? 0) }));
  const unknown = groupBy(cur.filter((c) => c.intent === "unknown"), (c) => c.text.toLowerCase(), () => 1).slice(0, 15);
  const stockNames = [...new Set(all("stock").map((s) => s.name))];
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const asked = groupBy(cur.filter((c) => c.intent === "stock").flatMap((c) => stockNames.filter((n) => norm(c.text).includes(norm(n)))), (n) => n, () => 1);
  const days = buckets(period.from, period.to, period.grain);
  const perDay = new Map(groupBy(cur, (c) => bucketKey(c.at.slice(0, 10), period.grain), () => 1));
  const alerts = all("alerts").filter((a) => a.source === source && a.origin === "chatbot" && inRange(a.createdAt, period.from, period.to)).length;
  const handoffs = ticketsOf(source).filter((t) => t.channel === "chatbot" && inRange(t.createdAt, period.from, period.to)).length;
  return {
    source, period,
    kpis: { questions: cur.length, prevQuestions: prev.length, conversations: sessions(cur), prevConversations: sessions(prev), understood: understood(cur), prevUnderstood: understood(prev), perConv: cur.length / (sessions(cur) || 1), stock: cur.filter((c) => c.intent === "stock").length, alerts, handoffs },
    intents, unknown, asked,
    series: { labels: days.map((d) => bucketLabel(d, period.grain)), values: days.map((d) => perDay.get(d) ?? 0) },
    pages: groupBy(cur, (c) => c.page || "/", () => 1).slice(0, 6),
    recent: cur.slice(-40).reverse(),
  };
}

/* ───────── Automatisations ───────── */
export async function automationsData() {
  const source = await currentSource();
  const { automations } = await import("./automations");
  const today = todayYmd();
  const since = addDays(today, -30);
  const runs = all("runs").filter((r) => r.source === source);
  const carts = new Map(all("carts").map((c) => [c.id, c]));
  const ordersByEmail = new Map<string, Order[]>();
  for (const o of ordersOf(source)) if (valid(o)) (ordersByEmail.get(o.email) ?? ordersByEmail.set(o.email, []).get(o.email)!).push(o);
  // Conversion : panier récupéré après la relance, ou commande dans les 14 jours suivant l'envoi
  const conv = (r: (typeof runs)[number]) => {
    if (r.automationId === "cart_1" || r.automationId === "cart_2") {
      const c = carts.get(r.key.split(":")[1]);
      return c?.status === "recupere" && (c.recoveredAt ?? "") >= r.at ? c.value : 0;
    }
    if (r.automationId === "welcome" || r.automationId === "review") {
      const o = (ordersByEmail.get(r.email) ?? []).find((x) => x.createdAt > r.at && x.createdAt <= `${addDays(r.at.slice(0, 10), 14)}T99`);
      return o ? netTtc(o) : 0;
    }
    const o = (ordersByEmail.get(r.email) ?? []).find((x) => x.createdAt > r.at && x.createdAt <= `${addDays(r.at.slice(0, 10), 14)}T99`);
    return o ? netTtc(o) : 0;
  };
  const list = automations().map((a) => {
    const rs = runs.filter((r) => r.automationId === a.id && r.at >= since);
    const values = rs.map(conv);
    const converted = values.filter((v) => v > 0).length;
    return { ...a, runs30: rs.length, sent30: rs.filter((r) => r.delivery === "envoye").length, simulated30: rs.filter((r) => r.delivery === "simule").length, failed30: rs.filter((r) => r.delivery === "echec").length, converted, revenue: values.reduce((x, y) => x + y, 0), rate: rs.length ? (converted / rs.length) * 100 : 0, total: runs.filter((r) => r.automationId === a.id).length };
  });
  const stock = stockRows(all("stock"), ordersOf(source), all("purchaseOrders"));
  const alerts = all("alerts").filter((a) => a.source === source);
  const pending = alerts.filter((a) => a.status === "en_attente");
  const byProduct = groupBy(pending, (a) => a.productId, () => 1).map(([pid, n]) => {
    const variants = new Set(pending.filter((a) => a.productId === pid).map((a) => a.variantId));
    const rows = stock.filter((s) => s.productId === pid && (variants.has(undefined) || variants.has(s.variantId)));
    return { productId: pid, name: rows.length === 1 ? `${rows[0].name} — ${rows[0].size}` : rows[0]?.name ?? pid, n, qty: rows.reduce((x, s) => x + s.qty, 0), incoming: rows.reduce((x, s) => x + s.incoming, 0), stockId: rows.find((s) => s.qty === 0)?.id ?? rows[0]?.id, fromChat: pending.filter((a) => a.productId === pid && a.origin === "chatbot").length, value: n * (rows[0]?.price ?? 0) };
  });
  const sentAlerts = alerts.filter((a) => a.status === "envoyee");
  const alertConv = sentAlerts.filter((a) => (ordersByEmail.get(a.email) ?? []).some((o) => o.createdAt > (a.sentAt ?? "") && o.items.some((i) => i.productId === a.productId))).length;
  const log = runs.slice(-80).reverse().map((r) => ({ ...r, converted: conv(r) > 0 }));
  return {
    source, list, byProduct, pendingAlerts: pending.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 60), log,
    kpis: { runs30: list.reduce((a, x) => a + x.runs30, 0), revenue: list.reduce((a, x) => a + x.revenue, 0), active: list.filter((a) => a.enabled).length, pending: pending.length, alertRate: sentAlerts.length ? (alertConv / sentAlerts.length) * 100 : null, resend: !!process.env.RESEND_API_KEY },
  };
}
