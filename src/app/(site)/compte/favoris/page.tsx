import { Suspense } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { Favorites } from "@/components/account/AccountPages";

export default function Page() {
  return <Suspense><AccountShell><Favorites /></AccountShell></Suspense>;
}
