import type { Metadata } from "next";
import { cartsData } from "@/lib/crm/pages";
import { PERIODS } from "@/lib/crm/analytics";
import { CartsView } from "@/components/crm/pages/CartsView";

export const metadata: Metadata = { title: "Paniers abandonnés" };

export default async function CartsPage({ searchParams }: PageProps<"/crm/paniers">) {
  return <CartsView data={await cartsData(await searchParams)} periods={PERIODS.filter((p) => ["7j", "30j", "mois", "90j"].includes(p.id))} />;
}
