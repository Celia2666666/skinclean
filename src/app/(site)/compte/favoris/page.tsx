import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { Favorites } from "@/components/account/AccountPages";

export const metadata: Metadata = { title: "Mes favoris" };

export default function Page() {
  return <Suspense><AccountShell><Favorites /></AccountShell></Suspense>;
}
