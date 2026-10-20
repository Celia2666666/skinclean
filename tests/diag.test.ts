import { describe, expect, it } from "vitest";
import { analyse, visibleQuestions } from "@/lib/diag";
import { getProduct } from "@/lib/catalog";

const base = { time: "2", budget: "2", reactivity: "rarement", afterCleanse: "confortable", goal: "glowy", current: ["aucun"] };

describe("Skin Diag", () => {
  it("questions conditionnelles : fréquence des imperfections seulement si boutons", () => {
    expect(visibleQuestions({ concerns: ["terne"] }).some((q) => q.id === "acneFreq")).toBe(false);
    expect(visibleQuestions({ concerns: ["boutons"] }).some((q) => q.id === "acneFreq")).toBe(true);
  });
  it("routine équilibrée ≈ 5 étapes avec SPF et produits du catalogue", () => {
    const r = analyse({ ...base, skinType: "mixte", concerns: ["boutons", "pores"], goal: "nette" });
    const core = r.items.filter((i) => !i.optional);
    expect(core.length).toBeGreaterThanOrEqual(5);
    expect(r.items.some((i) => i.step === "protection")).toBe(true);
    for (const i of r.items) expect(getProduct(i.productId)).toBeDefined();
    expect(r.items.some((i) => i.productId === "sc-sr-01")).toBe(true);
  });
  it("peau réactive : aucun actif d'intensité > 1", () => {
    const r = analyse({ ...base, skinType: "sensible", reactivity: "tres-souvent", concerns: ["rougeurs", "terne"] });
    for (const i of r.items) expect(getProduct(i.productId)!.intensity).toBeLessThanOrEqual(1);
  });
  it("pas de rétinoïde sans tolérance déclarée ni en cas de grossesse", () => {
    const a = analyse({ ...base, skinType: "normale", concerns: ["ridules"], goal: "ridules", retinoids: "jamais", budget: "3", time: "3" });
    expect(a.items.some((i) => getProduct(i.productId)!.actives.includes("retinoide"))).toBe(false);
    const b = analyse({ ...base, skinType: "normale", concerns: ["ridules"], goal: "ridules", retinoids: "bien", pregnancy: "oui", budget: "3", time: "3" });
    expect(b.items.some((i) => getProduct(i.productId)!.actives.includes("retinoide"))).toBe(false);
  });
  it("rétinoïde + acide exfoliant jamais combinés", () => {
    const r = analyse({ ...base, skinType: "normale", concerns: ["ridules", "pores"], goal: "ridules", retinoids: "bien", pregnancy: "non", budget: "3", time: "3" });
    const acts = r.items.flatMap((i) => getProduct(i.productId)!.actives);
    if (acts.includes("retinoide")) expect(acts.some((a) => a === "aha" || a === "bha")).toBe(false);
  });
  it("budget essentiel : routine courte", () => {
    const r = analyse({ ...base, skinType: "seche", concerns: ["secheresse"], budget: "1", time: "3" });
    expect(r.items.filter((i) => !i.optional).length).toBeLessThanOrEqual(4);
  });
  it("conseille un professionnel pour des imperfections inflammatoires", () => {
    const r = analyse({ ...base, skinType: "grasse", concerns: ["boutons"], acneKind: "inflammatoires", acneFreq: "quotidien" });
    expect(r.notes.join(" ")).toMatch(/professionnel/);
  });
});
