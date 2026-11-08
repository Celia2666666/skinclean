import type { Metadata } from "next";
import { dashboardData } from "@/lib/crm/pages";
import { PERIODS } from "@/lib/crm/analytics";
import { Dashboard } from "@/components/crm/pages/Dashboard";

export const metadata: Metadata = { title: "Tableau de bord" };

export default async function CrmHome({ searchParams }: PageProps<"/crm">) {
  const sp = await searchParams;
  const data = await dashboardData(typeof sp.p === "string" ? sp.p : undefined);
  return <Dashboard data={data} periods={PERIODS} />;
}
