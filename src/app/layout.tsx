import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";

// Titres : grotesque droite et sobre (esprit Typology) · Texte : Inter, très lisible
const display = Inter_Tight({ variable: "--font-display-face", subsets: ["latin"], display: "swap", weight: ["400", "500", "600"] });
const body = Inter({ variable: "--font-body-face", subsets: ["latin"], display: "swap" });

const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: "SKINCLEAN — Your skin. Your glow.", template: "%s · SKINCLEAN" },
  description: "Skincare naturelle et efficace, routines personnalisées avec le Skin Diag, programme de fidélité SKINCLEAN Club. Cruelty-free & glow-friendly.",
  openGraph: { type: "website", locale: "fr_FR", siteName: "SKINCLEAN", images: ["/media/brand/logo-full.webp"] },
  icons: { icon: "/media/brand/logo-mark.png", apple: "/media/brand/logo-mark.png" },
};

export const viewport: Viewport = { themeColor: "#F4F3EF", width: "device-width", initialScale: 1 };

/**
 * Layout racine partagé : polices + styles.
 * Le site e-commerce vit dans app/(site) (header, footer, panier…), le Marketing Hub dans app/hub.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen overflow-x-clip">{children}</body>
    </html>
  );
}
