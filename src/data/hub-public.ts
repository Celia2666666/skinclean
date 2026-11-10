import hub from "./hub-public.json";

/**
 * Copie publique, en lecture seule, du travail fait dans le Marketing Hub (outil local de l'équipe).
 * Régénérée par `git ls-files public | node scripts/export-hub-public.mjs`.
 */
export interface HubBlock { kind: string; title?: string; text: string; source?: string }
export interface HubSection { id: string; group: string; title: string; summary: string; blocks: HubBlock[] }
export const hubData = hub as Omit<typeof hub, "strategy"> & { strategy: HubSection[] };
export const hubSection = (id: string): HubSection => {
  const s = hubData.strategy.find((x) => x.id === id);
  if (!s) throw new Error(`Section du Hub introuvable : ${id}`);
  return s;
};
