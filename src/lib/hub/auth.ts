import "server-only";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { db, nowIso, uid } from "./db";
import { ensureSeeded } from "./repo";
import { hubOnline } from "./online";
import { can, type Permission } from "./permissions";
import type { HubUser, Role } from "./types";

/**
 * Authentification du Marketing Hub : comptes locaux, mots de passe hachés (scrypt + sel),
 * sessions opaques en cookie httpOnly (seul le hash du jeton est stocké en base), durée 14 jours.
 */
export const SESSION_COOKIE = "hub_session";
const SESSION_DAYS = 14;

export function hashPassword(pw: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(pw, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}
export function verifyPassword(pw: string, stored: string): boolean {
  const [, saltHex, hashHex] = stored.split("$");
  if (!saltHex || !hashHex) return false;
  const hash = scryptSync(pw, Buffer.from(saltHex, "hex"), 64);
  const ref = Buffer.from(hashHex, "hex");
  return ref.length === hash.length && timingSafeEqual(ref, hash);
}
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

type UserRow = { id: string; email: string; password_hash: string; data: string };
const rowToUser = (r: UserRow): HubUser => ({ ...JSON.parse(r.data), id: r.id, email: r.email });

export function listUsers(): HubUser[] {
  return (db().prepare("SELECT * FROM users ORDER BY email").all() as UserRow[]).map(rowToUser);
}
export function getUser(id: string): HubUser | undefined {
  const r = db().prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
  return r ? rowToUser(r) : undefined;
}
export function createUser(u: { email: string; name: string; role: Role; title?: string; password: string }): HubUser {
  const id = uid("usr_");
  const colors = ["#4A6354", "#8A6D3B", "#C2477A", "#3B5998", "#5E7A68", "#E07B53"];
  const user: HubUser = {
    id, email: u.email.toLowerCase().trim(), name: u.name, role: u.role, title: u.title,
    avatarColor: colors[Math.floor(Math.random() * colors.length)],
    notifications: { validation: true, publication: true, ticket: true, campagne: true, rapport: true },
    createdAt: nowIso(),
  };
  const { id: _i, email: _e, ...data } = user;
  db().prepare("INSERT INTO users (id, email, password_hash, data) VALUES (?, ?, ?, ?)").run(id, user.email, hashPassword(u.password), JSON.stringify(data));
  return user;
}
export function updateUser(id: string, patch: Partial<Omit<HubUser, "id">>) {
  const cur = getUser(id);
  if (!cur) return;
  const next = { ...cur, ...patch };
  const { id: _i, email, ...data } = next;
  db().prepare("UPDATE users SET email = ?, data = ? WHERE id = ?").run(email.toLowerCase().trim(), JSON.stringify(data), id);
  return next;
}
export function setPassword(id: string, pw: string) {
  db().prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashPassword(pw), id);
  db().prepare("DELETE FROM sessions WHERE user_id = ?").run(id);
}
export function deleteUser(id: string) {
  db().prepare("DELETE FROM users WHERE id = ?").run(id);
}
export function checkPassword(id: string, pw: string) {
  const r = db().prepare("SELECT password_hash FROM users WHERE id = ?").get(id) as { password_hash: string } | undefined;
  return !!r && verifyPassword(pw, r.password_hash);
}

/* ───────── Mot de passe oublié ───────── */
const RESET_MINUTES = 30;

/** Crée un lien de réinitialisation à usage unique (30 min). Renvoie null si l'e-mail est inconnu. */
export function createResetToken(email: string): { token: string; user: HubUser; expiresAt: string } | null {
  const r = db().prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase().trim()) as UserRow | undefined;
  if (!r) return null;
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + RESET_MINUTES * 60_000).toISOString();
  db().prepare("DELETE FROM password_resets WHERE user_id = ?").run(r.id); // un seul lien valide à la fois
  db().prepare("INSERT INTO password_resets (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)").run(sha(token), r.id, nowIso(), expiresAt);
  return { token, user: rowToUser(r), expiresAt };
}

/** Vérifie un lien de réinitialisation (sans le consommer). */
export function checkResetToken(token: string): HubUser | null {
  const r = db().prepare("SELECT user_id, expires_at, used_at FROM password_resets WHERE token_hash = ?").get(sha(token)) as { user_id: string; expires_at: string; used_at: string | null } | undefined;
  if (!r || r.used_at || r.expires_at < nowIso()) return null;
  return getUser(r.user_id) ?? null;
}

/** Applique le nouveau mot de passe et invalide le lien et toutes les sessions ouvertes. */
export function resetPasswordWithToken(token: string, pw: string): HubUser | null {
  const u = checkResetToken(token);
  if (!u) return null;
  setPassword(u.id, pw);
  db().prepare("UPDATE password_resets SET used_at = ? WHERE token_hash = ?").run(nowIso(), sha(token));
  return u;
}

export const passwordProblem = (pw: string) =>
  pw.length < 10 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw) ? "Le mot de passe doit contenir au moins 10 caractères, dont des lettres et des chiffres." : null;

export function login(email: string, pw: string): { token: string; user: HubUser } | null {
  const r = db().prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase().trim()) as UserRow | undefined;
  if (!r || !verifyPassword(pw, r.password_hash)) return null;
  const token = randomBytes(32).toString("base64url");
  const exp = new Date(Date.now() + SESSION_DAYS * 864e5).toISOString();
  db().prepare("INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)").run(sha(token), r.id, nowIso(), exp);
  const user = rowToUser(r);
  updateUser(user.id, { lastLoginAt: nowIso() });
  return { token, user };
}
export function logout(token: string) {
  db().prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha(token));
}
export function userFromToken(token: string | undefined): HubUser | null {
  if (!token) return null;
  const r = db().prepare("SELECT user_id, expires_at FROM sessions WHERE token_hash = ?").get(sha(token)) as { user_id: string; expires_at: string } | undefined;
  if (!r || r.expires_at < nowIso()) return null;
  return getUser(r.user_id) ?? null;
}

/**
 * Le Hub est disponible en local et en ligne (mode démonstration, voir online.ts).
 * En local, l'accès depuis le réseau est bloqué par src/proxy.ts.
 */
export const hubAvailable = () => true;

/** Utilisateur connecté (pages serveur et routes API). En ligne : session démo automatique, compte « Accès complet ». */
export async function currentUser(): Promise<HubUser | null> {
  await ensureSeeded();
  if (hubOnline()) return listUsers().find((u) => u.role === "admin") ?? null;
  const c = await cookies();
  return userFromToken(c.get(SESSION_COOKIE)?.value);
}

/** Pages du Hub : redirige vers la connexion si nécessaire. Rend la page dynamique (lecture en base à chaque requête). */
export async function requirePageUser(): Promise<HubUser> {
  if (!hubAvailable()) notFound();
  const u = await currentUser();
  if (!u) redirect("/hub/connexion");
  return u;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
/** Routes API : 401 si non connecté, 403 si la permission manque. */
export async function requireApiUser(permission?: Permission): Promise<HubUser> {
  const u = await currentUser();
  if (!u) throw new HttpError(401, "Session expirée : reconnecte-toi.");
  if (permission && !can(u.role, permission)) throw new HttpError(403, "Ton rôle ne permet pas cette action.");
  return u;
}
