import { describe, expect, it } from "vitest";
import { analyse, questions } from "@/lib/diag";

describe("Skin Diag : réponses multiples", () => {
  it("maximums affichés sur les questions à choix multiples", () => {
    const max = Object.fromEntries(questions.filter((q) => q.multi).map((q) => [q.id, q.max]));
    expect(max).toMatchObject({ concerns: 4, goal: 2, acneKind: 2, current: 4 });
  });
  it("deux objectifs : les deux apparaissent, le premier compte le plus", () => {
    const r = analyse({ skinType: "mixte", concerns: ["boutons"], acneKind: ["occasionnels", "inflammatoires"], goal: ["nette", "glowy"], time: "2", budget: "2", current: ["aucun"] });
    expect(r.goal).toContain(" · ");
    expect(r.items.length).toBeGreaterThan(0);
    expect(r.notes.some((n) => /dermatologue/.test(n))).toBe(true); // « inflammatoires » détecté dans une réponse multiple
  });
  it("ancienne réponse unique (texte) toujours acceptée", () => {
    const r = analyse({ skinType: "seche", concerns: ["secheresse"], goal: "hydrater", time: "1", budget: "1" });
    expect(r.goal).not.toContain(" · ");
  });
});
