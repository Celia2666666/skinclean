import type { Metadata } from "next";
import { Suspense } from "react";
import { SkinDiag } from "@/components/diag/SkinDiag";

export const metadata: Metadata = { title: "Skin Diag — diagnostic de peau", description: "2 minutes pour découvrir ta routine SKINCLEAN idéale, matin et soir, adaptée à ta peau, ton temps et ton budget." };

export default function Page() {
  return <Suspense><SkinDiag /></Suspense>;
}
