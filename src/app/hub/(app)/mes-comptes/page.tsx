import type { Metadata } from "next";
import { requirePageUser } from "@/lib/hub/auth";
import { list, settings } from "@/lib/hub/repo";
import { ymdhm } from "@/lib/hub/dates";
import { SandboxView } from "@/components/hub/pages/SandboxView";

export const metadata: Metadata = { title: "Mes comptes réseaux" };

export default async function SandboxPage() {
  await requirePageUser();
  const s = settings();
  const now = ymdhm(new Date());
  const queue = list("posts")
    .filter((p) => p.status === "programme" && !p.library && p.date > now && ["instagram", "story", "tiktok", "facebook", "pinterest"].includes(p.platform))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 12)
    .map((p) => ({ id: p.id, title: p.title, date: p.date, platform: p.platform }));
  return <SandboxView posts={list("sandbox").sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))} handle={s.sandbox?.handle ?? "skinclean"} enabled={!!s.sandbox?.enabled} queue={queue} />;
}
