import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/hub/auth";
import { LoginForm } from "@/components/hub/LoginForm";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage() {
  if (await currentUser()) redirect("/hub");
  return <LoginForm demo={!process.env.HUB_SEED_PASSWORD} />;
}
