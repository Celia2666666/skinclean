#!/usr/bin/env node
/**
 * Instantané nettoyé de la base locale du Marketing Hub, pour la version en ligne (Vercel).
 * Usage : node scripts/hub-export-snapshot.mjs
 *
 * - exporte la collection `docs` et les drapeaux de migration (`meta`) ;
 * - n'exporte JAMAIS les tables users, sessions, password_resets, activity ni events
 *   (aucun mot de passe, hash ou jeton de session dans les données livrées) ;
 * - copie les quelques visuels importés qu'elles référencent (public/media/uploads, non versionné)
 *   dans public/media/hub-demo/ et réécrit les chemins.
 * Résultat : src/data/hub-snapshot.json, importé au premier démarrage d'une instance en ligne.
 */
import { DatabaseSync } from "node:sqlite";
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const db = new DatabaseSync(path.join(root, "data", "hub", "marketing-hub.sqlite"), { readOnly: true });

const admin = db.prepare("SELECT id, email, data FROM users").all().map((u) => ({ id: u.id, email: u.email, ...JSON.parse(u.data) })).find((u) => u.role === "admin");
const docs = db.prepare("SELECT collection, id, data, created_at, updated_at FROM docs ORDER BY collection, created_at").all();
const meta = db.prepare("SELECT key, value FROM meta").all();

// Visuels importés référencés → copiés dans public/media/hub-demo
const copied = new Set();
const demoDir = path.join(root, "public", "media", "hub-demo");
const rewrite = (data) => data.replace(/\/media\/uploads\/([a-z0-9-]+)\/([\w.-]+)/gi, (_m, folder, file) => {
  const src = path.join(root, "public", "media", "uploads", folder, file);
  if (existsSync(src)) {
    mkdirSync(path.join(demoDir, folder), { recursive: true });
    copyFileSync(src, path.join(demoDir, folder, file));
    copied.add(`${folder}/${file}`);
  }
  return `/media/hub-demo/${folder}/${file}`;
});

const out = {
  exportedAt: new Date().toISOString(),
  // Profil du compte « Accès complet » (sans mot de passe) : recréé en ligne avec le même identifiant
  admin: admin ? { id: admin.id, email: admin.email, name: admin.name, role: admin.role, title: admin.title, avatarColor: admin.avatarColor } : null,
  meta: meta.filter((m) => m.key === "seeded" || m.key.startsWith("seed-")),
  docs: docs.map((d) => ({ ...d, data: rewrite(d.data) })),
};
const text = JSON.stringify(out);
if (/password|token_hash|scrypt/i.test(JSON.stringify(out.admin)) ) throw new Error("Données sensibles détectées dans le profil.");
writeFileSync(path.join(root, "src", "data", "hub-snapshot.json"), text);
console.log(`Instantané : ${docs.length} documents, ${copied.size} visuels copiés, ${(text.length / 1024 / 1024).toFixed(2)} Mo`);
