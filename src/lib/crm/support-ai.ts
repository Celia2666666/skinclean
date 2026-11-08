import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { ymdhm } from "@/lib/hub/dates";
import { shipping, loyalty, welcomeOffer } from "@/data/config";
import { all, one } from "./db";
import { ORDER_STATUS_LABEL, type Order, type SupportAi, type Ticket } from "./types";

/**
 * ASSISTANT SAV
 * 1. Tri : une demande « standard » (suivi de colis, code promo, feuilles du Club, conseil de routine, question produit courante)
 *    peut recevoir une réponse automatique ; une demande « spécifique » (réaction cutanée, grossesse, remboursement,
 *    colis abîmé ou perdu, réclamation, partenariat, données personnelles…) est réservée à l'équipe : « À toi de répondre ».
 *    Le tri est fait par des règles explicites (toujours appliquées, même avec l'IA : la sécurité ne dépend pas du modèle).
 * 2. Brouillon : rédigé par Claude si ANTHROPIC_API_KEY est défini (jamais d'invention : seules les données fournies),
 *    sinon par des réponses types complétées avec les vraies données de la commande (statut, suivi, dates).
 */

const HUMAN_RULES: [RegExp, string][] = [
  [/(r[ée]action|rougeur|br[uû]l|d[ée]mange|gonfl|allerg|ecz[ée]ma|bouton.*depuis|irrit)/i, "Réaction cutanée signalée : réponse personnalisée et suivi par l'équipe (cosmétovigilance)."],
  [/(enceinte|grossesse|allait|m[ée]decin|dermato|traitement|m[ée]dicament)/i, "Question de santé (grossesse, traitement) : ne pas répondre automatiquement."],
  [/(rembours|retourner|demande de retour|renvoyer le produit|[ée]chang|r[ée]tract|annul)/i, "Retour, échange ou remboursement : décision et étiquette retour à préparer par l'équipe."],
  [/(ab[iî]m[ée]|cass[ée]|coul[ée]|fui|endommag|non re[çc]u|pas re[çc]u|perdu|vol[ée])/i, "Colis abîmé, perdu ou non reçu : enquête transporteur ou renvoi à décider."],
  [/(plainte|inadmissible|scandale|arnaque|avocat|litige|d[ée][çc]u|\bnul\b|honte)/i, "Client mécontent : réponse humaine pour désamorcer."],
  [/(collab|partenariat|influen|presse|journal|revendeur|grossiste|cr[ée]atrice de contenu)/i, "Demande commerciale ou partenariat : à traiter par l'équipe."],
  [/(rgpd|supprim.*(compte|donn[ée]es)|mes donn[ée]es|d[ée]sinscri)/i, "Données personnelles (RGPD) : traitement manuel obligatoire."],
  [/(facture|tva|paiement refus|d[ée]bit[ée] deux|pr[ée]lev)/i, "Question de facturation ou de paiement : vérification manuelle."],
];

export function triage(t: Ticket): { triage: "auto" | "humain"; reason: string } {
  const text = `${t.subject} ${t.messages.filter((m) => m.from === "client").map((m) => m.body).join(" ")}`;
  if (t.priority === "urgente") return { triage: "humain", reason: "Demande marquée urgente." };
  if (t.category === "retour") return { triage: "humain", reason: "Retour, échange ou remboursement : décision et étiquette retour à préparer par l'équipe." };
  for (const [re, reason] of HUMAN_RULES) if (re.test(text)) return { triage: "humain", reason };
  if (t.messages.filter((m) => m.from === "client").length >= 3) return { triage: "humain", reason: "Échange déjà long : le client attend une vraie personne." };
  return { triage: "auto", reason: "Question standard : la réponse type est fiable." };
}

const first = (n: string) => n.split(" ")[0] || "";
const fr = (s?: string) => (s ? s.slice(0, 10).split("-").reverse().join("/") : "");
function orderOf(t: Ticket): Order | undefined {
  if (t.orderId) return one("orders", t.orderId);
  const os = all("orders").filter((o) => o.customerId === t.customerId || (t.email && o.email === t.email));
  return os.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

/** Réponse type, complétée avec les données réelles de la commande et du catalogue. */
function templateReply(t: Ticket, triageResult: { triage: string }): string {
  const name = first(t.customerName);
  const hello = `Bonjour${name ? ` ${name}` : ""},\n\n`;
  const sign = "\n\nBelle journée,\nL'équipe SKINCLEAN";
  const text = `${t.subject} ${t.messages.map((m) => m.body).join(" ")}`.toLowerCase();
  const o = orderOf(t);
  if (triageResult.triage === "humain") {
    // Brouillon de départ pour l'équipe (jamais envoyé automatiquement)
    const ctx = o ? ` concernant ta commande ${o.number} du ${fr(o.createdAt)}` : "";
    return `${hello}Merci pour ton message${ctx}, et désolés pour la gêne occasionnée. [À compléter : solution proposée — renvoi, remboursement, étiquette retour, conseil personnalisé…]\n\nNous revenons vers toi personnellement dans les plus brefs délais.${sign}`;
  }
  if (/(commande|colis|livr|suivi|exp[ée]di|re[çc]u|partie)/.test(text) && o) {
    const st = ORDER_STATUS_LABEL[o.status].toLowerCase();
    const track = o.tracking ? ` Ton numéro de suivi Colissimo : ${o.tracking}.` : "";
    const when = o.status === "payee" || o.status === "en_preparation" ? ` Elle part sous 24 à 48 h ouvrées, puis ${shipping.label.toLowerCase().replace("livraison ", "livraison ")}.` : o.status === "expediee" ? " La livraison intervient généralement sous 48 à 72 h." : "";
    return `${hello}Ta commande ${o.number} du ${fr(o.createdAt)} est actuellement : ${st}.${when}${track}\n\nTu peux aussi suivre son statut à tout moment dans ton espace client, rubrique « Mes commandes ».${sign}`;
  }
  if (/(code|promo|r[ée]duc|bienvenue|remise)/.test(text))
    return `${hello}Le code de bienvenue (−${welcomeOffer.newsletterPercent} % sur ta première commande) est valable ${welcomeOffer.validityDays} jours après ton inscription à la newsletter. Il ne s'applique pas aux coffrets, déjà remisés, et n'est pas cumulable avec un autre code ni avec les feuilles du Club. Si ton panier contient un coffret, retire-le puis réessaie le code.${sign}`;
  if (/(feuille|club|fid[ée]lit|points?)/.test(text))
    return `${hello}Les feuilles du SKINCLEAN Club sont créditées à l'${loyalty.creditedOn} (${loyalty.leavesPerEuro} feuille par euro dépensé). Elles apparaissent donc dans ton espace Club dès que ta commande est partie. Tu peux les échanger au panier : ${loyalty.rewards.map((r) => `${r.leaves} feuilles = ${r.value} €`).join(", ")}.${sign}`;
  if (/(routine|conseil|peau|matin|soir|ordre|s[ée]rum|cr[eè]me)/.test(text))
    return `${hello}Merci pour ta question ! Pour une routine vraiment adaptée, le plus fiable est le Skin Diag (10 questions, 2 minutes) : il te propose une routine matin et soir avec l'explication de chaque soin. Notre règle d'or : du plus fluide au plus épais, et un SPF chaque matin.\n\nSi tu le souhaites, réponds avec ton type de peau et tes préoccupations, nous t'orienterons vers les bons soins.${sign}`;
  if (/(stock|rupture|dispo|revient)/.test(text))
    return `${hello}Ce produit est momentanément victime de son succès. Inscris-toi à l'alerte « Me prévenir du retour en stock » sur sa fiche produit : tu recevras un e-mail dès qu'il sera de nouveau disponible.${sign}`;
  return `${hello}Merci pour ton message ! Tu trouveras la plupart des réponses (livraison, retours, Club, codes promo) dans notre FAQ. Si ta question n'y figure pas, réponds simplement à cet e-mail et nous revenons vers toi sous 48 h ouvrées.${sign}`;
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["reply"],
  properties: { reply: { type: "string", description: "Réponse e-mail complète, en français, tutoiement, signée « L'équipe SKINCLEAN »." } },
} as const;

/** Brouillon rédigé par Claude à partir des seules données fournies (null si pas de clé ou en cas d'échec). */
async function claudeReply(t: Ticket, tr: { triage: string; reason: string }): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const o = orderOf(t);
  const facts = [
    `Livraison : ${shipping.label}, ${shipping.standardPrice} € (offerte dès ${shipping.freeFrom} €).`,
    `Code de bienvenue : −${welcomeOffer.newsletterPercent} % sur la 1re commande, ${welcomeOffer.validityDays} jours, hors coffrets, non cumulable.`,
    `Club : ${loyalty.leavesPerEuro} feuille par euro, créditées à l'${loyalty.creditedOn}. Récompenses : ${loyalty.rewards.map((r) => `${r.leaves} = ${r.value} €`).join(", ")}.`,
    o ? `Commande liée : ${o.number} du ${fr(o.createdAt)}, statut « ${ORDER_STATUS_LABEL[o.status]} »${o.tracking ? `, suivi Colissimo ${o.tracking}` : ""}, articles : ${o.items.map((i) => `${i.qty}× ${i.name} ${i.size}`).join(", ")}, total ${o.total.toFixed(2)} €.` : "Aucune commande liée.",
  ].join("\n");
  const system = `Tu es l'assistant du service client de SKINCLEAN, marque de soins du visage. Tu rédiges des réponses e-mail courtes (5 à 8 lignes), chaleureuses, en tutoiement.
Règles : n'utilise que les informations fournies ; n'invente jamais de délai, de geste commercial, de remboursement ni de promesse d'efficacité ; aucun conseil médical.
${tr.triage === "humain" ? `Ce cas est réservé à l'équipe (${tr.reason}) : écris un BROUILLON prudent, avec entre crochets ce que l'équipe doit compléter ou décider.` : "Ce cas est standard : la réponse partira automatiquement, elle doit être complète et exacte."}
Signe « L'équipe SKINCLEAN ».`;
  try {
    const client = new Anthropic();
    const res = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA as unknown as Record<string, unknown> } },
      system,
      messages: [{ role: "user", content: `INFORMATIONS FIABLES :\n${facts}\n\nDEMANDE DU CLIENT (${t.customerName}, sujet « ${t.subject} ») :\n${t.messages.map((m) => `${m.from === "client" ? "Client" : "SKINCLEAN"} : ${m.body}`).join("\n")}` }],
    });
    if (res.stop_reason === "refusal") return null;
    const block = res.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") return null;
    return (JSON.parse(block.text) as { reply: string }).reply.trim() || null;
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) console.error("[SAV IA] clé ANTHROPIC_API_KEY invalide : réponses types utilisées.");
    else console.error("[SAV IA]", e);
    return null;
  }
}

/** Tri + brouillon d'une demande. */
export async function analyzeTicket(t: Ticket): Promise<SupportAi> {
  const tr = triage(t);
  const ai = await claudeReply(t, tr);
  return { ...tr, draft: ai ?? templateReply(t, tr), engine: ai ? "ia" : "modele", at: ymdhm(new Date()) };
}
