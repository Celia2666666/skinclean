import type { Metadata } from "next";
import { requirePageUser } from "@/lib/hub/auth";
import { list } from "@/lib/hub/repo";
import { AdsView } from "@/components/hub/pages/AdsView";

export const metadata: Metadata = { title: "SEA & Social Ads" };

export default async function AdsPage() {
  await requirePageUser();
  return (
    <AdsView
      ads={list("ads").sort((a, b) => a.startDate.localeCompare(b.startDate))}
      campaigns={list("campaigns").map((c) => ({ id: c.id, name: c.name }))}
      metrics={list("metrics").filter((m) => m.channel === "ads").sort((a, b) => a.date.localeCompare(b.date))}
    />
  );
}
