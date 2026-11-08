import type { Metadata } from "next";
import { requirePageUser } from "@/lib/hub/auth";
import { list } from "@/lib/hub/repo";
import { CampaignsList } from "@/components/hub/pages/Campaigns";

export const metadata: Metadata = { title: "Campagnes marketing" };

export default async function CampaignsPage() {
  await requirePageUser();
  const posts = list("posts").filter((p) => !p.library);
  const campaigns = list("campaigns").map((c) => ({ ...c, scheduled: posts.filter((p) => p.campaignId === c.id).length }));
  return <CampaignsList campaigns={campaigns} />;
}
