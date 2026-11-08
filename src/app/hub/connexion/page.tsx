import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { currentUser, hubAvailable } from "@/lib/hub/auth";
import { LoginForm } from "@/components/hub/LoginForm";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: PageProps<"/hub/connexion">) {
  if (!hubAvailable()) notFound();
  const raw = (await searchParams).next;
  // Redirection interne uniquement (Hub ou CRM), jamais vers un autre site
  const next = typeof raw === "string" && /^\/(crm|hub)(\/[\w\-/]*)?$/.test(raw) ? raw : undefined;
  if (await currentUser()) redirect(next ?? "/hub");
  return <LoginForm demo={!process.env.HUB_SEED_PASSWORD} next={next} />;
}
