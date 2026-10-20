import { Suspense } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { Profile } from "@/components/account/AccountPages";

export default function Page() {
  return <Suspense><AccountShell><Profile /></AccountShell></Suspense>;
}
