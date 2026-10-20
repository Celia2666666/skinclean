import { Suspense } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { Routines } from "@/components/account/AccountPages";

export default function Page() {
  return <Suspense><AccountShell><Routines /></AccountShell></Suspense>;
}
