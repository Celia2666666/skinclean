import type { Metadata } from "next";
import { randomBytes } from "node:crypto";
import { sign, verify } from "@/lib/sign";
import { welcomeOffer } from "@/data/config";
import { NewsletterConfirm } from "@/components/account/NewsletterConfirm";

export const metadata: Metadata = { title: "Confirmation newsletter", robots: { index: false } };

/** Vérifie le jeton de double opt-in puis émet un bon de bienvenue signé (code unique). */
export default async function Page({ searchParams }: PageProps<"/newsletter/confirmation">) {
  const { token } = await searchParams;
  const data = typeof token === "string" ? verify<{ email: string; kind: string }>(token) : null;
  if (!data || data.kind !== "newsletter") {
    return <NewsletterConfirm error="Ce lien de confirmation est invalide ou a expiré. Réinscris-toi pour recevoir un nouveau lien." />;
  }
  const code = "GLOW20-" + randomBytes(4).toString("hex").slice(0, 6).toUpperCase();
  const expiresAt = Date.now() + welcomeOffer.validityDays * 864e5;
  const voucher = sign({ kind: "welcome", email: data.email, code, percent: welcomeOffer.newsletterPercent, exp: expiresAt });
  return <NewsletterConfirm email={data.email} issued={{ code, voucher, expiresAt }} />;
}
