import { describe, expect, it, beforeAll } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

process.env.CRM_DB_FILE = path.join(mkdtempSync(path.join(tmpdir(), "crm-")), "test.sqlite");

describe("CRM — actions serveur", () => {
  let db: typeof import("@/lib/crm/db");
  let act: typeof import("@/lib/crm/actions");
  const u = { id: "u", name: "Test", email: "t@example.com", role: "admin" } as never;
  beforeAll(async () => {
    const repo = await import("@/lib/crm/repo");
    await repo.ensureCrmSeeded();
    db = await import("@/lib/crm/db");
    act = await import("@/lib/crm/actions");
  });

  it("respecte le cycle de vie d'une commande et remet en stock au remboursement", async () => {
    const o = db.all("orders").find((x) => x.status === "livree")!;
    await expect(async () => act.crmHandler("order/status")(u, { id: o.id, status: "payee" })).rejects.toThrow();
    const item = o.items[0];
    const before = db.one("stock", `${item.productId}:${item.variantId}`)!.qty;
    await act.crmHandler("order/status")(u, { id: o.id, status: "remboursee", restock: true });
    expect(db.one("orders", o.id)!.refunded).toBe(o.total);
    expect(db.one("stock", `${item.productId}:${item.variantId}`)!.qty).toBe(before + o.items.filter((i) => i.productId === item.productId && i.variantId === item.variantId).reduce((a, i) => a + i.qty, 0));
  });

  it("réceptionne un bon de commande fournisseur dans le stock", async () => {
    const s = db.all("stock")[0];
    const po = (await act.crmHandler("po/create")(u, { send: true, lines: [{ stockId: s.id, qty: 24 }] })) as { id: string };
    await act.crmHandler("po/status")(u, { id: po.id, status: "recue" });
    expect(db.one("stock", s.id)!.qty).toBe(s.qty + 24);
    expect(db.all("moves").some((m) => m.ref && m.stockId === s.id && m.delta === 24)).toBe(true);
  });

  it("enregistre une relance de panier sans envoi pour un contact de démonstration", async () => {
    const c = db.all("carts").find((x) => x.status !== "recupere")!;
    const r = (await act.crmHandler("cart/relaunch")(u, { id: c.id })) as { sent: boolean };
    expect(r.sent).toBe(false);
    expect(db.one("carts", c.id)!.relaunches.length).toBe(c.relaunches.length + 1);
  });

  it("prévient automatiquement les inscrits au retour en stock, une seule fois", async () => {
    const s = db.all("stock").find((x) => x.qty === 0)!;
    const pending = db.all("alerts").filter((a) => a.productId === s.productId && a.variantId === s.variantId && a.status === "en_attente");
    expect(pending.length).toBeGreaterThan(0);
    await act.crmHandler("stock/adjust")(u, { id: s.id, delta: 30, reason: "reception" });
    const after = db.all("alerts").filter((a) => pending.some((p) => p.id === a.id));
    expect(after.every((a) => a.status === "envoyee")).toBe(true);
    const runs = db.all("runs").filter((r) => r.automationId === "back_in_stock" && pending.some((p) => r.key === `bis:${p.id}`));
    expect(runs.length).toBe(pending.length);
    expect(runs.every((r) => r.delivery === "simule")).toBe(true); // adresses @example.com : jamais envoyées
    expect(db.all("mails").filter((m) => pending.some((p) => p.email === m.to)).length).toBe(pending.length); // visibles dans la boîte de démo
    await act.crmHandler("automation/run")(u, { id: "back_in_stock" });
    expect(db.all("runs").filter((r) => pending.some((p) => r.key === `bis:${p.id}`)).length).toBe(pending.length);
  });

  it("enregistre les questions du chatbot de façon anonyme", async () => {
    const { logChat } = await import("@/lib/crm/inbound");
    await logChat({ text: "écrivez-moi à jean.dupont@gmail.com ou au 06 12 34 56 78", intent: "contact", session: "s1", page: "/" });
    const c = db.all("chats").at(-1)!;
    expect(c.text).not.toContain("gmail");
    expect(c.text).not.toContain("56 78");
    expect(c.source).toBe("reel");
  });
});
