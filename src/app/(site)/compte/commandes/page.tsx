import { Suspense } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { Orders } from "@/components/account/AccountPages";

export default function Page() {
  return <Suspense><AccountShell><Orders /></AccountShell></Suspense>;
}
