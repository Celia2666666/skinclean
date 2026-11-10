import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { demoAccounts } from "@/data/demo-accounts";
import { leavesBalance, useStore } from "@/lib/store";

describe("comptes de démonstration", () => {
  it("connexion en un clic : compte créé avec son historique, sans mot de passe", () => {
    const d = demoAccounts[0];
    expect(useStore.getState().loginDemo("inconnu@skinclean.test")).toMatch(/introuvable/);
    expect(useStore.getState().loginDemo(d.email)).toBeNull();
    expect(useStore.getState().session).toBe(d.email);
    const acc = useStore.getState().accounts[d.email];
    expect(acc.orders.length).toBeGreaterThan(0);
    expect(leavesBalance(acc)).toBeGreaterThan(900);
    expect(acc.journal.entries.length).toBe(4);
    // Reconnexion : le compte existant est réutilisé
    useStore.getState().logout();
    expect(useStore.getState().loginDemo(d.email)).toBeNull();
  });
  it("la nouvelle cliente n'a aucune commande", () => {
    const d = demoAccounts[1];
    expect(useStore.getState().loginDemo(d.email)).toBeNull();
    expect(useStore.getState().accounts[d.email].orders).toHaveLength(0);
  });
  it("aucun mot de passe écrit dans les comptes de démonstration", () => {
    const src = fs.readFileSync("src/data/demo-accounts.ts", "utf8");
    expect(src).not.toMatch(/password\s*:/);
  });
});
