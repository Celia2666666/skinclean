import type { Metadata } from "next";
import { requirePageUser } from "@/lib/hub/auth";
import { list } from "@/lib/hub/repo";
import { MessagesView } from "@/components/hub/pages/MessagesView";

export const metadata: Metadata = { title: "Messages & demandes" };

export default async function MessagesPage() {
  await requirePageUser();
  return <MessagesView tickets={list("tickets").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))} />;
}
