import { describe, expect, it } from "vitest";
import { generateCrmDemo } from "@/lib/crm/seed";
import { cartKpis, customerStats, forecast, marketBasket, pnl, lastMonths, productPerformance, salesKpis, stockRows, cohorts, resolvePeriod } from "@/lib/crm/analytics";

const today = "2026-11-06";
const d = generateCrmDemo(today, `${today}T15:30`);

describe("CRM — jeu de démonstration", () => {
  it("est déterministe et cohérent", () => {
    const again = generateCrmDemo(today, `${today}T15:30`);
    expect(again.orders.length).toBe(d.orders.length);
    expect(again.orders[100].total).toBe(d.orders[100].total);
    expect(d.orders.length).toBeGreaterThan(1500);
    const ids = new Set(d.customers.map((c) => c.id));
    expect(d.orders.every((o) => ids.has(o.customerId))).toBe(true);
    expect(d.orders.every((o) => o.createdAt <= `${today}T15:30`)).toBe(true);
    expect(d.customers.every((c) => c.email.endsWith("@example.com"))).toBe(true);
    expect([...d.orders, ...d.customers, ...d.carts, ...d.tickets].every((x) => x.source === "demo")).toBe(true);
    for (const o of d.orders) expect(Math.abs(o.total - (o.subtotal - o.discount + o.shipping))).toBeLessThan(0.02);
  });

  it("calcule des indicateurs plausibles", () => {
    const k = salesKpis(d.orders, d.settings);
    console.log({ orders: k.orders, revenue: Math.round(k.revenue), aov: k.aov.toFixed(1), grossRate: k.grossRate.toFixed(1), customers: d.customers.length, carts: d.carts.length });
    expect(k.aov).toBeGreaterThan(25);
    expect(k.grossRate).toBeGreaterThan(50);
    const stats = customerStats(d.customers, d.orders, today);
    expect(stats.filter((s) => s.orders >= 2).length).toBeGreaterThan(100);
    expect(stats.some((s) => s.segment === "champions")).toBe(true);
    const st = stockRows(d.stock, d.orders, d.purchaseOrders, today);
    expect(st.filter((s) => s.status === "rupture").length).toBe(3);
    expect(st.some((s) => s.suggested > 0)).toBe(true);
    const names = new Map(d.stock.map((s) => [s.productId, s.name]));
    expect(marketBasket(d.orders, names).length).toBeGreaterThan(3);
    expect(productPerformance(d.orders, d.settings)[0].revenue).toBeGreaterThan(0);
    const c = cartKpis(d.carts, d.orders, d.traffic, "2026-10-01", today);
    expect(c.recovered).toBeGreaterThan(0);
    const p = pnl(d.orders, d.spend, d.settings, lastMonths(12, today), today);
    console.log(p.map((m) => `${m.month} CA ${Math.round(m.revenue)} EBITDA ${Math.round(m.ebitda)}`).join("\n"));
    const f = forecast(d.orders, 3, today);
    console.log(f);
    expect(f.months[0].value).toBeGreaterThan(0);
    const co = cohorts(stats, d.orders, 12, today);
    console.log(co.slice(0, 3).map((x) => [x.month, x.size, x.retention.slice(0, 4).map((v) => v?.toFixed(0))]));
    expect(resolvePeriod("mois", today).from).toBe("2026-11-01");
  });
});

describe("Stock en direct (site ↔ CRM)", () => {
  it("applique le stock du CRM seulement après hydratation, sans écraser une surcharge admin", async () => {
    const { resolveVariant, getProduct } = await import("@/lib/catalog");
    const { setLiveStock } = await import("@/lib/live-stock");
    const p = getProduct("sc-ex-01")!;
    setLiveStock({ "sc-ex-01:std": 0 }, "crm");
    expect(resolveVariant(p, "std").stock).toBe(p.variants[0].stock); // rendu serveur / avant hydratation
    expect(resolveVariant(p, "std", {}).stock).toBe(0); // après hydratation : stock du CRM
    expect(resolveVariant(p, "std", { "sc-ex-01": { std: { stock: 5 } } }).stock).toBe(5); // surcharge /admin prioritaire
    setLiveStock({}, "catalogue");
  });
});
