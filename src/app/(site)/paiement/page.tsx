import type { Metadata } from "next";
import { Suspense } from "react";
import { Checkout } from "@/components/checkout/Checkout";

export const metadata: Metadata = { title: "Paiement sécurisé", robots: { index: false } };
export default function Page() { return <Suspense><Checkout /></Suspense>; }
