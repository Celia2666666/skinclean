import { Hero } from "@/components/home/Hero";
import { PromiseBand } from "@/components/home/PromiseBand";
import { QuickCircles } from "@/components/home/QuickCircles";
import { BeforeAfterSection, Bestsellers, NewsletterSection, Philosophy, RoutineCTA, SeasonalKits, ShopByCategory, ShopByConcern } from "@/components/home/Sections";
import { FeaturedCollection, HomeSlider, PromoBanner } from "@/components/home/HubBlocks";

export default function Home() {
  return (
    <>
      <Hero />
      <PromiseBand />
      <PromoBanner />
      <HomeSlider />
      <QuickCircles />
      <ShopByCategory />
      <Bestsellers />
      <FeaturedCollection />
      <ShopByConcern />
      <RoutineCTA />
      <BeforeAfterSection />
      <SeasonalKits />
      <Philosophy />
      <NewsletterSection />
    </>
  );
}
