/**
 * SKIN DIAG — questions conditionnelles + moteur de recommandation.
 * Outil de conseil cosmétique, pas un diagnostic médical.
 * Le moteur ne pioche que dans le catalogue réel (data/products.ts) : mêmes ids, mêmes prix.
 */
import { products } from "@/data/products";
import { concernLabels, skinTypeLabels, stepLabels, stepOrder } from "@/data/categories";
import type { Concern, Moment, Product, RoutineStep, SkinType } from "./types";

export type Answers = Record<string, string | string[] | undefined>;

export interface Option { value: string; label: string; emoji?: string; hint?: string }
export interface Question {
  id: string;
  title: string;
  subtitle?: string;
  multi?: boolean;
  max?: number;
  options: Option[];
  /** Question affichée uniquement si la condition est vraie. */
  when?: (a: Answers) => boolean;
  help?: string;
}

const has = (a: Answers, id: string, v: string) => {
  const x = a[id];
  return Array.isArray(x) ? x.includes(v) : x === v;
};

export const questions: Question[] = [
  {
    id: "skinType",
    title: "Quel est ton type de peau ?",
    subtitle: "Pense à ta peau en fin de journée, sans soin.",
    help: "Peau grasse : brille sur tout le visage. Mixte : brille surtout sur la zone T (front, nez, menton). Sèche : tiraille et manque de confort. Sensible : réagit facilement (rougeurs, picotements).",
    options: [
      { value: "seche", label: "Sèche", },
      { value: "grasse", label: "Grasse", },
      { value: "mixte", label: "Mixte", },
      { value: "normale", label: "Normale", },
      { value: "sensible", label: "Sensible", },
      { value: "inconnu", label: "Je ne sais pas", hint: "On va le découvrir ensemble" },
    ],
  },
  {
    id: "concerns",
    title: "Quelles sont tes préoccupations principales ?",
    subtitle: "Choisis jusqu'à 3 réponses.",
    multi: true,
    max: 3,
    options: [
      { value: "boutons", label: "Boutons", },
      { value: "points-noirs", label: "Points noirs", },
      { value: "rougeurs", label: "Rougeurs", },
      { value: "secheresse", label: "Sécheresse", },
      { value: "deshydratation", label: "Déshydratation", },
      { value: "sebum", label: "Excès de sébum", },
      { value: "pores", label: "Pores visibles", },
      { value: "terne", label: "Teint terne", },
      { value: "cernes", label: "Cernes", },
      { value: "ridules", label: "Premières ridules", },
      { value: "rebondi", label: "Manque de rebondi", },
    ],
  },
  {
    id: "acneFreq",
    title: "À quelle fréquence as-tu des imperfections ?",
    when: (a) => has(a, "concerns", "boutons") || has(a, "concerns", "points-noirs"),
    options: [
      { value: "quotidien", label: "Quotidiennement" },
      { value: "hebdo", label: "Plusieurs fois par semaine" },
      { value: "mensuel", label: "Quelques fois par mois" },
      { value: "rare", label: "Rarement" },
    ],
  },
  {
    id: "acneKind",
    title: "Comment décrirais-tu tes imperfections ?",
    when: (a) => has(a, "concerns", "boutons") || has(a, "concerns", "points-noirs"),
    options: [
      { value: "occasionnels", label: "Petits boutons occasionnels" },
      { value: "points-noirs", label: "Points noirs" },
      { value: "inflammatoires", label: "Boutons inflammatoires", hint: "Rouges, parfois douloureux" },
      { value: "localisees", label: "Imperfections localisées", hint: "Menton, mâchoire…" },
      { value: "inconnu", label: "Je ne sais pas" },
    ],
  },
  {
    id: "afterCleanse",
    title: "Comment ta peau réagit-elle après le nettoyage ?",
    options: [
      { value: "tiraille", label: "Elle tiraille", },
      { value: "confortable", label: "Elle reste confortable", },
      { value: "brillante", label: "Elle devient vite brillante", },
      { value: "rougeurs", label: "Elle présente des rougeurs", },
    ],
  },
  {
    id: "rednessKind",
    title: "Tes rougeurs sont plutôt…",
    when: (a) => has(a, "concerns", "rougeurs") || has(a, "afterCleanse", "rougeurs"),
    options: [
      { value: "passageres", label: "Passagères", hint: "Après le nettoyage, le froid, le sport" },
      { value: "chaleur", label: "Avec des sensations de chaleur" },
      { value: "persistantes", label: "Persistantes, presque permanentes" },
    ],
  },
  {
    id: "goal",
    title: "Quel est ton objectif principal ?",
    options: [
      { value: "nette", label: "Avoir une peau plus nette", },
      { value: "glowy", label: "Avoir une peau glowy", },
      { value: "hydrater", label: "Hydrater intensément", },
      { value: "apaiser", label: "Apaiser les rougeurs", },
      { value: "pores", label: "Réduire l'apparence des pores", },
      { value: "ridules", label: "Prévenir les premières ridules", },
      { value: "uniforme", label: "Retrouver un teint plus uniforme", },
    ],
  },
  {
    id: "reactivity",
    title: "Ta peau est-elle réactive ?",
    subtitle: "Picotements, rougeurs ou inconfort avec certains produits.",
    options: [
      { value: "tres-souvent", label: "Très souvent" },
      { value: "parfois", label: "Parfois" },
      { value: "rarement", label: "Rarement" },
      { value: "inconnu", label: "Je ne sais pas" },
    ],
  },
  {
    id: "retinoids",
    title: "As-tu déjà utilisé des rétinoïdes (rétinol, rétinal) ?",
    when: (a) => (has(a, "concerns", "ridules") || has(a, "goal", "ridules")) && !has(a, "reactivity", "tres-souvent") && !has(a, "skinType", "sensible"),
    options: [
      { value: "jamais", label: "Jamais" },
      { value: "bien", label: "Oui, bien tolérés" },
      { value: "mal", label: "Oui, mal tolérés" },
    ],
  },
  {
    id: "pregnancy",
    title: "Es-tu enceinte ou allaitante ?",
    subtitle: "Certains actifs sont déconseillés dans ce cas. Ta réponse reste sur ton appareil.",
    when: (a) => has(a, "retinoids", "bien"),
    options: [
      { value: "non", label: "Non" },
      { value: "oui", label: "Oui" },
      { value: "na", label: "Je préfère ne pas répondre" },
    ],
  },
  {
    id: "time",
    title: "Combien de temps souhaites-tu consacrer à ta routine ?",
    options: [
      { value: "1", label: "Moins de 5 minutes", },
      { value: "2", label: "5 à 10 minutes", emoji: "⏱" },
      { value: "3", label: "Plus de 10 minutes", },
    ],
  },
  {
    id: "budget",
    title: "Quel budget préfères-tu ?",
    options: [
      { value: "1", label: "Essentiel", hint: "Les gestes indispensables" },
      { value: "2", label: "Équilibré", hint: "Une routine complète en 5 étapes" },
      { value: "3", label: "Routine complète", hint: "Avec soins ciblés et extras" },
    ],
  },
  {
    id: "current",
    title: "Quels produits utilises-tu déjà ?",
    subtitle: "Plusieurs réponses possibles.",
    multi: true,
    options: [
      { value: "nettoyant", label: "Nettoyant" },
      { value: "serum", label: "Sérum" },
      { value: "creme", label: "Crème" },
      { value: "spf", label: "SPF" },
      { value: "exfoliant", label: "Exfoliant" },
      { value: "aucun", label: "Aucun" },
    ],
  },
];

export const visibleQuestions = (a: Answers) => questions.filter((q) => !q.when || q.when(a));

// ─────────────────────────── MOTEUR ───────────────────────────

export interface RoutineItem {
  step: RoutineStep;
  productId: string;
  variantId: string;
  moments: Moment[];
  reason: string;
  alternatives: string[];
  selected: boolean;
  optional?: boolean;
  frequency: string;
}

export interface DiagResult {
  id: string;
  createdAt: number;
  answers: Answers;
  skinType: SkinType;
  skinTypeLabel: string;
  concerns: string[];
  goal: string;
  hydration: "légère" | "modérée" | "intense";
  sensitivity: "élevée" | "modérée" | "faible";
  level: 1 | 2 | 3;
  items: RoutineItem[];
  notes: string[];
}

const concernMap: Record<string, Concern[]> = {
  boutons: ["acne"],
  "points-noirs": ["points-noirs", "pores"],
  rougeurs: ["rougeurs", "sensibilite"],
  secheresse: ["secheresse"],
  deshydratation: ["deshydratation"],
  sebum: ["sebum"],
  pores: ["pores"],
  terne: ["terne", "glow"],
  cernes: ["cernes"],
  ridules: ["ridules"],
  rebondi: ["rebondi"],
};
const goalMap: Record<string, Concern[]> = {
  nette: ["acne", "points-noirs"],
  glowy: ["glow", "terne"],
  hydrater: ["deshydratation", "secheresse"],
  apaiser: ["rougeurs", "sensibilite"],
  pores: ["pores", "sebum"],
  ridules: ["ridules", "rebondi"],
  uniforme: ["terne", "texture"],
};
export const goalLabels: Record<string, string> = {
  nette: "Une peau plus nette",
  glowy: "Une peau glowy",
  hydrater: "Hydrater intensément",
  apaiser: "Apaiser les rougeurs",
  pores: "Réduire l'apparence des pores",
  ridules: "Prévenir les premières ridules",
  uniforme: "Un teint plus uniforme",
};
const currentToStep: Record<string, RoutineStep> = {
  nettoyant: "nettoyage", serum: "serum", creme: "hydratation", spf: "protection", exfoliant: "exfoliation",
};

const one = (a: Answers, k: string) => (Array.isArray(a[k]) ? (a[k] as string[])[0] : (a[k] as string | undefined));
const many = (a: Answers, k: string) => (Array.isArray(a[k]) ? (a[k] as string[]) : a[k] ? [a[k] as string] : []);

export function analyse(a: Answers): DiagResult {
  // 1. Type de peau effectif
  let skinType = (one(a, "skinType") ?? "normale") as SkinType | "inconnu";
  const after = one(a, "afterCleanse");
  if (skinType === "inconnu") {
    skinType = after === "tiraille" ? "seche" : after === "brillante" ? "grasse" : after === "rougeurs" ? "sensible" : "normale";
  }
  const st = skinType as SkinType;

  // 2. Sensibilité → intensité maximale des actifs
  const react = one(a, "reactivity");
  const sensitive = st === "sensible" || react === "tres-souvent" || after === "rougeurs" || one(a, "rednessKind") === "chaleur";
  const moderate = !sensitive && (react === "parfois" || react === "inconnu");
  const maxIntensity = sensitive ? 1 : moderate ? 2 : 3;
  const allowRetinoid = one(a, "retinoids") === "bien" && one(a, "pregnancy") === "non" && !sensitive;

  // 3. Poids des préoccupations
  const w: Partial<Record<Concern, number>> = {};
  const add = (c: Concern, n: number) => (w[c] = (w[c] ?? 0) + n);
  many(a, "concerns").forEach((c) => concernMap[c]?.forEach((x) => add(x, 3)));
  const goal = one(a, "goal") ?? "glowy";
  goalMap[goal]?.forEach((x) => add(x, 2.5));
  if (st === "seche") { add("secheresse", 1.5); add("deshydratation", 1); }
  if (st === "grasse") { add("sebum", 1.5); add("pores", 0.5); }
  if (st === "mixte") { add("sebum", 0.8); add("pores", 0.6); add("deshydratation", 0.5); }
  if (sensitive) { add("sensibilite", 2); add("rougeurs", 1); }
  if (after === "tiraille") add("deshydratation", 1);
  if (after === "brillante") add("sebum", 1);

  // 4. Niveau de routine (budget × temps)
  const level = Math.max(1, Math.min(Number(one(a, "time") ?? 2), Number(one(a, "budget") ?? 2))) as 1 | 2 | 3;

  const eligible = (p: Product) =>
    p.routineRole === "core" &&
    p.skinTypes.includes(st) &&
    p.intensity <= maxIntensity &&
    (allowRetinoid || !p.actives.includes("retinoide"));

  const score = (p: Product) => {
    let s = p.concerns.reduce((acc, c) => acc + (w[c] ?? 0), 0);
    if (p.bestseller) s += 0.3;
    if (sensitive && p.intensity === 0) s += 1;
    if (level === 1 && p.variants[0].price > 26) s -= 1; // budget essentiel
    return s;
  };
  const ranked = (step: RoutineStep, extra?: (p: Product) => boolean) =>
    products.filter((p) => p.step === step && eligible(p) && (!extra || extra(p))).sort((x, y) => score(y) - score(x));

  const wanted: RoutineStep[] = ["nettoyage", "serum", "hydratation", "protection"];
  if (level >= 2) wanted.splice(1, 0, "tonique");
  if (level >= 3) {
    wanted.unshift("demaquillage");
    if ((w.cernes ?? 0) > 0 || (w.ridules ?? 0) >= 3) wanted.push("contour-yeux");
    wanted.push("masque");
  }

  const picks: Product[] = [];
  const items: RoutineItem[] = [];
  const reasonFor = (p: Product) => {
    const matched = p.concerns.filter((c) => (w[c] ?? 0) > 0).sort((x, y) => (w[y] ?? 0) - (w[x] ?? 0)).slice(0, 2).map((c) => concernLabels[c].toLowerCase());
    const parts: string[] = [];
    if (matched.length) parts.push(`Cible ${matched.join(" et ")}`);
    parts.push(`adapté à ta ${skinTypeLabels[st].toLowerCase()}`);
    let r = parts.join(", ") + ".";
    if (sensitive && p.intensity === 0) r += " Formule douce, idéale pour une peau réactive.";
    if (p.step === "protection") r = "Indispensable chaque matin pour protéger ta peau et préserver les bénéfices de ta routine.";
    if (p.step === "demaquillage") r = "Premier temps du double nettoyage du soir : retire maquillage et SPF sans frotter.";
    return r;
  };

  for (const step of wanted) {
    let list = ranked(step);
    // Compatibilité : pas d'acide le même soir qu'un rétinoïde, pas de double exfoliation
    const hasRetinoid = picks.some((p) => p.actives.includes("retinoide"));
    if (step === "tonique" && (hasRetinoid || level < 3)) list = list.filter((p) => !p.actives.some((x) => ["aha", "bha"].includes(x))).concat(list.filter((p) => p.actives.some((x) => ["aha", "bha"].includes(x))));
    const chosen = list[0];
    if (!chosen) continue;
    picks.push(chosen);
    items.push({
      step,
      productId: chosen.id,
      variantId: chosen.variants[0].id,
      moments: chosen.moments,
      reason: reasonFor(chosen),
      alternatives: list.slice(1, 4).map((p) => p.id),
      selected: true,
      frequency: chosen.frequency,
    });
  }

  // Deuxième sérum pour la routine complète : un sérum du matin + un du soir, sans conflit.
  if (level >= 3) {
    const first = picks.find((p) => p.step === "serum");
    const second = ranked("serum", (p) => p.id !== first?.id && !(first?.actives.includes("retinoide") && p.actives.some((x) => ["aha", "bha", "vitamine-c"].includes(x))))
      .filter((p) => !first || p.concerns.some((c) => !first.concerns.includes(c)))[0];
    if (first && second) {
      items.splice(items.findIndex((i) => i.productId === first.id) + 1, 0, {
        step: "serum", productId: second.id, variantId: second.variants[0].id,
        moments: first.moments.includes("soir") && second.moments.includes("matin") && first.moments.length === 1 ? ["matin"] : second.moments,
        reason: reasonFor(second) + " Applique-le après le premier sérum (du plus fluide au plus épais).",
        alternatives: [], selected: true, frequency: second.frequency,
      });
      picks.push(second);
    }
  }

  // Passe de compatibilité finale : jamais de rétinoïde avec un acide exfoliant (AHA/BHA) dans la même routine.
  const hasAcid = (id: string) => products.find((p) => p.id === id)!.actives.some((x) => x === "aha" || x === "bha");
  if (items.some((i) => products.find((p) => p.id === i.productId)!.actives.includes("retinoide"))) {
    for (let k = items.length - 1; k >= 0; k--) {
      const it = items[k];
      if (!hasAcid(it.productId)) continue;
      const alt = ranked(it.step, (p) => !p.actives.some((x) => x === "aha" || x === "bha"))[0];
      if (alt) items[k] = { ...it, productId: alt.id, variantId: alt.variants[0].id, moments: alt.moments, frequency: alt.frequency, alternatives: [], reason: reasonFor(alt) + " Choisi sans acide exfoliant pour rester compatible avec ton rétinal." };
      else items.splice(k, 1);
    }
  }

  // Soin ciblé imperfections (patchs) en extra si boutons
  if ((w.acne ?? 0) >= 3) {
    const patch = products.find((p) => p.type === "patchs");
    if (patch) items.push({ step: "soin-cible", productId: patch.id, variantId: "std", moments: ["soir"], reason: "En SOS sur les imperfections, pour éviter d'y toucher.", alternatives: [], selected: level >= 2, optional: level < 2, frequency: patch.frequency });
  }

  // Produits déjà utilisés → étape optionnelle (décochée)
  const current = many(a, "current");
  for (const c of current) {
    const step = currentToStep[c];
    items.filter((i) => i.step === step).forEach((i) => {
      i.optional = true;
      i.selected = false;
      i.reason += ` Tu as déjà un ${stepLabels[step].toLowerCase()} : garde-le s'il te convient, ou remplace-le par celui-ci.`;
    });
  }

  items.sort((x, y) => stepOrder.indexOf(x.step) - stepOrder.indexOf(y.step));

  const notes: string[] = [];
  if (one(a, "acneKind") === "inflammatoires" || one(a, "acneFreq") === "quotidien")
    notes.push("Tes imperfections semblent fréquentes ou inflammatoires : si elles sont douloureuses ou persistent, l'avis d'un·e dermatologue ou d'un·e professionnel·le de santé est recommandé. SKINCLEAN accompagne ta routine mais ne remplace pas un traitement.");
  if (one(a, "rednessKind") === "persistantes")
    notes.push("Des rougeurs persistantes peuvent avoir différentes causes : n'hésite pas à consulter un·e professionnel·le de santé pour en parler.");
  if (sensitive) notes.push("Ta peau est réactive : nous avons écarté les actifs les plus puissants. Introduis un nouveau produit à la fois et fais un test sur une petite zone.");
  if (items.some((i) => products.find((p) => p.id === i.productId)?.actives.some((x) => ["aha", "bha", "pha", "retinoide", "vitamine-c", "acide-azelaique"].includes(x))))
    notes.push("Ta routine contient des actifs qui rendent la protection solaire du matin indispensable.");

  return {
    id: "diag-" + Date.now().toString(36),
    createdAt: Date.now(),
    answers: a,
    skinType: st,
    skinTypeLabel: skinTypeLabels[st],
    concerns: many(a, "concerns").map((c) => concernLabels[(concernMap[c]?.[0] ?? "glow") as Concern]),
    goal: goalLabels[goal] ?? goal,
    hydration: st === "seche" || (w.deshydratation ?? 0) >= 3 || (w.secheresse ?? 0) >= 3 ? "intense" : st === "grasse" ? "légère" : "modérée",
    sensitivity: sensitive ? "élevée" : moderate ? "modérée" : "faible",
    level,
    items,
    notes,
  };
}

/** Produits complémentaires proposés sous la routine (non inclus). */
export function complementsFor(r: DiagResult) {
  const inRoutine = new Set(r.items.map((i) => i.productId));
  return products
    .filter((p) => p.type !== "accessoire" && !inRoutine.has(p.id) && p.skinTypes.includes(r.skinType) && (r.sensitivity !== "élevée" || p.intensity <= 1) && !p.actives.includes("retinoide"))
    .filter((p) => ["brume", "masque", "contour-yeux", "exfoliation", "soin-cible"].includes(p.step) || p.routineRole === "addon")
    .slice(0, 4);
}
