import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Jetons signés HMAC (routine partagée, confirmation newsletter).
 * Le lien de routine est persistant et infalsifiable sans base de données :
 * le contenu est encodé dans l'URL et signé avec ROUTINE_LINK_SECRET.
 */
const secret = () => {
  const s = process.env.ROUTINE_LINK_SECRET;
  if (!s && process.env.NODE_ENV === "production") throw new Error("ROUTINE_LINK_SECRET manquant");
  return s || "dev-only-secret-change-me";
};

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const unb64 = (s: string) => Buffer.from(s, "base64url").toString("utf8");

export function sign(payload: unknown) {
  const body = b64(JSON.stringify(payload));
  const mac = createHmac("sha256", secret()).update(body).digest("base64url").slice(0, 32);
  return `${body}.${mac}`;
}

export function verify<T>(token: string): T | null {
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url").slice(0, 32);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(unb64(body)) as T & { exp?: number };
    if (data.exp && Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
