import "server-only";
import { ymdhm } from "@/lib/hub/dates";
import { HttpError } from "@/lib/hub/auth";
import { siteUrl } from "@/lib/sign";
import type { HubUser } from "@/lib/hub/types";
import { all, crmDb, crmTx, crmUid, one, remove, save } from "./db";
import { settings } from "./repo";
import type { Activity, Automation, AutomationKind, CrmSettings, Deal, DealStage, MoveReason, Order, OrderStatus, PurchaseOrder, Task, Ticket } from "./types";
import { DEAL_STAGES, DELIVERY_LABEL } from "./types";
import { automations, deliver, runAutomations, sampleMails } from "./automations";

/**
 * Actions du CRM (POST /api/crm/<action>). Toutes les écritures sont validées côté serveur.
 * Règle d'honnêteté : les contacts de démonstration ont des adresses @example.com, aucune relance n'est réellement envoyée.
 */
type Body = Record<string, unknown>;
const now = () => ymdhm(new Date());
const str = (v: unknown, max = 2000) => String(v ?? "").trim().slice(0, max);
const need = <T,>(v: T | undefined, what: string): T => { if (!v) throw new HttpError(404, `${what} introuvable.`); return v; };

/** Transitions autorisées du cycle de vie d'une commande. */
const NEXT: Record<OrderStatus, OrderStatus[]> = {
  payee: ["en_preparation", "annulee"],
  en_preparation: ["expediee", "annulee"],
  expediee: ["livree", "remboursee"],
  livree: ["remboursee"],
  annulee: [],
  remboursee: [],
};

function move(stockId: string, delta: number, reason: MoveReason, by: string, ref?: string, note?: string) {
  const s = need(one("stock", stockId), "Article de stock");
  const qty = Math.max(0, s.qty + delta);
  save("stock", { ...s, qty, updatedAt: now() });
  save("moves", { id: crmUid("mv_"), at: now(), stockId, label: `${s.name} — ${s.size}`, delta: qty - s.qty, reason, ref, note, by });
}

function activity(a: Omit<Activity, "id" | "at" | "by">, u: HubUser) {
  return save("activities", { ...a, id: crmUid("act_"), at: now(), by: u.name });
}

const handlers: Record<string, (u: HubUser, b: Body) => unknown> = {
  /* Commandes */
  "order/status": (u, b) => {
    const o = need(one("orders", str(b.id)), "Commande");
    const status = str(b.status) as OrderStatus;
    if (!NEXT[o.status].includes(status)) throw new HttpError(400, `Impossible de passer de « ${o.status} » à « ${status} ».`);
    const note = str(b.note, 300) || undefined;
    const next: Order = { ...o, status, history: [...o.history, { at: now(), status, note }] };
    crmTx(() => {
      if (status === "expediee") next.tracking = str(b.tracking, 40) || o.tracking || `6A${Math.floor(1e10 + Math.random() * 9e10)}`;
      if (status === "remboursee") {
        next.refunded = o.total;
        if (b.restock) for (const i of o.items) move(`${i.productId}:${i.variantId}`, i.qty, "retour", u.name, o.number, "Retour client remis en stock");
      }
      if (status === "annulee") for (const i of o.items) if (one("stock", `${i.productId}:${i.variantId}`)) move(`${i.productId}:${i.variantId}`, i.qty, "ajustement", u.name, o.number, "Annulation : stock réservé libéré");
      save("orders", next);
      activity({ customerId: o.customerId, kind: "statut", body: `Commande ${o.number} : ${status.replace("_", " ")}${note ? ` (${note})` : ""}` }, u);
    });
    return next;
  },

  /* Clients */
  "customer/update": (u, b) => {
    const c = need(one("customers", str(b.id)), "Client");
    const p = (b.patch ?? {}) as Body;
    const next = { ...c };
    if (Array.isArray(p.tags)) next.tags = [...new Set(p.tags.map((t) => str(t, 40)).filter(Boolean))].slice(0, 20);
    if (typeof p.optinEmail === "boolean" && p.optinEmail !== c.optinEmail) { next.optinEmail = p.optinEmail; activity({ customerId: c.id, kind: "statut", body: `Consentement e-mails marketing ${p.optinEmail ? "accordé" : "retiré"}` }, u); }
    if (typeof p.optinSms === "boolean" && p.optinSms !== c.optinSms) { next.optinSms = p.optinSms; activity({ customerId: c.id, kind: "statut", body: `Consentement SMS marketing ${p.optinSms ? "accordé" : "retiré"}` }, u); }
    if (p.phone !== undefined) next.phone = str(p.phone, 30) || undefined;
    if (p.skinType && ["seche", "grasse", "mixte", "normale", "sensible"].includes(String(p.skinType))) next.skinType = p.skinType as typeof c.skinType;
    return save("customers", next);
  },
  "customer/note": (u, b) => {
    const c = need(one("customers", str(b.customerId)), "Client");
    const body = str(b.body);
    if (!body) throw new HttpError(400, "La note est vide.");
    const kind = (["note", "appel", "email", "sms"].includes(str(b.kind)) ? str(b.kind) : "note") as Activity["kind"];
    return activity({ customerId: c.id, kind, body }, u);
  },

  /* Paniers abandonnés */
  "cart/relaunch": async (u, b) => {
    const c = need(one("carts", str(b.id)), "Panier");
    if (c.status === "recupere") throw new HttpError(400, "Ce panier a déjà été transformé en commande.");
    const channel = b.channel === "sms" ? "sms" : "email";
    // Pas de passerelle SMS branchée : le SMS est seulement enregistré
    const d = channel === "email" ? await deliver(c.email, "Ton panier t'attend", `${c.name.split(" ")[0]}, tu as laissé ${c.items.map((i) => i.name).join(", ")} dans ton panier. On l'a gardé pour toi.`, undefined, "Relance manuelle de panier") : { delivery: "simule" as const, detail: "Aucune passerelle SMS configurée" };
    save("carts", { ...c, status: "relance", relaunches: [...c.relaunches, { at: now(), channel, auto: false }] });
    if (c.customerId) activity({ customerId: c.customerId, kind: "relance", body: `Relance manuelle du panier de ${c.value.toFixed(2).replace(".", ",")} € par ${channel === "sms" ? "SMS" : "e-mail"} (${DELIVERY_LABEL[d.delivery].toLowerCase()})` }, u);
    return { ok: true, sent: d.delivery === "envoye", message: d.delivery === "envoye" ? "Relance envoyée." : `Relance enregistrée — ${d.detail ?? "aucun envoi"}.` };
  },

  /* Stock */
  "stock/adjust": async (u, b) => {
    const delta = Math.round(Number(b.delta));
    if (!delta || Math.abs(delta) > 10000) throw new HttpError(400, "Quantité invalide.");
    const reason = (["ajustement", "casse", "retour", "reception"].includes(str(b.reason)) ? str(b.reason) : "ajustement") as MoveReason;
    move(str(b.id), delta, reason, u.name, undefined, str(b.note, 200) || undefined);
    if (delta > 0) await runAutomations("back_in_stock");
    return one("stock", str(b.id));
  },
  "stock/settings": (_u, b) => {
    const s = need(one("stock", str(b.id)), "Article de stock");
    const n = (v: unknown, d: number, min = 0) => (v === undefined || v === "" ? d : Math.max(min, Number(v)));
    return save("stock", { ...s, reorderPoint: Math.round(n(b.reorderPoint, s.reorderPoint)), safetyStock: Math.round(n(b.safetyStock, s.safetyStock)), cost: Math.round(n(b.cost, s.cost) * 100) / 100, leadDays: Math.round(n(b.leadDays, s.leadDays, 1)), updatedAt: now() });
  },

  /* Bons de commande fournisseurs */
  "po/create": (_u, b) => {
    const lines = (Array.isArray(b.lines) ? b.lines : []).map((l: Body) => {
      const s = need(one("stock", str(l.stockId)), "Article de stock");
      const qty = Math.round(Number(l.qty));
      if (!(qty > 0)) throw new HttpError(400, "Quantité invalide.");
      return { stockId: s.id, label: `${s.name} — ${s.size}`, qty, cost: s.cost };
    });
    if (!lines.length) throw new HttpError(400, "Le bon de commande est vide.");
    const supplier = need(one("stock", lines[0].stockId), "Article").supplier;
    const lead = Math.max(...lines.map((l) => one("stock", l.stockId)!.leadDays));
    const d = new Date(); d.setDate(d.getDate() + lead);
    const nb = all("purchaseOrders").length + 2401;
    const po: PurchaseOrder = { id: crmUid("po_"), number: `BC-${nb}`, supplier, createdAt: now(), expectedAt: ymdhm(d).slice(0, 10), status: b.send ? "envoyee" : "brouillon", lines };
    return save("purchaseOrders", po);
  },
  "po/status": async (u, b) => {
    const po = need(one("purchaseOrders", str(b.id)), "Bon de commande");
    const status = str(b.status);
    const ok = (po.status === "brouillon" && ["envoyee", "annulee"].includes(status)) || (po.status === "envoyee" && ["recue", "annulee"].includes(status));
    if (!ok) throw new HttpError(400, "Changement de statut impossible.");
    const saved = crmTx(() => {
      if (status === "recue") for (const l of po.lines) move(l.stockId, l.qty, "reception", u.name, po.number);
      return save("purchaseOrders", { ...po, status: status as PurchaseOrder["status"], receivedAt: status === "recue" ? now() : undefined });
    });
    // Réception : les personnes inscrites à l'alerte « retour en stock » sont prévenues immédiatement
    const alerts = status === "recue" ? await runAutomations("back_in_stock") : {};
    return { ...saved, alertsSent: alerts.back_in_stock?.total ?? 0 };
  },

  /* Pipeline B2B */
  "deal/save": (u, b) => {
    const d = (b.deal ?? {}) as Partial<Deal>;
    const cur = d.id ? one("deals", d.id) : undefined;
    const company = str(d.company, 120);
    if (!company) throw new HttpError(400, "Le nom de l'entreprise est obligatoire.");
    const stage = (DEAL_STAGES.some((s) => s.id === d.stage) ? d.stage : cur?.stage ?? "prospect") as DealStage;
    const next: Deal = {
      id: cur?.id ?? crmUid("deal_"), company, contact: str(d.contact, 120), email: str(d.email, 160), phone: str(d.phone, 30) || undefined,
      type: (d.type ?? cur?.type ?? "institut") as Deal["type"], city: str(d.city, 80), stage, amount: Math.max(0, Math.round(Number(d.amount) || 0)),
      closeDate: str(d.closeDate, 10) || ymdhm(new Date()).slice(0, 10), createdAt: cur?.createdAt ?? now(), updatedAt: now(), owner: cur?.owner ?? u.name,
      nextStep: str(d.nextStep, 200) || undefined, lostReason: stage === "perdu" ? str(d.lostReason, 200) || cur?.lostReason : undefined,
      stageHistory: cur ? (cur.stage === stage ? cur.stageHistory : [...cur.stageHistory, { at: now(), stage }]) : [{ at: now(), stage }],
    };
    return save("deals", next);
  },
  "deal/stage": (u, b) => {
    const d = need(one("deals", str(b.id)), "Opportunité");
    const stage = str(b.stage) as DealStage;
    if (!DEAL_STAGES.some((s) => s.id === stage)) throw new HttpError(400, "Étape inconnue.");
    if (d.stage === stage) return d;
    save("activities", { id: crmUid("act_"), at: now(), dealId: d.id, kind: "statut", body: `Étape : ${DEAL_STAGES.find((s) => s.id === stage)!.label}`, by: u.name });
    return save("deals", { ...d, stage, updatedAt: now(), closeDate: stage === "gagne" || stage === "perdu" ? now().slice(0, 10) : d.closeDate, lostReason: stage === "perdu" ? str(b.lostReason, 200) || d.lostReason : undefined, stageHistory: [...d.stageHistory, { at: now(), stage }] });
  },
  "deal/delete": (_u, b) => { remove("deals", str(b.id)); return { ok: true }; },

  /* Tâches */
  "task/save": (_u, b) => {
    const t = (b.task ?? {}) as Partial<Task>;
    const title = str(t.title, 200);
    if (!title) throw new HttpError(400, "Le titre est obligatoire.");
    const cur = t.id ? one("tasks", t.id) : undefined;
    return save("tasks", {
      id: cur?.id ?? crmUid("task_"), title, due: str(t.due, 10) || now().slice(0, 10), done: cur?.done ?? false,
      priority: (["haute", "normale", "basse"].includes(String(t.priority)) ? t.priority : "normale") as Task["priority"],
      type: (["appel", "email", "relance", "stock", "admin"].includes(String(t.type)) ? t.type : "admin") as Task["type"],
      related: t.related ?? cur?.related, createdAt: cur?.createdAt ?? now(), doneAt: cur?.doneAt,
    });
  },
  "task/toggle": (_u, b) => {
    const t = need(one("tasks", str(b.id)), "Tâche");
    return save("tasks", { ...t, done: !t.done, doneAt: t.done ? undefined : now() });
  },
  "task/delete": (_u, b) => { remove("tasks", str(b.id)); return { ok: true }; },

  /* Service client */
  "ticket/reply": async (_u, b) => {
    const t = need(one("tickets", str(b.id)), "Ticket");
    const body = str(b.body, 4000);
    if (!body) throw new HttpError(400, "La réponse est vide.");
    const to = t.email ?? (t.customerId ? one("customers", t.customerId)?.email : undefined);
    const d = to ? await deliver(to, `Re : ${t.subject}`, body, undefined, `Réponse ${t.number}`) : { delivery: "simule" as const, detail: "Aucune adresse e-mail" };
    const firstResponseMin = t.firstResponseMin ?? Math.max(1, Math.round((Date.now() - new Date(t.createdAt).getTime()) / 6e4));
    const status = (b.resolve ? "resolu" : "en_cours") as Ticket["status"];
    save("tickets", { ...t, firstResponseMin, status, resolvedAt: status === "resolu" ? now() : t.resolvedAt, messages: [...t.messages, { at: now(), from: "skinclean", body }], ai: t.ai ? { ...t.ai, checked: true } : t.ai });
    return { ok: true, delivery: d.delivery, message: `Réponse enregistrée — e-mail : ${DELIVERY_LABEL[d.delivery].toLowerCase()}${d.detail && d.delivery !== "envoye" ? ` (${d.detail})` : ""}.` };
  },
  /** Relance l'analyse (tri + brouillon) d'une demande. */
  "ticket/ai": async (_u, b) => {
    const t = need(one("tickets", str(b.id)), "Ticket");
    const { analyzeTicket } = await import("./support-ai");
    const ai = await analyzeTicket(t);
    save("tickets", { ...t, ai: { ...ai, autoSent: t.ai?.autoSent, checked: t.ai?.checked } });
    return { ai, message: ai.engine === "ia" ? "Brouillon rédigé par l'IA (Claude)." : "Brouillon préparé (réponse type complétée avec la commande)." };
  },
  /** La réponse automatique a été relue : rien à corriger. */
  "ticket/check": (_u, b) => {
    const t = need(one("tickets", str(b.id)), "Ticket");
    if (!t.ai) throw new HttpError(400, "Aucune réponse automatique sur cette demande.");
    return save("tickets", { ...t, ai: { ...t.ai, checked: true } });
  },
  "ticket/status": (_u, b) => {
    const t = need(one("tickets", str(b.id)), "Ticket");
    const status = str(b.status) as Ticket["status"];
    if (!["ouvert", "en_cours", "resolu"].includes(status)) throw new HttpError(400, "Statut inconnu.");
    return save("tickets", { ...t, status, resolvedAt: status === "resolu" ? now() : undefined });
  },

  /* Automatisations */
  "automation/save": (_u, b) => {
    const cur = automations().find((a) => a.id === b.id);
    if (!cur) throw new HttpError(404, "Automatisation inconnue.");
    const next: Automation = { ...cur, updatedAt: now() };
    if (typeof b.enabled === "boolean") next.enabled = b.enabled;
    if (b.delayHours !== undefined) next.delayHours = Math.max(0, Math.min(24 * 60, Math.round(Number(b.delayHours) || 0)));
    if (b.subject !== undefined) next.subject = str(b.subject, 150) || cur.subject;
    if (b.body !== undefined) next.body = str(b.body, 2000) || cur.body;
    return save("automations", next);
  },
  "automation/run": async (_u, b) => {
    const id = str(b.id) as AutomationKind;
    const r = await runAutomations(id || undefined, !!id);
    const total = Object.values(r).reduce((a, x) => a + x.total, 0);
    const sent = Object.values(r).reduce((a, x) => a + x.sent, 0);
    return { total, sent, message: total ? `${total} message(s) traité(s) : ${sent} envoyé(s), ${total - sent} simulé(s) ou en échec.` : "Aucun destinataire à traiter pour l'instant." };
  },
  "alert/cancel": (_u, b) => {
    const a = need(one("alerts", str(b.id)), "Alerte");
    return save("alerts", { ...a, status: "annulee" });
  },

  /* Messages & contact */
  "message/compose": async (u, b) => {
    const to = str(b.to, 200).toLowerCase();
    const subject = str(b.subject, 150), body = str(b.body, 5000);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to)) throw new HttpError(400, "Adresse e-mail invalide.");
    if (!subject || !body) throw new HttpError(400, "Objet et message sont obligatoires.");
    const d = await deliver(to, subject, body, undefined, "Nouveau message");
    const c = all("customers").find((x) => x.email === to);
    const at = now();
    save("tickets", { id: crmUid("tk_"), number: `MSG-${5000 + all("tickets").length}`, source: c?.source ?? "reel", customerId: c?.id ?? "", customerName: c ? `${c.firstName} ${c.lastName}` : to, email: to, subject, category: "conseil", channel: "formulaire", priority: "normale", status: "en_cours", createdAt: at, firstResponseMin: 0, messages: [{ at, from: "skinclean", body }] });
    if (c) activity({ customerId: c.id, kind: "email", body: `E-mail « ${subject} » (${DELIVERY_LABEL[d.delivery].toLowerCase()})` }, u);
    return { delivery: d.delivery, message: `Message ${d.delivery === "envoye" ? "envoyé" : `enregistré — ${DELIVERY_LABEL[d.delivery].toLowerCase()}${d.detail ? ` : ${d.detail}` : ""}`}.` };
  },
  "mail/test": async () => {
    const n = await sampleMails();
    return { message: `${n} e-mails de test générés vers la boîte de démo (${settings().demoInbox || "demo@skinclean.example"}).` };
  },
  "mail/clear": () => { crmDb().exec("DELETE FROM docs WHERE collection = 'mails'"); remove("mails", "_"); return { ok: true }; },
  "chat/task": (_u, b) => {
    const text = str(b.text, 200);
    if (!text) throw new HttpError(400, "Question vide.");
    return save("tasks", { id: crmUid("task_"), title: `Ajouter une réponse au Glow Assistant : « ${text} »`, due: now().slice(0, 10), done: false, priority: "normale", type: "admin", createdAt: now() });
  },

  /* Paramètres */
  "settings/save": (_u, b) => {
    const cur = settings();
    const p = (b.settings ?? {}) as Partial<CrmSettings>;
    const n = (v: unknown, d: number) => (Number.isFinite(Number(v)) && v !== "" && v !== null ? Math.max(0, Number(v)) : d);
    return save("settings", {
      ...cur, vatRate: n(p.vatRate, cur.vatRate), paymentFeePct: n(p.paymentFeePct, cur.paymentFeePct), paymentFeeFixed: n(p.paymentFeeFixed, cur.paymentFeeFixed),
      shippingCost: n(p.shippingCost, cur.shippingCost), packagingCost: n(p.packagingCost, cur.packagingCost), monthlyTarget: Math.round(n(p.monthlyTarget, cur.monthlyTarget)),
      demoInbox: p.demoInbox !== undefined ? (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(str(p.demoInbox, 200)) ? str(p.demoInbox, 200).toLowerCase() : cur.demoInbox) : cur.demoInbox,
      redirectDemo: typeof p.redirectDemo === "boolean" ? p.redirectDemo : cur.redirectDemo,
      fixedCosts: Array.isArray(p.fixedCosts) ? p.fixedCosts.map((f) => ({ label: str(f.label, 80), amount: n(f.amount, 0) })).filter((f) => f.label).slice(0, 20) : cur.fixedCosts,
    });
  },

  /** Régénère le jeu de démonstration (les commandes réelles Stripe sont conservées). */
  "demo/reset": async () => {
    crmTx(() => {
      crmDb().exec(`DELETE FROM docs WHERE json_extract(data, '$.source') IS NOT 'reel'; DELETE FROM meta WHERE key IN ('seeded', 'seed-extras-v1', 'seed-sav-v1', 'automations-last-run');`);
    });
    const { seedCrm } = await import("./seed");
    seedCrm();
    return { ok: true };
  },
};

export function crmHandler(name: string) {
  return handlers[name];
}
