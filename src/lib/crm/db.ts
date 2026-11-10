import "server-only";
import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Activity, Automation, AutomationRun, Cart, ChatLog, MailDoc, StockAlert, CrmSettings, Customer, Deal, Order, PurchaseOrder, Spend, StockItem, StockMove, Task, Ticket, Traffic } from "./types";

/**
 * Base locale du CRM : SQLite (node:sqlite), fichier data/crm/crm.sqlite (ignoré par git), distinct du Marketing Hub.
 * Chaque objet métier est un document JSON rangé dans une collection, avec des colonnes indexées
 * (date, client, statut) pour les requêtes. Les collections sont mises en cache en mémoire
 * et invalidées à chaque écriture : les tableaux de bord se calculent sans relire la base.
 * Supprimer le fichier = régénérer le jeu de démonstration.
 */
export const CRM_DIR = path.join(process.cwd(), "data", "crm");
/** En ligne (Vercel), seul /tmp est inscriptible : la base de démo y est régénérée à chaque démarrage d'instance. */
const DB_FILE = process.env.CRM_DB_FILE || (process.env.VERCEL ? path.join("/tmp", "skinclean-crm.sqlite") : path.join(CRM_DIR, "crm.sqlite"));

export interface CrmCollections {
  customers: Customer;
  orders: Order;
  carts: Cart;
  stock: StockItem;
  moves: StockMove;
  purchaseOrders: PurchaseOrder;
  deals: Deal;
  tasks: Task;
  activities: Activity;
  tickets: Ticket;
  spend: Spend;
  traffic: Traffic;
  settings: CrmSettings;
  chats: ChatLog;
  alerts: StockAlert;
  automations: Automation;
  runs: AutomationRun;
  mails: MailDoc;
}
export type CrmCollection = keyof CrmCollections;

type G = typeof globalThis & { __crmDb?: DatabaseSync; __crmCache?: Map<string, unknown[]>; __crmOps?: JournalOp[]; __crmMute?: boolean };

/**
 * Journal des écritures (version en ligne) : chaque enregistrement est aussi noté ici, puis envoyé dans la base
 * partagée (Neon) par flushJournal(), pour que tous les serveurs rejouent les mêmes modifications.
 */
export type JournalOp = { t: "save"; c: CrmCollection; doc: unknown } | { t: "remove"; c: CrmCollection; id: string } | { t: "clear"; c: CrmCollection };
const journaling = () => !!process.env.VERCEL && !!(process.env.DATABASE_URL || process.env.DATABASE_POSTGRES_URL || process.env.POSTGRES_URL);
function record(op: JournalOp) {
  if (journaling() && !g.__crmMute) (g.__crmOps ??= []).push(op);
}
/** Récupère (et vide) les écritures à envoyer dans le journal partagé. */
export function takeOps(): JournalOp[] {
  const ops = g.__crmOps ?? [];
  g.__crmOps = [];
  return ops;
}
/** Exécute fn sans journaliser (génération de la démo, rejeu du journal). */
export async function unrecorded<T>(fn: () => T | Promise<T>): Promise<T> {
  g.__crmMute = true;
  try { return await fn(); } finally { g.__crmMute = false; }
}
/** Rejoue une écriture venue du journal partagé. */
export function applyOp(op: JournalOp) {
  const was = g.__crmMute;
  g.__crmMute = true;
  try {
    if (op.t === "save") save(op.c, op.doc as never);
    else if (op.t === "remove") remove(op.c, op.id);
    else clearCollection(op.c);
  } finally { g.__crmMute = was; }
}
/** Vide la base locale (nouvelle génération de la démo en ligne). */
export function wipeLocal() {
  crmDb().exec("DELETE FROM docs; DELETE FROM meta;");
  cache().clear();
}
const g = globalThis as G;
const cache = () => (g.__crmCache ??= new Map());

export function crmDb(): DatabaseSync {
  if (g.__crmDb) {
    if (existsSync(/*turbopackIgnore: true*/ DB_FILE)) return g.__crmDb;
    // Fichier supprimé : on repart d'une base neuve
    try { g.__crmDb.close(); } catch { /* déjà fermée */ }
    g.__crmDb = undefined;
    cache().clear();
  }
  mkdirSync(path.dirname(DB_FILE), { recursive: true });
  const d = new DatabaseSync(DB_FILE);
  d.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS docs (
      collection TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL,
      at TEXT, ref TEXT, status TEXT,
      PRIMARY KEY (collection, id)
    );
    CREATE INDEX IF NOT EXISTS docs_at ON docs(collection, at);
    CREATE INDEX IF NOT EXISTS docs_ref ON docs(collection, ref);
    CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  `);
  g.__crmDb = d;
  return d;
}

export const crmUid = (prefix = "") => `${prefix}${randomUUID().replace(/-/g, "").slice(0, 10)}`;

export function crmMeta(key: string): string | undefined {
  return (crmDb().prepare("SELECT value FROM meta WHERE key = ?").get(key) as { value: string } | undefined)?.value;
}
export function setCrmMeta(key: string, value: string) {
  crmDb().prepare("INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, value);
}

/** Colonnes indexées extraites du document. */
function columns(doc: Record<string, unknown>) {
  const at = (doc.createdAt ?? doc.at ?? doc.day ?? doc.month ?? doc.due ?? null) as string | null;
  const ref = (doc.customerId ?? doc.stockId ?? doc.dealId ?? null) as string | null;
  const status = (doc.status ?? doc.stage ?? null) as string | null;
  return { at, ref, status };
}

export function all<C extends CrmCollection>(c: C): CrmCollections[C][] {
  const hit = cache().get(c);
  if (hit) return hit as CrmCollections[C][];
  const rows = crmDb().prepare("SELECT data FROM docs WHERE collection = ? ORDER BY at").all(c) as { data: string }[];
  const docs = rows.map((r) => JSON.parse(r.data));
  cache().set(c, docs);
  return docs;
}

export function one<C extends CrmCollection>(c: C, id: string): CrmCollections[C] | undefined {
  const r = crmDb().prepare("SELECT data FROM docs WHERE collection = ? AND id = ?").get(c, id) as { data: string } | undefined;
  return r ? JSON.parse(r.data) : undefined;
}

export function save<C extends CrmCollection>(c: C, doc: CrmCollections[C]): CrmCollections[C] {
  const d = doc as unknown as Record<string, unknown> & { id: string };
  const { at, ref, status } = columns(d);
  crmDb()
    .prepare("INSERT INTO docs (collection, id, data, at, ref, status) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(collection, id) DO UPDATE SET data = excluded.data, at = excluded.at, ref = excluded.ref, status = excluded.status")
    .run(c, d.id, JSON.stringify(d), at, ref, status);
  cache().delete(c);
  record({ t: "save", c, doc });
  return doc;
}

export function remove(c: CrmCollection, id: string) {
  crmDb().prepare("DELETE FROM docs WHERE collection = ? AND id = ?").run(c, id);
  cache().delete(c);
  record({ t: "remove", c, id });
}

export function clearCollection(c: CrmCollection) {
  crmDb().prepare("DELETE FROM docs WHERE collection = ?").run(c);
  cache().delete(c);
  record({ t: "clear", c });
}

/** Insertion en masse (génération du jeu de démonstration). */
export function bulk<C extends CrmCollection>(c: C, docs: CrmCollections[C][]) {
  const st = crmDb().prepare("INSERT OR REPLACE INTO docs (collection, id, data, at, ref, status) VALUES (?, ?, ?, ?, ?, ?)");
  for (const doc of docs) {
    const d = doc as unknown as Record<string, unknown> & { id: string };
    const { at, ref, status } = columns(d);
    st.run(c, d.id, JSON.stringify(d), at, ref, status);
  }
  cache().delete(c);
}

export function crmTx<T>(fn: () => T): T {
  const d = crmDb();
  d.exec("BEGIN");
  try {
    const r = fn();
    d.exec("COMMIT");
    return r;
  } catch (e) {
    d.exec("ROLLBACK");
    cache().clear();
    throw e;
  }
}
