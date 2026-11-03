import { describe, expect, it } from "vitest";
import { leavesBalance, useStore } from "@/lib/store";

const s = () => useStore.getState();

describe("cadeaux du Club et comparateur", () => {
  it("échange de feuilles : solde débité, cadeau joint à la commande suivante", async () => {
    await s().register({ email: "gift@example.com", firstName: "Nora", lastName: "B", password: "motdepasse1", newsletter: false });
    expect(s().claimGift("g-mini-dew").ok).toBe(false); // 0 feuille
    s().addLedger({ delta: 200, label: "Bonus test", status: "credited" });
    const r = s().claimGift("g-mini-dew");
    expect(r.ok).toBe(true);
    expect(leavesBalance(s().accounts["gift@example.com"])).toBe(50);
    expect(s().claimGift("g-mini-dew").ok).toBe(false); // déjà en attente / solde insuffisant
    const o = s().recordOrder({ email: "gift@example.com", lines: [], subtotal: 20, discount: 0, shipping: 10, total: 30, leaves: 0, status: "test", paymentMode: "test" });
    expect(o.gift).toContain("Mini Dew Drop");
    expect(s().accounts["gift@example.com"].gifts?.every((g) => g.orderId === o.id)).toBe(true);
  });

  it("comparateur : 3 soins maximum", () => {
    s().clearCompare();
    expect(s().toggleCompare("sc-sr-01")).toBe(true);
    expect(s().toggleCompare("sc-sr-02")).toBe(true);
    expect(s().toggleCompare("sc-sr-03")).toBe(true);
    expect(s().toggleCompare("sc-sr-04")).toBe(false);
    expect(s().compare).toHaveLength(3);
    s().toggleCompare("sc-sr-01");
    expect(s().compare).toEqual(["sc-sr-02", "sc-sr-03"]);
  });
});
