import { Suspense } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { Dashboard } from "@/components/account/AccountPages";

export default function Page() {
  return <Suspense><AccountShell><Dashboard /></AccountShell></Suspense>;
}
