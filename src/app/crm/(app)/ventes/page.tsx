import type { Metadata } from "next";
import { ordersPage } from "@/lib/crm/pages";
import { PERIODS } from "@/lib/crm/analytics";
import { OrdersView } from "@/components/crm/pages/OrdersView";

export const metadata: Metadata = { title: "Commandes" };

export default async function OrdersPage({ searchParams }: PageProps<"/crm/ventes">) {
  return <OrdersView data={await ordersPage(await searchParams)} periods={PERIODS} />;
}
