import type { Metadata } from "next";
import { requirePageUser } from "@/lib/hub/auth";
import { list } from "@/lib/hub/repo";
import { StrategyView } from "@/components/hub/pages/StrategyView";

export const metadata: Metadata = { title: "Ma stratégie marketing" };

export default async function StrategyPage() {
  await requirePageUser();
  const posts = list("posts").filter((p) => !p.library);
  const past = posts.filter((p) => p.date && p.date < new Date().toISOString().slice(0, 16));
  const onTime = past.filter((p) => ["publie", "publie_manuel", "publie_test"].includes(p.status)).length;
  return (
    <StrategyView
      sections={list("strategy").sort((a, b) => a.order - b.order)}
      personas={list("personas")}
      objectives={list("objectives")}
      calendarRespect={past.length ? Math.round((onTime / past.length) * 100) : null}
    />
  );
}
