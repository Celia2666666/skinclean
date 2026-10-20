import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForms } from "@/components/account/AuthForms";

export const metadata: Metadata = { title: "Mot de passe oublié", robots: { index: false } };
export default function Page() { return <Suspense><AuthForms mode="forgot" /></Suspense>; }
