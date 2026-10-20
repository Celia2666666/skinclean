import { describe, expect, it, beforeAll } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

process.env.HUB_DB_FILE = path.join(mkdtempSync(path.join(tmpdir(), "hub-")), "test.sqlite");

describe("Marketing Hub — contenus initiaux", () => {
  let repo: typeof import("@/lib/hub/repo");
  let auth: typeof import("@/lib/hub/auth");
  beforeAll(async () => {
    repo = await import("@/lib/hub/repo");
    auth = await import("@/lib/hub/auth");
    await repo.ensureSeeded();
  });

  it("crée les 4 rôles et permet la connexion", async () => {
    const { seedPassword } = await import("@/lib/hub/seed");
    expect(auth.listUsers().map((u) => u.role).sort()).toEqual(["admin", "createur", "marketing", "validateur"]);
    expect(auth.login("client@skinclean.local", seedPassword())).not.toBeNull();
    expect(auth.login("client@skinclean.local", "mauvais")).toBeNull();
  });

  it("prépare un calendrier ≥ 3 mois aux fréquences demandées", () => {
    const posts = repo.list("posts").filter((p) => !p.library);
    const by = (pl: string) => posts.filter((p) => p.platform === pl).length;
    const dates = posts.map((p) => p.date).sort();
    const span = (new Date(dates.at(-1)!).getTime() - new Date(dates[0]).getTime()) / 864e5;
    expect(span).toBeGreaterThanOrEqual(90);
    expect(by("instagram")).toBeGreaterThanOrEqual(50);
    expect(by("story")).toBeGreaterThanOrEqual(60);
    expect(by("tiktok")).toBeGreaterThanOrEqual(50);
    expect(by("newsletter")).toBeGreaterThanOrEqual(6);
    expect(by("blog")).toBeGreaterThanOrEqual(12);
    for (const p of posts) {
      expect(p.title && p.date && p.platform && p.objective && p.cta).toBeTruthy();
      expect(p.caption.length).toBeGreaterThan(10);
    }
  });

  it("contient 12 campagnes, 4 personas et des objectifs SMART datés", () => {
    expect(repo.list("campaigns")).toHaveLength(12);
    expect(repo.list("personas")).toHaveLength(4);
    for (const o of repo.list("objectives")) expect(o.deadline).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("ne publie rien et sépare les données de démonstration", () => {
    const posts = repo.list("posts");
    expect(posts.some((p) => p.status === "publie" || p.status === "publie_manuel")).toBe(false);
    expect(repo.list("metrics").every((m) => m.source === "demo")).toBe(true);
    expect(repo.list("ads").some((a) => a.status === "active")).toBe(false);
  });
});
