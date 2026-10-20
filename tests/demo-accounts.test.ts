import { describe, expect, it } from "vitest";
import { demoAccounts } from "@/data/demo-accounts";
import { leavesBalance, useStore } from "@/lib/store";

describe("comptes de test", () => {
  it("connexion avec un compte de test : compte créé avec son historique", async () => {
    const d = demoAccounts[0];
    expect(await useStore.getState().login(d.email, "mauvais")).toMatch(/incorrect/);
    expect(await useStore.getState().login(d.email, d.password)).toBeNull();
    const acc = useStore.getState().accounts[d.email];
    expect(acc.orders.length).toBeGreaterThan(0);
    expect(leavesBalance(acc)).toBeGreaterThan(300);
    // Reconnexion : le compte existant est réutilisé
    useStore.getState().logout();
    expect(await useStore.getState().login(d.email, d.password)).toBeNull();
  });
  it("la nouvelle cliente n'a aucune commande", async () => {
    const d = demoAccounts[1];
    expect(await useStore.getState().login(d.email, d.password)).toBeNull();
    expect(useStore.getState().accounts[d.email].orders).toHaveLength(0);
  });
});
