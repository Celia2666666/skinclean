import { describe, expect, it } from "vitest";
import { sign, verify } from "@/lib/sign";

describe("liens signés", () => {
  it("vérifie un jeton valide et rejette un jeton modifié ou expiré", () => {
    const t = sign({ a: 1 });
    expect(verify<{ a: number }>(t)?.a).toBe(1);
    const [body, mac] = t.split(".");
    expect(verify(body.slice(0, -2) + "xx." + mac)).toBeNull();
    expect(verify(sign({ a: 1, exp: Date.now() - 1 }))).toBeNull();
  });
});
