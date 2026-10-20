import "server-only";
import { getProduct } from "@/lib/catalog";
import type { RoutinePayload } from "@/lib/routine-link";

/** Valide une routine reçue du client : uniquement des produits/variantes existants du catalogue. */
export function sanitizeRoutine(input: unknown): RoutinePayload | null {
  if (!input || typeof input !== "object") return null;
  const b = input as { items?: unknown; name?: unknown; profile?: unknown };
  if (!Array.isArray(b.items) || b.items.length === 0 || b.items.length > 15) return null;
  const items: RoutinePayload["i"] = [];
  for (const raw of b.items) {
    const it = raw as { productId?: string; variantId?: string; step?: string; moments?: string[] };
    const p = it?.productId ? getProduct(it.productId) : undefined;
    if (!p) continue;
    const v = p.variants.find((x) => x.id === it.variantId) ?? p.variants[0];
    const m = Array.isArray(it.moments) ? it.moments : p.moments;
    const mm = m.includes("matin") && m.includes("soir") ? "ms" : m.includes("matin") ? "m" : "s";
    items.push([p.id, v.id, String(it.step ?? p.step).slice(0, 20), mm]);
  }
  if (!items.length) return null;
  const pr = b.profile as { skinType?: string; concerns?: string[]; goal?: string; hydration?: string } | undefined;
  return {
    v: 1,
    i: items,
    n: typeof b.name === "string" ? b.name.slice(0, 60) : undefined,
    p: pr ? { st: String(pr.skinType ?? "").slice(0, 40), c: (pr.concerns ?? []).slice(0, 5).map((c) => String(c).slice(0, 40)), g: String(pr.goal ?? "").slice(0, 60), h: pr.hydration ? String(pr.hydration).slice(0, 20) : undefined } : undefined,
    t: Date.now(),
  };
}
