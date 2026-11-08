import type { Metadata } from "next";
import { requirePageUser } from "@/lib/hub/auth";
import { AssistantView } from "@/components/hub/pages/AssistantView";

export const metadata: Metadata = { title: "Assistant marketing IA" };

export default async function AssistantPage({ searchParams }: PageProps<"/hub/assistant">) {
  await requirePageUser();
  const sp = await searchParams;
  return <AssistantView ai={!!process.env.ANTHROPIC_API_KEY} initial={typeof sp.q === "string" ? sp.q : undefined} />;
}
