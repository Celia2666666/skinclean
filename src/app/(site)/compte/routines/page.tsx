import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { Routines } from "@/components/account/AccountPages";

export const metadata: Metadata = { title: "Mes routines" };

export default function Page() {
  return <Suspense><AccountShell><Routines /></AccountShell></Suspense>;
}
