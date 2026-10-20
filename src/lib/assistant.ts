/**
 * GLOW ASSISTANT — moteur guidé (scénarios + mots-clés), relié au vrai catalogue.
 * Ce n'est PAS une IA générative : l'interface l'indique. Une IA peut être branchée via /api/assistant.
 * Règles : aucun diagnostic médical, aucune promesse de résultat, aucun produit/prix/promo inventé.
 */
import { getProduct, getKit, getProducts, kitPricing } from "./catalog";
import { loyalty, welcomeOffer, firstOrderGift, shipping } from "@/data/config";
import { concernLabels, skinTypeLabels, stepLabels, stepOrder } from "@/data/categories";
import type { Answers } from "./diag";
import type { CartLine } from "./types";

export interface QuickReply { label: string; value: string }
export interface BotMessage {
  from: "bot" | "user";
  text: string;
  products?: string[];
  kits?: string[];
  quick?: QuickReply[];
  links?: { label: string; href: string; prefill?: Answers }[];
  form?: "newsletter";
}
export interface FlowState { flow?: string; data: Record<string, string> }

export const welcomeQuick: QuickReply[] = [
  { label: "J'ai des boutons", value: "acne" },
  { label: "Je veux une peau glowy", value: "glow" },
  { label: "Ma peau est sèche", value: "dry" },
  { label: "J'ai la peau grasse", value: "oily" },
  { label: "J'ai des rougeurs", value: "redness" },
  { label: "Trouver ma routine", value: "routine" },
  { label: "Comment avoir des réductions ?", value: "discounts" },
  { label: "Suivre ma commande", value: "order" },
];

const diagCta = (prefill?: Answers): BotMessage => ({
  from: "bot",
  text: "Tu veux une routine vraiment adaptée à ta peau ? Fais ton Skin Diag pour découvrir tous les soins qui te correspondent ! ",
  links: [{ label: prefill ? "Faire mon Skin Diag (avec mes réponses)" : "Faire mon Skin Diag", href: "/skin-diag", prefill }],
  quick: [{ label: "Autre question", value: "menu" }],
});

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Détecte une intention dans un message libre. */
export function detectIntent(text: string): string {
  const t = norm(text);
  const rules: [RegExp, string][] = [
    [/(ordre|order|dans quel ordre|appliquer mes soins|etapes?)/, "faq-order"],
    [/(deux|2) serums?/, "faq-two-serums"],
    [/(hiver|froid|winter)/, "faq-winter"],
    [/(matin|morning)/, "faq-morning"],
    [/(budget|\d+ ?(€|euros?))/, "faq-budget"],
    [/(gagner|cumuler).*(feuille|point)|feuilles?/, "faq-leaves"],
    [/(recompense|utiliser mes feuilles|reward)/, "faq-rewards"],
    [/(retrouver|sauvegard|enregistr).*(routine)/, "faq-find-routine"],
    [/(reduc|promo|code|remise|-20|newsletter)/, "discounts"],
    [/(commande|colis|livraison|suivi)/, "order"],
    [/(bouton|acne|imperfection|point noir)/, "acne"],
    [/(glow|eclat|lumineu|terne)/, "glow"],
    [/(seche|tiraille|deshydrat)/, "dry"],
    [/(grasse|brill|sebum|pores?)/, "oily"],
    [/(rougeur|sensible|reactive|irrit)/, "redness"],
    [/(serum)/, "faq-serum"],
    [/(cerne|yeux)/, "eyes"],
    [/(ride|ridule|anti-age)/, "lines"],
    [/(routine|diag|quiz)/, "routine"],
    [/(compatible|ensemble|melanger|associer)/, "cart-check"],
    [/(eczema|psoriasis|infection|douleur|saigne|allergie grave|brulure)/, "medical"],
  ];
  return rules.find(([r]) => r.test(t))?.[1] ?? "unknown";
}

export function respond(input: string, state: FlowState, ctx: { cart: CartLine[]; orders: { id: string; status: string; date: number }[]; loggedIn: boolean; productId?: string }): { messages: BotMessage[]; state: FlowState } {
  const s: FlowState = { flow: state.flow, data: { ...state.data } };
  const out: BotMessage[] = [];

  // ── Suite d'un flow en cours ──
  if (s.flow === "acne" && !s.data.freq && ["reg", "occ", "idk"].includes(input)) {
    s.data.freq = input;
    out.push({ from: "bot", text: "Merci ! Et ta peau a plutôt tendance à briller ou à tirailler ?", quick: [{ label: "Elle brille ", value: "shine" }, { label: "Elle tiraille ", value: "tight" }, { label: "Un peu des deux", value: "mixed" }] });
    return { messages: out, state: s };
  }
  if (s.flow === "acne" && s.data.freq && ["shine", "tight", "mixed"].includes(input)) {
    const shine = input === "shine";
    const tight = input === "tight";
    const recos = s.data.freq === "occ" ? ["sc-pt-01", "sc-sr-01"] : shine ? ["sc-sr-01", "sc-cl-02"] : tight ? ["sc-sr-01", "sc-cl-01"] : ["sc-sr-01", "sc-cr-03"];
    out.push({
      from: "bot",
      text: tight
        ? "Ta peau a besoin de purifier sans dessécher. Je te propose le sérum Clear Skin à la niacinamide, avec un nettoyant très doux pour ne pas aggraver les tiraillements :"
        : s.data.freq === "occ"
          ? "Pour des imperfections occasionnelles, mise sur le SOS et la prévention :"
          : "Pour une peau qui brille avec des imperfections, ce duo aide à désencombrer les pores et réguler l'aspect brillant :",
      products: recos,
    });
    if (s.data.freq === "reg") out.push({ from: "bot", text: "Petit rappel : si tes boutons sont nombreux, douloureux ou persistent, l'avis d'un·e dermatologue est précieux. Les soins SKINCLEAN accompagnent ta peau mais ne remplacent pas un traitement." });
    out.push(diagCta({ concerns: ["boutons"], skinType: shine ? "grasse" : tight ? "seche" : "mixte", acneFreq: s.data.freq === "reg" ? "hebdo" : "mensuel" }));
    return { messages: out, state: { data: {} } };
  }

  const intent = welcomeQuick.some((q) => q.value === input) || input.startsWith("faq-") || ["menu", "cart-check", "eyes", "lines", "medical", "product-fit", "serum-help", "diag-help", "club-help"].includes(input) ? input : detectIntent(input);

  switch (intent) {
    case "menu":
      out.push({ from: "bot", text: "Je t'écoute ! Choisis un sujet ou écris ta question ", quick: welcomeQuick });
      break;
    case "acne":
      s.flow = "acne";
      s.data = {};
      out.push({ from: "bot", text: "On va trouver ce qui te convient  Tes imperfections apparaissent plutôt régulièrement ou occasionnellement ?", quick: [{ label: "Régulièrement", value: "reg" }, { label: "De temps en temps", value: "occ" }, { label: "Je ne sais pas", value: "idk" }] });
      break;
    case "glow":
      out.push({ from: "bot", text: "Le glow, c'est surtout une peau bien hydratée, exfoliée en douceur et protégée du soleil  Mes conseils : une vitamine C le matin, une hydratation en couches (toner + crème), une exfoliation douce 1 à 2 fois par semaine… et un SPF chaque jour." });
      out.push({ from: "bot", text: "Les soins SKINCLEAN qui peuvent t'aider :", products: ["sc-sr-02", "sc-cr-01"], kits: ["summer-glow", "glass-skin-routine"] });
      out.push(diagCta({ goal: "glowy", concerns: ["terne"] }));
      break;
    case "dry":
      out.push({ from: "bot", text: "Une peau sèche manque de lipides, souvent aussi d'eau. Le combo gagnant : un sérum hydratant sur peau humide, puis une crème riche pour sceller ", products: ["sc-sr-03", "sc-cr-02"] });
      out.push(diagCta({ skinType: "seche", concerns: ["secheresse"] }));
      break;
    case "oily":
      out.push({ from: "bot", text: "Une peau grasse a aussi besoin d'hydratation ! On régule la brillance sans décaper, sinon la peau produit encore plus de sébum.", products: ["sc-sr-01", "sc-cr-03"] });
      out.push(diagCta({ skinType: "grasse", concerns: ["sebum"] }));
      break;
    case "redness":
      out.push({ from: "bot", text: "Pour les rougeurs, on mise sur la douceur : pas de frottement, des formules apaisantes et une protection solaire minérale ", products: ["sc-sr-04", "sc-cr-04", "sc-sp-02"] });
      out.push({ from: "bot", text: "Si tes rougeurs sont persistantes, s'accompagnent de brûlures ou de boutons, parles-en à un·e professionnel·le de santé." });
      out.push(diagCta({ concerns: ["rougeurs"], reactivity: "parfois" }));
      break;
    case "eyes":
      out.push({ from: "bot", text: "Pour un regard défatigué, un gel frais à la caféine le matin, une crème plus riche le soir si tu as des ridules :", products: ["sc-ey-01", "sc-ey-02"] });
      out.push(diagCta({ concerns: ["cernes"] }));
      break;
    case "lines":
      out.push({ from: "bot", text: "Pour les premières ridules : protection solaire quotidienne (le geste n°1), hydratation, et un actif lissant le soir. Le bakuchiol est une option douce ; le rétinal, plus puissant, s'introduit progressivement et est déconseillé pendant la grossesse.", products: ["sc-sr-05", "sc-sp-01"] });
      out.push(diagCta({ concerns: ["ridules"], goal: "ridules" }));
      break;
    case "routine":
      out.push({ from: "bot", text: "Le Skin Diag, c'est 10 questions (2 minutes) pour une routine en ~5 étapes, matin et soir, avec les explications pour chaque produit. Tu peux ensuite la modifier, l'ajouter au panier ou la recevoir par e-mail ", links: [{ label: "Faire mon Skin Diag", href: "/skin-diag" }], quick: [{ label: "Autre question", value: "menu" }] });
      break;
    case "discounts":
      out.push({ from: "bot", text: `Bonne nouvelle ! Inscris-toi à notre newsletter et profite de -${welcomeOffer.newsletterPercent} % sur ta première commande.  En plus, tu reçois ${loyalty.newsletterBonus} feuilles SKINCLEAN CLUB une fois ton inscription confirmée et rattachée à ton compte.`, form: "newsletter" });
      out.push({ from: "bot", text: `Avec le SKINCLEAN CLUB, tu gagnes ${loyalty.leavesPerEuro} feuille par euro dépensé, à échanger contre des réductions (dès ${loyalty.rewards[0].leaves} feuilles = ${loyalty.rewards[0].value} €).${firstOrderGift.enabled ? ` Et pour ta première commande : ${firstOrderGift.description.toLowerCase()} ` : ""}`, links: [{ label: "Découvrir le Club", href: "/club" }, { label: "Conditions de l'offre", href: welcomeOffer.conditionsHref }] });
      break;
    case "order": {
      if (!ctx.loggedIn && ctx.orders.length === 0) {
        out.push({ from: "bot", text: "Pour suivre ta commande, connecte-toi à ton compte : toutes tes commandes et leur statut y sont regroupés ", links: [{ label: "Me connecter", href: "/compte/connexion" }, { label: "Livraison & retours", href: "/livraison" }] });
      } else if (ctx.orders.length === 0) {
        out.push({ from: "bot", text: "Je ne vois pas encore de commande sur ton compte. Dès que tu en passes une, son suivi apparaîtra ici et dans ton espace client.", links: [{ label: "Mon compte", href: "/compte/commandes" }] });
      } else {
        const o = ctx.orders[0];
        const label: Record<string, string> = { test: "commande de test (non payée)", payee: "payée, en préparation", expediee: "expédiée", livree: "livrée", remboursee: "remboursée", "retour-demande": "retour demandé" };
        out.push({ from: "bot", text: `Ta dernière commande ${o.id} est : ${label[o.status] ?? o.status}.`, links: [{ label: "Voir mes commandes", href: "/compte/commandes" }] });
      }
      break;
    }
    case "cart-check":
      out.push(cartCheck(ctx.cart));
      break;
    case "faq-order":
      out.push({ from: "bot", text: "La règle d'or : du plus fluide au plus épais  Voici l'ordre SKINCLEAN :\n" + stepOrder.map((st, i) => `${i + 1}. ${stepLabels[st]}`).join("\n") + "\nLe SPF, toujours en dernier le matin ; le démaquillage, uniquement le soir.", quick: [{ label: "Puis-je utiliser 2 sérums ?", value: "faq-two-serums" }, { label: "Autre question", value: "menu" }] });
      break;
    case "faq-two-serums":
      out.push({ from: "bot", text: "Oui ! Applique d'abord le plus fluide (ex. Aqua Plump), attends 30 secondes, puis le sérum ciblé. Évite seulement de cumuler le même soir un rétinoïde (Night Renew) et un exfoliant acide (Smooth Reset, BHA Clear Liquid) : alterne les soirs. La vitamine C se garde pour le matin.", products: ["sc-sr-03", "sc-sr-01"] });
      break;
    case "faq-winter": {
      const k = getKit("winter-rescue");
      out.push({ from: "bot", text: `Pour l'hiver, je te conseille le ${k?.name} : démaquillage doux, hydratation intense et crème cocon aux céramides `, kits: ["winter-rescue", "hydration-boost"] });
      break;
    }
    case "faq-morning":
      out.push({ from: "bot", text: "Une routine du matin simple et efficace : 1. nettoyant doux, 2. sérum (vitamine C pour l'éclat ou niacinamide pour les imperfections), 3. crème hydratante, 4. SPF — indispensable ", products: ["sc-cl-01", "sc-sr-02", "sc-sp-01"] });
      break;
    case "faq-budget": {
      const m = norm(input).match(/(\d+)/);
      const budget = m ? Number(m[1]) : 40;
      const combo = budgetRoutine(budget);
      out.push(combo.length
        ? { from: "bot", text: `Avec ${budget} €, voici une routine essentielle (prix catalogue actuels, total ${combo.reduce((s, p) => s + p.price, 0).toFixed(2).replace(".", ",")} €) :`, products: combo.map((c) => c.id) }
        : { from: "bot", text: `Avec ${budget} €, je te conseille de commencer par nos mini-formats.`, links: [{ label: "Voir les mini-formats", href: "/soins-visage/mini-formats" }] });
      out.push(diagCta({ budget: "1" }));
      break;
    }
    case "faq-leaves":
      out.push({ from: "bot", text: `Tu gagnes des feuilles  : ${loyalty.leavesPerEuro} par euro dépensé (créditées à l'${loyalty.creditedOn}), ${loyalty.newsletterBonus} à la confirmation de la newsletter, ${loyalty.reviewBonus} pour un avis (1 fois par mois), et un bonus anniversaire. Ton palier évolue selon les feuilles gagnées sur ${loyalty.tierWindowMonths} mois.`, links: [{ label: "Voir le SKINCLEAN Club", href: "/club" }] });
      break;
    case "faq-rewards":
      out.push({ from: "bot", text: `Au panier, choisis ta récompense : ${loyalty.rewards.map((r) => `${r.leaves}  = -${r.value} €`).join(", ")}. Les feuilles ne se cumulent pas avec un code promo ou un kit remisé, et expirent après ${loyalty.expiryMonthsInactivity} mois sans utilisation.`, links: [{ label: "Mon panier", href: "/panier" }] });
      break;
    case "faq-find-routine":
      out.push({ from: "bot", text: "Ta routine se retrouve de 3 façons : dans ton compte (Routines sauvegardées), via le lien sécurisé reçu par e-mail, ou en refaisant le Skin Diag. Le lien e-mail préremplit même ton panier ", links: [{ label: "Mes routines", href: "/compte/routines" }] });
      break;
    case "faq-serum":
    case "serum-help":
      out.push({ from: "bot", text: "Pour choisir ton sérum : peau grasse/imperfections → Clear Skin (niacinamide) ; teint terne → Glow Shot (vitamine C) ; déshydratation → Aqua Plump ; rougeurs → Calm Down ; premières ridules → First Lines.", products: ["sc-sr-01", "sc-sr-02", "sc-sr-03", "sc-sr-04"] });
      break;
    case "product-fit": {
      const p = ctx.productId ? getProduct(ctx.productId) : undefined;
      if (p) {
        out.push({ from: "bot", text: `${p.name} convient surtout aux peaux : ${p.skinTypes.map((t) => skinTypeLabels[t].replace("Peau ", "")).join(", ")}. Il cible : ${p.concerns.slice(0, 3).map((c) => concernLabels[c].toLowerCase()).join(", ")}.${p.precautions?.length ? ` À savoir : ${p.precautions[0].toLowerCase()}.` : ""} Pour être sûr·e qu'il s'intègre à ta routine, le Skin Diag est le plus fiable.` });
        out.push(diagCta());
      } else out.push({ from: "bot", text: "Dis-moi quel produit t'intéresse ou fais le Skin Diag pour une réponse personnalisée.", links: [{ label: "Skin Diag", href: "/skin-diag" }] });
      break;
    }
    case "diag-help":
      out.push({ from: "bot", text: "Pas de stress ! Peau grasse = brille partout ; mixte = brille sur la zone T ; sèche = tiraille ; sensible = réagit vite. Si tu hésites, choisis « Je ne sais pas » : la question suivante sur la réaction après nettoyage nous aidera à trancher." });
      break;
    case "club-help":
      return respond("faq-leaves", s, ctx);
    case "medical":
      out.push({ from: "bot", text: "Ce que tu décris mérite l'avis d'un·e médecin ou dermatologue. Je suis un conseiller cosmétique et je ne peux pas poser de diagnostic. En attendant, privilégie des soins très doux et sans parfum.", quick: [{ label: "Autre question", value: "menu" }] });
      break;
    default:
      out.push({ from: "bot", text: "Je ne suis pas sûr d'avoir compris  Je suis un assistant guidé : choisis un sujet ci-dessous, ou essaie avec des mots comme « sérum peau grasse », « ordre des soins », « budget 40 € ».", quick: welcomeQuick });
  }
  if (intent !== "acne") s.flow = undefined;
  return { messages: out, state: s };
}

function budgetRoutine(budget: number) {
  const all = getProducts().filter((p) => p.routineRole === "core");
  const cheapest = (step: string) => all.filter((p) => p.step === step).map((p) => ({ id: p.id, price: Math.min(...p.variants.filter((v) => !v.mini).map((v) => v.price)) })).sort((a, b) => a.price - b.price)[0];
  const picks = [cheapest("nettoyage"), cheapest("hydratation"), cheapest("protection"), cheapest("serum")].filter(Boolean);
  const res: { id: string; price: number }[] = [];
  for (const p of picks) if (res.reduce((s, x) => s + x.price, 0) + p.price <= budget) res.push(p);
  return res;
}

export function cartCheck(cart: CartLine[]): BotMessage {
  const ps = cart.map((l) => getProduct(l.productId)).filter(Boolean) as NonNullable<ReturnType<typeof getProduct>>[];
  if (!ps.length) return { from: "bot", text: "Ton panier est vide pour l'instant. Ajoute des produits et je vérifierai qu'ils s'accordent bien ", links: [{ label: "Faire mon Skin Diag", href: "/skin-diag" }] };
  const acts = new Set(ps.flatMap((p) => p.actives));
  const warn: string[] = [];
  if (acts.has("retinoide") && (acts.has("aha") || acts.has("bha"))) warn.push("Tu as un rétinoïde et un exfoliant acide : utilise-les des soirs différents.");
  const exfo = ps.filter((p) => p.actives.some((a) => ["aha", "bha", "pha", "enzymes"].includes(a)));
  if (exfo.length >= 2) warn.push(`Tu as ${exfo.length} produits exfoliants (${exfo.map((p) => p.name).join(", ")}) : alterne-les pour ne pas sensibiliser ta peau.`);
  if (acts.has("vitamine-c") && acts.has("retinoide")) warn.push("Vitamine C le matin, rétinal le soir : c'est le bon rythme.");
  const needsSpf = ps.some((p) => p.actives.some((a) => ["aha", "bha", "pha", "retinoide", "vitamine-c", "acide-azelaique"].includes(a)));
  const hasSpf = ps.some((p) => p.type === "spf");
  if (needsSpf && !hasSpf) warn.push("Tes soins contiennent des actifs qui rendent la protection solaire indispensable — pense à un SPF.");
  const steps = new Set(ps.map((p) => p.step));
  const tip = !steps.has("nettoyage") ? " Il te manque un nettoyant, la base de toute routine." : !steps.has("hydratation") ? " Pense à une crème pour sceller l'hydratation." : "";
  return {
    from: "bot",
    text: warn.length ? `J'ai regardé ton panier \n• ${warn.join("\n• ")}${tip}` : `Bonne nouvelle : tes produits s'associent bien ensemble ${tip}`,
    products: needsSpf && !hasSpf ? ["sc-sp-01"] : undefined,
  };
}

/** Suggestion contextuelle discrète selon la page. */
export function contextualHint(pathname: string): { text: string; intent: string } | null {
  if (pathname.startsWith("/produits/")) return { text: "Tu veux savoir si ce soin correspond à ta peau ?", intent: "product-fit" };
  if (pathname.includes("/serums")) return { text: "Besoin d'aide pour choisir ton sérum ?", intent: "serum-help" };
  if (pathname.startsWith("/skin-diag")) return { text: "Une question ? Je peux t'aider à comprendre les réponses.", intent: "diag-help" };
  if (pathname.startsWith("/club")) return { text: "Tu veux découvrir comment gagner plus de feuilles ?", intent: "club-help" };
  if (pathname.startsWith("/panier")) return { text: "Tu veux vérifier que tes produits fonctionnent bien ensemble ?", intent: "cart-check" };
  if (pathname.startsWith("/kits")) return { text: "Besoin d'aide pour choisir ton kit ?", intent: "faq-winter" };
  return null;
}

export { kitPricing, shipping };
