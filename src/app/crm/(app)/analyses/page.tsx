import type { Metadata } from "next";
import { analysesData } from "@/lib/crm/pages";
import { AnalysesView } from "@/components/crm/pages/AnalysesView";

export const metadata: Metadata = { title: "Segments, cohortes & LTV" };

export default async function AnalysesPage() {
  return <AnalysesView data={await analysesData()} />;
}
