import type { Metadata } from "next";
import { supportData } from "@/lib/crm/pages";
import { MessagesView } from "@/components/crm/pages/MessagesView";

export const metadata: Metadata = { title: "Messages & contact" };

export default async function MessagesPage({ searchParams }: PageProps<"/crm/messages">) {
  return <MessagesView data={await supportData({ ...(await searchParams), inbox: "contact" })} />;
}
