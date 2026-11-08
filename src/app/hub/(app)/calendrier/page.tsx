import type { Metadata } from "next";
import { requirePageUser } from "@/lib/hub/auth";
import { list, settings } from "@/lib/hub/repo";
import { refs } from "@/lib/hub/page-data";
import { CalendarView } from "@/components/hub/pages/CalendarView";

export const metadata: Metadata = { title: "Calendrier éditorial" };

export default async function CalendarPage() {
  await requirePageUser();
  const campaigns = list("campaigns").map((c) => ({ id: c.id, name: c.name, color: c.color, startDate: c.startDate, endDate: c.endDate, status: c.status }));
  return <CalendarView posts={list("posts").filter((p) => !p.library)} refs={refs()} campaigns={campaigns} frequencies={settings().frequencies} />;
}
