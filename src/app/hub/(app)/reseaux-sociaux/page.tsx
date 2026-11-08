import type { Metadata } from "next";
import { requirePageUser } from "@/lib/hub/auth";
import { list } from "@/lib/hub/repo";
import { refs } from "@/lib/hub/page-data";
import { connectors } from "@/lib/hub/connectors";
import { SocialView } from "@/components/hub/pages/SocialView";
import { todayYmd } from "@/lib/hub/dates";

export const metadata: Metadata = { title: "Réseaux sociaux" };

export default async function SocialPage() {
  await requirePageUser();
  const posts = list("posts");
  const t = todayYmd();
  return (
    <SocialView
      library={posts.filter((p) => p.library)}
      upcoming={posts.filter((p) => !p.library && p.date >= t && ["instagram", "story", "tiktok", "facebook", "pinterest"].includes(p.platform)).sort((a, b) => a.date.localeCompare(b.date))}
      published={posts.filter((p) => !p.library && ["publie", "publie_manuel", "publie_test"].includes(p.status))}
      refs={refs()}
      connections={connectors().filter((c) => c.scope === "Réseaux sociaux").map((c) => ({ id: c.id, name: c.name, connected: c.connected, capability: c.capability, limits: c.limits ?? "" }))}
    />
  );
}
