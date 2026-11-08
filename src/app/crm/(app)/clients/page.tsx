import type { Metadata } from "next";
import { customersPage } from "@/lib/crm/pages";
import { CustomersView } from "@/components/crm/pages/CustomersView";

export const metadata: Metadata = { title: "Contacts" };

export default async function CustomersPage({ searchParams }: PageProps<"/crm/clients">) {
  return <CustomersView data={await customersPage(await searchParams)} />;
}
