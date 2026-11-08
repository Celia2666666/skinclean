import type { Metadata } from "next";
import { supportData } from "@/lib/crm/pages";
import { SupportView } from "@/components/crm/pages/SupportView";

export const metadata: Metadata = { title: "Service client" };

export default async function SupportPage({ searchParams }: PageProps<"/crm/sav">) {
  return <SupportView data={await supportData(await searchParams)} />;
}
