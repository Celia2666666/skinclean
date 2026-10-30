import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { SkinJournal } from "@/components/account/SkinJournal";

export const metadata: Metadata = { title: "Mon Skin Journal" };

export default function Page() {
  return <Suspense><AccountShell><SkinJournal /></AccountShell></Suspense>;
}
