import { describe, expect, it } from "vitest";
import { leavesBalance, pendingLeavesOf, useStore } from "@/lib/store";

const s = () => useStore.getState();
const issued = { code: "GLOW20-TEST01", voucher: "v", expiresAt: Date.now() + 1e7 };

describe("compte, newsletter et fidélité (mode démo)", () => {
  it("parcours complet : inscription → newsletter confirmée → commande → expédition", async () => {
    expect(await s().register({ email: "Lina@Example.com", firstName: "Lina", lastName: "T", password: "motdepasse1", newsletter: true })).toBeNull();
    expect(await s().register({ email: "lina@example.com", firstName: "x", lastName: "y", password: "motdepasse1", newsletter: false })).toMatch(/existe/);

    const r1 = s().confirmNewsletter("lina@example.com", issued);
    expect(r1.status).toBe("ok");
    expect(r1.leavesCredited).toBe(true);
    expect(leavesBalance(s().accounts["lina@example.com"])).toBe(100);
    // Deuxième confirmation : aucun avantage supplémentaire
    expect(s().confirmNewsletter("lina@example.com", { ...issued, code: "GLOW20-OTHER" }).status).toBe("already");
    expect(leavesBalance(s().accounts["lina@example.com"])).toBe(100);

    const o = s().recordOrder({ email: "lina@example.com", lines: [], subtotal: 30, discount: 6, shipping: 0, total: 24, leaves: 24, status: "test", paymentMode: "test", code: issued.code });
    expect(s().welcomeCodes.find((c) => c.code === issued.code)?.used).toBe(true);
    expect(pendingLeavesOf(s().accounts["lina@example.com"])).toBe(24);
    s().setOrderStatus("lina@example.com", o.id, "expediee");
    expect(leavesBalance(s().accounts["lina@example.com"])).toBe(124);
    s().setOrderStatus("lina@example.com", o.id, "remboursee");
    expect(leavesBalance(s().accounts["lina@example.com"])).toBe(100);
  });

  it("newsletter confirmée avant le compte : feuilles rattachées à la création", async () => {
    s().logout();
    const r = s().confirmNewsletter("nora@example.com", { ...issued, code: "GLOW20-NORA" });
    expect(r.leavesCredited).toBe(false);
    await s().register({ email: "nora@example.com", firstName: "Nora", lastName: "B", password: "motdepasse1", newsletter: false });
    expect(leavesBalance(s().accounts["nora@example.com"])).toBe(100);
  });

  it("connexion : mauvais mot de passe refusé", async () => {
    s().logout();
    expect(await s().login("nora@example.com", "faux")).toMatch(/incorrect/);
    expect(await s().login("nora@example.com", "motdepasse1")).toBeNull();
  });
});
