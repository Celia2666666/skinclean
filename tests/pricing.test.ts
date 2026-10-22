import { describe, expect, it } from "vitest";
import { computeTotals } from "@/lib/pricing";
import { loyalty, setDiscount, shipping } from "@/data/config";

const promo = { welcomeCodes: [], leavesBalance: 0, isFirstOrder: false };
const line = (productId: string, qty = 1, extra = {}) => ({ key: productId, productId, variantId: "std", qty, ...extra });

describe("panier", () => {
  it("un set contient 7 soins maximum", () => expect(setDiscount.maxItems).toBe(7));
  it("frais de port puis livraison offerte au seuil", () => {
    const small = computeTotals([line("sc-pt-01")], promo);
    expect(small.shipping).toBe(shipping.standardPrice);
    expect(shipping.standardPrice).toBe(10);
    expect(shipping.freeFrom).toBe(100);
    const big = computeTotals([line("sc-sr-02", 6)], promo);
    expect(big.subtotal).toBeGreaterThanOrEqual(100);
    expect(big.shipping).toBe(0);
  });
  it("set : -15 % sur le total dès 2 soins, recalculé si un soin est retiré", () => {
    const set = { id: "set-test", name: "Mon set" };
    const two = computeTotals([line("sc-sr-01", 1, { key: "a", bundle: set }), line("sc-sr-02", 1, { key: "b", bundle: set })], promo);
    expect(two.bundleDiscount).toBeCloseTo(two.subtotal * 0.15, 2);
    const one = computeTotals([line("sc-sr-01", 1, { key: "a", bundle: set })], promo);
    expect(one.bundleDiscount).toBe(0);
  });
  it("code de bienvenue -20 % valable uniquement en 1ʳᵉ commande, kits exclus", () => {
    const wc = [{ code: "GLOW20-ABCDE", percent: 20, expiresAt: Date.now() + 1e6, used: false }];
    const ok = computeTotals([line("sc-sr-02")], { ...promo, code: "GLOW20-ABCDE", welcomeCodes: wc, isFirstOrder: true });
    expect(ok.codeDiscount).toBeCloseTo(29 * 0.2);
    const notFirst = computeTotals([line("sc-sr-02")], { ...promo, code: "GLOW20-ABCDE", welcomeCodes: wc, isFirstOrder: false });
    expect(notFirst.codeDiscount).toBe(0);
    expect(notFirst.codeError).toBeDefined();
    const used = computeTotals([line("sc-sr-02")], { ...promo, code: "GLOW20-ABCDE", welcomeCodes: [{ ...wc[0], used: true }], isFirstOrder: true });
    expect(used.codeError).toMatch(/déjà/);
    const kitOnly = computeTotals([line("sc-sr-02", 1, { bundle: { id: "k", name: "Kit", discountPercent: 15 } })], { ...promo, code: "GLOW20-ABCDE", welcomeCodes: wc, isFirstOrder: true });
    expect(kitOnly.codeDiscount).toBe(0);
  });
  it("feuilles : récompense non cumulable avec un code", () => {
    const wc = [{ code: "GLOW20-ABCDE", percent: 20, expiresAt: Date.now() + 1e6, used: false }];
    const t = computeTotals([line("sc-sr-02")], { ...promo, code: "GLOW20-ABCDE", welcomeCodes: wc, isFirstOrder: true, rewardId: "r5", leavesBalance: 500 });
    expect(t.rewardDiscount).toBe(0);
    expect(t.rewardError).toBeDefined();
  });
  it("feuilles gagnées = euros après remises", () => {
    const t = computeTotals([line("sc-sr-03")], promo);
    expect(t.leavesEarned).toBe(Math.floor(24 * loyalty.leavesPerEuro));
  });
  it("cadeau 1ʳᵉ commande uniquement la première fois", () => {
    expect(computeTotals([line("sc-sr-03")], { ...promo, isFirstOrder: true }).gift).toBeDefined();
    expect(computeTotals([line("sc-sr-03")], promo).gift).toBeUndefined();
  });
});
