import type { Metadata } from "next";
import { requirePageUser } from "@/lib/hub/auth";
import { list } from "@/lib/hub/repo";
import { ymdhm } from "@/lib/hub/dates";
import { PerformanceView } from "@/components/hub/pages/PerformanceView";

export const metadata: Metadata = { title: "Performances marketing" };

export default async function PerformancePage({ searchParams }: PageProps<"/hub/performances">) {
  await requirePageUser();
  const sp = await searchParams;
  const now = ymdhm(new Date());
  const posts = list("posts").filter((p) => !p.library);
  const past = posts.filter((p) => p.date <= now);
  const editorial = {
    planned: posts.length,
    done: posts.filter((p) => ["publie", "publie_manuel", "publie_test"].includes(p.status)).length,
    doneApi: posts.filter((p) => p.status === "publie").length,
    late: past.filter((p) => !["publie", "publie_manuel", "publie_test"].includes(p.status)).map((p) => ({ id: p.id, title: p.title, date: p.date, platform: p.platform, status: p.status })),
    pending: posts.filter((p) => p.status === "a_valider" || p.status === "modifications").length,
    respect: past.length ? Math.round((past.filter((p) => ["publie", "publie_manuel", "publie_test"].includes(p.status)).length / past.length) * 100) : null,
    byPlatform: Object.entries(posts.reduce<Record<string, number>>((a, p) => { a[p.platform] = (a[p.platform] ?? 0) + 1; return a; }, {})),
  };
  return <PerformanceView metrics={list("metrics")} editorial={editorial} initialSource={sp.source === "demo" ? "demo" : undefined} keywords={list("keywords").filter((k) => k.position != null).map((k) => ({ keyword: k.keyword, position: k.position!, history: k.history ?? [] }))} />;
}
