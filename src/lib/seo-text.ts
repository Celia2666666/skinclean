/**
 * Calibrage SEO des titres et meta descriptions.
 * Le gabarit du site ajoute « · SKINCLEAN » (12 caractères) après chaque titre : un titre de page doit donc
 * tenir en 48 caractères pour rester sous 60. Les meta descriptions visent 120 à 155 caractères.
 */
export const TITLE_MAX = 48;
export const DESC_MIN = 120;
export const DESC_MAX = 155;

/** Coupe proprement à la fin d'un mot, sans dépasser `max` caractères. */
export function clampText(text: string, max: number) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,;:.–—-]+$/, "") + "…";
}

/** Titre de page : essaie plusieurs formulations, de la plus riche à la plus courte. */
export function pageTitle(...candidates: (string | undefined)[]) {
  for (const c of candidates) if (c && c.length <= TITLE_MAX) return c;
  return clampText(candidates.find(Boolean) ?? "", TITLE_MAX);
}

/** Meta description de 120 à 155 caractères : on complète avec les phrases suivantes si c'est trop court. */
export function metaDescription(...parts: (string | undefined)[]) {
  let out = "";
  for (const p of parts) {
    if (!p) continue;
    const next = out ? `${out} ${p.trim()}` : p.trim();
    if (next.length > DESC_MAX) {
      if (out.length >= DESC_MIN) break;
      return clampText(next, DESC_MAX);
    }
    out = next;
    if (out.length >= DESC_MIN) break;
  }
  return out;
}

/** Titre d'une fiche produit : « Nom — nature du soin », raccourci si besoin. */
export const productTitle = (p: { name: string; kind: string }) =>
  pageTitle(`${p.name} — ${p.kind}`, `${p.name} — ${p.kind.split(/ \+ | à | de /)[0]}`, p.name);
