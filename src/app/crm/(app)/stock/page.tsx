import type { Metadata } from "next";
import { stockData } from "@/lib/crm/pages";
import { StockView } from "@/components/crm/pages/StockView";

export const metadata: Metadata = { title: "Stock & réassort" };

export default async function StockPage() {
  return <StockView data={await stockData()} />;
}
