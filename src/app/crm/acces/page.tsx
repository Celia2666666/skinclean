import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AccessForm } from "@/components/crm/AccessForm";

export const metadata: Metadata = { title: "Accès à la démo" };

/** Démo en ligne protégée par CRM_ACCESS_CODE (si la variable est définie sur Vercel). */
export default async function CrmAccessPage() {
  await connection();
  if (!process.env.VERCEL || !process.env.CRM_ACCESS_CODE) redirect("/crm");
  return <AccessForm />;
}
