import { Hero } from "@/components/home/Hero";
import { QuickCircles } from "@/components/home/QuickCircles";
import { BeforeAfterSection, Bestsellers, NewsletterSection, Philosophy, RoutineCTA, SeasonalKits, ShopByCategory, ShopByConcern } from "@/components/home/Sections";
import { FeaturedCollection, HomeSlider, PromoBanner } from "@/components/home/HubBlocks";

export default function Home() {
  return (
    <>
      <Hero />
      <PromoBanner />
      <HomeSlider />
      <QuickCircles />
      <ShopByCategory />
      <Bestsellers />
      <FeaturedCollection />
      <ShopByConcern />
      <Philosophy />
      <BeforeAfterSection />
      <SeasonalKits />
      <RoutineCTA />
      <NewsletterSection />
    </>
  );
}
