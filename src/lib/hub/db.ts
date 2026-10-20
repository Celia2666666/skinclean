import "server-only";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Base locale du Marketing Hub : SQLite (module natif node:sqlite, aucun service à installer).
 * Fichier : data/hub/marketing-hub.sqlite (ignoré par git). Supprimer le fichier = repartir des contenus initiaux.
 *
 * Modèle « documents » : chaque objet métier (publication, campagne, e-mail…) est un document JSON
 * rangé dans une collection. Les tables `users`, `sessions`, `activity` et `events` sont relationnelles.
 * La table `events` sert de boîte d'envoi pour le futur CRM (événements marketing consommables par API).
 */

export const DATA_DIR = path.join(process.cwd(), "data", "hub");
const DB_FILE = process.env.HUB_DB_FILE || path.join(DATA_DIR, "marketing-hub.sqlite");

type G = typeof globalThis & { __hubDb?: DatabaseSync; __hubSeeding?: boolean };
const g = globalThis as G;

export function db(): DatabaseSync {
  if (g.__hubDb) return g.__hubDb;
  mkdirSync(path.dirname(DB_FILE), { recursive: true });
  const d = new DatabaseSync(DB_FILE);
  d.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS docs (
      collection TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      PRIMARY KEY (collection, id)
    );
    CREATE INDEX IF NOT EXISTS docs_updated ON docs(collection, updated_at);
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL, expires_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS activity (
      id TEXT PRIMARY KEY, at TEXT NOT NULL, user_id TEXT, user_name TEXT, action TEXT NOT NULL,
      entity TEXT NOT NULL, entity_id TEXT, label TEXT, detail TEXT
    );
    CREATE INDEX IF NOT EXISTS activity_at ON activity(at);
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY, at TEXT NOT NULL, type TEXT NOT NULL, payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  `);
  g.__hubDb = d;
  return d;
}

export const nowIso = () => new Date().toISOString();
export const uid = (prefix = "") => `${prefix}${randomUUID().replace(/-/g, "").slice(0, 12)}`;

export function getMeta(key: string): string | undefined {
  const r = db().prepare("SELECT value FROM meta WHERE key = ?").get(key) as { value: string } | undefined;
  return r?.value;
}
export function setMeta(key: string, value: string) {
  db().prepare("INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, value);
}

/** Exécute fn dans une transaction (tout ou rien). */
export function tx<T>(fn: () => T): T {
  const d = db();
  d.exec("BEGIN");
  try {
    const r = fn();
    d.exec("COMMIT");
    return r;
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}
