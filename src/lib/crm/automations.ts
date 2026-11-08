import "server-only";
import { addDays, parseLocal, todayYmd, ymdhm } from "@/lib/hub/dates";
import { sendEmail } from "@/emails/send";
import { emailLayout, button } from "@/emails/layout";
import { siteUrl } from "@/lib/sign";
import { all, crmMeta, crmUid, one, save, setCrmMeta } from "./db";
import { customerStats } from "./analytics";
import { baseProducts } from "@/data/products";
import type { Automation, AutomationKind, AutomationRun, Delivery } from "./types";

/**
 * MOTEUR D'AUTOMATISATIONS DU CRM (scénarios marketing déclenchés sans intervention).
 * - Exécuté automatiquement (au plus toutes les 10 minutes, à l'ouverture du CRM), à chaque retour en stock
 *   (réception fournisseur, ajustement) et à la demande (« Exécuter maintenant »).
 * - Chaque envoi est dédoublonné par une clé (un client ne reçoit jamais deux fois le même message).
 * - Honnêteté : les contacts de démonstration (@example.com) ne reçoivent rien (envoi « simulé ») ;
 *   sans clé Resend, aucun e-mail ne part non plus. Seul un envoi accepté par Resend est marqué « Envoyé ».
 */

export const DEFAULT_AUTOMATIONS: Omit<Automation, "updatedAt">[] = [
  { id: "back_in_stock", name: "Alerte retour en stock", description: "Prévient chaque personne inscrite (fiche produit ou Glow Assistant) dès que le produit est de nouveau disponible.", trigger: "Stock d'un produit attendu > 0", enabled: true, delayHours: 0,
    subject: "{produit} est de retour !", body: "Bonne nouvelle {prenom} : {produit} est de nouveau disponible. Les stocks partent vite, on te le met de côté le temps de passer commande ?" },
  { id: "cart_1", name: "Relance panier abandonné — 1ʳᵉ relance", description: "Rappelle le contenu du panier aux contacts identifiés qui n'ont pas finalisé leur commande.", trigger: "Panier abandonné sans relance", enabled: true, delayHours: 1,
    subject: "Ton panier t'attend", body: "{prenom}, tu as laissé {produit} dans ton panier. On l'a gardé pour toi : il ne reste qu'un clic." },
  { id: "cart_2", name: "Relance panier abandonné — 2ᵉ relance", description: "Deuxième rappel avec avis clients et conseils, sans remise systématique pour préserver la marge.", trigger: "Panier toujours abandonné après la 1ʳᵉ relance", enabled: true, delayHours: 24,
    subject: "Encore hésitant·e ? Voici ce qu'en pensent nos clients", body: "{prenom}, {produit} fait partie de nos soins préférés. Besoin d'un conseil avant de te décider ? Réponds simplement à cet e-mail." },
  { id: "welcome", name: "Bienvenue après la 1ʳᵉ commande", description: "Remercie et explique comment bien utiliser les soins reçus.", trigger: "Première commande payée", enabled: true, delayHours: 2,
    subject: "Bienvenue chez SKINCLEAN, {prenom} !", body: "Merci pour ta première commande ! Voici nos conseils pour bien démarrer ta routine et découvrir le SKINCLEAN Club." },
  { id: "review", name: "Demande d'avis après livraison", description: "Invite à noter les produits une semaine après la livraison (bonus de feuilles Club).", trigger: "Commande livrée depuis le délai", enabled: true, delayHours: 168,
    subject: "Alors, {prenom}, tu en penses quoi ?", body: "Tu utilises {produit} depuis une semaine : ton avis aide toute la communauté (et te rapporte 20 feuilles)." },
  { id: "replenish", name: "Rappel de réapprovisionnement", description: "Prévient quand un client arrive au bout de son produit, d'après son rythme d'achat habituel.", trigger: "Date de réachat estimée dans 3 jours", enabled: true, delayHours: 0,
    subject: "Bientôt à court de {produit} ?", body: "{prenom}, d'après tes habitudes, ton {produit} touche bientôt à sa fin. Recommande-le en 1 clic pour ne pas interrompre ta routine." },
  { id: "winback", name: "Réactivation des clients à risque", description: "Relance personnalisée des bons clients sans commande depuis plus de 4 mois.", trigger: "Segment RFM « À risque » ou « À ne pas perdre »", enabled: false, delayHours: 0,
    subject: "{prenom}, ta peau nous manque", body: "Ça fait un moment ! Découvre nos nouveautés et retrouve tes soins préférés." },
];

const CAP = 40; // envois maximum par scénario et par exécution
const first = (name: string) => name.split(" ")[0] || "toi";
/** « lina.legrand@… » → « Lina » (prénom deviné à partir de l'adresse quand le contact n'a pas de fiche). */
const nameFromEmail = (e: string) => { const n = e.split("@")[0].split(/[._\-\d]/)[0]; return n ? n[0].toUpperCase() + n.slice(1) : "toi"; };
const slugOf = (id: string) => baseProducts.find((p) => p.id === id)?.slug ?? "";
const fill = (t: string, v: Record<string, string>) => t.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");

export const DEMO_INBOX = "demo@skinclean.example";
const isReal = (a?: string) => !!a && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(a) && !/@example\.com$|\.example$/i.test(a);

/**
 * Envoi d'un e-mail du CRM. Chaque message est conservé dans la boîte de démo (/crm/boite-demo).
 * - Contact réel : envoyé via Resend si la clé existe, sinon « simulé ».
 * - Contact fictif (@example.com) : livré dans la boîte de démo ; réellement envoyé à l'adresse de démo
 *   seulement si elle est réelle, que la redirection est activée et que Resend est configuré.
 */
export async function deliver(to: string, subject: string, text: string, cta?: { href: string; label: string }, origin = "CRM"): Promise<{ delivery: Delivery; detail?: string }> {
  const esc = (x: string) => x.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);
  const html = emailLayout({ preheader: subject, body: `<p style="font-size:15px;line-height:24px">${esc(text).replace(/\n/g, "<br>")}</p>${cta ? `<p style="text-align:center">${button(cta.href, cta.label)}</p>` : ""}` });
  const st = one("settings", "settings");
  const demoInbox = st?.demoInbox || DEMO_INBOX;
  const fake = to.toLowerCase().endsWith("@example.com");
  let r: { delivery: Delivery; detail?: string; deliveredTo?: string };
  if (process.env.VERCEL) {
    // Démo publique en ligne : jamais d'envoi réel
    r = { delivery: "simule", detail: `Démo en ligne : aucun envoi, visible dans la boîte de démo (${demoInbox})`, deliveredTo: demoInbox };
  } else if (fake && !(st?.redirectDemo && isReal(demoInbox))) {
    r = { delivery: "simule", detail: `Contact de démonstration : reçu dans la boîte de démo (${demoInbox})`, deliveredTo: demoInbox };
  } else {
    const target = fake ? demoInbox : to;
    const s = await sendEmail(target, fake ? `[Démo → ${to}] ${subject}` : subject, html);
    r = s.mode === "demo" ? { delivery: "simule", detail: "Resend non configuré : e-mail non envoyé", deliveredTo: demoInbox }
      : s.error ? { delivery: "echec", detail: s.error } : { delivery: "envoye", detail: fake ? `Redirigé vers ${target}` : s.id, deliveredTo: target };
  }
  save("mails", { id: crmUid("mail_"), at: ymdhm(new Date()), to, deliveredTo: r.deliveredTo, subject, html, text, delivery: r.delivery, detail: r.detail, origin });
  return { delivery: r.delivery, detail: r.detail };
}

export function automations(): Automation[] {
  const saved = new Map(all("automations").map((a) => [a.id, a]));
  return DEFAULT_AUTOMATIONS.map((d) => saved.get(d.id) ?? { ...d, updatedAt: ymdhm(new Date()) });
}

type Candidate = { key: string; email: string; name: string; label: string; source: AutomationRun["source"]; vars: Record<string, string>; cta: { href: string; label: string }; after?: () => void };

function candidates(a: Automation, now: Date): Candidate[] {
  const nowHm = ymdhm(now), today = todayYmd();
  const ageH = (at: string) => (now.getTime() - parseLocal(at).getTime()) / 36e5;
  const url = siteUrl();
  const done = new Set(all("runs").filter((r) => r.automationId === a.id).map((r) => r.key));
  const out: Candidate[] = [];
  const push = (c: Candidate) => { if (!done.has(c.key) && out.length < CAP) out.push(c); };
  const products = new Map(all("stock").map((s) => [s.productId, s.name]));

  if (a.id === "back_in_stock") {
    const stock = all("stock");
    for (const al of all("alerts").filter((x) => x.status === "en_attente")) {
      const back = stock.some((s) => s.productId === al.productId && (!al.variantId || s.variantId === al.variantId) && s.qty > 0);
      if (!back) continue;
      push({ key: `bis:${al.id}`, email: al.email, name: nameFromEmail(al.email), label: al.label, source: al.source, vars: { produit: al.label.split(" — ")[0] }, cta: { href: `${url}/produits/${slugOf(al.productId)}`, label: "Je le commande" },
        after: () => save("alerts", { ...al, status: "envoyee", sentAt: nowHm }) });
    }
  }
  if (a.id === "cart_1" || a.id === "cart_2") {
    const n = a.id === "cart_1" ? 0 : 1;
    for (const c of all("carts")) {
      if (c.status === "recupere" || c.status === "perdu" || c.relaunches.length !== n) continue;
      const h = ageH(c.createdAt);
      if (h < a.delayHours || h > a.delayHours + 72) continue;
      push({ key: `${a.id}:${c.id}`, email: c.email, name: c.name, label: `Panier de ${c.value.toFixed(2).replace(".", ",")} €`, source: c.source, vars: { produit: c.items[0]?.name ?? "tes soins" }, cta: { href: `${url}/panier`, label: "Finaliser ma commande" },
        after: () => { const cur = one("carts", c.id)!; save("carts", { ...cur, status: "relance", relaunches: [...cur.relaunches, { at: nowHm, channel: "email", auto: true }] }); } });
    }
  }
  if (a.id === "welcome") {
    for (const o of all("orders")) {
      const h = ageH(o.createdAt);
      if (!o.firstOrder || o.status === "annulee" || h < a.delayHours || h > a.delayHours + 72) continue;
      push({ key: `welcome:${o.id}`, email: o.email, name: o.customerName, label: `Commande ${o.number}`, source: o.source, vars: { produit: o.items[0]?.name ?? "" }, cta: { href: `${url}/club`, label: "Découvrir le Club" } });
    }
  }
  if (a.id === "review") {
    for (const o of all("orders")) {
      if (o.status !== "livree") continue;
      const delivered = o.history.find((h) => h.status === "livree")?.at;
      if (!delivered) continue;
      const h = ageH(delivered);
      if (h < a.delayHours || h > a.delayHours + 120) continue;
      push({ key: `review:${o.id}`, email: o.email, name: o.customerName, label: `Commande ${o.number}`, source: o.source, vars: { produit: o.items[0]?.name ?? "tes soins" }, cta: { href: `${url}/produits/${slugOf(o.items[0]?.productId ?? "")}#avis`, label: "Donner mon avis" } });
    }
  }
  if (a.id === "replenish" || a.id === "winback") {
    const customers = all("customers");
    const byId = new Map(customers.map((c) => [c.id, c]));
    const lastItem = new Map<string, string>();
    for (const o of all("orders")) if (o.status !== "annulee") lastItem.set(o.customerId, o.items[0]?.productId ?? "");
    for (const s of customerStats(customers, all("orders"), today)) {
      const c = byId.get(s.id);
      if (!c?.optinEmail || !s.orders) continue;
      const produit = products.get(lastItem.get(s.id) ?? "") ?? "ton soin";
      if (a.id === "replenish" && s.nextOrder && s.nextOrder >= today && s.nextOrder <= addDays(today, 3))
        push({ key: `replenish:${s.id}:${s.nextOrder}`, email: s.email, name: s.name, label: `Réachat estimé le ${s.nextOrder.split("-").reverse().join("/")}`, source: c.source, vars: { produit }, cta: { href: `${url}/compte/commandes`, label: "Recommander" } });
      if (a.id === "winback" && (s.segment === "a_risque" || s.segment === "a_ne_pas_perdre"))
        push({ key: `winback:${s.id}:${today.slice(0, 7)}`, email: s.email, name: s.name, label: `Sans commande depuis ${s.recencyDays} j`, source: c.source, vars: { produit }, cta: { href: `${url}/soins-visage/nouveautes`, label: "Voir les nouveautés" } });
    }
  }
  return out;
}

/** Exécute les scénarios actifs (ou un seul). Renvoie le nombre d'envois par scénario. */
export async function runAutomations(only?: AutomationKind, force = false) {
  const now = new Date();
  const result: Record<string, { total: number; sent: number; simulated: number; failed: number }> = {};
  for (const a of automations()) {
    if ((only && a.id !== only) || (!a.enabled && !(force && only))) continue;
    const r = (result[a.id] = { total: 0, sent: 0, simulated: 0, failed: 0 });
    for (const c of candidates(a, now)) {
      const vars = { prenom: first(c.name), ...c.vars };
      const d = await deliver(c.email, fill(a.subject, vars), fill(a.body, vars), c.cta, a.name);
      save("runs", { id: crmUid("run_"), source: c.source, at: ymdhm(now), automationId: a.id, key: c.key, email: c.email, name: c.name, label: c.label, delivery: d.delivery, detail: d.detail });
      c.after?.();
      r.total++;
      if (d.delivery === "envoye") r.sent++; else if (d.delivery === "simule") r.simulated++; else r.failed++;
    }
    save("automations", { ...a, lastRunAt: ymdhm(now) });
  }
  setCrmMeta("automations-last-run", now.toISOString());
  return result;
}

/** Exécution automatique « façon tâche planifiée » : au plus une fois toutes les 10 minutes. */
export async function maybeRunAutomations() {
  const last = crmMeta("automations-last-run");
  if (last && Date.now() - new Date(last).getTime() < 10 * 60_000) return;
  setCrmMeta("automations-last-run", new Date().toISOString());
  try { await runAutomations(); } catch (e) { console.error("[crm automatisations]", e); }
}
