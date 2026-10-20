import type { Metadata } from "next";
import { Suspense } from "react";
import { Results } from "@/components/diag/Results";

export const metadata: Metadata = { title: "Ma routine personnalisée", robots: { index: false } };

export default function Page() {
  return <Suspense><Results /></Suspense>;
}
