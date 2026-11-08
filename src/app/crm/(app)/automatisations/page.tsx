import type { Metadata } from "next";
import { automationsData } from "@/lib/crm/pages";
import { AutomationsView } from "@/components/crm/pages/AutomationsView";

export const metadata: Metadata = { title: "Automatisations" };

export default async function AutomationsPage() {
  return <AutomationsView data={await automationsData()} />;
}
