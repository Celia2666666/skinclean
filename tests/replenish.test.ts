import { describe, expect, it } from "vitest";
import { refillsFor } from "@/lib/replenish";
import { demoAccounts } from "@/data/demo-accounts";
import type { Account } from "@/lib/store";

const DAY = 864e5;
const acc = (orders: Account["orders"]) => ({ orders } as Account);
const order = (daysAgo: number, productId: string, now: number, status: Account["orders"][number]["status"] = "livree") => ({
  id: "o" + daysAgo, date: now - daysAgo * DAY, email: "a@b.c", subtotal: 0, discount: 0, shipping: 0, total: 0, leaves: 0, status, paymentMode: "test" as const,
  lines: [{ productId, variantId: "std", name: productId, size: "", qty: 1, unit: 0 }],
});

describe("réapprovisionnement", () => {
  const now = Date.UTC(2026, 10, 1);
  it("sérum (45 j) acheté il y a 40 jours → rappel, 5 jours restants", () => {
    const r = refillsFor(acc([order(40, "sc-sr-01", now)]), now);
    expect(r).toHaveLength(1);
    expect(r[0].daysLeft).toBe(5);
  });
  it("achat récent ou trop ancien → pas de rappel", () => {
    expect(refillsFor(acc([order(5, "sc-sr-01", now)]), now)).toHaveLength(0);
    expect(refillsFor(acc([order(200, "sc-sr-01", now)]), now)).toHaveLength(0);
  });
  it("commande remboursée ignorée, accessoires exclus", () => {
    expect(refillsFor(acc([order(40, "sc-sr-01", now, "remboursee")]), now)).toHaveLength(0);
    expect(refillsFor(acc([order(40, "sc-ac-03", now)]), now)).toHaveLength(0);
  });
  it("le compte de test Camille a des soins à racheter", () => {
    const camille = demoAccounts[0].build() as Account;
    expect(refillsFor(camille).length).toBeGreaterThan(0);
  });
});
