import { Suspense } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { SkinJournal } from "@/components/account/SkinJournal";

export default function Page() {
  return <Suspense><AccountShell><SkinJournal /></AccountShell></Suspense>;
}
