import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { hubOnline } from "@/lib/hub/online";
import { checkResetToken, hubAvailable } from "@/lib/hub/auth";
import { ensureSeeded } from "@/lib/hub/repo";
import { ResetPasswordForm } from "@/components/hub/PasswordReset";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

export default async function ResetPage({ searchParams }: PageProps<"/hub/reinitialiser">) {
  if (!hubAvailable()) notFound();
  if (hubOnline()) redirect("/hub"); // en ligne : session démo automatique, pas de mot de passe
  await ensureSeeded();
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  const user = token ? checkResetToken(token) : null;
  return <ResetPasswordForm token={token} email={user?.email ?? null} />;
}
