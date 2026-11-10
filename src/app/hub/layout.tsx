import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Admin SKINCLEAN", template: "%s · Admin SKINCLEAN" },
  robots: { index: false, follow: false },
};

export default function HubRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
