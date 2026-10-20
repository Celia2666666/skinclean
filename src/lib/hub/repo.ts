import "server-only";
import { db, getMeta, nowIso, uid } from "./db";
import type {
  NewDoc, ActivityEntry, AdCampaign, Article, Asset, Campaign, EmailCampaign, Keyword, Metric, Notification, Objective,
  Persona, Post, RoadmapMonth, Settings, StrategySection, Ticket,
} from "./types";

/** Collections documentaires du Hub et leur type. */
export interface Collections {
  posts: Post;
  campaigns: Campaign;
  personas: Persona;
  objectives: Objective;
  strategy: StrategySection;
  ads: AdCampaign;
  emails: EmailCampaign;
  articles: Article;
  keywords: Keyword;
  tickets: Ticket;
  assets: Asset;
  roadmap: RoadmapMonth;
  metrics: Metric;
  notifications: Notification;
  settings: Settings & { id: string };
}
export type CollectionName = keyof Collections;
export const COLLECTIONS: CollectionName[] = [
  "posts", "campaigns", "personas", "objectives", "strategy", "ads", "emails", "articles", "keywords", "tickets", "assets", "roadmap", "metrics", "notifications", "settings",
];

type WithId = { id: string };

let seedPromise: Promise<void> | null = null;
/** Remplit la base avec la stratégie et les contenus initiaux au premier lancement. */
export async function ensureSeeded() {
  db();
  if (getMeta("seeded")) return;
  seedPromise ??= import("./seed").then((m) => m.seedAll());
  await seedPromise;
}

export function list<C extends CollectionName>(c: C): Collections[C][] {
  const rows = db().prepare("SELECT data FROM docs WHERE collection = ? ORDER BY created_at").all(c) as { data: string }[];
  return rows.map((r) => JSON.parse(r.data));
}

export function get<C extends CollectionName>(c: C, id: string): Collections[C] | undefined {
  const r = db().prepare("SELECT data FROM docs WHERE collection = ? AND id = ?").get(c, id) as { data: string } | undefined;
  return r ? JSON.parse(r.data) : undefined;
}

export function put<C extends CollectionName>(c: C, doc: Collections[C]): Collections[C] {
  const d = doc as unknown as WithId & { createdAt?: string; updatedAt?: string };
  const now = nowIso();
  const created = d.createdAt ?? now;
  db()
    .prepare(
      `INSERT INTO docs (collection, id, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(collection, id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
    )
    .run(c, d.id, JSON.stringify(doc), created, now);
  return doc;
}

export function create<C extends CollectionName>(c: C, doc: NewDoc<Collections[C]>): Collections[C] {
  const now = nowIso();
  const full = { ...doc, id: doc.id ?? uid(c.slice(0, 3) + "_") } as Record<string, unknown>;
  if ("createdAt" in full || c !== "metrics") {
    full.createdAt ??= now;
    full.updatedAt = now;
  }
  return put(c, full as unknown as Collections[C]);
}

export function update<C extends CollectionName>(c: C, id: string, patch: Partial<Collections[C]>): Collections[C] | undefined {
  const cur = get(c, id);
  if (!cur) return undefined;
  const next = { ...cur, ...patch, id, updatedAt: nowIso() } as Collections[C];
  return put(c, next);
}

export function remove(c: CollectionName, id: string) {
  db().prepare("DELETE FROM docs WHERE collection = ? AND id = ?").run(c, id);
}

export function count(c: CollectionName): number {
  return (db().prepare("SELECT COUNT(*) AS n FROM docs WHERE collection = ?").get(c) as { n: number }).n;
}

export function settings(): Settings {
  return get("settings", "main") as Settings;
}

/* ───────── Journal d'activité (historique des validations, publications…) ───────── */
export function logActivity(e: Omit<ActivityEntry, "id" | "at">) {
  db()
    .prepare("INSERT INTO activity (id, at, user_id, user_name, action, entity, entity_id, label, detail) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(uid("act_"), nowIso(), e.userId, e.userName, e.action, e.entity, e.entityId, e.label, e.detail ?? null);
}

export function activity(opts: { limit?: number; actions?: string[]; entityId?: string } = {}): ActivityEntry[] {
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (opts.actions?.length) { where.push(`action IN (${opts.actions.map(() => "?").join(",")})`); args.push(...opts.actions); }
  if (opts.entityId) { where.push("entity_id = ?"); args.push(opts.entityId); }
  const sql = `SELECT * FROM activity ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY at DESC LIMIT ?`;
  args.push(opts.limit ?? 100);
  const rows = db().prepare(sql).all(...args) as Record<string, string>[];
  return rows.map((r) => ({ id: r.id, at: r.at, userId: r.user_id, userName: r.user_name, action: r.action, entity: r.entity, entityId: r.entity_id, label: r.label, detail: r.detail ?? undefined }));
}

/* ───────── Boîte d'envoi d'événements (intégration future avec le CRM) ───────── */
export function emitEvent(type: string, payload: Record<string, unknown>) {
  db().prepare("INSERT INTO events (id, at, type, payload) VALUES (?, ?, ?, ?)").run(uid("evt_"), nowIso(), type, JSON.stringify(payload));
}
export function events(since?: string, limit = 200) {
  const rows = (since
    ? db().prepare("SELECT * FROM events WHERE at > ? ORDER BY at LIMIT ?").all(since, limit)
    : db().prepare("SELECT * FROM events ORDER BY at DESC LIMIT ?").all(limit)) as { id: string; at: string; type: string; payload: string }[];
  return rows.map((r) => ({ ...r, payload: JSON.parse(r.payload) }));
}

/* ───────── Notifications ───────── */
export function notify(userIds: string[], n: Omit<Notification, "id" | "userId" | "read" | "at">) {
  for (const userId of userIds) create("notifications", { ...n, userId, read: false, at: nowIso() } as NewDoc<Notification>);
}

export function nextTicketNumber(): number {
  const max = list("tickets").reduce((m, t) => Math.max(m, t.number), 1000);
  return max + 1;
}
