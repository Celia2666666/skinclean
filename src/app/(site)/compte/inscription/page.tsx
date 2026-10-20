import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForms } from "@/components/account/AuthForms";

export const metadata: Metadata = { title: "Créer un compte", robots: { index: false } };
export default function Page() { return <Suspense><AuthForms mode="register" /></Suspense>; }
