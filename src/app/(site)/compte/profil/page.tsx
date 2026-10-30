import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { Profile } from "@/components/account/AccountPages";

export const metadata: Metadata = { title: "Mon profil" };

export default function Page() {
  return <Suspense><AccountShell><Profile /></AccountShell></Suspense>;
}
