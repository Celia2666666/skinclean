import type { Metadata } from "next";
import { productsData } from "@/lib/crm/pages";
import { PERIODS } from "@/lib/crm/analytics";
import { ProductsView } from "@/components/crm/pages/ProductsView";

export const metadata: Metadata = { title: "Produits & best-sellers" };

export default async function ProductsPage({ searchParams }: PageProps<"/crm/produits">) {
  const sp = await searchParams;
  return <ProductsView data={await productsData(typeof sp.p === "string" ? sp.p : undefined)} periods={PERIODS} />;
}
