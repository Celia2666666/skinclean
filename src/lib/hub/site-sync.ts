import "server-only";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { SiteOverrides } from "@/lib/site-overrides";
import { baseProducts } from "@/data/products";
import { baseKits } from "@/data/kits";
import { applyKitOverrides, applyProductOverrides } from "@/lib/site-overrides";

/**
 * Écriture des contenus marketing du site (src/data/site-overrides.json).
 * Le fichier est relu à chaque appel (pas de cache) pour ne jamais écraser une modification récente.
 */
const FILE = path.join(process.cwd(), "src", "data", "site-overrides.json");

export function readOverrides(): SiteOverrides {
  try {
    return JSON.parse(readFileSync(FILE, "utf8"));
  } catch {
    return {};
  }
}

export function writeOverrides(next: SiteOverrides, by: string) {
  const data: SiteOverrides = { ...next, updatedAt: new Date().toISOString(), updatedBy: by };
  writeFileSync(FILE, JSON.stringify(data, null, 2) + "\n");
  return data;
}

export function patchOverrides(fn: (o: SiteOverrides) => SiteOverrides, by: string) {
  return writeOverrides(fn(readOverrides()), by);
}

/** Catalogue publié, recalculé à partir du fichier de surcharges du moment (sans attendre le rechargement). */
export const liveProducts = () => applyProductOverrides(baseProducts, readOverrides());
export const liveKits = () => applyKitOverrides(baseKits, readOverrides());
export const allProductsIncludingHidden = () => {
  const o = readOverrides();
  return applyProductOverrides(baseProducts, { ...o, products: Object.fromEntries(Object.entries(o.products ?? {}).map(([k, v]) => [k, { ...v, hidden: false }])) }).map((p) => ({ ...p, hidden: !!o.products?.[p.id]?.hidden }));
};
