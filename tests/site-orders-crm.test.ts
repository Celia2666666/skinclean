import { describe, expect, it } from "vitest";
import { readSiteOrders } from "@/components/crm/SiteOrdersLive";
import { useStore } from "@/lib/store";

/** Bonus de la consigne : une commande passée sur la boutique est lisible par le CRM (même navigateur, même adresse). */
describe("commande boutique → CRM", () => {
  it("le CRM lit les commandes enregistrées par la boutique", () => {
    const mem = new Map<string, string>();
    (globalThis as unknown as { localStorage: Storage }).localStorage = {
      getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k),
      clear: () => mem.clear(), key: () => null, length: 0,
    } as Storage;
    useStore.getState().logout();
    useStore.getState().recordOrder({ email: "demo@skinclean.test", lines: [{ productId: "sc-sr-01", variantId: "std", name: "Clear Skin", size: "30 ml", qty: 1, unit: 22 }], subtotal: 22, discount: 0, shipping: 10, total: 32, leaves: 22, status: "test", paymentMode: "test", paymentMethod: "card" });
    // Persistance Zustand → localStorage (clé du site)
    mem.set("skinclean-v1", JSON.stringify({ state: { accounts: useStore.getState().accounts, guestOrders: useStore.getState().guestOrders } }));
    const orders = readSiteOrders();
    expect(orders[0].total).toBe(32);
    expect(orders[0].lines[0].name).toBe("Clear Skin");
    expect(orders[0].customer).toBe("demo@skinclean.test");
  });
});
