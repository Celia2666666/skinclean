import type { Metadata } from "next";
import { requirePageUser } from "@/lib/hub/auth";
import { list } from "@/lib/hub/repo";
import { RoadmapView } from "@/components/hub/pages/RoadmapView";

export const metadata: Metadata = { title: "Plan marketing annuel" };

export default async function RoadmapPage() {
  await requirePageUser();
  const posts = list("posts").filter((p) => !p.library);
  const counts: Record<string, number> = {};
  for (const p of posts) counts[p.date.slice(0, 7)] = (counts[p.date.slice(0, 7)] ?? 0) + 1;
  return (
    <RoadmapView
      months={list("roadmap").sort((a, b) => a.month.localeCompare(b.month))}
      campaigns={list("campaigns").map((c) => ({ id: c.id, name: c.name, color: c.color, startDate: c.startDate, endDate: c.endDate, status: c.status }))}
      plannedByMonth={counts}
    />
  );
}
