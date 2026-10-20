import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { db, nowIso, uid } from "./db";
import { ensureSeeded } from "./repo";
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

/** Utilisateur connecté (pages serveur et routes API). */
export async function currentUser(): Promise<HubUser | null> {
  await ensureSeeded();
  const c = await cookies();
  return userFromToken(c.get(SESSION_COOKIE)?.value);
}

/** Pages du Hub : redirige vers la connexion si nécessaire. Rend la page dynamique (lecture en base à chaque requête). */
export async function requirePageUser(): Promise<HubUser> {
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
