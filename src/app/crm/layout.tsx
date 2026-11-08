import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "CRM", template: "%s · CRM SKINCLEAN" },
  robots: { index: false, follow: false },
};

export default function CrmRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
