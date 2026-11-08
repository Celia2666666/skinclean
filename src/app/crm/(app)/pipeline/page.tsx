import type { Metadata } from "next";
import { all } from "@/lib/crm/db";
import { ensureCrmSeeded } from "@/lib/crm/repo";
import { PipelineView } from "@/components/crm/pages/PipelineView";

export const metadata: Metadata = { title: "Pipeline B2B" };

export default async function PipelinePage() {
  await ensureCrmSeeded();
  const deals = all("deals").slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return <PipelineView deals={deals} activities={all("activities").filter((a) => a.dealId)} />;
}
