import type { Metadata } from "next";
import { Admin } from "@/components/account/Admin";

export const metadata: Metadata = { title: "Back-office", robots: { index: false, follow: false } };
export default function Page() { return <Admin />; }
