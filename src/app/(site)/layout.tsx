import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { SearchOverlay } from "@/components/layout/SearchOverlay";
import { Toasts } from "@/components/layout/Toasts";
import { CookieBanner } from "@/components/layout/CookieBanner";
import { GlowAssistant } from "@/components/assistant/GlowAssistant";

/** Habillage du site e-commerce (toutes les pages publiques). */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#contenu" className="sr-only z-[100] rounded-full bg-forest px-4 py-2 text-ivory focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Aller au contenu</a>
      <AnnouncementBar />
      <Header />
      <main id="contenu">{children}</main>
      <Footer />
      <CartDrawer />
      <SearchOverlay />
      <Toasts />
      <CookieBanner />
      <GlowAssistant />
    </>
  );
}
