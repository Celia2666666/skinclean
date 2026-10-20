import type { Metadata } from "next";
export const metadata: Metadata = { title: "Mon compte", robots: { index: false } };
export default function L({ children }: LayoutProps<"/compte">) { return children; }
