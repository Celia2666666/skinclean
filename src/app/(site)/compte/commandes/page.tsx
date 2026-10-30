import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { Orders } from "@/components/account/AccountPages";

export const metadata: Metadata = { title: "Mes commandes" };

export default function Page() {
  return <Suspense><AccountShell><Orders /></AccountShell></Suspense>;
}
