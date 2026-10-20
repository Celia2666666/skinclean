import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForms } from "@/components/account/AuthForms";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };
export default function Page() { return <Suspense><AuthForms mode="login" /></Suspense>; }
