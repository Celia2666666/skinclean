import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hubAvailable } from "@/lib/hub/auth";
import { ForgotPasswordForm } from "@/components/hub/PasswordReset";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPage() {
  if (!hubAvailable()) notFound();
  return <ForgotPasswordForm />;
}
