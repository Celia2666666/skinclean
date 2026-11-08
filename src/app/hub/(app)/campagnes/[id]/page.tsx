import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/hub/auth";
import { get, list } from "@/lib/hub/repo";
import { refs } from "@/lib/hub/page-data";
import { CampaignDetail } from "@/components/hub/pages/Campaigns";

export const metadata: Metadata = { title: "Campagne" };

export default async function CampaignPage({ params }: PageProps<"/hub/campagnes/[id]">) {
  await requirePageUser();
  const { id } = await params;
  const c = get("campaigns", id);
  if (!c) notFound();
  return (
    <CampaignDetail
      campaign={c}
      posts={list("posts").filter((p) => p.campaignId === c.id && !p.library).sort((a, b) => a.date.localeCompare(b.date))}
      emails={list("emails").filter((m) => c.emailIds.includes(m.id) || m.campaignId === c.id).map((m) => ({ id: m.id, name: m.name, subject: m.subject, status: m.status }))}
      ads={list("ads").filter((a) => c.adIds.includes(a.id) || a.campaignId === c.id).map((a) => ({ id: a.id, name: a.name, platform: a.platform, status: a.status, totalBudget: a.totalBudget, budgetValidated: !!a.budgetValidated }))}
      personas={list("personas").map((p) => ({ id: p.id, name: p.name }))}
      refs={refs()}
    />
  );
}
