import type { Metadata } from "next";
import { CompareView } from "@/components/catalog/CompareView";

export const metadata: Metadata = {
  title: "Comparer des soins",
  description: "Compare jusqu'à 3 soins SKINCLEAN côte à côte : actifs, types de peau, prix, utilisation.",
};

export default function ComparePage() {
  return <CompareView />;
}
