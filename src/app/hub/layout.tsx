import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Marketing Hub", template: "%s · Marketing Hub SKINCLEAN" },
  robots: { index: false, follow: false },
};

export default function HubRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
