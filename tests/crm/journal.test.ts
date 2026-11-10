import { describe, expect, it, vi } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// Version en ligne simulée : base partagée en mémoire à la place de Neon
delete process.env.ANTHROPIC_API_KEY;
process.env.VERCEL = "1";
process.env.DATABASE_URL = "postgres://simulation";
process.env.CRM_DB_FILE = path.join(mkdtempSync(path.join(tmpdir(), "crm-j-")), "test.sqlite");
const shared = vi.hoisted(() => ({ anchor: "", ops: [] as { seq: number; op: unknown }[], seq: 0 }));
vi.mock("@/lib/crm/journal", () => ({
  journalEnabled: () => true,
  sharedAnchor: async (now: string) => (shared.anchor ||= now),
  resetShared: async (now: string) => { shared.anchor = now; shared.ops = []; },
  fetchOps: async (after: number) => shared.ops.filter((o) => o.seq > after),
  pushOps: async (ops: unknown[]) => { for (const op of ops) shared.ops.push({ seq: ++shared.seq, op }); },
}));

describe("CRM en ligne — journal partagé entre serveurs", () => {
  it("une action faite sur un serveur est visible sur un autre", async () => {
    const repo = await import("@/lib/crm/repo");
    const db = await import("@/lib/crm/db");
    const { crmHandler } = await import("@/lib/crm/actions");
    const u = { id: "v", name: "Visiteur" } as never;
    await repo.ensureCrmSeeded(); // serveur A
    const order = db.all("orders").find((o) => o.status === "payee")!;
    await crmHandler("order/status")(u, { id: order.id, status: "en_preparation" });
    await crmHandler("task/save")(u, { task: { title: "Tâche partagée" } });
    await repo.flushJournal();
    expect(shared.ops.length).toBeGreaterThan(1);
    const ordersA = db.all("orders").length;

    // Serveur B : base locale vide, même date de génération, puis rejeu du journal
    db.wipeLocal(); // base vide : la synchronisation repart toujours de la démo commune
    await repo.ensureCrmSeeded();
    expect(db.all("orders").length).toBe(ordersA);
    expect(db.one("orders", order.id)!.status).toBe("en_preparation");
    expect(db.all("tasks").some((t) => t.title === "Tâche partagée")).toBe(true);
    // La génération de la démo ne remplit pas le journal
    expect(shared.ops.every((o) => (o.op as { c: string }).c !== "customers")).toBe(true);
  }, 60_000); // deux générations complètes de la démo : plusieurs secondes quand la suite tourne en parallèle
});
