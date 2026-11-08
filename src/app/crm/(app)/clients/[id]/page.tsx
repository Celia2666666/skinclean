import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { customerPage } from "@/lib/crm/pages";
import { CustomerView } from "@/components/crm/pages/CustomerView";

export const metadata: Metadata = { title: "Fiche client" };

export default async function CustomerPage({ params }: PageProps<"/crm/clients/[id]">) {
  const data = await customerPage((await params).id);
  if (!data) notFound();
  return <CustomerView data={data} />;
}
