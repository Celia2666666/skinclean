import type { Metadata } from "next";
import { chatbotData } from "@/lib/crm/pages";
import { PERIODS } from "@/lib/crm/analytics";
import { ChatbotView } from "@/components/crm/pages/ChatbotView";

export const metadata: Metadata = { title: "Chatbot" };

export default async function ChatbotPage({ searchParams }: PageProps<"/crm/chatbot">) {
  const sp = await searchParams;
  return <ChatbotView data={await chatbotData(typeof sp.p === "string" ? sp.p : undefined)} periods={PERIODS.filter((p) => ["7j", "30j", "mois", "90j"].includes(p.id))} />;
}
