import type { Metadata } from "next";
export const metadata: Metadata = { title: { default: "Mon compte", template: "%s · SKINCLEAN" }, robots: { index: false } };
export default function L({ children }: LayoutProps<"/compte">) { return children; }
