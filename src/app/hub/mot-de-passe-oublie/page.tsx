import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { hubOnline } from "@/lib/hub/online";
import { hubAvailable } from "@/lib/hub/auth";
import { ForgotPasswordForm } from "@/components/hub/PasswordReset";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPage() {
  if (!hubAvailable()) notFound();
  if (hubOnline()) redirect("/hub"); // en ligne : session démo automatique, pas de mot de passe
  return <ForgotPasswordForm />;
}
