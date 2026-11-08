import type { Metadata } from "next";
import { profitData } from "@/lib/crm/pages";
import { ProfitView } from "@/components/crm/pages/ProfitView";

export const metadata: Metadata = { title: "Rentabilité & prévisions" };

export default async function ProfitPage() {
  return <ProfitView data={await profitData()} />;
}
